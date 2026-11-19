/**
 * SULAP Shared Module
 * Mengekstrak semua logika BERSAMA dari app.js agar bisa diimport oleh semua halaman (MPA).
 */

import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut, getUserProfile, getUserMembership, calculateCapabilities } from './auth.js';
import {
  fetchFeedReports,
  fetchReportDetail,
  createReport,
  transitionReportStatus,
  createInspection,
  reopenReport,
  fetchCategories,
  fetchStatusDefinitions,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationsRead,
  joinRt
} from './api.js';
import { initPWA, promptPwaInstall, showToast } from './pwa.js';

// ---------------------------------------------------------------------------
// Shared Application State
// Gunakan object tunggal agar bisa dimutasi lintas modul dengan import langsung
// ---------------------------------------------------------------------------
export const state = {
  currentUser: null,
  currentProfile: null,
  currentMembership: null,
  currentRole: 'resident',
  userCapabilities: {},
  cachedReports: [],
  cachedCategories: [],
  cachedStatusDefinitions: [],
  cachedWargaList: [],
  currentOpenReport: null,
  pendingPhotos: []
};

// ---------------------------------------------------------------------------
// 1. Inisialisasi Shared (dipanggil oleh setiap halaman)
// ---------------------------------------------------------------------------
export async function initShared() {
  initTheme();
  setupSharedEventListeners();
  initPWA({
    onInstallable: () => {
      document.getElementById('sidebar-pwa-card')?.classList.remove('hidden');
    }
  });

  await loadWargaData();
  await checkUserSession();
  await loadMetadata();
  await loadNotificationsBadge();
}

// ---------------------------------------------------------------------------
// 2. Manajemen Tema (Terang / Gelap)
// ---------------------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('sulap_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
  }
}

// ---------------------------------------------------------------------------
// 3. Data Warga dari Backend / CSV
// ---------------------------------------------------------------------------
export async function fetchWargaListSafe() {
  try {
    const res = await fetch('/api/v1/warga');
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('Fallback fetchWargaListSafe:', err.message);
  }
  return state.cachedWargaList;
}

export async function loadWargaData() {
  state.cachedWargaList = await fetchWargaListSafe();

  const quickWargaSelect = document.getElementById('quick-warga-select');
  if (quickWargaSelect && state.cachedWargaList.length > 0) {
    quickWargaSelect.innerHTML = '<option value="">-- Pilih dari 36 Warga RT --</option>' +
      state.cachedWargaList.map(w =>
        `<option value="${w.username}">${w.nama} (${w.jabatan}) - [${w.role}]</option>`
      ).join('');

    quickWargaSelect.onchange = (e) => {
      const selectedUsername = e.target.value;
      const found = state.cachedWargaList.find(w => w.username === selectedUsername);
      if (found) {
        document.getElementById('auth-email').value = found.username;
        document.getElementById('auth-password').value = found.password;
      }
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Status Sesi & Profil Pengguna
// ---------------------------------------------------------------------------
export async function checkUserSession() {
  const simSession = localStorage.getItem('sulap_sim_user');
  if (simSession) {
    try {
      const parsed = JSON.parse(simSession);
      applyUserContext(parsed);
      return;
    } catch {
      localStorage.removeItem('sulap_sim_user');
    }
  }

  state.currentUser = await getCurrentUser();
  if (state.currentUser) {
    state.currentProfile = await getUserProfile(state.currentUser.id);
    state.currentMembership = await getUserMembership(state.currentUser.id);
    const role = state.currentMembership?.role || 'resident';
    const displayName =
      state.currentProfile?.display_name ||
      state.currentUser.user_metadata?.display_name ||
      state.currentUser.email.split('@')[0];

    applyUserContext({
      id: state.currentUser.id,
      displayName,
      email: state.currentUser.email,
      role,
      jabatan: state.currentUser.user_metadata?.jabatan ||
        (role === 'rt_admin' ? 'Pengurus RT' : 'Warga RT')
    });
  } else {
    applyUserContext({
      id: 'guest-user',
      displayName: 'Warga Tamu',
      role: 'resident',
      jabatan: 'Warga RT'
    }, true);
  }
}

export function applyUserContext(user, isGuest = false) {
  state.currentRole = user.role || 'resident';
  state.userCapabilities = calculateCapabilities(state.currentRole);

  const displayName = user.displayName || 'Warga';
  const initial = displayName.charAt(0).toUpperCase();

  document.getElementById('user-name-display')?.textContent && (document.getElementById('user-name-display').textContent = displayName);
  document.getElementById('user-role-display') && (document.getElementById('user-role-display').textContent = formatRoleLabel(state.currentRole));
  document.getElementById('user-avatar-initial') && (document.getElementById('user-avatar-initial').textContent = initial);
  document.getElementById('greeting-display') && (document.getElementById('greeting-display').textContent = `Selamat ${getGreetingTime()}, ${displayName} 👋`);
  document.getElementById('greeting-subtitle') && (document.getElementById('greeting-subtitle').textContent = `Pantau keterbukaan & penanganan kendala lingkungan RT 01 Melati.`);

  document.getElementById('settings-display-name') && (document.getElementById('settings-display-name').textContent = displayName);
  document.getElementById('settings-jabatan-badge') && (document.getElementById('settings-jabatan-badge').textContent = user.jabatan || 'Warga');
  document.getElementById('settings-role-badge') && (document.getElementById('settings-role-badge').textContent = formatRoleLabel(state.currentRole));
  document.getElementById('settings-rt-name') && (document.getElementById('settings-rt-name').textContent = 'RT 01 Melati / RW 03');

  updateRoleNavigationVisibility(state.currentRole);

  const btnSettingsAuth = document.getElementById('btn-settings-auth-action');
  const btnModalLogout = document.getElementById('btn-modal-logout');
  const authModal = document.getElementById('auth-modal');

  if (isGuest) {
    if (btnSettingsAuth) {
      btnSettingsAuth.textContent = 'Masuk / Daftar Akun';
      btnSettingsAuth.onclick = () => authModal?.classList.remove('hidden');
    }
    btnModalLogout?.classList.add('hidden');
  } else {
    if (btnSettingsAuth) {
      btnSettingsAuth.textContent = 'Keluar dari Akun';
      btnSettingsAuth.onclick = handleSignOut;
    }
    btnModalLogout?.classList.remove('hidden');
  }
}

export function updateRoleNavigationVisibility(role) {
  const isAdmin = role === 'rt_admin' || role === 'developer';
  const isDev = role === 'developer';

  const navTitleAdmin = document.getElementById('nav-title-admin');
  const navBtnAdmin = document.getElementById('nav-btn-admin');
  const mobileAdminBtn = document.getElementById('mobile-admin-header-btn');
  const mobileDevBtn = document.getElementById('mobile-dev-header-btn');
  const navTitleDev = document.getElementById('nav-title-dev');
  const navBtnDev = document.getElementById('nav-btn-developer');

  if (navTitleAdmin) navTitleAdmin.style.display = isAdmin ? 'block' : 'none';
  if (navBtnAdmin) navBtnAdmin.parentElement.style.display = isAdmin ? 'block' : 'none';
  mobileAdminBtn?.classList.toggle('hidden', !isAdmin);
  mobileDevBtn?.classList.toggle('hidden', !isDev);
  if (navTitleDev) navTitleDev.style.display = isDev ? 'block' : 'none';
  if (navBtnDev) navBtnDev.parentElement.style.display = isDev ? 'block' : 'none';
}

function formatRoleLabel(role) {
  if (role === 'rt_admin') return 'Pengurus / Admin RT';
  if (role === 'developer') return 'Super Admin / Developer';
  if (role === 'officer') return 'Petugas Lapangan';
  return 'Warga RT Aktif';
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Pagi';
  if (hour < 15) return 'Siang';
  if (hour < 18) return 'Sore';
  return 'Malam';
}

// ---------------------------------------------------------------------------
// 5. Metadata Kategori & Status
// ---------------------------------------------------------------------------
export async function loadMetadata() {
  state.cachedCategories = await fetchCategories();
  state.cachedStatusDefinitions = await fetchStatusDefinitions();

  const filterCategorySelect = document.getElementById('filter-category-select');
  if (filterCategorySelect) {
    filterCategorySelect.innerHTML = '<option value="">Semua Kategori</option>' +
      state.cachedCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  }

  const catInput = document.getElementById('report-cat-input');
  if (catInput) {
    catInput.innerHTML = state.cachedCategories.map(c =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');
  }
}

// ---------------------------------------------------------------------------
// 6. Render Kartu Tiket & Event Klik
// ---------------------------------------------------------------------------
export function generateTicketCardHtml(report) {
  const group = report.status_group || 'new';
  const cfg = getStatusConfig(group);
  const timeFormatted = report.created_at ? formatRelativeTime(report.created_at) : 'Baru saja';
  const locationText = report.location_text || 'Wilayah RT 01';

  const s1 = cfg.step >= 1 ? 'active' : '';
  const s2 = cfg.step >= 2 ? 'active' : '';
  const s3 = cfg.step >= 3 ? 'active' : '';
  const s4 = cfg.step >= 4 ? 'active' : '';

  return `
    <article class="ticket-card" data-report-id="${escapeHtml(report.id || report.public_no)}">
      <div class="ticket-card-header">
        <span class="ticket-id tabular-nums">${escapeHtml(report.public_no || '#RT01-0000')}</span>
        <span class="status-chip ${cfg.chipClass}">
          <i class="ph ${cfg.icon}"></i>
          <span>${escapeHtml(report.status_label || cfg.label)}</span>
        </span>
      </div>

      <div class="ticket-body-layout">
        <div class="ticket-thumb">
          <i class="ph ${getCategoryIcon(report.category_name)}"></i>
        </div>
        <div class="ticket-info">
          <h4 class="ticket-title">${escapeHtml(report.title)}</h4>
          <p class="ticket-desc">${escapeHtml(report.description || '')}</p>
        </div>
      </div>

      <div class="ticket-step-progress">
        <div class="step-dot ${s1}" title="Baru Masuk"></div>
        <div class="step-line ${s2}"></div>
        <div class="step-dot ${s2}" title="Ditinjau"></div>
        <div class="step-line ${s3}"></div>
        <div class="step-dot ${s3}" title="Diproses"></div>
        <div class="step-line ${s4}"></div>
        <div class="step-dot ${s4}" title="Selesai"></div>
        <span class="ticket-time-meta">📍 ${escapeHtml(locationText)} • ${timeFormatted}</span>
      </div>
    </article>
  `;
}

export function attachReportClickEvents(container) {
  container.querySelectorAll('[data-report-id]').forEach(card => {
    card.addEventListener('click', () => {
      const reportId = card.getAttribute('data-report-id');
      openReportDetail(reportId);
    });
  });
}

// ---------------------------------------------------------------------------
// 7. Modal Detail Laporan & Timeline
// ---------------------------------------------------------------------------
export async function openReportDetail(reportIdOrNo) {
  const reportDetailModal = document.getElementById('report-detail-modal');
  if (!reportDetailModal) return;

  try {
    reportDetailModal.classList.remove('hidden');
    document.getElementById('detail-public-no').textContent = 'Memuat...';
    document.getElementById('detail-title').textContent = 'Memuat detail aduan warga...';
    document.getElementById('detail-description').textContent = '';
    document.getElementById('detail-timeline-container').innerHTML =
      '<div style="padding: 10px; color: var(--ink-tertiary);">Memuat riwayat...</div>';

    const detailData = await fetchReportDetail(reportIdOrNo);
    const report = detailData.report;
    if (!report) {
      showToast('Gagal memuat detail laporan.', 'error');
      reportDetailModal.classList.add('hidden');
      return;
    }

    state.currentOpenReport = report;

    document.getElementById('detail-public-no').textContent = report.public_no || '#SULAP-RT01';
    document.getElementById('detail-title').textContent = report.title;
    document.getElementById('detail-description').textContent = report.description || 'Tidak ada deskripsi rinci.';
    document.getElementById('detail-category-badge').textContent = report.categories?.name || report.category_name || 'Fasilitas Umum';
    document.getElementById('detail-location-text').textContent = report.location_text || 'Wilayah RT 01';

    if (report.latitude && report.longitude) {
      document.getElementById('detail-location-coords').textContent =
        `Koordinat: ${report.latitude}, ${report.longitude} (Akurasi ~110m)`;
    } else {
      document.getElementById('detail-location-coords').textContent = 'Koordinat GPS tidak disertakan.';
    }

    renderDetailPhotos(report.photos);

    document.getElementById('detail-created-at').textContent = formatRelativeTime(report.created_at);

    const statusGroup = report.current_status_group || report.status_group || 'new';
    const cfg = getStatusConfig(statusGroup);
    const chipEl = document.getElementById('detail-status-chip');
    if (chipEl) {
      chipEl.className = `status-chip ${cfg.chipClass}`;
      chipEl.innerHTML = `<i class="ph ${cfg.icon}"></i> <span>${escapeHtml(report.status_definitions?.label || report.status_label || cfg.label)}</span>`;
    }

    updateModalStepTracker(cfg.step);
    renderTimeline(detailData.timeline);
    renderInspections(detailData.inspections);
    setupDetailActionButtons(report);

  } catch (err) {
    showToast('Terjadi kesalahan: ' + err.message, 'error');
  }
}

function updateModalStepTracker(step) {
  for (let i = 1; i <= 4; i++) {
    const item = document.getElementById(`p-step-${i}`);
    if (item) item.classList.toggle('active', i <= step);
    if (i < 4) {
      const conn = document.getElementById(`p-conn-${i}`);
      if (conn) conn.classList.toggle('active', i < step);
    }
  }
}

function renderTimeline(timeline) {
  const container = document.getElementById('detail-timeline-container');
  if (!container) return;
  if (!timeline || timeline.length === 0) {
    container.innerHTML = '<div style="font-size: 12px; color: var(--ink-tertiary);">Belum ada riwayat mutasi status.</div>';
    return;
  }

  container.innerHTML = timeline.map(item => `
    <div class="timeline-step">
      <div class="timeline-step-header">
        <span class="timeline-actor-badge">${escapeHtml(item.actor_display_name || 'Petugas RT')}</span>
        <span class="timeline-time">${formatRelativeTime(item.created_at)}</span>
      </div>
      <div style="font-size: 12px; font-weight: 600; color: var(--ink-primary);">
        Status diubah ke: ${escapeHtml(item.to_label || 'Status Baru')}
      </div>
      ${item.note ? `<div class="timeline-note">${escapeHtml(item.note)}</div>` : ''}
    </div>
  `).join('');
}

function renderDetailPhotos(photos) {
  const section = document.getElementById('detail-photos-section');
  const container = document.getElementById('detail-photos-container');
  if (!section || !container) return;

  if (!photos || photos.length === 0) {
    section.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = photos.map(src => `
    <a href="${src}" target="_blank" rel="noopener" class="detail-photo-item">
      <img src="${src}" alt="Bukti foto laporan">
    </a>
  `).join('');
}

function renderInspections(inspections) {
  const section = document.getElementById('detail-inspections-section');
  const container = document.getElementById('detail-inspections-container');
  if (!section || !container) return;
  if (!inspections || inspections.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  container.innerHTML = inspections.map(ins => `
    <div class="inspection-card">
      <div class="inspection-card-top">
        <strong>${escapeHtml(ins.inspectorName)}</strong>
        <span>${formatRelativeTime(ins.inspectedAt || ins.created_at)}</span>
      </div>
      <p class="inspection-findings">${escapeHtml(ins.findings)}</p>
    </div>
  `).join('');
}

function setupDetailActionButtons(report) {
  const isAdmin = state.currentRole === 'rt_admin' || state.currentRole === 'developer';
  const isResolvedOrClosed = ['resolved', 'closed'].includes(report.current_status_group || report.status_group);

  document.getElementById('btn-admin-change-status')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('btn-admin-add-inspection')?.classList.toggle('hidden', !isAdmin);
  document.getElementById('btn-reporter-reopen')?.classList.toggle('hidden', !isResolvedOrClosed);
}

// ---------------------------------------------------------------------------
// 8. Modal Buat Laporan Baru
// ---------------------------------------------------------------------------
export function openCreateReportModal() {
  state.pendingPhotos = [];
  renderPhotoPreview();
  document.getElementById('report-title-input').value = '';
  document.getElementById('report-desc-input').value = '';
  document.getElementById('report-addr-input').value = '';
  document.getElementById('report-lat-input').value = '';
  document.getElementById('report-lng-input').value = '';
  const photoInput = document.getElementById('report-photo-input');
  const cameraInput = document.getElementById('report-camera-input');
  if (photoInput) photoInput.value = '';
  if (cameraInput) cameraInput.value = '';
  document.getElementById('report-modal')?.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// 9. Foto Laporan
// ---------------------------------------------------------------------------
const MAX_REPORT_PHOTOS = 3;

function compressImageFile(file, maxDim = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function addReportPhotos(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) return;

  const remaining = MAX_REPORT_PHOTOS - state.pendingPhotos.length;
  if (remaining <= 0) {
    showToast(`Maksimal ${MAX_REPORT_PHOTOS} foto per laporan.`, 'info');
    return;
  }

  const accepted = files.slice(0, remaining);
  if (files.length > remaining) {
    showToast(`Hanya ${remaining} foto lagi yang bisa ditambahkan.`, 'info');
  }

  try {
    for (const file of accepted) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageFile(file);
      state.pendingPhotos.push(compressed);
    }
  } catch (err) {
    showToast('Gagal memproses foto: ' + err.message, 'error');
  }

  renderPhotoPreview();
}

function renderPhotoPreview() {
  const container = document.getElementById('report-photo-preview');
  if (!container) return;

  container.innerHTML = state.pendingPhotos.map((src, idx) => `
    <div class="photo-preview-item">
      <img src="${src}" alt="Pratinjau foto ${idx + 1}">
      <button type="button" class="photo-remove-btn" data-photo-index="${idx}" aria-label="Hapus foto">
        <i class="ph ph-x"></i>
      </button>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// 10. Modal Admin: Mutasi Status
// ---------------------------------------------------------------------------
function openStatusModal() {
  if (!state.currentOpenReport) return;
  const statusModal = document.getElementById('status-modal');
  if (!statusModal) return;

  const select = document.getElementById('status-select-input');
  if (select) {
    select.innerHTML = state.cachedStatusDefinitions.map(s =>
      `<option value="${s.id}" data-group="${s.group}">${s.label}</option>`
    ).join('');

    document.getElementById('status-note-input').value = '';
    document.getElementById('status-resolution-input').value = '';
    document.getElementById('status-closure-input').value = '';
    toggleStatusConditionalFields(select.options[select.selectedIndex]?.getAttribute('data-group'));

    select.onchange = () => {
      const selectedGroup = select.options[select.selectedIndex]?.getAttribute('data-group');
      toggleStatusConditionalFields(selectedGroup);
    };
  }

  statusModal.classList.remove('hidden');
}

function toggleStatusConditionalFields(group) {
  document.getElementById('group-resolution-summary')?.classList.toggle('hidden', group !== 'resolved');
  document.getElementById('group-closure-reason')?.classList.toggle('hidden', group !== 'closed');
}

function openInspectionModal() {
  const inspectionModal = document.getElementById('inspection-modal');
  if (!inspectionModal) return;
  document.getElementById('inspection-findings-input').value = '';
  inspectionModal.classList.remove('hidden');
}

function openReopenModal() {
  const reopenModal = document.getElementById('reopen-modal');
  if (!reopenModal) return;
  document.getElementById('reopen-reason-input').value = '';
  reopenModal.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// 11. Notifikasi Badge
// ---------------------------------------------------------------------------
export async function loadNotificationsBadge() {
  const count = await fetchUnreadNotificationCount();
  const navDot = document.getElementById('nav-notif-dot');
  const mobDot = document.getElementById('mobile-notif-dot');

  if (count > 0) {
    navDot?.classList.remove('hidden');
    mobDot?.classList.remove('hidden');
  } else {
    navDot?.classList.add('hidden');
    mobDot?.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// 12. Auth – Sign Out
// ---------------------------------------------------------------------------
async function handleSignOut() {
  localStorage.removeItem('sulap_sim_user');
  await signOut();
  window.location.reload();
}

// ---------------------------------------------------------------------------
// 13. Setup Shared Event Listeners
// (tidak termasuk event listener spesifik halaman: refresh feed, filter pill, dll)
// ---------------------------------------------------------------------------
export function setupSharedEventListeners() {
  // Global helpers untuk inline event handler di generated HTML
  window.sulapOpenDetail = openReportDetail;
  window.sulapChangeRole = async (userId, newRole, id) => {
    try {
      const res = await fetch(`/api/v1/dev/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        showToast('Gagal mengubah peran pengguna.', 'error');
        return;
      }

      const localUser = state.cachedWargaList.find(w => String(w.uuid || w.id) === String(userId));
      if (localUser) localUser.role = newRole;

      showToast(`Peran pengguna berhasil diubah ke ${newRole}`, 'success');
    } catch (err) {
      showToast('Gagal mengubah peran: ' + err.message, 'error');
    }
  };

  // Tutup semua modal via [data-close-modal]
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  // Auth trigger
  const authModal = document.getElementById('auth-modal');
  document.getElementById('btn-auth-trigger')?.addEventListener('click', () => authModal?.classList.remove('hidden'));

  // Tombol Buat Laporan
  document.getElementById('btn-new-report')?.addEventListener('click', openCreateReportModal);
  document.getElementById('mobile-btn-new-report')?.addEventListener('click', openCreateReportModal);

  // Theme toggle
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sulap_theme', next);
    updateThemeIcon(next);
  });

  // Mobile: buka/tutup kolom pencarian
  const searchWrapper = document.getElementById('header-search-wrapper');
  document.getElementById('btn-search-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!searchWrapper) return;
    searchWrapper.classList.toggle('expanded');
    if (searchWrapper.classList.contains('expanded')) {
      document.getElementById('global-search-input')?.focus();
    }
  });

  // Foto bukti laporan
  document.getElementById('report-photo-input')?.addEventListener('change', (e) => {
    addReportPhotos(e.target.files);
    e.target.value = '';
  });
  document.getElementById('report-camera-input')?.addEventListener('change', (e) => {
    addReportPhotos(e.target.files);
    e.target.value = '';
  });
  document.getElementById('report-photo-preview')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-photo-index]');
    if (!btn) return;
    const idx = Number(btn.getAttribute('data-photo-index'));
    state.pendingPhotos.splice(idx, 1);
    renderPhotoPreview();
  });

  // PWA Install
  const handlePwaClick = async () => {
    const installed = await promptPwaInstall();
    if (!installed) {
      showToast('Pemasangan PWA: Tekan menu browser Anda lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen).', 'info');
    }
  };
  document.getElementById('btn-pwa-install-sidebar')?.addEventListener('click', handlePwaClick);
  document.getElementById('btn-install-pwa-settings')?.addEventListener('click', handlePwaClick);

  // GPS Geolocation
  const btnGps = document.getElementById('btn-get-gps');
  btnGps?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Peramban Anda tidak mendukung geolokasi GPS.', 'error');
      return;
    }
    btnGps.innerHTML = '<i class="ph ph-hourglass"></i> Mencari...';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        document.getElementById('report-lat-input').value = lat;
        document.getElementById('report-lng-input').value = lng;
        document.getElementById('report-addr-input').value =
          `GPS: ${lat}, ${lng} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`;
        btnGps.innerHTML = '<i class="ph ph-check"></i> Terisi';
      },
      () => {
        showToast('Izin GPS ditolak. Silakan ketik nama jalan manual.', 'info');
        btnGps.innerHTML = '<i class="ph ph-navigation-arrow"></i> GPS';
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });

  // Form Buat Laporan Baru
  const reportModal = document.getElementById('report-modal');
  const reportForm = document.getElementById('report-form');
  reportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('report-title-input').value;
    const description = document.getElementById('report-desc-input').value;
    const addressText = document.getElementById('report-addr-input').value;
    const categoryId = document.getElementById('report-cat-input').value;
    const lat = document.getElementById('report-lat-input').value;
    const lng = document.getElementById('report-lng-input').value;
    const submitBtn = reportForm.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Mengirim...';
      const res = await createReport({
        title,
        description,
        categoryId,
        addressText,
        lat,
        lng,
        photos: [...state.pendingPhotos]
      });
      showToast(`Laporan ${res?.publicNo || ''} berhasil dikirim ke pengurus RT!`, 'success');
      reportModal?.classList.add('hidden');
      reportForm.reset();
      state.pendingPhotos = [];
      renderPhotoPreview();
    } catch (err) {
      showToast('Gagal mengirim laporan: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Kirim Laporan ke Pengurus RT';
    }
  });

  // Action Buttons di modal detail laporan
  document.getElementById('btn-admin-change-status')?.addEventListener('click', openStatusModal);
  document.getElementById('btn-admin-add-inspection')?.addEventListener('click', openInspectionModal);
  document.getElementById('btn-reporter-reopen')?.addEventListener('click', openReopenModal);

  // Form Transisi Status
  const statusModal = document.getElementById('status-modal');
  const statusForm = document.getElementById('status-form');
  statusForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentOpenReport) return;

    const toStatusId = document.getElementById('status-select-input').value;
    const note = document.getElementById('status-note-input').value;
    const resolutionSummary = document.getElementById('status-resolution-input').value;
    const closureReason = document.getElementById('status-closure-input').value;

    try {
      await transitionReportStatus({
        reportId: state.currentOpenReport.id,
        toStatusId,
        note,
        resolutionSummary,
        closureReason,
        expectedVersion: state.currentOpenReport.version || 1
      });
      showToast('Status laporan berhasil diperbarui.', 'success');
      statusModal?.classList.add('hidden');
      await openReportDetail(state.currentOpenReport.id);
    } catch (err) {
      showToast('Gagal mengubah status: ' + err.message, 'error');
    }
  });

  // Form Inspeksi
  const inspectionModal = document.getElementById('inspection-modal');
  const inspectionForm = document.getElementById('inspection-form');
  inspectionForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentOpenReport) return;
    const findings = document.getElementById('inspection-findings-input').value;

    try {
      await createInspection({
        reportId: state.currentOpenReport.id,
        findings
      });
      showToast('Hasil inspeksi lapangan berhasil dicatat.', 'success');
      inspectionModal?.classList.add('hidden');
      await openReportDetail(state.currentOpenReport.id);
    } catch (err) {
      showToast('Gagal menyimpan inspeksi: ' + err.message, 'error');
    }
  });

  // Form Reopen
  const reopenModal = document.getElementById('reopen-modal');
  const reopenForm = document.getElementById('reopen-form');
  reopenForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentOpenReport) return;
    const reason = document.getElementById('reopen-reason-input').value;

    try {
      await reopenReport({
        reportId: state.currentOpenReport.id,
        reason
      });
      showToast('Permohonan tinjau ulang berhasil dikirim.', 'success');
      reopenModal?.classList.add('hidden');
      await openReportDetail(state.currentOpenReport.id);
    } catch (err) {
      showToast('Gagal mengajukan tinjau ulang: ' + err.message, 'error');
    }
  });

  // Form Auth Login Warga
  const authForm = document.getElementById('auth-form');
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const isRegister = document.getElementById('auth-toggle-reg').checked;
    const submitBtn = authForm.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      // 1. Cek login via Backend API data_warga
      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password })
      });

      if (loginRes.ok) {
        const { data } = await loginRes.json();
        localStorage.setItem('sulap_sim_user', JSON.stringify({
          id: data.user.id,
          displayName: data.user.displayName,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          jabatan: data.user.jabatan
        }));
        showToast(`Selamat datang, ${data.user.displayName}!`, 'success');
        authModal?.classList.add('hidden');
        window.location.reload();
        return;
      }

      // 2. Fallback Supabase auth standar
      if (isRegister) {
        const name = document.getElementById('auth-name').value;
        await signUpWithEmail(identifier, password, name);
        showToast('Pendaftaran akun berhasil dikirim! Silakan periksa inbox email Anda.', 'success');
      } else {
        await signInWithEmail(identifier, password);
        showToast('Berhasil masuk ke akun warga.', 'success');
      }
      authModal?.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      showToast('Autentikasi gagal: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk / Simpan';
    }
  });

  document.getElementById('auth-toggle-reg')?.addEventListener('change', (e) => {
    document.getElementById('name-group').style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('btn-modal-logout')?.addEventListener('click', handleSignOut);

  // Form Gabung RT
  const formJoinRt = document.getElementById('form-join-rt');
  formJoinRt?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('input-invite-code').value.trim();
    if (!code) {
      showToast('Masukkan kode undangan RT.', 'error');
      return;
    }
    try {
      await joinRt({ method: 'invite_code', code });
      showToast('Selamat, Anda berhasil bergabung ke RT!', 'success');
      formJoinRt.reset();
      await checkUserSession();
    } catch (err) {
      showToast('Gagal bergabung ke RT: ' + err.message, 'error');
    }
  });

  // Admin Export CSV
  document.getElementById('btn-admin-export-csv')?.addEventListener('click', () => {
    window.location.href = '/api/v1/reports/export';
    showToast('Mengunduh rekap laporan RT format CSV...', 'info');
  });

  // Admin Buat Kode Undangan Baru
  document.getElementById('btn-admin-create-invite')?.addEventListener('click', async () => {
    const label = prompt('Masukkan nama kelompok penerima undangan:', 'Warga Baru Blok C');
    if (!label) return;
    try {
      const res = await fetch('/api/v1/rt/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, maxUses: 50 })
      });
      if (res.ok) {
        const { data } = await res.json();
        showToast(`Kode undangan ${data.code} berhasil dibuat!`, 'success');
      }
    } catch (err) {
      showToast('Gagal membuat kode undangan: ' + err.message, 'error');
    }
  });

  // Developer Daftarkan RT Baru
  document.getElementById('btn-dev-create-rt')?.addEventListener('click', async () => {
    const name = prompt('Nama RT Baru:', 'RT 03 Cempaka');
    if (!name) return;
    const rwName = prompt('Nama RW:', 'RW 03');
    const prefix = prompt('Prefix Kode Laporan (misal: RT03):', 'RT03');
    try {
      const res = await fetch('/api/v1/dev/rts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rwName, reportPrefix: prefix })
      });
      if (res.ok) {
        showToast(`Tenant ${name} berhasil didaftarkan!`, 'success');
      }
    } catch (err) {
      showToast('Gagal mendaftarkan RT: ' + err.message, 'error');
    }
  });

  // Developer Simpan Konfigurasi Platform
  document.getElementById('btn-save-dev-settings')?.addEventListener('click', async () => {
    const retention = document.getElementById('dev-setting-retention')?.value;
    const photos = document.getElementById('dev-setting-photos')?.value;
    const bytes = document.getElementById('dev-setting-bytes')?.value;
    try {
      await fetch('/api/v1/dev/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'retention.notification_days', value: Number(retention) })
      });
      await fetch('/api/v1/dev/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'upload.max_photos', value: Number(photos) })
      });
      await fetch('/api/v1/dev/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'upload.max_bytes', value: Number(bytes) })
      });
      showToast('Parameter platform berhasil diperbarui!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan parameter: ' + err.message, 'error');
    }
  });

  // Notifikasi: Tandai semua dibaca
  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    await markNotificationsRead({ all: true });
    showToast('Semua notifikasi ditandai sudah dibaca.', 'success');
    await loadNotificationsBadge();
  });
}

// ---------------------------------------------------------------------------
// 14. Format Relatif Waktu & Helpers (semua diekspor)
// ---------------------------------------------------------------------------
export function formatRelativeTime(isoString) {
  try {
    const diffHours = Math.round((new Date() - new Date(isoString)) / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} hari lalu`;
  } catch {
    return 'Hari ini';
  }
}

export function getStatusConfig(group) {
  const map = {
    new: { label: 'Baru Masuk', icon: 'ph-tray', chipClass: 'chip-new', step: 1 },
    triaged: { label: 'Sudah Diperiksa', icon: 'ph-hourglass', chipClass: 'chip-triaged', step: 2 },
    inspection: { label: 'Inspeksi Lapangan', icon: 'ph-clipboard-text', chipClass: 'chip-inspection', step: 2 },
    in_progress: { label: 'Dalam Penanganan', icon: 'ph-arrows-clockwise', chipClass: 'chip-in_progress', step: 3 },
    resolved: { label: 'Selesai', icon: 'ph-check-circle', chipClass: 'chip-resolved', step: 4 },
    closed: { label: 'Ditutup', icon: 'ph-archive', chipClass: 'chip-closed', step: 4 },
    reopened: { label: 'Dibuka Kembali', icon: 'ph-arrow-counter-clockwise', chipClass: 'chip-reopened', step: 1 }
  };
  return map[group] || map.new;
}

export function getCategoryIcon(catName) {
  if (!catName) return 'ph-warning-circle';
  const c = catName.toLowerCase();
  if (c.includes('saluran') || c.includes('air') || c.includes('drainase')) return 'ph-drop';
  if (c.includes('lampu') || c.includes('listrik')) return 'ph-lightbulb';
  if (c.includes('sampah') || c.includes('kebersihan')) return 'ph-trash';
  if (c.includes('jalan') || c.includes('rusak') || c.includes('paving')) return 'ph-traffic-cone';
  return 'ph-buildings';
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
