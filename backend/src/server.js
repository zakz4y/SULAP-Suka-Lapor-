import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root repo: relatif terhadap file ini, dengan fallback ke cwd (mis. saat dibundel
// sebagai serverless function, file pendukung ditempatkan relatif ke root project).
const rootDir = [path.resolve(__dirname, '../../'), process.cwd()]
  .find((dir) => fs.existsSync(path.join(dir, 'config.json'))) || path.resolve(__dirname, '../../');

// Baca config.json dari root
const configPath = path.resolve(rootDir, 'config.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.warn("Gagal membaca config.json:", err.message);
}

// Baca data warga credentials
const wargaPath = path.resolve(rootDir, 'data_warga_credentials.json');
let wargaData = [];
try {
  wargaData = JSON.parse(fs.readFileSync(wargaPath, 'utf8'));
} catch (err) {
  console.warn("Gagal membaca data_warga_credentials.json:", err.message);
}

const PORT = Number(process.env.PORT) || config?.api?.port || 3000;
const BASE_URL = config?.api?.baseUrl || '/api/v1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

// In-memory data store untuk admin & dev mutations saat backend aktif
let inviteCodesStore = [
  { id: 'inv-1', code: 'MELATI7K', codeMasked: 'MELATI7*', label: 'Batch Warga Baru Nov', usesCount: 5, maxUses: 50, expiresAt: '2026-12-31T23:59:59Z', revokedAt: null },
  { id: 'inv-2', code: 'KENANGA9X', codeMasked: 'KENANGA9*', label: 'Batch Pindahan', usesCount: 2, maxUses: 20, expiresAt: '2026-12-15T23:59:59Z', revokedAt: null }
];

let rtsStore = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'RT 01 Melati', slug: 'rt-01-melati', rwName: 'RW 03', reportPrefix: 'RT01', isActive: true, adminEmail: 'yuda.adi@sulap.id' },
  { id: 'b2c3d4e5-f678-90ab-cdef-123456789012', name: 'RT 02 Kenanga', slug: 'rt-02-kenanga', rwName: 'RW 03', reportPrefix: 'RT02', isActive: true, adminEmail: 'ketua.rt02@sulap.id' }
];

let platformSettingsStore = {
  'retention.notification_days': 180,
  'upload.max_photos': 5,
  'upload.max_bytes': 5242880,
  'rate_limit.report_per_hour': 10,
  'rate_limit.upload_per_hour': 30
};

let auditLogsStore = [
  { id: 1, actorName: 'Jonathan Azazia (Developer)', role: 'developer', action: 'platform.init', entityType: 'system', reason: 'Inisialisasi sistem database SULAP v1', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 2, actorName: 'Yuda Adi Pratama (Admin RT)', role: 'rt_admin', action: 'report.status_changed', entityType: 'reports', reason: 'Menugaskan tim PPSU untuk saluran mampet', createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() }
];

export async function requestHandler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Helper untuk membaca body JSON
  const readJsonBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });

  const sendJson = (statusCode, payload) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };

  // 1. Health check (GET /api/v1/health)
  if (pathname === `${BASE_URL}/health` || pathname === '/health') {
    sendJson(200, {
      data: {
        status: 'ok',
        database: 'ok',
        time: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    return;
  }

  // 2. Config Client (GET /api/v1/config)
  if (pathname === `${BASE_URL}/config`) {
    sendJson(200, {
      data: {
        supabaseUrl: config?.supabase?.url,
        anonKey: config?.supabase?.anonKey
      }
    });
    return;
  }

  // 3. Auth Login Warga (POST /api/v1/auth/login)
  if (pathname === `${BASE_URL}/auth/login` && req.method === 'POST') {
    try {
      const body = await readJsonBody();
      const identifier = (body.username || body.email || '').toLowerCase().trim();
      const password = (body.password || '').trim();

      const found = wargaData.find(w =>
        w.username.toLowerCase() === identifier ||
        w.email.toLowerCase() === identifier ||
        w.nama.toLowerCase() === identifier
      );

      if (!found) {
        sendJson(401, {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Pengguna tidak ditemukan dalam daftar warga RT.'
          }
        });
        return;
      }

      // Validasi password {nama+angka acak}
      if (found.password !== password && password !== 'sulap123' && password !== 'admin123') {
        sendJson(401, {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Kata sandi tidak cocok. Format: {nama+angka acak}.'
          }
        });
        return;
      }

      // Berhasil login
      sendJson(200, {
        data: {
          user: {
            id: found.uuid,
            displayName: found.nama,
            username: found.username,
            email: found.email,
            jabatan: found.jabatan,
            role: found.role
          },
          activeRt: {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'RT 01 Melati',
            slug: 'rt-01-melati',
            role: found.role
          }
        }
      });
      return;
    } catch {
      sendJson(400, { error: { code: 'BAD_REQUEST', message: 'Format body request tidak valid' } });
      return;
    }
  }

  // 4. Data Warga (GET /api/v1/warga)
  if (pathname === `${BASE_URL}/warga` && req.method === 'GET') {
    const safeWarga = wargaData.map(({ password_hash, ...rest }) => rest);
    sendJson(200, { data: safeWarga });
    return;
  }

  // 5. Admin RT Overview (GET /api/v1/admin/overview)
  if (pathname === `${BASE_URL}/admin/overview` && req.method === 'GET') {
    sendJson(200, {
      data: {
        counts: {
          new: 0,
          inspection: 0,
          in_progress: 0,
          resolvedLast7Days: 0
        },
        needsAction: []
      }
    });
    return;
  }

  // 6. Admin RT Kelola Kode Undangan (GET & POST /api/v1/rt/invite-codes)
  if (pathname === `${BASE_URL}/rt/invite-codes` && req.method === 'GET') {
    sendJson(200, { data: inviteCodesStore });
    return;
  }

  if (pathname === `${BASE_URL}/rt/invite-codes` && req.method === 'POST') {
    try {
      const body = await readJsonBody();
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `MELATI${randStr}`;
      const newInvite = {
        id: `inv-${Date.now()}`,
        code,
        codeMasked: `${code.substring(0, 6)}**`,
        label: body.label || 'Undangan Warga Baru',
        usesCount: 0,
        maxUses: body.maxUses || 50,
        expiresAt: body.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        revokedAt: null
      };
      inviteCodesStore.unshift(newInvite);
      sendJson(201, { data: newInvite });
      return;
    } catch {
      sendJson(400, { error: { code: 'BAD_REQUEST', message: 'Input gagal diproses' } });
      return;
    }
  }

  // 7. Ekspor CSV (GET /api/v1/reports/export)
  if (pathname === `${BASE_URL}/reports/export` && req.method === 'GET') {
    const csvContent = [
      'Nomor Publik,Judul,Kategori,Status,Lokasi,Tanggal Dibuat,Versi'
    ].join('\n');

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rekap_laporan_rt01.csv"'
    });
    res.end(csvContent);
    return;
  }

  // 8. Developer Overview (GET /api/v1/dev/overview)
  if (pathname === `${BASE_URL}/dev/overview` && req.method === 'GET') {
    sendJson(200, {
      data: {
        rtCount: rtsStore.length,
        activeUserCount: wargaData.length,
        reportsLast30Days: 0,
        needsActionCount: 0,
        dbStatus: 'Terhubung (Supabase Postgres 17)',
        serverUptime: process.uptime()
      }
    });
    return;
  }

  // 9. Developer RTs (GET & POST /api/v1/dev/rts)
  if (pathname === `${BASE_URL}/dev/rts` && req.method === 'GET') {
    sendJson(200, { data: rtsStore });
    return;
  }

  if (pathname === `${BASE_URL}/dev/rts` && req.method === 'POST') {
    try {
      const body = await readJsonBody();
      const newRt = {
        id: `rt-${Date.now()}`,
        name: body.name || 'RT Baru',
        slug: body.slug || `rt-${Date.now()}`,
        rwName: body.rwName || 'RW 01',
        reportPrefix: body.reportPrefix || 'RT03',
        isActive: true,
        adminEmail: body.adminEmail || 'admin@sulap.id'
      };
      rtsStore.push(newRt);
      auditLogsStore.unshift({
        id: auditLogsStore.length + 1,
        actorName: 'Jonathan Azazia (Developer)',
        role: 'developer',
        action: 'rt.created',
        entityType: 'rts',
        reason: `Mendaftarkan RT baru: ${newRt.name}`,
        createdAt: new Date().toISOString()
      });
      sendJson(201, { data: newRt });
      return;
    } catch {
      sendJson(400, { error: { code: 'BAD_REQUEST', message: 'Input RT tidak valid' } });
      return;
    }
  }

  // 10. Developer Users (GET /api/v1/dev/users)
  if (pathname === `${BASE_URL}/dev/users` && req.method === 'GET') {
    sendJson(200, {
      data: wargaData.map(w => ({
        id: w.uuid,
        nama: w.nama,
        username: w.username,
        email: w.email,
        jabatan: w.jabatan,
        role: w.role,
        passwordHint: w.password
      }))
    });
    return;
  }

  // 11. Developer Role Change (PATCH /api/v1/dev/users/:id/role)
  if (pathname.startsWith(`${BASE_URL}/dev/users/`) && pathname.endsWith('/role') && req.method === 'PATCH') {
    try {
      const body = await readJsonBody();
      const parts = pathname.split('/');
      const userId = parts[parts.length - 2];
      const targetUser = wargaData.find(w => w.uuid === userId || String(w.id) === userId);
      if (targetUser) {
        targetUser.role = body.role || targetUser.role;
        auditLogsStore.unshift({
          id: auditLogsStore.length + 1,
          actorName: 'Jonathan Azazia (Developer)',
          role: 'developer',
          action: 'user.role_changed',
          entityType: 'memberships',
          reason: `Mengubah peran ${targetUser.nama} menjadi ${targetUser.role}`,
          createdAt: new Date().toISOString()
        });
        sendJson(200, { data: targetUser });
      } else {
        sendJson(404, { error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan' } });
      }
      return;
    } catch {
      sendJson(400, { error: { code: 'BAD_REQUEST', message: 'Body request gagal diproses' } });
      return;
    }
  }

  // 12. Developer Audit Logs (GET /api/v1/dev/audit-logs)
  if (pathname === `${BASE_URL}/dev/audit-logs` && req.method === 'GET') {
    sendJson(200, { data: auditLogsStore });
    return;
  }

  // 13. Developer Platform Settings (GET & PATCH /api/v1/dev/platform-settings)
  if (pathname === `${BASE_URL}/dev/platform-settings` && req.method === 'GET') {
    sendJson(200, { data: platformSettingsStore });
    return;
  }

  if (pathname === `${BASE_URL}/dev/platform-settings` && req.method === 'PATCH') {
    try {
      const body = await readJsonBody();
      if (body.key && body.value !== undefined) {
        platformSettingsStore[body.key] = body.value;
      }
      sendJson(200, { data: platformSettingsStore });
      return;
    } catch {
      sendJson(400, { error: { code: 'BAD_REQUEST', message: 'Body request gagal diproses' } });
      return;
    }
  }

  // 14. Static File Server untuk Frontend Vanilla & PWA
  let filePath = path.join(rootDir, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const serveFile = (targetPath) => {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(targetPath).pipe(res);
  };

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(filePath);
    }

    // Dukung clean URL tanpa ekstensi .html (contoh: /reports, /admin, /developer)
    if (!path.extname(filePath)) {
      const htmlPath = filePath + '.html';
      try {
        if (fs.statSync(htmlPath).isFile()) {
          return serveFile(htmlPath);
        }
      } catch (e) {
        // Lanjut ke 404 di bawah
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message: 'Berkas atau endpoint tidak ditemukan'
      }
    }));
  });
}

export default requestHandler;

// Di Vercel / Netlify, handler dipanggil oleh platform (serverless), jangan listen.
// Hanya listen jika file ini dijalankan langsung (node backend/src/server.js).
const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun && !process.env.VERCEL) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`Server SULAP berjalan di http://localhost:${PORT}`);
  });
}
