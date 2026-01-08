// FC Market Pro - Dashboard View
// Handles the main dashboard/homepage functionality

// ========== LOAD DASHBOARD FROM API ==========
async function loadDashboard() {
    console.log('[DASHBOARD] Loading dashboard...');

    // Initialize banner
    if (typeof initBannerSlider === 'function') {
        initBannerSlider();
    }

    // Load stats
    if (window.apiClient) {
        try {
            const health = await window.apiClient.checkHealth();
            const totalEl = document.getElementById('total-players');
            if (totalEl && health.total_players) {
                animateNumber('total-players', health.total_players);
            }
        } catch (error) {
            console.error('[DASHBOARD] Error loading stats:', error);
        }
    }


    // Load Latest and Trending
    await Promise.all([
        loadLatestPlayers(),
        loadTrendingPlayers()
    ]);

    // Search initialization moved to DOMContentLoaded (dropdown version)
    console.log('[DASHBOARD] Search initialized');

}


// ========== CREATE DASHBOARD PLAYER CARD (Vertical Style) ==========
// ========== DASHBOARD CARD CREATOR ==========
function createDashboardPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'dashboard-player-card';

    card.addEventListener('click', () => {
        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(player.player_id);
        } else {
            console.error('viewPlayerDetail function is not available');
        }
    });

    card.innerHTML = `
        <div class="card-container">
            <img src="${player.card_background || 'https://via.placeholder.com/300x400'}"
                 alt="Card Background"
                 class="card-background-img"
                 onerror="this.src='https://via.placeholder.com/300x400'">

            <img src="${player.player_image || 'https://via.placeholder.com/200x300'}"
                 alt="${player.name}"
                 class="player-image-img"
                 onerror="this.src='https://via.placeholder.com/200x300'">

            <div class="card-ovr" style="color: ${player.color_rating || '#FFFFFF'}">
                ${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}
            </div>

            <div class="card-position" style="color: ${player.color_position || '#FFFFFF'}">
                ${player.position || 'N/A'}
            </div>

            <div class="card-player-name" style="color: ${player.color_name || '#FFFFFF'}">
                ${player.name}
            </div>

            <img src="${player.nation_flag || ''}"
                 alt="Nation"
                 class="card-nation-flag"
                 onerror="this.style.display='none'">

            <img src="${player.club_flag || ''}"
                 alt="Club"
                 class="card-club-flag"
                 onerror="this.style.display='none'">
        </div>
    `;

    return card;
}


// ========== LATEST PLAYERS ==========
async function loadLatestPlayers() {
    console.log('[LATEST] Loading latest players...');

    const players = await loadPlayersFromAPI({
        limit: 100,  // Increased from 50
        rank: 0
    });

    if (players.length === 0) {
        console.warn('[LATEST] No players received from API');
        return;
    }

    // ✅ MERGE into state.allPlayers to ensure they can be found by detail view
    if (!state.allPlayers) state.allPlayers = [];
    players.forEach(p => {
        const uniqueId = `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;
        if (!state.allPlayers.some(existing => `${existing.player_id}_${existing.rank || 0}_${existing.is_untradable ? 1 : 0}` === uniqueId)) {
            state.allPlayers.push(p);
        }
    });

    console.log(`[LATEST] Received ${players.length} players from API`);

    // Sort by date_added (newest first)
    const sortedPlayers = players.sort((a, b) => {
        const dateA = new Date(a.date_added || 0);
        const dateB = new Date(b.date_added || 0);
        return dateB - dateA;
    });

    // Don't filter by OVR - show all latest players
    const validPlayers = sortedPlayers.filter(p => p.name && p.ovr && p.ovr > 0);

    const container = document.getElementById('latest-players-grid');
    if (!container) {
        console.error('[LATEST] Container #latest-players-grid not found in DOM');
        return;
    }

    container.innerHTML = '';

    // Show up to 12 latest players
    validPlayers.slice(0, 12).forEach(player => {
        const card = createDashboardPlayerCard(player);
        container.appendChild(card);
    });

    console.log(`[LATEST] Successfully displayed ${Math.min(validPlayers.length, 12)} latest players`);
}


// ========== TRENDING PLAYERS ==========
async function loadTrendingPlayers() {
    console.log('[TRENDING] Loading trending players...');

    const players = await loadPlayersFromAPI({
        limit: 50,
        min_ovr: 100,
        rank: 0
    });

    if (players.length === 0) {
        console.warn('[TRENDING] No players received');
        return;
    }

    // ✅ MERGE into state.allPlayers to ensure they can be found by detail view
    if (!state.allPlayers) state.allPlayers = [];
    players.forEach(p => {
        const uniqueId = `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;
        if (!state.allPlayers.some(existing => `${existing.player_id}_${existing.rank || 0}_${existing.is_untradable ? 1 : 0}` === uniqueId)) {
            state.allPlayers.push(p);
        }
    });

    const sliderText = "FC Points & More to Be Won with Futbin's Festive Rewards!";
    const sliderSpan = document.querySelector(".slider span");
    if (sliderSpan) sliderSpan.textContent = sliderText;

    // Sort by OVR (highest first)
    const sortedPlayers = players.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));

    const container = document.getElementById('trending-players-grid');
    if (!container) {
        console.error('[TRENDING] Container not found');
        return;
    }

    container.innerHTML = '';

    sortedPlayers.slice(0, 12).forEach(player => {
        const card = createDashboardPlayerCard(player);
        container.appendChild(card);
    });

    console.log(`[TRENDING] Loaded ${sortedPlayers.length} trending players`);
}

// ========== SEARCH FUNCTIONALITY ==========

// ========== DASHBOARD SEARCH FUNCTIONALITY ==========

// Renamed to avoid global conflict with app.js
let dashboardSearchTimeout = null;

async function searchDashboardPlayers(query) {
    const searchTerm = query.trim().toLowerCase();

    if (dashboardSearchTimeout) {
        clearTimeout(dashboardSearchTimeout);
    }

    if (!searchTerm) {
        showNormalDashboard();
        return;
    }

    const searchSection = document.getElementById('dashboard-search-results');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsCount = document.getElementById('search-results-count');

    if (searchSection && resultsContainer) {
        searchSection.style.display = 'block';
        resultsContainer.innerHTML = '<div class="search-loading">🔍 Searching...</div>';
        if (resultsCount) resultsCount.textContent = 'Searching...';

        const latestSection = document.querySelector('.dashboard-section:has(#latest-players-grid)');
        const trendingSection = document.querySelector('.dashboard-section:has(#trending-players-grid)');
        if (latestSection) latestSection.style.display = 'none';
        if (trendingSection) trendingSection.style.display = 'none';
    }

    dashboardSearchTimeout = setTimeout(async () => {
        console.log(`[SEARCH] ========== SEARCHING FOR: "${searchTerm}" ==========`);

        try {
            // ✅ USE NEW FAST API - Load only 20 results
            const response = await window.apiClient.searchPlayers({
                q: searchTerm,
                limit: 20,
                offset: 0,
                rank: 0
            });
            
            const results = response.results || [];
            const total = response.total || 0;
            
            console.log(`[SEARCH] ✓ Got ${results.length} results (${total} total)`);

            // Store for pagination
            state.currentSearchQuery = searchTerm;
            state.searchTotalResults = total;

            showSearchResults(results, searchTerm, total);

        } catch (error) {
            console.error('[SEARCH] ✗ ERROR:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <p>❌ Search error: ${error.message}</p>
                    </div>
                `;
            }
        }
    }, 300);
}

function createSearchResultRow(player) {
    const row = document.createElement('div');
    row.className = 'search-result-row';

    // ===== DEBUG OVR ISSUE =====
    if (!player.ovr || player.ovr === 0) {
        console.warn(`[OVR DEBUG] Player has no OVR:`, {
            name: player.name,
            ovr: player.ovr,
            ovr_type: typeof player.ovr,
            player_id: player.player_id
        });
    }

    const isUntradableText = String(player.is_untradable || '').toLowerCase();
    const isNonAuctionable = isUntradableText === 'true' || isUntradableText === '1';

    const tradableIcon = isNonAuctionable ?
        `<span class="tradable-badge non-tradable">🔴 Non-auctionable</span>` :
        `<span class="tradable-badge tradable">✅ Auctionable</span>`;

    row.innerHTML = `
        <div class="search-result-card">
            <div class="search-card-image">
                <img src="${player.card_background || 'https://via.placeholder.com/100x140'}"
                     alt="${player.name}"
                     class="search-card-bg"
                     onerror="this.src='https://via.placeholder.com/100x140'">
                <img src="${player.player_image || ''}"
                     alt="${player.name}"
                     class="search-player-img"
                     onerror="this.style.display='none'">
            </div>
            
            <div class="search-player-info">
                <div class="search-player-name">${player.name || 'Unknown'}</div>
                ${tradableIcon}
            </div>
            
            <div class="search-player-stats">
                <div class="search-ovr">${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}</div>
                <div class="search-position">${player.position || 'N/A'}</div>
            </div>
        </div>
    `;

    row.addEventListener('click', () => {
        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(player.player_id);
        } else {
            console.error('viewPlayerDetail function is not available');
        }
    });

    return row;
}

function showSearchResults(players, query, total, append = false) {
    const searchSection = document.getElementById('dashboard-search-results');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsCount = document.getElementById('search-results-count');

    if (!searchSection || !resultsContainer || !resultsCount) return;

    searchSection.style.display = 'block';

    // Clear container if not appending
    if (!append) {
        state.searchResults = players;
        state.searchDisplayed = players.length;
        resultsContainer.innerHTML = '';
        resultsCount.textContent = `${total} Result${total !== 1 ? 's' : ''}`;
    } else {
        state.searchResults = state.searchResults.concat(players);
        state.searchDisplayed += players.length;
    }

    if (total === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No players found starting with "${query}"</p>
                <p style="color: var(--text-tertiary); font-size: 0.9rem;">Try a different search term</p>
            </div>
        `;
        return;
    }

    // Add player cards
    players.forEach(player => {
        const row = createSearchResultRow(player);
        resultsContainer.appendChild(row);
    });

    updateAllWatchlistButtons();


    // Remove old load more button if exists
    const oldLoadMore = document.getElementById('search-load-more-btn');
    if (oldLoadMore) oldLoadMore.remove();

    // Add "Load More" button if there are more results
    if (state.searchDisplayed < total) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'search-load-more-btn';
        loadMoreBtn.className = 'search-load-more-btn';
        loadMoreBtn.innerHTML = `
            <span>Load More</span>
            <span class="load-more-count">(${total - state.searchDisplayed} remaining)</span>
        `;
        loadMoreBtn.addEventListener('click', async () => {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<span>Loading...</span>';

            try {
                // Load next 20 results
                const response = await window.apiClient.searchPlayers({
                    q: state.currentSearchQuery,
                    limit: 20,
                    offset: state.searchDisplayed,
                    rank: 0
                });

                const moreResults = response.results || [];
                console.log(`[SEARCH] Loaded ${moreResults.length} more results`);

                showSearchResults(moreResults, state.currentSearchQuery, total, true);

            } catch (error) {
                console.error('[SEARCH] Load more error:', error);
                loadMoreBtn.innerHTML = '<span>Error - Try Again</span>';
                loadMoreBtn.disabled = false;
            }
        });
        resultsContainer.appendChild(loadMoreBtn);
    }

    console.log(`[SEARCH] Displayed ${state.searchDisplayed}/${total} results`);
}

// Show Normal Dashboard (Hide Search Results)
function showNormalDashboard() {
    // Show Latest and Trending sections
    const latestSection = document.querySelector('.dashboard-section:has(#latest-players-grid)');
    const trendingSection = document.querySelector('.dashboard-section:has(#trending-players-grid)');

    if (latestSection) latestSection.style.display = 'block';
    if (trendingSection) trendingSection.style.display = 'block';

    // Hide search results
    const searchSection = document.getElementById('dashboard-search-results');
    if (searchSection) searchSection.style.display = 'none';
}

function updateAllWatchlistButtons() {
  document.querySelectorAll('.player-row-watchlist').forEach(btn => {
    const uniqueId = btn.dataset.uniqueId;
    if (!uniqueId) return;

    const isActive = state.watchlist.includes(uniqueId);

    btn.classList.toggle('active', isActive);

    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isActive ? 'currentColor' : 'none');
    }
  });
}

// Animate number counter
function animateNumber(elementId, targetValue, duration = 1000) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startValue = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);

    element.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


// ===== BANNER SLIDER FUNCTIONALITY =====

function initBannerSlider() {
  const slider = document.querySelector('.hero-banner-slider');
  if (!slider) return;

  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  const prevBtn = document.querySelector('.banner-prev');
  const nextBtn = document.querySelector('.banner-next');

  let currentSlide = 0;
  let autoplayInterval;

  // Show specific slide
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentSlide = index;
  }

  // Next slide
  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  // Previous slide
  function prevSlide() {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  }

  // Start autoplay
  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  // Stop autoplay
  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  function handleBannerClick(banner) {
    const redirectType = banner.getAttribute('data-redirect');
    const target = banner.getAttribute('data-target');

    if (!redirectType || !target) {
      return;
    }

    stopAutoplay();

    switch (redirectType) {
      case 'view':
        if (typeof switchView === 'function') {
          switchView(target);
        }
        break;

      case 'tool':
        const toolButton = document.querySelector(`[onclick*="${target}"]`);

        if (typeof openTool === 'function') {
          openTool(target);
        } else if (toolButton) {
          toolButton.click();
        }
        break;

      case 'external':
        window.open(target, '_blank', 'noopener,noreferrer');
        startAutoplay();
        break;
    }
  }

  // ===== NEW: ADD CLICK HANDLERS TO BANNERS =====
  slides.forEach((banner) => {
    banner.style.cursor = 'pointer';

    banner.addEventListener('click', (e) => {
      // Don't trigger if clicking arrows or dots
      if (e.target.closest('.banner-arrow') || e.target.closest('.banner-dot')) {
        return;
      }
      handleBannerClick(banner);
    });

    // Add hover effect
    banner.addEventListener('mouseenter', function () {
      this.style.transform = 'scale(1.01)';
      this.style.transition = 'transform 0.3s ease';
    });

    banner.addEventListener('mouseleave', function () {
      this.style.transform = 'scale(1)';
    });
  });

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      showSlide(index);
      stopAutoplay();
      startAutoplay();
    });
  });

  // Arrow navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevSlide();
      stopAutoplay();
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextSlide();
      stopAutoplay();
      startAutoplay();
    });
  }

  // Touch swipe for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      nextSlide();
      stopAutoplay();
      startAutoplay();
    }
    if (touchEndX > touchStartX + 50) {
      prevSlide();
      stopAutoplay();
      startAutoplay();
    }
  }

  // Pause on hover
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  // Start
  startAutoplay();
}

// Add event listener for home search input
document.addEventListener('DOMContentLoaded', () => {
    const homeSearch = document.getElementById('home-search');
    if (homeSearch) {
        homeSearch.addEventListener('input', (e) => {
            if (typeof searchDashboardPlayers === 'function') {
                searchDashboardPlayers(e.target.value);
            }
        });
    }
});
