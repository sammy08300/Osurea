/**
 * Animation Performance Test Tool
 * Utilitaire pour tester et optimiser les performances d'animation du rectangle
 * Exécutez ce script dans la console du navigateur pour analyser les performances
 */

export function testAnimationPerformance() {
    console.log('🔍 Test de performance d\'animation démarré...');
    
    const rectangle = document.getElementById('rectangle');
    const tabletBoundary = document.getElementById('tablet-boundary');
    
    if (!rectangle || !tabletBoundary) {
        console.error('❌ Éléments requis non trouvés');
        return;
    }
    
    // Récupérer les styles actuels
    const currentStyles = {
        transform: rectangle.style.transform,
        transition: rectangle.style.transition,
        willChange: rectangle.style.willChange
    };
    
    // Mesurer les FPS
    let frameCount = 0;
    let lastTimestamp = performance.now();
    let frames = [];
    let animationId = null;
    
    function countFrames(timestamp) {
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
    
    // Simuler un déplacement automatique pour tester les performances
    function simulateMovement() {
        const boundaryRect = tabletBoundary.getBoundingClientRect();
        const rectWidth = parseFloat(rectangle.style.width) || rectangle.offsetWidth;
        const rectHeight = parseFloat(rectangle.style.height) || rectangle.offsetHeight;
        
        const maxX = boundaryRect.width - rectWidth;
        const maxY = boundaryRect.height - rectHeight;
        
        let startTime = performance.now();
        const duration = 5000; // 5 secondes de test
        
        function moveRectangle() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Mouvement circulaire pour tester la fluidité
            const angle = progress * Math.PI * 2;
            const radius = Math.min(maxX, maxY) / 2;
            const centerX = maxX / 2;
            const centerY = maxY / 2;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            rectangle.style.left = `${x}px`;
            rectangle.style.top = `${y}px`;
            
            if (progress < 1) {
                requestAnimationFrame(moveRectangle);
            } else {
                // Test terminé
                cancelAnimationFrame(animationId);
                
                // Analyser les résultats
                const avgFps = frames.reduce((sum, fps) => sum + fps, 0) / frames.length;
                const minFps = Math.min(...frames);
                
                console.log('📊 Résultats du test:');
                console.log(`FPS moyen: ${avgFps.toFixed(1)}`);
                console.log(`FPS minimum: ${minFps}`);
                console.log(`Stabilité: ${(minFps / avgFps * 100).toFixed(1)}%`);
                
                // Restaurer les styles originaux
                rectangle.style.transform = currentStyles.transform;
                rectangle.style.transition = currentStyles.transition;
                rectangle.style.willChange = currentStyles.willChange;
                
                // Afficher des conseils d'optimisation
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
        
        // Démarrer le test
        requestAnimationFrame(moveRectangle);
        requestAnimationFrame(countFrames);
    }
    
    // Préparer le rectangle pour le test
    rectangle.style.transition = 'none';
    rectangle.style.willChange = 'transform, left, top';
    rectangle.style.transform = 'translateZ(0)';
    
    console.log('▶️ Démarrage du test de mouvement...');
    setTimeout(simulateMovement, 500);
    
    return {
        stop: () => {
            cancelAnimationFrame(animationId);
            rectangle.style.transform = currentStyles.transform;
            rectangle.style.transition = currentStyles.transition;
            rectangle.style.willChange = currentStyles.willChange;
            console.log('🛑 Test arrêté manuellement');
        }
    };
}

// Exposition globale pour utilisation dans la console
if (typeof window !== 'undefined') {
    window.testAnimationPerformance = testAnimationPerformance;
    console.log('📱 Outil de test de performance d\'animation chargé');
    console.log('Utilisez window.testAnimationPerformance() pour démarrer le test');
} 