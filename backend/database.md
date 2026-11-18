# Backend & Database SULAP (Supabase)

Dokumen kerja untuk agen backend/database dan manusia. Mengikat cara membangun backend SULAP di Supabase, dan menjadi **prompt siap tempel**.

| Atribut | Nilai |
|---|---|
| Versi | 1.1 |
| Tanggal | 18 November 2026 |
| Peran pemilik | Backend Engineer Supabase |
| Target | PostgreSQL 17 di Supabase |
| Acuan utama | `prd.md`, `sulap.dbml`, `docs/supabase.md`, `docs/api-contract.md`, `design.md` |
| Keluaran wajib | (1) Satu file SQL idempoten yang bisa dijalankan sekali di Supabase SQL Editor pada project baru. (2) Dokumen API Contract final. |

---

## 1. Prompt peran (tempel ini)

```text
Anda Backend Engineer Supabase untuk SULAP (Suka Lapor), aplikasi pelaporan warga RT.

Tugas: buat backend di Supabase memakai acuan prd.md, sulap.dbml, docs/supabase.md, dan docs/api-contract.md. Gunakan nama tabel, kolom, enum, view, dan fungsi PERSIS seperti dokumen. Jangan membuat frontend.

Keluaran:
1. Satu file SQL (`supabase/init.sql`) yang dapat dijalankan SEKALI di Supabase SQL Editor pada project baru, berisi: extension, enum, tabel, constraint, index, RLS + policy, view, fungsi RPC, trigger, GRANT/hak akses, dan seed data. Beri komentar singkat berbahasa Indonesia di setiap blok.
2. Dokumen `docs/api-contract.md` yang sudah diselaraskan dengan SQL final (nama field, kode error, fungsi DB).

Urutan file SQL wajib:
extensions -> enums -> tables -> constraints/indexes -> helper functions -> RLS enable + policies -> views -> RPC -> triggers -> grants -> seed.

Aturan keras:
- Idempoten: `if not exists`, `create or replace`, `drop policy if exists` sebelum `create policy`, `on conflict do nothing` pada seed.
- RLS aktif di SEMUA tabel domain. Tidak ada policy `using (true)` pada tabel domain.
- Selain RLS, WAJIB beri GRANT ke role `authenticated`: USAGE schema public, SELECT pada semua tabel/view yang boleh dibaca, dan EXECUTE pada semua fungsi RPC yang boleh dipanggil. Tanpa GRANT, frontend akan 403 walau RLS benar.
- Role `authenticated` TIDAK diberi INSERT/UPDATE/DELETE langsung pada tabel domain, kecuali pengecualian tertulis (profiles kolom sendiri). Semua tulis lewat RPC SECURITY DEFINER.
- Setiap fungsi definer: `set search_path = public, pg_temp`, cek `auth.uid()`, cek peran/RT di dalam fungsi, dan TIDAK menerima `rt_id` dari klien pada operasi tulis.
- Nomor laporan atomik dari `rts.report_seq` dengan `update ... returning` (row lock).
- `report_status_history` dan `audit_logs` append-only lewat trigger yang menolak UPDATE/DELETE untuk semua peran termasuk service_role.
- Jangan memakai service role di klien. Jangan membuat bucket publik. Jangan menyimpan rahasia di tabel.
- Seed hanya data konfigurasi minimum (RT demo, kategori, status_definitions, platform_settings). Jangan mengarang warga, laporan, nomor, atau testimoni. Jika ada CSV sumber resmi, impor hanya kolom yang ada di CSV dan jangan menambah orang fiktif.

Sebelum menulis SQL:
1. Ringkas tabel, relasi, enum, dan fungsi yang akan dibuat.
2. Daftar policy per tabel (siapa baca, siapa tulis, lewat apa).
3. Daftar GRANT per objek.
4. Daftar RPC beserta signature dan kode error.

Setelah menulis:
- Jalankan `supabase db lint` (atau setara) dan pgTAP isolasi antar-RT.
- Laporkan bukti: perintah, hasil, objek yang dibuat, dan yang belum.

Larangan: DROP/TRUNCATE data produksi, mematikan RLS saat debugging, mengedit migrasi yang sudah diterapkan, fungsi definer tanpa search_path, mengembalikan 403 untuk objek lintas RT (pakai 404), mencatat PII di log.
```

---

## 2. Ruang lingkup backend

Backend terdiri dari tiga lapisan:

1. **Database (Supabase Postgres):** skema, constraint, index, RLS, view, RPC, trigger, grant, seed.
2. **API (Next.js Route Handlers):** kontrak HTTP `/api/v1`, validasi Zod, otorisasi, idempotensi, rate limit, signed URL. Lihat `docs/api-contract.md`.
3. **Storage (privat):** bucket `report-photos`, akses hanya lewat signed URL setelah cek akses laporan.

Browser **tidak** memanggil Supabase langsung untuk operasi tulis. Tidak ada anon key di klien.

---

## 3. Skema (sumber: `sulap.dbml`)

### 3.1 Enum
`member_role`, `membership_status`, `join_method`, `report_status_group`, `location_source`, `attachment_kind`, `moderation_status`, `notification_type`, `assignment_status`.

### 3.2 Tabel domain
`profiles`, `rts`, `rt_invite_codes`, `memberships`, `categories`, `status_definitions`, `reports`, `report_status_history`, `attachments`, `inspections`, `comments`, `assignments`, `notifications`, `audit_logs`, `platform_settings`, `idempotency_keys`, `rate_limit_counters`.

### 3.3 View
`v_reports_feed`, `v_report_timeline`, `v_rt_activity` — semua `security_invoker = true`.

### 3.4 Relasi lintas skema
`profiles.id` → `auth.users.id` (FK `on delete cascade`).

### 3.5 Aturan skema yang tidak boleh dilanggar
- Semua waktu `timestamptz` (UTC).
- `reports.public_no` unik, format `SULAP-<prefix>-<seq 4 digit>`.
- `current_status_group` denormalisasi dari `status_definitions.group`, dijaga trigger.
- `memberships` unik parsial `(user_id, rt_id) where status in ('pending','active')`.
- `status_definitions` unik `(rt_id, group)`.
- `categories` unik `(rt_id, slug)`.
- `attachments.byte_size` 1..5242880, `mime_type` hanya jpeg/png/webp.
- `notifications` unik `(recipient_id, dedupe_key)`.
- `reports` check koordinat dan `length(trim(title)) > 0`.

---

## 4. RLS (lapisan 1)

### 4.1 Helper (SECURITY DEFINER, stable)
```sql
create or replace function public.is_developer() returns boolean ...
create or replace function public.is_rt_member(p_rt_id uuid) returns boolean ...
create or replace function public.is_rt_admin(p_rt_id uuid) returns boolean ...
```
Semua `set search_path = public, pg_temp`, membaca `memberships` dengan `auth.uid()`.

### 4.2 Matriks policy baca
| Tabel | Warga | Admin RT | Developer |
|---|---|---|---|
| profiles | diri + rekan RT aktif | anggota & pemohon RT-nya | semua |
| rts | RT aktifnya | RT-nya | semua |
| memberships | miliknya | RT-nya | semua |
| categories | RT-nya | RT-nya | semua |
| status_definitions | RT-nya | RT-nya | semua |
| reports | RT-nya, `deleted_at is null` | RT-nya termasuk soft deleted | semua |
| report_status_history | laporan yang boleh dibaca | RT-nya | semua |
| attachments | laporan yang boleh dibaca | RT-nya | semua |
| inspections | laporan yang boleh dibaca | RT-nya | semua |
| comments | `visible` pada laporan yang boleh dibaca | RT-nya | semua |
| notifications | `recipient_id = auth.uid()` | miliknya | miliknya |
| audit_logs | tidak | lewat `v_rt_activity` | semua |
| platform_settings | tidak | tidak | semua |

**Tidak ada policy INSERT/UPDATE/DELETE** untuk `authenticated` pada tabel domain. Semua tulis lewat RPC.

### 4.3 Policy minimum yang wajib ada
- `reports_select_member`, `reports_select_admin`, `reports_select_developer`.
- `notifications_select_own`.
- `audit_select_developer`.
- `profiles_select_self`, `profiles_select_comember`, `profiles_select_admin_applicant`.
- Padanan select untuk setiap tabel lain sesuai matriks.

### 4.4 Larangan RLS
- `alter table ... disable row level security` (termasuk saat debugging).
- `using (true)` pada tabel domain.
- Policy untuk role `anon` pada tabel domain.
- Mengandalkan UUID sulit ditebak sebagai kontrol akses.

---

## 5. GRANT (lapisan 2) — WAJIB, jangan dilewat

RLS saja tidak cukup. PostgreSQL butuh privilege. Tanpa blok ini, `SELECT`/RPC dari sesi login akan gagal (403/permission denied).

```sql
-- Skema
grant usage on schema public to authenticated;

-- Baca tabel domain
grant select on public.profiles            to authenticated;
grant select on public.rts                 to authenticated;
grant select on public.rt_invite_codes     to authenticated;
grant select on public.memberships         to authenticated;
grant select on public.categories          to authenticated;
grant select on public.status_definitions  to authenticated;
grant select on public.reports             to authenticated;
grant select on public.report_status_history to authenticated;
grant select on public.attachments         to authenticated;
grant select on public.inspections         to authenticated;
grant select on public.comments            to authenticated;
grant select on public.assignments         to authenticated;
grant select on public.notifications       to authenticated;
grant select on public.audit_logs          to authenticated;
grant select on public.platform_settings   to authenticated;

-- Baca view
grant select on public.v_reports_feed     to authenticated;
grant select on public.v_report_timeline  to authenticated;
grant select on public.v_rt_activity      to authenticated;

-- Pengecualian tulis (hanya kolom aman pada baris sendiri; dijaga RLS WITH CHECK)
grant update (display_name, avatar_path, locale) on public.profiles to authenticated;

-- Jalankan fungsi
grant execute on function public.is_developer()            to authenticated;
grant execute on function public.is_rt_member(uuid)         to authenticated;
grant execute on function public.is_rt_admin(uuid)          to authenticated;
grant execute on function public.create_report(...)         to authenticated;
grant execute on function public.transition_report_status(...) to authenticated;
grant execute on function public.create_inspection(...)     to authenticated;
grant execute on function public.reopen_report(...)         to authenticated;
grant execute on function public.join_rt(...)               to authenticated;
grant execute on function public.decide_membership(...)     to authenticated;
grant execute on function public.create_invite_code(...)    to authenticated;
grant execute on function public.revoke_invite_code(...)    to authenticated;
grant execute on function public.soft_delete_report(...)    to authenticated;
grant execute on function public.restore_report(...)        to authenticated;
grant execute on function public.mark_notifications_read(...) to authenticated;
grant execute on function public.create_rt(...)             to authenticated;
```

Catatan:
- `GRANT EXECUTE` boleh luas; **otorisasi tetap di dalam fungsi** (`auth.uid()` + peran). Jangan mengandalkan grant untuk otorisasi.
- `public` schema default privilege: pastikan `revoke all on ... from anon` untuk tabel domain.
- `idempotency_keys` dan `rate_limit_counters` tidak diberi grant ke `authenticated`; hanya service_role/RPC internal.
- Verifikasi: login sebagai warga → `select` masing-masing tabel/view berhasil dan hanya baris RT-nya; panggil RPC → tidak `permission denied`.

---

## 6. RPC (SECURITY DEFINER)

Signature diselaraskan dengan `docs/api-contract.md` §7:

| Fungsi | Peran | Tanggung jawab |
|---|---|---|
| `create_report(p_category_id uuid, p_title text, p_description text, p_location jsonb, p_upload_ids uuid[])` | Anggota | nomor atomik, laporan, riwayat awal, lampiran, notifikasi admin |
| `transition_report_status(p_report_id uuid, p_to_status_id uuid, p_note text, p_resolution_summary text, p_closure_reason text, p_expected_version int)` | Admin RT | validasi transisi+catatan+versi, riwayat, notifikasi, audit |
| `create_inspection(p_report_id uuid, p_findings text, p_inspected_at timestamptz, p_upload_ids uuid[])` | Admin RT | inspeksi + lampiran |
| `reopen_report(p_report_id uuid, p_reason text, p_upload_ids uuid[])` | Pelapor | riwayat `reopened`, notifikasi admin |
| `join_rt(p_method join_method, p_code text, p_rt_slug text, p_note text)` | Terautentikasi | kode/permintaan, membership, audit |
| `decide_membership(p_membership_id uuid, p_action text, p_role member_role, p_note text)` | Admin RT | approve/reject/suspend/reinstate/remove, cegah `LAST_ADMIN` |
| `create_invite_code(p_max_uses smallint, p_expires_at timestamptz, p_label text)` | Admin RT | hash kode, kembalikan kode sekali |
| `revoke_invite_code(p_id uuid)` | Admin RT | revoke |
| `soft_delete_report(p_report_id uuid, p_reason text)` | Developer | soft delete + audit + notifikasi |
| `restore_report(p_report_id uuid, p_reason text)` | Developer | restore + audit |
| `mark_notifications_read(p_ids uuid[], p_all boolean)` | Penerima | tandai dibaca |
| `create_rt(p_name text, p_slug text, p_report_prefix text, p_admin_email text)` | Developer | RT + admin pertama |

Aturan implementasi:
1. Cek sesi + peran **di dalam fungsi**.
2. `select ... for update` pada `rts` saat menaikkan `report_seq`.
3. Satu transaksi; kegagalan notifikasi tidak membatalkan operasi utama kecuali status yang butuh konsistensi.
4. Jangan kembalikan `reporter_id` pada nilai balik untuk warga.
5. `raise exception` dengan kode aplikasi yang dipetakan ke `docs/api-contract.md` §2.3 (`VALIDATION_FAILED`, `STATUS_NOTE_REQUIRED`, `CONFLICT_VERSION`, `LAST_ADMIN`, `CATEGORY_INACTIVE`, `INVITE_INVALID`, `INVITE_EXPIRED`, `MEMBERSHIP_EXISTS`, `NOT_FOUND`).
6. Nomor laporan:
```sql
update public.rts
set report_seq = report_seq + 1
where id = v_rt_id
returning report_prefix, report_seq into v_prefix, v_seq;
v_public_no := 'SULAP-' || v_prefix || '-' || lpad(v_seq::text, 4, '0');
```

---

## 7. Trigger wajib
`set_updated_at`, `sync_report_status_group`, `validate_status_transition` (resolved butuh `resolution_summary`, closed butuh `closure_reason`), `guard_history_mutation`, `guard_audit_mutation`, `notify_admin_new_report`, `notify_reporter_status`, `notify_membership_request`, `audit_membership_change`, `audit_category_change`, `audit_status_definition_change`.

Trigger append-only menolak UPDATE/DELETE untuk **semua peran**, tanpa pengecualian service_role.

---

## 8. Seed data (tanpa mengarang orang)

Aturan:
- Seed hanya konfigurasi minimum dan **idempoten** (`on conflict do nothing`).
- Jangan membuat warga, laporan, komentar, atau testimoni fiktif.
- Jika ada CSV resmi (mis. `data_karyawan.csv` pada proyek lain): impor **hanya** kolom yang ada, jangan menambah orang/atribut baru, dan jangan memasukkannya ke repo jika berisi PII.

Seed minimum SULAP:
1. `rts`: satu RT demo `RT 01 Melati`, `slug=rt-01-melati`, `report_prefix=RT01`, `report_seq=0`.
2. `categories`: Saluran air, Lampu jalan, Sampah, Jalan rusak, Fasilitas umum (urut, aktif).
3. `status_definitions`: 7 kelompok internal dengan label awal §10.1 PRD.
4. `platform_settings`: `retention.notification_days=180`, `upload.max_photos=5`, `upload.max_bytes=5242880`.
5. Tidak ada `profiles`/`memberships` palsu. Admin pertama dibuat lewat `create_rt` setelah user Google login nyata.

---

## 9. Storage
Bucket `report-photos` privat. Path: `inbox/{userId}/...`, `rt/{rtId}/reports/{reportId}/...`, `rt/{rtId}/inspections/{reportId}/...`, `avatars/{userId}.webp`. Tidak ada policy `anon`/`authenticated`; hanya service role. Signed URL TTL 600 detik. 5 MB/objek, MIME jpeg/png/webp, EXIF dibuang, thumbnail 320px.

---

## 10. API Contract (keluaran kedua)

Frontend memakai `docs/api-contract.md` sebagai acuan. Backend wajib memastikan:

1. Semua endpoint `/api/v1` punya: metode, path, peran, input (Zod), output, kode error, sumber data (tabel/RPC/view).
2. Respons sukses `{ data, meta }`; gagal `{ error: { code, message, fields?, requestId } }`.
3. `X-Request-Id` di setiap respons; tercatat di `audit_logs.request_id` untuk aksi sensitif.
4. `NOT_FOUND` untuk objek lintas RT, bukan `403` detail.
5. `Idempotency-Key` wajib pada `POST /reports`, `POST /reports/{publicNo}/inspections`, `POST /uploads`.
6. Rate limit per `docs/api-contract.md` §5, respons `429` + `Retry-After`.
7. Pagination cursor (bukan offset), `limit` default 20 maks 50.
8. Field respons tidak pernah memuat email, `reporter_id` untuk warga lain, atau koordinat presisi untuk warga lain (3 desimal).
9. Pemetaan API → fungsi DB tertulis dan cocok dengan nama fungsi final di SQL.
10. Setiap perubahan kontrak memperbarui dokumen + skema Zod + tes kontrak dalam commit yang sama.

Format tabel per endpoint (wajib):
```text
### <METHOD> <path>
Peran:
Prioritas:
Auth:
Idempotency:
Input:
Output:
Error:
Sumber data:
Catatan keamanan:
```

---

## 11. Verifikasi sebelum menyerahkan
- [ ] SQL berjalan sekali tanpa error pada project Supabase baru (Postgres 17).
- [ ] SQL idempoten: jalankan dua kali pada project bersih → tidak error.
- [ ] Semua tabel domain RLS aktif.
- [ ] `authenticated` punya USAGE schema + SELECT tabel/view + EXECUTE fungsi (uji dengan sesi login nyata).
- [ ] `authenticated` tidak bisa INSERT/UPDATE/DELETE tabel domain (uji langsung → gagal).
- [ ] pgTAP: isolasi antar-RT untuk reports, attachments, comments, notifications.
- [ ] `create_report` diuji 20 permintaan paralel → nomor unik.
- [ ] Trigger append-only menolak UPDATE/DELETE.
- [ ] Bucket privat; signed URL kedaluwarsa 600 detik; EXIF hilang.
- [ ] `supabase db lint` bersih.
- [ ] Seed idempoten dan tidak memuat orang/laporan fiktif.
- [ ] `docs/api-contract.md` cocok dengan signature/nama fungsi final.

---

## 12. Berhenti dan bertanya bila
1. Perlu mengubah keputusan bisnis PRD §17.
2. Perlu migrasi destruktif / menyentuh data produksi.
3. Perlu menambah penyedia pihak ketiga baru yang menyimpan data warga.
4. Perlu menampilkan identitas pelapor/koordinat presisi ke warga lain tanpa keputusan pemilik produk.
5. Perlu membuat aset/data yang belum ada sumbernya.
6. Dokumen acuan saling bertentangan (mis. `sulap.dbml` vs `docs/api-contract.md`).
7. Tidak ada cara menjalankan/menguji perubahan.

Serahkan: temuan, dampak, opsi, rekomendasi, kebutuhan dari pemilik produk.

---

## 13. Larangan operasional (ringkas)
RLS off, policy `using(true)`, service role di klien, SQL manual di produksi tanpa migrasi, dump produksi tanpa anonymisasi, PII di path/log, bucket publik, admin RT menghapus laporan (termasuk lewat RPC baru), fungsi definer tanpa `search_path`, grant tulis tabel domain ke `authenticated`, mengedit migrasi yang sudah diterapkan, mengarang seed orang/laporan.