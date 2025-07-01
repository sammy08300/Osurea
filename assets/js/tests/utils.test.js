/**
 * Unit tests for consolidated Utils module
 * Tests all utility functions across DOM, Numbers, and Performance namespaces
 */

import { Utils, DOM, Numbers, Performance } from './index.js';

// Mock DOM environment for testing
const mockDOM = () => {
    global.document = {
        getElementById: jest.fn(),
        createElement: jest.fn(() => ({
            setAttribute: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            contains: jest.fn(() => true),
            style: {},
            dataset: {},
            className: ''
        }))
    };
    
    global.window = {
        requestIdleCallback: jest.fn((cb) => setTimeout(cb, 0)),
        cancelIdleCallback: jest.fn()
    };
    
    global.navigator = {
        clipboard: {
            writeText: jest.fn(() => Promise.resolve())
        }
    };
};

describe('Utils Module', () => {
    beforeAll(() => {
        mockDOM();
    });

    describe('Main Utils Object', () => {
        test('should have all namespaces', () => {
            expect(Utils.DOM).toBeDefined();
            expect(Utils.Numbers).toBeDefined();
            expect(Utils.Performance).toBeDefined();
        });

        test('should provide legacy compatibility', () => {
            expect(Utils.debounce).toBe(Utils.DOM.debounce);
            expect(Utils.throttle).toBe(Utils.DOM.throttle);
            expect(Utils.clamp).toBe(Utils.Numbers.clamp);
            expect(Utils.formatNumber).toBe(Utils.Numbers.formatNumber);
            expect(Utils.memoize).toBe(Utils.Performance.memoize);
        });

        test('should have constants', () => {
            expect(Utils.DECIMAL_PRECISION_POSITION).toBe(3);
            expect(Utils.DECIMAL_PRECISION_DIMENSIONS).toBe(3);
            expect(Utils.DECIMAL_PRECISION_RATIO).toBe(3);
        });
    });

    describe('DOM Utilities', () => {
        test('getElement should call document.getElementById', () => {
            const mockElement = { id: 'test' };
            document.getElementById.mockReturnValue(mockElement);
            
            const result = DOM.getElement('test');
            
            expect(document.getElementById).toHaveBeenCalledWith('test');
            expect(result).toBe(mockElement);
        });

        test('createElement should create element with attributes', () => {
            const mockElement = {
                setAttribute: jest.fn(),
                style: {},
                className: '',
                textContent: ''
            };
            document.createElement.mockReturnValue(mockElement);
            
            const result = DOM.createElement('div', {
                id: 'test',
                className: 'test-class',
                style: { color: 'red' }
            }, 'Test content');
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('id', 'test');
            expect(mockElement.className).toBe('test-class');
            expect(mockElement.style.color).toBe('red');
            expect(mockElement.textContent).toBe('Test content');
        });

        test('debounce should delay function execution', (done) => {
            const mockFn = jest.fn();
            const debouncedFn = DOM.debounce(mockFn, 100);
            
            debouncedFn();
            debouncedFn();
            debouncedFn();
            
            expect(mockFn).not.toHaveBeenCalled();
            
            setTimeout(() => {
                expect(mockFn).toHaveBeenCalledTimes(1);
                done();
            }, 150);
        });

        test('throttle should limit function calls', (done) => {
            const mockFn = jest.fn();
            const throttledFn = DOM.throttle(mockFn, 100);
            
            throttledFn();
            throttledFn();
            throttledFn();
            
            expect(mockFn).toHaveBeenCalledTimes(1);
            
            setTimeout(() => {
                throttledFn();
                expect(mockFn).toHaveBeenCalledTimes(2);
                done();
            }, 150);
        });

        test('copyToClipboard should use navigator.clipboard', async () => {
            await DOM.copyToClipboard('test text');
            
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
        });
    });

    describe('Number Utilities', () => {
        test('parseFloatSafe should parse valid numbers', () => {
            expect(Numbers.parseFloatSafe('3.14')).toBe(3.14);
            expect(Numbers.parseFloatSafe(42)).toBe(42);
            expect(Numbers.parseFloatSafe('42.5')).toBe(42.5);
        });

        test('parseFloatSafe should return fallback for invalid input', () => {
            expect(Numbers.parseFloatSafe('invalid')).toBe(0);
            expect(Numbers.parseFloatSafe(null)).toBe(0);
            expect(Numbers.parseFloatSafe(undefined)).toBe(0);
            expect(Numbers.parseFloatSafe('', 5)).toBe(5);
            expect(Numbers.parseFloatSafe('invalid', -1)).toBe(-1);
        });

        test('formatNumber should format numbers correctly', () => {
            expect(Numbers.formatNumber(3.14159, 2)).toBe('3.14');
            expect(Numbers.formatNumber(42, 0)).toBe('42');
            expect(Numbers.formatNumber(1.5)).toBe('1.5');
            expect(Numbers.formatNumber('3.14159', 2)).toBe('3.14');
        });

        test('formatNumber should handle invalid input', () => {
            expect(Numbers.formatNumber('invalid')).toBe('0');
            expect(Numbers.formatNumber(NaN)).toBe('0');
        });

        test('isValidNumber should validate numbers correctly', () => {
            expect(Numbers.isValidNumber(5)).toBe(true);
            expect(Numbers.isValidNumber(0)).toBe(true);
            expect(Numbers.isValidNumber(-5)).toBe(true);
            expect(Numbers.isValidNumber(3.14)).toBe(true);
            
            expect(Numbers.isValidNumber('5')).toBe(false);
            expect(Numbers.isValidNumber(NaN)).toBe(false);
            expect(Numbers.isValidNumber(Infinity)).toBe(false);
            expect(Numbers.isValidNumber(null)).toBe(false);
        });

        test('isValidNumber should respect range limits', () => {
            expect(Numbers.isValidNumber(5, 0, 10)).toBe(true);
            expect(Numbers.isValidNumber(0, 0, 10)).toBe(true);
            expect(Numbers.isValidNumber(10, 0, 10)).toBe(true);
            expect(Numbers.isValidNumber(-1, 0, 10)).toBe(false);
            expect(Numbers.isValidNumber(11, 0, 10)).toBe(false);
        });

        test('clamp should constrain values to range', () => {
            expect(Numbers.clamp(5, 0, 10)).toBe(5);
            expect(Numbers.clamp(-5, 0, 10)).toBe(0);
            expect(Numbers.clamp(15, 0, 10)).toBe(10);
            expect(Numbers.clamp(0, 0, 10)).toBe(0);
            expect(Numbers.clamp(10, 0, 10)).toBe(10);
        });

        test('calculateRatio should compute width/height ratio', () => {
            expect(Numbers.calculateRatio(16, 9)).toBeCloseTo(1.777, 3);
            expect(Numbers.calculateRatio(4, 3)).toBeCloseTo(1.333, 3);
            expect(Numbers.calculateRatio(1, 1)).toBe(1);
            expect(Numbers.calculateRatio('16', '9')).toBeCloseTo(1.777, 3);
        });

        test('calculateRatio should handle edge cases', () => {
            expect(Numbers.calculateRatio(10, 0)).toBe(1.0);
            expect(Numbers.calculateRatio('invalid', 9)).toBe(1.0);
            expect(Numbers.calculateRatio(16, 'invalid')).toBe(1.0);
        });

        test('mmToPx should convert millimeters to pixels', () => {
            expect(Numbers.mmToPx(25.4, 96)).toBeCloseTo(2438.4, 1);
            expect(Numbers.mmToPx(10, 2)).toBe(20);
            expect(Numbers.mmToPx('10', 2)).toBe(20);
        });

        test('mmToPx should handle invalid input', () => {
            expect(Numbers.mmToPx('invalid', 96)).toBe(0);
            expect(Numbers.mmToPx(10, 0)).toBe(0);
            expect(Numbers.mmToPx(10, -1)).toBe(0);
        });

        test('pxToMm should convert pixels to millimeters', () => {
            expect(Numbers.pxToMm(96, 96)).toBeCloseTo(1, 3);
            expect(Numbers.pxToMm(20, 2)).toBe(10);
            expect(Numbers.pxToMm('20', 2)).toBe(10);
        });

        test('pxToMm should handle invalid input', () => {
            expect(Numbers.pxToMm('invalid', 96)).toBe(0);
            expect(Numbers.pxToMm(96, 0)).toBe(0);
            expect(Numbers.pxToMm(96, -1)).toBe(0);
        });

        test('constrainAreaOffset should keep area within bounds', () => {
            const result = Numbers.constrainAreaOffset(50, 50, 100, 100, 200, 200);
            expect(result).toEqual({ x: 50, y: 50 });
            
            // Test constraint at edges
            const result2 = Numbers.constrainAreaOffset(10, 10, 100, 100, 200, 200);
            expect(result2).toEqual({ x: 50, y: 50 }); // Clamped to minimum
            
            const result3 = Numbers.constrainAreaOffset(190, 190, 100, 100, 200, 200);
            expect(result3).toEqual({ x: 150, y: 150 }); // Clamped to maximum
        });
    });

    describe('Performance Utilities', () => {
        test('memoize should cache function results', () => {
            const mockFn = jest.fn((a, b) => a + b);
            const memoizedFn = Performance.memoize(mockFn);
            
            const result1 = memoizedFn(2, 3);
            const result2 = memoizedFn(2, 3);
            const result3 = memoizedFn(4, 5);
            
            expect(result1).toBe(5);
            expect(result2).toBe(5);
            expect(result3).toBe(9);
            expect(mockFn).toHaveBeenCalledTimes(2); // Only called twice, not three times
        });

        test('memoize should use custom key generator', () => {
            const mockFn = jest.fn((obj) => obj.value * 2);
            const memoizedFn = Performance.memoize(mockFn, (obj) => obj.id);
            
            const obj1 = { id: 1, value: 5 };
            const obj2 = { id: 1, value: 10 }; // Same ID, different value
            
            const result1 = memoizedFn(obj1);
            const result2 = memoizedFn(obj2);
            
            expect(result1).toBe(10);
            expect(result2).toBe(10); // Should return cached result based on ID
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('requestIdleCallback should use native API when available', () => {
            const callback = jest.fn();
            Performance.requestIdleCallback(callback);
            
            expect(window.requestIdleCallback).toHaveBeenCalledWith(callback, {});
        });

        test('requestIdleCallback should fallback to setTimeout', () => {
            const originalRequestIdleCallback = window.requestIdleCallback;
            delete window.requestIdleCallback;
            
            const callback = jest.fn();
            const spy = jest.spyOn(global, 'setTimeout');
            
            Performance.requestIdleCallback(callback);
            
            expect(spy).toHaveBeenCalledWith(callback, 0);
            
            // Restore
            window.requestIdleCallback = originalRequestIdleCallback;
            spy.mockRestore();
        });

        test('cancelIdleCallback should use native API when available', () => {
            Performance.cancelIdleCallback(123);
            
            expect(window.cancelIdleCallback).toHaveBeenCalledWith(123);
        });

        test('cancelIdleCallback should fallback to clearTimeout', () => {
            const originalCancelIdleCallback = window.cancelIdleCallback;
            delete window.cancelIdleCallback;
            
            const spy = jest.spyOn(global, 'clearTimeout');
            
            Performance.cancelIdleCallback(123);
            
            expect(spy).toHaveBeenCalledWith(123);
            
            // Restore
            window.cancelIdleCallback = originalCancelIdleCallback;
            spy.mockRestore();
        });
    });

    describe('Individual Namespace Exports', () => {
        test('should export DOM namespace', () => {
            expect(DOM).toBeDefined();
            expect(DOM.debounce).toBeDefined();
            expect(DOM.throttle).toBeDefined();
            expect(DOM.getElement).toBeDefined();
        });

        test('should export Numbers namespace', () => {
            expect(Numbers).toBeDefined();
            expect(Numbers.formatNumber).toBeDefined();
            expect(Numbers.clamp).toBeDefined();
            expect(Numbers.parseFloatSafe).toBeDefined();
        });

        test('should export Performance namespace', () => {
            expect(Performance).toBeDefined();
            expect(Performance.memoize).toBeDefined();
            expect(Performance.requestIdleCallback).toBeDefined();
        });
    });
});

// Browser-compatible test runner
export function runUtilsTests() {
    console.log('Running Utils module tests...');
    
    const tests = [
        // DOM tests
        () => {
            console.log('Testing DOM.debounce...');
            let callCount = 0;
            const debouncedFn = DOM.debounce(() => callCount++, 50);
            debouncedFn();
            debouncedFn();
            debouncedFn();
            setTimeout(() => {
                console.assert(callCount === 1, 'Debounce should only call function once');
            }, 100);
        },
        
        // Numbers tests
        () => {
            console.log('Testing Numbers.formatNumber...');
            console.assert(Numbers.formatNumber(3.14159, 2) === '3.14', 'Should format to 2 decimals');
            console.assert(Numbers.formatNumber(42, 0) === '42', 'Should format integer');
        },
        
        () => {
            console.log('Testing Numbers.clamp...');
            console.assert(Numbers.clamp(5, 0, 10) === 5, 'Should not clamp value in range');
            console.assert(Numbers.clamp(-5, 0, 10) === 0, 'Should clamp to minimum');
            console.assert(Numbers.clamp(15, 0, 10) === 10, 'Should clamp to maximum');
        },
        
        () => {
            console.log('Testing Numbers.parseFloatSafe...');
            console.assert(Numbers.parseFloatSafe('3.14') === 3.14, 'Should parse valid number');
            console.assert(Numbers.parseFloatSafe('invalid', 0) === 0, 'Should return fallback for invalid');
        },
        
        // Performance tests
        () => {
            console.log('Testing Performance.memoize...');
            let callCount = 0;
            const fn = (x) => { callCount++; return x * 2; };
            const memoized = Performance.memoize(fn);
            
            memoized(5);
            memoized(5);
            memoized(5);
            
            console.assert(callCount === 1, 'Memoized function should only be called once for same input');
        },
        
        // Legacy compatibility tests
        () => {
            console.log('Testing legacy compatibility...');
            console.assert(Utils.debounce === Utils.DOM.debounce, 'Legacy debounce should work');
            console.assert(Utils.formatNumber === Utils.Numbers.formatNumber, 'Legacy formatNumber should work');
            console.assert(Utils.clamp === Utils.Numbers.clamp, 'Legacy clamp should work');
        }
    ];
    
    tests.forEach((test, index) => {
        try {
            test();
            console.log(`✓ Test ${index + 1} passed`);
        } catch (error) {
            console.error(`✗ Test ${index + 1} failed:`, error);
        }
    });
    
    console.log('Utils tests completed');
} 
