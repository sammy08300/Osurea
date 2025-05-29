/**
 * Solution ultra-simple pour le slider de rayon
 */

// Define a global function type if it's expected to be available
declare global {
    interface Window {
        updateSliderProgress?: (value: string | number) => void;
    }
}


export function initializeRadiusSlider(): void {
    const originalSlider = document.getElementById('areaRadius') as HTMLInputElement | null;
    const numericInput = document.getElementById('radius-input') as HTMLInputElement | null;
    
    if (!originalSlider || !numericInput) {
        console.error("Éléments de base pour le slider de rayon non trouvés");
        return;
    }
    
    const container = originalSlider.closest('.slider-container') as HTMLElement | null;
    if (!container) {
        console.error("Conteneur du slider de rayon non trouvé");
        return;
    }
    
    const initialValue = parseInt(originalSlider.value) || 0;
    container.innerHTML = ''; // Clear previous content
    
    const html = `
        <div id="custom-slider-${Date.now()}" style="position:relative; width:100%; height:30px; padding:0; margin:0;">
            <div id="track" style="position:absolute; left:0; right:0; top:50%; height:4px; background:#4b5563; border-radius:4px; transform:translateY(-50%);"></div>
            <div id="progress" style="position:absolute; left:0; top:50%; height:4px; width:0%; background:#ec4899; border-radius:4px 0 0 4px; transform:translateY(-50%);"></div>
            <div id="thumb" style="position:absolute; top:50%; left:0%; width:20px; height:20px; background:white; border:2px solid #ec4899; border-radius:50%; transform:translate(-50%, -50%); cursor:pointer; box-shadow:0 0 5px rgba(0,0,0,0.3); z-index:10;"></div>
            <input type="range" id="areaRadius" name="areaRadius" min="0" max="100" value="${initialValue}" step="1" style="position:absolute; opacity:0; width:100%; height:100%; top:0; left:0; margin:0; padding:0;">
        </div>
    `;
    container.innerHTML = html;
    
    const slider = container.querySelector<HTMLInputElement>('#areaRadius');
    const progress = container.querySelector<HTMLElement>('#progress');
    const thumb = container.querySelector<HTMLElement>('#thumb');
    const customSliderVisualTrack = container.querySelector<HTMLElement>('div[id^="custom-slider"]');
    
    if (!slider || !progress || !thumb || !customSliderVisualTrack) {
        console.error("Impossible de trouver tous les éléments du slider personnalisé après initialisation");
        return;
    }
    
    const THUMB_ANIMATION_TRANSITION = 'left 0.2s ease-out, transform 0.1s ease-out';
    const THUMB_DRAG_TRANSITION = 'transform 0.1s ease-out';
    const PROGRESS_ANIMATION_TRANSITION = 'width 0.2s ease-out';
    const NO_TRANSITION = 'none';

    function updateUI(value: string | number): void {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        const normalizedValue = Math.max(0, Math.min(100, numValue || 0));
        
        slider!.value = normalizedValue.toString();
        numericInput!.value = normalizedValue.toString();
        
        const percent = normalizedValue + '%';
        progress!.style.width = percent;
        thumb!.style.left = percent;
        
        const event = new Event('input', { bubbles: true });
        slider!.dispatchEvent(event);
    }
    
    function calculateValue(clientX: number): number {
        const rect = customSliderVisualTrack!.getBoundingClientRect();
        const position = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (position / rect.width) * 100));
        return Math.round(percentage);
    }
    
    customSliderVisualTrack.addEventListener('click', function(e: MouseEvent) {
        if (e.target === thumb) return;
        thumb!.style.transition = THUMB_ANIMATION_TRANSITION;
        progress!.style.transition = PROGRESS_ANIMATION_TRANSITION;
        updateUI(calculateValue(e.clientX));
    });
    
    let dragging = false;
    
    const startDrag = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        dragging = true;
        
        thumb!.style.transition = THUMB_DRAG_TRANSITION;
        progress!.style.transition = NO_TRANSITION;
        thumb!.style.transform = 'translate(-50%, -50%) scale(1.1)';
        
        const clientX = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        updateUI(calculateValue(clientX));
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    };

    thumb.addEventListener('mousedown', startDrag as EventListener);
    thumb.addEventListener('touchstart', startDrag as EventListener);
        
    const drag = (e: MouseEvent | TouchEvent) => {
        if (!dragging) return;
        if ((e as Event).cancelable) (e as Event).preventDefault();

        const clientX = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        updateUI(calculateValue(clientX));
    };
    
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        
        thumb!.style.transition = THUMB_ANIMATION_TRANSITION;
        progress!.style.transition = PROGRESS_ANIMATION_TRANSITION;
        thumb!.style.transform = 'translate(-50%, -50%)';
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
    };
    
    numericInput.addEventListener('input', function(this: HTMLInputElement) {
        thumb!.style.transition = THUMB_ANIMATION_TRANSITION;
        progress!.style.transition = PROGRESS_ANIMATION_TRANSITION;
        updateUI(this.value);
    });
    
    window.updateSliderProgress = updateUI;
    
    updateUI(initialValue);

    thumb.style.transition = THUMB_ANIMATION_TRANSITION;
    progress.style.transition = PROGRESS_ANIMATION_TRANSITION;
    
    console.log('Radius slider initialized successfully avec la valeur: ' + initialValue);

    const readyEvent = new CustomEvent('radiusSliderReady', { detail: { initialValue: initialValue } });
    document.dispatchEvent(readyEvent);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRadiusSlider);
} else {
    initializeRadiusSlider();
}