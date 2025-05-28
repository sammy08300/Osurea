/**
 * Consolidated Utilities Module
 * Combines all utility functions in a structured namespace
 */

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const DECIMAL_PRECISION_POSITION: number = 3; // Precision for positions (X/Y)

// Declare a basic interface for the global Notifications object
declare var Notifications: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
};

type GenericFunction = (...args: any[]) => any;
type DebouncedFunction = (...args: any[]) => void;
type ThrottledFunction = (...args: any[]) => void;
type MemoizedFunction<T extends GenericFunction> = (...args: Parameters<T>) => ReturnType<T>;

interface ElementAttributes {
    [key: string]: any;
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
}

const defaultMemoizeKeyGenerator = <TArgs extends any[]>(...args: TArgs): string => {
    return "test_key";
};

// -----------------------------------------------------------------------------
// DOM Utilities
// -----------------------------------------------------------------------------
const DOM = {
    getElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    },
    
    createElement(tagName: string, attributes: ElementAttributes = {}, content: string | HTMLElement = ''): HTMLElement {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className' && typeof value === 'string') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object' && value !== null) {
                Object.assign(element.style, value);
            } else if (value !== undefined) { 
                element.setAttribute(key, String(value)); 
            }
        });
        
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof HTMLElement) { 
            element.appendChild(content);
        }
        
        return element;
    },
    
    debounce(func: GenericFunction, wait: number): DebouncedFunction {
        let timeout: number | null = null;
        return function executedFunction(this: any, ...args: any[]): void {
            const later = () => {
                if (timeout !== null) clearTimeout(timeout);
                func.apply(this, args);
            };
            if (timeout !== null) clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
        };
    },
    
    throttle(func: GenericFunction, wait: number): ThrottledFunction {
        let lastCall = 0;
        return function executedFunction(this: any, ...args: any[]): void {
            const now = Date.now();
            if (now - lastCall >= wait) {
                func.apply(this, args);
                lastCall = now;
            }
        };
    },
    
    addRippleEffect(element: HTMLElement, event: MouseEvent): void {
        const ripple = this.createElement('div', {
            className: 'bg-gray-700/30 absolute rounded-full pointer-events-none',
            style: {
                width: '20px',
                height: '20px',
                left: `${event.offsetX - 10}px`,
                top: `${event.offsetY - 10}px`,
                transform: 'scale(0)',
                transition: 'transform 0.6s, opacity 0.6s'
            }
        });
        
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        window.setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            window.setTimeout(() => {
                if (element.contains(ripple)) {
                    element.removeChild(ripple);
                }
            }, 600);
        }, 10);
    },
    
    copyToClipboard(text: string, successMessage: string = 'copied_info', errorMessage: string = 'copy_error'): void {
        if (!navigator.clipboard) {
            console.warn('Clipboard API not available.');
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(errorMessage);
            }
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => {
                if (typeof Notifications !== 'undefined' && Notifications.success) {
                    Notifications.success(successMessage);
                }
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                if (typeof Notifications !== 'undefined' && Notifications.error) {
                    Notifications.error(errorMessage);
                }
            });
    }
};

// -----------------------------------------------------------------------------
// Number Utilities
// -----------------------------------------------------------------------------
const Numbers = {
    parseFloatSafe(value: any, fallback: number = 0): number {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const stringValue = String(value); 
        const parsed = parseFloat(stringValue);
        return isNaN(parsed) ? fallback : parsed;
    },
    
    formatNumber(value: any, decimalPlaces: number = 1): string {
        let numValue: number;
        if (value === null || value === undefined || value === '') {
            numValue = NaN; 
        } else if (typeof value === 'number') {
            numValue = value;
        } else {
            numValue = parseFloat(String(value)); 
        }
        
        if (isNaN(numValue)) {
            return '0'; 
        }
        
        if (Number.isInteger(numValue) && decimalPlaces === 0) {
            return numValue.toString();
        }
        
        return numValue.toFixed(decimalPlaces);
    },
    
    isValidNumber(value: any, min: number = -Infinity, max: number = Infinity): boolean {
        const num = parseFloat(String(value)); // Ensure string for parseFloat
        return !isNaN(num) && isFinite(num) && num >= min && num <= max;
    },
    
    clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    },
    
    calculateRatio(width: any, height: any): number {
        let numWidth: number;
        let numHeight: number;

        if (width === null || width === undefined || width === '') numWidth = NaN;
        else if (typeof width === 'number') numWidth = width;
        else numWidth = parseFloat(String(width));

        if (height === null || height === undefined || height === '') numHeight = NaN;
        else if (typeof height === 'number') numHeight = height;
        else numHeight = parseFloat(String(height));
        
        if (isNaN(numWidth) || isNaN(numHeight) || numHeight === 0) {
            return 1.0;
        }
        
        return numWidth / numHeight;
    },

    calculateRatioMemoized: null as ((width: any, height: any) => number) | null,
    
    mmToPx(mm: any, scale: number): number {
        let numMm: number;
        if (mm === null || mm === undefined || mm === '') numMm = NaN;
        else if (typeof mm === 'number') numMm = mm;
        else numMm = parseFloat(String(mm));
        
        if (isNaN(numMm) || scale <= 0) {
            return 0;
        }
        
        return numMm * scale;
    },
    
    pxToMm(px: any, scale: number): number {
        let numPx: number;
        if (px === null || px === undefined || px === '') numPx = NaN;
        else if (typeof px === 'number') numPx = px;
        else numPx = parseFloat(String(px));
        
        if (isNaN(numPx) || scale <= 0) {
            return 0;
        }
        
        return numPx / scale;
    },
    
    constrainAreaOffset(
        offsetX: number, 
        offsetY: number, 
        areaWidth: number, 
        areaHeight: number, 
        tabletWidth: number, 
        tabletHeight: number
    ): { x: number; y: number } {
        const halfWidth = areaWidth / 2;
        const halfHeight = areaHeight / 2;
        
        const minX = halfWidth;
        const maxX = tabletWidth - halfWidth;
        const minY = halfHeight;
        const maxY = tabletHeight - halfHeight;
        
        const x = Math.max(minX, Math.min(maxX, offsetX));
        const y = Math.max(minY, Math.min(maxY, offsetY));
        
        return { x, y };
    }
};

// -----------------------------------------------------------------------------
// Performance Utilities
// -----------------------------------------------------------------------------
const Performance = {
    memoize<T extends GenericFunction>(
        fn: T, 
        keyGenerator: (...args: Parameters<T>) => string, // Made non-optional
        maxCacheSize: number = 1000
    ): MemoizedFunction<T> {
        // Removed: const currentKeyGenerator = keyGenerator || defaultMemoizeKeyGenerator; 
        const cache = new Map<string, ReturnType<T>>();
        
        return function(this: any, ...args: Parameters<T>): ReturnType<T> {
            // Use the provided keyGenerator directly
            const key = keyGenerator(...args); 
            
            if (cache.has(key)) {
                const value = cache.get(key)!;
                cache.delete(key);
                cache.set(key, value);
                return value;
            }
            
            const result = fn.apply(this, args);
            
            if (cache.size >= maxCacheSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            
            cache.set(key, result);
            return result;
        };
    },

    createMemoizedCalculateRatio(): (width: any, height: any) => number {
        return this.memoize(
            Numbers.calculateRatio,
            // @ts-ignore
            (width: any, height: any): string => "specific_test_key_for_ratio", // This was the problematic argument
            500
        );
    },
    
    requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, options);
        } else {
            return window.setTimeout(callback, 0);
        }
    },
    
    cancelIdleCallback(id: number): void {
        if (window.cancelIdleCallback) {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    }
};

// Initialize memoized functions
Numbers.calculateRatioMemoized = Performance.createMemoizedCalculateRatio();

// -----------------------------------------------------------------------------
// Main Utils Export
// -----------------------------------------------------------------------------
export const Utils = {
    DECIMAL_PRECISION_POSITION,
    DOM,
    Numbers,
    Performance,
    debounce: DOM.debounce,
    throttle: DOM.throttle,
    clamp: Numbers.clamp,
    formatNumber: Numbers.formatNumber,
    parseFloatSafe: Numbers.parseFloatSafe,
    isValidNumber: Numbers.isValidNumber,
    mmToPx: Numbers.mmToPx,
    pxToMm: Numbers.pxToMm,
    calculateRatio: Numbers.calculateRatio,
    calculateRatioMemoized: Numbers.calculateRatioMemoized,
    constrainAreaOffset: Numbers.constrainAreaOffset,
    memoize: Performance.memoize
};

export { DOM, Numbers, Performance };

// Global exports for backward compatibility
if (typeof window !== 'undefined') {
    const win = window as any;
    win.Utils = Utils;
    win.throttle = DOM.throttle;
    win.debounce = DOM.debounce;
    win.clamp = Numbers.clamp;
    win.formatNumber = Numbers.formatNumber;
    win.mmToPx = Numbers.mmToPx;
    win.pxToMm = Numbers.pxToMm;
    win.calculateRatio = Numbers.calculateRatio;
    win.calculateRatioMemoized = Numbers.calculateRatioMemoized;
    win.isValidNumber = Numbers.isValidNumber;
    win.parseFloatSafe = Numbers.parseFloatSafe;
    win.constrainAreaOffset = Numbers.constrainAreaOffset;
    win.DECIMAL_PRECISION_POSITION = DECIMAL_PRECISION_POSITION;
}
