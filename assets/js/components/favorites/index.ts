/**
 * Favorites Module - Main Export Index
 * Provides easy access to all favorites functionality
 */

// Main interface
export { FavoritesUI } from './favoritesindex.js';

// Configuration and utilities
export { FAVORITES_CONFIG, FAVORITES_EVENTS } from './favorites-config.js';
export * from './favorites-utils.js';

// Core modules
export { FavoritesInit } from './favorite-init.js';
export { FavoritesActions } from './favorite-actions.js';
export { FavoritesRendering } from './favorite-rendering.js';
export { FavoritesPopups } from './favorite-popup.js';
export { FavoritesEvents } from './favorite-events.js';

// Storage and sorting
export * from './favorite-storage.js';
export { sortFavorites, getAvailableSortCriteria, isValidSortCriteria } from './favorite-sort.js';

// Default export is the main UI interface
export { FavoritesUI as default } from './favoritesindex.js'; 