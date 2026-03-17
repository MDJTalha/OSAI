/**
 * Centralized State Management Module
 * - Single source of truth for app state
 * - Reactive state updates
 * - State persistence
 * - Undo/redo support
 */

class StateManager {
    constructor() {
        this.state = {
            // App configuration
            config: {
                units: 'cm',
                precision: 2,
                autoDetection: true,
                deepLearning: true,
                confidenceThreshold: 0.5,
                nightVision: false,
                fps: 30
            },
            
            // Camera state
            camera: {
                active: false,
                facingMode: 'environment',
                flash: false,
                stream: null,
                error: null
            },
            
            // AI Models state
            models: {
                cocoSsd: { loaded: false, loading: false, error: null },
                mobilenet: { loaded: false, loading: false, error: null },
                openCV: { loaded: false, loading: false, error: null },
                tesseract: { loaded: false, loading: false, error: null }
            },
            
            // Detection state
            detection: {
                items: [],
                lastDetection: null,
                isDetecting: false,
                autoDetectionRunning: false
            },
            
            // Measurement state
            measurement: {
                isCalibrated: false,
                calibrationData: null,
                measurements: [],
                isMeasuring: false,
                points: []
            },
            
            // Memory/Learning state
            memory: {
                learnedObjects: 0,
                locations: new Map(),
                lastSync: null
            },
            
            // UI state
            ui: {
                loading: false,
                loadingMessage: '',
                activePanel: null,
                toast: null,
                theme: 'dark'
            },
            
            // History
            history: {
                past: [],
                future: [],
                maxSize: 50
            }
        };
        
        this.listeners = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.loadPersistedState();
        this.setupStorageListener();
        this.isInitialized = true;
        
        console.log('[StateManager] Initialized');
    }

    /**
     * Get state value by path
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value === undefined || value === null) {
                return defaultValue;
            }
            value = value[key];
        }
        
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Set state value by path
     */
    set(path, value, options = {}) {
        const { silent = false, persist = false, history = false } = options;
        
        const keys = path.split('.');
        let current = this.state;
        
        // Navigate to parent
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        // Save to history if requested
        if (history) {
            this.saveToHistory(path, current[keys[keys.length - 1]]);
        }
        
        // Set value
        const oldValue = current[keys[keys.length - 1]];
        current[keys[keys.length - 1]] = value;
        
        // Persist if requested
        if (persist) {
            this.persistState();
        }
        
        // Notify listeners
        if (!silent) {
            this.notifyListeners(path, value, oldValue);
        }
        
        return true;
    }

    /**
     * Batch update multiple state values
     */
    batch(updates) {
        const silent = true;
        
        updates.forEach(({ path, value, persist, history }) => {
            this.set(path, value, { silent, persist, history });
        });
        
        // Single notification for all changes
        this.notifyListeners('*', updates);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.get(path)?.delete(callback);
        };
    }

    /**
     * Notify listeners of state change
     */
    notifyListeners(path, newValue, oldValue) {
        const paths = ['*', path];
        
        // Also notify parent paths
        const parts = path.split('.');
        for (let i = 1; i < parts.length; i++) {
            paths.push(parts.slice(0, i).join('.'));
        }
        
        paths.forEach(p => {
            this.listeners.get(p)?.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('[StateManager] Listener error:', error);
                }
            });
        });
    }

    /**
     * Save state to history for undo
     */
    saveToHistory(path, oldValue) {
        const history = this.state.history;
        
        history.past.push({
            path,
            value: oldValue,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (history.past.length > history.maxSize) {
            history.past.shift();
        }
        
        // Clear future (new action branches history)
        history.future = [];
        
        this.notifyListeners('history', history);
    }

    /**
     * Undo last action
     */
    undo() {
        const { past, future } = this.state.history;
        
        if (past.length === 0) {
            return false;
        }
        
        const lastAction = past.pop();
        const currentValue = this.get(lastAction.path);
        
        // Save current to future for redo
        future.push({
            path: lastAction.path,
            value: currentValue,
            timestamp: Date.now()
        });
        
        // Restore old value
        this.set(lastAction.path, lastAction.value, { silent: true });
        
        this.notifyListeners('history', { past, future });
        
        console.log('[StateManager] Undid:', lastAction.path);
        return true;
    }

    /**
     * Redo last undone action
     */
    redo() {
        const { past, future } = this.state.history;
        
        if (future.length === 0) {
            return false;
        }
        
        const nextAction = future.pop();
        const currentValue = this.get(nextAction.path);
        
        // Save current to past
        past.push({
            path: nextAction.path,
            value: currentValue,
            timestamp: Date.now()
        });
        
        // Restore value
        this.set(nextAction.path, nextAction.value, { silent: true });
        
        this.notifyListeners('history', { past, future });
        
        console.log('[StateManager] Redid:', nextAction.path);
        return true;
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const toPersist = {
                config: this.state.config,
                measurement: {
                    isCalibrated: this.state.measurement.isCalibrated,
                    calibrationData: this.state.measurement.calibrationData
                },
                memory: {
                    learnedObjects: this.state.memory.learnedObjects
                },
                lastUpdated: Date.now()
            };
            
            localStorage.setItem('osai_state', JSON.stringify(toPersist));
        } catch (error) {
            console.error('[StateManager] Persist error:', error);
        }
    }

    /**
     * Load persisted state
     */
    loadPersistedState() {
        try {
            const stored = localStorage.getItem('osai_state');
            
            if (stored) {
                const parsed = JSON.parse(stored);
                
                // Merge with default state
                if (parsed.config) {
                    this.state.config = { ...this.state.config, ...parsed.config };
                }
                
                if (parsed.measurement) {
                    this.state.measurement.isCalibrated = parsed.measurement.isCalibrated || false;
                    this.state.measurement.calibrationData = parsed.measurement.calibrationData || null;
                }
                
                if (parsed.memory) {
                    this.state.memory.learnedObjects = parsed.memory.learnedObjects || 0;
                }
                
                console.log('[StateManager] Loaded persisted state');
            }
        } catch (error) {
            console.error('[StateManager] Load error:', error);
        }
    }

    /**
     * Setup storage event listener for cross-tab sync
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'osai_state') {
                console.log('[StateManager] State changed in another tab');
                this.loadPersistedState();
                this.notifyListeners('*', 'cross-tab-update');
            }
        });
    }

    /**
     * Reset state to defaults
     */
    reset() {
        const defaultState = {
            config: {
                units: 'cm',
                precision: 2,
                autoDetection: true,
                deepLearning: true,
                confidenceThreshold: 0.5,
                nightVision: false,
                fps: 30
            },
            camera: {
                active: false,
                facingMode: 'environment',
                flash: false,
                stream: null,
                error: null
            },
            models: {
                cocoSsd: { loaded: false, loading: false, error: null },
                mobilenet: { loaded: false, loading: false, error: null },
                openCV: { loaded: false, loading: false, error: null },
                tesseract: { loaded: false, loading: false, error: null }
            },
            detection: {
                items: [],
                lastDetection: null,
                isDetecting: false,
                autoDetectionRunning: false
            },
            measurement: {
                isCalibrated: false,
                calibrationData: null,
                measurements: [],
                isMeasuring: false,
                points: []
            },
            memory: {
                learnedObjects: 0,
                locations: new Map(),
                lastSync: null
            },
            ui: {
                loading: false,
                loadingMessage: '',
                activePanel: null,
                toast: null,
                theme: 'dark'
            },
            history: {
                past: [],
                future: [],
                maxSize: 50
            }
        };
        
        this.state = defaultState;
        this.notifyListeners('*', 'reset');
        localStorage.removeItem('osai_state');
        
        console.log('[StateManager] State reset');
    }

    /**
     * Get state snapshot
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Update UI loading state
     */
    setLoading(loading, message = '') {
        this.set('ui.loading', loading);
        this.set('ui.loadingMessage', message);
    }

    /**
     * Update detection items
     */
    setDetectionItems(items) {
        this.set('detection.items', items);
        this.set('detection.lastDetection', Date.now());
    }

    /**
     * Add measurement
     */
    addMeasurement(measurement) {
        const measurements = this.get('measurement.measurements');
        measurements.push(measurement);
        this.set('measurement.measurements', measurements, { history: true });
    }

    /**
     * Update model status
     */
    setModelStatus(modelName, status) {
        this.set(`models.${modelName}`, { ...this.get(`models.${modelName}`), ...status });
    }

    /**
     * Get computed state
     */
    getComputed(key) {
        switch (key) {
            case 'allModelsLoaded':
                return Object.values(this.state.models).every(m => m.loaded);
            
            case 'isReady':
                return this.state.camera.active && 
                       this.state.models.cocoSsd.loaded &&
                       this.state.models.openCV.loaded;
            
            case 'detectionCount':
                return this.state.detection.items.length;
            
            case 'measurementCount':
                return this.state.measurement.measurements.length;
            
            default:
                return null;
        }
    }
}

// Initialize global state manager
window.stateManager = new StateManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
