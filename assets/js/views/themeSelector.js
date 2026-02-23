// ===== FIELD THEME SYSTEM =====

// Define all themes
const fieldThemes = {
  'stadium-blue': {
    id: 'stadium-blue',
    name: 'fc-stadium',
    background: 'url(assets/images/background/squad_builder_1.webp) center/cover no-repeat',
  },

  'camp-nou': {
    id: 'camp-nou',
    name: 'Camp Nou',
    background: 'url(assets/images/background/squad_builder_2.webp) center/cover no-repeat',
  },

  'old-trafford': {
    id: 'old-trafford',
    name: 'Old Trafford',
    background: 'url(assets/images/background/squad_builder_3.webp) center/cover no-repeat',
  },

  'santiago-bernabeu': {
    id: 'santiago-bernabeu',
    name: 'Santiago Bernabeu',
    background: 'url(assets/images/background/squad_builder_4.webp) center/cover no-repeat',
  },

  'anfield': {
    id: 'anfield',
    name: 'Anfield',
    background: 'url(assets/images/background/squad_builder_5.webp) center/cover no-repeat',
  }
};

// Initialize theme state
let currentTheme = localStorage.getItem('selectedFieldTheme') || 'camp-nou';

// ===== OPEN/CLOSE THEME MODAL =====

function openThemeSelector() {
  const overlay = document.getElementById('theme-selector-overlay');
  if (!overlay) {
    console.warn('Theme overlay not found');
    return;
  }
  overlay.style.display = 'flex';
  renderThemeGallery();
}

function closeThemeSelector() {
  const overlay = document.getElementById('theme-selector-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
}

// ===== RENDER THEME GALLERY =====

function renderThemeGallery() {
  const gallery = document.getElementById('theme-gallery');
  if (!gallery) {
    console.warn('Theme gallery not found');
    return;
  }

  gallery.innerHTML = '';

  Object.values(fieldThemes).forEach(theme => {
    const option = document.createElement('div');
    option.className = 'theme-option' + (currentTheme === theme.id ? ' active' : '');
    option.dataset.themeId = theme.id;

    option.innerHTML = `
      <div class="theme-option-preview" style="background: ${theme.background}; background-attachment: fixed;">
        <div class="theme-option-name">${theme.name}</div>
      </div>
    `;

    option.addEventListener('click', () => {
      document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.remove('active');
      });
      option.classList.add('active');
      currentTheme = theme.id;
    });

    gallery.appendChild(option);
  });
}

// ===== APPLY THEME (FIXED) =====

function applyTheme(themeId) {
  const theme = fieldThemes[themeId];

  if (!theme) {
    console.error('❌ Theme not found:', themeId);
    return;
  }

  // FIXED: Use correct element ID
  const fieldContainer = document.getElementById('squad-field');

  if (!fieldContainer) {
    console.error('❌ Field element with id="squad-field" NOT found!');
    return;
  }

  // Remove all old theme classes
  Object.keys(fieldThemes).forEach(key => {
    fieldContainer.classList.remove(`theme-${key}`);
  });

  // Apply new theme class
  fieldContainer.classList.add(`theme-${themeId}`);

  // Apply inline style
  fieldContainer.style.background = theme.background;

  // Save to localStorage
  localStorage.setItem('selectedFieldTheme', themeId);

  // Close modal
  closeThemeSelector();

}

// ===== LOAD SAVED THEME =====

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('selectedFieldTheme') || 'classic-green';
  currentTheme = savedTheme;

  // Wait for DOM to be ready
  setTimeout(() => {
    applyTheme(savedTheme);
  }, 100);
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {


  // Theme button click
  const themeButtons = [
    document.getElementById('squad-theme-btn'),
    document.getElementById('squad-theme-btn-mobile-tablet')
  ].filter(Boolean);
  if (themeButtons.length) {
    themeButtons.forEach((themeBtn) => {
      themeBtn.addEventListener('click', () => {
        openThemeSelector();
      });
    });
  } else {
    console.warn('⚠️ Theme button not found');
  }

  // Close button
  const closeBtn = document.getElementById('close-theme-selector');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeThemeSelector);
  }

  // Apply button - THIS IS THE KEY!
  const applyBtn = document.getElementById('apply-theme-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {

      applyTheme(currentTheme);
    });
  } else {
    console.warn('⚠️ Apply button not found');
  }

  // Close on overlay click
  const overlay = document.getElementById('theme-selector-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeThemeSelector();
      }
    });
  }
});
