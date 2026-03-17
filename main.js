/**
 * OSAI Main Entry Point
 * Initializes and coordinates all modules
 * Version 8.0.0 - Enterprise Edition
 */

class OSAIApp {
    constructor() {
        this.version = '8.0.0';
        this.isInitialized = false;
        this.modules = {};
        this.initializationOrder = [
            'errorBoundary',
            'securityManager',
            'stateManager',
            'memoryManager',
            'lazyLoader',
            'workerManager',
            'cameraModule',
            'detectionModule',
            'measurementModule',
            'uiModule',
            'onboarding',
            'helpSystem'
        ];
        
        console.log(`[OSAI] Version ${this.version} starting...`);
    }

    /**
     * Initialize all modules in order
     */
    async init() {
        if (this.isInitialized) {
            console.log('[OSAI] Already initialized');
            return;
        }

        console.log('[OSAI] Starting initialization...');

        try {
            // Initialize modules in order
            for (const moduleName of this.initializationOrder) {
                await this.initModule(moduleName);
            }

            // Setup integrations
            this.setupIntegrations();
            
            // Start services
            this.startServices();
            
            // Update UI
            this.updateUI();

            this.isInitialized = true;
            console.log('[OSAI] Initialization complete ✓');
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('osai-ready', { 
                detail: { version: this.version } 
            }));

        } catch (error) {
            console.error('[OSAI] Initialization failed:', error);
            if (window.errorBoundary) {
                window.errorBoundary.handleGlobalError({
                    message: `OSAI initialization failed: ${error.message}`,
                    filename: 'main.js',
                    lineno: 0,
                    error
                });
            }
        }
    }

    /**
     * Initialize a specific module
     */
    async initModule(moduleName) {
        console.log(`[OSAI] Initializing ${moduleName}...`);
        
        try {
            const module = this.getModule(moduleName);
            
            if (!module) {
                console.warn(`[OSAI] Module ${moduleName} not found, skipping`);
                return;
            }

            // Call init if available
            if (typeof module.init === 'function') {
                await module.init();
            }

            // Store reference
            this.modules[moduleName] = module;
            
            console.log(`[OSAI] ${moduleName} initialized ✓`);
            
        } catch (error) {
            console.error(`[OSAI] Failed to initialize ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Get module instance from window
     */
    getModule(moduleName) {
        const moduleMap = {
            errorBoundary: 'errorBoundary',
            securityManager: 'securityManager',
            stateManager: 'stateManager',
            memoryManager: 'memoryManager',
            lazyLoader: 'lazyLoader',
            workerManager: 'workerManager',
            cameraModule: 'cameraModule',
            detectionModule: 'comprehensiveDetection',
            measurementModule: 'measurementModule',
            uiModule: 'app',
            onboarding: 'onboarding',
            helpSystem: 'helpSystem'
        };

        const windowName = moduleMap[moduleName];
        return window[windowName] || null;
    }

    /**
     * Setup module integrations
     */
    setupIntegrations() {
        console.log('[OSAI] Setting up integrations...');

        // Connect state manager with UI
        if (window.stateManager && window.app) {
            this.setupStateUIIntegration();
        }

        // Connect error boundary with toast
        if (window.errorBoundary && window.app) {
            window.errorBoundary.showToast = (message, type) => {
                window.app.showToast(message, type);
            };
        }

        // Connect worker manager with detection
        if (window.workerManager && window.comprehensiveDetection) {
            window.comprehensiveDetection.useWorker = (imageData, options) => {
                return window.workerManager.detectObjects(imageData, options);
            };
        }

        // Connect lazy loader with feature flags
        if (window.lazyLoader && window.stateManager) {
            window.stateManager.subscribe('config.features', (features) => {
                if (features) {
                    Object.entries(features).forEach(([feature, enabled]) => {
                        window.lazyLoader.setFeatureFlag(feature, enabled);
                    });
                }
            });
        }

        console.log('[OSAI] Integrations setup complete ✓');
    }

    /**
     * Setup state manager UI integration
     */
    setupStateUIIntegration() {
        // Update UI when state changes
        window.stateManager.subscribe('detection.items', (items) => {
            this.updateItemCount(items.length);
            this.updateItemProperties(items);
        });

        window.stateManager.subscribe('ui.loading', (loading) => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.classList.toggle('active', loading);
                overlay.setAttribute('aria-busy', loading.toString());
            }
        });

        window.stateManager.subscribe('ui.loadingMessage', (message) => {
            const text = document.getElementById('loadingText');
            if (text) {
                text.textContent = message || 'Processing...';
            }
        });

        window.stateManager.subscribe('models', (models) => {
            this.updateModelsStatus(models);
        });
    }

    /**
     * Start background services
     */
    startServices() {
        console.log('[OSAI] Starting background services...');

        // Start FPS counter
        this.startFPSCounter();

        // Start memory monitoring
        if (window.memoryManager) {
            window.memoryManager.startMemoryMonitoring();
        }

        // Preload AI models in background
        if (window.workerManager) {
            setTimeout(() => {
                window.workerManager.preloadModels();
            }, 2000);
        }

        console.log('[OSAI] Background services started ✓');
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update version display
        console.log(`[OSAI] Version ${this.version} ready`);

        // Update models status
        if (window.stateManager) {
            const models = window.stateManager.get('models');
            this.updateModelsStatus(models);
        }

        // Update learned count
        if (window.visualMemory) {
            const count = window.visualMemory.getStoredCount?.() || 0;
            this.updateLearnedCount(count);
        }

        // Show welcome toast
        if (window.app?.showToast) {
            setTimeout(() => {
                window.app.showToast(`OSAI v${this.version} ready`, 'success');
            }, 1000);
        }
    }

    /**
     * Update item count display
     */
    updateItemCount(count) {
        const el = document.getElementById('itemCount');
        if (el) {
            el.textContent = count;
            el.parentElement.classList.toggle('has-items', count > 0);
        }
    }

    /**
     * Update item properties display
     */
    updateItemProperties(items) {
        const el = document.getElementById('itemProps');
        if (!el) return;

        if (!items || items.length === 0) {
            el.textContent = '--';
            el.style.color = 'var(--gray-400)';
            return;
        }

        const item = items[0];
        const props = [];

        if (item.color?.dominant && item.color.dominant !== 'Unknown') {
            props.push(item.color.dominant);
        }

        if (item.material?.type && item.material.type !== 'Unknown') {
            props.push(item.material.type);
        }

        if (item.size?.category) {
            props.push(item.size.category);
        }

        el.textContent = props.length > 0 ? props.join(' • ') : 'Analyzing...';
        el.style.color = props.length > 0 ? 'var(--highlight-blue)' : 'var(--gray-400)';
    }

    /**
     * Update models status display
     */
    updateModelsStatus(models) {
        const el = document.getElementById('aiModels');
        if (!el || !models) return;

        const loaded = Object.values(models).filter(m => m.loaded).length;
        const total = Object.keys(models).length;

        el.textContent = `${loaded}/${total}`;
        el.style.color = loaded === total ? 'var(--success-green)' : 'var(--warning-amber)';
    }

    /**
     * Update learned count display
     */
    updateLearnedCount(count) {
        const el = document.getElementById('learnedCount');
        if (el) {
            el.textContent = count;
        }
    }

    /**
     * FPS Counter
     */
    startFPSCounter() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 0;

        const update = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                fps = frameCount;
                const el = document.getElementById('fpsValue');
                if (el) {
                    el.textContent = fps;
                    el.style.color = fps >= 30 ? 'var(--success-green)' : 'var(--warning-amber)';
                }
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(update);
        };

        update();
    }

    /**
     * Get app status
     */
    getStatus() {
        return {
            version: this.version,
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            memory: window.memoryManager?.getStats(),
            state: window.stateManager?.getSnapshot(),
            workers: window.workerManager?.getStats(),
            lazyLoader: window.lazyLoader?.getStats()
        };
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        console.log('[OSAI] Cleaning up...');

        // Stop worker manager
        if (window.workerManager) {
            window.workerManager.terminate();
        }

        // Clear memory manager
        if (window.memoryManager) {
            window.memoryManager.cleanupAll();
        }

        // Save state
        if (window.stateManager) {
            window.stateManager.persistState();
        }

        console.log('[OSAI] Cleanup complete');
    }
}

// Initialize app when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.osaiApp = new OSAIApp();
        await window.osaiApp.init();
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.osaiApp) {
            window.osaiApp.cleanup();
        }
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OSAIApp;
}
