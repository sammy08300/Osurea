/**
 * Osu!rea - Modules Index
 * Centralized exports for all modules
 * @module modules
 */

// Core utilities
export * from './utils.js';
export { icon, createIcon, icons } from './icons.js';

// State management
export * from './storage.js';

// i18n
export {
  initI18n,
  t,
  translatePage,
  setLocale,
  getLocale,
  getSupportedLocales,
  getAvailableLocales,
} from './i18n.js';

// UI Components
export {
  initVisualizer,
  setTablet,
  setArea,
  setAreaB,
  setAreaRadius,
  setAreaRotation,
  setGridVisible,
  setComparisonMode,
  setActiveZone,
  getActiveZone,
  alignArea,
  centerArea,
  getState as getVisualizerState,
  showLoading,
  hideLoading,
} from './visualizer.js';
export {
  initTabletSelector,
  setCurrentTablet,
  getCurrentTablet,
  isCustom,
} from './tablet-selector.js';
export {
  initFavorites,
  renderFavorites,
  refreshFavorites,
  saveCurrentAsFavorite,
} from './favorites.js';
export { initProPlayers, openProPlayersModal, getProPlayers } from './pro-players.js';
export {
  confirm,
  confirmDelete,
  prompt,
  alert,
  showRecapModal,
  showEditFavoriteModal,
} from './modal.js';
