/**
 * Quick test script to verify Utils module functionality
 * Run this in the browser console to check if everything works
 */

// Define the structure of the Utils object and its nested modules on the window
declare global {
    interface Window {
        Utils?: {
            DOM: {
                debounce: Function;
                throttle: Function;
                getElement: Function;
                // Add other DOM functions if they exist
            };
            Numbers: {
                formatNumber: (num: number, precision?: number) => string;
                clamp: (value: number, min: number, max: number) => number;
                parseFloatSafe: (value: string) => number;
                constrainAreaOffset: (offsetX: number, offsetY: number, areaWidth: number, areaHeight: number, tabletWidth: number, tabletHeight: number) => { x: number; y: number };
                // Add other Numbers functions if they exist
            };
            Performance: {
                memoize: Function;
                // Add other Performance functions if they exist
            };
            // Legacy direct access (assuming they mirror the nested ones)
            debounce?: Function;
            formatNumber?: (num: number, precision?: number) => string;
            clamp?: (value: number, min: number, max: number) => number;
        };
        // Direct global functions (if they are indeed global and not just part of Utils)
        formatNumber?: (num: number, precision?: number) => string;
        constrainAreaOffset?: (offsetX: number, offsetY: number, areaWidth: number, areaHeight: number, tabletWidth: number, tabletHeight: number) => { x: number; y: number };
    }
}

interface Test {
    name: string;
    test: () => boolean;
}

interface TestResultsSummary {
    passed: number;
    failed: number;
    total: number;
}

export function runQuickTest(): TestResultsSummary {
    console.log('🧪 Running Utils Quick Test...');
    
    // Debug: Log the actual structure of window.Utils
    console.log('🔍 Debug - window.Utils structure:', {
        'typeof window.Utils': typeof window.Utils,
        'Utils keys': window.Utils ? Object.keys(window.Utils) : 'N/A',
        'Utils.DOM': typeof window.Utils?.DOM,
        'Utils.DOM keys': window.Utils?.DOM ? Object.keys(window.Utils.DOM) : 'N/A',
        'Utils.Numbers': typeof window.Utils?.Numbers,
        'Utils.Numbers keys': window.Utils?.Numbers ? Object.keys(window.Utils.Numbers) : 'N/A',
        'Utils.Performance': typeof window.Utils?.Performance,
        'Utils.Performance keys': window.Utils?.Performance ? Object.keys(window.Utils.Performance) : 'N/A'
    });
    
    const tests: Test[] = [
        { name: 'Utils.DOM.debounce', test: () => typeof window.Utils?.DOM?.debounce === 'function' },
        { name: 'Utils.DOM.throttle',  test: () => typeof window.Utils?.DOM?.throttle === 'function' },
        { name: 'Utils.DOM.getElement', test: () => typeof window.Utils?.DOM?.getElement === 'function' },
        
        { name: 'Utils.Numbers.formatNumber', test: () => window.Utils?.Numbers?.formatNumber(3.14159, 2) === '3.14' },
        { name: 'Utils.Numbers.clamp', test: () => window.Utils?.Numbers?.clamp(15, 0, 10) === 10 },
        { name: 'Utils.Numbers.parseFloatSafe', test: () => window.Utils?.Numbers?.parseFloatSafe('3.14') === 3.14 },
        {
            name: 'Utils.Numbers.constrainAreaOffset',
            test: () => {
                const result = window.Utils?.Numbers?.constrainAreaOffset(50, 50, 100, 100, 200, 200);
                return !!result && result.x === 50 && result.y === 50;
            }
        },
        
        { name: 'Utils.Performance.memoize', test: () => typeof window.Utils?.Performance?.memoize === 'function' },
        
        { name: 'Utils.debounce (legacy)', test: () => window.Utils?.debounce === window.Utils?.DOM?.debounce },
        { name: 'Utils.formatNumber (legacy)', test: () => window.Utils?.formatNumber === window.Utils?.Numbers?.formatNumber },
        { name: 'Utils.clamp (legacy)', test: () => window.Utils?.clamp === window.Utils?.Numbers?.clamp },
        
        { name: 'window.Utils', test: () => typeof window.Utils === 'object' && window.Utils !== null },
        { name: 'window.formatNumber', test: () => typeof window.formatNumber === 'function' },
        { name: 'window.constrainAreaOffset', test: () => typeof window.constrainAreaOffset === 'function' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test(); // Call the test function
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - Test returned false`);
                failed++;
            }
        } catch (error: any) { // Explicitly type error
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Utils module is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
    }
    
    return { passed, failed, total: tests.length };
}

if (typeof window !== 'undefined') {
    // Ensure Utils is on window before trying to run tests that depend on it
    const runTestsWhenReady = () => {
        if (window.Utils) {
            runQuickTest();
        } else {
            console.log('⚠️ Utils module not found after delay. Make sure it\'s loaded properly.');
        }
    };

    if (window.Utils) {
        setTimeout(runQuickTest, 1000); // Run after a short delay
    } else {
        // If Utils is not available, wait a bit longer and try again
        console.log('Waiting for Utils module to load...');
        setTimeout(runTestsWhenReady, 2000); 
    }
}
