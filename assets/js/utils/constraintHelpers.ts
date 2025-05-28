/**
 * Utility functions for handling constraints on area dimensions and position
 */

import { isValidNumber, clamp } from './number-utils';

// Minimum thresholds for the dimensions of the active area
const MIN_AREA_DIMENSION = 10; // mm

interface Offset {
    x: number;
    y: number;
}

interface TabletDimensions {
    width: number;
    height: number;
}

interface AreaState {
    areaWidth: number;
    areaHeight: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Constrains the area offset to keep the area within tablet boundaries
 */
export function constrainAreaOffset(
    offsetX: number, 
    offsetY: number, 
    areaWidth: number, 
    areaHeight: number, 
    tabletWidth: number, 
    tabletHeight: number
): Offset {
    if (!isValidNumber(offsetX) || !isValidNumber(offsetY) ||
        !isValidNumber(areaWidth) || !isValidNumber(areaHeight) ||
        !isValidNumber(tabletWidth) || !isValidNumber(tabletHeight)) {
        console.warn('Invalid parameters passed to constrainAreaOffset', {
            offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight
        });
        return { x: offsetX || 0, y: offsetY || 0 }; 
    }
    
    const halfAreaWidth = areaWidth / 2;
    const halfAreaHeight = areaHeight / 2;
    
    const minX = halfAreaWidth;
    const maxX = tabletWidth - halfAreaWidth;
    
    const minY = halfAreaHeight;
    const maxY = tabletHeight - halfAreaHeight;
    
    const constrainedX = minX > maxX ? tabletWidth / 2 : clamp(offsetX, minX, maxX);
    const constrainedY = minY > maxY ? tabletHeight / 2 : clamp(offsetY, minY, maxY);
    
    return { x: constrainedX, y: constrainedY };
}

/**
 * Adapts the current area dimensions and position to a new tablet
 */
export function adaptAreaToNewTablet(
    currentState: AreaState, 
    oldTablet: TabletDimensions, 
    newTablet: TabletDimensions
): AreaState {
    const { areaWidth, areaHeight, offsetX, offsetY } = currentState;
    
    const logData = {
        "Zone active": { largeur: areaWidth, hauteur: areaHeight },
        "Nouvelle tablette": { largeur: newTablet.width, hauteur: newTablet.height },
        "Dimensions conservées": areaWidth <= newTablet.width && areaHeight <= newTablet.height
    };
    console.log("adaptAreaToNewTablet - Comparaison dimensions:", logData);
    
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
    
    const widthRatio = newTablet.width / oldTablet.width;
    const heightRatio = newTablet.height / oldTablet.height;
    
    const newAreaWidth = Math.min(areaWidth * widthRatio, newTablet.width);
    const newAreaHeight = Math.min(areaHeight * heightRatio, newTablet.height);
    
    const relativeX = offsetX / oldTablet.width;
    const relativeY = offsetY / oldTablet.height;
    
    const newOffsetX = relativeX * newTablet.width;
    const newOffsetY = relativeY * newTablet.height;
    
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

export const ConstraintUtils = {
    MIN_AREA_DIMENSION,
    constrainAreaOffset,
    adaptAreaToNewTablet
};

(window as any).ConstraintUtils = ConstraintUtils;
