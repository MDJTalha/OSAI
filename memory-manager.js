/**
 * Memory Management Module
 * - Prevents memory leaks
 * - Manages resource lifecycle
 * - Auto-cleanup on page unload
 * - Monitors memory usage
 */

class MemoryManager {
    constructor() {
        this.resources = new Map();
        this.intervals = new Map();
        this.timeouts = new Map();
        this.eventListeners = new Map();
        this.observers = new Map();
        this.streams = new Map();
        
        this.memoryThreshold = 0.85; // 85% usage triggers cleanup
        this.monitoringInterval = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Setup cleanup handlers
        window.addEventListener('beforeunload', () => this.cleanupAll());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Start memory monitoring
        this.startMemoryMonitoring();
        
        this.isInitialized = true;
        console.log('[MemoryManager] Initialized');
    }

    /**
     * Register a resource for cleanup
     */
    registerResource(id, resource, type) {
        if (!this.resources.has(type)) {
            this.resources.set(type, new Map());
        }
        
        this.resources.get(type).set(id, {
            resource,
            createdAt: Date.now(),
            lastAccessed: Date.now()
        });
        
        return () => this.unregisterResource(id, type);
    }

    /**
     * Unregister a resource
     */
    unregisterResource(id, type) {
        const typeMap = this.resources.get(type);
        if (typeMap) {
            typeMap.delete(id);
        }
    }

    /**
     * Create tracked interval
     */
    setInterval(id, callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.set(id, intervalId);
        
        return () => this.clearInterval(id);
    }

    /**
     * Clear tracked interval
     */
    clearInterval(id) {
        const intervalId = this.intervals.get(id);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(id);
        }
    }

    /**
     * Create tracked timeout
     */
    setTimeout(id, callback, delay) {
        const timeoutId = setTimeout(() => {
            callback();
            this.timeouts.delete(id);
        }, delay);
        
        this.timeouts.set(id, timeoutId);
        
        return () => this.clearTimeout(id);
    }

    /**
     * Clear tracked timeout
     */
    clearTimeout(id) {
        const timeoutId = this.timeouts.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(id);
        }
    }

    /**
     * Register event listener with cleanup
     */
    addEventListener(id, target, event, callback, options) {
        target.addEventListener(event, callback, options);
        
        if (!this.eventListeners.has(id)) {
            this.eventListeners.set(id, []);
        }
        
        this.eventListeners.get(id).push({ target, event, callback, options });
        
        return () => this.removeEventListener(id, target, event, callback);
    }

    /**
     * Remove tracked event listener
     */
    removeEventListener(id, target, event, callback) {
        target.removeEventListener(event, callback);
        
        const listeners = this.eventListeners.get(id);
        if (listeners) {
            const index = listeners.findIndex(
                l => l.target === target && l.event === event && l.callback === callback
            );
            if (index !== -1) {
                listeners.splice(index, 1);
            }
            if (listeners.length === 0) {
                this.eventListeners.delete(id);
            }
        }
    }

    /**
     * Register MutationObserver with cleanup
     */
    observe(id, observer, target, options) {
        observer.observe(target, options);
        this.observers.set(id, { observer, target });
        
        return () => this.unobserve(id);
    }

    /**
     * Stop observing
     */
    unobserve(id) {
        const obs = this.observers.get(id);
        if (obs) {
            obs.observer.disconnect();
            this.observers.delete(id);
        }
    }

    /**
     * Register media stream with cleanup
     */
    registerStream(id, stream) {
        this.streams.set(id, stream);
        
        return () => this.stopStream(id);
    }

    /**
     * Stop media stream
     */
    stopStream(id) {
        const stream = this.streams.get(id);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            this.streams.delete(id);
        }
    }

    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        if (this.monitoringInterval) return;
        
        const check = () => {
            const usage = this.getMemoryUsage();
            
            if (usage > this.memoryThreshold) {
                console.warn(`[MemoryManager] High memory usage: ${(usage * 100).toFixed(1)}%`);
                this.performCleanup();
            }
        };
        
        this.monitoringInterval = setInterval(check, 30000); // Check every 30 seconds
    }

    /**
     * Get memory usage ratio
     */
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        }
        
        // Fallback estimation
        return 0.5; // Assume 50% if not available
    }

    /**
     * Perform automatic cleanup
     */
    performCleanup() {
        console.log('[MemoryManager] Performing automatic cleanup...');
        
        // Clear old timeouts
        const now = Date.now();
        this.timeouts.forEach((timeoutId, id) => {
            // Timeouts should auto-clear, but force clear if > 1 min old
            clearTimeout(timeoutId);
            this.timeouts.delete(id);
        });
        
        // Clear unused resources
        this.resources.forEach((typeMap, type) => {
            typeMap.forEach((resource, id) => {
                if (now - resource.lastAccessed > 300000) { // 5 minutes
                    console.log(`[MemoryManager] Cleaning up old resource: ${type}/${id}`);
                    this.cleanupResource(id, type);
                }
            });
        });
        
        // Clear canvas contexts
        this.clearCanvasContexts();
        
        // Trigger garbage collection hint (if available)
        if (globalThis.gc) {
            globalThis.gc();
        }
    }

    /**
     * Cleanup specific resource
     */
    cleanupResource(id, type) {
        const typeMap = this.resources.get(type);
        if (!typeMap) return;
        
        const resourceInfo = typeMap.get(id);
        if (!resourceInfo) return;
        
        const resource = resourceInfo.resource;
        
        try {
            switch (type) {
                case 'canvas':
                    if (resource.getContext) {
                        const ctx = resource.getContext('2d');
                        if (ctx) ctx.reset();
                        resource.width = 0;
                        resource.height = 0;
                    }
                    break;
                    
                case 'image':
                    resource.src = '';
                    resource.onload = null;
                    resource.onerror = null;
                    break;
                    
                case 'video':
                    if (resource.pause) resource.pause();
                    resource.src = '';
                    resource.load();
                    break;
                    
                case 'blob':
                    if (resource.revoke) resource.revoke();
                    break;
                    
                case 'worker':
                    if (resource.terminate) resource.terminate();
                    break;
                    
                case 'model':
                    // TensorFlow.js model disposal
                    if (resource.dispose) resource.dispose();
                    break;
            }
        } catch (error) {
            console.error(`[MemoryManager] Error cleaning up ${type}/${id}:`, error);
        }
        
        typeMap.delete(id);
    }

    /**
     * Clear canvas contexts to free memory
     */
    clearCanvasContexts() {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            try {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.reset();
                }
            } catch (e) {
                // Ignore canvas errors
            }
        });
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[MemoryManager] Tab hidden - reducing memory footprint');
            this.reduceMemoryFootprint();
        } else {
            console.log('[MemoryManager] Tab visible - restoring resources');
        }
    }

    /**
     * Reduce memory footprint when tab is hidden
     */
    reduceMemoryFootprint() {
        // Pause video streams
        this.streams.forEach((stream, id) => {
            stream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = false;
                }
            });
        });
        
        // Clear canvas overlays
        this.clearCanvasContexts();
        
        // Pause auto-detection if running
        if (window.autoDetection?.isRunning) {
            window.autoDetection.stop();
            window.autoDetection.wasManuallyStopped = false;
        }
    }

    /**
     * Cleanup all resources
     */
    cleanupAll() {
        console.log('[MemoryManager] Cleaning up all resources...');
        
        // Clear all intervals
        this.intervals.forEach((intervalId, id) => {
            clearInterval(intervalId);
        });
        this.intervals.clear();
        
        // Clear all timeouts
        this.timeouts.forEach((timeoutId, id) => {
            clearTimeout(timeoutId);
        });
        this.timeouts.clear();
        
        // Remove all event listeners
        this.eventListeners.forEach((listeners, id) => {
            listeners.forEach(({ target, event, callback }) => {
                target.removeEventListener(event, callback);
            });
        });
        this.eventListeners.clear();
        
        // Disconnect all observers
        this.observers.forEach((obs, id) => {
            obs.observer.disconnect();
        });
        this.observers.clear();
        
        // Stop all streams
        this.streams.forEach((stream, id) => {
            stream.getTracks().forEach(track => track.stop());
        });
        this.streams.clear();
        
        // Clear all resources
        this.resources.forEach((typeMap, type) => {
            typeMap.forEach((_, id) => {
                this.cleanupResource(id, type);
            });
        });
        this.resources.clear();
        
        // Stop memory monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('[MemoryManager] Cleanup complete');
    }

    /**
     * Get resource statistics
     */
    getStats() {
        return {
            resources: Array.from(this.resources.entries()).reduce((acc, [type, map]) => {
                acc[type] = map.size;
                return acc;
            }, {}),
            intervals: this.intervals.size,
            timeouts: this.timeouts.size,
            eventListeners: this.eventListeners.size,
            observers: this.observers.size,
            streams: this.streams.size,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Log resource leaks (for debugging)
     */
    logLeaks() {
        const stats = this.getStats();
        const total = Object.values(stats.resources).reduce((a, b) => a + b, 0);
        
        if (total > 50 || stats.intervals > 10 || stats.eventListeners > 100) {
            console.warn('[MemoryManager] Potential memory leak detected:', stats);
        }
    }
}

// Initialize global memory manager
window.memoryManager = new MemoryManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
}
