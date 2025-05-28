/**
 * Migration Guide and Helper Script
 * Helps transition from old utility files to the new consolidated Utils module
 */

import { Utils } from './index.js'; // Assuming Utils has a defined structure
import { StorageManager as ActualStorageManager } from './storage.js'; // Actual import

// Placeholder for StorageManager if its type definition is complex or not yet available
// For now, we'll use 'any'. Ideally, this would be properly typed.
const StorageManager: any = ActualStorageManager;

interface MigrationReport {
    timestamp: string;
    deprecatedUsage: string[];
    recommendations: string[];
    storageStatus: string;
    storageResult?: { success: boolean; migrated?: boolean; error?: string };
}

interface CodeExample {
    old: string;
    new: string;
    alternative?: string;
}

interface CodeExamples {
    [category: string]: CodeExample;
}

interface TestResult {
    name: string;
    passed: boolean;
    error: string | null;
}

interface TestSummary {
    passed: number;
    total: number;
    results: TestResult[];
}


/**
 * Migration helper that provides warnings for deprecated usage
 */
export const MigrationHelper = {
    checkDeprecatedUsage(): string[] {
        const warnings: string[] = [];
        const win = window as any;

        if (typeof win !== 'undefined') {
            const deprecatedGlobals: string[] = [
                'formatNumber', 'parseFloatSafe', 'isValidNumber', 'clamp',
                'calculateRatio', 'mmToPx', 'pxToMm', 'debounce', 'throttle'
            ];
            
            deprecatedGlobals.forEach((funcName: string) => {
                if (win[funcName] && win[funcName] !== (Utils as any)[funcName] && 
                    win[funcName] !== (Utils.Numbers as any)[funcName] && 
                    win[funcName] !== (Utils.DOM as any)[funcName]) {
                    warnings.push(`Global function '${funcName}' detected. Consider using Utils.Numbers.${funcName} or Utils.DOM.${funcName} or Utils.${funcName} instead.`);
                }
            });
            
            if (win.NumberUtils) warnings.push('NumberUtils object detected. Use Utils.Numbers instead.');
            if (win.DOMUtils) warnings.push('DOMUtils object detected. Use Utils.DOM instead.');
            if (win.PerformanceUtils) warnings.push('PerformanceUtils object detected. Use Utils.Performance instead.');
        }
        return warnings;
    },
    
    async migrateStorageData(): Promise<{ success: boolean; migrated?: boolean; error?: string }> {
        try {
            console.log('Checking storage data integrity...');
            const migrated = await StorageManager.migrateData(); // Assuming migrateData is async or returns a promise
            
            if (migrated) {
                console.log('✅ Storage data migrated successfully');
                return { success: true, migrated: true };
            } else {
                console.log('✅ Storage data is already valid');
                return { success: true, migrated: false };
            }
        } catch (error: any) {
            console.error('❌ Storage migration failed:', error.message);
            return { success: false, error: error.message };
        }
    },
    
    generateMigrationReport(): MigrationReport {
        const report: MigrationReport = {
            timestamp: new Date().toISOString(),
            deprecatedUsage: this.checkDeprecatedUsage(),
            recommendations: [],
            storageStatus: 'unknown'
        };
        
        if (report.deprecatedUsage.length > 0) {
            report.recommendations.push(
                'Update code to use the new Utils module structure',
                'Replace direct global function calls with namespaced Utils calls',
                'Consider using ES6 imports for better tree-shaking'
            );
        }
        
        try {
            const favorites = StorageManager.getFavorites(); // Assuming this returns an array
            report.storageStatus = `${(favorites as any[]).length} favorites found`;
            StorageManager.diagnoseFavorites();
        } catch (error: any) {
            report.storageStatus = `Error: ${error.message}`;
            report.recommendations.push('Run storage migration to fix data issues');
        }
        return report;
    },
    
    getCodeExamples(): CodeExamples {
        return {
            'Number Formatting': { old: 'formatNumber(3.14159, 2)', new: 'Utils.Numbers.formatNumber(3.14159, 2)', alternative: 'Utils.formatNumber(3.14159, 2)' },
            'Value Clamping': { old: 'clamp(value, 0, 100)', new: 'Utils.Numbers.clamp(value, 0, 100)', alternative: 'Utils.clamp(value, 0, 100)' },
            'Debouncing': { old: 'debounce(fn, 300)', new: 'Utils.DOM.debounce(fn, 300)', alternative: 'Utils.debounce(fn, 300)' },
            'Safe Parsing': { old: 'parseFloatSafe(value, 0)', new: 'Utils.Numbers.parseFloatSafe(value, 0)', alternative: 'Utils.parseFloatSafe(value, 0)' },
            'Unit Conversion': { old: 'mmToPx(25.4, 96)', new: 'Utils.Numbers.mmToPx(25.4, 96)', alternative: 'Utils.mmToPx(25.4, 96)' },
            'DOM Operations': { old: 'DOMUtils.getElement("myId")', new: 'Utils.DOM.getElement("myId")', alternative: 'document.getElementById("myId")' },
            'Performance': { old: 'PerformanceUtils.memoize(fn)', new: 'Utils.Performance.memoize(fn)', alternative: 'Utils.memoize(fn)' }
        };
    },
    
    async runMigration(): Promise<MigrationReport> {
        console.log('🚀 Starting migration process...');
        const report = this.generateMigrationReport();
        
        console.log('💾 Migrating storage data...');
        const storageResult = await this.migrateStorageData();
        report.storageResult = storageResult; // Attach storage result to the main report
        
        if (report.deprecatedUsage.length > 0) {
            console.warn('⚠️  Deprecated usage detected:');
            report.deprecatedUsage.forEach((warning: string) => console.warn(`  - ${warning}`));
            
            console.log('\n📝 Code examples for migration:');
            const examples = this.getCodeExamples();
            Object.entries(examples).forEach(([category, example]: [string, CodeExample]) => {
                console.log(`\n${category}:`);
                console.log(`  Old: ${example.old}`);
                console.log(`  New: ${example.new}`);
                if (example.alternative) console.log(`  Alt: ${example.alternative}`);
            });
        } else {
            console.log('✅ No deprecated usage detected');
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
        }
        
        console.log('\n🎉 Migration process completed');
        return report;
    }
};

export const CompatibilityLayer = {
    setupWarnings(): void {
        const win = window as any;
        if (typeof win === 'undefined') return;
        
        const wrapWithWarning = (funcName: string, newPath: string): void => {
            if (win[funcName]) {
                const originalFunc = win[funcName];
                win[funcName] = function(this: any, ...args: any[]) { // Provide `this` type
                    console.warn(`⚠️  ${funcName}() is deprecated. Use ${newPath} instead.`);
                    return originalFunc.apply(this, args);
                };
            }
        };
        
        wrapWithWarning('formatNumber', 'Utils.Numbers.formatNumber()');
        wrapWithWarning('clamp', 'Utils.Numbers.clamp()');
        wrapWithWarning('debounce', 'Utils.DOM.debounce()');
        wrapWithWarning('throttle', 'Utils.DOM.throttle()');
    },
    
    removeWarnings(): void {
        console.log('Compatibility warnings removed (actual restoration logic not implemented).');
    }
};

export const MigrationTester = {
    testBackwardCompatibility(): TestSummary {
        const tests = [
            { name: 'Global formatNumber', test: () => Utils.formatNumber(3.14159, 2) === '3.14' },
            { name: 'Global clamp', test: () => Utils.clamp(15, 0, 10) === 10 },
            { name: 'Namespaced Numbers.formatNumber', test: () => Utils.Numbers.formatNumber(3.14159, 2) === '3.14' },
            { name: 'Namespaced DOM.debounce', test: () => typeof Utils.DOM.debounce(() => {}, 100) === 'function' },
            { name: 'Storage functionality', test: () => Array.isArray(StorageManager.getFavorites()) }
        ];
        
        const results: TestResult[] = tests.map(test => {
            try {
                const passed = test.test();
                return { name: test.name, passed, error: null };
            } catch (error: any) {
                return { name: test.name, passed: false, error: error.message };
            }
        });
        
        const passedCount = results.filter(r => r.passed).length;
        const totalCount = results.length;
        
        console.log(`\n🧪 Backward Compatibility Tests: ${passedCount}/${totalCount} passed`);
        
        results.forEach((result: TestResult) => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}`);
            if (result.error) console.log(`    Error: ${result.error}`);
        });
        
        return { passed: passedCount, total: totalCount, results };
    }
};

if (typeof window !== 'undefined' && (window as any).location && !(window as any).DISABLE_AUTO_MIGRATION_CHECK) {
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
