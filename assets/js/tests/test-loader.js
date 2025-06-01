/**
 * Test Loader - Automatically loads and exposes Osurea tests
 * Usage: Include this script in your HTML or load it manually in console
 */

(async function() {
    try {
        // Loading tests silently
        
        // Ensure Utils is available globally before running tests
        if (!window.Utils) {
            const utilsModule = await import('../utils/index.js');
            window.Utils = utilsModule.Utils;
            
            // Also make individual namespaces available
            window.DOM = utilsModule.DOM;
            window.Numbers = utilsModule.Numbers;
            window.Performance = utilsModule.Performance;
            
            // Legacy compatibility
            window.debounce = utilsModule.Utils.debounce;
            window.throttle = utilsModule.Utils.throttle;
            window.clamp = utilsModule.Utils.clamp;
            window.formatNumber = utilsModule.Utils.formatNumber;
            window.parseFloatSafe = utilsModule.Utils.parseFloatSafe;
            window.constrainAreaOffset = utilsModule.Utils.constrainAreaOffset;
        }
        
        // Ensure Utils has the correct structure (fix missing namespaces)
        if (window.Utils && (!window.Utils.DOM || !window.Utils.Numbers || !window.Utils.Performance)) {
            // Import the module again to get fresh references
            const utilsModule = await import('../utils/index.js');
            
            // Ensure namespaces are properly attached
            if (!window.Utils.DOM) window.Utils.DOM = utilsModule.DOM;
            if (!window.Utils.Numbers) window.Utils.Numbers = utilsModule.Numbers;
            if (!window.Utils.Performance) window.Utils.Performance = utilsModule.Performance;
        }
        
        // Utils object structure verified
        
        // Ensure localeManager is available globally for translation tests
        if (!window.localeManager) {
            const localeModule = await import('../../locales/index.js');
            window.localeManager = localeModule.default;
            
            // Also make translateWithFallback available if it exists
            try {
                const i18nModule = await import('../i18n-init.js');
                if (i18nModule.translateWithFallback) {
                    window.translateWithFallback = i18nModule.translateWithFallback;
                }
            } catch (error) {
                // translateWithFallback not available
            }
        }
        
        // Ensure StorageManager is available globally for storage tests
        const storageModule = await import('../utils/storage.js');
        window.StorageManager = storageModule.StorageManager;
        
        // Import the main test runner
        const testModule = await import('./run-all-tests.js');
        
        // Import drag debug script
        const dragDebugModule = await import('./drag-debug.js');
        
        // Import dimensions test module
        const dimensionsModule = await import('./dimensions-test.js');
        
        // Create global test object
        window.OsureaTest = {
            runAll: testModule.runAllTests,
            runCritical: testModule.runCriticalTests,
            diagnose: testModule.quickDiagnosis,
            debugDrag: dragDebugModule.debugDragFunctionality,
            testDimensions: dimensionsModule.testDimensionsCommands,
            quickDimensions: dimensionsModule.quickDimensionsTest,
            diagnoseDimensions: dimensionsModule.diagnoseDimensionsIssues,
            performanceDimensions: dimensionsModule.testDimensionsPerformance,
            init: () => {
                console.log('🧪 Osurea Test Suite Initialized');
                console.log('📋 Available Test Commands:');
                console.log('');
                console.log('🔬 MAIN TEST SUITES:');
                console.log('  • OsureaTest.runAll()        - Run complete test suite');
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
        
        // Also create the osureaTests object for compatibility
        window.osureaTests = window.OsureaTest;
        
        // Silent initialization - tests ready but not announced
        
    } catch (error) {
        console.error('❌ Failed to load Osurea tests:', error);
        console.log('💡 Make sure you are on the correct page and all test files exist.');
    }
})(); 