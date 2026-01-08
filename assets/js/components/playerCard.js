// FC Market Pro - Player Card Component
// Handles all player card rendering logic - Renderz Style

/**
 * Create a player card element with Renderz design (for Database/Watchlist views)
 * @param {Object} player - Player object containing all player data
 * @returns {HTMLElement} - Rendered player card DOM element
 */
function createPlayerCard(player) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'player-row';
    
    // ✅ Map Zenith primary link to Supabase player_id
    const primaryId = player.player_id;

    // ✅ ADD DATA ATTRIBUTES FOR FILTERING
    card.dataset.playerId = primaryId;
    card.dataset.name = player.name;
    card.dataset.position = player.position;
    card.dataset.rating = player.ovr || player.overall;
    card.dataset.price = player.price || 0;
    card.dataset.league = player.league || '';
    card.dataset.nation = player.nation || '';
    card.dataset.skill = player.skillMoves || '';
    card.dataset.change = player.priceChange || 0;
    
    // Check watchlist status (using primaryId)
    const isWatchlisted = state.watchlist.includes(primaryId);

    // Map primary positions to secondary positions
    const secondaryPositions = {
        'RW': 'RM',
        'LW': 'LM',
        'ST': 'CF',
        'CM': 'CAM',
        'CB': 'CDM',
        'LB': 'LWB',
        'RB': 'RWB',
        'GK': ''
    };
    const secondaryPosition = secondaryPositions[player.position] || '';

    // ✅ Format Price (uses Supabase price0 if available, else N/A)
    const displayPrice = player.price ? formatPrice(player.price) : 'N/A';

    // Build card HTML structure
    card.innerHTML = `
        <div class="player-row-card">
            <div class="player-card-image-placeholder">
                <span class="player-initials">${getInitials(player.name)}</span>
            </div>
        </div>
        
        <div class="player-row-info">
            <div class="player-info-name">${player.name}</div>
            <div class="player-info-meta">${player.ovr || player.overall} • ${player.position}</div>
            <div class="player-price" style="color: #fbbf24; font-weight: 500; font-size: 0.9rem; margin-top: 4px;">${displayPrice}</div>
            ${secondaryPosition ? `<div class="player-info-secondary">${secondaryPosition}</div>` : ''}
        </div>
        
        <div class="player-row-stats">
            <div class="stat-pill">
                <div class="stat-pill-value">${player.pace}</div>
                <div class="stat-pill-label">PAC</div>
            </div>

            <div class="stat-pill">
                <div class="stat-pill-value">${player.shooting}</div>
                <div class="stat-pill-label">SHO</div>
            </div>

            <div class="stat-pill">
                <div class="stat-pill-value">${player.passing}</div>
                <div class="stat-pill-label">PAS</div>
            </div>

            <div class="stat-pill">
                <div class="stat-pill-value">${player.dribbling}</div>
                <div class="stat-pill-label">DRI</div>
            </div>

            <div class="stat-pill">
                <div class="stat-pill-value">${player.defending}</div>
                <div class="stat-pill-label">DEF</div>
            </div>

            <div class="stat-pill">
                <div class="stat-pill-value">${player.physical}</div>
                <div class="stat-pill-label">PHY</div>
            </div>
        </div>
        
        <button class="player-row-watchlist ${isWatchlisted ? 'active' : ''}" 
                data-player-id="${primaryId}"
                aria-label="Toggle watchlist for ${player.name}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    `;

    // Add click event to card (using primaryId)
    card.addEventListener('click', function(e) {
        // Avoid double triggering if clicking internal buttons
        if (e.target.closest('.player-row-watchlist')) return;

        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(primaryId);
        } else {
            console.error('viewPlayerDetail function is not available');
        }
    });

    // Add click event to watchlist button
    const watchlistBtn = card.querySelector('.player-row-watchlist');
    if (watchlistBtn) {
        watchlistBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWatchlist(primaryId);
        });
    }

    return card;
}

/**
 * Create a premium vertical player card for Dashboard/Home view
 * @param {Object} player - Player object containing all player data
 * @returns {HTMLElement} - Rendered dashboard player card DOM element
 */

/**
 * Create a clean, simple player card for Dashboard/Home view
 * @param {Object} player - Player object containing all player data
 * @returns {HTMLElement} - Rendered dashboard player card DOM element
 */
function createDashboardPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'dashboard-player-card-clean';
    
    // ✅ Use primaryId (player_id)
    const primaryId = player.player_id;
    
    const isWatchlisted = state.watchlist.includes(primaryId);
    const priceChangeClass = player.priceChange >= 0 ? 'up' : 'down';
    const priceChangeSymbol = player.priceChange >= 0 ? '↑' : '↓';
    
    // ✅ Format Price
    const displayPrice = player.price ? formatPrice(player.price) : 'N/A';

    card.innerHTML = `
        <div class="clean-card-container">
            <div class="clean-card-avatar">
                <span class="clean-avatar-initials">${getInitials(player.name)}</span>
                <div class="clean-card-rating">${player.ovr || player.overall}</div>
            </div>
            
            <div class="clean-card-info">
                <h3 class="clean-player-name">${player.name}</h3>
                <div class="clean-position-badge">${player.position}</div>
                <p class="clean-club-name">${player.club}</p>
            </div>
            
            <div class="clean-price-row">
                <span class="clean-price-value">${displayPrice}</span>
                <span class="clean-price-change ${priceChangeClass}">
                    ${priceChangeSymbol}${Math.abs(player.priceChange || 0).toFixed(1)}%
                </span>
            </div>
            
            <button class="clean-view-btn">View Details</button>
            
            <button class="clean-watchlist-heart ${isWatchlisted ? 'active' : ''}" 
                    data-player-id="${primaryId}"
                    aria-label="Toggle watchlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
        </div>
    `;

    // Add click event to view details button
    const viewBtn = card.querySelector('.clean-view-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof viewPlayerDetail === 'function') {
                viewPlayerDetail(primaryId);
            }
        });
    }

    // Add click event to watchlist button
    const watchlistBtn = card.querySelector('.clean-watchlist-heart');
    if (watchlistBtn) {
        watchlistBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWatchlist(primaryId);
        });
    }

    // Add click event to card
    card.addEventListener('click', function(e) {
        if (e.target.closest('.clean-watchlist-heart') || e.target.closest('.clean-view-btn')) return;

        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(primaryId);
        }
    });

    return card;
}