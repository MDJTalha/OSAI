/**
 * Lazy Loading Module
 * On-demand loading of features and models
 * - Code splitting
 * - Model lazy loading
 * - Feature flags
 * - Progressive enhancement
 */

class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.featureFlags = {
            objectDetection: true,
            ocr: true,
            barcode: true,
            faceDetection: true,
            nightVision: true,
            arMeasurement: true,
            voiceCommands: true,
            damageDetection: false, // Beta
            scene3D: false, // Beta
            scan360: false // Beta
        };
        
        this.modelCache = new Map();
        this.cacheEnabled = true;
        this.maxCacheSize = 3; // Max models to cache
        
        this.init();
    }

    init() {
        // Load critical modules immediately
        this.loadCriticalModules();
        
        console.log('[LazyLoader] Initialized');
    }

    /**
     * Load critical modules immediately
     */
    async loadCriticalModules() {
        const criticalModules = [
            'state-manager',
            'error-boundary',
            'security-manager',
            'memory-manager'
        ];

        for (const module of criticalModules) {
            try {
                await this.loadModule(module);
            } catch (error) {
                console.error(`[LazyLoader] Failed to load critical module ${module}:`, error);
            }
        }
    }

    /**
     * Load a module on-demand
     */
    async loadModule(moduleName) {
        // Check if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Check if already loading
        if (this.loadingModules.has(moduleName)) {
            return this.loadingModules.get(moduleName);
        }

        // Start loading
        const loadPromise = this._loadScript(`${moduleName}.js`)
            .then(() => {
                const module = this._getModuleInstance(moduleName);
                this.loadedModules.set(moduleName, module);
                this.loadingModules.delete(moduleName);
                return module;
            })
            .catch(error => {
                this.loadingModules.delete(moduleName);
                throw error;
            });

        this.loadingModules.set(moduleName, loadPromise);
        return loadPromise;
    }

    /**
     * Load script dynamically
     */
    _loadScript(url) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log(`[LazyLoader] Loaded: ${url}`);
                resolve();
            };

            script.onerror = (error) => {
                console.error(`[LazyLoader] Failed to load: ${url}`);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Get module instance from window
     */
    _getModuleInstance(moduleName) {
        const className = this._getClassName(moduleName);
        return window[className] || null;
    }

    /**
     * Convert module name to class name
     */
    _getClassName(moduleName) {
        // Convert kebab-case to PascalCase
        return moduleName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') + 'Module';
    }

    /**
     * Load AI model on-demand
     */
    async loadModel(modelName) {
        // Check cache
        if (this.cacheEnabled && this.modelCache.has(modelName)) {
            console.log(`[LazyLoader] Model ${modelName} loaded from cache`);
            return this.modelCache.get(modelName);
        }

        switch (modelName) {
            case 'cocoSsd':
                return this._loadCocoSsd();
            
            case 'mobilenet':
                return this._loadMobileNet();
            
            case 'tesseract':
                return this._loadTesseract();
            
            case 'jsQR':
                return this._loadJsQR();
            
            default:
                throw new Error(`Unknown model: ${modelName}`);
        }
    }

    /**
     * Load COCO-SSD model
     */
    async _loadCocoSsd() {
        if (typeof cocoSsd === 'undefined') {
            await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@latest');
        }
        
        const model = await cocoSsd.load();
        this._cacheModel('cocoSsd', model);
        return model;
    }

    /**
     * Load MobileNet model
     */
    async _loadMobileNet() {
        if (typeof mobilenet === 'undefined') {
            await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest');
        }
        
        const model = await mobilenet.load();
        this._cacheModel('mobilenet', model);
        return model;
    }

    /**
     * Load Tesseract.js
     */
    async _loadTesseract() {
        if (typeof Tesseract === 'undefined') {
            await this._loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');
        }
        
        return Tesseract;
    }

    /**
     * Load jsQR
     */
    async _loadJsQR() {
        if (typeof jsQR === 'undefined') {
            await this._loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');
        }
        
        return jsQR;
    }

    /**
     * Cache model
     */
    _cacheModel(name, model) {
        if (!this.cacheEnabled) return;

        // Evict oldest if cache is full
        if (this.modelCache.size >= this.maxCacheSize) {
            const firstKey = this.modelCache.keys().next().value;
            this.modelCache.delete(firstKey);
        }

        this.modelCache.set(name, model);
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.featureFlags[featureName] === true;
    }

    /**
     * Enable/disable feature
     */
    setFeatureFlag(featureName, enabled) {
        this.featureFlags[featureName] = enabled;
        console.log(`[LazyLoader] Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Load feature module with flag check
     */
    async loadFeature(featureName) {
        if (!this.isFeatureEnabled(featureName)) {
            throw new Error(`Feature ${featureName} is disabled`);
        }

        const moduleMap = {
            objectDetection: 'object-detection',
            ocr: 'ocr',
            barcode: 'barcode-scanner',
            faceDetection: 'facial-expression',
            nightVision: 'night-vision',
            arMeasurement: 'measurement',
            voiceCommands: 'voice-commands',
            damageDetection: 'damage-detection',
            scene3D: 'scene-reconstruction-3d',
            scan360: 'scan360'
        };

        const moduleName = moduleMap[featureName];
        if (!moduleName) {
            throw new Error(`Unknown feature: ${featureName}`);
        }

        return this.loadModule(moduleName);
    }

    /**
     * Preload features in background
     */
    async preloadFeatures(featureNames) {
        const promises = featureNames.map(name => {
            return this.loadFeature(name).catch(error => {
                console.warn(`[LazyLoader] Preload failed for ${name}:`, error);
                return null;
            });
        });

        await Promise.all(promises);
    }

    /**
     * Get loading progress
     */
    getProgress() {
        const total = Object.keys(this.featureFlags).length;
        const loaded = Array.from(this.loadedModules.keys()).length;
        
        return {
            percentage: Math.round((loaded / total) * 100),
            loaded,
            total,
            modules: Array.from(this.loadedModules.keys())
        };
    }

    /**
     * Clear module cache
     */
    clearCache() {
        this.loadedModules.clear();
        this.loadingModules.clear();
        this.modelCache.clear();
    }

    /**
     * Unload a module
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
        this.modelCache.delete(moduleName);
        
        // Remove script from DOM
        const script = document.querySelector(`script[src="${moduleName}.js"]`);
        if (script) {
            script.remove();
        }
        
        console.log(`[LazyLoader] Unloaded: ${moduleName}`);
    }

    /**
     * Get module stats
     */
    getStats() {
        return {
            loadedModules: Array.from(this.loadedModules.keys()),
            loadingModules: Array.from(this.loadingModules.keys()),
            cachedModels: Array.from(this.modelCache.keys()),
            featureFlags: { ...this.featureFlags },
            cacheEnabled: this.cacheEnabled,
            cacheSize: this.modelCache.size,
            maxCacheSize: this.maxCacheSize
        };
    }
}

// Initialize global lazy loader
window.lazyLoader = new LazyLoader();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoader;
}
