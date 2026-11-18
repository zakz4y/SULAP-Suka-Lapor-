# Kontrak API SULAP v1

Dokumen ini adalah kontrak antara frontend Next.js dan backend Next.js Route Handlers yang berjalan di atas Supabase. Diselaraskan dengan `supabase/init.sql` final. Frontend tidak memanggil PostgREST atau Storage secara langsung untuk operasi tulis.

| Atribut | Nilai |
|---|---|
| Versi | `v1` |
| Base URL | `/api/v1` |
| Format | JSON `application/json; charset=utf-8`, kecuali unggah dan ekspor |
| Autentikasi | Cookie sesi Supabase (`sb-<ref>-auth-token`), HttpOnly, Secure, SameSite=Lax |
| Otorisasi | Pemeriksaan sesi, keanggotaan RT aktif, dan peran di server, lalu RLS sebagai lapisan kedua |
| Waktu | ISO 8601 UTC, contoh `2026-11-18T07:15:00.000Z` |
| ID | UUID v4 untuk entitas, kecuali nomor publik laporan |
| Dokumen terkait | `prd.md`, `sulap.dbml`, `docs/supabase.md`, `supabase/init.sql` |

---

## 1. Aturan umum

1. Semua request yang mengubah data wajib memiliki sesi valid dan keanggotaan `active` pada RT terkait.
2. Peran tidak cukup diperiksa di UI. Setiap endpoint memanggil `requireUser`, lalu `requireActiveMembership`, lalu `requireRole` bila perlu.
3. Endpoint developer hanya menerima peran `developer` dan tidak pernah tersedia untuk admin RT.
4. Semua input divalidasi dengan skema Zod yang sama di klien dan server. Validasi server adalah keputusan akhir.
5. Tidak ada data personal pelapor pada respons yang diterima warga lain.
6. Koordinat presisi hanya dikirim ke pelapor dan admin RT. Warga lain menerima 3 angka desimal (sekitar 110 meter); `v_reports_feed` menerapkan `round(..., 3)`.
7. Semua respons menyertakan `X-Request-Id`. Nilai ini juga dicatat di `audit_logs.request_id` untuk aksi sensitif.
8. Endpoint tulis yang dapat diulang oleh klik ganda atau retry jaringan menerima header `Idempotency-Key` (UUID v4). Kunci berlaku 24 jam; disimpan di tabel `idempotency_keys`.

---

## 2. Format respons

### 2.1 Sukses

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01JCM8Y8V6Z3K4M2N1P0Q9R8S7",
    "nextCursor": null
  }
}
```

### 2.2 Gagal

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Periksa kembali isian laporan.",
    "fields": {
      "title": "Judul minimal 8 karakter.",
      "attachments": "Tambahkan minimal satu foto."
    },
    "requestId": "req_01JCM8Y8V6Z3K4M2N1P0Q9R8S7"
  }
}
```

Pesan `message` ditulis untuk pengguna akhir dalam Bahasa Indonesia. Detail teknis hanya masuk log server.

### 2.3 Daftar kode error

| Kode HTTP | `code` | Fungsi DB yang bisa `raise` | Arti |
|---:|---|---|---|
| 400 | `BAD_REQUEST` | — | Format request tidak dapat dibaca |
| 401 | `UNAUTHENTICATED` | Semua RPC | Tidak ada sesi valid |
| 403 | `FORBIDDEN` | Semua RPC | Peran tidak mencukupi |
| 403 | `NOT_MEMBER` | `create_report` | Belum menjadi anggota aktif RT |
| 403 | `NOT_REPORTER` | `reopen_report` | Bukan pelapor laporan |
| 404 | `NOT_FOUND` | Semua RPC | Objek tidak ada atau tidak terlihat oleh pemanggil |
| 409 | `CONFLICT_VERSION` | `transition_report_status` | `expectedVersion` tidak cocok |
| 409 | `MEMBERSHIP_EXISTS` | `join_rt` | Sudah ada keanggotaan aktif atau pending |
| 409 | `LAST_ADMIN` | `decide_membership` | Aksi akan menghilangkan admin aktif terakhir |
| 409 | `IDEMPOTENCY_REPLAY` | Route Handler | Kunci dipakai dengan isi request berbeda |
| 413 | `PAYLOAD_TOO_LARGE` | Route Handler | Berkas atau body melebihi batas |
| 415 | `UNSUPPORTED_MEDIA` | Route Handler | Tipe berkas tidak didukung |
| 422 | `VALIDATION_FAILED` | Semua RPC | Field tidak valid |
| 422 | `STATUS_NOTE_REQUIRED` | `transition_report_status`, trigger | Status tujuan mewajibkan catatan |
| 422 | `CATEGORY_INACTIVE` | `create_report` | Kategori tidak aktif |
| 422 | `INVITE_INVALID` | `join_rt` | Kode undangan tidak valid |
| 422 | `INVITE_EXPIRED` | `join_rt` | Kode undangan kedaluwarsa atau penuh |
| 422 | `INTERNAL` | RPC internal | Konfigurasi RT tidak lengkap |
| 429 | `RATE_LIMITED` | Route Handler | Melebihi batas percobaan |
| 500 | `INTERNAL` | — | Kesalahan tak terduga |

> **Penting:** `NOT_FOUND` juga dipakai saat pengguna tidak berhak melihat objek lintas RT. Ini mencegah kebocoran keberadaan data.

### 2.4 Cursor dan filter

- Pagination memakai cursor, bukan nomor halaman.
- `limit` default 20, maksimum 50.
- `cursor` adalah base64 dari `{ "createdAt": "...", "id": "..." }`.
- Urutan default `created_at DESC, id DESC`. Urutan tidak dapat diubah kecuali dinyatakan.
- Filter tanggal memakai `from` dan `to` inklusif dalam UTC.

---

## 3. Ringkasan endpoint

| Method | Path | Peran | Prioritas | Fungsi DB / Sumber |
|---|---|---|---|---|
| GET | `/me` | Semua | P0 | `memberships`, `profiles` |
| GET | `/me/capabilities` | Semua | P0 | `memberships` |
| POST | `/auth/logout` | Semua | P0 | Supabase Auth |
| POST | `/uploads` | Warga, Admin | P0 | Storage service role |
| GET | `/reports` | Anggota | P0 | `v_reports_feed` |
| POST | `/reports` | Anggota | P0 | `create_report(...)` |
| GET | `/reports/{publicNo}` | Anggota | P0 | `v_reports_feed`, `v_report_timeline`, `attachments`, `inspections` |
| POST | `/reports/{publicNo}/reopen` | Pelapor | P1 | `reopen_report(...)` |
| PATCH | `/reports/{publicNo}/status` | Admin RT | P0 | `transition_report_status(...)` |
| POST | `/reports/{publicNo}/inspections` | Admin RT | P0 | `create_inspection(...)` |
| GET | `/attachments/{id}/url` | Sesuai laporan | P0 | Storage signed URL |
| GET | `/categories` | Anggota | P0 | `categories` (RLS) |
| POST | `/categories` | Admin RT | P0 | INSERT via service role + audit |
| PATCH | `/categories/{id}` | Admin RT | P0 | UPDATE via service role + audit |
| GET | `/status-definitions` | Anggota | P0 | `status_definitions` (RLS) |
| PATCH | `/status-definitions/{id}` | Admin RT | P0 | UPDATE via service role + audit |
| POST | `/memberships/join` | Terautentikasi | P0 | `join_rt(...)` |
| GET | `/memberships` | Admin RT | P0 | `memberships` (RLS) |
| PATCH | `/memberships/{id}` | Admin RT | P0 | `decide_membership(...)` |
| GET | `/notifications` | Anggota | P0 | `notifications` (RLS) |
| POST | `/notifications/read` | Anggota | P0 | `mark_notifications_read(...)` |
| GET | `/notifications/unread-count` | Anggota | P0 | `notifications` (RLS) |
| GET | `/admin/overview` | Admin RT | P0 | `reports` (RLS) |
| GET | `/rt` | Anggota | P0 | `rts` (RLS) |
| PATCH | `/rt` | Admin RT | P0 | UPDATE via service role + audit |
| GET | `/rt/invite-codes` | Admin RT | P0 | `rt_invite_codes` (RLS) |
| POST | `/rt/invite-codes` | Admin RT | P0 | `create_invite_code(...)` |
| POST | `/rt/invite-codes/{id}/revoke` | Admin RT | P0 | `revoke_invite_code(...)` |
| GET | `/reports/export` | Admin RT | P1 | `reports`, `categories`, `status_definitions` (RLS) |
| GET | `/dev/overview` | Developer | P0 | `rts`, `memberships`, `reports` (RLS) |
| GET | `/dev/rts` | Developer | P0 | `rts` (RLS) |
| POST | `/dev/rts` | Developer | P0 | `create_rt(...)` |
| PATCH | `/dev/rts/{id}` | Developer | P0 | UPDATE via service role + audit |
| GET | `/dev/users` | Developer | P0 | `profiles`, `auth.users` (service role) |
| PATCH | `/dev/memberships/{id}/role` | Developer | P0 | `decide_membership(...)` |
| POST | `/dev/reports/{publicNo}/soft-delete` | Developer | P0 | `soft_delete_report(...)` |
| POST | `/dev/reports/{publicNo}/restore` | Developer | P0 | `restore_report(...)` |
| GET | `/dev/audit-logs` | Developer | P0 | `audit_logs` (RLS) |
| GET | `/dev/platform-settings` | Developer | P1 | `platform_settings` (RLS) |
| PATCH | `/dev/platform-settings` | Developer | P1 | UPDATE via service role |
| GET | `/health` | Publik | P0 | Postgres ping |

---

## 4. Endpoint

### GET /me
**Peran:** Semua pengguna terautentikasi  
**Prioritas:** P0  
**Auth:** Cookie sesi wajib  
**Idempotency:** Tidak diperlukan  
**Input:** Tidak ada  
**Output:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "displayName": "Rani",
      "avatarUrl": null,
      "locale": "id-ID"
    },
    "activeRt": {
      "id": "uuid",
      "name": "RT 01 Melati",
      "slug": "rt-01-melati",
      "role": "resident"
    },
    "memberships": [
      { "rtId": "uuid", "role": "resident", "status": "active" }
    ]
  },
  "meta": { "requestId": "req_..." }
}
```
Pengguna tanpa keanggotaan aktif menerima `activeRt: null` dan `onboarding: { "required": true }`.  
**Error:** `UNAUTHENTICATED`  
**Sumber data:** `profiles`, `memberships`  
**Catatan keamanan:** Tidak memuat email. `avatarUrl` adalah signed URL 600 detik bila ada.

---

### GET /me/capabilities
**Peran:** Semua terautentikasi  
**Prioritas:** P0  
**Auth:** Cookie sesi wajib  
**Idempotency:** Tidak diperlukan  
**Input:** Tidak ada  
**Output:**
```json
{
  "data": {
    "canCreateReport": true,
    "canChangeStatus": false,
    "canManageMembers": false,
    "canManageCategories": false,
    "canManageStatuses": false,
    "canSoftDeleteReport": false,
    "canViewAuditLog": false,
    "canExport": false
  }
}
```
**Error:** `UNAUTHENTICATED`  
**Sumber data:** `memberships`  
**Catatan keamanan:** UI memakai ini untuk tampilkan/sembunyikan kontrol, tetapi server tetap memeriksa ulang.

---

### POST /uploads
**Peran:** Warga, Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** `Idempotency-Key` dianjurkan  
**Input:** `multipart/form-data`, field `file` (JPEG/PNG/WebP, maks 5 MB)  
**Output:**
```json
{
  "data": {
    "uploadId": "uuid",
    "path": "inbox/userId/inbox_uuid.webp",
    "width": 1600,
    "height": 1200,
    "byteSize": 284310,
    "expiresAt": "2026-11-19T07:15:00.000Z"
  }
}
```
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`, `UNSUPPORTED_MEDIA`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`  
**Sumber data:** Storage bucket `report-photos` (service role), path `inbox/{userId}/{uploadId}.webp`  
**Catatan keamanan:** Server menjalankan `sharp`: re-encode ke WebP, maksimum sisi 2000 px, buang EXIF. `uploadId` berlaku 24 jam, hanya untuk pengguna yang mengunggah.

---

### GET /reports
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input (query):**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `q` | string 2..80 | Pencarian FTS kolom `search_tsv` (konfigurasi `simple`) |
| `status` | string | Satu atau beberapa `report_status_group`, dipisah koma |
| `categoryId` | uuid | Filter `categories.id` |
| `mine` | boolean | Hanya laporan `reporter_id = uid` |
| `hasLocation` | boolean | Hanya laporan dengan koordinat |
| `from`, `to` | ISO date UTC | Rentang `created_at` inklusif |
| `sort` | `newest`\|`oldest`\|`needs_action` | Default `newest`; `needs_action` hanya admin |
| `limit` | integer | Default 20, maks 50 |
| `cursor` | string | base64 cursor |

**Output:**
```json
{
  "data": [
    {
      "id": "uuid",
      "publicNo": "SULAP-RT01-0042",
      "title": "Saluran air tersumbat",
      "excerpt": "Air tidak mengalir...",
      "category": { "id": "uuid", "name": "Saluran Air" },
      "status": { "group": "in_progress", "label": "Dalam Penanganan", "color": "#0E6B5C" },
      "locationText": "Gang Melati 2",
      "thumbnailUrl": "https://.../sign/...",
      "photoCount": 2,
      "createdAt": "2026-11-17T10:20:00.000Z",
      "updatedAt": "2026-11-18T02:10:00.000Z",
      "isMine": false
    }
  ],
  "meta": { "requestId": "req_...", "nextCursor": "base64..." }
}
```
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`  
**Sumber data:** `v_reports_feed` (koordinat dibulatkan 3 desimal, tanpa `reporter_id`)  
**Catatan keamanan:** `isMine` dihitung server. `thumbnailUrl` signed URL 10 menit. `reporter_id` tidak pernah dikirim.

---

### POST /reports
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** `Idempotency-Key` **wajib** (UUID v4), disimpan di `idempotency_keys`  
**Input:**
```json
{
  "categoryId": "uuid",
  "title": "Saluran air tersumbat di depan gang",
  "description": "Air tidak mengalir sejak hujan kemarin dan mulai berbau.",
  "location": {
    "source": "gps",
    "latitude": -6.24152,
    "longitude": 106.79931,
    "accuracyM": 14.2,
    "text": "Gang Melati 2, depan pos ronda",
    "note": "Dekat tiang listrik nomor 12"
  },
  "uploadIds": ["uuid"]
}
```

**Validasi:**

| Field | Aturan |
|---|---|
| `categoryId` | Harus milik RT anggota dan `is_active = true` |
| `title` | 8..120 karakter setelah trim |
| `description` | 20..2000 karakter |
| `location.source` | Enum: `gps`, `map_pin`, `manual` |
| `location.latitude` | -90..90, wajib bila `source` `gps` atau `map_pin` |
| `location.longitude` | -180..180 |
| `location.accuracyM` | 0..5000, opsional |
| `location.text` | 0..200, wajib bila `source` `manual` |
| `uploadIds` | 1..`rts.max_photos`, milik pengguna, belum dipakai |

**Output (HTTP 201):**
```json
{
  "data": {
    "id": "uuid",
    "publicNo": "SULAP-RT01-0042",
    "status": { "group": "new", "label": "Baru Masuk" },
    "createdAt": "2026-11-18T07:20:00.000Z"
  },
  "meta": { "requestId": "req_..." }
}
```
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`, `CATEGORY_INACTIVE`, `VALIDATION_FAILED`, `RATE_LIMITED` (10/jam per `user_id`), `IDEMPOTENCY_REPLAY`  
**Sumber data:** `create_report(p_category_id uuid, p_title text, p_description text, p_location jsonb, p_upload_ids uuid[])`  
**Catatan keamanan:** `rt_id` tidak diterima dari klien. Nomor laporan atomik dari `rts.report_seq` dengan `SELECT FOR UPDATE`. Semua dalam satu transaksi.

---

### GET /reports/{publicNo}
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input:** `publicNo` di path (contoh: `SULAP-RT01-0042`)  
**Output:**
```json
{
  "data": {
    "id": "uuid",
    "publicNo": "SULAP-RT01-0042",
    "title": "Saluran air tersumbat",
    "description": "...",
    "category": { "id": "uuid", "name": "Saluran Air" },
    "status": { "id": "uuid", "group": "in_progress", "label": "Dalam Penanganan", "color": "#0E6B5C" },
    "location": {
      "latitude": -6.242,
      "longitude": 106.799,
      "accuracyM": 14.2,
      "source": "gps",
      "text": "Gang Melati 2",
      "note": "Dekat tiang listrik"
    },
    "attachments": [
      { "id": "uuid", "kind": "report_evidence", "url": "...", "width": 1600, "height": 1200 }
    ],
    "timeline": [
      { "id": 12, "fromLabel": null, "toLabel": "Baru Masuk", "toGroup": "new", "actorName": "Warga", "note": null, "createdAt": "..." }
    ],
    "inspections": [
      { "id": "uuid", "findings": "...", "inspectedAt": "...", "inspectorName": "Budi (Admin RT)" }
    ],
    "actions": {
      "canReopen": false,
      "canChangeStatus": false,
      "canInspect": false,
      "canSoftDelete": false
    },
    "version": 3,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
**Perbedaan per peran:**
- **Warga bukan pelapor:** `location.latitude/longitude` dibulatkan 3 desimal; tidak ada `reporter`; `actions.canReopen: false`
- **Pelapor:** koordinat presisi penuh; `actions.canReopen: true` bila status `resolved`/`closed`
- **Admin RT:** tambahan `reporter: { displayName, avatarUrl }`, koordinat presisi penuh
- **Developer:** tambahan `deleteReason` dan `deletedAt` bila soft deleted

**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`, `NOT_FOUND`  
**Sumber data:** `v_reports_feed`, `v_report_timeline`, `attachments`, `inspections`, `profiles`  
**Catatan keamanan:** `reporter_id` tidak pernah dikirim. URL lampiran adalah signed URL 600 detik.

---

### PATCH /reports/{publicNo}/status
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan (dilindungi `expectedVersion`)  
**Input:**
```json
{
  "toStatusId": "uuid",
  "note": "Petugas dijadwalkan besok pagi.",
  "resolutionSummary": null,
  "closureReason": null,
  "expectedVersion": 3
}
```

**Aturan:**
- `toStatusId` harus milik RT yang sama dan `is_active = true`
- `note` wajib bila `status_definitions.requires_note = true`
- `resolutionSummary` wajib min 20 karakter bila `group = resolved`
- `closureReason` wajib min 10 karakter bila `group = closed`
- `expectedVersion` wajib; ketidakcocokan → `CONFLICT_VERSION`

**Output (HTTP 200):**
```json
{
  "data": {
    "id": "uuid",
    "publicNo": "SULAP-RT01-0042",
    "version": 4,
    "status": { "id": "uuid", "group": "in_progress", "label": "Dalam Penanganan", "color": "#0E6B5C" }
  }
}
```
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT_VERSION`, `STATUS_NOTE_REQUIRED`, `VALIDATION_FAILED`  
**Sumber data:** `transition_report_status(p_report_id uuid, p_to_status_id uuid, p_note text, p_resolution_summary text, p_closure_reason text, p_expected_version integer)`  
**Catatan keamanan:** `rt_id` tidak diterima dari klien. Semua dalam satu transaksi.

---

### POST /reports/{publicNo}/inspections
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** `Idempotency-Key` **wajib**  
**Input:**
```json
{
  "findings": "Saluran tersumbat daun dan plastik sepanjang 4 meter.",
  "inspectedAt": "2026-11-18T01:00:00.000Z",
  "uploadIds": ["uuid"]
}
```
`findings` 20..2000 karakter. `uploadIds` 0..5, disimpan sebagai `attachments.kind = 'inspection'`.  
**Output (HTTP 201):** `{ "data": { "id": "uuid", "reportId": "uuid" } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `IDEMPOTENCY_REPLAY`  
**Sumber data:** `create_inspection(p_report_id uuid, p_findings text, p_inspected_at timestamptz, p_upload_ids uuid[])`  
**Catatan keamanan:** Inspeksi tidak dapat dihapus; koreksi membuat inspeksi baru.

---

### POST /reports/{publicNo}/reopen
**Peran:** Pelapor saja  
**Prioritas:** P1  
**Auth:** Cookie sesi + `reporter_id = uid`  
**Idempotency:** Dianjurkan  
**Input:**
```json
{
  "reason": "Saluran tersumbat lagi setelah dua hari.",
  "uploadIds": ["uuid"]
}
```
`reason` 20..500 karakter.  
**Output (HTTP 200):** `{ "data": { "id": "uuid", "publicNo": "SULAP-RT01-0042" } }`  
**Error:** `UNAUTHENTICATED`, `NOT_REPORTER`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** `reopen_report(p_report_id uuid, p_reason text, p_upload_ids uuid[])`  
**Catatan keamanan:** Riwayat sebelumnya tidak dihapus. Grup status berubah ke `reopened`.

---

### GET /attachments/{id}/url
**Peran:** Sesuai akses laporan induk  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input:** `id` lampiran di path  
**Output:**
```json
{
  "data": {
    "url": "https://.../sign/...",
    "expiresAt": "2026-11-18T07:30:00.000Z"
  }
}
```
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`, `NOT_FOUND`  
**Sumber data:** `attachments` (RLS), lalu Storage signed URL TTL 600 detik  
**Catatan keamanan:** Server memeriksa akses laporan induk sebelum membuat signed URL.

---

### GET /categories
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input (query):** `includeInactive=false` (hanya admin yang bisa `true`)  
**Output:** Daftar `{ id, name, slug, description, sortOrder, isActive }`  
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`  
**Sumber data:** `categories` (RLS, `is_rt_member`)  
**Catatan keamanan:** `rt_id` ditentukan dari sesi, bukan dari klien.

---

### POST /categories
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:**
```json
{ "name": "Saluran Air", "description": "Drainase, selokan", "sortOrder": 10 }
```
`name` 1..60 karakter. Slug dibuat otomatis dari name.  
**Output (HTTP 201):** `{ "data": { "id": "uuid", "slug": "saluran-air", ... } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`  
**Sumber data:** INSERT ke `categories` via service role + trigger `audit_category_change`  
**Catatan keamanan:** `rt_id` dari sesi server, bukan dari klien.

---

### PATCH /categories/{id}
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "name", "description", "sortOrder", "isActive" }` (semua opsional)  
**Output:** Kategori yang diperbarui  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** UPDATE `categories` via service role + trigger `audit_category_change`  
**Catatan keamanan:** Menonaktifkan tidak mengubah laporan lama.

---

### GET /status-definitions
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input (query):** `includeInactive=false`  
**Output:** Daftar `{ id, group, label, colorHex, sortOrder, requiresNote, isActive }`  
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`  
**Sumber data:** `status_definitions` (RLS, `is_rt_member`)

---

### PATCH /status-definitions/{id}
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "label", "colorHex", "sortOrder" }` — `group` tidak dapat diubah  
**Output:** Definisi status yang diperbarui  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** UPDATE `status_definitions` via service role + trigger `audit_status_definition_change`  
**Catatan keamanan:** `colorHex` harus format `#RRGGBB`. `group` immutable.

---

### POST /memberships/join
**Peran:** Pengguna terautentikasi (belum jadi anggota)  
**Prioritas:** P0  
**Auth:** Cookie sesi wajib  
**Idempotency:** Tidak diperlukan (dilindungi `MEMBERSHIP_EXISTS`)  
**Input (invite_code):**
```json
{ "method": "invite_code", "code": "MELATI7K", "rtSlug": null, "note": null }
```
**Input (request):**
```json
{ "method": "request", "code": null, "rtSlug": "rt-01-melati", "note": "Warga Gang Melati 2" }
```
**Output:**
```json
{ "data": { "membershipId": "uuid", "status": "active" } }
```
**Error:** `UNAUTHENTICATED`, `MEMBERSHIP_EXISTS`, `INVITE_INVALID`, `INVITE_EXPIRED`, `NOT_FOUND`, `RATE_LIMITED` (5/jam per `user_id`)  
**Sumber data:** `join_rt(p_method join_method, p_code text, p_rt_slug text, p_note text)`  
**Catatan keamanan:** Kode disimpan sebagai SHA-256 hash. Kode mentah tidak pernah disimpan di DB.

---

### GET /memberships
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input (query):** `status=pending|active|...`, `limit`, `cursor`  
**Output:** Daftar `{ id, userId, displayName, avatarUrl, role, status, joinMethod, requestNote, createdAt }` — tanpa email  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `memberships` JOIN `profiles` (RLS, `is_rt_admin`)  
**Catatan keamanan:** Email tidak dikirim ke admin RT; hanya untuk developer.

---

### PATCH /memberships/{id}
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:**
```json
{ "action": "approve", "role": "resident", "note": "Terverifikasi buku anggota." }
```
Aksi: `approve`, `reject`, `suspend`, `reinstate`, `remove`  
**Output:** `{ "data": { "membershipId": "uuid", "status": "active" } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `LAST_ADMIN`, `VALIDATION_FAILED`  
**Sumber data:** `decide_membership(p_membership_id uuid, p_action text, p_role member_role, p_note text)`  
**Catatan keamanan:** Admin tidak bisa mengubah dirinya sendiri. Dicegah kehilangan admin terakhir.

---

### GET /notifications
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Input (query):** `unreadOnly=true`, `limit=20`, `cursor`  
**Output:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "report_status_changed",
      "title": "Laporan SULAP-RT01-0042 diperbarui",
      "body": "Status berubah menjadi Dalam Penanganan.",
      "reportPublicNo": "SULAP-RT01-0042",
      "readAt": null,
      "createdAt": "..."
    }
  ],
  "meta": { "requestId": "req_...", "nextCursor": null }
}
```
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`  
**Sumber data:** `notifications` (RLS, `recipient_id = uid`)  
**Catatan keamanan:** `report_id` dipetakan ke `publicNo` di server.

---

### POST /notifications/read
**Peran:** Penerima notifikasi  
**Prioritas:** P0  
**Auth:** Cookie sesi wajib  
**Idempotency:** Tidak diperlukan (idempoten secara alami)  
**Input:** `{ "ids": ["uuid"] }` atau `{ "all": true }`  
**Output:** `{ "data": { "updated": 3 } }`  
**Error:** `UNAUTHENTICATED`  
**Sumber data:** `mark_notifications_read(p_ids uuid[], p_all boolean)`  
**Catatan keamanan:** Hanya notifikasi milik pemanggil yang berubah (dicek di dalam RPC).

---

### GET /notifications/unread-count
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi wajib  
**Idempotency:** Tidak diperlukan  
**Input:** Tidak ada  
**Output:** `{ "data": { "count": 3 } }` — angka dari database, bukan dekoratif  
**Error:** `UNAUTHENTICATED`  
**Sumber data:** `notifications` (RLS) `WHERE read_at IS NULL AND recipient_id = uid`

---

### GET /admin/overview
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:** Tidak ada  
**Output:**
```json
{
  "data": {
    "counts": {
      "new": 4,
      "inspection": 2,
      "in_progress": 5,
      "resolvedLast7Days": 11
    },
    "needsAction": [
      { "publicNo": "SULAP-RT01-0038", "title": "Lampu jalan mati", "statusGroup": "new", "ageHours": 52 }
    ]
  }
}
```
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `reports` (RLS) — semua angka dari query nyata  
**Catatan keamanan:** Tidak ada angka dekoratif.

---

### GET /rt
**Peran:** Anggota RT aktif  
**Prioritas:** P0  
**Auth:** Cookie sesi + keanggotaan aktif  
**Idempotency:** Tidak diperlukan  
**Output:** `{ id, name, slug, rwName, addressText, photoRequired, maxPhotos, timezone }` — tanpa kode undangan  
**Error:** `UNAUTHENTICATED`, `NOT_MEMBER`  
**Sumber data:** `rts` (RLS)

---

### PATCH /rt
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "name", "addressText", "photoRequired", "maxPhotos" }` — `reportPrefix` hanya developer  
**Output:** RT yang diperbarui  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`  
**Sumber data:** UPDATE `rts` via service role + audit log  
**Catatan keamanan:** `report_prefix` dan `report_seq` tidak boleh diubah setelah ada laporan.

---

### GET /rt/invite-codes
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Output:**
```json
{
  "data": [
    {
      "id": "uuid",
      "codeMasked": "MELATI7*",
      "label": "Batch November",
      "usesCount": 3,
      "maxUses": 50,
      "expiresAt": "...",
      "revokedAt": null
    }
  ]
}
```
Kode mentah tidak pernah dikembalikan lagi.  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `rt_invite_codes` (RLS, `is_rt_admin`)

---

### POST /rt/invite-codes
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "maxUses": 50, "expiresAt": "...", "label": "Batch Nov" }`  
**Output:**
```json
{
  "data": { "id": "uuid", "code": "MELATI7K", "expiresAt": "...", "maxUses": 50 }
}
```
Kode mentah dikembalikan **satu kali** saja. Simpan segera.  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED` (10/hari per `rt_id`)  
**Sumber data:** `create_invite_code(p_max_uses smallint, p_expires_at timestamptz, p_label text)`  
**Catatan keamanan:** Hash SHA-256 yang disimpan di DB; kode mentah hanya ada di memori respons.

---

### POST /rt/invite-codes/{id}/revoke
**Peran:** Admin RT  
**Prioritas:** P0  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan (idempoten alami)  
**Input:** Tidak ada body  
**Output:** `{ "data": { "id": "uuid", "revokedAt": "..." } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`  
**Sumber data:** `revoke_invite_code(p_id uuid)`

---

### GET /reports/export
**Peran:** Admin RT  
**Prioritas:** P1  
**Auth:** Cookie sesi + `rt_admin`  
**Idempotency:** Tidak diperlukan  
**Input (query):** `format=csv`, `from`, `to`, `status`  
**Output:** `text/csv; charset=utf-8` dengan header `Content-Disposition`  
Kolom: nomor, judul, kategori, status, tanggal dibuat, tanggal selesai, lokasi teks, jumlah foto — tanpa nama pelapor  
Maks 5.000 baris; di atas itu kembalikan `422` dengan pesan untuk mempersempit filter.  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`  
**Sumber data:** `reports` JOIN `categories`, `status_definitions` (RLS)  
**Catatan keamanan:** Dicatat di `audit_logs`. Nama pelapor tidak disertakan kecuali ada keputusan produk.

---

### GET /dev/overview
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Output:** `{ rtCount, activeUserCount, reportsLast30Days, needsActionCount }` — semua dari query nyata  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `rts`, `memberships`, `reports` (RLS, `is_developer`)

---

### GET /dev/rts
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input (query):** `q`, `cursor`, `limit`  
**Output:** Daftar RT lengkap  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `rts` (RLS, `is_developer`)

---

### POST /dev/rts
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:**
```json
{
  "name": "RT 02 Kenanga",
  "slug": "rt-02-kenanga",
  "rwName": "RW 05",
  "addressText": "Jl. Kenanga Raya",
  "reportPrefix": "RT02",
  "adminEmail": "ketua.rt02@example.com"
}
```
**Output:** `{ "data": { "id": "uuid", "slug": "rt-02-kenanga", "adminId": "uuid|null" } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT_VERSION` (slug duplikat)  
**Sumber data:** `create_rt(p_name text, p_slug text, p_report_prefix text, p_admin_email text)`  
**Catatan keamanan:** Fungsi membuat status_definitions dan kategori default sekaligus.

---

### PATCH /dev/rts/{id}
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "name", "addressText", "isActive", "reportPrefix" }` — prefix hanya jika belum ada laporan  
**Output:** RT yang diperbarui  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** UPDATE `rts` via service role + audit log

---

### GET /dev/users
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input (query):** `q` (cari `display_name` atau email)  
**Output:** Daftar `{ id, displayName, email, memberships[] }`  
Email hanya tampil untuk developer.  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `profiles` JOIN `auth.users` via service role (email dari `auth.users`)

---

### PATCH /dev/memberships/{id}/role
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "role": "rt_admin", "reason": "Ketua RT baru ditunjuk." }`  
**Output:** `{ "data": { "membershipId": "uuid", "status": "active" } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `LAST_ADMIN`  
**Sumber data:** `decide_membership(...)` dengan role baru

---

### POST /dev/reports/{publicNo}/soft-delete
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:**
```json
{
  "reason": "Laporan berisi data pribadi yang diminta penghapusan.",
  "confirmPublicNo": "SULAP-RT01-0042"
}
```
`confirmPublicNo` harus sama persis. `reason` min 10 karakter.  
**Output:** `{ "data": { "id": "uuid", "deletedAt": "..." } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** `soft_delete_report(p_report_id uuid, p_reason text)`  
**Catatan keamanan:** Admin RT tidak memiliki tombol ini. Dicatat di `audit_logs` dan notifikasi pelapor.

---

### POST /dev/reports/{publicNo}/restore
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "reason": "Laporan dipulihkan setelah verifikasi." }`  
**Output:** `{ "data": { "id": "uuid", "restoredAt": "..." } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`  
**Sumber data:** `restore_report(p_report_id uuid, p_reason text)`

---

### GET /dev/audit-logs
**Peran:** Developer  
**Prioritas:** P0  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input (query):** `actorId`, `action`, `entityType`, `entityId`, `from`, `to`, `cursor`, `limit`  
**Output:** Daftar `audit_logs` tanpa `before_state`/`after_state` mentah — format disesuaikan  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `audit_logs` (RLS, `is_developer`)  
**Catatan keamanan:** Tidak dapat diedit atau dihapus (trigger `guard_audit_mutation`).

---

### GET /dev/platform-settings
**Peran:** Developer  
**Prioritas:** P1  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Output:** `{ "data": { "retention.notification_days": 180, ... } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`  
**Sumber data:** `platform_settings` (RLS, `is_developer`)

---

### PATCH /dev/platform-settings
**Peran:** Developer  
**Prioritas:** P1  
**Auth:** Cookie sesi + `developer`  
**Idempotency:** Tidak diperlukan  
**Input:** `{ "key": "retention.notification_days", "value": 180 }`  
Rahasia tidak boleh disimpan di sini.  
**Output:** `{ "data": { "key": "...", "value": ... } }`  
**Error:** `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`  
**Sumber data:** UPDATE `platform_settings` via service role

---

### GET /health
**Peran:** Publik  
**Prioritas:** P0  
**Auth:** Tidak diperlukan  
**Idempotency:** Tidak diperlukan  
**Output:**
```json
{
  "data": {
    "status": "ok",
    "database": "ok",
    "time": "2026-11-18T07:20:00.000Z",
    "version": "1.0.0"
  }
}
```
Tidak memuat versi dependensi, kredensial, atau informasi lingkungan.  
**Error:** HTTP 503 jika database tidak merespons  
**Sumber data:** Postgres ping (`SELECT 1`)

---

## 5. Batas laju

| Aksi | Batas | Kunci | Tabel |
|---|---:|---|---|
| Membuat laporan | 10 per jam | `user_id` | `rate_limit_counters` |
| Mengunggah foto | 30 per jam | `user_id` | `rate_limit_counters` |
| Percobaan kode undangan | 5 per jam | `user_id` | `rate_limit_counters` |
| Permintaan bergabung | 5 per jam | `user_id` | `rate_limit_counters` |
| Membuat kode undangan | 10 per hari | `rt_id` | `rate_limit_counters` |
| Pencarian pengguna developer | 60 per jam | `user_id` | `rate_limit_counters` |
| Permintaan detail laporan | 300 per jam | `user_id` | `rate_limit_counters` |

Respons `429` menyertakan header `Retry-After` dalam detik. UI menampilkan waktu tunggu dan tidak mencoba ulang otomatis.

---

## 6. Idempotensi

- Header `Idempotency-Key` disimpan di `idempotency_keys` bersama hash body.
- Kunci sama dan body sama mengembalikan respons tersimpan.
- Kunci sama dan body berbeda mengembalikan `409 IDEMPOTENCY_REPLAY`.
- Masa berlaku 24 jam (kolom `expires_at`).
- Pembersihan otomatis via pg_cron job `sulap_cleanup_idempotency` (setiap jam).
- Kunci tidak menggantikan transaksi database. Operasi tetap harus atomik.

---

## 7. Pemetaan API ke fungsi database

| API | Fungsi DB atau Sumber |
|---|---|
| `POST /reports` | `create_report(p_category_id uuid, p_title text, p_description text, p_location jsonb, p_upload_ids uuid[])` |
| `PATCH /reports/{publicNo}/status` | `transition_report_status(p_report_id uuid, p_to_status_id uuid, p_note text, p_resolution_summary text, p_closure_reason text, p_expected_version integer)` |
| `POST /reports/{publicNo}/inspections` | `create_inspection(p_report_id uuid, p_findings text, p_inspected_at timestamptz, p_upload_ids uuid[])` |
| `POST /reports/{publicNo}/reopen` | `reopen_report(p_report_id uuid, p_reason text, p_upload_ids uuid[])` |
| `POST /memberships/join` | `join_rt(p_method join_method, p_code text, p_rt_slug text, p_note text)` |
| `PATCH /memberships/{id}` | `decide_membership(p_membership_id uuid, p_action text, p_role member_role, p_note text)` |
| `POST /rt/invite-codes` | `create_invite_code(p_max_uses smallint, p_expires_at timestamptz, p_label text)` |
| `POST /rt/invite-codes/{id}/revoke` | `revoke_invite_code(p_id uuid)` |
| `POST /dev/reports/{publicNo}/soft-delete` | `soft_delete_report(p_report_id uuid, p_reason text)` |
| `POST /dev/reports/{publicNo}/restore` | `restore_report(p_report_id uuid, p_reason text)` |
| `POST /notifications/read` | `mark_notifications_read(p_ids uuid[], p_all boolean)` |
| `POST /dev/rts` | `create_rt(p_name text, p_slug text, p_report_prefix text, p_admin_email text)` |
| `GET /reports` | `v_reports_feed` dengan RLS (`is_rt_member`) |
| `GET /reports/{publicNo}` | `v_reports_feed`, `v_report_timeline`, `attachments`, `inspections` |
| `GET /dev/audit-logs` | `audit_logs` dengan RLS (`is_developer`) |
| `GET /admin/overview` | `reports` dengan RLS (`is_rt_admin`) |

> Semua fungsi yang menulis data: `SECURITY DEFINER`, `set search_path = public, pg_temp`, memeriksa `auth.uid()`, tidak menerima `rt_id` dari klien.

---

## 8. Pemetaan API ke trigger database

| Peristiwa | Trigger | Fungsi trigger |
|---|---|---|
| Laporan baru dibuat | `notify_admin_new_report` | `fn_notify_admin_new_report()` |
| Riwayat status ditambah | `notify_reporter_status` | `fn_notify_reporter_status()` |
| Keanggotaan baru pending | `notify_membership_request` | `fn_notify_membership_request()` |
| Keanggotaan berubah | `audit_membership_change` | `fn_audit_membership_change()` |
| Kategori berubah | `audit_category_change` | `fn_audit_category_change()` |
| Definisi status berubah | `audit_status_definition_change` | `fn_audit_status_definition_change()` |
| Status laporan berubah | `sync_report_status_group` | `fn_sync_report_status_group()` |
| Status laporan berubah | `validate_status_transition` | `fn_validate_status_transition()` |
| Mutasi `report_status_history` | `guard_history_mutation` | `fn_guard_history_mutation()` |
| Mutasi `audit_logs` | `guard_audit_mutation` | `fn_guard_audit_mutation()` |
| User baru di `auth.users` | `on_auth_user_created` | `fn_handle_new_user()` |

---

## 9. Matriks RLS per tabel

| Tabel | Warga | Admin RT | Developer | Tulis langsung |
|---|---|---|---|---|
| `profiles` | Diri + rekan RT aktif | Anggota + pemohon RT-nya | Semua | UPDATE kolom aman (self) |
| `rts` | RT aktifnya | RT-nya | Semua | Hanya via RPC/service role |
| `rt_invite_codes` | Tidak | RT-nya | Semua | Hanya via RPC |
| `memberships` | Miliknya | RT-nya | Semua | Hanya via RPC |
| `categories` | RT-nya | RT-nya | Semua | Hanya via service role |
| `status_definitions` | RT-nya | RT-nya | Semua | Hanya via service role |
| `reports` | RT-nya (`deleted_at IS NULL`) | RT-nya (termasuk deleted) | Semua | Hanya via RPC |
| `report_status_history` | Laporan boleh dibaca | RT-nya | Semua | Append-only via RPC |
| `attachments` | Laporan boleh dibaca | RT-nya | Semua | Hanya via RPC |
| `inspections` | Laporan boleh dibaca | RT-nya | Semua | Hanya via RPC |
| `comments` | `visible` pada laporan boleh dibaca | RT-nya | Semua | Hanya via RPC |
| `assignments` | Miliknya (officer) | RT-nya | Semua | Hanya via RPC |
| `notifications` | `recipient_id = uid` | Miliknya | Miliknya | Hanya via RPC |
| `audit_logs` | Tidak | Lewat `v_rt_activity` | Semua | Append-only (guard trigger) |
| `platform_settings` | Tidak | Tidak | Semua | Hanya via service role |
| `idempotency_keys` | Tidak (via RPC internal) | Tidak | Tidak | Hanya service role |
| `rate_limit_counters` | Tidak (via RPC internal) | Tidak | Tidak | Hanya service role |

---

## 10. Checklist sebelum produksi

- [ ] `supabase/init.sql` berjalan sekali tanpa error pada project Supabase baru (Postgres 17)
- [ ] SQL idempoten: dijalankan dua kali pada project bersih → tidak error
- [ ] Semua tabel domain memiliki RLS aktif (`pg_tables` + `pg_policies`)
- [ ] `authenticated` punya USAGE schema + SELECT tabel/view + EXECUTE fungsi
- [ ] `authenticated` tidak bisa INSERT/UPDATE/DELETE tabel domain (uji langsung → gagal)
- [ ] pgTAP: isolasi antar-RT untuk `reports`, `attachments`, `comments`, `notifications`
- [ ] `create_report` diuji 20 permintaan paralel → nomor tetap unik
- [ ] Trigger append-only menolak UPDATE/DELETE pada `report_status_history` dan `audit_logs`
- [ ] Bucket `report-photos` privat; signed URL kedaluwarsa setelah 600 detik; EXIF hilang
- [ ] `supabase db lint` bersih
- [ ] Seed idempoten dan tidak memuat orang/laporan fiktif
- [ ] `docs/api-contract.md` cocok dengan nama fungsi final di `supabase/init.sql`

---

## 11. Perubahan kontrak

- Perubahan aditif (field opsional baru, endpoint baru) boleh dalam `v1`.
- Perubahan yang memecah klien wajib menaikkan versi ke `/api/v2` dan mempertahankan `v1` minimal satu siklus rilis.
- Setiap perubahan wajib memperbarui dokumen ini, skema Zod, dan pengujian kontrak dalam commit yang sama.
