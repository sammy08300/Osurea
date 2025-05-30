/**
 * Script to run all Osurea tests
 * Usage: import('./assets/js/tests/run-all-tests.js').then(m => m.runAllTests());
 */

/**
 * Runs all available tests
 */
export async function runAllTests() {
    console.log('🧪 Osurea - Running all tests...\n');
    
    const results = {
        utils: null,
        translations: null,
        storage: null,
        visualization: null,
        dimensions: null,
        total: { passed: 0, failed: 0, tests: 0 }
    };
    
    try {
        // Utility tests
        console.log('📦 Utility tests...');
        const utilsModule = await import('./quick-test.js');
        results.utils = utilsModule.runQuickTest();
        
        // Translation tests
        console.log('\n🌍 Translation tests...');
        const translationsModule = await import('./translation-test.js');
        results.translations = translationsModule.testTranslations();
        
        // Storage tests
        console.log('\n💾 Storage tests...');
        const storageModule = await import('./storage.test.js');
        results.storage = storageModule.runStorageTests();
        
        // Visualization tests
        console.log('\n🎨 Visualization tests...');
        const visualizationModule = await import('./visualization-test.js');
        results.visualization = visualizationModule.runVisualizationTest();
        
        // Dimensions tests
        console.log('\n🎯 Dimensions console commands tests...');
        const dimensionsModule = await import('./dimensions-test.js');
        results.dimensions = dimensionsModule.testDimensionsCommands();
        
        // Calculate totals
        if (results.utils) {
            results.total.passed += results.utils.passed || 0;
            results.total.failed += results.utils.failed || 0;
            results.total.tests += results.utils.total || 0;
        }
        
        if (results.translations) {
            results.total.passed += results.translations.passed || 0;
            results.total.failed += results.translations.failed || 0;
            results.total.tests += results.translations.total || 0;
        }
        
        if (results.storage) {
            results.total.passed += results.storage.passed || 0;
            results.total.failed += results.storage.failed || 0;
            results.total.tests += results.storage.total || 0;
        }
        
        if (results.visualization) {
            results.total.passed += results.visualization.passed || 0;
            results.total.failed += results.visualization.failed || 0;
            results.total.tests += results.visualization.total || 0;
        }
        
        if (results.dimensions) {
            results.total.passed += results.dimensions.passed || 0;
            results.total.failed += results.dimensions.failed || 0;
            results.total.tests += results.dimensions.total || 0;
        }
        
        // Display summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 GLOBAL TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Tests passed: ${results.total.passed}`);
        console.log(`❌ Tests failed: ${results.total.failed}`);
        console.log(`📈 Total: ${results.total.tests} tests`);
        
        const successRate = results.total.tests > 0 
            ? Math.round((results.total.passed / results.total.tests) * 100) 
            : 0;
        console.log(`🎯 Success rate: ${successRate}%`);
        
        if (results.total.failed === 0) {
            console.log('\n🎉 All tests passed! Your application is ready.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the details above.');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Error during test execution:', error);
        return null;
    }
}

/**
 * Runs only critical tests (translations + storage)
 */
export async function runCriticalTests() {
    console.log('🚨 Critical tests only...\n');
    
    try {
        // Translation tests
        console.log('🌍 Translation tests...');
        const translationsModule = await import('./translation-test.js');
        const translationResults = translationsModule.testTranslations();
        
        // Storage tests
        console.log('\n💾 Storage tests...');
        const storageModule = await import('./storage.test.js');
        const storageResults = storageModule.runStorageTests();
        
        const totalPassed = (translationResults.passed || 0) + (storageResults.passed || 0);
        const totalFailed = (translationResults.failed || 0) + (storageResults.failed || 0);
        
        console.log('\n📊 Critical tests summary:');
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);
        
        return { passed: totalPassed, failed: totalFailed };
        
    } catch (error) {
        console.error('❌ Error during critical tests:', error);
        return null;
    }
}

/**
 * Quick problem diagnosis
 */
export async function quickDiagnosis() {
    console.log('🔍 Quick diagnosis...\n');
    
    try {
        // Translation diagnosis
        const translationsModule = await import('./translation-test.js');
        translationsModule.diagnoseTranslationIssues();
        
        console.log('\n💡 Tip: If problems are detected, use runAllTests() for more details.');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    }
}

// Auto-execution if called directly
if (typeof window !== 'undefined' && window.location) {
    // Add global shortcuts for easy use
    window.osureaTests = {
        runAll: runAllTests,
        runCritical: runCriticalTests,
        diagnose: quickDiagnosis
    };
    
    // Tests loaded silently
} 
