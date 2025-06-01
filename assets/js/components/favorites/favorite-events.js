/**
 * Favorites Events Module
 * Handles event listeners and event management for the favorites component
 */

import { FAVORITES_CONFIG, FAVORITES_EVENTS } from './favorites-config.js';
import { getElement, logError } from './favorites-utils.js';

/**
 * Favorites Events Manager
 * Centralized event handling for the favorites component
 */
export const FavoritesEvents = {
    // Store event listeners for cleanup
    eventListeners: new Map(),
    isInitialized: false,

    /**
     * Initialize all event listeners
     */
    init() {
        if (this.isInitialized) {
            console.warn('FavoritesEvents already initialized');
            return;
        }

        try {
            this.setupDOMEventListeners();
            this.setupCustomEventListeners();
            this.isInitialized = true;
            console.log('FavoritesEvents initialized successfully');
        } catch (error) {
            logError('FavoritesEvents.init', error);
        }
    },

    /**
     * Setup DOM-based event listeners
     */
    setupDOMEventListeners() {
        // Add any DOM event listeners here
        // Example: click handlers, form submissions, etc.
        
        // This is a placeholder - actual DOM events would be added based on requirements
        const favoritesList = getElement(FAVORITES_CONFIG.ELEMENTS.FAVORITES_LIST);
        if (favoritesList) {
            this.addEventListener(favoritesList, 'click', this.handleFavoritesListClick.bind(this));
        }
    },

    /**
     * Setup custom event listeners
     */
    setupCustomEventListeners() {
        // Listen for locale changes
        this.addEventListener(document, FAVORITES_EVENTS.LOCALE_CHANGED, this.handleLocaleChange.bind(this));
        
        // Listen for language changes
        this.addEventListener(window, FAVORITES_EVENTS.LANGUAGE_CHANGED, this.handleLanguageChange.bind(this));
    },

    /**
     * Add event listener with tracking for cleanup
     * @param {EventTarget} target - The event target
     * @param {string} event - The event type
     * @param {Function} handler - The event handler
     * @param {Object} options - Event listener options
     */
    addEventListener(target, event, handler, options = {}) {
        if (!target || !event || !handler) {
            console.warn('addEventListener: Invalid parameters provided');
            return;
        }

        try {
            target.addEventListener(event, handler, options);
            
            // Store for cleanup
            const key = `${target.constructor.name}_${event}_${handler.name || 'anonymous'}`;
            this.eventListeners.set(key, { target, event, handler, options });
        } catch (error) {
            logError('addEventListener', error, { event, target });
        }
    },

    /**
     * Remove event listener
     * @param {EventTarget} target - The event target
     * @param {string} event - The event type
     * @param {Function} handler - The event handler
     */
    removeEventListener(target, event, handler) {
        if (!target || !event || !handler) {
            console.warn('removeEventListener: Invalid parameters provided');
            return;
        }

        try {
            target.removeEventListener(event, handler);
            
            // Remove from tracking
            const key = `${target.constructor.name}_${event}_${handler.name || 'anonymous'}`;
            this.eventListeners.delete(key);
        } catch (error) {
            logError('removeEventListener', error, { event, target });
        }
    },

    /**
     * Handle clicks on the favorites list
     * @param {Event} event - The click event
     */
    handleFavoritesListClick(event) {
        // This is a placeholder for actual click handling logic
        // The actual implementation would depend on the specific requirements
        console.log('Favorites list clicked:', event.target);
    },

    /**
     * Handle locale change events
     * @param {Event} event - The locale change event
     */
    handleLocaleChange(event) {
        console.log('Locale changed:', event.detail);
        // Delegate to the appropriate handler in the init module
        // This would be connected to the actual locale change handler
    },

    /**
     * Handle language change events
     * @param {Event} event - The language change event
     */
    handleLanguageChange(event) {
        console.log('Language changed:', event.detail);
        // Delegate to the appropriate handler in the init module
        // This would be connected to the actual language change handler
    },

    /**
     * Dispatch a custom event
     * @param {string} eventName - The event name
     * @param {any} detail - Event detail data
     * @param {EventTarget} target - Event target (defaults to document)
     */
    dispatchEvent(eventName, detail = null, target = document) {
        try {
            const customEvent = new CustomEvent(eventName, { detail });
            target.dispatchEvent(customEvent);
        } catch (error) {
            logError('dispatchEvent', error, { eventName, detail });
        }
    },

    /**
     * Clean up all event listeners
     */
    cleanup() {
        try {
            // Remove all tracked event listeners
            for (const [key, { target, event, handler }] of this.eventListeners) {
                try {
                    target.removeEventListener(event, handler);
                } catch (error) {
                    console.warn(`Failed to remove event listener ${key}:`, error);
                }
            }
            
            // Clear the tracking map
            this.eventListeners.clear();
            this.isInitialized = false;
            
            console.log('FavoritesEvents cleanup completed');
        } catch (error) {
            logError('FavoritesEvents.cleanup', error);
        }
    },

    /**
     * Get the number of active event listeners
     * @returns {number} Number of active listeners
     */
    getActiveListenersCount() {
        return this.eventListeners.size;
    },

    /**
     * Check if events are initialized
     * @returns {boolean} True if initialized
     */
    isReady() {
        return this.isInitialized;
    }
}; 
