/**
 * Number utilities for formatting and parsing
 */

interface Offset {
    x: number;
    y: number;
}

export const NumberUtils = {
    parseFloatSafe(value: string | number | undefined | null): number {
        if (value === null || value === undefined || value === '') { // Explicitly check for empty string
            return 0;
        }
        const parsed = parseFloat(value as string); 
        return isNaN(parsed) ? 0 : parsed;
    },
    
    formatNumber(value: number | string, decimalPlaces: number = 2): string {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '0'; 
        return numValue.toFixed(decimalPlaces);
    },
    
    isValidNumber(value: any): value is number { // Type predicate
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    },
    
    constrainAreaOffset(
        offsetX: number, 
        offsetY: number, 
        areaWidth: number, 
        areaHeight: number, 
        tabletWidth: number, 
        tabletHeight: number
    ): Offset {
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        const minX = halfWidth;
        const maxX = tabletWidth - halfWidth;
        const minY = halfHeight;
        const maxY = tabletHeight - halfHeight;
        
        // Ensure clamp is called correctly (it's part of this object)
        const x = NumberUtils.clamp(offsetX, minX, maxX); 
        const y = NumberUtils.clamp(offsetY, minY, maxY);
        
        return { x, y };
    }
};

// Export individual functions for direct import if needed
export const parseFloatSafe = NumberUtils.parseFloatSafe;
export const formatNumber = NumberUtils.formatNumber;
export const isValidNumber = NumberUtils.isValidNumber;
export const clamp = NumberUtils.clamp;
export const constrainAreaOffset = NumberUtils.constrainAreaOffset;
