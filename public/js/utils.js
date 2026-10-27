/* ═══════════════════════════════════════════════════════════════════════════
   Shared utility functions – included on every page
   ═══════════════════════════════════════════════════════════════════════════ */

// ── API helper ───────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  };
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete defaults.headers['Content-Type'];
  }
  const res = await fetch(url, { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response.' }));
  if (!res.ok && !data.success) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ── Auth status (cached) ──────────────────────────────────────────────────────
let _authState = null;

async function getAuthState(force = false) {
  if (_authState && !force) return _authState;
  try {
    const data = await apiFetch('/api/auth/status');
    _authState = data;
    return data;
  } catch {
    _authState = { loggedIn: false };
    return _authState;
  }
}

function invalidateAuth() { _authState = null; }

// ── Navigation builder ────────────────────────────────────────────────────────
async function buildNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const auth = await getAuthState();
  const role = auth.user?.role;
  const name = auth.user?.name || '';

  const guestLinks = `
    <a href="/items.html">Browse Items</a>
    <a href="/about.html">About</a>
    <a href="/login.html" class="btn-nav">Login</a>
    <a href="/register.html" class="btn-nav" style="background:var(--white);color:var(--navy);">Register</a>
  `;

  const studentLinks = `
    <a href="/items.html">Browse Items</a>
    <a href="/report-lost.html">Report Lost</a>
    <a href="/report-found.html">Report Found</a>
    <div class="nav-dropdown">
      <button class="nav-dropdown-toggle" onclick="toggleDropdown(this)">
        <div class="avatar">${name.charAt(0).toUpperCase()}</div>
        <span>${name.split(' ')[0]}</span> ▾
      </button>
      <div class="nav-dropdown-menu">
        <a href="/my-reports.html">📋 My Reports</a>
        <a href="/my-claims.html">🏷️ My Claims</a>
        <a href="/profile.html">👤 Profile</a>
        <div class="divider"></div>
        <a href="#" onclick="logout(event)">🚪 Logout</a>
      </div>
    </div>
  `;

  const adminLinks = `
    <a href="/items.html">Browse Items</a>
    <a href="/admin/dashboard.html">Dashboard</a>
    <div class="nav-dropdown">
      <button class="nav-dropdown-toggle" onclick="toggleDropdown(this)">
        <div class="avatar" style="background:var(--red)">A</div>
        <span>Admin</span> ▾
      </button>
      <div class="nav-dropdown-menu">
        <a href="/admin/dashboard.html">📊 Dashboard</a>
        <a href="/admin/reports.html">📋 Reports</a>
        <a href="/admin/claims.html">🏷️ Claims</a>
        <a href="/admin/users.html">👥 Users</a>
        <div class="divider"></div>
        <a href="#" onclick="logout(event)">🚪 Logout</a>
      </div>
    </div>
  `;

  nav.innerHTML = auth.loggedIn ? (role === 'admin' ? adminLinks : studentLinks) : guestLinks;
  highlightCurrentNav();
}

function highlightCurrentNav() {
  const path = window.location.pathname;
  document.querySelectorAll('#main-nav a').forEach((a) => {
    if (a.href && new URL(a.href).pathname === path) a.classList.add('active');
  });
}

function toggleDropdown(btn) {
  const menu = btn.nextElementSibling;
  menu.classList.toggle('show');
  document.addEventListener('click', function close(e) {
    if (!btn.closest('.nav-dropdown').contains(e.target)) {
      menu.classList.remove('show');
      document.removeEventListener('click', close);
    }
  });
}

async function logout(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  invalidateAuth();
  window.location.href = '/login.html';
}

// ── Hamburger menu ────────────────────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
}

// ── Route guards ──────────────────────────────────────────────────────────────
async function requireLogin() {
  const auth = await getAuthState();
  if (!auth.loggedIn) { window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname); return false; }
  return auth;
}

async function requireAdminRole() {
  const auth = await getAuthState();
  if (!auth.loggedIn) { window.location.href = '/login.html'; return false; }
  if (auth.user.role !== 'admin') { window.location.href = '/items.html'; return false; }
  return auth;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d);
}

function badgeHtml(text, cls) {
  return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
}

function statusBadge(status) {
  const map = { Open: 'badge-open', 'Claim Pending': 'badge-pending', Resolved: 'badge-resolved' };
  return badgeHtml(status, map[status] || 'badge-cat');
}

function typeBadge(type) {
  return badgeHtml(type, type === 'Lost' ? 'badge-lost' : 'badge-found');
}

function claimStatusBadge(status) {
  const map = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };
  return badgeHtml(status, map[status] || 'badge-cat');
}

function categoryIcon(cat) {
  const map = {
    Electronics: '💻', Documents: '📄', Bags: '🎒', Keys: '🔑',
    Accessories: '👜', Clothing: '👕', Books: '📚', Other: '📦'
  };
  return map[cat] || '📦';
}

function itemImageHtml(imagePath, itemName, cssClass = '') {
  if (imagePath) {
    return `<img src="${escapeHtml(imagePath)}" alt="${escapeHtml(itemName)}" class="${cssClass}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'>${categoryIcon('')}</div>'">`;
  }
  return `<div class="card-img-placeholder" aria-label="No image">${categoryIcon('')}</div>`;
}

function buildPagination(container, current, total, onPageClick) {
  if (total <= 1) { container.innerHTML = ''; return; }
  let html = '';
  html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="(${onPageClick})(${current - 1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i !== 1 && i !== total && Math.abs(i - current) > 2) {
      if (i === 2 || i === total - 1) html += `<button class="page-btn" disabled>…</button>`;
      continue;
    }
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${onPageClick})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="(${onPageClick})(${current + 1})">›</button>`;
  container.innerHTML = html;
}

function showConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirm-modal');
  const msg = document.getElementById('confirm-message');
  const btn = document.getElementById('confirm-ok');
  if (!overlay) return onConfirm();
  msg.textContent = message;
  overlay.classList.add('show');
  const handler = () => { overlay.classList.remove('show'); btn.removeEventListener('click', handler); onConfirm(); };
  btn.addEventListener('click', handler);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  initHamburger();

  // Build mobile nav links from desktop nav after it renders
  setTimeout(() => {
    const mobileMenu = document.getElementById('mobile-menu');
    const mainNav = document.getElementById('main-nav');
    if (mobileMenu && mainNav) {
      const links = mainNav.querySelectorAll('a');
      let html = '';
      links.forEach(a => { html += `<a href="${a.href}">${a.textContent.trim()}</a>`; });
      // Add logout if logged in
      mobileMenu.innerHTML = html || mobileMenu.innerHTML;
    }
  }, 200);
});
