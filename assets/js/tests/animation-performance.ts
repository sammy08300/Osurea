/**
 * Animation Performance Test Tool
 * Utilitaire pour tester et optimiser les performances d'animation du rectangle
 * Exécutez ce script dans la console du navigateur pour analyser les performances
 */

interface AnimationTestControls {
    stop: () => void;
}

// Extend Window interface for global exposure
declare global {
    interface Window {
        testAnimationPerformance?: () => AnimationTestControls | void;
    }
}

export function testAnimationPerformance(): AnimationTestControls | void {
    console.log('🔍 Test de performance d\'animation démarré...');
    
    const rectangle = document.getElementById('rectangle') as HTMLElement | null;
    const tabletBoundary = document.getElementById('tablet-boundary') as HTMLElement | null;
    
    if (!rectangle || !tabletBoundary) {
        console.error('❌ Éléments requis non trouvés');
        return;
    }
    
    const currentStyles = {
        transform: rectangle.style.transform,
        transition: rectangle.style.transition,
        willChange: rectangle.style.willChange
    };
    
    let frameCount: number = 0;
    let lastTimestamp: number = performance.now();
    let frames: number[] = [];
    let animationId: number | null = null;
    
    function countFrames(timestamp: DOMHighResTimeStamp): void {
        frameCount++;
        
        if (timestamp - lastTimestamp >= 1000) {
            const fps = Math.round(frameCount * 1000 / (timestamp - lastTimestamp));
            frames.push(fps);
            console.log(`FPS: ${fps}`);
            frameCount = 0;
            lastTimestamp = timestamp;
        }
        
        animationId = requestAnimationFrame(countFrames);
    }
    
    function simulateMovement(): void {
        const boundaryRect = tabletBoundary!.getBoundingClientRect(); // Non-null assertion due to check above
        const rectWidth = parseFloat(rectangle!.style.width) || rectangle!.offsetWidth;
        const rectHeight = parseFloat(rectangle!.style.height) || rectangle!.offsetHeight;
        
        const maxX = boundaryRect.width - rectWidth;
        const maxY = boundaryRect.height - rectHeight;
        
        let startTime = performance.now();
        const duration = 5000; // 5 secondes de test
        
        function moveRectangle(): void {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const angle = progress * Math.PI * 2;
            const radius = Math.min(maxX, maxY) / 2;
            const centerX = maxX / 2;
            const centerY = maxY / 2;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            rectangle!.style.left = `${x}px`;
            rectangle!.style.top = `${y}px`;
            
            if (progress < 1) {
                requestAnimationFrame(moveRectangle);
            } else {
                if (animationId !== null) cancelAnimationFrame(animationId);
                
                const avgFps = frames.length > 0 ? frames.reduce((sum, fps) => sum + fps, 0) / frames.length : 0;
                const minFps = frames.length > 0 ? Math.min(...frames) : 0;
                
                console.log('📊 Résultats du test:');
                console.log(`FPS moyen: ${avgFps.toFixed(1)}`);
                console.log(`FPS minimum: ${minFps}`);
                if (avgFps > 0) { // Avoid division by zero
                    console.log(`Stabilité: ${(minFps / avgFps * 100).toFixed(1)}%`);
                } else {
                    console.log('Stabilité: N/A (pas de frames capturées)');
                }
                
                rectangle!.style.transform = currentStyles.transform;
                rectangle!.style.transition = currentStyles.transition;
                rectangle!.style.willChange = currentStyles.willChange;
                
                if (avgFps < 55) {
                    console.warn('⚠️ Performances sous-optimales détectées');
                    console.log('Conseils d\'optimisation:');
                    console.log('1. Assurez-vous que will-change et transform: translateZ(0) sont appliqués');
                    console.log('2. Utilisez requestAnimationFrame de manière cohérente');
                    console.log('3. Désactivez les transitions pendant le déplacement');
                } else {
                    console.log('✅ Performances d\'animation bonnes');
                }
            }
        }
        
        requestAnimationFrame(moveRectangle);
        animationId = requestAnimationFrame(countFrames); // Store the ID from countFrames
    }
    
    rectangle.style.transition = 'none';
    rectangle.style.willChange = 'transform, left, top';
    rectangle.style.transform = 'translateZ(0)';
    
    console.log('▶️ Démarrage du test de mouvement...');
    setTimeout(simulateMovement, 500);
    
    return {
        stop: (): void => {
            if (animationId !== null) cancelAnimationFrame(animationId);
            if (rectangle) { // Check if rectangle still exists
                rectangle.style.transform = currentStyles.transform;
                rectangle.style.transition = currentStyles.transition;
                rectangle.style.willChange = currentStyles.willChange;
            }
            console.log('🛑 Test arrêté manuellement');
        }
    };
}

if (typeof window !== 'undefined') {
    window.testAnimationPerformance = testAnimationPerformance;
    console.log('📱 Outil de test de performance d\'animation chargé');
    console.log('Utilisez window.testAnimationPerformance() pour démarrer le test');
}