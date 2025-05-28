/**
 * Tablet area visualizer component
 */

// Import ContextMenu if it's in a separate module (assuming it will be after conversion)
import ContextMenu from './contextMenu'; 
import { Utils } from '../../utils'; // Import Utils
import { appState } from '../../app'; // Import appState
import { PreferencesManager } from '../../utils/preferences'; // Import PreferencesManager

// Define types for global functions and variables if they exist, or ensure they are imported/defined.
// These are placeholders and should be adjusted based on actual definitions.
/*
declare function parseFloatSafe(value: string | undefined): number;
declare function isValidNumber(value: number, minValue?: number): boolean;
declare function formatNumber(value: number, precision: number): string;
declare function mmToPx(value: number, scale: number): number;
declare function pxToMm(value: number, scale: number): number;
declare function constrainAreaOffset(offsetX: number, offsetY: number, areaWidth: number, areaHeight: number, tabletWidth: number, tabletHeight: number): { x: number; y: number };
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T;
declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T;

declare const DECIMAL_PRECISION_POSITION: number; // Assuming this is a global constant

// Define type for appState if it exists globally
interface AppState {
    currentRatio?: number;
    debouncedUpdateRatio?: () => void;
}
declare const appState: AppState | undefined;

// Define type for PreferencesManager if it exists globally
interface PreferencesManagerType { // Renamed to avoid conflict with imported const
    saveCurrentState: () => void;
}
declare const PreferencesManager: PreferencesManagerType | undefined;
*/

// DOM Elements
const visualContainer = document.getElementById('visual-container') as HTMLElement | null;
const tabletBoundary = document.getElementById('tablet-boundary') as HTMLElement | null;
const rectangle = document.getElementById('rectangle') as HTMLElement | null;
const backgroundGrid = document.getElementById('backgroundGrid') as HTMLElement | null;
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox') as HTMLInputElement | null;
const radiusControlGroup = document.getElementById('radius-control-group') as HTMLElement | null;

interface CachedElements {
    customRatioInput: HTMLInputElement | null;
    lockRatioCheckbox: HTMLInputElement | null;
    tabletWidthInput: HTMLInputElement | null;
    tabletHeightInput: HTMLInputElement | null;
    areaWidthInput: HTMLInputElement | null;
    areaHeightInput: HTMLInputElement | null;
    areaOffsetXInput: HTMLInputElement | null;
    areaOffsetYInput: HTMLInputElement | null;
}

// Cache of frequently used DOM elements 
const cachedElements: CachedElements = { 
    customRatioInput: document.getElementById('customRatio') as HTMLInputElement | null,
    lockRatioCheckbox: document.getElementById('lockRatio') as HTMLInputElement | null,
    tabletWidthInput: document.getElementById('tabletWidth') as HTMLInputElement | null,
    tabletHeightInput: document.getElementById('tabletHeight') as HTMLInputElement | null,
    areaWidthInput: document.getElementById('areaWidth') as HTMLInputElement | null,
    areaHeightInput: document.getElementById('areaHeight') as HTMLInputElement | null,
    areaOffsetXInput: document.getElementById('areaOffsetX') as HTMLInputElement | null,
    areaOffsetYInput: document.getElementById('areaOffsetY') as HTMLInputElement | null
};

// State variables
let currentScale: number = 1;
let isDragging: boolean = false;
let dragStartX: number = 0;
let dragStartY: number = 0;
let dragStartOffsetX: number = 0;
let dragStartOffsetY: number = 0;
let containerSize: { width: number; height: number } = { width: 0, height: 0 };
let tabletSize: { width: number; height: number } = { width: 0, height: 0 };
const containerPadding: number = 40;

// Throttled update function will be defined after updateDisplay function
let throttledUpdateDisplay: (() => void) | undefined;

// Define the standard animated transition for the rectangle
const RECTANGLE_ANIMATED_TRANSITION: string = 'width var(--transition-fast), height var(--transition-fast), border-radius 0.25s ease-out, left 0.2s ease-out, top 0.2s ease-out';

/**
 * Helper function to apply animated transition to the rectangle
 */
function setRectangleToAnimatedTransition(): void {
    if (rectangle) {
        if (!rectangle.classList.contains('dragging')) {
            rectangle.style.transition = RECTANGLE_ANIMATED_TRANSITION;
        }
    }
}

/**
 * Updates the container size when it changes
 */
function updateContainerSize(): void {
    if (visualContainer) {
        containerSize.width = visualContainer.clientWidth - containerPadding;
        containerSize.height = visualContainer.clientHeight - containerPadding;
    }
}

interface Dimensions {
    tabletWidth: number;
    tabletHeight: number;
    areaWidth: number;
    areaHeight: number;
    areaOffsetX: number;
    areaOffsetY: number;
}
/**
 * Gets current tablet and area dimensions
 */
function getCurrentDimensions(): Dimensions {
    return {
        tabletWidth: Utils.parseFloatSafe(cachedElements.tabletWidthInput?.value),
        tabletHeight: Utils.parseFloatSafe(cachedElements.tabletHeightInput?.value),
        areaWidth: Utils.parseFloatSafe(cachedElements.areaWidthInput?.value),
        areaHeight: Utils.parseFloatSafe(cachedElements.areaHeightInput?.value),
        areaOffsetX: Utils.parseFloatSafe(cachedElements.areaOffsetXInput?.value),
        areaOffsetY: Utils.parseFloatSafe(cachedElements.areaOffsetYInput?.value)
    };
}

/**
 * Updates display sizes based on dimensions
 */
function updateDisplaySizes(tabletWidth: number, tabletHeight: number): { displayWidth: number; displayHeight: number } {
    if (containerSize.width === 0 && visualContainer) {
        updateContainerSize();
    }
    
    const tabletRatio = tabletWidth / tabletHeight;
    
    let displayWidth: number, displayHeight: number;
    
    if (containerSize.width / tabletRatio <= containerSize.height) {
        displayWidth = containerSize.width;
        displayHeight = displayWidth / tabletRatio;
    } else {
        displayHeight = containerSize.height;
        displayWidth = displayHeight * tabletRatio;
    }
    
    currentScale = displayWidth / tabletWidth;
    
    if (tabletBoundary) {
        tabletBoundary.style.width = `${displayWidth}px`;
        tabletBoundary.style.height = `${displayHeight}px`;
    }
    
    return { displayWidth, displayHeight };
}

/**
 * Updates rectangle display
 */
function updateRectangleDisplay(areaWidth: number, areaHeight: number, areaOffsetX: number, areaOffsetY: number): void {
    if (!rectangle || !tabletBoundary) return;

    const currentAreaRadiusForDebug = document.getElementById('areaRadius') as HTMLInputElement | null; // DEBUG STEP 3
    console.log('updateRectangleDisplay called. Radius value from #areaRadius:', currentAreaRadiusForDebug?.value); // DEBUG STEP 3

    const rectWidth = Utils.mmToPx(areaWidth, currentScale);
    const rectHeight = Utils.mmToPx(areaHeight, currentScale);
    
    const rectLeft = Utils.mmToPx(areaOffsetX, currentScale) - rectWidth / 2;
    const rectTop = Utils.mmToPx(areaOffsetY, currentScale) - rectHeight / 2;
    
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.left = `${rectLeft}px`;
    rectangle.style.top = `${rectTop}px`;
    rectangle.style.transform = 'none'; 
    
    rectangle.style.visibility = 'visible';
    rectangle.style.opacity = '1';
    
    const currentAreaRadiusInput = document.getElementById('areaRadius') as HTMLInputElement | null;
    let radiusValue = parseInt(currentAreaRadiusInput?.value || '0');
    
    let borderRadius: string;
    if (radiusValue === 0) {
        borderRadius = '0px';
    } else if (radiusValue === 100) {
        borderRadius = `${Math.min(rectWidth, rectHeight) / 2}px`;
    } else {
        const maxRadius = Math.min(rectWidth, rectHeight) / 2;
        borderRadius = `${maxRadius * (radiusValue / 100)}px`;
    }
    
    rectangle.style.setProperty('--dynamic-border-radius', borderRadius);
}

/**
 * Handle first render operations
 */
function handleFirstRender(): void {
    requestAnimationFrame(() => {
        const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.15s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 150);
        }
        
        if (rectangle) {
            if (rectangle.classList.contains('invisible')) {
                rectangle.classList.remove('invisible');
            }
            rectangle.style.visibility = 'visible';
            rectangle.style.opacity = '1';
            rectangle.style.pointerEvents = 'auto';
            rectangle.style.cursor = 'grab';
        }
    });
}

// Attach debouncedSave to updateDisplay if needed, or manage separately
// This might be better as a standalone debounced function if PreferencesManager is available
let debouncedSaveState: (() => void) | undefined;

/**
 * Save current state with debounce
 */
function saveCurrentState(): void {
    if (typeof PreferencesManager !== 'undefined' && typeof Utils.DOM.debounce === 'function') {
        if (!debouncedSaveState) {
            debouncedSaveState = Utils.DOM.debounce(() => {
                PreferencesManager.saveCurrentState();
            }, 1000);
        }
        debouncedSaveState();
    }
}

/**
 * Get constrained offsets if needed
 */
function getConstrainedOffsets(
    areaOffsetX: number, 
    areaOffsetY: number, 
    isOffsetXFocused: boolean, 
    isOffsetYFocused: boolean, 
    dims: Dimensions
): { x: number; y: number } {
    if (isOffsetXFocused && cachedElements.areaOffsetXInput?.value.trim() === '') {
        areaOffsetX = dims.tabletWidth / 2;
    }
    
    if (isOffsetYFocused && cachedElements.areaOffsetYInput?.value.trim() === '') {
        areaOffsetY = dims.tabletHeight / 2;
    }
    
    if (!isOffsetXFocused && !isOffsetYFocused) {
        return Utils.constrainAreaOffset(
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
function updateDisplay(): void {
    if (!cachedElements.tabletWidthInput || !cachedElements.tabletHeightInput || !cachedElements.areaOffsetXInput || !cachedElements.areaOffsetYInput || !toggleGridCheckbox || !backgroundGrid ) return;

    const dims = getCurrentDimensions();
    
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    if (!Utils.isValidNumber(dims.tabletWidth, 10) || !Utils.isValidNumber(dims.tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    const constrainedOffsets = getConstrainedOffsets(
        dims.areaOffsetX, 
        dims.areaOffsetY, 
        isOffsetXFocused, 
        isOffsetYFocused, 
        dims
    );
    
    if (!isOffsetXFocused && constrainedOffsets.x !== dims.areaOffsetX) {
        cachedElements.areaOffsetXInput.value = Utils.formatNumber(constrainedOffsets.x, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused && constrainedOffsets.y !== dims.areaOffsetY) {
        cachedElements.areaOffsetYInput.value = Utils.formatNumber(constrainedOffsets.y, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    dims.areaOffsetX = constrainedOffsets.x;
    dims.areaOffsetY = constrainedOffsets.y;
    
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    if (tabletSize.width !== dims.tabletWidth || tabletSize.height !== dims.tabletHeight) {
        tabletSize.width = dims.tabletWidth;
        tabletSize.height = dims.tabletHeight;
    }
    
    updateDisplaySizes(dims.tabletWidth, dims.tabletHeight);
    updateRectangleDisplay(dims.areaWidth, dims.areaHeight, dims.areaOffsetX, dims.areaOffsetY);
    updateInfoDisplays(dims);
    
    const showGrid = toggleGridCheckbox.checked;
    if (backgroundGrid.classList.contains('hidden') === showGrid) {
        backgroundGrid.classList.toggle('hidden', !showGrid);
    }
    
    if (isFirstRender) {
        handleFirstRender();
    } else {
        saveCurrentState();
    }
}

if (typeof Utils.DOM.throttle === 'function') {
    throttledUpdateDisplay = Utils.DOM.throttle(updateDisplay, 16); // ~60fps
}

/**
 * Update information displays with current dimensions
 */
function updateInfoDisplays(dims: Dimensions): void {
    const { customRatioInput, lockRatioCheckbox } = cachedElements;
    
    if (!customRatioInput || !lockRatioCheckbox) return;

    const isLocked = lockRatioCheckbox.getAttribute('aria-pressed') === 'true';
    
    if (isLocked) {
        if (!customRatioInput.matches(':focus') && !(customRatioInput as any).dataset?.editing) {
            const newRatio = Utils.formatNumber(dims.areaWidth / dims.areaHeight, 3);
            if (customRatioInput.value !== newRatio) {
                customRatioInput.value = newRatio;
                if (appState) {
                    appState.currentRatio = dims.areaWidth / dims.areaHeight;
                }
            }
        }
    } else if (appState?.debouncedUpdateRatio) {
        appState.debouncedUpdateRatio();
    }
}

let debouncedSaveStateWithoutRatio: (() => void) | undefined;

/**
 * Update the display without updating the ratio
 */
function updateDisplayWithoutRatio(): void {
    const dims = getCurrentDimensions();
    
    if (!Utils.isValidNumber(dims.tabletWidth, 10) || !Utils.isValidNumber(dims.tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    if (tabletSize.width !== dims.tabletWidth || tabletSize.height !== dims.tabletHeight) {
        tabletSize.width = dims.tabletWidth;
        tabletSize.height = dims.tabletHeight;
    }
    
    updateDisplaySizes(dims.tabletWidth, dims.tabletHeight);
    updateRectangleDisplay(dims.areaWidth, dims.areaHeight, dims.areaOffsetX, dims.areaOffsetY);
    updateInfoDisplaysWithoutRatio(dims);
    
    if (isFirstRender) {
        handleFirstRender();
    } else {
        if (typeof PreferencesManager !== 'undefined' && typeof Utils.DOM.debounce === 'function') {
            if (!debouncedSaveStateWithoutRatio) {
                debouncedSaveStateWithoutRatio = Utils.DOM.debounce(() => {
                    PreferencesManager.saveCurrentState();
                }, 1000);
            }
            debouncedSaveStateWithoutRatio();
        }
    }
}

/**
 * Update information displays with current dimensions without updating the ratio input
 */
function updateInfoDisplaysWithoutRatio(dims: Dimensions): void {
    // Placeholder
}

/**
 * Setup drag functionality for the area rectangle
 */
function setupDragFunctionality(): void {
    if (!rectangle) return;

    if (document.body.getAttribute('data-loading') === 'true') {
        return;
    }
    
    rectangle.removeEventListener('mousedown', handleDragStart as EventListener);
    document.removeEventListener('mousemove', handleDragMove as EventListener);
    document.removeEventListener('mouseup', handleDragEnd as EventListener);
    rectangle.removeEventListener('touchstart', handleTouchStart as EventListener);
    document.removeEventListener('touchmove', handleTouchMove as EventListener);
    document.removeEventListener('touchend', handleDragEnd as EventListener);
    
    rectangle.addEventListener('mousedown', handleDragStart as EventListener);
    document.addEventListener('mousemove', handleDragMove as EventListener);
    document.addEventListener('mouseup', handleDragEnd as EventListener);
    
    rectangle.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    document.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    document.addEventListener('touchend', handleDragEnd as EventListener);
    
    rectangle.style.cursor = 'grab';
    rectangle.style.pointerEvents = 'auto';
}

/**
 * Handle start of mouse drag
 */
function handleDragStart(e: MouseEvent): void {
    if (!cachedElements.areaOffsetXInput || !cachedElements.areaOffsetYInput || !rectangle) return;
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = Utils.parseFloatSafe(cachedElements.areaOffsetXInput.value);
    dragStartOffsetY = Utils.parseFloatSafe(cachedElements.areaOffsetYInput.value);
    rectangle.style.cursor = 'grabbing';
}

/**
 * Handle start of touch drag
 */
function handleTouchStart(e: TouchEvent): void {
    if (!cachedElements.areaOffsetXInput || !cachedElements.areaOffsetYInput) return;
    if (e.touches.length === 1) {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        dragStartOffsetX = Utils.parseFloatSafe(cachedElements.areaOffsetXInput.value);
        dragStartOffsetY = Utils.parseFloatSafe(cachedElements.areaOffsetYInput.value);
    }
}

/**
 * Handle movement during drag (mouse or touch)
 */
function handleMovement(clientX: number, clientY: number): void {
    if (!isDragging || !cachedElements.areaOffsetXInput || !cachedElements.areaOffsetYInput) return;
    
    const dims = getCurrentDimensions();
    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    const deltaXPx = clientX - dragStartX;
    const deltaYPx = clientY - dragStartY;
    
    const deltaXMm = Utils.pxToMm(deltaXPx, currentScale);
    const deltaYMm = Utils.pxToMm(deltaYPx, currentScale);
    
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    const constrainedOffsets = Utils.constrainAreaOffset(
        newOffsetX, 
        newOffsetY, 
        dims.areaWidth, 
        dims.areaHeight, 
        dims.tabletWidth, 
        dims.tabletHeight
    );
    
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = Utils.formatNumber(constrainedOffsets.x, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = Utils.formatNumber(constrainedOffsets.y, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    if (throttledUpdateDisplay) {
        throttledUpdateDisplay();
    } else {
        updateDisplay();
    }
}

/**
 * Handle mouse movement during drag
 */
function handleDragMove(e: MouseEvent): void {
    handleMovement(e.clientX, e.clientY);
}

/**
 * Handle touch movement during drag
 */
function handleTouchMove(e: TouchEvent): void {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleMovement(touch.clientX, touch.clientY);
}

/**
 * Handle the end of drag operation
 */
function handleDragEnd(): void {
    if (!isDragging) return;
    isDragging = false;

    if (!document.body.classList.contains('page-loaded')) {
        document.body.classList.add('page-loaded');
    }
    
    setRectangleToAnimatedTransition();
    updateDisplay();
    
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 50);
    }
    
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
function centerArea(): void {
    if (!cachedElements.areaOffsetXInput || !cachedElements.areaOffsetYInput) return;
    const dims = getCurrentDimensions();
    
    if (dims.tabletWidth <= 0 || dims.tabletHeight <= 0) return;
    
    setRectangleToAnimatedTransition();

    const isOffsetXFocused = document.activeElement === cachedElements.areaOffsetXInput;
    const isOffsetYFocused = document.activeElement === cachedElements.areaOffsetYInput;
    
    if (!isOffsetXFocused) {
        cachedElements.areaOffsetXInput.value = Utils.formatNumber(dims.tabletWidth / 2, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    if (!isOffsetYFocused) {
        cachedElements.areaOffsetYInput.value = Utils.formatNumber(dims.tabletHeight / 2, Utils.DECIMAL_PRECISION_POSITION);
    }
    
    updateDisplay();
    
    if (typeof PreferencesManager !== 'undefined') {
        setTimeout(() => PreferencesManager.saveCurrentState(), 100);
    }
    
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
function setupResizeObserver(): void {
    if (!visualContainer) return;
    const resizeObserver = new ResizeObserver(Utils.DOM.throttle(() => {
        updateContainerSize();
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
function initThrottledFunctions(): void {
    if (!throttledUpdateDisplay && typeof Utils.DOM.throttle === 'function') {
        throttledUpdateDisplay = Utils.DOM.throttle(updateDisplay, 16);
    }
}

/**
 * Initialize the visualizer
 */
function initVisualizer(): void {
    if (!visualContainer || !tabletBoundary || !rectangle || !toggleGridCheckbox || !backgroundGrid) {
        console.error('Visualizer elements not found');
        return;
    }
    
    document.body.setAttribute('data-loading', 'true');
    rectangle.style.pointerEvents = 'none';
    initThrottledFunctions();
    
    let initialVisualsUpdated = false;

    function setupInitialVisuals(): void {
        if (initialVisualsUpdated) return;
        console.log("Visualizer: Setting up initial visuals.");
        updateContainerSize();
        updateDisplay();
        initialVisualsUpdated = true;
    }

    document.addEventListener('radiusSliderReady', function handleRadiusReady(event: Event) {
        console.log('Visualizer: Event radiusSliderReady received', (event as CustomEvent).detail);
        setupInitialVisuals();

        const areaRadiusInput = document.getElementById('areaRadius') as HTMLInputElement | null;
        if (areaRadiusInput) {
            const listener = function(this: HTMLInputElement) {
                console.log('Input event on #areaRadius in visualizer.js (from radiusSliderReady handler), value:', this.value);
                updateDisplay();
            };
            if ((areaRadiusInput as any)._visualizerInputListener) {
                areaRadiusInput.removeEventListener('input', (areaRadiusInput as any)._visualizerInputListener);
            }
            (areaRadiusInput as any)._visualizerInputListener = listener;
            areaRadiusInput.addEventListener('input', listener);
            console.log('Visualizer: Attached input listener to #areaRadius.');
        } else {
            console.warn('Visualizer: #areaRadius element not found when radiusSliderReady was received.');
        }
    });

    setTimeout(() => {
        document.body.classList.add('page-loaded');
        if (rectangle) {
            rectangle.style.pointerEvents = 'auto';
            rectangle.style.cursor = 'grab';
        }
        document.body.removeAttribute('data-loading');
        document.documentElement.classList.remove('loading');
        document.body.classList.remove('loading');
        
        const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement | null;
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.15s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 150);
        }
        
        if (!initialVisualsUpdated) {
            console.warn("Visualizer: radiusSliderReady event not caught in time or slider not present, forcing initial visual setup.");
            setupInitialVisuals();
        }

        setupDragFunctionality();
        setupResizeObserver();
        
        if (typeof ContextMenu !== 'undefined') {
            ContextMenu.init();
        }
        
        const centerBtn = document.getElementById('center-btn') as HTMLButtonElement | null;
        if (centerBtn) {
            centerBtn.addEventListener('click', centerArea);
        }
        
        if (toggleGridCheckbox && backgroundGrid) {
            toggleGridCheckbox.addEventListener('change', Utils.DOM.throttle(() => {
                backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
            }, 50));
        }
        
        document.addEventListener('tablet:custom', function() {
            if (radiusControlGroup) {
                radiusControlGroup.classList.remove('hidden');
            }
        });

        requestAnimationFrame(() => {
             setRectangleToAnimatedTransition();
        });

    }, 300);

    if (visualContainer) {
        visualContainer.style.display = 'flex';
        visualContainer.style.alignItems = 'center';
        visualContainer.style.justifyContent = 'center';
        visualContainer.classList.add('flex');
    }
    
    if (tabletBoundary) {
        tabletBoundary.style.position = 'relative';
        tabletBoundary.style.margin = 'auto';
    }
}

window.addEventListener('load', initVisualizer);

// Expose functions globally for testing or legacy access. Consider reducing global scope.
interface Window {
    updateDisplayWithoutRatio?: () => void;
    centerArea?: () => void;
    testDragFunctionality?: () => boolean;
    testDragEvents?: () => boolean;
    forceReattachEvents?: () => void;
    quickDragDiagnosis?: () => boolean;
    testCompleteDrag?: () => boolean;
    initThrottledFunctions?: () => void;
    forceTestMove?: () => void;
    updateDisplay?: () => void; // Assuming updateDisplay might be globally accessed too
}

(window as Window).updateDisplayWithoutRatio = updateDisplayWithoutRatio;
(window as Window).centerArea = centerArea;
(window as Window).updateDisplay = updateDisplay; // Expose updateDisplay if it's called globally, e.g. from HTML


// Test functions (can be removed in production)
function testDragFunctionality(): boolean {
    console.log('🧪 Testing drag functionality...');
    const rect = document.getElementById('rectangle') as HTMLElement | null;
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
(window as Window).testDragFunctionality = testDragFunctionality;

function testDragEvents(): boolean {
    console.log('Testing drag events...');
    const rect = document.getElementById('rectangle') as HTMLElement | null;
    if (!rect) {
        console.error('Rectangle not found');
        return false;
    }
    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
    rect.dispatchEvent(mouseDownEvent);
    setTimeout(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 110, clientY: 110 });
        document.dispatchEvent(mouseMoveEvent);
        setTimeout(() => {
            const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 110, clientY: 110 });
            document.dispatchEvent(mouseUpEvent);
            console.log('Drag test completed');
        }, 50);
    }, 50);
    return true;
}
(window as Window).testDragEvents = testDragEvents;

function forceReattachEvents(): void {
    console.log('Reattaching drag events...');
    document.body.removeAttribute('data-loading');
    initThrottledFunctions();
    setupDragFunctionality();
    console.log('✅ Drag events reattached successfully');
}
(window as Window).forceReattachEvents = forceReattachEvents;

function quickDragDiagnosis(): boolean {
    console.log('Running drag diagnosis...');
    const rect = document.getElementById('rectangle') as HTMLElement | null;
    const inputs = {
        x: document.getElementById('areaOffsetX') as HTMLInputElement | null,
        y: document.getElementById('areaOffsetY') as HTMLInputElement | null
    };
    const elementsOk = !!rect && !!inputs.x && !!inputs.y;
    if (!elementsOk) {
        console.error('Missing required elements');
        return false;
    }
    const functionsOk = typeof updateDisplay === 'function' && typeof throttledUpdateDisplay === 'function';
    const rectOk = rect.style.cursor === 'grab' && rect.style.pointerEvents === 'auto' && rect.getBoundingClientRect().width > 0;
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
(window as Window).quickDragDiagnosis = quickDragDiagnosis;

function testCompleteDrag(): boolean {
    console.log('Initializing complete drag functionality...');
    initThrottledFunctions();
    const isReady = typeof throttledUpdateDisplay === 'function';
    console.log('Drag system ready:', isReady);
    if (isReady) {
        console.log('✅ Drag functionality is now active');
    } else {
        console.error('❌ Failed to initialize drag system');
    }
    return isReady;
}
(window as Window).testCompleteDrag = testCompleteDrag;
(window as Window).initThrottledFunctions = initThrottledFunctions;

function forceTestMove(): void {
    console.log('Testing rectangle movement...');
    const areaOffsetXInput = document.getElementById('areaOffsetX') as HTMLInputElement | null;
    const areaOffsetYInput = document.getElementById('areaOffsetY') as HTMLInputElement | null;
    if (!areaOffsetXInput || !areaOffsetYInput) {
        console.error('Input elements not found');
        return;
    }
    const currentX = parseFloat(areaOffsetXInput.value);
    const currentY = parseFloat(areaOffsetYInput.value);
    const newX = currentX + 10;
    const newY = currentY + 10;
    console.log(`Moving from (${currentX}, ${currentY}) to (${newX}, ${newY})`);
    areaOffsetXInput.value = newX.toFixed(3);
    areaOffsetYInput.value = newY.toFixed(3);
    if (typeof updateDisplay === 'function') {
        updateDisplay();
        console.log('✅ Rectangle moved successfully');
    } else {
        console.error('❌ updateDisplay function not available');
    }
}
(window as Window).forceTestMove = forceTestMove;

export {}; // Add this line to make it a module if there are no other exports
