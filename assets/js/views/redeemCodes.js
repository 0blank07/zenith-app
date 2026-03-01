// ============================================================
//  ZENITH — REDEEM CODES MODULE
//  File: assets/js/views/redeemCodes.js
// ============================================================

const REDEEM_CODES_DATA = [
  {
    code: 'FCMOBILENGABUBURIT',
    reward: '2,000 Gems',
    rewardType: 'gems',
    date: '2026-02-25',
    status: 'active',
    hot: true,
    icon: '💎'
  },
  {
    code: 'CAPPEDANTWAN',
    reward: '1× FC Draft Voucher + 100 Rankup Points',
    rewardType: 'mixed',
    date: '2026-02-24',
    status: 'active',
    hot: true,
    icon: '🎟️'
  },
  {
    code: 'RAMADANKAREEM26',
    reward: '1× Draft Voucher',
    rewardType: 'voucher',
    date: '2026-02-18',
    status: 'active',
    hot: false,
    icon: '🌙'
  },
  {
    code: 'FOOTYVERSE26GIFT',
    reward: '500 Gems + Rankup Tokens',
    rewardType: 'gems',
    date: '2026-02-10',
    status: 'active',
    hot: false,
    icon: '🌍'
  },
  {
    code: 'ANSSTORY26',
    reward: '1× Special Player Pack',
    rewardType: 'pack',
    date: '2026-02-05',
    status: 'expired',
    hot: false,
    icon: '📦'
  },
  {
    code: 'RAGNAROK25PROMO',
    reward: '1,000 Gems',
    rewardType: 'gems',
    date: '2025-12-01',
    status: 'expired',
    hot: false,
    icon: '⚡'
  },
  {
    code: 'THUNDERSTRUCK25',
    reward: '100 Rankup Points',
    rewardType: 'rankup',
    date: '2025-11-20',
    status: 'expired',
    hot: false,
    icon: '🌩️'
  },
  {
    code: 'TOTY25ZENITH',
    reward: '2× Draft Vouchers',
    rewardType: 'voucher',
    date: '2025-11-10',
    status: 'expired',
    hot: false,
    icon: '🏆'
  }
];

const REDEEM_URL = 'https://redeem.fcm.ea.com/';

// ─── Render ──────────────────────────────────────────────────
function renderRedeemCodesView() {
  const view = document.getElementById('redeem-codes-view');
  if (!view) return;

  const activeCodes  = REDEEM_CODES_DATA.filter(c => c.status === 'active');
  const expiredCodes = REDEEM_CODES_DATA.filter(c => c.status === 'expired');

  view.innerHTML = `
    <div class="redeem-page">

      <!-- ── Hero Banner ── -->
      <div class="redeem-hero">
        <div class="redeem-hero-bg"></div>
        <div class="redeem-hero-content">
          <div class="redeem-hero-badge">
            <span class="pulse-dot"></span>
            <span>${activeCodes.length} Active Code${activeCodes.length !== 1 ? 's' : ''}</span>
          </div>
          <h1 class="redeem-hero-title">Redeem Codes</h1>
          <p class="redeem-hero-sub">Free Gems · Vouchers · Player Packs</p>
          <a href="${REDEEM_URL}" target="_blank" rel="noopener" class="redeem-official-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Official EA Redemption Page
          </a>
        </div>
      </div>

      <!-- ── How To Redeem ── -->
      <div class="redeem-how">
        <h2 class="redeem-section-title">How To Redeem</h2>
        <div class="redeem-steps">
          ${[
            ['1', '🔗', 'Visit EA Page', 'Go to the official EA FC Mobile redemption site'],
            ['2', '🔑', 'Sign In', 'Log in with your linked EA account'],
            ['3', '📋', 'Enter Code', 'Copy a code below and paste it into the field'],
            ['4', '📬', 'Claim Reward', 'Check your in-game mailbox for the reward']
          ].map(([num, icon, title, desc]) => `
            <div class="redeem-step">
              <div class="step-num">${num}</div>
              <div class="step-icon">${icon}</div>
              <div class="step-info">
                <strong>${title}</strong>
                <span>${desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── Active Codes ── -->
      <div class="redeem-section">
        <div class="redeem-section-header">
          <h2 class="redeem-section-title">
            <span class="green-dot"></span> Active Codes
          </h2>
          <span class="redeem-note">Codes expire quickly — redeem ASAP!</span>
        </div>

        <div class="redeem-codes-grid" id="active-codes-grid">
          ${activeCodes.map(c => renderCodeCard(c)).join('')}
        </div>
      </div>

      <!-- ── Expired Codes ── -->
      <div class="redeem-section">
        <div class="redeem-section-header">
          <h2 class="redeem-section-title expired-title">
            <span class="grey-dot"></span> Expired Codes
          </h2>
        </div>
        <div class="redeem-codes-grid expired-grid" id="expired-codes-grid">
          ${expiredCodes.map(c => renderCodeCard(c)).join('')}
        </div>
      </div>

      <!-- ── Footer note ── -->
      <div class="redeem-footer-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Codes are sourced from EA's official FC Mobile social channels. Zenith is not affiliated with EA Sports.
      </div>
    </div>
  `;
}

function renderCodeCard(c) {
  const isActive  = c.status === 'active';
  const dateLabel = formatCodeDate(c.date);

  return `
    <div class="redeem-card ${isActive ? 'active' : 'expired'} ${c.hot ? 'hot' : ''}">
      ${c.hot ? '<div class="hot-tag">🔥 HOT</div>' : ''}
      ${isActive ? '<div class="active-badge"><span class="pulse-dot small"></span>Active</div>' : '<div class="expired-badge">Expired</div>'}

      <div class="redeem-card-top">
        <span class="reward-icon">${c.icon}</span>
        <div class="reward-info">
          <span class="reward-type-label">${c.rewardType.toUpperCase()}</span>
          <span class="reward-text">${c.reward}</span>
        </div>
      </div>

      <div class="code-display">
        <span class="code-text" id="code-${c.code}">${c.code}</span>
        ${isActive ? `
          <button class="copy-btn" onclick="copyRedeemCode('${c.code}', this)" title="Copy code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        ` : ''}
      </div>

      <div class="redeem-card-footer">
        <span class="code-date">📅 ${dateLabel}</span>
        ${isActive ? `
          <a href="${REDEEM_URL}" target="_blank" rel="noopener" class="redeem-btn-sm">
            Redeem
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

function copyRedeemCode(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.style.background = 'rgba(59, 214, 113, 0.25)';
    btn.style.borderColor = '#3bd671';
    btn.style.color = '#3bd671';
    showToast(`Copied: ${code}`, 'success');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function formatCodeDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}