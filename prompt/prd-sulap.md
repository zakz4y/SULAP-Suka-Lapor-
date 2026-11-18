---
title: "PRODUCT REQUIREMENTS DOCUMENT (PRD)"
subtitle: "SULAP — Suka Lapor"
author: "Dokumen kebutuhan produk"
date: "18 November 2026"
lang: id-ID
---

# 1. Informasi Dokumen

| Atribut | Keterangan |
|---|---|
| Nama produk | SULAP (Suka Lapor) |
| Jenis produk | Responsive web application, dengan kesiapan PWA |
| Fokus tahap pertama | Satu lingkungan RT |
| Pengguna utama | Warga dan Ketua/Admin RT |
| Pengelola platform | Developer / Super Admin |
| Status dokumen | PRD — baseline kebutuhan produk |
| Versi | 1.0 |
| Tanggal | 18 November 2026 |

## 1.1 Tujuan dokumen

Dokumen ini mendefinisikan kebutuhan produk SULAP sebagai acuan bagi product owner, UI/UX designer, frontend developer, backend developer, dan tester. PRD menjelaskan masalah yang diselesaikan, target pengguna, ruang lingkup, perilaku fitur, aturan bisnis, standar antarmuka, kriteria penerimaan, serta tahapan pengembangan.

PRD ini bukan dokumen implementasi teknologi yang mengunci framework, database, atau penyedia layanan tertentu. Tim dapat memilih teknologi yang sesuai selama seluruh kebutuhan dan kriteria penerimaan terpenuhi.

## 1.2 Konvensi prioritas

- **P0 — Wajib:** fitur inti agar proses pelaporan RT dapat berjalan dengan aman.
- **P1 — Penting:** meningkatkan kualitas pengelolaan dan pengalaman pengguna setelah alur inti stabil.
- **P2 — Lanjutan:** fitur ekspansi dan integrasi yang tidak menghambat peluncuran awal.

## 1.3 Istilah

- **RT:** ruang lingkungan/tenant yang menjadi batas akses data pada tahap awal.
- **Warga:** pengguna yang sudah terverifikasi sebagai anggota RT.
- **Admin RT:** pengurus yang mengelola laporan dan konfigurasi satu RT.
- **Developer/Super Admin:** pengelola platform dengan kewenangan lintas RT.
- **Laporan:** satu catatan masalah fasilitas atau lingkungan beserta bukti dan lokasi.
- **Timeline:** riwayat kronologis perubahan dan aktivitas pada laporan.
- **Soft delete:** penonaktifan/penyembunyian data tanpa menghilangkan jejak audit.

# 2. Ringkasan Produk

## 2.1 Deskripsi

SULAP (Suka Lapor) adalah aplikasi pelaporan dan pemantauan masalah fasilitas serta lingkungan di tingkat masyarakat. Warga dapat membuat laporan melalui web dengan melampirkan judul, kategori, deskripsi, foto, dan lokasi GPS yang dapat dikoreksi secara manual pada peta. Admin RT meninjau laporan, melakukan inspeksi, mengubah status, menambahkan catatan, menugaskan petugas, dan mencatat bukti penyelesaian. Warga dapat mengikuti perkembangan melalui halaman detail, timeline, serta notifikasi.

SULAP bukan sekadar kotak aduan digital. Produk harus membentuk alur yang dapat ditelusuri dari laporan dibuat sampai ditutup, termasuk alasan ketika laporan tidak dapat ditindaklanjuti.

**Tagline:** Laporkan masalah, pantau perbaikannya.

## 2.2 Masalah yang ingin diselesaikan

1. Laporan masalah lingkungan tersebar di percakapan dan komunikasi informal sehingga sulit dicari kembali.
2. Informasi penting seperti foto, lokasi, waktu, dan kronologi sering tidak terkumpul dalam satu catatan.
3. Warga tidak selalu mengetahui apakah laporan sudah diterima, diperiksa, atau ditangani.
4. Admin kesulitan memprioritaskan laporan, mencatat hasil inspeksi, dan membagi pekerjaan.
5. Laporan serta riwayat penanganan berisiko hilang atau berubah tanpa rekam jejak.

## 2.3 Nilai utama

- **Mudah:** membuat laporan dengan langkah sesingkat mungkin.
- **Jelas:** status, catatan, dan lokasi dapat dipahami.
- **Transparan:** perkembangan dan bukti penanganan terdokumentasi.
- **Akuntabel:** perubahan penting memiliki pelaku, waktu, dan riwayat.
- **Terbatas dengan aman:** data satu RT tidak terbuka bagi RT lain.

## 2.4 Prinsip produk

1. Mobile-first dan responsive; pengalaman di ponsel tidak boleh menjadi versi yang dikorbankan.
2. Satu tindakan utama yang jelas pada setiap halaman.
3. Form laporan ringkas, dengan validasi yang membantu, bukan menghambat.
4. Tidak ada tombol dekoratif atau interaksi palsu. Setiap kontrol harus bekerja, atau dinonaktifkan dengan alasan yang jelas.
5. Privasi sebagai default: identitas pelapor tidak ditampilkan kepada warga lain.
6. Riwayat laporan tidak dapat dihapus oleh Admin RT.
7. Pengembangan bertahap; backend dibatasi pada kemampuan minimum yang dibutuhkan untuk alur nyata.

# 3. Tujuan, Bukan Tujuan, dan Ukuran Keberhasilan

## 3.1 Tujuan produk

- Memungkinkan warga mengirim laporan lengkap dengan bukti foto dan lokasi.
- Membantu admin menerima, memeriksa, memprioritaskan, dan menindaklanjuti laporan.
- Memberikan informasi status dan riwayat yang dapat dipahami pelapor.
- Menjaga kontrol akses, privasi anggota, dan jejak audit.
- Menyediakan fondasi data yang dapat diperluas dari satu RT ke beberapa RT dan RW.

## 3.2 Bukan tujuan tahap awal

- Menjadi kanal tanggap darurat atau pengganti layanan darurat resmi.
- Menyediakan sistem keuangan, iuran, kas RT, atau pembayaran.
- Menjamin masalah selalu diperbaiki atau menyediakan anggaran perbaikan.
- Menjadi jejaring sosial umum atau aplikasi percakapan bebas.
- Menjalankan analisis AI kompleks atau pengambilan keputusan otomatis.
- Mengelola struktur pemerintahan di luar RT sebelum kebutuhan RT tervalidasi.

## 3.3 Indikator keberhasilan

Target numerik awal berikut adalah target pilot yang perlu dikalibrasi setelah penggunaan nyata.

| Indikator | Target awal |
|---|---|
| Keberhasilan pengiriman laporan | ≥ 95% dari upaya pengiriman valid |
| Laporan dengan lokasi yang dapat ditemukan | ≥ 90% |
| Laporan yang mendapat status awal/konfirmasi admin | ≥ 90% dalam 2 hari kerja |
| Keberhasilan menyelesaikan alur laporan pada ponsel | ≥ 95% pada skenario uji |
| Pelanggaran akses lintas RT | 0 kasus yang diketahui |
| Aksi hapus laporan oleh Admin RT | 0 aksi berhasil |
| Tombol/tautan tanpa aksi yang jelas | 0 pada halaman yang dirilis |

Metrik harus dibaca sebagai ukuran kualitas penggunaan, bukan janji bahwa semua masalah fisik dapat diselesaikan dalam batas waktu tertentu.

# 4. Pengguna, Peran, dan Hak Akses

## 4.1 Persona

### Warga

Ingin melaporkan masalah dari HP dengan cepat, tidak ingin mengisi formulir panjang, dan ingin mengetahui apakah laporan ditangani. Kemampuan teknis pengguna dapat beragam.

### Admin RT / Ketua RT

Membutuhkan satu tempat untuk melihat laporan, memeriksa bukti, mengatur kategori dan status, mencatat inspeksi, memberi tugas, serta memberi kabar kepada warga.

### Developer / Super Admin

Mengelola konfigurasi platform, akun dan struktur RT, menangani penyalahgunaan atau permintaan penghapusan khusus, serta memeriksa audit log.

### Petugas / Relawan (opsional pada tahap lanjutan)

Menerima penugasan dan memperbarui progres pekerjaan yang menjadi tanggung jawabnya. Tidak memiliki kewenangan administrasi RT.

## 4.2 Matriks hak akses

| Kemampuan | Warga | Admin RT | Developer |
|---|:---:|:---:|:---:|
| Login Google | Ya | Ya | Ya |
| Melihat laporan pada RT sendiri | Ya | Ya | Ya |
| Membuat laporan | Ya | Ya | Ya |
| Melihat identitas pelapor | Hanya milik sendiri* | Ya, sesuai kebutuhan | Terbatas sesuai tugas |
| Mengubah isi laporan setelah dikirim | Tambah informasi/komentar; tidak mengubah jejak awal | Tidak mengubah isi asli; dapat menambahkan catatan | Tindakan khusus tercatat |
| Mengubah status laporan | Tidak | Ya | Dapat melakukan tindakan platform terbatas |
| Inspeksi dan bukti penanganan | Tidak | Ya | Tidak untuk operasional normal |
| Mengatur kategori dan alur status RT | Tidak | Ya | Dapat membantu pemulihan konfigurasi |
| Mengelola anggota RT | Tidak | Ya | Ya, lintas platform |
| Menugaskan petugas | Tidak | Ya (P1/P2) | Tidak untuk operasional normal |
| Menghapus laporan | Tidak | **Tidak** | Ya, melalui proses terbatas dan audit |
| Melihat audit log | Tidak | Log aktivitas RT yang relevan | Ya, lintas platform |

\* Identitas pelapor disembunyikan dari warga lain secara default. Admin dapat melihat identitas untuk verifikasi dan tindak lanjut. Developer hanya mengakses data personal apabila diperlukan untuk dukungan, keamanan, atau tugas administratif yang sah.

## 4.3 Keanggotaan RT

- Login Google hanya membuktikan identitas akun Google, bukan otomatis membuktikan keanggotaan RT.
- Pengguna harus memasukkan kode undangan RT atau mengirim permintaan bergabung.
- Admin menyetujui atau menolak permintaan keanggotaan.
- Sebelum disetujui, pengguna hanya boleh melihat halaman onboarding dan informasi yang tidak sensitif.
- Setiap akun dapat memiliki relasi ke satu atau lebih RT pada masa depan, tetapi MVP hanya mengaktifkan satu RT utama per pengguna untuk menyederhanakan pengalaman.
- Perubahan peran dan status keanggotaan dicatat.

# 5. Ruang Lingkup dan Roadmap Fitur

## 5.1 MVP — P0

MVP harus dapat menjalankan siklus laporan dari awal hingga selesai.

1. Login Google dan logout.
2. Onboarding RT: kode undangan atau permintaan persetujuan.
3. Peran Warga, Admin RT, dan Developer.
4. Dashboard sesuai peran.
5. Membuat laporan: judul, kategori, deskripsi, foto, lokasi GPS/manual.
6. Daftar laporan, pencarian dasar, filter status/kategori, dan detail.
7. Pengaturan kategori dan status oleh Admin RT.
8. Perubahan status, catatan admin, dan timeline yang tidak dapat dihapus oleh admin.
9. Pusat notifikasi dalam aplikasi.
10. Pengelolaan anggota RT.
11. Audit log dasar dan mekanisme soft delete developer.
12. Antarmuka responsive untuk ponsel, tablet, dan desktop.
13. Status loading, empty, error, validasi, dan konfirmasi untuk semua alur utama.

## 5.2 Penguatan operasional — P1

- Komentar atau informasi tambahan pada laporan.
- Foto inspeksi dan foto setelah perbaikan.
- Tampilan peta seluruh laporan.
- Deteksi laporan serupa sebagai rekomendasi, bukan penggabungan otomatis.
- Statistik ringkas untuk admin.
- Ekspor laporan PDF dan Excel.
- PWA: instalasi ke layar utama dan pengalaman aplikasi web yang lebih baik.
- Filter lanjutan berdasarkan rentang tanggal, kategori, dan status.
- Permintaan tinjau ulang dari warga bila masalah belum selesai atau muncul kembali.

## 5.3 Pengembangan lanjutan — P2

- Penugasan laporan ke petugas/relawan.
- Notifikasi push browser.
- Integrasi WhatsApp melalui penyedia resmi dan berdasarkan persetujuan penerima.
- Pengingat laporan yang belum ditinjau.
- Analisis tren dan peta kepadatan masalah.
- Multi-RT dan pengelolaan RW.
- Peran pengelola RW dengan akses ringkasan lintas RT sesuai kewenangan.
- Pengaturan SLA internal atau target tindak lanjut per kategori, jika disepakati RT.

# 6. Arsitektur Informasi dan Navigasi

## 6.1 Navigasi Warga

- **Beranda:** ringkasan, tombol Buat Laporan, dan laporan terbaru.
- **Laporan:** daftar laporan RT dengan pencarian dan filter.
- **Peta:** lokasi laporan (P1).
- **Notifikasi:** pembaruan status, komentar, dan informasi penting.
- **Profil:** data akun, keanggotaan RT, preferensi, dan keluar.

Pada layar mobile, navigasi utama menggunakan bottom navigation atau pola ringkas yang setara. Tombol Buat Laporan harus mudah ditemukan tanpa menutupi konten.

## 6.2 Navigasi Admin RT

- **Dashboard:** ringkasan dan laporan yang perlu perhatian.
- **Manajemen Laporan:** daftar, filter, detail, inspeksi, status, dan penugasan.
- **Peta Laporan:** persebaran masalah (P1).
- **Anggota:** persetujuan dan pengelolaan keanggotaan.
- **Kategori:** tambah, ubah, urutkan, dan nonaktifkan kategori.
- **Alur Status:** kelola label, warna, urutan, dan kelompok status.
- **Statistik & Ekspor:** ringkasan dan unduh data (P1).
- **Pengaturan RT:** nama tampilan, alamat/keterangan wilayah, kode undangan, dan preferensi notifikasi.

## 6.3 Navigasi Developer

- **Overview Platform:** ringkasan jumlah RT, akun, dan laporan.
- **Manajemen RT:** membuat, mengubah, menonaktifkan, dan menunjuk admin RT.
- **Pengguna:** pencarian akun dan penyesuaian peran.
- **Moderasi & Penghapusan:** penanganan konten yang melanggar kebijakan.
- **Audit Log:** riwayat tindakan sensitif.
- **Pengaturan Platform:** konfigurasi umum.

Developer dashboard dipisahkan dari dashboard operasional RT dan tidak boleh menjadi jalur navigasi yang terlihat oleh warga.

# 7. Alur Pengguna Utama

## 7.1 Login dan bergabung dengan RT

1. Pengguna membuka SULAP.
2. Pengguna memilih **Masuk dengan Google**.
3. Sistem memvalidasi sesi dan mengambil identitas dasar yang diizinkan.
4. Jika belum menjadi anggota RT, pengguna diminta memasukkan kode RT atau mengajukan keanggotaan.
5. Jika menggunakan permintaan, admin menerima notifikasi untuk menyetujui/menolak.
6. Setelah disetujui, pengguna diarahkan ke dashboard Warga.
7. Pengguna yang sudah terdaftar langsung masuk ke dashboard sesuai perannya.

## 7.2 Membuat laporan

1. Warga memilih **Buat Laporan**.
2. Warga mengisi judul, kategori, dan deskripsi.
3. Warga menambahkan satu atau beberapa foto.
4. Sistem meminta izin lokasi; bila diizinkan, sistem mengambil koordinat dan akurasi.
5. Warga dapat menggeser pin atau memasukkan lokasi secara manual jika GPS ditolak/tidak akurat.
6. Sistem menampilkan ringkasan sebelum kirim.
7. Setelah dikirim, sistem membuat nomor laporan unik dan menampilkan konfirmasi.
8. Laporan masuk ke daftar RT dan admin memperoleh notifikasi.

## 7.3 Admin meninjau dan menangani laporan

1. Admin membuka daftar laporan baru.
2. Admin membaca detail, foto, dan lokasi.
3. Admin memilih status yang tersedia dan menambahkan catatan bila diperlukan.
4. Jika membutuhkan pengecekan lapangan, admin mengisi hasil inspeksi.
5. Admin dapat menugaskan petugas pada tahap yang mendukung penugasan.
6. Saat selesai, admin wajib mengisi ringkasan penyelesaian; foto bukti dianjurkan.
7. Sistem menambahkan aktivitas ke timeline dan mengirim notifikasi kepada pelapor.

## 7.4 Warga meminta tinjau ulang

1. Warga membuka laporan yang berstatus selesai atau ditutup.
2. Warga memilih **Masalah belum selesai** atau **Ajukan tinjau ulang**.
3. Warga mengisi alasan dan dapat menambahkan foto terbaru.
4. Sistem mencatat permintaan sebagai aktivitas baru; sistem tidak menghapus status atau riwayat sebelumnya.
5. Admin menerima notifikasi dan memutuskan tindak lanjut.

## 7.5 Developer menghapus laporan

1. Developer membuka laporan dan memilih tindakan hapus.
2. Sistem meminta alasan wajib dan konfirmasi eksplisit.
3. Sistem menjalankan soft delete; data tidak langsung dihapus permanen.
4. Audit log mencatat identitas developer, waktu, objek, dan alasan.
5. Admin RT tidak memperoleh tombol atau endpoint untuk melakukan penghapusan.
6. Pemulihan atau penghapusan permanen, bila diperlukan, mengikuti prosedur terpisah dan dicatat.

# 8. Kebutuhan Fungsional

Setiap kebutuhan memiliki ID untuk memudahkan pelacakan implementasi dan pengujian.

## 8.1 Autentikasi dan keanggotaan

- **FR-AUTH-01 (P0):** Pengguna dapat masuk menggunakan Google OAuth.
  - Kriteria: alur sukses mengarahkan pengguna ke halaman sesuai peran; pembatalan atau kegagalan menampilkan pesan yang jelas.
- **FR-AUTH-02 (P0):** Pengguna dapat keluar dan mengakhiri sesi.
  - Kriteria: setelah logout, halaman terlindungi tidak dapat diakses tanpa login kembali.
- **FR-MEM-01 (P0):** Pengguna dapat bergabung menggunakan kode undangan RT.
  - Kriteria: kode valid menghubungkan pengguna ke RT yang benar; kode tidak valid/expired memberi pesan yang dapat ditindaklanjuti.
- **FR-MEM-02 (P0):** Admin dapat menyetujui atau menolak permintaan keanggotaan.
  - Kriteria: perubahan status anggota tercatat dan pengguna memperoleh pemberitahuan.
- **FR-MEM-03 (P0):** Sistem menerapkan peran dan batas wilayah pada seluruh halaman serta data.
  - Kriteria: pengguna dari RT lain tidak dapat membuka laporan melalui URL langsung maupun manipulasi request.

## 8.2 Laporan

- **FR-REP-01 (P0):** Warga dapat membuat laporan dengan judul, kategori, deskripsi, foto, dan lokasi.
  - Kriteria: field wajib tervalidasi; laporan valid memperoleh nomor unik dan muncul pada daftar RT.
- **FR-REP-02 (P0):** Form laporan mendukung lebih dari satu foto sesuai batas unggah yang ditetapkan produk.
  - Kriteria: format/ukuran yang tidak didukung ditolak dengan pesan; progres unggah terlihat; kegagalan dapat dicoba kembali.
- **FR-REP-03 (P0):** Sistem menyediakan lokasi GPS dan pemilihan lokasi manual.
  - Kriteria: izin GPS ditolak tidak memblokir pengiriman; lokasi manual dapat dipilih; koordinat dan akurasi disimpan bila tersedia.
- **FR-REP-04 (P0):** Warga dapat melihat laporan di RT-nya.
  - Kriteria: tersedia list, detail, pencarian dasar, dan filter; identitas pelapor warga lain tidak ditampilkan.
- **FR-REP-05 (P0):** Sistem mempertahankan isi awal laporan sebagai rekaman historis.
  - Kriteria: perubahan atau tambahan informasi tidak menimpa data awal tanpa jejak; setiap perubahan signifikan dicatat.
- **FR-REP-06 (P1):** Sistem menyarankan laporan serupa berdasarkan kategori, waktu, dan kedekatan lokasi.
  - Kriteria: rekomendasi ditampilkan sebelum submit atau kepada admin; sistem tidak menggabungkan laporan secara otomatis.
- **FR-REP-07 (P1):** Warga dapat mengajukan tinjau ulang.
  - Kriteria: alasan dan bukti tambahan dicatat sebagai aktivitas baru serta dikirim ke admin.

## 8.3 Pengelolaan status dan inspeksi

- **FR-STS-01 (P0):** Admin dapat mengubah status laporan melalui alur status RT.
  - Kriteria: status baru tercatat dengan aktor, waktu, status sebelumnya, dan status berikutnya.
- **FR-STS-02 (P0):** Admin dapat mengelola label, warna, urutan, dan status aktif.
  - Kriteria: status yang sudah dipakai laporan historis tidak mengubah tampilan riwayat secara retroaktif; status tidak dapat dihapus jika masih direferensikan.
- **FR-STS-03 (P0):** Status memiliki kelompok internal baku: Baru, Ditinjau, Inspeksi, Diproses, Selesai, Ditutup, dan Tinjau Ulang.
  - Kriteria: admin boleh mengganti label tetapi pemetaan kelompok internal tetap menjaga konsistensi dashboard dan statistik.
- **FR-INS-01 (P0):** Admin dapat menulis catatan inspeksi.
  - Kriteria: catatan memiliki waktu, penulis, dan relasi ke laporan serta muncul pada timeline.
- **FR-INS-02 (P1):** Admin dapat melampirkan foto inspeksi dan bukti penyelesaian.
  - Kriteria: foto ditampilkan sebagai bukti terpisah dari foto awal pelapor.
- **FR-INS-03 (P0):** Admin wajib mengisi catatan ketika memilih status Selesai atau Ditutup.
  - Kriteria: perubahan ditolak bila alasan/ringkasan wajib kosong.

## 8.4 Komunikasi dan notifikasi

- **FR-COM-01 (P1):** Warga dan admin dapat menambahkan komentar atau informasi tambahan pada laporan.
  - Kriteria: komentar memiliki waktu dan penulis; pengguna dapat melaporkan konten; komentar tidak mengubah data inti laporan.
- **FR-COM-02 (P1):** Admin dapat memoderasi komentar yang melanggar aturan.
  - Kriteria: tindakan moderasi tercatat; komentar yang disembunyikan menampilkan penanda moderasi yang sesuai.
- **FR-NOT-01 (P0):** Sistem menyediakan pusat notifikasi dalam aplikasi.
  - Kriteria: notifikasi dibuat untuk laporan baru kepada admin, dan pembaruan relevan kepada pelapor; status baca/tidak dibaca berfungsi.
- **FR-NOT-02 (P1):** Sistem mendukung push notification browser jika pengguna memberi izin.
  - Kriteria: penolakan izin tidak mengganggu pusat notifikasi dalam aplikasi.
- **FR-NOT-03 (P2):** Sistem dapat mengirim WhatsApp melalui penyedia resmi.
  - Kriteria: pengiriman hanya kepada nomor yang memberikan persetujuan; kegagalan dicatat; kanal aplikasi tetap menjadi sumber informasi utama.

## 8.5 Penugasan, peta, statistik, dan ekspor

- **FR-ASG-01 (P2):** Admin dapat menugaskan laporan kepada petugas/relawan.
  - Kriteria: penugasan menyimpan penerima, tugas, waktu, dan status; petugas hanya melihat tugas yang diizinkan.
- **FR-MAP-01 (P1):** Pengguna dapat melihat peta laporan RT.
  - Kriteria: marker mengikuti lokasi laporan; filter daftar diterapkan pada peta; laporan tanpa koordinat tetap dapat ditemukan di list.
- **FR-STAT-01 (P1):** Admin dapat melihat statistik ringkas laporan.
  - Kriteria: angka dapat difilter periode dan kelompok status; total statistik konsisten dengan daftar pada filter yang sama.
- **FR-EXP-01 (P1):** Admin dapat mengekspor laporan ke PDF atau Excel.
  - Kriteria: ekspor mengikuti filter yang dipilih, memuat kolom yang relevan, dan tidak membocorkan data personal yang tidak diperlukan.
- **FR-RW-01 (P2):** Platform mendukung struktur beberapa RT dalam satu RW.
  - Kriteria: tiap RT memiliki admin dan data terpisah; pengelola RW hanya melihat ringkasan sesuai kewenangan yang ditetapkan.

## 8.6 Administrasi platform

- **FR-DEV-01 (P0):** Developer dapat membuat dan mengelola RT serta menunjuk admin.
  - Kriteria: perubahan struktur dan peran tercatat dalam audit log.
- **FR-DEV-02 (P0):** Developer dapat melakukan soft delete laporan dengan alasan wajib.
  - Kriteria: tindakan memerlukan konfirmasi; data ditandai nonaktif; audit log memuat pelaku, objek, waktu, dan alasan.
- **FR-DEV-03 (P0):** Admin RT tidak memiliki kemampuan menghapus laporan.
  - Kriteria: tidak ada tombol hapus bagi admin; backend menolak percobaan melalui request langsung.
- **FR-DEV-04 (P0):** Developer dapat melihat audit log platform sesuai kebutuhan operasional.
  - Kriteria: log dapat difilter berdasarkan aktor, tindakan, objek, dan rentang tanggal; log tidak dapat diedit oleh admin RT.

# 9. Aturan Bisnis

1. Setiap laporan dimiliki tepat oleh satu RT.
2. Setiap laporan memiliki ID internal dan nomor publik unik dalam format yang dapat dikonfigurasi, misalnya `SULAP-RT01-0001`.
3. Laporan baru minimal memuat judul, kategori, deskripsi, dan lokasi; foto diwajibkan pada kebijakan awal, tetapi sistem harus menampilkan alasan jelas bila ukuran atau format gagal. Kebijakan apakah foto wajib dapat dikonfigurasi sebelum pilot.
4. Laporan yang dikirim tidak dapat dihapus oleh warga maupun Admin RT.
5. Admin dapat mengubah status dan menambahkan catatan, tetapi tidak dapat menghilangkan riwayat sebelumnya.
6. Developer hanya menghapus melalui soft delete dengan alasan dan audit log.
7. Status Selesai harus memiliki ringkasan penyelesaian. Foto bukti penyelesaian dianjurkan.
8. Status Ditutup/Tidak Dapat Ditindaklanjuti harus memiliki alasan yang dapat dilihat pelapor.
9. Warga dapat meminta tinjau ulang; permintaan tidak menghapus status atau riwayat sebelumnya.
10. Label status dapat dikustomisasi, tetapi kelompok internal dan aturan transisi harus tetap konsisten.
11. Kategori yang dinonaktifkan tidak tersedia untuk laporan baru, tetapi tetap tampil pada laporan lama.
12. Identitas pelapor tidak terlihat oleh warga lain secara default.
13. Data RT harus terisolasi di antarmuka dan pada lapisan otorisasi server.
14. Notifikasi eksternal tidak boleh menjadi satu-satunya tempat menyimpan informasi penting.
15. SULAP bukan layanan darurat; halaman pelaporan harus menyampaikan peringatan untuk menghubungi layanan darurat yang relevan pada situasi mendesak.
16. Deteksi laporan serupa hanya rekomendasi. Penggabungan, penutupan duplikat, atau pengaitan laporan harus dilakukan admin dan tetap menyimpan referensi.

# 10. Status dan Siklus Hidup Laporan

## 10.1 Status default

| Kelompok internal | Label awal | Makna |
|---|---|---|
| Baru | Baru Masuk | Laporan baru diterima sistem |
| Ditinjau | Sedang Ditinjau | Admin sedang memeriksa informasi |
| Inspeksi | Perlu Inspeksi | Perlu pemeriksaan langsung/lapangan |
| Diproses | Dalam Penanganan | Tindak lanjut sedang berjalan |
| Selesai | Selesai | Penanganan dinyatakan selesai oleh admin |
| Ditutup | Tidak Dapat Ditindaklanjuti | Laporan ditutup dengan alasan |
| Tinjau Ulang | Perlu Tinjau Ulang | Warga meminta pemeriksaan ulang atau masalah muncul kembali |

## 10.2 Aturan transisi

- Transisi normal bergerak dari Baru ke Ditinjau, Inspeksi atau Diproses, lalu Selesai atau Ditutup.
- Admin dapat melewati tahap jika alasan dicatat, misalnya laporan sederhana langsung ditangani.
- Laporan Selesai dapat dibuka kembali melalui permintaan tinjau ulang yang disetujui admin.
- Perubahan status yang tidak biasa harus meminta catatan alasan.
- Status yang telah dinonaktifkan tidak boleh menghilangkan label historis pada timeline.

# 11. Kebutuhan UI/UX dan Standar Responsif

## 11.1 Prinsip visual

- Tampilan bersih, modern, ramah warga, dan tidak menyerupai panel administrasi yang rumit.
- Gunakan hierarki tipografi yang konsisten: judul halaman, judul bagian, teks isi, label, dan keterangan.
- Gunakan sistem spacing, ukuran radius, warna, border, dan elevasi yang konsisten melalui design tokens.
- Warna status harus konsisten dan selalu disertai teks, bukan warna saja.
- Hindari penggunaan badge berlebihan, modal bertumpuk, animasi dekoratif, dan kartu yang terlalu padat.
- Komponen form, tabel, kartu, menu, dialog, toast, dan pagination harus memiliki state lengkap.

## 11.2 Breakpoint dan perilaku layout

Breakpoint final ditetapkan saat desain, tetapi minimal harus diuji pada lebar berikut:

| Kategori | Lebar uji | Perilaku yang diharapkan |
|---|---:|---|
| Mobile kecil | 320–360 px | Satu kolom, tidak ada horizontal overflow, tombol mudah disentuh |
| Mobile umum | 375–430 px | Navigasi ringkas, form nyaman, kartu tidak terpotong |
| Tablet | 768–1024 px | Konten dapat memakai dua kolom bila relevan; sidebar dapat diciutkan |
| Desktop | 1280 px ke atas | Sidebar dan konten utama proporsional; tabel memiliki ruang memadai |

## 11.3 Ketentuan interaksi

- Setiap tombol memiliki aksi yang nyata dan label yang spesifik.
- Tombol submit menampilkan loading dan mencegah pengiriman ganda.
- Aksi destruktif meminta konfirmasi dan menjelaskan konsekuensinya.
- Kontrol nonaktif menampilkan alasan bila alasan tidak jelas dari konteks.
- Form mempertahankan input yang sudah diisi ketika terjadi kesalahan yang dapat dipulihkan.
- Pesan error menyebutkan apa yang salah dan cara memperbaikinya.
- Modal dapat ditutup dengan tombol yang jelas; klik luar/tekan Escape mengikuti jenis dialog dan tidak boleh menyebabkan kehilangan input tanpa peringatan.
- Dropdown, tooltip, popover, date picker, peta, dan upload harus dapat digunakan pada layar sentuh.

## 11.4 State antarmuka wajib

Setiap halaman/komponen yang memuat data harus memiliki state:

1. **Loading:** skeleton atau indikator yang sesuai.
2. **Success:** data tampil dan tindakan lanjutan jelas.
3. **Empty:** pesan yang menjelaskan kondisi dan CTA relevan.
4. **Error:** pesan ramah, tidak teknis, serta opsi coba lagi bila memungkinkan.
5. **Permission denied:** penjelasan untuk GPS, notifikasi, atau akses lain yang ditolak.
6. **Offline/connection lost:** informasi status dan perlindungan terhadap kehilangan input.
7. **Submitting:** indikator proses dan pencegahan klik berulang.

## 11.5 Aksesibilitas

- Kontras teks dan komponen harus memadai.
- Semua input memiliki label yang dapat dibaca teknologi bantu.
- Navigasi dapat dilakukan dengan keyboard.
- Fokus keyboard terlihat jelas.
- Ikon tanpa teks memiliki accessible name.
- Status tidak dibedakan menggunakan warna saja.
- Target sentuh mobile cukup besar dan memiliki jarak yang memadai.

# 12. Kebutuhan Nonfungsional

| Area | Persyaratan |
|---|---|
| Responsif | Fungsi inti berjalan pada mobile, tablet, dan desktop tanpa overflow horizontal yang tidak disengaja. |
| Performa | Halaman utama dan daftar laporan dioptimalkan; gambar memakai thumbnail/kompresi dan lazy loading sesuai kebutuhan. |
| Keamanan | Autentikasi aman, otorisasi berbasis peran dan RT, validasi server, proteksi file, serta pembatasan percobaan yang berisiko. |
| Privasi | Data pribadi hanya ditampilkan kepada pihak yang memerlukan; lokasi rumah pribadi tidak dipublikasikan tanpa pertimbangan privasi. |
| Integritas | Riwayat status dan audit log tidak dapat diubah oleh Admin RT. |
| Reliabilitas | Kegagalan upload/notifikasi ditangani tanpa membuat laporan ganda atau kehilangan data yang telah tersimpan. |
| Kompatibilitas | Mendukung versi modern Chrome, Edge, Firefox, dan Safari pada perangkat umum. |
| Skalabilitas | Struktur data memuat identitas RT sejak awal untuk mendukung multi-RT di masa depan. |
| Pemeliharaan | Komponen UI, aturan validasi, dan permission dibuat konsisten serta mudah diuji. |
| Bahasa | Bahasa utama antarmuka adalah Bahasa Indonesia yang sederhana dan tidak teknis. |

# 13. Privasi, Keamanan, dan Audit

## 13.1 Data personal

- Simpan data profil seminimal mungkin, misalnya nama tampilan dan email akun yang diperlukan untuk autentikasi.
- Jangan tampilkan email, nomor telepon, atau nama pelapor ke publik/warga lain secara default.
- Jangan meminta izin GPS sebelum pengguna memulai langkah penentuan lokasi.
- Berikan pilihan lokasi manual jika izin lokasi ditolak.
- Jelaskan tujuan penggunaan data lokasi dan siapa yang dapat melihatnya.
- Foto harus divalidasi tipe dan ukurannya. Metadata sensitif yang tidak diperlukan dapat dibuang saat pemrosesan.

## 13.2 Kontrol akses

- Periksa role dan RT pada setiap permintaan data, bukan hanya menyembunyikan tombol di frontend.
- Jangan mengandalkan ID yang sulit ditebak sebagai satu-satunya proteksi akses.
- File lampiran harus mengikuti kebijakan akses laporan; URL file privat tidak boleh dapat ditebak.
- Developer menggunakan akses lintas RT hanya untuk tugas platform yang sah dan tercatat.

## 13.3 Audit log

Minimal mencatat:

- perubahan status;
- perubahan kategori dan konfigurasi status;
- persetujuan/penolakan anggota;
- pembuatan atau perubahan peran admin;
- penugasan petugas;
- moderasi komentar;
- penghapusan/restore laporan oleh developer;
- tindakan administratif yang memengaruhi akses atau data.

Setiap log memuat aktor, tindakan, objek, waktu, dan alasan jika relevan. Admin RT tidak boleh mengedit atau menghapus audit log.

## 13.4 Retensi dan penghapusan

Kebijakan retensi perlu disepakati sebelum peluncuran. Soft delete merupakan mekanisme default agar laporan tidak langsung hilang. Penghapusan permanen, apabila diwajibkan oleh kebijakan atau permintaan yang sah, dilakukan melalui prosedur terpisah, dengan pemeriksaan dampak terhadap audit, cadangan, dan kewajiban penyimpanan.

# 14. Data dan Integrasi Minimum

## 14.1 Entitas data konseptual

- **User:** identitas pengguna dan profil minimum.
- **RT:** identitas lingkungan dan konfigurasi.
- **Membership:** relasi pengguna, RT, peran, dan status keanggotaan.
- **Report:** judul, deskripsi, nomor, kategori, pelapor, RT, status, dan waktu.
- **Attachment:** foto bukti, foto inspeksi, atau foto penyelesaian.
- **Location:** koordinat, tingkat akurasi, sumber lokasi, dan petunjuk lokasi.
- **Category:** kategori laporan per RT.
- **StatusDefinition:** label status, warna, urutan, kelompok internal, dan status aktif.
- **StatusHistory:** status lama/baru, pelaku, catatan, dan waktu.
- **Inspection:** hasil inspeksi dan petugas pemeriksa.
- **Comment:** informasi tambahan, penulis, waktu, dan status moderasi.
- **Assignment:** petugas yang ditugaskan, deskripsi tugas, dan status.
- **Notification:** penerima, jenis, objek terkait, waktu, dan status baca.
- **AuditLog:** aktor, tindakan, objek, alasan, dan waktu.

Model di atas adalah kebutuhan konseptual, bukan perintah untuk membuat seluruh tabel sejak MVP. Entitas P1/P2 dapat ditambahkan ketika fiturnya mulai dikerjakan.

## 14.2 Integrasi minimum MVP

- Google OAuth untuk autentikasi.
- Penyimpanan file untuk foto laporan.
- Layanan peta/geocoding untuk menampilkan dan memilih titik, dengan fallback input lokasi manual.
- Browser geolocation API untuk mengambil koordinat berdasarkan izin pengguna.
- Layanan notifikasi internal aplikasi.

Integrasi WhatsApp, push notification, dan analitik eksternal bukan dependensi peluncuran MVP.

# 15. Batasan Backend dan Strategi Frontend-First

SULAP dibangun dengan pendekatan frontend-first agar kualitas pengalaman pengguna dapat divalidasi lebih awal. Pendekatan ini tidak berarti seluruh fungsi penting dibuat palsu; fitur yang dirilis sebagai fungsi nyata harus memiliki penyimpanan dan otorisasi yang benar.

## 15.1 Tahapan implementasi

**Tahap prototipe UI:**
- Bangun seluruh halaman utama dengan data contoh yang diberi label jelas sebagai demo.
- Buat interaksi navigasi, filter, modal, form, status, dan layout responsive.
- Uji semua state dan alur menggunakan data simulasi.
- Jangan menampilkan login, upload, GPS, atau notifikasi demo seolah-olah benar-benar tersimpan/terkirim.

**Tahap backend minimum untuk pilot:**
- Autentikasi Google dan session.
- Data RT dan membership.
- Penyimpanan laporan, kategori, status, dan history.
- Upload serta akses file yang aman.
- Penyimpanan lokasi.
- Permission check dan audit log.
- Notifikasi dalam aplikasi.

**Tahap lanjutan:**
- Komentar, peta lanjutan, statistik, ekspor, penugasan, PWA, push, WhatsApp, dan multi-RT/RW sesuai prioritas.

## 15.2 Prinsip implementasi

- Hindari microservices, event bus kompleks, atau arsitektur berlebihan untuk pilot satu RT.
- Gunakan satu aplikasi dan satu backend terkelola/sederhana yang memenuhi keamanan dan kebutuhan data.
- Simpan business rules penting di server agar tidak dapat dilewati dengan memanipulasi frontend.
- Gunakan komponen UI yang dapat dipakai ulang dan sumber data yang konsisten.
- Mock data hanya digunakan pada prototipe dan harus mudah diganti dengan sumber data nyata.

# 16. Kriteria Penerimaan dan Rencana Pengujian

## 16.1 Skenario acceptance testing

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| AT-01 | Warga login Google tanpa membership | Masuk ke halaman bergabung dengan RT; tidak melihat data privat. |
| AT-02 | Kode RT valid | Permintaan/keanggotaan dibuat sesuai konfigurasi RT. |
| AT-03 | Warga membuat laporan lengkap | Laporan tersimpan, mendapat nomor unik, dan terlihat pada daftar RT. |
| AT-04 | GPS ditolak | Warga tetap dapat memilih lokasi manual dan menyelesaikan laporan. |
| AT-05 | Foto tidak didukung atau terlalu besar | Upload ditolak dengan pesan spesifik; input lain tidak hilang. |
| AT-06 | Admin memperbarui status | Timeline menampilkan status lama/baru, aktor, waktu, dan catatan. |
| AT-07 | Admin mencoba menghapus laporan | Tidak tersedia aksi hapus dan server menolak percobaan langsung. |
| AT-08 | Developer melakukan soft delete | Sistem meminta alasan, menandai data nonaktif, dan mencatat audit log. |
| AT-09 | Warga RT A membuka laporan RT B | Akses ditolak tanpa membocorkan detail. |
| AT-10 | Admin menyelesaikan laporan tanpa catatan | Sistem meminta ringkasan sebelum menyimpan. |
| AT-11 | Warga menyatakan masalah belum selesai | Permintaan tinjau ulang tercatat sebagai aktivitas baru. |
| AT-12 | Notifikasi eksternal gagal | Informasi tetap tersedia di pusat notifikasi aplikasi dan kegagalan tercatat. |
| AT-13 | Kategori yang pernah dipakai dinonaktifkan | Laporan lama tetap menampilkan kategori historis. |
| AT-14 | Pengguna membuka di layar 320 px | Tidak ada horizontal overflow; tombol dan konten tetap dapat digunakan. |
| AT-15 | Pengguna klik tombol utama berulang | Pengiriman tidak membuat duplikasi laporan. |
| AT-16 | Koneksi terputus saat pengiriman | Sistem memberi status gagal/tertunda yang jelas dan menyediakan retry aman. |

## 16.2 Jenis pengujian

- **Fungsional:** semua alur login, membership, laporan, foto, lokasi, status, notifikasi, komentar, ekspor, dan pengaturan.
- **Permission/security:** akses warga-admin-developer dan isolasi data antar-RT.
- **Responsive:** pengujian pada ukuran mobile, tablet, desktop serta browser utama.
- **Usability:** pengguna baru dapat membuat laporan tanpa arahan panjang.
- **Accessibility:** keyboard, label form, fokus, kontras, dan pembaca layar.
- **Reliability:** upload gagal, koneksi putus, refresh, klik ganda, dan sesi kedaluwarsa.
- **Regression:** fitur lama tetap berfungsi setelah perubahan status, kategori, atau layout.

# 17. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Laporan palsu/tidak relevan | Verifikasi keanggotaan, moderasi, kategori, dan catatan admin. |
| Laporan duplikat | Rekomendasi laporan serupa; keputusan tetap oleh admin. |
| GPS tidak akurat | Tampilkan akurasi, pin manual, dan petunjuk lokasi. |
| Penyalahgunaan foto/komentar | Validasi upload, pelaporan konten, moderasi, dan pembatasan akses. |
| Kebocoran data antar-RT | Otorisasi server di setiap request dan pengujian tenant isolation. |
| Admin tidak aktif | Pengingat laporan tertunda dan admin cadangan pada tahap lanjutan. |
| Notifikasi gagal | Pusat notifikasi internal sebagai sumber utama dan mekanisme retry. |
| Biaya penyimpanan foto meningkat | Kompresi, thumbnail, batas ukuran, dan kebijakan retensi. |
| Perubahan status membingungkan | Kelompok internal status, panduan label, dan preview konfigurasi. |
| Ketergantungan peta/GPS | Input lokasi manual dan fallback ketika layanan eksternal bermasalah. |
| Scope membesar | Patuhi prioritas P0/P1/P2 dan jangan menahan MVP demi fitur P2. |

# 18. Rencana Rilis

## Rilis 0 — Prototype UI

Keluaran: desain sistem, halaman responsive, data demo, interaksi utama, seluruh state UI, dan prototipe yang dapat diuji.

## Rilis 1 — MVP Pilot Satu RT

Keluaran: login Google, membership, role, laporan, foto, lokasi, status, timeline, dashboard, notifikasi internal, audit log, dan pengujian permission.

## Rilis 2 — Penguatan Operasional

Keluaran: komentar, foto inspeksi/penyelesaian, peta, deteksi serupa, statistik, ekspor, PWA, dan tinjau ulang.

## Rilis 3 — Ekspansi

Keluaran: penugasan, push/WhatsApp, multi-RT, dashboard RW, dan analitik lanjutan.

Setiap rilis harus melalui uji regresi responsive serta pemeriksaan seluruh tombol, tautan, form, dialog, dan status data.

# 19. Keputusan yang Perlu Divalidasi Sebelum Pilot

Daftar berikut adalah keputusan operasional yang tidak boleh diasumsikan oleh tim pengembang:

1. Apakah foto wajib untuk semua laporan, atau hanya dianjurkan untuk jenis laporan tertentu?
2. Apakah laporan dapat dilihat semua anggota RT, atau beberapa kategori/laporan hanya dapat dilihat admin dan pelapor?
3. Apakah nama pelapor ditampilkan kepada admin saja, atau juga kepada petugas yang ditugaskan?
4. Siapa yang berhak menjadi Admin RT cadangan jika Ketua RT tidak aktif?
5. Berapa batas ukuran dan jumlah foto per laporan?
6. Apakah warga boleh mengedit deskripsi setelah laporan dikirim, atau hanya menambahkan komentar/keterangan?
7. Berapa lama laporan, foto, dan audit log disimpan?
8. Kapan laporan boleh dihapus permanen oleh Developer, dan siapa yang menyetujui?
9. Apakah pengelola RW kelak dapat melihat detail laporan atau hanya statistik agregat?
10. Layanan peta dan notifikasi apa yang akan dipilih berdasarkan biaya, wilayah, dan kebijakan privasi?

# 20. Definisi Selesai (Definition of Done)

Fitur atau halaman dinyatakan selesai apabila:

- memenuhi kebutuhan fungsional dan acceptance criteria terkait;
- berjalan pada mobile, tablet, dan desktop yang ditargetkan;
- seluruh tombol, tautan, menu, filter, modal, dan input melakukan aksi yang benar;
- memiliki state loading, empty, error, disabled, dan success yang sesuai;
- validasi form dan pesan kesalahan jelas;
- hak akses diperiksa di frontend dan backend;
- tidak menampilkan data demo seolah-olah data nyata;
- tidak ada error kritis, layout terpotong, horizontal overflow tak disengaja, atau teks bertabrakan;
- telah diuji dengan skenario utama dan regresi yang relevan;
- perubahan data penting tercatat pada riwayat/audit sesuai aturan.

**Penegasan akhir:** SULAP berfokus pada kemudahan pelaporan warga, pengelolaan laporan yang terstruktur, transparansi perkembangan, dan integritas riwayat. Kualitas UI/UX responsive menjadi standar wajib, sementara backend dibatasi pada kebutuhan minimum yang benar-benar mendukung penggunaan nyata. Fitur lanjutan dikembangkan bertahap setelah alur inti tervalidasi dalam pilot.
