/**
 * Utility helper functions for the application
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DECIMAL_PRECISION_POSITION = 3; // Precision for positions (X/Y)

// -----------------------------------------------------------------------------
// Number formatting and validation
// -----------------------------------------------------------------------------

/**
 * Format a number to a specified number of decimal places
 * @param {number} value - The value to format
 * @param {number} decimalPlaces - The number of decimal places (default: 1)
 * @returns {string} - The formatted value as a string
 */
function formatNumber(value, decimalPlaces = 1) {
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
}

/**
 * Check if a value is a valid number within specified range
 * @param {any} value - The value to check
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {boolean} - True if the value is a valid number in range
 */
function isValidNumber(value, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= min && num <= max;
}

/**
 * Safely parse a float value with fallback
 * @param {any} value - The value to parse
 * @param {number} fallback - The fallback value if parsing fails
 * @returns {number} - The parsed number or fallback
 */
function parseFloatSafe(value, fallback = 0) {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

// -----------------------------------------------------------------------------
// Math utilities
// -----------------------------------------------------------------------------

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - The clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculate ratio from width and height
 * @param {number} width - The width value
 * @param {number} height - The height value
 * @returns {number} - The calculated ratio (width/height)
 */
function calculateRatio(width, height) {
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
}

// -----------------------------------------------------------------------------
// Unit conversion
// -----------------------------------------------------------------------------

/**
 * Convert millimeters to pixels based on the scaling factor 
 * @param {number} mm - The value in millimeters
 * @param {number} scale - The scaling factor
 * @returns {number} - The value in pixels
 */
function mmToPx(mm, scale) {
    if (typeof mm !== 'number') {
        mm = parseFloat(mm);
    }
    
    if (isNaN(mm) || scale <= 0) {
        return 0;
    }
    
    return mm * scale;
}

/**
 * Convert pixels to millimeters based on the scaling factor
 * @param {number} px - The value in pixels
 * @param {number} scale - The scaling factor
 * @returns {number} - The value in millimeters
 */
function pxToMm(px, scale) {
    if (typeof px !== 'number') {
        px = parseFloat(px);
    }
    
    if (isNaN(px) || scale <= 0) {
        return 0;
    }
    
    return px / scale;
}

// -----------------------------------------------------------------------------
// Performance utilities
// -----------------------------------------------------------------------------

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The throttled function
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    };
}

/**
 * Debounce function to delay execution until after a period of inactivity
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// -----------------------------------------------------------------------------
// Exports - Add to window object for global access
// -----------------------------------------------------------------------------
const Utils = {
    // Constants
    DECIMAL_PRECISION_POSITION,
    
    // Number formatting and validation
    formatNumber,
    isValidNumber,
    parseFloatSafe,
    
    // Math utilities
    clamp,
    calculateRatio,
    
    // Unit conversion
    mmToPx,
    pxToMm,
    
    // Performance utilities
    throttle,
    debounce
};

// Export to global scope for backward compatibility
window.throttle = throttle;
window.clamp = clamp;
window.formatNumber = formatNumber;
window.mmToPx = mmToPx;
window.pxToMm = pxToMm;
window.calculateRatio = calculateRatio;
window.debounce = debounce;
window.isValidNumber = isValidNumber;
window.parseFloatSafe = parseFloatSafe;
window.DECIMAL_PRECISION_POSITION = DECIMAL_PRECISION_POSITION;

// Export as namespace
window.Utils = Utils;