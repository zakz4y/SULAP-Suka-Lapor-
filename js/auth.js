/**
 * SULAP Auth & Session Helper (Vanilla JS)
 */
import { supabase } from './config.js';

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error("Supabase client belum siap");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password, fullName) {
  if (!supabase) throw new Error("Supabase client belum siap");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error("SignOut error:", error);
  window.location.reload();
}

export async function getUserProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.warn("Gagal ambil profile:", error.message);
    return null;
  }
  return data;
}
