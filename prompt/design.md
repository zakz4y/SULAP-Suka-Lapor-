# DESIGN.md — SULAP

Arah desain aplikasi pelaporan warga RT. Dokumen ini sumber kebenaran visual. PRD mengatur perilaku; dokumen ini mengatur tampilan, nada, keputusan antarmuka.

| Atribut | Nilai |
|---|---|
| Versi | 1.1 (disempurnakan + anti-slop) |
| Tanggal | 18 November 2026 |
| Status | Disetujui untuk prototipe dan MVP |
| Pasangan dokumen | `prd.md`, `docs/api-contract.md`, `sulap.dbml`, `backend/database.md` |
| Cakupan | Web responsive, mobile-first, siap PWA |

**Mode kerja desain (anti-slop):** DURING (terapkan aturan saat membangun). Setiap keputusan visual/copy harus punya alasan tertulis (lihat §13).

**Design Read:** aplikasi utilitas warga RT untuk pengguna ponsel beragam kemampuan, bahasa visual sipil-editorial tenang dan mudah dipindai. Dial **ENERGY 2 / RHYTHM 2 / MOTION 1** (tetap dari halaman pertama sampai terakhir).

| Dial | Nilai | Arti operasional |
|---|---|---|
| ENERGY | 2 | Tegas dan ramah, bukan korporat, bukan eksperimental. Satu aksen kuat per layar. |
| RHYTHM | 2 | Ritme konsisten dengan 2–3 variasi komposisi nyata (beranda, daftar, detail, meja kerja admin tidak boleh sama persis seperti template). |
| MOTION | 1 | Hanya umpan balik interaksi dan transisi state. Tidak ada animasi dekoratif, parallax, reveal saat scroll. |

## 1. Arah dan alasan
SULAP alat kerja warga (dipakai di lapangan, layar panas, tangan basah, koneksi tidak stabil).

1. **Keterbacaan luar ruangan.** Latar paper hangat, teks hampir hitam, kontras tinggi. Bukan dark mode default.
2. **Satu keputusan per layar.** Satu tindakan utama jelas; lainnya sekunder.
3. **Bukti, bukan dekorasi.** Foto warga, lokasi, nomor laporan, waktu adalah isi utama. Tidak ada ilustrasi pengganti.
4. **Status dapat dibaca tanpa warna.** Setiap status pakai ikon + label teks + warna.

### Motif identitas: “papan lapor”
- **Nomor laporan sebagai karcis:** angka tabular, garis atas tipis, label kecil sentence case. Konsisten di daftar/detail/notifikasi/ekspor.
- **Jalur status sebagai paving:** simpul persegi 10 px, garis putus-putus. Aktif terisi, lampau bergaris, mendatang kosong.
- **Kartu laporan tanpa hiasan tepi:** tanpa garis vertikal berwarna; bedakan dengan urutan, tipografi, status chip.

Motif kecil dan berulang; tidak jadi ornamen besar, pola latar, atau tekstur dekoratif.

### Yang sengaja tidak dipakai (anti-slop / Hard Gate ringkas)
| Pola | Alasan |
|---|---|
| Gradient biru-ungu, mesh, orb radial | Terbaca template AI, tidak relevan RT. |
| Glassmorphism di banyak elemen sekaligus | Turunkan kontras, tidak tambah hierarki. |
| Bento grid / kartu fitur seragam sebagai default konten laporan | Ini alat kerja, bukan landing pemasaran. |
| Semua elemen berbentuk pil | Radius alat hierarki; pil semua menghapus hierarki. |
| Glow dekoratif di kartu/tombol/badge | Fokus keyboard pakai ring solid. |
| Ikon sparkle/bintang/kilat/robot | Tidak relevan fasilitas lingkungan. |
| Emoji sebagai ikon struktural | Tidak konsisten, tidak bisa di-token. |
| Ilustrasi 3D/Undraw sebagai pengganti bukti | Ganti bukti nyata dengan generik. |
| Statistik/testimoni/logo mitra tanpa data nyata | Melanggar kejujuran data. |
| Struktur template Hero+3 kartu+3 langkah+3 harga | Tidak sesuai produk. |

> Prinsip antislop: teknik visual diperbolehkan **hanya jika ada tujuan tertulis** (hierarki/identitas/keterbacaan). Jika alasan satu-satunya “kelihatan modern/aman/AI-default”, hapus atau ubah.

## 2. Palet warna
Palet inti: hijau dinas, kertas hangat, bata (terbatas). Hijau untuk identitas & aksi utama. Bata hanya untuk aksi berisiko/penekanan penting. Warna status fungsional terpisah dari merek.

### 2.1 Token terang (inti)
| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg` | `#F5F3EA` | Latar halaman |
| `--surface` | `#FFFFFF` | Kartu, sheet, dialog |
| `--surface-2` | `#EDEAE0` | Header tabel, area tenang |
| `--ink` | `#17211B` | Teks utama |
| `--ink-muted` | `#4A564E` | Teks sekunder |
| `--border` | `#D9D5C7` | Garis |
| `--border-strong` | `#B9B4A3` | Batas hover |
| `--primary` | `#145C41` | Tombol utama, tautan, fokus |
| `--primary-hover` | `#0F4A34` | Hover/active |
| `--on-primary` | `#FFFFFF` | Teks di atas primary |
| `--accent` | `#A63A17` | Aksi berisiko/penekanan penting |
| `--accent-hover` | `#8C2F11` | Hover/active |
| `--on-accent` | `#FFFFFF` | Teks di atas accent |
| `--focus` | `#145C41` | Ring fokus |

### 2.2 Token gelap
| Token | Nilai |
|---|---|
| `--bg` | `#0E1512` |
| `--surface` | `#151E1A` |
| `--surface-2` | `#1B2621` |
| `--ink` | `#E8ECE5` |
| `--ink-muted` | `#A7B3AA` |
| `--border` | `#2A3630` |
| `--border-strong` | `#3D4C45` |
| `--primary` | `#4FB48C` |
| `--primary-hover` | `#6AC5A1` |
| `--on-primary` | `#08120E` |
| `--accent` | `#E07A4E` |
| `--accent-hover` | `#EC8F66` |
| `--on-accent` | `#1A0D07` |
| `--focus` | `#7CD3AE` |

### 2.3 Warna status (wajib ikon + label + warna)
| Kelompok | Ikon (Phosphor) | Terang teks/latar | Gelap teks/latar |
|---|---|---|---|
| `new` | `Tray` | `#1D5FA8` / `#E7EFF9` | `#8FBFF0` / `#14283C` |
| `triaged` | `MagnifyingGlass` | `#8A5A00` / `#FBF1DC` | `#E8C27A` / `#33270F` |
| `inspection` | `ClipboardText` | `#5B4A8A` / `#EFEBF8` | `#C3B3EA` / `#241F35` |
| `in_progress` | `Wrench` | `#0E6B5C` / `#E2F2EE` | `#7CD3BE` / `#0F2A25` |
| `resolved` | `CheckCircle` | `#256B3A` / `#E6F2E8` | `#93D6A2` / `#132A18` |
| `closed` | `ArchiveBox` | `#55605A` / `#ECEEEB` | `#B4BEB6` / `#212A25` |
| `reopened` | `ArrowCounterClockwise` | `#9A3412` / `#FBEAE2` | `#F0A583` / `#33190F` |

### 2.4 Kontras (terukur, ringkas)
Pasangan utama lolos WCAG AA (contoh: `--ink` pada `--bg` terang ~14.88:1; `--ink-muted` pada `--surface` ~7.69:1). **Aturan:** teks tidak di atas foto tanpa scrim gelap (`rgba(10,15,12,0.72)`) jika perlu; status tidak pernah hanya warna; token merek tidak dipakai untuk status.

### 2.5 CSS variables (ringkas)
Gunakan variabel di kode; nilai inti seperti di atas. Radius: chip 4px, control 8px, card 12px, sheet 16px. Spacing skala 4/8/12/16/20/24/32/40/56/72. Motion: press 120ms, state 180ms, sheet 240ms (`ease-out`). Semua gerak dihormati `prefers-reduced-motion`.

## 3. Tipografi
- Judul/UI: **Plus Jakarta Sans** (alasan: karakter lokal Jakarta, tabular nums untuk nomor laporan; bukan default AI generik seperti Inter/Geist untuk identitas ini).
- Isi: **Source Sans 3** (keterbacaan, x-height tinggi).
- Skala: text-xs 12/16 … text-4xl 44/52. Berat 400 isi, 500 label/tombol, 600 judul, 700 hanya angka kunci. Tanpa huruf kapital semua + letter-spacing lebar untuk label (pakai sentence case). Nomor/waktu/jumlah pakai `font-variant-numeric: tabular-nums`. Teks isi maks ~68ch di desktop. Input mobile min 16px.

## 4. Spacing, grid, radius, elevasi
Kelipatan 4px. Breakpoint uji: 320–374, 375–767, 768–1023, 1024–1279, ≥1280px (lihat tabel di atas pada versi sebelumnya). Kartu pakai border 1px, bukan shadow default; shadow hanya dialog/sheet/bilah aksi lengket bila perlu.

## 5. Gerak
Hanya event tabel §5: tekan 120ms, ganti state 180ms, buka sheet/dialog 240ms, toast 180ms. Semua off di `prefers-reduced-motion: reduce`. Tidak ada >5s, tidak ada scroll-reveal/parallax/animasi angka dekoratif.

## 6. Komponen (inti)
- **Tombol:** primary/secondary/quiet/destructive dengan spesifikasi tinggi 44px mobile/40px desktop (touch area tetap), state lengkap, loading jaga lebar, ikon butuh `aria-label`. Label spesifik (contoh: `Kirim laporan`, `Simpan perubahan`) — larang `Get Started/Learn More/Try Now` dll. Tanpa panah dekoratif di setiap tombol.
- **Input/form:** label selalu terlihat, placeholder contoh saja, error di bawah field + ringkasan error di atas dengan `role="alert"`, input tidak dihapus saat gagal, textarea batas 2000 + penghitung, upload pratinjau+hapus+progres, peta dengan alternatif manual.
- **Status chip:** radius 4px (bukan pil), ikon 14px + label 12px 600, selalu sertai warna.
- **Kartu laporan:** susunan mobile jelas (status+waktu, judul max 2 baris, metadata, thumbnail opsional, nomor tabular); pemisah jarak/border tipis, tanpa garis tepi berwarna.
- **Timeline:** simpul 10px + garis putus-putus; tanpa edit/hapus dari UI admin.
- **Navigasi:** warga mobile 4 item + (Peta P1) + bilah aksi `Buat laporan` di atas bottom nav (bukan FAB). Admin desktop sidebar 240px / rail tablet. Developer layout terpisah.
- **State wajib:** loading skeleton, empty (kalimat + CTA relevan, tanpa ilustrasi), error (bahasa manusia + `Coba lagi`), permission denied, offline, submitting, success toast.

## 7. Komposisi halaman (ringkas)
Beranda warga: sapaan+RT, aksi `Buat laporan`, 5 laporan terbaru + `Lihat semua`. Tidak ada angka statistik palsu di MVP tanpa data. Daftar: search + filter sheet, chip filter hapus, `Muat lebih banyak`. Detail: nomor+status, judul, metadata, galeri, deskripsi, lokasi+peta kecil, timeline, (komentar P1), aksi relevan. Form: satu halaman scroll 5 bagian bernomor + bilah aksi lengket + ringkasan sebelum kirim + draf lokal setelah field valid pertama. Dashboard admin: angka nyata dari DB (klik ke filter), `Perlu tindakan` terurut tua→baru, tanpa grafik palsu. Developer: tabel/panel terpisah, aksi sensitif konfirmasi alasan.

## 8. Nada dan penulisan
Bahasa Indonesia sederhana, sapaan `Anda`. Kalimat aktif pendek. Istilah konsisten: `laporan`, `kategori`, `status`, `anggota`, `nomor laporan`. **Tanpa em dash.** Larang buzzword pemasaran (`seamless`, `AI powered`, `revolusioner`, dll.). Angka/klaim hanya data nyata. Avatar inisial jika perlu.

## 9. Aset
Logo placeholder `[LOGO]` wordmark `SULAP` sampai resmi (jangan buat logo tanpa instruksi). Avatar inisial di lingkaran `--surface-2`. Ikon **Phosphor Icons** (`regular`, `fill` hanya item nav aktif) — pilih glif relevan, bukan sparkle. Foto hanya unggahan/inspeksi (tidak ada stok/ilustrasi pengganti). Peta tile dengan atribusi, marker kustom persegi 16px border putih 2px. Demo data wajib berlabel `Data demo` saat prototipe.

## 10. Aksesibilitas (wajib)
- Kontras ≥4.5:1 teks normal, ≥3:1 teks besar (nilai terukur ada di §2.4).
- Fokus ring 3px offset 2px, tidak pernah `outline:none` tanpa pengganti.
- Urutan tab logis, dialog tutup `Esc` fokus kembali.
- Target sentuh ≥44×44px, jarak ≥8px.
- Label terhubung, ikon dekoratif `aria-hidden`, tombol ikon punya `aria-label`.
- Status bukan warna saja (ikon+teks).
- `lang="id"`, satu `h1`, landmark `header/nav/main/footer`.
- Peta punya alternatif daftar; pin keyboard-accessible.
- Gambar `alt` deskriptif (`Foto laporan: ...` untuk bukti). Gerak hormati `prefers-reduced-motion`. Mode gelap diuji penuh.

## 11. Performa dan batas teknis
Hero/header teks. Thumbnail daftar WebP 320px `loading="lazy"` + width/height. Detail `srcset` 640/1280. Font `display=swap`, ≤2 keluarga, preload hanya judul. Tidak ada third-party render-blocking. Target internal (harus diukur): LCP < 2.5s (4G lambat), CLS < 0.1 — **jangan klaim angka yang belum diukur**.

## 12. Larangan implementasi (ringkas)
1. Tidak ada gradient/glow/blur/tekstur dekoratif sebagai latar halaman.
2. Tidak semua elemen berbentuk pil.
3. Tidak emoji sebagai ikon.
4. Status tidak hanya warna.
5. Tidak statistik/testimoni/logo mitra tanpa data nyata.
6. Tidak tautan ke halaman belum ada.
7. Tidak tombol/tautan tanpa aksi.
8. Tidak `outline:none` tanpa fokus pengganti.
9. Tidak ubah token langsung di komponen (pakai token semantik).
10. Tidak animasi di luar §5.
11. Tidak ilustrasi generik/3D sebagai pengganti konten.
12. Tidak tampilkan identitas pelapor ke warga lain.
13. Tidak tampilkan koordinat presisi rumah ke warga lain.
14. Tidak judul besar dalam monospace.
15. Perubahan `design.md` wajib dicatat di changelog §14.

## 13. Checklist anti-slop & kualitas (sebelum serah)
- [ ] Dial ENERGY 2 / RHYTHM 2 / MOTION 1 konsisten.
- [ ] Setiap layar satu fokus utama.
- [ ] Tidak ada em dash di UI.
- [ ] Tidak gradient/glow/glass/pola latar dekoratif.
- [ ] Status: ikon + label + warna.
- [ ] Warna dari token (termasuk dark) dan kontras terukur ulang jika berubah.
- [ ] Target sentuh ≥44px, fokus terlihat.
- [ ] State loading/empty/error/offline/permission/submitting/success ada.
- [ ] Tidak ada kontrol tanpa aksi, tidak ada tautan mati.
- [ ] Tidak ada data/orang/angka dikarang.
- [ ] Uji 320/375/768/1024/1280px, tidak overflow horizontal di 320px.
- [ ] Dark mode diuji penuh.
- [ ] Bahasa Indonesia sederhana, istilah konsisten.
- [ ] Ikon satu keluarga/bobot per lapisan (Phosphor).
- [ ] Setiap keputusan utama (warna/layout/tipe/spacing/kartu/ikon) punya alasan satu kalimat yang bisa ditulis (prinsip antislop R-31).

## 14. Changelog
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 18 Nov 2026 | Arah awal, token, komponen, a11y, larangan |
| 1.1 | 18 Nov 2026 | Ditambah alignment anti-slop (dial, checklist, larangan diperkuat), rujukan dokumen diselaraskan |