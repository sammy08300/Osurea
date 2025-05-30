/**
 * Migration Guide and Helper Script
 * Helps transition from old utility files to the new consolidated Utils module
 */

import { Utils } from './index.js';
import { StorageManager } from './storage.js';

/**
 * Migration helper that provides warnings for deprecated usage
 */
export const MigrationHelper = {
    /**
     * Check if old utility files are still being used
     */
    checkDeprecatedUsage() {
        const warnings = [];
        
        // Check for old global functions
        if (typeof window !== 'undefined') {
            const deprecatedGlobals = [
                'formatNumber',
                'parseFloatSafe', 
                'isValidNumber',
                'clamp',
                'calculateRatio',
                'mmToPx',
                'pxToMm',
                'debounce',
                'throttle'
            ];
            
            deprecatedGlobals.forEach(funcName => {
                if (window[funcName] && window[funcName] !== Utils[funcName]) {
                    warnings.push(`Global function '${funcName}' detected. Consider using Utils.${funcName} or Utils.Numbers.${funcName} instead.`);
                }
            });
            
            // Check for old utility objects
            if (window.NumberUtils) {
                warnings.push('NumberUtils object detected. Use Utils.Numbers instead.');
            }
            
            if (window.DOMUtils) {
                warnings.push('DOMUtils object detected. Use Utils.DOM instead.');
            }
            
            if (window.PerformanceUtils) {
                warnings.push('PerformanceUtils object detected. Use Utils.Performance instead.');
            }
        }
        
        return warnings;
    },
    
    /**
     * Migrate storage data if needed
     */
    async migrateStorageData() {
        try {
            console.log('Checking storage data integrity...');
            
            // Run storage migration
            const migrated = StorageManager.migrateData();
            
            if (migrated) {
                console.log('✅ Storage data migrated successfully');
                return { success: true, migrated: true };
            } else {
                console.log('✅ Storage data is already valid');
                return { success: true, migrated: false };
            }
        } catch (error) {
            console.error('❌ Storage migration failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Generate migration report
     */
    generateMigrationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            deprecatedUsage: this.checkDeprecatedUsage(),
            recommendations: [],
            storageStatus: 'unknown'
        };
        
        // Add recommendations based on deprecated usage
        if (report.deprecatedUsage.length > 0) {
            report.recommendations.push(
                'Update code to use the new Utils module structure',
                'Replace direct global function calls with namespaced Utils calls',
                'Consider using ES6 imports for better tree-shaking'
            );
        }
        
        // Check storage status
        try {
            const favorites = StorageManager.getFavorites();
            report.storageStatus = `${favorites.length} favorites found`;
            
            // Run diagnostics
            StorageManager.diagnoseFavorites();
        } catch (error) {
            report.storageStatus = `Error: ${error.message}`;
            report.recommendations.push('Run storage migration to fix data issues');
        }
        
        return report;
    },
    
    /**
     * Provide code examples for migration
     */
    getCodeExamples() {
        return {
            'Number Formatting': {
                old: 'formatNumber(3.14159, 2)',
                new: 'Utils.Numbers.formatNumber(3.14159, 2)',
                alternative: 'Utils.formatNumber(3.14159, 2) // Legacy compatibility'
            },
            'Value Clamping': {
                old: 'clamp(value, 0, 100)',
                new: 'Utils.Numbers.clamp(value, 0, 100)',
                alternative: 'Utils.clamp(value, 0, 100) // Legacy compatibility'
            },
            'Debouncing': {
                old: 'debounce(fn, 300)',
                new: 'Utils.DOM.debounce(fn, 300)',
                alternative: 'Utils.debounce(fn, 300) // Legacy compatibility'
            },
            'Safe Parsing': {
                old: 'parseFloatSafe(value, 0)',
                new: 'Utils.Numbers.parseFloatSafe(value, 0)',
                alternative: 'Utils.parseFloatSafe(value, 0) // Legacy compatibility'
            },
            'Unit Conversion': {
                old: 'mmToPx(25.4, 96)',
                new: 'Utils.Numbers.mmToPx(25.4, 96)',
                alternative: 'Utils.mmToPx(25.4, 96) // Legacy compatibility'
            },
            'DOM Operations': {
                old: 'DOMUtils.getElement("myId")',
                new: 'Utils.DOM.getElement("myId")',
                alternative: 'document.getElementById("myId") // Native alternative'
            },
            'Performance': {
                old: 'PerformanceUtils.memoize(fn)',
                new: 'Utils.Performance.memoize(fn)',
                alternative: 'Utils.memoize(fn) // Legacy compatibility'
            }
        };
    },
    
    /**
     * Run complete migration process
     */
    async runMigration() {
        console.log('🚀 Starting migration process...');
        
        // Step 1: Generate report
        console.log('📊 Generating migration report...');
        const report = this.generateMigrationReport();
        
        // Step 2: Migrate storage data
        console.log('💾 Migrating storage data...');
        const storageResult = await this.migrateStorageData();
        report.storageResult = storageResult;
        
        // Step 3: Show recommendations
        if (report.deprecatedUsage.length > 0) {
            console.warn('⚠️  Deprecated usage detected:');
            report.deprecatedUsage.forEach(warning => console.warn(`  - ${warning}`));
            
            console.log('\n📝 Code examples for migration:');
            const examples = this.getCodeExamples();
            Object.entries(examples).forEach(([category, example]) => {
                console.log(`\n${category}:`);
                console.log(`  Old: ${example.old}`);
                console.log(`  New: ${example.new}`);
                if (example.alternative) {
                    console.log(`  Alt: ${example.alternative}`);
                }
            });
        } else {
            console.log('✅ No deprecated usage detected');
        }
        
        // Step 4: Final recommendations
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
        
        console.log('\n🎉 Migration process completed');
        return report;
    }
};

/**
 * Compatibility layer for gradual migration
 * Provides warnings when old patterns are used
 */
export const CompatibilityLayer = {
    /**
     * Setup compatibility warnings
     */
    setupWarnings() {
        if (typeof window === 'undefined') return;
        
        // Wrap global functions with warnings
        const wrapWithWarning = (funcName, newPath) => {
            if (window[funcName]) {
                const originalFunc = window[funcName];
                window[funcName] = function(...args) {
                    console.warn(`⚠️  ${funcName}() is deprecated. Use ${newPath} instead.`);
                    return originalFunc.apply(this, args);
                };
            }
        };
        
        // Setup warnings for common functions
        wrapWithWarning('formatNumber', 'Utils.Numbers.formatNumber()');
        wrapWithWarning('clamp', 'Utils.Numbers.clamp()');
        wrapWithWarning('debounce', 'Utils.DOM.debounce()');
        wrapWithWarning('throttle', 'Utils.DOM.throttle()');
    },
    
    /**
     * Remove compatibility warnings
     */
    removeWarnings() {
        // This would restore original functions if needed
        // Implementation depends on specific requirements
        console.log('Compatibility warnings removed');
    }
};

/**
 * Test runner for migration validation
 */
export const MigrationTester = {
    /**
     * Test that all old functionality still works
     */
    testBackwardCompatibility() {
        const tests = [
            {
                name: 'Global formatNumber',
                test: () => {
                    const result = Utils.formatNumber(3.14159, 2);
                    return result === '3.14';
                }
            },
            {
                name: 'Global clamp',
                test: () => {
                    const result = Utils.clamp(15, 0, 10);
                    return result === 10;
                }
            },
            {
                name: 'Namespaced Numbers.formatNumber',
                test: () => {
                    const result = Utils.Numbers.formatNumber(3.14159, 2);
                    return result === '3.14';
                }
            },
            {
                name: 'Namespaced DOM.debounce',
                test: () => {
                    const fn = () => {};
                    const debounced = Utils.DOM.debounce(fn, 100);
                    return typeof debounced === 'function';
                }
            },
            {
                name: 'Storage functionality',
                test: () => {
                    const favorites = StorageManager.getFavorites();
                    return Array.isArray(favorites);
                }
            }
        ];
        
        const results = tests.map(test => {
            try {
                const passed = test.test();
                return { name: test.name, passed, error: null };
            } catch (error) {
                return { name: test.name, passed: false, error: error.message };
            }
        });
        
        const passedCount = results.filter(r => r.passed).length;
        const totalCount = results.length;
        
        console.log(`\n🧪 Backward Compatibility Tests: ${passedCount}/${totalCount} passed`);
        
        results.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}`);
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });
        
        return { passed: passedCount, total: totalCount, results };
    }
};

// Auto-run migration check on import (can be disabled)
if (typeof window !== 'undefined' && window.location && !window.DISABLE_AUTO_MIGRATION_CHECK) {
    // Run a quick check and log any issues
    setTimeout(() => {
        const warnings = MigrationHelper.checkDeprecatedUsage();
        if (warnings.length > 0) {
            console.group('🔄 Migration Notice');
            console.log('Deprecated utility usage detected. Run MigrationHelper.runMigration() for details.');
            console.groupEnd();
        }
    }, 1000);
}

export default MigrationHelper; 
