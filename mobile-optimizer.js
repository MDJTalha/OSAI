/**
 * Mobile UI/UX Optimization Module
 * Responsive design and touch optimization for mobile devices
 * 
 * Features:
 * - Mobile-responsive layout
 * - Touch-optimized controls
 * - Swipe gestures
 * - Mobile camera fixes
 * - Performance optimization
 * - PWA enhancements
 */

class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.touchSupported = 'ontouchstart' in window;
        this.orientation = window.orientation;
        
        this.init();
    }

    /**
     * Detect mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Detect tablet
     */
    detectTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    }

    /**
     * Initialize mobile optimizations
     */
    init() {
        console.log('[MobileOptimizer] Initializing...', this.isMobile ? 'Mobile' : 'Desktop');
        
        if (this.isMobile || this.isTablet) {
            this.applyMobileOptimizations();
            this.setupTouchGestures();
            this.optimizeCameraForMobile();
            this.setupOrientationChange();
        }
        
        this.setupViewport();
        this.preventZoom();
        this.optimizeButtons();
    }

    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
        document.body.classList.add('mobile');
        
        // Adjust font sizes for mobile
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-specific styles */
            @media (max-width: 768px) {
                /* Full-screen camera */
                .camera-container {
                    height: calc(100vh - 140px);
                }
                
                /* Larger touch targets */
                button, .action-btn, .control-fab {
                    min-height: 48px;
                    min-width: 48px;
                }
                
                /* Bottom panel optimization */
                .bottom-panel {
                    max-height: 60vh;
                }
                
                /* Header optimization */
                .app-header {
                    padding: 8px;
                }
                
                .status-bar {
                    font-size: 10px;
                }
                
                /* Quick actions bar */
                .quick-actions {
                    padding: 8px 4px;
                }
                
                .action-btn {
                    flex-direction: column;
                    padding: 8px 4px;
                }
                
                .action-label {
                    font-size: 10px;
                    margin-top: 4px;
                }
                
                /* Floating controls */
                .controls-floating {
                    right: 8px;
                }
                
                .control-fab {
                    width: 56px;
                    height: 56px;
                    margin: 8px 0;
                }
                
                /* Modal optimization */
                .modal-content {
                    width: 95%;
                    max-height: 90vh;
                }
                
                /* Toast optimization */
                .toast-notification {
                    left: 50%;
                    right: auto;
                    width: auto;
                    max-width: 90%;
                }
            }
            
            /* Touch-specific optimizations */
            @media (hover: none) and (pointer: coarse) {
                /* Larger hit targets */
                button, .action-btn {
                    min-height: 48px;
                    min-width: 48px;
                    padding: 12px 16px;
                }
                
                /* Remove hover effects on touch devices */
                button:hover, .action-btn:hover {
                    transform: none;
                }
                
                /* Active states */
                button:active, .action-btn:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                }
            }
            
            /* Prevent text selection on touch */
            .no-select {
                user-select: none;
                -webkit-user-select: none;
                touch-action: manipulation;
            }
        `;
        document.head.appendChild(style);
        
        console.log('[MobileOptimizer] Mobile optimizations applied');
    }

    /**
     * Setup touch gestures
     */
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });
    }

    /**
     * Handle swipe gestures
     */
    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const threshold = 50;
        const maxDiff = 100;

        // Horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > threshold && Math.abs(diffX) < maxDiff) {
                if (diffX > 0) {
                    this.onSwipeRight();
                } else {
                    this.onSwipeLeft();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(diffY) > threshold && Math.abs(diffY) < maxDiff) {
                if (diffY > 0) {
                    this.onSwipeDown();
                } else {
                    this.onSwipeUp();
                }
            }
        }
    }

    /**
     * Swipe handlers
     */
    onSwipeLeft() {
        console.log('[MobileOptimizer] Swipe left');
        // Could navigate to next feature
    }

    onSwipeRight() {
        console.log('[MobileOptimizer] Swipe right');
        // Could navigate to previous feature
    }

    onSwipeUp() {
        console.log('[MobileOptimizer] Swipe up');
        // Could close panel
        const panel = document.getElementById('bottomPanel');
        if (panel?.classList.contains('active')) {
            panel.classList.remove('active');
        }
    }

    onSwipeDown() {
        console.log('[MobileOptimizer] Swipe down');
        // Could open panel
    }

    /**
     * Optimize camera for mobile
     */
    async optimizeCameraForMobile() {
        if (!window.fixedCamera) return;
        
        // Override camera constraints for mobile
        const originalStartCamera = window.fixedCamera.startCamera.bind(window.fixedCamera);
        
        window.fixedCamera.startCamera = async () => {
            console.log('[MobileOptimizer] Starting camera with mobile optimizations...');
            
            try {
                // Mobile-optimized constraints
                const constraints = {
                    video: {
                        facingMode: window.fixedCamera.currentCamera,
                        width: { ideal: 1280 }, // Lower resolution for better performance
                        height: { ideal: 720 },
                        frameRate: { ideal: 30, max: 30 } // Cap at 30 FPS
                    },
                    audio: false
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (window.fixedCamera.video) {
                    window.fixedCamera.video.srcObject = stream;
                    
                    await new Promise((resolve) => {
                        window.fixedCamera.video.onloadedmetadata = () => {
                            window.fixedCamera.video.play().then(() => {
                                window.fixedCamera.setupCanvas();
                                window.fixedCamera.isCameraActive = true;
                                window.fixedCamera.permissionGranted = true;
                                window.fixedCamera.checkTorchSupport();
                                resolve();
                            }).catch(err => {
                                console.error('[MobileOptimizer] Play error:', err);
                                resolve();
                            });
                        };
                    });
                    
                    console.log('[MobileOptimizer] Camera started with mobile optimizations');
                    return true;
                }
            } catch (error) {
                console.error('[MobileOptimizer] Camera error:', error);
                window.fixedCamera.handleCameraError(error);
                return false;
            }
        };
        
        console.log('[MobileOptimizer] Camera optimization applied');
    }

    /**
     * Setup orientation change handler
     */
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            console.log('[MobileOptimizer] Orientation changed:', window.orientation);
            
            // Adjust layout for orientation
            setTimeout(() => {
                if (window.fixedCamera) {
                    window.fixedCamera.setupCanvas();
                }
            }, 300);
        });
    }

    /**
     * Setup viewport for mobile
     */
    setupViewport() {
        // Ensure viewport meta tag is correct
        let viewport = document.querySelector('meta[name="viewport"]');
        
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    /**
     * Prevent zoom on double-tap
     */
    preventZoom() {
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Optimize buttons for touch
     */
    optimizeButtons() {
        // Add touch feedback to all buttons
        document.querySelectorAll('button, .action-btn').forEach(btn => {
            btn.addEventListener('touchstart', () => {
                btn.style.opacity = '0.7';
                btn.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            btn.addEventListener('touchend', () => {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1)';
            }, { passive: true });
        });
    }

    /**
     * Get device info
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            touchSupported: this.touchSupported,
            orientation: this.orientation,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        };
    }
}

// Initialize global mobile optimizer
window.mobileOptimizer = new MobileOptimizer();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}
