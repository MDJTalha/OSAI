/**
 * Error Boundary & Global Error Handler
 * Catches and handles errors gracefully across all modules
 * - Prevents app crashes
 * - Logs errors for debugging
 * - Shows user-friendly error messages
 * - Auto-recovery where possible
 */

class ErrorBoundary {
    constructor() {
        this.errorHistory = [];
        this.maxErrors = 50;
        this.isInitialized = false;
        this.recoveryHandlers = new Map();
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Global error handler
        window.addEventListener('error', (e) => this.handleGlobalError(e));
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => this.handlePromiseRejection(e));
        
        // Page unload cleanup
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // Visibility change (pause heavy operations when tab hidden)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        this.isInitialized = true;
        console.log('[ErrorBoundary] Initialized');
    }

    /**
     * Handle global JavaScript errors
     */
    handleGlobalError(event) {
        event.preventDefault();
        
        const errorInfo = {
            type: 'javascript',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: Date.now()
        };
        
        this.logError(errorInfo);
        this.showUserError(errorInfo);
        this.attemptRecovery(errorInfo);
    }

    /**
     * Handle unhandled promise rejections
     */
    handlePromiseRejection(event) {
        event.preventDefault();
        
        const errorInfo = {
            type: 'promise',
            reason: event.reason,
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack,
            timestamp: Date.now()
        };
        
        this.logError(errorInfo);
        this.showUserError(errorInfo);
    }

    /**
     * Log error to history and console
     */
    logError(errorInfo) {
        this.errorHistory.unshift(errorInfo);
        
        // Limit history size
        if (this.errorHistory.length > this.maxErrors) {
            this.errorHistory.pop();
        }
        
        // Console logging with context
        console.error(`[ErrorBoundary] ${errorInfo.type.toUpperCase()}:`, errorInfo.message);
        if (errorInfo.stack) {
            console.error('[ErrorBoundary] Stack:', errorInfo.stack);
        }
        
        // Send to analytics (if implemented)
        this.sendToAnalytics(errorInfo);
    }

    /**
     * Show user-friendly error message
     */
    showUserError(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        
        // Use app's toast if available
        if (window.app?.showToast) {
            window.app.showToast(userMessage, 'error');
        } else {
            // Fallback toast
            this.showFallbackToast(userMessage);
        }
    }

    /**
     * Convert technical error to user-friendly message
     */
    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';
        
        // Camera errors
        if (message.includes('camera') || message.includes('permission')) {
            return 'Camera access denied. Please enable camera permissions in your browser settings.';
        }
        
        // Network errors
        if (message.includes('network') || message.includes('fetch') || message.includes('load')) {
            return 'Network error. Please check your internet connection.';
        }
        
        // Memory errors
        if (message.includes('memory') || message.includes('allocation')) {
            return 'Low memory. Please close other tabs and refresh the page.';
        }
        
        // Model loading errors
        if (message.includes('model') || message.includes('tensorflow') || message.includes('opencv')) {
            return 'AI model loading failed. Some features may be unavailable.';
        }
        
        // Generic error
        return 'Something went wrong. The app will try to recover automatically.';
    }

    /**
     * Fallback toast notification
     */
    showFallbackToast(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #EF4444;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Attempt automatic recovery
     */
    attemptRecovery(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';
        
        // Camera stream errors - try to restart camera
        if (message.includes('stream') || message.includes('track')) {
            this.recoverCamera();
        }
        
        // Canvas errors - try to reinitialize
        if (message.includes('canvas') || message.includes('context')) {
            this.recoverCanvas();
        }
        
        // Module-specific recovery
        if (this.recoveryHandlers.has(errorInfo.type)) {
            this.recoveryHandlers.get(errorInfo.type)(errorInfo);
        }
    }

    /**
     * Recover camera stream
     */
    async recoverCamera() {
        console.log('[ErrorBoundary] Attempting camera recovery...');
        
        try {
            if (window.cameraModule?.stopCamera) {
                await window.cameraModule.stopCamera();
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.cameraModule?.startCamera) {
                await window.cameraModule.startCamera();
                this.showToast('Camera recovered successfully', 'success');
            }
        } catch (error) {
            console.error('[ErrorBoundary] Camera recovery failed:', error);
            this.showToast('Camera recovery failed. Please refresh the page.', 'error');
        }
    }

    /**
     * Recover canvas context
     */
    recoverCanvas() {
        console.log('[ErrorBoundary] Attempting canvas recovery...');
        
        try {
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.reset();
                }
            });
            
            this.showToast('Canvas recovered', 'success');
        } catch (error) {
            console.error('[ErrorBoundary] Canvas recovery failed:', error);
        }
    }

    /**
     * Register recovery handler for specific error types
     */
    registerRecoveryHandler(errorType, handler) {
        this.recoveryHandlers.set(errorType, handler);
    }

    /**
     * Execute function with error boundary protection
     */
    async execute(fn, context = null, fallback = null) {
        try {
            return await fn.call(context);
        } catch (error) {
            this.logError({
                type: 'execution',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
            
            if (typeof fallback === 'function') {
                return fallback.call(context, error);
            }
            
            return null;
        }
    }

    /**
     * Wrap module initialization with error handling
     */
    async initModule(moduleName, initFn) {
        try {
            console.log(`[ErrorBoundary] Initializing ${moduleName}...`);
            const result = await initFn();
            console.log(`[ErrorBoundary] ${moduleName} initialized successfully`);
            return result;
        } catch (error) {
            this.logError({
                type: 'module_init',
                module: moduleName,
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
            
            this.showToast(`${moduleName} failed to initialize. Some features may be unavailable.`, 'warning');
            return null;
        }
    }

    /**
     * Handle visibility change (pause heavy operations)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[ErrorBoundary] Tab hidden - pausing heavy operations');
            // Could pause auto-detection, reduce FPS, etc.
        } else {
            console.log('[ErrorBoundary] Tab visible - resuming operations');
            // Resume operations
        }
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        console.log('[ErrorBoundary] Cleaning up...');
        
        // Save error history to localStorage
        try {
            localStorage.setItem('osai_errors', JSON.stringify(
                this.errorHistory.slice(0, 10)
            ));
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Load error history from localStorage
     */
    loadErrorHistory() {
        try {
            const stored = localStorage.getItem('osai_errors');
            if (stored) {
                this.errorHistory = JSON.parse(stored);
            }
        } catch (e) {
            console.error('[ErrorBoundary] Failed to load error history:', e);
        }
    }

    /**
     * Send error to analytics service
     */
    sendToAnalytics(errorInfo) {
        // Placeholder for analytics integration
        // Could send to Sentry, LogRocket, custom backend, etc.
        if (window.analytics) {
            window.analytics.track('error', errorInfo);
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const now = Date.now();
        const lastHour = now - 3600000;
        const lastDay = now - 86400000;
        
        return {
            total: this.errorHistory.length,
            lastHour: this.errorHistory.filter(e => e.timestamp > lastHour).length,
            lastDay: this.errorHistory.filter(e => e.timestamp > lastDay).length,
            byType: this.errorHistory.reduce((acc, e) => {
                acc[e.type] = (acc[e.type] || 0) + 1;
                return acc;
            }, {})
        };
    }

    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
        localStorage.removeItem('osai_errors');
    }

    /**
     * Show toast using app or fallback
     */
    showToast(message, type = 'info') {
        if (window.app?.showToast) {
            window.app.showToast(message, type);
        } else {
            this.showFallbackToast(message);
        }
    }
}

// Initialize global error boundary
window.errorBoundary = new ErrorBoundary();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
}
