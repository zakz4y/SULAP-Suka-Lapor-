/**
 * SULAP API Client & Supabase RPC Calls (Vanilla JS)
 * Sesuai spesifikasi docs/api-contract.md
 */
import { supabase } from './config.js';

// Flag agar aplikasi tidak terus memanggil Supabase saat kredensial ditolak (401)
let supabaseAuthFailed = false;

function sbClient() {
  return supabaseAuthFailed ? null : supabase;
}

function noteAuthError(error) {
  if (!error) return;
  const status = String(error.status || error.code || '');
  const msg = String(error.message || error.error_description || '');
  if (status === '401' || /invalid api key|jwt|unauthorized|invalid claim/i.test(msg)) {
    if (!supabaseAuthFailed) {
      supabaseAuthFailed = true;
      console.warn('[SULAP] Supabase menolak kredensial (401): periksa anonKey di js/config.js. Mode data lokal diaktifkan.');
    }
  }
}

// Fallback seed kategori sesuai supabase/init.sql
export const DEFAULT_CATEGORIES = [
  { id: '33333333-3333-3333-3333-333333333333', name: 'Saluran Air', slug: 'saluran-air', description: 'Drainase, selokan, dan genangan air' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Lampu Jalan', slug: 'lampu-jalan', description: 'Lampu penerangan jalan dan gang' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Sampah', slug: 'sampah', description: 'Tumpukan sampah, TPS, dan kebersihan' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Jalan Rusak', slug: 'jalan-rusak', description: 'Jalan berlubang, retak, atau amblas' },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Fasilitas Umum', slug: 'fasilitas-umum', description: 'Taman, pos ronda, dan fasilitas bersama' }
];

// Fallback status definitions sesuai supabase/init.sql
export const DEFAULT_STATUS_DEFINITIONS = [
  { id: 'stat-01-new', group: 'new', label: 'Baru Masuk', colorHex: '#1D4ED8', requiresNote: false },
  { id: 'stat-02-triaged', group: 'triaged', label: 'Sudah Diperiksa', colorHex: '#7C3AED', requiresNote: false },
  { id: 'stat-03-inspection', group: 'inspection', label: 'Inspeksi Lapangan', colorHex: '#B45309', requiresNote: false },
  { id: 'stat-04-process', group: 'in_progress', label: 'Dalam Penanganan', colorHex: '#0E6B5C', requiresNote: false },
  { id: 'stat-05-resolved', group: 'resolved', label: 'Selesai', colorHex: '#16A34A', requiresNote: true },
  { id: 'stat-06-closed', group: 'closed', label: 'Ditutup', colorHex: '#6B7280', requiresNote: true },
  { id: 'stat-07-reopened', group: 'reopened', label: 'Dibuka Kembali', colorHex: '#DC2626', requiresNote: false }
];

// Mock data rujukan lokal jika jaringan offline / Supabase kosong
const LOCAL_STORAGE_REPORTS_KEY = 'sulap_local_reports_v2';
const LOCAL_STORAGE_PHOTOS_KEY = 'sulap_report_photos';
let knownStatusDefinitions = [...DEFAULT_STATUS_DEFINITIONS];

function getLocalReports() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.warn('Gagal simpan local reports:', err);
  }
}

function getPhotoMap() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReportPhotos(publicNo, photos) {
  if (!publicNo || !photos || photos.length === 0) return;
  try {
    const map = getPhotoMap();
    map[publicNo] = photos;
    localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Gagal simpan foto laporan:', err);
  }
}

function attachLocalPhotos(reports) {
  const map = getPhotoMap();
  return (reports || []).map(r => {
    const photos = map[r.public_no];
    return photos ? { ...r, photos } : r;
  });
}

/**
 * 1. GET /reports — Feed Laporan (v_reports_feed)
 */
export async function fetchFeedReports({ query = '', status = '', categoryId = '', mine = false, limit = 50 } = {}) {
  let reports = [];
  const client = sbClient();

  if (client) {
    try {
      let req = client
        .from('v_reports_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status && status !== 'all') {
        req = req.eq('status_group', status);
      }

      if (categoryId) {
        req = req.eq('category_id', categoryId);
      }

      const { data, error } = await req;
      noteAuthError(error);
      if (!error && data && data.length > 0) {
        reports = data;
        saveLocalReports(reports);
      } else {
        // Fallback jika view v_reports_feed belum ada data atau RLS
        const fb = await client
          .from('reports')
          .select('id, public_no, title, description, current_status_group, created_at, updated_at, location_text, latitude, longitude, category_id, version')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        noteAuthError(fb.error);
        if (!fb.error && fb.data && fb.data.length > 0) {
          reports = fb.data.map(r => ({
            id: r.id,
            public_no: r.public_no,
            title: r.title,
            description: r.description,
            status_group: r.current_status_group || 'new',
            status_label: getStatusLabel(r.current_status_group || 'new'),
            status_color: getStatusColor(r.current_status_group || 'new'),
            location_text: r.location_text || 'Wilayah RT 01',
            latitude_approx: r.latitude ? Number(r.latitude).toFixed(3) : null,
            longitude_approx: r.longitude ? Number(r.longitude).toFixed(3) : null,
            photo_count: 0,
            created_at: r.created_at,
            updated_at: r.updated_at,
            category_id: r.category_id,
            version: r.version || 1
          }));
          saveLocalReports(reports);
        } else {
          reports = getLocalReports();
        }
      }
    } catch {
      reports = getLocalReports();
    }
  } else {
    reports = getLocalReports();
  }

  // Tidak ada seed laporan contoh: data kosong sampai warga membuat laporan
  if (!reports || reports.length === 0) {
    reports = [];
  }

  // Client filtering jika ada query pencarian
  if (query) {
    const q = query.toLowerCase().trim();
    reports = reports.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.public_no && r.public_no.toLowerCase().includes(q)) ||
      (r.location_text && r.location_text.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }

  return attachLocalPhotos(reports);
}

/**
 * 2. GET /reports/{publicNo} — Detail Laporan Lengkap
 */
export async function fetchReportDetail(reportIdOrPublicNo) {
  let report = null;
  let timeline = [];
  let inspections = [];
  const client = sbClient();

  if (client) {
    try {
      // Ambil laporan
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportIdOrPublicNo);
      let query = client.from('reports').select('*, categories(id, name, slug), status_definitions(id, label, group, color_hex)');
      
      if (isUuid) {
        query = query.eq('id', reportIdOrPublicNo);
      } else {
        query = query.eq('public_no', reportIdOrPublicNo);
      }
      const { data, error } = await query.maybeSingle();
      noteAuthError(error);

      if (!error && data) {
        report = data;

        // Ambil timeline
        const tlRes = await client
          .from('v_report_timeline')
          .select('*')
          .eq('report_id', report.id)
          .order('created_at', { ascending: true });
        noteAuthError(tlRes.error);
        if (!tlRes.error && tlRes.data) {
          timeline = tlRes.data;
        }

        // Ambil inspeksi
        const insRes = await client
          .from('inspections')
          .select('id, findings, inspected_at, created_at, inspector_id, profiles(display_name)')
          .eq('report_id', report.id)
          .order('inspected_at', { ascending: false });
        noteAuthError(insRes.error);
        if (!insRes.error && insRes.data) {
          inspections = insRes.data.map(item => ({
            id: item.id,
            findings: item.findings,
            inspectedAt: item.inspected_at,
            inspectorName: item.profiles?.display_name ? `${item.profiles.display_name} (Admin RT)` : 'Petugas RT'
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal ambil detail laporan dari Supabase:', err);
    }
  }

  // Fallback ke cache lokal jika tidak ditemukan
  if (!report) {
    const locals = getLocalReports();
    const found = locals.find(r => r.id === reportIdOrPublicNo || r.public_no === reportIdOrPublicNo);
    if (found) {
      report = {
        id: found.id,
        public_no: found.public_no,
        title: found.title,
        description: found.description || 'Tidak ada keterangan tambahan.',
        current_status_group: found.status_group || 'new',
        location_text: found.location_text || 'Wilayah RT 01',
        latitude: found.latitude_approx,
        longitude: found.longitude_approx,
        version: found.version || 1,
        created_at: found.created_at,
        updated_at: found.updated_at,
        categories: { name: found.category_name || 'Fasilitas Umum' }
      };
      timeline = [
        {
          id: 1,
          to_label: getStatusLabel(found.status_group || 'new'),
          to_group: found.status_group || 'new',
          actor_display_name: 'Warga',
          note: found.status_group && found.status_group !== 'new'
            ? 'Status terakhir tercatat pada perangkat ini.'
            : 'Laporan pertama kali dibuat.',
          created_at: found.updated_at || found.created_at
        }
      ];
    }
  }

  const photoMap = getPhotoMap();
  if (report && report.public_no && photoMap[report.public_no]) {
    report = { ...report, photos: photoMap[report.public_no] };
  }

  return { report, timeline, inspections };
}

/**
 * 3. POST /reports — Buat Laporan Baru (create_report RPC)
 */
export async function createReport({ title, description, categoryId, addressText, lat, lng, note, photos = [] }) {
  let finalCatId = categoryId;
  if (!finalCatId) {
    const cats = await fetchCategories();
    finalCatId = cats[0]?.id || DEFAULT_CATEGORIES[0].id;
  }

  const locationPayload = {
    source: (lat && lng) ? 'gps' : 'manual',
    latitude: lat ? parseFloat(lat) : null,
    longitude: lng ? parseFloat(lng) : null,
    accuracyM: (lat && lng) ? 12 : null,
    text: addressText || 'Lingkungan RT 01',
    note: note || null
  };

  const saveLocalFallback = () => {
    const localId = 'loc-' + Date.now();
    const seq = Math.floor(Math.random() * 900) + 100;
    const newLocal = {
      id: localId,
      public_no: `SULAP-RT01-${seq}`,
      title: title.trim(),
      description: description.trim(),
      status_group: 'new',
      status_label: 'Baru Masuk',
      status_color: '#1D4ED8',
      location_text: addressText || 'Lingkungan RT 01',
      latitude_approx: lat ? Number(lat).toFixed(3) : null,
      longitude_approx: lng ? Number(lng).toFixed(3) : null,
      photo_count: photos.length,
      photos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_id: finalCatId,
      version: 1
    };
    const locals = getLocalReports();
    locals.unshift(newLocal);
    saveLocalReports(locals);
    saveReportPhotos(newLocal.public_no, photos);
    return { id: localId, publicNo: newLocal.public_no };
  };

  const client = sbClient();
  if (!client) {
    return saveLocalFallback();
  }

  try {
    const { data, error } = await client.rpc('create_report', {
      p_category_id: finalCatId,
      p_title: title.trim(),
      p_description: description.trim(),
      p_location: locationPayload,
      p_upload_ids: []
    });

    if (error) {
      noteAuthError(error);
      console.warn("RPC create_report error, simpan lokal sebagai fallback:", error);
      return saveLocalFallback();
    }

    const publicNo = data?.publicNo || data?.public_no;
    if (publicNo) saveReportPhotos(publicNo, photos);
    return data;
  } catch (err) {
    console.warn("create_report gagal, simpan lokal:", err);
    return saveLocalFallback();
  }
}

/**
 * 4. PATCH /reports/{publicNo}/status — Ubah Status (transition_report_status RPC)
 */
export async function transitionReportStatus({ reportId, toStatusId, note, resolutionSummary, closureReason, expectedVersion = 1 }) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(reportId));
  const statusDef = knownStatusDefinitions.find(s => s.id === toStatusId)
    || knownStatusDefinitions.find(s => s.group === toStatusId)
    || DEFAULT_STATUS_DEFINITIONS.find(s => s.id === toStatusId)
    || DEFAULT_STATUS_DEFINITIONS.find(s => s.group === toStatusId);

  const updateLocal = () => {
    const locals = getLocalReports();
    const idx = locals.findIndex(r => String(r.id) === String(reportId) || String(r.public_no) === String(reportId));
    if (idx === -1) throw new Error('Laporan tidak ditemukan pada penyimpanan lokal.');
    if (!statusDef) throw new Error('Status tujuan tidak valid.');

    locals[idx].status_group = statusDef.group;
    locals[idx].status_label = statusDef.label;
    locals[idx].status_color = statusDef.colorHex;
    locals[idx].version = (locals[idx].version || 1) + 1;
    locals[idx].updated_at = new Date().toISOString();
    saveLocalReports(locals);

    return {
      status: { group: statusDef.group, label: statusDef.label },
      version: locals[idx].version,
      local: true
    };
  };

  // Laporan lokal (offline / RPC gagal sebelumnya) tidak bisa lewat RPC
  const client = sbClient();
  if (!client || !isUuid) {
    return updateLocal();
  }

  const { data, error } = await client.rpc('transition_report_status', {
    p_report_id: reportId,
    p_to_status_id: toStatusId,
    p_note: note || null,
    p_resolution_summary: resolutionSummary || null,
    p_closure_reason: closureReason || null,
    p_expected_version: expectedVersion
  });

  if (error) {
    noteAuthError(error);
    console.warn("RPC transition_report_status error, memakai fallback lokal:", error);
    return updateLocal();
  }

  // Update data di cache lokal
  const locals = getLocalReports();
  const idx = locals.findIndex(r => String(r.id) === String(reportId));
  if (idx !== -1) {
    locals[idx].status_group = data?.status?.group || locals[idx].status_group;
    locals[idx].status_label = data?.status?.label || locals[idx].status_label;
    locals[idx].version = data?.version || (locals[idx].version + 1);
    locals[idx].updated_at = new Date().toISOString();
    saveLocalReports(locals);
  }

  return data;
}

/**
 * 5. POST /reports/{publicNo}/inspections — Buat Inspeksi Baru (create_inspection RPC)
 */
export async function createInspection({ reportId, findings, inspectedAt = new Date().toISOString() }) {
  const client = sbClient();
  if (!client) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await client.rpc('create_inspection', {
    p_report_id: reportId,
    p_findings: findings.trim(),
    p_inspected_at: inspectedAt,
    p_upload_ids: []
  });

  if (error) {
    noteAuthError(error);
    console.error("RPC create_inspection error:", error);
    throw error;
  }
  return data;
}

/**
 * 6. POST /reports/{publicNo}/reopen — Buka Kembali Laporan (reopen_report RPC)
 */
export async function reopenReport({ reportId, reason }) {
  const client = sbClient();
  if (!client) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await client.rpc('reopen_report', {
    p_report_id: reportId,
    p_reason: reason.trim(),
    p_upload_ids: []
  });

  if (error) {
    noteAuthError(error);
    console.error("RPC reopen_report error:", error);
    throw error;
  }
  return data;
}

/**
 * 7. GET /categories — Daftar Kategori Aktif
 */
export async function fetchCategories() {
  const client = sbClient();
  if (!client) return DEFAULT_CATEGORIES;

  try {
    const { data, error } = await client
      .from('categories')
      .select('id, name, slug, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) noteAuthError(error);
    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    return data;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/**
 * 8. GET /status-definitions — Definisi Status RT
 */
export async function fetchStatusDefinitions() {
  const client = sbClient();
  if (!client) return knownStatusDefinitions;

  try {
    const { data, error } = await client
      .from('status_definitions')
      .select('id, group, label, color_hex, requires_note, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) noteAuthError(error);
    if (error || !data || data.length === 0) {
      return knownStatusDefinitions;
    }
    knownStatusDefinitions = data.map(d => ({
      id: d.id,
      group: d.group,
      label: d.label,
      colorHex: d.color_hex,
      requiresNote: d.requires_note
    }));
    return knownStatusDefinitions;
  } catch {
    return knownStatusDefinitions;
  }
}

/**
 * 9. GET /notifications — Daftar Notifikasi Warga
 */
export async function fetchNotifications(unreadOnly = false) {
  const client = sbClient();
  if (!client) return getMockNotifications();

  try {
    let req = client
      .from('notifications')
      .select('id, type, title, body, report_id, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (unreadOnly) {
      req = req.is('read_at', null);
    }

    const { data, error } = await req;
    noteAuthError(error);
    if (error || !data) {
      return getMockNotifications();
    }
    return data;
  } catch {
    return getMockNotifications();
  }
}

/**
 * 10. GET /notifications/unread-count — Jumlah Belum Dibaca
 */
export async function fetchUnreadNotificationCount() {
  const client = sbClient();
  if (!client) return 2;

  try {
    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);

    if (error) noteAuthError(error);
    if (error || count === null) return 0;
    return count;
  } catch {
    return 0;
  }
}

/**
 * 11. POST /notifications/read — Tandai Sudah Dibaca
 */
export async function markNotificationsRead({ ids = [], all = false }) {
  const client = sbClient();
  if (!client) return { updated: ids.length || 1 };

  try {
    const { data, error } = await client.rpc('mark_notifications_read', {
      p_ids: ids,
      p_all: all
    });
    if (error) {
      noteAuthError(error);
      throw error;
    }
    return data;
  } catch (err) {
    console.warn("Gagal mark read:", err);
    return { updated: 0 };
  }
}

/**
 * 12. POST /memberships/join — Gabung RT via Kode Undangan atau Permohonan
 */
export async function joinRt({ method = 'invite_code', code = null, rtSlug = 'rt-01-melati', note = null }) {
  const client = sbClient();
  if (!client) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await client.rpc('join_rt', {
    p_method: method,
    p_code: code,
    p_rt_slug: rtSlug,
    p_note: note
  });

  if (error) {
    noteAuthError(error);
    console.error("join_rt error:", error);
    throw error;
  }
  return data;
}

/**
 * Helper: Label & Warna status
 */
function getStatusLabel(group) {
  const map = {
    new: 'Baru Masuk',
    triaged: 'Sudah Diperiksa',
    inspection: 'Inspeksi Lapangan',
    in_progress: 'Dalam Penanganan',
    resolved: 'Selesai',
    closed: 'Ditutup',
    reopened: 'Dibuka Kembali'
  };
  return map[group] || 'Baru Masuk';
}

function getStatusColor(group) {
  const map = {
    new: '#1D4ED8',
    triaged: '#7C3AED',
    inspection: '#B45309',
    in_progress: '#0E6B5C',
    resolved: '#16A34A',
    closed: '#6B7280',
    reopened: '#DC2626'
  };
  return map[group] || '#1D4ED8';
}

function getMockNotifications() {
  return [];
}
