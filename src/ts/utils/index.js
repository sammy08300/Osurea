/**
 * Consolidated Utilities Module
 * Combines all utility functions in a structured namespace
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DECIMAL_PRECISION_POSITION = 3; // Precision for positions (X/Y)

// -----------------------------------------------------------------------------
// DOM Utilities
// -----------------------------------------------------------------------------
const DOM = {
    /**
     * Get element by ID with type checking
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} The element or null if not found
     */
    getElement(id) {
        return document.getElementById(id);
    },
    
    /**
     * Create element with optional attributes and content
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement} content - Element content
     * @returns {HTMLElement} Created element
     */
    createElement(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
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
     * Create a debounced function that delays invoking func until after wait milliseconds
     * @param {Function} func - The function to debounce
     * @param {number} wait - The number of milliseconds to delay
     * @returns {Function} The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Create a throttled function that only invokes func at most once per every wait milliseconds
     * @param {Function} func - The function to throttle
     * @param {number} wait - The number of milliseconds to throttle
     * @returns {Function} The throttled function
     */
    throttle(func, wait) {
        let lastCall = 0;
        return function executedFunction(...args) {
            const now = Date.now();
            if (now - lastCall >= wait) {
                func.apply(this, args);
                lastCall = now;
            }
        };
    },
    
    /**
     * Add a visual ripple effect to a button click
     * @param {HTMLElement} element - The element to add the ripple to
     * @param {Object} event - The click event
     */
    addRippleEffect(element, event) {
        const ripple = this.createElement('div', {
            className: 'bg-gray-700/30 absolute rounded-full pointer-events-none',
            style: {
                width: '20px',
                height: '20px',
                left: (event.offsetX - 10) + 'px',
                top: (event.offsetY - 10) + 'px',
                transform: 'scale(0)',
                transition: 'transform 0.6s, opacity 0.6s'
            }
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
     * Copy text to clipboard with success/error notifications
     * @param {string} text - Text to copy
     * @param {string} successMessage - Success notification message key
     * @param {string} errorMessage - Error notification message key
     */
    copyToClipboard(text, successMessage = 'copied_info', errorMessage = 'copy_error') {
        navigator.clipboard.writeText(text)
            .then(() => {
                if (typeof Notifications !== 'undefined') {
                    Notifications.success(successMessage);
                }
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                if (typeof Notifications !== 'undefined') {
                    Notifications.error(errorMessage);
                }
            });
    }
};

// -----------------------------------------------------------------------------
// Number Utilities
// -----------------------------------------------------------------------------
const Numbers = {
    /**
     * Safely parse a float value with fallback
     * @param {any} value - The value to parse
     * @param {number} fallback - The fallback value if parsing fails
     * @returns {number} The parsed number or fallback
     */
    parseFloatSafe(value, fallback = 0) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        
        const parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    },
    
    /**
     * Format a number with the specified decimal places
     * @param {number} value - The number to format
     * @param {number} decimalPlaces - Number of decimal places (default: 1)
     * @returns {string} The formatted number
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
     * Check if a value is a valid number within specified range
     * @param {any} value - The value to check
     * @param {number} min - The minimum allowed value
     * @param {number} max - The maximum allowed value
     * @returns {boolean} True if the value is a valid number in range
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
     * @returns {number} The clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * Calculate ratio from width and height
     * @param {number} width - The width value
     * @param {number} height - The height value
     * @returns {number} The calculated ratio (width/height)
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
     * Memoized version of calculateRatio for performance optimization
     */
    calculateRatioMemoized: null, // Will be initialized below
    
    /**
     * Convert millimeters to pixels based on the scaling factor 
     * @param {number} mm - The value in millimeters
     * @param {number} scale - The scaling factor
     * @returns {number} The value in pixels
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
     * @returns {number} The value in millimeters
     */
    pxToMm(px, scale) {
        if (typeof px !== 'number') {
            px = parseFloat(px);
        }
        
        if (isNaN(px) || scale <= 0) {
            return 0;
        }
        
        return px / scale;
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
// Performance Utilities
// -----------------------------------------------------------------------------
const Performance = {
    /**
     * Memoize function results to improve performance
     * @param {Function} fn - Function to memoize
     * @param {Function} keyGenerator - Optional key generator function
     * @param {number} maxCacheSize - Maximum cache size (default: 1000)
     * @returns {Function} Memoized function
     */
    memoize(fn, keyGenerator = (...args) => JSON.stringify(args), maxCacheSize = 1000) {
        const cache = new Map();
        
        return function(...args) {
            const key = keyGenerator(...args);
            
            if (cache.has(key)) {
                // Move to end (LRU behavior)
                const value = cache.get(key);
                cache.delete(key);
                cache.set(key, value);
                return value;
            }
            
            const result = fn.apply(this, args);
            
            // Implement LRU cache eviction
            if (cache.size >= maxCacheSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            
            cache.set(key, result);
            return result;
        };
    },

    /**
     * Create a memoized version of calculateRatio with optimized key generation
     * @returns {Function} Memoized calculateRatio function
     */
    createMemoizedCalculateRatio() {
        return this.memoize(
            Numbers.calculateRatio,
            (width, height) => `${width}:${height}`, // Simple string key for better performance
            500 // Smaller cache for ratio calculations
        );
    },
    
    /**
     * Request idle callback with fallback
     * @param {Function} callback - Callback to execute
     * @param {Object} options - Options for requestIdleCallback
     */
    requestIdleCallback(callback, options = {}) {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, options);
        } else {
            return setTimeout(callback, 0);
        }
    },
    
    /**
     * Cancel idle callback with fallback
     * @param {number} id - ID returned by requestIdleCallback
     */
    cancelIdleCallback(id) {
        if (window.cancelIdleCallback) {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    }
};

// Initialize memoized functions
Numbers.calculateRatioMemoized = Performance.createMemoizedCalculateRatio();

// -----------------------------------------------------------------------------
// Main Utils Export
// -----------------------------------------------------------------------------
export const Utils = {
    // Constants
    DECIMAL_PRECISION_POSITION,
    
    // Namespaced utilities
    DOM,
    Numbers,
    Performance,
    
    // Legacy compatibility - direct access to commonly used functions
    debounce: DOM.debounce,
    throttle: DOM.throttle,
    clamp: Numbers.clamp,
    formatNumber: Numbers.formatNumber,
    parseFloatSafe: Numbers.parseFloatSafe,
    isValidNumber: Numbers.isValidNumber,
    mmToPx: Numbers.mmToPx,
    pxToMm: Numbers.pxToMm,
    calculateRatio: Numbers.calculateRatio,
    calculateRatioMemoized: Numbers.calculateRatioMemoized,
    constrainAreaOffset: Numbers.constrainAreaOffset,
    memoize: Performance.memoize
};

// Export individual namespaces for convenience
export { DOM, Numbers, Performance };

// Global exports for backward compatibility
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.throttle = DOM.throttle;
    window.debounce = DOM.debounce;
    window.clamp = Numbers.clamp;
    window.formatNumber = Numbers.formatNumber;
    window.mmToPx = Numbers.mmToPx;
    window.pxToMm = Numbers.pxToMm;
    window.calculateRatio = Numbers.calculateRatio;
    window.calculateRatioMemoized = Numbers.calculateRatioMemoized;
    window.isValidNumber = Numbers.isValidNumber;
    window.parseFloatSafe = Numbers.parseFloatSafe;
    window.constrainAreaOffset = Numbers.constrainAreaOffset;
    window.DECIMAL_PRECISION_POSITION = DECIMAL_PRECISION_POSITION;
} 
