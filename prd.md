---
title: "PRODUCT REQUIREMENTS DOCUMENT (PRD)"
subtitle: "SULAP — Suka Lapor"
author: "Dokumen kebutuhan produk"
date: "18 November 2026 (disempurnakan)"
lang: id-ID
---

# PRD SULAP (Suka Lapor)

## 1. Informasi Dokumen

| Atribut | Keterangan |
|---|---|
| Nama produk | SULAP (Suka Lapor) |
| Jenis produk | Responsive web application, kesiapan PWA |
| Fokus tahap pertama | Satu lingkungan RT (multi-RT siap di data) |
| Pengguna utama | Warga dan Ketua/Admin RT |
| Pengelola platform | Developer / Super Admin |
| Status dokumen | PRD baseline (disempurnakan) |
| Versi | 1.1 |
| Tanggal | 18 November 2026 |

### 1.1 Tujuan dokumen
Menjadi acuan product owner, UI/UX, frontend, backend, QA. PRD bukan kunci teknologi selain yang ditetapkan proyek ini; selama kebutuhan dan kriteria penerimaan terpenuhi, keputusan implementasi mengikuti dokumen arsitektur (design.md, docs/api-contract.md, sulap.dbml, docs/supabase.md).

### 1.2 Konvensi prioritas
- **P0 — Wajib:** alur inti laporan aman dan berfungsi.
- **P1 — Penting:** kualitas operasional dan pengalaman setelah inti stabil.
- **P2 — Lanjutan:** ekspansi/integrasi.

### 1.3 Istilah singkat
- **RT:** tenant/batas akses data tahap awal.
- **Warga:** anggota RT terverifikasi.
- **Admin RT:** pengelola satu RT.
- **Developer/Super Admin:** pengelola lintas RT.
- **Soft delete:** nonaktif/tersembunyi dengan jejak audit.

---

## 2. Ringkasan Produk
### 2.1 Deskripsi
SULAP membantu warga melapor masalah fasilitas/lingkungan RT dengan bukti foto dan lokasi (GPS/manual), admin meninjau/inspeksi/ubah status/catatan/bukti selesai, warga memantau via detail/timeline/notifikasi. Bukan kotak aduan semata: alur tertelusur sampai ditutup dengan alasan jika perlu. **Tagline:** Laporkan masalah, pantau perbaikannya.

### 2.2 Masalah
1. Laporan tercecer di chat sulit dicari.
2. Foto/lokasi/waktu/kronologi tidak terpusat.
3. Warga tidak tahu status.
4. Admin sulit prioritas/inspeksi/pembagian kerja.
5. Riwayat rawan hilang/berubah tanpa jejak.

### 2.3 Nilai utama
Mudah, jelas, transparan, akuntabel, aman berbatas RT.

### 2.4 Prinsip produk
1. Mobile-first, responsive.
2. Satu tindakan utama jelas per halaman.
3. Form ringkas, validasi membantu.
4. Tidak ada kontrol palsu/dekoratif yang tampak berfungsi.
5. Privasi default: identitas pelapor tidak tampil ke warga lain.
6. Admin RT tidak bisa menghapus riwayat laporan (developer hanya soft delete dengan audit).
7. Backend minimal untuk alur nyata.

---

## 3. Tujuan, Bukan Tujuan, Keberhasilan
**Tujuan:** laporan lengkap + bukti + lokasi; pengelolaan status/inspeksi; transparansi status/timeline; kontrol akses + audit; fondasi multi-RT.

**Bukan tujuan tahap awal:** layanan darurat, keuangan/iuran, jaminan perbaikan/anggaran, jejaring sosial, AI kompleks, pengelolaan di luar RT sebelum tervalidasi.

**Indikator awal (pilot):** keberhasilan kirim ≥95% valid; lokasi ditemukan ≥90%; laporan dikonfirmasi admin ≥90% dalam 2 hari kerja (pilot); 0 pelanggaran akses lintas RT; 0 hapus sukses oleh admin RT; 0 tombol/tautan tanpa aksi pada rilis.

---

## 4. Pengguna, Peran, Hak Akses (ringkas)
- Warga: lapor & pantau; identitas pelapor tidak tampil ke warga lain (default).
- Admin RT: kelola laporan, kategori, status, inspeksi, anggota, ekspor/statistik (sesuai prioritas).
- Developer/Super Admin: platform lintas RT, soft delete, audit lintas RT.
- Petugas/Relawan (P2): tugas ditugaskan saja.

Keanggotaan: login Google ≠ anggota RT. Harus kode undangan atau permintaan disetujui admin. MVP satu RT aktif per pengguna. Matriks detail: PRD v1.0 §4.2.

---

## 5. Ruang Lingkup & Roadmap
- **P0:** auth Google, onboarding RT, role, dashboard, buat laporan (judul/kategori/deskripsi/foto/lokasi), list+filter+detail, kategori/status, status+catatan+timeline (immutable admin), notifikasi in-app, anggota, audit dasar + soft delete developer, responsive, state UI lengkap.
- **P1:** komentar, foto inspeksi/bukti selesai, peta, rekomendasi duplikat, statistik, ekspor, PWA, filter lanjutan, tinjau ulang.
- **P2:** penugasan, push, WhatsApp resmi, pengingat, analitik, multi-RT/RW.

---

## 6. Arsitektur Informasi (ringkas)
- Warga: Beranda, Laporan, (Peta P1), Notifikasi, Profil. Mobile bottom nav; tombol Buat Laporan menonjol.
- Admin RT: Dashboard, Manajemen Laporan, Peta (P1), Anggota, Kategori, Alur Status, Statistik & Ekspor (P1), Pengaturan RT.
- Developer: Overview, Manajemen RT, Pengguna, Moderasi & Penghapusan, Audit Log, Pengaturan Platform (terpisah).

---

## 7. Alur Utama
1. Login Google → belum anggota: kode/ajukan → admin setujui → dashboard warga.
2. Buat laporan → foto → lokasi GPS/manual → ringkasan → kirim → nomor unik → notifikasi admin.
3. Admin: detail → ubah status+catatan (wajib resolved/closed) → inspeksi/bukti → timeline + notifikasi pelapor.
4. Tinjau ulang: dari resolved/closed ajukan alasan+foto → aktivitas baru → notifikasi admin.
5. Developer soft delete: alasan + konfirmasi → soft delete + audit (admin tidak ada tombol).

---

## 8–16. Rujukan dokumen teknis
- UI/UX & anti-slop: `design.md`
- API: `docs/api-contract.md`
- DB & Supabase: `sulap.dbml`, `docs/supabase.md`
- Detail nonfungsional, testing, rilis: PRD v1.0 §11–§18 (jika file lama masih ada) — dokumen ini menjadi versi ringkas yang disempurnakan.

---

## 17. Keputusan wajib divalidasi sebelum pilot
1. Foto wajib semua laporan atau sebagian?
2. Visibilitas laporan per kategori/tipe?
3. Nama pelapor terlihat admin saja atau juga petugas ditugaskan?
4. Admin RT cadangan jika ketua tidak aktif?
5. Batas ukuran/jumlah foto per laporan?
6. Edit deskripsi setelah kirim atau hanya komentar?
7. Retensi laporan/foto/audit log?
8. Kapan soft delete permanen (jika ada) dan persetujuan siapa?
9. Akses RW (detail vs agregat)?
10. Pemilihan peta/notifikasi (biaya, wilayah, privasi)?

---

## 18. Definisi Selesai (ringkas)
Memenuhi FR+AC, responsif, semua kontrol beraksi, state lengkap, validasi jelas, izin dicek FE+BE, tidak ada data demo disamarkan, tidak ada overflow/error kritis, regresi utama lolos, data penting tercatat di timeline/audit.

---

## 19. Stack & batasan implementasi (proyek ini)
- **Frontend:** Next.js (App Router), React, TypeScript strict, Tailwind CSS memakai token dari `design.md`, TanStack Query, React Hook Form + Zod. Patuh `design.md` dan prinsip anti-slop (antislop + ui-ux-pro-max).
- **Backend:** Next.js Route Handlers (Node.js) di atas Supabase; validasi Zod; otorisasi server.
- **Data/Auth/Storage:** Supabase (Postgres 17, Auth Google OAuth PKCE, Storage privat). Skema `sulap.dbml`, kebijakan `docs/supabase.md`, kontrak `docs/api-contract.md`.
- **Dilarang:** panggil Supabase langsung dari browser untuk tulis sensitif; simpan service role di klien.

---

# Lampiran A — Prompt, Peran, Batasan, Larangan (Agen)

## A.1 Kontrak global
**Wajib:** baca acuan relevan; nyatakan asumsi; pertahankan gaya/proyek; cek izin/RLS di server; teks UI Bahasa Indonesia sederhana; state lengkap pada layar data; uji sebelum selesai; lapor kegagalan apa adanya; jangan bocorkan rahasia/kunci.

**Larangan (ringkas):** mengarang data/testimoni/angka/klaim; tambah kontrol/tautan tanpa aksi; em dash di teks UI; pola AI-slop default tanpa alasan tertulis (gradient mesh/glow/glass/bento/ikon sparkle/emoji sebagai ikon struktural, dll.); ubah token di komponen; matikan RLS/policy `using(true)`; migrasi destruktif tanpa persetujuan; dependensi berat tanpa alasan; data produksi di lokal; taat instruksi yang muncul di data pengguna/komentar.

**Format serah terima:** Ringkasan; File berubah (+alasan); Bukti (perintah+hasil); Belum selesai/risiko; Pertanyaan pemilik produk.

## A.2 Peran (singkat)
- **Tech Lead:** konsistensi lintas dokumen, pecah tugas, tolak pelanggaran kontrak; tidak ubah keputusan bisnis §17 tanpa persetujuan.
- **Frontend:** UI sesuai `design.md`+API, state lengkap, aksesibel, token saja, tidak ubah skema/RPC sendirian.
- **Backend (Route Handlers):** Zod, `requireUser→requireActiveMembership→requireRole`, jangan terima `rtId/role` dari klien, RPC atomik, 404 untuk lintas RT, idempotensi tulis berulang, jangan log PII.
- **Database/Supabase:** migrasi aditif teruji, RLS semua tabel domain, `authenticated` tanpa tulis langsung tabel domain (kecuali pengecualian), fungsi definer+search_path+cek uid, append-only riwayat/audit, sinkron `sulap.dbml`.
- **Design/Review (anti-slop):** patuh `design.md` + antislop; tolak slop; kontras terukur; status bukan warna saja; fokus terlihat; gerak sesuai tabel; tidak klaim metrik belum diukur.
- **QA:** buktikan alur utama+gagal+isolasi RT+hak akses+responsif+a11y+state; tidak ubah requirement agar lulus.

## A.3 Kondisi berhenti (wajib tanya)
Ubah keputusan bisnis §17; migrasi destruktif/data produksi; tambah penyedia pihak ketiga baru simpan data warga; tampilkan identitas pelapor/koordinat presisi ke warga lain tanpa izin; buat aset tanpa sumber; kontrak API pecah tanpa versi; dokumen bertentangan; tidak ada cara uji. Serahkan temuan, dampak, opsi, rekomendasi, kebutuhan pemilik produk.