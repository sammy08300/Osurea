// js/script.js

// --- Références aux éléments ---
const tabletWidthInput = document.getElementById('tabletWidth');
const tabletHeightInput = document.getElementById('tabletHeight');
const areaWidthInput = document.getElementById('areaWidth');
const areaHeightInput = document.getElementById('areaHeight');
const areaOffsetXInput = document.getElementById('areaOffsetX');
const areaOffsetYInput = document.getElementById('areaOffsetY');
const customRatioInput = document.getElementById('customRatio');
const lockRatio = document.getElementById('lockRatio');
const rectangle = document.getElementById('rectangle');
const tabletBoundary = document.getElementById('tablet-boundary');
const visualContainer = document.getElementById('visual-container');
const contextMenu = document.getElementById('context-menu');
const notificationPlaceholder = document.getElementById('notification-placeholder'); // Peut-être plus nécessaire si on utilise la méthode showNotification modifiée
const favoritesList = document.getElementById('favorites-list');
const favoritesPlaceholder = favoritesList.querySelector('p');
const tabletPresetSelect = document.getElementById('tabletPresetSelect');
const tabletWidthGroup = document.getElementById('tablet-width-group');
const tabletHeightGroup = document.getElementById('tablet-height-group');
const tabletManualHr = document.getElementById('tablet-manual-hr');
const tabletDimensionsInfo = document.getElementById('tablet-dimensions-info');
const tabletRatioInfo = document.getElementById('tablet-ratio-info');
const dimensionsInfo = document.getElementById('dimensions-info');
const ratioInfo = document.getElementById('ratio-info');
const areaInfo = document.getElementById('area-info');
const positionInfo = document.getElementById('position-info');
const saveBtn = document.getElementById('save-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox');
const backgroundGrid = document.getElementById('backgroundGrid');
const sortOptionsDiv = document.getElementById('sort-options');

// --- State ---
let currentRatio = 1.0;
let isDragging = false;
let dragStartX, dragStartY;
let initialCenterOffsetX, initialCenterOffsetY;
let currentScale = 1.0;
let tabletData = [];
let editingFavoriteId = null;
let currentSortCriteria = 'date'; // Default sort criteria
let throttleTimer = null;

// --- Fonctions Utilitaires ---

// Modifiée pour utiliser les classes CSS ou Tailwind si présentes
function showNotification(message) {
    const n = document.createElement('div');
    n.textContent = message;
    // Utilise les classes Tailwind directement, ou une classe CSS pure comme .notification
    n.className = 'notification fixed bottom-5 right-5 p-3 bg-blue-600 text-white rounded-lg shadow-xl z-50 opacity-0 transition-opacity duration-300 ease-out';
    document.body.appendChild(n);
    // Force reflow pour que la transition d'opacité fonctionne
    void n.offsetWidth;
    n.classList.add('show'); // Ou n.style.opacity = '1';
    setTimeout(() => {
        n.classList.remove('show'); // Ou n.style.opacity = '0';
        setTimeout(() => n.remove(), 300); // Attend la fin de la transition pour supprimer
    }, 2500);
}

function toggleManualTabletInputs(show) {
    tabletWidthGroup.classList.toggle('hidden', !show);
    tabletHeightGroup.classList.toggle('hidden', !show);
    tabletManualHr.classList.toggle('hidden', !show);
}

function updateTabletBoundarySize() {
    let tabletW = parseFloat(tabletWidthInput.value);
    let tabletH = parseFloat(tabletHeightInput.value);

    // Fallback to prevent division by zero or NaN issues
    if (isNaN(tabletW) || tabletW <= 0) tabletW = 1;
    if (isNaN(tabletH) || tabletH <= 0) tabletH = 1;

    const padding = 32; // p-4 * 2 = 32px total padding (1rem = 16px)
    const containerWidth = visualContainer.clientWidth - padding;
    const containerHeight = visualContainer.clientHeight - padding;

    // Prevent issues if container size is zero
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const scaleX = containerWidth / tabletW;
    const scaleY = containerHeight / tabletH;
    const scale = Math.min(scaleX, scaleY);

    const boundaryWidth = tabletW * scale;
    const boundaryHeight = tabletH * scale;

    tabletBoundary.style.width = `${boundaryWidth.toFixed(1)}px`;
    tabletBoundary.style.height = `${boundaryHeight.toFixed(1)}px`;
}


// --- Fonction Throttle ---
function throttle(func, limit) {
    return function(...args) {
        if (!throttleTimer) {
            func.apply(this, args);
            throttleTimer = setTimeout(() => {
                throttleTimer = null;
            }, limit);
        }
    }
}


// --- Fonction Principale de Mise à Jour de l'Affichage ---
function updateDisplay() {
    // 1. Mettre à jour la taille de la zone de visualisation de la tablette
    updateTabletBoundarySize();

    // 2. Récupérer les valeurs des inputs
    let tabletW = parseFloat(tabletWidthInput.value);
    let tabletH = parseFloat(tabletHeightInput.value);
    let areaW = parseFloat(areaWidthInput.value);
    let areaH = parseFloat(areaHeightInput.value);
    let centerX = parseFloat(areaOffsetXInput.value);
    let centerY = parseFloat(areaOffsetYInput.value);

    // 3. Validation et valeurs par défaut
    if (isNaN(tabletW) || tabletW <= 0) tabletW = 1; // Évite division par zéro
    if (isNaN(tabletH) || tabletH <= 0) tabletH = 1;
    if (isNaN(areaW) || areaW < 0) areaW = 0;
    if (isNaN(areaH) || areaH < 0) areaH = 0;
    if (isNaN(centerX)) centerX = tabletW / 2; // Centre par défaut
    if (isNaN(centerY)) centerY = tabletH / 2;

    // 4. Contraindre la taille de l'area à la taille de la tablette
    areaW = Math.min(areaW, tabletW);
    areaH = Math.min(areaH, tabletH);
    // Mettre à jour les inputs si la valeur a été contrainte
    if (parseFloat(areaWidthInput.value) > tabletW) areaWidthInput.value = tabletW.toFixed(1);
    if (parseFloat(areaHeightInput.value) > tabletH) areaHeightInput.value = tabletH.toFixed(1);

    // 5. Calculer la position top-left (TL) depuis le centre et contraindre
    let topLeftX = centerX - (areaW / 2);
    let topLeftY = centerY - (areaH / 2);

    // S'assurer que le rectangle ne sort pas des limites de la tablette
    topLeftX = Math.max(0, Math.min(topLeftX, tabletW - areaW));
    topLeftY = Math.max(0, Math.min(topLeftY, tabletH - areaH));

    // 6. Recalculer le centre réel après contrainte (pour mettre à jour les inputs si nécessaire)
    let constrainedCenterX = topLeftX + (areaW / 2);
    let constrainedCenterY = topLeftY + (areaH / 2);
    // Mettre à jour les inputs de position si le centre a changé à cause des contraintes
    // Utiliser une petite tolérance pour éviter les mises à jour en boucle dues aux erreurs de flottants
    if (Math.abs(parseFloat(areaOffsetXInput.value) - constrainedCenterX) > 0.0001) {
        areaOffsetXInput.value = constrainedCenterX.toFixed(3);
    }
    if (Math.abs(parseFloat(areaOffsetYInput.value) - constrainedCenterY) > 0.0001) {
        areaOffsetYInput.value = constrainedCenterY.toFixed(3);
    }

    // 7. Calculer l'échelle pour la visualisation
    const containerPadding = 32; // p-4 des deux côtés
    const containerWidth = visualContainer.clientWidth - containerPadding;
    const containerHeight = visualContainer.clientHeight - containerPadding;
    let targetBoundaryWidth = 1; // Default to avoid NaN
    let targetBoundaryHeight = 1; // Default to avoid NaN

    if (containerWidth > 0 && containerHeight > 0 && tabletW > 0 && tabletH > 0) {
        const scaleX = containerWidth / tabletW;
        const scaleY = containerHeight / tabletH;
        const containerScale = Math.min(scaleX, scaleY);
        targetBoundaryWidth = tabletW * containerScale;
        targetBoundaryHeight = tabletH * containerScale;
    }

    // Mettre à jour l'échelle globale (utilisée pour le drag)
    if (tabletW > 0) {
        currentScale = targetBoundaryWidth / tabletW;
    } else {
        currentScale = 1; // Fallback scale
    }
    // Ensure currentScale is a valid positive number
    if (!isFinite(currentScale) || currentScale <= 0) {
        currentScale = 1;
    }

    // 8. Appliquer les styles au rectangle (position et taille visuelles)
    const rectWidthPx = areaW * currentScale;
    const rectHeightPx = areaH * currentScale;
    const rectLeftPx = topLeftX * currentScale;
    const rectTopPx = topLeftY * currentScale;

    rectangle.style.width = `${rectWidthPx}px`;
    rectangle.style.height = `${rectHeightPx}px`;
    rectangle.style.left = `${rectLeftPx}px`;
    rectangle.style.top = `${rectTopPx}px`;

    // Cacher le rectangle si la tablette n'a pas de dimensions valides affichables
    rectangle.style.display = (targetBoundaryWidth > 0 && targetBoundaryHeight > 0) ? 'block' : 'none';

    // 9. Mettre à jour les infos récapitulatives
    // Ratio Tablette
    if (tabletH > 0) {
        tabletRatioInfo.textContent = `${(tabletW / tabletH).toFixed(3)}`;
    } else {
        tabletRatioInfo.textContent = 'N/A';
    }
    tabletDimensionsInfo.textContent = `${tabletW.toFixed(1)} x ${tabletH.toFixed(1)} mm`;

    // Ratio Area (calculer et mettre à jour currentRatio si nécessaire)
    if (areaH > 0) {
        const calculatedRatio = areaW / areaH;
        ratioInfo.textContent = `${calculatedRatio.toFixed(3)}`;
        // Si le ratio est verrouillé, utiliser la valeur de l'input `customRatio`
        if (lockRatio.checked) {
            const lockedRatioValue = parseFloat(customRatioInput.value);
            if (!isNaN(lockedRatioValue) && lockedRatioValue > 0) {
                currentRatio = lockedRatioValue; // Priorité à l'input si verrouillé
            } else {
                 currentRatio = calculatedRatio; // Fallback si input invalide
            }
        } else {
            // Si non verrouillé, le ratio actuel est celui calculé
            currentRatio = calculatedRatio;
            // Optionnel: mettre à jour l'input customRatio pour refléter le ratio actuel
            // customRatioInput.value = currentRatio.toFixed(3);
        }
    } else {
        ratioInfo.textContent = `N/A`;
        // Si verrouillé mais hauteur 0, utiliser l'input customRatio si valide
        if (lockRatio.checked) {
             const lockedRatioValue = parseFloat(customRatioInput.value);
             if (!isNaN(lockedRatioValue) && lockedRatioValue > 0) {
                currentRatio = lockedRatioValue;
             } else {
                 currentRatio = 1.0; // Fallback ratio
             }
        } else {
             currentRatio = NaN; // Pas de ratio définissable
        }
    }

    dimensionsInfo.textContent = `${areaW.toFixed(1)} x ${areaH.toFixed(1)} mm`;
    areaInfo.textContent = `${(areaW * areaH).toFixed(1)} mm²`;
    positionInfo.textContent = `${constrainedCenterX.toFixed(3)}, ${constrainedCenterY.toFixed(3)} mm`;
}
const throttledUpdateDisplay = throttle(updateDisplay, 50); // Throttle updateDisplay

// --- Logique Drag & Drop ---
rectangle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only react to left mouse button
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    // Stocker le centre initial au début du drag
    initialCenterOffsetX = parseFloat(areaOffsetXInput.value);
    initialCenterOffsetY = parseFloat(areaOffsetYInput.value);
    // Assurer des valeurs numériques
    if (isNaN(initialCenterOffsetX)) initialCenterOffsetX = 0;
    if (isNaN(initialCenterOffsetY)) initialCenterOffsetY = 0;

    rectangle.style.transition = 'none'; // Disable transition during drag for smoothness
    rectangle.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault(); // Prevent text selection or other default drag behaviors
});

function handleDrag(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    if (currentScale === 0) return; // Avoid division by zero

    // Convert pixel drag delta to mm delta based on current scale
    const deltaRealX = deltaX / currentScale;
    const deltaRealY = deltaY / currentScale;

    // Calculate new center position
    let newCenterX = initialCenterOffsetX + deltaRealX;
    let newCenterY = initialCenterOffsetY + deltaRealY;

    // Mettre à jour les inputs de position directement
    areaOffsetXInput.value = newCenterX.toFixed(3);
    areaOffsetYInput.value = newCenterY.toFixed(3);

    // Mettre à jour l'affichage (via throttle pour la performance)
    throttledUpdateDisplay();
}

function stopDrag() {
    if (isDragging) {
        isDragging = false;
        // Réactiver les transitions CSS après le drag
        rectangle.style.transition = 'width 0.1s linear, height 0.1s linear, top 0.1s linear, left 0.1s linear';
        rectangle.style.cursor = 'grab';
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        // Appel final à updateDisplay pour s'assurer que tout est contraint correctement
        updateDisplay();
    }
}

// --- Fonction pour annuler le mode édition ---
function cancelEditMode() {
    editingFavoriteId = null;
    saveBtn.textContent = "Sauvegarder Area";
    // Rétablir les classes de bouton vert standard de Tailwind
    saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
    saveBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
    cancelEditBtn.classList.add('hidden');
}


// --- Gestion des Inputs ---
function handleInputChange() {
    if (editingFavoriteId) {
        // Si on modifie un input pendant l'édition, on annule l'édition
        cancelEditMode();
    }
    updateDisplay();
}

// Tablet dimensions change -> switch to custom preset
tabletWidthInput.addEventListener('input', () => {
    toggleManualTabletInputs(true);
    tabletPresetSelect.value = 'custom';
    cancelEditMode(); // Cancel edit if user manually changes tablet size
    updateDisplay();
});
tabletHeightInput.addEventListener('input', () => {
    toggleManualTabletInputs(true);
    tabletPresetSelect.value = 'custom';
    cancelEditMode();
    updateDisplay();
});


// Area dimensions change
areaWidthInput.addEventListener('input', () => {
    cancelEditMode();
    if (lockRatio.checked && currentRatio > 0 && !isNaN(currentRatio)) {
        const widthValue = parseFloat(areaWidthInput.value);
        if (!isNaN(widthValue) && widthValue >= 0) {
            const newHeight = widthValue / currentRatio;
             // Vérifier si la nouvelle hauteur est significativement différente pour éviter boucle infinie
             if (Math.abs(parseFloat(areaHeightInput.value) - newHeight) > 0.01) {
                 areaHeightInput.value = newHeight.toFixed(1);
             }
        }
    }
    updateDisplay();
});

areaHeightInput.addEventListener('input', () => {
    cancelEditMode();
    if (lockRatio.checked && currentRatio > 0 && !isNaN(currentRatio)) {
         const heightValue = parseFloat(areaHeightInput.value);
         if (!isNaN(heightValue) && heightValue >= 0) {
             const newWidth = heightValue * currentRatio;
             // Vérifier si la nouvelle largeur est significativement différente
             if (Math.abs(parseFloat(areaWidthInput.value) - newWidth) > 0.01) {
                 areaWidthInput.value = newWidth.toFixed(1);
             }
         }
    }
    updateDisplay();
});

// Custom Ratio input change
customRatioInput.addEventListener('input', () => {
    cancelEditMode();
    const newRatio = parseFloat(customRatioInput.value);
    if (!isNaN(newRatio) && newRatio > 0) {
        currentRatio = newRatio;
        // Si le ratio est verrouillé, ajuster la hauteur en fonction de la nouvelle largeur et du nouveau ratio
        if (lockRatio.checked) {
            const currentWidth = parseFloat(areaWidthInput.value);
             if (!isNaN(currentWidth) && currentWidth >= 0) {
                 const newHeight = currentWidth / currentRatio;
                  if (Math.abs(parseFloat(areaHeightInput.value) - newHeight) > 0.01) {
                      areaHeightInput.value = newHeight.toFixed(1);
                  }
             }
        }
    } else {
        currentRatio = NaN; // Ratio invalide
    }
    updateDisplay(); // Mettre à jour l'affichage avec le nouveau ratio/dimensions
});


// Area offset changes
areaOffsetXInput.addEventListener('input', handleInputChange);
areaOffsetYInput.addEventListener('input', handleInputChange);


// Lock ratio checkbox change
lockRatio.addEventListener('change', () => {
    if (lockRatio.checked) {
        // Quand on verrouille, calculer le ratio actuel à partir des dimensions
        const w = parseFloat(areaWidthInput.value);
        const h = parseFloat(areaHeightInput.value);
        if (h > 0) {
            currentRatio = w / h;
            customRatioInput.value = currentRatio.toFixed(3);
        } else {
            // Si hauteur est 0 ou invalide, essayer de lire depuis l'input ratio, sinon défaut à 1.0
            const ratioFromInput = parseFloat(customRatioInput.value);
            if (!isNaN(ratioFromInput) && ratioFromInput > 0) {
                currentRatio = ratioFromInput;
            } else {
                currentRatio = 1.0; // Default ratio
                customRatioInput.value = currentRatio.toFixed(3);
            }
        }
    }
    // Pas besoin d'ajuster les dimensions ici, juste s'assurer que currentRatio est prêt
    updateDisplay(); // Update display might recalculate things based on new lock state
});


// Tablet Preset Select change
tabletPresetSelect.addEventListener('change', (event) => {
    const selectedValue = event.target.value;
    const selectedOption = event.target.selectedOptions[0];

    if (selectedValue === 'custom') {
        toggleManualTabletInputs(true);
        // Ne pas changer les valeurs width/height, laisser l'utilisateur les éditer
    } else if (selectedValue && selectedOption.dataset.width) {
        // Preset sélectionné
        const width = parseFloat(selectedOption.dataset.width);
        const height = parseFloat(selectedOption.dataset.height);
        if (!isNaN(width) && !isNaN(height)) {
            tabletWidthInput.value = width.toFixed(1);
            tabletHeightInput.value = height.toFixed(1);
            toggleManualTabletInputs(false); // Cacher inputs manuels
            cancelEditMode(); // Annuler l'édition si un preset est choisi
            updateDisplay(); // Mettre à jour l'affichage
        }
    } else {
        // Cas "Choisir un modèle" ou autre invalide
        toggleManualTabletInputs(false);
    }
});

// Swap Width/Height button
document.getElementById('swap-btn').addEventListener('click', () => {
    cancelEditMode();
    const currentWidth = areaWidthInput.value;
    areaWidthInput.value = areaHeightInput.value;
    areaHeightInput.value = currentWidth;

    // Recalculer et mettre à jour le ratio si verrouillé
    if (lockRatio.checked) {
        const width = parseFloat(areaWidthInput.value);
        const height = parseFloat(areaHeightInput.value);
        if (height > 0) {
            currentRatio = width / height;
            customRatioInput.value = currentRatio.toFixed(3);
        } else {
            // Si nouvelle hauteur est 0, essayer de garder ratio de l'input, sinon défaut
             const ratioFromInput = parseFloat(customRatioInput.value);
             if (!isNaN(ratioFromInput) && ratioFromInput > 0) {
                 currentRatio = ratioFromInput;
             } else {
                 currentRatio = 1.0; // Default ratio
                 customRatioInput.value = currentRatio.toFixed(3);
             }
        }
    }
    updateDisplay();
});

// Center Area button
document.getElementById('center-btn').addEventListener('click', () => {
    cancelEditMode();
    centerArea();
});

// Cancel Edit button
cancelEditBtn.addEventListener('click', cancelEditMode);


// --- Bouton Copier ---
document.getElementById('copy-btn').addEventListener('click', () => {
    const w = parseFloat(areaWidthInput.value);
    const h = parseFloat(areaHeightInput.value);
    const x = parseFloat(areaOffsetXInput.value);
    const y = parseFloat(areaOffsetYInput.value);
    const r = (h > 0) ? (w / h).toFixed(3) : 'N/A';

    const textToCopy = `-- Zone Active Réelle --\nLargeur: ${w.toFixed(1)} mm\nHauteur: ${h.toFixed(1)} mm\nRatio: ${r}\nCentre X: ${x.toFixed(3)} mm\nCentre Y: ${y.toFixed(3)} mm`;

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showNotification('Infos (Centre) copiées !');
        })
        .catch(err => {
            console.error('Erreur lors de la copie : ', err);
            showNotification('Erreur copie!');
        });
});


// --- Gestion des Favoris ---
const FAVORITES_KEY = 'osuAreaVisualizerFavorites_v1'; // Use a versioned key

function saveFavorite() {
    // Get current values
    const width = parseFloat(areaWidthInput.value);
    const height = parseFloat(areaHeightInput.value);
    const centerX = parseFloat(areaOffsetXInput.value);
    const centerY = parseFloat(areaOffsetYInput.value);
    const tabletW = parseFloat(tabletWidthInput.value);
    const tabletH = parseFloat(tabletHeightInput.value);
    const ratioStr = customRatioInput.value; // Store the string from input

    let comment = "";
    if (!editingFavoriteId) {
        // Only prompt for comment when creating a new favorite
        comment = prompt("Ajouter un commentaire (optionnel, max 40 caractères):");
        if (comment === null) {
            return; // User cancelled prompt
        }
        comment = comment.trim().substring(0, 40); // Trim and limit length
        if (comment.length > 40) { // Double check, prompt might bypass maxlength in some browsers
             showNotification("Le commentaire ne doit pas dépasser 40 caractères.");
             return;
        }
    }

    // Basic validation
    if (isNaN(width) || isNaN(height) || isNaN(centerX) || isNaN(centerY) || isNaN(tabletW) || isNaN(tabletH)) {
        showNotification("Erreur: Valeurs invalides. Impossible de sauvegarder.");
        return;
    }

    // Determine Preset Info
    let presetInfo = "Personnalisé";
    const currentTabletWidthStr = tabletW.toFixed(1);
    const currentTabletHeightStr = tabletH.toFixed(1);
    const selectedPresetValue = tabletPresetSelect.value;

    // Find if current dimensions match a known preset in the loaded data
    const matchedPresetData = tabletData.find(t =>
        t.width.toFixed(1) === currentTabletWidthStr &&
        t.height.toFixed(1) === currentTabletHeightStr
    );

    if (matchedPresetData && selectedPresetValue && selectedPresetValue !== 'custom' && selectedPresetValue !== '') {
        // If dimensions match a preset AND a preset is actually selected in the dropdown
        const selectedOption = tabletPresetSelect.querySelector(`option[value="${selectedPresetValue}"]`);
        if (selectedOption && selectedOption.dataset.width === matchedPresetData.width.toString() && selectedOption.dataset.height === matchedPresetData.height.toString()) {
            presetInfo = `${matchedPresetData.brand} - ${selectedOption.textContent}`; // Use text content for model name
        } else {
            // Fallback if option not found or data mismatch (shouldn't happen often)
            presetInfo = `${matchedPresetData.brand} - ${matchedPresetData.model}`;
        }
    }


    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    let notificationMessage = '';

    if (editingFavoriteId) {
        // --- Update existing favorite ---
        const index = favorites.findIndex(fav => fav.id.toString() === editingFavoriteId.toString());
        if (index > -1) {
            // Preserve the original comment when updating
            const existingComment = favorites[index].comment;
            favorites[index] = {
                ...favorites[index], // Keep original ID and potentially other future fields
                width: width,
                height: height,
                ratio: ratioStr, // Store the ratio string
                x: centerX,
                y: centerY,
                tabletW: tabletW,
                tabletH: tabletH,
                presetInfo: presetInfo, // Update preset info based on current state
                comment: existingComment // Keep the original comment
            };
            notificationMessage = 'Favori mis à jour !';
        } else {
            // Should not happen if UI is correct, but handle defensively
            showNotification("Erreur: Favori à éditer non trouvé.");
            cancelEditMode(); // Reset UI state
            return;
        }
    } else {
        // --- Add new favorite ---
        const newFavorite = {
            id: Date.now(), // Simple unique ID based on timestamp
            width: width,
            height: height,
            ratio: ratioStr, // Store the ratio string
            x: centerX,
            y: centerY,
            comment: comment, // Use the comment entered by the user
            tabletW: tabletW,
            tabletH: tabletH,
            presetInfo: presetInfo
        };
        favorites.push(newFavorite);
        notificationMessage = 'Favori sauvegardé !';
    }

    // Save updated favorites array back to localStorage
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

    // Refresh the displayed list and show feedback
    displayFavorites();
    showNotification(notificationMessage);
    cancelEditMode(); // Exit edit mode after saving/updating
}

function startEditFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const favoriteToEdit = favorites.find(fav => fav.id.toString() === id.toString());

    if (!favoriteToEdit) {
        showNotification("Erreur: Favori non trouvé pour édition.");
        return;
    }

    // Load favorite data into the input fields
    // Use .toFixed() to format numbers appropriately for inputs
    if (favoriteToEdit.tabletW !== undefined) tabletWidthInput.value = favoriteToEdit.tabletW.toFixed(1);
    if (favoriteToEdit.tabletH !== undefined) tabletHeightInput.value = favoriteToEdit.tabletH.toFixed(1);
    areaWidthInput.value = favoriteToEdit.width.toFixed(1);
    areaHeightInput.value = favoriteToEdit.height.toFixed(1);
    areaOffsetXInput.value = favoriteToEdit.x !== undefined ? favoriteToEdit.x.toFixed(3) : '0.000'; // Default if missing
    areaOffsetYInput.value = favoriteToEdit.y !== undefined ? favoriteToEdit.y.toFixed(3) : '0.000'; // Default if missing

    // Handle Ratio
    if (favoriteToEdit.ratio && favoriteToEdit.ratio !== 'N/A') {
        const savedRatio = parseFloat(favoriteToEdit.ratio);
        if (!isNaN(savedRatio) && savedRatio > 0) {
            customRatioInput.value = savedRatio.toFixed(3);
            currentRatio = savedRatio; // Update state variable
        } else {
             // Fallback if saved ratio string is invalid, calculate from dims
            if (favoriteToEdit.height > 0) {
                 currentRatio = favoriteToEdit.width / favoriteToEdit.height;
            } else {
                 currentRatio = 1.0; // Default
            }
            customRatioInput.value = currentRatio.toFixed(3);
        }
    } else if (favoriteToEdit.height > 0) {
        // If ratio field is missing/NA, calculate from dimensions
        currentRatio = favoriteToEdit.width / favoriteToEdit.height;
        customRatioInput.value = currentRatio.toFixed(3);
    } else {
        // Fallback if height is 0 and no ratio saved
        currentRatio = 1.0;
        customRatioInput.value = currentRatio.toFixed(3);
    }

    // Set lockRatio checkbox based on whether we have a valid positive ratio
    lockRatio.checked = (!isNaN(currentRatio) && currentRatio > 0);

    // Update Tablet Preset Dropdown and visibility of manual inputs
    const loadedTabletWidthStr = favoriteToEdit.tabletW.toFixed(1);
    const loadedTabletHeightStr = favoriteToEdit.tabletH.toFixed(1);

    // Find the <option> that matches the loaded tablet dimensions
    const matchedPresetOption = Array.from(tabletPresetSelect.options).find(opt =>
        opt.dataset.width && opt.dataset.height &&
        parseFloat(opt.dataset.width).toFixed(1) === loadedTabletWidthStr &&
        parseFloat(opt.dataset.height).toFixed(1) === loadedTabletHeightStr
    );

    if (matchedPresetOption && favoriteToEdit.presetInfo !== "Personnalisé") {
        // If a matching preset option exists AND the saved info wasn't "Custom"
        tabletPresetSelect.value = matchedPresetOption.value;
        toggleManualTabletInputs(false); // Hide manual inputs
    } else {
        // Otherwise, select "Custom" and show manual inputs
        tabletPresetSelect.value = 'custom';
        toggleManualTabletInputs(true);
    }

    // Enter Edit Mode
    editingFavoriteId = id;
    saveBtn.textContent = "Mettre à Jour";
    // Apply Tailwind classes for yellow "update" button
    saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
    saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
    cancelEditBtn.classList.remove('hidden'); // Show cancel button

    // Update the visual display and scroll to top for visibility
    updateDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function displayFavorites() {
    favoritesList.innerHTML = ''; // Clear current list
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

    // Toggle placeholder visibility
    favoritesPlaceholder.classList.toggle('hidden', favorites.length > 0);

    if (favorites.length === 0) {
        return; // Nothing to display
    }

    // Sort favorites based on current criteria
    favorites.sort((a, b) => {
        switch (currentSortCriteria) {
            case 'name':
                // Sort alphabetically by comment (case-insensitive), empty comments last
                const commentA = (a.comment || '').toLowerCase();
                const commentB = (b.comment || '').toLowerCase();
                if (commentA && !commentB) return -1;
                if (!commentA && commentB) return 1;
                return commentA.localeCompare(commentB);
            case 'size':
                // Sort by area size (width * height), descending (largest first)
                const areaA = (a.width || 0) * (a.height || 0);
                const areaB = (b.width || 0) * (b.height || 0);
                return areaB - areaA;
            case 'date': // Default sort
            default:
                // Sort by ID (timestamp), descending (newest first)
                return (b.id || 0) - (a.id || 0);
        }
    });

    // Create and append list items for each favorite
    favorites.forEach((fav) => {
        const itemDiv = document.createElement('div');
        // Tailwind classes for the favorite item container
        itemDiv.className = 'favorite-item bg-gray-700/50 p-3 rounded-lg flex justify-between items-center gap-2 text-sm hover:bg-gray-700 transition duration-150 ease-in-out';

        // Build the inner HTML string for the favorite item content
        const commentHtml = fav.comment ? `<span class="font-semibold text-white">${fav.comment}</span> - ` : '';
        const dimensionsHtml = `${fav.width.toFixed(1)}x${fav.height.toFixed(1)}mm`;
        // Safely parse ratio string for display
        const ratioValue = fav.ratio ? parseFloat(fav.ratio) : NaN;
        const ratioHtml = (!isNaN(ratioValue) && ratioValue > 0) ? ` (${ratioValue.toFixed(3)})` : '';
        const positionHtml = (fav.x !== undefined && fav.y !== undefined) ? ` @(${fav.x.toFixed(3)}, ${fav.y.toFixed(3)})` : '';
        // Preset/Tablet info display logic
        const presetTextClass = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? 'text-cyan-400' : 'text-gray-400';
        const presetTextTitle = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? 'Basé sur le preset tablette' : 'Dimensions tablette personnalisées';
        const presetTextDisplay = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? `[${fav.presetInfo}]` : '[Perso.]';
        const presetHtml = `<span class="text-xs ${presetTextClass}" title="${presetTextTitle}">${presetTextDisplay}</span>`;
        const tabletDimsHtml = (fav.tabletW && fav.tabletH) ? ` <span class="text-xs text-gray-500">(Tab: ${fav.tabletW.toFixed(1)}x${fav.tabletH.toFixed(1)})</span>` : '';

        itemDiv.innerHTML = `
            <div class="flex-grow mr-2 space-x-1 flex flex-wrap items-baseline gap-x-2">
                ${commentHtml}
                <span>${dimensionsHtml}${ratioHtml}${positionHtml}</span>
                ${presetHtml}
                ${tabletDimsHtml}
            </div>
            <div class="flex-shrink-0 space-x-1">
                <button onclick="startEditFavorite('${fav.id}')" class="btn btn-secondary btn-sm px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 rounded-md font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800" title="Modifier">✎</button>
                <button onclick="loadFavorite('${fav.id}')" class="btn btn-primary btn-sm px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 rounded-md font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800" title="Charger">Charger</button>
                <button onclick="deleteFavorite('${fav.id}')" class="btn btn-danger btn-sm px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 focus:ring-red-500 rounded-md font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800" title="Supprimer">X</button>
            </div>`;

        favoritesList.appendChild(itemDiv);
    });

    // Update the visual state of sort buttons after displaying
    updateSortButtonsUI();
}

// Make functions globally accessible if called directly from HTML onclick attributes
window.startEditFavorite = startEditFavorite;
window.loadFavorite = loadFavorite;
window.deleteFavorite = deleteFavorite;


function loadFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const favoriteToLoad = favorites.find(fav => fav.id.toString() === id.toString());

    if (!favoriteToLoad) {
        showNotification("Erreur: Favori non trouvé.");
        return;
    }

    // --- Load data into inputs (similar to startEditFavorite but without entering edit mode) ---
     if (favoriteToLoad.tabletW !== undefined) tabletWidthInput.value = favoriteToLoad.tabletW.toFixed(1);
     if (favoriteToLoad.tabletH !== undefined) tabletHeightInput.value = favoriteToLoad.tabletH.toFixed(1);
     areaWidthInput.value = favoriteToLoad.width.toFixed(1);
     areaHeightInput.value = favoriteToLoad.height.toFixed(1);
     areaOffsetXInput.value = favoriteToLoad.x !== undefined ? favoriteToLoad.x.toFixed(3) : '0.000';
     areaOffsetYInput.value = favoriteToLoad.y !== undefined ? favoriteToLoad.y.toFixed(3) : '0.000';

     // Handle Ratio loading
     if (favoriteToLoad.ratio && favoriteToLoad.ratio !== 'N/A') {
         const savedRatio = parseFloat(favoriteToLoad.ratio);
         if (!isNaN(savedRatio) && savedRatio > 0) {
             customRatioInput.value = savedRatio.toFixed(3);
             currentRatio = savedRatio;
         } else {
             if (favoriteToLoad.height > 0) currentRatio = favoriteToLoad.width / favoriteToLoad.height; else currentRatio = 1.0;
             customRatioInput.value = currentRatio.toFixed(3);
         }
     } else if (favoriteToLoad.height > 0) {
         currentRatio = favoriteToLoad.width / favoriteToLoad.height;
         customRatioInput.value = currentRatio.toFixed(3);
     } else {
         currentRatio = 1.0;
         customRatioInput.value = currentRatio.toFixed(3);
     }
     lockRatio.checked = (!isNaN(currentRatio) && currentRatio > 0);

     // Update Tablet Preset Dropdown
     const loadedTabletWidthStr = favoriteToLoad.tabletW.toFixed(1);
     const loadedTabletHeightStr = favoriteToLoad.tabletH.toFixed(1);
     const matchedPresetOption = Array.from(tabletPresetSelect.options).find(opt =>
         opt.dataset.width && opt.dataset.height &&
         parseFloat(opt.dataset.width).toFixed(1) === loadedTabletWidthStr &&
         parseFloat(opt.dataset.height).toFixed(1) === loadedTabletHeightStr
     );

     if (matchedPresetOption && favoriteToLoad.presetInfo !== "Personnalisé") {
         tabletPresetSelect.value = matchedPresetOption.value;
         toggleManualTabletInputs(false);
     } else {
         tabletPresetSelect.value = 'custom';
         toggleManualTabletInputs(true);
     }

    // Ensure we are not in edit mode
    cancelEditMode();

    // Update the display with loaded values
    updateDisplay();
    showNotification(`Favori "${favoriteToLoad.comment || 'Sans nom'}" chargé !`);
}

function deleteFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const initialLength = favorites.length;
    favorites = favorites.filter(fav => fav.id.toString() !== id.toString());

    if (favorites.length < initialLength) {
        // If the length decreased, a favorite was removed
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        displayFavorites(); // Refresh the list
        showNotification('Favori supprimé.');
         // If the deleted favorite was the one being edited, cancel edit mode
         if (editingFavoriteId === id) {
            cancelEditMode();
         }
    } else {
        // Should not happen if ID exists, but handle just in case
        showNotification('Erreur: Favori non trouvé pour suppression.');
    }
}

// Attach event listener to the save button
saveBtn.addEventListener('click', saveFavorite);


// --- Logique d'Alignement ---
function setCenterOffset(newX, newY) {
    cancelEditMode(); // Exit edit mode if active
    // Update input values only if a non-null value is provided
    if (newX !== null && !isNaN(newX)) {
        areaOffsetXInput.value = newX.toFixed(3);
    }
    if (newY !== null && !isNaN(newY)) {
        areaOffsetYInput.value = newY.toFixed(3);
    }
    updateDisplay(); // Update the visualization
    contextMenu.style.display = 'none'; // Hide context menu after action
}

function centerArea() {
    const tabletW = parseFloat(tabletWidthInput.value);
    const tabletH = parseFloat(tabletHeightInput.value);
    if (isNaN(tabletW) || isNaN(tabletH)) return; // Need valid tablet dimensions
    setCenterOffset(tabletW / 2, tabletH / 2);
}


// Context Menu Event Listener
rectangle.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent default browser context menu

    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const bodyWidth = document.body.clientWidth;
    const bodyHeight = document.body.clientHeight;

    // Calculate position, ensuring menu stays within viewport
    let menuX = e.clientX;
    let menuY = e.clientY;

    if (menuX + menuWidth > bodyWidth) {
        menuX = bodyWidth - menuWidth - 5; // Adjust if too close to right edge
    }
    if (menuY + menuHeight > bodyHeight) {
        menuY = bodyHeight - menuHeight - 5; // Adjust if too close to bottom edge
    }

    contextMenu.style.left = `${menuX}px`;
    contextMenu.style.top = `${menuY}px`;
    contextMenu.style.display = 'block';
});

// Global click listener to hide context menu
document.addEventListener('click', (e) => {
    // Hide if clicked outside the menu and not on the rectangle itself (which opens it)
    if (!contextMenu.contains(e.target) && e.target !== rectangle) {
        contextMenu.style.display = 'none';
    }
});


// Alignment Button Listeners
document.getElementById('align-left').addEventListener('click', () => {
    cancelEditMode();
    const areaW = parseFloat(areaWidthInput.value);
    if (!isNaN(areaW)) {
        setCenterOffset(areaW / 2, null); // Set only X
    }
});

document.getElementById('align-right').addEventListener('click', () => {
    cancelEditMode();
    const tabletW = parseFloat(tabletWidthInput.value);
    const areaW = parseFloat(areaWidthInput.value);
    if (!isNaN(tabletW) && !isNaN(areaW)) {
        setCenterOffset(tabletW - (areaW / 2), null); // Set only X
    }
});

document.getElementById('align-center-h').addEventListener('click', () => {
    cancelEditMode();
    const tabletW = parseFloat(tabletWidthInput.value);
    if (!isNaN(tabletW)) {
        setCenterOffset(tabletW / 2, null); // Set only X
    }
});

document.getElementById('align-top').addEventListener('click', () => {
    cancelEditMode();
    const areaH = parseFloat(areaHeightInput.value);
    if (!isNaN(areaH)) {
        setCenterOffset(null, areaH / 2); // Set only Y
    }
});

document.getElementById('align-bottom').addEventListener('click', () => {
    cancelEditMode();
    const tabletH = parseFloat(tabletHeightInput.value);
    const areaH = parseFloat(areaHeightInput.value);
    if (!isNaN(tabletH) && !isNaN(areaH)) {
        setCenterOffset(null, tabletH - (areaH / 2)); // Set only Y
    }
});

document.getElementById('align-center-v').addEventListener('click', () => {
    cancelEditMode();
    const tabletH = parseFloat(tabletHeightInput.value);
    if (!isNaN(tabletH)) {
        setCenterOffset(null, tabletH / 2); // Set only Y
    }
});

document.getElementById('align-center').addEventListener('click', centerArea); // Reuse the center function


// --- Toggle Grid ---
toggleGridCheckbox.addEventListener('change', () => {
    backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
});


// --- Tri Favoris ---
function updateSortButtonsUI() {
    sortOptionsDiv.querySelectorAll('.sort-button').forEach(button => {
        const isActive = button.dataset.sort === currentSortCriteria;
        // Toggle Tailwind classes for active/inactive state
        button.classList.toggle('bg-blue-700', isActive); // More prominent color when active
        button.classList.toggle('ring-2', isActive);    // Add ring when active
        button.classList.toggle('ring-blue-400', isActive); // Ring color
        // Ensure default styles are present when inactive
        button.classList.toggle('bg-blue-600', !isActive);
        button.classList.toggle('hover:bg-blue-700', !isActive); // Keep hover effect on inactive
    });
}

sortOptionsDiv.addEventListener('click', (e) => {
    // Use event delegation on the container
    if (e.target.classList.contains('sort-button')) {
        const sortBy = e.target.dataset.sort;
        if (sortBy && sortBy !== currentSortCriteria) { // Only update if criteria changes
            currentSortCriteria = sortBy;
            displayFavorites(); // Re-render the list with new sorting
            // updateSortButtonsUI(); // updateSortButtonsUI is called within displayFavorites
        }
    }
});


// --- Initialisation ---
async function loadTabletPresets() {
    try {
        // Assumes tablets.json is in the same directory as index.html
        const response = await fetch('tablets.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        tabletData = await response.json(); // Store loaded data globally

        // Sort data alphabetically by brand, then model
        tabletData.sort((a, b) => {
            if (a.brand < b.brand) return -1;
            if (a.brand > b.brand) return 1;
            if (a.model < b.model) return -1;
            if (a.model > b.model) return 1;
            return 0;
        });

        // Group by brand for <optgroup>
        const groupedByBrand = tabletData.reduce((acc, tablet) => {
            (acc[tablet.brand] = acc[tablet.brand] || []).push(tablet);
            return acc;
        }, {});

        // Populate the select dropdown
        tabletPresetSelect.innerHTML = `
            <option value="" disabled selected>-- Choisir un modèle --</option>
            <option value="custom">-- Personnalisé --</option>
        `; // Reset options

        for (const brand in groupedByBrand) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = brand;
            groupedByBrand[brand].forEach(tablet => {
                const option = document.createElement('option');
                // Use a unique value, e.g., brand-model, or rely on dataset attributes
                option.value = `${brand}-${tablet.model.replace(/\s+/g, '-')}`; // Create a more robust value
                option.textContent = tablet.model;
                option.dataset.width = tablet.width; // Store data directly on the option
                option.dataset.height = tablet.height;
                option.dataset.brand = brand; // Store brand too if needed
                optgroup.appendChild(option);
            });
            tabletPresetSelect.appendChild(optgroup);
        }

        tabletPresetSelect.disabled = false; // Enable select dropdown

    } catch (error) {
        console.error("Could not load tablet presets:", error);
        tabletPresetSelect.disabled = true;
        // Provide feedback in the dropdown itself
        const errorOption = document.createElement('option');
        errorOption.textContent = "Erreur chargement presets";
        errorOption.disabled = true;
        // Insert error message after the placeholder options
        tabletPresetSelect.insertBefore(errorOption, tabletPresetSelect.children[2]); // After "Choisir" and "Personnalisé"
    }
}

function initializeApp() {
    // Initial calculation of currentRatio based on default input values
    const initialWidth = parseFloat(areaWidthInput.value);
    const initialHeight = parseFloat(areaHeightInput.value);
    if (initialHeight > 0) {
        currentRatio = initialWidth / initialHeight;
        customRatioInput.value = currentRatio.toFixed(3);
    } else {
        // If height is 0, try reading ratio input, else default
        const ratioFromInput = parseFloat(customRatioInput.value);
        if (!isNaN(ratioFromInput) && ratioFromInput > 0) {
            currentRatio = ratioFromInput;
        } else {
            currentRatio = 1.0; // Default ratio
            customRatioInput.value = currentRatio.toFixed(3);
        }
    }

    // Set initial grid visibility
    backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);

    // Load presets, then update display and favorites
    loadTabletPresets().then(() => {
        // Determine initial state of manual inputs based on select value
        toggleManualTabletInputs(tabletPresetSelect.value === 'custom');
        updateDisplay(); // Initial calculation and rendering
        displayFavorites(); // Load and display saved favorites
    });

    // Add resize listener to recalculate layout
    window.addEventListener('resize', updateDisplay); // Use non-throttled for immediate response on resize start/end
    // Or use throttled if performance is an issue on rapid resize:
    // window.addEventListener('resize', throttledUpdateDisplay);
}

// Ensure the DOM is fully loaded before running initialization logic
document.addEventListener('DOMContentLoaded', initializeApp);