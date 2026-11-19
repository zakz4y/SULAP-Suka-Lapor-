/**
 * SULAP Client Supabase Initializer (Vanilla JS)
 *
 * CATATAN KREDENSIAL:
 * anonKey di bawah ini ditolak Supabase dengan HTTP 401 (Unauthorized), dan
 * supabase/init.sql tidak memberi policy untuk role `anon`. Karena itu client
 * remote dimatikan dan aplikasi berjalan penuh dengan data lokal (localStorage).
 *
 * Untuk mengaktifkan Supabase:
 * 1. Ganti anonKey dengan publishable/anon key valid dari Supabase Dashboard.
 * 2. Pastikan project Supabase tidak paused.
 * 3. Tambahkan policy SELECT untuk role `anon` (data publik) atau pakai login
 *    Supabase Auth agar role `authenticated` + policy `*_select_member` aktif.
 * 4. Set `enabled: true` di bawah.
 */
const SUPABASE_CONFIG = {
  url: "https://pwhnqprkvbvltceuedxo.supabase.co",
  anonKey: "sb_publishable_R1xg8YWrnjA0LNI3xWrtSw_wsgiLznt",
  enabled: false
};

// Jika Supabase membalas 401 (anon key invalid/kedaluwarsa), hentikan semua
// request lanjutan agar console tidak dibanjiri error. Aplikasi lanjut mode lokal.
let supabaseAuthBlocked = false;

export function isSupabaseAuthBlocked() {
  return !SUPABASE_CONFIG.enabled || supabaseAuthBlocked;
}

async function guardedFetch(input, init) {
  if (supabaseAuthBlocked) {
    return new Response(
      JSON.stringify({ message: 'Supabase dinonaktifkan: kredensial 401 (mode lokal aktif).' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch(input, init);
  if (response && response.status === 401) {
    supabaseAuthBlocked = true;
    console.warn('[SULAP] Supabase menolak kredensial (401). Periksa anonKey di js/config.js. Mode data lokal diaktifkan.');
  }
  return response;
}

// Client Supabase instance (null = mode lokal penuh tanpa request jaringan)
export const supabase = (SUPABASE_CONFIG.enabled && typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      global: { fetch: guardedFetch }
    })
  : null;

if (!SUPABASE_CONFIG.enabled) {
  console.info('[SULAP] Supabase dinonaktifkan (config.enabled=false). Aplikasi memakai data lokal.');
}

export const config = SUPABASE_CONFIG;
