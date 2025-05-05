// favorite-popup.js - Module de gestion unifiée des popups et dialogues
import { FavoritesDialogs } from './favorite-popup-dialogs.js';
import { FavoritesDetailsPopup } from './favorite-popup-details.js';

/**
 * Formate un nombre avec un certain nombre de décimales
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatNumber(val, decimals = 1) {
    if (typeof val !== 'number' || isNaN(val)) return '';
    return val.toFixed(decimals);
}

/**
 * Calcule le ratio largeur/hauteur
 * @param {number} w
 * @param {number} h
 * @returns {number}
 */
function calculateRatio(w, h) {
    if (!w || !h) return 0;
    return w / h;
}

/**
 * Module unifié de gestion des popups et dialogues de favoris
 */
export const FavoritesPopups = {
    /**
     * Crée les dialogues à l'avance
     */
    createDialogs() {
        FavoritesDialogs.createDialogs();
    },

    /**
     * Crée la popup de détails
     */
    createDetailsPopup() {
        FavoritesDetailsPopup.createDetailsPopup();
    },

    /**
     * Affiche un dialogue pour saisir le titre et la description d'un favori
     * @param {Function} callback - Reçoit {title, description}
     */
    showCommentDialog(callback) {
        FavoritesDialogs.showCommentDialog(callback);
    },

    /**
     * Affiche un dialogue de confirmation de suppression
     * @param {Function} callback - Reçoit true si confirmé
     */
    showDeleteDialog(callback) {
        FavoritesDialogs.showDeleteDialog(callback);
    },

    /**
     * Affiche un popup détaillé pour un favori
     * @param {Object} favorite - Le favori à afficher
     * @param {Object} actionsHandler - Le gestionnaire d'actions pour les boutons
     */
    showFavoriteDetails(favorite, actionsHandler) {
        FavoritesDetailsPopup.showFavoriteDetails(favorite, actionsHandler);
    },

    /**
     * Ferme la popup de détails
     * @param {Object} actionsHandler - Le gestionnaire d'actions pour la sauvegarde
     */
    closeDetailsPopup(actionsHandler) {
        FavoritesDetailsPopup.closeDetailsPopup(actionsHandler);
    }
}; 