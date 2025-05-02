/**
 * Utility functions for handling constraints on area dimensions and position
 */

// Seuils minimum pour les dimensions de la zone active
const MIN_AREA_DIMENSION = 10; // mm

/**
 * Constraint utilities module
 * Ces fonctions permettent de s'assurer que les dimensions et position de la zone active
 * restent dans les limites acceptables par rapport aux dimensions de la tablette.
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
    
    let constrainedX = offsetX;
    let constrainedY = offsetY;
    
    // Calculer les limites de déplacement pour garder la zone active entièrement 
    // à l'intérieur de la tablette
    const halfAreaWidth = areaWidth / 2;
    const halfAreaHeight = areaHeight / 2;
    
    // Limites pour l'offset X (position centrale de la zone)
    const minX = halfAreaWidth;
    const maxX = tabletWidth - halfAreaWidth;
    
    // Limites pour l'offset Y (position centrale de la zone)
    const minY = halfAreaHeight;
    const maxY = tabletHeight - halfAreaHeight;
    
    // Appliquer les contraintes (clamping)
    constrainedX = clamp(offsetX, minX, maxX);
    
    // Si la tablette est plus petite que la zone en largeur, centrer horizontalement
    if (minX > maxX) {
        constrainedX = tabletWidth / 2;
    }
    
    constrainedY = clamp(offsetY, minY, maxY);
    
    // Si la tablette est plus petite que la zone en hauteur, centrer verticalement
    if (minY > maxY) {
        constrainedY = tabletHeight / 2;
    }
    
    return {
        x: constrainedX,
        y: constrainedY
    };
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
    // Récupérer les dimensions et position actuelles
    const { areaWidth, areaHeight, offsetX, offsetY } = currentState;
    
    console.log("adaptAreaToNewTablet - Comparaison dimensions:", {
        "Zone active": { largeur: areaWidth, hauteur: areaHeight },
        "Nouvelle tablette": { largeur: newTablet.width, hauteur: newTablet.height },
        "Dimensions conservées": areaWidth <= newTablet.width && areaHeight <= newTablet.height
    });
    
    // Si la zone active est déjà plus petite que la nouvelle tablette, 
    // ne pas changer ses dimensions
    if (areaWidth <= newTablet.width && areaHeight <= newTablet.height) {
        // Seulement recalculer la position pour rester dans les limites
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
            areaWidth: areaWidth,
            areaHeight: areaHeight,
            offsetX: constrainedOffsets.x,
            offsetY: constrainedOffsets.y
        };
    }
    
    // Pour les autres cas, adapter les dimensions comme avant
    // Calculer les ratios de mise à l'échelle
    const widthRatio = newTablet.width / oldTablet.width;
    const heightRatio = newTablet.height / oldTablet.height;
    
    // Adapter les dimensions de la zone en fonction des nouveaux ratios
    // tout en gardant le même pourcentage de couverture
    const newAreaWidth = Math.min(areaWidth * widthRatio, newTablet.width);
    const newAreaHeight = Math.min(areaHeight * heightRatio, newTablet.height);
    
    // Adapter la position en maintenant le même placement relatif
    const relativeX = offsetX / oldTablet.width;
    const relativeY = offsetY / oldTablet.height;
    
    let newOffsetX = relativeX * newTablet.width;
    let newOffsetY = relativeY * newTablet.height;
    
    // Contraindre la nouvelle position pour s'assurer que la zone reste dans les limites
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

// Exporter les fonctions pour utilisation dans d'autres modules
window.constrainAreaOffset = constrainAreaOffset;
window.adaptAreaToNewTablet = adaptAreaToNewTablet; 