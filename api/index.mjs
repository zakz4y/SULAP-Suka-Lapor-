/**
 * Vercel Serverless Entry — meneruskan semua request /api/* ke backend lokal.
 *
 * vercel.json me-rewrite:
 *   /api/v1/health  ->  /api/index?__path=v1/health
 * sehingga path asli harus direkonstruksi sebelum masuk ke requestHandler.
 */
import { requestHandler } from '../backend/src/server.js';

export default function handler(req, res) {
  const rawUrl = req.url || '/';
  const parsed = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);

  // Hanya rekonstruksi jika request datang lewat rewrite (punya __path).
  if (parsed.searchParams.has('__path')) {
    const subPath = (parsed.searchParams.get('__path') || '').replace(/^\/+/, '');
    parsed.searchParams.delete('__path');
    const query = parsed.searchParams.toString();
    req.url = `/api/${subPath}${query ? `?${query}` : ''}`;
  }

  return requestHandler(req, res);
}
