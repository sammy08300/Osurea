/**
 * Utility helper functions for the application
 */

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
        if (now - lastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        }
    };
}

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - The clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format a number to a specific number of decimal places
 * @param {number} value - The number to format
 * @param {number} decimalPlaces - The number of decimal places to show
 * @returns {string} - The formatted number as a string
 */
function formatNumber(value, decimalPlaces = 1) {
    if (isNaN(value)) return "N/A";
    return value.toFixed(decimalPlaces);
}

/**
 * Convert millimeters to pixels using the provided scale
 * @param {number} mm - Value in millimeters
 * @param {number} scale - Scale factor (pixels per millimeter)
 * @returns {number} - Value in pixels
 */
function mmToPx(mm, scale) {
    return mm * scale;
}

/**
 * Convert pixels to millimeters using the provided scale
 * @param {number} px - Value in pixels
 * @param {number} scale - Scale factor (pixels per millimeter)
 * @returns {number} - Value in millimeters
 */
function pxToMm(px, scale) {
    return px / scale;
}

/**
 * Calculate the aspect ratio (width/height) as a formatted string
 * @param {number} width - The width value
 * @param {number} height - The height value
 * @returns {string} - The formatted ratio string
 */
function calculateRatio(width, height) {
    if (height <= 0 || isNaN(height) || isNaN(width)) return "N/A";
    const ratio = width / height;
    return ratio.toFixed(3);
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

/**
 * Check if a value is a valid number within a range
 * @param {number} value - The value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} - True if valid
 */
function isValidNumber(value, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Safely parse a float value, returning fallback if invalid
 * @param {string|number} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} - The parsed number or fallback
 */
function parseFloatSafe(value, fallback = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}
