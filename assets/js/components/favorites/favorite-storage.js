// storage.js - Fonctions d'accès aux favoris
import { StorageManager } from '../../utils/storage.js';

export function getFavorites() {
    return StorageManager.getFavorites();
}
export function getFavoriteById(id) {
    return StorageManager.getFavoriteById(id);
}
export function addFavorite(fav) {
    return StorageManager.addFavorite(fav);
}
export function updateFavorite(id, data) {
    return StorageManager.updateFavorite(id, data);
}
export function removeFavorite(id) {
    return StorageManager.removeFavorite(id);
} 