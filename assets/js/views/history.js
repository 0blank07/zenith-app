// FC Market Pro - Price History View
// Handles price history charts and statistics

function loadPriceHistory() {
  const select = document.getElementById('history-player');
  if (!select) return;
  
  select.innerHTML = '';
  
  players.forEach(player => {
    const option = document.createElement('option');
    option.value = player.id;
    option.textContent = `${player.name} (${player.position})`;
    select.appendChild(option);
  });
  
  // Set dates
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dateToEl = document.getElementById('date-to');
  const dateFromEl = document.getElementById('date-from');
  if (dateToEl) dateToEl.valueAsDate = today;
  if (dateFromEl) dateFromEl.valueAsDate = thirtyDaysAgo;
  
  // Load first player
  if (players.length > 0) {
    updatePriceHistoryChart(players[0].id);
  }
}

function updatePriceHistoryChart(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) return;
  
  const canvas = document.getElementById('price-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const history = generatePriceHistory(player.price, 30);
  const prices = history.map(h => h.price);
  
  // Update stats
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const volatility = ((highest - lowest) / average * 100).toFixed(1);
  
  const elements = {
    'highest-price': formatPrice(highest),
    'lowest-price': formatPrice(lowest),
    'average-price': formatPrice(Math.round(average)),
    'current-price': formatPrice(player.price),
    'volatility': volatility + '%'
  };
  
  Object.keys(elements).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = elements[id];
  });
  
  // Destroy existing chart
  if (state.priceHistoryChart) {
    state.priceHistoryChart.destroy();
  }
  
  // Create new chart
  state.priceHistoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => h.date),
      datasets: [{
        label: player.name,
        data: prices,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
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
          borderColor: '#6366F1',
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
          grid: { color: 'rgba(99, 102, 241, 0.1)' },
          ticks: { color: '#6B7280', maxTicksLimit: 10 }
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