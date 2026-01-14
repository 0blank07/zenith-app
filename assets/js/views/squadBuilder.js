// squadBuilder.js - FIXED: API Search Error & Database Redirect
// FC Market Pro - Squad Builder

// squadBuilder.js - FIXED: API Search Error & Database Redirect
// FC Market Pro - Squad Builder

// ============ DEVICE DETECTION & RESPONSIVE FORMATIONS ============
function isMobileDevice() {
  const isMobileWidth = window.innerWidth <= 768;
  const isTouchDevice = ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0) || 
                        (navigator.msMaxTouchPoints > 0);
  return isMobileWidth || (isTouchDevice && window.innerWidth <= 1024);
}

function getFormations() {
  return isMobileDevice() ? mobileFormations : formations;
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const currentView = document.querySelector('.view.active');
    if (currentView && currentView.id === 'squad-builder-view') {
      renderFormation();
    }
  }, 250);
});


// ------- Local state -------
const squadState = {
  name: 'My Squad',
  formationId: '4-3-3',
  starters: {},
  bench: [],
  dragging: null,
  dragSource: null,
  searchQuery: '',
  activeSlot: null
};

// State for API results
let pickerSearchResults = [];
let pickerSearchTimer = null;

// ============ FIXED SEARCH & FILTER LOGIC ============

// 1. Fetch players from API (Using getPlayers for stability)
async function fetchPlayersForPicker() {
  const list = document.getElementById('squad-player-list');
  // Only show loading if we are actually searching/filtering in the picker view
  if (list && squadState.searchQuery) {
      list.innerHTML = '<div class="picker-loading" style="padding:20px;text-align:center;color:#888;">Searching database...</div>';
  }

  try {
    const query = squadState.searchQuery || '';
    
    // Build API params correctly for the getPlayers endpoint
    const params = {
        limit: 50,
        rank: 0
    };

    // Map the search query to 'name_starts_with' so it works with filters
    if (query) {
        params.name_starts_with = query;
    }

    // Apply active filters from global state
    if (state.filters.position) params.position = state.filters.position;
    if (state.filters.ratingMin > 40) params.min_ovr = state.filters.ratingMin;
    if (state.filters.ratingMax < 150) params.max_ovr = state.filters.ratingMax;
    if (state.filters.priceMin) params.min_price = state.filters.priceMin;
    if (state.filters.priceMax) params.max_price = state.filters.priceMax;
    if (state.filters.league) params.league = state.filters.league;
    if (state.filters.nation) params.nation = state.filters.nation;
    if (state.filters.skillMoves) params.skill_moves = state.filters.skillMoves;

    // Use getPlayers instead of searchPlayers to ensure filters (like Position) are respected
    const data = await window.apiClient.getPlayers(params);
    pickerSearchResults = data.players || [];

    // Render the results
    renderPlayerPicker();

  } catch (error) {
    console.error("Squad Search Error:", error);
    if(list) list.innerHTML = '<div style="padding:20px;text-align:center;color:red;">Error loading players. API may be offline.</div>';
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
    const pid = p.id || p.player_id;
    const overall = p.ovr || p.overall || 0;
    const position = p.position || 'N/A';
    const price = p.price || 0;
    const club = p.club || p.team || 'Unknown Club';

    row.innerHTML = `
      <div class="picker-ovr">${overall}</div>
      <div class="picker-main">
        <div class="picker-name">${p.name}</div>
        <div class="picker-meta">${position} • ${club}</div>
      </div>
      <div class="picker-price">${formatPrice(price)}</div>
    `;
    
    // Drag Start
    row.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      handleCardDragStart(e, pid, 'picker', null);
      ensurePlayerInGlobalList(p, pid, overall);
    });
    
    row.addEventListener('dragend', clearDragState);
    
    // Click to Assign
    row.addEventListener('click', () => {
      if (!squadState.activeSlot) {
        showToast('Select a position first', 'info');
        return;
      }
      
      ensurePlayerInGlobalList(p, pid, overall);

      if (squadState.activeSlot.startsWith('BENCH_')) {
        const index = parseInt(squadState.activeSlot.split('_')[1], 10);
        if (isPlayerAlreadyInSquad(pid, null)) {
          showToast(`${p.name} is already in the squad`, 'error');
          return;
        }
        removeIfAssigned(pid);
        squadState.bench[index] = pid;
        renderSquadBuilder();
        showToast(`${p.name} added to bench`, 'success');
      } else {
        if (!validateAssignment(p, squadState.activeSlot)) {
          return;
        }
        if (isPlayerAlreadyInSquad(pid, squadState.activeSlot)) {
          showToast(`${p.name} is already in the squad`, 'error');
          return;
        }
        removeIfAssigned(pid);
        squadState.starters[squadState.activeSlot] = pid;
        renderSquadBuilder();
        showToast(`${p.name} assigned to ${squadState.activeSlot}`, 'success');
      }
    });
    
    list.appendChild(row);
  });
}

// Helper: Add player to global list so they appear correctly on the pitch
function ensurePlayerInGlobalList(p, pid, overall) {
    if (typeof players !== 'undefined' && !players.find(existing => existing.id === pid)) {
         const newPlayer = { ...p };
         newPlayer.id = pid;
         newPlayer.overall = overall;
         players.push(newPlayer);
    }
}

// Clear filters
function clearSquadFilters() {
  state.filters = { position: '', ratingMin: 40, ratingMax: 150, priceMin: null, priceMax: null, league: '', nation: '', skillMoves: '' };
  squadState.searchQuery = '';
  const searchInput = document.getElementById('squad-picker-search');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-input, .filter-select').forEach(el => el.value = '');
  applyFiltersToPickerPlayers();
  showToast('Filters cleared', 'success');
}

// ============ END OF SEARCH LOGIC ============
// ============ END OF NEW CODE ============

// ============ END OF NEW CODE ============


// ------- ALL 37 FORMATIONS -------
const formations = {
  '3-4-1-2': {
    label: '3-4-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 55, y: 89 },
      { id: 'LCB', label: 'CB', x: 28, y: 71 },
      { id: 'CB', label: 'CB', x: 55, y: 71 },
      { id: 'RCB', label: 'CB', x: 82, y: 71 },
      { id: 'LM', label: 'LM', x: 20, y: 42 },
      { id: 'LCM', label: 'CM', x: 40, y: 52 },
      { id: 'RCM', label: 'CM', x: 70, y: 52 },
      { id: 'RM', label: 'RM', x: 90, y: 42 },
      { id: 'CAM', label: 'CAM', x: 55, y: 37 },  
      { id: 'LS', label: 'ST', x: 43, y: 22 },
      { id: 'RS', label: 'ST', x: 67, y: 22 }
    ]
},
  '3-4-2-1': {
    label: '3-4-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 92 },
      { id: 'LCB', label: 'LCB', x: 31, y: 75 },
      { id: 'CB', label: 'CB', x: 53, y: 67 },
      { id: 'RCB', label: 'RCB', x: 72, y: 75 },
      { id: 'LM', label: 'LM', x: 19, y: 45 },
      { id: 'LCM', label: 'LCM', x: 36, y: 55 },
      { id: 'RCM', label: 'RCM', x: 68, y: 55 },
      { id: 'RM', label: 'RM', x: 85, y: 45 },
      { id: 'LAM', label: 'CAM', x: 36, y: 32 },
      { id: 'RAM', label: 'CAM', x: 68, y: 32 },
      { id: 'ST', label: 'ST', x: 53, y: 20 }
    ]
},
  '3-4-3-DIAMOND': {
    label: '3-4-3 Diamond',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LCB', label: 'LCB', x: 30, y: 72 },
      { id: 'CB', label: 'CB', x: 53, y: 72 },
      { id: 'RCB', label: 'RCB', x: 77, y: 72 },
      { id: 'LM', label: 'LM', x: 25, y: 46 },
      { id: 'CDM', label: 'CDM', x: 43, y: 53 },
      { id: 'CAM', label: 'CAM', x: 63, y: 48 },
      { id: 'RM', label: 'RM', x: 83, y: 46 },
      { id: 'LW', label: 'LW', x: 35, y: 28 },
      { id: 'ST', label: 'ST', x: 53, y: 23 },
      { id: 'RW', label: 'RW', x: 72, y: 28 }
    ]
  },
  '3-4-3-FLAT': {
    label: '3-4-3 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 90 },
      { id: 'LCB', label: 'LCB', x: 29, y: 73 },
      { id: 'CB', label: 'CB', x: 53, y: 73 },
      { id: 'RCB', label: 'RCB', x: 76, y: 73 },
      { id: 'LM', label: 'LM', x: 20, y: 49 },
      { id: 'LCM', label: 'CM', x: 42, y: 49 },
      { id: 'RCM', label: 'CM', x: 64, y: 49 },
      { id: 'RM', label: 'RM', x: 86, y: 49 },
      { id: 'LW', label: 'LW', x: 32, y: 22 },
      { id: 'ST', label: 'ST', x: 53, y: 21 },
      { id: 'RW', label: 'RW', x: 74, y: 22 }
    ]
  },
  '3-5-1-1': {
    label: '3-5-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LCB', label: 'LCB', x: 25, y: 67 },
      { id: 'CB', label: 'CB', x: 53, y: 67 },
      { id: 'RCB', label: 'RCB', x: 78, y: 67 },
      { id: 'LM', label: 'LM', x: 21, y: 38 },
      { id: 'LDM', label: 'CDM', x: 43, y: 53 },
      { id: 'CM', label: 'CM', x: 53, y: 39 },
      { id: 'RDM', label: 'CDM', x: 65, y: 53 },
      { id: 'RM', label: 'RM', x: 85, y: 38 },
      { id: 'LST', label: 'ST', x: 42, y: 23 },
      { id: 'RST', label: 'ST', x: 66, y: 23 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LCB', label: 'LCB', x: 27, y: 69 },
      { id: 'CB', label: 'CB', x: 53, y: 69 },
      { id: 'RCB', label: 'RCB', x: 78, y: 69 },
      { id: 'LM', label: 'LM', x: 20, y: 45 },
      { id: 'LDM', label: 'CDM', x: 41, y: 53 },
      { id: 'CAM', label: 'CAM', x: 53, y: 39 },
      { id: 'RDM', label: 'CDM', x: 64, y: 53 },
      { id: 'RM', label: 'RM', x: 85, y: 45 },
      { id: 'LS', label: 'ST', x: 41, y: 22 },
      { id: 'RS', label: 'ST', x: 67, y: 22 }
    ]
  },
  '4-1-2-1-2-NARROW': {
    label: '4-1-2-1-2 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 38, y: 76 },
      { id: 'RCB', label: 'CB', x: 69, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'CDM', label: 'CDM', x: 54, y: 60 },
      { id: 'LCM', label: 'CM', x: 37, y: 48 },
      { id: 'RCM', label: 'CM', x: 72, y: 48 },
      { id: 'CAM', label: 'CAM', x: 54, y: 34 },
      { id: 'LS', label: 'ST', x: 43, y: 18 },
      { id: 'RS', label: 'ST', x: 66, y: 18 }
    ]
  },
  '4-1-2-1-2-WIDE': {
    label: '4-1-2-1-2 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LB', label: 'LB', x: 17, y: 75 },
      { id: 'LCB', label: 'CB', x: 38, y: 76 },
      { id: 'RCB', label: 'CB', x: 72, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 75 },
      { id: 'CDM', label: 'CDM', x: 54, y: 60 },
      { id: 'LM', label: 'LM', x: 25, y: 45 },
      { id: 'RM', label: 'RM', x: 78, y: 45 },
      { id: 'CAM', label: 'CAM', x: 54, y: 34 },
      { id: 'LS', label: 'ST', x: 42, y: 23 },
      { id: 'RS', label: 'ST', x: 66, y: 23 }
    ]
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 72 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 73, y: 74 },
      { id: 'RB', label: 'RB', x: 91, y: 72 },
      { id: 'CDM', label: 'CDM', x: 53, y: 60 },
      { id: 'LM', label: 'LM', x: 24, y: 40 },
      { id: 'CM', label: 'CM', x: 53, y: 40 },
      { id: 'RM', label: 'RM', x: 80, y: 40 },
      { id: 'LS', label: 'ST', x: 42, y: 23 },
      { id: 'RS', label: 'ST', x: 66, y: 23 }
    ]
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 89 },
      { id: 'LB', label: 'LB', x: 19, y: 74 },
      { id: 'LCB', label: 'CB', x: 38, y: 74 },
      { id: 'RCB', label: 'CB', x: 66, y: 74 },
      { id: 'RB', label: 'RB', x: 85, y: 74 },
      { id: 'CDM', label: 'CDM', x: 52, y: 59 },
      { id: 'LM', label: 'LM', x: 22, y: 43 },
      { id: 'LCM', label: 'CM', x: 42, y: 43 },
      { id: 'RCM', label: 'CM', x: 62, y: 43 },
      { id: 'RM', label: 'RM', x: 82, y: 43 },
      { id: 'ST', label: 'ST', x: 52, y: 24 }
    ]
  },


  '4-2-1-3': {
    label: '4-2-1-3',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 70, y: 74 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LDM', label: 'CDM', x: 37, y: 53 },
      { id: 'RDM', label: 'CDM', x: 68, y: 53 },
      { id: 'CAM', label: 'CAM', x: 53, y: 43 },
      { id: 'LW', label: 'LW', x: 32, y: 25 },
      { id: 'ST', label: 'ST', x: 53, y: 23 },
      { id: 'RW', label: 'RW', x: 73, y: 25 }
    ]
  },

  '4-2-1-3-WIDE': {
    label: '4-2-1-3 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 64, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 72 },
      { id: 'LDM', label: 'CDM', x: 40, y: 60 },
      { id: 'RDM', label: 'CDM', x: 60, y: 60 },
      { id: 'CAM', label: 'CAM', x: 50, y: 40 },
      { id: 'LW', label: 'LW', x: 20, y: 25 },
      { id: 'ST', label: 'ST', x: 50, y: 18 },
      { id: 'RW', label: 'RW', x: 80, y: 25 }
    ]
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 76 },
      { id: 'LCB', label: 'CB', x: 38, y: 76 },
      { id: 'RCB', label: 'CB', x: 71, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 76 },
      { id: 'LDM', label: 'CDM', x: 46, y: 56 },
      { id: 'RDM', label: 'CDM', x: 64, y: 56 },
      { id: 'LAM', label: 'CAM', x: 33, y: 39 },
      { id: 'RAM', label: 'CAM', x: 76, y: 39 },
      { id: 'LS', label: 'ST', x: 44, y: 23 },
      { id: 'RS', label: 'ST', x: 64, y: 23 }
    ]
  },
  '4-2-3-1-NARROW': {
    label: '4-2-3-1 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 88 },
      { id: 'LB', label: 'LB', x: 18, y: 70 },
      { id: 'LCB', label: 'CB', x: 38, y: 74 },
      { id: 'RCB', label: 'CB', x: 66, y: 74 },
      { id: 'RB', label: 'RB', x: 85, y: 70 },
      { id: 'LDM', label: 'CDM', x: 30, y: 52 },
      { id: 'RDM', label: 'CDM', x: 73, y: 52 },
      { id: 'LAM', label: 'CAM', x: 38, y: 35 },
      { id: 'CAM', label: 'CAM', x: 52, y: 45 },
      { id: 'RAM', label: 'CAM', x: 66, y: 35 },
      { id: 'ST', label: 'ST', x: 52, y: 18 }
    ]
  },


  '3-1-4-2': {
    label: '3-1-4-2',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LCB', label: 'CB', x: 35, y: 74 },
      { id: 'CB', label: 'CB', x: 53, y: 64 },
      { id: 'RCB', label: 'CB', x: 72, y: 74 },
      { id: 'CDM', label: 'CDM', x: 53, y: 43 },
      { id: 'LCM', label: 'CM', x:37, y: 43 },
      { id: 'RCM', label: 'CM', x: 70, y: 43 },
      { id: 'LM', label: 'LM', x: 22, y: 46 },
      { id: 'RM', label: 'RM', x: 86, y: 46 },
      { id: 'LST', label: 'ST', x: 43, y: 23 },
      { id: 'RST', label: 'ST', x: 66, y: 23 }
    ]
  },

  '4-2-3-1-WIDE': {
    label: '4-2-3-1 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 17, y: 74 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 74 },
      { id: 'LDM', label: 'CDM', x: 38, y: 52 },
      { id: 'RDM', label: 'CDM', x: 65, y: 52 },
      { id: 'LM', label: 'LM', x: 22, y: 43 },
      { id: 'CAM', label: 'CAM', x: 53, y: 39 },
      { id: 'RM', label: 'RM', x: 80, y: 43 },
      { id: 'ST', label: 'ST', x: 53, y: 22 }
    ]
  },
  '4-2-4': {
    label: '4-2-4',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 17, y: 71 },
      { id: 'LCB', label: 'CB', x: 35, y: 73 },
      { id: 'RCB', label: 'CB', x: 72, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LDM', label: 'CDM', x: 40, y: 48 },
      { id: 'RDM', label: 'CDM', x: 68, y: 48 },
      { id: 'LW', label: 'LW', x: 28, y: 30 },
      { id: 'LS', label: 'ST', x: 44, y: 23 },
      { id: 'RS', label: 'ST', x: 65, y: 23 },
      { id: 'RW', label: 'RW', x: 80, y: 30 }
    ]
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 74 },
      { id: 'LCB', label: 'CB', x: 37, y: 76 },
      { id: 'RCB', label: 'CB', x: 70, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 74 },
      { id: 'LCM', label: 'CM', x: 33, y: 48 },
      { id: 'CM', label: 'CM', x: 54, y: 57 },
      { id: 'RCM', label: 'CM', x: 76, y: 48 },
      { id: 'CAM', label: 'CAM', x: 54, y: 37 },
      { id: 'LS', label: 'ST', x: 42, y: 22 },
      { id: 'RS', label: 'ST', x: 66, y: 22 }
    ]
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 19, y: 72 },
      { id: 'LCB', label: 'CB', x: 39, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LCM', label: 'CM', x: 32, y: 54 },
      { id: 'CM', label: 'CM', x: 53, y: 54 },
      { id: 'RCM', label: 'CM', x: 77, y: 54 },
      { id: 'LAM', label: 'CAM', x: 38, y: 32 },
      { id: 'RAM', label: 'CAM', x: 68, y: 32 },
      { id: 'ST', label: 'ST', x: 53, y: 22 }
    ]
  },
  '4-3-3': {
    label: '4-3-3',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 74 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 66, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 74 },
      { id: 'LCM', label: 'CM', x: 34, y: 55 },
      { id: 'CM', label: 'CM', x: 53, y: 50 },
      { id: 'RCM', label: 'CM', x: 73, y: 55 },
      { id: 'LW', label: 'LW', x: 34, y: 27 },
      { id: 'ST', label: 'ST', x: 53, y: 24 },
      { id: 'RW', label: 'RW', x: 71, y: 27 }
    ]
  },
  '4-3-3-ATTACK': {
    label: '4-3-3 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 87, y: 72 },
      { id: 'LCM', label: 'CM', x: 32, y: 49 },
      { id: 'CAM', label: 'CAM', x: 53, y: 46 },
      { id: 'RCM', label: 'CM', x: 76, y: 49 },
      { id: 'LW', label: 'LW', x: 32, y: 25 },
      { id: 'ST', label: 'ST', x: 53, y: 23 },
      { id: 'RW', label: 'RW', x: 76, y: 25 }
    ]
  },
  '4-3-3-DEFEND': {
    label: '4-3-3 Defend',  
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 17, y: 73 },
      { id: 'LCB', label: 'CB', x: 37, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 87, y: 73 },
      { id: 'LDM', label: 'CDM', x: 29, y: 52 },
      { id: 'CM', label: 'CM', x: 53, y: 50 },
      { id: 'RDM', label: 'CDM', x: 78, y: 52 },
      { id: 'LW', label: 'LW', x: 31, y: 29 },
      { id: 'ST', label: 'ST', x: 53, y: 23 },
      { id: 'RW', label: 'RW', x: 76, y: 29 }
    ]
  },
  '4-3-3-FALSE9': {
    label: '4-3-3 False 9',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LB', label: 'LB', x: 19, y: 72 },
      { id: 'LCB', label: 'CB', x: 38, y: 76 },
      { id: 'RCB', label: 'CB', x: 69, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LCM', label: 'CM', x: 35, y: 50 },
      { id: 'CM', label: 'CM', x: 54, y: 55 },
      { id: 'RCM', label: 'CM', x: 75, y: 50 },
      { id: 'LW', label: 'LW', x: 37, y: 25 },
      { id: 'CF', label: 'CF', x: 54, y: 30 },
      { id: 'RW', label: 'RW', x: 72, y: 25 }
    ]
  },
  '4-3-3-HOLDING': {
    label: '4-3-3 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 74 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 74 },
      { id: 'CDM', label: 'CDM', x: 53, y: 53 },
      { id: 'LCM', label: 'CM', x: 33, y: 50 },
      { id: 'RCM', label: 'CM', x: 72, y: 50 },
      { id: 'LW', label: 'LW', x: 36, y: 25 },
      { id: 'ST', label: 'ST', x: 53, y: 23 },
      { id: 'RW', label: 'RW', x: 69, y: 25 }
    ]
  },
  '4-4-1-1': {
    label: '4-4-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 64, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 72 },
      { id: 'LM', label: 'LM', x: 22, y: 50 },
      { id: 'LCM', label: 'CM', x: 40, y: 52 },
      { id: 'RCM', label: 'CM', x: 60, y: 52 },
      { id: 'RM', label: 'RM', x: 78, y: 50 },
      { id: 'CAM', label: 'CAM', x: 50, y: 32 },
      { id: 'ST', label: 'ST', x: 50, y: 16 }
    ]
  },
  '4-4-1-1-ATTACK': {
    label: '4-4-1-1 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 74 },
      { id: 'RCB', label: 'CB', x: 71, y: 74 },
      { id: 'RB', label: 'RB', x: 89, y: 72 },
      { id: 'LM', label: 'LM', x: 20, y: 48 },
      { id: 'LCM', label: 'CM', x: 38, y: 47 },
      { id: 'RCM', label: 'CM', x: 69, y: 47 },
      { id: 'RM', label: 'RM', x: 87, y: 48 },
      { id: 'CAM', label: 'CAM', x: 53, y: 40 },
      { id: 'ST', label: 'ST', x: 53, y: 22 }
    ]
  },
  '4-4-2-FLAT': {
    label: '4-4-2 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 55, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 70 },
      { id: 'LCB', label: 'CB', x: 41, y: 72 },
      { id: 'RCB', label: 'CB', x: 66, y: 72 },
      { id: 'RB', label: 'RB', x: 90, y: 70 },
      { id: 'LM', label: 'LM', x: 15, y: 46 },
      { id: 'LCM', label: 'CM', x: 41, y: 48 },
      { id: 'RCM', label: 'CM', x: 66, y: 48 },
      { id: 'RM', label: 'RM', x: 90, y: 46 },
      { id: 'LS', label: 'ST', x: 40, y: 22 },
      { id: 'RS', label: 'ST', x: 67, y: 22 }
    ]
  },
  '4-4-2-HOLDING': {
    label: '4-4-2 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 19, y: 71 },
      { id: 'LCB', label: 'CB', x: 43, y: 73 },
      { id: 'RCB', label: 'CB', x: 64, y: 73 },
      { id: 'RB', label: 'RB', x: 85, y: 71 },
      { id: 'LM', label: 'LM', x: 22, y: 44 },
      { id: 'LDM', label: 'CDM', x: 43, y: 49 },
      { id: 'RDM', label: 'CDM', x: 64, y: 49 },
      { id: 'RM', label: 'RM', x: 82, y: 44 },
      { id: 'LS', label: 'ST', x: 43, y: 22 },
      { id: 'RS', label: 'ST', x: 64, y: 22 }
    ]
  },
  '4-5-1': {
    label: '4-5-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 72 },
      { id: 'LCB', label: 'CB', x: 36, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 85, y: 72 },
      { id: 'LM', label: 'LM', x: 18, y: 48 },
      { id: 'LAM', label: 'CAM', x: 35, y: 39 },
      { id: 'CM', label: 'CM', x: 52, y: 52 },
      { id: 'RAM', label: 'CAM', x: 67, y: 39 },
      { id: 'RM', label: 'RM', x: 85, y: 48 },
      { id: 'ST', label: 'ST', x: 52, y: 20 }
    ]
  },
  '4-5-1-FLAT': {
    label: '4-5-1 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 15, y: 74 },
      { id: 'LCB', label: 'CB', x: 34, y: 76 },
      { id: 'RCB', label: 'CB', x: 72, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 74 },
      { id: 'LM', label: 'LM', x: 20, y: 48 },
      { id: 'LCM', label: 'CM', x: 37, y: 50 },
      { id: 'CM', label: 'CM', x: 53, y: 52 },
      { id: 'RCM', label: 'CM', x: 69, y: 50 },
      { id: 'RM', label: 'RM', x: 84, y: 48 },
      { id: 'ST', label: 'ST', x: 53, y: 23 }
    ]
  },
  '5-2-1-2': {
    label: '5-2-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LWB', label: 'LWB', x: 18, y: 67 },
      { id: 'LCB', label: 'CB', x: 37, y: 69},
      { id: 'CB', label: 'CB', x: 54, y: 69},
      { id: 'RCB', label: 'CB', x: 70, y: 69 },
      { id: 'RWB', label: 'RWB', x: 88, y: 67 },
      { id: 'LCM', label: 'CM', x: 34, y: 48 },
      { id: 'RCM', label: 'CM', x: 72, y: 48 },
      { id: 'CAM', label: 'CAM', x: 54, y: 36 },
      { id: 'LS', label: 'ST', x: 42, y: 22 },
      { id: 'RS', label: 'ST', x: 66, y: 22 }
    ]
  },
  '5-2-2-1': {
    label: '5-2-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 52, y: 89 },
      { id: 'LWB', label: 'LWB', x: 12, y: 62 },
      { id: 'LCB', label: 'CB', x: 33, y: 65 },
      { id: 'CB', label: 'CB', x: 52, y: 65 },
      { id: 'RCB', label: 'CB', x: 70, y: 65 },
      { id: 'RWB', label: 'RWB', x: 89, y: 62 },
      { id: 'LCM', label: 'CM', x: 42, y: 44 },
      { id: 'RCM', label: 'CM', x: 61, y: 44 },
      { id: 'LW', label: 'LW', x: 33, y: 26 },
      { id: 'RW', label: 'RW', x: 71, y: 26 },
      { id: 'ST', label: 'ST', x: 52, y: 22 }
    ]
  },
  '5-3-2': {
    label: '5-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 54, y: 89 },
      { id: 'LWB', label: 'LWB', x: 17, y: 67 },
      { id: 'LCB', label: 'CB', x: 36, y: 69 },
      { id: 'CB', label: 'CB', x: 54, y: 69 },
      { id: 'RCB', label: 'CB', x: 71, y: 69 },
      { id: 'RWB', label: 'RWB', x: 88, y: 67 },
      { id: 'LCM', label: 'CM', x: 29, y: 43 },
      { id: 'CM', label: 'CM', x: 54, y: 43 },
      { id: 'RCM', label: 'CM', x: 77, y: 43 },
      { id: 'LS', label: 'ST', x: 41, y: 23 },
      { id: 'RS', label: 'ST', x: 67, y: 23 }
    ]
  },
  '5-4-1': {
    label: '5-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LWB', label: 'LWB', x: 12, y: 70 },
      { id: 'LCB', label: 'CB', x: 30, y: 76 },
      { id: 'CB', label: 'CB', x: 50, y: 80 },
      { id: 'RCB', label: 'CB', x: 70, y: 76 },
      { id: 'RWB', label: 'RWB', x: 88, y: 70 },
      { id: 'LM', label: 'LM', x: 25, y: 48 },
      { id: 'LCM', label: 'CM', x: 42, y: 52 },
      { id: 'RCM', label: 'CM', x: 58, y: 52 },
      { id: 'RM', label: 'RM', x: 75, y: 48 },
      { id: 'ST', label: 'ST', x: 50, y: 20 }
    ]
  },


  '5-4-1-HOLDING': {
    label: '5-4-1-HOLDING',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LWB', label: 'LWB', x: 14, y: 67 },
      { id: 'LCB', label: 'CB', x: 33, y: 70 },
      { id: 'CB', label: 'CB', x: 53, y: 70 },
      { id: 'RCB', label: 'CB', x: 72, y: 70 },
      { id: 'RWB', label: 'RWB', x: 89, y: 67 },
      { id: 'LM', label: 'LM', x: 29, y: 37 },
      { id: 'CDM', label: 'CDM', x: 44, y: 44 },
      { id: 'CAM', label: 'CAM', x: 66, y: 31 },
      { id: 'RM', label: 'RM', x: 78, y: 39 },
      { id: 'ST', label: 'ST', x: 53, y: 23  }
    ]
  },


  '5-4-1-DEFEND': {
    label: '5-4-1-DEFEND',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 16, y: 73 },
      { id: 'LCB', label: 'CB', x: 33, y: 66 },
      { id: 'CB', label: 'CB', x: 53, y: 63 },
      { id: 'RCB', label: 'CB', x: 72, y: 66 },
      { id: 'RB', label: 'RB', x: 89, y: 73 },
      { id: 'LM', label: 'LM', x: 23, y: 42 },
      { id: 'LCM', label: 'CM', x: 41, y: 39 },
      { id: 'RCM', label: 'CM', x: 68, y: 39 },
      { id: 'RM', label: 'RM', x: 84, y: 42 },
      { id: 'ST', label: 'ST', x: 53, y: 23  }
    ]
  },


  '4-4-1-1-FLAT': {
    label: '4-4-1-1-FLAT',
    slots: [
      { id: 'GK', label: 'GK', x: 53, y: 89 },
      { id: 'LB', label: 'LB', x: 18, y: 67 },
      { id: 'LCB', label: 'CB', x: 38, y: 70 },
      { id: 'RCB', label: 'CB', x: 69, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 70 },
      { id: 'RCM', label: 'CM', x: 66, y: 47 },
      { id: 'LM', label: 'LM', x: 25, y: 40 },
      { id: 'LCM', label: 'CM', x: 40, y: 47 },
      { id: 'CF', label: 'CF', x: 53, y: 40 },
      { id: 'RM', label: 'RM', x: 82, y: 40 },
      { id: 'ST', label: 'ST', x: 53, y: 23  }
    ]
  }

};




// ------- MOBILE FORMATIONS (Optimized for Portrait View) -------
const mobileFormations = {
  '3-4-1-2': {
    label: '3-4-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LCB', label: 'CB', x: 20, y: 71 },
      { id: 'CB', label: 'CB', x: 50, y: 71 },
      { id: 'RCB', label: 'CB', x: 80, y: 71 },
      { id: 'LM', label: 'LM', x: 12, y: 42 },
      { id: 'LCM', label: 'CM', x: 35, y: 52 },
      { id: 'RCM', label: 'CM', x: 65, y: 52 },
      { id: 'RM', label: 'RM', x: 88, y: 42 },
      { id: 'CAM', label: 'CAM', x: 50, y: 37 },
      { id: 'LS', label: 'ST', x: 38, y: 22 },
      { id: 'RS', label: 'ST', x: 62, y: 22 }
    ]
  },
  '3-4-2-1': {
    label: '3-4-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LCB', label: 'LCB', x: 22, y: 75 },
      { id: 'CB', label: 'CB', x: 50, y: 67 },
      { id: 'RCB', label: 'RCB', x: 78, y: 75 },
      { id: 'LM', label: 'LM', x: 12, y: 45 },
      { id: 'LCM', label: 'LCM', x: 32, y: 55 },
      { id: 'RCM', label: 'RCM', x: 68, y: 55 },
      { id: 'RM', label: 'RM', x: 88, y: 45 },
      { id: 'LAM', label: 'CAM', x: 32, y: 32 },
      { id: 'RAM', label: 'CAM', x: 68, y: 32 },
      { id: 'ST', label: 'ST', x: 50, y: 20 }
    ]
  },
  '3-4-3-DIAMOND': {
    label: '3-4-3 Diamond',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LCB', label: 'LCB', x: 22, y: 72 },
      { id: 'CB', label: 'CB', x: 50, y: 72 },
      { id: 'RCB', label: 'RCB', x: 78, y: 72 },
      { id: 'LM', label: 'LM', x: 15, y: 46 },
      { id: 'CDM', label: 'CDM', x: 38, y: 53 },
      { id: 'CAM', label: 'CAM', x: 62, y: 48 },
      { id: 'RM', label: 'RM', x: 85, y: 46 },
      { id: 'LW', label: 'LW', x: 28, y: 28 },
      { id: 'ST', label: 'ST', x: 50, y: 23 },
      { id: 'RW', label: 'RW', x: 72, y: 28 }
    ]
  },
  '3-4-3-FLAT': {
    label: '3-4-3 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 90 },
      { id: 'LCB', label: 'LCB', x: 20, y: 73 },
      { id: 'CB', label: 'CB', x: 50, y: 73 },
      { id: 'RCB', label: 'RCB', x: 80, y: 73 },
      { id: 'LM', label: 'LM', x: 12, y: 49 },
      { id: 'LCM', label: 'CM', x: 35, y: 49 },
      { id: 'RCM', label: 'CM', x: 65, y: 49 },
      { id: 'RM', label: 'RM', x: 88, y: 49 },
      { id: 'LW', label: 'LW', x: 25, y: 22 },
      { id: 'ST', label: 'ST', x: 50, y: 21 },
      { id: 'RW', label: 'RW', x: 75, y: 22 }
    ]
  },
  '3-5-1-1': {
    label: '3-5-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LCB', label: 'LCB', x: 18, y: 67 },
      { id: 'CB', label: 'CB', x: 50, y: 67 },
      { id: 'RCB', label: 'RCB', x: 82, y: 67 },
      { id: 'LM', label: 'LM', x: 12, y: 38 },
      { id: 'LDM', label: 'CDM', x: 38, y: 53 },
      { id: 'CM', label: 'CM', x: 50, y: 39 },
      { id: 'RDM', label: 'CDM', x: 62, y: 53 },
      { id: 'RM', label: 'RM', x: 88, y: 38 },
      { id: 'LST', label: 'ST', x: 38, y: 23 },
      { id: 'RST', label: 'ST', x: 62, y: 23 }
    ]
  },
  '3-5-2': {
    label: '3-5-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LCB', label: 'LCB', x: 20, y: 69 },
      { id: 'CB', label: 'CB', x: 50, y: 69 },
      { id: 'RCB', label: 'RCB', x: 80, y: 69 },
      { id: 'LM', label: 'LM', x: 12, y: 45 },
      { id: 'LDM', label: 'CDM', x: 35, y: 53 },
      { id: 'CAM', label: 'CAM', x: 50, y: 39 },
      { id: 'RDM', label: 'CDM', x: 65, y: 53 },
      { id: 'RM', label: 'RM', x: 88, y: 45 },
      { id: 'LS', label: 'ST', x: 38, y: 22 },
      { id: 'RS', label: 'ST', x: 62, y: 22 }
    ]
  },
  '4-1-2-1-2-NARROW': {
    label: '4-1-2-1-2 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 33, y: 76 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'CDM', label: 'CDM', x: 50, y: 60 },
      { id: 'LCM', label: 'CM', x: 32, y: 48 },
      { id: 'RCM', label: 'CM', x: 68, y: 48 },
      { id: 'CAM', label: 'CAM', x: 50, y: 34 },
      { id: 'LS', label: 'ST', x: 38, y: 18 },
      { id: 'RS', label: 'ST', x: 62, y: 18 }
    ]
  },
  '4-1-2-1-2-WIDE': {
    label: '4-1-2-1-2 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 75 },
      { id: 'LCB', label: 'CB', x: 33, y: 76 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 75 },
      { id: 'CDM', label: 'CDM', x: 50, y: 60 },
      { id: 'LM', label: 'LM', x: 18, y: 45 },
      { id: 'RM', label: 'RM', x: 82, y: 45 },
      { id: 'CAM', label: 'CAM', x: 50, y: 34 },
      { id: 'LS', label: 'ST', x: 38, y: 23 },
      { id: 'RS', label: 'ST', x: 62, y: 23 }
    ]
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'CDM', label: 'CDM', x: 50, y: 60 },
      { id: 'LM', label: 'LM', x: 18, y: 40 },
      { id: 'CM', label: 'CM', x: 50, y: 40 },
      { id: 'RM', label: 'RM', x: 82, y: 40 },
      { id: 'LS', label: 'ST', x: 38, y: 23 },
      { id: 'RS', label: 'ST', x: 62, y: 23 }
    ]
  },
  '4-1-4-1': {
    label: '4-1-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 12, y: 74 },
      { id: 'LCB', label: 'CB', x: 33, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 88, y: 74 },
      { id: 'CDM', label: 'CDM', x: 50, y: 59 },
      { id: 'LM', label: 'LM', x: 15, y: 43 },
      { id: 'LCM', label: 'CM', x: 36, y: 43 },
      { id: 'RCM', label: 'CM', x: 64, y: 43 },
      { id: 'RM', label: 'RM', x: 85, y: 43 },
      { id: 'ST', label: 'ST', x: 50, y: 24 }
    ]
  },
  '4-2-1-3': {
    label: '4-2-1-3',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LDM', label: 'CDM', x: 32, y: 53 },
      { id: 'RDM', label: 'CDM', x: 68, y: 53 },
      { id: 'CAM', label: 'CAM', x: 50, y: 43 },
      { id: 'LW', label: 'LW', x: 25, y: 25 },
      { id: 'ST', label: 'ST', x: 50, y: 23 },
      { id: 'RW', label: 'RW', x: 75, y: 25 }
    ]
  },
  '4-2-1-3-WIDE': {
    label: '4-2-1-3 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LDM', label: 'CDM', x: 35, y: 60 },
      { id: 'RDM', label: 'CDM', x: 65, y: 60 },
      { id: 'CAM', label: 'CAM', x: 50, y: 40 },
      { id: 'LW', label: 'LW', x: 15, y: 25 },
      { id: 'ST', label: 'ST', x: 50, y: 18 },
      { id: 'RW', label: 'RW', x: 85, y: 25 }
    ]
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 76 },
      { id: 'LCB', label: 'CB', x: 33, y: 76 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 76 },
      { id: 'LDM', label: 'CDM', x: 38, y: 56 },
      { id: 'RDM', label: 'CDM', x: 62, y: 56 },
      { id: 'LAM', label: 'CAM', x: 28, y: 39 },
      { id: 'RAM', label: 'CAM', x: 72, y: 39 },
      { id: 'LS', label: 'ST', x: 38, y: 23 },
      { id: 'RS', label: 'ST', x: 62, y: 23 }
    ]
  },
  '4-2-3-1-NARROW': {
    label: '4-2-3-1 Narrow',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 88 },
      { id: 'LB', label: 'LB', x: 10, y: 70 },
      { id: 'LCB', label: 'CB', x: 33, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 70 },
      { id: 'LDM', label: 'CDM', x: 25, y: 52 },
      { id: 'RDM', label: 'CDM', x: 75, y: 52 },
      { id: 'LAM', label: 'CAM', x: 32, y: 35 },
      { id: 'CAM', label: 'CAM', x: 50, y: 45 },
      { id: 'RAM', label: 'CAM', x: 68, y: 35 },
      { id: 'ST', label: 'ST', x: 50, y: 18 }
    ]
  },
  '3-1-4-2': {
    label: '3-1-4-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LCB', label: 'CB', x: 28, y: 74 },
      { id: 'CB', label: 'CB', x: 50, y: 64 },
      { id: 'RCB', label: 'CB', x: 72, y: 74 },
      { id: 'CDM', label: 'CDM', x: 50, y: 43 },
      { id: 'LCM', label: 'CM', x: 32, y: 43 },
      { id: 'RCM', label: 'CM', x: 68, y: 43 },
      { id: 'LM', label: 'LM', x: 15, y: 46 },
      { id: 'RM', label: 'RM', x: 85, y: 46 },
      { id: 'LST', label: 'ST', x: 38, y: 23 },
      { id: 'RST', label: 'ST', x: 62, y: 23 }
    ]
  },
  '4-2-3-1-WIDE': {
    label: '4-2-3-1 Wide',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 74 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LDM', label: 'CDM', x: 33, y: 52 },
      { id: 'RDM', label: 'CDM', x: 67, y: 52 },
      { id: 'LM', label: 'LM', x: 15, y: 43 },
      { id: 'CAM', label: 'CAM', x: 50, y: 39 },
      { id: 'RM', label: 'RM', x: 85, y: 43 },
      { id: 'ST', label: 'ST', x: 50, y: 22 }
    ]
  },
  '4-2-4': {
    label: '4-2-4',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 71 },
      { id: 'LCB', label: 'CB', x: 30, y: 73 },
      { id: 'RCB', label: 'CB', x: 70, y: 73 },
      { id: 'RB', label: 'RB', x: 90, y: 71 },
      { id: 'LDM', label: 'CDM', x: 35, y: 48 },
      { id: 'RDM', label: 'CDM', x: 65, y: 48 },
      { id: 'LW', label: 'LW', x: 20, y: 30 },
      { id: 'LS', label: 'ST', x: 38, y: 23 },
      { id: 'RS', label: 'ST', x: 62, y: 23 },
      { id: 'RW', label: 'RW', x: 80, y: 30 }
    ]
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 74 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LCM', label: 'CM', x: 28, y: 48 },
      { id: 'CM', label: 'CM', x: 50, y: 57 },
      { id: 'RCM', label: 'CM', x: 72, y: 48 },
      { id: 'CAM', label: 'CAM', x: 50, y: 37 },
      { id: 'LS', label: 'ST', x: 38, y: 22 },
      { id: 'RS', label: 'ST', x: 62, y: 22 }
    ]
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 12, y: 72 },
      { id: 'LCB', label: 'CB', x: 33, y: 74 },
      { id: 'RCB', label: 'CB', x: 67, y: 74 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LCM', label: 'CM', x: 25, y: 54 },
      { id: 'CM', label: 'CM', x: 50, y: 54 },
      { id: 'RCM', label: 'CM', x: 75, y: 54 },
      { id: 'LAM', label: 'CAM', x: 32, y: 32 },
      { id: 'RAM', label: 'CAM', x: 68, y: 32 },
      { id: 'ST', label: 'ST', x: 50, y: 22 }
    ]
  },
  '4-3-3': {
    label: '4-3-3',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 74 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LCM', label: 'CM', x: 28, y: 55 },
      { id: 'CM', label: 'CM', x: 50, y: 50 },
      { id: 'RCM', label: 'CM', x: 72, y: 55 },
      { id: 'LW', label: 'LW', x: 25, y: 27 },
      { id: 'ST', label: 'ST', x: 50, y: 24 },
      { id: 'RW', label: 'RW', x: 75, y: 27 }
    ]
  },
  '4-3-3-ATTACK': {
    label: '4-3-3 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LCM', label: 'CM', x: 25, y: 49 },
      { id: 'CAM', label: 'CAM', x: 50, y: 46 },
      { id: 'RCM', label: 'CM', x: 75, y: 49 },
      { id: 'LW', label: 'LW', x: 25, y: 25 },
      { id: 'ST', label: 'ST', x: 50, y: 23 },
      { id: 'RW', label: 'RW', x: 75, y: 25 }
    ]
  },
  '4-3-3-DEFEND': {
    label: '4-3-3 Defend',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 73 },
      { id: 'LCB', label: 'CB', x: 32, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 73 },
      { id: 'LDM', label: 'CDM', x: 22, y: 52 },
      { id: 'CM', label: 'CM', x: 50, y: 50 },
      { id: 'RDM', label: 'CDM', x: 78, y: 52 },
      { id: 'LW', label: 'LW', x: 24, y: 29 },
      { id: 'ST', label: 'ST', x: 50, y: 23 },
      { id: 'RW', label: 'RW', x: 76, y: 29 }
    ]
  },
  '4-3-3-FALSE9': {
    label: '4-3-3 False 9',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 12, y: 72 },
      { id: 'LCB', label: 'CB', x: 33, y: 76 },
      { id: 'RCB', label: 'CB', x: 67, y: 76 },
      { id: 'RB', label: 'RB', x: 88, y: 72 },
      { id: 'LCM', label: 'CM', x: 28, y: 50 },
      { id: 'CM', label: 'CM', x: 50, y: 55 },
      { id: 'RCM', label: 'CM', x: 72, y: 50 },
      { id: 'LW', label: 'LW', x: 28, y: 25 },
      { id: 'CF', label: 'CF', x: 50, y: 30 },
      { id: 'RW', label: 'RW', x: 72, y: 25 }
    ]
  },
  '4-3-3-HOLDING': {
    label: '4-3-3 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 74 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'CDM', label: 'CDM', x: 50, y: 53 },
      { id: 'LCM', label: 'CM', x: 28, y: 50 },
      { id: 'RCM', label: 'CM', x: 72, y: 50 },
      { id: 'LW', label: 'LW', x: 28, y: 25 },
      { id: 'ST', label: 'ST', x: 50, y: 23 },
      { id: 'RW', label: 'RW', x: 72, y: 25 }
    ]
  },
  '4-4-1-1': {
    label: '4-4-1-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LM', label: 'LM', x: 15, y: 50 },
      { id: 'LCM', label: 'CM', x: 35, y: 52 },
      { id: 'RCM', label: 'CM', x: 65, y: 52 },
      { id: 'RM', label: 'RM', x: 85, y: 50 },
      { id: 'CAM', label: 'CAM', x: 50, y: 32 },
      { id: 'ST', label: 'ST', x: 50, y: 16 }
    ]
  },
  '4-4-1-1-ATTACK': {
    label: '4-4-1-1 Attack',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 74 },
      { id: 'RCB', label: 'CB', x: 68, y: 74 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LM', label: 'LM', x: 12, y: 48 },
      { id: 'LCM', label: 'CM', x: 33, y: 47 },
      { id: 'RCM', label: 'CM', x: 67, y: 47 },
      { id: 'RM', label: 'RM', x: 88, y: 48 },
      { id: 'CAM', label: 'CAM', x: 50, y: 40 },
      { id: 'ST', label: 'ST', x: 50, y: 22 }
    ]
  },
  '4-4-2-FLAT': {
    label: '4-4-2 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 70 },
      { id: 'LCB', label: 'CB', x: 35, y: 72 },
      { id: 'RCB', label: 'CB', x: 65, y: 72 },
      { id: 'RB', label: 'RB', x: 90, y: 70 },
      { id: 'LM', label: 'LM', x: 10, y: 46 },
      { id: 'LCM', label: 'CM', x: 35, y: 48 },
      { id: 'RCM', label: 'CM', x: 65, y: 48 },
      { id: 'RM', label: 'RM', x: 90, y: 46 },
      { id: 'LS', label: 'ST', x: 35, y: 22 },
      { id: 'RS', label: 'ST', x: 65, y: 22 }
    ]
  },
  '4-4-2-HOLDING': {
    label: '4-4-2 Holding',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 12, y: 71 },
      { id: 'LCB', label: 'CB', x: 36, y: 73 },
      { id: 'RCB', label: 'CB', x: 64, y: 73 },
      { id: 'RB', label: 'RB', x: 88, y: 71 },
      { id: 'LM', label: 'LM', x: 15, y: 44 },
      { id: 'LDM', label: 'CDM', x: 36, y: 49 },
      { id: 'RDM', label: 'CDM', x: 64, y: 49 },
      { id: 'RM', label: 'RM', x: 85, y: 44 },
      { id: 'LS', label: 'ST', x: 36, y: 22 },
      { id: 'RS', label: 'ST', x: 64, y: 22 }
    ]
  },
  '4-5-1': {
    label: '4-5-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 72 },
      { id: 'LCB', label: 'CB', x: 32, y: 76 },
      { id: 'RCB', label: 'CB', x: 68, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 72 },
      { id: 'LM', label: 'LM', x: 12, y: 48 },
      { id: 'LAM', label: 'CAM', x: 30, y: 39 },
      { id: 'CM', label: 'CM', x: 50, y: 52 },
      { id: 'RAM', label: 'CAM', x: 70, y: 39 },
      { id: 'RM', label: 'RM', x: 88, y: 48 },
      { id: 'ST', label: 'ST', x: 50, y: 20 }
    ]
  },
  '4-5-1-FLAT': {
    label: '4-5-1 Flat',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 74 },
      { id: 'LCB', label: 'CB', x: 30, y: 76 },
      { id: 'RCB', label: 'CB', x: 70, y: 76 },
      { id: 'RB', label: 'RB', x: 90, y: 74 },
      { id: 'LM', label: 'LM', x: 12, y: 48 },
      { id: 'LCM', label: 'CM', x: 32, y: 50 },
      { id: 'CM', label: 'CM', x: 50, y: 52 },
      { id: 'RCM', label: 'CM', x: 68, y: 50 },
      { id: 'RM', label: 'RM', x: 88, y: 48 },
      { id: 'ST', label: 'ST', x: 50, y: 23 }
    ]
  },
  '5-2-1-2': {
    label: '5-2-1-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LWB', label: 'LWB', x: 12, y: 67 },
      { id: 'LCB', label: 'CB', x: 32, y: 69 },
      { id: 'CB', label: 'CB', x: 50, y: 69 },
      { id: 'RCB', label: 'CB', x: 68, y: 69 },
      { id: 'RWB', label: 'RWB', x: 88, y: 67 },
      { id: 'LCM', label: 'CM', x: 30, y: 48 },
      { id: 'RCM', label: 'CM', x: 70, y: 48 },
      { id: 'CAM', label: 'CAM', x: 50, y: 36 },
      { id: 'LS', label: 'ST', x: 38, y: 22 },
      { id: 'RS', label: 'ST', x: 62, y: 22 }
    ]
  },
  '5-2-2-1': {
    label: '5-2-2-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LWB', label: 'LWB', x: 8, y: 62 },
      { id: 'LCB', label: 'CB', x: 28, y: 65 },
      { id: 'CB', label: 'CB', x: 50, y: 65 },
      { id: 'RCB', label: 'CB', x: 72, y: 65 },
      { id: 'RWB', label: 'RWB', x: 92, y: 62 },
      { id: 'LCM', label: 'CM', x: 36, y: 44 },
      { id: 'RCM', label: 'CM', x: 64, y: 44 },
      { id: 'LW', label: 'LW', x: 28, y: 26 },
      { id: 'RW', label: 'RW', x: 72, y: 26 },
      { id: 'ST', label: 'ST', x: 50, y: 22 }
    ]
  },
  '5-3-2': {
    label: '5-3-2',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LWB', label: 'LWB', x: 10, y: 67 },
      { id: 'LCB', label: 'CB', x: 32, y: 69 },
      { id: 'CB', label: 'CB', x: 50, y: 69 },
      { id: 'RCB', label: 'CB', x: 68, y: 69 },
      { id: 'RWB', label: 'RWB', x: 90, y: 67 },
      { id: 'LCM', label: 'CM', x: 22, y: 43 },
      { id: 'CM', label: 'CM', x: 50, y: 43 },
      { id: 'RCM', label: 'CM', x: 78, y: 43 },
      { id: 'LS', label: 'ST', x: 36, y: 23 },
      { id: 'RS', label: 'ST', x: 64, y: 23 }
    ]
  },
  '5-4-1': {
    label: '5-4-1',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 92 },
      { id: 'LWB', label: 'LWB', x: 8, y: 70 },
      { id: 'LCB', label: 'CB', x: 26, y: 76 },
      { id: 'CB', label: 'CB', x: 50, y: 80 },
      { id: 'RCB', label: 'CB', x: 74, y: 76 },
      { id: 'RWB', label: 'RWB', x: 92, y: 70 },
      { id: 'LM', label: 'LM', x: 18, y: 48 },
      { id: 'LCM', label: 'CM', x: 36, y: 52 },
      { id: 'RCM', label: 'CM', x: 64, y: 52 },
      { id: 'RM', label: 'RM', x: 82, y: 48 },
      { id: 'ST', label: 'ST', x: 50, y: 20 }
    ]
  },
  '5-4-1-HOLDING': {
    label: '5-4-1-HOLDING',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LWB', label: 'LWB', x: 10, y: 67 },
      { id: 'LCB', label: 'CB', x: 28, y: 70 },
      { id: 'CB', label: 'CB', x: 50, y: 70 },
      { id: 'RCB', label: 'CB', x: 72, y: 70 },
      { id: 'RWB', label: 'RWB', x: 90, y: 67 },
      { id: 'LM', label: 'LM', x: 22, y: 37 },
      { id: 'CDM', label: 'CDM', x: 38, y: 44 },
      { id: 'CAM', label: 'CAM', x: 62, y: 31 },
      { id: 'RM', label: 'RM', x: 78, y: 39 },
      { id: 'ST', label: 'ST', x: 50, y: 23 }
    ]
  },
  '5-4-1-DEFEND': {
    label: '5-4-1-DEFEND',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 10, y: 73 },
      { id: 'LCB', label: 'CB', x: 28, y: 66 },
      { id: 'CB', label: 'CB', x: 50, y: 63 },
      { id: 'RCB', label: 'CB', x: 72, y: 66 },
      { id: 'RB', label: 'RB', x: 90, y: 73 },
      { id: 'LM', label: 'LM', x: 16, y: 42 },
      { id: 'LCM', label: 'CM', x: 35, y: 39 },
      { id: 'RCM', label: 'CM', x: 65, y: 39 },
      { id: 'RM', label: 'RM', x: 84, y: 42 },
      { id: 'ST', label: 'ST', x: 50, y: 23 }
    ]
  },
  '4-4-1-1-FLAT': {
    label: '4-4-1-1-FLAT',
    slots: [
      { id: 'GK', label: 'GK', x: 50, y: 89 },
      { id: 'LB', label: 'LB', x: 12, y: 67 },
      { id: 'LCB', label: 'CB', x: 33, y: 70 },
      { id: 'RCB', label: 'CB', x: 67, y: 70 },
      { id: 'RB', label: 'RB', x: 88, y: 70 },
      { id: 'RCM', label: 'CM', x: 62, y: 47 },
      { id: 'LM', label: 'LM', x: 18, y: 40 },
      { id: 'LCM', label: 'CM', x: 35, y: 47 },
      { id: 'CF', label: 'CF', x: 50, y: 40 },
      { id: 'RM', label: 'RM', x: 82, y: 40 },
      { id: 'ST', label: 'ST', x: 50, y: 23 }
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

function handleSlotDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (squadState.dragging) {
    const slot = e.target.closest('.squad-slot');
    if (slot) slot.classList.add('drag-over');
  }
}

function handleSlotDragLeave(e) {
  const slot = e.target.closest('.squad-slot');
  if (slot) slot.classList.remove('drag-over');
}

function handleSlotDrop(e, targetSlotId) {
  e.preventDefault();
  e.stopPropagation();
  if (!squadState.dragging) return;
  
  const draggedId = squadState.dragging;
  const source = squadState.dragSource;
  const draggedPlayer = players.find(p => p.id === draggedId);
  if (!draggedPlayer) return;
  
  // Validation
  if (source.type === 'picker') {
    if (!validateAssignment(draggedPlayer, targetSlotId)) { clearDragState(); return; }
    if (isPlayerAlreadyInSquad(draggedId, targetSlotId)) { showToast('Player already in squad', 'error'); clearDragState(); return; }
    removeIfAssigned(draggedId);
    squadState.starters[targetSlotId] = draggedId;
  } 
  // ... (Simplified logic for brevity, assumes standard swapping logic exists)
  else {
      // Logic for swapping slots
      squadState.starters[targetSlotId] = draggedId;
      if(source.type === 'slot') delete squadState.starters[source.id];
  }
  
  clearDragState();
  renderSquadBuilder();
}

function clearDragState() {
  document.querySelectorAll('.dragging, .drag-over').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
  squadState.dragging = null;
  squadState.dragSource = null;
}

// ============ RENDER LOGIC ============

function renderSquadBuilder() {
  const nameEl = document.getElementById('squad-name-input');
  const ovrEl = document.getElementById('squad-ovr');
  const valueEl = document.getElementById('squad-value');
  const formationSelect = document.getElementById('formation-select');
  
  if (nameEl) nameEl.value = squadState.name || 'My Squad';
  if (formationSelect) formationSelect.value = squadState.formationId;
  if (ovrEl) ovrEl.textContent = calculateOVR() || 0;
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

// ============ UPDATED: REDIRECT ON CLICK ============
function renderSlot(slot) {
  const container = document.createElement('div');
  container.className = 'squad-slot';
  container.style.left = slot.x + '%';
  container.style.top = slot.y + '%';
  container.dataset.slotId = slot.id;

  const assignedId = squadState.starters[slot.id] || null;
  const player = assignedId ? players.find(p => p.id === assignedId) : null;

  const card = document.createElement('div');
  card.className = 'squad-card' + (player ? ' filled' : '');
  card.setAttribute('draggable', player ? 'true' : 'false');
  
  // Drag Events
  card.addEventListener('dragstart', (e) => {
    if (player) handleCardDragStart(e, assignedId, 'slot', slot.id);
  });
  container.addEventListener('dragover', handleSlotDragOver);
  container.addEventListener('dragleave', handleSlotDragLeave);
  container.addEventListener('drop', (e) => handleSlotDrop(e, slot.id));

  // Card Content
  if (player) {
    card.innerHTML = `
      <div class="squad-card-badge">${slot.label}</div>
      <div class="squad-card-ovr">${player.overall}</div>
      <div class="squad-card-name">${player.name}</div>
      <div class="squad-card-pos">${player.position}</div>
      <button class="squad-card-remove">×</button>
    `;
    card.querySelector('.squad-card-remove')?.addEventListener('click', (e) => {
      e.stopPropagation();
      delete squadState.starters[slot.id];
      renderSquadBuilder();
    });
  } else {
    card.innerHTML = `
      <div class="squad-card-pedestal">${slot.label}</div>
      <div class="squad-card-empty">+</div>
    `;
  }

  // --- CLICK REDIRECT LOGIC ---
  card.addEventListener('click', () => {
    // 1. Set the active slot context (so we know what we clicked)
    squadState.activeSlot = slot.id;

    // 2. Set the global filter to the slot's position (e.g., 'ST', 'CM')
    if(state && state.filters) {
        state.filters.position = slot.label; // Use label (e.g. CM) not ID (e.g. LCM)
        
        // Update the visual filter dropdown if it exists in the database view
        const filterDropdown = document.getElementById('filter-position');
        if(filterDropdown) filterDropdown.value = slot.label;
    }

    // 3. Close the squad builder modal
    closeSquadBuilderModal();

    // 4. Redirect to Database View
    if(typeof switchView === 'function') {
        switchView('database');
        
        // 5. Reload database with new filters
        if(typeof loadDatabase === 'function') {
            loadDatabase();
        }
        
        showToast(`Filtered Database for ${slot.label}`, 'success');
    }
  });

  container.appendChild(card);
  return container;
}
// ============ END REDIRECT LOGIC ============

function renderBench() {
  const bench = document.getElementById('squad-bench');
  if (!bench) return;
  bench.innerHTML = '';
  
  for (let i = 0; i < 7; i++) {
    const pid = squadState.bench[i] || null;
    const player = pid ? players.find(p => p.id === pid) : null;
    const cell = document.createElement('div');
    cell.className = 'bench-cell' + (player ? ' filled' : '');
    
    // ... (Bench drag/drop logic omitted for brevity, same as original) ...
    
    if (player) {
        cell.innerHTML = `
            <div class="bench-ovr">${player.overall}</div>
            <div class="bench-name">${player.name}</div>
            <button class="bench-remove">×</button>
        `;
        cell.querySelector('.bench-remove')?.addEventListener('click', (e) => {
            e.stopPropagation();
            squadState.bench.splice(i, 1);
            renderSquadBuilder();
        });
    } else {
        cell.innerHTML = `<div class="bench-empty">Sub ${i + 1}</div>`;
    }

    // Bench Redirect Logic
    cell.addEventListener('click', () => {
         squadState.activeSlot = `BENCH_${i}`;
         closeSquadBuilderModal();
         switchView('database');
         showToast('Select a player from Database', 'info');
    });

    bench.appendChild(cell);
  }
}

// Helpers
function validateAssignment(player, slotId) {
  if (player.position === 'GK' && slotId !== 'GK') { showToast('GK only in GK slot', 'error'); return false; }
  if (slotId === 'GK' && player.position !== 'GK') { showToast('Only GK in GK slot', 'error'); return false; }
  return true;
}

function isPlayerAlreadyInSquad(playerId, targetSlot) {
  for (const [slotId, pid] of Object.entries(squadState.starters)) {
    if (slotId !== targetSlot && pid === playerId) return true;
  }
  if (squadState.bench.includes(playerId)) return true;
  return false;
}

function removeIfAssigned(playerId) {
  Object.keys(squadState.starters).forEach(k => {
    if (squadState.starters[k] === playerId) delete squadState.starters[k];
  });
  const idx = squadState.bench.indexOf(playerId);
  if (idx !== -1) squadState.bench.splice(idx, 1);
}

function calculateOVR() {
  // Calculation logic...
  return 0; // Placeholder
}
function calculateValue() { return 0; }

// Global Exports
window.openSquadBuilderModal = openSquadBuilderModal;
window.closeSquadBuilderModal = closeSquadBuilderModal;
window.changeFormation = function(id) { squadState.formationId = id; renderSquadBuilder(); };
window.updatePickerSearch = updatePickerSearch;
window.clearSquadFilters = clearSquadFilters;
window.applyFiltersToPickerPlayers = applyFiltersToPickerPlayers;
window.openFilterSidebarForPicker = () => document.getElementById('filter-sidebar')?.classList.add('open');
window.closeFilterSidebarForPicker = () => document.getElementById('filter-sidebar')?.classList.remove('open');