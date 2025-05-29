// favorite-popup.ts - Unified popup and dialog management module
import { FavoritesDialogs } from './favorite-popup-dialogs.js';
import { FavoritesDetailsPopup } from './favorite-popup-details.js';
import { FavoriteObject } from './types.js'; // Import FavoriteObject

// Define a type for the actionsHandler for better type safety, if not already defined
// This is a simplified version, adjust based on actual FavoritesActions structure
interface ActionsHandler {
    currentDetailedFavoriteId: string | number | null;
    loadFavorite: (id: string | number) => void;
    editFavorite: (id: string | number) => void;
    deleteFavorite: (id: string | number) => void;
    scheduleAutoSave: () => void;
    saveChangesIfNeeded: () => boolean;
}

interface CommentData {
    title: string;
    description: string;
}

interface FavoritesPopupsModule {
    createDialogs(): void;
    createDetailsPopup(): void;
    showCommentDialog(callback: (data: CommentData) => void): void;
    showDeleteDialog(callback: (confirmed: boolean) => void): void;
    showFavoriteDetails(favorite: FavoriteObject, actionsHandler: ActionsHandler): void;
    closeDetailsPopup(actionsHandler: ActionsHandler): void;
}


/**
 * Unified module for managing favorites popups and dialogs
 */
export const FavoritesPopups: FavoritesPopupsModule = {
    /**
     * Creates dialogs in advance
     */
    createDialogs(): void {
        FavoritesDialogs.createDialogs();
    },

    /**
     * Creates the details popup
     */
    createDetailsPopup(): void {
        FavoritesDetailsPopup.createDetailsPopup();
    },

    /**
     * Shows a dialog to enter the title and description of a favorite
     * @param {Function} callback - Receives {title, description}
     */
    showCommentDialog(callback: (data: CommentData) => void): void {
        FavoritesDialogs.showCommentDialog(callback);
    },

    /**
     * Shows a delete confirmation dialog
     * @param {Function} callback - Receives true if confirmed
     */
    showDeleteDialog(callback: (confirmed: boolean) => void): void {
        FavoritesDialogs.showDeleteDialog(callback);
    },

    /**
     * Shows a detailed popup for a favorite
     * @param {FavoriteObject} favorite - The favorite to display
     * @param {ActionsHandler} actionsHandler - The action handler for buttons
     */
    showFavoriteDetails(favorite: FavoriteObject, actionsHandler: ActionsHandler): void {
        FavoritesDetailsPopup.showFavoriteDetails(favorite, actionsHandler);
    },

    /**
     * Closes the details popup
     * @param {ActionsHandler} actionsHandler - The action handler for saving
     */
    closeDetailsPopup(actionsHandler: ActionsHandler): void {
        FavoritesDetailsPopup.closeDetailsPopup(actionsHandler);
    }
};
