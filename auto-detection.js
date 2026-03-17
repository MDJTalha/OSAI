/**
 * Auto-Detection Module
 * Continuous automatic object detection
 * - Always-on scanning
 * - Smart filtering
 * - Auto-capture on findings
 * - Real-time updates
 */

class AutoDetectionModule {
    constructor() {
        this.isEnabled = true; // Enabled by default
        this.isRunning = false;
        this.detectionInterval = null;
        this.lastDetections = new Map();
        this.newObjectCallbacks = [];
        this.settings = {
            scanInterval: 1000, // Scan every 1 second
            confidenceThreshold: 0.5,
            ignoreDuplicates: true,
            duplicateTimeout: 5000, // 5 seconds
            autoCaptureNewObjects: true,
            maxConcurrentDetections: 3
        };
        
        this.init();
    }

    async init() {
        if (this.isEnabled) {
            this.start();
        }
        console.log('[AutoDetection] Module initialized');
    }

    /**
     * Start continuous auto-detection
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('[AutoDetection] Auto-detection started');

        const detect = async () => {
            if (!this.isRunning) return;

            try {
                await this.scanAndDetect();
            } catch (error) {
                console.error('[AutoDetection] Scan error:', error);
            }

            // Continue scanning
            this.detectionInterval = setTimeout(detect, this.settings.scanInterval);
        };

        detect();
    }

    /**
     * Stop auto-detection
     */
    stop() {
        this.isRunning = false;
        if (this.detectionInterval) {
            clearTimeout(this.detectionInterval);
            this.detectionInterval = null;
        }
        console.log('[AutoDetection] Auto-detection stopped');
    }

    /**
     * Toggle auto-detection
     */
    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
        return this.isRunning;
    }

    /**
     * Scan and detect objects
     */
    async scanAndDetect() {
        // Get current frame (unified camera access)
        const canvas = this.captureFrame();
        if (!canvas) return;

        // Detect objects with comprehensive analysis
        let detections;
        
        // Try comprehensive detection first (color, material, size, shape)
        if (window.comprehensiveDetection) {
            detections = await window.comprehensiveDetection.analyzeItems(canvas);
        }
        // Fallback to standard object detection
        else if (window.objectDetection) {
            detections = await window.objectDetection.detectObjects();
        }
        else {
            detections = [];
        }

        if (!detections || detections.length === 0) return;

        // Process detections
        await this.processDetections(detections);
    }

    /**
     * Capture frame (unified method)
     */
    captureFrame() {
        // Try robustCamera first (enterprise), fallback to cameraModule
        return window.robustCamera?.captureFrame() || 
               window.cameraModule?.captureFrame();
    }

    /**
     * Process detected objects
     */
    async processDetections(detections) {
        const timestamp = Date.now();
        const newObjects = [];

        for (const detection of detections) {
            const objectId = this.generateObjectId(detection);
            const lastSeen = this.lastDetections.get(objectId);

            // Check if new object
            if (!lastSeen || (timestamp - lastSeen) > this.settings.duplicateTimeout) {
                // New object detected
                newObjects.push(detection);
                this.lastDetections.set(objectId, timestamp);

                // Notify callbacks
                this.notifyNewObject(detection);

                // Auto-capture if enabled
                if (this.settings.autoCaptureNewObjects) {
                    await this.autoCapture(detection);
                }
            }

            // Update existing object
            this.lastDetections.set(objectId, timestamp);
        }

        // Cleanup old detections
        this.cleanupOldDetections(timestamp);

        // Update UI
        this.updateUI(detections, newObjects);
    }

    /**
     * Generate unique object ID
     */
    generateObjectId(detection) {
        const [x, y, w, h] = detection.bbox || [0, 0, 0, 0];
        const className = detection.class || 'unknown';
        return `${className}_${x}_${y}_${w}_${h}`;
    }

    /**
     * Notify callbacks of new object
     */
    notifyNewObject(detection) {
        this.newObjectCallbacks.forEach(callback => {
            try {
                callback(detection);
            } catch (error) {
                console.error('[AutoDetection] Callback error:', error);
            }
        });
    }

    /**
     * Auto-capture new object
     */
    async autoCapture(detection) {
        // Capture screenshot
        const screenshot = await window.robustCamera?.captureScreenshot('auto-detect', {
            object: detection.class,
            confidence: detection.confidence
        });

        if (screenshot) {
            console.log('[AutoDetection] Auto-captured:', detection.class);
        }
    }

    /**
     * Cleanup old detections
     */
    cleanupOldDetections(currentTime) {
        const timeout = this.settings.duplicateTimeout * 2;
        
        this.lastDetections.forEach((timestamp, objectId) => {
            if ((currentTime - timestamp) > timeout) {
                this.lastDetections.delete(objectId);
            }
        });
    }

    /**
     * Update UI with detections
     */
    updateUI(detections, newObjects) {
        // Update object count
        const countEl = document.getElementById('objectCount');
        if (countEl) {
            countEl.textContent = detections.length;
        }

        // Highlight new objects
        if (newObjects.length > 0) {
            this.highlightNewObjects(newObjects);
        }

        // Notify app
        if (window.app) {
            window.app.onAutoDetection({
                all: detections,
                new: newObjects,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Highlight new objects on overlay
     */
    highlightNewObjects(newObjects) {
        const canvas = document.getElementById('overlayCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        newObjects.forEach(detection => {
            const [x, y, w, h] = detection.bbox;
            
            // Draw highlight box (green for new)
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Draw "NEW" label
            ctx.fillStyle = '#10B981';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('NEW', x + 5, y + 20);
        });

        // Clear after 2 seconds
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 2000);
    }

    /**
     * Register callback for new objects
     */
    onNewObject(callback) {
        this.newObjectCallbacks.push(callback);
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.scanInterval) {
            if (this.isRunning) {
                this.stop();
                this.start();
            }
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get detection statistics
     */
    getStatistics() {
        return {
            isRunning: this.isRunning,
            totalTracked: this.lastDetections.size,
            callbacks: this.newObjectCallbacks.length
        };
    }

    /**
     * Clear tracking
     */
    clear() {
        this.lastDetections.clear();
    }
}

// Initialize auto-detection module (enabled by default)
window.autoDetection = new AutoDetectionModule();
