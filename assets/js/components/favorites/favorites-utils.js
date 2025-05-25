/**
 * Favorites Utilities Module
 * Common utility functions for the favorites component
 */

import { FAVORITES_CONFIG } from './favorites-config.js';
import { translateWithFallback } from '../../../js/i18n-init.js';
import localeManager from '../../../locales/index.js';

/**
 * Format a number with specified decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default from config)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = FAVORITES_CONFIG.FORMATTING.DEFAULT_DECIMALS) {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toFixed(decimals);
}

/**
 * Get DOM element by ID with error handling
 * @param {string} elementId - The element ID
 * @param {boolean} required - Whether the element is required (throws error if not found)
 * @returns {HTMLElement|null} The DOM element or null
 */
export function getElement(elementId, required = false) {
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
 * @returns {Object} Object with element IDs as keys and elements as values
 */
export function getElements(elementIds, required = false) {
    const elements = {};
    elementIds.forEach(id => {
        elements[id] = getElement(id, required);
    });
    return elements;
}

/**
 * Show notification with fallback
 * @param {string} type - Notification type ('success', 'error', 'info')
 * @param {string} messageKey - Translation key for the message
 * @param {string} fallbackMessage - Fallback message if translation fails
 */
export function showNotification(type, messageKey, fallbackMessage) {
    if (typeof Notifications !== 'undefined' && Notifications[type]) {
        const message = translateWithFallback(messageKey, fallbackMessage);
        Notifications[type](message);
    }
}

/**
 * Apply translation to an element
 * @param {HTMLElement} element - The element to translate
 * @param {string} translationKey - The translation key
 * @param {string} fallback - Fallback text
 */
export function applyTranslation(element, translationKey, fallback = '') {
    if (!element) return;
    
    element.setAttribute('data-i18n', translationKey);
    
    if (typeof localeManager !== 'undefined') {
        if (typeof localeManager.applyTranslations === 'function') {
            localeManager.applyTranslations(element);
        } else if (typeof localeManager.translate === 'function') {
            element.textContent = localeManager.translate(translationKey) || fallback;
        }
    } else {
        element.textContent = translateWithFallback(translationKey, fallback);
    }
}

/**
 * Add CSS class with existence check
 * @param {HTMLElement} element - The element
 * @param {string} className - The CSS class to add
 */
export function addClass(element, className) {
    if (element && !element.classList.contains(className)) {
        element.classList.add(className);
    }
}

/**
 * Remove CSS class with existence check
 * @param {HTMLElement} element - The element
 * @param {string} className - The CSS class to remove
 */
export function removeClass(element, className) {
    if (element && element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

/**
 * Toggle CSS class
 * @param {HTMLElement} element - The element
 * @param {string} className - The CSS class to toggle
 * @param {boolean} force - Force add (true) or remove (false)
 */
export function toggleClass(element, className, force = undefined) {
    if (element) {
        element.classList.toggle(className, force);
    }
}

/**
 * Create a delay using Promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if a value is a translation key (starts with 'i18n:')
 * @param {string} value - The value to check
 * @returns {boolean} True if it's a translation key
 */
export function isTranslationKey(value) {
    return typeof value === 'string' && value.startsWith('i18n:');
}

/**
 * Extract translation key from a value
 * @param {string} value - The value containing the translation key
 * @returns {string} The translation key without the 'i18n:' prefix
 */
export function extractTranslationKey(value) {
    return isTranslationKey(value) ? value.substring(5) : value;
}

/**
 * Safely call a function if it exists
 * @param {Function|string} func - Function or function name
 * @param {...any} args - Arguments to pass to the function
 * @returns {any} Function result or undefined
 */
export function safeCall(func, ...args) {
    try {
        if (typeof func === 'function') {
            return func(...args);
        } else if (typeof func === 'string' && typeof window[func] === 'function') {
            return window[func](...args);
        }
    } catch (error) {
        console.warn(`Error calling function ${func}:`, error);
    }
    return undefined;
}

/**
 * Log error with context
 * @param {string} context - Context where the error occurred
 * @param {Error|string} error - The error to log
 * @param {any} additionalData - Additional data to log
 */
export function logError(context, error, additionalData = null) {
    console.error(`[FAVORITES ERROR] ${context}:`, error);
    if (additionalData) {
        console.error('Additional data:', additionalData);
    }
}

/**
 * Validate favorite object structure
 * @param {Object} favorite - The favorite object to validate
 * @returns {boolean} True if valid
 */
export function validateFavorite(favorite) {
    if (!favorite || typeof favorite !== 'object') return false;
    
    const requiredFields = ['id', 'width', 'height'];
    return requiredFields.every(field => favorite.hasOwnProperty(field));
} 