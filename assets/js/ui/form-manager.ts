/**
 * Form Manager module for handling form elements and their events
 */
import { DOMUtils } from '../utils/dom-utils';
import { NumberUtils } from '../utils/number-utils';
import { translateWithFallback } from '../i18n-init';

// Define types for global functions and variables if they exist
declare function updateDisplay(): void;
declare function updateDisplayWithoutRatio(): void;

interface AppState {
    editingFavoriteId?: string | number | null;
    currentRatio?: number;
    cancelEditMode: () => void;
    debouncedUpdateRatio: () => void;
    // Add other appState properties if known
}

interface FormElements {
    tabletWidth: HTMLInputElement | null;
    tabletHeight: HTMLInputElement | null;
    tabletSelector: HTMLButtonElement | null;
    tabletSelectorText: HTMLElement | null;
    areaWidth: HTMLInputElement | null;
    areaHeight: HTMLInputElement | null;
    customRatio: HTMLInputElement | null;
    lockRatio: HTMLButtonElement | null;
    areaOffsetX: HTMLInputElement | null;
    areaOffsetY: HTMLInputElement | null;
    areaRadius: HTMLInputElement | null;
    tabletDimensionsContainer: HTMLElement | null;
}

interface FormValues {
    tabletWidth?: number;
    tabletHeight?: number;
    areaWidth?: number;
    areaHeight?: number;
    areaOffsetX?: number;
    areaOffsetY?: number;
    customRatio?: number;
    areaRadius: number;
    presetInfo: string | null;
}

interface OriginalValues {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    ratio?: number;
    tabletW?: number;
    tabletH?: number;
    presetInfo?: string | null | undefined;
    // Add other potential original values
}

// Define type for window.updateRatioFieldState if it exists globally
declare global {
    interface Window {
        updateRatioFieldState?: () => void;
        updateSliderProgress?: (value: string | number) => void; // Make parameter non-optional
    }
}


export const FormManager = {
    appState: null as AppState | null,
    
    init(appState: AppState): void {
        this.appState = appState;
        this.setupTabletDimensionInputs();
        this.setupAreaDimensionInputs();
        this.setupRatioHandling();
        this.setupOffsetInputs();
        this.setupRadiusInputs();
    },
    
    getFormElements(): FormElements {
        return {
            tabletWidth: document.getElementById('tabletWidth') as HTMLInputElement | null,
            tabletHeight: document.getElementById('tabletHeight') as HTMLInputElement | null,
            tabletSelector: document.getElementById('tabletSelectorButton') as HTMLButtonElement | null,
            tabletSelectorText: document.getElementById('tabletSelectorText') as HTMLElement | null,
            areaWidth: document.getElementById('areaWidth') as HTMLInputElement | null,
            areaHeight: document.getElementById('areaHeight') as HTMLInputElement | null,
            customRatio: document.getElementById('customRatio') as HTMLInputElement | null,
            lockRatio: document.getElementById('lockRatio') as HTMLButtonElement | null,
            areaOffsetX: document.getElementById('areaOffsetX') as HTMLInputElement | null,
            areaOffsetY: document.getElementById('areaOffsetY') as HTMLInputElement | null,
            areaRadius: document.getElementById('areaRadius') as HTMLInputElement | null,
            tabletDimensionsContainer: document.getElementById('tablet-dimensions-container') as HTMLElement | null
        };
    },
    
    getFormValues(): FormValues {
        const elements = this.getFormElements();
        let presetInfo: string | null = null;
        
        if (elements.tabletSelectorText) {
            if (elements.tabletSelectorText.hasAttribute('data-i18n')) {
                presetInfo = 'i18n:' + elements.tabletSelectorText.getAttribute('data-i18n');
            } else {
                presetInfo = elements.tabletSelectorText.textContent;
            }
        }
        
        return {
            tabletWidth: NumberUtils.parseFloatSafe(elements.tabletWidth?.value),
            tabletHeight: NumberUtils.parseFloatSafe(elements.tabletHeight?.value),
            areaWidth: NumberUtils.parseFloatSafe(elements.areaWidth?.value),
            areaHeight: NumberUtils.parseFloatSafe(elements.areaHeight?.value),
            areaOffsetX: NumberUtils.parseFloatSafe(elements.areaOffsetX?.value),
            areaOffsetY: NumberUtils.parseFloatSafe(elements.areaOffsetY?.value),
            customRatio: NumberUtils.parseFloatSafe(elements.customRatio?.value),
            areaRadius: parseInt(elements.areaRadius?.value || '0') || 0,
            presetInfo: presetInfo
        };
    },
    
    setupTabletDimensionInputs(): void {
        const elements = this.getFormElements();
        
        const handleTabletDimensionInput = () => {
            if (elements.tabletSelectorText) {
                elements.tabletSelectorText.textContent = translateWithFallback('tablet.customDimensions', 'Custom Dimensions');
                elements.tabletSelectorText.title = translateWithFallback('tablet.customDimensions', 'Custom Dimensions');
            }
            if (elements.tabletDimensionsContainer) {
                elements.tabletDimensionsContainer.classList.remove('hidden');
            }
            if (this.appState) {
                this.appState.cancelEditMode();
            }
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        };
        
        elements.tabletWidth?.addEventListener('input', handleTabletDimensionInput);
        if (elements.tabletHeight) {
            elements.tabletHeight.addEventListener('input', handleTabletDimensionInput);
        }
    },
    
    setupAreaDimensionInputs(): void {
        const elements = this.getFormElements();
        
        elements.areaWidth?.addEventListener('input', () => {
            if (!elements.areaWidth || !elements.tabletWidth || !elements.areaHeight || !elements.areaOffsetX || !elements.areaOffsetY || !elements.lockRatio) return;
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            
            const tabletWidth = NumberUtils.parseFloatSafe(elements.tabletWidth.value);
            const tabletHeight = NumberUtils.parseFloatSafe(elements.tabletHeight?.value);
            const areaWidth = NumberUtils.parseFloatSafe(elements.areaWidth.value);
            
            const constrainedWidth = Math.min(areaWidth, tabletWidth);
            if (constrainedWidth !== areaWidth) {
                elements.areaWidth.value = NumberUtils.formatNumber(constrainedWidth);
            }
            
            if (elements.lockRatio.getAttribute('aria-pressed') === 'true' && 
                this.appState && this.appState.currentRatio && this.appState.currentRatio > 0 && !isNaN(this.appState.currentRatio)) {
                let newHeight = constrainedWidth / this.appState.currentRatio;
                newHeight = Math.min(newHeight, tabletHeight);
                if (!isNaN(newHeight) && newHeight >= 0) {
                    elements.areaHeight.value = NumberUtils.formatNumber(newHeight);
                }
            } else if (this.appState) {
                this.appState.debouncedUpdateRatio();
            }
            
            const areaHeightVal = NumberUtils.parseFloatSafe(elements.areaHeight.value);
            const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
            const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
            
            const constrainedOffsets = NumberUtils.constrainAreaOffset(offsetX, offsetY, constrainedWidth, areaHeightVal, tabletWidth, tabletHeight);
            
            elements.areaOffsetX.value = NumberUtils.formatNumber(constrainedOffsets.x, 3);
            elements.areaOffsetY.value = NumberUtils.formatNumber(constrainedOffsets.y, 3);
            
            if (typeof updateDisplayWithoutRatio === 'function') {
                updateDisplayWithoutRatio();
            }
        });
        
        elements.areaHeight?.addEventListener('input', () => {
            if(!elements.areaHeight || !elements.tabletWidth || !elements.areaWidth || !elements.areaOffsetX || !elements.areaOffsetY || !elements.lockRatio) return;

            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            
            const tabletWidth = NumberUtils.parseFloatSafe(elements.tabletWidth.value);
            const tabletHeight = NumberUtils.parseFloatSafe(elements.tabletHeight?.value);
            const areaHeight = NumberUtils.parseFloatSafe(elements.areaHeight.value);
            
            const constrainedHeight = Math.min(areaHeight, tabletHeight);
            if (constrainedHeight !== areaHeight) {
                elements.areaHeight.value = NumberUtils.formatNumber(constrainedHeight);
            }
            
            if (elements.lockRatio.getAttribute('aria-pressed') === 'true' && 
                this.appState && this.appState.currentRatio && this.appState.currentRatio > 0 && !isNaN(this.appState.currentRatio)) {
                let newWidth = constrainedHeight * this.appState.currentRatio;
                newWidth = Math.min(newWidth, tabletWidth);
                if (!isNaN(newWidth) && newWidth >= 0) {
                    elements.areaWidth.value = NumberUtils.formatNumber(newWidth);
                }
            } else if (this.appState) {
                this.appState.debouncedUpdateRatio();
            }
            
            const areaWidthVal = NumberUtils.parseFloatSafe(elements.areaWidth.value);
            const offsetX = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
            const offsetY = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
            
            const constrainedOffsets = NumberUtils.constrainAreaOffset(offsetX, offsetY, areaWidthVal, constrainedHeight, tabletWidth, tabletHeight);
            
            elements.areaOffsetX.value = NumberUtils.formatNumber(constrainedOffsets.x, 3);
            elements.areaOffsetY.value = NumberUtils.formatNumber(constrainedOffsets.y, 3);
            
            if (typeof updateDisplayWithoutRatio === 'function') {
                updateDisplayWithoutRatio();
            }
        });
    },
    
    setupRatioHandling(): void {
        const elements = this.getFormElements();
        if (!elements.customRatio || !elements.lockRatio || !elements.areaWidth || !elements.areaHeight) return;
        
        const updateRatioFieldState = () => {
            if (!elements.customRatio || !elements.lockRatio) return;
            const isLocked = elements.lockRatio.getAttribute('aria-pressed') === 'true';
            elements.customRatio.readOnly = !isLocked;
            
            if (isLocked) {
                elements.customRatio.classList.remove('ratio-editable');
                elements.customRatio.classList.add('ratio-locked');
                elements.customRatio.style.backgroundColor = "";
                elements.customRatio.style.color = "";
                elements.customRatio.style.pointerEvents = "";
                elements.customRatio.title = "Custom ratio (editable)";
            } else {
                elements.customRatio.classList.remove('ratio-locked');
                elements.customRatio.classList.add('ratio-editable');
                elements.customRatio.style.backgroundColor = "#111827";
                elements.customRatio.style.color = "#9CA3AF";
                elements.customRatio.style.pointerEvents = "none";
                elements.customRatio.title = "Automatically calculated ratio (not editable)";
            }
        };
        
        window.updateRatioFieldState = updateRatioFieldState;
        updateRatioFieldState();
        
        if (elements.lockRatio.getAttribute('aria-pressed') !== 'true') {
            elements.customRatio.style.backgroundColor = "#111827";
            elements.customRatio.style.color = "#9CA3AF";
            elements.customRatio.style.pointerEvents = "none";
        }
        
        elements.lockRatio.addEventListener('click', () => {
            if (!this.appState || !elements.lockRatio || !elements.areaWidth || !elements.areaHeight || !elements.customRatio) return;
            const willBeLocked = elements.lockRatio.getAttribute('aria-pressed') !== 'true';
            
            if (willBeLocked) {
                const width = NumberUtils.parseFloatSafe(elements.areaWidth.value);
                const height = NumberUtils.parseFloatSafe(elements.areaHeight.value);
                if (height > 0 && width > 0) {
                    this.appState.currentRatio = width / height;
                    elements.customRatio.value = NumberUtils.formatNumber(this.appState.currentRatio, 3);
                }
            } else {
                this.appState.debouncedUpdateRatio();
            }
            setTimeout(() => updateRatioFieldState(), 0);
        });
        
        elements.customRatio.addEventListener('input', () => {
            if (!elements.customRatio || !elements.lockRatio || !elements.areaWidth || !elements.areaHeight) return;
            if (this.appState && !this.appState.editingFavoriteId) {
                this.appState.cancelEditMode();
            }
            if (elements.customRatio.readOnly) return;
            
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
            if (typeof updateDisplay === 'function') updateDisplay();
        });
        
        elements.customRatio.addEventListener('focus', () => {
            if (!elements.customRatio || elements.customRatio.readOnly) return;
            elements.customRatio.dataset.editing = 'true';
        });
        
        elements.customRatio.addEventListener('blur', () => {
            if (!elements.customRatio || !elements.lockRatio || !this.appState) return;
            delete elements.customRatio.dataset.editing;
            if (elements.lockRatio.getAttribute('aria-pressed') !== 'true') {
                this.appState.debouncedUpdateRatio();
            }
        });
    },
    
    setupOffsetInputs(): void {
        const elements = this.getFormElements();
        if (!elements.areaOffsetX || !elements.areaOffsetY) return;
        
        const debouncedUpdateDisplayOffset = DOMUtils.debounce(() => {
            if (typeof updateDisplay === 'function') updateDisplay();
        }, 700);
        
        elements.areaOffsetX.addEventListener('input', () => {
            if (this.appState && !this.appState.editingFavoriteId) this.appState.cancelEditMode();
            debouncedUpdateDisplayOffset();
        });
        
        elements.areaOffsetX.addEventListener('blur', () => {
            if(!elements.areaOffsetX) return;
            const offset = NumberUtils.parseFloatSafe(elements.areaOffsetX.value);
            if (!NumberUtils.isValidNumber(offset)) return;
            if (typeof updateDisplay === 'function') updateDisplay();
        });
        
        elements.areaOffsetY.addEventListener('input', () => {
            if (this.appState && !this.appState.editingFavoriteId) this.appState.cancelEditMode();
            debouncedUpdateDisplayOffset();
        });
        
        elements.areaOffsetY.addEventListener('blur', () => {
            if(!elements.areaOffsetY) return;
            const offset = NumberUtils.parseFloatSafe(elements.areaOffsetY.value);
            if (!NumberUtils.isValidNumber(offset)) return;
            if (typeof updateDisplay === 'function') updateDisplay();
        });
    },
    
    setupRadiusInputs(): void {
        const elements = this.getFormElements();
        const radiusInput = document.getElementById('radius-input') as HTMLInputElement | null;
        if (!elements.areaRadius || !radiusInput) return;
        
        if (typeof window.updateSliderProgress === 'function') {
            console.log('Radius slider already initialized by radiusSlider.js');
            return;
        }
        
        const sliderContainer = elements.areaRadius.closest('.slider-container') as HTMLElement | null;
        if (!sliderContainer) {
            console.warn('Slider container not found');
            return;
        }
        
        let progressTrack = sliderContainer.querySelector<HTMLElement>('.slider-progress');
        if (!progressTrack) {
            progressTrack = document.createElement('div');
            progressTrack.className = 'slider-progress';
            if (elements.areaRadius.parentNode === sliderContainer) {
                sliderContainer.insertBefore(progressTrack, elements.areaRadius);
            } else {
                sliderContainer.appendChild(progressTrack);
            }
        }
        const finalProgressTrack = progressTrack; // Ensure it's not null for closure
        
        const updateSliderFill = (value: number) => {
            if (!elements.areaRadius || !finalProgressTrack) return;
            const max = parseFloat(elements.areaRadius.max) || 100; // Default max if not set
            const percent = (value / max) * 100;
            finalProgressTrack.style.width = `${percent}%`;
        };
        
        const updateRadiusValue = (valueStr: string) => {
            if (!elements.areaRadius || !radiusInput) return;
            let value = parseInt(valueStr) || 0;
            value = Math.max(0, Math.min(100, value));
            
            if (elements.areaRadius.value !== value.toString()) elements.areaRadius.value = value.toString();
            if (radiusInput.value !== value.toString()) radiusInput.value = value.toString();
            
            if (typeof window.updateSliderProgress === 'function') {
                window.updateSliderProgress(value);
            } else {
                updateSliderFill(value);
            }
            
            if (this.appState && !this.appState.editingFavoriteId) this.appState.cancelEditMode();
            if (typeof updateDisplay === 'function') updateDisplay();
        };
        
        if (typeof window.updateSliderProgress !== 'function') {
            updateSliderFill(parseInt(elements.areaRadius.value) || 0);
        }
        
        elements.areaRadius.addEventListener('input', function(this: HTMLInputElement) { updateRadiusValue(this.value); });
        radiusInput.addEventListener('input', function(this: HTMLInputElement) { updateRadiusValue(this.value); });
        radiusInput.addEventListener('blur', function(this: HTMLInputElement) { updateRadiusValue(this.value); });
        
        window.addEventListener('resize', () => {
            if (elements.areaRadius) updateSliderFill(parseInt(elements.areaRadius.value) || 0);
        });
    },
    
    restoreOriginalValues(originalValues: OriginalValues): void {
        if (!originalValues) return;
        const elements = this.getFormElements();
        
        if (elements.areaWidth && typeof originalValues.width === 'number') elements.areaWidth.value = NumberUtils.formatNumber(originalValues.width);
        if (elements.areaHeight && typeof originalValues.height === 'number') elements.areaHeight.value = NumberUtils.formatNumber(originalValues.height);
        if (elements.areaOffsetX && typeof originalValues.x === 'number') elements.areaOffsetX.value = NumberUtils.formatNumber(originalValues.x, 3);
        if (elements.areaOffsetY && typeof originalValues.y === 'number') elements.areaOffsetY.value = NumberUtils.formatNumber(originalValues.y, 3);
        if (elements.customRatio && typeof originalValues.ratio === 'number') elements.customRatio.value = NumberUtils.formatNumber(originalValues.ratio, 3);
        if (elements.tabletWidth && typeof originalValues.tabletW === 'number') elements.tabletWidth.value = NumberUtils.formatNumber(originalValues.tabletW);
        if (elements.tabletHeight && typeof originalValues.tabletH === 'number') elements.tabletHeight.value = NumberUtils.formatNumber(originalValues.tabletH);
        
        if (originalValues.presetInfo && elements.tabletSelectorText) {
            if (originalValues.presetInfo.startsWith('i18n:')) {
                const key = originalValues.presetInfo.substring(5);
                elements.tabletSelectorText.setAttribute('data-i18n', key);
                elements.tabletSelectorText.textContent = translateWithFallback(key, '');
            } else {
                elements.tabletSelectorText.removeAttribute('data-i18n');
                elements.tabletSelectorText.textContent = originalValues.presetInfo;
            }
        }
        if (typeof updateDisplay === 'function') updateDisplay();
    }
};
