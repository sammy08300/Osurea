// Fonction pour gérer le verrouillage du ratio
export function toggleLockRatio(button) {
    const isActive = button.getAttribute('aria-pressed') === 'true';
    const newState = !isActive;
    button.setAttribute('aria-pressed', newState.toString());
    const indicator = document.getElementById('lockRatioIndicator').firstElementChild;
    if (newState) {
        indicator.style.transform = 'scale(1)';
    } else {
        indicator.style.transform = 'scale(0)';
    }
    if (typeof window.updateRatioFieldState === 'function') {
        window.updateRatioFieldState();
    }
    if (typeof appState !== 'undefined') {
        if (newState) {
            const width = parseFloatSafe(document.getElementById('areaWidth')?.value);
            const height = parseFloatSafe(document.getElementById('areaHeight')?.value);
            if (height > 0) {
                appState.currentRatio = width / height;
                document.getElementById('customRatio').value = formatNumber(appState.currentRatio, 3);
            }
        }
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
} 
