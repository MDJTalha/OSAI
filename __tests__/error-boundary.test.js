/**
 * ErrorBoundary Module Tests
 * @jest-environment jsdom
 */

describe('ErrorBoundary', () => {
    let errorBoundary;
    let ErrorBoundaryModule;

    beforeEach(async () => {
        // Clear previous module
        delete window.errorBoundary;
        
        // Import module
        ErrorBoundaryModule = require('./error-boundary');
        errorBoundary = window.errorBoundary;
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            expect(errorBoundary).toBeDefined();
            expect(errorBoundary.isInitialized).toBe(true);
        });

        test('should set up global error handlers', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            
            // Reinitialize to capture spy calls
            const NewErrorBoundary = require('./error-boundary');
            
            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });
    });

    describe('Error Handling', () => {
        test('should handle global JavaScript errors', () => {
            const logErrorSpy = jest.spyOn(errorBoundary, 'logError');
            const showUserErrorSpy = jest.spyOn(errorBoundary, 'showUserError');
            
            const mockError = new Error('Test error');
            const event = new ErrorEvent('error', {
                message: 'Test error',
                error: mockError,
                filename: 'test.js',
                lineno: 10,
                colno: 5
            });
            
            window.dispatchEvent(event);
            
            expect(logErrorSpy).toHaveBeenCalled();
            expect(showUserErrorSpy).toHaveBeenCalled();
        });

        test('should handle unhandled promise rejections', () => {
            const logErrorSpy = jest.spyOn(errorBoundary, 'logError');
            
            const mockReason = new Error('Promise failed');
            const event = new PromiseRejectionEvent('unhandledrejection', {
                promise: Promise.reject(mockReason),
                reason: mockReason
            });
            
            window.dispatchEvent(event);
            
            expect(logErrorSpy).toHaveBeenCalled();
        });

        test('should log errors to history', () => {
            const errorInfo = {
                type: 'javascript',
                message: 'Test error',
                timestamp: Date.now()
            };
            
            errorBoundary.logError(errorInfo);
            
            expect(errorBoundary.errorHistory.length).toBe(1);
            expect(errorBoundary.errorHistory[0].message).toBe('Test error');
        });

        test('should limit error history to maxErrors', () => {
            errorBoundary.maxErrors = 5;
            
            for (let i = 0; i < 10; i++) {
                errorBoundary.logError({
                    type: 'test',
                    message: `Error ${i}`,
                    timestamp: Date.now()
                });
            }
            
            expect(errorBoundary.errorHistory.length).toBe(5);
        });
    });

    describe('User-Friendly Messages', () => {
        test('should convert camera errors to user-friendly messages', () => {
            const errorInfo = {
                type: 'javascript',
                message: 'Camera permission denied',
                timestamp: Date.now()
            };
            
            const message = errorBoundary.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('Camera');
            expect(message).toContain('permission');
        });

        test('should convert network errors to user-friendly messages', () => {
            const errorInfo = {
                type: 'javascript',
                message: 'Network error: Failed to fetch',
                timestamp: Date.now()
            };
            
            const message = errorBoundary.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('Network');
            expect(message).toContain('connection');
        });

        test('should convert memory errors to user-friendly messages', () => {
            const errorInfo = {
                type: 'javascript',
                message: 'Out of memory',
                timestamp: Date.now()
            };
            
            const message = errorBoundary.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('memory');
        });

        test('should provide generic message for unknown errors', () => {
            const errorInfo = {
                type: 'unknown',
                message: 'Random error xyz',
                timestamp: Date.now()
            };
            
            const message = errorBoundary.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('Something went wrong');
        });
    });

    describe('Execute with Error Boundary', () => {
        test('should return result when function succeeds', async () => {
            const successFn = jest.fn().mockResolvedValue('success');
            
            const result = await errorBoundary.execute(successFn);
            
            expect(result).toBe('success');
            expect(successFn).toHaveBeenCalled();
        });

        test('should handle errors and return fallback', async () => {
            const failingFn = jest.fn().mockRejectedValue(new Error('Failed'));
            const fallbackFn = jest.fn().mockReturnValue('fallback');
            
            const result = await errorBoundary.execute(failingFn, null, fallbackFn);
            
            expect(result).toBe('fallback');
            expect(fallbackFn).toHaveBeenCalled();
            expect(fallbackFn).toHaveBeenCalledWith(expect.any(Error));
        });

        test('should return null when no fallback provided', async () => {
            const failingFn = jest.fn().mockRejectedValue(new Error('Failed'));
            
            const result = await errorBoundary.execute(failingFn);
            
            expect(result).toBeNull();
        });
    });

    describe('Module Initialization', () => {
        test('should successfully initialize module', async () => {
            const initFn = jest.fn().mockResolvedValue('module initialized');
            
            const result = await errorBoundary.initModule('TestModule', initFn);
            
            expect(result).toBe('module initialized');
            expect(initFn).toHaveBeenCalled();
        });

        test('should handle module initialization failure', async () => {
            const initFn = jest.fn().mockRejectedValue(new Error('Init failed'));
            const showToastSpy = jest.spyOn(errorBoundary, 'showToast');
            
            const result = await errorBoundary.initModule('TestModule', initFn);
            
            expect(result).toBeNull();
            expect(showToastSpy).toHaveBeenCalledWith(
                expect.stringContaining('failed to initialize'),
                'warning'
            );
        });
    });

    describe('Error Statistics', () => {
        test('should return error statistics', () => {
            const now = Date.now();
            
            errorBoundary.errorHistory = [
                { type: 'javascript', timestamp: now },
                { type: 'promise', timestamp: now - 1000 },
                { type: 'javascript', timestamp: now - 7200000 } // 2 hours ago
            ];
            
            const stats = errorBoundary.getErrorStats();
            
            expect(stats.total).toBe(3);
            expect(stats.lastHour).toBe(2);
            expect(stats.lastDay).toBe(3);
            expect(stats.byType.javascript).toBe(2);
            expect(stats.byType.promise).toBe(1);
        });
    });

    describe('Recovery', () => {
        test('should register recovery handlers', () => {
            const handler = jest.fn();
            errorBoundary.registerRecoveryHandler('camera', handler);
            
            expect(errorBoundary.recoveryHandlers.has('camera')).toBe(true);
        });

        test('should attempt camera recovery', async () => {
            window.cameraModule = {
                stopCamera: jest.fn().mockResolvedValue(),
                startCamera: jest.fn().mockResolvedValue()
            };
            
            await errorBoundary.recoverCamera();
            
            expect(window.cameraModule.stopCamera).toHaveBeenCalled();
            expect(window.cameraModule.startCamera).toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        test('should save error history on cleanup', () => {
            const setItemSpy = jest.spyOn(localStorage, 'setItem');
            
            errorBoundary.errorHistory = [
                { type: 'test', message: 'Error 1', timestamp: Date.now() }
            ];
            
            errorBoundary.cleanup();
            
            expect(setItemSpy).toHaveBeenCalledWith('osai_errors', expect.any(String));
        });

        test('should load error history from localStorage', () => {
            const errors = [
                { type: 'test', message: 'Stored error', timestamp: Date.now() }
            ];
            
            jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(errors));
            
            errorBoundary.loadErrorHistory();
            
            expect(errorBoundary.errorHistory.length).toBe(1);
            expect(errorBoundary.errorHistory[0].message).toBe('Stored error');
        });
    });
});
