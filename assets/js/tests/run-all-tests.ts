/**
 * Script to run all Osurea tests
 * Usage: import('./assets/js/tests/run-all-tests.ts').then(m => m.runAllTests());
 */

// Define interfaces for the expected return types of the test modules
interface TestModuleResult {
    passed: number;
    failed: number;
    total: number;
    [key: string]: any; // Allow other properties
}

interface CriticalTestResult {
    passed: number;
    failed: number;
}

// Extend Window interface for global exposure
declare global {
    interface Window {
        osureaTests?: {
            runAll: () => Promise<any | null>;
            runCritical: () => Promise<any | null>;
            diagnose: () => Promise<void>;
        };
    }
}

interface AllTestsResult {
    utils: TestModuleResult | null;
    translations: TestModuleResult | null;
    storage: TestModuleResult | null;
    visualization: TestModuleResult | null;
    dimensions: TestModuleResult | null;
    total: { passed: number; failed: number; tests: number };
}


/**
 * Runs all available tests
 */
export async function runAllTests(): Promise<AllTestsResult | null> {
    console.log('🧪 Osurea - Running all tests...\n');
    
    const results: AllTestsResult = {
        utils: null,
        translations: null,
        storage: null,
        visualization: null,
        dimensions: null,
        total: { passed: 0, failed: 0, tests: 0 }
    };
    
    try {
        console.log('📦 Utility tests...');
        const utilsModule = await import('./quick-test'); // .ts is implicit
        results.utils = utilsModule.runQuickTest();
        
        console.log('\n🌍 Translation tests...');
        const translationsModule = await import('./translation-test');
        results.translations = translationsModule.testTranslations();
        
        console.log('\n💾 Storage tests...');
        const storageModule = await import('./storage.test');
        results.storage = storageModule.runStorageTests();
        
        console.log('\n🎨 Visualization tests...');
        const visualizationModule = await import('./visualization-test');
        results.visualization = visualizationModule.runVisualizationTest();
        
        console.log('\n🎯 Dimensions console commands tests...');
        const dimensionsModule = await import('./dimensions-test');
        results.dimensions = dimensionsModule.testDimensionsCommands();
        
        // Calculate totals more safely
        const modules: (keyof Omit<AllTestsResult, 'total'>)[] = ['utils', 'translations', 'storage', 'visualization', 'dimensions'];
        modules.forEach(moduleKey => {
            const moduleResult = results[moduleKey];
            if (moduleResult) {
                results.total.passed += moduleResult.passed || 0;
                results.total.failed += moduleResult.failed || 0;
                results.total.tests += moduleResult.total || 0;
            }
        });
        
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
export async function runCriticalTests(): Promise<CriticalTestResult | null> {
    console.log('🚨 Critical tests only...\n');
    try {
        console.log('🌍 Translation tests...');
        const translationsModule = await import('./translation-test');
        const translationResults = translationsModule.testTranslations();
        
        console.log('\n💾 Storage tests...');
        const storageModule = await import('./storage.test');
        const storageResults = storageModule.runStorageTests();
        
        const totalPassed = (translationResults?.passed || 0) + (storageResults?.passed || 0);
        const totalFailed = (translationResults?.failed || 0) + (storageResults?.failed || 0);
        
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
export async function quickDiagnosis(): Promise<void> {
    console.log('🔍 Quick diagnosis...\n');
    try {
        const translationsModule = await import('./translation-test');
        // Assuming diagnoseTranslationIssues doesn't return a value or its return is not used here
        await translationsModule.diagnoseTranslationIssues(); 
        
        console.log('\n💡 Tip: If problems are detected, use runAllTests() for more details.');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    }
}

if (typeof window !== 'undefined' && window.location) {
    window.osureaTests = {
        runAll: runAllTests,
        runCritical: runCriticalTests,
        diagnose: quickDiagnosis
    };
    // Tests loaded silently
}
