/**
 * Tablet area visualizer component
 */

// DOM Elements
const visualContainer = document.getElementById('visual-container');
const tabletBoundary = document.getElementById('tablet-boundary');
const rectangle = document.getElementById('rectangle');
const backgroundGrid = document.getElementById('backgroundGrid');
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox');
const areaRadiusInput = document.getElementById('areaRadius');
const radiusPercentage = document.getElementById('radius-percentage');
const radiusControlGroup = document.getElementById('radius-control-group');

// Cache of frequently used DOM elements 
const cachedElements = { 
    tabletDimensionsInfo: document.getElementById('tablet-dimensions-info'),
    tabletRatioInfo: document.getElementById('tablet-ratio-info'),
    dimensionsInfo: document.getElementById('dimensions-info'),
    areaInfo: document.getElementById('area-info'),
    ratioInfo: document.getElementById('ratio-info'),
    positionInfo: document.getElementById('position-info'),
    radiusInfo: document.getElementById('radius-info'),
    customRatioInput: document.getElementById('customRatio'),
    lockRatioCheckbox: document.getElementById('lockRatio'),
    tabletWidthInput: document.getElementById('tabletWidth'),
    tabletHeightInput: document.getElementById('tabletHeight'),
    areaWidthInput: document.getElementById('areaWidth'),
    areaHeightInput: document.getElementById('areaHeight'),
    areaOffsetXInput: document.getElementById('areaOffsetX'),
    areaOffsetYInput: document.getElementById('areaOffsetY')
};

// Scaling and display variables 
let currentScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;

// Rayon de courbure - défini comme une variable globale pour l'accès externe
window.currentRadius = 0;
let currentRadius = window.currentRadius;

// Variables to avoid frequent recalculations
let containerSize = { width: 0, height: 0 };
let tabletSize = { width: 0, height: 0 };
let containerPadding = 40;

// Throttled update function to limit frequency
const throttledUpdateDisplay = throttle(updateDisplay, 16); // ~60fps

// Update the container size when it changes
function updateContainerSize() {
    containerSize.width = visualContainer.clientWidth - containerPadding;
    containerSize.height = visualContainer.clientHeight - containerPadding;
}

/**
 * Updates the visual display of the tablet and area
 */
function updateDisplay() {
    // Use cached elements and parseFloatSafe which is optimized
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    
    // Check if the offset inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Don't process empty or invalid offset values if they are being edited
    let areaOffsetX, areaOffsetY;
    
    if (isOffsetXFocused && cachedElements.areaOffsetXInput.value.trim() === '') {
        // Use a temporary value at the center for the visualization
        areaOffsetX = tabletWidth / 2;
    } else {
        areaOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    }
    
    if (isOffsetYFocused && cachedElements.areaOffsetYInput.value.trim() === '') {
        // Use a temporary value at the center for the visualization
        areaOffsetY = tabletHeight / 2;
    } else {
        areaOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
    }
    
    if (!isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Don't constrain values if the fields are being edited
    if (!isOffsetXFocused && !isOffsetYFocused) {
        // Constrain the offsets within the tablet boundaries
        const constrainedOffsets = constrainAreaOffset(
            areaOffsetX, 
            areaOffsetY, 
            areaWidth, 
            areaHeight, 
            tabletWidth, 
            tabletHeight
        );
        
        areaOffsetX = constrainedOffsets.x;
        areaOffsetY = constrainedOffsets.y;
        
        // Update the values if they have been constrained
        if (!isOffsetXFocused && areaOffsetX !== parseFloatSafe(cachedElements.areaOffsetXInput.value)) {
            cachedElements.areaOffsetXInput.value = formatNumber(areaOffsetX, DECIMAL_PRECISION_POSITION);
        }
        
        if (!isOffsetYFocused && areaOffsetY !== parseFloatSafe(cachedElements.areaOffsetYInput.value)) {
            cachedElements.areaOffsetYInput.value = formatNumber(areaOffsetY, DECIMAL_PRECISION_POSITION);
        }
    }
    
    // Determine if it's the first render
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    // Update the tablet dimensions if they have changed
    if (tabletSize.width !== tabletWidth || tabletSize.height !== tabletHeight) {
        tabletSize.width = tabletWidth;
        tabletSize.height = tabletHeight;
    }
    
    // Update the container size if necessary
    if (containerSize.width === 0) {
        updateContainerSize();
    }
    
    const tabletRatio = tabletWidth / tabletHeight;
    
    let displayWidth, displayHeight;
    
    if (containerSize.width / tabletRatio <= containerSize.height) {
        // Width constrained
        displayWidth = containerSize.width;
        displayHeight = displayWidth / tabletRatio;
    } else {
        // Height constrained
        displayHeight = containerSize.height;
        displayWidth = displayHeight * tabletRatio;
    }
    
    // Update scale for converting mm to px
    currentScale = displayWidth / tabletWidth;
    
    // Update tablet boundary display with transform pour meilleures performances
    tabletBoundary.style.width = `${displayWidth}px`;
    tabletBoundary.style.height = `${displayHeight}px`;
    
    // Get area rectangle dimensions and position in pixels
    const rectWidth = mmToPx(areaWidth, currentScale);
    const rectHeight = mmToPx(areaHeight, currentScale);
    
    // Get center position and convert to top-left for CSS
    const rectCenterX = mmToPx(areaOffsetX, currentScale);
    const rectCenterY = mmToPx(areaOffsetY, currentScale);
    
    const rectLeft = rectCenterX - rectWidth / 2;
    const rectTop = rectCenterY - rectHeight / 2;
    
    // Update rectangle display immediately without transition on initial loading
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.transform = `translate(${rectLeft}px, ${rectTop}px)`;
    
    // Update border radius based on the current setting
    const radiusValue = window.currentRadius;
    currentRadius = radiusValue;
    
    // Calculate the appropriate border radius
    let borderRadius;
    if (radiusValue === 0) {
        borderRadius = '0px'; // Aucun rayon
    } else if (radiusValue === 100) {
        // Pour un cercle parfait, le rayon doit être la moitié de la dimension la plus petite
        borderRadius = `${Math.min(rectWidth, rectHeight) / 2}px`;
    } else {
        // Pour les valeurs intermédiaires, calculer un rayon proportionnel
        const maxRadius = Math.min(rectWidth, rectHeight) / 2;
        borderRadius = `${maxRadius * (radiusValue / 100)}px`;
    }
    
    // Appliquer le rayon à l'élément
    rectangle.style.borderRadius = borderRadius;
    
    // Update info displays
    updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY);
    
    // Update grid visibility without recalculation if state hasn't changed
    const showGrid = toggleGridCheckbox.checked;
    if (backgroundGrid.classList.contains('hidden') === showGrid) {
        backgroundGrid.classList.toggle('hidden', !showGrid);
    }
    
    // If it's the first render, wait for a tick to ensure all updates have been applied
    // then reveal the rectangle and hide the loading overlay
    if (isFirstRender) {
        requestAnimationFrame(() => {
            // Remove the loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.15s ease';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 150);
            }
            
            // Make the rectangle visible
            if (rectangle.classList.contains('invisible')) {
                rectangle.classList.remove('invisible');
            }
        });
    } else {
        // Si ce n'est pas le premier rendu, sauvegarder l'état actuel
        // Utiliser un debounce pour éviter les sauvegardes trop fréquentes
        if (typeof PreferencesManager !== 'undefined' && typeof debounce === 'function') {
            // Utiliser une variable statique pour stocker la fonction debounce
            if (!updateDisplay.debouncedSave) {
                updateDisplay.debouncedSave = debounce(() => {
                    PreferencesManager.saveCurrentState();
                }, 1000); // Sauvegarder seulement après 1 seconde d'inactivité
            }
            
            // Appeler la fonction debounce
            updateDisplay.debouncedSave();
        }
    }
}

/**
 * Update information displays with current dimensions
 */
function updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY) {
    // Get the elements from the cache
    const { 
        tabletDimensionsInfo, tabletRatioInfo, 
        dimensionsInfo, areaInfo, ratioInfo, positionInfo, radiusInfo,
        customRatioInput, lockRatioCheckbox
    } = cachedElements;
    
    // Tablet info
    const tabletRatio = calculateRatio(tabletWidth, tabletHeight);
    
    // Avoid unnecessary DOM rewrites by checking changes
    const newTabletDimensions = `${formatNumber(tabletWidth)} × ${formatNumber(tabletHeight)} mm`;
    if (tabletDimensionsInfo.textContent !== newTabletDimensions) {
        tabletDimensionsInfo.textContent = newTabletDimensions;
    }
    
    if (tabletRatioInfo.textContent !== tabletRatio) {
        tabletRatioInfo.textContent = tabletRatio;
    }
    
    // Area info
    const areaRatio = formatNumber(calculateRatio(areaWidth, areaHeight), 3);
    const areaSurface = formatNumber(areaWidth * areaHeight);
    
    // Update the ratio only if the lock is activated (to avoid too frequent updates)
    const isLocked = lockRatioCheckbox.getAttribute('aria-pressed') === 'true';
    
    if (isLocked) {
        // Don't update the customRatioInput if the user is editing it
        if (!customRatioInput.matches(':focus') && !customRatioInput.dataset.editing) {
            const newRatio = formatNumber(areaWidth / areaHeight, 3);
            if (customRatioInput.value !== newRatio) {
                customRatioInput.value = newRatio;
                
                // Update the currentRatio variable in appState if it exists
                if (typeof appState !== 'undefined') {
                    appState.currentRatio = areaWidth / areaHeight;
                }
            }
        }
    } else if (typeof appState !== 'undefined' && typeof appState.debouncedUpdateRatio === 'function') {
        // For the unlocked mode, use the debounced function only
        appState.debouncedUpdateRatio();
    }
    
    // Avoid unnecessary DOM rewrites by checking changes
    const newDimensions = `${formatNumber(areaWidth)} × ${formatNumber(areaHeight)} mm`;
    if (dimensionsInfo.textContent !== newDimensions) {
        dimensionsInfo.textContent = newDimensions;
    }
    
    if (areaInfo.textContent !== `${areaSurface} mm²`) {
        areaInfo.textContent = `${areaSurface} mm²`;
    }
    
    if (ratioInfo.textContent !== areaRatio) {
        ratioInfo.textContent = areaRatio;
    }
    
    const newPosition = `X: ${formatNumber(areaOffsetX, DECIMAL_PRECISION_POSITION)}, Y: ${formatNumber(areaOffsetY, DECIMAL_PRECISION_POSITION)}`;
    if (positionInfo.textContent !== newPosition) {
        positionInfo.textContent = newPosition;
    }
    
    // Ajout de l'affichage du radius
    if (radiusInfo) {
        const radiusValue = window.currentRadius || 0;
        const radiusText = `${radiusValue}%`;
        if (radiusInfo.textContent !== radiusText) {
            radiusInfo.textContent = radiusText;
        }
    }
}

/**
 * Update the display without updating the ratio
 * Used during drag operations to avoid resizing based on ratio lock
 */
function updateDisplayWithoutRatio() {
    // Use cached elements and parseFloatSafe which is optimized
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    const areaOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    const areaOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
    
    if (!isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Determine if it's the first render
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    // Update the tablet dimensions if they have changed
    if (tabletSize.width !== tabletWidth || tabletSize.height !== tabletHeight) {
        tabletSize.width = tabletWidth;
        tabletSize.height = tabletHeight;
    }
    
    // Update the container size if necessary
    if (containerSize.width === 0) {
        updateContainerSize();
    }
    
    const tabletRatio = tabletWidth / tabletHeight;
    
    let displayWidth, displayHeight;
    
    if (containerSize.width / tabletRatio <= containerSize.height) {
        // Width constrained
        displayWidth = containerSize.width;
        displayHeight = displayWidth / tabletRatio;
    } else {
        // Height constrained
        displayHeight = containerSize.height;
        displayWidth = displayHeight * tabletRatio;
    }
    
    // Update scale for converting mm to px
    currentScale = displayWidth / tabletWidth;
    
    // Update tablet boundary display with transform for better performance
    tabletBoundary.style.width = `${displayWidth}px`;
    tabletBoundary.style.height = `${displayHeight}px`;
    
    // Get area rectangle dimensions and position in pixels
    const rectWidth = mmToPx(areaWidth, currentScale);
    const rectHeight = mmToPx(areaHeight, currentScale);
    
    // Get center position and convert to top-left for CSS
    const rectCenterX = mmToPx(areaOffsetX, currentScale);
    const rectCenterY = mmToPx(areaOffsetY, currentScale);
    
    const rectLeft = rectCenterX - rectWidth / 2;
    const rectTop = rectCenterY - rectHeight / 2;
    
    // Update rectangle display
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.transform = `translate(${rectLeft}px, ${rectTop}px)`;
    
    // Update info displays
    updateInfoDisplaysWithoutRatio(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY);
    
    // If it's the first render, wait for a tick to ensure all updates have been applied
    // then reveal the rectangle and hide the loading overlay
    if (isFirstRender) {
        requestAnimationFrame(() => {
            // Remove the loading overlay
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.15s ease';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 150);
            }
            
            // Make the rectangle visible
            if (rectangle.classList.contains('invisible')) {
                rectangle.classList.remove('invisible');
            }
        });
    } else {
        // Si ce n'est pas le premier rendu, sauvegarder l'état actuel
        // Utiliser un debounce pour éviter les sauvegardes trop fréquentes
        if (typeof PreferencesManager !== 'undefined' && typeof debounce === 'function') {
            // Utiliser une variable statique pour stocker la fonction debounce
            if (!updateDisplayWithoutRatio.debouncedSave) {
                updateDisplayWithoutRatio.debouncedSave = debounce(() => {
                    PreferencesManager.saveCurrentState();
                }, 1000); // Sauvegarder seulement après 1 seconde d'inactivité
            }
            
            // Appeler la fonction debounce
            updateDisplayWithoutRatio.debouncedSave();
        }
    }
}

/**
 * Update information displays with current dimensions without updating the ratio input
 */
function updateInfoDisplaysWithoutRatio(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY) {
    // Get the elements from the cache
    const { 
        tabletDimensionsInfo, tabletRatioInfo, 
        dimensionsInfo, areaInfo, ratioInfo, positionInfo, radiusInfo
    } = cachedElements;
    
    // Tablet info
    const tabletRatio = calculateRatio(tabletWidth, tabletHeight);
    
    // Avoid unnecessary DOM rewrites by checking changes
    const newTabletDimensions = `${formatNumber(tabletWidth)} × ${formatNumber(tabletHeight)} mm`;
    if (tabletDimensionsInfo.textContent !== newTabletDimensions) {
        tabletDimensionsInfo.textContent = newTabletDimensions;
    }
    
    if (tabletRatioInfo.textContent !== tabletRatio) {
        tabletRatioInfo.textContent = tabletRatio;
    }
    
    // Area info
    const areaRatio = formatNumber(calculateRatio(areaWidth, areaHeight), 3);
    const areaSurface = formatNumber(areaWidth * areaHeight);
    
    // Don't update the ratio input field here
    // The ratio will be updated after the delay via the debouncedUpdateRatio function
    
    // Avoid unnecessary DOM rewrites by checking changes
    const newDimensions = `${formatNumber(areaWidth)} × ${formatNumber(areaHeight)} mm`;
    if (dimensionsInfo.textContent !== newDimensions) {
        dimensionsInfo.textContent = newDimensions;
    }
    
    if (areaInfo.textContent !== `${areaSurface} mm²`) {
        areaInfo.textContent = `${areaSurface} mm²`;
    }
    
    if (ratioInfo.textContent !== areaRatio) {
        ratioInfo.textContent = areaRatio;
    }
    
    const newPosition = `X: ${formatNumber(areaOffsetX, DECIMAL_PRECISION_POSITION)}, Y: ${formatNumber(areaOffsetY, DECIMAL_PRECISION_POSITION)}`;
    if (positionInfo.textContent !== newPosition) {
        positionInfo.textContent = newPosition;
    }
    
    // Ajout de l'affichage du radius
    if (radiusInfo) {
        const radiusValue = window.currentRadius || 0;
        const radiusText = `${radiusValue}%`;
        if (radiusInfo.textContent !== radiusText) {
            radiusInfo.textContent = radiusText;
        }
    }
}

/**
 * Setup drag functionality for the area rectangle
 */
function setupDragFunctionality() {
    // Verify if the initialization is still in progress
    if (document.body.getAttribute('data-loading') === 'true') {
        console.log('Waiting for the loading to finish before enabling drag functionality');
        return;
    }
    
    // Clean up old listeners if they exist (to avoid duplicates during reinitializations)
    rectangle.removeEventListener('mousedown', handleDragStart);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    rectangle.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Add the new listeners
    rectangle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Touch support
    rectangle.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
}

/**
 * Handle start of mouse drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragStart(e) {
    e.preventDefault();
    
    isDragging = true;
    // Don't change the cursor
    // rectangle.style.cursor = 'grabbing';
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    dragStartOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    dragStartOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
}

/**
 * Handle start of touch drag (continued)
 * @param {TouchEvent} e - Touch event
 */
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        
        isDragging = true;
        const touch = e.touches[0];
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        dragStartOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
        dragStartOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
    }
}

/**
 * Handle mouse movement during drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragMove(e) {
    if (!isDragging) return;
    
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    
    // Check if the inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Calculate movement in millimeters
    const deltaXPx = e.clientX - dragStartX;
    const deltaYPx = e.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain within the tablet boundaries
    const constrainedOffsets = constrainAreaOffset(
        newOffsetX, 
        newOffsetY, 
        areaWidth, 
        areaHeight, 
        tabletWidth, 
        tabletHeight
    );
    
    // Update inputs only if the user is not editing them
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = formatNumber(constrainedOffsets.x, DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = formatNumber(constrainedOffsets.y, DECIMAL_PRECISION_POSITION);
    }
    
    // Update display with throttle to limit calls
    throttledUpdateDisplay();
}

/**
 * Handle touch movement during drag
 * @param {TouchEvent} e - Touch event
 */
function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    
    // Check if the inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Calculate movement in millimeters
    const deltaXPx = touch.clientX - dragStartX;
    const deltaYPx = touch.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain within the tablet boundaries
    const constrainedOffsets = constrainAreaOffset(
        newOffsetX, 
        newOffsetY, 
        areaWidth, 
        areaHeight, 
        tabletWidth, 
        tabletHeight
    );
    
    // Update inputs only if the user is not editing them
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = formatNumber(constrainedOffsets.x, DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = formatNumber(constrainedOffsets.y, DECIMAL_PRECISION_POSITION);
    }
    
    // Update display with throttle to limit calls
    throttledUpdateDisplay();
}

/**
 * Handle the end of drag operation
 */
function handleDragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    // Don't change the cursor
    // rectangle.style.cursor = 'grab';
    
    // Ensure the body has the page-loaded class to activate transitions
    // after the first user interaction
    if (!document.body.classList.contains('page-loaded')) {
        document.body.classList.add('page-loaded');
    }
    
    // Force a final update without throttle
    updateDisplay();
    
    // Sauvegarder les préférences après le déplacement
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 50);
    }
    
    // Émettre un événement personnalisé pour informer du déplacement de la zone active
    document.dispatchEvent(new CustomEvent('activearea:moved', {
        detail: {
            offsetX: parseFloatSafe(cachedElements.areaOffsetXInput.value),
            offsetY: parseFloatSafe(cachedElements.areaOffsetYInput.value),
            width: parseFloatSafe(cachedElements.areaWidthInput.value),
            height: parseFloatSafe(cachedElements.areaHeightInput.value)
        }
    }));
}

/**
 * Center the active area in the tablet
 */
function centerArea() {
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    
    // Avoid redundant calculations
    if (tabletWidth <= 0 || tabletHeight <= 0) return;
    
    // Check if the inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Update only the fields that are not being edited
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = formatNumber(tabletWidth / 2, DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = formatNumber(tabletHeight / 2, DECIMAL_PRECISION_POSITION);
    }
    
    updateDisplay();
    
    // Sauvegarder les préférences après le centrage
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 100);
    }
    
    // Émettre un événement personnalisé pour informer du centrage de la zone active
    document.dispatchEvent(new CustomEvent('activearea:centered', {
        detail: {
            offsetX: tabletWidth / 2,
            offsetY: tabletHeight / 2,
            width: parseFloatSafe(cachedElements.areaWidthInput.value),
            height: parseFloatSafe(cachedElements.areaHeightInput.value)
        }
    }));
}

/**
 * Setup a resize observer to update the display when container size changes
 */
function setupResizeObserver() {
    const resizeObserver = new ResizeObserver(throttle(() => {
        updateContainerSize();
        updateDisplay();
    }, 100));
    
    resizeObserver.observe(visualContainer);
}

/**
 * Initialize the visualizer
 */
function initVisualizer() {
    if (!visualContainer || !tabletBoundary || !rectangle) {
        console.error('Visualizer elements not found');
        return;
    }
    
    // Add a data-loading attribute to the body to indicate that the visualizer is loading
    document.body.setAttribute('data-loading', 'true');
    
    // Temporarily disable interactions during initial loading
    rectangle.style.pointerEvents = 'none';
    
    // Configure the rectangle to its correct initial position before activating transitions
    updateContainerSize();
    updateDisplay();
    
    // Add the page-loaded class to the body to activate CSS transitions after initial loading
    // A delay ensures that the initial position is established before activating transitions
    setTimeout(() => {
        // Activate CSS transitions
        document.body.classList.add('page-loaded');
        
        // Reactivate interactions with the rectangle
        rectangle.style.pointerEvents = 'auto';
        
        // Set the normal cursor on the rectangle (instead of grab)
        rectangle.style.cursor = 'default';
        
        // Indicate that the loading is finished
        document.body.removeAttribute('data-loading');
        document.documentElement.classList.remove('loading');
        document.body.classList.remove('loading');
        
        // Hide the loading overlay definitively
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.15s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 150);
        }
        
        // Configure the event listeners only after everything is ready
        setupDragFunctionality();
        setupResizeObserver();
        
        // Center button
        const centerBtn = document.getElementById('center-btn');
        if (centerBtn) {
            centerBtn.addEventListener('click', centerArea);
        }
        
        // Toggle grid
        if (toggleGridCheckbox) {
            toggleGridCheckbox.addEventListener('change', throttle(() => {
                backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
            }, 50));
        }
        
        // Setup border radius control
        if (areaRadiusInput && radiusPercentage) {
            areaRadiusInput.addEventListener('input', function() {
                currentRadius = parseInt(this.value, 10);
                window.currentRadius = currentRadius;
                radiusPercentage.textContent = `${currentRadius}%`;
                updateDisplay();
            });
        }
        
        // Listen for tablet selection to show/hide radius control
        document.addEventListener('tablet:custom', function() {
            if (radiusControlGroup) {
                radiusControlGroup.classList.remove('hidden');
            }
        });
    }, 300);

    // Ensure the flex class is applied to the container
    if (visualContainer) {
        visualContainer.classList.add('flex');
    }
}

// Call init when window loads
window.addEventListener('load', initVisualizer);

// Exposer updateDisplayWithoutRatio globalement
window.updateDisplayWithoutRatio = updateDisplayWithoutRatio;

// Exposer centerArea globalement
window.centerArea = centerArea;
