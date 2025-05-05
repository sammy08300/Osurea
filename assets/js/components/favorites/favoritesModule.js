// * favoritesModule.js - Point d'entrée navigateur pour le module favoris (initialisation automatique)
import { FavoritesUI } from './favorite-ui.js';

if (typeof window !== 'undefined') {
    window.FavoritesUI = FavoritesUI;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FavoritesUI.init());
    } else {
        FavoritesUI.init();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesUI;
} 