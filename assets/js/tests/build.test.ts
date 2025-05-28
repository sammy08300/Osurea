import { generatePerformanceReport } from '../../build.js'; // Use .js as it will be compiled

// Mock process.env.NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe('Build Script Utilities', () => {
  
  beforeEach(() => {
    // Reset NODE_ENV before each test if it was changed
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    // Restore original NODE_ENV after all tests
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('generatePerformanceReport', () => {
    test('should return a report object with correct structure', () => {
      const report = generatePerformanceReport();
      expect(report).toHaveProperty('buildTime');
      expect(report).toHaveProperty('environment');
      expect(report).toHaveProperty('optimizations');
      expect(report.optimizations).toHaveProperty('minifyHTML');
      expect(report.optimizations).toHaveProperty('compressAssets');
      expect(report.optimizations).toHaveProperty('generateSourceMaps');
      expect(report).toHaveProperty('files');
      expect(report.files).toHaveProperty('copied');
      expect(report.files).toHaveProperty('optimized');
    });

    test('should reflect development environment by default', () => {
      delete process.env.NODE_ENV; // Simulate default (not production)
      const report = generatePerformanceReport();
      expect(report.environment).toBe('development');
      // In development, generateSourceMaps is true, others false by default in CONFIG
      expect(report.optimizations.minifyHTML).toBe(false); 
      expect(report.optimizations.compressAssets).toBe(false);
      expect(report.optimizations.generateSourceMaps).toBe(true);
    });

    test('should reflect production environment when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const report = generatePerformanceReport();
      expect(report.environment).toBe('production');
      // In production, minifyHTML and compressAssets are true, generateSourceMaps false
      expect(report.optimizations.minifyHTML).toBe(true);
      expect(report.optimizations.compressAssets).toBe(true);
      expect(report.optimizations.generateSourceMaps).toBe(false);
    });

    test('should initialize files copied and optimized to 0', () => {
      const report = generatePerformanceReport();
      expect(report.files.copied).toBe(0);
      expect(report.files.optimized).toBe(0);
    });

    test('buildTime should be a number close to Date.now()', () => {
      const now = Date.now();
      const report = generatePerformanceReport();
      expect(typeof report.buildTime).toBe('number');
      // Check if buildTime is within a reasonable range (e.g., 100ms) of now
      expect(report.buildTime).toBeGreaterThanOrEqual(now);
      expect(report.buildTime).toBeLessThanOrEqual(now + 100); 
    });
  });
});

// Minimal Jest setup if not already present globally by a test runner
if (typeof describe === 'undefined') {
    global.describe = (name, fn) => fn();
    global.test = (name, fn) => fn();
    global.expect = (val) => ({
        toBe: (exp) => { if (val !== exp) throw new Error(`Expected ${val} to be ${exp}`); },
        toEqual: (exp) => { if (JSON.stringify(val) !== JSON.stringify(exp)) throw new Error(`Expected ${JSON.stringify(val)} to equal ${JSON.stringify(exp)}`); },
        toHaveProperty: (prop) => { if (typeof val !== 'object' || !val.hasOwnProperty(prop)) throw new Error(`Expected ${val} to have property ${prop}`);},
        // Add more matchers if needed by tests
    });
    (global as any).beforeEach = (fn: Function) => fn();
    (global as any).afterAll = (fn: Function) => fn();
}
