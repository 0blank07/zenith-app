// FC Market Pro - Custom Stats View
// Handles custom stat filtering modal

// Custom stats state
const customStatsState = {
  activeTab: 'player', // 'player' or 'goalkeeper'
  selectedTemplates: [],
  selectedPrices: [],
  selectedAllStats: []
};

// Player stat templates
const playerStatTemplates = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

// Goalkeeper stat templates  
const gkStatTemplates = ['gk-diving', 'gk-handling', 'gk-kicking', 'gk-reflexes', 'gk-positioning', 'gk-speed'];

// Price/value tiers
const priceTiers = [
  { id: 'gray', name: 'Value', color: '#9CA3AF' },
  { id: 'green', name: 'Value', color: '#10B981' },
  { id: 'blue', name: 'Value', color: '#3B82F6' },
  { id: 'purple', name: 'Value', color: '#8B5CF6' },
  { id: 'red', name: 'Value', color: '#EF4444' },
  { id: 'orange', name: 'Value', color: '#F97316' }
];

// All available stats
const allStatsOptions = [
  'date-added', 'ovr', 'acceleration', 'aggression', 'agility', 'awareness',
  'ball-control', 'balance', 'crossing', 'curve', 'dribbling', 'finishing',
  'free-kick', 'gk-diving', 'gk-kicking', 'gk-positioning', 'gk-handling',
  'gk-reflexes', 'heading', 'jumping', 'long-passing', 'long-shot', 'marking',
  'penalties', 'positioning', 'reactions', 'shot-power', 'sliding-tackle',
  'short-passing', 'sprint-speed', 'stamina', 'standing-tackle', 'strength',
  'total-stats', 'vision', 'volley'
];

// Open stats modal
window.openStatsModal = function () {
  const modal = document.getElementById('stats-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

// Close stats modal
window.closeStatsModal = function () {
  const modal = document.getElementById('stats-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// Switch tabs
window.switchStatsTab = function (tab) {
  customStatsState.activeTab = tab;
  document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  renderStatTemplates();
};

// Toggle stat template selection
window.toggleTemplate = function (template) {
  const index = customStatsState.selectedTemplates.indexOf(template);
  if (index === -1) {
    customStatsState.selectedTemplates.push(template);
  } else {
    customStatsState.selectedTemplates.splice(index, 1);
  }
  updateTemplateButtons();
};

// Toggle price tier selection
window.togglePrice = function (priceId) {
  const index = customStatsState.selectedPrices.indexOf(priceId);
  if (index === -1) {
    customStatsState.selectedPrices.push(priceId);
  } else {
    customStatsState.selectedPrices.splice(index, 1);
  }
  updatePriceButtons();
};

// Toggle all stat selection
window.toggleAllStat = function (stat) {
  const index = customStatsState.selectedAllStats.indexOf(stat);
  if (index === -1) {
    customStatsState.selectedAllStats.push(stat);
  } else {
    customStatsState.selectedAllStats.splice(index, 1);
  }
  updateAllStatButtons();
};

// Select all templates
window.selectAllTemplates = function () {
  const templates = customStatsState.activeTab === 'player' ? playerStatTemplates : gkStatTemplates;
  if (customStatsState.selectedTemplates.length === templates.length) {
    customStatsState.selectedTemplates = [];
  } else {
    customStatsState.selectedTemplates = [...templates];
  }
  updateTemplateButtons();
};

// Select all prices
window.selectAllPrices = function () {
  if (customStatsState.selectedPrices.length === priceTiers.length) {
    customStatsState.selectedPrices = [];
  } else {
    customStatsState.selectedPrices = priceTiers.map(p => p.id);
  }
  updatePriceButtons();
};

// Reset all selections
window.resetStatsFilters = function () {
  customStatsState.selectedTemplates = [];
  customStatsState.selectedPrices = [];
  customStatsState.selectedAllStats = [];
  updateTemplateButtons();
  updatePriceButtons();
  updateAllStatButtons();
};

function applyStatsFilters() {
  closeStatsModal();
  showToast('Custom stats filters applied!', 'success');
}

// Render stat templates
function renderStatTemplates() {
  const container = document.getElementById('stat-templates-grid');
  if (!container) return;

  const templates = customStatsState.activeTab === 'player' ? playerStatTemplates : gkStatTemplates;
  container.innerHTML = templates.map(template => `
    <button class="stat-template-btn ${customStatsState.selectedTemplates.includes(template) ? 'selected' : ''}"
            onclick="toggleTemplate('${template}')">
      ${template.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </button>
  `).join('');
}

// Update template buttons
function updateTemplateButtons() {
  const templates = customStatsState.activeTab === 'player' ? playerStatTemplates : gkStatTemplates;
  templates.forEach(template => {
    const btn = document.querySelector(`[onclick="toggleTemplate('${template}')"]`);
    if (btn) {
      if (customStatsState.selectedTemplates.includes(template)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    }
  });
}

// Update price buttons
function updatePriceButtons() {
  priceTiers.forEach(tier => {
    const btn = document.querySelector(`[onclick="togglePrice('${tier.id}')"]`);
    if (btn) {
      if (customStatsState.selectedPrices.includes(tier.id)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    }
  });
}

// Update all stat buttons
function updateAllStatButtons() {
  allStatsOptions.forEach(stat => {
    const btn = document.querySelector(`[onclick="toggleAllStat('${stat}')"]`);
    if (btn) {
      if (customStatsState.selectedAllStats.includes(stat)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    }
  });
}

// Initialize stats modal
function initStatsModal() {
  renderStatTemplates();

  // Render price tiers
  const pricesGrid = document.getElementById('prices-grid');
  if (pricesGrid) {
    pricesGrid.innerHTML = priceTiers.map(tier => `
      <button class="price-tier-btn" onclick="togglePrice('${tier.id}')">
        <span>${tier.name}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${tier.color}">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      </button>
    `).join('');
  }

  // Render all stats
  const allStatsGrid = document.getElementById('all-stats-grid');
  if (allStatsGrid) {
    allStatsGrid.innerHTML = allStatsOptions.map(stat => `
      <button class="all-stat-btn" onclick="toggleAllStat('${stat}')">
        ${stat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </button>
    `).join('');
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStatsModal);
} else {
  initStatsModal();
}
