/**
 * Form Manager module for handling form elements and their events
 */
import { DOMUtils } from '../utils/dom-utils.js';
import { NumberUtils } from '../utils/number-utils.js';
import { translateWithFallback } from '../i18n-init.js';

export const FormManager = {
    appState: null,
    
    /**
     * Initialize form manager
     * @param {Object} appState - Application state reference
     */
    init(appState) {
        this.appState = appState;
        this.setupTabletDimensionInputs();
        this.setupAreaDimensionInputs();
        this.setupRatioHandling();
        this.setupOffsetInputs();
    },
    
    /**
     * Get all form elements
     * @returns {Object} Object containing form elements
     */
    getFormElements() {
        return {
            // Tablet dimensions
            tabletWidth: document.getElementById('tabletWidth'),
            tabletHeight: document.getElementById('tabletHeight'),
            tabletSelector: document.getElementById('tabletSelectorButton'),
            tabletSelectorText: document.getElementById('tabletSelectorText'),
            
            // Area dimensions
            areaWidth: document.getElementById('areaWidth'),
            areaHeight: document.getElementById('areaHeight'),
            customRatio: document.getElementById('customRatio'),
            lockRatio: document.getElementById('lockRatio'),
            
            // Area position
            areaOffsetX: document.getElementById('areaOffsetX'),
            areaOffsetY: document.getElementById('areaOffsetY'),
            
            // Additional elements
            areaRadius: document.getElementById('areaRadius'),
            tabletDimensionsContainer: document.getElementById('tablet-dimensions-container')
        };
    },
    
    /**
     * Get form values as numbers
     * @returns {Object} Object containing form values
     */
    getFormValues() {
        const elements = this.getFormElements();
        let presetInfo = null;
        
        // Get preset info
        if (elements.tabletSelectorText) {
            if (elements.tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + elements.tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = elements.tabletSelectorText.textContent;
            }
        }
        
        return {
            tabletWidth: parseFloat(elements.tabletWidth?.value),
            tabletHeight: parseFloat(elements.tabletHeight?.value),
            areaWidth: parseFloat(elements.areaWidth?.value),
            areaHeight: parseFloat(elements.areaHeight?.value),
            areaOffsetX: parseFloat(elements.areaOffsetX?.value),
            areaOffsetY: parseFloat(elements.areaOffsetY?.value),
            customRatio: parseFloat(elements.customRatio?.value),
            areaRadius: parseInt(elements.areaRadius?.value) || 0,
            presetInfo: presetInfo
        };
    },
    
    /**
     * Set up tablet dimension input event listeners
     */
    setupTabletDimensionInputs() {
        const elements = this.getFormElements();
        
        // Common handler for both tablet width and height inputs
        const handleTabletDimensionInput = () => {
            // Update the text of the selector
            if (elements.tabletSelectorText) {
                elements.tabletSelectorText.textContent = translateWithFallback('tablet.customDimensions');
                elements.tabletSelectorText.title = translateWithFallback('tablet.customDimensions');
            }
            
            // Ensure the dimensions container is visible
            if (elements.tabletDimensionsContainer) {
                elements.tabletDimensionsContainer.classList.remove('hidden');
            }
            
            // Cancel edit mode if active
            if (this.appState) {
                this.appState.cancelEditMode();
            }
            
            // Update display
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        };
        
        // Add event listeners
        if (elements.tabletWidth) {
            elements.tabletWidth.addEventListener('input', handleTabletDimensionInput);
        }
        
        if (elements.tabletHeight) {
            elements.tabletHeight.addEventListener('input', handleTabletDimensionInput);
        }
    },
    
    /**
     * Set up area dimension input event listeners
     */
    setupAreaDimensionInputs() {
        const elements = this.getFormElements();
        
        if (elements.areaWidth) {
            elements.areaWidth.addEventListener('input', () => {
                if (this.appState && !this.appState.editingFavoriteId) {
                    this.appState.cancelEditMode();
                }
                
                // Get the tablet and active area dimensions
                const tabletWidth = NumberUtils.parseFloatSafe(elements.tabletWidth.value);
                const tabletHeight = NumberUtils.parseFloatSafe(elements.tabletHeight.value);
                const areaWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
                
                // Constrain the active area width
                const constrainedWidth = Math.min(areaWidth, tabletWidth);
                if (constrainedWidth !== areaWidth) {
                    elements.areaWidth.value = NumberUtils.formatNumber(constrainedWidth);
                }
                
                // Only update the height if the ratio is locked
                if (elements.lockRatio && elements.lockRatio.getAttribute('aria-pressed') === 'true' && 
                    this.appState && this.appState.currentRatio > 0 && !isNaN(this.appState.currentRatio)) {
                    let newHeight = constrainedWidth / this.appState.currentRatio;
                    
                    // Constrain also the height
                    newHeight = Math.min(newHeight, tabletHeight);
                    
                    if (!isNaN(newHeight) && newHeight >= 0) {
                        elements.areaHeight.value = NumberUtils.formatNumber(newHeight);
                    }
                } else if (this.appState) {
                    this.appState.debouncedUpdateRatio();
                }
                
                // Constrain also the offset to avoid the area exceeding
                const areaHeight = NumberUtils.parseFloatSafe(elements.areaHeight.value);
                const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
                const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
                
                const constrainedOffsets = NumberUtils.constrainAreaOffset(
                    offsetX, 
                    offsetY, 
                    constrainedWidth, 
                    areaHeight, 
                    tabletWidth, 
                    tabletHeight
                );
                
                elements.areaOffsetX.value = NumberUtils.formatNumber(constrainedOffsets.x, 3);
                elements.areaOffsetY.value = NumberUtils.formatNumber(constrainedOffsets.y, 3);
                
                if (typeof updateDisplayWithoutRatio === 'function') {
                    updateDisplayWithoutRatio();
                }
            });
        }
        
        if (elements.areaHeight) {
            elements.areaHeight.addEventListener('input', () => {
                if (this.appState && !this.appState.editingFavoriteId) {
                    this.appState.cancelEditMode();
                }
                
                // Get the tablet and active area dimensions
                const tabletWidth = NumberUtils.parseFloatSafe(elements.tabletWidth.value);
                const tabletHeight = NumberUtils.parseFloatSafe(elements.tabletHeight.value);
                const areaHeight = NumberUtils.parseFloatSafe(elements.areaHeight.value);
                
                // Constrain the active area height
                const constrainedHeight = Math.min(areaHeight, tabletHeight);
                if (constrainedHeight !== areaHeight) {
                    elements.areaHeight.value = NumberUtils.formatNumber(constrainedHeight);
                }
                
                // Only update the width if the ratio is locked
                if (elements.lockRatio && elements.lockRatio.getAttribute('aria-pressed') === 'true' && 
                    this.appState && this.appState.currentRatio > 0 && !isNaN(this.appState.currentRatio)) {
                    let newWidth = constrainedHeight * this.appState.currentRatio;
                    
                    // Constrain also the width
                    newWidth = Math.min(newWidth, tabletWidth);
                    
                    if (!isNaN(newWidth) && newWidth >= 0) {
                        elements.areaWidth.value = NumberUtils.formatNumber(newWidth);
                    }
                } else if (this.appState) {
                    this.appState.debouncedUpdateRatio();
                }
                
                // Constrain also the offset to avoid the area exceeding
                const areaWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
                const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
                const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
                
                const constrainedOffsets = NumberUtils.constrainAreaOffset(
                    offsetX, 
                    offsetY, 
                    areaWidth, 
                    constrainedHeight, 
                    tabletWidth, 
                    tabletHeight
                );
                
                elements.areaOffsetX.value = NumberUtils.formatNumber(constrainedOffsets.x, 3);
                elements.areaOffsetY.value = NumberUtils.formatNumber(constrainedOffsets.y, 3);
                
                if (typeof updateDisplayWithoutRatio === 'function') {
                    updateDisplayWithoutRatio();
                }
            });
        }
    },
    
    /**
     * Set up ratio lock and custom ratio input handling
     */
    setupRatioHandling() {
        const elements = this.getFormElements();
        
        if (!elements.customRatio || !elements.lockRatio) return;
        
        // Function to update the ratio field state based on the lock state
        const updateRatioFieldState = () => {
            const isLocked = elements.lockRatio.getAttribute('aria-pressed') === 'true';
            elements.customRatio.readOnly = !isLocked;
            
            // Apply the appropriate styles based on the state
            if (isLocked) {
                // If locked, the input is editable and keeps the same appearance as the other inputs
                elements.customRatio.classList.remove('ratio-editable');
                elements.customRatio.classList.add('ratio-locked');
                // Reset the inline styles
                elements.customRatio.style.backgroundColor = "";
                elements.customRatio.style.color = "";
                elements.customRatio.style.pointerEvents = ""; // Allow interaction
                elements.customRatio.title = "Custom ratio (editable)";
            } else {
                // If unlocked, the input is not editable and has a darker appearance
                elements.customRatio.classList.remove('ratio-locked');
                elements.customRatio.classList.add('ratio-editable');
                elements.customRatio.style.backgroundColor = "#111827"; // bg-gray-900 - darker
                elements.customRatio.style.color = "#9CA3AF"; // text-gray-400 - lighter
                elements.customRatio.style.pointerEvents = "none"; // Prevent interaction
                elements.customRatio.title = "Automatically calculated ratio (not editable)";
            }
        };
        
        // Make the function accessible globally
        window.updateRatioFieldState = updateRatioFieldState;
        
        // Initialize the ratio field state
        updateRatioFieldState();
        
        // Apply the initial style if unlocked
        if (elements.lockRatio.getAttribute('aria-pressed') !== 'true') {
            elements.customRatio.style.backgroundColor = "#111827"; // bg-gray-900 - darker
            elements.customRatio.style.color = "#9CA3AF"; // text-gray-400 - lighter
            elements.customRatio.style.pointerEvents = "none"; // Prevent interaction
        }
        
        // Add event listeners for the lock button
        elements.lockRatio.addEventListener('click', () => {
            if (!this.appState) return;
            
            // The button state will change after this event execution
            const willBeLocked = elements.lockRatio.getAttribute('aria-pressed') !== 'true';
            
            if (willBeLocked) {
                // If we are going to lock, take the current ratio of the dimensions
                const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
                const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
                
                if (height > 0 && width > 0) {
                    this.appState.currentRatio = width / height;
                    elements.customRatio.value = NumberUtils.formatNumber(this.appState.currentRatio, 3);
                }
            } else {
                // If we are going to unlock, recalculate the ratio from the dimensions
                this.appState.debouncedUpdateRatio();
            }
            
            // Update the field state after the button state change
            setTimeout(() => {
                updateRatioFieldState();
            }, 0);
        });
        
        // Custom ratio input events
        elements.customRatio.addEventListener('input', () => {
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            
            // If the field is read-only, ignore the input
            if (elements.customRatio.readOnly) {
                return;
            }
            
            const newRatio = NumberUtils.parseFloatSafe(elements.customRatio.value);
            if (!isNaN(newRatio) && newRatio > 0 && this.appState) {
                this.appState.currentRatio = newRatio;
                
                if (elements.lockRatio.getAttribute('aria-pressed') === 'true') {
                    const currentWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
                    const newHeight = currentWidth / this.appState.currentRatio;
                    
                    if (!isNaN(newHeight) && newHeight >= 0) {
                        elements.areaHeight.value = NumberUtils.formatNumber(newHeight);
                    }
                }
            } else if (this.appState) {
                this.appState.currentRatio = NaN;
            }
            
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        });
        
        // Add focus/blur event handlers to prevent updates during direct editing
        elements.customRatio.addEventListener('focus', () => {
            // Allow editing only if the ratio is locked
            if (!elements.customRatio.readOnly) {
                elements.customRatio.dataset.editing = 'true';
            }
        });
        
        elements.customRatio.addEventListener('blur', () => {
            delete elements.customRatio.dataset.editing;
            
            // Recalculate the ratio based on the current dimensions if necessary
            if (elements.lockRatio.getAttribute('aria-pressed') !== 'true' && this.appState) {
                this.appState.debouncedUpdateRatio();
            }
        });
    },
    
    /**
     * Set up area offset input event listeners
     */
    setupOffsetInputs() {
        const elements = this.getFormElements();
        
        if (!elements.areaOffsetX || !elements.areaOffsetY) return;
        
        // Create debounced update display function
        const debouncedUpdateDisplayOffset = DOMUtils.debounce(() => {
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }, 700);
        
        // X offset input events
        elements.areaOffsetX.addEventListener('input', () => {
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            debouncedUpdateDisplayOffset();
        });
        
        elements.areaOffsetX.addEventListener('blur', () => {
            const offset = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
            
            if (!NumberUtils.isValidNumber(offset)) return;
            
            // Update display immediately on blur
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        });
        
        // Y offset input events
        elements.areaOffsetY.addEventListener('input', () => {
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            debouncedUpdateDisplayOffset();
        });
        
        elements.areaOffsetY.addEventListener('blur', () => {
            const offset = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
            
            if (!NumberUtils.isValidNumber(offset)) return;
            
            // Update display immediately on blur
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        });
    },
    
    /**
     * Restore original form values from backup
     * @param {Object} originalValues - Original form values to restore
     */
    restoreOriginalValues(originalValues) {
        if (!originalValues) return;
        
        const elements = this.getFormElements();
        
        // Restore basic form values
        if (elements.areaWidth) {
            elements.areaWidth.value = NumberUtils.formatNumber(originalValues.width);
        }
        if (elements.areaHeight) {
            elements.areaHeight.value = NumberUtils.formatNumber(originalValues.height);
        }
        if (elements.areaOffsetX) {
            elements.areaOffsetX.value = NumberUtils.formatNumber(originalValues.x, 3);
        }
        if (elements.areaOffsetY) {
            elements.areaOffsetY.value = NumberUtils.formatNumber(originalValues.y, 3);
        }
        
        // Restore ratio if available
        if (originalValues.ratio && elements.customRatio) {
            elements.customRatio.value = NumberUtils.formatNumber(originalValues.ratio, 3);
        }
        
        // Restore tablet dimensions if available
        if (originalValues.tabletW && originalValues.tabletH) {
            if (elements.tabletWidth) {
                elements.tabletWidth.value = NumberUtils.formatNumber(originalValues.tabletW);
            }
            if (elements.tabletHeight) {
                elements.tabletHeight.value = NumberUtils.formatNumber(originalValues.tabletH);
            }
        }
        
        // Restore preset info if available
        if (originalValues.presetInfo && elements.tabletSelectorText) {
            // Check if preset info is a translation key
            if (originalValues.presetInfo.startsWith('i18n:')) {
                const key = originalValues.presetInfo.substring(5);
                
                // Apply the translation key to the data-i18n attribute
                elements.tabletSelectorText.setAttribute('data-i18n', key);
                
                // Use translateWithFallback to get the translation if available
                let translated = translateWithFallback(key);
                elements.tabletSelectorText.textContent = translated;
            } else {
                // It's a regular model name, not a translation key
                elements.tabletSelectorText.removeAttribute('data-i18n');
                elements.tabletSelectorText.textContent = originalValues.presetInfo;
            }
        }
        
        // Update the display
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
}; 
