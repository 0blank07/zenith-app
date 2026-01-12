// FC Market Pro - Shard Calculator (ULTRA-SIMPLE WORKING VERSION)

// ===== GLOBAL STATE =====
window.shardCalcState = {
  mode: 'counter',
  counterShards: {
    105: 0, 106: 0, 107: 0, 108: 0, 109: 0,
    110: 0, 111: 0, 112: 0, 113: 0
  },
  shardCosts: {
    105: 5, 106: 10, 107: 10, 108: 10, 109: 30,
    110: 60, 111: 120, 112: 180, 113: 250
  }
};

// ===== INITIALIZE =====
window.initShardCalculator = function () {

  const view = document.getElementById('shard-calculator-view');
  if (view) {
    view.style.display = 'block';
    view.style.opacity = '1';
    view.classList.add('active');
  }
  window.loadSavedState();
  window.updateShardCounterDisplay();
};

// ===== SWITCH MODE =====
window.switchShardMode = function (mode) {

  window.shardCalcState.mode = mode;

  const costSection = document.getElementById('shard-cost-section');
  const counterSection = document.getElementById('shard-counter-section');

  // Update buttons
  document.querySelectorAll('.shard-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  // Show/hide sections
  if (mode === 'cost') {
    if (counterSection) counterSection.style.display = 'none';
    if (costSection) costSection.style.display = 'block';
  } else {
    if (costSection) costSection.style.display = 'none';
    if (counterSection) counterSection.style.display = 'block';
  }

  localStorage.setItem('shardCalcMode', mode);
};

// ===== INCREMENT/DECREMENT =====
window.incrementShardLevel = function (ovr) {

  window.shardCalcState.counterShards[ovr]++;
  window.updateShardCounterDisplay();
};

window.decrementShardLevel = function (ovr) {

  if (window.shardCalcState.counterShards[ovr] > 0) {
    window.shardCalcState.counterShards[ovr]--;
    window.updateShardCounterDisplay();
  }
};

// ===== RESET =====
window.resetShardCounter = function () {
  {

    window.shardCalcState.counterShards = {
      105: 0, 106: 0, 107: 0, 108: 0, 109: 0,
      110: 0, 111: 0, 112: 0, 113: 0
    };
    window.updateShardCounterDisplay();
  }
};

// ===== UPDATE DISPLAY =====
window.updateShardCounterDisplay = function () {
  // Calculate TOTAL SHARDS (not just player count)
  const total = Object.entries(window.shardCalcState.counterShards)
    .reduce((sum, [ovr, count]) => {
      const shardCost = window.shardCalcState.shardCosts[ovr];
      return sum + (count * shardCost);
    }, 0);

  // Count total PLAYERS
  const players = Object.values(window.shardCalcState.counterShards).reduce((a, b) => a + b, 0);

  const shardEl = document.getElementById('shard-count-display');
  const playerEl = document.getElementById('player-count-display');

  if (shardEl) shardEl.textContent = total;
  if (playerEl) playerEl.textContent = players;

  for (let ovr = 105; ovr <= 113; ovr++) {
    const el = document.getElementById(`counter-${ovr}`);
    if (el) el.textContent = window.shardCalcState.counterShards[ovr] || 0;
  }
  window.saveState();
};


// ===== COST MODE FUNCTIONS =====
window.setShardValue = function (amount) {
  const input = document.getElementById('shard-required-input');
  if (input) {
    input.value = amount;
    window.calculateShardCost();
  }
};

window.calculateShardCost = function () {
  const input = document.getElementById('shard-required-input');
  const ovrSelect = document.getElementById('shard-player-ovr');

  if (!input || !ovrSelect) return;

  const shards = parseInt(input.value) || 0;
  const ovr = parseInt(ovrSelect.value) || 105;
  const costPerPlayer = window.shardCalcState.shardCosts[ovr] || 5;
  const playersNeeded = Math.ceil(shards / costPerPlayer);
  const totalCost = playersNeeded * 1000000;

  const playersEl = document.getElementById('shard-cost-players-result');
  const costEl = document.getElementById('shard-cost-total-result');

  if (playersEl) playersEl.textContent = playersNeeded;
  if (costEl) {
    if (totalCost >= 1000000) {
      costEl.textContent = (totalCost / 1000000).toFixed(1) + 'M';
    } else {
      costEl.textContent = (totalCost / 1000).toFixed(0) + 'K';
    }
  }
};

window.handleShardInput = function (e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
  window.calculateShardCost();
};

// ===== STORAGE =====
window.saveState = function () {
  try {
    localStorage.setItem('shardCalcState', JSON.stringify(window.shardCalcState));
  } catch (e) { }
};

window.loadSavedState = function () {
  try {
    const saved = localStorage.getItem('shardCalcState');
    if (saved) {
      const data = JSON.parse(saved);
      window.shardCalcState = { ...window.shardCalcState, ...data };
    }
  } catch (e) { }
};

// ===== AUTO INITIALIZE =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {

  });
} else {

}

// ===== RESET COST CALCULATOR (Works like Reset Counter) =====
// ===== RESET COST CALCULATOR =====
window.resetShardCost = function () {
  {
    // Reset input field to empty
    const input = document.getElementById('shard-required-input');
    if (input) {
      input.value = '';

    }

    // Reset OVR dropdown to OVR 105
    const ovrSelect = document.getElementById('shard-player-ovr');
    if (ovrSelect) {
      ovrSelect.value = '105';

    }

    // Reset results to 0
    const playersEl = document.getElementById('shard-cost-players-result');
    const costEl = document.getElementById('shard-cost-total-result');

    if (playersEl) {
      playersEl.textContent = '0';

    }
    if (costEl) {
      costEl.textContent = '0.0M';

    }

    // Recalculate
    window.calculateShardCost();


  }
};