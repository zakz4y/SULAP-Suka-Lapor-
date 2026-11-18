/**
 * SULAP API Client & Supabase RPC Calls (Vanilla JS)
 * Sesuai spesifikasi docs/api-contract.md
 */
import { supabase } from './config.js';

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
const LOCAL_STORAGE_REPORTS_KEY = 'sulap_local_reports';

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

/**
 * 1. GET /reports — Feed Laporan (v_reports_feed)
 */
export async function fetchFeedReports({ query = '', status = '', categoryId = '', mine = false, limit = 50 } = {}) {
  let reports = [];

  if (supabase) {
    try {
      let req = supabase
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
      if (!error && data && data.length > 0) {
        reports = data;
        saveLocalReports(reports);
      } else {
        // Fallback jika view v_reports_feed belum ada data atau RLS
        const fb = await supabase
          .from('reports')
          .select('id, public_no, title, description, current_status_group, created_at, updated_at, location_text, latitude, longitude, category_id, version')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

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

  // Jika tetap kosong sama sekali (pertama kali buka), isi dengan data rujukan warga
  if (!reports || reports.length === 0) {
    reports = getInitialMockReports();
    saveLocalReports(reports);
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

  return reports;
}

/**
 * 2. GET /reports/{publicNo} — Detail Laporan Lengkap
 */
export async function fetchReportDetail(reportIdOrPublicNo) {
  let report = null;
  let timeline = [];
  let inspections = [];

  if (supabase) {
    try {
      // Ambil laporan
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportIdOrPublicNo);
      let query = supabase.from('reports').select('*, categories(id, name, slug), status_definitions(id, label, group, color_hex)');
      
      if (isUuid) {
        query = query.eq('id', reportIdOrPublicNo);
      } else {
        query = query.eq('public_no', reportIdOrPublicNo);
      }
      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        report = data;

        // Ambil timeline
        const tlRes = await supabase
          .from('v_report_timeline')
          .select('*')
          .eq('report_id', report.id)
          .order('created_at', { ascending: true });
        if (!tlRes.error && tlRes.data) {
          timeline = tlRes.data;
        }

        // Ambil inspeksi
        const insRes = await supabase
          .from('inspections')
          .select('id, findings, inspected_at, created_at, inspector_id, profiles(display_name)')
          .eq('report_id', report.id)
          .order('inspected_at', { ascending: false });
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
          to_label: 'Baru Masuk',
          to_group: 'new',
          actor_display_name: 'Warga',
          note: 'Laporan pertama kali dibuat.',
          created_at: found.created_at
        }
      ];
    }
  }

  return { report, timeline, inspections };
}

/**
 * 3. POST /reports — Buat Laporan Baru (create_report RPC)
 */
export async function createReport({ title, description, categoryId, addressText, lat, lng, note }) {
  if (!supabase) throw new Error("Klien Supabase belum siap.");

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

  try {
    const { data, error } = await supabase.rpc('create_report', {
      p_category_id: finalCatId,
      p_title: title.trim(),
      p_description: description.trim(),
      p_location: locationPayload,
      p_upload_ids: []
    });

    if (error) {
      console.warn("RPC create_report error, simpan lokal sebagai fallback:", error);
      // Fallback lokal jika sesi belum di-set di DB
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
        photo_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_id: finalCatId,
        version: 1
      };
      const locals = getLocalReports();
      locals.unshift(newLocal);
      saveLocalReports(locals);
      return { id: localId, publicNo: newLocal.public_no };
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * 4. PATCH /reports/{publicNo}/status — Ubah Status (transition_report_status RPC)
 */
export async function transitionReportStatus({ reportId, toStatusId, note, resolutionSummary, closureReason, expectedVersion = 1 }) {
  if (!supabase) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await supabase.rpc('transition_report_status', {
    p_report_id: reportId,
    p_to_status_id: toStatusId,
    p_note: note || null,
    p_resolution_summary: resolutionSummary || null,
    p_closure_reason: closureReason || null,
    p_expected_version: expectedVersion
  });

  if (error) {
    console.error("RPC transition_report_status error:", error);
    throw error;
  }

  // Update data di cache lokal
  const locals = getLocalReports();
  const idx = locals.findIndex(r => r.id === reportId);
  if (idx !== -1) {
    locals[idx].status_group = data?.status?.group || locals[idx].status_group;
    locals[idx].status_label = data?.status?.label || locals[idx].status_label;
    locals[idx].version = data?.version || (locals[idx].version + 1);
    saveLocalReports(locals);
  }

  return data;
}

/**
 * 5. POST /reports/{publicNo}/inspections — Buat Inspeksi Baru (create_inspection RPC)
 */
export async function createInspection({ reportId, findings, inspectedAt = new Date().toISOString() }) {
  if (!supabase) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await supabase.rpc('create_inspection', {
    p_report_id: reportId,
    p_findings: findings.trim(),
    p_inspected_at: inspectedAt,
    p_upload_ids: []
  });

  if (error) {
    console.error("RPC create_inspection error:", error);
    throw error;
  }
  return data;
}

/**
 * 6. POST /reports/{publicNo}/reopen — Buka Kembali Laporan (reopen_report RPC)
 */
export async function reopenReport({ reportId, reason }) {
  if (!supabase) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await supabase.rpc('reopen_report', {
    p_report_id: reportId,
    p_reason: reason.trim(),
    p_upload_ids: []
  });

  if (error) {
    console.error("RPC reopen_report error:", error);
    throw error;
  }
  return data;
}

/**
 * 7. GET /categories — Daftar Kategori Aktif
 */
export async function fetchCategories() {
  if (!supabase) return DEFAULT_CATEGORIES;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

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
  if (!supabase) return DEFAULT_STATUS_DEFINITIONS;

  try {
    const { data, error } = await supabase
      .from('status_definitions')
      .select('id, group, label, color_hex, requires_note, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_STATUS_DEFINITIONS;
    }
    return data.map(d => ({
      id: d.id,
      group: d.group,
      label: d.label,
      colorHex: d.color_hex,
      requiresNote: d.requires_note
    }));
  } catch {
    return DEFAULT_STATUS_DEFINITIONS;
  }
}

/**
 * 9. GET /notifications — Daftar Notifikasi Warga
 */
export async function fetchNotifications(unreadOnly = false) {
  if (!supabase) return getMockNotifications();

  try {
    let req = supabase
      .from('notifications')
      .select('id, type, title, body, report_id, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (unreadOnly) {
      req = req.is('read_at', null);
    }

    const { data, error } = await req;
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
  if (!supabase) return 2;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);

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
  if (!supabase) return { updated: ids.length || 1 };

  try {
    const { data, error } = await supabase.rpc('mark_notifications_read', {
      p_ids: ids,
      p_all: all
    });
    if (error) throw error;
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
  if (!supabase) throw new Error("Klien Supabase belum siap.");

  const { data, error } = await supabase.rpc('join_rt', {
    p_method: method,
    p_code: code,
    p_rt_slug: rtSlug,
    p_note: note
  });

  if (error) {
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

/**
 * Mock data rujukan awal saat basis data kosong
 */
function getInitialMockReports() {
  return [
    {
      id: 'mock-01',
      public_no: 'SULAP-RT01-0042',
      title: 'Saluran air tersumbat di depan gang',
      description: 'Air tidak mengalir sejak hujan lebat kemarin sore dan mulai mengeluarkan bau tidak sedap ke pemukiman warga.',
      status_group: 'in_progress',
      status_label: 'Dalam Penanganan',
      status_color: '#0E6B5C',
      location_text: 'Gang Melati 2, depan pos ronda',
      latitude_approx: '-6.242',
      longitude_approx: '106.799',
      photo_count: 2,
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      category_name: 'Saluran Air',
      version: 2
    },
    {
      id: 'mock-02',
      public_no: 'SULAP-RT01-0041',
      title: 'Lampu penerangan jalan padam di perempatan utama',
      description: 'Lampu jalan tiang nomor 04 mati total sejak dua hari lalu. Area menjadi gelap dan rawan kecelakaan di malam hari.',
      status_group: 'inspection',
      status_label: 'Inspeksi Lapangan',
      status_color: '#B45309',
      location_text: 'Perempatan Jl. Kenanga & Melati',
      latitude_approx: '-6.241',
      longitude_approx: '106.798',
      photo_count: 1,
      created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      category_name: 'Lampu Jalan',
      version: 1
    },
    {
      id: 'mock-03',
      public_no: 'SULAP-RT01-0040',
      title: 'Tumpukan sampah liar di samping kebun kosong',
      description: 'Ada oknum membuang kantong sampah di pinggir jalan kebun. Perlu dibersihkan dan dipasang plang peringatan larangan membuang sampah.',
      status_group: 'new',
      status_label: 'Baru Masuk',
      status_color: '#1D4ED8',
      location_text: 'Samping kebun RT 01',
      latitude_approx: '-6.243',
      longitude_approx: '106.801',
      photo_count: 1,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      category_name: 'Sampah',
      version: 1
    },
    {
      id: 'mock-04',
      public_no: 'SULAP-RT01-0039',
      title: 'Jalan paving amblas setelah dilewati truk material',
      description: 'Sebagian paving block amblas sedalam kira-kira 15 cm. Membahayakan pengendara motor yang lewat saat gelap.',
      status_group: 'resolved',
      status_label: 'Selesai',
      status_color: '#16A34A',
      location_text: 'Depan rumah No. B-14',
      latitude_approx: '-6.240',
      longitude_approx: '106.797',
      photo_count: 3,
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      category_name: 'Jalan Rusak',
      version: 3
    }
  ];
}

function getMockNotifications() {
  return [
    {
      id: 'notif-1',
      type: 'report_status_changed',
      title: 'Laporan SULAP-RT01-0042 diperbarui',
      body: 'Status berubah menjadi Dalam Penanganan. Petugas PPSU dijadwalkan turun ke lokasi.',
      report_id: 'mock-01',
      read_at: null,
      created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    },
    {
      id: 'notif-2',
      type: 'report_status_changed',
      title: 'Laporan SULAP-RT01-0039 selesai',
      body: 'Perbaikan paving block telah diselesaikan oleh tim perbaikan swadaya RT.',
      report_id: 'mock-04',
      read_at: null,
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
    }
  ];
}
