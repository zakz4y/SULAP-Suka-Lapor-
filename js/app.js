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
let pendingPhotos = [];

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

// Quick Warga Select
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

  // Tombol Admin & Developer di header mobile
  document.getElementById('mobile-admin-header-btn')?.addEventListener('click', () => switchTab('admin'));
  document.getElementById('mobile-dev-header-btn')?.addEventListener('click', () => switchTab('developer'));

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
async function fetchWargaListSafe() {
  try {
    const res = await fetch('/api/v1/warga');
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('Fallback fetchWargaListSafe:', err.message);
  }
  return cachedWargaList;
}

async function loadWargaData() {
  cachedWargaList = await fetchWargaListSafe();

  // Isi dropdown pilihan cepat warga di modal login
  if (quickWargaSelect && cachedWargaList.length > 0) {
    quickWargaSelect.innerHTML = '<option value="">-- Pilih dari 36 Warga RT --</option>' +
      cachedWargaList.map(w => `<option value="${w.username}">${w.nama} (${w.jabatan}) - [${w.role}]</option>`).join('');

    quickWargaSelect.onchange = (e) => {
      const selectedUsername = e.target.value;
      const found = cachedWargaList.find(w => w.username === selectedUsername);
      if (found) {
        document.getElementById('auth-email').value = found.username;
        document.getElementById('auth-password').value = found.password;
      }
    };
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
  const mobileAdminBtn = document.getElementById('mobile-admin-header-btn');
  const mobileDevBtn = document.getElementById('mobile-dev-header-btn');

  const navTitleDev = document.getElementById('nav-title-dev');
  const navBtnDev = document.getElementById('nav-btn-developer');
  const mobileNavAdmin = document.getElementById('mobile-nav-admin');

  if (navTitleAdmin) navTitleAdmin.style.display = isAdmin ? 'block' : 'none';
  if (navBtnAdmin) navBtnAdmin.parentElement.style.display = isAdmin ? 'block' : 'none';
  if (mobileAdminBtn) mobileAdminBtn.classList.toggle('hidden', !isAdmin);
  if (mobileDevBtn) mobileDevBtn.classList.toggle('hidden', !isDev);
  if (mobileNavAdmin) mobileNavAdmin.style.display = isAdmin ? '' : 'none';

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
    renderDashboardInsights(cachedReports);
    renderFullReports();
    updateMetrics(cachedReports);
    updateAdminBadge(cachedReports);
  } catch (err) {
    ticketFeedContainer.innerHTML = `<div style="padding: 20px; color: var(--danger-btn); font-size: 13px;">Gagal memuat feed: ${err.message}</div>`;
  }
}

function updateAdminBadge(reports) {
  const badge = document.getElementById('badge-admin-needs-action');
  if (!badge) return;
  const openCount = (reports || []).filter(r =>
    !['resolved', 'closed'].includes(r.status_group || 'new')
  ).length;
  badge.textContent = openCount;
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

function renderDashboardInsights(reports) {
  renderWeeklyChart(reports);
  renderAgenda(reports);
}

function renderWeeklyChart(reports) {
  const container = document.getElementById('chart-bars-container');
  if (!container) return;

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d, label: dayLabels[d.getDay()], count: 0 });
  }

  (reports || []).forEach(r => {
    if (!r.created_at) return;
    const created = new Date(r.created_at);
    created.setHours(0, 0, 0, 0);
    const bucket = days.find(d => d.date.getTime() === created.getTime());
    if (bucket) bucket.count += 1;
  });

  const max = Math.max(1, ...days.map(d => d.count));

  container.innerHTML = days.map(d => {
    const height = d.count === 0 ? 0 : Math.max(8, Math.round((d.count / max) * 100));
    return `
      <div class="chart-bar-col">
        <div class="bar-pill ${d.count === max && d.count > 0 ? 'peak-day' : ''} ${d.count === 0 ? 'bar-empty' : ''}"
             style="height: ${height}%;" title="${d.label}: ${d.count} aduan"></div>
        <span class="bar-day-label">${d.label}</span>
      </div>
    `;
  }).join('');

  const total = days.reduce((sum, d) => sum + d.count, 0);
  const summary = document.getElementById('chart-summary-text');
  if (summary) {
    summary.textContent = total === 0
      ? 'Belum ada laporan masuk minggu ini.'
      : `${total} laporan masuk dalam 7 hari terakhir.`;
  }
}

function renderAgenda(reports) {
  const container = document.getElementById('agenda-list-container');
  if (!container) return;

  const agenda = (reports || [])
    .filter(r => ['new', 'triaged', 'inspection'].includes(r.status_group || 'new'))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 3);

  if (agenda.length === 0) {
    container.innerHTML = `
      <div class="agenda-empty">
        <i class="ph ph-calendar-check"></i>
        <span>Belum ada laporan yang perlu ditinjau.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = agenda.map(r => `
    <div class="agenda-item" data-agenda-report="${escapeHtml(r.id || r.public_no)}">
      <div class="agenda-left">
        <div class="agenda-icon">
          <i class="ph ${getCategoryIcon(r.category_name)}"></i>
        </div>
        <div class="agenda-details">
          <div class="title">${escapeHtml(r.title)}</div>
          <div class="meta">${escapeHtml(r.location_text || 'Wilayah RT 01')} • ${formatRelativeTime(r.created_at)}</div>
        </div>
      </div>
      <i class="ph ph-caret-right" style="color: var(--ink-tertiary);"></i>
    </div>
  `).join('');

  container.querySelectorAll('[data-agenda-report]').forEach(item => {
    item.addEventListener('click', () => {
      openReportDetail(item.getAttribute('data-agenda-report'));
    });
  });
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

    renderDetailPhotos(report.photos);

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

  const remaining = MAX_REPORT_PHOTOS - pendingPhotos.length;
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
      pendingPhotos.push(compressed);
    }
  } catch (err) {
    showToast('Gagal memproses foto: ' + err.message, 'error');
  }

  renderPhotoPreview();
}

function renderPhotoPreview() {
  const container = document.getElementById('report-photo-preview');
  if (!container) return;

  container.innerHTML = pendingPhotos.map((src, idx) => `
    <div class="photo-preview-item">
      <img src="${src}" alt="Pratinjau foto ${idx + 1}">
      <button type="button" class="photo-remove-btn" data-photo-index="${idx}" aria-label="Hapus foto">
        <i class="ph ph-x"></i>
      </button>
    </div>
  `).join('');
}

function openCreateReportModal() {
  pendingPhotos = [];
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
  reportModal.classList.remove('hidden');
}

/**
 * 9. Portals: Admin RT Data Loader
 */
function buildAdminOverview(reports) {
  const list = reports || [];
  const now = Date.now();
  const isOpen = r => !['resolved', 'closed'].includes(r.status_group || 'new');

  const needsAction = list
    .filter(isOpen)
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    .slice(0, 10)
    .map(r => {
      const cfg = getStatusConfig(r.status_group || 'new');
      const ageHours = Math.max(0, Math.floor((now - new Date(r.created_at || now).getTime()) / 3600000));
      return {
        id: r.id,
        publicNo: r.public_no || r.id,
        title: r.title || 'Laporan tanpa judul',
        statusGroup: r.status_group || 'new',
        ageHours,
        priority: ageHours >= 48 ? 'Tinggi' : (ageHours >= 24 ? 'Sedang' : 'Baru'),
        note: `${r.status_label || cfg.label} • ${r.location_text || 'Wilayah RT 01'} • ${ageHours} jam menunggu`
      };
    });

  const last7 = list.filter(r =>
    ['resolved', 'closed'].includes(r.status_group) &&
    (now - new Date(r.updated_at || r.created_at || 0).getTime()) <= 7 * 24 * 3600000
  ).length;

  return {
    counts: {
      new: list.filter(r => (r.status_group || 'new') === 'new').length,
      inspection: list.filter(r => r.status_group === 'inspection').length,
      in_progress: list.filter(r => r.status_group === 'in_progress').length,
      resolvedLast7Days: last7
    },
    needsAction
  };
}

function renderAdminNeedsAction(items) {
  const listContainer = document.getElementById('admin-needs-action-list');
  if (!listContainer) return;

  if (!items || items.length === 0) {
    listContainer.innerHTML = `<div class="agenda-empty"><i class="ph ph-checks"></i><span>Tidak ada laporan yang butuh tindakan.</span></div>`;
    return;
  }

  listContainer.innerHTML = items.map(item => `
    <div class="needs-action-item">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="ticket-id">${escapeHtml(item.publicNo)}</span>
          <span class="priority-tag">${escapeHtml(item.priority)}</span>
          <span style="font-size: 10.5px; color: var(--ink-tertiary);">${item.ageHours} jam</span>
        </div>
        <strong style="font-size: 13px; color: var(--ink-primary); display: block; margin-top: 4px;">${escapeHtml(item.title)}</strong>
        <div style="font-size: 11px; color: var(--ink-secondary); margin-top: 2px;">${escapeHtml(item.note)}</div>
      </div>
      <button class="btn-action-primary" data-action-report="${escapeHtml(item.publicNo)}">
        <span>Tindak Lanjuti</span>
      </button>
    </div>
  `).join('');

  listContainer.querySelectorAll('[data-action-report]').forEach(btn => {
    btn.addEventListener('click', () => openReportDetail(btn.getAttribute('data-action-report')));
  });
}

function renderAdminWargaTable() {
  const wargaTbody = document.getElementById('admin-warga-tbody');
  if (!wargaTbody) return;

  if (cachedWargaList.length === 0) {
    wargaTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--ink-tertiary);">Data warga belum tersedia.</td></tr>`;
    return;
  }

  wargaTbody.innerHTML = cachedWargaList.map(w => `
    <tr>
      <td>
        <div class="table-user-cell">
          <div class="table-avatar">${escapeHtml((w.nama || '?').charAt(0))}</div>
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

async function loadAdminPortalData() {
  try {
    // Selalu ambil data terbaru saat panel Admin RT dibuka
    cachedReports = await fetchFeedReports();
    cachedWargaList = await fetchWargaListSafe();
    renderAdminWargaTable();

    const overview = buildAdminOverview(cachedReports);
    document.getElementById('admin-triaged-count').textContent = overview.counts.new;
    document.getElementById('admin-inspect-count').textContent = overview.counts.inspection;
    document.getElementById('admin-resolved-count').textContent = overview.counts.resolvedLast7Days;
    renderAdminNeedsAction(overview.needsAction);

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
    // Selalu ambil data terbaru saat Dev Hub dibuka
    cachedReports = await fetchFeedReports();
    cachedWargaList = await fetchWargaListSafe();

    const devRes = await fetch('/api/v1/dev/overview');
    if (devRes.ok) {
      const { data } = await devRes.json();
      document.getElementById('dev-stat-rt').textContent = data.rtCount ?? 0;
      document.getElementById('dev-stat-users').textContent = data.activeUserCount ?? cachedWargaList.length;
    }

    const now = Date.now();
    const reportsLast30Days = cachedReports.filter(r =>
      (now - new Date(r.created_at || 0).getTime()) <= 30 * 24 * 3600000
    ).length;
    const openReports = cachedReports.filter(r =>
      !['resolved', 'closed'].includes(r.status_group || 'new')
    ).length;

    const statReports = document.getElementById('dev-stat-reports');
    if (statReports) statReports.textContent = reportsLast30Days;
    const statNeedsAction = document.getElementById('dev-stat-needs-action');
    if (statNeedsAction) statNeedsAction.textContent = openReports;

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
    if (usersTbody) {
      usersTbody.innerHTML = cachedWargaList.length === 0
        ? `<tr><td colspan="6" style="text-align:center; color: var(--ink-tertiary);">Data warga belum tersedia.</td></tr>`
        : cachedWargaList.map(w => `
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
      if (!res.ok) {
        showToast('Gagal mengubah peran pengguna.', 'error');
        return;
      }

      // Sinkronkan cache lokal agar Admin RT & Dev Hub menampilkan data sama
      const localUser = cachedWargaList.find(w => String(w.uuid || w.id) === String(userId));
      if (localUser) localUser.role = newRole;

      showToast(`Peran pengguna berhasil diubah ke ${newRole}`, 'success');
      renderAdminWargaTable();
      await loadAdminPortalData();
      await loadDeveloperPortalData();
    } catch (err) {
      showToast('Gagal mengubah peran: ' + err.message, 'error');
    }
  };

  // Modal close triggers
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  btnAuthTrigger?.addEventListener('click', () => authModal.classList.remove('hidden'));
  btnNewReport?.addEventListener('click', openCreateReportModal);
  document.getElementById('mobile-btn-new-report')?.addEventListener('click', openCreateReportModal);

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
    pendingPhotos.splice(idx, 1);
    renderPhotoPreview();
  });

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
        lng,
        photos: [...pendingPhotos]
      });
      showToast(`Laporan ${res?.publicNo || ''} berhasil dikirim ke pengurus RT!`, 'success');
      reportModal.classList.add('hidden');
      reportForm.reset();
      pendingPhotos = [];
      renderPhotoPreview();
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
