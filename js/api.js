/**
 * SULAP Reports API & Supabase RPC Calls (Vanilla JS)
 */
import { supabase } from './config.js';

// Default kategori dari seed supabase/init.sql jika query RLS dibatasi
const DEFAULT_CATEGORIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Fasilitas Umum', slug: 'fasilitas-umum' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Lampu Jalan', slug: 'lampu-jalan' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Saluran Air', slug: 'saluran-air' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Sampah & Kebersihan', slug: 'sampah' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Jalan Rusak', slug: 'jalan-rusak' }
];

export async function fetchFeedReports() {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('v_reports_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    const fallback = await supabase
      .from('reports')
      .select('id, public_no, title, description, current_status_group, created_at, location_text, latitude, longitude')
      .order('created_at', { ascending: false })
      .limit(30);
    return fallback.data || [];
  }
  return data || [];
}

export async function fetchCategories() {
  if (!supabase) return DEFAULT_CATEGORIES;
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_CATEGORIES;
  }
  return data;
}

export async function createReport({ title, description, categoryId, addressText, lat, lng }) {
  if (!supabase) throw new Error("Supabase client belum siap");

  // Siapkan UUID kategori valid
  let finalCatId = categoryId;
  if (!finalCatId || finalCatId === '') {
    const cats = await fetchCategories();
    finalCatId = cats[0]?.id || DEFAULT_CATEGORIES[0].id;
  }

  const locationPayload = {
    source: (lat && lng) ? 'gps' : 'manual',
    latitude: lat ? parseFloat(lat) : null,
    longitude: lng ? parseFloat(lng) : null,
    accuracy_m: (lat && lng) ? 10 : null,
    text: addressText || 'Lingkungan RT'
  };

  // Panggil RPC create_report
  const { data, error } = await supabase.rpc('create_report', {
    p_category_id: finalCatId,
    p_title: title,
    p_description: description,
    p_location: locationPayload,
    p_upload_ids: []
  });

  if (error) {
    console.error("Detail Error Supabase RPC:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    alert(`Gagal mengirim: ${error.message} (${error.hint || error.details || error.code})`);
    throw error;
  }
  return data;
}
