/**
 * Notifications component that handles displaying and managing notifications 
 */

// Define types for the notification system
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationTypeConfig {
    bgColor: string;
    iconPath: string;
}

interface NotificationsModule {
    container: HTMLElement | null;
    defaultDuration: number;
    notificationTypes: Record<NotificationType, NotificationTypeConfig>;
    init(): boolean;
    _translateMessage(message: string): string;
    _createNotificationElement(message: string, type: NotificationType): HTMLElement;
    _scheduleRemoval(notification: HTMLElement, duration: number): void;
    show(message: string, type?: NotificationType, duration?: number): HTMLElement | null;
    success(message: string, duration?: number): HTMLElement | null;
    error(message: string, duration?: number): HTMLElement | null;
    info(message: string, duration?: number): HTMLElement | null;
    warning(message: string, duration?: number): HTMLElement | null;
}

// Assuming window.__ is a global translation function
declare global {
    interface Window {
        __(message: string, fallback?: string): string;
    }
}

const Notifications: NotificationsModule = {
    container: null,
    defaultDuration: 1500,
    notificationTypes: {
        success: {
            bgColor: 'bg-green-600',
            iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
        },
        error: {
            bgColor: 'bg-red-600',
            iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
        },
        warning: {
            bgColor: 'bg-yellow-500',
            iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
        },
        info: {
            bgColor: 'bg-blue-500',
            iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
        }
    },
    
    /**
     * Initialize the notifications system
     * @returns {boolean} Whether initialization was successful
     */
    init(): boolean {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            console.error('Notification container not found');
            return false;
        }
        return true;
    },
    
    /**
     * Translates a message if translation is available
     * @param {string} message - The message to translate
     * @returns {string} - The translated message or the original
     * @private
     */
    _translateMessage(message: string): string {
        if (typeof window.__ === 'function') {
            return window.__(message, message); // Provide fallback for safety
        }
        return message;
    },
    
    /**
     * Creates a notification element
     * 
     * @param {string} message - The message to display
     * @param {NotificationType} type - The type of notification
     * @returns {HTMLElement} The created notification element
     * @private
     */
    _createNotificationElement(message: string, type: NotificationType): HTMLElement {
        const typeConfig = this.notificationTypes[type] || this.notificationTypes.success;
        const translatedMessage = this._translateMessage(message);
        
        const notification = document.createElement('div');
        notification.className = `notification rounded-lg p-3 flex items-center shadow-lg ${typeConfig.bgColor}`;
        
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${typeConfig.iconPath}
            </svg>
            <p class="text-white text-sm font-medium">${translatedMessage}</p>
        `;
        
        return notification;
    },
    
    /**
     * Removes a notification after the specified duration
     * 
     * @param {HTMLElement} notification - The notification element to remove
     * @param {number} duration - Duration in ms before removal
     * @private
     */
    _scheduleRemoval(notification: HTMLElement, duration: number): void {
        setTimeout(() => {
            notification.style.animationDuration = '0.3s';
            notification.style.animationName = 'fade-out';
            
            setTimeout(() => {
                notification.remove();
            }, 300); // Corresponds to animation duration
        }, duration);
    },
    
    /**
     * Show a notification message
     * 
     * @param {string} message - The message to display
     * @param {NotificationType} type - The type of notification (success, error, info, warning)
     * @param {number} duration - Duration in ms to show the notification
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    show(message: string, type: NotificationType = 'success', duration: number = this.defaultDuration): HTMLElement | null {
        if (!this.container && !this.init()) {
            return null;
        }
        
        const notification = this._createNotificationElement(message, type);
        if (this.container) { // Ensure container is not null after init
            this.container.appendChild(notification);
        }
        this._scheduleRemoval(notification, duration);
        
        return notification;
    },
    
    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    success(message: string, duration: number = this.defaultDuration): HTMLElement | null {
        return this.show(message, 'success', duration);
    },
    
    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    error(message: string, duration: number = this.defaultDuration): HTMLElement | null {
        return this.show(message, 'error', duration);
    },
    
    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    info(message: string, duration: number = this.defaultDuration): HTMLElement | null {
        return this.show(message, 'info', duration);
    },
    
    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    warning(message: string, duration: number = this.defaultDuration): HTMLElement | null {
        return this.show(message, 'warning', duration);
    }
};

// Make Notifications available globally if it's used that way
if (typeof window !== 'undefined') {
    (window as any).Notifications = Notifications;
}
