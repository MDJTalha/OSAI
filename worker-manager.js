/**
 * Web Worker Manager
 * Manages AI processing workers for non-blocking operations
 * - Worker pool
 * - Task queue
 * - Load balancing
 * - Auto-termination
 */

class WorkerManager {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.workerIdCounter = 0;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Create initial worker pool
        for (let i = 0; i < Math.min(2, this.maxWorkers); i++) {
            this.createWorker();
        }
        
        this.isInitialized = true;
        console.log(`[WorkerManager] Initialized with ${this.workers.length} workers`);
    }

    /**
     * Create a new worker
     */
    createWorker() {
        if (this.workers.length >= this.maxWorkers) {
            console.warn('[WorkerManager] Max workers reached');
            return null;
        }

        const workerId = this.workerIdCounter++;
        const worker = new Worker(new URL('./ai-worker.js', import.meta.url), {
            type: 'module'
        });

        const workerInfo = {
            id: workerId,
            worker,
            busy: false,
            currentTask: null,
            tasksCompleted: 0,
            createdAt: Date.now(),
            lastUsed: Date.now()
        };

        worker.onmessage = (e) => this.handleWorkerMessage(workerId, e.data);
        worker.onerror = (e) => this.handleWorkerError(workerId, e);

        this.workers.push(workerInfo);
        console.log(`[WorkerManager] Created worker ${workerId}`);

        return workerInfo;
    }

    /**
     * Get an idle worker
     */
    getIdleWorker() {
        // Try to find an idle worker
        const idleWorker = this.workers.find(w => !w.busy);
        
        if (idleWorker) {
            return idleWorker;
        }

        // All workers busy, create new one if possible
        if (this.workers.length < this.maxWorkers) {
            return this.createWorker();
        }

        // Queue the task
        return null;
    }

    /**
     * Queue a task for processing
     */
    queueTask(taskType, payload, callback) {
        const task = {
            id: this.generateTaskId(),
            type: taskType,
            payload,
            callback,
            queuedAt: Date.now(),
            priority: payload.priority || 0
        };

        // Sort by priority (higher first)
        this.taskQueue.push(task);
        this.taskQueue.sort((a, b) => b.priority - a.priority);

        // Try to process immediately
        this.processQueue();

        return task.id;
    }

    /**
     * Process queued tasks
     */
    processQueue() {
        while (this.taskQueue.length > 0) {
            const worker = this.getIdleWorker();
            
            if (!worker) {
                break; // No available workers
            }

            const task = this.taskQueue.shift();
            this.executeTask(worker, task);
        }
    }

    /**
     * Execute task on worker
     */
    executeTask(worker, task) {
        worker.busy = true;
        worker.currentTask = task;
        worker.lastUsed = Date.now();

        worker.worker.postMessage({
            type: task.type,
            payload: task.payload
        });
    }

    /**
     * Handle worker message
     */
    handleWorkerMessage(workerId, message) {
        const worker = this.workers.find(w => w.id === workerId);
        
        if (!worker) {
            console.warn('[WorkerManager] Unknown worker:', workerId);
            return;
        }

        // Mark worker as idle
        worker.busy = false;
        worker.tasksCompleted++;

        // Execute callback
        if (worker.currentTask?.callback) {
            worker.currentTask.callback(null, message);
        }

        worker.currentTask = null;

        // Process next task
        this.processQueue();
    }

    /**
     * Handle worker error
     */
    handleWorkerError(workerId, error) {
        console.error(`[WorkerManager] Worker ${workerId} error:`, error);

        const worker = this.workers.find(w => w.id === workerId);
        
        if (worker && worker.currentTask?.callback) {
            worker.currentTask.callback(error, null);
        }

        // Remove faulty worker and create replacement
        this.removeWorker(workerId);
        this.createWorker();
    }

    /**
     * Remove a worker
     */
    removeWorker(workerId) {
        const index = this.workers.findIndex(w => w.id === workerId);
        
        if (index !== -1) {
            const worker = this.workers[index];
            worker.worker.terminate();
            this.workers.splice(index, 1);
            console.log(`[WorkerManager] Removed worker ${workerId}`);
        }
    }

    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cancel a queued task
     */
    cancelTask(taskId) {
        const index = this.taskQueue.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            this.taskQueue.splice(index, 1);
            return true;
        }

        // Check if task is currently executing
        for (const worker of this.workers) {
            if (worker.currentTask?.id === taskId) {
                worker.worker.terminate();
                worker.currentTask.callback(new Error('Task cancelled'), null);
                this.removeWorker(worker.id);
                this.createWorker();
                return true;
            }
        }

        return false;
    }

    /**
     * Clear all queued tasks
     */
    clearQueue() {
        this.taskQueue.forEach(task => {
            if (task.callback) {
                task.callback(new Error('Queue cleared'), null);
            }
        });
        
        this.taskQueue = [];
    }

    /**
     * Terminate all workers
     */
    terminate() {
        this.clearQueue();
        
        this.workers.forEach(worker => {
            worker.worker.terminate();
        });
        
        this.workers = [];
        this.activeWorkers = 0;
        
        console.log('[WorkerManager] All workers terminated');
    }

    /**
     * Get worker statistics
     */
    getStats() {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.filter(w => w.busy).length,
            idleWorkers: this.workers.filter(w => !w.busy).length,
            queuedTasks: this.taskQueue.length,
            maxWorkers: this.maxWorkers,
            workers: this.workers.map(w => ({
                id: w.id,
                busy: w.busy,
                tasksCompleted: w.tasksCompleted,
                age: Date.now() - w.createdAt
            }))
        };
    }

    /**
     * Preload AI models on all workers
     */
    preloadModels() {
        this.workers.forEach(worker => {
            worker.worker.postMessage({ type: 'LOAD_COCO_SSD' });
            worker.worker.postMessage({ type: 'LOAD_MOBILENET' });
        });
    }

    /**
     * Detect objects using worker pool
     */
    detectObjects(imageData, options = {}) {
        return new Promise((resolve, reject) => {
            this.queueTask(
                'DETECT_OBJECTS',
                {
                    imageData,
                    minConfidence: options.minConfidence || 0.5,
                    priority: options.priority || 1
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    /**
     * Classify image using worker pool
     */
    classifyImage(imageData) {
        return new Promise((resolve, reject) => {
            this.queueTask(
                'CLASSIFY_IMAGE',
                { imageData, priority: 0 },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    /**
     * Detect edges using worker pool
     */
    detectEdges(imageData) {
        return new Promise((resolve, reject) => {
            this.queueTask(
                'DETECT_EDGES',
                { imageData, priority: 0 },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }

    /**
     * Calculate average color using worker pool
     */
    calculateAverageColor(imageData) {
        return new Promise((resolve, reject) => {
            this.queueTask(
                'CALCULATE_AVERAGE_COLOR',
                { imageData, priority: 0 },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkerManager;
}

// Initialize global worker manager if in browser
if (typeof window !== 'undefined') {
    window.workerManager = new WorkerManager();
}
