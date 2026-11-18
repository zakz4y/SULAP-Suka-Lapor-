/**
 * SULAP Client Supabase Initializer (Vanilla JS)
 */
const SUPABASE_CONFIG = {
  url: "https://pwhnqprkvbvltceuedxo.supabase.co",
  anonKey: "sb_publishable_R1xg8YWrnjA0LNI3xWrtSw_wsgiLznt"
};

// Client Supabase instance
export const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

export const config = SUPABASE_CONFIG;
