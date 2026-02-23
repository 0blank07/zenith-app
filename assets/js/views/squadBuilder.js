// squadBuilder.js - FIXED: API Search Error & Database Redirect
// FC Market Pro - Squad Builder

// squadBuilder.js - FIXED: API Search Error & Database Redirect
// FC Market Pro - Squad Builder

// ============ DEVICE DETECTION & RESPONSIVE FORMATIONS ============
function isMobileDevice() {
  const isMobileWidth = window.innerWidth <= 480;
  return isMobileWidth; // Only phones (≤480px) use mobile formations
}

function isTabletDevice() {
  const isTabletWidth = window.innerWidth > 480 && window.innerWidth <= 1024;
  const isPortrait = window.innerHeight > window.innerWidth;
  return isTabletWidth && isPortrait; // Portrait tablets (481-1024px)
}

function getFormations() {
  if (isMobileDevice()) {
    console.log('📱 MOBILE - Using mobileFormations');
    console.log('First slot coords:', mobileFormations['3-4-1-2'].slots[0]);
    return mobileFormations;
  } else if (isTabletDevice()) {
    console.log('📱 TABLET - Using tabletFormations');
    return tabletFormations;
  } else {
    console.log('💻 DESKTOP - Using formations');
    return formations;
  }
}


let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const currentView = document.querySelector('.view.active');
    if (currentView && currentView.id === 'squad-builder-view') {
      renderSquadBuilder(); // ✅ CORRECT: This function clears field.innerHTML = '' first
    }
  }, 250);
});



// ------- Local state -------
window.squadState = {
  name: 'My Squad',
  formationId: '4-3-3',
  starters: {},
  bench: [],
  playerCustomizations: {},
  dragging: null,
  dragSource: null,
  searchQuery: '',
  activeSlot: null,
  pendingDatabaseAssign: false,
  badges: {
        badge1: false,
        badge2: false,
        badge3: false
    }
};


let squadCustomizationState = window.squadCustomizationState = {
    
    playerId: null,
    slotId: null,
    selectedRank: 0,
    trainingLevel: 0,
    selectedSkills: [],
    baseOvr: null,
    basePosition: null,
    baseName: null,
    baseColors: null,
    savedByPlayer: {}
};


// Local players cache for squad builder
let players = [];

function resolveSquadPlayerId(playerOrId) {
  if (!playerOrId) return null;
  if (typeof playerOrId === 'object') {
    return playerOrId.player_id || playerOrId.id || playerOrId.playerid || null;
  }
  return playerOrId;
}

function getSquadPlayerById(playerId) {
  if (!playerId) return null;
  return getPlayers().find(p =>
    p.id === playerId || p.playerid === playerId || p.player_id === playerId
  ) || null;
}

function getSquadPlayerCustomization(playerId) {
  if (!playerId || !squadState.playerCustomizations) return null;
  return squadState.playerCustomizations[playerId] || null;
}

function setSquadPlayerCustomization(playerId, updates = {}, reason = 'update') {
  if (!playerId) return;
  if (!squadState.playerCustomizations) squadState.playerCustomizations = {};
  const current = squadState.playerCustomizations[playerId] || {};
  const next = { ...current, ...updates };
  squadState.playerCustomizations[playerId] = next;
  console.log('[SQUAD CUSTOM] Synced to squad state', { playerId, reason, updates: Object.keys(updates) });
}

function getSquadPlayerSelectedRank(playerId, playerFallback) {
  const customization = getSquadPlayerCustomization(playerId);
  if (customization && customization.selectedRank !== undefined && customization.selectedRank !== null) {
    const normalized = parseInt(customization.selectedRank, 10);
    return Number.isFinite(normalized) ? normalized : 0;
  }
  const fallbackRank = parseInt(playerFallback?.rank ?? 0, 10);
  return Number.isFinite(fallbackRank) ? fallbackRank : 0;
}

function updateSquadCardRankOverlay(playerId, rankValue) {
  if (typeof applyRankOverlay !== 'function') return;
  const resolvedId = resolveSquadPlayerId(playerId);
  if (!resolvedId) return;
  const previewTarget = document.querySelector(
    `.player-preview-card[data-player-id="${resolvedId}"] .preview-card-inner`
  );
  const benchTarget = document.querySelector(
    `.bench-preview-card[data-player-id="${resolvedId}"] .bench-card-inner`
  );
  const target = previewTarget || benchTarget;
  if (!target) return;
  applyRankOverlay(target, rankValue, {
    scope: 'squad-builder',
    modifierClass: 'rank-overlay--squad-field'
  });
}

function parseAlternatePositions(player) {
  const raw = player?.alternate_position || player?.alternatePosition || player?.alternate_positions || '';
  if (!raw) return [];
  return raw
    .split(',')
    .map(pos => pos.trim())
    .filter(pos => pos.length > 0 && pos !== '0')
    .map(pos => pos.toUpperCase());
}

function getSquadPlayerAltPositions(player) {
  const playerId = resolveSquadPlayerId(player);
  const customization = getSquadPlayerCustomization(playerId);
  if (customization?.altPositions) return customization.altPositions;
  return parseAlternatePositions(player);
}

function isPlayerInSquad(playerId) {
  if (!playerId) return false;
  const starters = Object.values(squadState.starters || {});
  return starters.includes(playerId) || (squadState.bench || []).includes(playerId);
}

function getSquadPlayerBoostedOVR(player) {
  if (!player) return 0;
  const playerId = resolveSquadPlayerId(player);
  const customization = getSquadPlayerCustomization(playerId);
  if (customization && Number.isFinite(customization.boostedOvr) && isPlayerInSquad(playerId)) {
    return customization.boostedOvr;
  }
  return player.ovr || player.overall || 0;
}

function isAltPositionUnlocked(player, slotLabel) {
  const playerId = resolveSquadPlayerId(player);
  const customization = getSquadPlayerCustomization(playerId);
  const unlocked = customization?.altPositionsUnlocked || [];
  if (!unlocked.length) return false;
  const normalizedSlot = (slotLabel || '').toUpperCase().trim();
  return unlocked.includes(normalizedSlot);
}



// ============================================================
// POSITION OVR PENALTY SYSTEM
// ============================================================
const POSITION_PENALTIES = {
  'GK': {
    'gk': 0, 'lb': -18, 'cb': -18, 'rb': -18, 'lwb': -18, 'rwb': -18,
    'cdm': -18, 'cm': -18, 'cam': -18, 'lm': -18, 'rm': -18,
    'lw': -18, 'rw': -18, 'cf': -18, 'st': -18
  },
  'ST': {
    'st': 0, 'rw': -6, 'lw': -6, 'cf': 0,
    'cm': -18, 'rm': -18, 'lm': -18, 'cdm': -18, 'cb': -18, 'lb': -18, 'rb': -18, 'lwb': -18, 'rwb': -18,
    'cam': -9, 'gk': -18
  },
  'LW': {
    'lw': 0, 'st': -6, 'cf': -6, 'lwb': -6, 'rw': -4, 'lm': -4,
    'rm': -18, 'cm': -18, 'cdm': -18, 'cb': -18, 'rb': -18, 'rwb': -18, 'cam': -18,
    'lb': -9, 'gk': -18
  },
  'RW': {
    'rw': 0, 'lw': -4, 'rm': -4, 'st': -6, 'cf': -6, 'rwb': -6,
    'lm': -18, 'cm': -18, 'cdm': -18, 'lb': -18, 'cb': -18, 'lwb': -18, 'cam': -18,
    'rb': -9, 'gk': -18
  },
  'CAM': {
    'cam': 0, 'cf': 0, 'cm': -4, 'lm': -6, 'rm': -6, 'st': -9, 'cdm': -9,
    'lw': -18, 'rw': -18, 'lb': -18, 'cb': -18, 'rb': -18, 'lwb': -18, 'rwb': -18, 'gk': -18
  },
  'CM': {
    'cm': 0, 'cdm': -4, 'cam': -4, 'lm': -4, 'rm': -4,
    'cf': -9, 'lb': -9, 'cb': -9, 'rb': -9, 'lwb': -9, 'rwb': -9,
    'lw': -18, 'st': -18, 'rw': -18, 'gk': -18
  },
  'CDM': {
    'cdm': 0, 'cm': -4, 'cb': -4, 'lm': -6, 'rm': -6, 'lb': -6, 'rb': -6, 'lwb': -6, 'rwb': -6,
    'cam': -9, 'lw': -18, 'st': -18, 'rw': -18, 'cf': -18, 'gk': -18
  },
  'LM': {
    'lm': 0, 'rm': -4, 'lw': -4, 'lwb': -4, 'cdm': -6, 'lb': -6, 'cam': -6, 'cm': -6,
    'cb': -9, 'rb': -9, 'rwb': -9, 'st': -18, 'rw': -18, 'cf': -18, 'gk': -18
  },
  'RM': {
    'rm': 0, 'rw': -4, 'rwb': -4, 'cam': -5, 'cm': -5, 'cdm': -5, 'rb': -5,
    'lb': -7, 'cb': -7, 'lwb': -8, 'cf': -8, 'st': -17, 'lw': -18, 'lm': -17, 'gk': -18
  },
  'LB': {
    'lb': 0, 'lwb': 0, 'cb': -4, 'rb': -4, 'rwb': -4, 'cdm': -6, 'lm': -6,
    'lw': -9, 'cm': -9, 'cam': -9, 'rm': -9, 'st': -18, 'rw': -18, 'cf': -18, 'gk': -18
  },
  'CB': {
    'cb': 0, 'lb': -4, 'rb': -4, 'cdm': -4, 'cm': -9, 'lm': -9, 'rm': -9, 'lwb': -9, 'rwb': -9,
    'lw': -18, 'st': -18, 'rw': -18, 'cam': -18, 'cf': -18, 'gk': -18
  },
  'RB': {
    'rb': 0, 'rwb': 0, 'lb': -4, 'cb': -4, 'lwb': -4, 'cdm': -6, 'rm': -6,
    'rw': -9, 'cm': -9, 'lm': -9, 'lw': -18, 'st': -18, 'cf': -18, 'cam': -18, 'gk': -18
  },
  'LWB': {
    'lwb': 0, 'lb': 0, 'rb': -3, 'rwb': -3, 'lm': -3, 'lw': -5, 'cdm': -5,
    'cm': -7, 'cb': -7, 'rm': -7, 'st': -15, 'cf': -15, 'cam': -15, 'rw': -15, 'gk': -18
  },
  'RWB': {
    'rwb': 0, 'rb': 0, 'lb': -3, 'lwb': -3, 'rm': -5, 'cdm': -5, 'rw': -5,
    'lm': -7, 'cm': -7, 'cb': -7, 'lw': -15, 'st': -15, 'cf': -15, 'cam': -15, 'gk': -18
  },
  'CF': {
    'cf': 0, 'cam': -4, 'st': -4, 'cm': -4, 'lm': -4, 'rm': -4, 'lw': -6, 'rw': -6,
    'cdm': -15, 'lb': -15, 'cb': -15, 'rb': -15, 'lwb': -15, 'rwb': -15, 'gk': -18
  }
};

function getPositionAdjustedOVR(player, slotPosition, options = {}) {
  const playerPos = (player?.position || '').toUpperCase().trim();
  const slotPosKey = (slotPosition || '').toLowerCase().trim();
  const slotPosLabel = (slotPosition || '').toUpperCase().trim();
  const useSquadOverrides = options.useSquadOverrides === true;
  const baseOVR = useSquadOverrides ? getSquadPlayerBoostedOVR(player) : (player?.ovr || player?.overall || 0);
  
  if (!playerPos || !slotPosKey) return baseOVR;
  
  if (useSquadOverrides && isAltPositionUnlocked(player, slotPosLabel)) {
    console.log('[SQUAD OVR] Alt position unlocked, no penalty', {
      playerId: resolveSquadPlayerId(player),
      slot: slotPosLabel,
      baseOVR
    });
    return baseOVR;
  }
  
  const penalty = POSITION_PENALTIES[playerPos]?.[slotPosKey] ?? -18;
  const adjusted = Math.max(0, baseOVR + penalty);
  if (useSquadOverrides) {
    console.log('[SQUAD OVR] Effective OVR calculated', {
      playerId: resolveSquadPlayerId(player),
      slot: slotPosLabel,
      baseOVR,
      penalty,
      adjusted
    });
  }
  return adjusted;
}

// Function to get players from global state or API
function getPlayers() {
  // Try to get from global state first
  if (window.state && window.state.allPlayers && window.state.allPlayers.length > 0) {
    return window.state.allPlayers;
  }
  // Fallback to local cache
  return players;
}

// Function to add player to local cache
function addPlayerToCache(player) {
  const existingIndex = players.findIndex(p => p.id === player.id || p.player_id === player.id);
  if (existingIndex === -1) {
    players.push(player);
    console.log('✅ Player added to cache:', player.name);
  } else {
    players[existingIndex] = { ...players[existingIndex], ...player };
  }
}


// ========================================
// TEAM OVR CALCULATOR (FIXED LOGIC)
// ========================================
// ========================================
// TEAM OVR CALCULATOR (CORRECT BENCH LOGIC)
// ========================================
function calculateTeamOVR() {
  let totalOVR = 0;
  let filledBenchCount = 0;
  
  // Get formation slots (11 starters with positions)
  const currentFormation = getFormations()[squadState.formationId];
  if (!currentFormation) return 0;
  
  // ---- Calculate STARTERS with position penalties ----
  currentFormation.slots.forEach(slot => {
    const pid = squadState.starters[slot.id];
    if (!pid) return;
    
    const player = getPlayers().find(p => 
      p.id === pid || p.playerid === pid || p.player_id === pid
    );
    
    if (player) {
      const adjustedOVR = getPositionAdjustedOVR(player, slot.position, { useSquadOverrides: true });
      totalOVR += adjustedOVR;
    }
  });
  
  // ---- Calculate BENCH (no position penalties) ----
  squadState.bench.forEach(pid => {
    if (!pid) return;
    const player = getPlayers().find(p => 
      p.id === pid || p.playerid === pid || p.player_id === pid
    );
    if (player) {
      totalOVR += getSquadPlayerBoostedOVR(player);
      filledBenchCount++;
    }
  });
  
  const denominator = 11 + filledBenchCount;
  if (totalOVR === 0) return 0;
  
  return Math.ceil(totalOVR / denominator);
}


// ========================================
// FINAL TEAM OVR (with badges)
// ========================================
function getFinalTeamOVR() {
    const baseOVR = calculateTeamOVR();
    
    // Count active badges
    const activeBadges = Object.values(squadState.badges).filter(b => b === true).length;
    
    // Each badge adds +1 OVR
    return baseOVR + activeBadges;
}




// State for API results
let pickerSearchResults = [];
let pickerSearchTimer = null;

// ============ FIXED SEARCH & FILTER LOGIC ============

// 1. Fetch players from API (Using getPlayers for stability)
async function fetchPlayersForPicker() {
    const list = document.getElementById('squad-player-list');
    
    // Only show loading if we are actually searching/filtering in the picker view
    if (list && squadState.searchQuery) {
        list.innerHTML = `<div class="picker-loading" style="padding:20px;text-align:center;color:#888">Searching database...</div>`;
    }
    
    try {
        const query = squadState.searchQuery;
        
        // Build API params correctly for the getPlayers endpoint
        const params = {
            limit: 50,
            rank: 0
        };

        // Map the search query to name_starts_with
        if (query) params.name_starts_with = query;

        // ========== ✅ AUCTIONABLE FILTER ==========
        const auctionableToggle = document.getElementById('squad-auctionable-toggle');
        const auctionableOnly = auctionableToggle?.checked ?? false;
        if (auctionableOnly) {
            // Only show tradable players (is_untradable = 0)
            params.is_untradable = 0;
            console.log('🏷️ [SQUAD FILTER] Auctionable ON - Showing only tradable players');
        } else {
            console.log('🏷️ [SQUAD FILTER] Auctionable OFF - Showing all players');
        }

        // Apply active filters from global state
        if (state.filters.position) params.position = state.filters.position;

        console.log('🔍 FETCH DEBUG: state.filters.ratingMin:', state.filters.ratingMin);
        console.log('🔍 FETCH DEBUG: state.filters.ratingMax:', state.filters.ratingMax);

        if (state.filters.ratingMin > 40) params.min_ovr = state.filters.ratingMin;
        if (state.filters.ratingMax < 150) params.max_ovr = state.filters.ratingMax;

        console.log('🔍 FETCH DEBUG: Final params sent to API:', params);

        if (state.filters.priceMin) params.min_price = state.filters.priceMin;
        if (state.filters.priceMax) params.max_price = state.filters.priceMax;
        if (state.filters.league) params.league = state.filters.league;
        if (state.filters.nation) params.nation = state.filters.nation;
        if (state.filters.skillMoves) params.skill_moves = state.filters.skillMoves;
        if (state.filters.club) params.team = state.filters.club; // CLUB FILTER
        if (state.filters.event) params.event = state.filters.event; // EVENT FILTER

        
        // Map the search query to 'namestartswith' so it works with filters
        if (query) {
            params.namestartswith = query;
        }
        
        // Apply active filters from global state
        if (state.filters.position) params.position = state.filters.position;

        console.log('🔍 FETCH DEBUG: state.filters.ratingMin:', state.filters.ratingMin);
        console.log('🔍 FETCH DEBUG: state.filters.ratingMax:', state.filters.ratingMax);
        if (state.filters.ratingMin > 40) params.min_ovr = state.filters.ratingMin;
        if (state.filters.ratingMax < 150) params.max_ovr = state.filters.ratingMax;
        console.log('🔍 FETCH DEBUG: Final params sent to API:', params);
        if (state.filters.priceMin) params.minprice = state.filters.priceMin;
        if (state.filters.priceMax) params.maxprice = state.filters.priceMax;
        if (state.filters.league) params.league = state.filters.league;
        if (state.filters.nation) params.nation = state.filters.nation;
        if (state.filters.skillMoves) params.skillmoves = state.filters.skillMoves;
        if (state.filters.club) params.team = state.filters.club;  // ✅ CLUB FILTER
        if (state.filters.event) params.event = state.filters.event;  // ✅ EVENT FILTER
        
        console.log('[SQUAD BUILDER] Fetching with params:', params);

        // Use getPlayers instead of searchPlayers to ensure filters like Position are respected
        const data = await window.apiClient.getPlayers(params);
        let players = data.players || [];

        if (window.supabaseProvider && typeof window.supabaseProvider.syncPrices === 'function') {
            console.log('[SQUAD BUILDER] Syncing prices for picker players:', players.length);
            players = await window.supabaseProvider.syncPrices(players);
            console.log('[SQUAD BUILDER] Picker price sync complete. Sample:', players.slice(0, 3).map(p => ({
                id: p.player_id || p.id,
                price: p.price
            })));
        }

        pickerSearchResults = players;

        // 🔍 DEBUG: Check what API returned
        console.log('🔍 API RESPONSE: Total players received:', pickerSearchResults.length);
        console.log('🔍 API RESPONSE: First 5 players OVR:', pickerSearchResults.slice(0, 5).map(p => ({ name: p.name, ovr: p.ovr || p.overall })));
        console.log('🔍 API RESPONSE: All players OVR range:', {
            min: Math.min(...pickerSearchResults.map(p => p.ovr || p.overall || 0)),
            max: Math.max(...pickerSearchResults.map(p => p.ovr || p.overall || 0))
        });

        // Render the results
        renderPlayerPicker();



    } catch (error) {
        console.error('[Squad Search Error]', error);
        if (list) {
            list.innerHTML = `<div style="padding:20px;text-align:center;color:red">Error loading players. API may be offline.</div>`;
        }
    }
}


// 2. Triggered by Filters (Sidebar)
function applyFiltersToPickerPlayers() {
  if (pickerSearchTimer) clearTimeout(pickerSearchTimer);
  fetchPlayersForPicker();
}

// 3. Triggered by Search Input (Debounced)
function updatePickerSearch(query) {
  squadState.searchQuery = query;
  
  if (pickerSearchTimer) clearTimeout(pickerSearchTimer);
  
  // Wait 500ms before hitting the API to prevent spamming
  pickerSearchTimer = setTimeout(() => {
    fetchPlayersForPicker();
  }, 500);
}

// 4. Render the Picker List
function renderPlayerPicker() {
  const list = document.getElementById('squad-player-list');
  const hint = document.getElementById('squad-player-hint');

  if (!list) return;

  const playersToRender = pickerSearchResults.length > 0 ? pickerSearchResults : [];

  list.innerHTML = '';
  
  if (playersToRender.length === 0) {
    if (hint) hint.textContent = 'No players match your search.';
    // Attempt a default fetch if empty and no query
    if (!squadState.searchQuery && !pickerSearchTimer) {
         fetchPlayersForPicker(); 
    }
    return;
  } else {
    if (hint) hint.textContent = '🖱️ Drag players to field or click to assign.';
  }

  playersToRender.forEach(p => {
    const row = document.createElement('div');
    row.className = 'picker-row';
    row.setAttribute('draggable', 'true');
    
    // Normalize Data
    const pid = p.player_id || p.id;
    const overall = p.ovr || p.overall || 0;
    const position = p.position || 'N/A';
    const price = p.price || 0;
    const club = p.club || p.team || 'Unknown Club';
    const isUntradableText = String(p.is_untradable ?? p.isuntradable ?? '').toLowerCase();
    const isUntradable = isUntradableText === 'true' || isUntradableText === '1' || isUntradableText === 'yes';
    const untradableBadgeHTML = isUntradable
      ? `<div class="card-untradable-badge" style="pointer-events: none;">
           <img src="assets/images/untradable_img.png" alt="Untradable">
         </div>`
      : '';

    row.innerHTML = `
        <div class="picker-card-mini">
            <img src="${p.card_background || 'https://via.placeholder.com/300x400'}"
                alt="Card Background"
                class="picker-card-bg"
                onerror="this.src='https://via.placeholder.com/300x400'">

            <img src="${p.player_image || 'https://via.placeholder.com/200x300'}"
                alt="${p.name}"
                class="picker-card-player-img"
                onerror="this.src='https://via.placeholder.com/200x300'">

            <div class="picker-card-ovr" style="color: ${p.color_rating || '#FFFFFF'}">
                ${overall > 0 ? overall : 'N/A'}
            </div>

            <div class="picker-card-position" style="color: ${p.color_position || '#FFFFFF'}">
                ${position}
            </div>

            <div class="picker-card-name" style="color: ${p.color_name || '#FFFFFF'}">
                ${p.name}
            </div>

            <img src="${p.nation_flag}" alt="Nation" class="picker-squad-card-flag-nation ${getPlayerType(p) === 'normal' ? 'normal-squad-nation-flag' : 'hero-icon-squad-nation-flag'}" onerror="this.style.display='none'">
            <img src="${p.club_flag}" alt="Club" class="picker-squad-card-flag-club ${getPlayerType(p) === 'normal' ? 'normal-squad-club-flag' : 'hero-icon-squad-club-flag'}" onerror="this.style.display='none'">
            ${getPlayerType(p) === 'normal' && p.league_image ? `
                <img src="${p.league_image}" 
                     alt="League" 
                     class="picker-squad-card-flag-league normal-squad-league-flag" 
                     onerror="this.style.display='none'">
            ` : ''}
            ${untradableBadgeHTML}
        </div>

        <div class="picker-main">
            <div class="picker-name">${p.name}</div>
            <div class="picker-meta">${position} • ${club}</div>
        </div>

        <div class="picker-ovr-right">${overall > 0 ? overall : 'N/A'}</div>
    `;

    
    // Drag Start
    // Drag Start - Create custom drag image of the entire card
    row.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        
        // Create a clone of the picker-card-mini for drag preview
        const cardMini = row.querySelector('.picker-card-mini');
        if (cardMini) {
            const clone = cardMini.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.width = cardMini.offsetWidth + 'px';
            clone.style.height = cardMini.offsetHeight + 'px';
            clone.style.pointerEvents = 'none';
            clone.style.opacity = '0.9';
            clone.style.transform = 'rotate(0deg)'; // Remove any transforms
            document.body.appendChild(clone);
            
            // Set the clone as drag image
            e.dataTransfer.setDragImage(clone, cardMini.offsetWidth / 2, cardMini.offsetHeight / 2);
            
            // Remove clone after drag starts
            setTimeout(() => {
                document.body.removeChild(clone);
            }, 0);
        }
        
        handleCardDragStart(e, pid, 'picker', null);
        ensurePlayerInGlobalList(p, pid, overall);
    });

    row.addEventListener('pointerdown', (e) => {
        queuePointerDrag(e, pid, 'picker', null, () => ensurePlayerInGlobalList(p, pid, overall));
    });

    
    row.addEventListener('dragend', clearDragState);
    
    // Click to Assign
    row.addEventListener('click', () => {
      if (!squadState.activeSlot) {
        return;
      }
      
      ensurePlayerInGlobalList(p, pid, overall);

      if (squadState.activeSlot.startsWith('BENCH_')) {
        const index = parseInt(squadState.activeSlot.split('_')[1], 10);
        if (isPlayerAlreadyInSquad(pid, null)) {
          return;
        }
        removeIfAssigned(pid);
        squadState.bench[index] = pid;
        renderSquadBuilder();
      } else {
        if (!validateAssignment(p, squadState.activeSlot)) {
          return;
        }
        if (isPlayerAlreadyInSquad(pid, squadState.activeSlot)) {
          return;
        }
        removeIfAssigned(pid);
        squadState.starters[squadState.activeSlot] = pid;
        renderSquadBuilder();
      }
    });
    
    list.appendChild(row);
  });
}

function resolveSquadPlayerPrice(player) {
    if (!player) return 0;

    const candidates = [];
    const rank = parseInt(player.rank ?? player.selectedRank ?? player.rank_level ?? player.rankLevel ?? 0, 10);
    const rankKey = Number.isFinite(rank) ? `price${rank}` : null;

    if (rankKey && player[rankKey] !== undefined) {
        candidates.push(player[rankKey]);
    }

    for (let i = 0; i <= 5; i++) {
        const key = `price${i}`;
        if (player[key] !== undefined) {
            candidates.push(player[key]);
        }
    }

    candidates.push(
        player.price,
        player.market_price,
        player.current_price,
        player.latest_price,
        player.min_price,
        player.max_price,
        player.value,
        player.buy_now_price
    );

    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined) continue;
        const normalized = typeof candidate === 'string' ? candidate.replace(/,/g, '') : candidate;
        const numeric = Number(normalized);
        if (Number.isFinite(numeric) && numeric > 0) {
            return numeric;
        }
    }

    return 0;
}

// Helper: Add player to global list so they appear correctly on the pitch
function ensurePlayerInGlobalList(p, pid, overall) {
  console.log('📦 Ensuring player in list:', p.name, pid);
  
  const resolvedId = p.player_id || pid || p.id;
  const pickMediaValue = (...values) => {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      return value;
    }
    return null;
  };
  const cardBackground = pickMediaValue(
    p.card_background, p.cardbackground, p.cardBackground, p.card_bg, p.cardBg,
    p.card_image, p.cardImage, p.cardimg, p.card
  );
  const playerImage = pickMediaValue(
    p.player_image, p.playerimage, p.playerImage, p.playerimg, p.playerImg, p.player_img,
    p.image, p.image_url, p.imageUrl, p.imageurl, p.player_face, p.playerFace
  );
  const nationFlag = pickMediaValue(
    p.nation_flag, p.nationflag, p.nationFlag, p.nationflagurl, p.country_flag, p.countryFlag
  );
  const clubFlag = pickMediaValue(
    p.club_flag, p.clubflag, p.clubFlag, p.clublogourl, p.club_logo, p.clubLogo, p.team_flag, p.teamFlag
  );
  const leagueFlag = pickMediaValue(
    p.league_flag, p.leagueflag, p.leagueFlag, p.leagueflagurl, p.league_logo, p.leagueLogo
  );
  const normalizedPlayer = {
    ...p,
    id: resolvedId,
    player_id: resolvedId,
    overall: overall || p.ovr || p.overall || 0,
    ovr: overall || p.ovr || p.overall || 0,
    name: p.name,
    position: p.position,
    team: p.club || p.team,
    club: p.club || p.team,
    price: resolveSquadPlayerPrice(p),
    ...(cardBackground ? {
      card_background: cardBackground,
      cardbackground: cardBackground,
      cardBackground
    } : {}),
    ...(playerImage ? {
      player_image: playerImage,
      playerimage: playerImage,
      player_img: playerImage,
      playerImg: playerImage
    } : {}),
    ...(nationFlag ? {
      nation_flag: nationFlag,
      nationflag: nationFlag,
      nationFlag
    } : {}),
    ...(clubFlag ? {
      club_flag: clubFlag,
      clubflag: clubFlag,
      clubFlag
    } : {}),
    ...(leagueFlag ? {
      league_flag: leagueFlag,
      leagueflag: leagueFlag,
      leagueFlag
    } : {})
  };
  
  addPlayerToCache(normalizedPlayer);
  console.info('[SQUAD MEDIA] Normalized player media', {
    playerId: resolvedId,
    hasCardBackground: Boolean(cardBackground),
    hasPlayerImage: Boolean(playerImage),
    hasNationFlag: Boolean(nationFlag),
    hasClubFlag: Boolean(clubFlag),
    hasLeagueFlag: Boolean(leagueFlag)
  });
  
  // Also add to global state if available
  if (window.state && window.state.allPlayers) {
    const exists = window.state.allPlayers.find(existing => 
      existing.id === normalizedPlayer.id || 
      existing.player_id === normalizedPlayer.id
    );
    if (!exists) {
      window.state.allPlayers.push(normalizedPlayer);
      console.log('✅ Added to global state');
    } else {
      Object.assign(exists, normalizedPlayer);
    }
  }
}

// Clear filters
function clearSquadFilters() {
    // Reset filter state
    state.filters = {
        position: '',
        ratingMin: 40,
        ratingMax: 150,
        priceMin: null,
        priceMax: null,
        league: '',
        nation: '',
        club: '',
        event: '',
        skillMoves: ''
    };
    
    // Clear search query
    squadState.searchQuery = '';
    const searchInput = document.getElementById('squad-picker-search');
    if (searchInput) searchInput.value = '';
    
    // Reset all filter UI elements
    document.querySelectorAll('.filter-input, .filter-select').forEach(el => {
        el.value = '';
    });
    
    // Reset OVR range inputs
    const ratingMin = document.getElementById('squad-rating-min');
    const ratingMax = document.getElementById('squad-rating-max');
    if (ratingMin) ratingMin.value = '40';
    if (ratingMax) ratingMax.value = '150';
    
    // Update rating display
    const ratingValue = document.getElementById('squad-rating-value');
    if (ratingValue) ratingValue.textContent = '40-150';
    
    // Re-fetch players with cleared filters
    applyFiltersToPickerPlayers();
}

// ============ END OF SEARCH LOGIC ============
// ============ END OF NEW CODE ============

// ============ END OF NEW CODE ============


// ------- ALL 37 FORMATIONS -------
const formations = {
  '3-4-1-2': {
    label: '3-4-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 55, y: 83 },
      { id: 'LCB', label: 'CB', x: 28, y: 65 },
      { id: 'CB', label: 'CB', x: 55, y: 65 },
      { id: 'RCB', label: 'CB', x: 82, y: 65 },
      { id: 'LM', label: 'LM', x: 20, y: 36 },
      { id: 'LCM', label: 'CM', x: 40, y: 46 },
      { id: 'RCM', label: 'CM', x: 70, y: 46 },
      { id: 'RM', label: 'RM', x: 90, y: 36 },
      { id: 'CAM', label: 'CAM', x: 55, y: 31 },  
      { id: 'LS', label: 'ST', x: 43, y: 16 },
      { id: 'RS', label: 'ST', x: 67, y: 16 }
    ]
},
  '3-4-2-1': {
    label: '3-4-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 86 },
      { id: 'LCB', label: 'LCB', x: 31, y: 69 },
      { id: 'CB', label: 'CB', x: 53, y: 61 },
      { id: 'RCB', label: 'RCB', x: 72, y: 69 },
      { id: 'LM', label: 'LM', x: 19, y: 39 },
      { id: 'LCM', label: 'LCM', x: 36, y: 49 },
      { id: 'RCM', label: 'RCM', x: 68, y: 49 },
      { id: 'RM', label: 'RM', x: 85, y: 39 },
      { id: 'LAM', label: 'CAM', x: 36, y: 26 },
      { id: 'RAM', label: 'CAM', x: 68, y: 26 },
      { id: 'ST', label: 'ST', x: 53, y: 14 }
    ]
},
  '3-4-3-DIAMOND': {
    label: '3-4-3 Diamond',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LCB', label: 'LCB', x: 30, y: 66 },
      { id: 'CB', label: 'CB', x: 53, y: 66 },
      { id: 'RCB', label: 'RCB', x: 77, y: 66 },
      { id: 'LM', label: 'LM', x: 25, y: 40 },
      { id: 'CDM', label: 'CDM', x: 43, y: 47 },
      { id: 'CAM', label: 'CAM', x: 63, y: 42 },
      { id: 'RM', label: 'RM', x: 83, y: 40 },
      { id: 'LW', label: 'LW', x: 35, y: 22 },
      { id: 'ST', label: 'ST', x: 53, y: 17 },
      { id: 'RW', label: 'RW', x: 72, y: 22 }
    ]
  },
  '3-4-3-FLAT': {
    label: '3-4-3 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 84 },
      { id: 'LCB', label: 'LCB', x: 29, y: 67 },
      { id: 'CB', label: 'CB', x: 53, y: 67 },
      { id: 'RCB', label: 'RCB', x: 76, y: 67 },
      { id: 'LM', label: 'LM', x: 20, y: 43 },
      { id: 'LCM', label: 'CM', x: 42, y: 43 },
      { id: 'RCM', label: 'CM', x: 64, y: 43 },
      { id: 'RM', label: 'RM', x: 86, y: 43 },
      { id: 'LW', label: 'LW', x: 32, y: 16 },
      { id: 'ST', label: 'ST', x: 53, y: 15 },
      { id: 'RW', label: 'RW', x: 74, y: 16 }
    ]
  },
  '3-5-1-1': {
    label: '3-5-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LCB', label: 'LCB', x: 25, y: 61 },
      { id: 'CB', label: 'CB', x: 53, y: 61 },
      { id: 'RCB', label: 'RCB', x: 78, y: 61 },
      { id: 'LM', label: 'LM', x: 21, y: 32 },
      { id: 'LDM', label: 'CDM', x: 43, y: 47 },
      { id: 'CM', label: 'CM', x: 53, y: 33 },
      { id: 'RDM', label: 'CDM', x: 65, y: 47 },
      { id: 'RM', label: 'RM', x: 85, y: 32 },
      { id: 'LST', label: 'ST', x: 42, y: 17 },
      { id: 'RST', label: 'ST', x: 66, y: 17 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LCB', label: 'LCB', x: 27, y: 63 },
      { id: 'CB', label: 'CB', x: 53, y: 63 },
      { id: 'RCB', label: 'RCB', x: 78, y: 63 },
      { id: 'LM', label: 'LM', x: 20, y: 39 },
      { id: 'LDM', label: 'CDM', x: 41, y: 47 },
      { id: 'CAM', label: 'CAM', x: 53, y: 33 },
      { id: 'RDM', label: 'CDM', x: 64, y: 47 },
      { id: 'RM', label: 'RM', x: 85, y: 39 },
      { id: 'LS', label: 'ST', x: 41, y: 16 },
      { id: 'RS', label: 'ST', x: 67, y: 16 }
    ]
  },
  '4-1-2-1-2-NARROW': {
    label: '4-1-2-1-2 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 66 },
      { id: 'LCB', label: 'CB', x: 38, y: 70 },
      { id: 'RCB', label: 'CB', x: 69, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 66 },
      { id: 'CDM', label: 'CDM', x: 54, y: 54 },
      { id: 'LCM', label: 'CM', x: 37, y: 42 },
      { id: 'RCM', label: 'CM', x: 72, y: 42 },
      { id: 'CAM', label: 'CAM', x: 54, y: 28 },
      { id: 'LS', label: 'ST', x: 43, y: 12 },
      { id: 'RS', label: 'ST', x: 66, y: 12 }
    ]
  },
  '4-1-2-1-2-WIDE': {
    label: '4-1-2-1-2 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LB', label: 'LB', x: 17, y: 69 },
      { id: 'LCB', label: 'CB', x: 38, y: 70 },
      { id: 'RCB', label: 'CB', x: 72, y: 70 },
      { id: 'RB', label: 'RB', x: 90, y: 69 },
      { id: 'CDM', label: 'CDM', x: 54, y: 54 },
      { id: 'LM', label: 'LM', x: 25, y: 39 },
      { id: 'RM', label: 'RM', x: 78, y: 39 },
      { id: 'CAM', label: 'CAM', x: 54, y: 28 },
      { id: 'LS', label: 'ST', x: 42, y: 17 },
      { id: 'RS', label: 'ST', x: 66, y: 17 }
    ]
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 66 },
      { id: 'LCB', label: 'CB', x: 37, y: 68 },
      { id: 'RCB', label: 'CB', x: 73, y: 68 },
      { id: 'RB', label: 'RB', x: 91, y: 66 },
      { id: 'CDM', label: 'CDM', x: 53, y: 54 },
      { id: 'LM', label: 'LM', x: 24, y: 34 },
      { id: 'CM', label: 'CM', x: 53, y: 34 },
      { id: 'RM', label: 'RM', x: 80, y: 34 },
      { id: 'LS', label: 'ST', x: 42, y: 17 },
      { id: 'RS', label: 'ST', x: 66, y: 17 }
    ]
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 83 },
      { id: 'LB', label: 'LB', x: 19, y: 68 },
      { id: 'LCB', label: 'CB', x: 38, y: 68 },
      { id: 'RCB', label: 'CB', x: 66, y: 68 },
      { id: 'RB', label: 'RB', x: 85, y: 68 },
      { id: 'CDM', label: 'CDM', x: 52, y: 53 },
      { id: 'LM', label: 'LM', x: 22, y: 37 },
      { id: 'LCM', label: 'CM', x: 42, y: 37 },
      { id: 'RCM', label: 'CM', x: 62, y: 37 },
      { id: 'RM', label: 'RM', x: 82, y: 37 },
      { id: 'ST', label: 'ST', x: 52, y: 18 }
    ]
  },
  '4-2-1-3': {
    label: '4-2-1-3',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 66 },
      { id: 'LCB', label: 'CB', x: 36, y: 68 },
      { id: 'RCB', label: 'CB', x: 70, y: 68 },
      { id: 'RB', label: 'RB', x: 88, y: 66 },
      { id: 'LDM', label: 'CDM', x: 37, y: 47 },
      { id: 'RDM', label: 'CDM', x: 68, y: 47 },
      { id: 'CAM', label: 'CAM', x: 53, y: 37 },
      { id: 'LW', label: 'LW', x: 32, y: 19 },
      { id: 'ST', label: 'ST', x: 53, y: 17 },
      { id: 'RW', label: 'RW', x: 73, y: 19 }
    ]
  },
  '4-2-1-3-WIDE': {
    label: '4-2-1-3 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 86 },
      { id: 'LB', label: 'LB', x: 17, y: 66 },
      { id: 'LCB', label: 'CB', x: 40, y: 70 },
      { id: 'RCB', label: 'CB', x: 68, y: 70 },
      { id: 'RB', label: 'RB', x: 87, y: 66 },
      { id: 'LDM', label: 'CDM', x: 44, y: 54 },
      { id: 'RDM', label: 'CDM', x: 64, y: 54 },
      { id: 'CAM', label: 'CAM', x: 54, y: 34 },
      { id: 'LW', label: 'LW', x: 27, y: 22 },
      { id: 'ST', label: 'ST', x: 54, y: 15 },
      { id: 'RW', label: 'RW', x: 80, y: 22 }
    ]
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 70 },
      { id: 'LCB', label: 'CB', x: 38, y: 70 },
      { id: 'RCB', label: 'CB', x: 71, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 70 },
      { id: 'LDM', label: 'CDM', x: 46, y: 50 },
      { id: 'RDM', label: 'CDM', x: 64, y: 50 },
      { id: 'LAM', label: 'CAM', x: 33, y: 33 },
      { id: 'RAM', label: 'CAM', x: 76, y: 33 },
      { id: 'LS', label: 'ST', x: 44, y: 17 },
      { id: 'RS', label: 'ST', x: 64, y: 17 }
    ]
  },
  '4-2-3-1-NARROW': {
    label: '4-2-3-1 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 82 },
      { id: 'LB', label: 'LB', x: 18, y: 64 },
      { id: 'LCB', label: 'CB', x: 38, y: 68 },
      { id: 'RCB', label: 'CB', x: 66, y: 68 },
      { id: 'RB', label: 'RB', x: 85, y: 64 },
      { id: 'LDM', label: 'CDM', x: 30, y: 46 },
      { id: 'RDM', label: 'CDM', x: 73, y: 46 },
      { id: 'LAM', label: 'CAM', x: 38, y: 29 },
      { id: 'CAM', label: 'CAM', x: 52, y: 39 },
      { id: 'RAM', label: 'CAM', x: 66, y: 29 },
      { id: 'ST', label: 'ST', x: 52, y: 12 }
    ]
  },
  '3-1-4-2': {
    label: '3-1-4-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LCB', label: 'CB', x: 35, y: 68 },
      { id: 'CB', label: 'CB', x: 53, y: 58 },
      { id: 'RCB', label: 'CB', x: 72, y: 68 },
      { id: 'CDM', label: 'CDM', x: 53, y: 37 },
      { id: 'LCM', label: 'CM', x:37, y: 37 },
      { id: 'RCM', label: 'CM', x: 70, y: 37 },
      { id: 'LM', label: 'LM', x: 22, y: 40 },
      { id: 'RM', label: 'RM', x: 86, y: 40 },
      { id: 'LST', label: 'ST', x: 43, y: 17 },
      { id: 'RST', label: 'ST', x: 66, y: 17 }
    ]
  },
  '4-2-3-1-WIDE': {
    label: '4-2-3-1 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 17, y: 68 },
      { id: 'LCB', label: 'CB', x: 36, y: 70 },
      { id: 'RCB', label: 'CB', x: 68, y: 70 },
      { id: 'RB', label: 'RB', x: 85, y: 68 },
      { id: 'LDM', label: 'CDM', x: 38, y: 46 },
      { id: 'RDM', label: 'CDM', x: 65, y: 46 },
      { id: 'LM', label: 'LM', x: 22, y: 37 },
      { id: 'CAM', label: 'CAM', x: 53, y: 33 },
      { id: 'RM', label: 'RM', x: 80, y: 37 },
      { id: 'ST', label: 'ST', x: 53, y: 16 }
    ]
  },
  '4-2-4': {
    label: '4-2-4',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 17, y: 65 },
      { id: 'LCB', label: 'CB', x: 35, y: 67 },
      { id: 'RCB', label: 'CB', x: 72, y: 67 },
      { id: 'RB', label: 'RB', x: 90, y: 65 },
      { id: 'LDM', label: 'CDM', x: 40, y: 42 },
      { id: 'RDM', label: 'CDM', x: 68, y: 42 },
      { id: 'LW', label: 'LW', x: 28, y: 24 },
      { id: 'LS', label: 'ST', x: 44, y: 17 },
      { id: 'RS', label: 'ST', x: 65, y: 17 },
      { id: 'RW', label: 'RW', x: 80, y: 24 }
    ]
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 68 },
      { id: 'LCB', label: 'CB', x: 37, y: 70 },
      { id: 'RCB', label: 'CB', x: 70, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 68 },
      { id: 'LCM', label: 'CM', x: 33, y: 42 },
      { id: 'CM', label: 'CM', x: 54, y: 51 },
      { id: 'RCM', label: 'CM', x: 76, y: 42 },
      { id: 'CAM', label: 'CAM', x: 54, y: 31 },
      { id: 'LS', label: 'ST', x: 42, y: 16 },
      { id: 'RS', label: 'ST', x: 66, y: 16 }
    ]
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 19, y: 66 },
      { id: 'LCB', label: 'CB', x: 39, y: 68 },
      { id: 'RCB', label: 'CB', x: 67, y: 68 },
      { id: 'RB', label: 'RB', x: 88, y: 66 },
      { id: 'LCM', label: 'CM', x: 32, y: 48 },
      { id: 'CM', label: 'CM', x: 53, y: 48 },
      { id: 'RCM', label: 'CM', x: 77, y: 48 },
      { id: 'LAM', label: 'CAM', x: 38, y: 26 },
      { id: 'RAM', label: 'CAM', x: 68, y: 26 },
      { id: 'ST', label: 'ST', x: 53, y: 16 }
    ]
  },
  '4-3-3': {
    label: '4-3-3',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 68 },
      { id: 'LCB', label: 'CB', x: 36, y: 70 },
      { id: 'RCB', label: 'CB', x: 66, y: 70 },
      { id: 'RB', label: 'RB', x: 85, y: 68 },
      { id: 'LCM', label: 'CM', x: 34, y: 49 },
      { id: 'CM', label: 'CM', x: 53, y: 44 },
      { id: 'RCM', label: 'CM', x: 73, y: 49 },
      { id: 'LW', label: 'LW', x: 34, y: 21 },
      { id: 'ST', label: 'ST', x: 53, y: 18 },
      { id: 'RW', label: 'RW', x: 71, y: 21 }
    ]
  },
  '4-3-3-ATTACK': {
    label: '4-3-3 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 66 },
      { id: 'LCB', label: 'CB', x: 36, y: 68 },
      { id: 'RCB', label: 'CB', x: 68, y: 68 },
      { id: 'RB', label: 'RB', x: 87, y: 66 },
      { id: 'LCM', label: 'CM', x: 32, y: 43 },
      { id: 'CAM', label: 'CAM', x: 53, y: 40 },
      { id: 'RCM', label: 'CM', x: 76, y: 43 },
      { id: 'LW', label: 'LW', x: 32, y: 19 },
      { id: 'ST', label: 'ST', x: 53, y: 17 },
      { id: 'RW', label: 'RW', x: 76, y: 19 }
    ]
  },
  '4-3-3-DEFEND': {
    label: '4-3-3 Defend',  
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 17, y: 67 },
      { id: 'LCB', label: 'CB', x: 37, y: 68 },
      { id: 'RCB', label: 'CB', x: 67, y: 68 },
      { id: 'RB', label: 'RB', x: 87, y: 67 },
      { id: 'LDM', label: 'CDM', x: 29, y: 46 },
      { id: 'CM', label: 'CM', x: 53, y: 44 },
      { id: 'RDM', label: 'CDM', x: 78, y: 46 },
      { id: 'LW', label: 'LW', x: 31, y: 23 },
      { id: 'ST', label: 'ST', x: 53, y: 17 },
      { id: 'RW', label: 'RW', x: 76, y: 23 }
    ]
  },
  '4-3-3-FALSE9': {
    label: '4-3-3 False 9',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LB', label: 'LB', x: 19, y: 66 },
      { id: 'LCB', label: 'CB', x: 38, y: 70 },
      { id: 'RCB', label: 'CB', x: 69, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 66 },
      { id: 'LCM', label: 'CM', x: 35, y: 44 },
      { id: 'CM', label: 'CM', x: 54, y: 49 },
      { id: 'RCM', label: 'CM', x: 75, y: 44 },
      { id: 'LW', label: 'LW', x: 37, y: 19 },
      { id: 'CF', label: 'CF', x: 54, y: 24 },
      { id: 'RW', label: 'RW', x: 72, y: 19 }
    ]
  },
  '4-3-3-HOLDING': {
    label: '4-3-3 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 68 },
      { id: 'LCB', label: 'CB', x: 36, y: 70 },
      { id: 'RCB', label: 'CB', x: 67, y: 70 },
      { id: 'RB', label: 'RB', x: 85, y: 68 },
      { id: 'CDM', label: 'CDM', x: 53, y: 47 },
      { id: 'LCM', label: 'CM', x: 33, y: 44 },
      { id: 'RCM', label: 'CM', x: 72, y: 44 },
      { id: 'LW', label: 'LW', x: 36, y: 19 },
      { id: 'ST', label: 'ST', x: 53, y: 17 },
      { id: 'RW', label: 'RW', x: 69, y: 19 }
    ]
  },
  '4-4-1-1': {
    label: '4-4-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 86 },
      { id: 'LB', label: 'LB', x: 18, y: 66 },
      { id: 'LCB', label: 'CB', x: 39, y: 70 },
      { id: 'RCB', label: 'CB', x: 67, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 66 },
      { id: 'LM', label: 'LM', x: 25, y: 44 },
      { id: 'LCM', label: 'CM', x: 43, y: 46 },
      { id: 'RCM', label: 'CM', x: 63, y: 46 },
      { id: 'RM', label: 'RM', x: 81, y: 44 },
      { id: 'CAM', label: 'CAM', x: 53, y: 28 },
      { id: 'ST', label: 'ST', x: 53, y: 13 }
    ]
  },
  '4-4-1-1-ATTACK': {
    label: '4-4-1-1 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 66 },
      { id: 'LCB', label: 'CB', x: 36, y: 68 },
      { id: 'RCB', label: 'CB', x: 71, y: 68 },
      { id: 'RB', label: 'RB', x: 89, y: 66 },
      { id: 'LM', label: 'LM', x: 20, y: 42 },
      { id: 'LCM', label: 'CM', x: 38, y: 41 },
      { id: 'RCM', label: 'CM', x: 69, y: 41 },
      { id: 'RM', label: 'RM', x: 87, y: 42 },
      { id: 'CAM', label: 'CAM', x: 53, y: 34 },
      { id: 'ST', label: 'ST', x: 53, y: 16 }
    ]
  },
  '4-4-2-FLAT': {
    label: '4-4-2 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 55, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 64 },
      { id: 'LCB', label: 'CB', x: 41, y: 66 },
      { id: 'RCB', label: 'CB', x: 66, y: 66 },
      { id: 'RB', label: 'RB', x: 90, y: 64 },
      { id: 'LM', label: 'LM', x: 15, y: 40 },
      { id: 'LCM', label: 'CM', x: 41, y: 42 },
      { id: 'RCM', label: 'CM', x: 66, y: 42 },
      { id: 'RM', label: 'RM', x: 90, y: 40 },
      { id: 'LS', label: 'ST', x: 40, y: 16 },
      { id: 'RS', label: 'ST', x: 67, y: 16 }
    ]
  },
  '4-4-2-HOLDING': {
    label: '4-4-2 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 19, y: 65 },
      { id: 'LCB', label: 'CB', x: 43, y: 67 },
      { id: 'RCB', label: 'CB', x: 64, y: 67 },
      { id: 'RB', label: 'RB', x: 85, y: 65 },
      { id: 'LM', label: 'LM', x: 22, y: 38 },
      { id: 'LDM', label: 'CDM', x: 43, y: 43 },
      { id: 'RDM', label: 'CDM', x: 64, y: 43 },
      { id: 'RM', label: 'RM', x: 82, y: 38 },
      { id: 'LS', label: 'ST', x: 43, y: 16 },
      { id: 'RS', label: 'ST', x: 64, y: 16 }
    ]
  },
  '4-5-1': {
    label: '4-5-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 66 },
      { id: 'LCB', label: 'CB', x: 36, y: 70 },
      { id: 'RCB', label: 'CB', x: 68, y: 70 },
      { id: 'RB', label: 'RB', x: 85, y: 66 },
      { id: 'LM', label: 'LM', x: 18, y: 42 },
      { id: 'LAM', label: 'CAM', x: 35, y: 33 },
      { id: 'CM', label: 'CM', x: 52, y: 46 },
      { id: 'RAM', label: 'CAM', x: 67, y: 33 },
      { id: 'RM', label: 'RM', x: 85, y: 42 },
      { id: 'ST', label: 'ST', x: 52, y: 14 }
    ]
  },
  '4-5-1-FLAT': {
    label: '4-5-1 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 68 },
      { id: 'LCB', label: 'CB', x: 34, y: 70 },
      { id: 'RCB', label: 'CB', x: 72, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 68 },
      { id: 'LM', label: 'LM', x: 20, y: 42 },
      { id: 'LCM', label: 'CM', x: 37, y: 44 },
      { id: 'CM', label: 'CM', x: 53, y: 46 },
      { id: 'RCM', label: 'CM', x: 69, y: 44 },
      { id: 'RM', label: 'RM', x: 84, y: 42 },
      { id: 'ST', label: 'ST', x: 53, y: 17 }
    ]
  },
  '5-2-1-2': {
    label: '5-2-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LWB', label: 'LWB', x: 18, y: 61 },
      { id: 'LCB', label: 'CB', x: 37, y: 63},
      { id: 'CB', label: 'CB', x: 54, y: 63},
      { id: 'RCB', label: 'CB', x: 70, y: 63 },
      { id: 'RWB', label: 'RWB', x: 88, y: 61 },
      { id: 'LCM', label: 'CM', x: 34, y: 42 },
      { id: 'RCM', label: 'CM', x: 72, y: 42 },
      { id: 'CAM', label: 'CAM', x: 54, y: 30 },
      { id: 'LS', label: 'ST', x: 42, y: 16 },
      { id: 'RS', label: 'ST', x: 66, y: 16 }
    ]
  },
  '5-2-2-1': {
    label: '5-2-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 83 },
      { id: 'LWB', label: 'LWB', x: 12, y: 56 },
      { id: 'LCB', label: 'CB', x: 33, y: 59 },
      { id: 'CB', label: 'CB', x: 52, y: 59 },
      { id: 'RCB', label: 'CB', x: 70, y: 59 },
      { id: 'RWB', label: 'RWB', x: 89, y: 56 },
      { id: 'LCM', label: 'CM', x: 42, y: 38 },
      { id: 'RCM', label: 'CM', x: 61, y: 38 },
      { id: 'LW', label: 'LW', x: 33, y: 20 },
      { id: 'RW', label: 'RW', x: 71, y: 20 },
      { id: 'ST', label: 'ST', x: 52, y: 16 }
    ]
  },
  '5-3-2': {
    label: '5-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 83 },
      { id: 'LWB', label: 'LWB', x: 17, y: 61 },
      { id: 'LCB', label: 'CB', x: 36, y: 63 },
      { id: 'CB', label: 'CB', x: 54, y: 63 },
      { id: 'RCB', label: 'CB', x: 71, y: 63 },
      { id: 'RWB', label: 'RWB', x: 88, y: 61 },
      { id: 'LCM', label: 'CM', x: 29, y: 37 },
      { id: 'CM', label: 'CM', x: 54, y: 37 },
      { id: 'RCM', label: 'CM', x: 77, y: 37 },
      { id: 'LS', label: 'ST', x: 41, y: 17 },
      { id: 'RS', label: 'ST', x: 67, y: 17 }
    ]
  },
  '5-4-1': {
    label: '5-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 86 },
      { id: 'LWB', label: 'LWB', x: 15, y: 57 },
      { id: 'LCB', label: 'CB', x: 33, y: 63 },
      { id: 'CB', label: 'CB', x: 53, y: 67 },
      { id: 'RCB', label: 'CB', x: 73, y: 63 },
      { id: 'RWB', label: 'RWB', x: 91, y: 57 },
      { id: 'LM', label: 'LM', x: 28, y: 36 },
      { id: 'LCM', label: 'CM', x: 45, y: 39 },
      { id: 'RCM', label: 'CM', x: 61, y: 39 },
      { id: 'RM', label: 'RM', x: 78, y: 35 },
      { id: 'ST', label: 'ST', x: 53, y: 14 }
    ]
  },
  '5-4-1-HOLDING': {
    label: '5-4-1-HOLDING',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LWB', label: 'LWB', x: 14, y: 61 },
      { id: 'LCB', label: 'CB', x: 33, y: 64 },
      { id: 'CB', label: 'CB', x: 53, y: 64 },
      { id: 'RCB', label: 'CB', x: 72, y: 64 },
      { id: 'RWB', label: 'RWB', x: 89, y: 61 },
      { id: 'LM', label: 'LM', x: 29, y: 31 },
      { id: 'CDM', label: 'CDM', x: 44, y: 38 },
      { id: 'CAM', label: 'CAM', x: 66, y: 25 },
      { id: 'RM', label: 'RM', x: 78, y: 33 },
      { id: 'ST', label: 'ST', x: 53, y: 17  }
    ]
  },
  '5-4-1-DEFEND': {
    label: '5-4-1-DEFEND',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 16, y: 67 },
      { id: 'LCB', label: 'CB', x: 33, y: 60 },
      { id: 'CB', label: 'CB', x: 53, y: 57 },
      { id: 'RCB', label: 'CB', x: 72, y: 60 },
      { id: 'RB', label: 'RB', x: 89, y: 67 },
      { id: 'LM', label: 'LM', x: 23, y: 36 },
      { id: 'LCM', label: 'CM', x: 41, y: 33 },
      { id: 'RCM', label: 'CM', x: 68, y: 33 },
      { id: 'RM', label: 'RM', x: 84, y: 36 },
      { id: 'ST', label: 'ST', x: 53, y: 17  }
    ]
  },
  '4-4-1-1-FLAT': {
    label: '4-4-1-1-FLAT',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 18, y: 61 },
      { id: 'LCB', label: 'CB', x: 38, y: 64 },
      { id: 'RCB', label: 'CB', x: 69, y: 64 },
      { id: 'RB', label: 'RB', x: 88, y: 64 },
      { id: 'RCM', label: 'CM', x: 66, y: 41 },
      { id: 'LM', label: 'LM', x: 25, y: 34 },
      { id: 'LCM', label: 'CM', x: 40, y: 41 },
      { id: 'CF', label: 'CF', x: 53, y: 34 },
      { id: 'RM', label: 'RM', x: 82, y: 34 },
      { id: 'ST', label: 'ST', x: 53, y: 17  }
    ]
  }
};


// ------- MOBILE FORMATIONS (Optimized for Portrait View) -------
const mobileFormations = {
  '3-4-1-2': {
    label: '3-4-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 51, y: 84 },
      { id: 'LCB', label: 'CB', x: 22, y: 65 },
      { id: 'CB', label: 'CB', x: 51, y: 65 },
      { id: 'RCB', label: 'CB', x: 81, y: 65 },
      { id: 'LM', label: 'LM', x: 13, y: 41 },
      { id: 'LCM', label: 'CM', x: 36, y: 49 },
      { id: 'RCM', label: 'CM', x: 66, y: 49 },
      { id: 'RM', label: 'RM', x: 89, y: 41 },
      { id: 'CAM', label: 'CAM', x: 51, y: 29 },
      { id: 'LS', label: 'ST', x: 39, y: 11 },
      { id: 'RS', label: 'ST', x: 63, y: 11 }
    ]
  },
  '3-4-2-1': {
    label: '3-4-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 84 },
      { id: 'LCB', label: 'LCB', x: 22, y: 71 },
      { id: 'CB', label: 'CB', x: 50, y: 67 },
      { id: 'RCB', label: 'RCB', x: 78, y: 71 },
      { id: 'LM', label: 'LM', x: 12, y: 47 },
      { id: 'LCM', label: 'LCM', x: 32, y: 55 },
      { id: 'RCM', label: 'RCM', x: 68, y: 55 },
      { id: 'RM', label: 'RM', x: 88, y: 47 },
      { id: 'LAM', label: 'CAM', x: 32, y: 31 },
      { id: 'RAM', label: 'CAM', x: 68, y: 31 },
      { id: 'ST', label: 'ST', x: 50, y: 13 }
    ]
  },
  '3-4-3-DIAMOND': {
    label: '3-4-3 Diamond',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LCB', label: 'LCB', x: 24, y: 66 },
      { id: 'CB', label: 'CB', x: 52, y: 66 },
      { id: 'RCB', label: 'RCB', x: 80, y: 66 },
      { id: 'LM', label: 'LM', x: 17, y: 43 },
      { id: 'CDM', label: 'CDM', x: 40, y: 51 },
      { id: 'CAM', label: 'CAM', x: 64, y: 43 },
      { id: 'RM', label: 'RM', x: 87, y: 43 },
      { id: 'LW', label: 'LW', x: 30, y: 21 },
      { id: 'ST', label: 'ST', x: 52, y: 13 },
      { id: 'RW', label: 'RW', x: 74, y: 21 }
    ]
  },
  '3-4-3-FLAT': {
    label: '3-4-3 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LCB', label: 'LCB', x: 22, y: 69 },
      { id: 'CB', label: 'CB', x: 52, y: 69 },
      { id: 'RCB', label: 'RCB', x: 82, y: 69 },
      { id: 'LM', label: 'LM', x: 14, y: 46 },
      { id: 'LCM', label: 'CM', x: 37, y: 46 },
      { id: 'RCM', label: 'CM', x: 67, y: 46 },
      { id: 'RM', label: 'RM', x: 90, y: 46 },
      { id: 'LW', label: 'LW', x: 27, y: 19 },
      { id: 'ST', label: 'ST', x: 52, y: 13 },
      { id: 'RW', label: 'RW', x: 77, y: 19 }
    ]
  },
  '3-5-1-1': {
    label: '3-5-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LCB', label: 'LCB', x: 20, y: 68 },
      { id: 'CB', label: 'CB', x: 52, y: 68 },
      { id: 'RCB', label: 'RCB', x: 84, y: 68 },
      { id: 'LM', label: 'LM', x: 14, y: 40 },
      { id: 'LDM', label: 'CDM', x: 37, y: 54 },
      { id: 'CM', label: 'CM', x: 52, y: 40 },
      { id: 'RDM', label: 'CDM', x: 67, y: 54 },
      { id: 'RM', label: 'RM', x: 90, y: 40 },
      { id: 'LST', label: 'ST', x: 40, y: 16 },
      { id: 'RST', label: 'ST', x: 64, y: 16 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LCB', label: 'LCB', x: 22, y: 67 },
      { id: 'CB', label: 'CB', x: 52, y: 67 },
      { id: 'RCB', label: 'RCB', x: 82, y: 67 },
      { id: 'LM', label: 'LM', x: 14, y: 42 },
      { id: 'LDM', label: 'CDM', x: 34, y: 53 },
      { id: 'CAM', label: 'CAM', x: 52, y: 33 },
      { id: 'RDM', label: 'CDM', x: 70, y: 53 },
      { id: 'RM', label: 'RM', x: 90, y: 42 },
      { id: 'LS', label: 'ST', x: 40, y: 15 },
      { id: 'RS', label: 'ST', x: 64, y: 15 }
    ]
  },
  '4-1-2-1-2-NARROW': {
    label: '4-1-2-1-2 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 12, y: 71 },
      { id: 'LCB', label: 'CB', x: 35, y: 73 },
      { id: 'RCB', label: 'CB', x: 69, y: 73 },
      { id: 'RB', label: 'RB', x: 92, y: 71 },
      { id: 'CDM', label: 'CDM', x: 52, y: 57 },
      { id: 'LCM', label: 'CM', x: 34, y: 43 },
      { id: 'RCM', label: 'CM', x: 70, y: 43 },
      { id: 'CAM', label: 'CAM', x: 52, y: 27 },
      { id: 'LS', label: 'ST', x: 40, y: 11 },
      { id: 'RS', label: 'ST', x: 64, y: 11 }
    ]
  },
  '4-1-2-1-2-WIDE': {
    label: '4-1-2-1-2 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 12, y: 71 },
      { id: 'LCB', label: 'CB', x: 35, y: 73 },
      { id: 'RCB', label: 'CB', x: 69, y: 73 },
      { id: 'RB', label: 'RB', x: 92, y: 71 },
      { id: 'CDM', label: 'CDM', x: 52, y: 57 },
      { id: 'LM', label: 'LM', x: 17, y: 43 },
      { id: 'RM', label: 'RM', x: 87, y: 43 },
      { id: 'CAM', label: 'CAM', x: 52, y: 29 },
      { id: 'LS', label: 'ST', x: 40, y: 13 },
      { id: 'RS', label: 'ST', x: 64, y: 13 }
    ]
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'CDM', label: 'CDM', x: 52, y: 55 },
      { id: 'LM', label: 'LM', x: 20, y: 37 },
      { id: 'CM', label: 'CM', x: 52, y: 37 },
      { id: 'RM', label: 'RM', x: 84, y: 37 },
      { id: 'LS', label: 'ST', x: 40, y: 15 },
      { id: 'RS', label: 'ST', x: 64, y: 15 }
    ]
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 82 },
      { id: 'LB', label: 'LB', x: 12, y: 68 },
      { id: 'LCB', label: 'CB', x: 33, y: 68 },
      { id: 'RCB', label: 'CB', x: 67, y: 68 },
      { id: 'RB', label: 'RB', x: 88, y: 68 },
      { id: 'CDM', label: 'CDM', x: 50, y: 52 },
      { id: 'LM', label: 'LM', x: 15, y: 36 },
      { id: 'LCM', label: 'CM', x: 36, y: 36 },
      { id: 'RCM', label: 'CM', x: 64, y: 36 },
      { id: 'RM', label: 'RM', x: 85, y: 36 },
      { id: 'ST', label: 'ST', x: 50, y: 15 }
    ]
  },
  '4-2-1-3': {
    label: '4-2-1-3',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 12, y: 70 },
      { id: 'LCB', label: 'CB', x: 32, y: 72 },
      { id: 'RCB', label: 'CB', x: 68, y: 72 },
      { id: 'RB', label: 'RB', x: 90, y: 70 },
      { id: 'LDM', label: 'CDM', x: 32, y: 54 },
      { id: 'RDM', label: 'CDM', x: 68, y: 54 },
      { id: 'CAM', label: 'CAM', x: 50, y: 38 },
      { id: 'LW', label: 'LW', x: 25, y: 18 },
      { id: 'ST', label: 'ST', x: 50, y: 12 },
      { id: 'RW', label: 'RW', x: 75, y: 18 }
    ]
  },
  '4-2-1-3-WIDE': {
    label: '4-2-1-3 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 51, y: 85 },
      { id: 'LB', label: 'LB', x: 13, y: 65 },
      { id: 'LCB', label: 'CB', x: 35, y: 66 },
      { id: 'RCB', label: 'CB', x: 67, y: 66 },
      { id: 'RB', label: 'RB', x: 89, y: 64 },
      { id: 'LDM', label: 'CDM', x: 35, y: 48 },
      { id: 'RDM', label: 'CDM', x: 67, y: 48 },
      { id: 'CAM', label: 'CAM', x: 51, y: 32 },
      { id: 'LW', label: 'LW', x: 19, y: 25 },
      { id: 'ST', label: 'ST', x: 51, y: 15 },
      { id: 'RW', label: 'RW', x: 83, y: 25 }
    ]
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 82 },
      { id: 'LB', label: 'LB', x: 10, y: 71 },
      { id: 'LCB', label: 'CB', x: 33, y: 71 },
      { id: 'RCB', label: 'CB', x: 67, y: 71 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LDM', label: 'CDM', x: 35, y: 53 },
      { id: 'RDM', label: 'CDM', x: 65, y: 53 },
      { id: 'LAM', label: 'CAM', x: 27, y: 33 },
      { id: 'RAM', label: 'CAM', x: 72, y: 33 },
      { id: 'LS', label: 'ST', x: 38, y: 13 },
      { id: 'RS', label: 'ST', x: 62, y: 13 }
    ]
  },
  '4-2-3-1-NARROW': {
    label: '4-2-3-1 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 82 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 35, y: 71 },
      { id: 'RCB', label: 'CB', x: 69, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LDM', label: 'CDM', x: 27, y: 51 },
      { id: 'RDM', label: 'CDM', x: 77, y: 51 },
      { id: 'LAM', label: 'CAM', x: 32, y: 31 },
      { id: 'CAM', label: 'CAM', x: 52, y: 39 },
      { id: 'RAM', label: 'CAM', x: 72, y: 31 },
      { id: 'ST', label: 'ST', x: 52, y: 13 }
    ]
  },
  '3-1-4-2': {
    label: '3-1-4-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 77 },
      { id: 'LCB', label: 'CB', x: 27, y: 60 },
      { id: 'CB', label: 'CB', x: 52, y: 54 },
      { id: 'RCB', label: 'CB', x: 77, y: 60 },
      { id: 'CDM', label: 'CDM', x: 52, y: 36 },
      { id: 'LCM', label: 'CM', x: 32, y: 36 },
      { id: 'RCM', label: 'CM', x: 72, y: 36 },
      { id: 'LM', label: 'LM', x: 14, y: 38 },
      { id: 'RM', label: 'RM', x: 90, y: 38 },
      { id: 'LST', label: 'ST', x: 40, y: 13 },
      { id: 'RST', label: 'ST', x: 64, y: 13 }
    ]
  },
  '4-2-3-1-WIDE': {
    label: '4-2-3-1 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 71 },
      { id: 'LCB', label: 'CB', x: 34, y: 73 },
      { id: 'RCB', label: 'CB', x: 70, y: 73 },
      { id: 'RB', label: 'RB', x: 92, y: 71 },
      { id: 'LDM', label: 'CDM', x: 34, y: 53 },
      { id: 'RDM', label: 'CDM', x: 70, y: 53 },
      { id: 'LM', label: 'LM', x: 17, y: 39 },
      { id: 'CAM', label: 'CAM', x: 52, y: 35 },
      { id: 'RM', label: 'RM', x: 87, y: 39 },
      { id: 'ST', label: 'ST', x: 52, y: 15 }
    ]
  },
  '4-2-4': {
    label: '4-2-4',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 10, y: 69 },
      { id: 'LCB', label: 'CB', x: 30, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 90, y: 69 },
      { id: 'LDM', label: 'CDM', x: 32, y: 49 },
      { id: 'RDM', label: 'CDM', x: 68, y: 49 },
      { id: 'LW', label: 'LW', x: 18, y: 25 },
      { id: 'LS', label: 'ST', x: 38, y: 13 },
      { id: 'RS', label: 'ST', x: 62, y: 13 },
      { id: 'RW', label: 'RW', x: 82, y: 25 }
    ]
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 84 },
      { id: 'LB', label: 'LB', x: 10, y: 71 },
      { id: 'LCB', label: 'CB', x: 32, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LCM', label: 'CM', x: 28, y: 49 },
      { id: 'CM', label: 'CM', x: 50, y: 55 },
      { id: 'RCM', label: 'CM', x: 72, y: 49 },
      { id: 'CAM', label: 'CAM', x: 50, y: 33 },
      { id: 'LS', label: 'ST', x: 38, y: 13 },
      { id: 'RS', label: 'ST', x: 62, y: 13 }
    ]
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 14, y: 69 },
      { id: 'LCB', label: 'CB', x: 35, y: 71 },
      { id: 'RCB', label: 'CB', x: 69, y: 71 },
      { id: 'RB', label: 'RB', x: 90, y: 69 },
      { id: 'LCM', label: 'CM', x: 27, y: 51 },
      { id: 'CM', label: 'CM', x: 52, y: 51 },
      { id: 'RCM', label: 'CM', x: 77, y: 51 },
      { id: 'LAM', label: 'CAM', x: 34, y: 29 },
      { id: 'RAM', label: 'CAM', x: 70, y: 29 },
      { id: 'ST', label: 'ST', x: 52, y: 11 }
    ]
  },
  '4-3-3': {
    label: '4-3-3',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 12, y: 62 },
      { id: 'LCB', label: 'CB', x: 34, y: 64 },
      { id: 'RCB', label: 'CB', x: 70, y: 64 },
      { id: 'RB', label: 'RB', x: 92, y: 62 },
      { id: 'LCM', label: 'CM', x: 30, y: 35 },
      { id: 'CM', label: 'CM', x: 52, y: 31 },
      { id: 'RCM', label: 'CM', x: 74, y: 35 },
      { id: 'LW', label: 'LW', x: 27, y: 18 },
      { id: 'ST', label: 'ST', x: 52, y: 12 },
      { id: 'RW', label: 'RW', x: 77, y: 18 }
    ]
  },
  '4-3-3-ATTACK': {
    label: '4-3-3 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LCM', label: 'CM', x: 27, y: 49 },
      { id: 'CAM', label: 'CAM', x: 52, y: 35 },
      { id: 'RCM', label: 'CM', x: 77, y: 49 },
      { id: 'LW', label: 'LW', x: 27, y: 19 },
      { id: 'ST', label: 'ST', x: 52, y: 13 },
      { id: 'RW', label: 'RW', x: 77, y: 19 }
    ]
  },
  '4-3-3-DEFEND': {
    label: '4-3-3 Defend',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LDM', label: 'CDM', x: 24, y: 48 },
      { id: 'CM', label: 'CM', x: 52, y: 44 },
      { id: 'RDM', label: 'CDM', x: 80, y: 48 },
      { id: 'LW', label: 'LW', x: 26, y: 25 },
      { id: 'ST', label: 'ST', x: 52, y: 15 },
      { id: 'RW', label: 'RW', x: 78, y: 25 }
    ]
  },
  '4-3-3-FALSE9': {
    label: '4-3-3 False 9',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 14, y: 66 },
      { id: 'LCB', label: 'CB', x: 35, y: 70 },
      { id: 'RCB', label: 'CB', x: 69, y: 70 },
      { id: 'RB', label: 'RB', x: 90, y: 66 },
      { id: 'LCM', label: 'CM', x: 30, y: 44 },
      { id: 'CM', label: 'CM', x: 52, y: 48 },
      { id: 'RCM', label: 'CM', x: 74, y: 44 },
      { id: 'LW', label: 'LW', x: 30, y: 18 },
      { id: 'CF', label: 'CF', x: 52, y: 24 },
      { id: 'RW', label: 'RW', x: 74, y: 18 }
    ]
  },
  '4-3-3-HOLDING': {
    label: '4-3-3 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'CDM', label: 'CDM', x: 52, y: 47 },
      { id: 'LCM', label: 'CM', x: 30, y: 43 },
      { id: 'RCM', label: 'CM', x: 74, y: 43 },
      { id: 'LW', label: 'LW', x: 30, y: 21 },
      { id: 'ST', label: 'ST', x: 52, y: 13 },
      { id: 'RW', label: 'RW', x: 74, y: 21 }
    ]
  },
  '4-4-1-1': {
    label: '4-4-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 73 },
      { id: 'RCB', label: 'CB', x: 70, y: 73 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LM', label: 'LM', x: 17, y: 49 },
      { id: 'LCM', label: 'CM', x: 37, y: 53 },
      { id: 'RCM', label: 'CM', x: 67, y: 53 },
      { id: 'RM', label: 'RM', x: 87, y: 49 },
      { id: 'CAM', label: 'CAM', x: 52, y: 29 },
      { id: 'ST', label: 'ST', x: 52, y: 12 }
    ]
  },
  '4-4-1-1-ATTACK': {
    label: '4-4-1-1 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 34, y: 71 },
      { id: 'RCB', label: 'CB', x: 70, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LM', label: 'LM', x: 14, y: 44 },
      { id: 'LCM', label: 'CM', x: 35, y: 46 },
      { id: 'RCM', label: 'CM', x: 69, y: 46 },
      { id: 'RM', label: 'RM', x: 90, y: 44 },
      { id: 'CAM', label: 'CAM', x: 52, y: 33 },
      { id: 'ST', label: 'ST', x: 52, y: 13 }
    ]
  },
  '4-4-2-FLAT': {
    label: '4-4-2 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 69 },
      { id: 'LCB', label: 'CB', x: 37, y: 71 },
      { id: 'RCB', label: 'CB', x: 67, y: 71 },
      { id: 'RB', label: 'RB', x: 92, y: 69 },
      { id: 'LM', label: 'LM', x: 12, y: 45 },
      { id: 'LCM', label: 'CM', x: 37, y: 47 },
      { id: 'RCM', label: 'CM', x: 67, y: 47 },
      { id: 'RM', label: 'RM', x: 92, y: 45 },
      { id: 'LS', label: 'ST', x: 37, y: 17 },
      { id: 'RS', label: 'ST', x: 67, y: 17 }
    ]
  },
  '4-4-2-HOLDING': {
    label: '4-4-2 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 14, y: 65 },
      { id: 'LCB', label: 'CB', x: 38, y: 67 },
      { id: 'RCB', label: 'CB', x: 66, y: 67 },
      { id: 'RB', label: 'RB', x: 90, y: 65 },
      { id: 'LM', label: 'LM', x: 17, y: 41 },
      { id: 'LDM', label: 'CDM', x: 38, y: 47 },
      { id: 'RDM', label: 'CDM', x: 66, y: 47 },
      { id: 'RM', label: 'RM', x: 87, y: 41 },
      { id: 'LS', label: 'ST', x: 38, y: 19 },
      { id: 'RS', label: 'ST', x: 66, y: 19 }
    ]
  },
  '4-5-1': {
    label: '4-5-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 65 },
      { id: 'LCB', label: 'CB', x: 34, y: 69 },
      { id: 'RCB', label: 'CB', x: 70, y: 69 },
      { id: 'RB', label: 'RB', x: 92, y: 65 },
      { id: 'LM', label: 'LM', x: 14, y: 43 },
      { id: 'LAM', label: 'CAM', x: 32, y: 33 },
      { id: 'CM', label: 'CM', x: 52, y: 47 },
      { id: 'RAM', label: 'CAM', x: 72, y: 33 },
      { id: 'RM', label: 'RM', x: 90, y: 43 },
      { id: 'ST', label: 'ST', x: 52, y: 15 }
    ]
  },
  '4-5-1-FLAT': {
    label: '4-5-1 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 83 },
      { id: 'LB', label: 'LB', x: 12, y: 65 },
      { id: 'LCB', label: 'CB', x: 32, y: 67 },
      { id: 'RCB', label: 'CB', x: 72, y: 67 },
      { id: 'RB', label: 'RB', x: 92, y: 65 },
      { id: 'LM', label: 'LM', x: 14, y: 39 },
      { id: 'LCM', label: 'CM', x: 34, y: 43 },
      { id: 'CM', label: 'CM', x: 52, y: 45 },
      { id: 'RCM', label: 'CM', x: 70, y: 43 },
      { id: 'RM', label: 'RM', x: 90, y: 39 },
      { id: 'ST', label: 'ST', x: 52, y: 15 }
    ]
  },
  '5-2-1-2': {
    label: '5-2-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LWB', label: 'LWB', x: 14, y: 65 },
      { id: 'LCB', label: 'CB', x: 34, y: 69 },
      { id: 'CB', label: 'CB', x: 52, y: 69 },
      { id: 'RCB', label: 'CB', x: 70, y: 69 },
      { id: 'RWB', label: 'RWB', x: 90, y: 65 },
      { id: 'LCM', label: 'CM', x: 32, y: 47 },
      { id: 'RCM', label: 'CM', x: 72, y: 47 },
      { id: 'CAM', label: 'CAM', x: 52, y: 31 },
      { id: 'LS', label: 'ST', x: 40, y: 13 },
      { id: 'RS', label: 'ST', x: 64, y: 13 }
    ]
  },
  '5-2-2-1': {
    label: '5-2-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 84 },
      { id: 'LWB', label: 'LWB', x: 8, y: 61 },
      { id: 'LCB', label: 'CB', x: 28, y: 67 },
      { id: 'CB', label: 'CB', x: 50, y: 67 },
      { id: 'RCB', label: 'CB', x: 72, y: 67 },
      { id: 'RWB', label: 'RWB', x: 92, y: 61 },
      { id: 'LCM', label: 'CM', x: 36, y: 45 },
      { id: 'RCM', label: 'CM', x: 64, y: 45 },
      { id: 'LW', label: 'LW', x: 28, y: 23 },
      { id: 'RW', label: 'RW', x: 72, y: 23 },
      { id: 'ST', label: 'ST', x: 50, y: 11 }
    ]
  },
  '5-3-2': {
    label: '5-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LWB', label: 'LWB', x: 12, y: 65 },
      { id: 'LCB', label: 'CB', x: 34, y: 69 },
      { id: 'CB', label: 'CB', x: 52, y: 69 },
      { id: 'RCB', label: 'CB', x: 70, y: 69 },
      { id: 'RWB', label: 'RWB', x: 92, y: 65 },
      { id: 'LCM', label: 'CM', x: 24, y: 43 },
      { id: 'CM', label: 'CM', x: 52, y: 43 },
      { id: 'RCM', label: 'CM', x: 80, y: 43 },
      { id: 'LS', label: 'ST', x: 38, y: 17 },
      { id: 'RS', label: 'ST', x: 66, y: 17 }
    ]
  },
  '5-4-1': {
    label: '5-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 82 },
      { id: 'LWB', label: 'LWB', x: 8, y: 55 },
      { id: 'LCB', label: 'CB', x: 26, y: 61 },
      { id: 'CB', label: 'CB', x: 50, y: 65 },
      { id: 'RCB', label: 'CB', x: 74, y: 61 },
      { id: 'RWB', label: 'RWB', x: 92, y: 55 },
      { id: 'LM', label: 'LM', x: 18, y: 35 },
      { id: 'LCM', label: 'CM', x: 36, y: 41 },
      { id: 'RCM', label: 'CM', x: 64, y: 41 },
      { id: 'RM', label: 'RM', x: 82, y: 35 },
      { id: 'ST', label: 'ST', x: 50, y: 15 }
    ]
  },
  '5-4-1-HOLDING': {
    label: '5-4-1-HOLDING',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LWB', label: 'LWB', x: 12, y: 65 },
      { id: 'LCB', label: 'CB', x: 30, y: 69 },
      { id: 'CB', label: 'CB', x: 52, y: 69 },
      { id: 'RCB', label: 'CB', x: 74, y: 69 },
      { id: 'RWB', label: 'RWB', x: 92, y: 65 },
      { id: 'LM', label: 'LM', x: 24, y: 39 },
      { id: 'CDM', label: 'CDM', x: 40, y: 47 },
      { id: 'CAM', label: 'CAM', x: 64, y: 33 },
      { id: 'RM', label: 'RM', x: 80, y: 41 },
      { id: 'ST', label: 'ST', x: 52, y: 15 }
    ]
  },
  '5-4-1-DEFEND': {
    label: '5-4-1-DEFEND',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 12, y: 71 },
      { id: 'LCB', label: 'CB', x: 30, y: 65 },
      { id: 'CB', label: 'CB', x: 52, y: 61 },
      { id: 'RCB', label: 'CB', x: 74, y: 65 },
      { id: 'RB', label: 'RB', x: 92, y: 71 },
      { id: 'LM', label: 'LM', x: 18, y: 43 },
      { id: 'LCM', label: 'CM', x: 37, y: 39 },
      { id: 'RCM', label: 'CM', x: 67, y: 39 },
      { id: 'RM', label: 'RM', x: 86, y: 43 },
      { id: 'ST', label: 'ST', x: 52, y: 17 }
    ]
  },
  '4-4-1-1-FLAT': {
    label: '4-4-1-1-FLAT',
    slots: [
      { id: 'GK', label: 'GK', x: 48, y: 82 },
      { id: 'LB', label: 'LB', x: 10, y: 63 },
      { id: 'LCB', label: 'CB', x: 31, y: 67 },
      { id: 'RCB', label: 'CB', x: 65, y: 67 },
      { id: 'RB', label: 'RB', x: 86, y: 63 },
      { id: 'RCM', label: 'CM', x: 60, y: 45 },
      { id: 'LM', label: 'LM', x: 16, y: 35 },
      { id: 'LCM', label: 'CM', x: 33, y: 45 },
      { id: 'CF', label: 'CF', x: 48, y: 35 },
      { id: 'RM', label: 'RM', x: 80, y: 35 },
      { id: 'ST', label: 'ST', x: 48, y: 15 }
    ]
  },
};


// ------- TABLET FORMATIONS (Optimized for Portrait Tablets 481-1024px) -------
const tabletFormations = {
  '3-4-1-2': {
    label: '3-4-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 88 },
      { id: 'LCB', label: 'CB', x: 24, y: 70 },
      { id: 'CB', label: 'CB', x: 52, y: 70 },
      { id: 'RCB', label: 'CB', x: 80, y: 70 },
      { id: 'LM', label: 'LM', x: 17, y: 45 },
      { id: 'LCM', label: 'CM', x: 37, y: 54 },
      { id: 'RCM', label: 'CM', x: 67, y: 54 },
      { id: 'RM', label: 'RM', x: 87, y: 45 },
      { id: 'CAM', label: 'CAM', x: 52, y: 36 },
      { id: 'LS', label: 'ST', x: 42, y: 20 },
      { id: 'RS', label: 'ST', x: 62, y: 20 }
    ]
  },
  '3-4-2-1': {
    label: '3-4-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 55, y: 86 },
      { id: 'LCB', label: 'LCB', x: 29, y: 70 },
      { id: 'CB', label: 'CB', x: 55, y: 66 },
      { id: 'RCB', label: 'RCB', x: 81, y: 70 },
      { id: 'LM', label: 'LM', x: 20, y: 46 },
      { id: 'LCM', label: 'LCM', x: 39, y: 54 },
      { id: 'RCM', label: 'RCM', x: 71, y: 54 },
      { id: 'RM', label: 'RM', x: 90, y: 46 },
      { id: 'LAM', label: 'CAM', x: 39, y: 32 },
      { id: 'RAM', label: 'CAM', x: 71, y: 32 },
      { id: 'ST', label: 'ST', x: 55, y: 20 }
    ]
  },
  '3-4-3-DIAMOND': {
    label: '3-4-3 Diamond',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 87 },
      { id: 'LCB', label: 'LCB', x: 27, y: 69 },
      { id: 'CB', label: 'CB', x: 53, y: 70 },
      { id: 'RCB', label: 'RCB', x: 79, y: 70 },
      { id: 'LM', label: 'LM', x: 21, y: 49 },
      { id: 'CDM', label: 'CDM', x: 43, y: 57 },
      { id: 'CAM', label: 'CAM', x: 63, y: 49 },
      { id: 'RM', label: 'RM', x: 85, y: 49 },
      { id: 'LW', label: 'LW', x: 33, y: 27 },
      { id: 'ST', label: 'ST', x: 53, y: 27 },
      { id: 'RW', label: 'RW', x: 73, y: 27 }
    ]
  },
  '3-4-3-FLAT': {
    label: '3-4-3 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 86 },
      { id: 'LCB', label: 'LCB', x: 25, y: 70 },
      { id: 'CB', label: 'CB', x: 53, y: 70 },
      { id: 'RCB', label: 'RCB', x: 81, y: 70 },
      { id: 'LM', label: 'LM', x: 18, y: 48 },
      { id: 'LCM', label: 'CM', x: 38, y: 48 },
      { id: 'RCM', label: 'CM', x: 68, y: 48 },
      { id: 'RM', label: 'RM', x: 88, y: 48 },
      { id: 'LW', label: 'LW', x: 31, y: 24 },
      { id: 'ST', label: 'ST', x: 53, y: 20 },
      { id: 'RW', label: 'RW', x: 75, y: 24 }
    ]
  },
  '3-5-1-1': {
    label: '3-5-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LCB', label: 'LCB', x: 22, y: 68 },
      { id: 'CB', label: 'CB', x: 52, y: 68 },
      { id: 'RCB', label: 'RCB', x: 82, y: 68 },
      { id: 'LM', label: 'LM', x: 17, y: 42 },
      { id: 'LDM', label: 'CDM', x: 35, y: 56 },
      { id: 'CM', label: 'CM', x: 52, y: 42 },
      { id: 'RDM', label: 'CDM', x: 66, y: 56 },
      { id: 'RM', label: 'RM', x: 87, y: 42 },
      { id: 'LST', label: 'ST', x: 42, y: 22 },
      { id: 'RST', label: 'ST', x: 64, y: 22 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 88 },
      { id: 'LCB', label: 'LCB', x: 22, y: 72 },
      { id: 'CB', label: 'CB', x: 50, y: 72 },
      { id: 'RCB', label: 'RCB', x: 78, y: 72 },
      { id: 'LM', label: 'LM', x: 15, y: 50 },
      { id: 'LDM', label: 'CDM', x: 35, y: 58 },
      { id: 'CAM', label: 'CAM', x: 50, y: 44 },
      { id: 'RDM', label: 'CDM', x: 65, y: 58 },
      { id: 'RM', label: 'RM', x: 85, y: 50 },
      { id: 'LS', label: 'ST', x: 40, y: 24 },
      { id: 'RS', label: 'ST', x: 60, y: 24 }
    ]
  },
  '4-1-2-1-2-NARROW': {
    label: '4-1-2-1-2 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 87 },
      { id: 'LB', label: 'LB', x: 15, y: 73 },
      { id: 'LCB', label: 'CB', x: 38, y: 75 },
      { id: 'RCB', label: 'CB', x: 68, y: 75 },
      { id: 'RB', label: 'RB', x: 91, y: 73 },
      { id: 'CDM', label: 'CDM', x: 53, y: 60 },
      { id: 'LCM', label: 'CM', x: 37, y: 47 },
      { id: 'RCM', label: 'CM', x: 69, y: 47 },
      { id: 'CAM', label: 'CAM', x: 53, y: 33 },
      { id: 'LS', label: 'ST', x: 43, y: 18 },
      { id: 'RS', label: 'ST', x: 63, y: 18 }
    ]
  },
  '4-1-2-1-2-WIDE': {
    label: '4-1-2-1-2 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 74 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'CDM', label: 'CDM', x: 52, y: 57 },
      { id: 'LM', label: 'LM', x: 21, y: 46 },
      { id: 'RM', label: 'RM', x: 84, y: 46 },
      { id: 'CAM', label: 'CAM', x: 52, y: 34 },
      { id: 'LS', label: 'ST', x: 42, y: 20 },
      { id: 'RS', label: 'ST', x: 62, y: 20 }
    ]
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'CDM', label: 'CDM', x: 52, y: 57 },
      { id: 'LM', label: 'LM', x: 22, y: 43 },
      { id: 'CM', label: 'CM', x: 52, y: 43 },
      { id: 'RM', label: 'RM', x: 82, y: 43 },
      { id: 'LS', label: 'ST', x: 42, y: 21 },
      { id: 'RS', label: 'ST', x: 62, y: 21 }
    ]
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 16, y: 73 },
      { id: 'LCB', label: 'CB', x: 37, y: 73 },
      { id: 'RCB', label: 'CB', x: 67, y: 73 },
      { id: 'RB', label: 'RB', x: 88, y: 73 },
      { id: 'CDM', label: 'CDM', x: 52, y: 56 },
      { id: 'LM', label: 'LM', x: 20, y: 41 },
      { id: 'LCM', label: 'CM', x: 40, y: 41 },
      { id: 'RCM', label: 'CM', x: 64, y: 41 },
      { id: 'RM', label: 'RM', x: 84, y: 41 },
      { id: 'ST', label: 'ST', x: 52, y: 21 }
    ]
  },
  '4-2-1-3': {
    label: '4-2-1-3',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LDM', label: 'CDM', x: 36, y: 56 },
      { id: 'RDM', label: 'CDM', x: 68, y: 56 },
      { id: 'CAM', label: 'CAM', x: 52, y: 42 },
      { id: 'LW', label: 'LW', x: 30, y: 24 },
      { id: 'ST', label: 'ST', x: 52, y: 20 },
      { id: 'RW', label: 'RW', x: 74, y: 24 }
    ]
  },
  '4-2-1-3-WIDE': {
    label: '4-2-1-3 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 84 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 69, y: 74 },
      { id: 'RB', label: 'RB', x: 91, y: 72 },
      { id: 'LDM', label: 'CDM', x: 37, y: 56 },
      { id: 'RDM', label: 'CDM', x: 69, y: 56 },
      { id: 'CAM', label: 'CAM', x: 53, y: 40 },
      { id: 'LW', label: 'LW', x: 21  , y: 26 },
      { id: 'ST', label: 'ST', x: 53, y: 18 },
      { id: 'RW', label: 'RW', x: 85, y: 26 }
    ]
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 74 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LDM', label: 'CDM', x: 40, y: 56 },
      { id: 'RDM', label: 'CDM', x: 64, y: 56 },
      { id: 'LAM', label: 'CAM', x: 32, y: 38 },
      { id: 'RAM', label: 'CAM', x: 72, y: 38 },
      { id: 'LS', label: 'ST', x: 42, y: 20 },
      { id: 'RS', label: 'ST', x: 62, y: 20 }
    ]
  },
  '4-2-3-1-NARROW': {
    label: '4-2-3-1 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 72 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LDM', label: 'CDM', x: 30, y: 54 },
      { id: 'RDM', label: 'CDM', x: 74, y: 54 },
      { id: 'LAM', label: 'CAM', x: 34, y: 36 },
      { id: 'CAM', label: 'CAM', x: 52, y: 44 },
      { id: 'RAM', label: 'CAM', x: 70, y: 36 },
      { id: 'ST', label: 'ST', x: 52, y: 20 }
    ]
  },
  '3-1-4-2': {
    label: '3-1-4-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 82 },
      { id: 'LCB', label: 'CB', x: 31, y: 68 },
      { id: 'CB', label: 'CB', x: 53, y: 62 },
      { id: 'RCB', label: 'CB', x: 75, y: 68 },
      { id: 'CDM', label: 'CDM', x: 53, y: 44 },
      { id: 'LCM', label: 'CM', x: 35, y: 44 },
      { id: 'RCM', label: 'CM', x: 71, y: 44 },
      { id: 'LM', label: 'LM', x: 18, y: 46 },
      { id: 'RM', label: 'RM', x: 88, y: 46 },
      { id: 'LST', label: 'ST', x: 43, y: 20 },
      { id: 'RST', label: 'ST', x: 63, y: 20 }
    ]
  },
  '4-2-3-1-WIDE': {
    label: '4-2-3-1 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 83 },
      { id: 'LB', label: 'LB', x: 15, y: 71 },
      { id: 'LCB', label: 'CB', x: 37, y: 73 },
      { id: 'RCB', label: 'CB', x: 69, y: 73 },
      { id: 'RB', label: 'RB', x: 91, y: 71 },
      { id: 'LDM', label: 'CDM', x: 37, y: 53 },
      { id: 'RDM', label: 'CDM', x: 69, y: 53 },
      { id: 'LM', label: 'LM', x: 21, y: 41 },
      { id: 'CAM', label: 'CAM', x: 53, y: 37 },
      { id: 'RM', label: 'RM', x: 86, y: 41 },
      { id: 'ST', label: 'ST', x: 53, y: 19 }
    ]
  },
  '4-2-4': {
    label: '4-2-4',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 72 },
      { id: 'LCB', label: 'CB', x: 34, y: 74 },
      { id: 'RCB', label: 'CB', x: 70, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LDM', label: 'CDM', x: 36, y: 54 },
      { id: 'RDM', label: 'CDM', x: 68, y: 54 },
      { id: 'LW', label: 'LW', x: 22, y: 32 },
      { id: 'LS', label: 'ST', x: 42, y: 20 },
      { id: 'RS', label: 'ST', x: 62, y: 20 },
      { id: 'RW', label: 'RW', x: 82, y: 32 }
    ]
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 74 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LCM', label: 'CM', x: 32, y: 53 },
      { id: 'CM', label: 'CM', x: 52, y: 58 },
      { id: 'RCM', label: 'CM', x: 72, y: 54 },
      { id: 'CAM', label: 'CAM', x: 52, y: 38 },
      { id: 'LS', label: 'ST', x: 42, y: 20 },
      { id: 'RS', label: 'ST', x: 62, y: 20 }
    ]
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 16, y: 72 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LCM', label: 'CM', x: 30, y: 54 },
      { id: 'CM', label: 'CM', x: 52, y: 54 },
      { id: 'RCM', label: 'CM', x: 74, y: 54 },
      { id: 'LAM', label: 'CAM', x: 36, y: 34 },
      { id: 'RAM', label: 'CAM', x: 68, y: 34 },
      { id: 'ST', label: 'ST', x: 52, y: 20 }
    ]
  },
  '4-3-3': {
    label: '4-3-3',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 84 },
      { id: 'LB', label: 'LB', x: 14, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LCM', label: 'CM', x: 32, y: 54 },
      { id: 'CM', label: 'CM', x: 52, y: 50 },
      { id: 'RCM', label: 'CM', x: 72, y: 54 },
      { id: 'LW', label: 'LW', x: 30, y: 26 },
      { id: 'ST', label: 'ST', x: 52, y: 20 },
      { id: 'RW', label: 'RW', x: 74, y: 26 }
    ]
  },
  '4-3-3-ATTACK': {
    label: '4-3-3 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LCM', label: 'CM', x: 30, y: 53 },
      { id: 'CAM', label: 'CAM', x: 52, y: 47 },
      { id: 'RCM', label: 'CM', x: 74, y: 53 },
      { id: 'LW', label: 'LW', x: 30, y: 25 },
      { id: 'ST', label: 'ST', x: 52, y: 19 },
      { id: 'RW', label: 'RW', x: 74, y: 25 }
    ]
  },
  '4-3-3-DEFEND': {
    label: '4-3-3 Defend',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LDM', label: 'CDM', x: 26, y: 52 },
      { id: 'CM', label: 'CM', x: 52, y: 48 },
      { id: 'RDM', label: 'CDM', x: 78, y: 52 },
      { id: 'LW', label: 'LW', x: 28, y: 29 },
      { id: 'ST', label: 'ST', x: 52, y: 21 },
      { id: 'RW', label: 'RW', x: 76, y: 29 }
    ]
  },
  '4-3-3-FALSE9': {
    label: '4-3-3 False 9',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 84 },
      { id: 'LB', label: 'LB', x: 17, y: 65 },
      { id: 'LCB', label: 'CB', x: 38, y: 69 },
      { id: 'RCB', label: 'CB', x: 68, y: 69 },
      { id: 'RB', label: 'RB', x: 89, y: 65 },
      { id: 'LCM', label: 'CM', x: 33, y: 47 },
      { id: 'CM', label: 'CM', x: 53, y: 51 },
      { id: 'RCM', label: 'CM', x: 73, y: 47 },
      { id: 'LW', label: 'LW', x: 33, y: 23 },
      { id: 'CF', label: 'CF', x: 53, y: 29 },
      { id: 'RW', label: 'RW', x: 73, y: 23 }
    ]
  },
  '4-3-3-HOLDING': {
    label: '4-3-3 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'CDM', label: 'CDM', x: 52, y: 53 },
      { id: 'LCM', label: 'CM', x: 32, y: 49 },
      { id: 'RCM', label: 'CM', x: 72, y: 49 },
      { id: 'LW', label: 'LW', x: 32, y: 27 },
      { id: 'ST', label: 'ST', x: 52, y: 19 },
      { id: 'RW', label: 'RW', x: 72, y: 27 }
    ]
  },
  '4-4-1-1': {
    label: '4-4-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 69 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 69 },
      { id: 'LM', label: 'LM', x: 20, y: 48 },
      { id: 'LCM', label: 'CM', x: 40, y: 52 },
      { id: 'RCM', label: 'CM', x: 64, y: 52 },
      { id: 'RM', label: 'RM', x: 84, y: 48 },
      { id: 'CAM', label: 'CAM', x: 52, y: 33 },
      { id: 'ST', label: 'ST', x: 52, y: 18 }
    ]
  },
  '4-4-1-1-ATTACK': {
    label: '4-4-1-1 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 87 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LM', label: 'LM', x: 17, y: 51 },
      { id: 'LCM', label: 'CM', x: 37, y: 55 },
      { id: 'RCM', label: 'CM', x: 67, y: 55 },
      { id: 'RM', label: 'RM', x: 87, y: 51 },
      { id: 'CAM', label: 'CAM', x: 52, y: 37 },
      { id: 'ST', label: 'ST', x: 52, y: 19 }
    ]
  },
  '4-4-2-FLAT': {
    label: '4-4-2 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 87 },
      { id: 'LB', label: 'LB', x: 14, y: 68 },
      { id: 'LCB', label: 'CB', x: 40, y: 70 },
      { id: 'RCB', label: 'CB', x: 64, y: 70 },
      { id: 'RB', label: 'RB', x: 90, y: 68 },
      { id: 'LM', label: 'LM', x: 14, y: 44 },
      { id: 'LCM', label: 'CM', x: 40, y: 48 },
      { id: 'RCM', label: 'CM', x: 64, y: 48 },
      { id: 'RM', label: 'RM', x: 90, y: 44 },
      { id: 'LST', label: 'ST', x: 40, y: 22 },
      { id: 'RST', label: 'ST', x: 64, y: 22 }
    ]
  },
  '4-4-2-HOLDING': {
    label: '4-4-2 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 16, y: 68 },
      { id: 'LCB', label: 'CB', x: 40, y: 70 },
      { id: 'RCB', label: 'CB', x: 64, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 68 },
      { id: 'LM', label: 'LM', x: 20, y: 44 },
      { id: 'LDM', label: 'CDM', x: 40, y: 50 },
      { id: 'RDM', label: 'CDM', x: 64, y: 50 },
      { id: 'RM', label: 'RM', x: 84, y: 46 },
      { id: 'LS', label: 'ST', x: 40, y: 22 },
      { id: 'RS', label: 'ST', x: 64, y: 22 }
    ]
  },
  '4-5-1': {
    label: '4-5-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LB', label: 'LB', x: 14, y: 69 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 69 },
      { id: 'LM', label: 'LM', x: 17, y: 49 },
      { id: 'LAM', label: 'CAM', x: 34, y: 39 },
      { id: 'CM', label: 'CM', x: 52, y: 53 },
      { id: 'RAM', label: 'CAM', x: 70, y: 39 },
      { id: 'RM', label: 'RM', x: 87, y: 49 },
      { id: 'ST', label: 'ST', x: 52, y: 39 }
    ]
  },
  '4-5-1-FLAT': {
    label: '4-5-1 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 51, y: 85 },
      { id: 'LB', label: 'LB', x: 13, y: 69 },
      { id: 'LCB', label: 'CB', x: 33, y: 71 },
      { id: 'RCB', label: 'CB', x: 69, y: 71 },
      { id: 'RB', label: 'RB', x: 89, y: 69 },
      { id: 'LM', label: 'LM', x: 16, y: 47 },
      { id: 'LCM', label: 'CM', x: 35, y: 49 },
      { id: 'CM', label: 'CM', x: 51, y: 51 },
      { id: 'RCM', label: 'CM', x: 67, y: 49 },
      { id: 'RM', label: 'RM', x: 86, y: 47 },
      { id: 'ST', label: 'ST', x: 51, y: 23 }
    ]
  },
  '5-2-1-2': {
    label: '5-2-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LWB', label: 'LWB', x: 16, y: 69 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'CB', label: 'CB', x: 52, y: 73 },
      { id: 'RCB', label: 'CB', x: 68, y: 73 },
      { id: 'RWB', label: 'RWB', x: 88, y: 69 },
      { id: 'LCM', label: 'CM', x: 34, y: 51 },
      { id: 'RCM', label: 'CM', x: 70, y: 51 },
      { id: 'CAM', label: 'CAM', x: 52, y: 35 },
      { id: 'LS', label: 'ST', x: 42, y: 19 },
      { id: 'RS', label: 'ST', x: 62, y: 19 }
    ]
  },
  '5-2-2-1': {
    label: '5-2-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LWB', label: 'LWB', x: 13, y: 65 },
      { id: 'LCB', label: 'CB', x: 32, y: 71 },
      { id: 'CB', label: 'CB', x: 52, y: 71 },
      { id: 'RCB', label: 'CB', x: 72, y: 71 },
      { id: 'RWB', label: 'RWB', x: 92, y: 65 },
      { id: 'LCM', label: 'CM', x: 40, y: 49 },
      { id: 'RCM', label: 'CM', x: 64, y: 49 },
      { id: 'LW', label: 'LW', x: 32, y: 29 },
      { id: 'RW', label: 'RW', x: 72, y: 29 },
      { id: 'ST', label: 'ST', x: 52, y: 19 }
    ]
  },
  '5-3-2': {
    label: '5-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 87 },
      { id: 'LWB', label: 'LWB', x: 14, y: 65 },
      { id: 'LCB', label: 'CB', x: 36, y: 69 },
      { id: 'CB', label: 'CB', x: 52, y: 69 },
      { id: 'RCB', label: 'CB', x: 68, y: 69 },
      { id: 'RWB', label: 'RWB', x: 90, y: 65 },
      { id: 'LCM', label: 'CM', x: 26, y: 45 },
      { id: 'CM', label: 'CM', x: 52, y: 45 },
      { id: 'RCM', label: 'CM', x: 78, y: 45 },
      { id: 'LS', label: 'ST', x: 40, y: 21 },
      { id: 'RS', label: 'ST', x: 64, y: 21 }
    ]
  },
  '5-4-1': {
    label: '5-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LWB', label: 'LWB', x: 12, y: 64 },
      { id: 'LCB', label: 'CB', x: 30, y: 70 },
      { id: 'CB', label: 'CB', x: 52, y: 72 },
      { id: 'RCB', label: 'CB', x: 74, y: 70 },
      { id: 'RWB', label: 'RWB', x: 92, y: 64 },
      { id: 'LM', label: 'LM', x: 22, y: 43 },
      { id: 'LCM', label: 'CM', x: 40, y: 50 },
      { id: 'RCM', label: 'CM', x: 64, y: 50 },
      { id: 'RM', label: 'RM', x: 82, y: 43 },
      { id: 'ST', label: 'ST', x: 52, y: 21 }
    ]
  },
  '5-4-1-HOLDING': {
    label: '5-4-1-HOLDING',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 86 },
      { id: 'LWB', label: 'LWB', x: 14, y: 68 },
      { id: 'LCB', label: 'CB', x: 32, y: 72 },
      { id: 'CB', label: 'CB', x: 52, y: 72 },
      { id: 'RCB', label: 'CB', x: 72, y: 72 },
      { id: 'RWB', label: 'RWB', x: 90, y: 68 },
      { id: 'LM', label: 'LM', x: 26, y: 42 },
      { id: 'CDM', label: 'CDM', x: 42, y: 50 },
      { id: 'CAM', label: 'CAM', x: 62, y: 36 },
      { id: 'RM', label: 'RM', x: 78, y: 44 },
      { id: 'ST', label: 'ST', x: 52, y: 20 }
    ]
  },
  '5-4-1-DEFEND': {
    label: '5-4-1-DEFEND',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 82 },
      { id: 'LB', label: 'LB', x: 14, y: 71 },
      { id: 'LCB', label: 'CB', x: 32, y: 67 },
      { id: 'CB', label: 'CB', x: 52, y: 63 },
      { id: 'RCB', label: 'CB', x: 72, y: 67 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LM', label: 'LM', x: 20, y: 45 },
      { id: 'LCM', label: 'CM', x: 40, y: 41 },
      { id: 'RCM', label: 'CM', x: 64, y: 41 },
      { id: 'RM', label: 'RM', x: 84, y: 45 },
      { id: 'ST', label: 'ST', x: 52, y: 23 }
    ]
  },
  '4-4-1-1-FLAT': {
    label: '4-4-1-1-FLAT',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 85 },
      { id: 'LB', label: 'LB', x: 16, y: 67 },
      { id: 'LCB', label: 'CB', x: 37, y: 71 },
      { id: 'RCB', label: 'CB', x: 67, y: 71 },
      { id: 'RB', label: 'RB', x: 88, y: 67 },
      { id: 'RCM', label: 'CM', x: 62, y: 49 },
      { id: 'LM', label: 'LM', x: 22, y: 39 },
      { id: 'LCM', label: 'CM', x: 40, y: 51 },
      { id: 'CF', label: 'CF', x: 52, y: 39 },
      { id: 'RM', label: 'RM', x: 82, y: 39 },
      { id: 'ST', label: 'ST', x: 52, y: 23 }
    ]
  }
};


// Modal functions
function openSquadBuilderModal() {
  const modal = document.getElementById('squad-builder-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Ensure formations are loaded if not defined above
  if(Object.keys(getFormations()).length === 1 && typeof window.formations !== 'undefined') {
      Object.assign(formations, window.formations);
  }

  setTimeout(() => {
    applyTheme(localStorage.getItem('selectedFieldTheme') || 'stadium-blue');
  }, 100);
  
  if (typeof renderSquadBuilder === 'function') {
    renderSquadBuilder();
  }
}

function closeSquadBuilderModal() {
  const modal = document.getElementById('squad-builder-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Drag handlers (Standard implementation)
function handleCardDragStart(e, playerId, sourceType, sourceId) {
  e.stopPropagation();
  squadState.dragging = playerId;
  squadState.dragSource = { type: sourceType, id: sourceId };
  const element = e.target.closest('.squad-card, .bench-cell, .picker-row');
  if (element) element.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

const POINTER_DRAG_THRESHOLD = 6;
const pointerDragState = {
  pending: null,
  active: null
};

function queuePointerDrag(e, playerId, sourceType, sourceId, onStart) {
  if (!e || e.pointerType === 'mouse') return;
  if (pointerDragState.pending || pointerDragState.active) return;

  const element = e.target.closest('.player-preview-card, .bench-preview-card, .picker-row');
  if (!element) return;

  pointerDragState.pending = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    playerId,
    sourceType,
    sourceId,
    element,
    onStart
  };

  document.addEventListener('pointermove', handlePointerDragMove);
  document.addEventListener('pointerup', handlePointerDragEnd);
  document.addEventListener('pointercancel', handlePointerDragCancel);
}

function beginPointerDrag(pending) {
  pointerDragState.pending = null;
  pointerDragState.active = {
    pointerId: pending.pointerId,
    lastHover: null
  };

  squadState.dragging = pending.playerId;
  squadState.dragSource = { type: pending.sourceType, id: pending.sourceId };

  if (pending.element) {
    pending.element.classList.add('dragging');
    if (pending.element.setPointerCapture) {
      pending.element.setPointerCapture(pending.pointerId);
    }
  }

  if (typeof pending.onStart === 'function') {
    pending.onStart();
  }
}

function handlePointerDragMove(e) {
  const pending = pointerDragState.pending;
  if (pending && pending.pointerId === e.pointerId) {
    const deltaX = e.clientX - pending.startX;
    const deltaY = e.clientY - pending.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (pending.sourceType === 'picker' && absX < absY) {
      return;
    }
    if (Math.hypot(deltaX, deltaY) >= POINTER_DRAG_THRESHOLD) {
      beginPointerDrag(pending);
    } else {
      return;
    }
  }

  const active = pointerDragState.active;
  if (!active || active.pointerId !== e.pointerId) return;

  e.preventDefault();

  const target = document.elementFromPoint(e.clientX, e.clientY);
  const slot = target ? target.closest('.squad-slot') : null;
  const benchCell = target ? target.closest('.bench-cell') : null;
  const nextHover = slot || benchCell;

  if (active.lastHover && active.lastHover !== nextHover) {
    active.lastHover.classList.remove('drag-over');
  }

  if (nextHover && nextHover !== active.lastHover) {
    nextHover.classList.add('drag-over');
  }

  active.lastHover = nextHover;
}

function handlePointerDragEnd(e) {
  const pending = pointerDragState.pending;
  if (pending && pending.pointerId === e.pointerId) {
    pointerDragState.pending = null;
    cleanupPointerDragListeners();
    return;
  }

  const active = pointerDragState.active;
  if (!active || active.pointerId !== e.pointerId) return;

  e.preventDefault();

  const target = document.elementFromPoint(e.clientX, e.clientY);
  const slot = target ? target.closest('.squad-slot') : null;
  const benchCell = target ? target.closest('.bench-cell') : null;

  if (slot && slot.dataset.slotId) {
    handleSlotDrop(createPointerDropEvent(), slot.dataset.slotId);
  } else if (benchCell) {
    const benchIndex = parseInt(benchCell.dataset.benchIndex, 10);
    if (Number.isFinite(benchIndex)) {
      handleBenchDrop(createPointerDropEvent(), benchIndex);
    } else {
      clearDragState();
    }
  } else {
    clearDragState();
  }

  pointerDragState.active = null;
  cleanupPointerDragListeners();
}

function handlePointerDragCancel(e) {
  if (pointerDragState.pending && pointerDragState.pending.pointerId === e.pointerId) {
    pointerDragState.pending = null;
  }

  if (pointerDragState.active && pointerDragState.active.pointerId === e.pointerId) {
    clearDragState();
    pointerDragState.active = null;
  }

  cleanupPointerDragListeners();
}

function cleanupPointerDragListeners() {
  document.removeEventListener('pointermove', handlePointerDragMove);
  document.removeEventListener('pointerup', handlePointerDragEnd);
  document.removeEventListener('pointercancel', handlePointerDragCancel);
}

function createPointerDropEvent() {
  return {
    preventDefault: () => {},
    stopPropagation: () => {}
  };
}

function handleSlotDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  if (squadState.dragging) {
    const slot = e.target.closest('.squad-slot');
    if (slot) {
      console.log('👆 Drag over slot:', slot.dataset.slotId);
      slot.classList.add('drag-over');
    }
  }
}

function handleSlotDragLeave(e) {
  const slot = e.target.closest('.squad-slot');
  if (slot) slot.classList.remove('drag-over');
}

function handleSlotDrop(e, targetSlotId) {
    console.log('🎯 DROP EVENT TRIGGERED');
    console.log('Target Slot ID:', targetSlotId);
    console.log('Dragging Player ID:', squadState.dragging);
    console.log('Drag Source:', squadState.dragSource);

    e.preventDefault();
    e.stopPropagation();

    if (!squadState.dragging) {
        console.log('❌ No dragging state, exiting');
        return;
    }

    const draggedId = squadState.dragging;
    const source = squadState.dragSource;

    const draggedPlayer = getPlayers().find(p => 
        p.id === draggedId || p.playerid === draggedId || p.player_id === draggedId
    );

    console.log('🔍 Looking for player:', draggedId);
    console.log('🔍 Total players in cache:', getPlayers().length);
    console.log('🔍 Found player:', draggedPlayer);

    if (!draggedPlayer) {
        console.log('❌ ERROR: Player not found in cache!');
        clearDragState();
        return;
    }

    console.log('✅ Dragged Player:', draggedPlayer);

    // Check if target slot already has a player (for SWAPPING)
    const targetPlayerId = squadState.starters[targetSlotId] || null;

    // ========================================
    // CASE 1: Dragging from PICKER (right side list)
    // ========================================
    if (source.type === 'picker') {
        console.log('🔵 Drag from PICKER to SLOT');

        // Validate position compatibility
        if (!validateAssignment(draggedPlayer, targetSlotId)) {
            console.log('❌ Validation FAILED');
            clearDragState();
            return;
        }

        // Check if player already exists somewhere in squad
        if (isPlayerAlreadyInSquad(draggedId, targetSlotId)) {
            console.log('⚠️ Player already in squad');
            clearDragState();
            return;
        }

        console.log('✅ Assigning player to slot:', targetSlotId);
        
        // Remove from any existing position
        removeIfAssigned(draggedId);
        
        // Assign to target slot
        squadState.starters[targetSlotId] = draggedId;
    }
    
    // ========================================
    // CASE 2: Dragging from SLOT to SLOT (swapping positions)
    // ========================================
    else if (source.type === 'slot') {
        console.log('🔄 Drag from SLOT to SLOT');
        
        const sourceSlotId = source.id;


        // If swapping with bench player, validate bench player can go to slot
        if (targetPlayerId) {
            const targetPlayer = getPlayers().find(p => 
                p.id === targetPlayerId || p.playerid === targetPlayerId || p.player_id === targetPlayerId
            );
            
            if (targetPlayer && !validateAssignment(targetPlayer, sourceSlotId)) {
                console.log('❌ Swap validation FAILED - bench player cannot go to that position');
                clearDragState();
                return;
            }
        }

        
        // If target slot is EMPTY - just move
        if (!targetPlayerId) {
            console.log('➡️ Moving to empty slot');
            squadState.starters[targetSlotId] = draggedId;
            delete squadState.starters[sourceSlotId];
        }
        // If target slot has a player - SWAP positions
        else {
            console.log('🔁 SWAPPING slot positions');
            console.log(`   Source: ${sourceSlotId} = ${draggedId}`);
            console.log(`   Target: ${targetSlotId} = ${targetPlayerId}`);
            
            // Perform the swap
            squadState.starters[targetSlotId] = draggedId;       // Dragged player to target
            squadState.starters[sourceSlotId] = targetPlayerId;  // Target player to source
            
            console.log('✅ SWAP COMPLETE');
            console.log(`   New Source: ${sourceSlotId} = ${squadState.starters[sourceSlotId]}`);
            console.log(`   New Target: ${targetSlotId} = ${squadState.starters[targetSlotId]}`);
        }
    }
    
    // ========================================
    // CASE 3: Dragging from BENCH to SLOT 🆕
    // ========================================
    else if (source.type === 'bench') {
        console.log('🔄 Drag from BENCH to SLOT');
        
        const sourceBenchIndex = source.id;

        // Validate position (optional - you can remove this if you want any position)
        if (!validateAssignment(draggedPlayer, targetSlotId)) {
            console.log('❌ Validation FAILED');
            clearDragState();
            return;
        }

        // If target slot is EMPTY - move from bench to slot
        if (!targetPlayerId) {
            console.log('➡️ Moving from bench to empty slot');
            squadState.starters[targetSlotId] = draggedId;
            squadState.bench[sourceBenchIndex] = null; // Remove from bench
        }
        // If target slot has a player - SWAP bench with slot
        else {
            console.log('🔁 SWAPPING bench player with slot player');
            console.log(`   Bench[${sourceBenchIndex}]: ${draggedId} → Slot[${targetSlotId}]`);
            console.log(`   Slot[${targetSlotId}]: ${targetPlayerId} → Bench[${sourceBenchIndex}]`);
            
            squadState.starters[targetSlotId] = draggedId;         // Bench player to slot
            squadState.bench[sourceBenchIndex] = targetPlayerId;   // Slot player to bench
            
            console.log('✅ BENCH ↔ SLOT SWAP COMPLETE');
        }
    }

    console.log('🔄 Before clearDragState');
    clearDragState();
    
    console.log('🔄 Before renderSquadBuilder');
    renderSquadBuilder();
    
    console.log('✅ DROP COMPLETE');
}


function handleBenchDrop(e, targetBenchIndex) {
    console.log('🎯 BENCH DROP EVENT TRIGGERED');
    console.log('Target Bench Index:', targetBenchIndex);
    console.log('Dragging Player ID:', squadState.dragging);
    console.log('Drag Source:', squadState.dragSource);

    e.preventDefault();
    e.stopPropagation();

    if (!squadState.dragging) return;

    const draggedId = squadState.dragging;
    const source = squadState.dragSource;

    const draggedPlayer = getPlayers().find(p => 
        p.id === draggedId || p.playerid === draggedId || p.player_id === draggedId
    );

    if (!draggedPlayer) {
        clearDragState();
        return;
    }

    const targetPlayerId = squadState.bench[targetBenchIndex] || null;

    // ========================================
    // CASE 1: From PICKER to BENCH
    // ========================================
    if (source.type === 'picker') {
        console.log('🔵 Drag from PICKER to BENCH');

        // Check if player already in squad
        if (isPlayerAlreadyInSquad(draggedId, null)) {
            clearDragState();
            return;
        }

        // Remove from any existing position
        removeIfAssigned(draggedId);

        // Assign to bench
        squadState.bench[targetBenchIndex] = draggedId;
    }
    
    // ========================================
    // CASE 2: From SLOT to BENCH (move from formation to bench) 🆕
    else if (source.type === 'slot') {
        console.log('🔄 Drag from SLOT to BENCH');
        
        const sourceSlotId = source.id;

        // If target bench slot is EMPTY - NO validation needed (bench accepts all)
        if (!targetPlayerId) {
            console.log('➡️ Moving from slot to empty bench - NO VALIDATION');
            squadState.bench[targetBenchIndex] = draggedId;
            delete squadState.starters[sourceSlotId]; // Remove from formation
        }
        // If target bench has a player - VALIDATE the swap (bench player going to formation)
        else {
            const targetPlayer = getPlayers().find(p => 
                p.id === targetPlayerId || p.playerid === targetPlayerId || p.player_id === targetPlayerId
            );
            
            // Validate if bench player can go to the formation slot
            if (targetPlayer && !validateAssignment(targetPlayer, sourceSlotId)) {
                console.log('❌ Swap validation FAILED - bench player cannot go to that position');
                clearDragState();
                return;
            }
            
            console.log('🔁 SWAPPING slot with bench');
            console.log(`   Slot[${sourceSlotId}]: ${draggedId} → Bench[${targetBenchIndex}]`);
            console.log(`   Bench[${targetBenchIndex}]: ${targetPlayerId} → Slot[${sourceSlotId}]`);
            
            squadState.bench[targetBenchIndex] = draggedId;       // Slot player to bench
            squadState.starters[sourceSlotId] = targetPlayerId;   // Bench player to slot
            console.log('✅ SLOT ↔ BENCH SWAP COMPLETE');
        }
    }

    
    // ========================================
    // CASE 3: From BENCH to BENCH (swap bench positions)
    // ========================================
    else if (source.type === 'bench') {
        console.log('🔄 Drag from BENCH to BENCH');
        
        const sourceBenchIndex = source.id;

        // Don't allow dropping on same position
        if (sourceBenchIndex === targetBenchIndex) {
            clearDragState();
            return;
        }

        // If target is empty - just move
        if (!targetPlayerId) {
            console.log('➡️ Moving bench position');
            squadState.bench[targetBenchIndex] = draggedId;
            squadState.bench[sourceBenchIndex] = null;
        }
        // If target has player - SWAP
        else {
            console.log('🔁 SWAPPING bench positions');
            squadState.bench[targetBenchIndex] = draggedId;
            squadState.bench[sourceBenchIndex] = targetPlayerId;
        }
    }

    clearDragState();
    renderSquadBuilder();
    console.log('✅ BENCH DROP COMPLETE');
}


function clearDragState() {
  console.log('🧹 CLEARING DRAG STATE');
  
  const draggingElements = document.querySelectorAll('.dragging, .drag-over');
  console.log('Found dragging elements:', draggingElements.length);
  
  draggingElements.forEach(el => {
    console.log('Removing classes from:', el.className);
    el.classList.remove('dragging', 'drag-over');
  });
  
  squadState.dragging = null;
  squadState.dragSource = null;
  
  console.log('✅ Drag state cleared');
}

// ============ RENDER LOGIC ============

function renderSquadBuilder() {

  console.log('🎨 RENDER SQUAD BUILDER CALLED');
  console.log('Current starters:', squadState.starters);
  console.log('Current bench:', squadState.bench);
  console.log('Current formation:', squadState.formationId);

  const nameEl = document.getElementById('squad-name-input');
  const ovrEl = document.getElementById('squad-ovr');
  const valueEl = document.getElementById('squad-value');
  const formationSelect = document.getElementById('formation-select');
  
  if (nameEl) {
    const currentName = (nameEl.value || '').trim();
    if (currentName) {
      squadState.name = currentName;
    }
    nameEl.value = squadState.name || 'My Squad';
  }
  if (formationSelect) formationSelect.value = squadState.formationId;
  if (ovrEl) ovrEl.textContent = getFinalTeamOVR() || 0;
  if (valueEl) valueEl.textContent = formatPrice(calculateValue() || 0);

  const field = document.getElementById('squad-field');
  if (!field) return;
  field.innerHTML = '';
  
  // Use global formations if local one is incomplete
  const currentFormation = (typeof getFormations()[squadState.formationId] !== 'undefined') 
    ? getFormations()[squadState.formationId] 
    : (window.formations ? window.getFormations()[squadState.formationId] : null);

  if (!currentFormation) return;

  currentFormation.slots.forEach(slot => {
    const el = renderSlot(slot);
    field.appendChild(el);
  });

  renderBench();
  renderPlayerPicker(); // This now calls the API-based renderer
}

function resolveSquadCardImages(player) {
    const playerId = resolveSquadPlayerId(player);
    const fallbackCard = playerId
        ? `https://cdn.futbin.com/content/fifa25/img/cards/e_${playerId}.png`
        : 'https://via.placeholder.com/300x400';
    const fallbackPlayer = playerId
        ? `https://cdn.futbin.com/content/fifa25/img/players/${playerId}.png`
        : 'https://via.placeholder.com/200x300';

    return {
        playerId,
        cardBg: player.cardbackground || player.card_background || player.cardBackground || fallbackCard,
        playerImg: player.playerimage || player.player_image || player.playerImage ||
            player.playerimg || player.playerImg || player.image || fallbackPlayer
    };
}

function buildSquadPreviewCardMarkup(player, slotLabel, slotId, options = {}) {
    if (!player) return '';

    const { cardBg, playerImg } = resolveSquadCardImages(player);
    const playerName = player.name || 'Unknown';
    const position = player.position || 'NA';
    const adjustedOVR = getPositionAdjustedOVR(player, slotLabel || '', { useSquadOverrides: true });
    const colorRating = player.colorrating || player.color_rating || player.colorRating || '#FFFFFF';
    const colorPosition = player.colorposition || player.color_position || player.colorPosition || '#FFFFFF';
    const colorName = player.colorname || player.color_name || player.colorName || '#FFFFFF';
    const crossOriginAttr = options.includeCrossOrigin ? ' crossorigin="anonymous"' : '';
    const includeRemoveButton = options.includeRemoveButton !== false;
    const isUntradableText = String(player.is_untradable ?? player.isuntradable ?? '').toLowerCase();
    const isUntradable = isUntradableText === 'true' || isUntradableText === '1' || isUntradableText === 'yes';
    const untradableBadgeHTML = isUntradable
          ? `<div class="card-untradable-badge ${includeRemoveButton ? 'with-remove' : 'no-remove'}">
              <img src="assets/images/untradable_img.png" alt="Untradable">
            </div>`
          : '';


    return `
            <div class="preview-card-inner">
                <img src="${cardBg}"
                     alt="Card"
                     class="preview-card-bg"${crossOriginAttr}
                     onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'; this.style.opacity='0.3';">
                <img src="${playerImg}"
                     alt="${playerName}"
                     class="preview-card-player-img"${crossOriginAttr}
                     onerror="this.style.display='none';">
                <div class="preview-card-ovr" style="color: ${colorRating};">${adjustedOVR > 0 ? adjustedOVR : 'NA'}</div>
                <div class="preview-card-position" style="color: ${colorPosition}">${position}</div>
                <div class="preview-card-name" style="color: ${colorName}">${playerName}</div>
                <img src="${player.nationflag || ''}" alt="Nation" class="card-nation-flag ${getPlayerType(player) === 'normal' ? 'normal-nation-flag' : 'hero-icon-nation-flag'}" onerror="this.style.display='none'">
                <img src="${player.clubflag || ''}" alt="Club" class="card-club-flag ${getPlayerType(player) === 'normal' ? 'normal-club-flag' : 'hero-icon-club-flag'}" onerror="this.style.display='none'">
                ${getPlayerType(player) === 'normal' && player.league_image ? `
                    <img src="${player.league_image}" 
                         alt="League" 
                         class="card-league-flag normal-league-flag"
                         onerror="this.style.display='none'">
                ` : ''}
                ${untradableBadgeHTML}
                ${includeRemoveButton ? `<button class="preview-card-remove" onclick="event.stopPropagation(); delete squadState.starters['${slotId}']; renderSquadBuilder();">×</button>` : ''}
            </div>
        `;
}

function buildSquadBenchCardMarkup(player, benchIndex, options = {}) {
    if (!player) return '';

    const { cardBg, playerImg } = resolveSquadCardImages(player);
    const overall = getSquadPlayerBoostedOVR(player);
    const position = player.position || 'NA';
    const playerName = player.name || 'Unknown';
    const colorRating = player.colorrating || player.color_rating || player.colorRating || '#FFFFFF';
    const colorPosition = player.colorposition || player.color_position || player.colorPosition || '#FFFFFF';
    const colorName = player.colorname || player.color_name || player.colorName || '#FFFFFF';
    const crossOriginAttr = options.includeCrossOrigin ? ' crossorigin="anonymous"' : '';
    const includeRemoveButton = options.includeRemoveButton !== false;
    const isUntradableText = String(player.is_untradable ?? player.isuntradable ?? '').toLowerCase();
    const isUntradable = isUntradableText === 'true' || isUntradableText === '1' || isUntradableText === 'yes';
    const untradableBadgeHTML = isUntradable
        ? `<div class="card-untradable-badge" style="right: ${includeRemoveButton ? '18px' : '-1px'}; pointer-events: none;">
               <img src="assets/images/untradable_img.png" alt="Untradable">
           </div>`
        : '';

    return `
                <div class="bench-card-inner">
                    <img src="${cardBg}"
                         alt="Card"
                         class="bench-card-bg"${crossOriginAttr}
                         onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'; this.style.opacity='0.3';">
                    <img src="${playerImg}"
                         alt="${playerName}"
                         class="bench-card-player-img"${crossOriginAttr}
                         onerror="this.style.display='none';">
                    <div class="bench-card-ovr" style="color: ${colorRating}">${overall > 0 ? overall : 'NA'}</div>
                    <div class="bench-card-position" style="color: ${colorPosition}">${position}</div>
                    <div class="bench-card-name" style="color: ${colorName}">${playerName}</div>
                    ${player.nation_flag || player.nation_flag ? `<img src="${player.nationflag || player.nationflag}" alt="Nation" class="bench-card-flag-nation ${getPlayerType(player) === 'normal' ? 'normal-nation-flag' : 'hero-icon-nation-flag'}"${crossOriginAttr} onerror="this.style.display='none'">` : ''}
                    ${player.club_flag || player.club_flag ? `<img src="${player.clubflag || player.clubflag}" alt="Club" class="bench-card-flag-club ${getPlayerType(player) === 'normal' ? 'normal-club-flag' : 'hero-icon-club-flag'}"${crossOriginAttr} onerror="this.style.display='none'">` : ''}

                    ${untradableBadgeHTML}
                    ${includeRemoveButton ? `<button class="bench-card-remove" onclick="event.stopPropagation(); squadState.bench.splice(${benchIndex}, 1); renderSquadBuilder();">×</button>` : ''}
                </div>
            `;
}

// ============ UPDATED: REDIRECT ON CLICK ============
function renderSlot(slot) {
    const container = document.createElement('div');
    container.className = 'squad-slot';
    container.style.left = slot.x + '%';
    container.style.top = slot.y + '%';
    container.dataset.slotId = slot.id;

    const assignedId = squadState.starters[slot.id] || null;
    const player = assignedId ? getPlayers().find(p => p.id === assignedId || p.playerid === assignedId || p.player_id === assignedId) : null;

    // ALWAYS CREATE THE POSITION DOT/CIRCLE (never remove it)
    const positionDot = document.createElement('div');
    positionDot.className = 'position-dot';
    positionDot.innerHTML = `<span class="position-label">${slot.label}</span>`;

    // Drag events on container
    container.addEventListener('dragover', handleSlotDragOver);
    container.addEventListener('dragleave', handleSlotDragLeave);
    container.addEventListener('drop', (e) => handleSlotDrop(e, slot.id));

    // ALWAYS append the position dot first (it stays in background)
    container.appendChild(positionDot);

    // If player assigned, create BIGGER preview card ON TOP
    if (player) {
        console.log('🎨 Rendering player card:', player);
        
        const playerId = resolveSquadPlayerId(player) || assignedId;

        const previewCard = document.createElement('div');
        previewCard.className = 'player-preview-card';
        previewCard.dataset.playerId = playerId || '';
        console.log('🎨 DEBUG: Creating preview card for slot:', slot.id, 'player:', assignedId);
        previewCard.setAttribute('draggable', 'true');

        previewCard.addEventListener('pointerdown', (e) => {
            queuePointerDrag(e, assignedId, 'slot', slot.id);
        });
        
        previewCard.addEventListener('dragstart', (e) => {
            handleCardDragStart(e, assignedId, 'slot', slot.id);
        });
        
        // ✅ CLICK HANDLER (moved OUTSIDE dragstart)
        previewCard.addEventListener('click', (e) => {
            e.stopPropagation(); // ✅ ADD THIS LINE
            console.log('🎯 DEBUG: Preview card clicked!');
            console.log('🎯 DEBUG: Event target:', e.target);
            console.log('🎯 DEBUG: Player ID:', assignedId);
            console.log('🎯 DEBUG: Slot ID:', slot.id);
            
            const isRemoveButton = e.target.closest('.preview-card-remove');
            console.log('🎯 DEBUG: Is remove button?', !!isRemoveButton);
            
            if (!isRemoveButton) {
                console.log('🎯 DEBUG: Attempting to open modal...');
                console.log('🎯 DEBUG: window.openPlayerCustomizationModal exists?', typeof window.openPlayerCustomizationModal);
                
                if (typeof window.openPlayerCustomizationModal === 'function') {
                    window.openPlayerCustomizationModal(assignedId, slot.id);
                    console.log('✅ DEBUG: Modal function called!');
                } else {
                    console.error('❌ DEBUG: Modal function NOT FOUND!');
                }
            }
        });
        
        console.log('✅ DEBUG: Click listener attached to preview card');

        previewCard.innerHTML = buildSquadPreviewCardMarkup(player, slot.label || '', slot.id);
        if (typeof applyRankOverlay === 'function') {
            const rankValue = getSquadPlayerSelectedRank(playerId, player);
            applyRankOverlay(previewCard.querySelector('.preview-card-inner'), rankValue, {
                scope: 'squad-builder',
                modifierClass: 'rank-overlay--squad-field'
            });
        }

        // Append preview card AFTER position dot (so it appears on top)
        container.appendChild(previewCard);
    }

    // Click handler for empty slots only
    if (!player) {
        container.addEventListener('click', () => {
            squadState.activeSlot = slot.id;
            squadState.pendingDatabaseAssign = true;
            if(state && state.filters) {
                state.filters.position = slot.label;
            }
            const filterDropdown = document.getElementById('filter-position');
            if(filterDropdown) filterDropdown.value = slot.label;
            
            closeSquadBuilderModal();
            if(typeof switchView === 'function') switchView('database');
            if(typeof loadDatabase === 'function') loadDatabase();
        });
    }

    return container;
}


// ============ END REDIRECT LOGIC ============

function renderBench() {
    const bench = document.getElementById('squad-bench');
    if (!bench) return;

    bench.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const pid = squadState.bench[i] || null;
        const player = pid ? getPlayers().find(p => p.id === pid || p.playerid === pid || p.player_id === pid) : null;

        const cell = document.createElement('div');
        cell.className = 'bench-cell' + (player ? ' filled' : '');
        cell.dataset.benchIndex = i;

        // Drag events
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (squadState.dragging) {
                cell.classList.add('drag-over');
            }
        });

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over');
        });

        cell.addEventListener('drop', (e) => handleBenchDrop(e, i));

        // ALWAYS CREATE THE EMPTY SLOT (background layer)
        const emptySlot = document.createElement('div');
        emptySlot.className = 'bench-empty-slot'; 
        emptySlot.innerHTML = `<span class="bench-slot-label">SUB ${i + 1}</span>`;
        cell.appendChild(emptySlot);

        // If player assigned, create PREVIEW CARD ON TOP
        if (player) {
            const playerId = resolveSquadPlayerId(player) || pid;

            // Create bench preview card
            const benchCard = document.createElement('div');
            benchCard.className = 'bench-preview-card';
            benchCard.dataset.playerId = playerId || '';
            console.log('🪑 DEBUG: Creating bench card at index:', i, 'player:', playerId);
            benchCard.setAttribute('draggable', 'true');

            benchCard.addEventListener('pointerdown', (e) => {
                queuePointerDrag(e, playerId, 'bench', i);
            });

            benchCard.addEventListener('dragstart', (e) => {
                handleCardDragStart(e, playerId, 'bench', i);
            // ✅ ADD CLICK HANDLER TO BENCH CARDS
            // 🐛 DEBUG: Add click handler to bench card
            benchCard.addEventListener('click', (e) => {
                console.log('🪑 DEBUG: Bench card clicked!');
                console.log('🪑 DEBUG: Player ID:', playerId);
                console.log('🪑 DEBUG: Bench index:', i);
                
                const isRemoveButton = e.target.closest('.bench-card-remove');
                console.log('🪑 DEBUG: Is remove button?', !!isRemoveButton);
                
                if (!isRemoveButton) {
                    console.log('🪑 DEBUG: Attempting to open modal...');
                    
                    if (typeof window.openPlayerCustomizationModal === 'function') {
                        window.openPlayerCustomizationModal(playerId, `BENCH${i}`);
                        console.log('✅ DEBUG: Modal function called for bench!');
                    } else {
                        console.error('❌ DEBUG: Modal function NOT FOUND!');
                    }
                }
            });
            console.log('✅ DEBUG: Click listener attached to bench card');

            });

            benchCard.innerHTML = buildSquadBenchCardMarkup(player, i);
            if (typeof applyRankOverlay === 'function') {
                const rankValue = getSquadPlayerSelectedRank(playerId, player);
                applyRankOverlay(benchCard.querySelector('.bench-card-inner'), rankValue, {
                    scope: 'squad-builder',
                    modifierClass: 'rank-overlay--squad-field'
                });
            }

            cell.appendChild(benchCard);
        }

        // Click handler for empty bench slots
        if (!player) {
            cell.addEventListener('click', () => {
                squadState.activeSlot = `BENCH${i}`;
                squadState.pendingDatabaseAssign = true;
                closeSquadBuilderModal();
                if (typeof switchView === 'function') switchView('database');
            });
        }

        bench.appendChild(cell);
    }
}

// Helpers
function validateAssignment(player, slotId) {
    if (!player || !slotId) return false;

    const formations = getFormations();
    const formation = formations[squadState.formationId];
    if (!formation) return false;

    const slot = formation.slots.find(s => s.id === slotId);
    if (!slot) return false;

    const playerPos = (player.position || '').toUpperCase().trim();
    const slotLabel = (slot.label || '').toUpperCase().trim();

    console.log('🔍 Validating:', playerPos, '→', slotLabel);

    // ========================================
    // STRICT GK RULES (bidirectional)
    // ========================================
    
    // Rule 1: Only GK can go to GK position
    if (slotLabel === 'GK') {
        if (playerPos !== 'GK') {
            console.log('❌ BLOCKED: Non-GK trying to go to GK position');
            return false;
        }
        console.log('✅ GK player to GK position - ALLOWED');
        return true;
    }

    // Rule 2: GK can ONLY go to GK position (not CB, ST, CM, etc.)
    if (playerPos === 'GK') {
        console.log('❌ BLOCKED: GK trying to go to non-GK position');
        return false;
    }

    // ========================================
    // For all other positions: Allow any outfield player
    // ========================================
    console.log('✅ Position validation passed');
    return true;
}

function isPlayerAlreadyInSquad(playerId, targetSlot) {
  console.log('🔍 Checking if player already in squad:', playerId);
  
  for (const [slotId, pid] of Object.entries(squadState.starters)) {
    if (slotId !== targetSlot && pid === playerId) {
      console.log('❌ Found in starters:', slotId);
      return true;
    }
  }
  
  if (squadState.bench.includes(playerId)) {
    console.log('❌ Found in bench');
    return true;
  }
  
  console.log('✅ Player not in squad');
  return false;
}

function removeIfAssigned(playerId) {
  Object.keys(squadState.starters).forEach(k => {
    if (squadState.starters[k] === playerId) delete squadState.starters[k];
  });
  const idx = squadState.bench.indexOf(playerId);
  if (idx !== -1) squadState.bench.splice(idx, 1);
}



// ========================================
// BADGES SYSTEM
// ========================================

function openBadgesModal() {
    const modal = document.getElementById('badges-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Update visual state of badge cards
    updateBadgeCards();
}

function closeBadgesModal() {
    const modal = document.getElementById('badges-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleBadge(badgeNumber) {
    const badgeKey = `badge${badgeNumber}`;
    
    // Toggle badge state
    squadState.badges[badgeKey] = !squadState.badges[badgeKey];
    
    console.log(`🏅 Badge ${badgeNumber} toggled:`, squadState.badges[badgeKey]);
    
    // Update visuals
    updateBadgeCards();
    
    // Update OVR display
    renderSquadBuilder();
    
    const status = squadState.badges[badgeKey] ? 'activated' : 'deactivated';
    console.log(`🏅 Badge ${badgeNumber} ${status}`);
}

function updateBadgeCards() {
    let activeCount = 0;
    
    // Update each badge card
    for (let i = 1; i <= 3; i++) {
        const card = document.getElementById(`badge-card-${i}`);
        const badgeKey = `badge${i}`;
        
        if (card) {
            if (squadState.badges[badgeKey]) {
                card.classList.add('active');
                activeCount++;
            } else {
                card.classList.remove('active');
            }
        }
    }
    
    // Update active count display
    const countEl = document.getElementById('active-badges-count');
    if (countEl) {
        countEl.textContent = activeCount;
    }
}



// ========================================
// SQUAD BUILDER FILTER PANEL FUNCTIONS
// ========================================

// Toggle filter panel visibility
// Toggle filter panel visibility
function toggleSquadFilterPanel() {
  const panel = document.getElementById('squad-filter-panel');
  const trigger = document.getElementById('squad-filter-trigger');
  
  if (!panel) return;
  
  if (panel.style.display === 'none' || !panel.style.display) {
    // Open panel - position it RIGHT BELOW the Filters button
    const triggerRect = trigger.getBoundingClientRect();
    const modalRect = document.getElementById('squad-builder-modal').getBoundingClientRect();
    
    // Calculate position relative to modal container
    const topPosition = triggerRect.bottom - modalRect.top + 5; // 5px gap below button
    const leftPosition = triggerRect.right - modalRect.left - 190; // Align right edge (320px = panel width)
    
    panel.style.display = 'block';
    panel.style.top = `${topPosition}px`;
    panel.style.left = `${leftPosition}px`;
    
    console.log('[FILTER PANEL] Opened below Filters button');
  } else {
    // Close panel
    panel.style.display = 'none';
    console.log('[FILTER PANEL] Closed');
  }
}

// Cancel filters - just close panel without applying
function cancelSquadFilters() {
  const panel = document.getElementById('squad-filter-panel');
  if (panel) {
    panel.style.display = 'none';
  }
  console.log('[FILTER PANEL] Cancelled');
}

// Apply filters - update state and fetch filtered players
function applySquadFilters() {
    console.log('🔵 [FILTER PANEL] Applying filters...');
    
    // DEBUG: Get input elements first
    const ratingMinInput = document.getElementById('squad-rating-min');
    const ratingMaxInput = document.getElementById('squad-rating-max');
    
    console.log('🔍 OVR DEBUG: Min input element:', ratingMinInput);
    console.log('🔍 OVR DEBUG: Max input element:', ratingMaxInput);
    console.log('🔍 OVR DEBUG: Min value:', ratingMinInput?.value);
    console.log('🔍 OVR DEBUG: Max value:', ratingMaxInput?.value);
    
    // Get filter values from UI
    const position = document.getElementById('squad-filter-position')?.value || '';
    const ratingMin = parseInt(ratingMinInput?.value || '40');
    const ratingMax = parseInt(ratingMaxInput?.value || '150');
    
    console.log('🔍 OVR DEBUG: Parsed ratingMin:', ratingMin);
    console.log('🔍 OVR DEBUG: Parsed ratingMax:', ratingMax);
    
    const event = document.getElementById('squad-filter-event')?.value || '';
    const league = document.getElementById('squad-filter-league')?.value || '';
    const club = document.getElementById('squad-filter-club')?.value || '';
    const nation = document.getElementById('squad-filter-nation')?.value || '';
    const skill = document.getElementById('squad-filter-skill')?.value || '';
    
    // Update global state filters (reuse existing filter state)
    if (window.state && window.state.filters) {
        window.state.filters.position = position;
        window.state.filters.ratingMin = ratingMin;
        window.state.filters.ratingMax = ratingMax;
        console.log('✅ OVR DEBUG: Global state updated:', { ratingMin, ratingMax });
        window.state.filters.event = event;
        window.state.filters.league = league;
        window.state.filters.club = club;
        window.state.filters.nation = nation;
        window.state.filters.skillMoves = skill;
        
        console.log('✅ ALL FILTERS DEBUG: Complete state:', window.state.filters);
    }
    
    // Trigger the picker fetch with new filters
    console.log('🚀 Calling fetchPlayersForPicker...');
    fetchPlayersForPicker();
    
    // Close the panel
    const panel = document.getElementById('squad-filter-panel');
    if (panel) panel.style.display = 'none';
    
    console.log('✅ [FILTER PANEL] Filters applied:', { position, ratingMin, ratingMax, event, league, club, nation, skill });
}



// Live update rating display
document.addEventListener('DOMContentLoaded', () => {
  const minInput = document.getElementById('squad-rating-min');
  const maxInput = document.getElementById('squad-rating-max');
  const display = document.getElementById('squad-rating-value');
  
  function updateRatingDisplay() {
    if (minInput && maxInput && display) {
      const min = minInput.value || 40;
      const max = maxInput.value || 150;
      display.textContent = `${min}-${max}`;
    }
  }
  
  if (minInput) minInput.addEventListener('input', updateRatingDisplay);
  if (maxInput) maxInput.addEventListener('input', updateRatingDisplay);
});



// ============================================
// SQUAD PLAYER CUSTOMIZATION FUNCTIONS
// ============================================

function getSquadRankOvrBonus(rankValue) {
    const normalizedRank = Math.min(Math.max(parseInt(rankValue || 0, 10), 0), 5);
    return normalizedRank;
}

function persistSquadCustomizationState(reason) {
    const playerKey = squadCustomizationState.playerId;
    if (!playerKey) return;

    const player = squadCustomizationState.player || getSquadPlayerById(playerKey);
    const snapshot = {
        selectedRank: getSquadRankOvrBonus(squadCustomizationState.selectedRank),
        trainingLevel: parseInt(squadCustomizationState.trainingLevel || 0, 10),
        selectedSkills: Array.isArray(squadCustomizationState.selectedSkills)
            ? [...squadCustomizationState.selectedSkills]
            : []
    };

    squadCustomizationState.savedByPlayer[playerKey] = snapshot;

    const rawBaseOvr = Number.isFinite(squadCustomizationState.baseOvr)
        ? parseInt(squadCustomizationState.baseOvr, 10)
        : parseInt(player?.ovr || player?.overall || 0, 10);
    const baseOvrValue = Number.isFinite(rawBaseOvr) ? rawBaseOvr : 0;
    const boostedOvr = baseOvrValue > 0 ? baseOvrValue + snapshot.selectedRank : baseOvrValue;
    const altPositions = getSquadPlayerAltPositions(player);

    const updates = {
        ...snapshot,
        baseOvr: baseOvrValue,
        boostedOvr
    };

    if (altPositions.length > 0) {
        updates.altPositions = altPositions;
    }

    setSquadPlayerCustomization(playerKey, updates, reason);
    console.log('SQUAD CUSTOM: Persisted customization state', {
        playerId: playerKey,
        reason,
        snapshot,
        boostedOvr
    });
}

window.verifySquadCustomizationOVR = function(baseOvr = 80) {
    const safeBase = parseInt(baseOvr || 0, 10);
    const results = [0, 1, 2, 3, 4, 5].map(rank => {
        const bonus = getSquadRankOvrBonus(rank);
        return { rank, bonus, ovr: safeBase > 0 ? safeBase + bonus : safeBase };
    });
    console.log('SQUAD CUSTOM TEST: OVR matrix', { baseOvr: safeBase, results });
    return results;
};

async function selectSquadRank(rankNumber, options = {}) {
    const normalizedRank = getSquadRankOvrBonus(rankNumber);
    console.log('SQUAD CUSTOM: Selecting rank:', normalizedRank);
    
    squadCustomizationState.selectedRank = normalizedRank;
    console.log('[RankOverlay] SquadBuilder:', squadCustomizationState.playerId, normalizedRank);
    if (!options.preserveSkills) {
        squadCustomizationState.selectedSkills = [];
    }

    updateSquadCustomizationMiniCard();
    updateSquadCardRankOverlay(squadCustomizationState.playerId, normalizedRank);
    
    document.querySelectorAll('.squad-rank-box').forEach(box => {
        const rank = parseInt(box.dataset.rank);
        if (rank === normalizedRank) {
            box.classList.add('selected');
            box.style.borderColor = normalizedRank === 1 ? 'rgba(59,214,113,0.6)' :
                                   normalizedRank === 2 ? 'rgba(99,102,241,0.6)' :
                                   normalizedRank === 3 ? 'rgba(139,92,246,0.6)' :
                                   normalizedRank === 4 ? 'rgba(255,184,107,0.6)' :
                                   'rgba(255,107,107,0.6)';
            box.style.boxShadow = `0 0 12px ${normalizedRank === 1 ? '#3BD671' : normalizedRank === 2 ? '#6366F1' : normalizedRank === 3 ? '#8B5CF6' : normalizedRank === 4 ? '#FFB86B' : '#FF6B6B'}50`;
        } else {
            box.classList.remove('selected');
            box.style.borderColor = 'rgba(255,255,255,0.1)';
            box.style.boxShadow = 'none';
        }
    });
    
    const skillPoints = normalizedRank;
    const pointsDisplay = document.getElementById('squad-skill-points-display');
    if (pointsDisplay) {
        pointsDisplay.textContent = `${skillPoints} Point${skillPoints !== 1 ? 's' : ''}`;
    }
    
    renderSquadSkillsMessage('Loading skills...');
    await renderSquadPlayerSkills();
    
    persistSquadCustomizationState('rank-change');
}


function resetSquadPlayerRank() {
    console.log('SQUAD CUSTOM: Resetting rank');
    
    squadCustomizationState.selectedRank = 0;
    squadCustomizationState.selectedSkills = [];
    squadCustomizationState.trainingLevel = 0;
    console.log('[RankOverlay] SquadBuilder:', squadCustomizationState.playerId, 0);
    
    document.querySelectorAll('.squad-rank-box').forEach(box => {
        box.classList.remove('selected');
        box.style.borderColor = 'rgba(255,255,255,0.1)';
        box.style.boxShadow = 'none';
    });
    
    const trainingSelect = document.getElementById('squad-training-level');
    if (trainingSelect) {
        trainingSelect.value = '0';
    }
    
    const pointsDisplay = document.getElementById('squad-skill-points-display');
    if (pointsDisplay) {
        pointsDisplay.textContent = '0 Points';
    }

    updateSquadCustomizationMiniCard();
    updateSquadCardRankOverlay(squadCustomizationState.playerId, 0);
    
    renderSquadSkillsMessage('Select a rank to view skills');
    
    persistSquadCustomizationState('rank-reset');
    if (squadCustomizationState.playerId) {
        setSquadPlayerCustomization(squadCustomizationState.playerId, {
            altPositionsUnlocked: []
        }, 'rank-reset');
    }

}


function updateSquadTraining(level) {
    console.log('SQUAD CUSTOM: Training level set to:', level);
    
    squadCustomizationState.trainingLevel = parseInt(level);

    persistSquadCustomizationState('training-change');
    
}



async function openSquadPlayerStatsView() {
    console.log('SQUAD CUSTOM: Opening stats view');
    const modal = document.getElementById('squad-player-customization-modal');
    const statsView = document.getElementById('squad-stats-view');
    const statsContent = document.getElementById('squad-stats-content');
    if (!modal || !statsView || !statsContent) return;

    modal.classList.add('stats-mode');
    statsView.style.display = 'block';
    statsContent.innerHTML = '<div style="color: #98A0A6; text-align: center; padding: 20px;">Loading stats...</div>';

    const playerId = squadCustomizationState.playerId;
    const rank = squadCustomizationState.selectedRank || 0;
    const trainingLevel = squadCustomizationState.trainingLevel || 0;

    if (!playerId || !rank || !window.apiClient) {
        statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Stats unavailable</div>';
        return;
    }

    try {
        const detailsResponse = await window.apiClient.getPlayerDetails(playerId, rank, { cache: false });
        const basePlayer = getPlayers().find(p => p.player_id === playerId || p.id === playerId) || {};
        const mergedPlayer = {
            ...basePlayer,
            ...(detailsResponse.player || {}),
            player_id: basePlayer.player_id || basePlayer.id || detailsResponse.player?.player_id || playerId,
            rank: rank,
            skills: detailsResponse.skills || [],
            available_skill_points: detailsResponse.available_skill_points
        };

        let userAllocations = [];
        const userId = typeof CURRENT_USER_ID !== 'undefined' ? CURRENT_USER_ID : null;
        if (userId && typeof window.apiClient.getUserSkillAllocations === 'function') {
            const response = await window.apiClient.getUserSkillAllocations(userId, mergedPlayer.player_id, rank);
            userAllocations = response.allocations || [];
        }

        const skillBoosts = typeof calculateSkillBoosts === 'function'
            ? await calculateSkillBoosts(userAllocations)
            : {};

        const trainingBoosts = typeof getTrainingBoosts === 'function'
            ? await getTrainingBoosts(mergedPlayer.position, trainingLevel)
            : null;

        mergedPlayer.training_level = trainingLevel;
        mergedPlayer.training_boosts = typeof mergeBoosts === 'function'
            ? mergeBoosts(trainingBoosts, skillBoosts)
            : (trainingBoosts || {});

        console.log('SQUAD CUSTOM: Stats boosts', { trainingBoosts, skillBoosts });

        if (typeof window.renderPlayerStatsSection === 'function') {
            statsContent.innerHTML = window.renderPlayerStatsSection(mergedPlayer);
        } else {
            statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Stats renderer unavailable</div>';
        }
    } catch (error) {
        console.error('[SQUAD STATS] Error loading stats:', error);
        statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Failed to load stats</div>';
    }
}

function closeSquadPlayerStatsView() {
    console.log('SQUAD CUSTOM: Closing stats view');
    const modal = document.getElementById('squad-player-customization-modal');
    const statsView = document.getElementById('squad-stats-view');
    if (statsView) statsView.style.display = 'none';
    if (modal) modal.classList.remove('stats-mode');
}

function renderSquadSkillsMessage(message) {
    const container = document.getElementById('squad-custom-skills');
    if (!container) return;
    container.innerHTML = `<p style="color: #98A0A6; text-align: center;">${message}</p>`;
}

function ensureSquadSkillDetailModal() {
    const modal = document.getElementById('skill-detail-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
}

async function renderSquadPlayerSkills() {
    const container = document.getElementById('squad-custom-skills');
    if (!container) return;

    ensureSquadSkillDetailModal();

    const playerId = squadCustomizationState.playerId;
    const rank = squadCustomizationState.selectedRank || 0;

    if (!playerId || !rank) {
        renderSquadSkillsMessage('Select a rank to view skills');
        return;
    }

    if (!window.apiClient || typeof window.apiClient.getPlayerDetails !== 'function') {
        renderSquadSkillsMessage('Skills unavailable');
        return;
    }

    let detailsResponse;
    try {
        detailsResponse = await window.apiClient.getPlayerDetails(playerId, rank, { cache: false });
    } catch (error) {
        console.error('[SQUAD SKILLS] Error loading skills:', error);
        renderSquadSkillsMessage('Failed to load skills');
        return;
    }

    const basePlayer = getPlayers().find(p => p.player_id === playerId || p.id === playerId) || {};
    const mergedPlayer = {
        ...basePlayer,
        ...(detailsResponse.player || {}),
        player_id: basePlayer.player_id || basePlayer.id || detailsResponse.player?.player_id || playerId,
        rank: rank,
        skills: detailsResponse.skills || [],
        available_skill_points: detailsResponse.available_skill_points
    };

    squadCustomizationState.player = mergedPlayer;
    if (window.state) {
        window.state.selectedPlayer = mergedPlayer;
    }

    const availableSkills = mergedPlayer.skills || [];
    console.log("Available skills length:", availableSkills.length);

    const availablePoints = mergedPlayer.available_skill_points || rank || 0;
    const pointsDisplay = document.getElementById('squad-skill-points-display');
    if (pointsDisplay) {
        pointsDisplay.textContent = `${availablePoints} Point${availablePoints !== 1 ? 's' : ''}`;
    }

    if (availableSkills.length === 0) {
        renderSquadSkillsMessage('No skills available');
        return;
    }

    let userAllocations = [];
    const userId = typeof CURRENT_USER_ID !== 'undefined' ? CURRENT_USER_ID : null;
    if (userId && typeof window.apiClient.getUserSkillAllocations === 'function') {
        try {
            const response = await window.apiClient.getUserSkillAllocations(
                userId,
                mergedPlayer.player_id,
                rank
            );
            userAllocations = response.allocations || [];
        } catch (error) {
            console.error('[SQUAD SKILLS] Error fetching allocations:', error);
        }
    }

    const allocationMap = {};
    userAllocations.forEach(a => {
      allocationMap[a.skill_id] = a.skill_level;
    });

    const playerKey = resolveSquadPlayerId(mergedPlayer);
    const altPositions = getSquadPlayerAltPositions(mergedPlayer);
    const hasAltUnlock = altPositions.length > 0 && Object.values(allocationMap).some(level => (level || 0) >= 2);
    const unlockedAltPositions = hasAltUnlock ? altPositions : [];
    if (playerKey) {
        setSquadPlayerCustomization(playerKey, {
            altPositions,
            altPositionsUnlocked: unlockedAltPositions
        }, 'alt-position-sync');
        console.log('[SQUAD ALT] Alt position unlock state', {
            playerId: playerKey,
            unlocked: unlockedAltPositions
        });
    }

    const pointsSpent = userAllocations.reduce((sum, a) => sum + a.skill_level, 0);
    const pointsRemaining = availablePoints - pointsSpent;

    const maxLevels = typeof calculateMaxLevels === 'function'
        ? calculateMaxLevels(availableSkills)
        : {};

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    container.style.gap = '12px';
    container.innerHTML = '';
    availableSkills.forEach(skill => {
        const currentLevel = allocationMap[skill.skill_id] || 0;
        const isUnlocked = typeof checkIfSkillUnlocked === 'function'
            ? checkIfSkillUnlocked(skill, allocationMap, availableSkills)
            : true;

        if (typeof createSkillCard === 'function') {
            const card = createSkillCard(skill, currentLevel, isUnlocked, pointsRemaining, mergedPlayer, maxLevels);
            card.style.minHeight = '120px';
            card.style.pointerEvents = isUnlocked ? 'auto' : 'none';
            container.appendChild(card);
        } else {
            const fallbackCard = document.createElement('div');
            fallbackCard.className = `skill-card ${!isUnlocked ? 'locked' : ''}`;
            fallbackCard.textContent = skill.skill_name || 'Skill';
            container.appendChild(fallbackCard);
        }
    });
}




function removeSquadPlayer() {
    console.log('SQUAD CUSTOM: Removing player from slot:', squadCustomizationState.slotId);
    
    const slotId = squadCustomizationState.slotId;
    
    if (slotId) {
        if (slotId.startsWith('BENCH')) {
            const index = parseInt(slotId.split('BENCH')[1], 10);
            squadState.bench[index] = null;
        } else {
            delete squadState.starters[slotId];
        }
    }
    
    renderSquadBuilder();
    closePlayerCustomizationModal();
}



function applySquadPlayerCustomization() {
    console.log('SQUAD CUSTOM: Applying customization:', squadCustomizationState);
    
    const rank = squadCustomizationState.selectedRank || 0;
    const training = squadCustomizationState.trainingLevel || 0;
    const skills = squadCustomizationState.selectedSkills || [];

    closePlayerCustomizationModal();
}

function openPlayerCustomizationModal(playerId, slotId) {
  console.log('DEBUG: openPlayerCustomizationModal CALLED');
  console.log('DEBUG: playerId:', playerId);
  console.log('DEBUG: slotId:', slotId);

  const resolvedPlayerId = playerId || squadState.lastAssignedPlayerId || squadState.dragging || null;
  const player = getPlayers().find(p => p.player_id === resolvedPlayerId || p.id === resolvedPlayerId);
  const storedCustomization = resolvedPlayerId ? getSquadPlayerCustomization(resolvedPlayerId) : null;
  const savedCustomization = storedCustomization || (resolvedPlayerId ? squadCustomizationState.savedByPlayer?.[resolvedPlayerId] : null);
  const fallbackRank = getSquadRankOvrBonus(player?.rank);
  const restoredRank = savedCustomization ? getSquadRankOvrBonus(savedCustomization.selectedRank) : fallbackRank;
  const restoredTraining = savedCustomization ? parseInt(savedCustomization.trainingLevel || 0, 10) : 0;
  const restoredSkills = savedCustomization && Array.isArray(savedCustomization.selectedSkills)
      ? [...savedCustomization.selectedSkills]
      : [];

  squadCustomizationState.playerId = resolvedPlayerId;
  squadCustomizationState.slotId = slotId;
  squadCustomizationState.selectedRank = restoredRank;
  squadCustomizationState.trainingLevel = Number.isFinite(restoredTraining) ? restoredTraining : 0;
  squadCustomizationState.selectedSkills = restoredSkills;
  squadCustomizationState.player = null;

  if (savedCustomization) {
      console.log('SQUAD CUSTOM: Restored customization state', {
          playerId: resolvedPlayerId,
          selectedRank: squadCustomizationState.selectedRank,
          trainingLevel: squadCustomizationState.trainingLevel,
          selectedSkills: squadCustomizationState.selectedSkills
      });
  }

  const modal = document.getElementById('squad-player-customization-modal');

  if (!modal) {
    console.error('Modal not found!');
    return;
  }

  // Render mini card preview
  const storedBaseOvr = Number.isFinite(savedCustomization?.baseOvr)
      ? parseInt(savedCustomization.baseOvr, 10)
      : null;
  squadCustomizationState.baseOvr = Number.isFinite(storedBaseOvr)
      ? storedBaseOvr
      : (player?.ovr || player?.overall || 0);
  squadCustomizationState.basePosition = player?.position || 'N/A';
  squadCustomizationState.baseName = player?.name || 'Unknown Player';
  squadCustomizationState.baseColors = {
    color_rating: player?.color_rating || '#FFFFFF',
    color_position: player?.color_position || '#FFFFFF',
    color_name: player?.color_name || '#FFFFFF'
  };
  renderCustomizationMiniCard(player);

  ensureSquadSkillDetailModal();

  const trainingSelect = document.getElementById('squad-training-level');
  if (trainingSelect) {
      trainingSelect.value = `${squadCustomizationState.trainingLevel || 0}`;
  }

  if (squadCustomizationState.selectedRank > 0) {
      selectSquadRank(squadCustomizationState.selectedRank, {
          showToast: false,
          preserveSkills: !!savedCustomization
      });
  } else {
      document.querySelectorAll('.squad-rank-box').forEach(box => {
          box.classList.remove('selected');
          box.style.borderColor = 'rgba(255,255,255,0.1)';
          box.style.boxShadow = 'none';
      });
      const pointsDisplay = document.getElementById('squad-skill-points-display');
      if (pointsDisplay) {
          pointsDisplay.textContent = '0 Points';
      }
      updateSquadCustomizationMiniCard();
      renderSquadSkillsMessage('Select a rank to view skills');
  }

  closeSquadPlayerStatsView();

  modal.classList.remove('is-visible');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
      modal.classList.add('is-visible');
  });
}


function closePlayerCustomizationModal() {
    const modal = document.getElementById('squad-player-customization-modal');
    if (modal) {
        persistSquadCustomizationState('close');
        modal.classList.remove('is-visible');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (typeof closeSkillDetailModal === 'function') {
        closeSkillDetailModal();
    }
    closeSquadPlayerStatsView();
    if (typeof renderSquadBuilder === 'function') {
        renderSquadBuilder();
    }
}

// ==================== NATION FILTER AUTOCOMPLETE ====================
let allNations = []; // Cache for nations
let nationFilterTimeout = null;

// Fetch all nations from API on page load
async function loadNationsForSquadBuilder() {
    try {
        console.log('🌍 [SQUAD BUILDER] Fetching nations from API...');
        if (!window.apiClient || typeof window.apiClient.getNations !== 'function') {
            console.warn('âš ï¸ [SQUAD BUILDER] apiClient.getNations unavailable, falling back to COUNTRIES');
            if (typeof COUNTRIES !== 'undefined' && Array.isArray(COUNTRIES)) {
                allNations = COUNTRIES.slice();
                return;
            }
            allNations = [];
            return;
        }

        const response = await window.apiClient.getNations();
        
        // API returns {nations: Array(176)}
        allNations = response.nations || response || [];
        
        console.log('✅ [SQUAD BUILDER] Loaded', allNations.length, 'nations');
    } catch (error) {
        console.error('❌ [SQUAD BUILDER] Failed to load nations:', error);
        allNations = [];
    }
}

// Filter and display nations based on input
function filterNations(query) {
    const dropdown = document.getElementById('squad-filter-nation-list');
    if (!dropdown) return;

    // Clear previous results
    dropdown.innerHTML = '';

    if (!query || query.length < 1) {
        dropdown.style.display = 'none';
        return;
    }

    // If nations not loaded yet, show loading message
    if (allNations.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item" style="color: #888; padding: 10px;">Loading countries...</div>';
        dropdown.style.display = 'block';
        loadNationsForSquadBuilder(); // Try loading again
        return;
    }

    // Filter nations (case-insensitive)
    const matches = allNations.filter(nation => 
        nation.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item" style="color: #888; padding: 10px; cursor: default;">No countries found</div>';
        dropdown.style.display = 'block';
        return;
    }

    // Display up to 10 matches
    matches.slice(0, 10).forEach(nation => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = nation;
        item.style.cssText = 'cursor: pointer; padding: 10px 14px; color: #fff;';
        
        // Hover effect
        item.onmouseenter = () => item.style.background = 'rgba(99, 102, 241, 0.3)';
        item.onmouseleave = () => item.style.background = 'transparent';
        
        // Click handler - select nation
        item.onclick = () => {
            const input = document.getElementById('squad-filter-nation');
            if (input) input.value = nation;
            dropdown.style.display = 'none';
            
            // Update filter state
            state.filters.nation = nation;
            console.log('🌍 [SQUAD BUILDER] Nation selected:', nation);
            
            // Trigger filter update
            fetchPlayersForPicker();
        };
        
        dropdown.appendChild(item);
    });

    dropdown.style.display = 'block';
}

// Initialize nation autocomplete
function initSquadNationFilter() {
    const nationInput = document.getElementById('squad-filter-nation');
    
    if (!nationInput) {
        console.warn('⚠️ Nation input not found');
        return;
    }
    
    console.log('✅ [SQUAD BUILDER] Initializing nation filter');
    
    // Load nations from API
    loadNationsForSquadBuilder();
    
    // Listen for input changes (debounced)
    nationInput.addEventListener('input', (e) => {
        clearTimeout(nationFilterTimeout);
        nationFilterTimeout = setTimeout(() => {
            filterNations(e.target.value.trim());
        }, 200);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('squad-filter-nation-list');
        if (dropdown && !nationInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Call initialization when squad builder is opened
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSquadNationFilter);
} else {
    // If DOM already loaded, init immediately
    initSquadNationFilter();
}

// ==================== AUCTIONABLE TOGGLE ====================
function initSquadAuctionableToggle() {
    const toggle = document.getElementById('squad-auctionable-toggle');
    const statusText = document.getElementById('squad-auction-status-text');
    
    if (!toggle || !statusText) {
        console.warn('⚠️ [SQUAD FILTER] Auctionable toggle elements not found');
        return;
    }
    
    console.log('✅ [SQUAD FILTER] Initializing auctionable toggle');
    
    toggle.addEventListener('change', (e) => {
        console.log('🏷️ [SQUAD FILTER] Toggle changed:', e.target.checked);
        
        // Update status text
        if (e.target.checked) {
            statusText.textContent = 'Only With Prices';
        } else {
            statusText.textContent = 'All Players';
        }
        
        // Re-fetch players with new filter
        fetchPlayersForPicker();
    });
}

// Initialize when squad builder loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSquadAuctionableToggle);
} else {
    initSquadAuctionableToggle();
}


// ============================================
// RENDER MINI CARD IN CUSTOMIZATION MODAL
// ============================================
function renderCustomizationMiniCard(player) {
  const container = document.getElementById('squad-custom-player-card');
  if (!container) return;

  if (!player) {
    container.innerHTML = '<p style="color: #888;">Player not found</p>';
    return;
  }

  // Normalize player data
  const cardBg = player.card_background || player.cardBackground || player.cardbackground || 'https://via.placeholder.com/180x240';
  const playerImg = player.player_image || player.playerImage || player.playerimage || player.playerimg || 'https://via.placeholder.com/120x120';
  const playerName = player.name || 'Unknown Player';
  const overall = player.ovr || player.overall || 0;
  const position = player.position || 'N/A';
  const nationFlag = player.nation_flag || player.nationFlag || player.nationflag || '';
  const clubFlag = player.club_flag || player.clubFlag || player.clubflag || '';
  const isUntradableText = String(player.is_untradable ?? player.isuntradable ?? '').toLowerCase();
  const isUntradable = isUntradableText === 'true' || isUntradableText === '1' || isUntradableText === 'yes';
  const untradableBadgeHTML = isUntradable
    ? `<div class="card-untradable-badge" style="pointer-events: none;">
         <img src="assets/images/untradable_img.png" alt="Untradable">
       </div>`
    : '';

  // OVR color based on rating
  let ovrColor = '#FFFFFF';
  if (overall >= 90) ovrColor = '#FFD700'; // Gold
  else if (overall >= 80) ovrColor = '#00C2A8'; // Teal
  else if (overall >= 70) ovrColor = '#FFB86B'; // Orange

  // Build the mini card HTML
  container.innerHTML = `
    <div class="squad-custom-mini-card">
      <img src="${cardBg}" alt="Card Background" class="squad-custom-card-bg" onerror="this.src='https://via.placeholder.com/180x240'">
      <img src="${playerImg}" alt="${playerName}" class="squad-custom-card-player-img" onerror="this.style.display='none'">
      <div class="squad-custom-card-ovr" style="color: ${player.color_rating || '#FFFFFF'}">${overall > 0 ? overall : 'N/A'}</div>
      <div class="squad-custom-card-position" style="color: ${player.color_position || '#FFFFFF'}">${position}</div>



      <div class="squad-custom-card-flags">
        ${nationFlag 
          ? `<img src="${nationFlag}" 
                alt="Nation" 
                class="squad-modal-custom-card-flag ${getPlayerType(player) === 'normal' 
                  ? 'normal-modal-nation-flag' 
                  : 'hero-icon-modal-nation-flag'}" 
                onerror="this.style.display='none'">` 
          : ''}
        ${clubFlag 
          ? `<img src="${clubFlag}" 
                alt="Club" 
                class="squad-modal-custom-card-club ${getPlayerType(player) === 'normal' 
                  ? 'normal-modal-club-flag' 
                  : 'hero-icon-modal-club-flag'}" 
                onerror="this.style.display='none'">` 
          : ''}
        

        ${getPlayerType(player) === 'normal' && player.league_image ? `
            <img src="${player.league_image}" 
                 alt="League" 
                 class="squad-modal-custom-card-league normal-modal-league-flag"
                 onerror="this.style.display='none'">
        ` : ''}
      </div>


      <div class="squad-custom-card-name" style="color: ${player.color_name || '#FFFFFF'}">${playerName}</div>
      ${untradableBadgeHTML}
    </div>
  `;
  if (typeof applyRankOverlay === 'function') {
    const rankValue = squadCustomizationState.selectedRank || player?.rank || 0;
    applyRankOverlay(container.querySelector('.squad-custom-mini-card'), rankValue, {
      scope: 'squad-builder',
      modifierClass: 'rank-overlay--squad-customization'
    });
  }
}

function updateSquadCustomizationMiniCard() {
  const container = document.getElementById('squad-custom-player-card');
  if (!container) return;

  const ovrEl = container.querySelector('.squad-custom-card-ovr');
  const positionEl = container.querySelector('.squad-custom-card-position');
  const nameEl = container.querySelector('.squad-custom-card-name');

  if (!ovrEl || !positionEl || !nameEl) return;

  const baseOvr = squadCustomizationState.baseOvr ?? 0;
  const basePosition = squadCustomizationState.basePosition || 'N/A';
  const baseName = squadCustomizationState.baseName || 'Unknown Player';
  const colors = squadCustomizationState.baseColors || {};

  const rankBonus = getSquadRankOvrBonus(squadCustomizationState.selectedRank);
  const updatedOvr = baseOvr > 0 ? baseOvr + rankBonus : baseOvr;
  console.log('SQUAD CUSTOM: OVR recalculated', { baseOvr, rankBonus, updatedOvr });

  ovrEl.textContent = updatedOvr > 0 ? updatedOvr : 'N/A';
  positionEl.textContent = basePosition;
  nameEl.textContent = baseName;

  if (colors.color_rating) ovrEl.style.color = colors.color_rating;
  if (colors.color_position) positionEl.style.color = colors.color_position;
  if (colors.color_name) nameEl.style.color = colors.color_name;
  if (typeof applyRankOverlay === 'function') {
    applyRankOverlay(container.querySelector('.squad-custom-mini-card'), squadCustomizationState.selectedRank || 0, {
      scope: 'squad-builder',
      modifierClass: 'rank-overlay--squad-customization'
    });
  }
}

/**
 * Calculate total squad value
 */
function calculateValue() {
    let total = 0;
    const parseOptionalBoolean = (value) => {
        if (value === undefined || value === null || value === '') return null;
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
        if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
        return null;
    };
    const shouldIncludePlayerValue = (player) => {
        const untradable = parseOptionalBoolean(player.is_untradable ?? player.isuntradable ?? player.untradable);
        const unauctionable = parseOptionalBoolean(player.is_unauctionable ?? player.unauctionable);
        const tradable = parseOptionalBoolean(player.tradable);
        const auctionable = parseOptionalBoolean(player.auctionable);
        const isTradable = tradable !== null ? tradable : (untradable !== null ? !untradable : true);
        const isAuctionable = auctionable !== null ? auctionable : (unauctionable !== null ? !unauctionable : (untradable !== null ? !untradable : true));
        return isTradable && isAuctionable;
    };
    
    // Sum starter values
    Object.values(squadState.starters).forEach(pid => {
        if (!pid) return;
        const player = getPlayers().find(p => 
            p.id === pid || p.playerid === pid || p.player_id === pid
        );
        if (player && shouldIncludePlayerValue(player)) {
            total += resolveSquadPlayerPrice(player);
        }
    });
    
    // Sum bench values
    squadState.bench.forEach(pid => {
        if (!pid) return;
        const player = getPlayers().find(p => 
            p.id === pid || p.playerid === pid || p.player_id === pid
        );
        if (player && shouldIncludePlayerValue(player)) {
            total += resolveSquadPlayerPrice(player);
        }
    });
    
    return total;
}

/**
 * Format price for display
 */
function formatPrice(price) {
    if (!price || price === 0) return '0';
    
    if (price >= 1000000) {
        return (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(1) + 'K';
    }
    
    return price.toString();
}


// Global Exports
window.openSquadBuilderModal = openSquadBuilderModal;
window.closeSquadBuilderModal = closeSquadBuilderModal;
window.changeFormation = function(id) { squadState.formationId = id; renderSquadBuilder(); };
window.updatePickerSearch = updatePickerSearch;
window.clearSquadFilters = clearSquadFilters;
window.applyFiltersToPickerPlayers = applyFiltersToPickerPlayers;
// Export functions to global scope
window.openBadgesModal = openBadgesModal;
window.closeBadgesModal = closeBadgesModal;
window.toggleBadge = toggleBadge;
// Export to global scope
window.toggleSquadFilterPanel = toggleSquadFilterPanel;
window.resolveSquadPlayerPrice = resolveSquadPlayerPrice;
window.cancelSquadFilters = cancelSquadFilters;
window.applySquadFilters = applySquadFilters;
// Squad Customization Exports
window.selectSquadRank = selectSquadRank;
window.resetSquadPlayerRank = resetSquadPlayerRank;
window.updateSquadTraining = updateSquadTraining; 
window.openPlayerCustomizationModal = openPlayerCustomizationModal;
window.closePlayerCustomizationModal = closePlayerCustomizationModal;
window.removeSquadPlayer = removeSquadPlayer;
window.applySquadPlayerCustomization = applySquadPlayerCustomization;
window.openSquadPlayerStatsView = openSquadPlayerStatsView;
window.closeSquadPlayerStatsView = closeSquadPlayerStatsView;


// ============================================
// 🐛 DEBUG: Check if functions are loaded. that's all
// ============================================
console.log('🔍 DEBUG: squadBuilder.js loaded');
console.log('🔍 DEBUG: openPlayerCustomizationModal exists?', typeof window.openPlayerCustomizationModal);
console.log('🔍 DEBUG: closePlayerCustomizationModal exists?', typeof window.closePlayerCustomizationModal);
console.log('🔍 DEBUG: selectSquadRank exists?', typeof window.selectSquadRank);
console.log('🔍 DEBUG: Modal element exists?', !!document.getElementById('squad-player-customization-modal'));
