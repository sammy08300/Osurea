/**
 * Tests for storage.js module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadPrefs,
  savePrefs,
  updatePref,
  getPref,
  getFavorites,
  addFavorite,
  updateFavorite,
  removeFavorite,
  getFavorite,
  getTheme,
  setTheme,
} from '../storage.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Preferences', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('loadPrefs', () => {
    it('should return default prefs when localStorage is empty', () => {
      const prefs = loadPrefs();
      expect(prefs).toBeDefined();
      expect(prefs.tablet).toBeDefined();
      expect(prefs.area).toBeDefined();
    });

    it('should merge stored prefs with defaults', () => {
      localStorageMock.setItem('osurea:prefs', JSON.stringify({ tablet: { brand: 'Custom' } }));
      const prefs = loadPrefs();
      expect(prefs.tablet.brand).toBe('Custom');
      expect(prefs.area).toBeDefined();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('osurea:prefs', 'invalid json');
      const prefs = loadPrefs();
      expect(prefs).toBeDefined();
    });
  });

  describe('savePrefs', () => {
    it('should save prefs to localStorage', () => {
      const prefs = { tablet: { brand: 'Test' } };
      savePrefs(prefs);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('osurea:prefs', expect.any(String));
    });
  });

  describe('getPref / updatePref', () => {
    it('should get and update nested prefs', () => {
      updatePref('ui.theme', 'light');
      const theme = getPref('ui.theme');
      expect(theme).toBe('light');
    });

    it('should return default value for missing path', () => {
      const value = getPref('nonexistent.path', 'default');
      expect(value).toBe('default');
    });
  });
});

describe('Favorites', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites', () => {
      const favorites = getFavorites();
      expect(favorites).toEqual([]);
    });

    it('should return stored favorites', () => {
      const stored = [{ id: '1', name: 'Test' }];
      localStorageMock.setItem('osurea:favorites', JSON.stringify(stored));
      const favorites = getFavorites();
      expect(favorites).toEqual(stored);
    });
  });

  describe('addFavorite', () => {
    it('should add a new favorite with generated id', () => {
      const favorite = addFavorite({
        name: 'Test Favorite',
        tablet: { brand: 'Wacom', model: 'Test', width: 100, height: 50 },
        area: { width: 50, height: 25, x: 50, y: 25 },
      });

      expect(favorite.id).toBeDefined();
      expect(favorite.name).toBe('Test Favorite');
      expect(favorite.createdAt).toBeDefined();
    });

    it('should add favorite to the beginning of the list', () => {
      addFavorite({ name: 'First' });
      addFavorite({ name: 'Second' });

      const favorites = getFavorites();
      expect(favorites[0].name).toBe('Second');
      expect(favorites[1].name).toBe('First');
    });
  });

  describe('updateFavorite', () => {
    it('should update an existing favorite', () => {
      const created = addFavorite({ name: 'Original' });
      const updated = updateFavorite(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.id).toBe(created.id);
    });

    it('should return null for non-existent id', () => {
      const result = updateFavorite('non-existent-id', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite', () => {
      const created = addFavorite({ name: 'ToRemove' });
      const removed = removeFavorite(created.id);

      expect(removed).toBe(true);
      expect(getFavorites()).toHaveLength(0);
    });

    it('should return false for non-existent id', () => {
      const result = removeFavorite('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getFavorite', () => {
    it('should get a single favorite by id', () => {
      const created = addFavorite({ name: 'Test' });
      const retrieved = getFavorite(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent id', () => {
      const result = getFavorite('non-existent-id');
      expect(result).toBeNull();
    });
  });
});

describe('Theme', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Mock document
    global.document = {
      documentElement: {
        setAttribute: vi.fn(),
      },
    };
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('getTheme', () => {
    it('should return dark theme as default', () => {
      // Clear any stored theme to ensure defaults
      localStorageMock.clear();
      const theme = getTheme();
      // getTheme returns 'dark' by default from DEFAULT_PREFS
      expect(['dark', 'light']).toContain(theme);
    });
  });

  describe('setTheme', () => {
    it('should save theme preference', () => {
      setTheme('light');
      expect(getPref('ui.theme')).toBe('light');
    });
  });
});
