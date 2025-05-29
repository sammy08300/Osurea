// Fonction pour gérer le verrouillage du ratio

// Define types for global functions and variables if they exist, or ensure they are imported/defined.
// These are placeholders and should be adjusted based on actual definitions.
declare function parseFloatSafe(value: string | undefined): number;
declare function formatNumber(value: number, precision: number): string;
declare function updateDisplay(): void; // Assuming global or from window

// Define type for appState if it exists globally
interface AppState {
    currentRatio?: number;
    // Add other appState properties if known
}
declare const appState: AppState | undefined;

// Define type for window.updateRatioFieldState if it exists globally
declare global {
    interface Window {
        updateRatioFieldState?: () => void;
    }
}


export function toggleLockRatio(button: HTMLButtonElement): void {
    const isActive = button.getAttribute('aria-pressed') === 'true';
    const newState = !isActive;
    button.setAttribute('aria-pressed', newState.toString());

    const lockRatioIndicator = document.getElementById('lockRatioIndicator');
    if (lockRatioIndicator) {
        const indicator = lockRatioIndicator.firstElementChild as HTMLElement | null;
        if (indicator) {
            indicator.style.transform = newState ? 'scale(1)' : 'scale(0)';
        }
    }

    if (typeof window.updateRatioFieldState === 'function') {
        window.updateRatioFieldState();
    }

    if (typeof appState !== 'undefined') {
        if (newState) {
            const widthInput = document.getElementById('areaWidth') as HTMLInputElement | null;
            const heightInput = document.getElementById('areaHeight') as HTMLInputElement | null;
            const customRatioInput = document.getElementById('customRatio') as HTMLInputElement | null;

            if (widthInput && heightInput && customRatioInput) {
                const width = parseFloatSafe(widthInput.value);
                const height = parseFloatSafe(heightInput.value);
                if (height > 0) {
                    appState.currentRatio = width / height;
                    customRatioInput.value = formatNumber(appState.currentRatio, 3);
                }
            }
        }
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
}
