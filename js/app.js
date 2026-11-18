/**
 * SULAP Main Application Controller (Vanilla JS)
 * Mendukung: Web Warga, Admin RT, Developer Platform, Auto Layout Full-Width,
 * PWA Caching, dan Sinkronisasi data_warga.csv ({nama+angka acak})
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

// Application State
let currentUser = null;
let currentProfile = null;
let currentMembership = null;
let currentRole = 'resident';
let userCapabilities = calculateCapabilities('resident');
let cachedReports = [];
let cachedCategories = [];
let cachedStatusDefinitions = [];
let cachedWargaList = [];
let currentOpenReport = null;
let activeFilterStatus = 'all';
let activeFilterCategory = '';
let activeFilterMine = false;

// DOM Elements Modals
const authModal = document.getElementById('auth-modal');
const reportModal = document.getElementById('report-modal');
const reportDetailModal = document.getElementById('report-detail-modal');
const statusModal = document.getElementById('status-modal');
const inspectionModal = document.getElementById('inspection-modal');
const reopenModal = document.getElementById('reopen-modal');

// Controls & Buttons
const btnNewReport = document.getElementById('btn-new-report');
const btnAuthTrigger = document.getElementById('btn-auth-trigger');
const btnRefreshFeed = document.getElementById('btn-refresh-feed');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnPwaInstallSidebar = document.getElementById('btn-pwa-install-sidebar');
const btnInstallPwaSettings = document.getElementById('btn-install-pwa-settings');
const btnMarkAllRead = document.getElementById('btn-mark-all-read');
const btnModalLogout = document.getElementById('btn-modal-logout');
const btnAdminChangeStatus = document.getElementById('btn-admin-change-status');
const btnAdminAddInspection = document.getElementById('btn-admin-add-inspection');
const btnReporterReopen = document.getElementById('btn-reporter-reopen');

// Quick Role Select & Warga Select
const quickRoleSelect = document.getElementById('quick-role-select');
const quickWargaSelect = document.getElementById('quick-warga-select');

// Search & Filter
const globalSearchInput = document.getElementById('global-search-input');
const feedStatusFilterPills = document.getElementById('feed-status-filter-pills');
const filterCategorySelect = document.getElementById('filter-category-select');
const filterMineCheckbox = document.getElementById('filter-mine-checkbox');

// Containers
const ticketFeedContainer = document.getElementById('ticket-feed-container');
const fullReportsGrid = document.getElementById('full-reports-grid');
const notificationsListContainer = document.getElementById('notifications-list-container');

// Metrics
const statNewCount = document.getElementById('stat-new-count');
const statProcessCount = document.getElementById('stat-process-count');
const statResolvedCount = document.getElementById('stat-resolved-count');

/**
 * Inisialisasi Aplikasi Utama
 */
async function initApp() {
  initTheme();
  setupNavigation();
  setupEventListeners();
  initPWA({
    onInstallable: () => {
      document.getElementById('sidebar-pwa-card')?.classList.remove('hidden');
    }
  });

  await loadWargaData();
  await checkUserSession();
  await loadMetadata();
  await loadReports();
  await loadNotificationsBadge();

  // Load Admin RT & Developer data jika relevan
  loadAdminPortalData();
  loadDeveloperPortalData();

  // Cek parameter URL (PWA Shortcuts)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'new-report') {
    openCreateReportModal();
  } else if (urlParams.get('tab')) {
    switchTab(urlParams.get('tab'));
  }
}

/**
 * 1. Manajemen Tema (Terang / Gelap)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('sulap_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  btnThemeToggle?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sulap_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
  }
}

/**
 * 2. Navigasi Antar Tab (Warga, Admin RT, Developer)
 */
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-nav]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-nav');
      switchTab(targetTab);
    });
  });

  // Subtabs Admin
  document.querySelectorAll('[data-admin-subtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-admin-subtab');
      document.querySelectorAll('[data-admin-subtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-subpanel[id^="admin-subpanel-"]').forEach(p => p.classList.remove('active'));
      document.getElementById(`admin-subpanel-${sub}`)?.classList.add('active');
    });
  });

  // Subtabs Developer
  document.querySelectorAll('[data-dev-subtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-dev-subtab');
      document.querySelectorAll('[data-dev-subtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-subpanel[id^="dev-subpanel-"]').forEach(p => p.classList.remove('active'));
      document.getElementById(`dev-subpanel-${sub}`)?.classList.add('active');
    });
  });
}

function switchTab(tabId) {
  // Update desktop sidebar buttons
  document.querySelectorAll('.dark-sidebar .nav-link').forEach(btn => {
    const isActive = btn.getAttribute('data-nav') === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update mobile bottom nav buttons
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === tabId);
  });

  // Toggle tab panel
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`);
  });

  if (tabId === 'notifications') {
    loadNotificationsList();
  } else if (tabId === 'reports') {
    renderFullReports();
  } else if (tabId === 'admin') {
    loadAdminPortalData();
  } else if (tabId === 'developer') {
    loadDeveloperPortalData();
  }
}

/**
 * 3. Memuat Data 36 Warga dari Backend / CSV ({nama+angka acak})
 */
async function loadWargaData() {
  try {
    const res = await fetch('/api/v1/warga');
    if (res.ok) {
      const json = await res.json();
      cachedWargaList = json.data || [];
    }
  } catch (err) {
    console.warn('Fallback loadWargaData:', err.message);
  }

  // Isi dropdown pilihan cepat warga di modal login
  if (quickWargaSelect && cachedWargaList.length > 0) {
    quickWargaSelect.innerHTML = '<option value="">-- Pilih dari 36 Warga RT --</option>' +
      cachedWargaList.map(w => `<option value="${w.username}">${w.nama} (${w.jabatan}) - [${w.role}]</option>`).join('');

    quickWargaSelect.addEventListener('change', (e) => {
      const selectedUsername = e.target.value;
      const found = cachedWargaList.find(w => w.username === selectedUsername);
      if (found) {
        document.getElementById('auth-email').value = found.username;
        document.getElementById('auth-password').value = found.password;
      }
    });
  }
}

/**
 * 4. Status Sesi & Profil Pengguna
 */
async function checkUserSession() {
  // Cek local simulated session
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

  currentUser = await getCurrentUser();
  if (currentUser) {
    currentProfile = await getUserProfile(currentUser.id);
    currentMembership = await getUserMembership(currentUser.id);
    const role = currentMembership?.role || 'resident';
    const displayName = currentProfile?.display_name || currentUser.user_metadata?.display_name || currentUser.email.split('@')[0];

    applyUserContext({
      id: currentUser.id,
      displayName,
      email: currentUser.email,
      role,
      jabatan: currentUser.user_metadata?.jabatan || (role === 'rt_admin' ? 'Pengurus RT' : 'Warga RT')
    });
  } else {
    // Default mode: Tamu / Simulasi Warga
    applyUserContext({
      id: 'guest-user',
      displayName: 'Warga Tamu',
      role: 'resident',
      jabatan: 'Warga RT'
    }, true);
  }
}

function applyUserContext(user, isGuest = false) {
  currentRole = user.role || 'resident';
  userCapabilities = calculateCapabilities(currentRole);

  const displayName = user.displayName || 'Warga';
  const initial = displayName.charAt(0).toUpperCase();

  // UI Header
  document.getElementById('user-name-display').textContent = displayName;
  document.getElementById('user-role-display').textContent = formatRoleLabel(currentRole);
  document.getElementById('user-avatar-initial').textContent = initial;
  document.getElementById('greeting-display').textContent = `Selamat ${getGreetingTime()}, ${displayName} 👋`;
  document.getElementById('greeting-subtitle').textContent = `Pantau keterbukaan & penanganan kendala lingkungan RT 01 Melati.`;

  // UI Settings Tab
  document.getElementById('settings-display-name').textContent = displayName;
  document.getElementById('settings-jabatan-badge').textContent = user.jabatan || 'Warga';
  document.getElementById('settings-role-badge').textContent = formatRoleLabel(currentRole);
  document.getElementById('settings-rt-name').textContent = 'RT 01 Melati / RW 03';

  // Sinkronkan Quick Role Select
  if (quickRoleSelect) {
    quickRoleSelect.value = currentRole;
  }

  // Tampilkan / Sembunyikan Navigasi Admin & Dev
  updateRoleNavigationVisibility(currentRole);

  if (isGuest) {
    document.getElementById('btn-settings-auth-action').textContent = 'Masuk / Daftar Akun';
    document.getElementById('btn-settings-auth-action').onclick = () => authModal.classList.remove('hidden');
    btnModalLogout.classList.add('hidden');
  } else {
    document.getElementById('btn-settings-auth-action').textContent = 'Keluar dari Akun';
    document.getElementById('btn-settings-auth-action').onclick = handleSignOut;
    btnModalLogout.classList.remove('hidden');
  }
}

function updateRoleNavigationVisibility(role) {
  const isAdmin = role === 'rt_admin' || role === 'developer';
  const isDev = role === 'developer';

  const navTitleAdmin = document.getElementById('nav-title-admin');
  const navBtnAdmin = document.getElementById('nav-btn-admin');
  const mobileNavAdmin = document.getElementById('mobile-nav-admin');

  const navTitleDev = document.getElementById('nav-title-dev');
  const navBtnDev = document.getElementById('nav-btn-developer');

  if (navTitleAdmin) navTitleAdmin.style.display = isAdmin ? 'block' : 'none';
  if (navBtnAdmin) navBtnAdmin.parentElement.style.display = isAdmin ? 'block' : 'none';
  if (mobileNavAdmin) mobileNavAdmin.style.display = isAdmin ? 'flex' : 'none';

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

/**
 * 5. Memuat Metadata Kategori & Status
 */
async function loadMetadata() {
  cachedCategories = await fetchCategories();
  cachedStatusDefinitions = await fetchStatusDefinitions();

  if (filterCategorySelect) {
    filterCategorySelect.innerHTML = '<option value="">Semua Kategori</option>' +
      cachedCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  }

  const catInput = document.getElementById('report-cat-input');
  if (catInput) {
    catInput.innerHTML = cachedCategories.map(c =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');
  }
}

/**
 * 6. Memuat dan Menampilkan Laporan
 */
async function loadReports() {
  ticketFeedContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--ink-secondary);">Memuat data tiket laporan...</div>';
  try {
    cachedReports = await fetchFeedReports();
    renderDashboardTickets(cachedReports);
    renderFullReports();
    updateMetrics(cachedReports);
  } catch (err) {
    ticketFeedContainer.innerHTML = `<div style="padding: 20px; color: var(--danger-btn); font-size: 13px;">Gagal memuat feed: ${err.message}</div>`;
  }
}

function renderDashboardTickets(reports) {
  if (!reports || reports.length === 0) {
    ticketFeedContainer.innerHTML = `
      <div style="padding: 36px 16px; text-align: center; color: var(--ink-secondary);">
        <i class="ph ph-tray" style="font-size: 36px; color: var(--ink-tertiary); display: block; margin-bottom: 8px;"></i>
        Belum ada aduan warga. Lingkungan RT saat ini kondusif!
      </div>
    `;
    return;
  }

  ticketFeedContainer.innerHTML = reports.slice(0, 6).map(report => generateTicketCardHtml(report)).join('');
  attachReportClickEvents(ticketFeedContainer);
}

function renderFullReports() {
  if (!fullReportsGrid) return;

  let filtered = [...cachedReports];

  if (activeFilterStatus && activeFilterStatus !== 'all') {
    filtered = filtered.filter(r => (r.status_group || 'new') === activeFilterStatus);
  }

  if (activeFilterCategory) {
    filtered = filtered.filter(r => r.category_id === activeFilterCategory);
  }

  if (activeFilterMine) {
    const myId = currentUser?.id || 'simulated';
    filtered = filtered.filter(r => r.reporter_id === myId || r.is_mine);
  }

  const q = globalSearchInput.value.toLowerCase().trim();
  if (q) {
    filtered = filtered.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.public_no && r.public_no.toLowerCase().includes(q)) ||
      (r.location_text && r.location_text.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    fullReportsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px 16px; text-align: center; color: var(--ink-secondary); background: var(--surface-card); border-radius: var(--radius-card);">
        <i class="ph ph-magnifying-glass" style="font-size: 36px; color: var(--ink-tertiary); display: block; margin-bottom: 8px;"></i>
        Tidak ada laporan yang sesuai dengan filter pencarian.
      </div>
    `;
    return;
  }

  fullReportsGrid.innerHTML = filtered.map(report => generateTicketCardHtml(report)).join('');
  attachReportClickEvents(fullReportsGrid);
}

function generateTicketCardHtml(report) {
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

function attachReportClickEvents(container) {
  container.querySelectorAll('[data-report-id]').forEach(card => {
    card.addEventListener('click', () => {
      const reportId = card.getAttribute('data-report-id');
      openReportDetail(reportId);
    });
  });
}

/**
 * 7. Modal Detail Laporan & Timeline
 */
async function openReportDetail(reportIdOrNo) {
  try {
    reportDetailModal.classList.remove('hidden');
    document.getElementById('detail-public-no').textContent = 'Memuat...';
    document.getElementById('detail-title').textContent = 'Memuat detail aduan warga...';
    document.getElementById('detail-description').textContent = '';
    document.getElementById('detail-timeline-container').innerHTML = '<div style="padding: 10px; color: var(--ink-tertiary);">Memuat riwayat...</div>';

    const detailData = await fetchReportDetail(reportIdOrNo);
    const report = detailData.report;
    if (!report) {
      showToast('Gagal memuat detail laporan.', 'error');
      reportDetailModal.classList.add('hidden');
      return;
    }

    currentOpenReport = report;

    document.getElementById('detail-public-no').textContent = report.public_no || '#SULAP-RT01';
    document.getElementById('detail-title').textContent = report.title;
    document.getElementById('detail-description').textContent = report.description || 'Tidak ada deskripsi rinci.';
    document.getElementById('detail-category-badge').textContent = report.categories?.name || report.category_name || 'Fasilitas Umum';
    document.getElementById('detail-location-text').textContent = report.location_text || 'Wilayah RT 01';

    if (report.latitude && report.longitude) {
      document.getElementById('detail-location-coords').textContent = `Koordinat: ${report.latitude}, ${report.longitude} (Akurasi ~110m)`;
    } else {
      document.getElementById('detail-location-coords').textContent = 'Koordinat GPS tidak disertakan.';
    }

    document.getElementById('detail-created-at').textContent = formatRelativeTime(report.created_at);

    const statusGroup = report.current_status_group || report.status_group || 'new';
    const cfg = getStatusConfig(statusGroup);
    const chipEl = document.getElementById('detail-status-chip');
    chipEl.className = `status-chip ${cfg.chipClass}`;
    chipEl.innerHTML = `<i class="ph ${cfg.icon}"></i> <span>${escapeHtml(report.status_definitions?.label || report.status_label || cfg.label)}</span>`;

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

function renderInspections(inspections) {
  const section = document.getElementById('detail-inspections-section');
  const container = document.getElementById('detail-inspections-container');
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
  const isAdmin = currentRole === 'rt_admin' || currentRole === 'developer';
  const isResolvedOrClosed = ['resolved', 'closed'].includes(report.current_status_group || report.status_group);

  btnAdminChangeStatus.classList.toggle('hidden', !isAdmin);
  btnAdminAddInspection.classList.toggle('hidden', !isAdmin);
  btnReporterReopen.classList.toggle('hidden', !isResolvedOrClosed);
}

/**
 * 8. Modal & Form Admin Mutasi Status
 */
function openStatusModal() {
  if (!currentOpenReport) return;
  const select = document.getElementById('status-select-input');
  select.innerHTML = cachedStatusDefinitions.map(s => 
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

  statusModal.classList.remove('hidden');
}

function toggleStatusConditionalFields(group) {
  document.getElementById('group-resolution-summary').classList.toggle('hidden', group !== 'resolved');
  document.getElementById('group-closure-reason').classList.toggle('hidden', group !== 'closed');
}

function openInspectionModal() {
  document.getElementById('inspection-findings-input').value = '';
  inspectionModal.classList.remove('hidden');
}

function openReopenModal() {
  document.getElementById('reopen-reason-input').value = '';
  reopenModal.classList.remove('hidden');
}

function openCreateReportModal() {
  document.getElementById('report-title-input').value = '';
  document.getElementById('report-desc-input').value = '';
  document.getElementById('report-addr-input').value = '';
  document.getElementById('report-lat-input').value = '';
  document.getElementById('report-lng-input').value = '';
  reportModal.classList.remove('hidden');
}

/**
 * 9. Portals: Admin RT Data Loader
 */
async function loadAdminPortalData() {
  try {
    const res = await fetch('/api/v1/admin/overview');
    if (res.ok) {
      const { data } = await res.json();
      document.getElementById('admin-triaged-count').textContent = data.counts?.new || 4;
      document.getElementById('admin-inspect-count').textContent = data.counts?.inspection || 2;
      document.getElementById('admin-resolved-count').textContent = data.counts?.resolvedLast7Days || 11;

      const listContainer = document.getElementById('admin-needs-action-list');
      if (listContainer && data.needsAction) {
        listContainer.innerHTML = data.needsAction.map(item => `
          <div class="needs-action-item">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="ticket-id">${escapeHtml(item.publicNo)}</span>
                <span class="priority-tag">${escapeHtml(item.priority)}</span>
              </div>
              <strong style="font-size: 13px; color: var(--ink-primary); display: block; margin-top: 4px;">${escapeHtml(item.title)}</strong>
              <div style="font-size: 11px; color: var(--ink-secondary); margin-top: 2px;">${escapeHtml(item.note)}</div>
            </div>
            <button class="btn-action-primary" onclick="window.sulapOpenDetail('${item.publicNo}')">
              <span>Tindak Lanjuti</span>
            </button>
          </div>
        `).join('');
      }
    }

    // Render Data Warga di Admin RT
    const wargaTbody = document.getElementById('admin-warga-tbody');
    if (wargaTbody && cachedWargaList.length > 0) {
      wargaTbody.innerHTML = cachedWargaList.map(w => `
        <tr>
          <td>
            <div class="table-user-cell">
              <div class="table-avatar">${w.nama.charAt(0)}</div>
              <strong>${escapeHtml(w.nama)}</strong>
            </div>
          </td>
          <td>${escapeHtml(w.jabatan)}</td>
          <td><span class="badge-role">${escapeHtml(w.role)}</span></td>
          <td style="font-family: monospace;">${escapeHtml(w.username)}</td>
          <td>${escapeHtml(w.email)}</td>
          <td><span style="color: #16A34A; font-weight: 600;">Aktif</span></td>
        </tr>
      `).join('');
    }

    // Render Kode Undangan
    const invitesTbody = document.getElementById('admin-invites-tbody');
    const invRes = await fetch('/api/v1/rt/invite-codes');
    if (invRes.ok && invitesTbody) {
      const invData = await invRes.json();
      invitesTbody.innerHTML = (invData.data || []).map(inv => `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary-btn);">${escapeHtml(inv.code)}</td>
          <td>${escapeHtml(inv.label)}</td>
          <td>${inv.usesCount} Warga</td>
          <td>${inv.maxUses} Kuota</td>
          <td>${new Date(inv.expiresAt).toLocaleDateString('id-ID')}</td>
          <td><span style="color: #16A34A; font-weight: 600;">Aktif</span></td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.warn('Gagal memuat portal admin:', err.message);
  }
}

/**
 * 10. Portals: Developer Hub Data Loader
 */
async function loadDeveloperPortalData() {
  try {
    const devRes = await fetch('/api/v1/dev/overview');
    if (devRes.ok) {
      const { data } = await devRes.json();
      document.getElementById('dev-stat-rt').textContent = data.rtCount || 2;
      document.getElementById('dev-stat-users').textContent = data.activeUserCount || cachedWargaList.length;
    }

    // Render Tenant RTs
    const rtsRes = await fetch('/api/v1/dev/rts');
    const rtsTbody = document.getElementById('dev-rts-tbody');
    if (rtsRes.ok && rtsTbody) {
      const { data } = await rtsRes.json();
      rtsTbody.innerHTML = (data || []).map(rt => `
        <tr>
          <td><strong>${escapeHtml(rt.name)}</strong></td>
          <td style="font-family: monospace;">${escapeHtml(rt.slug)}</td>
          <td>${escapeHtml(rt.rwName)}</td>
          <td><span class="badge-accent-lime">${escapeHtml(rt.reportPrefix)}</span></td>
          <td>${escapeHtml(rt.adminEmail)}</td>
          <td><span style="color: #16A34A; font-weight: 600;">Tenant Aktif</span></td>
        </tr>
      `).join('');
    }

    // Render Developer User Role Switcher
    const usersTbody = document.getElementById('dev-users-tbody');
    if (usersTbody && cachedWargaList.length > 0) {
      usersTbody.innerHTML = cachedWargaList.map(w => `
        <tr>
          <td><strong>${escapeHtml(w.nama)}</strong></td>
          <td style="font-family: monospace;">${escapeHtml(w.username)}</td>
          <td style="font-family: monospace; color: var(--danger-btn); font-weight: 700;">${escapeHtml(w.password)}</td>
          <td>${escapeHtml(w.jabatan)}</td>
          <td><span class="badge-role" id="badge-user-role-${w.id}">${escapeHtml(w.role)}</span></td>
          <td>
            <select class="form-select-sm" onchange="window.sulapChangeRole('${w.uuid || w.id}', this.value, '${w.id}')">
              <option value="resident" ${w.role === 'resident' ? 'selected' : ''}>Warga</option>
              <option value="rt_admin" ${w.role === 'rt_admin' ? 'selected' : ''}>Admin RT</option>
              <option value="developer" ${w.role === 'developer' ? 'selected' : ''}>Developer</option>
            </select>
          </td>
        </tr>
      `).join('');
    }

    // Render Audit Logs
    const auditRes = await fetch('/api/v1/dev/audit-logs');
    const auditTbody = document.getElementById('dev-audit-tbody');
    if (auditRes.ok && auditTbody) {
      const { data } = await auditRes.json();
      auditTbody.innerHTML = (data || []).map(log => `
        <tr>
          <td style="font-size: 11px; color: var(--ink-tertiary);">${new Date(log.createdAt).toLocaleTimeString('id-ID')}</td>
          <td><strong>${escapeHtml(log.actorName)}</strong></td>
          <td><span class="badge-role">${escapeHtml(log.role)}</span></td>
          <td style="font-family: monospace; font-weight: 600;">${escapeHtml(log.action)}</td>
          <td>${escapeHtml(log.entityType)}</td>
          <td>${escapeHtml(log.reason)}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.warn('Gagal memuat developer hub:', err.message);
  }
}

/**
 * 11. Notifikasi & Metrik
 */
async function loadNotificationsBadge() {
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

async function loadNotificationsList() {
  notificationsListContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--ink-secondary);">Memuat notifikasi...</div>';
  const notifications = await fetchNotifications();

  if (!notifications || notifications.length === 0) {
    notificationsListContainer.innerHTML = `
      <div style="padding: 36px 16px; text-align: center; color: var(--ink-secondary); background: var(--surface-card); border-radius: var(--radius-card);">
        <i class="ph ph-bell-slash" style="font-size: 36px; color: var(--ink-tertiary); display: block; margin-bottom: 8px;"></i>
        Belum ada notifikasi baru.
      </div>
    `;
    return;
  }

  notificationsListContainer.innerHTML = notifications.map(n => `
    <article class="notification-item ${n.read_at ? '' : 'unread'}" data-notif-id="${n.id}">
      <div class="notification-icon">
        <i class="ph ph-bell-ringing"></i>
      </div>
      <div class="notification-content">
        <h4>${escapeHtml(n.title)}</h4>
        <p>${escapeHtml(n.body)}</p>
        <span class="time">${formatRelativeTime(n.created_at)}</span>
      </div>
    </article>
  `).join('');
}

function updateMetrics(reports) {
  const newCount = reports.filter(r => (r.status_group || 'new') === 'new').length;
  const processCount = reports.filter(r => ['in_progress', 'triaged', 'inspection'].includes(r.status_group)).length;
  const resolvedCount = reports.filter(r => r.status_group === 'resolved').length;

  statNewCount.textContent = newCount;
  statProcessCount.textContent = processCount;
  statResolvedCount.textContent = resolvedCount;
}

/**
 * 12. Setup Event Listeners & Actions
 */
function setupEventListeners() {
  // Global helpers on window
  window.sulapOpenDetail = openReportDetail;
  window.sulapChangeRole = async (userId, newRole, id) => {
    try {
      const res = await fetch(`/api/v1/dev/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        showToast(`Peran pengguna berhasil diubah ke ${newRole}`, 'success');
        const badge = document.getElementById(`badge-user-role-${id}`);
        if (badge) badge.textContent = newRole;
      }
    } catch (err) {
      showToast('Gagal mengubah peran: ' + err.message, 'error');
    }
  };

  // Role Switcher Simulator
  quickRoleSelect?.addEventListener('change', (e) => {
    const role = e.target.value;
    let mockUser = {
      id: 'sim-user',
      displayName: role === 'developer' ? 'Jonathan Azazia' : (role === 'rt_admin' ? 'Yuda Adi Pratama' : 'Achmad Fajar'),
      role: role,
      jabatan: role === 'developer' ? 'Developer' : (role === 'rt_admin' ? 'Ketua RT' : 'Warga')
    };
    localStorage.setItem('sulap_sim_user', JSON.stringify(mockUser));
    applyUserContext(mockUser);
    showToast(`Beralih ke tampilan mode: ${formatRoleLabel(role)}`, 'info');
    if (role === 'rt_admin') switchTab('admin');
    else if (role === 'developer') switchTab('developer');
    else switchTab('dashboard');
  });

  // Modal close triggers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  btnAuthTrigger?.addEventListener('click', () => authModal.classList.remove('hidden'));
  btnNewReport?.addEventListener('click', openCreateReportModal);

  btnRefreshFeed?.addEventListener('click', async () => {
    btnRefreshFeed.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Memuat...';
    await loadReports();
    btnRefreshFeed.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Segarkan';
    showToast('Data feed berhasil diperbarui.', 'info');
  });

  // PWA Install Triggers
  const handlePwaClick = async () => {
    const installed = await promptPwaInstall();
    if (!installed) {
      showToast('Pemasangan PWA: Tekan menu browser Anda lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen).', 'info');
    }
  };
  btnPwaInstallSidebar?.addEventListener('click', handlePwaClick);
  btnInstallPwaSettings?.addEventListener('click', handlePwaClick);

  // Global Search
  globalSearchInput?.addEventListener('input', () => {
    const q = globalSearchInput.value.toLowerCase().trim();
    if (!q) {
      renderDashboardTickets(cachedReports);
      renderFullReports();
      return;
    }
    const filtered = cachedReports.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.public_no && r.public_no.toLowerCase().includes(q)) ||
      (r.location_text && r.location_text.toLowerCase().includes(q))
    );
    renderDashboardTickets(filtered);
    renderFullReports();
  });

  // Status Filter Pills
  feedStatusFilterPills?.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      feedStatusFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilterStatus = pill.getAttribute('data-filter-status');
      renderFullReports();
    });
  });

  filterCategorySelect?.addEventListener('change', (e) => {
    activeFilterCategory = e.target.value;
    renderFullReports();
  });

  filterMineCheckbox?.addEventListener('change', (e) => {
    activeFilterMine = e.target.checked;
    renderFullReports();
  });

  btnMarkAllRead?.addEventListener('click', async () => {
    await markNotificationsRead({ all: true });
    showToast('Semua notifikasi ditandai sudah dibaca.', 'success');
    await loadNotificationsBadge();
    await loadNotificationsList();
  });

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
        document.getElementById('report-addr-input').value = `GPS: ${lat}, ${lng} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`;
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
        lng
      });
      showToast(`Laporan ${res?.publicNo || ''} berhasil dikirim ke pengurus RT!`, 'success');
      reportModal.classList.add('hidden');
      reportForm.reset();
      await loadReports();
    } catch (err) {
      showToast('Gagal mengirim laporan: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Kirim Laporan ke Pengurus RT';
    }
  });

  // Action Buttons Detail Modal
  btnAdminChangeStatus?.addEventListener('click', openStatusModal);
  btnAdminAddInspection?.addEventListener('click', openInspectionModal);
  btnReporterReopen?.addEventListener('click', openReopenModal);

  // Form Transisi Status
  const statusForm = document.getElementById('status-form');
  statusForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentOpenReport) return;

    const toStatusId = document.getElementById('status-select-input').value;
    const note = document.getElementById('status-note-input').value;
    const resolutionSummary = document.getElementById('status-resolution-input').value;
    const closureReason = document.getElementById('status-closure-input').value;

    try {
      await transitionReportStatus({
        reportId: currentOpenReport.id,
        toStatusId,
        note,
        resolutionSummary,
        closureReason,
        expectedVersion: currentOpenReport.version || 1
      });
      showToast('Status laporan berhasil diperbarui.', 'success');
      statusModal.classList.add('hidden');
      await openReportDetail(currentOpenReport.id);
      await loadReports();
    } catch (err) {
      showToast('Gagal mengubah status: ' + err.message, 'error');
    }
  });

  // Form Inspeksi
  const inspectionForm = document.getElementById('inspection-form');
  inspectionForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentOpenReport) return;
    const findings = document.getElementById('inspection-findings-input').value;

    try {
      await createInspection({
        reportId: currentOpenReport.id,
        findings
      });
      showToast('Hasil inspeksi lapangan berhasil dicatat.', 'success');
      inspectionModal.classList.add('hidden');
      await openReportDetail(currentOpenReport.id);
    } catch (err) {
      showToast('Gagal menyimpan inspeksi: ' + err.message, 'error');
    }
  });

  // Form Reopen
  const reopenForm = document.getElementById('reopen-form');
  reopenForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentOpenReport) return;
    const reason = document.getElementById('reopen-reason-input').value;

    try {
      await reopenReport({
        reportId: currentOpenReport.id,
        reason
      });
      showToast('Permohonan tinjau ulang berhasil dikirim.', 'success');
      reopenModal.classList.add('hidden');
      await openReportDetail(currentOpenReport.id);
      await loadReports();
    } catch (err) {
      showToast('Gagal mengajukan tinjau ulang: ' + err.message, 'error');
    }
  });

  // Form Auth Login Warga (Sesuai data_warga.csv & {nama+angka acak})
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
        authModal.classList.add('hidden');
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
      authModal.classList.add('hidden');
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

  btnModalLogout?.addEventListener('click', handleSignOut);

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
        await loadAdminPortalData();
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
        await loadDeveloperPortalData();
      }
    } catch (err) {
      showToast('Gagal mendaftarkan RT: ' + err.message, 'error');
    }
  });

  // Developer Simpan Konfigurasi Platform
  document.getElementById('btn-save-dev-settings')?.addEventListener('click', async () => {
    const retention = document.getElementById('dev-setting-retention').value;
    const photos = document.getElementById('dev-setting-photos').value;
    const bytes = document.getElementById('dev-setting-bytes').value;
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
}

async function handleSignOut() {
  localStorage.removeItem('sulap_sim_user');
  await signOut();
  window.location.reload();
}

/**
 * 13. Format Relatif Waktu & Helpers
 */
function formatRelativeTime(isoString) {
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

function getStatusConfig(group) {
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

function getCategoryIcon(catName) {
  if (!catName) return 'ph-warning-circle';
  const c = catName.toLowerCase();
  if (c.includes('saluran') || c.includes('air') || c.includes('drainase')) return 'ph-drop';
  if (c.includes('lampu') || c.includes('listrik')) return 'ph-lightbulb';
  if (c.includes('sampah') || c.includes('kebersihan')) return 'ph-trash';
  if (c.includes('jalan') || c.includes('rusak') || c.includes('paving')) return 'ph-traffic-cone';
  return 'ph-buildings';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', initApp);
