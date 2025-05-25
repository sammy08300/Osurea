/**
 * Notification Manager - Centralized notification system
 * Replaces global Notifications object with a proper class-based system
 */

import { dependencyManager } from './dependency-manager.js';

export class NotificationManager {
    constructor() {
        this.container = null;
        this.defaultDuration = 1500;
        this.isInitialized = false;
        this.notificationTypes = {
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
        };
    }

    /**
     * Initialize the notification manager
     * @param {string} containerId - ID of the notification container
     * @returns {boolean} Whether initialization was successful
     */
    init(containerId = 'notification-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Notification container '${containerId}' not found`);
            return false;
        }
        this.isInitialized = true;
        return true;
    }

    /**
     * Translate a message using the translation system
     * @param {string} message - The message to translate
     * @returns {string} The translated message or the original
     * @private
     */
    _translateMessage(message) {
        // Try to get translation function from dependency manager
        if (dependencyManager.has('TranslationManager')) {
            const translationManager = dependencyManager.get('TranslationManager');
            if (translationManager.translate) {
                return translationManager.translate(message);
            }
        }

        // Fallback to global translation function
        if (typeof window.translateWithFallback === 'function') {
            return window.translateWithFallback(message, message);
        }

        if (typeof window.__ === 'function') {
            return window.__(message, message);
        }

        // Return original message if no translation available
        return message;
    }

    /**
     * Create a notification element
     * @param {string} message - The message to display
     * @param {string} type - The type of notification
     * @returns {HTMLElement} The created notification element
     * @private
     */
    _createNotificationElement(message, type) {
        const typeConfig = this.notificationTypes[type] || this.notificationTypes.info;
        
        // Translate the message
        const translatedMessage = this._translateMessage(message);
        
        const notification = document.createElement('div');
        notification.className = `notification rounded-lg p-3 flex items-center shadow-lg ${typeConfig.bgColor}`;
        
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                ${typeConfig.iconPath}
            </svg>
            <p class="text-white text-sm font-medium">${this._escapeHtml(translatedMessage)}</p>
        `;
        
        return notification;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Schedule removal of a notification
     * @param {HTMLElement} notification - The notification element to remove
     * @param {number} duration - Duration in ms before removal
     * @private
     */
    _scheduleRemoval(notification, duration) {
        const timeoutId = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animationDuration = '0.3s';
                notification.style.animationName = 'fade-out';
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);

        // Allow manual dismissal
        notification.addEventListener('click', () => {
            clearTimeout(timeoutId);
            if (notification.parentNode) {
                notification.remove();
            }
        });
    }

    /**
     * Show a notification message
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, info, warning)
     * @param {number} duration - Duration in ms to show the notification
     * @returns {HTMLElement|null} The notification element or null if container not found
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.isInitialized && !this.init()) {
            console.warn('NotificationManager not initialized, falling back to console');
            console.log(`[${type.toUpperCase()}] ${message}`);
            return null;
        }

        try {
            const notification = this._createNotificationElement(message, type);
            this.container.appendChild(notification);
            this._scheduleRemoval(notification, duration);
            
            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            console.log(`[${type.toUpperCase()}] ${message}`);
            return null;
        }
    }

    /**
     * Show a success notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement|null} The notification element
     */
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show an error notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement|null} The notification element
     */
    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show an info notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement|null} The notification element
     */
    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Show a warning notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration in ms
     * @returns {HTMLElement|null} The notification element
     */
    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Clear all notifications
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Set default duration for notifications
     * @param {number} duration - Duration in ms
     */
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    /**
     * Add a custom notification type
     * @param {string} name - Type name
     * @param {Object} config - Type configuration
     */
    addNotificationType(name, config) {
        this.notificationTypes[name] = config;
    }
}

// Create and export singleton instance
export const notificationManager = new NotificationManager();

// Legacy compatibility - register global Notifications object
export function registerLegacyGlobals() {
    window.Notifications = {
        init: () => notificationManager.init(),
        show: (message, type, duration) => notificationManager.show(message, type, duration),
        success: (message, duration) => notificationManager.success(message, duration),
        error: (message, duration) => notificationManager.error(message, duration),
        info: (message, duration) => notificationManager.info(message, duration),
        warning: (message, duration) => notificationManager.warning(message, duration)
    };
} 