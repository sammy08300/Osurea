/**
 * DOM utilities for common operations
 */
export const DOMUtils = {
    /**
     * Get element by ID with type checking
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} The element or null if not found
     */
    getElement(id) {
        return document.getElementById(id);
    },
    
    /**
     * Create a debounced function that delays invoking func until after wait milliseconds
     * @param {Function} func - The function to debounce
     * @param {number} wait - The number of milliseconds to delay
     * @returns {Function} The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Create a throttled function that only invokes func at most once per every wait milliseconds
     * @param {Function} func - The function to throttle
     * @param {number} wait - The number of milliseconds to throttle
     * @returns {Function} The throttled function
     */
    throttle(func, wait) {
        let lastCall = 0;
        return function executedFunction(...args) {
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
     * @param {Object} event - The click event
     */
    addRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'bg-gray-700/30 absolute rounded-full pointer-events-none';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = (event.offsetX - 10) + 'px';
        ripple.style.top = (event.offsetY - 10) + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.6s, opacity 0.6s';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(40)';
            ripple.style.opacity = '0';
            
            setTimeout(() => {
                element.removeChild(ripple);
            }, 600);
        }, 10);
    },
    
    /**
     * Copy text to clipboard with success/error notifications
     * @param {string} text - Text to copy
     * @param {string} successMessage - Success notification message key
     * @param {string} errorMessage - Error notification message key
     */
    copyToClipboard(text, successMessage = 'copied_info', errorMessage = 'copy_error') {
        navigator.clipboard.writeText(text)
            .then(() => {
                if (typeof Notifications !== 'undefined') {
                    Notifications.success(successMessage);
                }
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                if (typeof Notifications !== 'undefined') {
                    Notifications.error(errorMessage);
                }
            });
    }
}; 