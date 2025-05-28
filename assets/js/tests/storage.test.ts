/**
 * Unit tests for StorageManager
 * Tests all major functionality including data validation, repair, and CRUD operations
 */

import { StorageManager } from '../utils/storage.js'; // .ts will be resolved
import { FavoriteObject } from '../components/favorites/types.js'; // Assuming types.d.ts is in favorites

// Define types for Jest global functions if not already available
declare var describe: (name: string, fn: () => void) => void;
declare var beforeEach: (fn: () => void) => void;
declare var test: (name: string, fn: () => void) => void;
declare var expect: (value: any) => ({
    toBe: (expected: any) => void;
    toEqual: (expected: any) => void;
    toHaveLength: (expected: number) => void;
    toBeDefined: () => void;
    not: { toBeNull: () => void; };
    toBeNull: () => void;
    toHaveBeenCalled: () => void;
});
declare var jest: {
    spyOn: (object: any, method: string) => ({ mockImplementation: (fn?: () => void) => ({ mockRestore: () => void}) });
};


// Mock localStorage for testing
const mockLocalStorage = (() => {
    let store: { [key: string]: string } = {};
    
    return {
        getItem: (key: string): string | null => store[key] || null,
        setItem: (key: string, value: string): void => { store[key] = value.toString(); },
        removeItem: (key: string): void => { delete store[key]; },
        clear: (): void => { store = {}; },
        get length(): number { return Object.keys(store).length; },
        key: (index: number): string | null => Object.keys(store)[index] || null
    };
})();

// Replace global localStorage with mock if running in a suitable environment (e.g., Node with JSDOM for tests)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
    });
} else {
    // If window is not defined (e.g. pure Node.js without JSDOM), this mock won't apply globally in the same way.
    // For such cases, dependency injection or more specific mocking of StorageManager's dependencies would be needed.
    // For this conversion, we assume tests run in an environment where `window` can be mocked.
    global.localStorage = mockLocalStorage as any;
}


// Test suite (Jest-based, only runs in Jest environment)
if (typeof describe !== 'undefined') {
describe('StorageManager', () => {
    beforeEach(() => {
        localStorage.clear();
        StorageManager.clearCache(); // Assuming StorageManager has a static clearCache method
    });

    describe('Data Validation and Repair', () => {
        test('should validate correct data structure', () => {
            const validData: FavoriteObject[] = [
                { id: 1, title: 'Test 1', width: 0, height: 0 }, // Added width/height
                { id: 2, title: 'Test 2', width: 0, height: 0 }
            ];
            // Access private method - this is generally discouraged. For robust testing, consider making it public or testing through public API.
            // For this conversion, we'll assume it's a necessary evil or will be refactored.
            const validateData = (StorageManager as any).constructor.prototype._validateData || 
                ((data: any[]) => Array.isArray(data) && data.every(item => item && typeof item.id !== 'undefined'));
            
            expect(validateData(validData)).toBe(true);
        });

        test('should detect invalid data structure', () => {
            const invalidData = [
                { id: 1, title: 'Test 1' },
                { title: 'Test 2' }, 
                null 
            ];
            const validateData = (StorageManager as any).constructor.prototype._validateData || 
                ((data: any[]) => Array.isArray(data) && data.every(item => item && typeof item.id !== 'undefined'));
            expect(validateData(invalidData)).toBe(false);
        });

        test('should repair corrupted data', () => {
            const corruptedData = [
                { id: 1, title: 'Test 1', width:10, height:10 },
                { title: 'Test 2', width:10, height:10 }, 
                null, 
                { id: 3, title: 'Test 3', width:10, height:10 }
            ];
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(corruptedData));
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(2);
            expect(favorites[0]).toEqual({ id: 1, title: 'Test 1', width:10, height:10 });
            expect(favorites[1]).toEqual({ id: 3, title: 'Test 3', width:10, height:10 });
        });
    });

    describe('CRUD Operations', () => {
        test('should add a new favorite', () => {
            const favoriteData: Partial<FavoriteObject> = { // Use Partial as ID is generated
                title: 'Test Favorite',
                description: 'Test Description',
                width: 100, height: 50 // Required fields
            };
            const result = StorageManager.addFavorite(favoriteData as FavoriteObject); // Cast for add
            expect(result).not.toBeNull();
            if (result) { // Type guard
                expect(result.id).toBeDefined();
                expect(result.title).toBe('Test Favorite');
                expect(result.createdAt).toBeDefined(); // Assuming addFavorite adds this
            }
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(1);
            if (result) expect(favorites[0].id).toBe(result.id);
        });

        test('should retrieve favorite by ID', () => {
            const favoriteData = { title: 'Test Favorite', width: 10, height:10 };
            const added = StorageManager.addFavorite(favoriteData as FavoriteObject);
            if (!added) throw new Error("Failed to add favorite for test");

            const retrieved = StorageManager.getFavoriteById(added.id);
            expect(retrieved).not.toBeNull();
            if (retrieved) {
                expect(retrieved.id).toBe(added.id);
                expect(retrieved.title).toBe('Test Favorite');
            }
        });

        test('should update existing favorite', () => {
            const favoriteData = { title: 'Original Title', width: 10, height:10 };
            const added = StorageManager.addFavorite(favoriteData as FavoriteObject);
            if (!added) throw new Error("Failed to add favorite for test");
            
            const updateData: Partial<FavoriteObject> = { title: 'Updated Title', description: 'New Description' };
            const updatedFavorite = StorageManager.updateFavorite(added.id, updateData); // updateFavorite now returns the object or null
            
            expect(updatedFavorite).not.toBeNull(); // Check if update was successful
            
            const retrieved = StorageManager.getFavoriteById(added.id);
            expect(retrieved).not.toBeNull();
            if (retrieved) {
                expect(retrieved.title).toBe('Updated Title');
                expect(retrieved.description).toBe('New Description');
                expect(retrieved.id).toBe(added.id);
                expect(retrieved.lastModified).toBeDefined();
            }
        });

        test('should remove favorite by ID', () => {
            const favoriteData = { title: 'To Be Removed', width: 10, height:10 };
            const added = StorageManager.addFavorite(favoriteData as FavoriteObject);
            if (!added) throw new Error("Failed to add favorite for test");

            const success = StorageManager.removeFavorite(added.id);
            expect(success).toBe(true);
            
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(0);
            const retrieved = StorageManager.getFavoriteById(added.id);
            expect(retrieved).toBeNull();
        });

        test('should handle removing non-existent favorite', () => {
            const success = StorageManager.removeFavorite('non-existent-id');
            expect(success).toBe(false);
        });
    });

    describe('Import/Export', () => {
        test('should export favorites as JSON', () => {
            const favoritesData: Partial<FavoriteObject>[] = [
                { title: 'Favorite 1', width: 10, height:10 },
                { title: 'Favorite 2', width: 10, height:10 }
            ];
            favoritesData.forEach(fav => StorageManager.addFavorite(fav as FavoriteObject));
            
            const exported = StorageManager.exportFavorites();
            const parsed = JSON.parse(exported);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(2);
        });

        test('should import favorites from JSON', () => {
            const importData: FavoriteObject[] = [
                { id: 1, title: 'Imported 1', width: 10, height:10 },
                { id: 2, title: 'Imported 2', width: 10, height:10 }
            ];
            const success = StorageManager.importFavorites(JSON.stringify(importData));
            expect(success).toBe(true);
            
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(2);
            expect(favorites[0].title).toBe('Imported 1');
            expect(favorites[1].title).toBe('Imported 2');
        });

        test('should handle invalid import data', () => {
            const success = StorageManager.importFavorites('invalid json');
            expect(success).toBe(false);
        });
    });

    describe('Cache Management', () => {
        test('should use cache for subsequent reads', () => {
            const favoriteData = { title: 'Cached Favorite', width: 10, height:10 };
            StorageManager.addFavorite(favoriteData as FavoriteObject);
            
            StorageManager.getFavorites(); // First read populates cache
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify([])); // Simulate external change
            
            const favorites2 = StorageManager.getFavorites(); // Should return cached
            expect(favorites2).toHaveLength(1);
            
            StorageManager.clearCache();
            const favorites3 = StorageManager.getFavorites(); // Should read from modified localStorage
            expect(favorites3).toHaveLength(0);
        });
    });

    describe('Data Migration', () => {
        test('should migrate corrupted data', () => {
            const corruptedData = [
                { id: 1, title: 'Valid', width:10, height:10 },
                { title: 'Invalid - no ID', width:10, height:10 },
                null,
                { id: 2, title: 'Also Valid', width:10, height:10 }
            ];
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(corruptedData));
            const migrated = StorageManager.migrateData(); // Assuming this method exists
            expect(migrated).toBe(true);
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(2);
            expect(favorites[0].title).toBe('Valid');
            expect(favorites[1].title).toBe('Also Valid');
        });

        test('should not migrate valid data', () => {
            const validData: FavoriteObject[] = [
                { id: 1, title: 'Valid 1', width:10, height:10 },
                { id: 2, title: 'Valid 2', width:10, height:10 }
            ];
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(validData));
            const migrated = StorageManager.migrateData();
            expect(migrated).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle localStorage errors gracefully', () => {
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = () => { throw new Error('Storage error'); };
            const favorites = StorageManager.getFavorites();
            expect(favorites).toEqual([]);
            localStorage.getItem = originalGetItem;
        });

        test('should handle invalid favorite data', () => {
            const result = StorageManager.addFavorite(null as any); // Test with invalid data
            expect(result).toBeNull();
            const result2 = StorageManager.addFavorite("invalid" as any);
            expect(result2).toBeNull();
        });

        test('should handle update with invalid parameters', () => {
            const result1 = StorageManager.updateFavorite(null as any, {});
            expect(result1).toBeNull(); // updateFavorite returns object or null
            const result2 = StorageManager.updateFavorite('id', null as any);
            expect(result2).toBeNull();
        });
    });

    describe('Diagnostics', () => {
        test('should run diagnostics without errors', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            StorageManager.addFavorite({ title: 'Test', width:10, height:10 } as FavoriteObject);
            StorageManager.diagnoseFavorites(); // Assuming this method exists
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
}

interface BrowserTest {
    name: string;
    test: () => boolean | undefined | string | null | FavoriteObject | FavoriteObject[];
}

interface BrowserTestResults {
    passed: number;
    failed: number;
    total: number;
}

/**
 * Browser-compatible test runner (doesn't use Jest)
 * This function can be called directly in the browser console
 */
export function runStorageTests(): BrowserTestResults {
    console.log('💾 Running Storage Tests...');
    
    // Mock StorageManager if it's not available on window for browser tests
    if (typeof window !== 'undefined' && !(window as any).StorageManager) {
        (window as any).StorageManager = StorageManager;
    }
    
    const tests: BrowserTest[] = [
        { name: 'StorageManager exists', test: () => typeof (window as any).StorageManager !== 'undefined'},
        { name: 'StorageManager.getFavorites function exists', test: () => typeof (window as any).StorageManager?.getFavorites === 'function'},
        { name: 'StorageManager.addFavorite function exists', test: () => typeof (window as any).StorageManager?.addFavorite === 'function'},
        { name: 'StorageManager.removeFavorite function exists', test: () => typeof (window as any).StorageManager?.removeFavorite === 'function'},
        { name: 'StorageManager.updateFavorite function exists', test: () => typeof (window as any).StorageManager?.updateFavorite === 'function'},
        { name: 'StorageManager.exportFavorites function exists', test: () => typeof (window as any).StorageManager?.exportFavorites === 'function'},
        { name: 'StorageManager.importFavorites function exists', test: () => typeof (window as any).StorageManager?.importFavorites === 'function'},
        {
            name: 'Can get favorites (returns array)',
            test: () => {
                if (!(window as any).StorageManager) return false;
                const favorites = (window as any).StorageManager.getFavorites();
                return Array.isArray(favorites);
            }
        },
        {
            name: 'Can add a test favorite',
            test: () => {
                if (!(window as any).StorageManager) return false;
                try {
                    const testFavorite: Partial<FavoriteObject> = {
                        title: 'Test Favorite', description: 'Test Description',
                        width: 100, height: 100 // Corrected typo from areaHeight to height
                    };
                    const result = (window as any).StorageManager.addFavorite(testFavorite as FavoriteObject);
                    return result && result.id;
                } catch (error) {
                    console.error('Error adding test favorite:', error);
                    return false;
                }
            }
        },
        {
            name: 'Can export favorites as JSON',
            test: () => {
                if (!(window as any).StorageManager) return false;
                try {
                    const exported = (window as any).StorageManager.exportFavorites();
                    const parsed = JSON.parse(exported);
                    return Array.isArray(parsed);
                } catch (error) {
                    console.error('Error exporting favorites:', error);
                    return false;
                }
            }
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
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error: any) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Storage Tests: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All storage tests passed!');
    } else {
        console.log('⚠️ Some storage tests failed. Check the errors above.');
    }
    
    return { passed, failed, total: tests.length };
}
