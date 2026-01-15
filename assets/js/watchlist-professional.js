/**
 * WATCHLIST PROFESSIONAL - Complete Rewrite
 * Matches watchlist-styles.css structure
 */

let watchlistData = [];
let filteredWatchlist = [];

// Initialize watchlist when view is shown
function initProfessionalWatchlist() {
  console.log('Initializing Professional Watchlist');
  
  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) {
    console.error('Watchlist view not found');
    return;
  }

  // Load watchlist data
  loadWatchlistData();
  
  // Setup event listeners
  setupWatchlistEvents();
}

// Load watchlist data from localStorage or database
async function loadWatchlistData() {
  try {
    // Get watchlist player IDs from localStorage
    const watchlistIds = JSON.parse(localStorage.getItem('watchlist') || '[]');
    console.log('Watchlist IDs:', watchlistIds);
    
    if (watchlistIds.length === 0) {
      watchlistData = [];
      filteredWatchlist = [];
      renderWatchlist();
      return;
    }

    // If you have a global players array, use it
    if (window.allPlayers && window.allPlayers.length > 0) {
      watchlistData = window.allPlayers.filter(p => watchlistIds.includes(p.id));
    } else if (window.supabase) {
      // Fetch from Supabase
      const { data, error } = await window.supabase
        .from('players')
        .select('*')
        .in('id', watchlistIds);
      
      if (error) throw error;
      watchlistData = data || [];
    } else {
      console.warn('No data source available for watchlist');
      watchlistData = [];
    }

    filteredWatchlist = [...watchlistData];
    renderWatchlist();
    
  } catch (error) {
    console.error('Error loading watchlist data:', error);
    showToast('Failed to load watchlist', 'error');
  }
}

// Render the complete watchlist
function renderWatchlist() {
  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) return;

  const count = filteredWatchlist.length;
  console.log('Rendering watchlist with', count, 'players');

  // Update count badge
  updateWatchlistCountBadge(count);

  // Render grid
  const gridContainer = watchlistView.querySelector('.watchlist-grid');
  if (!gridContainer) {
    console.error('Watchlist grid container not found');
    return;
  }

  if (count === 0) {
    showEmptyState();
    gridContainer.innerHTML = '';
  } else {
    hideEmptyState();
    gridContainer.innerHTML = filteredWatchlist.map(player => createPlayerCard(player)).join('');
  }
}

// Create enhanced player card HTML
function createPlayerCard(player) {
  const initials = getPlayerInitials(player.name || 'Unknown');
  const hasImage = player.image_url && player.image_url !== '';
  
  return `
    <div class="watchlist-player-card" data-player-id="${player.id}" onclick="showPlayerDetail('${player.id}')">
      <!-- Remove Button -->
      <button 
        class="watchlist-remove-btn" 
        onclick="event.stopPropagation(); removeFromWatchlistConfirm('${player.id}', '${(player.name || '').replace(/'/g, "\\'")}')"
        title="Remove from watchlist"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Player Card Header -->
      <div class="player-card-header">
        <div class="player-card-image-wrapper">
          ${hasImage ? 
            `<img src="${player.image_url}" alt="${player.name}" class="player-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` :
            ''
          }
          <div class="player-initials" style="${hasImage ? 'display: none' : ''}">${initials}</div>
          <div class="player-rating-badge">${player.overall_rating || 'N/A'}</div>
        </div>
        <div class="player-card-info">
          <h3 class="player-name" title="${player.name || 'Unknown'}">${player.name || 'Unknown'}</h3>
          <div>
            <span class="player-position">${player.position || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Player Stats Row -->
      <div class="player-stats-row">
        <div class="stat-item">
          <div class="stat-label">PAC</div>
          <div class="stat-value">${player.pace || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">SHO</div>
          <div class="stat-value">${player.shooting || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">PAS</div>
          <div class="stat-value">${player.passing || 'N/A'}</div>
        </div>
      </div>

      <div class="player-stats-row">
        <div class="stat-item">
          <div class="stat-label">DRI</div>
          <div class="stat-value">${player.dribbling || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">DEF</div>
          <div class="stat-value">${player.defending || 'N/A'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">PHY</div>
          <div class="stat-value">${player.physical || 'N/A'}</div>
        </div>
      </div>

      <!-- Player Details Row -->
      <div class="player-details-row">
        <div class="player-club-nation">
          ${player.nation_flag_url ? 
            `<img src="${player.nation_flag_url}" alt="${player.nation}" class="nation-flag" title="${player.nation}">` :
            `<span class="player-league" title="${player.nation || 'Unknown'}">${(player.nation || 'N/A').substring(0, 3)}</span>`
          }
          ${player.club_logo_url ? 
            `<img src="${player.club_logo_url}" alt="${player.club}" class="club-logo" title="${player.club}">` :
            ''
          }
          <span class="player-league">${player.league || 'Unknown'}</span>
        </div>
        <div class="player-price">${formatPrice(player.price)}</div>
      </div>
    </div>
  `;
}

// Setup event listeners for search and sort
function setupWatchlistEvents() {
  // Search input
  const searchInput = document.querySelector('.watchlist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
  }

  // Sort select
  const sortSelect = document.querySelector('.watchlist-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleWatchlistSort);
  }
}

// Handle search
function handleWatchlistSearch(event) {
  const query = event.target.value.toLowerCase().trim();
  
  if (query === '') {
    filteredWatchlist = [...watchlistData];
  } else {
    filteredWatchlist = watchlistData.filter(player => {
      const name = (player.name || '').toLowerCase();
      const club = (player.club || '').toLowerCase();
      const league = (player.league || '').toLowerCase();
      const nation = (player.nation || '').toLowerCase();
      const position = (player.position || '').toLowerCase();
      
      return name.includes(query) || 
             club.includes(query) || 
             league.includes(query) || 
             nation.includes(query) ||
             position.includes(query);
    });
  }
  
  renderWatchlist();
}

// Handle sort
function handleWatchlistSort(event) {
  const sortValue = event.target.value;
  
  filteredWatchlist.sort((a, b) => {
    switch (sortValue) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      
      case 'rating-desc':
        return (b.overall_rating || 0) - (a.overall_rating || 0);
      
      case 'rating-asc':
        return (a.overall_rating || 0) - (b.overall_rating || 0);
      
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      
      default:
        return 0;
    }
  });
  
  renderWatchlist();
}

// Remove from watchlist with confirmation
function removeFromWatchlistConfirm(playerId, playerName) {
  if (confirm(`Remove ${playerName} from your watchlist?`)) {
    removePlayerFromWatchlist(playerId);
  }
}

// Remove player from watchlist
function removePlayerFromWatchlist(playerId) {
  try {
    // Remove from localStorage
    let watchlistIds = JSON.parse(localStorage.getItem('watchlist') || '[]');
    watchlistIds = watchlistIds.filter(id => id !== playerId);
    localStorage.setItem('watchlist', JSON.stringify(watchlistIds));
    
    // Update data arrays
    watchlistData = watchlistData.filter(p => p.id !== playerId);
    filteredWatchlist = filteredWatchlist.filter(p => p.id !== playerId);
    
    // Re-render
    renderWatchlist();
    
    // Show success message
    showToast('Player removed from watchlist', 'success');
    
    // Update watchlist button in other views if player is visible
    updateWatchlistButton(playerId, false);
    
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    showToast('Failed to remove from watchlist', 'error');
  }
}

// Update watchlist count badge
function updateWatchlistCountBadge(count) {
  const countBadge = document.querySelector('.watchlist-count-badge');
  if (countBadge) {
    countBadge.textContent = `${count} Player${count !== 1 ? 's' : ''}`;
  }
}

// Show empty state
function showEmptyState() {
  const emptyState = document.querySelector('.watchlist-empty');
  if (emptyState) {
    emptyState.style.display = 'flex';
  }
}

// Hide empty state
function hideEmptyState() {
  const emptyState = document.querySelector('.watchlist-empty');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

// Utility: Get player initials
function getPlayerInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Utility: Format price
function formatPrice(price) {
  if (!price || price === 0) return 'N/A';
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(2)}M`;
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}K`;
  }
  return price.toString();
}

// Utility: Debounce
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

// Utility: Show toast notification
function showToast(message, type = 'info') {
  // Check if global showToast exists
  if (window.showToast && typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    // Fallback to alert
    alert(message);
  }
}

// Utility: Update watchlist button in other views
function updateWatchlistButton(playerId, isInWatchlist) {
  // Update any visible watchlist buttons
  const buttons = document.querySelectorAll(`[data-player-id="${playerId}"] .watchlist-btn`);
  buttons.forEach(btn => {
    if (isInWatchlist) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for view switch');
  });
} else {
  console.log('DOM already loaded');
}

// Hook into view switching
const originalSwitchView = window.switchView;
if (originalSwitchView && typeof originalSwitchView === 'function') {
  window.switchView = function(viewName) {
    console.log('Switching to view:', viewName);
    originalSwitchView(viewName);
    
    if (viewName === 'watchlist') {
      setTimeout(() => {
        initProfessionalWatchlist();
      }, 100);
    }
  };
}

// Export functions for global use
window.initProfessionalWatchlist = initProfessionalWatchlist;
window.loadWatchlistData = loadWatchlistData;
window.removePlayerFromWatchlist = removePlayerFromWatchlist;
window.removeFromWatchlistConfirm = removeFromWatchlistConfirm;

console.log('Watchlist Professional JS loaded');
