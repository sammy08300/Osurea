// favorite-popup.js - Unified popup and dialog management module
import { FavoritesDialogs } from './favorite-popup-dialogs.js';
import { FavoritesDetailsPopup } from './favorite-popup-details.js';

/**
 * Formats a number with a certain number of decimals
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}

/**
 * Calculates the width/height ratio
 * @param {number} w
 * @param {number} h
 * @returns {number}
 */
function calculateRatio(w, h) {
    if (!w || !h) return 0;
    return w / h;
}

/**
 * Unified module for managing favorites popups and dialogs
 */
export const FavoritesPopups = {
    /**
     * Creates dialogs in advance
     */
    createDialogs() {
        FavoritesDialogs.createDialogs();
    },

    /**
     * Creates the details popup
     */
    createDetailsPopup() {
        FavoritesDetailsPopup.createDetailsPopup();
    },

    /**
     * Shows a dialog to enter the title and description of a favorite
     * @param {Function} callback - Receives {title, description}
     */
    showCommentDialog(callback) {
        FavoritesDialogs.showCommentDialog(callback);
    },

    /**
     * Shows a delete confirmation dialog
     * @param {Function} callback - Receives true if confirmed
     */
    showDeleteDialog(callback) {
        FavoritesDialogs.showDeleteDialog(callback);
    },

    /**
     * Shows a detailed popup for a favorite
     * @param {Object} favorite - The favorite to display
     * @param {Object} actionsHandler - The action handler for buttons
     */
    showFavoriteDetails(favorite, actionsHandler) {
        FavoritesDetailsPopup.showFavoriteDetails(favorite, actionsHandler);
    },

    /**
     * Closes the details popup
     * @param {Object} actionsHandler - The action handler for saving
     */
    closeDetailsPopup(actionsHandler) {
        FavoritesDetailsPopup.closeDetailsPopup(actionsHandler);
    }
}; 
