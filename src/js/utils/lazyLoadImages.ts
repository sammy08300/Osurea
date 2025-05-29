/**
 * Enhanced Lazy Loading System - Performance optimized
 * Uses Intersection Observer API with fallback for better performance
 */

class LazyImageLoader {
    private observer: IntersectionObserver | null;
    private loadedImages: Set<HTMLImageElement>;
    private loadingImages: Set<HTMLImageElement>;

    constructor() {
        this.observer = null;
        this.loadedImages = new Set<HTMLImageElement>();
        this.loadingImages = new Set<HTMLImageElement>();
        this.init();
    }

    init(): void {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    root: null,
                    rootMargin: '50px',
                    threshold: 0.1
                }
            );
        }
    }

    handleIntersection(entries: IntersectionObserverEntry[]): void {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetImage = entry.target as HTMLImageElement;
                this.loadImage(targetImage);
                if (this.observer) {
                    this.observer.unobserve(targetImage);
                }
            }
        });
    }

    async loadImage(img: HTMLImageElement): Promise<void> {
        if (this.loadedImages.has(img) || this.loadingImages.has(img)) {
            return;
        }

        this.loadingImages.add(img);

        try {
            img.classList.add('loading');

            const src = img.dataset.src || img.src; // Keep original img.src as fallback
            if (src && src !== img.src) { // Only load if data-src is present and different
                const imageLoader = new Image();
                
                await new Promise<void>((resolve, reject) => { // Explicitly type Promise
                    imageLoader.onload = () => resolve();
                    imageLoader.onerror = () => reject(new Error('Image load error')); // Pass an Error object
                    imageLoader.src = src;
                });

                img.src = src;
            } else if (!img.src) { // If img.src is also empty and no data-src
                throw new Error('No image source found');
            }


            img.classList.remove('loading');
            img.classList.add('loaded');
            this.loadedImages.add(img);

        } catch (error: any) {
            console.warn('Failed to load image:', img.dataset.src || img.src, error.message);
            img.classList.remove('loading');
            img.classList.add('error');
        } finally {
            this.loadingImages.delete(img);
        }
    }

    observeImages(): void {
        const lazyImages = document.querySelectorAll<HTMLImageElement>('img.lazy-image:not(.loaded):not(.loading)');
        
        if (this.observer) {
            lazyImages.forEach(img => this.observer!.observe(img)); // Use non-null assertion if observer is guaranteed
        } else {
            lazyImages.forEach(img => {
                if (this.isInViewport(img)) {
                    this.loadImage(img);
                }
            });
        }
    }

    isInViewport(element: Element): boolean { // Element is more generic than HTMLElement if needed
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top <= windowHeight + 50 &&
            rect.left <= windowWidth &&
            rect.bottom >= -50 &&
            rect.right >= 0
        );
    }

    handleScroll = (() => {
        let ticking = false;
        return (): void => {
            if (!ticking) {
                window.requestAnimationFrame(() => { // Ensure window.requestAnimationFrame
                    this.observeImages();
                    ticking = false;
                });
                ticking = true;
            }
        };
    })();

    setupListeners(): void {
        this.observeImages();

        if (!this.observer) {
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleScroll, { passive: true });
            window.addEventListener('orientationchange', this.handleScroll, { passive: true });
        }
    }

    disconnect(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
        window.removeEventListener('orientationchange', this.handleScroll);
    }

    getStats(): object {
        return {
            loaded: this.loadedImages.size,
            loading: this.loadingImages.size,
            usingIntersectionObserver: !!this.observer
        };
    }
}

const lazyImageLoaderInstance = new LazyImageLoader(); // Renamed to avoid conflict with class name

export function lazyLoadImages(): void {
    lazyImageLoaderInstance.observeImages();
}

export function setupLazyLoadListeners(): void {
    lazyImageLoaderInstance.setupListeners();
}

export { lazyImageLoaderInstance as LazyImageLoaderService }; // Export instance with a different name
export const setupEnhancedLazyLoading = (): void => lazyImageLoaderInstance.setupListeners();

if (typeof window !== 'undefined') {
    const win = window as any;
    win.lazyLoadImages = lazyLoadImages;
    win.setupLazyLoadListeners = setupLazyLoadListeners;
    win.LazyImageLoaderInstance = lazyImageLoaderInstance; // Export instance
}
