/**
 * Display Manager - Centralized display update system
 * Works alongside the existing visualizer.js without replacing it
 */

import { Utils } from '../utils/index.js';
import { dependencyManager } from './dependency-manager.js';

export class DisplayManager {
    constructor() {
        this.isInitialized = false;
        this.updateCallbacks = new Set();
        this.debouncedSave = null;
        this.throttledUpdate = null;
    }

    /**
     * Initialize the display manager
     * @param {Object} dependencies - Required dependencies
     */
    init(dependencies = {}) {
        // Register dependencies
        Object.entries(dependencies).forEach(([name, dependency]) => {
            dependencyManager.register(name, dependency, true);
        });

        // Create debounced and throttled functions
        this.debouncedSave = Utils.Performance.debounce(() => {
            if (dependencyManager.has('PreferencesManager')) {
                const preferencesManager = dependencyManager.get('PreferencesManager');
                if (preferencesManager.saveCurrentState) {
                    preferencesManager.saveCurrentState();
                }
            }
        }, 1000);

        this.throttledUpdate = Utils.Performance.throttle(() => {
            this.update();
        }, 16); // ~60fps

        this.isInitialized = true;
    }

    /**
     * Register a callback to be called on display updates
     * @param {Function} callback - Callback function
     */
    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.add(callback);
        }
    }

    /**
     * Unregister an update callback
     * @param {Function} callback - Callback function to remove
     */
    offUpdate(callback) {
        this.updateCallbacks.delete(callback);
    }

    /**
     * Get current dimensions from form elements
     * @returns {Object} Current dimensions object
     */
    getCurrentDimensions() {
        if (!dependencyManager.has('FormManager')) {
            throw new Error('FormManager dependency not found');
        }

        const formManager = dependencyManager.get('FormManager');
        const elements = formManager.getFormElements();

        return {
            tabletWidth: Utils.parseFloatSafe(elements.tabletWidth.value),
            tabletHeight: Utils.parseFloatSafe(elements.tabletHeight.value),
            areaWidth: Utils.parseFloatSafe(elements.areaWidth.value),
            areaHeight: Utils.parseFloatSafe(elements.areaHeight.value),
            areaOffsetX: Utils.parseFloatSafe(elements.areaOffsetX.value),
            areaOffsetY: Utils.parseFloatSafe(elements.areaOffsetY.value),
            customRatio: Utils.parseFloatSafe(elements.customRatio.value, 1.0)
        };
    }

    /**
     * Get constrained offsets to keep area within tablet bounds
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     * @param {boolean} isOffsetXFocused - Whether X input is focused
     * @param {boolean} isOffsetYFocused - Whether Y input is focused
     * @param {Object} dims - Current dimensions
     * @returns {Object} Constrained offsets {x, y}
     */
    getConstrainedOffsets(offsetX, offsetY, isOffsetXFocused, isOffsetYFocused, dims) {
        // Use the utility function for constraint calculation
        const constrained = Utils.Number.constrainAreaOffset(
            offsetX, offsetY,
            dims.areaWidth, dims.areaHeight,
            dims.tabletWidth, dims.tabletHeight
        );

        return constrained;
    }

    /**
     * Update the visual display - delegates to existing visualizer if available
     * @param {Object} options - Update options
     */
    update(options = {}) {
        // If the visualizer's updateDisplay exists, use it
        if (typeof window.updateDisplay === 'function' && window.updateDisplay !== this.update) {
            window.updateDisplay();
            return;
        }

        if (!this.isInitialized) {
            console.warn('DisplayManager not initialized and no visualizer updateDisplay found');
            return;
        }

        // Fallback implementation (basic)
        console.log('Using DisplayManager fallback update');
    }

    /**
     * Update display without updating ratio - delegates to existing visualizer if available
     * @param {Object} options - Update options
     */
    updateWithoutRatio(options = {}) {
        // If the visualizer's updateDisplayWithoutRatio exists, use it
        if (typeof window.updateDisplayWithoutRatio === 'function' && window.updateDisplayWithoutRatio !== this.updateWithoutRatio) {
            window.updateDisplayWithoutRatio();
            return;
        }

        // Fallback to regular update
        this.update({ ...options, skipRatioUpdate: true });
    }

    /**
     * Get throttled update function
     * @returns {Function} Throttled update function
     */
    getThrottledUpdate() {
        return this.throttledUpdate;
    }

    /**
     * Center the area in the tablet - delegates to existing visualizer if available
     */
    centerArea() {
        // If the visualizer's centerArea exists, use it
        if (typeof window.centerArea === 'function') {
            window.centerArea();
            return;
        }

        console.warn('No centerArea function available');
    }

    /**
     * Reset the display manager
     */
    reset() {
        this.updateCallbacks.clear();
        this.isInitialized = false;
    }
}

// Create and export singleton instance
export const displayManager = new DisplayManager();

// Legacy compatibility - register global functions only if they don't exist
export function registerLegacyGlobals() {
    if (typeof window.updateDisplay !== 'function') {
        window.updateDisplay = () => displayManager.update();
    }
    
    if (typeof window.updateDisplayWithoutRatio !== 'function') {
        window.updateDisplayWithoutRatio = () => displayManager.updateWithoutRatio();
    }
} 