// events.js - Gestion centralisée des listeners pour les favoris
export const FavoritesEvents = {
    listeners: [],

    /**
     * Ajoute un listener et le garde en mémoire pour nettoyage
     */
    add(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    },

    /**
     * Nettoie tous les listeners ajoutés
     */
    cleanup() {
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
    },

    /**
     * Initialise les listeners principaux (exemple pour le bouton de sauvegarde)
     * @param {object} FavoritesUI
     */
    init(FavoritesUI) {
        this.cleanup();
        // Ne plus ajouter de listener sur le bouton de sauvegarde
        // car il est déjà géré dans app.js
        // Ajout d'autres listeners globaux ici (ex: changement de langue, etc.)
    }
}; 
