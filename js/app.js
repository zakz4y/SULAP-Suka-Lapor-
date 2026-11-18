/**
 * SULAP Main Application Controller (Sesuai docs/design.md v2.0)
 */
import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut, getUserProfile } from './auth.js';
import { fetchFeedReports, createReport, fetchCategories } from './api.js';

let currentUser = null;
let currentProfile = null;
let cachedReports = [];

// DOM References
const authModal = document.getElementById('auth-modal');
const reportModal = document.getElementById('report-modal');
const btnAuthTrigger = document.getElementById('btn-auth-trigger');
const btnMobileAuth = document.getElementById('btn-mobile-auth');
const btnNewReport = document.getElementById('btn-new-report');
const btnModalLogout = document.getElementById('btn-modal-logout');
const btnRefreshFeed = document.getElementById('btn-refresh-feed');
const btnPwaInfo = document.getElementById('btn-pwa-info');
const ticketContainer = document.getElementById('ticket-feed-container');
const searchInput = document.getElementById('global-search-input');

// User profile elements
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');
const userAvatarInitial = document.getElementById('user-avatar-initial');
const greetingDisplay = document.getElementById('greeting-display');

// Metric elements
const statNewCount = document.getElementById('stat-new-count');
const statProcessCount = document.getElementById('stat-process-count');
const statResolvedCount = document.getElementById('stat-resolved-count');

async function initApp() {
  setupEventListeners();
  await checkSessionState();
  await loadReportsFeed();
}

async function checkSessionState() {
  currentUser = await getCurrentUser();
  if (currentUser) {
    currentProfile = await getUserProfile(currentUser.id);
    const fullName = currentProfile?.full_name || currentUser.email.split('@')[0];
    const initial = fullName.charAt(0).toUpperCase();

    userNameDisplay.textContent = fullName;
    userRoleDisplay.textContent = currentProfile?.role === 'admin' ? 'Admin RT' : 'Warga RT Aktif';
    userAvatarInitial.textContent = initial;
    greetingDisplay.textContent = `Selamat Datang, ${fullName} 👋`;
    btnModalLogout.classList.remove('hidden');
  } else {
    userNameDisplay.textContent = 'Warga Tamu';
    userRoleDisplay.textContent = 'Klik untuk Masuk';
    userAvatarInitial.textContent = 'W';
    greetingDisplay.textContent = 'Selamat Datang di RT 01 👋';
    btnModalLogout.classList.add('hidden');
  }
}

async function loadReportsFeed() {
  ticketContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--ink-secondary);">Memuat data tiket laporan...</div>';
  try {
    cachedReports = await fetchFeedReports();
    renderTickets(cachedReports);
    updateMetrics(cachedReports);
  } catch (err) {
    ticketContainer.innerHTML = `<div style="padding: 20px; color: #9C3412; font-size: 13px;">Gagal memuat feed: ${err.message}</div>`;
  }
}

// Render ticket card dengan Step Progress 4 Titik & Chip Status Phosphor (docs/design.md 6.6 & 7.2)
function renderTickets(reports) {
  if (!reports || reports.length === 0) {
    ticketContainer.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: var(--ink-secondary);">
        <i class="ph ph-tray" style="font-size: 32px; color: var(--ink-tertiary); display: block; margin-bottom: 8px;"></i>
        Belum ada aduan warga. Lingkungan saat ini kondusif!
      </div>
    `;
    return;
  }

  ticketContainer.innerHTML = reports.map(report => {
    const status = report.current_status_group || 'new';
    
    // Status token & Phosphor Icon mapping (docs/design.md 7.2)
    const statusConfig = {
      new: { label: 'Baru Masuk', icon: 'ph-tray', chipClass: 'chip-new', step: 1 },
      triage: { label: 'Ditinjau', icon: 'ph-hourglass', chipClass: 'chip-triage', step: 2 },
      in_progress: { label: 'Dalam Proses', icon: 'ph-arrows-clockwise', chipClass: 'chip-in_progress', step: 3 },
      resolved: { label: 'Selesai', icon: 'ph-check-circle', chipClass: 'chip-resolved', step: 4 },
      rejected: { label: 'Ditolak', icon: 'ph-x-circle', chipClass: 'chip-rejected', step: 1 }
    };

    const cfg = statusConfig[status] || statusConfig.new;
    const ticketNo = report.public_no || '#RT01-DRAFT';
    const timeFormatted = report.created_at ? formatRelativeTime(report.created_at) : 'Baru saja';
    const locationDisplay = report.location_text || report.address_text || 'Wilayah RT 01';

    // Step dots active logic
    const s1 = cfg.step >= 1 ? 'active' : '';
    const s2 = cfg.step >= 2 ? 'active' : '';
    const s3 = cfg.step >= 3 ? 'active' : '';
    const s4 = cfg.step >= 4 ? 'active' : '';

    return `
      <article class="ticket-card">
        <div class="ticket-card-header">
          <span class="ticket-id tabular-nums">${escapeHtml(ticketNo)}</span>
          <span class="status-chip ${cfg.chipClass}">
            <i class="ph ${cfg.icon}"></i>
            <span>${cfg.label}</span>
          </span>
        </div>

        <div class="ticket-body-layout">
          <div class="ticket-thumb">
            <i class="ph ph-warning-circle"></i>
          </div>
          <div class="ticket-info">
            <h4 class="ticket-title">${escapeHtml(report.title)}</h4>
            <p class="ticket-desc">${escapeHtml(report.description || '')}</p>
          </div>
        </div>

        <!-- 4-step progress tracker (docs/design.md 6.6) -->
        <div class="ticket-step-progress">
          <div class="step-dot ${s1}" title="Laporan Baru"></div>
          <div class="step-line ${s2}"></div>
          <div class="step-dot ${s2}" title="Ditinjau Admin"></div>
          <div class="step-line ${s3}"></div>
          <div class="step-dot ${s3}" title="Sedang Dikerjakan"></div>
          <div class="step-line ${s4}"></div>
          <div class="step-dot ${s4}" title="Tuntas"></div>
          <span class="ticket-time-meta">📍 ${escapeHtml(locationDisplay)} • ${timeFormatted}</span>
        </div>
      </article>
    `;
  }).join('');
}

function updateMetrics(reports) {
  const newCount = reports.filter(r => (r.current_status_group || 'new') === 'new').length;
  const processCount = reports.filter(r => ['in_progress', 'triage', 'inspect'].includes(r.current_status_group)).length;
  const resolvedCount = reports.filter(r => r.current_status_group === 'resolved').length;

  statNewCount.textContent = newCount;
  statProcessCount.textContent = processCount;
  statResolvedCount.textContent = resolvedCount;
}

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

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function setupEventListeners() {
  // Auth Trigger
  const openAuth = () => authModal.classList.remove('hidden');
  btnAuthTrigger.addEventListener('click', openAuth);
  if (btnMobileAuth) btnMobileAuth.addEventListener('click', openAuth);

  // Close modals
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      authModal.classList.add('hidden');
      reportModal.classList.add('hidden');
    });
  });

  // Modal Auth Form
  const authForm = document.getElementById('auth-form');
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const isRegister = document.getElementById('auth-toggle-reg').checked;
    const submitBtn = authForm.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';
      if (isRegister) {
        const name = document.getElementById('auth-name').value;
        await signUpWithEmail(email, password, name);
        alert('Pendaftaran berhasil! Silakan periksa inbox email Anda.');
      } else {
        await signInWithEmail(email, password);
      }
      authModal.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      alert('Autentikasi gagal: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk / Simpan';
    }
  });

  // Toggle register field
  document.getElementById('auth-toggle-reg').addEventListener('change', (e) => {
    document.getElementById('name-group').style.display = e.target.checked ? 'block' : 'none';
  });

  // Logout
  btnModalLogout.addEventListener('click', async () => {
    await signOut();
  });

  // Refresh feed
  btnRefreshFeed.addEventListener('click', loadReportsFeed);

  // Buat Laporan Trigger
  btnNewReport.addEventListener('click', async () => {
    if (!currentUser) {
      alert('Silakan masuk terlebih dahulu untuk membuat aduan warga.');
      authModal.classList.remove('hidden');
      return;
    }
    await loadCategoriesIntoForm();
    reportModal.classList.remove('hidden');
  });

  // Load Categories
  async function loadCategoriesIntoForm() {
    const catSelect = document.getElementById('report-cat-input');
    if (!catSelect) return;
    try {
      const categories = await fetchCategories();
      if (categories && categories.length > 0) {
        catSelect.innerHTML = categories.map((c, i) => 
          `<option value="${c.id}" ${i === 0 ? 'selected' : ''}>${c.name}</option>`
        ).join('');
      } else {
        catSelect.innerHTML = '<option value="11111111-1111-1111-1111-111111111111" selected>Fasilitas Umum</option>';
      }
    } catch {
      catSelect.innerHTML = '<option value="11111111-1111-1111-1111-111111111111" selected>Fasilitas Umum</option>';
    }
  }

  // Submit Laporan Form
  const reportForm = document.getElementById('report-form');
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('report-title-input').value;
    const description = document.getElementById('report-desc-input').value;
    const addressText = document.getElementById('report-addr-input').value;
    const categoryId = document.getElementById('report-cat-input').value || null;
    const submitBtn = reportForm.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';
      await createReport({
        title,
        description,
        categoryId,
        addressText
      });
      alert('Laporan berhasil dikirim ke pengurus RT!');
      reportModal.classList.add('hidden');
      reportForm.reset();
      await loadReportsFeed();
    } catch (err) {
      alert('Gagal mengirim aduan: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Laporan ke Pengurus RT';
    }
  });

  // GPS Action Button
  const btnGps = document.getElementById('btn-get-gps');
  if (btnGps) {
    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Browser tidak mendukung geolokasi');
        return;
      }
      btnGps.textContent = 'Mencari...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          document.getElementById('report-addr-input').value = `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          btnGps.innerHTML = '<i class="ph ph-check"></i> Terisi';
        },
        () => {
          alert('GPS diblokir / tidak dapat mendeteksi lokasi. Silakan ketik alamat manual.');
          btnGps.innerHTML = '<i class="ph ph-navigation-arrow"></i> GPS';
        }
      );
    });
  }

  // Filter Search Cepat
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderTickets(cachedReports);
      return;
    }
    const filtered = cachedReports.filter(r => 
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.public_no && r.public_no.toLowerCase().includes(q)) ||
      (r.location_text && r.location_text.toLowerCase().includes(q))
    );
    renderTickets(filtered);
  });

  // PWA Prompt Info
  btnPwaInfo.addEventListener('click', () => {
    alert('Untuk memasang di perangkat: buka menu browser Anda (titik tiga) lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen).');
  });
}

document.addEventListener('DOMContentLoaded', initApp);
