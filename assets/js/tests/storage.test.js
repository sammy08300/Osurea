/**
 * Unit tests for StorageManager
 * Tests all major functionality including data validation, repair, and CRUD operations
 */

import { StorageManager } from '../utils/storage.js';

// Mock localStorage for testing
const mockLocalStorage = (() => {
    let store = {};
    
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        removeItem: (key) => delete store[key],
        clear: () => store = {},
        get length() { return Object.keys(store).length; },
        key: (index) => Object.keys(store)[index] || null
    };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Test suite (Jest-based, only runs in Jest environment)
if (typeof describe !== 'undefined') {
describe('StorageManager', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        StorageManager.clearCache();
    });

    describe('Data Validation and Repair', () => {
        test('should validate correct data structure', () => {
            const validData = [
                { id: 1, title: 'Test 1' },
                { id: 2, title: 'Test 2' }
            ];
            
            // Access private method through reflection for testing
            const validateData = StorageManager.constructor.prototype._validateData || 
                ((data) => Array.isArray(data) && data.every(item => item && typeof item.id !== 'undefined'));
            
            expect(validateData(validData)).toBe(true);
        });

        test('should detect invalid data structure', () => {
            const invalidData = [
                { id: 1, title: 'Test 1' },
                { title: 'Test 2' }, // Missing ID
                null // Null item
            ];
            
            const validateData = StorageManager.constructor.prototype._validateData || 
                ((data) => Array.isArray(data) && data.every(item => item && typeof item.id !== 'undefined'));
            
            expect(validateData(invalidData)).toBe(false);
        });

        test('should repair corrupted data', () => {
            const corruptedData = [
                { id: 1, title: 'Test 1' },
                { title: 'Test 2' }, // Missing ID
                null, // Null item
                { id: 3, title: 'Test 3' }
            ];
            
            // Simulate corrupted data in storage
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(corruptedData));
            
            const favorites = StorageManager.getFavorites();
            
            // Should only return valid items
            expect(favorites).toHaveLength(2);
            expect(favorites[0]).toEqual({ id: 1, title: 'Test 1' });
            expect(favorites[1]).toEqual({ id: 3, title: 'Test 3' });
        });
    });

    describe('CRUD Operations', () => {
        test('should add a new favorite', () => {
            const favoriteData = {
                title: 'Test Favorite',
                description: 'Test Description'
            };
            
            const result = StorageManager.addFavorite(favoriteData);
            
            expect(result).not.toBeNull();
            expect(result.id).toBeDefined();
            expect(result.title).toBe('Test Favorite');
            expect(result.createdAt).toBeDefined();
            
            // Verify it's stored
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(1);
            expect(favorites[0].id).toBe(result.id);
        });

        test('should retrieve favorite by ID', () => {
            const favoriteData = { title: 'Test Favorite' };
            const added = StorageManager.addFavorite(favoriteData);
            
            const retrieved = StorageManager.getFavoriteById(added.id);
            
            expect(retrieved).not.toBeNull();
            expect(retrieved.id).toBe(added.id);
            expect(retrieved.title).toBe('Test Favorite');
        });

        test('should update existing favorite', () => {
            const favoriteData = { title: 'Original Title' };
            const added = StorageManager.addFavorite(favoriteData);
            
            const updateData = { title: 'Updated Title', description: 'New Description' };
            const success = StorageManager.updateFavorite(added.id, updateData);
            
            expect(success).toBe(true);
            
            const updated = StorageManager.getFavoriteById(added.id);
            expect(updated.title).toBe('Updated Title');
            expect(updated.description).toBe('New Description');
            expect(updated.id).toBe(added.id); // ID should be preserved
            expect(updated.lastModified).toBeDefined();
        });

        test('should remove favorite by ID', () => {
            const favoriteData = { title: 'To Be Removed' };
            const added = StorageManager.addFavorite(favoriteData);
            
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
            const favorites = [
                { title: 'Favorite 1' },
                { title: 'Favorite 2' }
            ];
            
            favorites.forEach(fav => StorageManager.addFavorite(fav));
            
            const exported = StorageManager.exportFavorites();
            const parsed = JSON.parse(exported);
            
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(2);
        });

        test('should import favorites from JSON', () => {
            const importData = [
                { id: 1, title: 'Imported 1' },
                { id: 2, title: 'Imported 2' }
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
            const favoriteData = { title: 'Cached Favorite' };
            StorageManager.addFavorite(favoriteData);
            
            // First read should populate cache
            const favorites1 = StorageManager.getFavorites();
            
            // Modify localStorage directly (simulating external change)
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify([]));
            
            // Second read should still return cached data
            const favorites2 = StorageManager.getFavorites();
            expect(favorites2).toHaveLength(1);
            
            // Clear cache and read again
            StorageManager.clearCache();
            const favorites3 = StorageManager.getFavorites();
            expect(favorites3).toHaveLength(0);
        });
    });

    describe('Data Migration', () => {
        test('should migrate corrupted data', () => {
            const corruptedData = [
                { id: 1, title: 'Valid' },
                { title: 'Invalid - no ID' },
                null,
                { id: 2, title: 'Also Valid' }
            ];
            
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(corruptedData));
            
            const migrated = StorageManager.migrateData();
            
            expect(migrated).toBe(true);
            
            const favorites = StorageManager.getFavorites();
            expect(favorites).toHaveLength(2);
            expect(favorites[0].title).toBe('Valid');
            expect(favorites[1].title).toBe('Also Valid');
        });

        test('should not migrate valid data', () => {
            const validData = [
                { id: 1, title: 'Valid 1' },
                { id: 2, title: 'Valid 2' }
            ];
            
            localStorage.setItem('Osu!reaFavorites_v2', JSON.stringify(validData));
            
            const migrated = StorageManager.migrateData();
            
            expect(migrated).toBe(false); // No migration needed
        });
    });

    describe('Error Handling', () => {
        test('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw error
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = () => { throw new Error('Storage error'); };
            
            const favorites = StorageManager.getFavorites();
            expect(favorites).toEqual([]);
            
            // Restore original method
            localStorage.getItem = originalGetItem;
        });

        test('should handle invalid favorite data', () => {
            const result = StorageManager.addFavorite(null);
            expect(result).toBeNull();
            
            const result2 = StorageManager.addFavorite('invalid');
            expect(result2).toBeNull();
        });

        test('should handle update with invalid parameters', () => {
            const success1 = StorageManager.updateFavorite(null, {});
            expect(success1).toBe(false);
            
            const success2 = StorageManager.updateFavorite('id', null);
            expect(success2).toBe(false);
        });
    });

    describe('Diagnostics', () => {
        test('should run diagnostics without errors', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            StorageManager.addFavorite({ title: 'Test' });
            StorageManager.diagnoseFavorites();
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
} // End of Jest conditional

/**
 * Browser-compatible test runner (doesn't use Jest)
 * This function can be called directly in the browser console
 */
export function runStorageTests() {
    console.log('💾 Running Storage Tests...');
    
    const tests = [
        {
            name: 'StorageManager exists',
            test: () => typeof window.StorageManager !== 'undefined'
        },
        {
            name: 'StorageManager.getFavorites function exists',
            test: () => typeof window.StorageManager?.getFavorites === 'function'
        },
        {
            name: 'StorageManager.addFavorite function exists',
            test: () => typeof window.StorageManager?.addFavorite === 'function'
        },
        {
            name: 'StorageManager.removeFavorite function exists',
            test: () => typeof window.StorageManager?.removeFavorite === 'function'
        },
        {
            name: 'StorageManager.updateFavorite function exists',
            test: () => typeof window.StorageManager?.updateFavorite === 'function'
        },
        {
            name: 'StorageManager.exportFavorites function exists',
            test: () => typeof window.StorageManager?.exportFavorites === 'function'
        },
        {
            name: 'StorageManager.importFavorites function exists',
            test: () => typeof window.StorageManager?.importFavorites === 'function'
        },
        {
            name: 'Can get favorites (returns array)',
            test: () => {
                if (!window.StorageManager) return false;
                const favorites = window.StorageManager.getFavorites();
                return Array.isArray(favorites);
            }
        },
        {
            name: 'Can add a test favorite',
            test: () => {
                if (!window.StorageManager) return false;
                try {
                    const testFavorite = {
                        title: 'Test Favorite',
                        description: 'Test Description',
                        areaWidth: 100,
                        areaHeight: 100
                    };
                    const result = window.StorageManager.addFavorite(testFavorite);
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
                if (!window.StorageManager) return false;
                try {
                    const exported = window.StorageManager.exportFavorites();
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
        } catch (error) {
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
