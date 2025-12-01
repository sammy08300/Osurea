/**
 * Osu!rea - Centralized State Store
 * Simple state management with subscription pattern
 * @module store
 */

import { DEFAULT_AREA } from '../constants/index.js';

/**
 * @typedef {Object} Tablet
 * @property {string} brand - Tablet brand name
 * @property {string} model - Tablet model name
 * @property {number} width - Tablet width in mm
 * @property {number} height - Tablet height in mm
 * @property {boolean} isCustom - Whether this is a custom tablet
 */

/**
 * @typedef {Object} Area
 * @property {number} x - Center X position in mm
 * @property {number} y - Center Y position in mm
 * @property {number} width - Area width in mm
 * @property {number} height - Area height in mm
 * @property {number} radius - Corner radius percentage (0-100)
 * @property {number} rotation - Rotation angle in degrees (0-360)
 */

/**
 * @typedef {Object} AppState
 * @property {Tablet|null} tablet - Current tablet configuration
 * @property {Area} area - Current area configuration
 * @property {boolean} lockRatio - Whether aspect ratio is locked
 * @property {boolean} showGrid - Whether grid is visible
 */

/** @type {AppState} */
const state = {
  tablet: null,
  area: { ...DEFAULT_AREA },
  lockRatio: true,
  showGrid: true,
};

/** @type {Set<Function>} */
const subscribers = new Set();

/**
 * Get the current state (immutable copy)
 * @returns {AppState} - Current state
 */
export function getState() {
  return {
    tablet: state.tablet ? { ...state.tablet } : null,
    area: { ...state.area },
    lockRatio: state.lockRatio,
    showGrid: state.showGrid,
  };
}

/**
 * Get a specific property from state
 * @param {keyof AppState} key - State property key
 * @returns {*} - Property value
 */
export function getStateProperty(key) {
  const currentState = getState();
  return currentState[key];
}

/**
 * Update state with partial updates
 * @param {Partial<AppState>} updates - Partial state updates
 */
export function setState(updates) {
  let hasChanged = false;

  for (const key in updates) {
    if (key === 'tablet') {
      state.tablet = updates.tablet ? { ...updates.tablet } : null;
      hasChanged = true;
    } else if (key === 'area') {
      state.area = { ...state.area, ...updates.area };
      hasChanged = true;
    } else if (key in state) {
      state[key] = updates[key];
      hasChanged = true;
    }
  }

  if (hasChanged) {
    notifySubscribers();
  }
}

/**
 * Update only the area state
 * @param {Partial<Area>} areaUpdates - Area property updates
 */
export function setAreaState(areaUpdates) {
  state.area = { ...state.area, ...areaUpdates };
  notifySubscribers();
}

/**
 * Update only the tablet state
 * @param {Tablet|null} tablet - New tablet configuration
 */
export function setTabletState(tablet) {
  state.tablet = tablet ? { ...tablet } : null;
  notifySubscribers();
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Function to call on state change
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
  const currentState = getState();
  subscribers.forEach(callback => {
    try {
      callback(currentState);
    } catch (error) {
      console.error('Store subscriber error:', error);
    }
  });
}

/**
 * Reset state to defaults
 */
export function resetState() {
  state.tablet = null;
  state.area = { ...DEFAULT_AREA };
  state.lockRatio = true;
  state.showGrid = true;
  notifySubscribers();
}

/**
 * Initialize state from saved preferences
 * @param {Partial<AppState>} savedState - Saved state from storage
 */
export function initializeState(savedState) {
  if (savedState) {
    if (savedState.tablet) state.tablet = { ...savedState.tablet };
    if (savedState.area) state.area = { ...state.area, ...savedState.area };
    if (typeof savedState.lockRatio === 'boolean') state.lockRatio = savedState.lockRatio;
    if (typeof savedState.showGrid === 'boolean') state.showGrid = savedState.showGrid;
  }
}

export default {
  getState,
  getStateProperty,
  setState,
  setAreaState,
  setTabletState,
  subscribe,
  resetState,
  initializeState,
};
