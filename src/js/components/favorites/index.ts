/**
 * Favorites Module - Main Export Index
 * Provides easy access to all favorites functionality
 */

// Main interface
export { FavoritesUI } from './favoritesindex.ts';

// Configuration and utilities
export { FAVORITES_CONFIG, FAVORITES_EVENTS } from './favorites-config.ts';
export * from './favorites-utils.ts';

// Core modules
export { FavoritesInit } from './favorite-init.ts';
export { FavoritesActions } from './favorite-actions.ts';
export { FavoritesRendering } from './favorite-rendering.ts';
export { FavoritesPopups } from './favorite-popup.ts';
export { FavoritesEvents } from './favorite-events.ts';

// Storage and sorting
export * from './favorite-storage.ts';
export { sortFavorites, getAvailableSortCriteria, isValidSortCriteria } from './favorite-sort.ts';

// Default export is the main UI interface
export { FavoritesUI as default } from './favoritesindex.ts';