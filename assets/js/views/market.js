// FC Market Pro - Market View
// Handles market tracker with top gainers and losers

function loadMarket() {
  // Market overview
  const marketIndexEl = document.getElementById('market-index');
  const avgChangeEl = document.getElementById('avg-change');
  const volumeTradedEl = document.getElementById('volume-traded');
  const activeListingsEl = document.getElementById('active-listings');
  
  if (marketIndexEl) marketIndexEl.textContent = '1,247';
  if (avgChangeEl) avgChangeEl.textContent = `+${marketStats.avgPriceChange}%`;
  if (volumeTradedEl) volumeTradedEl.textContent = marketStats.marketVolume;
  if (activeListingsEl) activeListingsEl.textContent = formatNumber(marketStats.activeListings);
  
  // Top gainers
  const gainersTable = document.getElementById('gainers-table');
  if (gainersTable) {
    gainersTable.innerHTML = '';
    const gainers = [...players].sort((a, b) => b.priceChange - a.priceChange).slice(0, 5);
    gainers.forEach(player => {
      gainersTable.appendChild(createMarketRow(player));
    });
  }
  
  // Top losers
  const losersTable = document.getElementById('losers-table');
  if (losersTable) {
    losersTable.innerHTML = '';
    const losers = [...players]
      .filter(p => p.priceChange < 0)  // Only players with negative change
      .sort((a, b) => a.priceChange - b.priceChange)  // Sort ascending (most negative first)
      .slice(0, 5);
    losers.forEach(player => {
      losersTable.appendChild(createMarketRow(player));
    });
  }
}

function createMarketRow(player) {
  const row = document.createElement('div');
  row.className = 'market-row';
  row.style.cursor = 'pointer';
  row.onclick = () => viewPlayerDetail(player.id);
  row.innerHTML = `
    <div class="market-player">
      <div class="market-player-avatar">${getInitials(player.name)}</div>
      <div class="market-player-info">
        <h4>${player.name}</h4>
        <p>${player.position} • ${player.club}</p>
      </div>
    </div>
    <div class="market-ovr">${player.overall}</div>
    <div class="market-price">${formatPrice(player.price)}</div>
    <div class="market-change ${player.priceChange >= 0 ? 'positive' : 'negative'}">
      ${player.priceChange >= 0 ? '+' : ''}${player.priceChange.toFixed(1)}%
    </div>
  `;
  return row;
}
