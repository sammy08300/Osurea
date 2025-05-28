/// <reference types="jest" />
/**
 * Unit tests for consolidated Utils module
 * Tests all utility functions across DOM, Numbers, and Performance namespaces
 */

import { Utils, DOM, Numbers, Performance } from '../utils/index.js'; // Adjusted import path
// import type { DoneCallback } from 'jest'; // Commenting out as /// <reference types="jest" /> should handle it

// Define types for Jest global functions
declare var describe: (name: string, fn: () => void) => void;
declare var beforeAll: (fn: () => void) => void;
declare var test: (name: string, fn: (done?: jest.DoneCallback) => void) => void;
declare var expect: (value: any) => ({
    toBe: (expected: any) => void;
    toEqual: (expected: any) => void;
    toBeDefined: () => void;
    not: {
        toHaveBeenCalled: () => void;
    };
    toHaveBeenCalled: () => void;
    toHaveBeenCalledWith: (...args: any[]) => void;
    toHaveBeenCalledTimes: (count: number) => void;
    toBeCloseTo: (expected: number, precision?: number) => void;
});
declare var jest: {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<ReturnType<T>, jest.ArgsType<T>>;
    spyOn: <T extends object, M extends keyof T>(object: T, method: M) => jest.SpyInstance<ReturnType<T[M] extends (...args: any[]) => any ? T[M] : never>, jest.ArgsType<T[M] extends (...args: any[]) => any ? T[M] : never>>;
};

// Mock DOM environment for testing
const mockDOM = (): void => {
    // Provide a more complete mock for document and window if needed for specific DOM utilities
    const mockElementInstance = {
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        contains: jest.fn(),
        style: {} as CSSStyleDeclaration,
        dataset: {} as DOMStringMap,
        className: '',
        textContent: '',
        id: ''
    };

    global.document = {
        getElementById: jest.fn().mockReturnValue(mockElementInstance),
        createElement: jest.fn().mockReturnValue(mockElementInstance),
        // Add other document properties/methods if used by Utils.DOM
    } as any;
    
    global.window = {
        requestIdleCallback: jest.fn((cb: IdleRequestCallback) => setTimeout(cb, 0)),
        cancelIdleCallback: jest.fn(),
        // Add other window properties/methods if used
    } as any;
    
    global.navigator = {
        clipboard: {
            writeText: jest.fn().mockResolvedValue(undefined)
        }
    } as any;
};


describe('Utils Module', () => {
    beforeAll(() => {
        mockDOM(); // Initialize mock DOM before tests
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
        });
    });

    describe('DOM Utilities', () => {
        test('getElement should call document.getElementById', () => {
            const mockElement = { id: 'test' } as HTMLElement;
            (document.getElementById as jest.Mock).mockReturnValue(mockElement);
            const result = DOM.getElement('test');
            expect(document.getElementById).toHaveBeenCalledWith('test');
            expect(result).toBe(mockElement);
        });

        test('createElement should create element with attributes', () => {
            const mockElement = {
                setAttribute: jest.fn(),
                style: {} as CSSStyleDeclaration,
                className: '',
                textContent: ''
            };
            (document.createElement as jest.Mock).mockReturnValue(mockElement);
            
            DOM.createElement('div', {
                id: 'test',
                className: 'test-class',
                style: { color: 'red' }
            }, 'Test content');
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockElement.setAttribute).toHaveBeenCalledWith('id', 'test');
            expect(mockElement.className).toBe('test-class');
            expect((mockElement.style as any).color).toBe('red'); // Cast style for assignment
            expect(mockElement.textContent).toBe('Test content');
        });

        test('debounce should delay function execution', (done?: jest.DoneCallback) => {
            const mockFn = jest.fn();
            const debouncedFn = DOM.debounce(mockFn, 100);
            debouncedFn();
            debouncedFn();
            debouncedFn();
            expect(mockFn).not.toHaveBeenCalled();
            setTimeout(() => {
                expect(mockFn).toHaveBeenCalledTimes(1);
                if (done) done();
            }, 150);
        });

        test('throttle should limit function calls', (done?: jest.DoneCallback) => {
            const mockFn = jest.fn();
            const throttledFn = DOM.throttle(mockFn, 100);
            throttledFn();
            throttledFn();
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(1);
            setTimeout(() => {
                throttledFn();
                expect(mockFn).toHaveBeenCalledTimes(2);
                if (done) done();
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
            expect(Numbers.parseFloatSafe(42 as any)).toBe(42); // Cast for test flexibility
            expect(Numbers.parseFloatSafe('42.5')).toBe(42.5);
        });

        test('parseFloatSafe should return fallback for invalid input', () => {
            expect(Numbers.parseFloatSafe('invalid')).toBe(0);
            expect(Numbers.parseFloatSafe(null as any)).toBe(0);
            expect(Numbers.parseFloatSafe(undefined)).toBe(0);
            expect(Numbers.parseFloatSafe('', 5)).toBe(5);
            expect(Numbers.parseFloatSafe('invalid', -1)).toBe(-1);
        });

        test('formatNumber should format numbers correctly', () => {
            expect(Numbers.formatNumber(3.14159, 2)).toBe('3.14');
            expect(Numbers.formatNumber(42, 0)).toBe('42');
            expect(Numbers.formatNumber(1.5)).toBe('1.5');
            expect(Numbers.formatNumber('3.14159' as any, 2)).toBe('3.14'); // Cast for test
        });

        test('formatNumber should handle invalid input', () => {
            expect(Numbers.formatNumber('invalid' as any)).toBe('0'); // Cast for test
            expect(Numbers.formatNumber(NaN)).toBe('0');
        });

        test('isValidNumber should validate numbers correctly', () => {
            expect(Numbers.isValidNumber(5)).toBe(true);
            expect(Numbers.isValidNumber(0)).toBe(true);
            expect(Numbers.isValidNumber(-5)).toBe(true);
            expect(Numbers.isValidNumber(3.14)).toBe(true);
            expect(Numbers.isValidNumber('5' as any)).toBe(false); // Cast for test
            expect(Numbers.isValidNumber(NaN)).toBe(false);
            expect(Numbers.isValidNumber(Infinity)).toBe(false);
            expect(Numbers.isValidNumber(null as any)).toBe(false); // Cast for test
        });

        test('isValidNumber should respect range limits', () => {
            expect(Numbers.isValidNumber(5, 0, 10)).toBe(true);
            expect(Numbers.isValidNumber(-1, 0, 10)).toBe(false);
        });

        test('clamp should constrain values to range', () => {
            expect(Numbers.clamp(5, 0, 10)).toBe(5);
            expect(Numbers.clamp(-5, 0, 10)).toBe(0);
        });

        test('calculateRatio should compute width/height ratio', () => {
            expect(Numbers.calculateRatio(16, 9)).toBeCloseTo(1.777, 3);
            expect(Numbers.calculateRatio('16' as any, '9' as any)).toBeCloseTo(1.777, 3); // Cast
        });

        test('calculateRatio should handle edge cases', () => {
            expect(Numbers.calculateRatio(10, 0)).toBe(1.0); // Assuming this is desired
            expect(Numbers.calculateRatio('invalid' as any, 9)).toBe(1.0); // Assuming fallback
        });

        test('mmToPx should convert millimeters to pixels', () => {
            expect(Numbers.mmToPx(25.4, 96)).toBeCloseTo(2438.4, 1);
            expect(Numbers.mmToPx('10' as any, 2)).toBe(20); // Cast
        });

        test('mmToPx should handle invalid input', () => {
            expect(Numbers.mmToPx('invalid' as any, 96)).toBe(0); // Cast
            expect(Numbers.mmToPx(10, 0)).toBe(0);
        });

        test('pxToMm should convert pixels to millimeters', () => {
            expect(Numbers.pxToMm(96, 96)).toBeCloseTo(1, 3);
            expect(Numbers.pxToMm('20' as any, 2)).toBe(10); // Cast
        });

        test('pxToMm should handle invalid input', () => {
            expect(Numbers.pxToMm('invalid' as any, 96)).toBe(0); // Cast
            expect(Numbers.pxToMm(96, 0)).toBe(0);
        });

        test('constrainAreaOffset should keep area within bounds', () => {
            const result = Numbers.constrainAreaOffset(50, 50, 100, 100, 200, 200);
            expect(result).toEqual({ x: 50, y: 50 });
            const result2 = Numbers.constrainAreaOffset(10, 10, 100, 100, 200, 200);
            expect(result2).toEqual({ x: 50, y: 50 });
        });
    });

    describe('Performance Utilities', () => {
        test('memoize should cache function results', () => {
            const mockFn = jest.fn((a: number, b: number) => a + b);
            const memoizedFn = Performance.memoize(mockFn, (...args: any[]) => JSON.stringify(args));
            memoizedFn(2, 3);
            memoizedFn(2, 3);
            memoizedFn(4, 5);
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        test('memoize should use custom key generator', () => {
            const mockFn = jest.fn((obj: { id: number; value: number }) => obj.value * 2);
            const memoizedFn = Performance.memoize(mockFn, (obj: { id: number; value: number }) => obj.id.toString());
            const obj1 = { id: 1, value: 5 };
            const obj2 = { id: 1, value: 10 };
            memoizedFn(obj1);
            memoizedFn(obj2);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('requestIdleCallback should use native API when available', () => {
            const callback = jest.fn();
            Performance.requestIdleCallback(callback);
            expect(window.requestIdleCallback).toHaveBeenCalledWith(callback, {});
        });

        test('requestIdleCallback should fallback to setTimeout', () => {
            const originalRequestIdleCallback = window.requestIdleCallback;
            delete (window as any).requestIdleCallback; // Temporarily remove for test
            const callback = jest.fn();
            const spy = jest.spyOn(global, 'setTimeout');
            Performance.requestIdleCallback(callback);
            expect(spy).toHaveBeenCalledWith(callback, 0);
            window.requestIdleCallback = originalRequestIdleCallback; // Restore
            spy.mockRestore();
        });

        test('cancelIdleCallback should use native API when available', () => {
            Performance.cancelIdleCallback(123);
            expect(window.cancelIdleCallback).toHaveBeenCalledWith(123);
        });

        test('cancelIdleCallback should fallback to clearTimeout', () => {
            const originalCancelIdleCallback = window.cancelIdleCallback;
            delete (window as any).cancelIdleCallback; // Temporarily remove for test
            const spy = jest.spyOn(global, 'clearTimeout');
            Performance.cancelIdleCallback(123);
            expect(spy).toHaveBeenCalledWith(123);
            window.cancelIdleCallback = originalCancelIdleCallback; // Restore
            spy.mockRestore();
        });
    });

    describe('Individual Namespace Exports', () => {
        test('should export DOM namespace', () => expect(DOM).toBeDefined());
        test('should export Numbers namespace', () => expect(Numbers).toBeDefined());
        test('should export Performance namespace', () => expect(Performance).toBeDefined());
    });
});

interface BrowserTest {
    name: string;
    testFn: () => void;
}

interface BrowserTestResults {
    passed: number;
    failed: number;
    total: number;
}

export function runUtilsTests(): BrowserTestResults {
    console.log('Running Utils module tests...');
    
    const tests: BrowserTest[] = [
        {
            name: 'DOM.debounce',
            testFn: () => {
                console.log('Testing DOM.debounce...');
                let callCount = 0;
                const debouncedFn = DOM.debounce(() => callCount++, 50);
                debouncedFn(); debouncedFn(); debouncedFn();
                setTimeout(() => console.assert(callCount === 1, 'Debounce FAIL'), 100);
            }
        },
        {
            name: 'Numbers.formatNumber',
            testFn: () => {
                console.log('Testing Numbers.formatNumber...');
                console.assert(Numbers.formatNumber(3.14159, 2) === '3.14', 'Format FAIL');
            }
        },
        {
            name: 'Numbers.clamp',
            testFn: () => {
                console.log('Testing Numbers.clamp...');
                console.assert(Numbers.clamp(5, 0, 10) === 5, 'Clamp in range FAIL');
            }
        },
        {
            name: 'Numbers.parseFloatSafe',
            testFn: () => {
                console.log('Testing Numbers.parseFloatSafe...');
                console.assert(Numbers.parseFloatSafe('3.14') === 3.14, 'ParseFloatSafe FAIL');
            }
        },
        {
            name: 'Performance.memoize',
            testFn: () => {
                console.log('Testing Performance.memoize...');
                let memoCallCount = 0;
                const fn = (x: number) => { memoCallCount++; return x * 2; }; // Added type for x
                const memoized = Performance.memoize(fn, (x: number) => x.toString()); // Added type for x
                memoized(5); memoized(5);
                console.assert(memoCallCount === 1, 'Memoize FAIL');
            }
        },
        {
            name: 'Legacy compatibility',
            testFn: () => {
                console.log('Testing legacy compatibility...');
                console.assert(Utils.debounce === DOM.debounce, 'Legacy debounce FAIL');
            }
        }
    ];
    
    let passed = 0;
    tests.forEach((testItem, index) => {
        try {
            console.log(`Running test ${index + 1}: ${testItem.name}`);
            testItem.testFn();
            console.log(`✓ Test ${index + 1} (${testItem.name}) executed (check console for asserts)`);
            passed++;
        } catch (error: any) {
            console.error(`✗ Test ${index + 1} (${testItem.name}) failed:`, error.message);
        }
    });
    
    console.log('Utils tests completed');
    return { passed, failed: tests.length - passed, total: tests.length };
}
