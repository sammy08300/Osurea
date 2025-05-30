/**
 * Test script for visualization fixes
 * Tests centering, dragging, and positioning functionality
 */

export function runVisualizationTest() {
    console.log('🧪 Running Visualization Test...');
    
    const tests = [
        // Test visual container setup
        {
            name: 'Visual Container Centering',
            test: () => {
                const visualContainer = document.getElementById('visual-container');
                if (!visualContainer) return false;
                
                const computedStyle = window.getComputedStyle(visualContainer);
                return computedStyle.display === 'flex' &&
                       computedStyle.alignItems === 'center' &&
                       computedStyle.justifyContent === 'center';
            }
        },
        
        // Test tablet boundary positioning
        {
            name: 'Tablet Boundary Positioning',
            test: () => {
                const tabletBoundary = document.getElementById('tablet-boundary');
                if (!tabletBoundary) return false;
                
                const computedStyle = window.getComputedStyle(tabletBoundary);
                return computedStyle.position === 'relative';
            }
        },
        
        // Test rectangle element
        {
            name: 'Rectangle Element Setup',
            test: () => {
                const rectangle = document.getElementById('rectangle');
                if (!rectangle) return false;
                
                const computedStyle = window.getComputedStyle(rectangle);
                return computedStyle.position === 'absolute' &&
                       computedStyle.cursor === 'grab';
            }
        },
        
        // Test drag functionality setup
        {
            name: 'Drag Functionality',
            test: () => {
                const rectangle = document.getElementById('rectangle');
                if (!rectangle) return false;
                
                // Check if drag event listeners are properly set
                return rectangle.style.pointerEvents === 'auto' &&
                       rectangle.style.cursor === 'grab' &&
                       rectangle.style.visibility !== 'hidden' &&
                       !rectangle.classList.contains('invisible');
            }
        },
        
        // Test rectangle visibility and interaction
        {
            name: 'Rectangle Interactive',
            test: () => {
                if (typeof window.testDragFunctionality === 'function') {
                    return window.testDragFunctionality();
                }
                return false;
            }
        },
        
        // Test context menu initialization
        {
            name: 'Context Menu Available',
            test: () => {
                const contextMenu = document.getElementById('context-menu');
                return contextMenu !== null && typeof ContextMenu !== 'undefined';
            }
        },
        
        // Test visualizer functions
        {
            name: 'Visualizer Functions Available',
            test: () => {
                return typeof window.updateDisplay === 'function' &&
                       typeof window.centerArea === 'function';
            }
        },
        
        // Test center button functionality
        {
            name: 'Center Button Available',
            test: () => {
                const centerBtn = document.getElementById('center-btn');
                return centerBtn !== null;
            }
        },
        
        // Test visual elements visibility
        {
            name: 'Visual Elements Visible',
            test: () => {
                const visualContainer = document.getElementById('visual-container');
                const tabletBoundary = document.getElementById('tablet-boundary');
                const rectangle = document.getElementById('rectangle');
                
                if (!visualContainer || !tabletBoundary || !rectangle) return false;
                
                const containerRect = visualContainer.getBoundingClientRect();
                const boundaryRect = tabletBoundary.getBoundingClientRect();
                
                // Check if elements have proper dimensions
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
        } catch (error) {
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
    
    // Additional diagnostic information
    console.log('\n🔍 Diagnostic Information:');
    const visualContainer = document.getElementById('visual-container');
    const tabletBoundary = document.getElementById('tablet-boundary');
    const rectangle = document.getElementById('rectangle');
    
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
            pointerEvents: rectangle.style.pointerEvents,
            left: rectStyle.left,
            top: rectStyle.top,
            width: rectStyle.width,
            height: rectStyle.height
        });
    }
    
    return { passed, failed, total: tests.length };
}

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
    // Run test after a delay to ensure everything is loaded
    setTimeout(() => {
        if (document.getElementById('visual-container')) {
            runVisualizationTest();
        } else {
            console.log('⚠️ Visual container not found. Make sure the page is fully loaded.');
        }
    }, 2000);
} 