# Utils API Documentation

## Overview

The Utils module provides a consolidated set of utility functions organized into logical namespaces. This module eliminates duplication between previous utility files and provides a clean, structured API.

## Installation & Usage

```javascript
// ES6 Import
import { Utils, DOM, Numbers, Performance } from './utils/index.js';

// Global access (for backward compatibility)
window.Utils.formatNumber(3.14159, 2); // "3.14"
```

## API Reference

### Utils (Main Object)

The main Utils object provides both namespaced access and direct access to commonly used functions.

```javascript
// Namespaced access
Utils.DOM.debounce(fn, 300);
Utils.Numbers.formatNumber(3.14, 2);
Utils.Performance.memoize(expensiveFunction);

// Direct access (legacy compatibility)
Utils.debounce(fn, 300);
Utils.formatNumber(3.14, 2);
Utils.clamp(value, 0, 100);
```

---

## DOM Utilities (`Utils.DOM`)

### `getElement(id: string): HTMLElement | null`

Get element by ID with type checking.

```javascript
const element = Utils.DOM.getElement('myButton');
if (element) {
    element.click();
}
```

### `createElement(tagName: string, attributes?: Object, content?: string | HTMLElement): HTMLElement`

Create element with optional attributes and content.

```javascript
const button = Utils.DOM.createElement('button', {
    className: 'btn btn-primary',
    id: 'submit-btn',
    style: { padding: '10px' }
}, 'Submit');

const container = Utils.DOM.createElement('div', {
    className: 'container'
}, button);
```

### `debounce(func: Function, wait: number): Function`

Create a debounced function that delays invoking func until after wait milliseconds.

```javascript
const debouncedSearch = Utils.DOM.debounce((query) => {
    performSearch(query);
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

### `throttle(func: Function, wait: number): Function`

Create a throttled function that only invokes func at most once per every wait milliseconds.

```javascript
const throttledScroll = Utils.DOM.throttle(() => {
    updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### `addRippleEffect(element: HTMLElement, event: Event): void`

Add a visual ripple effect to a button click.

```javascript
button.addEventListener('click', (event) => {
    Utils.DOM.addRippleEffect(button, event);
});
```

### `copyToClipboard(text: string, successMessage?: string, errorMessage?: string): void`

Copy text to clipboard with success/error notifications.

```javascript
Utils.DOM.copyToClipboard('Hello World!', 'copied_success', 'copy_failed');
```

---

## Number Utilities (`Utils.Numbers`)

### `parseFloatSafe(value: any, fallback?: number): number`

Safely parse a float value with fallback.

```javascript
const num1 = Utils.Numbers.parseFloatSafe('3.14'); // 3.14
const num2 = Utils.Numbers.parseFloatSafe('invalid', 0); // 0
const num3 = Utils.Numbers.parseFloatSafe(null, -1); // -1
```

### `formatNumber(value: number, decimalPlaces?: number): string`

Format a number with the specified decimal places.

```javascript
Utils.Numbers.formatNumber(3.14159, 2); // "3.14"
Utils.Numbers.formatNumber(42, 0); // "42"
Utils.Numbers.formatNumber(1.5); // "1.5" (default: 1 decimal place)
```

### `isValidNumber(value: any, min?: number, max?: number): boolean`

Check if a value is a valid number within specified range.

```javascript
Utils.Numbers.isValidNumber(5); // true
Utils.Numbers.isValidNumber('5'); // false (string)
Utils.Numbers.isValidNumber(5, 0, 10); // true
Utils.Numbers.isValidNumber(15, 0, 10); // false (out of range)
```

### `clamp(value: number, min: number, max: number): number`

Clamp a value between min and max.

```javascript
Utils.Numbers.clamp(5, 0, 10); // 5
Utils.Numbers.clamp(-5, 0, 10); // 0
Utils.Numbers.clamp(15, 0, 10); // 10
```

### `calculateRatio(width: number, height: number): number`

Calculate ratio from width and height.

```javascript
Utils.Numbers.calculateRatio(16, 9); // 1.777...
Utils.Numbers.calculateRatio(100, 0); // 1.0 (fallback)
```

### `mmToPx(mm: number, scale: number): number`

Convert millimeters to pixels based on the scaling factor.

```javascript
const pixels = Utils.Numbers.mmToPx(25.4, 96); // 96 pixels (1 inch at 96 DPI)
```

### `pxToMm(px: number, scale: number): number`

Convert pixels to millimeters based on the scaling factor.

```javascript
const mm = Utils.Numbers.pxToMm(96, 96); // 25.4 mm (1 inch)
```

### `constrainAreaOffset(offsetX, offsetY, areaWidth, areaHeight, tabletWidth, tabletHeight): {x, y}`

Constrain the area offset to keep the area within tablet bounds.

```javascript
const constrained = Utils.Numbers.constrainAreaOffset(
    50, 50,    // offset X, Y
    100, 100,  // area width, height
    200, 200   // tablet width, height
);
// Returns: { x: 50, y: 50 } (within bounds)
```

---

## Performance Utilities (`Utils.Performance`)

### `memoize(fn: Function, keyGenerator?: Function): Function`

Memoize function results to improve performance.

```javascript
const expensiveCalculation = (a, b) => {
    // Simulate expensive operation
    return a * b * Math.random();
};

const memoizedCalc = Utils.Performance.memoize(expensiveCalculation);

// First call: calculates and caches result
const result1 = memoizedCalc(5, 10);

// Second call with same args: returns cached result
const result2 = memoizedCalc(5, 10); // Same as result1
```

Custom key generator:

```javascript
const memoizedWithCustomKey = Utils.Performance.memoize(
    (obj) => obj.value * 2,
    (obj) => obj.id // Use obj.id as cache key
);
```

### `requestIdleCallback(callback: Function, options?: Object): number`

Request idle callback with fallback for older browsers.

```javascript
Utils.Performance.requestIdleCallback(() => {
    // Perform non-critical work when browser is idle
    updateAnalytics();
}, { timeout: 5000 });
```

### `cancelIdleCallback(id: number): void`

Cancel idle callback with fallback.

```javascript
const id = Utils.Performance.requestIdleCallback(callback);
Utils.Performance.cancelIdleCallback(id);
```

---

## Constants

### `DECIMAL_PRECISION_POSITION: number`

Precision for positions (X/Y coordinates).

```javascript
const precision = Utils.DECIMAL_PRECISION_POSITION; // 3
```

### `DECIMAL_PRECISION_DIMENSIONS: number`

Precision for dimensions (Width/Height).

```javascript
const precision = Utils.DECIMAL_PRECISION_DIMENSIONS; // 3
```

### `DECIMAL_PRECISION_RATIO: number`

Precision for ratio calculations.

```javascript
const precision = Utils.DECIMAL_PRECISION_RATIO; // 3
```

---

## Legacy Compatibility

For backward compatibility, commonly used functions are available directly on the Utils object:

```javascript
// These are equivalent:
Utils.debounce === Utils.DOM.debounce
Utils.throttle === Utils.DOM.throttle
Utils.clamp === Utils.Numbers.clamp
Utils.formatNumber === Utils.Numbers.formatNumber
Utils.parseFloatSafe === Utils.Numbers.parseFloatSafe
Utils.isValidNumber === Utils.Numbers.isValidNumber
Utils.mmToPx === Utils.Numbers.mmToPx
Utils.pxToMm === Utils.Numbers.pxToMm
Utils.calculateRatio === Utils.Numbers.calculateRatio
Utils.memoize === Utils.Performance.memoize
```

Global functions are also available for legacy code:

```javascript
// Global access (legacy)
window.debounce(fn, 300);
window.formatNumber(3.14, 2);
window.clamp(value, 0, 100);
```

---

## Migration Guide

### From helpers.js

```javascript
// Old
formatNumber(3.14, 2);
clamp(value, 0, 100);

// New
Utils.Numbers.formatNumber(3.14, 2);
Utils.Numbers.clamp(value, 0, 100);
```

### From dom-utils.js

```javascript
// Old
DOMUtils.debounce(fn, 300);
DOMUtils.addRippleEffect(element, event);

// New
Utils.DOM.debounce(fn, 300);
Utils.DOM.addRippleEffect(element, event);
```

### From number-utils.js

```javascript
// Old
NumberUtils.parseFloatSafe(value);
NumberUtils.constrainAreaOffset(...args);

// New
Utils.Numbers.parseFloatSafe(value);
Utils.Numbers.constrainAreaOffset(...args);
```

---

## Best Practices

1. **Use namespaced access** for new code to maintain clarity:
   ```javascript
   Utils.DOM.debounce(fn, 300);  // ✅ Clear and explicit
   Utils.debounce(fn, 300);      // ⚠️ Works but less clear
   ```

2. **Import specific namespaces** when you only need certain utilities:
   ```javascript
   import { DOM, Numbers } from './utils/index.js';
   DOM.debounce(fn, 300);
   Numbers.formatNumber(3.14, 2);
   ```

3. **Use memoization** for expensive calculations:
   ```javascript
   const memoizedFn = Utils.Performance.memoize(expensiveFunction);
   ```

4. **Prefer debounce for user input** and throttle for scroll/resize events:
   ```javascript
   // User input
   const debouncedSearch = Utils.DOM.debounce(search, 300);
   
   // Scroll events
   const throttledScroll = Utils.DOM.throttle(onScroll, 100);
   ```