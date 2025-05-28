/**
 * Favorites Module Configuration
 * Centralized configuration for the favorites component
 */

import { FavoritesConfig, SortCriteria } from './types'; // Import FavoritesConfig and SortCriteria types

export const FAVORITES_CONFIG: FavoritesConfig = {
    // DOM Element IDs
    ELEMENTS: {
        FAVORITES_LIST: 'favorites-list',
        AREA_WIDTH: 'areaWidth',
        AREA_HEIGHT: 'areaHeight',
        AREA_OFFSET_X: 'areaOffsetX',
        AREA_OFFSET_Y: 'areaOffsetY',
        CUSTOM_RATIO: 'customRatio',
        AREA_RADIUS: 'areaRadius',
        RADIUS_INPUT: 'radius-input',
        TABLET_WIDTH: 'tabletWidth',
        TABLET_HEIGHT: 'tabletHeight',
        TABLET_SELECTOR_BUTTON: 'tabletSelectorButton',
        TABLET_SELECTOR_TEXT: 'tabletSelectorText',
        CANCEL_EDIT_BTN: 'cancel-edit-btn',
        SAVE_BTN: 'save-btn'
    },

    // CSS Classes
    CLASSES: {
        LOADING_FAVORITES: 'loading-favorites',
        FAVORITES_TRANSITION_OUT: 'favorites-transition-out',
        FAVORITES_LOADING: 'favorites-loading',
        HIDDEN: 'hidden',
        FLEX: 'flex'
    },

    // Sort Criteria
    SORT_CRITERIA: {
        DATE: 'date' as SortCriteria,
        NAME: 'name' as SortCriteria,
        SIZE: 'size' as SortCriteria,
        MODIFIED: 'modified' as SortCriteria
    },

    // Animation Timings (in milliseconds)
    TIMINGS: {
        TRANSITION_DELAY: 120,
        REFRESH_DELAY: 50,
        AUTO_SAVE_DELAY: 100,
        FORCE_REFRESH_DELAY: 20
    },

    // Number formatting
    FORMATTING: {
        DEFAULT_DECIMALS: 1,
        COORDINATE_DECIMALS: 3
    },

    // Translation keys
    I18N_KEYS: {
        FAVORITE_NOT_FOUND: 'notifications.favoriteNotFound',
        CONFIG_LOADED: 'notifications.configurationLoaded',
        ERROR_LOADING_CONFIG: 'notifications.errorLoadingConfig',
        CONFIRM_MODIFICATION: 'favorites.confirmModification',
        SAVE_SUCCESS: 'notifications.saveSuccess',
        DELETE_SUCCESS: 'notifications.deleteSuccess',
        EDIT_CANCELLED: 'notifications.editCancelled'
        // Add other keys as needed, or define a more generic type like: [key: string]: string;
    },

    // Storage Key
    STORAGE_KEY: 'Osu!reaFavorites_v2',

    // ID Generator
    generateId: (): string => {
        return `fav_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};

interface FavoritesEventsConfig {
    LOCALE_CHANGED: string;
    LANGUAGE_CHANGED: string;
}

export const FAVORITES_EVENTS: FavoritesEventsConfig = {
    LOCALE_CHANGED: 'localeChanged',
    LANGUAGE_CHANGED: 'languageChanged'
};

export default FAVORITES_CONFIG;