/**
 * StateManager Module Tests
 * @jest-environment jsdom
 */

describe('StateManager', () => {
    let stateManager;

    beforeEach(() => {
        // Clear previous instance and localStorage
        localStorage.clear();
        delete window.stateManager;
        
        // Import fresh module
        require('./state-manager');
        stateManager = window.stateManager;
        
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default state', () => {
            expect(stateManager).toBeDefined();
            expect(stateManager.state).toBeDefined();
            expect(stateManager.state.config).toBeDefined();
            expect(stateManager.state.camera).toBeDefined();
            expect(stateManager.state.models).toBeDefined();
        });

        test('should load persisted state from localStorage', () => {
            const persistedState = {
                config: { units: 'inches', precision: 3 },
                measurement: { isCalibrated: true, calibrationData: { value: 10 } }
            };
            
            localStorage.setItem('osai_state', JSON.stringify(persistedState));
            
            // Reinitialize to trigger load
            const NewStateManager = require('./state-manager');
            const newStateManager = window.stateManager;
            
            expect(newStateManager.get('config.units')).toBe('inches');
            expect(newStateManager.get('config.precision')).toBe(3);
            expect(newStateManager.get('measurement.isCalibrated')).toBe(true);
        });
    });

    describe('Get State', () => {
        test('should get state value by path', () => {
            const value = stateManager.get('config.units');
            expect(value).toBe('cm');
        });

        test('should get nested state value', () => {
            const value = stateManager.get('models.cocoSsd.loaded');
            expect(value).toBe(false);
        });

        test('should return default value for non-existent path', () => {
            const value = stateManager.get('nonexistent.path', 'default');
            expect(value).toBe('default');
        });

        test('should return null for non-existent path without default', () => {
            const value = stateManager.get('nonexistent.path');
            expect(value).toBeNull();
        });
    });

    describe('Set State', () => {
        test('should set state value by path', () => {
            stateManager.set('config.units', 'inches');
            expect(stateManager.get('config.units')).toBe('inches');
        });

        test('should set nested state value', () => {
            stateManager.set('models.cocoSsd.loaded', true);
            expect(stateManager.get('models.cocoSsd.loaded')).toBe(true);
        });

        test('should notify listeners on state change', () => {
            const listener = jest.fn();
            stateManager.subscribe('config.units', listener);
            
            stateManager.set('config.units', 'inches');
            
            expect(listener).toHaveBeenCalledWith('inches', 'cm', 'config.units');
        });

        test('should not notify listeners when silent option is set', () => {
            const listener = jest.fn();
            stateManager.subscribe('config.units', listener);
            
            stateManager.set('config.units', 'inches', { silent: true });
            
            expect(listener).not.toHaveBeenCalled();
        });

        test('should persist state when persist option is set', () => {
            const setItemSpy = jest.spyOn(localStorage, 'setItem');
            
            stateManager.set('config.units', 'inches', { persist: true });
            
            expect(setItemSpy).toHaveBeenCalledWith('osai_state', expect.any(String));
        });

        test('should save to history when history option is set', () => {
            stateManager.set('config.units', 'inches', { history: true });
            
            expect(stateManager.state.history.past.length).toBeGreaterThan(0);
            expect(stateManager.state.history.past[0].path).toBe('config');
        });
    });

    describe('Batch Updates', () => {
        test('should update multiple state values at once', () => {
            const listener = jest.fn();
            stateManager.subscribe('*', listener);
            
            stateManager.batch([
                { path: 'config.units', value: 'inches' },
                { path: 'config.precision', value: 3 },
                { path: 'ui.loading', value: true }
            ]);
            
            expect(stateManager.get('config.units')).toBe('inches');
            expect(stateManager.get('config.precision')).toBe(3);
            expect(stateManager.get('ui.loading')).toBe(true);
        });
    });

    describe('Subscription', () => {
        test('should subscribe to state changes', () => {
            const listener = jest.fn();
            const unsubscribe = stateManager.subscribe('config.units', listener);
            
            stateManager.set('config.units', 'inches');
            
            expect(listener).toHaveBeenCalled();
            
            unsubscribe();
            
            stateManager.set('config.units', 'cm');
            
            // Should not be called again after unsubscribe
            expect(listener.mock.calls.length).toBe(1);
        });

        test('should subscribe to wildcard path', () => {
            const listener = jest.fn();
            stateManager.subscribe('*', listener);
            
            stateManager.set('config.units', 'inches');
            stateManager.set('ui.loading', true);
            
            expect(listener.mock.calls.length).toBe(2);
        });

        test('should handle listener errors gracefully', () => {
            const errorListener = jest.fn().mockImplementation(() => {
                throw new Error('Listener error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            stateManager.subscribe('config.units', errorListener);
            
            expect(() => {
                stateManager.set('config.units', 'inches');
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('Undo/Redo', () => {
        test('should save state to history', () => {
            stateManager.set('config.units', 'inches', { history: true });
            
            expect(stateManager.state.history.past.length).toBe(1);
            expect(stateManager.state.history.future.length).toBe(0);
        });

        test('should undo state change', () => {
            stateManager.set('config.units', 'inches', { history: true });
            stateManager.set('config.units', 'mm', { history: true });
            
            const result = stateManager.undo();
            
            expect(result).toBe(true);
            expect(stateManager.get('config.units')).toBe('inches');
        });

        test('should redo state change', () => {
            stateManager.set('config.units', 'inches', { history: true });
            stateManager.undo();
            
            const result = stateManager.redo();
            
            expect(result).toBe(true);
            expect(stateManager.get('config.units')).toBe('cm'); // cm is default
        });

        test('should return false when nothing to undo', () => {
            const result = stateManager.undo();
            expect(result).toBe(false);
        });

        test('should return false when nothing to redo', () => {
            const result = stateManager.redo();
            expect(result).toBe(false);
        });

        test('should clear future on new action', () => {
            stateManager.set('config.units', 'inches', { history: true });
            stateManager.undo();
            stateManager.set('config.units', 'mm', { history: true });
            
            expect(stateManager.state.history.future.length).toBe(0);
        });
    });

    describe('UI Helpers', () => {
        test('should set loading state', () => {
            stateManager.setLoading(true, 'Loading...');
            
            expect(stateManager.get('ui.loading')).toBe(true);
            expect(stateManager.get('ui.loadingMessage')).toBe('Loading...');
        });

        test('should update detection items', () => {
            const items = [
                { id: 1, class: 'person', confidence: 0.9 },
                { id: 2, class: 'car', confidence: 0.85 }
            ];
            
            stateManager.setDetectionItems(items);
            
            expect(stateManager.get('detection.items')).toEqual(items);
            expect(stateManager.get('detection.lastDetection')).toBeDefined();
        });

        test('should add measurement to history', () => {
            const measurement = { length: 10, width: 5, area: 50 };
            
            stateManager.addMeasurement(measurement);
            
            expect(stateManager.get('measurement.measurements').length).toBe(1);
            expect(stateManager.get('measurement.measurements')[0]).toEqual(measurement);
        });

        test('should update model status', () => {
            stateManager.setModelStatus('cocoSsd', { loaded: true, error: null });
            
            expect(stateManager.get('models.cocoSsd.loaded')).toBe(true);
        });
    });

    describe('Computed State', () => {
        test('should compute allModelsLoaded', () => {
            stateManager.setModelStatus('cocoSsd', { loaded: true });
            stateManager.setModelStatus('mobilenet', { loaded: true });
            stateManager.setModelStatus('openCV', { loaded: true });
            stateManager.setModelStatus('tesseract', { loaded: true });
            
            const result = stateManager.getComputed('allModelsLoaded');
            expect(result).toBe(true);
        });

        test('should compute detectionCount', () => {
            stateManager.setDetectionItems([
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]);
            
            const result = stateManager.getComputed('detectionCount');
            expect(result).toBe(3);
        });

        test('should return null for unknown computed key', () => {
            const result = stateManager.getComputed('unknown');
            expect(result).toBeNull();
        });
    });

    describe('Reset', () => {
        test('should reset state to defaults', () => {
            stateManager.set('config.units', 'inches');
            stateManager.set('ui.loading', true);
            
            stateManager.reset();
            
            expect(stateManager.get('config.units')).toBe('cm');
            expect(stateManager.get('ui.loading')).toBe(false);
        });

        test('should clear persisted state on reset', () => {
            localStorage.setItem('osai_state', JSON.stringify({ config: { units: 'inches' } }));
            
            stateManager.reset();
            
            expect(localStorage.getItem('osai_state')).toBeNull();
        });
    });

    describe('Snapshot', () => {
        test('should return state snapshot', () => {
            const snapshot = stateManager.getSnapshot();
            
            expect(snapshot).toEqual(stateManager.state);
            expect(snapshot).not.toBe(stateManager.state); // Different reference
        });
    });
});
