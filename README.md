# SULAP (Suka Lapor)

Aplikasi pelaporan warga RT berbasis web (Vanilla HTML, CSS, JavaScript) terintegrasi dengan Supabase.

## Struktur Direktori

```text
.
├── index.html              # Antarmuka utama (Bento Dashboard)
├── css/
│   └── style.css           # Styling & design system (CSS variables, dark/light)
├── js/
│   ├── config.js           # Konfigurasi Supabase Client
│   ├── auth.js             # Autentikasi warga (Login, Register, Session)
│   ├── api.js              # Integrasi data & RPC Supabase
│   └── app.js              # Kontrol DOM & logika interaksi
├── backend/
│   ├── package.json        # Manifest backend Node.js
│   └── src/
│       └── server.js       # HTTP server vanilla Node.js
├── supabase/
│   └── init.sql            # Skema database, RLS, Trigger, & RPC
├── assets/
│   └── design1.jpeg        # Referensi visual desain Bento
├── docs/                   # Spesifikasi & kontrak API
│   ├── api-contract.md
│   ├── design.md
│   └── archive/            # Arsip prompt & database design
├── config.json             # Konfigurasi aktif Supabase & API
├── config.example.json     # Contoh template konfigurasi
└── data_warga.csv          # Data rujukan warga RT
```

## Cara Menjalankan

### 1. Frontend
Buka file `index.html` langsung di browser, atau gunakan live server (misal VS Code Live Server atau `npx serve .`).

### 2. Backend (Opsional)
```bash
cd backend
npm start
```
Server berjalan di `http://localhost:3000`.

## Deploy ke Vercel

1. Import repo ini sebagai project Vercel.
2. **Root Directory: kosong (root repo)** — jangan `backend/`. Kalau root diset ke `backend/`, `index.html` tidak ikut ter-deploy dan `/` membalas `{"error":{"code":"NOT_FOUND"...}}`.
3. Framework Preset: **Other**. Build Command & Output Directory: kosong.
4. `vercel.json` menangani:
   - `/api/*` → serverless function `api/index.mjs` (memakai handler di `backend/src/server.js`).
   - File statis (`index.html`, `css/`, `js/`, `assets/`, `favicon.ico`) disajikan langsung oleh Vercel.
5. Redeploy setelah mengubah Root Directory.

Backend tetap bisa dijalankan lokal: `node backend/src/server.js` (default port 3000, override `PORT`).
