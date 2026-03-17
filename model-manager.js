/**
 * AI Model Manager
 * Centralized management for all AI/ML models
 * 
 * Solves:
 * - Race conditions in model loading
 * - Multiple redundant model loads
 * - No model loading verification
 * - State not updated
 * - Error handling missing
 * 
 * Models Managed:
 * - TensorFlow.js
 * - COCO-SSD (Object Detection)
 * - MobileNet (Classification)
 * - OpenCV.js (Computer Vision)
 * - Tesseract.js (OCR)
 * - jsQR (Barcode/QR)
 */

class AIModelManager {
    constructor() {
        this.models = {
            tensorflow: { loaded: false, loading: false, error: null, instance: null },
            cocoSsd: { loaded: false, loading: false, error: null, instance: null },
            mobilenet: { loaded: false, loading: false, error: null, instance: null },
            openCV: { loaded: false, loading: false, error: null, instance: null },
            tesseract: { loaded: false, loading: false, error: null, instance: null },
            jsQR: { loaded: false, loading: false, error: null, instance: null }
        };
        
        this.loadingCallbacks = {};
        this.isInitialized = false;
        this.loadAttempts = {};
        
        this.init();
    }

    /**
     * Initialize model manager
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('[ModelManager] Initializing...');
        
        // Setup OpenCV callback (single source of truth)
        this.setupOpenCvCallback();
        
        // Start loading all models
        await this.loadAllModels();
        
        this.isInitialized = true;
        console.log('[ModelManager] Initialization complete');
    }

    /**
     * Setup single OpenCV callback
     */
    setupOpenCvCallback() {
        window.onOpenCvReady = () => {
            console.log('[ModelManager] OpenCV.js ready');
            this.models.openCV.loaded = true;
            this.models.openCV.instance = window.cv;
            this.models.openCV.loading = false;
            
            // Notify all listeners
            window.dispatchEvent(new CustomEvent('opencv-ready', {
                detail: { cv: window.cv }
            }));
            
            this.updateUI();
        };
    }

    /**
     * Load all models
     */
    async loadAllModels() {
        console.log('[ModelManager] Loading all models...');
        
        const promises = [
            this.loadTensorFlow(),
            this.loadCocoSsd(),
            this.loadMobileNet(),
            this.loadOpenCV(),
            this.loadTesseract(),
            this.loadJsQR()
        ];
        
        try {
            await Promise.allSettled(promises);
            this.updateUI();
            
            const loaded = Object.values(this.models).filter(m => m.loaded).length;
            console.log(`[ModelManager] Loaded ${loaded}/6 models`);
            
        } catch (error) {
            console.error('[ModelManager] Some models failed to load:', error);
        }
    }

    /**
     * Load TensorFlow.js
     */
    async loadTensorFlow() {
        if (this.models.tensorflow.loaded) return this.models.tensorflow.instance;
        if (this.models.tensorflow.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.tensorflow = this.loadingCallbacks.tensorflow || [];
                this.loadingCallbacks.tensorflow.push(resolve);
            });
        }

        this.models.tensorflow.loading = true;
        this.loadAttempts.tensorflow = (this.loadAttempts.tensorflow || 0) + 1;

        try {
            // Wait for TensorFlow to be available (loaded via CDN)
            await this.waitForGlobal('tf', 10000);
            
            this.models.tensorflow.instance = window.tf;
            this.models.tensorflow.loaded = true;
            this.models.tensorflow.loading = false;
            
            console.log('[ModelManager] TensorFlow.js loaded');
            
            // Resolve callbacks
            if (this.loadingCallbacks.tensorflow) {
                this.loadingCallbacks.tensorflow.forEach(cb => cb(this.models.tensorflow.instance));
            }
            
            return this.models.tensorflow.instance;
            
        } catch (error) {
            console.error('[ModelManager] TensorFlow.js load error:', error);
            this.models.tensorflow.error = error.message;
            this.models.tensorflow.loading = false;
            
            // Retry once
            if (this.loadAttempts.tensorflow < 2) {
                console.log('[ModelManager] Retrying TensorFlow.js...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadTensorFlow();
            }
            
            throw error;
        }
    }

    /**
     * Load COCO-SSD
     */
    async loadCocoSsd() {
        if (this.models.cocoSsd.loaded) return this.models.cocoSsd.instance;
        if (this.models.cocoSsd.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.cocoSsd = this.loadingCallbacks.cocoSsd || [];
                this.loadingCallbacks.cocoSsd.push(resolve);
            });
        }

        this.models.cocoSsd.loading = true;
        this.loadAttempts.cocoSsd = (this.loadAttempts.cocoSsd || 0) + 1;

        try {
            // Wait for cocoSsd to be available (loaded via CDN)
            await this.waitForGlobal('cocoSsd', 10000);
            
            // Load the model
            this.models.cocoSsd.instance = await cocoSsd.load();
            this.models.cocoSsd.loaded = true;
            this.models.cocoSsd.loading = false;
            
            console.log('[ModelManager] COCO-SSD loaded');
            
            // Resolve callbacks
            if (this.loadingCallbacks.cocoSsd) {
                this.loadingCallbacks.cocoSsd.forEach(cb => cb(this.models.cocoSsd.instance));
            }
            
            this.updateUI();
            return this.models.cocoSsd.instance;
            
        } catch (error) {
            console.error('[ModelManager] COCO-SSD load error:', error);
            this.models.cocoSsd.error = error.message;
            this.models.cocoSsd.loading = false;
            
            // Retry once
            if (this.loadAttempts.cocoSsd < 2) {
                console.log('[ModelManager] Retrying COCO-SSD...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadCocoSsd();
            }
            
            throw error;
        }
    }

    /**
     * Load MobileNet
     */
    async loadMobileNet() {
        if (this.models.mobilenet.loaded) return this.models.mobilenet.instance;
        if (this.models.mobilenet.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.mobilenet = this.loadingCallbacks.mobilenet || [];
                this.loadingCallbacks.mobilenet.push(resolve);
            });
        }

        this.models.mobilenet.loading = true;
        this.loadAttempts.mobilenet = (this.loadAttempts.mobilenet || 0) + 1;

        try {
            // Wait for mobilenet to be available (loaded via CDN)
            await this.waitForGlobal('mobilenet', 10000);
            
            // Load the model
            this.models.mobilenet.instance = await mobilenet.load();
            this.models.mobilenet.loaded = true;
            this.models.mobilenet.loading = false;
            
            console.log('[ModelManager] MobileNet loaded');
            
            // Resolve callbacks
            if (this.loadingCallbacks.mobilenet) {
                this.loadingCallbacks.mobilenet.forEach(cb => cb(this.models.mobilenet.instance));
            }
            
            this.updateUI();
            return this.models.mobilenet.instance;
            
        } catch (error) {
            console.error('[ModelManager] MobileNet load error:', error);
            this.models.mobilenet.error = error.message;
            this.models.mobilenet.loading = false;
            
            // Retry once
            if (this.loadAttempts.mobilenet < 2) {
                console.log('[ModelManager] Retrying MobileNet...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadMobileNet();
            }
            
            throw error;
        }
    }

    /**
     * Load OpenCV.js
     */
    async loadOpenCV() {
        if (this.models.openCV.loaded) return this.models.openCV.instance;
        if (this.models.openCV.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.openCV = this.loadingCallbacks.openCV || [];
                this.loadingCallbacks.openCV.push(resolve);
            });
        }

        this.models.openCV.loading = true;

        // OpenCV loads via CDN with onload callback
        // We already setup the callback in setupOpenCvCallback()
        
        // Wait for OpenCV to be ready
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.models.openCV.loading = false;
                this.models.openCV.error = 'Timeout waiting for OpenCV';
                reject(new Error('OpenCV.js load timeout'));
            }, 30000);
            
            const checkReady = () => {
                if (this.models.openCV.loaded) {
                    clearTimeout(timeout);
                    resolve(this.models.openCV.instance);
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            checkReady();
        });
    }

    /**
     * Load Tesseract.js
     */
    async loadTesseract() {
        if (this.models.tesseract.loaded) return this.models.tesseract.instance;
        if (this.models.tesseract.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.tesseract = this.loadingCallbacks.tesseract || [];
                this.loadingCallbacks.tesseract.push(resolve);
            });
        }

        this.models.tesseract.loading = true;
        this.loadAttempts.tesseract = (this.loadAttempts.tesseract || 0) + 1;

        try {
            // Wait for Tesseract to be available (loaded via CDN)
            await this.waitForGlobal('Tesseract', 10000);
            
            this.models.tesseract.instance = window.Tesseract;
            this.models.tesseract.loaded = true;
            this.models.tesseract.loading = false;
            
            console.log('[ModelManager] Tesseract.js loaded');
            
            // Resolve callbacks
            if (this.loadingCallbacks.tesseract) {
                this.loadingCallbacks.tesseract.forEach(cb => cb(this.models.tesseract.instance));
            }
            
            this.updateUI();
            return this.models.tesseract.instance;
            
        } catch (error) {
            console.error('[ModelManager] Tesseract.js load error:', error);
            this.models.tesseract.error = error.message;
            this.models.tesseract.loading = false;
            
            // Retry once
            if (this.loadAttempts.tesseract < 2) {
                console.log('[ModelManager] Retrying Tesseract.js...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadTesseract();
            }
            
            throw error;
        }
    }

    /**
     * Load jsQR
     */
    async loadJsQR() {
        if (this.models.jsQR.loaded) return this.models.jsQR.instance;
        if (this.models.jsQR.loading) {
            return new Promise(resolve => {
                this.loadingCallbacks.jsQR = this.loadingCallbacks.jsQR || [];
                this.loadingCallbacks.jsQR.push(resolve);
            });
        }

        this.models.jsQR.loading = true;
        this.loadAttempts.jsQR = (this.loadAttempts.jsQR || 0) + 1;

        try {
            // Wait for jsQR to be available (loaded via CDN)
            await this.waitForGlobal('jsQR', 10000);
            
            this.models.jsQR.instance = window.jsQR;
            this.models.jsQR.loaded = true;
            this.models.jsQR.loading = false;
            
            console.log('[ModelManager] jsQR loaded');
            
            // Resolve callbacks
            if (this.loadingCallbacks.jsQR) {
                this.loadingCallbacks.jsQR.forEach(cb => cb(this.models.jsQR.instance));
            }
            
            this.updateUI();
            return this.models.jsQR.instance;
            
        } catch (error) {
            console.error('[ModelManager] jsQR load error:', error);
            this.models.jsQR.error = error.message;
            this.models.jsQR.loading = false;
            
            // Retry once
            if (this.loadAttempts.jsQR < 2) {
                console.log('[ModelManager] Retrying jsQR...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadJsQR();
            }
            
            throw error;
        }
    }

    /**
     * Wait for global variable to be available
     */
    async waitForGlobal(varName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (window[varName]) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for ${varName}`));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    /**
     * Update UI with model status
     */
    updateUI() {
        // Update state manager
        if (window.stateManager) {
            Object.entries(this.models).forEach(([name, model]) => {
                window.stateManager.setModelStatus(name, {
                    loaded: model.loaded,
                    loading: model.loading,
                    error: model.error
                });
            });
        }
        
        // Update AI Models display
        const el = document.getElementById('aiModels');
        if (el) {
            const loaded = Object.values(this.models).filter(m => m.loaded).length;
            const total = Object.keys(this.models).length;
            
            el.textContent = `${loaded}/${total}`;
            
            if (loaded === total) {
                el.style.color = 'var(--success-green, #10B981)';
            } else if (loaded > 0) {
                el.style.color = 'var(--warning-amber, #F59E0B)';
            } else {
                el.style.color = 'var(--text-secondary, #D1D5DB)';
            }
        }
        
        // Show toast when all models loaded
        const allLoaded = Object.values(this.models).every(m => m.loaded);
        if (allLoaded && window.app?.showToast) {
            window.app.showToast('All AI models loaded successfully!', 'success');
        }
    }

    /**
     * Get model status
     */
    getModelStatus(modelName) {
        return this.models[modelName] || null;
    }

    /**
     * Get all model statuses
     */
    getAllStatuses() {
        return {
            models: this.models,
            allLoaded: Object.values(this.models).every(m => m.loaded),
            loadedCount: Object.values(this.models).filter(m => m.loaded).length,
            totalCount: Object.keys(this.models).length
        };
    }

    /**
     * Get specific model instance
     */
    getModel(modelName) {
        if (!this.models[modelName].loaded) {
            throw new Error(`Model ${modelName} not loaded`);
        }
        return this.models[modelName].instance;
    }

    /**
     * Check if model is ready
     */
    isModelReady(modelName) {
        return this.models[modelName]?.loaded || false;
    }

    /**
     * Wait for specific model
     */
    async waitForModel(modelName, timeout = 30000) {
        if (this.models[modelName].loaded) {
            return this.models[modelName].instance;
        }
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (this.models[modelName].loaded) {
                    resolve(this.models[modelName].instance);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for ${modelName}`));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
}

// Initialize global model manager
window.aiModelManager = new AIModelManager();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for CDN scripts to load
        setTimeout(() => {
            window.aiModelManager.init();
        }, 500);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelManager;
}
