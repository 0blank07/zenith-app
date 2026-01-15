/**
 * WATCHLIST ENHANCED - Toolbar & Card Interactions
 * Graphite Teal Pro Theme
 */

// Create and inject the enhanced toolbar
function initWatchlistToolbar() {
  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) return;

  const viewContent = watchlistView.querySelector('.view-content') || watchlistView;
  
  // Check if toolbar already exists
  if (viewContent.querySelector('.watchlist-compact-toolbar')) return;

  // Create toolbar HTML
  const toolbarHTML = `
    <div class="watchlist-compact-toolbar">
      <!-- Title Badge with Count -->
      <div class="watchlist-title-badge">
        <h2>Your Watchlist</h2>
        <span class="watchlist-count" id="watchlist-count">0</span>
      </div>

      <!-- Search Bar -->
      <div class="watchlist-toolbar-search">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          type="text" 
          id="watchlist-search-input" 
          placeholder="Search watchlist players..."
          autocomplete="off"
        />
      </div>

      <!-- Sort Select -->
      <div class="watchlist-toolbar-sort">
        <select id="watchlist-sort-select">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="rating-desc">Rating (High to Low)</option>
          <option value="rating-asc">Rating (Low to High)</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>
    </div>

    <!-- Watchlist Layout Container -->
    <div class="watchlist-layout">
      <div id="watchlist-grid"></div>
      
      <!-- Empty State -->
      <div class="watchlist-empty-state" id="watchlist-empty">
        <svg class="watchlist-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3 class="watchlist-empty-title">Your watchlist is empty</h3>
        <p class="watchlist-empty-text">Start adding players to track their stats and prices</p>
        <button class="watchlist-empty-action" onclick="switchView('database')">Browse Players</button>
      </div>
    </div>
  `;

  // Insert toolbar at the beginning of view content
  viewContent.insertAdjacentHTML('afterbegin', toolbarHTML);

  // Initialize toolbar functionality
  setupToolbarEvents();
}

// Setup toolbar event listeners
function setupToolbarEvents() {
  const searchInput = document.getElementById('watchlist-search-input');
  const sortSelect = document.getElementById('watchlist-sort-select');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', handleWatchlistSort);
  }
}

// Handle watchlist search
function handleWatchlistSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  const cards = document.querySelectorAll('#watchlist-grid .player-row');

  cards.forEach(card => {
    const playerName = card.querySelector('.player-info-name')?.textContent.toLowerCase() || '';
    const playerMeta = card.querySelector('.player-info-meta')?.textContent.toLowerCase() || '';
    
    const matches = playerName.includes(query) || playerMeta.includes(query);
    
    if (matches || query === '') {
      card.style.display = '';
      card.style.animation = 'fadeInUp 0.3s ease forwards';
    } else {
      card.style.display = 'none';
    }
  });

  // Check if any cards are visible
  const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
  updateEmptyState(visibleCards.length === 0);
}

// Handle watchlist sorting
function handleWatchlistSort(event) {
  const sortValue = event.target.value;
  const grid = document.getElementById('watchlist-grid');
  const cards = Array.from(grid.querySelectorAll('.player-row'));

  cards.sort((a, b) => {
    switch (sortValue) {
      case 'name-asc':
        return getPlayerName(a).localeCompare(getPlayerName(b));
      
      case 'name-desc':
        return getPlayerName(b).localeCompare(getPlayerName(a));
      
      case 'rating-desc':
        return getPlayerRating(b) - getPlayerRating(a);
      
      case 'rating-asc':
        return getPlayerRating(a) - getPlayerRating(b);
      
      case 'recent':
        // Keep original order (most recently added first)
        return 0;
      
      default:
        return 0;
    }
  });

  // Re-append cards in sorted order
  cards.forEach(card => grid.appendChild(card));
}

// Helper: Get player name from card
function getPlayerName(card) {
  return card.querySelector('.player-info-name')?.textContent.trim() || '';
}

// Helper: Get player rating from card
function getPlayerRating(card) {
  const ratingText = card.querySelector('.player-card-overall')?.textContent.trim() || '0';
  return parseInt(ratingText) || 0;
}

// Update watchlist count badge
function updateWatchlistCount(count) {
  const countBadge = document.getElementById('watchlist-count');
  if (countBadge) {
    countBadge.textContent = count;
  }
}

// Update empty state visibility
function updateEmptyState(isEmpty) {
  const emptyState = document.getElementById('watchlist-empty');
  const grid = document.getElementById('watchlist-grid');
  
  if (isEmpty) {
    emptyState?.classList.add('visible');
    if (grid) grid.style.display = 'none';
  } else {
    emptyState?.classList.remove('visible');
    if (grid) grid.style.display = 'grid';
  }
}

// Debounce utility for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhanced player card rendering for watchlist
function renderWatchlistPlayerCard(player) {
  const initials = getPlayerInitials(player.name);
  
  return `
    <div class="player-row" data-player-id="${player.id}" onclick="showPlayerDetail('${player.id}')">
      <!-- Top Section -->
      <div class="watchlist-player-top">
        <div class="watchlist-card-container">
          <div class="player-row-card">
            <div class="player-card-badge">
              <div class="player-card-overall">${player.overall_rating}</div>
              <div class="player-card-position">${player.position}</div>
            </div>
            <div class="player-card-image-placeholder">
              <div class="player-initials">${initials}</div>
            </div>
          </div>
        </div>
        <div class="watchlist-rating-badge">${player.overall_rating}</div>
      </div>

      <!-- Player Info -->
      <div class="watchlist-player-info">
        <div class="player-info-name">${player.name}</div>
        <div class="player-info-meta">${player.club}</div>
        <div class="player-info-secondary">${player.league} • ${player.nation}</div>
      </div>

      <!-- Stats Section -->
      <div class="watchlist-stats-section">
        <div class="player-row-stats">
          <div class="stat-pill">
            <div class="stat-pill-value">${player.pace || 'N/A'}</div>
            <div class="stat-pill-label">PAC</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-value">${player.shooting || 'N/A'}</div>
            <div class="stat-pill-label">SHO</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-value">${player.passing || 'N/A'}</div>
            <div class="stat-pill-label">PAS</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-value">${player.dribbling || 'N/A'}</div>
            <div class="stat-pill-label">DRI</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-value">${player.defending || 'N/A'}</div>
            <div class="stat-pill-label">DEF</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-value">${player.physical || 'N/A'}</div>
            <div class="stat-pill-label">PHY</div>
          </div>
        </div>
      </div>

      <!-- Remove from Watchlist Button -->
      <button 
        class="player-row-watchlist active" 
        onclick="event.stopPropagation(); removeFromWatchlist('${player.id}')"
        title="Remove from watchlist"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
  `;
}

// Get player initials for placeholder
function getPlayerInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWatchlistToolbar);
} else {
  initWatchlistToolbar();
}

// Re-initialize when switching to watchlist view
const originalSwitchView = window.switchView;
if (originalSwitchView) {
  window.switchView = function(viewName) {
    originalSwitchView(viewName);
    if (viewName === 'watchlist') {
      setTimeout(initWatchlistToolbar, 100);
    }
  };
}

// Export functions for use in other modules
window.initWatchlistToolbar = initWatchlistToolbar;
window.renderWatchlistPlayerCard = renderWatchlistPlayerCard;
window.updateWatchlistCount = updateWatchlistCount;
window.updateEmptyState = updateEmptyState;
