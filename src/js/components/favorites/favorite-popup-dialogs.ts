// favorite-popup-dialogs.ts - Module pour les dialogues de création et suppression
import { translateWithFallback } from '../../../js/i18n-init.js';

interface CommentData {
    title: string;
    description: string;
}

interface FavoritesDialogsModule {
    createDialogs(): void;
    showCommentDialog(callback: (data: CommentData) => void): void;
    showDeleteDialog(callback: (confirmed: boolean) => void): void;
}

/**
 * Module de gestion des dialogues de création et suppression
 */
export const FavoritesDialogs: FavoritesDialogsModule = {
    /**
     * Crée les dialogues à l'avance
     */
    createDialogs(): void {
        let commentDialog = document.getElementById('favorite-comment-dialog') as HTMLElement | null;
        if (!commentDialog) {
            commentDialog = document.createElement('div');
            commentDialog.id = 'favorite-comment-dialog';
            commentDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden animate-fadeIn';
            commentDialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-xl w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="favorites.save">Enregistrer la configuration actuelle</span>
                        </h2>
                        <button id="favorite-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-title-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span data-i18n="favorites.name" class="text-lg">Titre</span>
                                </div>
                            </label>
                            <span id="favorite-title-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/32</span>
                        </div>
                        <input id="favorite-title-input" type="text" maxlength="32" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Nom du favori (optionnel)" data-i18n-placeholder="favorites.namePlaceholder">
                    </div>
                    
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="favorite-desc-input" class="block text-base font-medium text-white">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span data-i18n="favorites.description" class="text-lg">Description</span>
                                </div>
                            </label>
                            <span id="favorite-desc-counter" class="text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400">0/144</span>
                        </div>
                        <textarea id="favorite-desc-input" maxlength="144" class="w-full p-2.5 rounded-md bg-gray-800 border border-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition resize-none min-h-[100px]" placeholder="Description (optionnelle)" data-i18n-placeholder="favorites.descriptionPlaceholder"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="favorite-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span data-i18n="favorites.cancelButton">Annuler</span>
                        </button>
                        <button id="favorite-save-btn" class="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span data-i18n="favorites.saveButton">Sauvegarder</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(commentDialog);
        }
        
        let deleteDialog = document.getElementById('favorite-delete-dialog') as HTMLElement | null;
        if (!deleteDialog) {
            deleteDialog = document.createElement('div');
            deleteDialog.id = 'favorite-delete-dialog';
            deleteDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden animate-fadeIn';
            deleteDialog.innerHTML = `
                <div class="bg-gray-900 rounded-xl p-6 shadow-xl max-w-xl w-full border border-gray-800 scale-100 transition-transform animate-scaleIn">
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                        <h2 class="text-xl font-semibold text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="favorites.deleteConfirm">Confirmer la suppression</span>
                        </h2>
                        <button id="favorite-del-close-btn" class="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-red-500/20 mb-5">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-base font-medium text-red-400" data-i18n="favorites.warning">Attention</h3>
                                <div class="mt-2 text-sm text-gray-300">
                                    <p data-i18n="favorites.deleteWarning">Êtes-vous sûr de vouloir supprimer cette configuration ? Cette action est irréversible et ne peut pas être annulée.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="favorite-del-cancel-btn" class="flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span data-i18n="favorites.cancelButton">Annuler</span>
                        </button>
                        <button id="favorite-del-confirm-btn" class="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span data-i18n="favorites.deleteButton">Supprimer</span>
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(deleteDialog);
        }
    },

    /**
     * Affiche un dialogue pour saisir le titre et la description d'un favori
     * @param {Function} callback - Reçoit {title, description}
     */
    showCommentDialog(callback: (data: CommentData) => void): void {
        let dialog = document.getElementById('favorite-comment-dialog') as HTMLElement | null;
        if (!dialog) {
            this.createDialogs();
            dialog = document.getElementById('favorite-comment-dialog') as HTMLElement | null;
        }
        if (!dialog) return; // Guard against null dialog
        
        dialog.classList.remove('hidden');
        const titleInput = dialog.querySelector<HTMLInputElement>('#favorite-title-input');
        const descInput = dialog.querySelector<HTMLTextAreaElement>('#favorite-desc-input');
        const cancelBtn = dialog.querySelector<HTMLButtonElement>('#favorite-cancel-btn');
        const saveBtn = dialog.querySelector<HTMLButtonElement>('#favorite-save-btn');
        const closeBtn = dialog.querySelector<HTMLButtonElement>('#favorite-close-btn');
        const titleCounter = dialog.querySelector<HTMLSpanElement>('#favorite-title-counter');
        const descCounter = dialog.querySelector<HTMLSpanElement>('#favorite-desc-counter');

        if (!titleInput || !descInput || !cancelBtn || !saveBtn || !closeBtn || !titleCounter || !descCounter) return; // Guard
        
        titleInput.value = '';
        descInput.value = '';
        titleCounter.textContent = '0/32';
        descCounter.textContent = '0/144';
        
        const oldTitleListener = (titleInput as any)._inputListener as EventListener | undefined;
        const oldDescListener = (descInput as any)._inputListener as EventListener | undefined;
        
        if (oldTitleListener) titleInput.removeEventListener('input', oldTitleListener);
        if (oldDescListener) descInput.removeEventListener('input', oldDescListener);
        
        const titleInputListener = () => {
            const length = titleInput.value.length;
            titleCounter.textContent = `${length}/32`;
            titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (length >= 32) titleCounter.classList.add('text-red-500');
            else if (length > 25) titleCounter.classList.add('text-yellow-500');
        };
        
        const descInputListener = () => {
            const length = descInput.value.length;
            descCounter.textContent = `${length}/144`;
            descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (length >= 144) descCounter.classList.add('text-red-500');
            else if (length > 120) descCounter.classList.add('text-yellow-500');
        };
        
        (titleInput as any)._inputListener = titleInputListener;
        (descInput as any)._inputListener = descInputListener;
        
        titleInput.addEventListener('input', titleInputListener);
        descInput.addEventListener('input', descInputListener);
        
        const hideDialog = () => {
            if (titleCounter) titleCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (descCounter) descCounter.className = 'text-xs font-medium px-2 py-1 bg-gray-800 rounded-md text-gray-400';
            if (dialog) dialog.classList.add('hidden'); // Check dialog again
        };
        
        cancelBtn.onclick = hideDialog;
        closeBtn.onclick = hideDialog;
        
        saveBtn.onclick = () => {
            hideDialog();
            callback({ title: titleInput.value, description: descInput.value });
        };
        
        titleInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') descInput.focus();
        });
        
        setTimeout(() => titleInput.focus(), 100);
    },

    /**
     * Affiche un dialogue de confirmation de suppression
     * @param {Function} callback - Reçoit true si confirmé
     */
    showDeleteDialog(callback: (confirmed: boolean) => void): void {
        let dialog = document.getElementById('favorite-delete-dialog') as HTMLElement | null;
        if (!dialog) {
            this.createDialogs();
            dialog = document.getElementById('favorite-delete-dialog') as HTMLElement | null;
        }
        if (!dialog) return; // Guard
        
        dialog.classList.remove('hidden');
        
        const closeBtn = dialog.querySelector<HTMLButtonElement>('#favorite-del-close-btn');
        const cancelBtn = dialog.querySelector<HTMLButtonElement>('#favorite-del-cancel-btn');
        const confirmBtn = dialog.querySelector<HTMLButtonElement>('#favorite-del-confirm-btn');

        if (!closeBtn || !cancelBtn || !confirmBtn) return; // Guard
        
        const hideDialog = () => {
            if (dialog) dialog.classList.add('hidden'); // Check dialog again
        };
        
        closeBtn.onclick = () => { hideDialog(); callback(false); };
        cancelBtn.onclick = () => { hideDialog(); callback(false); };
        confirmBtn.onclick = () => { hideDialog(); callback(true); };
    }
};
