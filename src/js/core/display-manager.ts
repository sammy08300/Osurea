/**
 * Display Manager - Centralized display update system
 * Works alongside the existing visualizer.js without replacing it
 */

// Assume Utils is an external library for now, or has a .d.ts file elsewhere.
// For this exercise, we'll treat its methods as `any` if not specifically typed.
import { Utils as ImportedUtils } from '../utils/index.ts';
import { dependencyManager } from './dependency-manager.ts';

// Use 'as any' for Utils if its structure is complex and not defined.
const Utils: any = ImportedUtils;

type UpdateCallback = () => void;

interface InitDependencies {
    [key: string]: any; // Or a more specific type for dependencies
}

interface CurrentDimensions {
    tabletWidth: number;
    tabletHeight: number;
    areaWidth: number;
    areaHeight: number;
    areaOffsetX: number;
    areaOffsetY: number;
    customRatio: number;
}

interface ConstrainedOffsets {
    x: number;
    y: number;
}

export class DisplayManager {
    private isInitialized: boolean;
    private updateCallbacks: Set<UpdateCallback>;
    private debouncedSave: (() => void) | null;
    private throttledUpdate: (() => void) | null;

    constructor() {
        this.isInitialized = false;
        this.updateCallbacks = new Set<UpdateCallback>();
        this.debouncedSave = null;
        this.throttledUpdate = null;
    }

    /**
     * Initialize the display manager
     * @param {Object} dependencies - Required dependencies
     */
    init(dependencies: InitDependencies = {}): void {
        // Register dependencies
        Object.entries(dependencies).forEach(([name, dependency]) => {
            dependencyManager.register(name, dependency, true);
        });

        // Create debounced and throttled functions
        if (Utils.DOM && typeof Utils.DOM.debounce === 'function') {
            this.debouncedSave = Utils.DOM.debounce(() => {
                if (dependencyManager.has('PreferencesManager')) {
                    const preferencesManager = dependencyManager.get('PreferencesManager');
                    if (preferencesManager && typeof preferencesManager.saveCurrentState === 'function') {
                        preferencesManager.saveCurrentState();
                    }
                }
            }, 1000);
        } else {
            console.warn('Utils.DOM.debounce is not available.');
        }

        if (Utils.DOM && typeof Utils.DOM.throttle === 'function') {
            this.throttledUpdate = Utils.DOM.throttle(() => {
                this.update();
            }, 16); // ~60fps
        } else {
            console.warn('Utils.DOM.throttle is not available.');
        }
        this.isInitialized = true;
    }

    /**
     * Register a callback to be called on display updates
     * @param {Function} callback - Callback function
     */
    onUpdate(callback: UpdateCallback): void {
        if (typeof callback === 'function') {
            this.updateCallbacks.add(callback);
        }
    }

    /**
     * Unregister an update callback
     * @param {Function} callback - Callback function to remove
     */
    offUpdate(callback: UpdateCallback): void {
        this.updateCallbacks.delete(callback);
    }

    /**
     * Get current dimensions from form elements
     * @returns {Object} Current dimensions object
     */
    getCurrentDimensions(): CurrentDimensions | null {
        if (!dependencyManager.has('FormManager')) {
            console.error('FormManager dependency not found');
            return null;
        }

        const formManager = dependencyManager.get('FormManager');
        if (!formManager || typeof formManager.getFormElements !== 'function') {
            console.error('FormManager.getFormElements is not available or FormManager is invalid.');
            return null;
        }
        const elements = formManager.getFormElements();
        
        // Assuming elements has .value properties for each form field
        // and Utils.parseFloatSafe is available and correctly typed or handled as 'any'
        return {
            tabletWidth: Utils.parseFloatSafe(elements.tabletWidth?.value),
            tabletHeight: Utils.parseFloatSafe(elements.tabletHeight?.value),
            areaWidth: Utils.parseFloatSafe(elements.areaWidth?.value),
            areaHeight: Utils.parseFloatSafe(elements.areaHeight?.value),
            areaOffsetX: Utils.parseFloatSafe(elements.areaOffsetX?.value),
            areaOffsetY: Utils.parseFloatSafe(elements.areaOffsetY?.value),
            customRatio: Utils.parseFloatSafe(elements.customRatio?.value, 1.0)
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
    getConstrainedOffsets(
        offsetX: number, 
        offsetY: number, 
        isOffsetXFocused: boolean, 
        isOffsetYFocused: boolean, 
        dims: CurrentDimensions | null
    ): ConstrainedOffsets | null {
        if (!dims) {
            console.error("Dimensions not provided for getConstrainedOffsets");
            return null;
        }
        // Assuming Utils.Numbers.constrainAreaOffset is available
        if (Utils.Numbers && typeof Utils.Numbers.constrainAreaOffset === 'function') {
            const constrained = Utils.Numbers.constrainAreaOffset(
                offsetX, offsetY,
                dims.areaWidth, dims.areaHeight,
                dims.tabletWidth, dims.tabletHeight
            );
            return constrained;
        } else {
            console.warn('Utils.Numbers.constrainAreaOffset is not available.');
            return { x: offsetX, y: offsetY }; // Fallback
        }
    }

    /**
     * Update the visual display - delegates to existing visualizer if available
     * @param {Object} options - Update options
     */
    update(options: any = {}): void {
        // If the visualizer's updateDisplay exists, use it
        if (typeof (window as any).updateDisplay === 'function' && (window as any).updateDisplay !== this.update) {
            (window as any).updateDisplay();
            return;
        }

        if (!this.isInitialized) {
            console.warn('DisplayManager not initialized and no visualizer updateDisplay found');
            return;
        }

        // Fallback implementation (basic)
        // Trigger registered callbacks
        this.updateCallbacks.forEach(callback => callback());
        console.log('Using DisplayManager fallback update, triggered callbacks.');
    }

    /**
     * Update display without updating ratio - delegates to existing visualizer if available
     * @param {Object} options - Update options
     */
    updateWithoutRatio(options: any = {}): void {
        // If the visualizer's updateDisplayWithoutRatio exists, use it
        if (typeof (window as any).updateDisplayWithoutRatio === 'function' && (window as any).updateDisplayWithoutRatio !== this.updateWithoutRatio) {
            (window as any).updateDisplayWithoutRatio();
            return;
        }

        // Fallback to regular update
        this.update({ ...options, skipRatioUpdate: true });
    }

    /**
     * Get throttled update function
     * @returns {Function} Throttled update function
     */
    getThrottledUpdate(): (() => void) | null {
        return this.throttledUpdate;
    }

    /**
     * Center the area in the tablet - delegates to existing visualizer if available
     */
    centerArea(): void {
        // If the visualizer's centerArea exists, use it
        if (typeof (window as any).centerArea === 'function') {
            (window as any).centerArea();
            return;
        }

        console.warn('No centerArea function available');
    }

    /**
     * Reset the display manager
     */
    reset(): void {
        this.updateCallbacks.clear();
        this.isInitialized = false;
        // Potentially clear debounced/throttled timers if Utils provide a way
    }
}

// Create and export singleton instance
export const displayManager = new DisplayManager();

// Legacy compatibility - register global functions only if they don't exist
export function registerLegacyGlobals(): void {
    if (typeof (window as any).updateDisplay !== 'function') {
        (window as any).updateDisplay = () => displayManager.update();
    }
    
    if (typeof (window as any).updateDisplayWithoutRatio !== 'function') {
        (window as any).updateDisplayWithoutRatio = () => displayManager.updateWithoutRatio();
    }
}
