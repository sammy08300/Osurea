/**
 * Test Loader - Automatically loads and exposes Osurea tests
 * Usage: Include this script in your HTML or load it manually in console
 */

(async function() {
    try {
        console.log('🧪 Loading Osurea tests...');
        
        // Ensure Utils is available globally before running tests
        if (!window.Utils) {
            console.log('📦 Loading Utils module...');
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
            
            console.log('✅ Utils module loaded and made available globally');
        }
        
        // Ensure Utils has the correct structure (fix missing namespaces)
        if (window.Utils && (!window.Utils.DOM || !window.Utils.Numbers || !window.Utils.Performance)) {
            console.log('🔧 Fixing Utils object structure...');
            
            // Import the module again to get fresh references
            const utilsModule = await import('../utils/index.js');
            
            // Ensure namespaces are properly attached
            if (!window.Utils.DOM) window.Utils.DOM = utilsModule.DOM;
            if (!window.Utils.Numbers) window.Utils.Numbers = utilsModule.Numbers;
            if (!window.Utils.Performance) window.Utils.Performance = utilsModule.Performance;
            
            console.log('✅ Utils object structure fixed');
        }
        
        // Debug: Check what's actually in the Utils object
        console.log('🔍 Utils object structure:', {
            Utils: typeof window.Utils,
            'Utils.DOM': typeof window.Utils?.DOM,
            'Utils.Numbers': typeof window.Utils?.Numbers,
            'Utils.Performance': typeof window.Utils?.Performance,
            'Utils keys': window.Utils ? Object.keys(window.Utils) : 'N/A'
        });
        
        // Ensure localeManager is available globally for translation tests
        if (!window.localeManager) {
            console.log('🌍 Loading LocaleManager...');
            const localeModule = await import('../../locales/index.js');
            window.localeManager = localeModule.default;
            
            // Also make translateWithFallback available if it exists
            try {
                const i18nModule = await import('../i18n-init.js');
                if (i18nModule.translateWithFallback) {
                    window.translateWithFallback = i18nModule.translateWithFallback;
                }
            } catch (error) {
                console.log('Note: translateWithFallback not available');
            }
            
            console.log('✅ LocaleManager loaded and made available globally');
        }
        
        // Ensure StorageManager is available globally for storage tests
        // Note: We need to override the native browser StorageManager
        console.log('💾 Loading StorageManager...');
        const storageModule = await import('../utils/storage.js');
        
        // Force override the native StorageManager with our custom one
        window.StorageManager = storageModule.StorageManager;
        
        console.log('✅ StorageManager loaded and made available globally');
        console.log('🔍 StorageManager methods:', Object.keys(window.StorageManager));
        
        // Import the main test runner
        const testModule = await import('./run-all-tests.js');
        
        // Create global test object
        window.OsureaTest = {
            runAll: testModule.runAllTests,
            runCritical: testModule.runCriticalTests,
            diagnose: testModule.quickDiagnosis
        };
        
        // Also create the osureaTests object for compatibility
        window.osureaTests = window.OsureaTest;
        
        console.log('✅ Osurea tests loaded successfully!');
        console.log('📋 Available commands:');
        console.log('  • OsureaTest.runAll() - Run all tests');
        console.log('  • OsureaTest.runCritical() - Run critical tests only');
        console.log('  • OsureaTest.diagnose() - Quick diagnosis');
        console.log('  • osureaTests.runAll() - Alternative syntax');
        
    } catch (error) {
        console.error('❌ Failed to load Osurea tests:', error);
        console.log('💡 Make sure you are on the correct page and all test files exist.');
    }
})(); 