/**
 * Test Loader - Automatically loads and exposes Osurea tests
 * Usage: Include this script in your HTML or load it manually in console
 */

// Define expected module structures and their functions
// These are simplified; more detailed types would come from the modules themselves if they were TS already.

import { FavoriteObject } from '../components/favorites/types';

interface UtilsModule {
    Utils: any; // Replace 'any' with a more specific type if Utils structure is known
    DOM: any;
    Numbers: any;
    Performance: any;
}

interface LocaleModule {
    default: any; // Assuming localeManager is the default export
}

interface I18nInitModule {
    translateWithFallback?: (...args: any[]) => string; // More generic function type
}

interface StorageModule {
    StorageManager: any; // Replace 'any' if StorageManager structure is known
}

interface TestRunnerModule {
    runAllTests: () => Promise<any>;
    runCriticalTests: () => Promise<any>;
    quickDiagnosis: () => Promise<any>;
}

interface DragDebugModule {
    debugDragFunctionality: () => any;
}

interface DimensionsTestModule {
    testDimensionsCommands: () => any;
    quickDimensionsTest: () => any;
    diagnoseDimensionsIssues: () => any;
    testDimensionsPerformance: () => any;
}

// Extend Window interface for global exposure
declare global {
    interface Window {
        Utils?: {
            DOM: {
                debounce: Function;
                throttle: Function;
                getElement: Function;
            };
            Numbers: {
                formatNumber: (num: number, precision?: number | undefined) => string;
                clamp: (value: number, min: number, max: number) => number;
                parseFloatSafe: (value: string) => number;
                constrainAreaOffset: (offsetX: number, offsetY: number, areaWidth: number, areaHeight: number, tabletWidth: number, tabletHeight: number) => { x: number; y: number };
            };
            Performance: {
                memoize: Function;
            };
            debounce?: Function;
            formatNumber?: (num: number, precision?: number | undefined) => string;
            clamp?: (value: number, min: number, max: number) => number;
        };       
        constrainAreaOffset?: (offsetX: number, offsetY: number, areaWidth: number, areaHeight: number, tabletWidth: number, tabletHeight: number) => { x: number; y: number };
        localeManager?: Window['localeManager']; // Use the globally defined type
        translateWithFallback?: (key: string, fallback?: string | undefined) => string;
        StorageManager?: {
            forceReset: () => FavoriteObject[];
            diagnoseFavorites: () => void;
            clearCache: () => void;
            getFavorites: () => FavoriteObject[];
        };
        OsureaTest?: {
            runAll: () => Promise<any>;
            runCritical: () => Promise<any>;
            diagnose: () => Promise<any>;
            debugDrag: () => any;
            testDimensions: () => any;
            quickDimensions: () => any;
            diagnoseDimensions: () => any;
            performanceDimensions: () => any;
            init: () => boolean;
        };
        osureaTests?: {
            runAll: () => Promise<any | null>;
            runCritical: () => Promise<any | null>;
            diagnose: () => Promise<void>;
        };
    }
}

async function initializeTestEnvironment(): Promise<boolean> {
    try {
        // Load core utilities
        const utilsModule = await import('../utils') as UtilsModule;
        window.Utils = utilsModule.Utils;
        window.DOM = utilsModule.DOM;
        window.Numbers = utilsModule.Numbers;
        window.Utils = utilsModule.Utils; // Assuming Utils is the main export object from index
        window.DOM = utilsModule.DOM; // Assuming DOM is exported directly
        window.Numbers = utilsModule.Numbers; // Assuming Numbers is exported directly
        window.Performance = utilsModule.Performance; // Assuming Performance is exported directly

        // Setup legacy direct access if Utils exists and has these properties
        if (window.Utils) {
            if (window.Utils.DOM && typeof window.Utils.DOM.debounce === 'function') {
                window.debounce = window.Utils.DOM.debounce as any;
            }
            if (window.Utils.DOM && typeof window.Utils.DOM.throttle === 'function') {
                window.throttle = window.Utils.DOM.throttle as any;
            }
            if (window.Utils.Numbers && typeof window.Utils.Numbers.clamp === 'function') {
                window.clamp = window.Utils.Numbers.clamp;
            }
            if (window.Utils.Numbers && typeof window.Utils.Numbers.formatNumber === 'function') {
                window.formatNumber = window.Utils.Numbers.formatNumber;
            }
            if (window.Utils.Numbers && typeof window.Utils.Numbers.parseFloatSafe === 'function') {
                window.parseFloatSafe = window.Utils.Numbers.parseFloatSafe;
            }
            if (window.Utils.Numbers && typeof window.Utils.Numbers.constrainAreaOffset === 'function') {
                window.constrainAreaOffset = window.Utils.Numbers.constrainAreaOffset;
            }
        }

        // Load localization
        if (!window.localeManager) {
            const localeModule = await import('../../locales/index') as LocaleModule;
            window.localeManager = localeModule.default;
            
            try {
                const i18nModule = await import('../i18n-init') as I18nInitModule;
                if (i18nModule.translateWithFallback) {
                    window.translateWithFallback = i18nModule.translateWithFallback;
                }
            } catch (error) {
                // Optional module
            }
        }
        
        const storageModule = await import('../utils/storage') as StorageModule;
        window.StorageManager = storageModule.StorageManager;
        
        const testModule = await import('./run-all-tests') as TestRunnerModule;
        const dragDebugModule = await import('./drag-debug') as DragDebugModule;
        const dimensionsModule = await import('./dimensions-test') as DimensionsTestModule;
        
        window.OsureaTest = {
            runAll: testModule.runAllTests,
            runCritical: testModule.runCriticalTests,
            diagnose: testModule.quickDiagnosis,
            debugDrag: dragDebugModule.debugDragFunctionality,
            testDimensions: dimensionsModule.testDimensionsCommands,
            quickDimensions: dimensionsModule.quickDimensionsTest,
            diagnoseDimensions: dimensionsModule.diagnoseDimensionsIssues,
            performanceDimensions: dimensionsModule.testDimensionsPerformance,
            init: (): boolean => {
                console.log('🧪 Osurea Test Suite Initialized');
                console.log('📋 Available Test Commands:');
                console.log('');
                console.log('🔬 MAIN TEST SUITES:');
                console.log('  • OsureaTest.runAll()        - Run complete test suite');
                // ... (rest of the console.log messages remain the same)
                console.log('  • OsureaTest.runCritical()   - Run critical tests only');
                console.log('  • OsureaTest.diagnose()      - Quick system diagnosis');
                console.log('');
                console.log('🎯 DRAG & VISUALIZATION:');
                console.log('  • OsureaTest.debugDrag()     - Debug drag functionality');
                console.log('  • testCompleteDrag()         - Initialize and test drag system');
                console.log('  • quickDragDiagnosis()       - Quick drag system check');
                console.log('  • forceTestMove()            - Test rectangle movement');
                console.log('  • forceReattachEvents()      - Reattach drag event listeners');
                console.log('');
                console.log('📏 DIMENSIONS CONSOLE COMMANDS:');
                console.log('  • OsureaTest.testDimensions()     - Test dimensions commands');
                console.log('  • OsureaTest.quickDimensions()    - Quick dimensions test');
                console.log('  • OsureaTest.diagnoseDimensions() - Diagnose dimensions issues');
                console.log('  • OsureaTest.performanceDimensions() - Performance test');
                console.log('');
                console.log('🔧 UTILITY FUNCTIONS:');
                console.log('  • initThrottledFunctions()   - Initialize throttled display updates');
                console.log('  • testDragEvents()           - Test drag event attachment');
                console.log('  • testDragFunctionality()    - Verify drag setup');
                console.log('');
                console.log('💡 ALTERNATIVE SYNTAX:');
                console.log('  • osureaTests.runAll()       - Same as OsureaTest.runAll()');
                console.log('  • osureaTests.diagnose()     - Same as OsureaTest.diagnose()');
                console.log('');
                console.log('📖 Usage: Simply type any command above in the console');
                return true;
            }
        };
        
        window.osureaTests = window.OsureaTest;
        
        // Final check and return true if all initializations are successful
        if (window.Utils && window.localeManager && window.StorageManager && window.OsureaTest) {
            window.OsureaTest.init(); // Assuming an init method for OsureaTest itself
            console.log('[TestLoader] Test environment initialized successfully.');
            return true; // Explicitly return true on success
        }

        console.error('[TestLoader] Failed to initialize some critical test components.');
        return false; // Explicitly return false if something failed
    } catch (error) {
        console.error('❌ Failed to load Osurea tests:', error);
        console.log('💡 Make sure you are on the correct page and all test files exist.');
        return false;
    }
}

// Initialize the test environment as soon as the script loads
initializeTestEnvironment().then(initialized => {
    if (initialized) {
        // ... existing code ...
    }
});

export {}; // Make this a module