# Kontrak API SULAP v1

Dokumen ini adalah kontrak antara frontend Next.js dan backend Next.js Route Handlers yang berjalan di atas Supabase. Frontend tidak memanggil PostgREST atau Storage secara langsung untuk operasi tulis.

| Atribut | Nilai |
|---|---|
| Versi | `v1` |
| Base URL | `/api/v1` |
| Format | JSON `application/json; charset=utf-8`, kecuali unggah dan ekspor |
| Autentikasi | Cookie sesi Supabase (`sb-<ref>-auth-token`), HttpOnly, Secure, SameSite=Lax |
| Otorisasi | Pemeriksaan sesi, keanggotaan RT aktif, dan peran di server, lalu RLS sebagai lapisan kedua |
| Waktu | ISO 8601 UTC, contoh `2026-11-18T07:15:00.000Z` |
| ID | UUID v4 untuk entitas, kecuali nomor publik laporan |
| Dokumen terkait | `prd-sulap.md`, `sulap.dbml`, `docs/supabase.md`, `design.md` |

## 1. Aturan umum

1. Semua request yang mengubah data wajib memiliki sesi valid dan keanggotaan `active` pada RT terkait.
2. Peran tidak cukup diperiksa di UI. Setiap endpoint memanggil `requireUser`, lalu `requireActiveMembership`, lalu `requireRole` bila perlu.
3. Endpoint developer hanya menerima peran `developer` dan tidak pernah tersedia untuk admin RT.
4. Semua input divalidasi dengan skema Zod yang sama di klien dan server. Validasi server adalah keputusan akhir.
5. Tidak ada data personal pelapor pada respons yang diterima warga lain.
6. Koordinat presisi hanya dikirim ke pelapor dan admin RT. Warga lain menerima 3 angka desimal (sekitar 110 meter).
7. Semua respons menyertakan `X-Request-Id`. Nilai ini juga dicatat di `audit_logs.request_id` untuk aksi sensitif.
8. Endpoint tulis yang dapat diulang oleh klik ganda atau retry jaringan menerima header `Idempotency-Key` (UUID v4). Kunci berlaku 24 jam.

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

| Kode HTTP | `code` | Arti |
|---:|---|---|
| 400 | `BAD_REQUEST` | Format request tidak dapat dibaca |
| 401 | `UNAUTHENTICATED` | Tidak ada sesi valid |
| 403 | `FORBIDDEN` | Peran tidak mencukupi |
| 403 | `NOT_MEMBER` | Belum menjadi anggota aktif RT |
| 403 | `NOT_REPORTER` | Bukan pelapor laporan |
| 404 | `NOT_FOUND` | Objek tidak ada atau tidak terlihat oleh pemanggil |
| 409 | `CONFLICT_VERSION` | `expectedVersion` tidak cocok |
| 409 | `MEMBERSHIP_EXISTS` | Sudah ada keanggotaan aktif atau pending |
| 409 | `LAST_ADMIN` | Aksi akan menghilangkan admin aktif terakhir |
| 409 | `IDEMPOTENCY_REPLAY` | Kunci dipakai dengan isi request berbeda |
| 413 | `PAYLOAD_TOO_LARGE` | Berkas atau body melebihi batas |
| 415 | `UNSUPPORTED_MEDIA` | Tipe berkas tidak didukung |
| 422 | `VALIDATION_FAILED` | Field tidak valid |
| 422 | `STATUS_NOTE_REQUIRED` | Status tujuan mewajibkan catatan |
| 422 | `CATEGORY_INACTIVE` | Kategori tidak aktif |
| 422 | `INVITE_INVALID` | Kode undangan tidak valid |
| 422 | `INVITE_EXPIRED` | Kode undangan kedaluwarsa atau penuh |
| 429 | `RATE_LIMITED` | Melebihi batas percobaan |
| 500 | `INTERNAL` | Kesalahan tak terduga |

`NOT_FOUND` dipakai juga saat pengguna tidak berhak melihat objek. Ini mencegah kebocoran keberadaan data lintas RT.

### 2.4 Cursor dan filter

- Pagination memakai cursor, bukan nomor halaman.
- `limit` default 20, maksimum 50.
- `cursor` adalah base64 dari `{ "createdAt": "...", "id": "..." }`.
- Urutan default `created_at DESC, id DESC`. Urutan tidak dapat diubah kecuali dinyatakan.
- Filter tanggal memakai `from` dan `to` inklusif dalam UTC.

## 3. Ringkasan endpoint

| Method | Path | Peran | Prioritas |
|---|---|---|---|
| GET | `/me` | Semua | P0 |
| GET | `/me/capabilities` | Semua | P0 |
| POST | `/auth/logout` | Semua | P0 |
| POST | `/uploads` | Warga, Admin | P0 |
| GET | `/reports` | Anggota | P0 |
| POST | `/reports` | Anggota | P0 |
| GET | `/reports/{publicNo}` | Anggota | P0 |
| POST | `/reports/{publicNo}/reopen` | Pelapor | P1 |
| PATCH | `/reports/{publicNo}/status` | Admin RT | P0 |
| POST | `/reports/{publicNo}/inspections` | Admin RT | P0 |
| GET | `/attachments/{id}/url` | Sesuai laporan | P0 |
| GET | `/categories` | Anggota | P0 |
| POST | `/categories` | Admin RT | P0 |
| PATCH | `/categories/{id}` | Admin RT | P0 |
| GET | `/status-definitions` | Anggota | P0 |
| PATCH | `/status-definitions/{id}` | Admin RT | P0 |
| POST | `/memberships/join` | Terautentikasi | P0 |
| GET | `/memberships` | Admin RT | P0 |
| PATCH | `/memberships/{id}` | Admin RT | P0 |
| GET | `/notifications` | Anggota | P0 |
| POST | `/notifications/read` | Anggota | P0 |
| GET | `/notifications/unread-count` | Anggota | P0 |
| GET | `/admin/overview` | Admin RT | P0 |
| GET | `/rt` | Anggota | P0 |
| PATCH | `/rt` | Admin RT | P0 |
| GET | `/rt/invite-codes` | Admin RT | P0 |
| POST | `/rt/invite-codes` | Admin RT | P0 |
| POST | `/rt/invite-codes/{id}/revoke` | Admin RT | P0 |
| GET | `/reports/export` | Admin RT | P1 |
| GET | `/dev/overview` | Developer | P0 |
| GET | `/dev/rts` | Developer | P0 |
| POST | `/dev/rts` | Developer | P0 |
| PATCH | `/dev/rts/{id}` | Developer | P0 |
| GET | `/dev/users` | Developer | P0 |
| PATCH | `/dev/memberships/{id}/role` | Developer | P0 |
| POST | `/dev/reports/{publicNo}/soft-delete` | Developer | P0 |
| POST | `/dev/reports/{publicNo}/restore` | Developer | P0 |
| GET | `/dev/audit-logs` | Developer | P0 |
| GET | `/dev/platform-settings` | Developer | P1 |
| PATCH | `/dev/platform-settings` | Developer | P1 |
| GET | `/health` | Publik | P0 |

## 4. Endpoint

### 4.1 `GET /me`

Mengembalikan profil, keanggotaan RT aktif, dan ringkasan peran. Dipakai setelah login dan pada refresh sesi.

```json
{
  "data": {
    "user": {
      "id": "0f0d2b6a-9f0c-4a3e-9d6a-6a1e5a1a4b11",
      "displayName": "Rani",
      "avatarUrl": null,
      "locale": "id-ID"
    },
    "activeRt": {
      "id": "6c4e1c1a-2b3d-4f5a-8e9d-0a1b2c3d4e5f",
      "name": "RT 01 Melati",
      "slug": "rt-01-melati",
      "role": "resident"
    },
    "memberships": [
      {
        "rtId": "6c4e1c1a-2b3d-4f5a-8e9d-0a1b2c3d4e5f",
        "role": "resident",
        "status": "active"
      }
    ]
  },
  "meta": { "requestId": "req_..." }
}
```

Pengguna tanpa keanggotaan aktif menerima `activeRt: null` dan `onboarding: { "required": true, "rtSlug": "rt-01-melati" }` jika `rtSlug` diketahui dari kode undangan di URL.

### 4.2 `GET /me/capabilities`

Mengembalikan kemampuan yang benar-benar dimiliki pengguna. UI memakai ini untuk menampilkan atau menyembunyikan kontrol, tetapi server tetap memeriksa ulang.

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

### 4.3 `POST /uploads`

Mengunggah satu foto. Body `multipart/form-data` dengan field `file`. Bukan JSON.

Batas: JPEG, PNG, WebP; maksimum 5 MB per berkas; maksimum sisi 4096 px. Server mengecilkan ke maksimum 2000 px, mengubah ke WebP kualitas 82, dan membuang metadata EXIF.

```json
{
  "data": {
    "uploadId": "9a8b7c6d-5e4f-4a3b-8c2d-1e0f2a3b4c5d",
    "path": "inbox/0f0d2b6a/inbox_9a8b7c6d.webp",
    "width": 1600,
    "height": 1200,
    "byteSize": 284310,
    "expiresAt": "2026-11-19T07:15:00.000Z"
  }
}
```

Aturan:

- `uploadId` berlaku 24 jam dan hanya dapat dipakai oleh pengguna yang mengunggah.
- Berkas di `inbox/` dibersihkan setiap hari bila tidak dirujuk laporan.
- Header `Idempotency-Key` dianjurkan. Kunci yang sama mengembalikan hasil yang sama.
- Error `UNSUPPORTED_MEDIA` menyebut format yang diterima. Error `PAYLOAD_TOO_LARGE` menyebut ukuran berkas dan batas.

### 4.4 `GET /reports`

Query:

| Parameter | Tipe | Keterangan |
|---|---|---|
| `q` | string 2..80 | Pencarian judul dan deskripsi, `simple` tsvector |
| `status` | string | Satu atau beberapa kelompok, dipisah koma |
| `categoryId` | uuid | Filter kategori |
| `mine` | boolean | Hanya laporan milik pemanggil |
| `hasLocation` | boolean | Hanya laporan dengan koordinat |
| `from`, `to` | ISO date | Rentang pembuatan |
| `sort` | `newest`, `oldest`, `needs_action` | Default `newest`; `needs_action` hanya admin |
| `limit`, `cursor` | int, string | Pagination |

Respons memakai `v_reports_feed`, bukan tabel dasar.

```json
{
  "data": [
    {
      "id": "c1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8",
      "publicNo": "SULAP-RT01-0042",
      "title": "Saluran air tersumbat di depan gang",
      "excerpt": "Air tidak mengalir sejak hujan kemarin...",
      "category": { "id": "uuid", "name": "Saluran air" },
      "status": { "group": "in_progress", "label": "Dalam penanganan", "color": "#0E6B5C" },
      "locationText": "Gang Melati 2, depan pos ronda",
      "thumbnailUrl": "https://.../sign/...",
      "photoCount": 2,
      "createdAt": "2026-11-17T10:20:00.000Z",
      "updatedAt": "2026-11-18T02:10:00.000Z",
      "isMine": false
    }
  ],
  "meta": {
    "requestId": "req_...",
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTExLTE3VDEwOjIwOjAwLjAwMFoiLCJpZCI6ImMxYTJiM2M0In0"
  }
}
```

`thumbnailUrl` adalah signed URL 10 menit untuk objek turunan 320 px. `isMine` dihitung server, bukan dikirim sebagai identitas pelapor.

### 4.5 `POST /reports`

Membuat laporan. Operasi berjalan di fungsi Postgres `create_report` agar nomor publik, riwayat status awal, lampiran, dan notifikasi admin terjadi dalam satu transaksi.

Header: `Idempotency-Key` wajib.

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
  "uploadIds": ["9a8b7c6d-5e4f-4a3b-8c2d-1e0f2a3b4c5d"]
}
```

Validasi:

| Field | Aturan |
|---|---|
| `categoryId` | Harus milik RT dan `is_active = true` |
| `title` | 8..120 karakter setelah trim |
| `description` | 20..2000 karakter |
| `location.latitude` | -90..90, wajib bila `source` `gps` atau `map_pin` |
| `location.longitude` | -180..180 |
| `location.accuracyM` | 0..5000, opsional |
| `location.text` | 0..200, wajib bila `source` `manual` |
| `uploadIds` | 1..`rts.max_photos`, masing-masing milik pengguna dan belum dipakai |

Respons `201`:

```json
{
  "data": {
    "id": "uuid",
    "publicNo": "SULAP-RT01-0042",
    "status": { "group": "new", "label": "Baru masuk" },
    "createdAt": "2026-11-18T07:20:00.000Z"
  },
  "meta": { "requestId": "req_..." }
}
```

Kegagalan yang mungkin: `CATEGORY_INACTIVE`, `VALIDATION_FAILED`, `RATE_LIMITED` (10 laporan per jam per pengguna), `IDEMPOTENCY_REPLAY`.

### 4.6 `GET /reports/{publicNo}`

Mengembalikan detail sesuai peran.

```json
{
  "data": {
    "id": "uuid",
    "publicNo": "SULAP-RT01-0042",
    "title": "Saluran air tersumbat di depan gang",
    "description": "Air tidak mengalir sejak hujan kemarin dan mulai berbau.",
    "category": { "id": "uuid", "name": "Saluran air" },
    "status": {
      "id": "uuid",
      "group": "in_progress",
      "label": "Dalam penanganan",
      "color": "#0E6B5C"
    },
    "location": {
      "latitude": -6.242,
      "longitude": 106.799,
      "accuracyM": 14.2,
      "source": "gps",
      "text": "Gang Melati 2, depan pos ronda",
      "note": "Dekat tiang listrik nomor 12"
    },
    "attachments": [
      {
        "id": "uuid",
        "kind": "report_evidence",
        "url": "https://.../sign/...",
        "width": 1600,
        "height": 1200,
        "alt": "Saluran air penuh sampah"
      }
    ],
    "timeline": [
      {
        "id": 12,
        "fromLabel": null,
        "toLabel": "Baru masuk",
        "toGroup": "new",
        "actorName": "Warga",
        "note": null,
        "createdAt": "2026-11-17T10:20:00.000Z"
      },
      {
        "id": 13,
        "fromLabel": "Baru masuk",
        "toLabel": "Dalam penanganan",
        "toGroup": "in_progress",
        "actorName": "Budi (Admin RT)",
        "note": "Petugas kebersihan dijadwalkan besok pagi.",
        "createdAt": "2026-11-18T02:10:00.000Z"
      }
    ],
    "inspections": [
      {
        "id": "uuid",
        "findings": "Saluran tersumbat daun dan plastik.",
        "inspectedAt": "2026-11-18T01:00:00.000Z",
        "inspectorName": "Budi (Admin RT)"
      }
    ],
    "actions": {
      "canReopen": true,
      "canChangeStatus": false,
      "canInspect": false,
      "canSoftDelete": false
    },
    "version": 3,
    "createdAt": "2026-11-17T10:20:00.000Z",
    "updatedAt": "2026-11-18T02:10:00.000Z"
  }
}
```

Untuk warga yang bukan pelapor: `location.latitude` dan `location.longitude` dibulatkan 3 desimal, `reporter` tidak ada, `actions.canReopen` false.

Untuk admin: tambahan `reporter: { displayName, avatarUrl }`, `internalNote`, dan `deletedAt` bila soft deleted. Untuk developer: tambahan `deleteReason`.

### 4.7 `PATCH /reports/{publicNo}/status`

Hanya Admin RT. Memanggil `transition_report_status`.

```json
{
  "toStatusId": "uuid",
  "note": "Petugas kebersihan dijadwalkan besok pagi.",
  "resolutionSummary": null,
  "closureReason": null,
  "expectedVersion": 3
}
```

Aturan:

- `toStatusId` harus milik RT yang sama dan `is_active = true`.
- `note` wajib bila status tujuan `requires_note` atau kelompok `resolved` atau `closed`.
- `resolutionSummary` wajib minimal 20 karakter bila kelompok tujuan `resolved`.
- `closureReason` wajib minimal 10 karakter bila kelompok tujuan `closed`.
- `expectedVersion` wajib. Ketidakcocokan menghasilkan `CONFLICT_VERSION` dan UI memuat ulang detail.
- Transisi menulis `report_status_history`, memperbarui `reports.current_status_id` dan `current_status_group`, membuat notifikasi pelapor, dan menulis audit log.
- Status yang sudah nonaktif tidak dapat dipilih.

Respons `200` mengembalikan status baru, `version` baru, dan entri timeline baru.

### 4.8 `POST /reports/{publicNo}/inspections`

Hanya Admin RT. Header `Idempotency-Key` wajib.

```json
{
  "findings": "Saluran tersumbat daun dan plastik sepanjang 4 meter.",
  "inspectedAt": "2026-11-18T01:00:00.000Z",
  "uploadIds": ["uuid"]
}
```

`findings` 20..2000 karakter. `uploadIds` 0..5 dan disimpan sebagai `attachments.kind = inspection`. Inspeksi tidak dapat dihapus; koreksi membuat inspeksi baru.

### 4.9 `POST /reports/{publicNo}/reopen`

Hanya pelapor. Hanya untuk laporan berstatus `resolved` atau `closed`.

```json
{
  "reason": "Saluran tersumbat lagi setelah dua hari.",
  "uploadIds": ["uuid"]
}
```

`reason` 20..500 karakter. Sistem membuat riwayat baru ke kelompok `reopened`, tidak menghapus status atau riwayat sebelumnya, dan mengirim notifikasi ke admin.

### 4.10 `GET /attachments/{id}/url`

Mengembalikan signed URL baru bila halaman dibuka lama.

```json
{
  "data": {
    "url": "https://.../sign/...",
    "expiresAt": "2026-11-18T07:30:00.000Z"
  }
}
```

URL berlaku 600 detik. Endpoint memeriksa akses laporan induk. Objek tidak pernah publik.

### 4.11 Kategori

`GET /categories?includeInactive=false` mengembalikan kategori RT aktif. `includeInactive=true` hanya untuk admin.

`POST /categories`

```json
{
  "name": "Saluran air",
  "description": "Drainase, selokan, dan genangan",
  "sortOrder": 10
}
```

`PATCH /categories/{id}` menerima `name`, `description`, `sortOrder`, `isActive`. Tidak ada `DELETE`. Menonaktifkan kategori tidak mengubah laporan lama atau label historis.

### 4.12 Status definition

`GET /status-definitions?includeInactive=false`.

`PATCH /status-definitions/{id}`

```json
{
  "label": "Sedang diperiksa",
  "colorHex": "#8A5A00",
  "sortOrder": 20
}
```

`group` tidak dapat diubah. Status yang masih direferensikan laporan tidak dapat dihapus; satu-satunya aksi adalah `isActive: false`. Status nonaktif tetap tampil pada riwayat.

### 4.13 Keanggotaan

`POST /memberships/join`

```json
{
  "method": "invite_code",
  "code": "MELATI-7K2Q",
  "rtSlug": null,
  "note": null
}
```

atau

```json
{
  "method": "request",
  "code": null,
  "rtSlug": "rt-01-melati",
  "note": "Saya warga Gang Melati 2, rumah nomor 14."
}
```

Aturan:

- `invite_code` yang valid langsung membuat membership `active` dengan peran `resident`, menaikkan `uses_count`, dan menulis audit.
- `request` membuat membership `pending` dan notifikasi ke admin.
- Percobaan dibatasi 5 per jam per pengguna dan 20 per jam per IP hash.
- Kode disimpan sebagai hash. Kode mentah tidak pernah dikembalikan lagi.

`GET /memberships?status=pending&limit=20` hanya admin RT. Respons memuat `displayName`, `avatarUrl`, `status`, `role`, `joinMethod`, `requestNote`, `createdAt`, tanpa email.

`PATCH /memberships/{id}`

```json
{
  "action": "approve",
  "role": "resident",
  "note": "Terverifikasi lewat buku anggota."
}
```

Aksi yang diterima: `approve`, `reject`, `suspend`, `reinstate`, `remove`. Admin tidak dapat menurunkan peran admin aktif terakhir (`LAST_ADMIN`) dan tidak dapat mengubah perannya sendiri.

### 4.14 Notifikasi

`GET /notifications?unreadOnly=true&limit=20`.

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "report_status_changed",
      "title": "Laporan SULAP-RT01-0042 diperbarui",
      "body": "Status berubah menjadi Dalam penanganan.",
      "reportPublicNo": "SULAP-RT01-0042",
      "readAt": null,
      "createdAt": "2026-11-18T02:10:00.000Z"
    }
  ],
  "meta": { "requestId": "req_...", "nextCursor": null }
}
```

`POST /notifications/read` dengan `{ "ids": ["uuid"] }` atau `{ "all": true }`. Hanya notifikasi milik pemanggil yang berubah.

`GET /notifications/unread-count` mengembalikan `{ "count": 3 }`. Angka berasal dari database, bukan angka contoh.

### 4.15 Dashboard admin

`GET /admin/overview`

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
      {
        "publicNo": "SULAP-RT01-0038",
        "title": "Lampu jalan mati sejak tiga hari",
        "statusGroup": "new",
        "ageHours": 52
      }
    ]
  }
}
```

Semua angka dihitung dari `reports` dengan RT dan filter yang sama. Tidak ada angka dekoratif.

### 4.16 Pengaturan RT dan kode undangan

`GET /rt` untuk anggota: nama, alamat, `photoRequired`, `maxPhotos`, `timezone`. Tidak memuat kode undangan.

`PATCH /rt` untuk admin: `name`, `addressText`, `photoRequired`, `maxPhotos`, `reportPrefix` (hanya developer untuk prefix). Perubahan dicatat di audit log.

`GET /rt/invite-codes` mengembalikan daftar kode dengan `codeMasked: "MELATI-****"`, `usesCount`, `maxUses`, `expiresAt`, `revokedAt`, bukan kode mentah.

`POST /rt/invite-codes` membuat kode baru. Respons memuat `code` mentah satu kali:

```json
{
  "data": {
    "id": "uuid",
    "code": "MELATI-7K2Q",
    "expiresAt": "2026-12-18T07:20:00.000Z",
    "maxUses": 50
  }
}
```

`POST /rt/invite-codes/{id}/revoke` langsung menonaktifkan kode.

### 4.17 Ekspor (P1)

`GET /reports/export?format=csv&from=...&to=...&status=...`

- `format`: `csv` (MVP) atau `xlsx` (P1 lanjutan).
- Respons `text/csv; charset=utf-8` dengan `Content-Disposition`.
- Kolom: nomor, judul, kategori, status, tanggal dibuat, tanggal selesai, lokasi teks, jumlah foto. Tanpa nama pelapor kecuali diminta admin dan tercatat di audit.
- Maksimum 5.000 baris per ekspor. Di atas itu, tampilkan pesan untuk mempersempit filter.

### 4.18 Endpoint developer

`GET /dev/overview`: jumlah RT aktif, pengguna aktif, laporan 30 hari terakhir, dan antrean laporan yang perlu tindakan. Semua dari query nyata.

`GET /dev/rts?q=&cursor=` dan `POST /dev/rts`:

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

`PATCH /dev/rts/{id}` menerima data RT dan `isActive`.

`GET /dev/users?q=` mencari nama tampilan dan email. Email hanya untuk developer.

`PATCH /dev/memberships/{id}/role`

```json
{
  "role": "rt_admin",
  "reason": "Ketua RT baru ditunjuk melalui rapat warga."
}
```

`POST /dev/reports/{publicNo}/soft-delete`

```json
{
  "reason": "Laporan berisi data pribadi yang diminta penghapusan.",
  "confirmPublicNo": "SULAP-RT01-0042"
}
```

`confirmPublicNo` harus sama persis. Aksi menulis `deleted_at`, `deleted_by`, `delete_reason`, audit log, dan notifikasi pelapor.

`POST /dev/reports/{publicNo}/restore` dengan `{ "reason": "..." }`.

`GET /dev/audit-logs?actorId=&action=&entityType=&entityId=&from=&to=&cursor=`. Tidak dapat diedit atau dihapus.

`GET /dev/platform-settings` dan `PATCH /dev/platform-settings` dengan `{ "key": "...", "value": ... }`. Rahasia tidak boleh disimpan di sini.

### 4.19 `GET /health`

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

## 5. Batas laju

| Aksi | Batas | Kunci |
|---|---:|---|
| Membuat laporan | 10 per jam | `user_id` |
| Mengunggah foto | 30 per jam | `user_id` |
| Percobaan kode undangan | 5 per jam | `user_id` |
| Permintaan bergabung | 5 per jam | `user_id` |
| Membuat kode undangan | 10 per hari | `rt_id` |
| Pencarian pengguna developer | 60 per jam | `user_id` |
| Permintaan detail laporan | 300 per jam | `user_id` |

Respons `429` menyertakan header `Retry-After` dalam detik. UI menampilkan waktu tunggu dan tidak mencoba ulang otomatis.

## 6. Idempotensi

- Header `Idempotency-Key` disimpan di `idempotency_keys` bersama hash body.
- Kunci sama dan body sama mengembalikan respons tersimpan.
- Kunci sama dan body berbeda mengembalikan `409 IDEMPOTENCY_REPLAY`.
- Masa berlaku 24 jam.
- Kunci tidak menggantikan transaksi database. Operasi tetap harus atomik.

## 7. Pemetaan API ke fungsi database

| API | Fungsi atau tabel |
|---|---|
| `POST /reports` | `create_report(p_category_id, p_title, p_description, p_location jsonb, p_upload_ids uuid[])` |
| `PATCH /reports/{publicNo}/status` | `transition_report_status(p_report_id, p_to_status_id, p_note, p_resolution_summary, p_closure_reason, p_expected_version)` |
| `POST /reports/{publicNo}/inspections` | `create_inspection(...)` |
| `POST /reports/{publicNo}/reopen` | `reopen_report(...)` |
| `POST /memberships/join` | `join_rt(p_method, p_code, p_rt_slug, p_note)` |
| `PATCH /memberships/{id}` | `decide_membership(p_membership_id, p_action, p_role, p_note)` |
| `POST /dev/reports/{publicNo}/soft-delete` | `soft_delete_report(p_report_id, p_reason)` |
| `GET /reports` | `v_reports_feed` dengan RLS |
| `GET /reports/{publicNo}` | `v_reports_feed`, `v_report_timeline`, `attachments`, `inspections` |

Fungsi yang menulis data memakai `SECURITY DEFINER` dengan `search_path = public, pg_temp`, memeriksa `auth.uid()`, dan tidak menerima `rt_id` dari klien.

## 8. Perubahan kontrak

- Perubahan aditif (field opsional baru, endpoint baru) boleh dalam `v1`.
- Perubahan yang memecah klien wajib menaikkan versi ke `/api/v2` dan mempertahankan `v1` minimal satu siklus rilis.
- Setiap perubahan wajib memperbarui dokumen ini, skema Zod, dan pengujian kontrak dalam commit yang sama.
