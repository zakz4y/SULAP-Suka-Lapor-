/**
 * SULAP Auth & Session Helper (Vanilla JS)
 * Selaras dengan docs/api-contract.md (GET /me dan GET /me/capabilities)
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
      data: { display_name: fullName, full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error("SignOut error:", error);
  localStorage.removeItem('sulap_cached_profile');
  localStorage.removeItem('sulap_cached_membership');
  window.location.reload();
}

export async function getUserProfile(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.warn("Ambil profile gagal, gunakan fallback:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Exception ambil profile:", err.message);
    return null;
  }
}

/**
 * Mengambil keanggotaan aktif RT pengguna (docs/api-contract.md GET /me)
 */
export async function getUserMembership(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id, rt_id, role, status, request_note, created_at, rts(id, name, slug, rw_name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      // Fallback membership resident default di RT Demo
      return {
        id: 'mock-membership-id',
        rt_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'resident',
        status: 'active',
        rts: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'RT 01 Melati',
          slug: 'rt-01-melati',
          rw_name: 'RW 03'
        }
      };
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Menghitung capabilities pengguna berdasarkan role (docs/api-contract.md GET /me/capabilities)
 */
export function calculateCapabilities(role) {
  const isAdmin = role === 'rt_admin' || role === 'developer';
  const isDev = role === 'developer';

  return {
    canCreateReport: true,
    canChangeStatus: isAdmin,
    canInspect: isAdmin,
    canManageMembers: isAdmin,
    canManageCategories: isAdmin,
    canManageStatuses: isAdmin,
    canSoftDeleteReport: isDev,
    canViewAuditLog: isDev,
    canExport: isAdmin
  };
}
