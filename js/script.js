// js/script.js

document.addEventListener('DOMContentLoaded', initializeApp);

// --- State & Constants ---
const FAVORITES_KEY = 'osuAreaVisualizerFavorites_v1';
let currentRatio = 1.0;
let isDragging = false;
let dragStartX, dragStartY;
let initialCenterOffsetX, initialCenterOffsetY;
let currentScale = 1.0;
let tabletData = [];
let editingFavoriteId = null;
let currentSortCriteria = 'date';
let throttleTimer = null;

// --- DOM Element References (Grouped) ---
const elements = {
    tabletWidthInput: document.getElementById('tabletWidth'),
    tabletHeightInput: document.getElementById('tabletHeight'),
    areaWidthInput: document.getElementById('areaWidth'),
    areaHeightInput: document.getElementById('areaHeight'),
    areaOffsetXInput: document.getElementById('areaOffsetX'),
    areaOffsetYInput: document.getElementById('areaOffsetY'),
    customRatioInput: document.getElementById('customRatio'),
    lockRatio: document.getElementById('lockRatio'),
    rectangle: document.getElementById('rectangle'),
    tabletBoundary: document.getElementById('tablet-boundary'),
    visualContainer: document.getElementById('visual-container'),
    contextMenu: document.getElementById('context-menu'),
    favoritesList: document.getElementById('favorites-list'),
    favoritesPlaceholder: document.getElementById('favorites-list').querySelector('p'),
    tabletPresetSelect: document.getElementById('tabletPresetSelect'),
    tabletWidthGroup: document.getElementById('tablet-width-group'),
    tabletHeightGroup: document.getElementById('tablet-height-group'),
    tabletManualHr: document.getElementById('tablet-manual-hr'),
    tabletDimensionsInfo: document.getElementById('tablet-dimensions-info'),
    tabletRatioInfo: document.getElementById('tablet-ratio-info'),
    dimensionsInfo: document.getElementById('dimensions-info'),
    ratioInfo: document.getElementById('ratio-info'),
    areaInfo: document.getElementById('area-info'),
    positionInfo: document.getElementById('position-info'),
    saveBtn: document.getElementById('save-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    copyBtn: document.getElementById('copy-btn'),
    swapBtn: document.getElementById('swap-btn'),
    centerBtn: document.getElementById('center-btn'),
    toggleGridCheckbox: document.getElementById('toggleGridCheckbox'),
    backgroundGrid: document.getElementById('backgroundGrid'),
    sortOptionsDiv: document.getElementById('sort-options'),
    alignLeftBtn: document.getElementById('align-left'),
    alignCenterHBtn: document.getElementById('align-center-h'),
    alignRightBtn: document.getElementById('align-right'),
    alignTopBtn: document.getElementById('align-top'),
    alignCenterVBtn: document.getElementById('align-center-v'),
    alignBottomBtn: document.getElementById('align-bottom'),
    alignCenterBtn: document.getElementById('align-center'),
};

// --- Utility Functions ---
function showNotification(message) {
    const n = document.createElement('div');
    n.textContent = message;
    n.className = 'notification fixed bottom-5 right-5 p-3 bg-blue-600 text-white rounded-lg shadow-xl z-50 opacity-0 transition-opacity duration-300 ease-out';
    document.body.appendChild(n);
    void n.offsetWidth; // Force reflow
    n.classList.add('show');
    setTimeout(() => {
        n.classList.remove('show');
        setTimeout(() => n.remove(), 300);
    }, 2500);
}

function toggleManualTabletInputs(show) {
    elements.tabletWidthGroup.classList.toggle('hidden', !show);
    elements.tabletHeightGroup.classList.toggle('hidden', !show);
    elements.tabletManualHr.classList.toggle('hidden', !show);
}

function throttle(func, limit) {
    return function(...args) {
        if (!throttleTimer) {
            func.apply(this, args);
            throttleTimer = setTimeout(() => { throttleTimer = null; }, limit);
        }
    }
}

function getNumericValue(inputElement, defaultValue = 0, precision = 1) {
    const value = parseFloat(inputElement.value);
    return isNaN(value) ? defaultValue : parseFloat(value.toFixed(precision));
}

function getPreciseNumericValue(inputElement, defaultValue = 0, precision = 3) {
    const value = parseFloat(inputElement.value);
    return isNaN(value) ? defaultValue : parseFloat(value.toFixed(precision));
}


// --- Core Display Logic ---
function updateTabletBoundarySize() {
    let tabletW = getNumericValue(elements.tabletWidthInput, 1);
    let tabletH = getNumericValue(elements.tabletHeightInput, 1);
    if (tabletW <= 0) tabletW = 1;
    if (tabletH <= 0) tabletH = 1;

    const padding = 32;
    const containerWidth = elements.visualContainer.clientWidth - padding;
    const containerHeight = elements.visualContainer.clientHeight - padding;

    if (containerWidth <= 0 || containerHeight <= 0) return { boundaryWidth: 0, boundaryHeight: 0, scale: 1 };

    const scaleX = containerWidth / tabletW;
    const scaleY = containerHeight / tabletH;
    const scale = Math.min(scaleX, scaleY);
    const boundaryWidth = tabletW * scale;
    const boundaryHeight = tabletH * scale;

    elements.tabletBoundary.style.width = `${boundaryWidth.toFixed(1)}px`;
    elements.tabletBoundary.style.height = `${boundaryHeight.toFixed(1)}px`;

    return { boundaryWidth, boundaryHeight, scale };
}

function updateDisplay() {
    const { boundaryWidth, boundaryHeight, scale } = updateTabletBoundarySize();
    currentScale = (scale > 0 && isFinite(scale)) ? scale : 1;

    let tabletW = getNumericValue(elements.tabletWidthInput, 1);
    let tabletH = getNumericValue(elements.tabletHeightInput, 1);
    let areaW = getNumericValue(elements.areaWidthInput, 0);
    let areaH = getNumericValue(elements.areaHeightInput, 0);
    let centerX = getPreciseNumericValue(elements.areaOffsetXInput, tabletW / 2);
    let centerY = getPreciseNumericValue(elements.areaOffsetYInput, tabletH / 2);

    // Constrain area size
    areaW = Math.max(0, Math.min(areaW, tabletW));
    areaH = Math.max(0, Math.min(areaH, tabletH));
    if (getNumericValue(elements.areaWidthInput) > tabletW) elements.areaWidthInput.value = areaW.toFixed(1);
    if (getNumericValue(elements.areaHeightInput) > tabletH) elements.areaHeightInput.value = areaH.toFixed(1);

    // Calculate top-left and constrain position
    let topLeftX = centerX - (areaW / 2);
    let topLeftY = centerY - (areaH / 2);
    topLeftX = Math.max(0, Math.min(topLeftX, tabletW - areaW));
    topLeftY = Math.max(0, Math.min(topLeftY, tabletH - areaH));

    // Recalculate actual center and update inputs if changed by constraints
    let constrainedCenterX = getPreciseNumericValue(elements.areaOffsetXInput, 0, 3);
    let constrainedCenterY = getPreciseNumericValue(elements.areaOffsetYInput, 0, 3);
    const newConstrainedCenterX = parseFloat((topLeftX + (areaW / 2)).toFixed(3));
    const newConstrainedCenterY = parseFloat((topLeftY + (areaH / 2)).toFixed(3));

    if (Math.abs(constrainedCenterX - newConstrainedCenterX) > 0.0001) {
        elements.areaOffsetXInput.value = newConstrainedCenterX.toFixed(3);
        constrainedCenterX = newConstrainedCenterX;
    }
     if (Math.abs(constrainedCenterY - newConstrainedCenterY) > 0.0001) {
        elements.areaOffsetYInput.value = newConstrainedCenterY.toFixed(3);
        constrainedCenterY = newConstrainedCenterY;
    }

    // Update rectangle style
    const rectWidthPx = areaW * currentScale;
    const rectHeightPx = areaH * currentScale;
    const rectLeftPx = topLeftX * currentScale;
    const rectTopPx = topLeftY * currentScale;

    elements.rectangle.style.width = `${rectWidthPx}px`;
    elements.rectangle.style.height = `${rectHeightPx}px`;
    elements.rectangle.style.left = `${rectLeftPx}px`;
    elements.rectangle.style.top = `${rectTopPx}px`;
    elements.rectangle.style.display = (boundaryWidth > 0 && boundaryHeight > 0) ? 'block' : 'none';

    // Update Info Panel
    elements.tabletDimensionsInfo.textContent = `${tabletW.toFixed(1)} x ${tabletH.toFixed(1)} mm`;
    elements.tabletRatioInfo.textContent = tabletH > 0 ? (tabletW / tabletH).toFixed(3) : 'N/A';
    elements.dimensionsInfo.textContent = `${areaW.toFixed(1)} x ${areaH.toFixed(1)} mm`;
    elements.areaInfo.textContent = `${(areaW * areaH).toFixed(1)} mm²`;
    elements.positionInfo.textContent = `${constrainedCenterX.toFixed(3)}, ${constrainedCenterY.toFixed(3)} mm`;

    // Update Ratio Info and State
    if (areaH > 0) {
        const calculatedRatio = areaW / areaH;
        elements.ratioInfo.textContent = calculatedRatio.toFixed(3);
        if (elements.lockRatio.checked) {
            const lockedRatioValue = parseFloat(elements.customRatioInput.value);
            currentRatio = (!isNaN(lockedRatioValue) && lockedRatioValue > 0) ? lockedRatioValue : calculatedRatio;
        } else {
            currentRatio = calculatedRatio;
        }
    } else {
        elements.ratioInfo.textContent = 'N/A';
        if (elements.lockRatio.checked) {
            const lockedRatioValue = parseFloat(elements.customRatioInput.value);
            currentRatio = (!isNaN(lockedRatioValue) && lockedRatioValue > 0) ? lockedRatioValue : 1.0;
        } else {
            currentRatio = NaN;
        }
    }
}
const throttledUpdateDisplay = throttle(updateDisplay, 50);


// --- Event Handlers ---

function handleInputChange() {
    if (editingFavoriteId) cancelEditMode();
    updateDisplay();
}

function handleAreaDimensionChange(changedInput, otherInput, isWidthChanged) {
    cancelEditMode();
    if (elements.lockRatio.checked && currentRatio > 0 && !isNaN(currentRatio)) {
        const changedValue = getNumericValue(changedInput);
        if (changedValue >= 0) {
            const otherValue = isWidthChanged ? changedValue / currentRatio : changedValue * currentRatio;
            if (Math.abs(getNumericValue(otherInput) - otherValue) > 0.01) {
                otherInput.value = otherValue.toFixed(1);
            }
        }
    }
    updateDisplay();
}

function handleCustomRatioChange() {
    cancelEditMode();
    const newRatio = parseFloat(elements.customRatioInput.value);
    if (!isNaN(newRatio) && newRatio > 0) {
        currentRatio = newRatio;
        if (elements.lockRatio.checked) {
            const currentWidth = getNumericValue(elements.areaWidthInput);
            if (currentWidth >= 0) {
                const newHeight = currentWidth / currentRatio;
                if (Math.abs(getNumericValue(elements.areaHeightInput) - newHeight) > 0.01) {
                    elements.areaHeightInput.value = newHeight.toFixed(1);
                }
            }
        }
    } else {
        currentRatio = NaN;
    }
    updateDisplay();
}

function handleLockRatioChange() {
    if (elements.lockRatio.checked) {
        const w = getNumericValue(elements.areaWidthInput);
        const h = getNumericValue(elements.areaHeightInput);
        if (h > 0) {
            currentRatio = w / h;
        } else {
            const ratioFromInput = parseFloat(elements.customRatioInput.value);
            currentRatio = (!isNaN(ratioFromInput) && ratioFromInput > 0) ? ratioFromInput : 1.0;
        }
        elements.customRatioInput.value = currentRatio.toFixed(3);
    }
    updateDisplay();
}

function handlePresetChange(event) {
    const selectedValue = event.target.value;
    const selectedOption = event.target.selectedOptions[0];
    if (selectedValue === 'custom') {
        toggleManualTabletInputs(true);
    } else if (selectedValue && selectedOption.dataset.width) {
        const width = parseFloat(selectedOption.dataset.width);
        const height = parseFloat(selectedOption.dataset.height);
        if (!isNaN(width) && !isNaN(height)) {
            elements.tabletWidthInput.value = width.toFixed(1);
            elements.tabletHeightInput.value = height.toFixed(1);
            toggleManualTabletInputs(false);
            cancelEditMode();
            updateDisplay();
        }
    } else {
        toggleManualTabletInputs(false);
    }
}

function handleSwap() {
    cancelEditMode();
    const currentWidth = elements.areaWidthInput.value;
    elements.areaWidthInput.value = elements.areaHeightInput.value;
    elements.areaHeightInput.value = currentWidth;
    handleLockRatioChange(); // Recalculate ratio if locked
    updateDisplay();
}

function handleCopy() {
    const w = getNumericValue(elements.areaWidthInput);
    const h = getNumericValue(elements.areaHeightInput);
    const x = getPreciseNumericValue(elements.areaOffsetXInput);
    const y = getPreciseNumericValue(elements.areaOffsetYInput);
    const r = (h > 0) ? (w / h).toFixed(3) : 'N/A';
    const textToCopy = `-- Zone Active Réelle --\nLargeur: ${w.toFixed(1)} mm\nHauteur: ${h.toFixed(1)} mm\nRatio: ${r}\nCentre X: ${x.toFixed(3)} mm\nCentre Y: ${y.toFixed(3)} mm`;
    navigator.clipboard.writeText(textToCopy)
        .then(() => showNotification('Infos (Centre) copiées !'))
        .catch(err => { console.error('Erreur copie:', err); showNotification('Erreur copie!'); });
}

function handleDragStart(e) {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialCenterOffsetX = getPreciseNumericValue(elements.areaOffsetXInput, 0);
    initialCenterOffsetY = getPreciseNumericValue(elements.areaOffsetYInput, 0);
    elements.rectangle.style.transition = 'none';
    elements.rectangle.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    e.preventDefault();
}

function handleDragMove(e) {
    if (!isDragging || currentScale === 0) return;
    const deltaX = (e.clientX - dragStartX) / currentScale;
    const deltaY = (e.clientY - dragStartY) / currentScale;
    elements.areaOffsetXInput.value = (initialCenterOffsetX + deltaX).toFixed(3);
    elements.areaOffsetYInput.value = (initialCenterOffsetY + deltaY).toFixed(3);
    throttledUpdateDisplay();
}

function handleDragEnd() {
    if (isDragging) {
        isDragging = false;
        elements.rectangle.style.transition = 'width 0.1s linear, height 0.1s linear, top 0.1s linear, left 0.1s linear';
        elements.rectangle.style.cursor = 'grab';
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        updateDisplay(); // Final update to ensure constraints
    }
}

function handleContextMenu(e) {
    e.preventDefault();
    const menu = elements.contextMenu;
    const { clientX: mouseX, clientY: mouseY } = e;
    const { innerWidth: winWidth, innerHeight: winHeight } = window;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    menu.style.left = `${Math.min(mouseX, winWidth - menuWidth - 5)}px`;
    menu.style.top = `${Math.min(mouseY, winHeight - menuHeight - 5)}px`;
    menu.style.display = 'block';
}

function hideContextMenu(e) {
    if (!elements.contextMenu.contains(e.target) && e.target !== elements.rectangle) {
        elements.contextMenu.style.display = 'none';
    }
}

function handleSortClick(e) {
    if (e.target.classList.contains('sort-button')) {
        const sortBy = e.target.dataset.sort;
        if (sortBy && sortBy !== currentSortCriteria) {
            currentSortCriteria = sortBy;
            displayFavorites();
        }
    }
}

function handleGridToggle() {
    elements.backgroundGrid.classList.toggle('hidden', !elements.toggleGridCheckbox.checked);
}

function centerArea() {
    const tabletW = getNumericValue(elements.tabletWidthInput);
    const tabletH = getNumericValue(elements.tabletHeightInput);
    if (tabletW > 0 && tabletH > 0) {
        setCenterOffset(tabletW / 2, tabletH / 2);
    }
}

function setCenterOffset(newX, newY) {
    cancelEditMode();
    if (newX !== null && !isNaN(newX)) elements.areaOffsetXInput.value = newX.toFixed(3);
    if (newY !== null && !isNaN(newY)) elements.areaOffsetYInput.value = newY.toFixed(3);
    updateDisplay();
    elements.contextMenu.style.display = 'none';
}

// --- Alignment Handlers ---
function alignLeft() { const w = getNumericValue(elements.areaWidthInput); if(w >= 0) setCenterOffset(w / 2, null); }
function alignRight() { const tw = getNumericValue(elements.tabletWidthInput); const aw = getNumericValue(elements.areaWidthInput); if(tw > 0 && aw >= 0) setCenterOffset(tw - aw / 2, null); }
function alignCenterH() { const tw = getNumericValue(elements.tabletWidthInput); if(tw > 0) setCenterOffset(tw / 2, null); }
function alignTop() { const h = getNumericValue(elements.areaHeightInput); if(h >= 0) setCenterOffset(null, h / 2); }
function alignBottom() { const th = getNumericValue(elements.tabletHeightInput); const ah = getNumericValue(elements.areaHeightInput); if(th > 0 && ah >= 0) setCenterOffset(null, th - ah / 2); }
function alignCenterV() { const th = getNumericValue(elements.tabletHeightInput); if(th > 0) setCenterOffset(null, th / 2); }


// --- Favorites Management ---

function getCurrentFormData() {
    return {
        width: getNumericValue(elements.areaWidthInput),
        height: getNumericValue(elements.areaHeightInput),
        x: getPreciseNumericValue(elements.areaOffsetXInput),
        y: getPreciseNumericValue(elements.areaOffsetYInput),
        tabletW: getNumericValue(elements.tabletWidthInput),
        tabletH: getNumericValue(elements.tabletHeightInput),
        ratioStr: elements.customRatioInput.value,
        selectedValue: elements.tabletPresetSelect.value
    };
}

function getPresetInfo(tabletW, tabletH, selectedValue) {
    let presetInfo = "Personnalisé";
    const currentWStr = tabletW.toFixed(1);
    const currentHStr = tabletH.toFixed(1);

    const matchedPresetData = tabletData.find(t =>
        t.width.toFixed(1) === currentWStr && t.height.toFixed(1) === currentHStr
    );

    if (matchedPresetData && selectedValue && selectedValue !== 'custom') {
        const selectedOption = elements.tabletPresetSelect.querySelector(`option[value="${selectedValue}"]`);
        if (selectedOption && selectedOption.dataset.width === matchedPresetData.width.toString() && selectedOption.dataset.height === matchedPresetData.height.toString()) {
            presetInfo = `${matchedPresetData.brand} - ${selectedOption.textContent}`;
        } else {
             presetInfo = `${matchedPresetData.brand} - ${matchedPresetData.model}`; // Fallback
        }
    }
    return presetInfo;
}

function saveFavorite() {
    const currentData = getCurrentFormData();
    let comment = "";

    if (!editingFavoriteId) {
        comment = prompt("Ajouter un commentaire (optionnel, max 40 caractères):");
        if (comment === null) return;
        comment = comment.trim().substring(0, 40);
    }

    if (isNaN(currentData.width) || isNaN(currentData.height) || isNaN(currentData.x) || isNaN(currentData.y) || isNaN(currentData.tabletW) || isNaN(currentData.tabletH)) {
        showNotification("Erreur: Valeurs invalides.");
        return;
    }

    const presetInfo = getPresetInfo(currentData.tabletW, currentData.tabletH, currentData.selectedValue);
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    let notificationMessage = '';

    if (editingFavoriteId) {
        const index = favorites.findIndex(fav => fav.id.toString() === editingFavoriteId);
        if (index > -1) {
            favorites[index] = {
                ...favorites[index], // Keep ID and original comment
                width: currentData.width,
                height: currentData.height,
                ratio: currentData.ratioStr,
                x: currentData.x,
                y: currentData.y,
                tabletW: currentData.tabletW,
                tabletH: currentData.tabletH,
                presetInfo: presetInfo,
                selectedValue: currentData.selectedValue,
                // comment: favorites[index].comment // Keep existing comment
            };
            notificationMessage = 'Favori mis à jour !';
        } else {
            showNotification("Erreur: Favori à éditer non trouvé.");
            cancelEditMode(); return;
        }
    } else {
        const newFavorite = {
            id: Date.now(),
            width: currentData.width,
            height: currentData.height,
            ratio: currentData.ratioStr,
            x: currentData.x,
            y: currentData.y,
            comment: comment,
            tabletW: currentData.tabletW,
            tabletH: currentData.tabletH,
            presetInfo: presetInfo,
            selectedValue: currentData.selectedValue
        };
        favorites.push(newFavorite);
        notificationMessage = 'Favori sauvegardé !';
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    displayFavorites();
    showNotification(notificationMessage);
    cancelEditMode();
}

function loadFavoriteDataIntoForm(favData) {
    elements.tabletWidthInput.value = favData.tabletW?.toFixed(1) ?? '152.0';
    elements.tabletHeightInput.value = favData.tabletH?.toFixed(1) ?? '95.0';
    elements.areaWidthInput.value = favData.width?.toFixed(1) ?? '0';
    elements.areaHeightInput.value = favData.height?.toFixed(1) ?? '0';
    elements.areaOffsetXInput.value = favData.x?.toFixed(3) ?? '0.000';
    elements.areaOffsetYInput.value = favData.y?.toFixed(3) ?? '0.000';

    if (favData.ratio && favData.ratio !== 'N/A') {
        const savedRatio = parseFloat(favData.ratio);
        if (!isNaN(savedRatio) && savedRatio > 0) {
            elements.customRatioInput.value = savedRatio.toFixed(3);
            currentRatio = savedRatio;
        } else {
            currentRatio = favData.height > 0 ? favData.width / favData.height : 1.0;
            elements.customRatioInput.value = currentRatio.toFixed(3);
        }
    } else if (favData.height > 0) {
        currentRatio = favData.width / favData.height;
        elements.customRatioInput.value = currentRatio.toFixed(3);
    } else {
        currentRatio = 1.0;
        elements.customRatioInput.value = currentRatio.toFixed(3);
    }
    elements.lockRatio.checked = (!isNaN(currentRatio) && currentRatio > 0);

    // Update Preset Select based on savedValue
    if (favData.selectedValue && favData.selectedValue !== 'custom' && elements.tabletPresetSelect.querySelector(`option[value="${favData.selectedValue}"]`)) {
        elements.tabletPresetSelect.value = favData.selectedValue;
        toggleManualTabletInputs(false);
    } else if (favData.selectedValue === 'custom') {
         elements.tabletPresetSelect.value = 'custom';
         toggleManualTabletInputs(true);
    } else {
         // Fallback for old favorites or invalid values
         elements.tabletPresetSelect.value = 'custom';
         toggleManualTabletInputs(true);
         console.warn(`Preset sauvegardé ('${favData.selectedValue || 'non défini'}') non trouvé ou invalide. Passage en mode Custom.`);
    }
}

function startEditFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const favoriteToEdit = favorites.find(fav => fav.id.toString() === id);
    if (!favoriteToEdit) {
        showNotification("Erreur: Favori non trouvé pour édition.");
        return;
    }
    loadFavoriteDataIntoForm(favoriteToEdit);

    editingFavoriteId = id;
    elements.saveBtn.textContent = "Mettre à Jour";
    elements.saveBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
    elements.saveBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
    elements.cancelEditBtn.classList.remove('hidden');

    updateDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const favoriteToLoad = favorites.find(fav => fav.id.toString() === id);
    if (!favoriteToLoad) {
        showNotification("Erreur: Favori non trouvé.");
        return;
    }
    loadFavoriteDataIntoForm(favoriteToLoad);
    cancelEditMode();
    updateDisplay();
    showNotification(`Favori "${favoriteToLoad.comment || 'Sans nom'}" chargé !`);
}

function deleteFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const initialLength = favorites.length;
    favorites = favorites.filter(fav => fav.id.toString() !== id);

    if (favorites.length < initialLength) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        displayFavorites();
        showNotification('Favori supprimé.');
        if (editingFavoriteId === id) {
            cancelEditMode();
        }
    } else {
        showNotification('Erreur: Favori non trouvé.');
    }
}

function createFavoriteListItemHTML(fav) {
    const commentHtml = fav.comment ? `<span class="font-semibold text-white">${fav.comment}</span> - ` : '';
    const dimensionsHtml = `${fav.width.toFixed(1)}x${fav.height.toFixed(1)}mm`;
    const ratioValue = fav.ratio ? parseFloat(fav.ratio) : NaN;
    const ratioHtml = (!isNaN(ratioValue) && ratioValue > 0) ? ` (${ratioValue.toFixed(3)})` : '';
    const positionHtml = (fav.x !== undefined && fav.y !== undefined) ? ` @(${fav.x.toFixed(3)}, ${fav.y.toFixed(3)})` : '';
    const presetTextClass = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? 'text-cyan-400' : 'text-gray-400';
    const presetTextTitle = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? 'Basé sur le preset tablette' : 'Dimensions tablette personnalisées';
    const presetTextDisplay = (fav.presetInfo && fav.presetInfo !== "Personnalisé") ? `[${fav.presetInfo}]` : '[Perso.]';
    const presetHtml = `<span class="text-xs ${presetTextClass}" title="${presetTextTitle}">${presetTextDisplay}</span>`;
    const tabletDimsHtml = (fav.tabletW && fav.tabletH) ? ` <span class="text-xs text-gray-500">(Tab: ${fav.tabletW.toFixed(1)}x${fav.tabletH.toFixed(1)})</span>` : '';

    return `
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
}

function displayFavorites() {
    elements.favoritesList.innerHTML = '';
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    elements.favoritesPlaceholder.classList.toggle('hidden', favorites.length > 0);
    if (favorites.length === 0) return;

    favorites.sort((a, b) => {
        switch (currentSortCriteria) {
            case 'name':
                const commentA = (a.comment || '').toLowerCase();
                const commentB = (b.comment || '').toLowerCase();
                if (commentA && !commentB) return -1;
                if (!commentA && commentB) return 1;
                return commentA.localeCompare(commentB);
            case 'size':
                return ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0));
            case 'date': default: return (b.id || 0) - (a.id || 0);
        }
    });

    favorites.forEach(fav => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'favorite-item bg-gray-700/50 p-3 rounded-lg flex justify-between items-center gap-2 text-sm hover:bg-gray-700 transition duration-150 ease-in-out';
        itemDiv.innerHTML = createFavoriteListItemHTML(fav);
        elements.favoritesList.appendChild(itemDiv);
    });

    updateSortButtonsUI();
}

function cancelEditMode() {
    editingFavoriteId = null;
    elements.saveBtn.textContent = "Sauvegarder Area";
    elements.saveBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'focus:ring-yellow-500');
    elements.saveBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
    elements.cancelEditBtn.classList.add('hidden');
}

function updateSortButtonsUI() {
    elements.sortOptionsDiv.querySelectorAll('.sort-button').forEach(button => {
        const isActive = button.dataset.sort === currentSortCriteria;
        button.classList.toggle('bg-blue-700', isActive);
        button.classList.toggle('ring-2', isActive);
        button.classList.toggle('ring-blue-400', isActive);
        button.classList.toggle('bg-blue-600', !isActive);
        button.classList.toggle('hover:bg-blue-700', !isActive);
    });
}

// --- Initialization ---
async function loadTabletPresets() {
    try {
        const response = await fetch('tablets.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        tabletData = await response.json();

        tabletData.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

        const groupedByBrand = tabletData.reduce((acc, t) => {
            (acc[t.brand] = acc[t.brand] || []).push(t);
            return acc;
        }, {});

        // Clear existing options except placeholders
        const options = elements.tabletPresetSelect.querySelectorAll('optgroup, option:not([disabled]):not([value="custom"])');
        options.forEach(o => o.remove());


        for (const brand in groupedByBrand) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = brand;
            groupedByBrand[brand].forEach(t => {
                const option = document.createElement('option');
                option.value = `${brand.replace(/\s+/g, '-')}-${t.model.replace(/[^a-zA-Z0-9]/g, '-')}`;
                option.textContent = t.model;
                option.dataset.width = t.width;
                option.dataset.height = t.height;
                option.dataset.brand = brand;
                optgroup.appendChild(option);
            });
            elements.tabletPresetSelect.appendChild(optgroup);
        }
         // Reset initial selected option text
        elements.tabletPresetSelect.options[0].textContent = "-- Choisir un modèle --";
        elements.tabletPresetSelect.disabled = false;

    } catch (error) {
        console.error("Could not load tablet presets:", error);
        elements.tabletPresetSelect.options[0].textContent = "Erreur chargement";
        elements.tabletPresetSelect.disabled = true;
    }
}

function initializeApp() {
    // Set initial ratio state based on inputs
    handleLockRatioChange();

    // Set initial grid visibility
    handleGridToggle();

    // Attach Event Listeners
    elements.tabletWidthInput.addEventListener('input', handleInputChange);
    elements.tabletHeightInput.addEventListener('input', handleInputChange);
    elements.areaWidthInput.addEventListener('input', () => handleAreaDimensionChange(elements.areaWidthInput, elements.areaHeightInput, true));
    elements.areaHeightInput.addEventListener('input', () => handleAreaDimensionChange(elements.areaHeightInput, elements.areaWidthInput, false));
    elements.customRatioInput.addEventListener('input', handleCustomRatioChange);
    elements.areaOffsetXInput.addEventListener('input', handleInputChange);
    elements.areaOffsetYInput.addEventListener('input', handleInputChange);
    elements.lockRatio.addEventListener('change', handleLockRatioChange);
    elements.tabletPresetSelect.addEventListener('change', handlePresetChange);
    elements.swapBtn.addEventListener('click', handleSwap);
    elements.centerBtn.addEventListener('click', centerArea);
    elements.copyBtn.addEventListener('click', handleCopy);
    elements.saveBtn.addEventListener('click', saveFavorite);
    elements.cancelEditBtn.addEventListener('click', cancelEditMode);
    elements.rectangle.addEventListener('mousedown', handleDragStart);
    elements.rectangle.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', hideContextMenu);
    elements.toggleGridCheckbox.addEventListener('change', handleGridToggle);
    elements.sortOptionsDiv.addEventListener('click', handleSortClick);

    // Alignment buttons
    elements.alignLeftBtn.addEventListener('click', alignLeft);
    elements.alignCenterHBtn.addEventListener('click', alignCenterH);
    elements.alignRightBtn.addEventListener('click', alignRight);
    elements.alignTopBtn.addEventListener('click', alignTop);
    elements.alignCenterVBtn.addEventListener('click', alignCenterV);
    elements.alignBottomBtn.addEventListener('click', alignBottom);
    elements.alignCenterBtn.addEventListener('click', centerArea); // Center All

    // Load presets, display initial state
    loadTabletPresets().then(() => {
        toggleManualTabletInputs(elements.tabletPresetSelect.value === 'custom');
        updateDisplay();
        displayFavorites();
    });

    // Add resize listener
    window.addEventListener('resize', updateDisplay);
}

// Make functions globally accessible for inline HTML onclick attributes (Favorites buttons)
window.startEditFavorite = startEditFavorite;
window.loadFavorite = loadFavorite;
window.deleteFavorite = deleteFavorite;