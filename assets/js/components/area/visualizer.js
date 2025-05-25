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
const radiusInputField = document.getElementById('radius-input');
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

// State variables
let currentScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;
window.currentRadius = 0;
let currentRadius = window.currentRadius;
let containerSize = { width: 0, height: 0 };
let tabletSize = { width: 0, height: 0 };
const containerPadding = 40;

// Throttled update function to limit frequency
const throttledUpdateDisplay = throttle(updateDisplay, 16); // ~60fps

/**
 * Updates the container size when it changes
 */
function updateContainerSize() {
    containerSize.width = visualContainer.clientWidth - containerPadding;
    containerSize.height = visualContainer.clientHeight - containerPadding;
}

/**
 * Gets current tablet and area dimensions
 */
function getCurrentDimensions() {
    return {
        tabletWidth: parseFloatSafe(cachedElements.tabletWidthInput.value),
        tabletHeight: parseFloatSafe(cachedElements.tabletHeightInput.value),
        areaWidth: parseFloatSafe(cachedElements.areaWidthInput.value),
        areaHeight: parseFloatSafe(cachedElements.areaHeightInput.value),
        areaOffsetX: parseFloatSafe(cachedElements.areaOffsetXInput.value),
        areaOffsetY: parseFloatSafe(cachedElements.areaOffsetYInput.value)
    };
}

/**
 * Updates display sizes based on dimensions
 */
function updateDisplaySizes(tabletWidth, tabletHeight) {
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
    
    // Update tablet boundary display
    tabletBoundary.style.width = `${displayWidth}px`;
    tabletBoundary.style.height = `${displayHeight}px`;
    
    return { displayWidth, displayHeight };
}

/**
 * Updates rectangle display
 */
function updateRectangleDisplay(areaWidth, areaHeight, areaOffsetX, areaOffsetY) {
    const rectWidth = mmToPx(areaWidth, currentScale);
    const rectHeight = mmToPx(areaHeight, currentScale);
    
    const rectCenterX = mmToPx(areaOffsetX, currentScale);
    const rectCenterY = mmToPx(areaOffsetY, currentScale);
    
    const rectLeft = rectCenterX - rectWidth / 2;
    const rectTop = rectCenterY - rectHeight / 2;
    
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.transform = `translate(${rectLeft}px, ${rectTop}px)`;
    
    // Update border radius
    const radiusValue = window.currentRadius;
    currentRadius = radiusValue;
    
    let borderRadius;
    if (radiusValue === 0) {
        borderRadius = '0px';
    } else if (radiusValue === 100) {
        borderRadius = `${Math.min(rectWidth, rectHeight) / 2}px`;
    } else {
        const maxRadius = Math.min(rectWidth, rectHeight) / 2;
        borderRadius = `${maxRadius * (radiusValue / 100)}px`;
    }
    
    rectangle.style.borderRadius = borderRadius;
}

/**
 * Handle first render operations
 */
function handleFirstRender() {
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
}

/**
 * Save current state with debounce
 */
function saveCurrentState() {
    if (typeof PreferencesManager !== 'undefined' && typeof debounce === 'function') {
        if (!updateDisplay.debouncedSave) {
            updateDisplay.debouncedSave = debounce(() => {
                PreferencesManager.saveCurrentState();
            }, 1000);
        }
        
        updateDisplay.debouncedSave();
    }
}

/**
 * Get constrained offsets if needed
 */
function getConstrainedOffsets(areaOffsetX, areaOffsetY, isOffsetXFocused, isOffsetYFocused, dims) {
    // Temporary values for visual updates during editing
    if (isOffsetXFocused && cachedElements.areaOffsetXInput.value.trim() === '') {
        areaOffsetX = dims.tabletWidth / 2;
    }
    
    if (isOffsetYFocused && cachedElements.areaOffsetYInput.value.trim() === '') {
        areaOffsetY = dims.tabletHeight / 2;
    }
    
    // Don't constrain values if the fields are being edited
    if (!isOffsetXFocused && !isOffsetYFocused) {
        return constrainAreaOffset(
            areaOffsetX, 
            areaOffsetY, 
            dims.areaWidth, 
            dims.areaHeight, 
            dims.tabletWidth, 
            dims.tabletHeight
        );
    }
    
    return { x: areaOffsetX, y: areaOffsetY };
}

/**
 * Updates the visual display of the tablet and area
 */
function updateDisplay() {
    const dims = getCurrentDimensions();
    
    // Check if the offset inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    if (!isValidNumber(dims.tabletWidth, 10) || !isValidNumber(dims.tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Get constrained offsets
    const constrainedOffsets = getConstrainedOffsets(
        dims.areaOffsetX, 
        dims.areaOffsetY, 
        isOffsetXFocused, 
        isOffsetYFocused, 
        dims
    );
    
    // Update input values if they were constrained
    if (!isOffsetXFocused && constrainedOffsets.x !== dims.areaOffsetX) {
        cachedElements.areaOffsetXInput.value = formatNumber(constrainedOffsets.x, DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused && constrainedOffsets.y !== dims.areaOffsetY) {
        cachedElements.areaOffsetYInput.value = formatNumber(constrainedOffsets.y, DECIMAL_PRECISION_POSITION);
    }
    
    // Update dimensions with constrained values
    dims.areaOffsetX = constrainedOffsets.x;
    dims.areaOffsetY = constrainedOffsets.y;
    
    // Determine if it's the first render
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    // Update the tablet dimensions if they have changed
    if (tabletSize.width !== dims.tabletWidth || tabletSize.height !== dims.tabletHeight) {
        tabletSize.width = dims.tabletWidth;
        tabletSize.height = dims.tabletHeight;
    }
    
    // Update display sizes
    updateDisplaySizes(dims.tabletWidth, dims.tabletHeight);
    
    // Update rectangle display
    updateRectangleDisplay(dims.areaWidth, dims.areaHeight, dims.areaOffsetX, dims.areaOffsetY);
    
    // Update info displays
    updateInfoDisplays(dims);
    
    // Update grid visibility
    const showGrid = toggleGridCheckbox.checked;
    if (backgroundGrid.classList.contains('hidden') === showGrid) {
        backgroundGrid.classList.toggle('hidden', !showGrid);
    }
    
    // Handle first render
    if (isFirstRender) {
        handleFirstRender();
    } else {
        saveCurrentState();
    }
}

/**
 * Update information displays with current dimensions
 */
function updateInfoDisplays(dims) {
    // Get the elements from the cache
    const { 
        tabletDimensionsInfo, tabletRatioInfo, 
        dimensionsInfo, areaInfo, ratioInfo, positionInfo, radiusInfo,
        customRatioInput, lockRatioCheckbox
    } = cachedElements;
    
    // Tablet info
    const tabletRatio = calculateRatio(dims.tabletWidth, dims.tabletHeight);
    
    // Avoid unnecessary DOM rewrites by checking changes
    const newTabletDimensions = `${formatNumber(dims.tabletWidth)} × ${formatNumber(dims.tabletHeight)} mm`;
    if (tabletDimensionsInfo.textContent !== newTabletDimensions) {
        tabletDimensionsInfo.textContent = newTabletDimensions;
    }
    
    // Toujours formater le ratio de la tablette avec 3 décimales
    const formattedTabletRatio = formatNumber(tabletRatio, 3);
    if (tabletRatioInfo.textContent !== formattedTabletRatio) {
        tabletRatioInfo.textContent = formattedTabletRatio;
    }
    
    // Area info
    const areaRatio = formatNumber(calculateRatio(dims.areaWidth, dims.areaHeight), 3);
    const areaSurface = formatNumber(dims.areaWidth * dims.areaHeight);
    
    // Update the ratio only if the lock is activated
    const isLocked = lockRatioCheckbox.getAttribute('aria-pressed') === 'true';
    
    if (isLocked) {
        // Don't update the customRatioInput if the user is editing it
        if (!customRatioInput.matches(':focus') && !customRatioInput.dataset.editing) {
            const newRatio = formatNumber(dims.areaWidth / dims.areaHeight, 3);
            if (customRatioInput.value !== newRatio) {
                customRatioInput.value = newRatio;
                
                // Update the currentRatio variable in appState if it exists
                if (typeof appState !== 'undefined') {
                    appState.currentRatio = dims.areaWidth / dims.areaHeight;
                }
            }
        }
    } else if (typeof appState !== 'undefined' && typeof appState.debouncedUpdateRatio === 'function') {
        // For the unlocked mode, use the debounced function only
        appState.debouncedUpdateRatio();
    }
    
    // Update area info displays
    const newDimensions = `${formatNumber(dims.areaWidth)} × ${formatNumber(dims.areaHeight)} mm`;
    if (dimensionsInfo.textContent !== newDimensions) {
        dimensionsInfo.textContent = newDimensions;
    }
    
    if (areaInfo.textContent !== `${areaSurface} mm²`) {
        areaInfo.textContent = `${areaSurface} mm²`;
    }
    
    // Ensure que le ratio est toujours affiché avec 3 décimales
    if (ratioInfo.textContent !== areaRatio) {
        ratioInfo.textContent = areaRatio;
    }
    
    // Update position info
    const newPosition = `X: ${formatNumber(dims.areaOffsetX, DECIMAL_PRECISION_POSITION)}, Y: ${formatNumber(dims.areaOffsetY, DECIMAL_PRECISION_POSITION)}`;
    if (positionInfo.textContent !== newPosition) {
        positionInfo.textContent = newPosition;
    }
    
    // Update radius info
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
    const dims = getCurrentDimensions();
    
    if (!isValidNumber(dims.tabletWidth, 10) || !isValidNumber(dims.tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Determine if it's the first render
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    // Update the tablet dimensions if they have changed
    if (tabletSize.width !== dims.tabletWidth || tabletSize.height !== dims.tabletHeight) {
        tabletSize.width = dims.tabletWidth;
        tabletSize.height = dims.tabletHeight;
    }
    
    // Update display sizes
    updateDisplaySizes(dims.tabletWidth, dims.tabletHeight);
    
    // Update rectangle display
    updateRectangleDisplay(dims.areaWidth, dims.areaHeight, dims.areaOffsetX, dims.areaOffsetY);
    
    // Update simplified info displays
    updateInfoDisplaysWithoutRatio(dims);
    
    // Handle first render
    if (isFirstRender) {
        handleFirstRender();
    } else {
        // Save state with its own debounce
        if (typeof PreferencesManager !== 'undefined' && typeof debounce === 'function') {
            if (!updateDisplayWithoutRatio.debouncedSave) {
                updateDisplayWithoutRatio.debouncedSave = debounce(() => {
                    PreferencesManager.saveCurrentState();
                }, 1000);
            }
            updateDisplayWithoutRatio.debouncedSave();
        }
    }
}

/**
 * Update information displays with current dimensions without updating the ratio input
 */
function updateInfoDisplaysWithoutRatio(dims) {
    // Get the elements from the cache
    const { 
        tabletDimensionsInfo, tabletRatioInfo, 
        dimensionsInfo, areaInfo, ratioInfo, positionInfo, radiusInfo
    } = cachedElements;
    
    // Tablet info
    const tabletRatio = calculateRatio(dims.tabletWidth, dims.tabletHeight);
    
    // Update tablet info
    const newTabletDimensions = `${formatNumber(dims.tabletWidth)} × ${formatNumber(dims.tabletHeight)} mm`;
    if (tabletDimensionsInfo.textContent !== newTabletDimensions) {
        tabletDimensionsInfo.textContent = newTabletDimensions;
    }
    
    // Toujours formater le ratio de la tablette avec 3 décimales
    const formattedTabletRatio = formatNumber(tabletRatio, 3);
    if (tabletRatioInfo.textContent !== formattedTabletRatio) {
        tabletRatioInfo.textContent = formattedTabletRatio;
    }
    
    // Area info
    const areaRatio = formatNumber(calculateRatio(dims.areaWidth, dims.areaHeight), 3);
    const areaSurface = formatNumber(dims.areaWidth * dims.areaHeight);
    
    // Update area info displays
    const newDimensions = `${formatNumber(dims.areaWidth)} × ${formatNumber(dims.areaHeight)} mm`;
    if (dimensionsInfo.textContent !== newDimensions) {
        dimensionsInfo.textContent = newDimensions;
    }
    
    if (areaInfo.textContent !== `${areaSurface} mm²`) {
        areaInfo.textContent = `${areaSurface} mm²`;
    }
    
    // Ensure que le ratio est toujours affiché avec 3 décimales
    if (ratioInfo.textContent !== areaRatio) {
        ratioInfo.textContent = areaRatio;
    }
    
    // Update position info
    const newPosition = `X: ${formatNumber(dims.areaOffsetX, DECIMAL_PRECISION_POSITION)}, Y: ${formatNumber(dims.areaOffsetY, DECIMAL_PRECISION_POSITION)}`;
    if (positionInfo.textContent !== newPosition) {
        positionInfo.textContent = newPosition;
    }
    
    // Update radius info
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
    
    // Clean up old listeners
    rectangle.removeEventListener('mousedown', handleDragStart);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    rectangle.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Add new listeners
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
 */
function handleDragStart(e) {
    e.preventDefault();
    
    isDragging = true;
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    dragStartOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    dragStartOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
}

/**
 * Handle start of touch drag
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
 * Handle movement during drag (mouse or touch)
 */
function handleMovement(clientX, clientY) {
    if (!isDragging) return;
    
    const dims = getCurrentDimensions();
    
    // Check if the inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Calculate movement in millimeters
    const deltaXPx = clientX - dragStartX;
    const deltaYPx = clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain within the tablet boundaries
    const constrainedOffsets = constrainAreaOffset(
        newOffsetX, 
        newOffsetY, 
        dims.areaWidth, 
        dims.areaHeight, 
        dims.tabletWidth, 
        dims.tabletHeight
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
 * Handle mouse movement during drag
 */
function handleDragMove(e) {
    handleMovement(e.clientX, e.clientY);
}

/**
 * Handle touch movement during drag
 */
function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    handleMovement(touch.clientX, touch.clientY);
}

/**
 * Handle the end of drag operation
 */
function handleDragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Ensure the body has the page-loaded class to activate transitions
    if (!document.body.classList.contains('page-loaded')) {
        document.body.classList.add('page-loaded');
    }
    
    // Force a final update without throttle
    updateDisplay();
    
    // Save preferences after movement
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 50);
    }
    
    // Dispatch event to inform about active area movement
    const dims = getCurrentDimensions();
    document.dispatchEvent(new CustomEvent('activearea:moved', {
        detail: {
            offsetX: dims.areaOffsetX,
            offsetY: dims.areaOffsetY,
            width: dims.areaWidth,
            height: dims.areaHeight
        }
    }));
}

/**
 * Center the active area in the tablet
 */
function centerArea() {
    const dims = getCurrentDimensions();
    
    // Avoid redundant calculations
    if (dims.tabletWidth <= 0 || dims.tabletHeight <= 0) return;
    
    // Check if the inputs are focused (manual editing)
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    // Update only the fields that are not being edited
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = formatNumber(dims.tabletWidth / 2, DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = formatNumber(dims.tabletHeight / 2, DECIMAL_PRECISION_POSITION);
    }
    
    updateDisplay();
    
    // Save preferences after centering
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 100);
    }
    
    // Dispatch event to inform about active area centering
    document.dispatchEvent(new CustomEvent('activearea:centered', {
        detail: {
            offsetX: dims.tabletWidth / 2,
            offsetY: dims.tabletHeight / 2,
            width: dims.areaWidth,
            height: dims.areaHeight
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
 * Setup border radius control
 */
function setupRadiusControl() {
    if (areaRadiusInput && radiusInputField) {
        // Slider change event
        areaRadiusInput.addEventListener('input', function() {
            currentRadius = parseInt(this.value, 10);
            window.currentRadius = currentRadius;
            radiusInputField.value = currentRadius;
            
            // Update the radius info in the summary
            const radiusInfo = document.getElementById('radius-info');
            if (radiusInfo) {
                radiusInfo.textContent = `${currentRadius}%`;
            }
            
            updateDisplay();
        });

        // Manual input change event
        radiusInputField.addEventListener('input', function() {
            let value = parseInt(this.value, 10);
            
            // Ensure value is within bounds
            if (isNaN(value) || value < 0) value = 0;
            if (value > 100) value = 100;
            
            // Update both the display value and the slider
            currentRadius = value;
            window.currentRadius = currentRadius;
            areaRadiusInput.value = value;
            
            // Update the radius info in the summary
            const radiusInfo = document.getElementById('radius-info');
            if (radiusInfo) {
                radiusInfo.textContent = `${currentRadius}%`;
            }
            
            // Only update the input value if it's different from what was entered
            if (parseInt(this.value, 10) !== value && !isNaN(parseInt(this.value, 10))) {
                this.value = value;
            }
            
            updateDisplay();
        });
    }
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
    setTimeout(() => {
        // Activate CSS transitions
        document.body.classList.add('page-loaded');
        
        // Reactivate interactions with the rectangle
        rectangle.style.pointerEvents = 'auto';
        
        // Set the normal cursor on the rectangle
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
        
        // Setup all event listeners and controls
        setupDragFunctionality();
        setupResizeObserver();
        setupRadiusControl();
        
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

// Expose functions globally
window.updateDisplayWithoutRatio = updateDisplayWithoutRatio;
window.centerArea = centerArea;

