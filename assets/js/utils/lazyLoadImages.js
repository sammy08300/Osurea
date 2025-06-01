/**
 * Enhanced Lazy Loading System - Performance optimized
 * Uses Intersection Observer API with fallback for better performance
 */

class LazyImageLoader {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.loadingImages = new Set();
        this.init();
    }

    init() {
        // Use Intersection Observer if available (modern browsers)
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    root: null,
                    rootMargin: '50px', // Start loading 50px before entering viewport
                    threshold: 0.1
                }
            );
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    async loadImage(img) {
        if (this.loadedImages.has(img) || this.loadingImages.has(img)) {
            return;
        }

        this.loadingImages.add(img);

        try {
            // Add loading class for CSS transitions
            img.classList.add('loading');

            const src = img.dataset.src || img.getAttribute('data-src') || img.src;
            if (src && src !== img.src) {
                // Preload the image
                const imageLoader = new Image();
                
                await new Promise((resolve, reject) => {
                    imageLoader.onload = resolve;
                    imageLoader.onerror = reject;
                    imageLoader.src = src;
                });

                // Update the actual image source
                img.src = src;
                
                // Remove data attributes to prevent reprocessing
                if (img.dataset.src) {
                    img.removeAttribute('data-src');
                }
            }

            // Mark as loaded
            img.classList.remove('loading');
            img.classList.add('loaded');
            this.loadedImages.add(img);

        } catch (error) {
            console.warn('Failed to load image:', img, error);
            img.classList.remove('loading');
            img.classList.add('error');
        } finally {
            this.loadingImages.delete(img);
        }
    }

    observeImages() {
        // Select all images with lazy-image class or data-src attribute
        const lazyImages = document.querySelectorAll('img.lazy-image:not(.loaded):not(.loading), img[data-src]:not(.loaded):not(.loading)');
        
        if (this.observer) {
            // Use Intersection Observer
            lazyImages.forEach(img => this.observer.observe(img));
        } else {
            // Fallback to scroll-based detection
            lazyImages.forEach(img => {
                if (this.isInViewport(img)) {
                    this.loadImage(img);
                }
            });
        }
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top <= windowHeight + 50 && // 50px margin
            rect.left <= windowWidth &&
            rect.bottom >= -50 &&
            rect.right >= 0
        );
    }

    // Throttled fallback for older browsers
    handleScroll = (() => {
        let ticking = false;
        return () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.observeImages();
                    ticking = false;
                });
                ticking = true;
            }
        };
    })();

    setupListeners() {
        // Initial load
        this.observeImages();

        if (!this.observer) {
            // Fallback event listeners for older browsers
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleScroll, { passive: true });
            window.addEventListener('orientationchange', this.handleScroll, { passive: true });
        }
        
        // Recheck on page load and after any DOM changes
        window.addEventListener('load', () => this.observeImages());
        
        // Use MutationObserver to detect new images
        if ('MutationObserver' in window) {
            const mutationObserver = new MutationObserver((mutations) => {
                let needsCheck = false;
                
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        needsCheck = true;
                    }
                });
                
                if (needsCheck) {
                    this.observeImages();
                }
            });
            
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
        window.removeEventListener('orientationchange', this.handleScroll);
    }

    getStats() {
        return {
            loaded: this.loadedImages.size,
            loading: this.loadingImages.size,
            usingIntersectionObserver: !!this.observer
        };
    }
}

// Create singleton instance
const lazyImageLoader = new LazyImageLoader();

// Legacy exports for backward compatibility
export function lazyLoadImages() {
    lazyImageLoader.observeImages();
}

export function setupLazyLoadListeners() {
    lazyImageLoader.setupListeners();
}

// New enhanced exports
export { lazyImageLoader as LazyImageLoader };
export const setupEnhancedLazyLoading = () => lazyImageLoader.setupListeners();

// Global exports for backward compatibility
if (typeof window !== 'undefined') {
    window.lazyLoadImages = lazyLoadImages;
    window.setupLazyLoadListeners = setupLazyLoadListeners;
    window.LazyImageLoader = lazyImageLoader;
}