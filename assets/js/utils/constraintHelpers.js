/**
 * Utility functions for handling constraints on area dimensions and position
 */

// Minimum thresholds for the dimensions of the active area
const MIN_AREA_DIMENSION = 10; // mm

/**
 * Constraint utilities module
 * These functions ensure that the dimensions and position of the active area
 * remain within acceptable limits relative to the dimensions of the tablet.
 */

/**
 * Constrains the area offset to keep the area within tablet boundaries
 * 
 * @param {number} offsetX - The X offset of the area (center position)
 * @param {number} offsetY - The Y offset of the area (center position)
 * @param {number} areaWidth - The width of the area in mm
 * @param {number} areaHeight - The height of the area in mm
 * @param {number} tabletWidth - The width of the tablet in mm
 * @param {number} tabletHeight - The height of the tablet in mm
 * @returns {Object} - The constrained X and Y offsets
 */
function constrainAreaOffset(offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight) {
    if (!isValidNumber(offsetX) || !isValidNumber(offsetY) ||
        !isValidNumber(areaWidth) || !isValidNumber(areaHeight) ||
        !isValidNumber(tabletWidth) || !isValidNumber(tabletHeight)) {
        console.warn('Invalid parameters passed to constrainAreaOffset', {
            offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight
        });
        return { x: 0, y: 0 };
    }
    
    // Calculate the movement limits to keep the active area entirely 
    // within the tablet boundaries
    const halfAreaWidth = areaWidth / 2;
    const halfAreaHeight = areaHeight / 2;
    
    // Limits for the X offset (center position of the area)
    const minX = halfAreaWidth;
    const maxX = tabletWidth - halfAreaWidth;
    
    // Limits for the Y offset (center position of the area)
    const minY = halfAreaHeight;
    const maxY = tabletHeight - halfAreaHeight;
    
    // If tablet dimensions are too small for the area, center it
    const constrainedX = minX > maxX ? tabletWidth / 2 : clamp(offsetX, minX, maxX);
    const constrainedY = minY > maxY ? tabletHeight / 2 : clamp(offsetY, minY, maxY);
    
    return { x: constrainedX, y: constrainedY };
}

/**
 * Adapts the current area dimensions and position to a new tablet
 * 
 * @param {Object} currentState - The current state with area dimensions and position
 * @param {Object} oldTablet - The old tablet dimensions
 * @param {Object} newTablet - The new tablet dimensions
 * @returns {Object} - The adapted area dimensions and position
 */
function adaptAreaToNewTablet(currentState, oldTablet, newTablet) {
    // Get the current dimensions and position
    const { areaWidth, areaHeight, offsetX, offsetY } = currentState;
    
    const logData = {
        "Zone active": { largeur: areaWidth, hauteur: areaHeight },
        "Nouvelle tablette": { largeur: newTablet.width, hauteur: newTablet.height },
        "Dimensions conservées": areaWidth <= newTablet.width && areaHeight <= newTablet.height
    };
    console.log("adaptAreaToNewTablet - Comparaison dimensions:", logData);
    
    // If the active area is already smaller than the new tablet, only adjust position
    if (areaWidth <= newTablet.width && areaHeight <= newTablet.height) {
        const constrainedOffsets = constrainAreaOffset(
            offsetX, offsetY, 
            areaWidth, areaHeight, 
            newTablet.width, newTablet.height
        );
        
        console.log("Zone active conservée, seule la position est ajustée:", {
            anciennePosition: { x: offsetX, y: offsetY },
            nouvellePosition: { x: constrainedOffsets.x, y: constrainedOffsets.y }
        });
        
        return {
            areaWidth,
            areaHeight,
            offsetX: constrainedOffsets.x,
            offsetY: constrainedOffsets.y
        };
    }
    
    // Calculate the scaling ratios for dimension adaptation
    const widthRatio = newTablet.width / oldTablet.width;
    const heightRatio = newTablet.height / oldTablet.height;
    
    // Adapt the dimensions of the area according to the new ratios
    // while keeping the same coverage percentage
    const newAreaWidth = Math.min(areaWidth * widthRatio, newTablet.width);
    const newAreaHeight = Math.min(areaHeight * heightRatio, newTablet.height);
    
    // Adapt the position while keeping the same relative placement
    const relativeX = offsetX / oldTablet.width;
    const relativeY = offsetY / oldTablet.height;
    
    const newOffsetX = relativeX * newTablet.width;
    const newOffsetY = relativeY * newTablet.height;
    
    // Constrain the new position to ensure that the area remains within the limits
    const constrainedOffsets = constrainAreaOffset(
        newOffsetX, newOffsetY, 
        newAreaWidth, newAreaHeight, 
        newTablet.width, newTablet.height
    );
    
    console.log("Zone active redimensionnée:", {
        anciennesDimensions: { largeur: areaWidth, hauteur: areaHeight },
        nouvellesDimensions: { largeur: newAreaWidth, hauteur: newAreaHeight },
        anciennePosition: { x: offsetX, y: offsetY },
        nouvellePosition: { x: constrainedOffsets.x, y: constrainedOffsets.y }
    });
    
    return {
        areaWidth: newAreaWidth,
        areaHeight: newAreaHeight,
        offsetX: constrainedOffsets.x,
        offsetY: constrainedOffsets.y
    };
}

// Create a namespace for constraint utilities
const ConstraintUtils = {
    MIN_AREA_DIMENSION,
    constrainAreaOffset,
    adaptAreaToNewTablet
};

// Export the namespace to window for use in other modules
window.ConstraintUtils = ConstraintUtils; 