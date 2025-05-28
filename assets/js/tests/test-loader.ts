/**
 * Test Loader - Automatically loads and exposes Osurea tests
 * Usage: Include this script in your HTML or load it manually in console
 */

// Define expected module structures and their functions
// These are simplified; more detailed types would come from the modules themselves if they were TS already.

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
    translateWithFallback?: Function;
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
        Utils?: any;
        DOM?: any;
        Numbers?: any;
        Performance?: any;
        debounce?: Function;
        throttle?: Function;
        clamp?: Function;
        formatNumber?: Function;
        parseFloatSafe?: Function;
        constrainAreaOffset?: Function;
        localeManager?: any;
        translateWithFallback?: Function;
        StorageManager?: any;
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
        osureaTests?: Window['OsureaTest']; // Alias
    }
}


(async function(): Promise<void> {
    try {
        if (!window.Utils) {
            const utilsModule = await import('../utils/index') as UtilsModule; // Use .ts implicit extension
            window.Utils = utilsModule.Utils;
            window.DOM = utilsModule.DOM;
            window.Numbers = utilsModule.Numbers;
            window.Performance = utilsModule.Performance;
            
            window.debounce = window.Utils.debounce;
            window.throttle = window.Utils.throttle;
            window.clamp = window.Utils.clamp;
            window.formatNumber = window.Utils.formatNumber;
            window.parseFloatSafe = window.Utils.parseFloatSafe;
            window.constrainAreaOffset = window.Utils.constrainAreaOffset;
        }
        
        if (window.Utils && (!window.Utils.DOM || !window.Utils.Numbers || !window.Utils.Performance)) {
            const utilsModule = await import('../utils/index') as UtilsModule;
            if (!window.Utils.DOM) window.Utils.DOM = utilsModule.DOM;
            if (!window.Utils.Numbers) window.Utils.Numbers = utilsModule.Numbers;
            if (!window.Utils.Performance) window.Utils.Performance = utilsModule.Performance;
        }
        
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
        
    } catch (error) {
        console.error('❌ Failed to load Osurea tests:', error);
        console.log('💡 Make sure you are on the correct page and all test files exist.');
    }
})();