/**
 * Script de débogage pour suivre les animations au survol
 */
(function() {
    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[DEBUG] Script de débogage des animations de survol chargé');
        
        // Observer les mutations pour détecter les nouveaux éléments
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    attachEventListeners();
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Attacher les écouteurs d'événements
        function attachEventListeners() {
            const items = document.querySelectorAll('.favorite-item');
            
            items.forEach(function(item, index) {
                // Éviter d'attacher plusieurs fois les mêmes écouteurs
                if (item.dataset.debugInitialized) return;
                item.dataset.debugInitialized = 'true';
                
                // Attacher les écouteurs de survol
                item.addEventListener('mouseenter', function(e) {
                    const styles = window.getComputedStyle(item);
                    console.log(`[DEBUG] SURVOL DÉBUT #${index}:`, {
                        element: item,
                        classes: item.className,
                        transform: styles.transform,
                        transition: styles.transition,
                        animation: styles.animation,
                        boxShadow: styles.boxShadow,
                        zIndex: styles.zIndex,
                        id: item.dataset.id
                    });
                    
                    // Vérifier après un délai si l'animation a appliqué des changements
                    setTimeout(() => {
                        const updatedStyles = window.getComputedStyle(item);
                        console.log(`[DEBUG] SURVOL APRÈS 300ms #${index}:`, {
                            transform: updatedStyles.transform,
                            boxShadow: updatedStyles.boxShadow,
                            zIndex: updatedStyles.zIndex
                        });
                    }, 300);
                });
                
                item.addEventListener('mouseleave', function(e) {
                    const styles = window.getComputedStyle(item);
                    console.log(`[DEBUG] SURVOL FIN #${index}:`, {
                        transform: styles.transform,
                        boxShadow: styles.boxShadow,
                        zIndex: styles.zIndex
                    });
                });
            });
            
            console.log(`[DEBUG] ${items.length} éléments favorite-item surveillés`);
        }
        
        // Détecter les règles CSS applicables
        function getApplicableRules() {
            const rules = [];
            for (let i = 0; i < document.styleSheets.length; i++) {
                try {
                    const styleSheet = document.styleSheets[i];
                    const cssRules = styleSheet.cssRules || styleSheet.rules;
                    
                    for (let j = 0; j < cssRules.length; j++) {
                        const rule = cssRules[j];
                        if (rule.selectorText && (rule.selectorText.includes('favorite-item') || 
                                                rule.selectorText.includes('animate-fadeIn-smooth'))) {
                            rules.push({
                                selector: rule.selectorText,
                                cssText: rule.cssText
                            });
                        }
                    }
                } catch (e) {
                    // Ignorer les erreurs CORS
                }
            }
            
            console.log('[DEBUG] Règles CSS applicables:', rules);
        }
        
        // Attacher les écouteurs initiaux et analyser les règles CSS
        setTimeout(() => {
            attachEventListeners();
            getApplicableRules();
        }, 1000);
    });
})(); 