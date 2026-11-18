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
