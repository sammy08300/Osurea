// favoritesModule.js - Point d'entrée navigateur pour le module favoris (initialisation automatique)
import { FavoritesUI } from './favoritesindex.js';

if (typeof window !== 'undefined') {
    // Exposer l'interface unifiée au niveau global
    window.FavoritesUI = FavoritesUI;
    
    // Initialiser automatiquement au chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FavoritesUI.init());
    } else {
        FavoritesUI.init();
    }
}

// Support pour l'exportation CommonJS si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesUI;
} 