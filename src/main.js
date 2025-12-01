/**
 * Osu!rea - Main Entry Point
 * Tablet area visualizer for osu!
 */

import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';

import { initI18n, translatePage, setLocale, getLocale } from './modules/i18n.js';
import { loadPrefs, savePrefs, getTheme, setTheme } from './modules/storage.js';
import { icon } from './modules/icons.js';
import {
  initVisualizer,
  setTablet,
  setArea,
  setAreaB,
  setAreaRadius,
  setAreaRotation,
  setGridVisible,
  setComparisonMode,
  setActiveZone,
} from './modules/visualizer.js';
import { initTabletSelector, setCurrentTablet } from './modules/tablet-selector.js';
import { initFavorites, saveCurrentAsFavorite } from './modules/favorites.js';
import { initProPlayers, openProPlayersModal } from './modules/pro-players.js';
import { clamp, debounce, calculateRatioString, formatNumber } from './modules/utils.js';
import { showRecapModal } from './modules/modal.js';

// App state
const state = {
  tablet: null,
  area: { x: 0, y: 0, width: 100, height: 62.5, radius: 0, rotation: 0 },
  areaB: { x: 0, y: 0, width: 100, height: 62.5, radius: 0, rotation: 0 },
  comparisonMode: false,
  activeZone: 'A',
  lockRatio: true,
  showGrid: true,
};

/**
 * Initialize theme
 */
function initTheme() {
  const theme = getTheme();
  document.documentElement.dataset.theme = theme;
  updateThemeIcon();
}

/**
 * Update theme icon
 */
function updateThemeIcon() {
  const themeBtn = document.querySelector('#theme-toggle');
  if (themeBtn) {
    const theme = getTheme();
    themeBtn.innerHTML = icon(theme === 'dark' ? 'moon' : 'sun');
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  document.documentElement.dataset.theme = next;
  updateThemeIcon();
}

/**
 * Select a specific language
 */
async function selectLanguage(locale) {
  await setLocale(locale);
  translatePage();
  updateLangDisplay();
  updateLangMenuActive();
  hideLangMenu();
}

/**
 * Toggle language menu visibility
 */
function toggleLangMenu() {
  const langMenu = document.querySelector('#lang-menu');
  const langToggle = document.querySelector('#lang-toggle');

  if (langMenu && langToggle) {
    const isHidden = langMenu.classList.contains('hidden');
    langMenu.classList.toggle('hidden');
    langToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  }
}

/**
 * Hide language menu
 */
function hideLangMenu() {
  const langMenu = document.querySelector('#lang-menu');
  const langToggle = document.querySelector('#lang-toggle');

  if (langMenu && langToggle) {
    langMenu.classList.add('hidden');
    langToggle.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Update active state in language menu
 */
function updateLangMenuActive() {
  const currentLocale = getLocale();
  document.querySelectorAll('.lang-option').forEach(option => {
    const isActive = option.dataset.locale === currentLocale;
    option.classList.toggle('active', isActive);
  });
}

/**
 * Update language display
 */
function updateLangDisplay() {
  const langToggle = document.querySelector('#current-lang');
  if (langToggle) {
    langToggle.textContent = getLocale().toUpperCase();
  }
}

/**
 * Update area dimensions from inputs
 */
function updateAreaFromInputs(forceUpdate = false) {
  const widthInput = document.querySelector('#area-width');
  const heightInput = document.querySelector('#area-height');

  if (!widthInput || !heightInput || !state.tablet) return;

  // Don't update if input is empty (user is typing)
  if (!forceUpdate && (widthInput.value === '' || heightInput.value === '')) {
    return;
  }

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;

  let width = parseFloat(widthInput.value) || activeArea.width;
  let height = parseFloat(heightInput.value) || activeArea.height;

  // Clamp to tablet bounds
  width = clamp(width, 1, state.tablet.width);
  height = clamp(height, 1, state.tablet.height);

  // Keep aspect ratio if locked (16:9)
  if (state.lockRatio) {
    const targetRatio = 16 / 9;
    const { height: tabletHeight } = state.tablet;
    height = width / targetRatio;
    if (height > tabletHeight) {
      height = tabletHeight;
      width = height * targetRatio;
    }
  }

  activeArea.width = width;
  activeArea.height = height;

  clampAreaPosition();

  // Only update input values on forceUpdate (blur/change event)
  if (forceUpdate) {
    widthInput.value = formatNumber(activeArea.width, 1);
    heightInput.value = formatNumber(activeArea.height, 1);
  }

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  updatePositionInputs();
  updateRatioDisplay();
  debouncedSaveState();
}

/**
 * Update area position from inputs
 */
function updatePositionFromInputs(forceUpdate = false) {
  const posXInput = document.querySelector('#area-pos-x');
  const posYInput = document.querySelector('#area-pos-y');

  if (!posXInput || !posYInput || !state.tablet) return;

  // Don't update if input is empty (user is typing)
  if (!forceUpdate && (posXInput.value === '' || posYInput.value === '')) {
    return;
  }

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;

  const x = parseFloat(posXInput.value) || activeArea.x;
  const y = parseFloat(posYInput.value) || activeArea.y;

  activeArea.x = x;
  activeArea.y = y;

  clampAreaPosition();

  // Only update input values on forceUpdate (blur/change event)
  if (forceUpdate) {
    posXInput.value = formatNumber(activeArea.x, 1);
    posYInput.value = formatNumber(activeArea.y, 1);
  }

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  debouncedSaveState();
}

/**
 * Snap value to nearest snap point if within threshold
 * @param {number} value - Current value
 * @param {number[]} snapPoints - Array of snap points
 * @param {number} threshold - Distance threshold for snapping
 * @returns {number} - Snapped value or original
 */
function snapToPoint(value, snapPoints, threshold = 5) {
  for (const point of snapPoints) {
    if (Math.abs(value - point) <= threshold) {
      return point;
    }
  }
  return value;
}

/**
 * Update radius from slider
 */
function updateRadiusFromSlider() {
  const radiusSlider = document.querySelector('#area-radius');
  const radiusInput = document.querySelector('#radius-value');

  if (!radiusSlider) return;

  let radius = parseInt(radiusSlider.value, 10) || 0;

  // Snap to key points: 0%, 50%, 100%
  radius = snapToPoint(radius, [0, 50, 100], 2);

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  activeArea.radius = radius;

  // Update slider position if snapped
  radiusSlider.value = radius;

  if (radiusInput) {
    radiusInput.value = radius;
  }

  setAreaRadius(radius);
  debouncedSaveState();
}

/**
 * Update radius from manual input (no snapping)
 */
function updateRadiusFromInput() {
  const radiusSlider = document.querySelector('#area-radius');
  const radiusInput = document.querySelector('#radius-value');

  if (!radiusInput) return;

  let radius = parseInt(radiusInput.value, 10) || 0;
  radius = clamp(radius, 0, 100);

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  activeArea.radius = radius;

  if (radiusSlider) {
    radiusSlider.value = radius;
  }
  radiusInput.value = radius;

  setAreaRadius(radius);
  debouncedSaveState();
}

/**
 * Update rotation from slider
 */
function updateRotationFromSlider() {
  const rotationSlider = document.querySelector('#area-rotation');
  const rotationInput = document.querySelector('#rotation-value');

  if (!rotationSlider) return;

  let rotation = parseInt(rotationSlider.value, 10) || 0;

  // Snap to key angles: -180°, -90°, 0°, 90°, 180°
  rotation = snapToPoint(rotation, [-180, -90, 0, 90, 180], 2);

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  activeArea.rotation = rotation;

  // Update slider position if snapped
  rotationSlider.value = rotation;

  if (rotationInput) {
    rotationInput.value = rotation;
  }

  setAreaRotation(rotation);
  debouncedSaveState();
}

/**
 * Update rotation from manual input (no snapping)
 */
function updateRotationFromInput() {
  const rotationSlider = document.querySelector('#area-rotation');
  const rotationInput = document.querySelector('#rotation-value');

  if (!rotationInput) return;

  let rotation = parseInt(rotationInput.value, 10) || 0;
  rotation = clamp(rotation, -180, 180);

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  activeArea.rotation = rotation;

  if (rotationSlider) {
    rotationSlider.value = rotation;
  }
  rotationInput.value = rotation;

  setAreaRotation(rotation);
  debouncedSaveState();
}

/**
 * Clamp area position within tablet bounds
 */
function clampAreaPosition() {
  if (!state.tablet) return;

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;

  const halfW = activeArea.width / 2;
  const halfH = activeArea.height / 2;

  activeArea.x = clamp(activeArea.x, halfW, state.tablet.width - halfW);
  activeArea.y = clamp(activeArea.y, halfH, state.tablet.height - halfH);
}

/**
 * Center the area
 */
function centerArea() {
  if (!state.tablet) return;

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;

  activeArea.x = state.tablet.width / 2;
  activeArea.y = state.tablet.height / 2;

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  updatePositionInputs();
  saveState();
}

/**
 * Set area to full tablet size
 */
function setFullArea() {
  if (!state.tablet) return;

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;

  if (state.lockRatio) {
    const targetRatio = 16 / 9;
    const tabletRatio = state.tablet.width / state.tablet.height;

    if (tabletRatio > targetRatio) {
      activeArea.height = state.tablet.height;
      activeArea.width = activeArea.height * targetRatio;
    } else {
      activeArea.width = state.tablet.width;
      activeArea.height = activeArea.width / targetRatio;
    }
  } else {
    activeArea.width = state.tablet.width;
    activeArea.height = state.tablet.height;
  }

  activeArea.x = state.tablet.width / 2;
  activeArea.y = state.tablet.height / 2;

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  updateInputs();
  updateRatioDisplay();
  saveState();
}

/**
 * Update ratio display
 */
function updateRatioDisplay() {
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  const ratioValue = document.querySelector('#ratio-value');
  const ratioDisplay = document.querySelector('#ratio-display');
  const ratio = calculateRatioString(activeArea.width, activeArea.height);

  if (ratioValue) ratioValue.textContent = ratio;
  if (ratioDisplay) ratioDisplay.textContent = ratio;

  // Update area display in visualizer
  const areaDisplay = document.querySelector('#area-display');
  if (areaDisplay) {
    areaDisplay.textContent = `${formatNumber(
      activeArea.width,
      1
    )} × ${formatNumber(activeArea.height, 1)}`;
  }
}

/**
 * Update tablet info display
 */
function updateTabletInfo() {
  const tabletDimensions = document.querySelector('#tablet-dimensions');
  if (tabletDimensions && state.tablet) {
    tabletDimensions.textContent = `${formatNumber(
      state.tablet.width,
      1
    )} × ${formatNumber(state.tablet.height, 1)} mm`;
  }
}

/**
 * Get recap data
 */
function getRecapData() {
  if (!state.tablet) return null;

  const { tablet, area } = state;
  return {
    width: formatNumber(area.width),
    height: formatNumber(area.height),
    ratio: calculateRatioString(area.width, area.height),
    surface: (area.width * area.height).toFixed(1),
    coverageX: ((area.width / tablet.width) * 100).toFixed(1),
    coverageY: ((area.height / tablet.height) * 100).toFixed(1),
    position: `${formatNumber(area.x, 1)}, ${formatNumber(area.y, 1)}`,
  };
}

/**
 * Show recap modal
 */
function showRecap() {
  const data = getRecapData();
  if (data) {
    showRecapModal(data);
  }
}

/**
 * Save state to localStorage
 */
function saveState() {
  const prefs = {
    tablet: state.tablet,
    area: state.area,
    areaB: state.areaB,
    comparisonMode: state.comparisonMode,
    activeZone: state.activeZone,
    lockRatio: state.lockRatio,
    showGrid: state.showGrid,
  };
  savePrefs(prefs);
}

const debouncedSaveState = debounce(saveState, 300);

/**
 * Load state from localStorage
 */
function loadState() {
  const prefs = loadPrefs();
  if (prefs) {
    if (prefs.tablet) state.tablet = prefs.tablet;
    if (prefs.area) state.area = { ...state.area, ...prefs.area };
    if (prefs.areaB) state.areaB = { ...state.areaB, ...prefs.areaB };
    if (typeof prefs.comparisonMode === 'boolean') state.comparisonMode = prefs.comparisonMode;
    if (prefs.activeZone) state.activeZone = prefs.activeZone;
    if (typeof prefs.lockRatio === 'boolean') state.lockRatio = prefs.lockRatio;
    if (typeof prefs.showGrid === 'boolean') state.showGrid = prefs.showGrid;
  }
}

/**
 * Handle tablet selection
 */
function onTabletSelected(tablet) {
  state.tablet = tablet;
  setTablet(tablet.width, tablet.height);

  updateTabletInfo();

  const customDimensions = document.querySelector('#custom-dimensions');
  if (tablet.isCustom) {
    const customWidth = document.querySelector('#custom-width');
    const customHeight = document.querySelector('#custom-height');
    if (customWidth) customWidth.value = tablet.width;
    if (customHeight) customHeight.value = tablet.height;
    customDimensions?.classList.remove('hidden');

    // Reset preset buttons active state
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  } else {
    customDimensions?.classList.add('hidden');
  }

  if (state.area.width > tablet.width) state.area.width = tablet.width;
  if (state.area.height > tablet.height) state.area.height = tablet.height;

  state.area.x = tablet.width / 2;
  state.area.y = tablet.height / 2;
  clampAreaPosition();

  setArea(state.area);
  updateInputs();
  updateRatioDisplay();
  saveState();
}

/**
 * Update all input values from state
 */
function updateInputs() {
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  const widthInput = document.querySelector('#area-width');
  const heightInput = document.querySelector('#area-height');

  if (widthInput) widthInput.value = formatNumber(activeArea.width, 1);
  if (heightInput) heightInput.value = formatNumber(activeArea.height, 1);

  updatePositionInputs();
  updateRadiusSlider();
  updateRotationSlider();
  updateRatioDisplay();
}

/**
 * Update position inputs from state
 */
function updatePositionInputs() {
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  const posXInput = document.querySelector('#area-pos-x');
  const posYInput = document.querySelector('#area-pos-y');

  if (posXInput) posXInput.value = formatNumber(activeArea.x, 1);
  if (posYInput) posYInput.value = formatNumber(activeArea.y, 1);
}

/**
 * Update radius slider from state
 */
function updateRadiusSlider() {
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  const radiusSlider = document.querySelector('#area-radius');
  const radiusInput = document.querySelector('#radius-value');

  const radius = activeArea.radius || 0;
  if (radiusSlider) radiusSlider.value = radius;
  if (radiusInput) radiusInput.value = radius;
}

/**
 * Update rotation slider from state
 */
function updateRotationSlider() {
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  const rotationSlider = document.querySelector('#area-rotation');
  const rotationInput = document.querySelector('#rotation-value');

  const rotation = activeArea.rotation || 0;
  if (rotationSlider) rotationSlider.value = rotation;
  if (rotationInput) rotationInput.value = rotation;
}

/**
 * Handle favorite selection
 */
function onFavoriteSelected(favorite) {
  state.tablet = favorite.tablet;
  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  Object.assign(activeArea, favorite.area);

  setCurrentTablet(state.tablet);
  setTablet(state.tablet.width, state.tablet.height);

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  setAreaRadius(activeArea.radius || 0);
  setAreaRotation(activeArea.rotation || 0);

  updateTabletInfo();
  updateInputs();
  saveState();
}

/**
 * Handle pro player selection
 */
function onProPlayerSelected(player) {
  state.tablet = {
    brand: player.tablet.brand,
    model: player.tablet.model,
    width: player.tablet.width,
    height: player.tablet.height,
    isCustom: false,
  };

  const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
  Object.assign(activeArea, player.area);

  setCurrentTablet(state.tablet);
  setTablet(state.tablet.width, state.tablet.height);

  if (state.activeZone === 'A') {
    setArea(state.area);
  } else {
    setAreaB(state.areaB);
  }

  setAreaRadius(activeArea.radius || 0);
  setAreaRotation(activeArea.rotation || 0);

  updateTabletInfo();
  updateInputs();
  saveState();
}

/**
 * Toggle comparison mode
 */
function toggleComparisonMode() {
  state.comparisonMode = !state.comparisonMode;
  setComparisonMode(state.comparisonMode);

  const toggleBtn = document.querySelector('#toggle-comparison');
  const zoneSelector = document.querySelector('#zone-selector');

  toggleBtn?.classList.toggle('active', state.comparisonMode);
  zoneSelector?.classList.toggle('hidden', !state.comparisonMode);

  // If turning on comparison, initialize areaB from areaA
  if (state.comparisonMode && !state.areaB.width) {
    state.areaB = { ...state.area };
    setAreaB(state.areaB);
  }

  saveState();
}

/**
 * Switch active zone (A or B)
 */
function switchActiveZone(zone) {
  if (zone === state.activeZone) return;

  state.activeZone = zone;
  setActiveZone(zone);

  // Update UI
  const zoneABtn = document.querySelector('#zone-a-btn');
  const zoneBBtn = document.querySelector('#zone-b-btn');

  zoneABtn?.classList.toggle('active', zone === 'A');
  zoneBBtn?.classList.toggle('active', zone === 'B');

  // Update all inputs for the new active zone
  updateInputs();
  saveState();
}

/**
 * Initialize app
 */
async function init() {
  loadState();

  await initI18n();

  initTheme();
  updateLangDisplay();

  translatePage();

  // Initialize visualizer
  const visualizerContainer = document.querySelector('#visualizer');
  if (visualizerContainer) {
    initVisualizer(visualizerContainer);

    if (state.tablet) {
      setTablet(state.tablet.width, state.tablet.height);
      clampAreaPosition();
      setArea(state.area);
      setAreaB(state.areaB);
      setAreaRadius(state.area.radius || 0);
      setAreaRotation(state.area.rotation || 0);
    }

    setGridVisible(state.showGrid);
    setComparisonMode(state.comparisonMode);
    setActiveZone(state.activeZone);
  }

  // Initialize tablet selector
  const tabletSelectorContainer = document.querySelector('#tablet-selector');
  if (tabletSelectorContainer) {
    await initTabletSelector(tabletSelectorContainer, onTabletSelected);

    if (state.tablet) {
      setCurrentTablet(state.tablet);
      updateTabletInfo();
    }
  }

  // Initialize favorites
  const favoritesContainer = document.querySelector('#favorites');
  if (favoritesContainer) {
    initFavorites(favoritesContainer, onFavoriteSelected);
  }

  // Initialize pro players
  await initProPlayers(onProPlayerSelected);

  setupControls();

  updateInputs();

  // Initialize comparison mode UI state
  if (state.comparisonMode) {
    const toggleBtn = document.querySelector('#toggle-comparison');
    const zoneSelector = document.querySelector('#zone-selector');
    toggleBtn?.classList.add('active');
    zoneSelector?.classList.remove('hidden');

    const zoneABtn = document.querySelector('#zone-a-btn');
    const zoneBBtn = document.querySelector('#zone-b-btn');
    zoneABtn?.classList.toggle('active', state.activeZone === 'A');
    zoneBBtn?.classList.toggle('active', state.activeZone === 'B');
  }
}

/**
 * Setup control event listeners
 */
function setupControls() {
  // Theme toggle
  const themeBtn = document.querySelector('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Language dropdown
  const langToggle = document.querySelector('#lang-toggle');
  const langMenu = document.querySelector('#lang-menu');
  const langDropdown = document.querySelector('#lang-dropdown');

  if (langToggle && langMenu) {
    langToggle.addEventListener('click', e => {
      e.stopPropagation();
      toggleLangMenu();
    });

    // Language option clicks
    document.querySelectorAll('.lang-option').forEach(option => {
      option.addEventListener('click', () => {
        selectLanguage(option.dataset.locale);
      });
    });

    // Close on click outside
    document.addEventListener('click', e => {
      if (langDropdown && !langDropdown.contains(e.target)) {
        hideLangMenu();
      }
    });

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        hideLangMenu();
      }
    });

    // Set initial active state
    updateLangMenuActive();
  }

  // Area dimension inputs
  const widthInput = document.querySelector('#area-width');
  const heightInput = document.querySelector('#area-height');

  widthInput?.addEventListener(
    'input',
    debounce(() => updateAreaFromInputs(false), 200)
  );
  heightInput?.addEventListener(
    'input',
    debounce(() => updateAreaFromInputs(false), 200)
  );
  widthInput?.addEventListener('change', () => updateAreaFromInputs(true));
  heightInput?.addEventListener('change', () => updateAreaFromInputs(true));

  // Position inputs
  const posXInput = document.querySelector('#area-pos-x');
  const posYInput = document.querySelector('#area-pos-y');

  posXInput?.addEventListener(
    'input',
    debounce(() => updatePositionFromInputs(false), 200)
  );
  posYInput?.addEventListener(
    'input',
    debounce(() => updatePositionFromInputs(false), 200)
  );
  posXInput?.addEventListener('change', () => updatePositionFromInputs(true));
  posYInput?.addEventListener('change', () => updatePositionFromInputs(true));

  // Radius slider and manual input
  const radiusSlider = document.querySelector('#area-radius');
  const radiusInput = document.querySelector('#radius-value');
  radiusSlider?.addEventListener('input', updateRadiusFromSlider);
  radiusInput?.addEventListener('change', updateRadiusFromInput);

  // Rotation slider and manual input
  const rotationSlider = document.querySelector('#area-rotation');
  const rotationInput = document.querySelector('#rotation-value');
  rotationSlider?.addEventListener('input', updateRotationFromSlider);
  rotationInput?.addEventListener('change', updateRotationFromInput);

  // Lock ratio toggle
  const lockRatioBtn = document.querySelector('#lock-ratio');
  if (lockRatioBtn) {
    lockRatioBtn.classList.toggle('active', state.lockRatio);
    lockRatioBtn.innerHTML = icon(state.lockRatio ? 'lock' : 'unlock');

    lockRatioBtn.addEventListener('click', () => {
      state.lockRatio = !state.lockRatio;
      lockRatioBtn.classList.toggle('active', state.lockRatio);
      lockRatioBtn.innerHTML = icon(state.lockRatio ? 'lock' : 'unlock');

      if (state.lockRatio) {
        updateAreaFromInputs();
      }

      saveState();
    });
  }

  // Grid toggle (toolbar)
  const gridBtn = document.querySelector('#toggle-grid');
  const gridIcon = document.querySelector('#grid-icon');
  if (gridBtn && gridIcon) {
    gridBtn.classList.toggle('active', state.showGrid);
    gridIcon.innerHTML = icon('grid');

    gridBtn.addEventListener('click', () => {
      state.showGrid = !state.showGrid;
      gridBtn.classList.toggle('active', state.showGrid);
      setGridVisible(state.showGrid);
      saveState();
    });
  }

  // Full area button (toolbar)
  const fullAreaBtn = document.querySelector('#full-area');
  const fullAreaIcon = document.querySelector('#fullarea-icon');
  if (fullAreaBtn && fullAreaIcon) {
    fullAreaIcon.innerHTML = icon('crop');
    fullAreaBtn.addEventListener('click', setFullArea);
  }

  // Recap button (toolbar)
  const recapBtn = document.querySelector('#show-recap');
  const recapIcon = document.querySelector('#recap-icon');
  if (recapBtn && recapIcon) {
    recapIcon.innerHTML = icon('info');
    recapBtn.addEventListener('click', showRecap);
  }

  // Save favorite button
  const saveBtn = document.querySelector('#save-favorite');
  const saveIcon = document.querySelector('#save-icon');
  if (saveIcon) {
    saveIcon.innerHTML = icon('heart');
  }
  saveBtn?.addEventListener('click', () => {
    if (state.tablet) {
      const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
      saveCurrentAsFavorite(state.tablet, activeArea);
    }
  });

  // Pro Players button
  const proPlayersBtn = document.querySelector('#pro-players-btn');
  const proPlayersIcon = document.querySelector('#pro-players-icon');
  if (proPlayersIcon) {
    proPlayersIcon.innerHTML = icon('users');
  }
  proPlayersBtn?.addEventListener('click', openProPlayersModal);

  // Comparison mode toggle
  const comparisonToggle = document.querySelector('#toggle-comparison');
  const comparisonIcon = document.querySelector('#comparison-icon');
  if (comparisonIcon) {
    comparisonIcon.innerHTML = icon('layers');
  }
  comparisonToggle?.addEventListener('click', toggleComparisonMode);

  // Zone selector buttons
  const zoneABtn = document.querySelector('#zone-a-btn');
  const zoneBBtn = document.querySelector('#zone-b-btn');
  zoneABtn?.addEventListener('click', () => switchActiveZone('A'));
  zoneBBtn?.addEventListener('click', () => switchActiveZone('B'));

  // Custom dimensions inputs
  const customWidth = document.querySelector('#custom-width');
  const customHeight = document.querySelector('#custom-height');

  const updateCustomDimensions = () => {
    if (state.tablet?.isCustom) {
      const w = parseFloat(customWidth?.value) || 152;
      const h = parseFloat(customHeight?.value) || 95;
      state.tablet.width = w;
      state.tablet.height = h;
      setTablet(w, h);
      updateTabletInfo();
      clampAreaPosition();
      centerArea();
      saveState();
    }
  };

  customWidth?.addEventListener('change', updateCustomDimensions);
  customHeight?.addEventListener('change', updateCustomDimensions);

  // Ratio preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.tablet) return;

      const activeArea = state.activeZone === 'A' ? state.area : state.areaB;
      const ratioStr = btn.dataset.ratio;
      const [ratioW, ratioH] = ratioStr.split(':').map(Number);
      const targetRatio = ratioW / ratioH;

      // Update active state
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply ratio to area
      const currentWidth = activeArea.width;
      let newHeight = currentWidth / targetRatio;

      // Clamp to tablet bounds
      if (newHeight > state.tablet.height) {
        newHeight = state.tablet.height;
        activeArea.width = newHeight * targetRatio;
      }

      activeArea.height = newHeight;
      clampAreaPosition();

      if (state.activeZone === 'A') {
        setArea(state.area);
      } else {
        setAreaB(state.areaB);
      }

      updateInputs();
      updateRatioDisplay();
      saveState();
    });
  });

  // Listen for area changes from visualizer (drag)
  window.addEventListener('area-changed', e => {
    const zone = e.detail.zone || 'A';
    if (zone === 'A') {
      state.area = { ...state.area, ...e.detail };
    } else {
      state.areaB = { ...state.areaB, ...e.detail };
    }
    updateInputs();
    debouncedSaveState();
  });
}

// Export for use in favorites edit
export {
  state,
  updateInputs,
  setArea,
  setAreaB,
  setAreaRadius,
  setAreaRotation,
  setTablet,
  setCurrentTablet,
  updateTabletInfo,
};

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
