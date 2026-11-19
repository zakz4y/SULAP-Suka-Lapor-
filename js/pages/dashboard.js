/**
 * SULAP Dashboard Page Controller
 * Mengelola tampilan utama: ticket feed, insights chart, agenda, dan metrics.
 */

import {
  initShared,
  state,
  generateTicketCardHtml,
  attachReportClickEvents,
  openReportDetail,
  formatRelativeTime,
  escapeHtml,
  getCategoryIcon,
  getStatusConfig
} from '../shared.js';
import { fetchFeedReports } from '../api.js';
import { showToast } from '../pwa.js';

/**
 * Memuat dan me-render semua laporan untuk dashboard.
 */
async function loadReports() {
  const ticketFeedContainer = document.getElementById('ticket-feed-container');
  if (ticketFeedContainer) {
    ticketFeedContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--ink-secondary);">Memuat data tiket laporan...</div>';
  }
  try {
    state.cachedReports = await fetchFeedReports();
    renderDashboardTickets(state.cachedReports);
    renderDashboardInsights(state.cachedReports);
    updateMetrics(state.cachedReports);
  } catch (err) {
    if (ticketFeedContainer) {
      ticketFeedContainer.innerHTML = `<div style="padding: 20px; color: var(--danger-btn); font-size: 13px;">Gagal memuat feed: ${err.message}</div>`;
    }
  }
}

/**
 * Render daftar tiket laporan ke #ticket-feed-container (maks 6).
 */
function renderDashboardTickets(reports) {
  const ticketFeedContainer = document.getElementById('ticket-feed-container');
  if (!ticketFeedContainer) return;

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

/**
 * Render dashboard insights: weekly chart + agenda.
 */
function renderDashboardInsights(reports) {
  renderWeeklyChart(reports);
  renderAgenda(reports);
}

/**
 * Render bar chart mingguan ke #chart-bars-container.
 */
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

/**
 * Render agenda item ke #agenda-list-container (maks 3 laporan terbuka terlama).
 */
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

/**
 * Update stat counters di header dashboard.
 */
function updateMetrics(reports) {
  const newCount = reports.filter(r => (r.status_group || 'new') === 'new').length;
  const processCount = reports.filter(r => ['in_progress', 'triaged', 'inspection'].includes(r.status_group)).length;
  const resolvedCount = reports.filter(r => r.status_group === 'resolved').length;

  const statNewCount = document.getElementById('stat-new-count');
  const statProcessCount = document.getElementById('stat-process-count');
  const statResolvedCount = document.getElementById('stat-resolved-count');

  if (statNewCount) statNewCount.textContent = newCount;
  if (statProcessCount) statProcessCount.textContent = processCount;
  if (statResolvedCount) statResolvedCount.textContent = resolvedCount;
}

/**
 * Setup event listeners spesifik halaman dashboard.
 */
function setupDashboardEventListeners() {
  const btnRefreshFeed = document.getElementById('btn-refresh-feed');
  btnRefreshFeed?.addEventListener('click', async () => {
    btnRefreshFeed.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Memuat...';
    await loadReports();
    btnRefreshFeed.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Segarkan';
    showToast('Data feed berhasil diperbarui.', 'info');
  });
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
  await initShared();
  setupDashboardEventListeners();
  await loadReports();
});
