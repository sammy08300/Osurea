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
            return func.apply(this, args);
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
    return value < min ? min : value > max ? max : value;
}

/**
 * Format a number to a specific number of decimal places
 * @param {number} value - The number to format
 * @param {number} decimalPlaces - The number of decimal places to show
 * @returns {string} - The formatted number as a string
 */
function formatNumber(value, decimalPlaces = 1) {
    if (isNaN(value)) return "N/A";
    
    // Optimisation: utiliser une puissance pour arrondir au lieu de toFixed
    const factor = 10 ** decimalPlaces;
    return (Math.round(value * factor) / factor).toFixed(decimalPlaces);
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

// Mise en cache pour améliorer les performances des calculs de ratio
const ratioCache = new Map();

/**
 * Calculate the aspect ratio (width/height) as a formatted string
 * @param {number} width - The width value
 * @param {number} height - The height value
 * @returns {string} - The formatted ratio string
 */
function calculateRatio(width, height) {
    if (height <= 0 || isNaN(height) || isNaN(width)) return "N/A";
    
    // Utilisation d'un cache pour éviter des calculs répétés
    const cacheKey = `${width}-${height}`;
    if (ratioCache.has(cacheKey)) {
        return ratioCache.get(cacheKey);
    }
    
    const ratio = width / height;
    const result = ratio.toFixed(3);
    
    // Limiter la taille du cache pour éviter les fuites mémoire
    if (ratioCache.size > 100) {
        // Supprimer la première entrée (la plus ancienne) si cache trop grand
        const firstKey = ratioCache.keys().next().value;
        ratioCache.delete(firstKey);
    }
    
    ratioCache.set(cacheKey, result);
    return result;
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
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
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
    if (typeof value !== 'number') {
        value = parseFloat(value);
    }
    return !isNaN(value) && value >= min && value <= max;
}

/**
 * Safely parse a float value, returning fallback if invalid
 * @param {string|number} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} - The parsed number or fallback
 */
function parseFloatSafe(value, fallback = 0) {
    // Optimisation: vérifier si la valeur est déjà un nombre
    if (typeof value === 'number') return value;
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}
