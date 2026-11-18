# Supabase: arsitektur, keamanan, dan operasi

Dokumen ini mengikat cara SULAP memakai Supabase. PRD mengatur perilaku; `sulap.dbml` mengatur bentuk data; `docs/api-contract.md` mengatur kontrak HTTP.

| Atribut | Nilai |
|---|---|
| Layanan | Supabase (Postgres, Auth, Storage) |
| Region | Singapura (`ap-southeast-1`) untuk pilot Indonesia |
| Plan pilot | Pro (backup harian, tanpa pause proyek) |
| Versi Postgres | 17 |
| Runtime aplikasi | Next.js 15 di Vercel, Node.js 22 LTS |
| Versi dokumen | 1.0 |

## 1. Prinsip

1. Browser tidak pernah memegang kunci Supabase, baik anon maupun service role.
2. Semua akses data melewati Route Handler Next.js. Handler memakai sesi pengguna dan memeriksa peran sebelum menyentuh database.
3. RLS aktif di semua tabel domain. RLS bukan satu-satunya kontrol; ia lapisan kedua setelah otorisasi aplikasi.
4. Operasi tulis domain hanya melalui fungsi `SECURITY DEFINER` atau server dengan service role setelah pemeriksaan eksplisit. Peran `authenticated` tidak memiliki `INSERT`, `UPDATE`, atau `DELETE` langsung pada tabel domain.
5. Storage bersifat privat. Semua URL yang diberikan ke browser adalah signed URL berumur 600 detik.
6. Rahasia tidak pernah masuk database, repositori, log, atau dokumen.

## 2. Topologi

```text
Browser
  -> Vercel: Next.js App Router
       -> Supabase Auth (OAuth Google, PKCE, cookie session)
       -> Postgres (RPC + view, RLS aktif)
       -> Storage privat (service role, signed URL)
       -> Resend? tidak dipakai pada MVP
  <- HTML, JSON, signed URL
```

Tidak ada Realtime pada MVP. Notifikasi memakai polling 30 detik saat tab aktif dan refetch saat fokus. Keputusan ini mengurangi kompleksitas dan biaya. Realtime dapat ditambahkan pada P1 tanpa mengubah tabel.

## 3. Konfigurasi Auth

| Pengaturan | Nilai |
|---|---|
| Provider | Google OAuth |
| Flow | PKCE |
| Konfirmasi email | Tidak relevan untuk Google |
| Site URL | `https://sulap.example.id` |
| Redirect allow list | `https://sulap.example.id/auth/callback`, `http://localhost:3000/auth/callback` |
| JWT expiry | 3600 detik |
| Refresh token rotation | Aktif |
| Refresh token reuse interval | 10 detik |
| Session cookie | HttpOnly, Secure, SameSite=Lax, Path=/ |
| Logout | Server menghapus cookie dan memanggil `auth.signOut()` |

Aturan tambahan:

- Login Google hanya membuktikan identitas akun, bukan keanggotaan RT. Keanggotaan tetap diperiksa dari `memberships`.
- Callback menukar `code` menjadi sesi di server. Tidak ada token di URL setelah callback.
- Akun yang `suspended` atau `left` tidak mendapatkan `activeRt`.
- Percobaan akses ke RT yang bukan miliknya menghasilkan `404`, bukan `403`, agar keberadaan data tidak bocor.

## 4. Environment

| Variabel | Lingkup | Keterangan |
|---|---|---|
| `SUPABASE_URL` | Server | URL proyek |
| `SUPABASE_ANON_KEY` | Server | Untuk operasi atas nama pengguna |
| `SUPABASE_SERVICE_ROLE_KEY` | Server, rahasia | Hanya modul `server-only` |
| `NEXT_PUBLIC_APP_URL` | Publik | URL aplikasi, tanpa rahasia |
| `GOOGLE_CLIENT_ID` | Server | Dikelola di dashboard Supabase |
| `GOOGLE_CLIENT_SECRET` | Server | Hanya di dashboard Supabase, bukan env Vercel bila tidak diperlukan |
| `SENTRY_DSN` | Server dan klien | Tanpa PII |
| `MAP_TILES_KEY` | Server atau publik terbatas | Bila memakai penyedia tile berbayar |

Larangan:

- Tidak ada `NEXT_PUBLIC_SUPABASE_ANON_KEY` atau `NEXT_PUBLIC_SUPABASE_URL` pada MVP karena browser tidak memanggil Supabase.
- Service role key tidak boleh diimpor ke komponen klien, Edge middleware, atau file yang dapat dibundel ke browser.
- Kunci yang pernah masuk log atau commit wajib dirotasi.

## 5. Storage

Bucket: `report-photos`, privat.

Struktur path:

```text
inbox/{userId}/{uploadId}.webp
rt/{rtId}/reports/{reportId}/{attachmentId}.webp
rt/{rtId}/inspections/{reportId}/{attachmentId}.webp
avatars/{userId}.webp
```

Aturan:

1. Unggah ke `inbox/` dilakukan Route Handler dengan service role setelah validasi tipe, ukuran, dan pemrosesan `sharp`.
2. `sharp` melakukan re-encode ke WebP, membatasi sisi maksimum 2000 px, dan membuang EXIF.
3. Saat laporan dibuat, objek dipindah ke path final. Bila transaksi database gagal, objek di inbox menjadi yatim dan dibersihkan job harian.
4. Tidak ada policy `anon` atau `authenticated` pada bucket. Hanya service role yang membaca dan menulis.
5. Signed URL dibuat setelah handler memeriksa akses laporan induk. TTL 600 detik.
6. Thumbnail 320 px dibuat saat unggah dan disimpan di `.../thumb.webp`.
7. Batas bucket: 5 MB per objek; MIME `image/jpeg`, `image/png`, `image/webp`.
8. Avatar maksimum 2 MB dan dipotong persegi 256 px.

## 6. RLS dan hak akses

### 6.1 Helper function

```sql
create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and role = 'developer'
      and status = 'active'
  );
$$;

create or replace function public.is_rt_member(p_rt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and rt_id = p_rt_id
      and status = 'active'
  );
$$;

create or replace function public.is_rt_admin(p_rt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and rt_id = p_rt_id
      and role = 'rt_admin'
      and status = 'active'
  );
$$;
```

Ketiga fungsi hanya membaca `memberships` dan tidak menerima `rt_id` dari klien pada operasi tulis.

### 6.2 Matriks policy baca

| Tabel | Warga | Admin RT | Developer |
|---|---|---|---|
| `profiles` | Diri sendiri dan rekan RT aktif | Semua anggota dan pemohon RT-nya | Semua |
| `rts` | RT aktifnya | RT-nya | Semua |
| `memberships` | Miliknya | RT-nya | Semua |
| `categories` | RT-nya | RT-nya | Semua |
| `status_definitions` | RT-nya | RT-nya | Semua |
| `reports` | RT-nya, `deleted_at is null` | RT-nya, termasuk soft deleted | Semua |
| `report_status_history` | Laporan yang dapat dibaca | RT-nya | Semua |
| `attachments` | Laporan yang dapat dibaca | RT-nya | Semua |
| `inspections` | Laporan yang dapat dibaca | RT-nya | Semua |
| `comments` | `visible` pada laporan yang dapat dibaca | RT-nya | Semua |
| `notifications` | Miliknya | Miliknya | Miliknya |
| `audit_logs` | Tidak | Lewat `v_rt_activity` | Semua |
| `platform_settings` | Tidak | Tidak | Semua |

### 6.3 Contoh policy inti

```sql
alter table public.reports enable row level security;

create policy reports_select_member
on public.reports for select
to authenticated
using (
  deleted_at is null
  and public.is_rt_member(rt_id)
);

create policy reports_select_admin
on public.reports for select
to authenticated
using (public.is_rt_admin(rt_id));

create policy reports_select_developer
on public.reports for select
to authenticated
using (public.is_developer());
```

```sql
alter table public.notifications enable row level security;

create policy notifications_select_own
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());
```

```sql
alter table public.audit_logs enable row level security;

create policy audit_select_developer
on public.audit_logs for select
to authenticated
using (public.is_developer());
```

```sql
alter table public.profiles enable row level security;

create policy profiles_select_self
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy profiles_select_comember
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.memberships me
    join public.memberships other on other.rt_id = me.rt_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and other.user_id = profiles.id
      and other.status = 'active'
  )
);

create policy profiles_select_admin_applicant
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.user_id = profiles.id
      and m.status = 'pending'
      and public.is_rt_admin(m.rt_id)
  )
);
```

### 6.4 Pencabutan hak tulis langsung

```sql
revoke insert, update, delete on public.reports from authenticated;
revoke insert, update, delete on public.report_status_history from authenticated;
revoke insert, update, delete on public.attachments from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
revoke insert, update, delete on public.memberships from authenticated;
revoke insert, update, delete on public.categories from authenticated;
revoke insert, update, delete on public.status_definitions from authenticated;
revoke insert, update, delete on public.notifications from authenticated;

grant select on public.reports to authenticated;
grant select on public.report_status_history to authenticated;
grant select on public.attachments to authenticated;
```

Pengecualian yang diizinkan:

- `profiles`: `UPDATE (display_name, avatar_path, locale)` hanya untuk baris sendiri.
- `notifications`: `UPDATE (read_at)` hanya lewat RPC `mark_notifications_read`.
- `memberships`: tidak ada update langsung. Semua lewat RPC.

Verifikasi wajib: `supabase db lint` dan pgTAP untuk setiap tabel, termasuk percobaan `UPDATE` langsung yang harus gagal.

## 7. Fungsi RPC

Semua fungsi di bawah memakai `security definer`, `set search_path = public, pg_temp`, dan memeriksa `auth.uid()` di awal. Fungsi tidak menerima `rt_id` dari klien.

| Fungsi | Peran | Tanggung jawab |
|---|---|---|
| `create_report` | Anggota | Membuat nomor publik atomik, laporan, riwayat awal, lampiran, notifikasi admin |
| `transition_report_status` | Admin RT | Validasi transisi, catatan wajib, versi, riwayat, notifikasi, audit |
| `create_inspection` | Admin RT | Inspeksi dan lampiran inspeksi |
| `reopen_report` | Pelapor | Riwayat `reopened`, notifikasi admin |
| `join_rt` | Terautentikasi | Validasi kode atau permintaan, membership, audit |
| `decide_membership` | Admin RT | Setujui, tolak, suspend, reinstate, remove, cegah admin terakhir hilang |
| `create_invite_code` | Admin RT | Membuat kode, menyimpan hash, mengembalikan kode sekali |
| `revoke_invite_code` | Admin RT | Mencabut kode |
| `soft_delete_report` | Developer | Soft delete, alasan wajib, audit, notifikasi |
| `restore_report` | Developer | Restore, alasan wajib, audit |
| `mark_notifications_read` | Penerima | Menandai satu atau semua notifikasi |
| `create_rt` | Developer | Membuat RT dan menunjuk admin pertama |

Aturan implementasi fungsi:

1. Periksa sesi dan peran di dalam fungsi, bukan hanya di Route Handler.
2. Gunakan `select ... for update` pada `rts` saat menaikkan `report_seq`.
3. Semua penulisan dalam satu transaksi. Jika notifikasi gagal, transaksi utama tetap berhasil dan kegagalan dicatat, kecuali untuk status yang membutuhkan konsistensi.
4. Jangan mengekspos `reporter_id` pada nilai balik yang diterima warga.
5. Gunakan `raise exception` dengan kode aplikasi yang dipetakan ke kode error kontrak API.

Contoh nomor laporan:

```sql
update public.rts
set report_seq = report_seq + 1
where id = p_rt_id
returning report_prefix, report_seq
into v_prefix, v_seq;

v_public_no := 'SULAP-' || v_prefix || '-' || lpad(v_seq::text, 4, '0');
```

## 8. Trigger wajib

| Trigger | Tabel | Fungsi |
|---|---|---|
| `set_updated_at` | Semua tabel dengan `updated_at` | Mengisi waktu perubahan |
| `sync_report_status_group` | `reports` | Menyalin `status_definitions.group` ke `current_status_group` |
| `validate_status_transition` | `reports` | Menolak `resolved` tanpa `resolution_summary`, `closed` tanpa `closure_reason` |
| `guard_history_mutation` | `report_status_history` | Menolak `UPDATE` dan `DELETE` |
| `guard_audit_mutation` | `audit_logs` | Menolak `UPDATE` dan `DELETE` untuk semua peran |
| `notify_admin_new_report` | `reports` | Membuat notifikasi untuk admin RT |
| `notify_reporter_status` | `report_status_history` | Membuat notifikasi pelapor |
| `notify_membership_request` | `memberships` | Memberi tahu admin saat ada permohonan |
| `audit_membership_change` | `memberships` | Mencatat perubahan peran dan status |
| `audit_category_change` | `categories` | Mencatat perubahan kategori |
| `audit_status_definition_change` | `status_definitions` | Mencatat perubahan label dan status aktif |

Trigger append-only harus memakai `raise exception` dan tidak boleh memiliki pengecualian untuk `service_role`.

## 9. View

| View | Pemakai | Isi |
|---|---|---|
| `v_reports_feed` | Warga dan admin | Data daftar tanpa identitas pelapor dan tanpa koordinat presisi |
| `v_report_timeline` | Warga dan admin | Riwayat status dengan nama aktor yang disamarkan untuk pelapor |
| `v_rt_activity` | Admin RT | Audit terbatas untuk RT-nya, tanpa `before_state`, `after_state`, dan `ip_hash` |

Semua view memakai `security_invoker = true` agar RLS tabel dasar tetap berlaku.

## 10. Migrasi

Struktur repositori:

```text
supabase/
  config.toml
  migrations/
    20261118000100_init_extensions.sql
    20261118000200_init_enums.sql
    20261118000300_init_tables.sql
    20261118000400_init_indexes.sql
    20261118000500_init_rls.sql
    20261118000600_init_functions.sql
    20261118000700_init_triggers.sql
    20261118000800_init_views.sql
  seed.sql
  tests/
    rls_test.sql
    report_test.sql
```

Aturan:

1. Satu migrasi tidak boleh mencampur perubahan destruktif dan fitur baru.
2. `DROP TABLE`, `DROP COLUMN`, atau `TRUNCATE` di produksi memerlukan persetujuan tertulis dan rencana rollback.
3. Migrasi harus idempoten bila memungkinkan (`if not exists`, `create or replace`).
4. RLS dan policy ditulis pada migrasi yang sama dengan tabelnya.
5. Jangan mengedit migrasi yang sudah diterapkan. Buat migrasi baru.
6. Seed hanya untuk lokal. Seed produksi dilarang tanpa instruksi eksplisit.
7. Setiap migrasi diuji dengan `supabase db reset` di lokal dan pgTAP di CI.

Perintah lokal:

```bash
supabase start
supabase db reset
supabase db lint
supabase gen types typescript --local > src/types/database.ts
```

## 11. Job terjadwal (pg_cron)

| Job | Jadwal | Aksi |
|---|---|---|
| Bersihkan idempotency | Setiap jam | Hapus `idempotency_keys` yang `expires_at < now()` |
| Bersihkan rate limit | Setiap jam | Hapus `rate_limit_counters` lebih dari 24 jam |
| Bersihkan inbox | Setiap hari 03.00 WIB | Hapus objek `inbox/` tanpa rujukan lebih dari 24 jam |
| Bersihkan notifikasi | Setiap hari | Hapus notifikasi terbaca lebih dari 180 hari, sesuai kebijakan retensi |
| Tinjau soft delete | Setiap bulan | Laporkan laporan `deleted_at` lebih dari 90 hari untuk keputusan manual |

Job tidak boleh menghapus `audit_logs`, `report_status_history`, atau laporan aktif.

## 12. Backup dan pemulihan

| Aspek | Nilai |
|---|---|
| Backup harian | Aktif pada plan Pro |
| PITR | Opsional, biaya tambahan, target RPO 15 menit bila diaktifkan |
| RPO tanpa PITR | 24 jam |
| RTO target | 4 jam |
| Uji restore | Satu kali sebelum pilot dan setiap kuartal |
| Retensi backup | Mengikuti kebijakan plan dan kebutuhan retensi laporan |

Uji restore wajib mencatat hasil di `docs/ops/restore-log.md` (dibuat saat operasi pertama). Tanpa uji, status backup dianggap belum terverifikasi.

## 13. Batas dan biaya

Asumsi perencanaan, bukan hasil pengukuran:

- 100 pengguna aktif, 200 laporan per bulan.
- 3 foto per laporan, rata-rata 300 KB setelah kompresi.
- Penyimpanan bertambah sekitar 180 MB per bulan.
- Database transaksi di bawah 1 GB pada tahun pertama.
- Egress utama berasal dari thumbnail dan foto detail melalui signed URL.

Kontrol biaya:

- Thumbnail wajib untuk daftar. Foto penuh hanya dimuat di detail.
- Batas 5 foto per laporan dan 5 MB per file.
- Retensi notifikasi 180 hari.
- Tidak ada Realtime, tidak ada Edge Function yang berjalan terus-menerus.
- Pantau penggunaan Storage dan egress setiap bulan sebelum menaikkan batas.

## 14. Observability

- `X-Request-Id` dibuat di middleware dan diteruskan ke log serta `audit_logs`.
- Sentry menangkap error server dan klien tanpa PII. `beforeSend` menghapus email, token, dan koordinat presisi.
- Supabase Logs dipakai untuk query lambat dan error Postgres.
- Vercel Analytics hanya untuk metrik agregat halaman, bukan pelacakan pengguna.
- Alert: error rate 5xx di atas 2% selama 10 menit, kegagalan login di atas 20% selama 15 menit, storage di atas 80%.

## 15. Larangan operasional

1. Jangan mematikan RLS pada tabel apa pun, termasuk saat debugging.
2. Jangan membuat policy `using (true)` untuk tabel domain.
3. Jangan memakai `service_role` di komponen klien.
4. Jangan menjalankan SQL manual di produksi tanpa migrasi dan catatan.
5. Jangan mengunggah dump produksi ke lingkungan lokal tanpa anonymisasi.
6. Jangan menaruh PII di nama file, path Storage, atau log.
7. Jangan membuat bucket publik.
8. Jangan menonaktifkan proteksi password atau rotasi refresh token tanpa alasan tertulis.
9. Jangan mengubah `report_prefix` atau `report_seq` setelah ada laporan tanpa prosedur migrasi nomor.
10. Jangan mengizinkan admin RT menghapus laporan, termasuk melalui RPC baru.
11. Jangan menambahkan Edge Function yang memakai service role tanpa pemeriksaan peran eksplisit.
12. Jangan mengandalkan UUID yang sulit ditebak sebagai kontrol akses.

## 16. Checklist sebelum produksi

- [ ] Semua tabel domain memiliki RLS aktif.
- [ ] `authenticated` tidak memiliki INSERT, UPDATE, DELETE pada tabel domain.
- [ ] pgTAP membuktikan isolasi antar-RT untuk reports, attachments, comments, dan notifications.
- [ ] Bucket `report-photos` privat dan hanya dapat diakses service role.
- [ ] Signed URL diuji kedaluwarsa setelah 600 detik.
- [ ] EXIF terbukti hilang dari file hasil unggah.
- [ ] Fungsi `create_report` diuji dengan 20 permintaan paralel dan nomor tetap unik.
- [ ] Trigger append-only menolak UPDATE dan DELETE.
- [ ] Service role key tidak muncul di bundle klien.
- [ ] Redirect OAuth hanya mengarah ke domain resmi dan localhost.
- [ ] Backup dan uji restore tercatat.
- [ ] Job pembersihan berjalan dan tercatat di log.
- [ ] Tidak ada data produksi di lingkungan pengembangan.
