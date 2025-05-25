/**
 * Number utilities for formatting and parsing
 */
export const NumberUtils = {
    /**
     * Safely parse a float value with fallback to 0
     * @param {string|number} value - The value to parse
     * @returns {number} The parsed float or 0 if invalid
     */
    parseFloatSafe(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    },
    
    /**
     * Format a number with the specified decimal places
     * @param {number} value - The number to format
     * @param {number} [decimalPlaces=2] - Number of decimal places
     * @returns {string} The formatted number
     */
    formatNumber(value, decimalPlaces = 2) {
        if (isNaN(value)) return '0';
        return value.toFixed(decimalPlaces);
    },
    
    /**
     * Check if a value is a valid number
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a valid number
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
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
