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
  skill_moves: '',
  minOvr: 40,
  maxOvr: 150,
  searchQuery: '' // Track search query
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

    // Populate Desktop Position dropdown
    const positionSelect = document.getElementById('watchlist-filter-position');
    if (positionSelect) {
        positionSelect.innerHTML = '<option value="">All Positions</option>' +
            positions.map(pos => `<option value="${pos}">${pos}</option>`).join('');
    }

    // Populate Desktop League dropdown
    const leagueSelect = document.getElementById('watchlist-filter-league');
    if (leagueSelect) {
        leagueSelect.innerHTML = '<option value="">All Leagues</option>' +
            leagues.map(league => `<option value="${league}">${league}</option>`).join('');
    }

    // Populate Desktop Team dropdown
    const teamSelect = document.getElementById('watchlist-filter-team');
    if (teamSelect) {
        teamSelect.innerHTML = '<option value="">All Clubs</option>' +
            teams.map(team => `<option value="${team}">${team}</option>`).join('');
    }

    // Populate Desktop Nation dropdown
    const nationSelect = document.getElementById('watchlist-filter-nation');
    if (nationSelect) {
        nationSelect.innerHTML = '<option value="">All Nations</option>' +
            nations.map(nation => `<option value="${nation}">${nation}</option>`).join('');
    }

    // Populate Desktop Event dropdown
    const eventSelect = document.getElementById('watchlist-filter-event');
    if (eventSelect) {
        eventSelect.innerHTML = '<option value="">All Events</option>' +
            events.map(event => `<option value="${event}">${event}</option>`).join('');
    }

    // ✅ FIX: Populate Mobile Position dropdown
    const mobilePositionSelect = document.getElementById('mobile-filter-position');
    if (mobilePositionSelect) {
        mobilePositionSelect.innerHTML = '<option value="">All Positions</option>' +
            positions.map(pos => `<option value="${pos}">${pos}</option>`).join('');
    }

    // ✅ FIX: Populate Mobile League dropdown
    const mobileLeagueSelect = document.getElementById('mobile-filter-league');
    if (mobileLeagueSelect) {
        mobileLeagueSelect.innerHTML = '<option value="">All Leagues</option>' +
            leagues.map(league => `<option value="${league}">${league}</option>`).join('');
    }

    // ✅ FIX: Populate Mobile Team dropdown
    const mobileTeamSelect = document.getElementById('mobile-filter-team');
    if (mobileTeamSelect) {
        mobileTeamSelect.innerHTML = '<option value="">All Clubs</option>' +
            teams.map(team => `<option value="${team}">${team}</option>`).join('');
    }

    // ✅ FIX: Populate Mobile Nation dropdown (note: this is an input, not select)
    // Since mobile nation is an autocomplete input, we'll handle it differently
    // We'll set a data attribute so the autocomplete knows which nations to show
    const mobileNationInput = document.getElementById('mobile-filter-nation');
    if (mobileNationInput) {
        mobileNationInput.setAttribute('data-watchlist-nations', JSON.stringify(nations));
    }

    // ✅ FIX: Populate Mobile Event dropdown
    const mobileEventSelect = document.getElementById('mobile-filter-event');
    if (mobileEventSelect) {
        mobileEventSelect.innerHTML = '<option value="">All Events</option>' +
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
// ==================== SETUP CLEAR ALL BUTTON (WITH DEBUG) ====================
function setupClearAllButton() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [DEBUG] setupClearAllButton() called');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // ✅ FIX: Correct ID selector
  const clearBtn = document.querySelector('#clear-watchlist-filters'); // Changed from #watchlist-clear-filters
  
  if (!clearBtn) {
    console.error('❌ [DEBUG] Clear button NOT FOUND (#clear-watchlist-filters)');
    
    // Debug: show all available buttons
    const allButtons = document.querySelectorAll('#watchlist-view button');
    console.log(`🔍 [DEBUG] Available buttons: ${allButtons.length}`);
    allButtons.forEach((btn, i) => {
      console.log(`   Button ${i + 1}:`, {
        id: btn.id,
        className: btn.className,
        text: btn.textContent?.trim().substring(0, 50)
      });
    });
    return;
  }
  
  console.log('✅ [DEBUG] Clear button found!', clearBtn);
  
  // Remove any existing listeners by cloning
  const newBtn = clearBtn.cloneNode(true);
  clearBtn.parentNode.replaceChild(newBtn, clearBtn);
  console.log('🔄 [DEBUG] Cloned button to remove old listeners');
  
  // Add new listener
  newBtn.addEventListener('click', function(e) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [DEBUG] CLEAR BUTTON CLICKED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📞 [DEBUG] Calling clearWatchlistFilters()...');
    clearWatchlistFilters();
    
    console.log('🎉 [DEBUG] Filters cleared');
  });
  
  console.log('✅ [DEBUG] Event listener attached successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}


// ==================== CLEAR FILTERS (WITH DEBUG) ====================
function clearWatchlistFilters() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 [DEBUG] clearWatchlistFilters() STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('📊 [DEBUG] BEFORE clearing:');
  console.log('   watchlistFilters:', JSON.stringify(watchlistFilters, null, 2));
  console.log('   filteredWatchlist.length:', filteredWatchlist.length);
  console.log('   watchlistData.length:', watchlistData.length);
  
  // Reset filter state
  watchlistFilters = {
    position: '',
    league: '',
    team: '',
    nation: '',
    event: '',
    skill_moves: '',
    minOvr: 40,
    maxOvr: 150,
    searchQuery: ''
  };
  
  console.log('✅ [DEBUG] Filter state reset');
  console.log('📊 [DEBUG] AFTER reset:');
  console.log('   watchlistFilters:', JSON.stringify(watchlistFilters, null, 2));
  
  // Reset Desktop UI
  console.log('🖥️ [DEBUG] Resetting desktop UI...');
  const desktopElements = {
    'watchlist-filter-position': '',
    'watchlist-filter-league': '',
    'watchlist-filter-team': '',
    'watchlist-filter-nation': '',
    'watchlist-filter-event': '',
    'watchlist-filter-skill': '',
    'watchlist-rating-min': 40,
    'watchlist-rating-max': 150,
    'watchlist-search-input': '' // Clear search input (FIXED: correct ID)
  };

  let resetCount = 0;
  Object.keys(desktopElements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const oldValue = element.value;
      element.value = desktopElements[id];
      console.log(`   ✅ ${id}: "${oldValue}" → "${desktopElements[id]}"`);
      resetCount++;
    } else {
      console.warn(`   ❌ ${id}: NOT FOUND`);
    }
  });
  console.log(`🖥️ [DEBUG] Reset ${resetCount}/${Object.keys(desktopElements).length} desktop elements`);

  // Reset Mobile UI
  console.log('📱 [DEBUG] Resetting mobile UI...');
  const mobileElements = {
    'mobile-filter-position': '',
    'mobile-filter-league': '',
    'mobile-filter-team': '',
    'mobile-filter-nation': '',
    'mobile-filter-event': '',
    'mobile-filter-skill': '',
    'mobile-rating-min': 40,
    'mobile-rating-max': 150
  };

  let mobileResetCount = 0;
  Object.keys(mobileElements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = mobileElements[id];
      console.log(`   ✅ ${id}: reset`);
      mobileResetCount++;
    }
  });
  console.log(`📱 [DEBUG] Reset ${mobileResetCount}/${Object.keys(mobileElements).length} mobile elements`);

  // Clear mobile search input (FIXED: use correct ID)
  const mobileSearchInput = document.querySelector('#watchlist-mobile-search');
  if (mobileSearchInput) {
    mobileSearchInput.value = '';
    console.log('📱 [DEBUG] Reset mobile search input');
  }

  // Apply filters
  console.log('🔄 [DEBUG] Calling applyWatchlistFilters()...');
  applyWatchlistFilters();
  console.log('✅ [DEBUG] applyWatchlistFilters() completed');
  
  // Update filter chips
  console.log('🏷️ [DEBUG] Calling updateActiveFilterChips()...');
  updateActiveFilterChips();
  console.log('✅ [DEBUG] updateActiveFilterChips() completed');
  
  // Sync filters
  console.log('🔄 [DEBUG] Calling syncDesktopFilters()...');
  syncDesktopFilters();
  console.log('✅ [DEBUG] syncDesktopFilters() completed');
  
  console.log('📊 [DEBUG] FINAL STATE:');
  console.log('   filteredWatchlist.length:', filteredWatchlist.length);
  console.log('   Active filter chips:', document.querySelectorAll('.filter-chip').length);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [DEBUG] clearWatchlistFilters() COMPLETED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}


function applyWatchlistFilters() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [APPLY FILTERS] Starting filter application');
    console.log('📊 [APPLY FILTERS] Total players:', watchlistData.length);
    console.log('🔍 [APPLY FILTERS] Current filters:', watchlistFilters);
    console.log('[WATCHLIST] Applying filters:', watchlistFilters);

    // Start with all watchlist data
    filteredWatchlist = watchlistData.filter(player => {
        // Search query filter - MUST BE FIRST
        if (watchlistFilters.searchQuery) {
            const query = watchlistFilters.searchQuery.toLowerCase();
            const name = (player.name || '').toLowerCase();
            const club = (player.team || '').toLowerCase();
            const league = (player.league || '').toLowerCase();
            const nation = (player.nation || '').toLowerCase();
            const position = (player.position || '').toLowerCase();

            const matchesSearch = name.includes(query) ||
                                 club.includes(query) ||
                                 league.includes(query) ||
                                 nation.includes(query) ||
                                 position.includes(query);

            if (!matchesSearch) return false;
        }

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


        // Skill Moves
        if (watchlistFilters.skill_moves &&
            String(player.skill_moves) !== String(watchlistFilters.skill_moves)) {
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

    syncDesktopFilters();

    if (typeof updateWatchlistFilterBadge === 'function') {
        updateWatchlistFilterBadge();
    }
}


function setupWatchlistFilterListeners() {

    const bind = (elementId, callback) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('change', callback);
        }
    };

    // POSITION
    bind('watchlist-filter-position', e => {
        watchlistFilters.position = e.target.value;
        applyWatchlistFilters();
    });

    bind('mobile-filter-position', e => {
        watchlistFilters.position = e.target.value;
        applyWatchlistFilters();
    });

    // LEAGUE
    bind('watchlist-filter-league', e => {
        watchlistFilters.league = e.target.value;
        applyWatchlistFilters();
    });

    bind('mobile-filter-league', e => {
        watchlistFilters.league = e.target.value;
        applyWatchlistFilters();
    });

    // TEAM
    bind('watchlist-filter-team', e => {
        watchlistFilters.team = e.target.value;
        applyWatchlistFilters();
    });

    bind('mobile-filter-team', e => {
        watchlistFilters.team = e.target.value;
        applyWatchlistFilters();
    });

    // NATION
    bind('watchlist-filter-nation', e => {
        watchlistFilters.nation = e.target.value;
        applyWatchlistFilters();
    });

    bind('mobile-filter-nation', e => {
        watchlistFilters.nation = e.target.value;
        applyWatchlistFilters();
    });

    // EVENT
    bind('watchlist-filter-event', e => {
        watchlistFilters.event = e.target.value;
        applyWatchlistFilters();
    });

    bind('mobile-filter-event', e => {
        watchlistFilters.event = e.target.value;
        applyWatchlistFilters();
    });

    // Skill Moves
    const skillSelect = document.getElementById('watchlist-filter-skill');
    if (skillSelect) {
      skillSelect.addEventListener('change', e => {
        watchlistFilters.skill_moves = e.target.value;
        applyWatchlistFilters();
      });
    }

    // OVR MIN
    bind('watchlist-rating-min', e => {
        watchlistFilters.minOvr = parseInt(e.target.value) || 40;
        applyWatchlistFilters();
    });

    bind('mobile-rating-min', e => {
        watchlistFilters.minOvr = parseInt(e.target.value) || 40;
        applyWatchlistFilters();
    });

    // OVR MAX
    bind('watchlist-rating-max', e => {
        watchlistFilters.maxOvr = parseInt(e.target.value) || 150;
        applyWatchlistFilters();
    });

    bind('mobile-rating-max', e => {
        watchlistFilters.maxOvr = parseInt(e.target.value) || 150;
        applyWatchlistFilters();
    });
}


function clearWatchlistFilters() {
  console.log('[WATCHLIST] Clearing all filters');

  // ✅ FIX: Reset filter state (including skill_moves and searchQuery)
  watchlistFilters = {
    position: '',
    league: '',
    team: '',
    nation: '',
    event: '',
    skill_moves: '', // ✅ FIXED: Was missing
    minOvr: 40,
    maxOvr: 150,
    searchQuery: '' // Reset search query
  };

  // ✅ FIX: Reset Desktop UI with null checks
  const desktopElements = {
    'watchlist-filter-position': '',
    'watchlist-filter-league': '',
    'watchlist-filter-team': '',
    'watchlist-filter-nation': '',
    'watchlist-filter-event': '',
    'watchlist-filter-skill': '', // ✅ FIXED: Was missing
    'watchlist-rating-min': 40,
    'watchlist-rating-max': 150,
    'watchlist-search-input': '' // Clear search input (FIXED: correct ID)
  };

  Object.keys(desktopElements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = desktopElements[id];
      console.log(`[WATCHLIST] Reset ${id} to "${desktopElements[id]}"`);
    } else {
      console.warn(`[WATCHLIST] Element ${id} not found`);
    }
  });

  // ✅ FIX: Reset Mobile UI with null checks
  const mobileElements = {
    'mobile-filter-position': '',
    'mobile-filter-league': '',
    'mobile-filter-team': '',
    'mobile-filter-nation': '',
    'mobile-filter-event': '',
    'mobile-filter-skill': '', // If you have mobile skill filter
    'mobile-rating-min': 40,
    'mobile-rating-max': 150
  };

  Object.keys(mobileElements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = mobileElements[id];
      console.log(`[WATCHLIST] Reset mobile ${id} to "${mobileElements[id]}"`);
    }
  });

  // Clear mobile search input (FIXED: use correct ID)
  const mobileSearchInput = document.querySelector('#watchlist-mobile-search');
  if (mobileSearchInput) {
    mobileSearchInput.value = '';
    console.log('[WATCHLIST] Reset mobile search input');
  }

  // ✅ FIX: Apply filters to show all players
  applyWatchlistFilters();
  
  // ✅ CRITICAL: Update filter chips (was missing!)
  updateActiveFilterChips();
  
  // ✅ FIX: Sync both desktop and mobile filters
  syncDesktopFilters();
  
  console.log('[WATCHLIST] All filters cleared successfully');
}

function updateActiveFilterChips() {
  const container = document.getElementById('watchlist-active-filters');
  if (!container) {
    console.warn('[WATCHLIST] Active filters container not found');
    return;
  }

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

  // ✅ FIX: Include skill_moves filter chip
  if (watchlistFilters.skill_moves) {
    chips.push(`<div class="filter-chip">Skill Moves: ${watchlistFilters.skill_moves}★ <button onclick="removeFilter('skill_moves')">×</button></div>`);
  }

  if (watchlistFilters.minOvr !== 40 || watchlistFilters.maxOvr !== 150) {
    chips.push(`<div class="filter-chip">OVR: ${watchlistFilters.minOvr}-${watchlistFilters.maxOvr} <button onclick="removeFilter('ovr')">×</button></div>`);
  }

  // ✅ FIX: Clear container properly
  container.innerHTML = chips.length > 0 ? chips.join('') : '';
  
  console.log(`[WATCHLIST] Updated filter chips: ${chips.length} active filters`);
}

function removeFilter(filterName) {
  console.log(`[WATCHLIST] Removing filter: ${filterName}`);
  
  if (filterName === 'position') {
    watchlistFilters.position = '';
    const el = document.getElementById('watchlist-filter-position');
    if (el) el.value = '';
  } else if (filterName === 'league') {
    watchlistFilters.league = '';
    const el = document.getElementById('watchlist-filter-league');
    if (el) el.value = '';
  } else if (filterName === 'team') {
    watchlistFilters.team = '';
    const el = document.getElementById('watchlist-filter-team');
    if (el) el.value = '';
  } else if (filterName === 'nation') {
    watchlistFilters.nation = '';
    const el = document.getElementById('watchlist-filter-nation');
    if (el) el.value = '';
  } else if (filterName === 'event') {
    watchlistFilters.event = '';
    const el = document.getElementById('watchlist-filter-event');
    if (el) el.value = '';
  } else if (filterName === 'skill_moves') { // ✅ NEW
    watchlistFilters.skill_moves = '';
    const el = document.getElementById('watchlist-filter-skill');
    if (el) el.value = '';
  } else if (filterName === 'ovr') {
    watchlistFilters.minOvr = 40;
    watchlistFilters.maxOvr = 150;
    const minEl = document.getElementById('watchlist-rating-min');
    const maxEl = document.getElementById('watchlist-rating-max');
    if (minEl) minEl.value = 40;
    if (maxEl) maxEl.value = 150;
  }

  applyWatchlistFilters();
}


// Initialize watchlist when view is shown
function initProfessionalWatchlist() {
  console.log('[WATCHLIST] Initializing Professional Watchlist');
  
  const watchlistView = document.getElementById('watchlist-view');
  if (!watchlistView) {
    console.error('[WATCHLIST] Watchlist view not found');
    return;
  }

  // Load watchlist data
  loadWatchlistData();
  
  // Populate filter dropdowns
  console.log('[DEBUG] About to populate filters...');
  populateWatchlistFilters();
  
  // Setup filter listeners
  console.log('[DEBUG] About to setup filter listeners...');
  setupWatchlistFilterListeners();
  
  // ✅ CRITICAL: Setup event listeners (including clear button)
  console.log('[DEBUG] About to setup watchlist events...');
  setupWatchlistEvents();
  
  console.log('✅ [DEBUG] initProfessionalWatchlist() completed');
}




// Load watchlist data from localStorage
function loadWatchlistData() {
  console.log('[WATCHLIST] Loading data from localStorage');
  
  try {
    const raw = localStorage.getItem('watchlistPlayers');
    console.log('[WATCHLIST] Raw localStorage data:', raw);
    
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log('[WATCHLIST] Parsed player count:', parsed.length);
      
      if (parsed.length > 0) {
        console.log('[WATCHLIST] First player sample:', parsed[0]);
        console.log('[WATCHLIST] First player keys:', Object.keys(parsed[0]));
      }

      // ✅ FIX: Map the data with correct player_id AND nation_region priority
      watchlistData = parsed.map(player => {
        // Use correct priority: player_id > playerid > id
        const actualPlayerId = player.player_id || player.playerid || player.id;
        
        // ✅ CRITICAL FIX: Get nation from correct field
        const nation = player.nation_region || player.nationregion || player.nation || player.nationality || 'NA';
        
        console.log(`[WATCHLIST] Player ${player.name} nation:`, nation, '(from:', 
                    player.nation_region ? 'nation_region' : 
                    player.nationregion ? 'nationregion' : 
                    player.nation ? 'nation' : 
                    player.nationality ? 'nationality' : 'default NA', ')');
        
        return {
          // CRITICAL: Store as player_id for API compatibility
          player_id: actualPlayerId,
          id: actualPlayerId,
          playerid: actualPlayerId,
          
          name: player.name || 'Unknown',
          position: player.position || 'NA',
          team: player.team || player.club || 'NA',
          league: player.league || 'NA',
          
          // ✅ FIX: Use correct nation field with proper fallbacks
          nation: nation,
          nation_region: nation, // Also store with API field name
          nationregion: nation,   // Also store with snake_case
          
          overallrating: player.ovr || player.overallrating || player.rating || 0,
          ovr: player.ovr || player.overallrating || player.rating || 0,
          rank: player.rank || 0,
          skillmoves: player.skillmoves || player.skills || player.sm || 0,
          
          // Stats
          pace: player.pace || 0,
          shooting: player.shooting || 0,
          passing: player.passing || 0,
          dribbling: player.dribbling || 0,
          defending: player.defending || 0,
          physical: player.physical || 0,
          
          // Images - support both naming conventions
          playerimage: player.playerimage || player.player_image || player.imageurl || '',
          cardbackground: player.cardbackground || player.card_background || '',
          nationflag: player.nationflag || player.nation_flag || player.nationflagurl || '',
          clubflag: player.clubflag || player.club_flag || player.clublogourl || '',
          
          // Colors
          colorname: player.colorname || player.color_name || '#FFFFFF',
          colorrating: player.colorrating || player.color_rating || '#FFB86B',
          colorposition: player.colorposition || player.color_position || '#FFFFFF',
          
          // Price
          price: player.price || 0,
          
          // Keep original data
          ...player
        };
      });

      filteredWatchlist = [...watchlistData];
      console.log('[WATCHLIST] Loaded', watchlistData.length, 'players');
      console.log('[WATCHLIST] Sample nations:', watchlistData.slice(0, 3).map(p => p.nation));
      
    } else {
      watchlistData = [];
      filteredWatchlist = [];
      console.log('[WATCHLIST] No saved players found in localStorage');
    }

    console.log('[DEBUG] Data loaded, populating filters...');
    populateWatchlistFilters();
    
    console.log('[DEBUG] Setting up filter listeners...');
    setupWatchlistFilterListeners();
    
    console.log('[DEBUG] loadWatchlistData completed');
    
    // Render after loading
    renderWatchlist();

  } catch (error) {
    console.error('[WATCHLIST] Error loading data:', error);
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
  const isUntradableText = String(player.is_untradable ?? player.isuntradable ?? '').toLowerCase();
  const isUntradable = isUntradableText === 'true' || isUntradableText === '1' || isUntradableText === 'yes';
  const untradableBadgeHTML = isUntradable
    ? `<div class="card-untradable-badge" style="pointer-events: none;">
         <img src="assets/images/untradable_img.png" alt="Untradable">
       </div>`
    : '';
  
  // Process alternate positions
  const alternatePosition = player.alternate_position || player.alternateposition || '';
  const altPositionsArray = alternatePosition ? alternatePosition.split(',').map(p => p.trim()) : [];
  const hasAltPositions = altPositionsArray.filter(pos => pos && pos !== '0' && pos !== 0).length > 0;

  // Create a container div to set CSS custom properties
  const playerRow = document.createElement('div');
  playerRow.className = 'player-row';
  
  // ✅ FIX: Use player_id (the actual database ID) instead of just id
  const actualPlayerId = player.player_id || player.playerid || player.id;
  playerRow.dataset.playerId = actualPlayerId;
  
  // ✅ FIX: Also store the full player object as JSON for fallback
  playerRow.dataset.playerData = JSON.stringify({
    player_id: actualPlayerId,
    name: player.name,
    position: player.position,
    rank: player.rank || 0
  });
  
  // Set CSS custom properties for dynamic colors
  playerRow.style.setProperty('--player-name-color', player.colorname || player.color_name || '#FFFFFF');
  playerRow.style.setProperty('--player-ovr-color', player.colorrating || player.color_rating || '#FFB86B');
  playerRow.style.setProperty('--player-position-color', player.colorposition || player.color_position || '#FFFFFF');

  playerRow.innerHTML = `
    <!-- Player Card Left Section -->
    <div class="player-row-card">
      <div class="player-card-badge"></div>
      <div class="player-card-image-placeholder">

        <!-- Card Background -->
        ${player.cardbackground || player.card_background ? `
          <img src="${player.cardbackground || player.card_background}" 
               alt="Card Background" 
               class="player-row-card-bg"
               onerror="this.style.display='none'">
        ` : ''}

        <!-- Player Image -->
        ${player.playerimage || player.player_image ? `
          <img src="${player.playerimage || player.player_image}" 
               alt="${player.name}"
               class="player-row-main-img"
               onerror="this.style.display='none'; this.nextElementSibling.classList.remove('player-initials-hidden')">
          <span class="player-initials player-initials-hidden">${getInitials(player.name)}</span>
        ` : `
          <span class="player-initials">${getInitials(player.name)}</span>
        `}

        <!-- Player Name Overlay -->
        <div class="player-row-name">
          ${player.name}
        </div>

        <!-- OVR Rating -->
        <div class="player-row-ovr">
          ${player.ovr && player.ovr > 0 ? player.ovr : '?'}
        </div>

        <!-- Position Badge -->
        <div class="player-row-position">
          ${player.position || '?'}
        </div>

        <img src="${player.nationflag}" 
             alt="Nation" 
             class="player-card-nation-flag ${getPlayerType(player) === 'normal' ? 'normal-nation-flag' : 'hero-icon-nation-flag'}"
             onerror="this.style.display='none'">
        
        <img src="${player.clubflag}" 
             alt="Club" 
             class="player-card-club-flag ${getPlayerType(player) === 'normal' ? 'normal-club-flag' : 'hero-icon-club-flag'}"
             onerror="this.style.display='none'">
        
        ${getPlayerType(player) === 'normal' && player.league_image ? `
            <img src="${player.league_image}" 
                 alt="League" 
                 class="player-card-league-watchlist-flag normal-league-watchlist-flag" 
                 onerror="this.style.display='none'">
        ` : ''}
        ${untradableBadgeHTML}

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
    <button class="player-row-watchlist active" 
            data-player-id="${actualPlayerId}" 
            title="Remove from watchlist">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  `;

  return playerRow.outerHTML;
}





// ✅ ATTACH EVENT LISTENERS TO ALL WATCHLIST BUTTONS
function attachWatchlistEventListeners() {
  console.log('[WATCHLIST] Attaching event listeners to player rows and buttons');

  // PLAYER ROW CLICK - Open Detail
  const playerRows = document.querySelectorAll('#watchlist-view .player-row');
  console.log('[WATCHLIST] Found', playerRows.length, 'player rows');

  playerRows.forEach((row, index) => {
    const playerId = row.dataset.playerId;
    
    // ✅ FIX: Get full player data for fallback
    let fallbackPlayer = null;
    try {
      if (row.dataset.playerData) {
        fallbackPlayer = JSON.parse(row.dataset.playerData);
      }
    } catch (e) {
      console.error('[WATCHLIST] Error parsing player data:', e);
    }
    
    // ✅ ALSO: Try to find full player object from watchlistData
    const fullPlayer = watchlistData.find(p => 
      (p.player_id || p.playerid || p.id) === playerId
    );
    
    console.log('[WATCHLIST] Attaching row click listener', index + 1, 'for player ID:', playerId);

    row.addEventListener('click', function(e) {
        if (e.target.closest('.player-row-watchlist')) return;
        console.log('[WATCHLIST] Row clicked! Opening player detail for ID:', playerId);
        const pid = playerId;
        if (!pid || pid === 'undefined') {
            console.error('[WATCHLIST] Invalid player ID', pid);
            return;
        }
        if (window.ZRouter) {
            ZRouter.navigate(`/player/${pid}`);
        } else if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(pid, fullPlayer || fallbackPlayer);
        } else {
            console.error('[WATCHLIST] Neither ZRouter nor viewPlayerDetail found!');
        }
    });
    row.style.cursor = 'pointer';
  });

  // HEART BUTTON CLICK - Remove from Watchlist
  const buttons = document.querySelectorAll('#watchlist-view .player-row-watchlist');
  console.log('[WATCHLIST] Found', buttons.length, 'watchlist buttons');

  buttons.forEach((btn, index) => {
    const playerId = btn.dataset.playerId;
    console.log('[WATCHLIST] Attaching button listener', index + 1, 'for player ID:', playerId);

    btn.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent row click
      e.preventDefault();
      console.log('[WATCHLIST] Heart clicked! Removing player:', playerId);
      removePlayerFromWatchlist(playerId);
    });
  });

  console.log('[WATCHLIST] All event listeners attached successfully');
}



// Setup event listeners for search and sort
function setupWatchlistEvents() {
  console.log('[WATCHLIST] Setting up event listeners');

  // Search input - desktop (FIXED: correct ID)
  const searchInput = document.querySelector('#watchlist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
    console.log('[WATCHLIST] Desktop search listener attached to #watchlist-search-input');
  } else {
    console.error('[WATCHLIST] Desktop search input NOT FOUND (#watchlist-search-input)');
  }

  // Search input - mobile
  const mobileSearchInput = document.querySelector('#watchlist-mobile-search');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', debounce(handleWatchlistSearch, 300));
    console.log('[WATCHLIST] Mobile search listener attached to #watchlist-mobile-search');
  } else {
    console.error('[WATCHLIST] Mobile search input NOT FOUND (#watchlist-mobile-search)');
  }

  // Sort select (FIXED: correct ID)
  const sortSelect = document.querySelector('#watchlist-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleWatchlistSort);
    console.log('[WATCHLIST] Sort listener attached to #watchlist-sort-select');
  } else {
    console.error('[WATCHLIST] Sort select NOT FOUND (#watchlist-sort-select)');
  }

  // ✅ CRITICAL: Call setupClearAllButton
  console.log('[WATCHLIST] About to setup clear button...');
  setupClearAllButton();
  console.log('[WATCHLIST] Clear button setup completed');
}


// Handle search
function handleWatchlistSearch(event) {
  const query = (event.target ? event.target.value : event).trim();
  console.log('🔍 [WATCHLIST] Search query:', query);

  // Update filter state
  watchlistFilters.searchQuery = query;

  // Apply all filters (including search)
  applyWatchlistFilters();
}

// Handle sort
function handleWatchlistSort(e) {
  const value = e.target.value;

  if (!value) return;

  const [field, direction] = value.split('_');

  filteredWatchlist.sort((a, b) => {
    if (direction === 'asc') {
      return (a[field] || 0) - (b[field] || 0);
    } else {
      return (b[field] || 0) - (a[field] || 0);
    }
  });

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
    
    console.log('✅ [REMOVE] Removal complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ [REMOVE] Error:', error);
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

// ==========================================
// INITIALIZATION
// INITIALIZATION
// Just log DOM readiness. The main app (app.js) will call
// initProfessionalWatchlist() whenever the watchlist view is shown.

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[WATCHLIST] DOM loaded for Professional Watchlist');
    });
} else {
    console.log('[WATCHLIST] DOM already loaded for Professional Watchlist');
}


function syncDesktopFilters() {
    if (document.getElementById('watchlist-filter-position'))
        document.getElementById('watchlist-filter-position').value = watchlistFilters.position;

    if (document.getElementById('watchlist-filter-league'))
        document.getElementById('watchlist-filter-league').value = watchlistFilters.league;

    if (document.getElementById('watchlist-filter-team'))
        document.getElementById('watchlist-filter-team').value = watchlistFilters.team;

    if (document.getElementById('watchlist-filter-nation'))
        document.getElementById('watchlist-filter-nation').value = watchlistFilters.nation;

    if (document.getElementById('watchlist-filter-event'))
        document.getElementById('watchlist-filter-event').value = watchlistFilters.event;
}

// ==========================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ==========================================

window.initProfessionalWatchlist = initProfessionalWatchlist;
window.loadWatchlistData = loadWatchlistData;
window.removePlayerFromWatchlist = removePlayerFromWatchlist;

console.log("✅ WATCHLIST: Watchlist Professional JS loaded successfully - v3.1");


// ==================== DEBUG ON LOAD ====================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 [DEBUG] watchlist-professional.js LOADED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ clearWatchlistFilters:', typeof clearWatchlistFilters);
console.log('✅ setupClearAllButton:', typeof setupClearAllButton);
console.log('✅ applyWatchlistFilters:', typeof applyWatchlistFilters);
console.log('✅ updateActiveFilterChips:', typeof updateActiveFilterChips);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
