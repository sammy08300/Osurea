/**
 * Consolidated Utilities Module
 * Combines all utility functions from helpers.js, dom-utils.js, and number-utils.js
 * Eliminates duplications and provides a clean, structured API
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DECIMAL_PRECISION_POSITION = 3;

// -----------------------------------------------------------------------------
// Number Utilities
// -----------------------------------------------------------------------------
export const NumberUtils = {
    /**
     * Format a number to a specified number of decimal places
     * @param {number} value - The value to format
     * @param {number} decimalPlaces - The number of decimal places (default: 1)
     * @returns {string} - The formatted value as a string
     */
    formatNumber(value, decimalPlaces = 1) {
        if (typeof value !== 'number') {
            value = parseFloat(value);
        }
        
        if (isNaN(value)) {
            return '0';
        }
        
        // Optimize for integer numbers
        if (Number.isInteger(value) && decimalPlaces === 0) {
            return value.toString();
        }
        
        return value.toFixed(decimalPlaces);
    },

    /**
     * Safely parse a float value with fallback
     * @param {any} value - The value to parse
     * @param {number} fallback - The fallback value if parsing fails
     * @returns {number} - The parsed number or fallback
     */
    parseFloatSafe(value, fallback = 0) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        
        const parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    },

    /**
     * Check if a value is a valid number within specified range
     * @param {any} value - The value to check
     * @param {number} min - The minimum allowed value
     * @param {number} max - The maximum allowed value
     * @returns {boolean} - True if the value is a valid number in range
     */
    isValidNumber(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num) && num >= min && num <= max;
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - The value to clamp
     * @param {number} min - The minimum value
     * @param {number} max - The maximum value
     * @returns {number} - The clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Calculate ratio from width and height
     * @param {number} width - The width value
     * @param {number} height - The height value
     * @returns {number} - The calculated ratio (width/height)
     */
    calculateRatio(width, height) {
        if (typeof width !== 'number') {
            width = parseFloat(width);
        }
        
        if (typeof height !== 'number') {
            height = parseFloat(height);
        }
        
        if (isNaN(width) || isNaN(height) || height === 0) {
            return 1.0;
        }
        
        return width / height;
    },

    /**
     * Constrain the area offset to keep the area within tablet bounds
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     * @param {number} areaWidth - Area width
     * @param {number} areaHeight - Area height 
     * @param {number} tabletWidth - Tablet width
     * @param {number} tabletHeight - Tablet height
     * @returns {Object} Constrained offsets {x, y}
     */
    constrainAreaOffset(offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight) {
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        // Calculate min and max values for the center point
        const minX = halfWidth;
        const maxX = tabletWidth - halfWidth;
        const minY = halfHeight;
        const maxY = tabletHeight - halfHeight;
        
        // Constrain the center point
        const x = Math.max(minX, Math.min(maxX, offsetX));
        const y = Math.max(minY, Math.min(maxY, offsetY));
        
        return { x, y };
    }
};

// -----------------------------------------------------------------------------
// Unit Conversion Utilities
// -----------------------------------------------------------------------------
export const ConversionUtils = {
    /**
     * Convert millimeters to pixels based on the scaling factor 
     * @param {number} mm - The value in millimeters
     * @param {number} scale - The scaling factor
     * @returns {number} - The value in pixels
     */
    mmToPx(mm, scale) {
        if (typeof mm !== 'number') {
            mm = parseFloat(mm);
        }
        
        if (isNaN(mm) || scale <= 0) {
            return 0;
        }
        
        return mm * scale;
    },

    /**
     * Convert pixels to millimeters based on the scaling factor
     * @param {number} px - The value in pixels
     * @param {number} scale - The scaling factor
     * @returns {number} - The value in millimeters
     */
    pxToMm(px, scale) {
        if (typeof px !== 'number') {
            px = parseFloat(px);
        }
        
        if (isNaN(px) || scale <= 0) {
            return 0;
        }
        
        return px / scale;
    }
};

// -----------------------------------------------------------------------------
// Performance Utilities
// -----------------------------------------------------------------------------
export const PerformanceUtils = {
    /**
     * Debounce function to delay execution until after a period of inactivity
     * @param {Function} func - The function to debounce
     * @param {number} delay - The delay in milliseconds
     * @returns {Function} - The debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },

    /**
     * Throttle function to limit the rate at which a function can fire
     * @param {Function} func - The function to throttle
     * @param {number} delay - The delay in milliseconds
     * @returns {Function} - The throttled function
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                func.apply(this, args);
                lastCall = now;
            }
        };
    },

    /**
     * Memoize function results for performance optimization
     * @param {Function} func - The function to memoize
     * @param {Function} keyGenerator - Optional key generator function
     * @returns {Function} - The memoized function
     */
    memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
        const cache = new Map();
        return function(...args) {
            const key = keyGenerator(...args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    /**
     * Request idle callback with fallback for older browsers
     * @param {Function} callback - The callback to execute
     * @param {Object} options - Options for the idle callback
     */
    requestIdleCallback(callback, options = {}) {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, options);
        } else {
            // Fallback for browsers that don't support requestIdleCallback
            return setTimeout(callback, 1);
        }
    }
};

// -----------------------------------------------------------------------------
// DOM Utilities
// -----------------------------------------------------------------------------
export const DOMUtils = {
    /**
     * Get element by ID with type checking
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} The element or null if not found
     */
    getElement(id) {
        return document.getElementById(id);
    },

    /**
     * Create element with attributes and content
     * @param {string} tagName - Tag name
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement} content - Element content
     * @returns {HTMLElement} The created element
     */
    createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
        
        return element;
    },

    /**
     * Add a visual ripple effect to a button click
     * @param {HTMLElement} element - The element to add the ripple to
     * @param {Object} event - The click event
     */
    addRippleEffect(element, event) {
        const ripple = this.createElement('div', {
            className: 'bg-gray-700/30 absolute rounded-full pointer-events-none',
            style: `
                width: 20px;
                height: 20px;
                left: ${event.offsetX - 10}px;
                top: ${event.offsetY - 10}px;
                transform: scale(0);
                transition: transform 0.6s, opacity 0.6s;
            `
        });
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            setTimeout(() => {
                if (element.contains(ripple)) {
                    element.removeChild(ripple);
                }
            }, 600);
        }, 10);
    },

    /**
     * Copy text to clipboard with promise-based API
     * @param {string} text - Text to copy
     * @returns {Promise} Promise that resolves when text is copied
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            throw error;
        }
    }
};

// -----------------------------------------------------------------------------
// Consolidated Utils Object
// -----------------------------------------------------------------------------
export const Utils = {
    // Constants
    DECIMAL_PRECISION_POSITION,
    
    // Namespaced utilities
    Number: NumberUtils,
    Conversion: ConversionUtils,
    Performance: PerformanceUtils,
    DOM: DOMUtils,
    
    // Legacy compatibility - direct access to commonly used functions
    formatNumber: NumberUtils.formatNumber,
    parseFloatSafe: NumberUtils.parseFloatSafe,
    isValidNumber: NumberUtils.isValidNumber,
    clamp: NumberUtils.clamp,
    calculateRatio: NumberUtils.calculateRatio,
    mmToPx: ConversionUtils.mmToPx,
    pxToMm: ConversionUtils.pxToMm,
    debounce: PerformanceUtils.debounce,
    throttle: PerformanceUtils.throttle,
    memoize: PerformanceUtils.memoize
};

// Export individual utilities for tree-shaking
export { DECIMAL_PRECISION_POSITION };

// Default export
export default Utils; 