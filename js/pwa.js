/**
 * SULAP PWA Handler (Vanilla JS)
 * Handles Service Worker registration, install prompt, and online/offline status.
 */

let deferredInstallPrompt = null;

export function initPWA({ onInstallable, onInstalled } = {}) {
  // 1. Daftarkan Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker(0);
    });
  }

  function registerServiceWorker(retry) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        // Cek update
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showToast('Versi baru SULAP tersedia. Silakan muat ulang halaman.', 'info');
              }
            });
          }
        });
      })
      .catch((err) => {
        // AbortError biasanya transien (halaman reload/hard-refresh saat registrasi).
        if (err && err.name === 'AbortError' && retry < 2) {
          setTimeout(() => registerServiceWorker(retry + 1), 1500);
          return;
        }
        console.warn('Registrasi Service Worker gagal:', err);
      });
  }

  // 2. Tangkap event beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (onInstallable) {
      onInstallable();
    }
  });

  // 3. Tangkap event appinstalled
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    showToast('Aplikasi SULAP berhasil dipasang di perangkat!', 'success');
    if (onInstalled) {
      onInstalled();
    }
  });

  // 4. Deteksi status koneksi internet
  window.addEventListener('online', () => {
    updateOnlineStatus(true);
  });
  window.addEventListener('offline', () => {
    updateOnlineStatus(false);
  });

  // Cek status awal
  if (!navigator.onLine) {
    updateOnlineStatus(false);
  }
}

export async function promptPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === 'accepted';
  } else {
    // Fallback instruksi manual untuk browser non-Chromium / iOS
    return false;
  }
}

function updateOnlineStatus(isOnline) {
  let offlineBanner = document.getElementById('offline-indicator-banner');
  if (!offlineBanner) {
    offlineBanner = document.createElement('div');
    offlineBanner.id = 'offline-indicator-banner';
    offlineBanner.className = 'offline-banner';
    document.body.appendChild(offlineBanner);
  }

  if (isOnline) {
    offlineBanner.textContent = 'Koneksi kembali terhubung.';
    offlineBanner.classList.add('online-restored');
    setTimeout(() => {
      offlineBanner.remove();
    }, 2500);
  } else {
    offlineBanner.innerHTML = '<i class="ph ph-wifi-slash"></i> Mode Offline: Membaca data tersimpan di perangkat.';
    offlineBanner.classList.remove('online-restored');
  }
}

export function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
