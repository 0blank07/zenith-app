// FC Market Pro - Enhanced Custom Stats Modal
// Comprehensive stat filtering with smooth UX and all options

const customStatsState = {
  activeTab: 'player', // 'player' or 'goalkeeper'
  selectedTemplates: [],
  selectedPrices: [],
  selectedAllStats: [],
  searchAllStats: ''
};

// Player stat templates with descriptive names
const playerStatTemplates = {
  'pace': { label: 'Pace', icon: '⚡', stats: ['acceleration', 'sprint-speed'] },
  'shooting': { label: 'Shooting', icon: '🎯', stats: ['finishing', 'shot-power', 'long-shot', 'penalties'] },
  'passing': { label: 'Passing', icon: '📍', stats: ['short-passing', 'crossing', 'long-passing', 'vision'] },
  'dribbling': { label: 'Dribbling', icon: '🎪', stats: ['agility', 'balance', 'ball-control', 'curve'] },
  'defending': { label: 'Defending', icon: '🛡️', stats: ['marking', 'sliding-tackle', 'standing-tackle', 'reactions'] },
  'physical': { label: 'Physical', icon: '💪', stats: ['strength', 'jumping', 'stamina', 'aggression'] }
};

// Goalkeeper stat templates with descriptive names
const gkStatTemplates = {
  'gk-diving': { label: 'Diving', icon: '🤿', stats: ['gk-diving'] },
  'gk-positioning': { label: 'Positioning', icon: '📍', stats: ['gk-positioning'] },
  'gk-handling': { label: 'Handling', icon: '✋', stats: ['gk-handling'] },
  'gk-reflexes': { label: 'Reflexes', icon: '⚡', stats: ['gk-reflexes'] },
  'gk-kicking': { label: 'Kicking', icon: '⚽', stats: ['gk-kicking'] },
  'physical': { label: 'Physical', icon: '💪', stats: ['strength', 'jumping', 'stamina', 'aggression'] }
};

// Price/value tiers with better labels
const priceTiers = [
  { id: 'Base', label: 'Base', color: '#9CA3AF', bgColor: 'rgba(156, 163, 175, 0.1)' },
  { id: 'Green', label: 'Green', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { id: 'Blue', label: 'Blue', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { id: 'Purple', label: 'Purple', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  { id: 'Red', label: 'Red', color: '#EF4444', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { id: 'Gold', label: 'Gold', color: '#F59E0B', bgColor: 'rgba(239, 68, 68, 0.1)' }
];

// All available stats organized by category
const allStatsOptions = {
  'offense': [
    { id: 'acceleration', label: 'Acceleration' },
    { id: 'agility', label: 'Agility' },
    { id: 'ball-control', label: 'Ball Control' },
    { id: 'crossing', label: 'Crossing' },
    { id: 'curve', label: 'Curve' },
    { id: 'dribbling', label: 'Dribbling' },
    { id: 'finishing', label: 'Finishing' },
    { id: 'free-kick', label: 'Free Kick' },
    { id: 'long-passing', label: 'Long Passing' },
    { id: 'long-shot', label: 'Long Shot' },
    { id: 'penalties', label: 'Penalties' },
    { id: 'short-passing', label: 'Short Passing' },
    { id: 'shot-power', label: 'Shot Power' },
    { id: 'sprint-speed', label: 'Sprint Speed' },
    { id: 'vision', label: 'Vision' },
    { id: 'volley', label: 'Volley' }
  ],
  'defense': [
    { id: 'aggression', label: 'Aggression' },
    { id: 'awareness', label: 'Awareness' },
    { id: 'heading', label: 'Heading' },
    { id: 'marking', label: 'Marking' },
    { id: 'positioning', label: 'Positioning' },
    { id: 'reactions', label: 'Reactions' },
    { id: 'sliding-tackle', label: 'Sliding Tackle' },
    { id: 'standing-tackle', label: 'Standing Tackle' }
  ],
  'physical': [
    { id: 'balance', label: 'Balance' },
    { id: 'jumping', label: 'Jumping' },
    { id: 'stamina', label: 'Stamina' },
    { id: 'strength', label: 'Strength' }
  ],
  'goalkeeper': [
    { id: 'gk-diving', label: 'GK Diving' },
    { id: 'gk-handling', label: 'GK Handling' },
    { id: 'gk-kicking', label: 'GK Kicking' },
    { id: 'gk-positioning', label: 'GK Positioning' },
    { id: 'gk-reflexes', label: 'GK Reflexes' }
  ],
  'other': [
    { id: 'date-added', label: 'Date Added' },
    { id: 'ovr', label: 'Overall' },
    { id: 'skill-moves', label: 'Skill Moves' },
    { id: 'weak-foot', label: 'Weak Foot' },
    { id: 'height', label: 'Height' },
    { id: 'weight', label: 'Weight' },
    { id: 'total-stats', label: 'Total Stats' }
  ]
};

// Flatten all stats for searching
const allStatsFlat = Object.values(allStatsOptions).flat();

// ========== MODAL CONTROL FUNCTIONS ==========

window.openStatsModal = function () {
  const modal = document.getElementById('custom-stats-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // ✅ RENDER ALL STATS (DISPLAY THEM) WITHOUT SELECTING
    renderStatTemplates();
    renderPriceTiers();
    renderAllStats();
    updateSelectionCounters();
  }
};

window.closeStatsModal = function () {
  const modal = document.getElementById('custom-stats-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// Close on background click
document.addEventListener('DOMContentLoaded', function () {
  const backdrop = document.getElementById('stats-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeStatsModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('custom-stats-modal')?.classList.contains('open')) {
      closeStatsModal();
    }
  });
});

// ========== TAB SWITCHING ==========

window.switchStatsTab = function (tab) {
  customStatsState.activeTab = tab;
  document.querySelectorAll('.stats-tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  renderStatTemplates();
  renderAllStats();
};

// ========== TEMPLATE SELECTION ==========

window.toggleTemplate = function (template, event) {
  event?.stopPropagation();
  const index = customStatsState.selectedTemplates.indexOf(template);
  if (index === -1) {
    customStatsState.selectedTemplates.push(template);
  } else {
    customStatsState.selectedTemplates.splice(index, 1);
  }
  updateTemplateButtons();
  updateSelectionCounters();
};

window.selectAllTemplates = function (event) {
  event?.stopPropagation();
  const templates = customStatsState.activeTab === 'player'
    ? Object.keys(playerStatTemplates)
    : Object.keys(gkStatTemplates);

  if (customStatsState.selectedTemplates.length === templates.length) {
    customStatsState.selectedTemplates = [];
  } else {
    customStatsState.selectedTemplates = [...templates];
  }
  updateTemplateButtons();
  updateSelectionCounters();
};

function updateTemplateButtons() {
  customStatsState.selectedTemplates.forEach(template => {
    const btn = document.querySelector(`[data-template="${template}"]`);
    if (btn) btn.classList.add('selected');
  });

  Object.keys(customStatsState.activeTab === 'player' ? playerStatTemplates : gkStatTemplates).forEach(template => {
    if (!customStatsState.selectedTemplates.includes(template)) {
      const btn = document.querySelector(`[data-template="${template}"]`);
      if (btn) btn.classList.remove('selected');
    }
  });

  // Update "Select All" checkbox
  const templates = customStatsState.activeTab === 'player'
    ? Object.keys(playerStatTemplates)
    : Object.keys(gkStatTemplates);
  const selectAllBtn = document.querySelector('.template-select-all');
  if (selectAllBtn) {
    selectAllBtn.classList.toggle('selected', customStatsState.selectedTemplates.length === templates.length);
  }
}

// ========== PRICE TIER SELECTION ==========

window.togglePrice = function (priceId, event) {
  event?.stopPropagation();
  const index = customStatsState.selectedPrices.indexOf(priceId);
  if (index === -1) {
    customStatsState.selectedPrices.push(priceId);
  } else {
    customStatsState.selectedPrices.splice(index, 1);
  }
  updatePriceButtons();
  updateSelectionCounters();
};

window.selectAllPrices = function (event) {
  event?.stopPropagation();
  if (customStatsState.selectedPrices.length === priceTiers.length) {
    customStatsState.selectedPrices = [];
  } else {
    customStatsState.selectedPrices = priceTiers.map(p => p.id);
  }
  updatePriceButtons();
  updateSelectionCounters();
};

function updatePriceButtons() {
  priceTiers.forEach(tier => {
    const btn = document.querySelector(`[data-price="${tier.id}"]`);
    if (btn) {
      btn.classList.toggle('selected', customStatsState.selectedPrices.includes(tier.id));
    }
  });

  const selectAllBtn = document.querySelector('.price-select-all');
  if (selectAllBtn) {
    selectAllBtn.classList.toggle('selected', customStatsState.selectedPrices.length === priceTiers.length);
  }
}

// ========== ALL STATS SELECTION ==========

window.toggleAllStat = function (stat, event) {
  event?.stopPropagation();
  const index = customStatsState.selectedAllStats.indexOf(stat);
  if (index === -1) {
    customStatsState.selectedAllStats.push(stat);
  } else {
    customStatsState.selectedAllStats.splice(index, 1);
  }
  updateAllStatButtons();
  updateSelectionCounters();
};

window.selectAllStats = function (event) {
  event?.stopPropagation();
  const allStats = allStatsFlat.map(s => s.id);
  if (customStatsState.selectedAllStats.length === allStats.length) {
    customStatsState.selectedAllStats = [];
  } else {
    customStatsState.selectedAllStats = [...allStats];
  }
  updateAllStatButtons();
  updateSelectionCounters();
};

function updateAllStatButtons() {
  allStatsFlat.forEach(stat => {
    const btn = document.querySelector(`[data-stat="${stat.id}"]`);
    if (btn) {
      btn.classList.toggle('selected', customStatsState.selectedAllStats.includes(stat.id));
    }
  });

  const selectAllBtn = document.querySelector('.allstats-select-all');
  if (selectAllBtn) {
    selectAllBtn.classList.toggle('selected', customStatsState.selectedAllStats.length === allStatsFlat.length);
  }
}

// ========== SEARCH ALL STATS ==========

window.searchAllStats = function (query) {
  customStatsState.searchAllStats = query.toLowerCase();
  renderAllStats();
};

// ========== SELECTION COUNTER ==========

function updateSelectionCounters() {
  const templateCount = document.querySelector('.template-count');
  if (templateCount) templateCount.textContent = customStatsState.selectedTemplates.length;

  const priceCount = document.querySelector('.price-count');
  if (priceCount) priceCount.textContent = customStatsState.selectedPrices.length;

  const statCount = document.querySelector('.stat-count');
  if (statCount) statCount.textContent = customStatsState.selectedAllStats.length;
}

// ========== RENDER FUNCTIONS ==========

function renderStatTemplates() {
  const container = document.getElementById('stat-templates-grid');
  if (!container) return;

  const templates = customStatsState.activeTab === 'player' ? playerStatTemplates : gkStatTemplates;
  const html = Object.entries(templates).map(([key, template]) => `
    <button class="stat-template-btn${customStatsState.selectedTemplates.includes(key) ? ' selected' : ''}" 
            data-template="${key}" 
            onclick="toggleTemplate('${key}', event)">
      <span class="template-icon">${template.icon}</span>
      <span class="template-label">${template.label}</span>
    </button>
  `).join('');

  container.innerHTML = html;
}

function renderPriceTiers() {
  const container = document.getElementById('price-tiers-grid');
  if (!container) return;

  const html = priceTiers.map(tier => `
    <button class="price-tier-btn${customStatsState.selectedPrices.includes(tier.id) ? ' selected' : ''}" 
            data-price="${tier.id}" 
            onclick="togglePrice('${tier.id}', event)"
            style="border-color: ${tier.color};">
      <span class="price-dot" style="background-color: ${tier.color};"></span>
      <span class="price-label">${tier.label}</span>
    </button>
  `).join('');

  container.innerHTML = html;
}

function renderAllStats() {
  const container = document.getElementById('all-stats-grid');
  if (!container) return;

  const query = customStatsState.searchAllStats;
  const html = Object.entries(allStatsOptions).map(([category, stats]) => {
    const filteredStats = stats.filter(s =>
      !query || s.label.toLowerCase().includes(query) || s.id.includes(query)
    );

    if (filteredStats.length === 0) return '';

    return `
      <div class="stats-category">
        <div class="category-header">
          <span class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
          <span class="category-count">${filteredStats.length}</span>
        </div>
        <div class="stats-category-items">
          ${filteredStats.map(stat => `
            <button class="stat-item-btn${customStatsState.selectedAllStats.includes(stat.id) ? ' selected' : ''}"
                    data-stat="${stat.id}"
                    onclick="toggleAllStat('${stat.id}', event)">
              ${stat.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html || '<div class="no-results">No stats found matching your search</div>';
}

// ========== ACTION BUTTONS ==========

window.resetStatsFilters = function() {
    customStatsState.selectedTemplates = [];
    customStatsState.selectedPrices = [];
    customStatsState.selectedAllStats = [];
    customStatsState.searchAllStats = '';
    
    document.getElementById('all-stats-search').value = '';
    
    // Clear global and localStorage
    window.customSelectedStats = [];
    localStorage.removeItem('customSelectedStats');
    
    updateTemplateButtons();
    updatePriceButtons();
    updateAllStatButtons();
    updateSelectionCounters();
    renderAllStats();
    
    console.log('🧹 Reset custom stats filters');
    
    // Reload current view
    if (window.state && window.state.currentView === 'database') {
        window.loadDatabase();
    } else if (window.state && window.state.currentView === 'watchlist') {
        window.loadWatchlist();
    }
};


window.applyStatsFilters = function() {
    // Save selected stats globally for app.js to access
    window.customSelectedStats = [...customStatsState.selectedAllStats];
    
    // Also save to localStorage for persistence
    localStorage.setItem('customSelectedStats', JSON.stringify(customStatsState.selectedAllStats));
    
    console.log('✅ Applied custom stats filters:', customStatsState.selectedAllStats);
    
    // Reload the current view to apply changes
    if (window.state && window.state.currentView === 'database') {
        window.loadDatabase();
    } else if (window.state && window.state.currentView === 'watchlist') {
        window.loadWatchlist();
    }
    
    // Close the modal
    window.closeStatsModal();
};


// Initialize from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    const saved = localStorage.getItem('customSelectedStats');
    if (saved) {
        try {
            window.customSelectedStats = JSON.parse(saved);
            console.log('📦 Loaded custom stats from localStorage:', window.customSelectedStats);
        } catch (e) {
            window.customSelectedStats = [];
        }
    } else {
        window.customSelectedStats = [];
    }
});
