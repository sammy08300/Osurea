/**
 * Tablet area visualizer component
 */

// DOM Elements
const visualContainer = document.getElementById('visual-container');
const tabletBoundary = document.getElementById('tablet-boundary');
const rectangle = document.getElementById('rectangle');
const backgroundGrid = document.getElementById('backgroundGrid');
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox');

// Scaling and display variables
let currentScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;

/**
 * Updates the visual display of the tablet and area
 */
function updateDisplay() {
    const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
    const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
    const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
    const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
    const areaOffsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
    const areaOffsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
    
    if (!isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Calculate tablet boundary display size (fit within container)
    const containerWidth = visualContainer.clientWidth - 40; // Padding
    const containerHeight = visualContainer.clientHeight - 40; // Padding
    
    const tabletRatio = tabletWidth / tabletHeight;
    
    let displayWidth, displayHeight;
    
    if (containerWidth / tabletRatio <= containerHeight) {
        // Width constrained
        displayWidth = containerWidth;
        displayHeight = displayWidth / tabletRatio;
    } else {
        // Height constrained
        displayHeight = containerHeight;
        displayWidth = displayHeight * tabletRatio;
    }
    
    // Update scale for converting mm to px
    currentScale = displayWidth / tabletWidth;
    
    // Update tablet boundary display
    tabletBoundary.style.width = `${displayWidth}px`;
    tabletBoundary.style.height = `${displayHeight}px`;
    
    // Get area rectangle dimensions and position in pixels
    let rectWidth = mmToPx(areaWidth, currentScale);
    let rectHeight = mmToPx(areaHeight, currentScale);
    
    // Get center position and convert to top-left for CSS
    let rectCenterX = mmToPx(areaOffsetX, currentScale);
    let rectCenterY = mmToPx(areaOffsetY, currentScale);
    
    let rectLeft = rectCenterX - rectWidth / 2;
    let rectTop = rectCenterY - rectHeight / 2;
    
    // Update rectangle display
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.left = `${rectLeft}px`;
    rectangle.style.top = `${rectTop}px`;
    
    // Update info displays
    updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY);
    
    // Update grid visibility
    backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
}

/**
 * Update information displays with current dimensions
 */
function updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY) {
    // Tablet info
    const tabletDimensionsInfo = document.getElementById('tablet-dimensions-info');
    const tabletRatioInfo = document.getElementById('tablet-ratio-info');
    
    const tabletRatio = calculateRatio(tabletWidth, tabletHeight);
    
    tabletDimensionsInfo.textContent = `${formatNumber(tabletWidth)} × ${formatNumber(tabletHeight)} mm`;
    tabletRatioInfo.textContent = tabletRatio;
    
    // Area info
    const dimensionsInfo = document.getElementById('dimensions-info');
    const areaInfo = document.getElementById('area-info');
    const ratioInfo = document.getElementById('ratio-info');
    const positionInfo = document.getElementById('position-info');
    
    const areaRatio = calculateRatio(areaWidth, areaHeight);
    const areaSurface = formatNumber(areaWidth * areaHeight);
    
    dimensionsInfo.textContent = `${formatNumber(areaWidth)} × ${formatNumber(areaHeight)} mm`;
    areaInfo.textContent = `${areaSurface} mm²`;
    ratioInfo.textContent = areaRatio;
    positionInfo.textContent = `X: ${formatNumber(areaOffsetX, 3)}, Y: ${formatNumber(areaOffsetY, 3)}`;
}

/**
 * Setup drag functionality for the area rectangle
 */
function setupDragFunctionality() {
    rectangle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Touch support
    rectangle.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleDragEnd);
}

/**
 * Handle start of mouse drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragStart(e) {
    e.preventDefault();
    
    // Check if we're in edit mode
    if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
        appState.cancelEditMode();
    }
    
    isDragging = true;
    rectangle.style.cursor = 'grabbing';
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    dragStartOffsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
    dragStartOffsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
}

/**
 * Handle start of touch drag (continued)
 * @param {TouchEvent} e - Touch event
 */
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        
        // Check if we're in edit mode
        if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
            appState.cancelEditMode();
        }
        
        isDragging = true;
        const touch = e.touches[0];
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        dragStartOffsetX = parseFloatSafe(document.getElementById('areaOffsetX').value);
        dragStartOffsetY = parseFloatSafe(document.getElementById('areaOffsetY').value);
    }
}

/**
 * Handle mouse movement during drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragMove(e) {
    if (!isDragging) return;
    
    const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
    const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
    const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
    const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
    
    // Calculate movement in millimeters
    const deltaXPx = e.clientX - dragStartX;
    const deltaYPx = e.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain to tablet boundaries
    const minX = areaWidth / 2;
    const maxX = tabletWidth - areaWidth / 2;
    const minY = areaHeight / 2;
    const maxY = tabletHeight - areaHeight / 2;
    
    newOffsetX = clamp(newOffsetX, minX, maxX);
    newOffsetY = clamp(newOffsetY, minY, maxY);
    
    // Update inputs
    document.getElementById('areaOffsetX').value = formatNumber(newOffsetX, 3);
    document.getElementById('areaOffsetY').value = formatNumber(newOffsetY, 3);
    
    // Update display
    updateDisplay();
}

/**
 * Handle touch movement during drag
 * @param {TouchEvent} e - Touch event
 */
function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
    const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
    const areaWidth = parseFloatSafe(document.getElementById('areaWidth').value);
    const areaHeight = parseFloatSafe(document.getElementById('areaHeight').value);
    
    // Calculate movement in millimeters
    const deltaXPx = touch.clientX - dragStartX;
    const deltaYPx = touch.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain to tablet boundaries
    const minX = areaWidth / 2;
    const maxX = tabletWidth - areaWidth / 2;
    const minY = areaHeight / 2;
    const maxY = tabletHeight - areaHeight / 2;
    
    newOffsetX = clamp(newOffsetX, minX, maxX);
    newOffsetY = clamp(newOffsetY, minY, maxY);
    
    // Update inputs
    document.getElementById('areaOffsetX').value = formatNumber(newOffsetX, 3);
    document.getElementById('areaOffsetY').value = formatNumber(newOffsetY, 3);
    
    // Update display
    updateDisplay();
}

/**
 * Handle end of drag operation
 */
function handleDragEnd() {
    if (isDragging) {
        isDragging = false;
        rectangle.style.cursor = 'grab';
    }
}

/**
 * Center the active area within the tablet
 */
function centerArea() {
    const tabletWidth = parseFloatSafe(document.getElementById('tabletWidth').value);
    const tabletHeight = parseFloatSafe(document.getElementById('tabletHeight').value);
    
    if (!isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
        Notifications.error('Dimensions de tablette invalides');
        return;
    }
    
    // Set the offsets to the center of the tablet
    document.getElementById('areaOffsetX').value = formatNumber(tabletWidth / 2, 3);
    document.getElementById('areaOffsetY').value = formatNumber(tabletHeight / 2, 3);
    
    updateDisplay();
    Notifications.success('Zone active centrée');
}

/**
 * Setup resize observer to handle container size changes
 */
function setupResizeObserver() {
    const resizeObserver = new ResizeObserver(throttle(() => {
        updateDisplay();
    }, 100));
    
    resizeObserver.observe(visualContainer);
}

/**
 * Initialize the visualizer component
 */
function initVisualizer() {
    setupDragFunctionality();
    setupResizeObserver();
    
    // Setup grid toggle
    toggleGridCheckbox.addEventListener('change', updateDisplay);
    
    // Initialize with default values
    updateDisplay();
}

// Call init when window loads
window.addEventListener('load', initVisualizer);
