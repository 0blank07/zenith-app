// FC Market Pro - Database View
// Handles player database, filtering, and sorting

function loadDatabase() {
    renderPlayers();
}

function renderSortHeader() {
    const grid = document.getElementById('players-grid');
    if (!grid) return;

    // Check if header already exists
    let header = document.querySelector('.database-sort-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'database-sort-header';
        header.innerHTML = `
            <div class="sort-card-spacer"></div>
            <div class="sort-info-spacer"></div>
            <div class="sort-label-group">
                <div class="sort-label ${state.sortBy === 'pace' ? 'active' : ''}" onclick="setSortBy('pace')">
                    PAC ${state.sortBy === 'pace' ? '↓' : ''}
                </div>

                <div class="sort-label ${state.sortBy === 'shooting' ? 'active' : ''}" onclick="setSortBy('shooting')">
                    SHO ${state.sortBy === 'shooting' ? '↓' : ''}
                </div>

                <div class="sort-label ${state.sortBy === 'passing' ? 'active' : ''}" onclick="setSortBy('passing')">
                    PAS ${state.sortBy === 'passing' ? '↓' : ''}
                </div>

                <div class="sort-label ${state.sortBy === 'dribbling' ? 'active' : ''}" onclick="setSortBy('dribbling')">
                    DRI ${state.sortBy === 'dribbling' ? '↓' : ''}
                </div>

                <div class="sort-label ${state.sortBy === 'defending' ? 'active' : ''}" onclick="setSortBy('defending')">
                    DEF ${state.sortBy === 'defending' ? '↓' : ''}
                </div>

                <div class="sort-label ${state.sortBy === 'physical' ? 'active' : ''}" onclick="setSortBy('physical')">
                    PHY ${state.sortBy === 'physical' ? '↓' : ''}
                </div>
                
            </div>
            <div class="sort-watchlist-spacer"></div>
        `;
        grid.parentElement.insertBefore(header, grid);
    } else {
        // Update existing header
        header.innerHTML = `
            <div class="sort-card-spacer"></div>
            <div class="sort-info-spacer"></div>
            <div class="sort-label-group">
                <div class="sort-label ${state.sortBy === 'shooting' ? 'active' : ''}" onclick="setSortBy('shooting')">
                    SHO ${state.sortBy === 'shooting' ? '↓' : ''}
                </div>
                <div class="sort-label ${state.sortBy === 'passing' ? 'active' : ''}" onclick="setSortBy('passing')">
                    PAS ${state.sortBy === 'passing' ? '↓' : ''}
                </div>
                <div class="sort-label ${state.sortBy === 'dribbling' ? 'active' : ''}" onclick="setSortBy('dribbling')">
                    DRI ${state.sortBy === 'dribbling' ? '↓' : ''}
                </div>
                <div class="sort-label ${state.sortBy === 'defending' ? 'active' : ''}" onclick="setSortBy('defending')">
                    DEF ${state.sortBy === 'defending' ? '↓' : ''}
                </div>
                <div class="sort-label ${state.sortBy === 'physical' ? 'active' : ''}" onclick="setSortBy('physical')">
                    PHY ${state.sortBy === 'physical' ? '↓' : ''}
                </div>
                <div class="sort-label ${state.sortBy === 'pace' ? 'active' : ''}" onclick="setSortBy('pace')">
                    PAC ${state.sortBy === 'pace' ? '↓' : ''}
                </div>
            </div>
            <div class="sort-watchlist-spacer"></div>
        `;
    }
}

function setSortBy(stat) {
    state.sortBy = stat;
    renderPlayers();
    renderSortHeader();
}

function renderPlayers() {
  const grid = document.getElementById('players-grid');
  if (!grid) return;

  const filteredPlayers = getSortedAndFilteredPlayers();

  if (filteredPlayers.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No players found. Try adjusting your filters or search query</div>';
    return;
  }

  grid.innerHTML = '';
  filteredPlayers.forEach(player => {
    grid.appendChild(createPlayerCard(player));
  });
}

function filterPlayers() {
    return players.filter(player => {
        // Search filter
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            const matchName = player.name.toLowerCase().includes(query);
            const matchPosition = player.position.toLowerCase().includes(query);
            const matchClub = player.club.toLowerCase().includes(query);
            const matchLeague = player.league.toLowerCase().includes(query);
            const matchNation = player.nation.toLowerCase().includes(query);
            if (!matchName && !matchPosition && !matchClub && !matchLeague && !matchNation) {
                return false;
            }
        }

        // Position filter
        if (state.filters.position && player.position !== state.filters.position) {
            return false;
        }

        // Rating filter
        if (player.overall < state.filters.ratingMin || player.overall > state.filters.ratingMax) {
            return false;
        }

        // Price filter
        if (state.filters.priceMin && player.price < state.filters.priceMin) {
            return false;
        }
        if (state.filters.priceMax && player.price > state.filters.priceMax) {
            return false;
        }

        // League filter
        if (state.filters.league && player.league !== state.filters.league) {
            return false;
        }

        // Nation filter
        if (state.filters.nation && player.nation !== state.filters.nation) {
            return false;
        }

        // Skill moves filter
        if (state.filters.skillMoves && player.skillMoves < parseInt(state.filters.skillMoves)) {
            return false;
        }

        return true;
    });
}

function sortPlayers(playersList) {
    const sorted = [...playersList];

    switch (state.sortBy) {
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'overall':
            sorted.sort((a, b) => b.overall - a.overall);
            break;
        case 'price':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'priceChange':
            sorted.sort((a, b) => b.priceChange - a.priceChange);
            break;
        case 'pace':
            sorted.sort((a, b) => b.pace - a.pace);
            break;
        case 'shooting':
            sorted.sort((a, b) => b.shooting - a.shooting);
            break;
        case 'passing':
            sorted.sort((a, b) => b.passing - a.passing);
            break;
        case 'dribbling':
            sorted.sort((a, b) => b.dribbling - a.dribbling);
            break;
        case 'defending':
            sorted.sort((a, b) => b.defending - a.defending);
            break;
        case 'physical':
            sorted.sort((a, b) => b.physical - a.physical);
            break;
    }

    return sorted;
}

function getSortedAndFilteredPlayers() {
  let filtered = players.filter(player => {
    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      if (!player.name.toLowerCase().includes(query) &&
          !player.position.toLowerCase().includes(query) &&
          !player.club.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Overall rating filter
    if (player.overall < state.filters.ratingMin || player.overall > state.filters.ratingMax) {
      return false;
    }

    // Position filter
    if (state.filters.position && player.position !== state.filters.position) {
      return false;
    }

    // Price filter
    if (state.filters.priceMin && player.price < state.filters.priceMin) {
      return false;
    }
    if (state.filters.priceMax && player.price > state.filters.priceMax) {
      return false;
    }

    // League filter
    if (state.filters.league && player.league !== state.filters.league) {
      return false;
    }

    // Nation filter
    if (state.filters.nation && player.nation !== state.filters.nation) {
      return false;
    }

    // Skill moves filter
    if (state.filters.skillMoves && player.skillMoves !== parseInt(state.filters.skillMoves)) {
      return false;
    }

    return true;
  });

  // Sort logic with direction toggle
  filtered.sort((a, b) => {
    let aValue, bValue;

    const statMap = {
      'shooting': 'shooting',
      'pace': 'pace',
      'passing': 'passing',
      'dribbling': 'dribbling',
      'defense': 'defending',
      'defending': 'defending',
      'physical': 'physical',
      'overall': 'overall',
      'price': 'price',
      'name': 'name'
    };

    const sortKey = statMap[state.sortBy] || state.sortBy;
    aValue = a[sortKey];
    bValue = b[sortKey];

    // Handle string comparisons
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      
      if (state.sortDirection === 'desc') {
        return bValue.localeCompare(aValue);
      } else {
        return aValue.localeCompare(bValue);
      }
    }

    // Handle numeric comparisons
    if (state.sortDirection === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  return filtered;
}