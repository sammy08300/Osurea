/**
 * 🎯 Dimensions Console Commands Tests
 * Tests pour les commandes checkDimensions() et dims()
 */

/**
 * Test principal des commandes de dimensions
 */
export function testDimensionsCommands() {
    console.group('🎯 Testing Dimensions Console Commands');
    
    let passed = 0;
    let failed = 0;
    const results = [];
    
    try {
        // Test 1: Vérifier que les commandes existent
        console.log('📝 Test 1: Checking if commands exist...');
        if (typeof window.checkDimensions === 'function') {
            console.log('✅ checkDimensions() function exists');
            passed++;
            results.push({ test: 'checkDimensions exists', status: 'passed' });
        } else {
            console.error('❌ checkDimensions() function not found');
            failed++;
            results.push({ test: 'checkDimensions exists', status: 'failed', error: 'Function not found' });
        }
        
        if (typeof window.dims === 'function') {
            console.log('✅ dims() shortcut exists');
            passed++;
            results.push({ test: 'dims shortcut exists', status: 'passed' });
        } else {
            console.error('❌ dims() shortcut not found');
            failed++;
            results.push({ test: 'dims shortcut exists', status: 'failed', error: 'Shortcut not found' });
        }
        
        // Test 2: Vérifier que les éléments DOM existent
        console.log('📝 Test 2: Checking DOM elements...');
        const requiredElements = [
            'areaWidth', 'areaHeight', 'areaOffsetX', 'areaOffsetY',
            'customRatio', 'areaRadius', 'tabletWidth', 'tabletHeight',
            'tabletSelectorText'
        ];
        
        let elementsFound = 0;
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                elementsFound++;
            } else {
                console.warn(`⚠️ Element ${id} not found`);
            }
        });
        
        if (elementsFound >= 7) { // Au moins 7 sur 9 éléments requis
            console.log(`✅ DOM elements check passed (${elementsFound}/${requiredElements.length})`);
            passed++;
            results.push({ test: 'DOM elements', status: 'passed', details: `${elementsFound}/${requiredElements.length}` });
        } else {
            console.error(`❌ Not enough DOM elements found (${elementsFound}/${requiredElements.length})`);
            failed++;
            results.push({ test: 'DOM elements', status: 'failed', error: `Only ${elementsFound}/${requiredElements.length} found` });
        }
        
        // Test 3: Exécuter checkDimensions() et vérifier le retour
        console.log('📝 Test 3: Testing checkDimensions() execution...');
        try {
            const result = window.checkDimensions();
            
            if (result && typeof result === 'object') {
                console.log('✅ checkDimensions() returns valid object');
                passed++;
                results.push({ test: 'checkDimensions execution', status: 'passed' });
                
                // Vérifier la structure de l'objet retourné
                const expectedKeys = ['tablet', 'area', 'analysis', 'performance'];
                const hasAllKeys = expectedKeys.every(key => result.hasOwnProperty(key));
                
                if (hasAllKeys) {
                    console.log('✅ Return object has correct structure');
                    passed++;
                    results.push({ test: 'Return object structure', status: 'passed' });
                } else {
                    console.error('❌ Return object missing required keys');
                    failed++;
                    results.push({ test: 'Return object structure', status: 'failed', error: 'Missing keys' });
                }
                
                // Vérifier les données de la tablette
                if (result.tablet && typeof result.tablet.width === 'number' && typeof result.tablet.height === 'number') {
                    console.log('✅ Tablet data is valid');
                    passed++;
                    results.push({ test: 'Tablet data validation', status: 'passed' });
                } else {
                    console.error('❌ Invalid tablet data');
                    failed++;
                    results.push({ test: 'Tablet data validation', status: 'failed', error: 'Invalid data types' });
                }
                
                // Vérifier les données de la zone active
                if (result.area && typeof result.area.width === 'number' && typeof result.area.height === 'number') {
                    console.log('✅ Area data is valid');
                    passed++;
                    results.push({ test: 'Area data validation', status: 'passed' });
                } else {
                    console.error('❌ Invalid area data');
                    failed++;
                    results.push({ test: 'Area data validation', status: 'failed', error: 'Invalid data types' });
                }
                
            } else {
                console.error('❌ checkDimensions() does not return valid object');
                failed++;
                results.push({ test: 'checkDimensions execution', status: 'failed', error: 'Invalid return value' });
            }
        } catch (error) {
            console.error('❌ Error executing checkDimensions():', error);
            failed++;
            results.push({ test: 'checkDimensions execution', status: 'failed', error: error.message });
        }
        
        // Test 4: Tester le raccourci dims()
        console.log('📝 Test 4: Testing dims() shortcut...');
        try {
            const result1 = window.checkDimensions();
            const result2 = window.dims();
            
            // Comparer les résultats (ils devraient être identiques)
            const areEqual = JSON.stringify(result1) === JSON.stringify(result2);
            
            if (areEqual) {
                console.log('✅ dims() shortcut works correctly');
                passed++;
                results.push({ test: 'dims shortcut functionality', status: 'passed' });
            } else {
                console.error('❌ dims() shortcut returns different result');
                failed++;
                results.push({ test: 'dims shortcut functionality', status: 'failed', error: 'Different results' });
            }
        } catch (error) {
            console.error('❌ Error testing dims() shortcut:', error);
            failed++;
            results.push({ test: 'dims shortcut functionality', status: 'failed', error: error.message });
        }
        
        // Test 5: Vérifier les calculs
        console.log('📝 Test 5: Testing calculations...');
        try {
            const result = window.checkDimensions();
            
            // Vérifier que les calculs sont cohérents
            const calculatedSurface = result.area.width * result.area.height;
            const reportedSurface = result.area.surface;
            
            if (Math.abs(calculatedSurface - reportedSurface) < 0.01) {
                console.log('✅ Area surface calculation is correct');
                passed++;
                results.push({ test: 'Surface calculation', status: 'passed' });
            } else {
                console.error('❌ Area surface calculation is incorrect');
                failed++;
                results.push({ test: 'Surface calculation', status: 'failed', error: 'Math error' });
            }
            
            // Vérifier le ratio
            const calculatedRatio = result.area.width / result.area.height;
            const reportedRatio = result.area.ratio;
            
            if (Math.abs(calculatedRatio - reportedRatio) < 0.01) {
                console.log('✅ Area ratio calculation is correct');
                passed++;
                results.push({ test: 'Ratio calculation', status: 'passed' });
            } else {
                console.error('❌ Area ratio calculation is incorrect');
                failed++;
                results.push({ test: 'Ratio calculation', status: 'failed', error: 'Math error' });
            }
            
        } catch (error) {
            console.error('❌ Error testing calculations:', error);
            failed++;
            results.push({ test: 'Calculations', status: 'failed', error: error.message });
        }
        
    } catch (error) {
        console.error('❌ Critical error in dimensions tests:', error);
        failed++;
        results.push({ test: 'Critical error', status: 'failed', error: error.message });
    }
    
    // Résumé des résultats
    console.log('\n📊 Dimensions Tests Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🎯 Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('🎉 All dimensions tests passed!');
    } else {
        console.warn('⚠️ Some dimensions tests failed. Check details above.');
    }
    
    console.groupEnd();
    
    return {
        passed,
        failed,
        total: passed + failed,
        successRate: (passed / (passed + failed)) * 100,
        results
    };
}

/**
 * Test rapide des commandes de dimensions
 */
export function quickDimensionsTest() {
    console.group('⚡ Quick Dimensions Test');
    
    try {
        // Test basique d'existence et d'exécution
        if (typeof window.checkDimensions === 'function' && typeof window.dims === 'function') {
            const result = window.dims();
            
            if (result && typeof result === 'object' && result.tablet && result.area) {
                console.log('✅ Dimensions commands working correctly');
                console.groupEnd();
                return { status: 'success', message: 'Dimensions commands operational' };
            } else {
                console.error('❌ Dimensions commands return invalid data');
                console.groupEnd();
                return { status: 'error', message: 'Invalid data returned' };
            }
        } else {
            console.error('❌ Dimensions commands not available');
            console.groupEnd();
            return { status: 'error', message: 'Commands not found' };
        }
    } catch (error) {
        console.error('❌ Error in quick dimensions test:', error);
        console.groupEnd();
        return { status: 'error', message: error.message };
    }
}

/**
 * Diagnostic des problèmes de dimensions
 */
export function diagnoseDimensionsIssues() {
    console.group('🔍 Dimensions Diagnostic');
    
    const issues = [];
    
    // Vérifier l'existence des commandes
    if (typeof window.checkDimensions !== 'function') {
        issues.push('❌ checkDimensions() function not found');
    }
    
    if (typeof window.dims !== 'function') {
        issues.push('❌ dims() shortcut not found');
    }
    
    // Vérifier les éléments DOM critiques
    const criticalElements = ['areaWidth', 'areaHeight', 'tabletWidth', 'tabletHeight'];
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            issues.push(`❌ Critical element missing: ${id}`);
        } else if (isNaN(parseFloat(element.value))) {
            issues.push(`⚠️ Invalid value in element: ${id}`);
        }
    });
    
    // Tester l'exécution
    try {
        if (typeof window.checkDimensions === 'function') {
            const result = window.checkDimensions();
            if (!result || typeof result !== 'object') {
                issues.push('❌ checkDimensions() returns invalid result');
            }
        }
    } catch (error) {
        issues.push(`❌ Error executing checkDimensions(): ${error.message}`);
    }
    
    // Afficher les résultats
    if (issues.length === 0) {
        console.log('✅ No issues found with dimensions commands');
    } else {
        console.log('🚨 Issues found:');
        issues.forEach(issue => console.log(issue));
    }
    
    console.groupEnd();
    
    return {
        hasIssues: issues.length > 0,
        issues,
        count: issues.length
    };
}

/**
 * Test de performance des commandes
 */
export function testDimensionsPerformance() {
    console.group('⚡ Dimensions Performance Test');
    
    if (typeof window.checkDimensions !== 'function') {
        console.error('❌ checkDimensions() not available for performance test');
        console.groupEnd();
        return { error: 'Function not available' };
    }
    
    const iterations = 100;
    const times = [];
    
    console.log(`🔄 Running ${iterations} iterations...`);
    
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        window.checkDimensions();
        const end = performance.now();
        times.push(end - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxTime.toFixed(2)}ms`);
    
    if (avgTime < 5) {
        console.log('✅ Excellent performance');
    } else if (avgTime < 10) {
        console.log('✅ Good performance');
    } else {
        console.warn('⚠️ Performance could be improved');
    }
    
    console.groupEnd();
    
    return {
        average: avgTime,
        min: minTime,
        max: maxTime,
        iterations
    };
}

// Export pour utilisation dans d'autres tests
export default {
    testDimensionsCommands,
    quickDimensionsTest,
    diagnoseDimensionsIssues,
    testDimensionsPerformance
}; 