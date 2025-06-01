/**
 * Tablet area visualizer component
 */

// DOM Elements
const visualContainer = document.getElementById('visual-container');
const tabletBoundary = document.getElementById('tablet-boundary');
const rectangle = document.getElementById('rectangle');
const backgroundGrid = document.getElementById('backgroundGrid');
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox');
const radiusControlGroup = document.getElementById('radius-control-group');

// Cache of frequently used DOM elements 
const cachedElements = { 
    // Note: Summary section elements removed - using console commands instead
    tabletDimensionsInfo: null, // Removed with summary section
    tabletRatioInfo: null, // Removed with summary section
    dimensionsInfo: null, // Removed with summary section
    areaInfo: null, // Removed with summary section
    ratioInfo: null, // Removed with summary section
    positionInfo: null, // Removed with summary section
    radiusInfo: null, // Removed with summary section
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
let containerSize = { width: 0, height: 0 };
let tabletSize = { width: 0, height: 0 };
const containerPadding = 40;

// Throttled update function will be defined after updateDisplay function
let throttledUpdateDisplay;

// Define the standard animated transition for the rectangle
const RECTANGLE_ANIMATED_TRANSITION = 'width var(--transition-fast), height var(--transition-fast), border-radius 0.25s ease-out, left 0.2s ease-out, top 0.2s ease-out';

/**
 * Helper function to apply animated transition to the rectangle
 */
function setRectangleToAnimatedTransition() {
    if (rectangle) {
        // Check if the dragging class is present. If so, CSS will override this.
        // This is mainly for discrete changes when not dragging.
        if (!rectangle.classList.contains('dragging')) {
            rectangle.style.transition = RECTANGLE_ANIMATED_TRANSITION;
        }
    }
}

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
    const currentAreaRadiusForDebug = document.getElementById('areaRadius'); // DEBUG STEP 3
    console.log('updateRectangleDisplay called. Radius value from #areaRadius:', currentAreaRadiusForDebug?.value); // DEBUG STEP 3

    const rectWidth = (typeof mmToPx === 'function') ? mmToPx(areaWidth, currentScale) : areaWidth * currentScale;
    const rectHeight = (typeof mmToPx === 'function') ? mmToPx(areaHeight, currentScale) : areaHeight * currentScale;
    
    // Get tablet boundary dimensions
    const tabletBoundaryRect = tabletBoundary.getBoundingClientRect();
    const tabletDisplayWidth = parseFloat(tabletBoundary.style.width) || tabletBoundaryRect.width;
    const tabletDisplayHeight = parseFloat(tabletBoundary.style.height) || tabletBoundaryRect.height;
    
    // Convert offset from mm to pixels relative to tablet boundary
    const rectCenterX = (typeof mmToPx === 'function') ? mmToPx(areaOffsetX, currentScale) : areaOffsetX * currentScale;
    const rectCenterY = (typeof mmToPx === 'function') ? mmToPx(areaOffsetY, currentScale) : areaOffsetY * currentScale;
    
    // Calculate position relative to tablet boundary center
    const rectLeft = rectCenterX - rectWidth / 2;
    const rectTop = rectCenterY - rectHeight / 2;
    
    // Set rectangle dimensions and position
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.left = `${rectLeft}px`;
    rectangle.style.top = `${rectTop}px`;
    rectangle.style.transform = 'none'; // Reset transform to avoid conflicts
    
    // Ensure rectangle is visible
    rectangle.style.visibility = 'visible';
    rectangle.style.opacity = '1';
    
    // Rectangle updated silently for performance
    
    // Update border radius
    const currentAreaRadiusInput = document.getElementById('areaRadius');
    let radiusValue = parseInt(currentAreaRadiusInput?.value || 0);
    
    let borderRadius;
    if (radiusValue === 0) {
        borderRadius = '0px';
    } else if (radiusValue === 100) {
        borderRadius = `${Math.min(rectWidth, rectHeight) / 2}px`;
    } else {
        const maxRadius = Math.min(rectWidth, rectHeight) / 2;
        borderRadius = `${maxRadius * (radiusValue / 100)}px`;
    }
    
    // Application du border-radius au rectangle de visualisation via CSS custom property
    rectangle.style.setProperty('--dynamic-border-radius', borderRadius);
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
            // Rectangle made visible
        }
        
        // Ensure rectangle is fully visible and interactive
        rectangle.style.visibility = 'visible';
        rectangle.style.opacity = '1';
        rectangle.style.pointerEvents = 'auto';
        rectangle.style.cursor = 'grab';
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

// Initialize throttled update function now that updateDisplay is defined
if (!throttledUpdateDisplay && typeof throttle === 'function') {
    throttledUpdateDisplay = throttle(updateDisplay, 16); // ~60fps
}

/**
 * Update information displays with current dimensions
 * Note: Summary section removed - info now available via console commands (dims() or checkDimensions())
 */
function updateInfoDisplays(dims) {
    // Get the elements from the cache
    const { 
        customRatioInput, lockRatioCheckbox
    } = cachedElements;
    
    // Only update the ratio input if the lock is activated
    const isLocked = lockRatioCheckbox && lockRatioCheckbox.getAttribute('aria-pressed') === 'true';
    
    if (isLocked && customRatioInput) {
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
    
    // Note: Summary display elements removed. Use dims() or checkDimensions() in console for detailed info
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
 * Note: Summary section removed - info now available via console commands (dims() or checkDimensions())
 */
function updateInfoDisplaysWithoutRatio(dims) {
    // Note: Summary display elements removed. Use dims() or checkDimensions() in console for detailed info
    // This function now serves as a placeholder for compatibility
}

/**
 * Setup drag functionality for the area rectangle
 */
function setupDragFunctionality() {
    // Verify if the initialization is still in progress
    if (document.body.getAttribute('data-loading') === 'true') {
        // Waiting for loading to finish
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
    
    // Event listeners attached for interaction feedback
    
    // Touch support
    rectangle.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // Ensure rectangle is draggable
    rectangle.style.cursor = 'grab';
    rectangle.style.pointerEvents = 'auto';
    
    // Drag functionality initialized successfully
}

/**
 * Handle start of mouse drag
 */
function handleDragStart(e) {
    e.preventDefault();
    
    isDragging = true;
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    dragStartOffsetX = (typeof parseFloatSafe === 'function') 
        ? parseFloatSafe(cachedElements.areaOffsetXInput.value)
        : parseFloat(cachedElements.areaOffsetXInput.value) || 0;
    dragStartOffsetY = (typeof parseFloatSafe === 'function') 
        ? parseFloatSafe(cachedElements.areaOffsetYInput.value)
        : parseFloat(cachedElements.areaOffsetYInput.value) || 0;
    
    // Drag started - values cached for performance
    
    // Change cursor to grabbing
    rectangle.style.cursor = 'grabbing';
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
        
        dragStartOffsetX = (typeof parseFloatSafe === 'function') 
            ? parseFloatSafe(cachedElements.areaOffsetXInput.value)
            : parseFloat(cachedElements.areaOffsetXInput.value) || 0;
        dragStartOffsetY = (typeof parseFloatSafe === 'function') 
            ? parseFloatSafe(cachedElements.areaOffsetYInput.value)
            : parseFloat(cachedElements.areaOffsetYInput.value) || 0;
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
    
    // Get tablet boundary position for accurate calculations
    const tabletBoundaryRect = tabletBoundary.getBoundingClientRect();
    const visualContainerRect = visualContainer.getBoundingClientRect();
    
    // Calculate movement in pixels relative to the tablet boundary
    const deltaXPx = clientX - dragStartX;
    const deltaYPx = clientY - dragStartY;
    
    // Convert pixel movement to millimeters
    const deltaXMm = (typeof pxToMm === 'function') ? pxToMm(deltaXPx, currentScale) : deltaXPx / currentScale;
    const deltaYMm = (typeof pxToMm === 'function') ? pxToMm(deltaYPx, currentScale) : deltaYPx / currentScale;
    
    // Movement calculated - optimized for performance
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain within the tablet boundaries
    const constrainedOffsets = (typeof constrainAreaOffset === 'function') 
        ? constrainAreaOffset(
            newOffsetX, 
            newOffsetY, 
            dims.areaWidth, 
            dims.areaHeight, 
            dims.tabletWidth, 
            dims.tabletHeight
        )
        : { x: newOffsetX, y: newOffsetY }; // Fallback without constraint
    
    // Constraints applied for boundary checking
    
    // Update inputs only if the user is not editing them
    if (!isOffsetXFocused) {
        const oldValue = cachedElements.areaOffsetXInput.value;
        const newValue = (typeof formatNumber === 'function') 
            ? formatNumber(constrainedOffsets.x, DECIMAL_PRECISION_POSITION)
            : constrainedOffsets.x.toFixed(3);
        cachedElements.areaOffsetXInput.value = newValue;
        // X input updated
    }
    
    if (!isOffsetYFocused) {
        const oldValue = cachedElements.areaOffsetYInput.value;
        const newValue = (typeof formatNumber === 'function') 
            ? formatNumber(constrainedOffsets.y, DECIMAL_PRECISION_POSITION)
            : constrainedOffsets.y.toFixed(3);
        cachedElements.areaOffsetYInput.value = newValue;
        // Y input updated
    }
    
    // Final offsets calculated
    
    // Update display with throttle to limit calls
    if (typeof throttledUpdateDisplay === 'function') {
        throttledUpdateDisplay();
    } else {
        // Fallback to direct update if throttled version is not available
        // Fallback to direct update
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
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
    
    // Drag operation completed
    isDragging = false;
    
    // Reset cursor to grab - .dragging class (which sets transition:none) will be removed by AreaManager
    // rectangle.style.cursor = 'grab'; // Already handled by AreaManager removing .dragging class

    // Ensure the body has the page-loaded class to activate transitions
    if (!document.body.classList.contains('page-loaded')) {
        document.body.classList.add('page-loaded');
    }
    
    // Force a final update without throttle.
    // Set the animated transition before this update for any discrete jumps.
    setRectangleToAnimatedTransition();
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
    
    // Ensure transitions are enabled for programmatic move
    setRectangleToAnimatedTransition();

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
        
        // Ensure proper centering after resize
        if (visualContainer) {
            visualContainer.style.display = 'flex';
            visualContainer.style.alignItems = 'center';
            visualContainer.style.justifyContent = 'center';
        }
        
        updateDisplay();
    }, 100));
    
    resizeObserver.observe(visualContainer);
}

/**
 * Initialize throttled functions and ensure proper order
 */
function initThrottledFunctions() {
    // Initialize throttled update function
    if (!throttledUpdateDisplay && typeof throttle === 'function' && typeof updateDisplay === 'function') {
        throttledUpdateDisplay = throttle(updateDisplay, 16);
        // throttledUpdateDisplay initialized
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
    
    document.body.setAttribute('data-loading', 'true');
    rectangle.style.pointerEvents = 'none';
    initThrottledFunctions();
    
    let initialVisualsUpdated = false;

    function setupInitialVisuals() {
        if (initialVisualsUpdated) return;
        console.log("Visualizer: Setting up initial visuals.");
        updateContainerSize();
        updateDisplay();
        initialVisualsUpdated = true;
    }

    // Écouter l'événement personnalisé de radiusSlider.js
    document.addEventListener('radiusSliderReady', function handleRadiusReady(event) {
        console.log('Visualizer: Event radiusSliderReady received', event.detail);
        setupInitialVisuals();

        // Attach listener to the newly ready radius input
        const areaRadiusInput = document.getElementById('areaRadius');
        if (areaRadiusInput) {
            // To prevent multiple listeners on the same element if this event fires unexpectedly multiple times
            // without the element being replaced, we can store and remove the old one.
            // radiusSlider.js replaces the element, so this primarily guards against unforeseen scenarios.
            if (areaRadiusInput._visualizerInputListener) {
                areaRadiusInput.removeEventListener('input', areaRadiusInput._visualizerInputListener);
                console.log('Visualizer: Removed old input listener from #areaRadius.');
            }
            areaRadiusInput._visualizerInputListener = function() {
                console.log('Input event on #areaRadius in visualizer.js (from radiusSliderReady handler), value:', this.value);
                updateDisplay();
            };
            areaRadiusInput.addEventListener('input', areaRadiusInput._visualizerInputListener);
            console.log('Visualizer: Attached input listener to #areaRadius.');
        } else {
            console.warn('Visualizer: #areaRadius element not found when radiusSliderReady was received.');
        }
        // Optionnel: supprimer l'écouteur s'il ne doit s'exécuter qu'une fois pour l'init
        // document.removeEventListener('radiusSliderReady', handleRadiusReady);
    });

    setTimeout(() => {
        document.body.classList.add('page-loaded');
        rectangle.style.pointerEvents = 'auto';
        rectangle.style.cursor = 'grab';
        document.body.removeAttribute('data-loading');
        document.documentElement.classList.remove('loading');
        document.body.classList.remove('loading');
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.15s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 150);
        }
        
        // S'assurer que l'affichage initial a eu lieu, au cas où l'événement radiusSliderReady n'aurait pas été capturé
        // ou si le slider n'est pas sur la page.
        if (!initialVisualsUpdated) {
            console.warn("Visualizer: radiusSliderReady event not caught in time or slider not present, forcing initial visual setup.");
            setupInitialVisuals();
        }

        setupDragFunctionality();
        setupResizeObserver();
        
        if (typeof ContextMenu !== 'undefined') {
            ContextMenu.init();
        }
        
        const centerBtn = document.getElementById('center-btn');
        if (centerBtn) {
            centerBtn.addEventListener('click', centerArea);
        }
        
        if (toggleGridCheckbox) {
            toggleGridCheckbox.addEventListener('change', throttle(() => {
                backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
            }, 50));
        }
        
        document.addEventListener('tablet:custom', function() {
            if (radiusControlGroup) {
                radiusControlGroup.classList.remove('hidden');
            }
        });

        // Set initial animated transition for the rectangle after all setup
        // Call after a very short delay to ensure styles are settled
        requestAnimationFrame(() => {
             setRectangleToAnimatedTransition();
        });

    }, 300); // Ce timeout agit comme un fallback et un délai pour les transitions CSS.

    // Ensure the container is properly configured for centering
    if (visualContainer) {
        visualContainer.style.display = 'flex';
        visualContainer.style.alignItems = 'center';
        visualContainer.style.justifyContent = 'center';
        visualContainer.classList.add('flex');
    }
    
    // Ensure tablet boundary is properly positioned
    if (tabletBoundary) {
        tabletBoundary.style.position = 'relative';
        tabletBoundary.style.margin = 'auto';
    }
}

// Call init when window loads
window.addEventListener('load', initVisualizer);

/**
 * Test function to verify drag functionality
 */
function testDragFunctionality() {
    console.log('🧪 Testing drag functionality...');
    
    const rect = document.getElementById('rectangle');
    if (!rect) {
        console.error('❌ Rectangle not found');
        return false;
    }
    
    const tests = {
        'Element exists': !!rect,
        'Has grab cursor': rect.style.cursor === 'grab',
        'Pointer events enabled': rect.style.pointerEvents === 'auto',
        'Is visible': rect.style.visibility !== 'hidden' && !rect.classList.contains('invisible'),
        'Has dimensions': rect.style.width && rect.style.height,
        'Has position': rect.style.left !== undefined && rect.style.top !== undefined
    };
    
    console.log('Drag functionality tests:', tests);
    
    const allPassed = Object.values(tests).every(test => test === true);
    console.log(allPassed ? '✅ All drag tests passed' : '❌ Some drag tests failed');
    
    return allPassed;
}

/**
 * Test if drag events are properly attached
 */
function testDragEvents() {
    console.log('Testing drag events...');
    
    const rect = document.getElementById('rectangle');
    if (!rect) {
        console.error('Rectangle not found');
        return false;
    }
    
    // Test drag sequence silently
    const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
    });
    
    rect.dispatchEvent(mouseDownEvent);
    
    setTimeout(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: 110,
            clientY: 110
        });
        
        document.dispatchEvent(mouseMoveEvent);
        
        setTimeout(() => {
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
                clientY: 110
            });
            
            document.dispatchEvent(mouseUpEvent);
            console.log('Drag test completed');
        }, 50);
    }, 50);
    
    return true;
}

/**
 * Force reattach drag events
 */
function forceReattachEvents() {
    console.log('Reattaching drag events...');
    
    // Remove data-loading to ensure events can be attached
    document.body.removeAttribute('data-loading');
    
    // Initialize throttled update function if not already done
    if (!throttledUpdateDisplay && typeof throttle === 'function' && typeof updateDisplay === 'function') {
        throttledUpdateDisplay = throttle(updateDisplay, 16);
    }
    
    // Force setup drag functionality
    setupDragFunctionality();
    
    console.log('✅ Drag events reattached successfully');
}

/**
 * Quick diagnostic function
 */
function quickDragDiagnosis() {
    console.log('Running drag diagnosis...');
    
    const rect = document.getElementById('rectangle');
    const inputs = {
        x: document.getElementById('areaOffsetX'),
        y: document.getElementById('areaOffsetY')
    };
    
    // Quick element check
    const elementsOk = !!rect && !!inputs.x && !!inputs.y;
    
    if (!elementsOk) {
        console.error('Missing required elements');
        return false;
    }
    
    // Check critical functions
    const functionsOk = typeof updateDisplay === 'function' && 
                       typeof throttledUpdateDisplay === 'function';
    
    // Check rectangle state
    const rectOk = rect.style.cursor === 'grab' && 
                   rect.style.pointerEvents === 'auto' &&
                   rect.getBoundingClientRect().width > 0;
    
    // Check loading state
    const notLoading = document.body.getAttribute('data-loading') !== 'true';
    
    const allOk = elementsOk && functionsOk && rectOk && notLoading;
    
    console.log('Diagnosis result:', {
        elements: elementsOk ? '✅' : '❌',
        functions: functionsOk ? '✅' : '❌', 
        rectangle: rectOk ? '✅' : '❌',
        loading: notLoading ? '✅' : '❌',
        overall: allOk ? '✅ Ready' : '❌ Issues found'
    });
    
    return allOk;
}

/**
 * Test complete drag functionality with proper initialization
 */
function testCompleteDrag() {
    console.log('Initializing complete drag functionality...');
    
    // Ensure all functions are properly initialized
    initThrottledFunctions();
    
    // Verify initialization
    const isReady = typeof throttledUpdateDisplay === 'function';
    console.log('Drag system ready:', isReady);
    
    if (isReady) {
        console.log('✅ Drag functionality is now active');
    } else {
        console.error('❌ Failed to initialize drag system');
    }
    
    return isReady;
}

/**
 * Force move rectangle to test positioning
 */
function forceTestMove() {
    console.log('Testing rectangle movement...');
    
    const areaOffsetXInput = document.getElementById('areaOffsetX');
    const areaOffsetYInput = document.getElementById('areaOffsetY');
    
    if (!areaOffsetXInput || !areaOffsetYInput) {
        console.error('Input elements not found');
        return;
    }
    
    // Get current values and move by 10mm
    const currentX = parseFloat(areaOffsetXInput.value);
    const currentY = parseFloat(areaOffsetYInput.value);
    const newX = currentX + 10;
    const newY = currentY + 10;
    
    console.log(`Moving from (${currentX}, ${currentY}) to (${newX}, ${newY})`);
    
    // Update inputs and trigger display update
    areaOffsetXInput.value = newX.toFixed(3);
    areaOffsetYInput.value = newY.toFixed(3);
    
    if (typeof updateDisplay === 'function') {
        updateDisplay();
        console.log('✅ Rectangle moved successfully');
    } else {
        console.error('❌ updateDisplay function not available');
    }
}

// Expose functions globally
window.updateDisplayWithoutRatio = updateDisplayWithoutRatio;
window.centerArea = centerArea;
window.testDragFunctionality = testDragFunctionality;
window.testDragEvents = testDragEvents;
window.forceReattachEvents = forceReattachEvents;
window.quickDragDiagnosis = quickDragDiagnosis;
window.testCompleteDrag = testCompleteDrag;
window.initThrottledFunctions = initThrottledFunctions;
window.forceTestMove = forceTestMove;

