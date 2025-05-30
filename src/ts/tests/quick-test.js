/**
 * Quick test script to verify Utils module functionality
 * Run this in the browser console to check if everything works
 */

export function runQuickTest() {
    console.log('🧪 Running Utils Quick Test...');
    
    // Debug: Log the actual structure of window.Utils
    console.log('🔍 Debug - window.Utils structure:', {
        'typeof window.Utils': typeof window.Utils,
        'Utils keys': window.Utils ? Object.keys(window.Utils) : 'N/A',
        'Utils.DOM': typeof window.Utils?.DOM,
        'Utils.Numbers': typeof window.Utils?.Numbers,
        'Utils.Performance': typeof window.Utils?.Performance,
        'DOM keys': window.Utils?.DOM ? Object.keys(window.Utils.DOM) : 'N/A',
        'Numbers keys': window.Utils?.Numbers ? Object.keys(window.Utils.Numbers) : 'N/A',
        'Performance keys': window.Utils?.Performance ? Object.keys(window.Utils.Performance) : 'N/A'
    });
    
    const tests = [
        // Test DOM utilities
        {
            name: 'Utils.DOM.debounce',
            test: () => typeof window.Utils.DOM.debounce === 'function'
        },
        {
            name: 'Utils.DOM.throttle', 
            test: () => typeof window.Utils.DOM.throttle === 'function'
        },
        {
            name: 'Utils.DOM.getElement',
            test: () => typeof window.Utils.DOM.getElement === 'function'
        },
        
        // Test Numbers utilities
        {
            name: 'Utils.Numbers.formatNumber',
            test: () => window.Utils.Numbers.formatNumber(3.14159, 2) === '3.14'
        },
        {
            name: 'Utils.Numbers.clamp',
            test: () => window.Utils.Numbers.clamp(15, 0, 10) === 10
        },
        {
            name: 'Utils.Numbers.parseFloatSafe',
            test: () => window.Utils.Numbers.parseFloatSafe('3.14') === 3.14
        },
        {
            name: 'Utils.Numbers.constrainAreaOffset',
            test: () => {
                const result = window.Utils.Numbers.constrainAreaOffset(50, 50, 100, 100, 200, 200);
                return result && result.x === 50 && result.y === 50;
            }
        },
        
        // Test Performance utilities
        {
            name: 'Utils.Performance.memoize',
            test: () => typeof window.Utils.Performance.memoize === 'function'
        },
        
        // Test legacy compatibility
        {
            name: 'Utils.debounce (legacy)',
            test: () => window.Utils.debounce === window.Utils.DOM.debounce
        },
        {
            name: 'Utils.formatNumber (legacy)',
            test: () => window.Utils.formatNumber === window.Utils.Numbers.formatNumber
        },
        {
            name: 'Utils.clamp (legacy)',
            test: () => window.Utils.clamp === window.Utils.Numbers.clamp
        },
        
        // Test global access
        {
            name: 'window.Utils',
            test: () => typeof window.Utils === 'object'
        },
        {
            name: 'window.formatNumber',
            test: () => typeof window.formatNumber === 'function'
        },
        {
            name: 'window.constrainAreaOffset',
            test: () => typeof window.constrainAreaOffset === 'function'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - Test returned false`);
                failed++;
            }
        } catch (error) {
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

// Auto-run test if in browser environment
if (typeof window !== 'undefined' && window.Utils) {
    // Run test after a short delay to ensure everything is loaded
    setTimeout(() => {
        runQuickTest();
    }, 1000);
} else if (typeof window !== 'undefined') {
    // If Utils is not available, wait a bit longer and try again
    setTimeout(() => {
        if (window.Utils) {
            runQuickTest();
        } else {
            console.log('⚠️ Utils module not found. Make sure it\'s loaded properly.');
        }
    }, 2000);
} 
