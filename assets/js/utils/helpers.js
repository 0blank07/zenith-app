// FC Market Pro - Utility Helper Functions
// Reusable functions used across the application

// Format price to display (e.g., 2450000 → "2.45M")
function formatPrice(price) {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(2) + 'M';
  }
  return (price / 1000).toFixed(0) + 'K';
}

// Format number with commas (e.g., 31847 → "31,847")
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get initials from player name (e.g., "Lionel Messi" → "LM")
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Show toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? 
        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : 
        '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Generate realistic price history data for charts
function generatePriceHistory(basePrice, days = 30) {
  const history = [];
  let currentPrice = basePrice * 0.8;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random price fluctuation
    const change = (Math.random() - 0.5) * 0.1 * currentPrice;
    currentPrice += change;
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice)
    });
  }
  
  // Ensure last price matches current price
  history[history.length - 1].price = basePrice;
  
  return history;
}

// Animate number counting up
function animateNumber(elementId, target) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 1000;
  const steps = 30;
  const increment = target / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = formatNumber(target);
      clearInterval(timer);
    } else {
      element.textContent = formatNumber(Math.floor(current));
    }
  }, duration / steps);
}

const RANK_OVERLAY_IMAGE_MAP = {
  1: 'assets/images/rank_single_frame/single_green_rank.png',
  2: 'assets/images/rank_single_frame/single_blue_rank.png',
  3: 'assets/images/rank_single_frame/single_purple_rank.png',
  4: 'assets/images/rank_single_frame/single_red_rank.png',
  5: 'assets/images/rank_single_frame/single_gold_rank.png',
  green: 'assets/images/rank_single_frame/single_green_rank.png',
  blue: 'assets/images/rank_single_frame/single_blue_rank.png',
  purple: 'assets/images/rank_single_frame/single_purple_rank.png',
  red: 'assets/images/rank_single_frame/single_red_rank.png',
  gold: 'assets/images/rank_single_frame/single_gold_rank.png',
  orange: 'assets/images/rank_single_frame/single_gold_rank.png',
};

function getRankOverlaySrc(rank) {
  if (rank === null || rank === undefined) return '';
  if (typeof rank === 'string') {
    const key = rank.trim().toLowerCase();
    return RANK_OVERLAY_IMAGE_MAP[key] || RANK_OVERLAY_IMAGE_MAP[parseInt(key, 10)] || '';
  }
  const normalized = parseInt(rank, 10);
  return RANK_OVERLAY_IMAGE_MAP[normalized] || '';
}

const DEV_LOGGING_ENABLED = window.location.protocol === 'file:' ||
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

function devLog(label, details) {
  if (!DEV_LOGGING_ENABLED) return;
  if (details !== undefined) {
    console.log(label, details);
    return;
  }
  console.log(label);
}

function applyRankOverlay(container, rank, options = {}) {
  if (!container) return;
  const src = getRankOverlaySrc(rank);
  const modifierClass = options.modifierClass || '';
  const scope = options.scope || 'squad-builder';
  let overlay = container.querySelector('.rank-diamond-overlay');

  if (!src) {
    if (overlay) overlay.remove();
    return;
  }

  if (!overlay) {
    overlay = document.createElement('img');
    container.appendChild(overlay);
  }

  devLog('RANK_OVERLAY_APPLIED', {
    scope,
    modifierClass,
    rank,
    targetId: container.id || '',
    targetClass: container.className || '',
    playerId: container.dataset ? container.dataset.playerId || '' : ''
  });

  overlay.className = ['rank-diamond-overlay', modifierClass].filter(Boolean).join(' ');
  overlay.src = src;
  overlay.alt = 'Rank';
  overlay.dataset.rank = String(rank);
  overlay.setAttribute('aria-hidden', 'true');
}

window.getRankOverlaySrc = getRankOverlaySrc;
window.applyRankOverlay = applyRankOverlay;
window.devLog = devLog;


function getPlayerType(player) {
  const event = (player.event || '').toLowerCase();
  if (event.includes('icon')) return 'icon';
  if (event.includes('hero')) return 'hero';
  return 'normal';
}