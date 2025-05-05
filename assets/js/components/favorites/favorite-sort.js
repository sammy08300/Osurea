// favorite-sort.js - Fonctions de tri des favoris
export function favoriteSortFavorites(favorites, criteria) {
    return [...favorites].sort((a, b) => {
        switch (criteria) {
            case 'name':
                const titleA = (a.title || a.comment || '').toLowerCase();
                const titleB = (b.title || b.comment || '').toLowerCase();
                return titleA.localeCompare(titleB);
            case 'size':
                const areaA = (a.width || 0) * (a.height || 0);
                const areaB = (b.width || 0) * (b.height || 0);
                return areaB - areaA;
            case 'modified':
                // Prioriser lastModified si disponible, sinon utiliser l'ID
                // S'assurer que les éléments modifiés récemment apparaissent en premier
                const modifiedA = a.lastModified || a.id || 0;
                const modifiedB = b.lastModified || b.id || 0;
                return modifiedB - modifiedA; // Tri décroissant (plus récent d'abord)
            case 'date':
            default:
                return (b.id || 0) - (a.id || 0);
        }
    });
} 