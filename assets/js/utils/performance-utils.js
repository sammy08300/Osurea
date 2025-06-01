/**
 * Performance Utilities Module
 * Provides tools for optimizing application performance
 */

export const PerformanceUtils = {
  /**
   * Memoize a function to cache its results
   * @param {Function} fn - Function to memoize
   * @param {Function} keyFn - Optional function to generate cache key
   * @returns {Function} Memoized function
   */
  memoize(fn, keyFn = JSON.stringify) {
    const cache = new Map();
    
    return function(...args) {
      const key = keyFn(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  },
  
  /**
   * Debounce a function to limit how often it can be called
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },
  
  /**
   * Throttle a function to limit how often it can be called
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, limit) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  },
  
  /**
   * Request animation frame with fallback
   * @param {Function} callback - Callback function
   * @returns {number} Request ID
   */
  requestAnimationFrame(callback) {
    return window.requestAnimationFrame(callback) || 
           window.webkitRequestAnimationFrame(callback) || 
           window.mozRequestAnimationFrame(callback) || 
           window.setTimeout(callback, 1000 / 60);
  },
  
  /**
   * Cancel animation frame with fallback
   * @param {number} id - Request ID
   */
  cancelAnimationFrame(id) {
    (window.cancelAnimationFrame || 
     window.webkitCancelAnimationFrame || 
     window.mozCancelAnimationFrame || 
     window.clearTimeout)(id);
  },
  
  /**
   * Request idle callback with fallback
   * @param {Function} callback - Callback function
   * @param {Object} options - Options
   * @returns {number} Request ID
   */
  requestIdleCallback(callback, options = {}) {
    return window.requestIdleCallback ? 
      window.requestIdleCallback(callback, options) : 
      window.setTimeout(callback, options.timeout || 1);
  },
  
  /**
   * Cancel idle callback with fallback
   * @param {number} id - Request ID
   */
  cancelIdleCallback(id) {
    window.cancelIdleCallback ? 
      window.cancelIdleCallback(id) : 
      window.clearTimeout(id);
  },
  
  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @param {Array} args - Arguments to pass to the function
   * @returns {Object} Result and execution time
   */
  measureExecutionTime(fn, ...args) {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    return {
      result,
      executionTime: end - start
    };
  },
  
  /**
   * Create a function that runs only once
   * @param {Function} fn - Function to run once
   * @returns {Function} Function that runs only once
   */
  once(fn) {
    let called = false;
    let result;
    
    return function(...args) {
      if (!called) {
        called = true;
        result = fn.apply(this, args);
      }
      return result;
    };
  },
  
  /**
   * Batch DOM operations to reduce reflows
   * @param {Function} fn - Function containing DOM operations
   */
  batchDOMOperations(fn) {
    // Read
    const measurements = fn();
    
    // Force reflow
    document.body.offsetHeight;
    
    // Write
    if (typeof measurements === 'function') {
      measurements();
    }
  },
  
  /**
   * Create a worker from a function
   * @param {Function} fn - Function to run in worker
   * @returns {Worker} Web worker
   */
  createWorker(fn) {
    const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  }
};

// Export as default
export default PerformanceUtils;