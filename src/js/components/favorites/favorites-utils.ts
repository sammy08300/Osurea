/**
 * Favorites Utilities Module
 * Common utility functions for the favorites component
 */

import { FAVORITES_CONFIG } from './favorites-config.js';
import { translateWithFallback } from '../../../js/i18n-init.js';
import localeManager from '../../../locales/index.js'; // Assuming localeManager has types or is any
import { FavoriteObject, NotificationType } from './types.js'; // Import types

// Define types for global objects if not already typed elsewhere
declare global {
    interface Window {
        Notifications?: { // Assuming Notifications might exist on window
            [key: string]: (message: string) => void; // General signature for notification types
        };
        [key: string]: any; // For safeCall window[func]
    }
}


/**
 * Format a number with specified decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default from config)
 * @returns {string} Formatted number string
 */
export function formatNumber(value: number, decimals: number = FAVORITES_CONFIG.FORMATTING.DEFAULT_DECIMALS): string {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toFixed(decimals);
}

/**
 * Get DOM element by ID with error handling
 * @param {string} elementId - The element ID
 * @param {boolean} required - Whether the element is required (throws error if not found)
 * @returns {HTMLElement | null} The DOM element or null
 */
export function getElement(elementId: string, required: boolean = false): HTMLElement | null {
    const element = document.getElementById(elementId);
    if (required && !element) {
        throw new Error(`Required element with ID '${elementId}' not found`);
    }
    return element;
}

/**
 * Get multiple DOM elements by their IDs
 * @param {string[]} elementIds - Array of element IDs
 * @param {boolean} required - Whether all elements are required
 * @returns {{ [id: string]: HTMLElement | null }} Object with element IDs as keys and elements as values
 */
export function getElements(elementIds: string[], required: boolean = false): { [id: string]: HTMLElement | null } {
    const elements: { [id: string]: HTMLElement | null } = {};
    elementIds.forEach(id => {
        elements[id] = getElement(id, required);
    });
    return elements;
}

/**
 * Show notification with fallback
 * @param {NotificationType} type - Notification type ('success', 'error', 'info')
 * @param {string} messageKey - Translation key for the message
 * @param {string} fallbackMessage - Fallback message if translation fails
 */
export function showNotification(type: NotificationType, messageKey: string, fallbackMessage: string): void {
    if (window.Notifications && typeof window.Notifications[type] === 'function') {
        const message = translateWithFallback(messageKey, fallbackMessage);
        window.Notifications[type](message);
    } else {
        console.warn(`Notification type "${type}" not found or Notifications object unavailable.`);
    }
}

/**
 * Apply translation to an element
 * @param {HTMLElement} element - The element to translate
 * @param {string} translationKey - The translation key
 * @param {string} fallback - Fallback text
 */
export function applyTranslation(element: HTMLElement | null, translationKey: string, fallback: string = ''): void {
    if (!element) return;
    
    const translatedText = translateWithFallback(translationKey, fallback);
    if (element.textContent !== translatedText) {
        element.textContent = translatedText;
    }

    // Fallback to direct translation if localeManager or applyTranslations not available
    // Check if localeManager and specific method exist
    if (typeof localeManager !== 'undefined' && localeManager !== null) {
        if (typeof localeManager.updatePageTranslations === 'function') { // Changed from applyTranslations
            localeManager.updatePageTranslations(); // Changed from applyTranslations
        } else if (typeof (localeManager as any).translate === 'function' && typeof (localeManager as any).updatePageTranslations === 'function') {
            // Attempt to call updatePageTranslations if translate exists as a fallback logic
            (localeManager as any).updatePageTranslations();
        }
    }
}

/**
 * Add CSS class with existence check
 * @param {HTMLElement | null} element - The element
 * @param {string} className - The CSS class to add
 */
export function addClass(element: HTMLElement | null, className: string): void {
    if (element && !element.classList.contains(className)) {
        element.classList.add(className);
    }
}

/**
 * Remove CSS class with existence check
 * @param {HTMLElement | null} element - The element
 * @param {string} className - The CSS class to remove
 */
export function removeClass(element: HTMLElement | null, className: string): void {
    if (element && element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

/**
 * Toggle CSS class
 * @param {HTMLElement | null} element - The element
 * @param {string} className - The CSS class to toggle
 * @param {boolean | undefined} force - Force add (true) or remove (false)
 */
export function toggleClass(element: HTMLElement | null, className: string, force?: boolean): void {
    if (element) {
        element.classList.toggle(className, force);
    }
}

/**
 * Create a delay using Promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function execution
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {T} Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>): void {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as T;
}

/**
 * Check if a value is a translation key (starts with 'i18n:')
 * @param {string} value - The value to check
 * @returns {boolean} True if it's a translation key
 */
export function isTranslationKey(value: string): boolean {
    return typeof value === 'string' && value.startsWith('i18n:');
}

/**
 * Extract translation key from a value
 * @param {string} value - The value containing the translation key
 * @returns {string} The translation key without the 'i18n:' prefix
 */
export function extractTranslationKey(value: string): string {
    return isTranslationKey(value) ? value.substring(5) : value;
}

/**
 * Safely call a function if it exists
 * @param {Function | string | undefined} func - Function or function name
 * @param {...any[]} args - Arguments to pass to the function
 * @returns {any} Function result or undefined
 */
export function safeCall(func: ((...args: any[]) => any) | string | undefined, ...args: any[]): any {
    try {
        if (typeof func === 'function') {
            return func(...args);
        } else if (typeof func === 'string' && typeof window[func] === 'function') {
            return window[func](...args);
        }
    } catch (error) {
        console.warn(`Error calling function ${String(func)}:`, error);
    }
    return undefined;
}

/**
 * Log error with context
 * @param {string} context - Context where the error occurred
 * @param {Error | string} error - The error to log
 * @param {any} additionalData - Additional data to log
 */
export function logError(context: string, error: Error | string, additionalData: any = null): void {
    console.error(`[FAVORITES ERROR] ${context}:`, error);
    if (additionalData) {
        console.error('Additional data:', additionalData);
    }
}

/**
 * Validate favorite object structure
 * @param {any} favorite - The favorite object to validate
 * @returns {favorite is FavoriteObject} True if valid, acts as a type guard
 */
export function validateFavorite(favorite: any): favorite is FavoriteObject {
    if (!favorite || typeof favorite !== 'object') return false;
    
    const requiredNumericFields = ['width', 'height']; // x and y can be offsetX/Y
    const hasRequiredFields = requiredNumericFields.every(field => 
        favorite.hasOwnProperty(field) && 
        typeof favorite[field] === 'number' && 
        !isNaN(favorite[field])
    );
    if (!hasRequiredFields) return false;

    // Check for x/offsetX and y/offsetY
    const hasX = favorite.hasOwnProperty('x') && typeof favorite.x === 'number' && !isNaN(favorite.x);
    const hasOffsetX = favorite.hasOwnProperty('offsetX') && typeof favorite.offsetX === 'number' && !isNaN(favorite.offsetX);
    const hasY = favorite.hasOwnProperty('y') && typeof favorite.y === 'number' && !isNaN(favorite.y);
    const hasOffsetY = favorite.hasOwnProperty('offsetY') && typeof favorite.offsetY === 'number' && !isNaN(favorite.offsetY);

    if (! (hasX || hasOffsetX) ) return false;
    if (! (hasY || hasOffsetY) ) return false;

    if (favorite.hasOwnProperty('ratio') && (typeof favorite.ratio !== 'number' || isNaN(favorite.ratio))) return false;
    if (favorite.hasOwnProperty('radius') && (typeof favorite.radius !== 'number' || isNaN(favorite.radius))) return false;
    if (favorite.hasOwnProperty('title') && typeof favorite.title !== 'string') return false;
    if (favorite.hasOwnProperty('description') && typeof favorite.description !== 'string') return false;
    
    return true;
}