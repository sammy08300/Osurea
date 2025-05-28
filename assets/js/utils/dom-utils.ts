/**
 * DOM utilities for common operations
 */

// Declare a basic interface for the global Notifications object
// This should ideally be in a central .d.ts file if used across many modules
declare var Notifications: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
};

type GenericFunction = (...args: any[]) => void;

export const DOMUtils = {
    /**
     * Get element by ID with type checking
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} The element or null if not found
     */
    getElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    },
    
    /**
     * Create a debounced function that delays invoking func until after wait milliseconds
     * @param {Function} func - The function to debounce
     * @param {number} wait - The number of milliseconds to delay
     * @returns {Function} The debounced function
     */
    debounce(func: GenericFunction, wait: number): (...args: any[]) => void {
        let timeout: number | null = null; // Use number for browser setTimeout ID
        return function executedFunction(...args: any[]): void {
            const later = () => {
                if (timeout !== null) {
                    clearTimeout(timeout);
                }
                func(...args);
            };
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(later, wait);
        };
    },
    
    /**
     * Create a throttled function that only invokes func at most once per every wait milliseconds
     * @param {Function} func - The function to throttle
     * @param {number} wait - The number of milliseconds to throttle
     * @returns {Function} The throttled function
     */
    throttle(func: GenericFunction, wait: number): (...args: any[]) => void {
        let lastCall = 0;
        return function executedFunction(...args: any[]): void {
            const now = Date.now();
            if (now - lastCall >= wait) {
                func(...args);
                lastCall = now;
            }
        };
    },
    
    /**
     * Add a visual ripple effect to a button click
     * @param {HTMLElement} element - The element to add the ripple to
     * @param {MouseEvent} event - The click event
     */
    addRippleEffect(element: HTMLElement, event: MouseEvent): void {
        const ripple = document.createElement('div');
        ripple.className = 'bg-gray-700/30 absolute rounded-full pointer-events-none';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = (event.offsetX - 10) + 'px';
        ripple.style.top = (event.offsetY - 10) + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.6s, opacity 0.6s';
        
        // Ensure element is capable of containing absolutely positioned children
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        window.setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            window.setTimeout(() => {
                if (element.contains(ripple)) {
                    element.removeChild(ripple);
                }
            }, 600);
        }, 10);
    },
    
    /**
     * Copy text to clipboard with success/error notifications
     * @param {string} text - Text to copy
     * @param {string} successMessage - Success notification message key
     * @param {string} errorMessage - Error notification message key
     */
    copyToClipboard(text: string, successMessage: string = 'copied_info', errorMessage: string = 'copy_error'): void {
        if (!navigator.clipboard) {
            console.warn('Clipboard API not available.');
            // Fallback or error notification for older browsers if necessary
            if (typeof Notifications !== 'undefined' && Notifications.error) {
                Notifications.error(errorMessage); // Or a specific message for clipboard unavailability
            }
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => {
                if (typeof Notifications !== 'undefined' && Notifications.success) {
                    Notifications.success(successMessage);
                }
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                if (typeof Notifications !== 'undefined' && Notifications.error) {
                    Notifications.error(errorMessage);
                }
            });
    }
};
