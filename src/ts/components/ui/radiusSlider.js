/**
 * Solution ultra-simple pour le slider de rayon
 */

export function initializeRadiusSlider() {
    // Trouver les éléments existants
    const originalSlider = document.getElementById('areaRadius');
    const numericInput = document.getElementById('radius-input');
    
    if (!originalSlider || !numericInput) {
        console.error("Éléments de base pour le slider de rayon non trouvés");
        return;
    }
    
    // Récupérer le conteneur
    const container = originalSlider.closest('.slider-container');
    if (!container) {
        console.error("Conteneur du slider de rayon non trouvé");
        return;
    }
    
    // Récupérer la valeur actuelle de l'input range original AVANT de vider le conteneur
    const initialValue = parseInt(originalSlider.value) || 0;
    
    // IMPORTANT: Vider complètement le conteneur pour éviter tout conflit
    container.innerHTML = '';
    
    // Créer une interface totalement nouvelle avec styles inline
    // Utiliser initialValue pour le nouvel input range
    const html = `
        <div id="custom-slider-${Date.now()}" style="position:relative; width:100%; height:30px; padding:0; margin:0;">
            <div id="track" style="position:absolute; left:0; right:0; top:50%; height:4px; background:#4b5563; border-radius:4px; transform:translateY(-50%);"></div>
            <div id="progress" style="position:absolute; left:0; top:50%; height:4px; width:0%; background:#ec4899; border-radius:4px 0 0 4px; transform:translateY(-50%);"></div>
            <div id="thumb" style="position:absolute; top:50%; left:0%; width:20px; height:20px; background:white; border:2px solid #ec4899; border-radius:50%; transform:translate(-50%, -50%); cursor:pointer; box-shadow:0 0 5px rgba(0,0,0,0.3); z-index:10;"></div>
            <input type="range" id="areaRadius" name="areaRadius" min="0" max="100" value="${initialValue}" step="1" style="position:absolute; opacity:0; width:100%; height:100%; top:0; left:0; margin:0; padding:0;">
        </div>
    `;
    
    // Insérer notre nouvelle interface
    container.innerHTML = html;
    
    // Récupérer les nouveaux éléments (important de les récupérer APRES l'injection HTML)
    const slider = container.querySelector('#areaRadius'); // C'est notre input range caché
    const progress = container.querySelector('#progress');
    const thumb = container.querySelector('#thumb');
    const customSliderVisualTrack = container.querySelector('div[id^="custom-slider"]'); // Le conteneur visuel du track custom
    
    if (!slider || !progress || !thumb || !customSliderVisualTrack) {
        console.error("Impossible de trouver tous les éléments du slider personnalisé après initialisation");
        return;
    }
    
    const THUMB_ANIMATION_TRANSITION = 'left 0.2s ease-out, transform 0.1s ease-out';
    const THUMB_DRAG_TRANSITION = 'transform 0.1s ease-out';
    const PROGRESS_ANIMATION_TRANSITION = 'width 0.2s ease-out';
    const NO_TRANSITION = 'none';

    // Fonction simple pour mettre à jour l'UI
    function updateUI(value) {
        // Normaliser la valeur
        value = Math.max(0, Math.min(100, parseInt(value) || 0));
        
        // Mettre à jour les champs
        slider.value = value;       // Met à jour l'input range caché (utilisé par visualizer.js)
        numericInput.value = value; // Met à jour l'input numérique visible
        
        // Supprimer la mise à jour de window.currentRadius
        // window.currentRadius = value;
        
        // Mettre à jour l'interface avec des styles inline
        const percent = value + '%';
        progress.style.width = percent;
        thumb.style.left = percent;
        
        // Déclencher l'événement input sur l'input range caché pour que d'autres scripts (comme visualizer.js) puissent réagir
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
    }
    
    // Fonction pour calculer la valeur en fonction de la position
    function calculateValue(clientX) {
        const rect = customSliderVisualTrack.getBoundingClientRect();
        const position = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (position / rect.width) * 100));
        return Math.round(percentage);
    }
    
    // Gestion du clic direct sur le slider
    customSliderVisualTrack.addEventListener('click', function(e) {
        // Ne pas traiter si le clic est sur le pouce
        if (e.target === thumb) return;
        
        // Enable transitions for click
        thumb.style.transition = THUMB_ANIMATION_TRANSITION;
        progress.style.transition = PROGRESS_ANIMATION_TRANSITION;

        // Mettre à jour la valeur
        updateUI(calculateValue(e.clientX));
    });
    
    // Gestion du glissement
    let dragging = false;
    
    thumb.addEventListener('mousedown', startDrag);
    thumb.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        e.preventDefault();
        dragging = true;
        
        // Disable position/width transitions for drag, keep transform transition for thumb scale
        thumb.style.transition = THUMB_DRAG_TRANSITION;
        progress.style.transition = NO_TRANSITION;

        // Effet visuel
        thumb.style.transform = 'translate(-50%, -50%) scale(1.1)';
        
        // Capturer et mettre à jour immédiatement
        if (e.type === 'touchstart') {
            updateUI(calculateValue(e.touches[0].clientX));
        } else {
            updateUI(calculateValue(e.clientX));
        }
        
        // Ajouter les écouteurs temporaires
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false }); // passive: false pour e.preventDefault()
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
        if (!dragging) return;
        // e.preventDefault(); // Déplacé dans startDrag et touchmove pour plus de contrôle
        if (e.cancelable) e.preventDefault();

        // Mettre à jour la valeur en fonction de la position
        if (e.type === 'touchmove') {
            updateUI(calculateValue(e.touches[0].clientX));
        } else {
            updateUI(calculateValue(e.clientX));
        }
    }
    
    function endDrag() {
        if (!dragging) return; // Eviter exécutions multiples
        dragging = false;
        
        // Enable transitions for future discrete changes
        thumb.style.transition = THUMB_ANIMATION_TRANSITION;
        progress.style.transition = PROGRESS_ANIMATION_TRANSITION;

        // Remettre le style normal
        thumb.style.transform = 'translate(-50%, -50%)';
        
        // Retirer les écouteurs temporaires
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
    }
    
    // Écouter les changements sur l'input numérique
    numericInput.addEventListener('input', function() {
        // Enable transitions for input change
        thumb.style.transition = THUMB_ANIMATION_TRANSITION;
        progress.style.transition = PROGRESS_ANIMATION_TRANSITION;
        updateUI(this.value);
    });
    
    // Exposer la fonction de mise à jour globale (si toujours nécessaire pour d'autres modules)
    // Si ce n'est plus utilisé globalement, envisager de le supprimer.
    window.updateSliderProgress = updateUI;
    
    // Supprimer window.getRadiusValue car visualizer.js lit directement la valeur de l'input #areaRadius
    // window.getRadiusValue = function() {
    // return parseInt(slider.value) || 0;
    // };
    
    // Initialiser avec la valeur récupérée de l'input range original
    updateUI(initialValue); // Set initial state without animation

    // Enable transitions for subsequent interactions after initial state is set
    thumb.style.transition = THUMB_ANIMATION_TRANSITION;
    progress.style.transition = PROGRESS_ANIMATION_TRANSITION;
    
    console.log('Radius slider initialized successfully avec la valeur: ' + initialValue);

    // Déclencher un événement pour signaler que le slider est prêt et sa valeur initiale a été définie
    const readyEvent = new CustomEvent('radiusSliderReady', { detail: { initialValue: initialValue } });
    document.dispatchEvent(readyEvent);
}

// Initialiser dès que le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRadiusSlider);
} else {
    initializeRadiusSlider();
} 