/**
 * Notifications component that handles displaying and managing notifications
 */

const Notifications = {
    container: null,
    defaultDuration: 100,
    
    /**
     * Initialize the notifications system
     */
    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            console.error('Notification container not found');
        }
    },
    
    /**
     * Show a notification message
     * 
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, info, warning)
     * @param {number} duration - Duration in ms to show the notification
     */
    show(message, type = 'success', duration = this.defaultDuration) {
        if (!this.container) {
            this.init();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification rounded-lg p-3 flex items-center shadow-lg`;
        
        // Add color based on type
        let bgColor, iconPath;
        
        switch (type) {
            case 'error':
                bgColor = 'bg-red-600';
                iconPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
                break;
            case 'warning':
                bgColor = 'bg-yellow-500';
                iconPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`;
                break;
            case 'info':
                bgColor = 'bg-blue-500';
                iconPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
                break;
            case 'success':
            default:
                bgColor = 'bg-green-600';
                iconPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
                break;
        }
        
        notification.classList.add(bgColor);
        
        // Set notification content
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${iconPath}
            </svg>
            <p class="text-white text-sm font-medium">${message}</p>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animationDuration = '0.3s';
            notification.style.animationName = 'fade-out';
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    },
    
    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     */
    success(message, duration = this.defaultDuration) {
        this.show(message, 'success', duration);
    },
    
    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     */
    error(message, duration = this.defaultDuration) {
        this.show(message, 'error', duration);
    },
    
    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     */
    info(message, duration = this.defaultDuration) {
        this.show(message, 'info', duration);
    },
    
    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     */
    warning(message, duration = this.defaultDuration) {
        this.show(message, 'warning', duration);
    }
};
