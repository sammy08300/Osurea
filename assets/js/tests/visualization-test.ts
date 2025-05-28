/**
 * Test script for visualization fixes
 * Tests centering, dragging, and positioning functionality
 */

// Define types for global objects/functions if they are expected
declare global {
    interface Window {
        testDragFunctionality?: () => boolean; // Assuming it returns a boolean
        updateDisplay?: () => void;
        centerArea?: () => void;
        ContextMenu?: any; // Replace 'any' with a more specific type if ContextMenu structure is known
    }
}

interface Test {
    name: string;
    test: () => boolean;
}

interface TestResults {
    passed: number;
    failed: number;
    total: number;
}

export function runVisualizationTest(): TestResults {
    console.log('🧪 Running Visualization Test...');
    
    const tests: Test[] = [
        {
            name: 'Visual Container Centering',
            test: (): boolean => {
                const visualContainer = document.getElementById('visual-container');
                if (!visualContainer) return false;
                const computedStyle = window.getComputedStyle(visualContainer);
                return computedStyle.display === 'flex' &&
                       computedStyle.alignItems === 'center' &&
                       computedStyle.justifyContent === 'center';
            }
        },
        {
            name: 'Tablet Boundary Positioning',
            test: (): boolean => {
                const tabletBoundary = document.getElementById('tablet-boundary');
                if (!tabletBoundary) return false;
                const computedStyle = window.getComputedStyle(tabletBoundary);
                return computedStyle.position === 'relative';
            }
        },
        {
            name: 'Rectangle Element Setup',
            test: (): boolean => {
                const rectangle = document.getElementById('rectangle') as HTMLElement | null; // Cast
                if (!rectangle) return false;
                const computedStyle = window.getComputedStyle(rectangle);
                return computedStyle.position === 'absolute' &&
                       computedStyle.cursor === 'grab';
            }
        },
        {
            name: 'Drag Functionality',
            test: (): boolean => {
                const rectangle = document.getElementById('rectangle') as HTMLElement | null; // Cast
                if (!rectangle) return false;
                return rectangle.style.pointerEvents === 'auto' &&
                       rectangle.style.cursor === 'grab' &&
                       rectangle.style.visibility !== 'hidden' &&
                       !rectangle.classList.contains('invisible');
            }
        },
        {
            name: 'Rectangle Interactive',
            test: (): boolean => {
                if (typeof window.testDragFunctionality === 'function') {
                    return window.testDragFunctionality();
                }
                return false;
            }
        },
        {
            name: 'Context Menu Available',
            test: (): boolean => {
                const contextMenu = document.getElementById('context-menu');
                // Assuming ContextMenu is a global object after its module is loaded
                return contextMenu !== null && typeof window.ContextMenu !== 'undefined';
            }
        },
        {
            name: 'Visualizer Functions Available',
            test: (): boolean => {
                return typeof window.updateDisplay === 'function' &&
                       typeof window.centerArea === 'function';
            }
        },
        {
            name: 'Center Button Available',
            test: (): boolean => document.getElementById('center-btn') !== null
        },
        {
            name: 'Visual Elements Visible',
            test: (): boolean => {
                const visualContainer = document.getElementById('visual-container');
                const tabletBoundary = document.getElementById('tablet-boundary');
                const rectangle = document.getElementById('rectangle');
                if (!visualContainer || !tabletBoundary || !rectangle) return false;
                const containerRect = visualContainer.getBoundingClientRect();
                const boundaryRect = tabletBoundary.getBoundingClientRect();
                return containerRect.width > 0 && containerRect.height > 0 &&
                       boundaryRect.width > 0 && boundaryRect.height > 0;
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - Test returned false`);
                failed++;
            }
        } catch (error: any) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Visualization Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All visualization tests passed! The zone should be properly centered and draggable.');
    } else {
        console.log('⚠️ Some visualization tests failed. Check the errors above.');
    }
    
    console.log('\n🔍 Diagnostic Information:');
    const visualContainer = document.getElementById('visual-container');
    const tabletBoundary = document.getElementById('tablet-boundary');
    const rectangle = document.getElementById('rectangle') as HTMLElement | null; // Cast
    
    if (visualContainer) {
        const containerStyle = window.getComputedStyle(visualContainer);
        console.log('Visual Container:', {
            display: containerStyle.display,
            alignItems: containerStyle.alignItems,
            justifyContent: containerStyle.justifyContent,
            width: containerStyle.width,
            height: containerStyle.height
        });
    }
    
    if (tabletBoundary) {
        const boundaryStyle = window.getComputedStyle(tabletBoundary);
        console.log('Tablet Boundary:', {
            position: boundaryStyle.position,
            width: boundaryStyle.width,
            height: boundaryStyle.height,
            margin: boundaryStyle.margin
        });
    }
    
    if (rectangle) {
        const rectStyle = window.getComputedStyle(rectangle);
        console.log('Rectangle:', {
            position: rectStyle.position,
            cursor: rectStyle.cursor,
            pointerEvents: rectangle.style.pointerEvents, // Access from style property
            left: rectStyle.left,
            top: rectStyle.top,
            width: rectStyle.width,
            height: rectStyle.height
        });
    }
    
    return { passed, failed, total: tests.length };
}

if (typeof window !== 'undefined') {
    setTimeout(() => {
        if (document.getElementById('visual-container')) {
            runVisualizationTest();
        } else {
            console.log('⚠️ Visual container not found. Make sure the page is fully loaded.');
        }
    }, 2000);
}