// FC Market Pro - Dashboard View
// Handles the main dashboard/homepage functionality

function loadDashboard() {
  // Animate stats
  animateNumber('total-players', marketStats.totalPlayers);

  const marketVolumeEl = document.getElementById('market-volume');
  if (marketVolumeEl) marketVolumeEl.textContent = marketStats.marketVolume;

  // Top gainer and loser
  const sorted = [...players].sort((a, b) => b.priceChange - a.priceChange);
  const topGainer = sorted[0];
  const topLoser = sorted[sorted.length - 1];

  const topGainerEl = document.getElementById('top-gainer');
  const topGainerChangeEl = document.getElementById('top-gainer-change');
  const topLoserEl = document.getElementById('top-loser');
  const topLoserChangeEl = document.getElementById('top-loser-change');

  if (topGainerEl) topGainerEl.textContent = topGainer.name;
  if (topGainerChangeEl) topGainerChangeEl.textContent = `+${topGainer.priceChange.toFixed(1)}%`;
  if (topLoserEl) topLoserEl.textContent = topLoser.name;
  if (topLoserChangeEl) topLoserChangeEl.textContent = `${topLoser.priceChange.toFixed(1)}%`;

  // Load Latest Players Section
  loadLatestPlayers();

  // Load Trending Players Section
  loadTrendingPlayers();

  // Recent updates
  const updatesContainer = document.getElementById('recent-updates');
  if (updatesContainer) {
    updatesContainer.innerHTML = '';
    const recentPlayers = [...players]
      .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
      .slice(0, 5);

    recentPlayers.forEach(player => {
      const updateItem = document.createElement('div');
      updateItem.className = 'update-item';
      updateItem.style.cursor = 'pointer';
      updateItem.onclick = () => viewPlayerDetail(player.id);

      const changeClass = player.priceChange >= 0 ? 'up' : 'down';
      const changeSymbol = player.priceChange >= 0 ? '↑' : '↓';

      updateItem.innerHTML = `
                <div class="update-player">
                    <div class="update-avatar">${getInitials(player.name)}</div>
                    <div class="update-info">
                        <h4>${player.name}</h4>
                        <p>${player.position} • ${player.club}</p>
                    </div>
                </div>
                <div class="update-price">
                    <div class="price-value">${formatPrice(player.price)}</div>
                    <div class="price-change ${changeClass}">
                        ${changeSymbol} ${Math.abs(player.priceChange).toFixed(1)}%
                    </div>
                </div>
            `;

      updatesContainer.appendChild(updateItem);
    });
  }
}


// Load Trending Players Section
function loadTrendingPlayers() {
  const grid = document.getElementById('trending-players-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Trending: top 6 most volatile (highest absolute price change)
  const trendingPlayers = [...players]
    .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
    .slice(0, 6);    


const sliderText = "Trade, Build, Dominate – Massive Rewards Await on Zenith!";
document.querySelector(".slider span").textContent = sliderText;


  trendingPlayers.forEach((player, index) => {
    const card = document.createElement('div');
    card.className = 'latest-player-card';
    const rank = index + 1;

    // Watchlist status
    const isWatchlisted = state.watchlist.includes(player.id);
    const heartIcon = isWatchlisted ? '♥' : '♡';

    // Rank badge class
    let rankClass = '';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    card.innerHTML = `
            <div class="trending-rank ${rankClass}">#${rank}</div>
            <button class="latest-watchlist${isWatchlisted ? ' active' : ''}" title="Add to Watchlist" onclick="event.stopPropagation(); toggleTrendingWatchlist(${player.id}, this);">${heartIcon}</button>
            
            <div class="latest-player-top">
                <div class="trending-avatar">${getInitials(player.name)}</div>
            </div>
            
            <div class="latest-player-center">
                <div class="latest-player-name">${player.name}</div>
                <div class="latest-position-badge">${player.position}</div>
                
                <div class="latest-player-stats">
                    <div class="stat-item">
                        <div class="stat-value">${player.pace}</div>
                        <div class="stat-label">PAC</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.shooting}</div>
                        <div class="stat-label">SHO</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.passing}</div>
                        <div class="stat-label">PAS</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.dribbling}</div>
                        <div class="stat-label">DRI</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.defending}</div>
                        <div class="stat-label">DEF</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${player.physical}</div>
                        <div class="stat-label">PHY</div>
                    </div>
                </div>
            </div>
            
            <div class="latest-player-bottom">
                <div class="latest-price">${formatPrice(player.price)}</div>
                <div class="latest-change ${player.priceChange < 0 ? 'down' : 'up'}">
                    ${player.priceChange > 0 ? '↑' : '↓'} ${Math.abs(player.priceChange).toFixed(1)}%
                </div>
            </div>
            
            <button class="latest-details-btn" onclick="viewPlayerDetail(${player.id})">View Details</button>
        `;

    grid.appendChild(card);
  });
}

// Watchlist toggle function for latest players section
function toggleLatestWatchlist(id, btn) {
  // Use the main toggleWatchlist function if available
  if (typeof window.toggleWatchlist === 'function') {
    window.toggleWatchlist(id);
    // UI update is handled by updateAllWatchlistButtons() in the main function
  } else {
    // Fallback to inline implementation with localStorage save
    const idx = state.watchlist.indexOf(id);
    if (idx === -1) {
      state.watchlist.push(id);
      btn.classList.add('active');
      btn.innerHTML = '♥';
    } else {
      state.watchlist.splice(idx, 1);
      btn.classList.remove('active');
      btn.innerHTML = '♡';
    }
    // Save to localStorage
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
  }
}

// Watchlist toggle for trending section
function toggleTrendingWatchlist(id, btn) {
  // Use the main toggleWatchlist function if available
  if (typeof window.toggleWatchlist === 'function') {
    window.toggleWatchlist(id);
    // UI update is handled by updateAllWatchlistButtons() in the main function
  } else {
    // Fallback to inline implementation with localStorage save
    const idx = state.watchlist.indexOf(id);
    if (idx === -1) {
      state.watchlist.push(id);
      btn.classList.add('active');
      btn.innerHTML = '♥';
    } else {
      state.watchlist.splice(idx, 1);
      btn.classList.remove('active');
      btn.innerHTML = '♡';
    }
    // Save to localStorage
    localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
  }
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

// Search ALL players on home page
function searchAllPlayersOnHome(searchTerm) {
  const latestGrid = document.getElementById('latest-players-grid');
  const trendingGrid = document.getElementById('trending-players-grid');

  if (!latestGrid || !trendingGrid) return;

  // If search is empty, reload normal dashboard
  if (!searchTerm.trim()) {
    loadLatestPlayers();
    loadTrendingPlayers();
    return;
  }

  // Filter ALL players by search term (case-insensitive)
  const search = searchTerm.toLowerCase().trim();
  const filteredPlayers = players.filter(player => {
    const name = (player.name || '').toLowerCase();
    const position = (player.position || '').toLowerCase();
    const club = (player.club || '').toLowerCase();
    const nation = (player.nation || '').toLowerCase();

    return name.includes(search) ||
      position.includes(search) ||
      club.includes(search) ||
      nation.includes(search);
  });

  // Clear both grids
  latestGrid.innerHTML = '';
  trendingGrid.innerHTML = '';

  // Hide trending section header when searching
  const trendingSection = document.querySelector('.section-header:has(+ #trending-players-grid)');
  if (trendingSection) trendingSection.style.display = 'none';

  // Update Latest section header to show search results
  const latestHeader = document.querySelector('.section-header:has(+ #latest-players-grid)');
  if (latestHeader) {
    const headerTitle = latestHeader.querySelector('h2');
    if (headerTitle) headerTitle.innerHTML = `⚡ Search Results (${filteredPlayers.length})`;
  }

  // Show results in latest grid
  if (filteredPlayers.length === 0) {
    latestGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 0.5rem;">
          No players found for "${searchTerm}"
        </p>
        <p style="color: var(--text-tertiary); font-size: 0.9rem;">
          Try searching by player name, position, club, or nation
        </p>
      </div>
    `;
  } else {
    filteredPlayers.forEach(player => {
      const card = createLatestPlayerCard(player);
      latestGrid.appendChild(card);
    });
  }
}

// ===== BANNER SLIDER FUNCTIONALITY =====

// ===== BANNER SLIDER WITH REDIRECTS =====

function initBannerSlider() {
  const slider = document.querySelector('.hero-banner-slider');
  if (!slider) return;

  if (window.innerWidth < 1024 && !window.__zenithBannerResponsiveLogged) {
    console.info('[BANNER] Responsive scaling applied for mobile/tablet');
    window.__zenithBannerResponsiveLogged = true;
  }

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initBannerSlider();
});


// Initialize banner when dashboard loads
document.addEventListener('DOMContentLoaded', () => {
  initBannerSlider();
});
