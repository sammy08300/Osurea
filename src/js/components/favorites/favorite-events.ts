/**
 * Favorites Events Module
 * Handles event listeners and event management for the favorites component
 */

import { FAVORITES_CONFIG, FAVORITES_EVENTS } from './favorites-config.js';
import { getElement, logError } from './favorites-utils.js';
import { FavoritesEventsInterface } from './types.js'; // Import the interface

interface EventListenerDetail {
    target: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions | boolean;
}

/**
 * Favorites Events Manager
 * Centralized event handling for the favorites component
 */
export const FavoritesEvents: FavoritesEventsInterface = {
    // Store event listeners for cleanup
    eventListeners: new Map<string, EventListenerDetail>(),
    isInitialized: false,

    /**
     * Initialize all event listeners
     */
    init(): void {
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
            logError('FavoritesEvents.init', error as Error);
        }
    },

    /**
     * Setup DOM-based event listeners
     */
    setupDOMEventListeners(): void {
        const favoritesList = getElement(FAVORITES_CONFIG.ELEMENTS.FAVORITES_LIST);
        if (favoritesList) {
            this.addEventListener(favoritesList, 'click', this.handleFavoritesListClick.bind(this) as EventListener);
        }
    },

    /**
     * Setup custom event listeners
     */
    setupCustomEventListeners(): void {
        this.addEventListener(document, FAVORITES_EVENTS.LOCALE_CHANGED, this.handleLocaleChange.bind(this) as EventListener);
        this.addEventListener(window, FAVORITES_EVENTS.LANGUAGE_CHANGED, this.handleLanguageChange.bind(this) as EventListener);
    },

    /**
     * Add event listener with tracking for cleanup
     * @param {EventTarget} target - The event target
     * @param {string} event - The event type
     * @param {EventListenerOrEventListenerObject} handler - The event handler
     * @param {AddEventListenerOptions | boolean} options - Event listener options
     */
    addEventListener(
        target: EventTarget, 
        event: string, 
        handler: EventListenerOrEventListenerObject, 
        options: AddEventListenerOptions | boolean = {}
    ): void {
        if (!target || !event || !handler) {
            console.warn('addEventListener: Invalid parameters provided');
            return;
        }

        try {
            target.addEventListener(event, handler, options);
            const handlerName = (typeof handler === 'function' && handler.name) ? handler.name : 'anonymous';
            const key = `${target.constructor.name}_${event}_${handlerName}`;
            this.eventListeners.set(key, { target, event, handler, options });
        } catch (error) {
            logError('addEventListener', error as Error, { event, target });
        }
    },

    /**
     * Remove event listener
     * @param {EventTarget} target - The event target
     * @param {string} event - The event type
     * @param {EventListenerOrEventListenerObject} handler - The event handler
     */
    removeEventListener(
        target: EventTarget, 
        event: string, 
        handler: EventListenerOrEventListenerObject
    ): void {
        if (!target || !event || !handler) {
            console.warn('removeEventListener: Invalid parameters provided');
            return;
        }

        try {
            target.removeEventListener(event, handler);
            const handlerName = (typeof handler === 'function' && handler.name) ? handler.name : 'anonymous';
            const key = `${target.constructor.name}_${event}_${handlerName}`;
            this.eventListeners.delete(key);
        } catch (error) {
            logError('removeEventListener', error as Error, { event, target });
        }
    },

    /**
     * Handle clicks on the favorites list
     * @param {Event} event - The click event
     */
    handleFavoritesListClick(event: Event): void {
        console.log('Favorites list clicked:', event.target);
    },

    /**
     * Handle locale change events
     * @param {CustomEvent} event - The locale change event
     */
    handleLocaleChange(event: CustomEvent): void {
        console.log('Locale changed:', event.detail);
    },

    /**
     * Handle language change events
     * @param {CustomEvent} event - The language change event
     */
    handleLanguageChange(event: CustomEvent): void {
        console.log('Language changed:', event.detail);
    },

    /**
     * Dispatch a custom event
     * @param {string} eventName - The event name
     * @param {any} detail - Event detail data
     * @param {EventTarget} target - Event target (defaults to document)
     */
    dispatchEvent(eventName: string, detail: any = null, target: EventTarget = document): void {
        try {
            const customEvent = new CustomEvent(eventName, { detail });
            target.dispatchEvent(customEvent);
        } catch (error) {
            logError('dispatchEvent', error as Error, { eventName, detail });
        }
    },

    /**
     * Clean up all event listeners
     */
    cleanup(): void {
        try {
            for (const [key, { target, event, handler }] of this.eventListeners) {
                try {
                    target.removeEventListener(event, handler);
                } catch (error) {
                    console.warn(`Failed to remove event listener ${key}:`, error);
                }
            }
            this.eventListeners.clear();
            this.isInitialized = false;
            console.log('FavoritesEvents cleanup completed');
        } catch (error) {
            logError('FavoritesEvents.cleanup', error as Error);
        }
    },

    /**
     * Get the number of active event listeners
     * @returns {number} Number of active listeners
     */
    getActiveListenersCount(): number {
        return this.eventListeners.size;
    },

    /**
     * Check if events are initialized
     * @returns {boolean} True if initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
};
