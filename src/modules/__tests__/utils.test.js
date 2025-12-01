/**
 * Tests for utils.js module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clamp,
  debounce,
  throttle,
  calculateRatioString,
  formatNumber,
  generateId,
  escapeHtml,
} from '../utils.js';

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('should return min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('should return max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(5, -10, -1)).toBe(-1);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not execute again within time limit', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute again after time limit', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(100);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('calculateRatioString', () => {
  it('should detect common ratios', () => {
    expect(calculateRatioString(160, 90)).toBe('16:9');
    expect(calculateRatioString(1920, 1080)).toBe('16:9');
    expect(calculateRatioString(1600, 1000)).toBe('16:10');
    expect(calculateRatioString(400, 300)).toBe('4:3');
  });

  it('should return "--:--" for invalid inputs', () => {
    expect(calculateRatioString(0, 100)).toBe('--:--');
    expect(calculateRatioString(100, 0)).toBe('--:--');
    expect(calculateRatioString(0, 0)).toBe('--:--');
  });

  it('should simplify custom ratios', () => {
    expect(calculateRatioString(200, 100)).toBe('2:1');
    expect(calculateRatioString(300, 100)).toBe('3:1');
  });
});

describe('formatNumber', () => {
  it('should format numbers with specified decimals', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
    expect(formatNumber(3.14159, 3)).toBe('3.142');
    expect(formatNumber(10, 1)).toBe('10.0');
  });

  it('should return "--" for invalid inputs', () => {
    expect(formatNumber(null)).toBe('--');
    expect(formatNumber(undefined)).toBe('--');
    expect(formatNumber(NaN)).toBe('--');
    expect(formatNumber('string')).toBe('--');
  });

  it('should use default 2 decimals', () => {
    expect(formatNumber(3.14159)).toBe('3.14');
  });
});

describe('generateId', () => {
  it('should return a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should have UUID-like format', () => {
    const id = generateId();
    // Either native UUID or our fallback format
    expect(id.length).toBeGreaterThanOrEqual(36);
  });
});

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
    expect(escapeHtml("'test'")).toBe('&#39;test&#39;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should return non-string values as-is', () => {
    expect(escapeHtml(null)).toBe(null);
    expect(escapeHtml(undefined)).toBe(undefined);
    expect(escapeHtml(123)).toBe(123);
  });

  it('should handle complex XSS attempts', () => {
    const malicious = '<img src="x" onerror="alert(\'XSS\')">';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });
});
