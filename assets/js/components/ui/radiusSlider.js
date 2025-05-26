/**
 * Solution ultra-simple pour le slider de rayon
 */

export function initializeRadiusSlider() {
    // Trouver les éléments existants
    const originalSlider = document.getElementById('areaRadius');
    const numericInput = document.getElementById('radius-input');
    
    if (!originalSlider || !numericInput) {
        console.error("Éléments de base non trouvés");
        return;
    }
    
    // Récupérer le conteneur et le vider
    const container = originalSlider.closest('.slider-container');
    if (!container) {
        console.error("Conteneur non trouvé");
        return;
    }
    
    // Récupérer la valeur actuelle avant de vider le conteneur
    const currentValue = parseInt(originalSlider.value) || 0;
    
    // IMPORTANT: Vider complètement le conteneur pour éviter tout conflit
    container.innerHTML = '';
    
    // Créer une interface totalement nouvelle avec styles inline
    const html = `
        <div id="custom-slider-${Date.now()}" style="position:relative; width:100%; height:30px; padding:0; margin:0;">
            <div id="track" style="position:absolute; left:0; right:0; top:50%; height:4px; background:#4b5563; border-radius:4px; transform:translateY(-50%);"></div>
            <div id="progress" style="position:absolute; left:0; top:50%; height:4px; width:0%; background:#ec4899; border-radius:4px 0 0 4px; transform:translateY(-50%);"></div>
            <div id="thumb" style="position:absolute; top:50%; left:0%; width:20px; height:20px; background:white; border:2px solid #ec4899; border-radius:50%; transform:translate(-50%, -50%); cursor:pointer; box-shadow:0 0 5px rgba(0,0,0,0.3); z-index:10;"></div>
            <input type="range" id="areaRadius" min="0" max="100" value="${currentValue}" step="1" style="position:absolute; opacity:0; width:100%; height:100%; top:0; left:0; margin:0; padding:0;">
        </div>
    `;
    
    // Insérer notre nouvelle interface
    container.innerHTML = html;
    
    // Récupérer les nouveaux éléments
    const slider = container.querySelector('#areaRadius');
    const progress = container.querySelector('#progress');
    const thumb = container.querySelector('#thumb');
    const customSlider = container.querySelector('div[id^="custom-slider"]');
    
    if (!slider || !progress || !thumb || !customSlider) {
        console.error("Impossible de trouver tous les éléments du slider après initialisation");
        return;
    }
    
    // Fonction simple pour mettre à jour l'UI
    function updateUI(value) {
        // Normaliser la valeur
        value = Math.max(0, Math.min(100, parseInt(value) || 0));
        
        // Mettre à jour les champs
        slider.value = value;
        numericInput.value = value;
        
        // Mettre à jour la variable globale utilisée par le visualizer
        window.currentRadius = value;
        
        // Mettre à jour l'interface avec des styles inline
        const percent = value + '%';
        progress.style.width = percent;
        thumb.style.left = percent;
        
        // Déclencher l'événement input
        const event = new Event('input', { bubbles: true });
        slider.dispatchEvent(event);
        
        // Appeler updateDisplay si existe
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
    }
    
    // Fonction pour calculer la valeur en fonction de la position
    function calculateValue(clientX) {
        const rect = customSlider.getBoundingClientRect();
        const position = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (position / rect.width) * 100));
        return Math.round(percentage);
    }
    
    // Gestion du clic direct sur le slider
    customSlider.addEventListener('click', function(e) {
        // Ne pas traiter si le clic est sur le pouce
        if (e.target === thumb) return;
        
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
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
        if (!dragging) return;
        e.preventDefault();
        
        // Mettre à jour la valeur en fonction de la position
        if (e.type === 'touchmove') {
            updateUI(calculateValue(e.touches[0].clientX));
        } else {
            updateUI(calculateValue(e.clientX));
        }
    }
    
    function endDrag() {
        dragging = false;
        
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
        updateUI(this.value);
    });
    
    // Exposer la fonction de mise à jour globale
    window.updateSliderProgress = updateUI;
    
    // S'assurer que le visualiseur est informé des changements de rayon
    window.getRadiusValue = function() {
        return parseInt(slider.value) || 0;
    };
    
    // Initialiser avec la valeur actuelle
    updateUI(currentValue);
    
    console.log('Radius slider initialized successfully');
}

// Initialiser dès que le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRadiusSlider);
} else {
    initializeRadiusSlider();
} 