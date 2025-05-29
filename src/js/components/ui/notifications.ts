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
    _escapeHtml(text: string): string;
    _scheduleRemoval(notification: HTMLElement, duration: number): void;
    show(message: string, type?: NotificationType, duration?: number): HTMLElement | null;
    success(message: string, duration?: number): HTMLElement | null;
    error(message: string, duration?: number): HTMLElement | null;
    info(message: string, duration?: number): HTMLElement | null;
    warning(message: string, duration?: number): HTMLElement | null;
}

// Remove duplicate global declaration if __ is already globally declared elsewhere
// declare global {
//     interface Window {
//         __(message: string, fallback?: string): string;
//     }
// }

const Notifications: NotificationsModule = {
    container: null,
    defaultDuration: 5000,
    notificationTypes: {
        success: {
            bgColor: 'bg-green-500',
            iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
        },
        error: {
            bgColor: 'bg-red-500',
            iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13H9v6h2V5zm0 8H9v2h2v-2z'
        },
        warning: {
            bgColor: 'bg-yellow-500',
            iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5v2h2v-2H9zm0-8v5h2V5H9z'
        },
        info: {
            bgColor: 'bg-blue-500',
            iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-7h-2v4h2v-4zm0-4h-2v2h2V7z'
        }
    },
    
    /**
     * Initialize the notifications system
     * @returns {boolean} Whether initialization was successful
     */
    init(): boolean {
        if (typeof document === 'undefined') return false;
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-5 right-5 z-[99999] flex flex-col items-end space-y-2';
            document.body.appendChild(this.container);
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
        if (typeof window !== 'undefined' && typeof (window as any).__ === 'function') {
            // Check if it looks like a translation key (e.g., contains a dot)
            if (message.includes('.')) {
                return (window as any).__(message, message); // Pass message as fallback
            }
        }
        return message; // Return original if not a key or no translator
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
        const notification = document.createElement('div');
        const translatedMessage = this._translateMessage(message);
        const typeConfig = this.notificationTypes[type] || this.notificationTypes.info;

        notification.className = `notification flex items-center p-4 rounded-lg shadow-lg text-white ${typeConfig.bgColor} max-w-sm animate-slide-in`;
        notification.innerHTML = `
            <svg class="w-6 h-6 mr-3 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="${typeConfig.iconPath}" clip-rule="evenodd"></path>
            </svg>
            <span>${this._escapeHtml(translatedMessage)}</span>
        `;
        return notification;
    },
    
    _escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            notification.classList.remove('animate-slide-in');
            notification.classList.add('animate-fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300); // Match fade-out animation duration
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
    show(message: string, type: NotificationType = 'success', duration: number = Notifications.defaultDuration): HTMLElement | null {
        if (!this.container && !this.init()) {
            console.error('Notification container not initialized.');
            return null;
        }
        if (!this.container) return null; // Should be initialized by now

        const notification = this._createNotificationElement(message, type);
        this.container.appendChild(notification);
        this._scheduleRemoval(notification, duration);
        return notification;
    },
    
    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    success(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
        return Notifications.show(message, 'success', duration);
    },
    
    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    error(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
        return Notifications.show(message, 'error', duration);
    },
    
    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    info(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
        return Notifications.show(message, 'info', duration);
    },
    
    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement | null} The notification element or null if container not found
     */
    warning(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
        return Notifications.show(message, 'warning', duration);
    }
};

// Methods that use 'this' need to refer to Notifications directly
Notifications.success = function(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
    return Notifications.show(message, 'success', duration);
};

Notifications.error = function(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
    return Notifications.show(message, 'error', duration);
};

Notifications.info = function(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
    return Notifications.show(message, 'info', duration);
};

Notifications.warning = function(message: string, duration: number = Notifications.defaultDuration): HTMLElement | null {
    return Notifications.show(message, 'warning', duration);
};

// Initialize notifications automatically or provide an init function
// ... existing code ...

// Make Notifications available globally if it's used that way
if (typeof window !== 'undefined') {
    (window as any).Notifications = Notifications;
}

export default Notifications;
export {};
