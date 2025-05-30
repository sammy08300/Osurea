/**
 * Favorites Module Configuration
 * Centralized configuration for the favorites component
 */

export const FAVORITES_CONFIG = {
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
        DATE: 'date',
        NAME: 'name',
        SIZE: 'size',
        MODIFIED: 'modified'
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
    }
};

export const FAVORITES_EVENTS = {
    LOCALE_CHANGED: 'localeChanged',
    LANGUAGE_CHANGED: 'languageChanged'
};

export default FAVORITES_CONFIG; 