import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca config.json dari root
const configPath = path.resolve(__dirname, '../../config.json');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.warn("Gagal membaca config.json:", err.message);
}

const PORT = config?.api?.port || 3000;
const BASE_URL = config?.api?.baseUrl || '/api/v1';

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === `${BASE_URL}/health` || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Config client expose endpoint (hanya publik anon key & url)
  if (req.url === `${BASE_URL}/config`) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      supabaseUrl: config?.supabase?.url,
      anonKey: config?.supabase?.anonKey
    }));
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint tidak ditemukan'
    }
  }));
});

server.listen(PORT, () => {
  console.log(`Backend server berjalan di http://localhost:${PORT}`);
});
