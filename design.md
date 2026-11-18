# DESIGN.md — SULAP (Suka Lapor)

Desain sistem dan panduan antarmuka web/app SULAP. Diturunkan dari visual DNA dashboard modern modular (`design1.jpeg`), dimodifikasi khusus untuk kebutuhan pelaporan warga tingkat RT sesuai `prd-sulap.md`.

| Atribut | Nilai |
|---|---|
| Versi | 2.0 (Modifikasi Adaptif dari `design1.jpeg` + Selaras PRD) |
| Tanggal | 18 November 2026 |
| Target Platform | Responsive Web (Mobile-first 360px–430px, Tablet 768px, Desktop 1280px+) & PWA ready |
| Dial Desain | **ENERGY 2 / RHYTHM 2 / MOTION 1** |
| Referensi Asli | `design1.jpeg` (Edtech Bento Dashboard) |

---

## 1. Analisis & Transformasi dari `design1.jpeg`

| Elemen di `design1.jpeg` | Ciri Asli | Modifikasi untuk SULAP (Civic / RT Utility) | Alasan |
|---|---|---|---|
| **Latar Viewport Luar** | Ungu pastel cerah (`#C9BBFD`) | Netral sejuk hangat (`#EEF2EE` terang, `#0C110E` gelap) | Konteks pelayanan masyarakat; butuh kesan tenang, bersih, kredibel di luar ruangan. |
| **Sidebar Navigasi** | Dark capsule pill (`#18191D`) mengambang dengan aksen neon | Dark Forest Charcoal capsule (`#141916`) dengan aksen **Civic Lime** (`#D2F45A`) | Pertahankan kontras tinggi & siluet ikonik `design1`, disesuaikan nada lingkungan. |
| **Aksen Utama** | Neon Lime (`#D2F45A`) tanpa padanan | **Civic Lime** (`#D2F45A`) untuk highlight/active pill + **Forest Green** (`#135E3F`) untuk tombol aksi utama web | Neon lime di atas putih gagal kontras WCAG AA; lime dipakai khusus di latar gelap / container kontras tinggi. |
| **Radius Sudut** | Sangat bulat (Canvas 32px, Card 20-24px, Pill 9999px) | **Hierarki Terukur**: Canvas desktop 28px, Card 18px, Sub-widget 14px, Input/Control 10px, Pill 9999px (hanya badge & tab aktif) | Mencegah "semua jadi kapsul" (anti-slop). Radius membedakan kontainer dan aksi. |
| **Padding & Spacing** | Sangat longgar (`p-6` s.d. `p-8`) | Card desktop `p-5` (20px), Mobile `p-4` (16px), Grid gap 16px (desktop) / 12px (mobile) | Kepadatan informasi efisien tanpa sesak; nyaman disentuh di layar sentuh ponsel. |
| **Widget Hero Kanan** | "Go Premium" card + ilustrasi | **Bilah Peringatan & Status RT** ("Status Wilayah: Kondusif" / Info Darurat) | PRD melarang ilustrasi generik dan gimmick komersial. Diganti status operasional nyata. |
| **Widget Aktivitas** | Bar chart "Hours Activity" mingguan | **"Tren Penanganan Masalah"** (Grafik batang harian laporan masuk vs selesai) | Menunjukkan beban kerja RT secara transparan dan akuntabel. |
| **Widget Jadwal** | "Daily Schedule" list | **"Agenda Inspeksi Lapangan"** (Laporan butuh tinjauan fisik admin/petugas) | Langsung menjawab alur P0: inspeksi lapangan RT. |
| **Widget Tracking** | "Course You're Taking" + radial % | **"Laporan Perlu Perhatian"** + progress bar tahapan status | Menampilkan nomor laporan, foto bukti, waktu sisa SLA internal RT. |
| **Widget Promo Bawah** | "Download our mobile app" | **"Akses Cepat PWA / Kontak Darurat"** | Memberi tahu warga cara pasang ke home screen tanpa app store. |

---

## 2. Palet Warna & Token Semantik

Sistem warna mengadaptasi kontras kuat `design1.jpeg` (charcoal pekat + lime cerah + putih bersih) dengan koreksi kontras WCAG AA (rasio ≥ 4.5:1 untuk teks normal).

### 2.1 Token Mode Terang (Default)

```css
:root {
  /* Latar & Kanvas */
  --bg-viewport: #EEF2EE;        /* Latar luar pembungkus dashboard desktop */
  --bg-canvas: #FFFFFF;          /* Kanvas utama dashboard ber-radius */
  --surface-card: #F7F9F7;       /* Latar kartu & widget modular */
  --surface-card-hover: #F0F4F1; /* State hover kartu */
  --surface-elevated: #FFFFFF;   /* Modal, popup, sheet */

  /* Sidebar Dark Capsule (Elemen Ikonik design1) */
  --sidebar-bg: #141916;         /* Deep Forest Charcoal */
  --sidebar-fg: #A3B1A8;         /* Teks nav non-aktif */
  --sidebar-fg-hover: #FFFFFF;   /* Teks nav hover */
  --sidebar-active-bg: #D2F45A;  /* Civic Lime (Pill item aktif) */
  --sidebar-active-fg: #111812;  /* Teks hitam pekat di atas lime (Rasio 13.2:1) */

  /* Teks & Tinta */
  --ink-primary: #121915;        /* Teks utama (Rasio 14.9:1) */
  --ink-secondary: #4A564F;      /* Teks keterangan, metadata (Rasio 7.2:1) */
  --ink-tertiary: #7D8A82;       /* Teks placeholder & tanggal */

  /* Garis & Batas */
  --border-subtle: #E2E8E3;      /* Pemisah kartu & list */
  --border-strong: #C4CEC6;      /* Border input & kontrol form */
  --border-focus: #145C41;       /* Outline fokus keyboard */

  /* Aksen & Aksi */
  --accent-lime: #D2F45A;        /* Highlight status, badge aktif, banner */
  --accent-lime-fg: #111812;     /* Kontras teks di atas lime */
  --primary-btn: #135E3F;        /* Tombol aksi utama (Kirim, Simpan) */
  --primary-btn-hover: #0E4931;
  --primary-btn-fg: #FFFFFF;

  /* Semantik Status Khusus (Wajib Ikon + Label) */
  --status-new-bg: #E7EFF9;
  --status-new-fg: #1D5FA8;
  --status-triage-bg: #FDF4E2;
  --status-triage-fg: #8C5800;
  --status-inspect-bg: #EFEBF8;
  --status-inspect-fg: #5B4A8A;
  --status-process-bg: #E2F4EE;
  --status-process-fg: #0D6657;
  --status-resolved-bg: #E5F6E9;
  --status-resolved-fg: #1B6836;
  --status-closed-bg: #ECEEEB;
  --status-closed-fg: #4F5B54;
  --status-reopen-bg: #FDEEE9;
  --status-reopen-fg: #9C3412;
}
```

### 2.2 Token Mode Gelap

```css
[data-theme="dark"] {
  --bg-viewport: #0C110E;
  --bg-canvas: #121714;
  --surface-card: #19201C;
  --surface-card-hover: #202924;
  --surface-elevated: #1D2621;

  --sidebar-bg: #0C100E;
  --sidebar-fg: #86968C;
  --sidebar-fg-hover: #FFFFFF;
  --sidebar-active-bg: #D2F45A;
  --sidebar-active-fg: #111812;

  --ink-primary: #EEF3EF;
  --ink-secondary: #A0AEA4;
  --ink-tertiary: #6E7C73;

  --border-subtle: #242E28;
  --border-strong: #36443C;
  --border-focus: #83DFB2;

  --accent-lime: #D2F45A;
  --accent-lime-fg: #111812;
  --primary-btn: #4FB48C;
  --primary-btn-hover: #65C69F;
  --primary-btn-fg: #0B1711;

  --status-new-bg: #14283C;
  --status-new-fg: #8FBFF0;
  --status-triage-bg: #33270F;
  --status-triage-fg: #E8C27A;
  --status-inspect-bg: #261F38;
  --status-inspect-fg: #C6B6ED;
  --status-process-bg: #0F2D27;
  --status-process-fg: #7CD6C3;
  --status-resolved-bg: #132D19;
  --status-resolved-fg: #95DDA4;
  --status-closed-bg: #212B26;
  --status-closed-fg: #B7C3BA;
  --status-reopen-bg: #351A10;
  --status-reopen-fg: #F2A888;
}
```

---

## 3. Sistem Tipografi

Karakteristik: Ramah warga, mudah dipindai di lapangan, angka tabular presisi untuk nomor tiket `SULAP-RT01-xxxx`.

- **Font Utama (Display, Heading & UI):** `Plus Jakarta Sans`, sans-serif.
- **Font Isi (Body, Laporan, Form):** `Plus Jakarta Sans` / `Source Sans 3`.
- **Angka & Kode:** `font-variant-numeric: tabular-nums`.

| Level | Ukuran / Line Height | Bobot | Pemakaian |
|---|---|---|---|
| **Display / Greeting** | 24px / 32px (Desktop: 28px / 36px) | SemiBold (600) | "Selamat bertugas, Pak RT Bambang 👋" |
| **Section Title** | 18px / 24px | SemiBold (600) | Judul modul bento ("Tren Laporan", "Laporan Baru") |
| **Card Heading** | 15px / 20px | SemiBold (600) | Judul tiket laporan (Maks 2 baris) |
| **Body Regular** | 14px / 20px (Mobile form: min 16px) | Regular (400) | Deskripsi keluhan, instruksi |
| **Label / Button** | 13px / 16px | Medium (500) | Label input, tombol navigasi |
| **Caption / Badge** | 11px / 14px | SemiBold (600) | Pill status, chip kategori, timestamp |

---

## 4. Struktur Geometri & Radius Sudut (Modifikasi dari `design1.jpeg`)

Dalam `design1.jpeg`, semua elemen menggunakan radius ekstrem. Untuk aplikasi resmi publik RT, kita menerapkan **Radius Bertingkat**:

| Elemen | Radius | Alasan Desain |
|---|---|---|
| **Outer Canvas (Desktop)** | `28px` | Memberikan kesan modern frame seperti di `design1.jpeg` |
| **Dark Sidebar** | `22px` | Menjaga bentuk kapsul melayang yang kokoh dan rapi |
| **Sidebar Active Pill** | `9999px` (`rounded-full`) | Mengambil ciri khas kapsul seleksi di `design1.jpeg` |
| **Bento Cards / Modul** | `18px` | Sudut membulat modern tapi efisien menampung list tabel |
| **Badge / Status Chip** | `8px` (`rounded-md`) | Bukan kapsul penuh; menjaga keterbacaan teks status & ikon |
| **Input / Search Bar** | `9999px` untuk pencarian, `10px` untuk form | Search bar serasi dengan `design1`, form field tetap standar |
| **Tombol Aksi** | `12px` | Target klik mantap, sudut tegas terkendali |
| **Avatar Pengguna** | `9999px` (`rounded-full`) | Lingkaran standar dengan inisial atau foto profil |

---

## 5. Layout & Spacing (Desktop Bento Grid + Adaptasi Mobile)

### 5.1 Desktop Layout (Bento Modern Grid — Inspirasi `design1.jpeg`)

Resolusi target: 1280px s.d. 1440px+.

```
+---------------------------------------------------------------------------------------------------------+
| [ Latar Viewport: --bg-viewport (#EEF2EE) ]                                                            |
|  +---------------------------------------------------------------------------------------------------+  |
|  | [ Kanvas Putih Utama: --bg-canvas, radius: 28px, p: 24px ]                                        |  |
|  | +------------+  +-------------------------------------------------------------------------------+ |  |
|  | | [SIDEBAR]  |  | Top Header: [Greeting 👋]       [Search Pill]  [Filter]  [Profile Avatar]    | |  |
|  | | Dark Pill  |  +-------------------------------------------------------------------------------+ |  |
|  | | Radius:22px|  | Row Metrik 3 Kolom:                                                           | |  |
|  | |            |  | [ Card Laporan Baru ]   [ Card Dalam Proses ]   [ Card Selesai & Rata2 Hari ] | |  |
|  | | Nav Items: |  +-------------------------------------+-----------------+-----------------------+ |  |
|  | | (Pill Lime)|  | Kolom Kiri-Tengah (Span 5):         | Kolom Tengah (4):| Kolom Kanan (3):      | |  |
|  | | Dashboard  |  | [ Grafik Tren Mingguan ]            | [ Agenda         | [ Kalender & Jadwal   | |  |
|  | | Laporan RT |  | (Bar chart + tooltip status)        |   Inspeksi RT ]  |   Tindak Lanjut ]     | |  |
|  | | Peta Wil.  |  +-------------------------------------+-----------------+-----------------------+ |  |
|  | | Warga      |  | Baris Bawah Kiri (Span 7):                            | Baris Bawah Kanan (5):| |  |
|  | | Notif (badge) | [ Laporan Perlu Perhatian Segera ]                  | [ Status Petugas &    | |  |
|  | | Pengaturan |  | (List tiket + foto bukti + batas waktu + progress bar) |   Antrean Warga Baru] | |  |
|  | |            |  +-------------------------------------------------------+-----------------------+ |  |
|  | | [Bawah:    |                                                                                    |  |
|  | | Info PWA / |                                                                                    |  |
|  | | Kontak RT] |                                                                                    |  |
|  | +------------+                                                                                    |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

### 5.2 Adaptasi Mobile (Ponsel Warga 360px–430px — P0 PRD Wajib)

Di layar ponsel, tata letak bento desktop dirombak menjadi **Single Stack Vertikal** yang ramah satu tangan:

1. **Header Sederhana:** Nama RT (RT 05 / RW 02), sapaan warga singkat, bel notifikasi dengan dot indikator merah.
2. **Kartu Status Cepat:** Ringkasan laporan aktif milik warga ("1 Sedang Ditangani", "1 Menunggu").
3. **Tombol Mengambang / Sticky Action:** Tombol besar `+ Buat Laporan` berwarna kontras di atas bilah navigasi.
4. **Feed Laporan Terkini:** Kartu tiket vertikal dengan foto thumbnail 72×72px di sebelah kanan/kiri, label status chip di pojok atas, judul 2 baris, nomor tiket bergaris.
5. **Bottom Navigation Bar (Pill Kapsul Melayang):**
   - 4 Tab Utama: `Beranda`, `Laporan RT`, `Notifikasi`, `Akun`.
   - Tinggi 56px, latar `--sidebar-bg` (Dark Charcoal), ikon aktif beraksen `--accent-lime`.

---

## 6. Detail Komponen Utama

### 6.1 Sidebar Navigasi Gelap (Adaptasi `design1.jpeg`)
- **Lebar Desktop:** 220px (tetap), padding 16px 12px.
- **Warna Kontainer:** `--sidebar-bg` (`#141916`).
- **Item Menu:**
  - Non-aktif: Ikon Phosphor + Label teks warna `--sidebar-fg` (`#A3B1A8`), hover berubah ke putih.
  - Aktif: Bentuk kapsul penuh (`rounded-full`), latar `--sidebar-active-bg` (`#D2F45A`), warna teks/ikon `--sidebar-active-fg` (`#111812`), tebal Medium 500.
- **Badge Notifikasi:** Lingkaran kecil oranye bata di samping tab "Notifikasi".
- **Widget Bawah:** Kartu mini rounded-xl latar `#1E2521`, tombol lingkaran dengan ikon panah diagonal `ArrowUpRight` bertuliskan "Pasang Aplikasi (PWA)" untuk kemudahan warga.

### 6.2 Top Header & Search
- **Pencarian Cepat:** Input pill oval (`rounded-full`), tinggi 42px, latar `#F4F6F4`, border transparan, ikon lup di kiri, placeholder: `"Cari nomor laporan, jalan, kategori..."`.
- **Profil Admin/Warga:** Foto profil bulat (38×38px) dengan border putih tipis 2px, inisial fallback jika tanpa foto.

### 6.3 Kartu Ringkasan Metrik (Row Atas)
- Terdiri dari 3 kartu modular (`--surface-card`, radius 18px, padding 18px):
  - **Ikon Kategori:** Kotak rounded-xl 40×40px di latar warna pastel lembut sesuai jenis metrik.
  - **Angka Metrik:** Display font 26px bold, tabular nums.
  - **Keterangan:** Teks sekunder 12px (contoh: "3 laporan menunggu tinjauan hari ini").

### 6.4 Modul Grafik Tren Laporan (Modifikasi "Hours Activity")
- Menampilkan grafik batang vertikal 7 hari (Senin s.d. Minggu).
- Batang normal: Warna netral `--border-strong` (`#C4CEC6`).
- Batang hari ini / puncak: Berwarna **Civic Lime** (`#D2F45A`) atau Forest Green, dilengkapi tag tooltip hitam mengambang berisi angka rinci: `"5 Laporan (3 Selesai)"`.

### 6.5 Modul Agenda Inspeksi (Modifikasi "Daily Schedule")
- Daftar tugas lapangan admin RT:
  - Baris item dengan icon jenis kerusakan (Lampu jalan, Saluran air, Jalan berlubang).
  - Judul lokasi singkat ("Depan Blok B4 No. 12").
  - Tombol chevron `CaretRight` untuk membuka sheet form inspeksi.

### 6.6 Kartu Tiket Laporan (Modifikasi "Course You're Taking")
- Menampilkan daftar laporan RT:
  - Thumbnail bukti foto 52×52px ber-radius 10px dengan fallback icon kategori.
  - Nomor Tiket Tabular (contoh: `#RT05-0042`).
  - Judul masalah + estimasi update waktu ("2 jam lalu").
  - **Indikator Progres:** Step progress horizontal 4 titik (Baru → Ditinjau → Diproses → Selesai) menggantikan circular progress presentase di `design1.jpeg`.
  - Chip Status bersanding di sisi kanan.

---

## 7. Aksesibilitas & Standar Anti-Slop

1. **Aturan Kontras Civic Lime:**
   - Lime (`#D2F45A`) **dilarang keras** dijadikan latar teks putih.
   - Lime **hanya boleh** berpasangan dengan teks hitam pekat (`#111812`, rasio kontras 13.2:1) atau sebagai aksen visual (border fokus, bar grafik, dot indikator).
2. **Status Tanpa Bergantung Warna:**
   - Setiap status memuat: **Ikon Phosphor** + **Label Teks Baku** + **Warna Latar Lembut**.
   - Contoh: `[ClipboardText] Perlu Inspeksi` (bukan sekadar titik ungu).
3. **Tanpa Data Palsu:**
   - Tidak ada angka rating bintang (seperti di `design1.jpeg`) yang tidak relevan dengan PRD SULAP.
   - Semua modul bento terhubung ke entitas data nyata PRD: `Report`, `Inspection`, `StatusHistory`, `Membership`.
4. **Target Sentuh Layar:**
   - Seluruh kontrol interaktif (tombol, dropdown, nav tab) memiliki target area minimal 44×44px di mobile.

---

## 8. Panduan Transisi & Gerak (Motion)

- **Hover Kartu Bento:** Translasi halus `translateY(-2px)` dengan bayangan lembut dalam waktu 150ms `ease-out`.
- **Navigasi Tab:** Transisi warna pill 120ms tanpa efek goyang atau bounce berlebihan.
- **Drawer / Sheet Form:** Slide up 220ms `ease-out` di mobile saat membuka detail tiket atau tambah laporan.
- **Prefers-reduced-motion:** Semua transisi langsung seketika (`0ms`) jika opsi aksesibilitas pengguna aktif.

---

## 9. Changelog Dokumen

| Versi | Tanggal | Catatan Perubahan |
|---|---|---|
| 2.0 | 18 Nov 2026 | Rekonstruksi arsitektur visual mengadaptasi layout modular bento dan dark capsule sidebar dari `design1.jpeg`, disesuaikan dengan kebutuhan PRD SULAP (warna civic, radius proporsional, data realistik, aksesibilitas WCAG). |
