// ==========================================
// WATCHLIST PROFESSIONAL - COMPLETE & DEBUGGED
// ==========================================

// Add after the existing variables
let watchlistFilters = {
    position: '',
    league: '',
    team: '',
    nation: '',
    event: '',
    minOvr: 40,
    maxOvr: 150
};


console.log('🔥 WATCHLIST JS LOADED - v3.1 FINAL - ' + new Date().toISOString());

let watchlistData = [];
let filteredWatchlist = [];


function populateWatchlistFilters() {
    console.log('[WATCHLIST] Populating filters from', watchlistData.length, 'players');
    
    // Get unique values from watchlist players
    const positions = [...new Set(watchlistData.map(p => p.position).filter(Boolean))].sort();
    const leagues = [...new Set(watchlistData.map(p => p.league).filter(Boolean))].sort();
    const teams = [...new Set(watchlistData.map(p => p.team).filter(Boolean))].sort();
    const nations = [...new Set(watchlistData.map(p => p.nation).filter(Boolean))].sort();
    const events = [...new Set(watchlistData.map(p => p.event).filter(Boolean))].sort();
    
    // Populate Position dropdown
    const positionSelect = document.getElementById('watchlist-filter-position');
    if (positionSelect) {
        positionSelect.innerHTML = '<option value="">All Positions</option>' + 
            positions.map(pos => `<option value="${pos}">${pos}</option>`).join('');
    }
    
    // Populate League dropdown
    const leagueSelect = document.getElementById('watchlist-filter-league');
    if (leagueSelect) {
        leagueSelect.innerHTML = '<option value="">All Leagues</option>' + 
            leagues.map(league => `<option value="${league}">${league}</option>`).join('');
    }
    
    // Populate Team dropdown
    const teamSelect = document.getElementById('watchlist-filter-team');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="">All Teams</option>' + 
            teams.map(team => `<option value="${team}">${team}</option>`).join('');
    }
    
    // Populate Nation dropdown
    const nationSelect = document.getElementById('watchlist-filter-nation');
    if (nationSelect) {
        nationSelect.innerHTML = '<option value="">All Nations</option>' + 
            nations.map(nation => `<option value="${nation}">${nation}</option>`).join('');
    }
    
    // Populate Event dropdown
    const eventSelect = document.getElementById('watchlist-filter-event');
    if (eventSelect) {
        eventSelect.innerHTML = '<option value="">All Events</option>' + 
            events.map(event => `<option value="${event}">${event}</option>`).join('');
    }
    
    console.log('[WATCHLIST] Filters populated:', {
        positions: positions.length,
        leagues: leagues.length,
        teams: teams.length,
        nations: nations.length,
        events: events.length
    });
}
function applyWatchlistFilters() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [APPLY FILTERS] Starting filter application');
    console.log('📊 [APPLY FILTERS] Total players:', watchlistData.length);
    console.log('🔍 [APPLY FILTERS] Current filters:', watchlistFilters);
    console.log('[WATCHLIST] Applying filters:', watchlistFilters);
    
    // Start with all watchlist data
    filteredWatchlist = watchlistData.filter(player => {
        // Position filter
        if (watchlistFilters.position && player.position !== watchlistFilters.position) {
            return false;
        }
        
        // League filter
        if (watchlistFilters.league && player.league !== watchlistFilters.league) {
            return false;
        }
        
        // Team filter
        if (watchlistFilters.team && player.team !== watchlistFilters.team) {
            return false;
        }
        
        // Nation filter
        if (watchlistFilters.nation && player.nation !== watchlistFilters.nation) {
            return false;
        }
        
        // Event filter
        if (watchlistFilters.event && player.event !== watchlistFilters.event) {
            return false;
        }
        
        // OVR range filter
        const ovr = player.overallrating || 0;
        if (ovr < watchlistFilters.minOvr || ovr > watchlistFilters.maxOvr) {
            return false;
        }
        
        return true;
    });
    
    console.log('[WATCHLIST] Filtered results:', filteredWatchlist.length, 'of', watchlistData.length);
    console.log('✅ [APPLY FILTERS] Filtered results:', filteredWatchlist.length, 'of', watchlistData.length);
    console.log('📋 [APPLY FILTERS] Sample filtered player:', filteredWatchlist[0]);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // Re-render with filtered results
    renderWatchlist();
    
    // Update active filter chips
    updateActiveFilterChips();
}
function setupWatchlistFilterListeners() {
    // Position filter
    // Position filter
    const positionSelect = document.getElementById('watchlist-filter-position');
    console.log('🔧 [DEBUG] Position select element:', positionSelect);
    if (positionSelect) {
        console.log('✅ [DEBUG] Position select found! Adding listener...');
        positionSelect.addEventListener('change', (e) => {
            console.log('🎯 [DEBUG] Position changed to:', e.target.value);
            watchlistFilters.position = e.target.value;
            console.log('🔧 [DEBUG] Current filters:', watchlistFilters);
            applyWatchlistFilters();
        });
    } else {
        console.error('❌ [DEBUG] Position select NOT FOUND in DOM!');
    }

    
    // League filter
    const leagueSelect = document.getElementById('watchlist-filter-league');
    if (leagueSelect) {
        leagueSelect.addEventListener('change', (e) => {
            watchlistFilters.league = e.target.value;
            applyWatchlistFilters();
        });
    }
    
    // Team filter
    const teamSelect = document.getElementById('watchlist-filter-team');
    if (teamSelect) {
        teamSelect.addEventListener('change', (e) => {
            watchlistFilters.team = e.target.value;
            applyWatchlistFilters();
        });
    }
    
    // Nation filter
    const nationSelect = document.getElementById('watchlist-filter-nation');
    if (nationSelect) {
        nationSelect.addEventListener('change', (e) => {
            watchlistFilters.nation = e.target.value;
            applyWatchlistFilters();
        });
    }
    
    // Event filter
    const eventSelect = document.getElementById('watchlist-filter-event');
    if (eventSelect) {
        eventSelect.addEventListener('change', (e) => {
            watchlistFilters.event = e.target.value;
            applyWatchlistFilters();
        });
    }
    
    // OVR Min
    const minInput = document.getElementById('watchlist-rating-min');
    if (minInput) {
        minInput.addEventListener('change', (e) => {
            watchlistFilters.minOvr = parseInt(e.target.value) || 40;
            applyWatchlistFilters();
        });
    }
    
    // OVR Max
    const maxInput = document.getElementById('watchlist-rating-max');
    if (maxInput) {
        maxInput.addEventListener('change', (e) => {
            watchlistFilters.maxOvr = parseInt(e.target.value) || 150;
            applyWatchlistFilters();
        });
    }
    
    // Clear All button
    const clearBtn = document.getElementById('clear-watchlist-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearWatchlistFilters);
    }
    
    // Search input
    const searchInput = document.getElementById('watchlist-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleWatchlistSearch);
    }
    
    // Sort select
    const sortSelect = document.getElementById('watchlist-sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleWatchlistSort);
    }
}
function clearWatchlistFilters() {
    console.log('[WATCHLIST] Clearing all filters');
    
    // Reset filter state
    watchlistFilters = {
        position: '',
        league: '',
        team: '',
        nation: '',
        event: '',
        minOvr: 40,
        maxOvr: 150
    };
    
    // Reset UI
    document.getElementById('watchlist-filter-position').value = '';
    document.getElementById('watchlist-filter-league').value = '';
    document.getElementById('watchlist-filter-team').value = '';
    document.getElementById('watchlist-filter-nation').value = '';
    document.getElementById('watchlist-filter-event').value = '';
    document.getElementById('watchlist-rating-min').value = 40;
    document.getElementById('watchlist-rating-max').value = 150;
    
    // Apply (shows all)
    applyWatchlistFilters();
}
function updateActiveFilterChips() {
    const container = document.getElementById('watchlist-active-filters');
    if (!container) return;
    
    const chips = [];
    
    if (watchlistFilters.position) {
        chips.push(`<div class="filter-chip">Position: ${watchlistFilters.position} <button onclick="removeFilter('position')">×</button></div>`);
    }
    if (watchlistFilters.league) {
        chips.push(`<div class="filter-chip">League: ${watchlistFilters.league} <button onclick="removeFilter('league')">×</button></div>`);
    }
    if (watchlistFilters.team) {
        chips.push(`<div class="filter-chip">Team: ${watchlistFilters.team} <button onclick="removeFilter('team')">×</button></div>`);
    }
    if (watchlistFilters.nation) {
        chips.push(`<div class="filter-chip">Nation: ${watchlistFilters.nation} <button onclick="removeFilter('nation')">×</button></div>`);
    }
    if (watchlistFilters.event) {
        chips.push(`<div class="filter-chip">Event: ${watchlistFilters.event} <button onclick="removeFilter('event')">×</button></div>`);
    }
    if (watchlistFilters.minOvr > 40 || watchlistFilters.maxOvr < 150) {
        chips.push(`<div class="filter-chip">OVR: ${watchlistFilters.minOvr}-${watchlistFilters.maxOvr} <button onclick="removeFilter('ovr')">×</button></div>`);
    }
    
    container.innerHTML = chips.join('');
}

function removeFilter(filterName) {
    if (filterName === 'position') {
        watchlistFilters.position = '';
        document.getElementById('watchlist-filter-position').value = '';
    } else if (filterName === 'league') {
        watchlistFilters.league = '';
        document.getElementById('watchlist-filter-league').value = '';
    } else if (filterName === 'team') {
        watchlistFilters.team = '';
        document.getElementById('watchlist-filter-team').value = '';
    } else if (filterName === 'nation') {
        watchlistFilters.nation = '';
        document.getElementById('watchlist-filter-nation').value = '';
    } else if (filterName === 'event') {
        watchlistFilters.event = '';
        document.getElementById('watchlist-filter-event').value = '';
    } else if (filterName === 'ovr') {
        watchlistFilters.minOvr = 40;
        watchlistFilters.maxOvr = 150;
        document.getElementById('watchlist-rating-min').value = 40;
        document.getElementById('watchlist-rating-max').value = 150;
    }
    
    applyWatchlistFilters();
}

// Initialize watchlist when view is shown
function initProfessionalWatchlist() {
  console.log('🚀 [WATCHLIST] Initializing Professional Watchlist');
  
  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) {
    console.error('❌ [WATCHLIST] Watchlist view not found');
    return;
  }
  
  // Load watchlist data
  loadWatchlistData();
  
  // ✅ NEW: Populate filter dropdowns
  console.log('🔧 [DEBUG] About to populate filters...');
  populateWatchlistFilters();
  
  // ✅ NEW: Setup filter listeners
  console.log('🔧 [DEBUG] About to setup filter listeners...');
  setupWatchlistFilterListeners();
  
  
  // Setup event listeners (existing)
  setupWatchlistEvents();
  
  console.log('✅ [DEBUG] initProfessionalWatchlist() completed');
}



// Load watchlist data from localStorage
function loadWatchlistData() {
  console.log('🔍 [WATCHLIST] Loading data from localStorage');

  try {
    const raw = localStorage.getItem('watchlistPlayers');
    console.log('📦 [WATCHLIST] Raw localStorage data:', raw);

    if (raw) {
      const parsed = JSON.parse(raw);
      console.log('📊 [WATCHLIST] Parsed player count:', parsed.length);

      if (parsed.length > 0) {
        console.log('🎯 [WATCHLIST] First player sample:', parsed[0]);
        console.log('🔑 [WATCHLIST] First player keys:', Object.keys(parsed[0]));
      }

      // Map the data to match expected field names
      watchlistData = parsed.map(player => ({
        // Use multiple possible field names
        id: player.playerid || player.player_id || player.id,
        name: player.name || 'Unknown',
        position: player.position || 'NA',
        team: player.team || player.club || 'NA',
        league: player.league || 'NA',
        nation: player.nation || player.nationality || 'NA',
        overallrating: player.ovr || player.overallrating || player.rating || 0,

        // Stats
        pace: player.pace || 0,
        shooting: player.shooting || 0,
        passing: player.passing || 0,
        dribbling: player.dribbling || 0,
        defending: player.defending || 0,
        physical: player.physical || 0,

        // Images
        imageurl: player.player_image || player.imageurl || player.image_url || '',
        nationflagurl: player.nation_flag || player.nationflagurl || '',
        clublogourl: player.club_flag || player.clublogourl || '',

        // Price
        price: player.price || 0,

        // Keep original data
        ...player
      }));

      filteredWatchlist = [...watchlistData];
      console.log('✅ [WATCHLIST] Loaded', watchlistData.length, 'players');
    } else {
      watchlistData = [];
      filteredWatchlist = [];
      console.log('📭 [WATCHLIST] No saved players found in localStorage');
    }

    console.log('🔧 [DEBUG] Data loaded, populating filters...');
    populateWatchlistFilters();

    // ✅ NEW: Setup listeners
    console.log('🔧 [DEBUG] Setting up filter listeners...');
    setupWatchlistFilterListeners();
    console.log('✅ [DEBUG] loadWatchlistData() completed');

    // Render after loading
    renderWatchlist();
  } catch (error) {
    console.error('❌ [WATCHLIST] Error loading data:', error);
    watchlistData = [];
    filteredWatchlist = [];
    renderWatchlist();
  }
}

// Render the complete watchlist
function renderWatchlist() {
  console.log('🎨 [WATCHLIST] === RENDER START ===');

  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) {
    console.error('❌ [WATCHLIST] Watchlist view not found');
    return;
  }

  const count = filteredWatchlist.length;
  console.log('📊 [WATCHLIST] Player count:', count);

  // Update count badge
  updateWatchlistCountBadge(count);

  // Render grid - look for multiple possible container classes
  const gridContainer = watchlistView.querySelector('.watchlist-grid') || 
                       watchlistView.querySelector('.players-grid') || 
                       watchlistView.querySelector('#watchlist-players-grid');

  console.log('🎯 [WATCHLIST] Grid container found:', !!gridContainer);
  console.log('🏷️ [WATCHLIST] Grid container class:', gridContainer?.className);

  if (!gridContainer) {
    console.error('❌ [WATCHLIST] Grid container not found');
    return;
  }

  if (count === 0) {
    console.log('📭 [WATCHLIST] No players, showing empty state');
    showEmptyState();
    gridContainer.innerHTML = '';
  } else {
    console.log('✨ [WATCHLIST] Rendering', count, 'players');
    hideEmptyState();

    // Create all cards as HTML strings
    const allCardsHTML = filteredWatchlist.map((player, index) => {
      console.log(`🃏 [WATCHLIST] Creating card ${index + 1}/${count} for ${player.name}`);
      return createPlayerCardHTML(player);
    }).join('');

    console.log('📝 [WATCHLIST] Total HTML length:', allCardsHTML.length);
    console.log('🔍 [WATCHLIST] First 100 chars:', allCardsHTML.substring(0, 100));

    // Set innerHTML once
    gridContainer.innerHTML = allCardsHTML;

    // ✅ ATTACH EVENT LISTENERS AFTER RENDER
    attachWatchlistEventListeners();

    console.log('✅ [WATCHLIST] Cards rendered successfully');
  }

  console.log('🎨 [WATCHLIST] === RENDER END ===');
}

// Create player row HTML - EXACT MATCH TO DATABASE VIEW
function createPlayerCardHTML(player) {
  const initials = getPlayerInitials(player.name || 'Unknown');
  const hasImage = player.imageurl && player.imageurl !== '';
  
  // Process alternate positions
  const alternatePosition = player.alternate_position || player.alternateposition || '';
  const altPositionsArray = alternatePosition ? alternatePosition.split(',').map(p => p.trim()) : [];
  const hasAltPositions = altPositionsArray.filter(pos => pos && pos !== '0' && pos !== 0).length > 0;

  return `
      <div class="player-row" data-player-id="${player.id}">
        <!-- Player Card Left Section -->
        <div class="player-row-card">
          <div class="player-card-badge">
          </div>
          <div class="player-card-image-placeholder">


            <!-- Card Background (Fixed) -->
            ${player.card_background ? `
                <img src="${player.card_background}" 
                    alt="Card Background" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                    onerror="this.style.display='none'">
            ` : ''}



            ${player.player_image ? `
                <img src="${player.player_image}" 
                    alt="${player.name}"
                    style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 130%; height: 130%; object-fit: contain;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <span class="player-initials" style="display:none">${getInitials(player.name)}</span>
            ` : `
                <span class="player-initials">${getInitials(player.name)}</span>
            `}



            <div style="
                position: absolute;
                top: 75px;
                left: 50%;
                transform: translateX(-50%) scaleY(1);
                text-align: center;
                padding: 2px 5px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 800;
                font-family: 'CruyffSans', sans-serif;
                color: ${player.color_name || '#FFFFFF'};
                z-index: 10;
                letter-spacing: -0.8px;
                line-height: 1;
                text-transform: uppercase;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            ">
                ${player.name}
            </div>



            <!-- OVR (Small, top-left) -->
            <div style="
                position: absolute;
                top: 10px;
                left: 8px;
                padding: 2px 5px;
                border-radius: 4px;
                font-size: 16px;
                font-weight: 700;
                font-family: 'CruyffSans', sans-serif;
                color: ${player.color_rating || '#FFB86B'};
                z-index: 10;
                letter-spacing: -1px;
                line-height: 1.1;
                transform: scaleY(1);
            ">
                ${player.ovr && player.ovr > 0 ? player.ovr : '?'}
            </div>

                        
            <!-- Position (Tiny, top-right) -->
            <div style="
                position: absolute;
                top: 28px;
                left: 15px;
                padding: 1px 4px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 800;
                font-family: 'CruyffSans', sans-serif;
                color: ${player.color_position || '#FFFFFF'};
                z-index: 10;
                letter-spacing: -0.8px;
                line-height: 1.1;
                transform: scaleY(1);
            ">
                ${player.position || '?'}
            </div>

                        
            <!-- Nation (Tiny flag, bottom-left) -->
                  ${player.nation_flag ? `
                            <img src="${player.nation_flag}" 
                                alt="Nation" 
                                style="position: absolute; bottom: 19px; left: 24px; width: 12px; height: 9px; object-fit: cover; border-radius: 1px; z-index: 10;"
                                onerror="this.style.display='none'">
            ` : ''}
                        
            <!-- Club (Tiny badge, bottom-right) -->
                ${player.club_flag ? `
                  <img src="${player.club_flag}" 
                    alt="Club" 
                    style="position: absolute; bottom: 16px; left: 52px; width: 15px; height: 12px; object-fit: contain; border-radius: 2px; z-index: 10;"
                    onerror="this.style.display='none'">
          ` : ''}


          </div>
        </div>

        

      <!-- Player Info Middle Section -->
      <div class="player-row-info">
        <div class="player-info-name">${player.name || 'Unknown'}</div>
        <div class="player-info-meta">${player.team || 'NA'} • ${player.league || 'NA'}</div>
        ${hasAltPositions 
          ? `<div class="player-info-secondary">
              ${altPositionsArray.filter(pos => pos && pos !== '0' && pos !== 0).map(pos => `<span class="secondary-position-badge">${pos}</span>`).join('')}
            </div>`
          : ''
        }
      </div>

      <!-- Stats Grid Right Section -->
      <div class="player-row-stats">
        <div class="stat-pill">
          <div class="stat-pill-value">${player.pace || 0}</div>
          <div class="stat-pill-label">PAC</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${player.shooting || 0}</div>
          <div class="stat-pill-label">SHO</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${player.passing || 0}</div>
          <div class="stat-pill-label">PAS</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${player.dribbling || 0}</div>
          <div class="stat-pill-label">DRI</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${player.defending || 0}</div>
          <div class="stat-pill-label">DEF</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${player.physical || 0}</div>
          <div class="stat-pill-label">PHY</div>
        </div>
      </div>

      <!-- Watchlist Button -->
      <button class="player-row-watchlist active" data-player-id="${player.id}" title="Remove from watchlist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
  `;
}



// ✅ ATTACH EVENT LISTENERS TO ALL WATCHLIST BUTTONS
function attachWatchlistEventListeners() {
  console.log('[WATCHLIST] Attaching event listeners to player rows and buttons');
  
  // ========== PLAYER ROW CLICK (Open Detail) ==========
  const playerRows = document.querySelectorAll('#watchlist-view .player-row');
  console.log('[WATCHLIST] Found', playerRows.length, 'player rows');
  
  playerRows.forEach((row, index) => {
    const playerId = row.dataset.playerId;
    console.log('[WATCHLIST] Attaching row click listener', index + 1, 'for player ID', playerId);
    
    row.addEventListener('click', function(e) {
      // Don't trigger if clicking the heart button
      if (e.target.closest('.player-row-watchlist')) {
        return;
      }
      
      console.log('[WATCHLIST] Row clicked! Opening player detail for ID', playerId);
      
      // Call viewPlayerDetail function (same as database view)
      if (typeof viewPlayerDetail === 'function') {
        viewPlayerDetail(playerId);
      } else {
        console.error('[WATCHLIST] viewPlayerDetail function not found!');
      }
    });
    
    // Add cursor pointer to show it's clickable
    row.style.cursor = 'pointer';
  });
  
  // ========== HEART BUTTON CLICK (Remove from Watchlist) ==========
  const buttons = document.querySelectorAll('#watchlist-view .player-row-watchlist');
  console.log('[WATCHLIST] Found', buttons.length, 'watchlist buttons');
  
  buttons.forEach((btn, index) => {
    const playerId = btn.dataset.playerId;
    console.log('[WATCHLIST] Attaching button listener', index + 1, 'for player ID', playerId);
    
    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent row click
      e.preventDefault();
      console.log('[WATCHLIST] Heart clicked! Removing player', playerId);
      removePlayerFromWatchlist(playerId);
    });
  });
  
  console.log('[WATCHLIST] All event listeners attached successfully');
}


// Setup event listeners for search and sort
function setupWatchlistEvents() {
  console.log('🔧 [WATCHLIST] Setting up event listeners');

  // Search input - desktop
  const searchInput = document.querySelector('#watchlist-player-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
    console.log('✅ [WATCHLIST] Desktop search listener attached');
  }

  // Search input - mobile
  const mobileSearchInput = document.querySelector('.mobile-search-input');
  if (mobileSearchInput && mobileSearchInput.closest('#watchlist-view')) {
    mobileSearchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
    console.log('✅ [WATCHLIST] Mobile search listener attached');
  }

  // Sort select
  const sortSelect = document.querySelector('#watchlist-sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleWatchlistSort);
    console.log('✅ [WATCHLIST] Sort listener attached');
  }

  // Clear filters button
  const clearBtn = document.querySelector('#watchlist-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearWatchlistFilters);
    console.log('✅ [WATCHLIST] Clear filters listener attached');
  }
}

// Handle search
function handleWatchlistSearch(event) {
  const query = (event.target ? event.target.value : event).toLowerCase().trim();
  console.log('🔍 [WATCHLIST] Search query:', query);

  if (!query) {
    filteredWatchlist = [...watchlistData];
  } else {
    filteredWatchlist = watchlistData.filter(player => {
      const name = (player.name || '').toLowerCase();
      const club = (player.team || '').toLowerCase();
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

  console.log('📊 [WATCHLIST] Filtered results:', filteredWatchlist.length);
  renderWatchlist();
}

// Handle sort
function handleWatchlistSort(event) {
  const sortValue = event.target.value;
  console.log('🔄 [WATCHLIST] Sorting by:', sortValue);

  filteredWatchlist.sort((a, b) => {
    switch(sortValue) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'rating-desc':
        return (b.overallrating || 0) - (a.overallrating || 0);
      case 'rating-asc':
        return (a.overallrating || 0) - (b.overallrating || 0);
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

// Clear filters
function clearWatchlistFilters() {
  console.log('🧹 [WATCHLIST] Clearing filters');

  // Reset filtered data
  filteredWatchlist = [...watchlistData];

  // Clear search inputs
  const searchInputs = document.querySelectorAll('#watchlist-player-search, .mobile-search-input');
  searchInputs.forEach(input => {
    if (input && input.closest('#watchlist-view')) {
      input.value = '';
    }
  });

  // Reset sort
  const sortSelect = document.querySelector('#watchlist-sort-by');
  if (sortSelect) {
    sortSelect.value = 'name-asc';
  }

  renderWatchlist();
}

// Remove player from watchlist
function removePlayerFromWatchlist(playerId) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ [REMOVE] Starting removal for player ID:', playerId);
    
    // Remove from localStorage
    let watchlistIds = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let savedPlayers = JSON.parse(localStorage.getItem('watchlistPlayers') || '[]');
    
    console.log('📦 [REMOVE] watchlistIds BEFORE:', watchlistIds);
    
    // ✅ FIX: Filter by checking if ID starts with playerId (handles _0_1 format)
    watchlistIds = watchlistIds.filter(id => {
      const idStr = String(id);
      const playerIdStr = String(playerId);
      // Check if id starts with playerId (e.g., "30907110" matches "30907110_0_1")
      return !idStr.startsWith(playerIdStr + '_') && idStr !== playerIdStr;
    });
    
    savedPlayers = savedPlayers.filter(p => {
      const pId = String(p.playerid || p.player_id || p.id);
      const playerIdStr = String(playerId);
      return pId !== playerIdStr;
    });
    
    console.log('📦 [REMOVE] watchlistIds AFTER:', watchlistIds);
    
    localStorage.setItem('watchlist', JSON.stringify(watchlistIds));
    localStorage.setItem('watchlistPlayers', JSON.stringify(savedPlayers));
    console.log('💾 [REMOVE] Saved to localStorage');
    
    // ✅ FIX: Update window.state.watchlist (now it should exist)
    if (window.state && window.state.watchlist) {
      console.log('📋 [REMOVE] window.state.watchlist BEFORE:', window.state.watchlist);
      
      // Filter using same logic
      window.state.watchlist = window.state.watchlist.filter(id => {
        const idStr = String(id);
        const playerIdStr = String(playerId);
        return !idStr.startsWith(playerIdStr + '_') && idStr !== playerIdStr;
      });
      
      console.log('📋 [REMOVE] window.state.watchlist AFTER:', window.state.watchlist);
    } else {
      console.warn('⚠️ [REMOVE] window.state.watchlist does not exist, creating it...');
      // Create it if it doesn't exist
      if (!window.state) window.state = {};
      window.state.watchlist = watchlistIds;
    }
    
    // ✅ UPDATE: Call global function to update database view hearts
    if (typeof updateAllWatchlistButtons === 'function') {
      console.log('🔄 [REMOVE] Calling updateAllWatchlistButtons...');
      updateAllWatchlistButtons();
      console.log('✅ [REMOVE] Database view hearts updated');
    }
    
    // Reload watchlist view
    loadWatchlistData();
    
    // Update specific button
    updateWatchlistButton(playerId, false);
    
    showToast('Player removed from watchlist', 'success');
    console.log('✅ [REMOVE] Removal complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ [REMOVE] Error:', error);
    showToast('Failed to remove from watchlist', 'error');
  }
}




// Update watchlist count badge
function updateWatchlistCountBadge(count) {
  // Update results info text
  const resultsInfo = document.querySelector('#watchlist-results-count');
  if (resultsInfo) {
    resultsInfo.textContent = `${count} player${count !== 1 ? 's' : ''} in watchlist`;
  }

  // Update badge in header if it exists
  const countBadge = document.querySelector('.watchlist-count-badge');
  if (countBadge) {
    countBadge.textContent = `${count} Player${count !== 1 ? 's' : ''}`;
  }
}

// Show empty state
function showEmptyState() {
  const emptyState = document.querySelector('.watchlist-empty-state') || 
                    document.querySelector('.watchlist-empty') || 
                    document.querySelector('#watchlist-empty-state');
  if (emptyState) {
    emptyState.style.display = 'flex';
  }
}

// Hide empty state
function hideEmptyState() {
  const emptyState = document.querySelector('.watchlist-empty-state') || 
                    document.querySelector('.watchlist-empty') || 
                    document.querySelector('#watchlist-empty-state');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

// Update watchlist button state in database view
function updateWatchlistButton(playerId, isInWatchlist) {
  const button = document.querySelector(`[data-player-id="${playerId}"] .btn-icon`);
  if (button) {
    if (isInWatchlist) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Get player initials
function getPlayerInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Format price
function formatPrice(price) {
  if (!price || price === 0) return 'NA';

  if (price >= 1000000000) {
    return (price / 1000000000).toFixed(2) + 'B';
  } else if (price >= 1000000) {
    return (price / 1000000).toFixed(2) + 'M';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'K';
  }
  return price.toString();
}

// Debounce function
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

// Show toast notification
function showToast(message, type = 'info') {
  console.log(`🍞 [TOAST] ${type.toUpperCase()}:`, message);

  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#00C2A8' : type === 'error' ? '#ef4444' : '#6366f1'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 [WATCHLIST] DOM loaded, waiting for view switch');
  });
} else {
  console.log('📄 [WATCHLIST] DOM already loaded');
}

// Hook into view switching
const originalSwitchView = window.switchView;
if (originalSwitchView && typeof originalSwitchView === 'function') {
  window.switchView = function(viewName) {
    console.log('🔄 [WATCHLIST] Switching to view:', viewName);
    originalSwitchView(viewName);

    if (viewName === 'watchlist') {
      setTimeout(() => {
        initProfessionalWatchlist();
      }, 100);
    }
  };
}

// ==========================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ==========================================

window.initProfessionalWatchlist = initProfessionalWatchlist;
window.loadWatchlistData = loadWatchlistData;
window.removePlayerFromWatchlist = removePlayerFromWatchlist;

console.log("✅ WATCHLIST: Watchlist Professional JS loaded successfully - v3.1");