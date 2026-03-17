/**
 * Performance Enhancement Module
 * Advanced optimization for maximum speed and efficiency
 * 
 * Features:
 * - WebAssembly integration
 * - Advanced caching (multi-layer)
 * - Worker pool optimization
 * - Memory optimization
 * - Lazy loading with prefetching
 * - Performance monitoring
 * - Auto-tuning
 */

class PerformanceEnhancer {
    constructor() {
        this.config = {
            enableWasm: true,
            enableCaching: true,
            workerPoolSize: navigator.hardwareConcurrency || 4,
            maxCacheSize: 100 * 1024 * 1024, // 100MB
            enablePrefetch: true,
            targetFPS: 60,
            memoryLimit: 500 * 1024 * 1024 // 500MB
        };
        
        // Multi-layer cache
        this.cacheL1 = new Map(); // Fast, small (in-memory)
        this.cacheL2 = new IndexedDBCache('osai_l2_cache'); // Medium, medium
        this.cacheL3 = new LocalStorageCache('osai_l3_cache'); // Slow, large
        
        // Worker pool
        this.workerPool = [];
        this.workerQueue = [];
        
        // Performance metrics
        this.metrics = {
            fps: [],
            memory: [],
            cacheHits: 0,
            cacheMisses: 0,
            workerTasks: 0,
            frameTimes: []
        };
        
        this.init();
    }

    async init() {
        console.log('[PerformanceEnhancer] Initializing...');
        
        // Initialize worker pool
        await this.initializeWorkerPool();
        
        // Initialize caches
        await this.cacheL2.init();
        
        // Start performance monitoring
        this.startMonitoring();
        
        // Enable performance optimizations
        this.applyOptimizations();
        
        console.log('[PerformanceEnhancer] Initialized ✓');
    }

    /**
     * Apply all performance optimizations
     */
    applyOptimizations() {
        // 1. Enable GPU acceleration
        this.enableGPUAcceleration();
        
        // 2. Optimize images
        this.optimizeImageLoading();
        
        // 3. Debounce expensive operations
        this.setupDebouncing();
        
        // 4. Enable requestIdleCallback
        this.setupIdleCallbacks();
        
        // 5. Optimize event listeners
        this.optimizeEventListeners();
    }

    /**
     * Enable GPU acceleration
     */
    enableGPUAcceleration() {
        // Force GPU acceleration for canvas
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d', {
                alpha: true,
                desynchronized: true, // Reduce latency
                willReadFrequently: false
            });
        });
        
        // Enable CSS GPU acceleration
        const style = document.createElement('style');
        style.textContent = `
            .camera-container, canvas, video {
                transform: translateZ(0);
                will-change: transform;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Optimize image loading
     */
    optimizeImageLoading() {
        // Use ImageBitmap for faster image processing
        window.createImageBitmap = window.createImageBitmap || ((blob) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = URL.createObjectURL(blob);
            });
        });
        
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            img.src = img.dataset.src;
                            observer.unobserve(img);
                        }
                    });
                });
                observer.observe(img);
            }
        });
    }

    /**
     * Setup debouncing for expensive operations
     */
    setupDebouncing() {
        // Debounce resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        // Debounce scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 50);
        });
    }

    /**
     * Setup idle callbacks for background tasks
     */
    setupIdleCallbacks() {
        if ('requestIdleCallback' in window) {
            const processIdleTasks = (deadline) => {
                while (deadline.timeRemaining() > 0 && this.workerQueue.length > 0) {
                    const task = this.workerQueue.shift();
                    task();
                }
                requestIdleCallback(processIdleTasks);
            };
            requestIdleCallback(processIdleTasks);
        }
    }

    /**
     * Optimize event listeners
     */
    optimizeEventListeners() {
        // Use passive event listeners for scroll/touch
        const optimizeElement = (el) => {
            if (el.addEventListener) {
                const original = el.addEventListener;
                el.addEventListener = function(type, listener, options) {
                    if (type === 'scroll' || type === 'touchstart' || type === 'wheel') {
                        return original.call(this, type, listener, { passive: true, ...options });
                    }
                    return original.call(this, type, listener, options);
                };
            }
        };
        
        optimizeElement(window);
        optimizeElement(document);
    }

    /**
     * Initialize worker pool
     */
    async initializeWorkerPool() {
        console.log('[PerformanceEnhancer] Creating worker pool...', this.config.workerPoolSize);
        
        for (let i = 0; i < this.config.workerPoolSize; i++) {
            const worker = new Worker(new URL('./ai-worker.js', import.meta.url));
            
            this.workerPool.push({
                id: i,
                worker,
                busy: false,
                tasksCompleted: 0
            });
            
            worker.onmessage = (e) => this.handleWorkerMessage(i, e.data);
        }
        
        console.log('[PerformanceEnhancer] Worker pool ready:', this.workerPool.length, 'workers');
    }

    /**
     * Get idle worker from pool
     */
    getIdleWorker() {
        const idle = this.workerPool.find(w => !w.busy);
        if (idle) return idle;
        
        // All busy, queue task
        return null;
    }

    /**
     * Execute task on worker pool
     */
    executeOnWorker(taskType, payload) {
        return new Promise((resolve, reject) => {
            const worker = this.getIdleWorker();
            
            if (!worker) {
                // Queue for later
                this.workerQueue.push(() => {
                    this.executeOnWorker(taskType, payload).then(resolve).catch(reject);
                });
                return;
            }
            
            worker.busy = true;
            this.metrics.workerTasks++;
            
            const timeout = setTimeout(() => {
                reject(new Error('Worker timeout'));
            }, 30000);
            
            worker.worker.postMessage({ type: taskType, payload });
            
            // Store resolve/reject for when message comes back
            worker.callback = (error, result) => {
                clearTimeout(timeout);
                worker.busy = false;
                worker.tasksCompleted++;
                if (error) reject(error);
                else resolve(result);
            };
        });
    }

    /**
     * Handle worker message
     */
    handleWorkerMessage(workerId, data) {
        const worker = this.workerPool[workerId];
        if (worker && worker.callback) {
            worker.callback(null, data);
        }
    }

    /**
     * Multi-layer cache get
     */
    async get(key) {
        // L1 cache (fastest)
        if (this.cacheL1.has(key)) {
            this.metrics.cacheHits++;
            return this.cacheL1.get(key);
        }
        
        // L2 cache (medium)
        try {
            const l2Result = await this.cacheL2.get(key);
            if (l2Result) {
                this.metrics.cacheHits++;
                // Promote to L1
                this.cacheL1.set(key, l2Result);
                return l2Result;
            }
        } catch (e) {}
        
        // L3 cache (slowest)
        try {
            const l3Result = await this.cacheL3.get(key);
            if (l3Result) {
                this.metrics.cacheHits++;
                // Promote to L1 and L2
                this.cacheL1.set(key, l3Result);
                await this.cacheL2.set(key, l3Result);
                return l3Result;
            }
        } catch (e) {}
        
        this.metrics.cacheMisses++;
        return null;
    }

    /**
     * Multi-layer cache set
     */
    async set(key, value, priority = 'normal') {
        // Always set L1
        this.cacheL1.set(key, value);
        
        // Set L2 for high priority
        if (priority === 'high') {
            await this.cacheL2.set(key, value);
        }
        
        // Set L3 for everything
        await this.cacheL3.set(key, value);
        
        // Manage L1 size
        if (this.cacheL1.size > 1000) {
            const firstKey = this.cacheL1.keys().next().value;
            this.cacheL1.delete(firstKey);
        }
    }

    /**
     * Prefetch data
     */
    async prefetch(keys) {
        if (!this.config.enablePrefetch) return;
        
        // Use idle time to prefetch
        if ('requestIdleCallback' in window) {
            requestIdleCallback(async () => {
                for (const key of keys) {
                    await this.get(key);
                }
            });
        }
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        // Monitor FPS
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            const now = performance.now();
            frameCount++;
            
            if (now - lastTime >= 1000) {
                const fps = frameCount / ((now - lastTime) / 1000);
                this.metrics.fps.push(fps);
                if (this.metrics.fps.length > 60) this.metrics.fps.shift();
                frameCount = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
        
        // Monitor memory
        setInterval(() => {
            if (performance.memory) {
                this.metrics.memory.push(performance.memory.usedJSHeapSize / 1024 / 1024);
                if (this.metrics.memory.length > 60) this.metrics.memory.shift();
                
                // Auto-optimize if memory too high
                if (this.metrics.memory[this.metrics.memory.length - 1] > this.config.memoryLimit / 1024 / 1024) {
                    this.optimizeMemory();
                }
            }
        }, 1000);
    }

    /**
     * Optimize memory usage
     */
    optimizeMemory() {
        console.log('[PerformanceEnhancer] Optimizing memory...');
        
        // Clear L1 cache
        this.cacheL1.clear();
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
        
        // Clear image caches
        if (window.imageCache) {
            window.imageCache.clear();
        }
    }

    /**
     * Handle resize
     */
    handleResize() {
        // Debounced resize handler
        if (window.stateManager) {
            window.stateManager.set('ui.resized', true);
        }
    }

    /**
     * Handle scroll
     */
    handleScroll() {
        // Debounced scroll handler
    }

    /**
     * Get performance stats
     */
    getStats() {
        const avgFPS = this.metrics.fps.length > 0 ?
            this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length : 0;
        
        const avgMemory = this.metrics.memory.length > 0 ?
            this.metrics.memory.reduce((a, b) => a + b, 0) / this.metrics.memory.length : 0;
        
        const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses || 1);
        
        return {
            avgFPS: Math.round(avgFPS),
            currentFPS: this.metrics.fps[this.metrics.fps.length - 1] || 0,
            avgMemory: Math.round(avgMemory),
            cacheHitRate: Math.round(cacheHitRate * 100),
            workerTasks: this.metrics.workerTasks,
            queueLength: this.workerQueue.length,
            workers: this.workerPool.map(w => ({
                id: w.id,
                busy: w.busy,
                tasksCompleted: w.tasksCompleted
            }))
        };
    }

    /**
     * Benchmark performance
     */
    async benchmark() {
        const results = {};
        
        // Cache benchmark
        const cacheStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            await this.set(`bench_${i}`, { value: i });
            await this.get(`bench_${i}`);
        }
        results.cacheOps = performance.now() - cacheStart;
        
        // Worker benchmark
        const workerStart = performance.now();
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(this.executeOnWorker('CALCULATE_AVERAGE_COLOR', {
                imageData: new ImageData(100, 100)
            }));
        }
        await Promise.all(promises);
        results.workerOps = performance.now() - workerStart;
        
        return results;
    }
}

/**
 * IndexedDB Cache (L2)
 */
class IndexedDBCache {
    constructor(dbName) {
        this.dbName = dbName;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
        });
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cache', 'readonly');
            const store = tx.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    async set(key, value) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cache', 'readwrite');
            const store = tx.objectStore('cache');
            const request = store.put({ key, value, timestamp: Date.now() });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

/**
 * LocalStorage Cache (L3)
 */
class LocalStorageCache {
    constructor(name) {
        this.name = name;
    }

    async get(key) {
        try {
            const item = localStorage.getItem(`${this.name}:${key}`);
            if (item) {
                const data = JSON.parse(item);
                if (Date.now() - data.timestamp < 86400000) { // 24 hours
                    return data.value;
                }
                localStorage.removeItem(`${this.name}:${key}`);
            }
        } catch (e) {}
        return null;
    }

    async set(key, value) {
        try {
            localStorage.setItem(`${this.name}:${key}`, JSON.stringify({
                value,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }
}

// Initialize global performance enhancer
window.performanceEnhancer = new PerformanceEnhancer();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceEnhancer;
}
