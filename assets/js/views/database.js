// FC Market Pro - Database View
// Handles player database, filtering, and sorting

async function fetchPlayersSortedByPrice(order = 'desc', limit = 20, offset = 0) {
    console.log('[DB] Fetching top priced players from Supabase...');

    const rank = state.currentRank || 0;
    const priceColumn = `price${rank}`;

    const { data: priceData, error } = await window.supabaseClient
        .from('price_snapshots')
        .select(`asset_id, ${priceColumn}`)
        .not(priceColumn, 'is', null)
        .gt(priceColumn, 0)
        .order(priceColumn, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('[DB] Supabase price fetch failed:', error);
        return [];
    }

    console.log('[DB] Supabase returned:', priceData.length, 'entries');
    if (priceData.length === 0) return [];

    const ids = priceData.map(p => p.asset_id).join(',');

    const response = await apiClient.fetchWithCache(
        `/players/by-ids?ids=${ids}&rank=${rank}`,
        { cache: false }
    );

    const players = response.players || [];

    // Merge price onto each player
    players.forEach(player => {
        const priceEntry = priceData.find(p => String(p.asset_id) === String(player.player_id));
        if (priceEntry) player.price = priceEntry[priceColumn];
    });

    // Re-sort by price (backend returns in DB order)
    players.sort((a, b) =>
        order === 'desc' ? (b.price || 0) - (a.price || 0) : (a.price || 0) - (b.price || 0)
    );

    console.log('[DB] Final merged players:', players.length);
    return players;
}


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
    state.sortDirection = 'desc';
    if (state.pagination) state.pagination.page = 1;
    renderPlayers();
    renderSortHeader();
}


async function renderPlayers() {
    const grid = document.getElementById('players-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">Loading...</div>';

    let players;

    try {
        if (state.sortBy === 'price') {
            const limit = state.pagination?.limit || 20;
            const offset = ((state.pagination?.page || 1) - 1) * limit;
            players = await fetchPlayersSortedByPrice(
                state.sortDirection || 'desc',
                limit,
                offset
            );
        } else {
            players = await fetchPlayersFromBackend();

            // Frontend sort for stat columns only
            const statSorts = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
            if (statSorts.includes(state.sortBy)) {
                players.sort((a, b) => {
                    const aVal = a[state.sortBy] || 0;
                    const bVal = b[state.sortBy] || 0;
                    return state.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });
            }
        }
    } catch (err) {
        console.error('[DB] renderPlayers error:', err);
        players = [];
    }

    if (!players || players.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">No players found.</div>';
        return;
    }

    grid.innerHTML = '';
    players.forEach(player => grid.appendChild(createPlayerCard(player)));
    renderSortHeader();
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

