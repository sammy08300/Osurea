/**
 * Osu!rea - Area Controller Module
 * Handles area dimension and position logic
 * @module area-controller
 */

import { clamp, formatNumber, calculateRatioString } from './utils.js';
import { setArea, setAreaRadius } from './visualizer.js';
import { savePrefs } from './storage.js';

/** @type {Object} - Reference to app state */
let state = null;

/** @type {Function|null} - Debounced save function */
let debouncedSave = null;

/**
 * Initialize the area controller
 * @param {Object} appState - Reference to application state
 * @param {Function} debouncedSaveState - Debounced save function
 */
export function initAreaController(appState, debouncedSaveState) {
  state = appState;
  debouncedSave = debouncedSaveState;
}

/**
 * Clamp area position within tablet bounds
 */
export function clampAreaPosition() {
  if (!state?.tablet) return;

  const halfW = state.area.width / 2;
  const halfH = state.area.height / 2;

  state.area.x = clamp(state.area.x, halfW, state.tablet.width - halfW);
  state.area.y = clamp(state.area.y, halfH, state.tablet.height - halfH);
}

/**
 * Update area dimensions from inputs
 * @param {boolean} forceUpdate - Force update even if inputs are empty
 */
export function updateAreaFromInputs(forceUpdate = false) {
  const widthInput = document.querySelector('#area-width');
  const heightInput = document.querySelector('#area-height');

  if (!widthInput || !heightInput || !state?.tablet) return;

  // Don't update if input is empty (user is typing)
  if (!forceUpdate && (widthInput.value === '' || heightInput.value === '')) {
    return;
  }

  let width = parseFloat(widthInput.value) || state.area.width;
  let height = parseFloat(heightInput.value) || state.area.height;

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

  state.area.width = width;
  state.area.height = height;

  clampAreaPosition();

  // Only update input values on forceUpdate (blur/change event)
  if (forceUpdate) {
    widthInput.value = formatNumber(state.area.width, 1);
    heightInput.value = formatNumber(state.area.height, 1);
  }

  setArea(state.area);
  updatePositionInputs();
  updateRatioDisplay();
  debouncedSave?.();
}

/**
 * Update area position from inputs
 * @param {boolean} forceUpdate - Force update even if inputs are empty
 */
export function updatePositionFromInputs(forceUpdate = false) {
  const posXInput = document.querySelector('#area-pos-x');
  const posYInput = document.querySelector('#area-pos-y');

  if (!posXInput || !posYInput || !state?.tablet) return;

  // Don't update if input is empty (user is typing)
  if (!forceUpdate && (posXInput.value === '' || posYInput.value === '')) {
    return;
  }

  const x = parseFloat(posXInput.value) || state.area.x;
  const y = parseFloat(posYInput.value) || state.area.y;

  state.area.x = x;
  state.area.y = y;

  clampAreaPosition();

  // Only update input values on forceUpdate (blur/change event)
  if (forceUpdate) {
    posXInput.value = formatNumber(state.area.x, 1);
    posYInput.value = formatNumber(state.area.y, 1);
  }

  setArea(state.area);
  debouncedSave?.();
}

/**
 * Update radius from slider
 */
export function updateRadiusFromSlider() {
  const radiusSlider = document.querySelector('#area-radius');
  const radiusValue = document.querySelector('#radius-value');

  if (!radiusSlider) return;

  const radius = parseInt(radiusSlider.value, 10) || 0;
  state.area.radius = radius;

  if (radiusValue) {
    radiusValue.textContent = `${radius}%`;
  }

  setAreaRadius(radius);
  debouncedSave?.();
}

/**
 * Center the area on tablet
 */
export function centerArea() {
  if (!state?.tablet) return;

  state.area.x = state.tablet.width / 2;
  state.area.y = state.tablet.height / 2;

  setArea(state.area);
  updatePositionInputs();
  saveState();
}

/**
 * Set area to full tablet size (respecting ratio lock)
 */
export function setFullArea() {
  if (!state?.tablet) return;

  if (state.lockRatio) {
    const targetRatio = 16 / 9;
    const tabletRatio = state.tablet.width / state.tablet.height;

    if (tabletRatio > targetRatio) {
      state.area.height = state.tablet.height;
      state.area.width = state.area.height * targetRatio;
    } else {
      state.area.width = state.tablet.width;
      state.area.height = state.area.width / targetRatio;
    }
  } else {
    state.area.width = state.tablet.width;
    state.area.height = state.tablet.height;
  }

  state.area.x = state.tablet.width / 2;
  state.area.y = state.tablet.height / 2;

  setArea(state.area);
  updateAllInputs();
  updateRatioDisplay();
  saveState();
}

/**
 * Update ratio display elements
 */
export function updateRatioDisplay() {
  const ratioValue = document.querySelector('#ratio-value');
  const ratioDisplay = document.querySelector('#ratio-display');
  const ratio = calculateRatioString(state.area.width, state.area.height);

  if (ratioValue) ratioValue.textContent = ratio;
  if (ratioDisplay) ratioDisplay.textContent = ratio;

  // Update area display in visualizer
  const areaDisplay = document.querySelector('#area-display');
  if (areaDisplay) {
    areaDisplay.textContent = `${formatNumber(state.area.width, 1)} × ${formatNumber(state.area.height, 1)}`;
  }
}

/**
 * Update position inputs from state
 */
export function updatePositionInputs() {
  const posXInput = document.querySelector('#area-pos-x');
  const posYInput = document.querySelector('#area-pos-y');

  if (posXInput) posXInput.value = formatNumber(state.area.x, 1);
  if (posYInput) posYInput.value = formatNumber(state.area.y, 1);
}

/**
 * Update radius slider from state
 */
export function updateRadiusSlider() {
  const radiusSlider = document.querySelector('#area-radius');
  const radiusValue = document.querySelector('#radius-value');

  const radius = state.area.radius || 0;
  if (radiusSlider) radiusSlider.value = radius;
  if (radiusValue) radiusValue.textContent = `${radius}%`;
}

/**
 * Update all input values from state
 */
export function updateAllInputs() {
  const widthInput = document.querySelector('#area-width');
  const heightInput = document.querySelector('#area-height');

  if (widthInput) widthInput.value = formatNumber(state.area.width, 1);
  if (heightInput) heightInput.value = formatNumber(state.area.height, 1);

  updatePositionInputs();
  updateRadiusSlider();
  updateRatioDisplay();
}

/**
 * Save current state to localStorage
 */
function saveState() {
  const prefs = {
    tablet: state.tablet,
    area: state.area,
    lockRatio: state.lockRatio,
    showGrid: state.showGrid,
  };
  savePrefs(prefs);
}

/**
 * Get recap data for modal
 * @returns {Object|null}
 */
export function getRecapData() {
  if (!state?.tablet) return null;

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
