// FC Market Pro - Player Detail View
// Handles detailed player view with stats and price charts

// Global function - accessible from HTML onclick
window.viewPlayerDetail = function(playerId) {
  // Try to find the player in various state arrays
  let player = null;

  // Helper to check if a player matches the ID
  const matches = (p) => String(p.player_id || p.id) === String(playerId);

  if (state.allPlayers) player = state.allPlayers.find(matches);
  if (!player && state.filteredPlayers) player = state.filteredPlayers.find(matches);
  if (!player && state.searchResults) player = state.searchResults.find(matches);
  if (!player && state.watchlistFilteredPlayers) player = state.watchlistFilteredPlayers.find(matches);

  if (!player) {
    console.error(`Player with ID ${playerId} not found in state.`);
    showToast('Player details not found', 'error');
    return;
  }
  
  state.selectedPlayer = player;
  
  const container = document.getElementById('detail-content');
  if (!container) return;
  
  // Normalize player data (some might use 'ovr', others 'overall')
  const rating = player.ovr || player.overall || 'N/A';
  const price = player.price ? formatPrice(player.price) : 'N/A';
  const priceChange = player.priceChange || 0;

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-card">
        <div class="detail-avatar">${getInitials(player.name)}</div>
        <div class="detail-rating">${rating}</div>
        <div class="detail-position">${player.position}</div>
      </div>
      <div class="detail-info">
        <h1 class="detail-name">${player.name}</h1>
        <div class="detail-meta">
          <span class="detail-badge">${player.position}</span>
          <span class="detail-badge">${player.club || player.team || 'Unknown Club'}</span>
          <span class="detail-badge">${player.league || 'Unknown League'}</span>
          <span class="detail-badge">${player.nation || 'Unknown Nation'}</span>
        </div>
        <div class="stats-grid-detail">
          ${createStatBar('PAC', player.pace)}
          ${createStatBar('SHO', player.shooting)}
          ${createStatBar('PAS', player.passing)}
          ${createStatBar('DRI', player.dribbling)}
          ${createStatBar('DEF', player.defending)}
          ${createStatBar('PHY', player.physical)}
        </div>
      </div>
    </div>
    
    <div class="detail-price-section">
      <h2>Market Price</h2>
      <div class="detail-current-price">${price}</div>
      <div class="price-change ${priceChange >= 0 ? 'up' : 'down'}" style="font-size: 20px; margin-bottom: 24px;">
        ${priceChange >= 0 ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(1)}% (24h)
      </div>
      <div class="chart-container">
        <canvas id="detail-chart"></canvas>
      </div>
    </div>
    
    <div style="display: flex; gap: 16px; justify-content: center;">
      <button class="btn btn-primary" onclick="toggleWatchlist('${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}')">
        ${state.watchlist.includes(`${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}`) ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>
      <button class="btn btn-secondary" onclick="switchView('market')">View Market</button>
    </div>
  `;
  
  // Create price chart after a short delay
  setTimeout(() => {
    createDetailChart(player);
  }, 100);
  
  switchView('detail');
};

function createStatBar(label, value) {
  const val = value || 0;
  return `
    <div class="stat-bar">
      <div class="stat-bar-header">
        <span>${label}</span>
        <span><strong>${val}</strong></span>
      </div>
      <div class="stat-bar-bg">
        <div class="stat-bar-fill" style="width: ${val}%"></div>
      </div>
    </div>
  `;
}

function createDetailChart(player) {
  const canvas = document.getElementById('detail-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  // Use a default price if player price is missing/zero for chart generation purposes
  const basePrice = player.price || 100000;
  const history = generatePriceHistory(basePrice, 14);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => h.date),
      datasets: [{
        label: 'Price',
        data: history.map(h => h.price),
        borderColor: '#00c2a8',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#00c2a8',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#1E242E',
          borderColor: '#00c2a8',
          borderWidth: 1,
          titleColor: '#F9FAFB',
          bodyColor: '#9CA3AF',
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return 'Price: ' + formatPrice(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: false, color: 'rgba(99, 102, 241, 0.1)' },
          ticks: { color: '#6B7280', maxTicksLimit: 7 }
        },
        y: {
          display: true,
          grid: { color: 'rgba(99, 102, 241, 0.1)' },
          ticks: {
            color: '#6B7280',
            callback: function(value) {
              return formatPrice(value);
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}
