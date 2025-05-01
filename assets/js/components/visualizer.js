/**
 * Tablet area visualizer component
 */

// DOM Elements
const visualContainer = document.getElementById('visual-container');
const tabletBoundary = document.getElementById('tablet-boundary');
const rectangle = document.getElementById('rectangle');
const backgroundGrid = document.getElementById('backgroundGrid');
const toggleGridCheckbox = document.getElementById('toggleGridCheckbox');

// Mise en cache des éléments DOM fréquemment utilisés
const cachedElements = {
    tabletDimensionsInfo: document.getElementById('tablet-dimensions-info'),
    tabletRatioInfo: document.getElementById('tablet-ratio-info'),
    dimensionsInfo: document.getElementById('dimensions-info'),
    areaInfo: document.getElementById('area-info'),
    ratioInfo: document.getElementById('ratio-info'),
    positionInfo: document.getElementById('position-info'),
    customRatioInput: document.getElementById('customRatio'),
    lockRatioCheckbox: document.getElementById('lockRatio'),
    tabletWidthInput: document.getElementById('tabletWidth'),
    tabletHeightInput: document.getElementById('tabletHeight'),
    areaWidthInput: document.getElementById('areaWidth'),
    areaHeightInput: document.getElementById('areaHeight'),
    areaOffsetXInput: document.getElementById('areaOffsetX'),
    areaOffsetYInput: document.getElementById('areaOffsetY')
};

// Scaling and display variables
let currentScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;

// Variables pour éviter les recalculs fréquents
let containerSize = { width: 0, height: 0 };
let tabletSize = { width: 0, height: 0 };
let containerPadding = 40;

// Fonction de mise à jour limitée en fréquence
const throttledUpdateDisplay = throttle(updateDisplay, 16); // ~60fps

// Mettre à jour la taille du conteneur lorsqu'il change
function updateContainerSize() {
    containerSize.width = visualContainer.clientWidth - containerPadding;
    containerSize.height = visualContainer.clientHeight - containerPadding;
}

/**
 * Updates the visual display of the tablet and area
 */
function updateDisplay() {
    // Utiliser les éléments en cache et parseFloatSafe qui est optimisé
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    const areaOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    const areaOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
    
    if (!isValidNumber(tabletWidth, 10) || !isValidNumber(tabletHeight, 10)) {
        console.warn('Invalid tablet dimensions');
        return;
    }
    
    // Déterminer si c'est le premier rendu
    const isFirstRender = tabletSize.width === 0 && tabletSize.height === 0;
    
    // Mettre à jour les dimensions de la tablette si elles ont changé
    if (tabletSize.width !== tabletWidth || tabletSize.height !== tabletHeight) {
        tabletSize.width = tabletWidth;
        tabletSize.height = tabletHeight;
    }
    
    // Mettre à jour la taille du conteneur si nécessaire
    if (containerSize.width === 0) {
        updateContainerSize();
    }
    
    const tabletRatio = tabletWidth / tabletHeight;
    
    let displayWidth, displayHeight;
    
    if (containerSize.width / tabletRatio <= containerSize.height) {
        // Width constrained
        displayWidth = containerSize.width;
        displayHeight = displayWidth / tabletRatio;
    } else {
        // Height constrained
        displayHeight = containerSize.height;
        displayWidth = displayHeight * tabletRatio;
    }
    
    // Update scale for converting mm to px
    currentScale = displayWidth / tabletWidth;
    
    // Update tablet boundary display with transform pour meilleures performances
    tabletBoundary.style.width = `${displayWidth}px`;
    tabletBoundary.style.height = `${displayHeight}px`;
    
    // Get area rectangle dimensions and position in pixels
    const rectWidth = mmToPx(areaWidth, currentScale);
    const rectHeight = mmToPx(areaHeight, currentScale);
    
    // Get center position and convert to top-left for CSS
    const rectCenterX = mmToPx(areaOffsetX, currentScale);
    const rectCenterY = mmToPx(areaOffsetY, currentScale);
    
    const rectLeft = rectCenterX - rectWidth / 2;
    const rectTop = rectCenterY - rectHeight / 2;
    
    // Update rectangle display immédiatement sans transition au chargement initial
    rectangle.style.width = `${rectWidth}px`;
    rectangle.style.height = `${rectHeight}px`;
    rectangle.style.transform = `translate(${rectLeft}px, ${rectTop}px)`;
    
    // Update info displays
    updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY);
    
    // Update grid visibility sans recalcul si l'état n'a pas changé
    const showGrid = toggleGridCheckbox.checked;
    if (backgroundGrid.classList.contains('hidden') === showGrid) {
        backgroundGrid.classList.toggle('hidden', !showGrid);
    }
    
    // Si c'est le premier rendu, attendre un tick pour s'assurer que toutes les mises à jour ont été appliquées
    // puis révéler le rectangle et masquer l'overlay de chargement
    if (isFirstRender) {
        requestAnimationFrame(() => {
            // Retirer l'overlay de chargement
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 300);
            }
            
            // Rendre le rectangle visible
            if (rectangle.classList.contains('invisible')) {
                rectangle.classList.remove('invisible');
            }
        });
    }
}

/**
 * Update information displays with current dimensions
 */
function updateInfoDisplays(tabletWidth, tabletHeight, areaWidth, areaHeight, areaOffsetX, areaOffsetY) {
    // Récupérer les éléments depuis le cache
    const { 
        tabletDimensionsInfo, tabletRatioInfo, 
        dimensionsInfo, areaInfo, ratioInfo, positionInfo,
        customRatioInput, lockRatioCheckbox
    } = cachedElements;
    
    // Tablet info
    const tabletRatio = calculateRatio(tabletWidth, tabletHeight);
    
    // Éviter les réécritures DOM inutiles en vérifiant les changements
    const newTabletDimensions = `${formatNumber(tabletWidth)} × ${formatNumber(tabletHeight)} mm`;
    if (tabletDimensionsInfo.textContent !== newTabletDimensions) {
        tabletDimensionsInfo.textContent = newTabletDimensions;
    }
    
    if (tabletRatioInfo.textContent !== tabletRatio) {
        tabletRatioInfo.textContent = tabletRatio;
    }
    
    // Area info
    const areaRatio = calculateRatio(areaWidth, areaHeight);
    const areaSurface = formatNumber(areaWidth * areaHeight);
    
    // Mettre à jour le ratio dans le champ de saisie si le verrou est activé
    if (lockRatioCheckbox.checked && areaHeight > 0) {
        // Ne pas mettre à jour le customRatioInput si l'utilisateur est en train de l'éditer
        if (!customRatioInput.matches(':focus') && !customRatioInput.dataset.editing) {
            const newRatio = formatNumber(areaWidth / areaHeight, 3);
            if (customRatioInput.value !== newRatio) {
                customRatioInput.value = newRatio;
                
                // Mettre à jour la variable currentRatio dans appState si elle existe
                if (typeof appState !== 'undefined') {
                    appState.currentRatio = areaWidth / areaHeight;
                }
            }
        }
    } else if (typeof appState !== 'undefined' && typeof appState.debouncedUpdateRatio === 'function') {
        // Pour le mode déverrouillé, utiliser la fonction debounced
        appState.debouncedUpdateRatio();
    }
    
    // Éviter les réécritures DOM inutiles
    const newDimensions = `${formatNumber(areaWidth)} × ${formatNumber(areaHeight)} mm`;
    if (dimensionsInfo.textContent !== newDimensions) {
        dimensionsInfo.textContent = newDimensions;
    }
    
    if (areaInfo.textContent !== `${areaSurface} mm²`) {
        areaInfo.textContent = `${areaSurface} mm²`;
    }
    
    if (ratioInfo.textContent !== areaRatio) {
        ratioInfo.textContent = areaRatio;
    }
    
    const newPosition = `X: ${formatNumber(areaOffsetX, 3)}, Y: ${formatNumber(areaOffsetY, 3)}`;
    if (positionInfo.textContent !== newPosition) {
        positionInfo.textContent = newPosition;
    }
}

/**
 * Setup drag functionality for the area rectangle
 */
function setupDragFunctionality() {
    // Vérifier si l'initialisation est toujours en cours
    if (document.body.getAttribute('data-loading') === 'true') {
        console.log('Attente de la fin du chargement avant d\'activer les fonctionnalités de drag');
        return;
    }
    
    // Nettoyer les anciens écouteurs s'ils existent (pour éviter les doublons lors des réinitialisations)
    rectangle.removeEventListener('mousedown', handleDragStart);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    rectangle.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // Ajouter les nouveaux écouteurs
    rectangle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Touch support
    rectangle.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
}

/**
 * Handle start of mouse drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragStart(e) {
    e.preventDefault();
    
    // Check if we're in edit mode
    if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
        appState.cancelEditMode();
    }
    
    isDragging = true;
    rectangle.style.cursor = 'grabbing';
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    dragStartOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
    dragStartOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
}

/**
 * Handle start of touch drag (continued)
 * @param {TouchEvent} e - Touch event
 */
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        
        // Check if we're in edit mode
        if (typeof appState !== 'undefined' && appState.editingFavoriteId) {
            appState.cancelEditMode();
        }
        
        isDragging = true;
        const touch = e.touches[0];
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        dragStartOffsetX = parseFloatSafe(cachedElements.areaOffsetXInput.value);
        dragStartOffsetY = parseFloatSafe(cachedElements.areaOffsetYInput.value);
    }
}

/**
 * Handle mouse movement during drag
 * @param {MouseEvent} e - Mouse event
 */
function handleDragMove(e) {
    if (!isDragging) return;
    
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    
    // Calculate movement in millimeters
    const deltaXPx = e.clientX - dragStartX;
    const deltaYPx = e.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain to tablet boundaries
    const minX = areaWidth / 2;
    const maxX = tabletWidth - areaWidth / 2;
    const minY = areaHeight / 2;
    const maxY = tabletHeight - areaHeight / 2;
    
    newOffsetX = clamp(newOffsetX, minX, maxX);
    newOffsetY = clamp(newOffsetY, minY, maxY);
    
    // Update inputs
    cachedElements.areaOffsetXInput.value = formatNumber(newOffsetX, 3);
    cachedElements.areaOffsetYInput.value = formatNumber(newOffsetY, 3);
    
    // Update display avec throttle pour limiter les appels
    throttledUpdateDisplay();
}

/**
 * Handle touch movement during drag
 * @param {TouchEvent} e - Touch event
 */
function handleTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    const areaWidth = parseFloatSafe(cachedElements.areaWidthInput.value);
    const areaHeight = parseFloatSafe(cachedElements.areaHeightInput.value);
    
    // Calculate movement in millimeters
    const deltaXPx = touch.clientX - dragStartX;
    const deltaYPx = touch.clientY - dragStartY;
    
    const deltaXMm = pxToMm(deltaXPx, currentScale);
    const deltaYMm = pxToMm(deltaYPx, currentScale);
    
    // Calculate new offset values
    let newOffsetX = dragStartOffsetX + deltaXMm;
    let newOffsetY = dragStartOffsetY + deltaYMm;
    
    // Constrain to tablet boundaries
    const minX = areaWidth / 2;
    const maxX = tabletWidth - areaWidth / 2;
    const minY = areaHeight / 2;
    const maxY = tabletHeight - areaHeight / 2;
    
    newOffsetX = clamp(newOffsetX, minX, maxX);
    newOffsetY = clamp(newOffsetY, minY, maxY);
    
    // Update inputs
    cachedElements.areaOffsetXInput.value = formatNumber(newOffsetX, 3);
    cachedElements.areaOffsetYInput.value = formatNumber(newOffsetY, 3);
    
    // Update display avec throttle pour limiter les appels
    throttledUpdateDisplay();
}

/**
 * Handle the end of drag operation
 */
function handleDragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    rectangle.style.cursor = 'grab';
    
    // S'assurer que le body a la classe page-loaded pour activer les transitions
    // après le premier interaction utilisateur
    if (!document.body.classList.contains('page-loaded')) {
        document.body.classList.add('page-loaded');
    }
    
    // Force a final update without throttle
    updateDisplay();
}

/**
 * Center the active area in the tablet
 */
function centerArea() {
    const tabletWidth = parseFloatSafe(cachedElements.tabletWidthInput.value);
    const tabletHeight = parseFloatSafe(cachedElements.tabletHeightInput.value);
    
    // Avoid redundant calculations
    if (tabletWidth <= 0 || tabletHeight <= 0) return;
    
    cachedElements.areaOffsetXInput.value = formatNumber(tabletWidth / 2, 3);
    cachedElements.areaOffsetYInput.value = formatNumber(tabletHeight / 2, 3);
    
    updateDisplay();
}

/**
 * Setup a resize observer to update the display when container size changes
 */
function setupResizeObserver() {
    const resizeObserver = new ResizeObserver(throttle(() => {
        updateContainerSize();
        updateDisplay();
    }, 100));
    
    resizeObserver.observe(visualContainer);
}

/**
 * Initialize the visualizer
 */
function initVisualizer() {
    if (!visualContainer || !tabletBoundary || !rectangle) {
        console.error('Visualizer elements not found');
        return;
    }
    
    // Ajouter un attribut data-loading au body pour indiquer que le visualiseur est en cours de chargement
    document.body.setAttribute('data-loading', 'true');
    
    // Désactiver temporairement les interactions pendant le chargement initial
    rectangle.style.pointerEvents = 'none';
    
    // Configurer le rectangle à sa position initiale correcte avant d'activer les transitions
    updateContainerSize();
    updateDisplay();
    
    // Ajouter la classe page-loaded au body pour activer les transitions CSS après le chargement initial
    // Un délai garantit que la position initiale est établie avant d'activer les transitions
    setTimeout(() => {
        // Activer les transitions CSS
        document.body.classList.add('page-loaded');
        
        // Réactiver les interactions avec le rectangle
        rectangle.style.pointerEvents = 'auto';
        
        // Indiquer que le chargement est terminé
        document.body.removeAttribute('data-loading');
        document.documentElement.classList.remove('loading');
        document.body.classList.remove('loading');
        
        // Masquer définitivement l'overlay de chargement
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
        
        // Configurer les écouteurs d'événements seulement après que tout est prêt
        setupDragFunctionality();
        setupResizeObserver();
        
        // Bouton centrer
        const centerBtn = document.getElementById('center-btn');
        if (centerBtn) {
            centerBtn.addEventListener('click', centerArea);
        }
        
        // Toggle grid
        if (toggleGridCheckbox) {
            toggleGridCheckbox.addEventListener('change', throttle(() => {
                backgroundGrid.classList.toggle('hidden', !toggleGridCheckbox.checked);
            }, 50));
        }
    }, 300);
}

// Call init when window loads
window.addEventListener('load', initVisualizer);
