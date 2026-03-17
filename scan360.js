/**
 * 360° Scan & Camera Control Module
 * Advanced camera features for comprehensive scanning
 * - 360° panoramic scan
 * - Digital zoom
 * - Multi-angle capture
 * - Stitching assistance
 */

class Scan360Module {
    constructor() {
        this.scanFrames = [];
        this.isScanning = false;
        this.scanProgress = 0;
        this.currentZoom = 1;
        this.maxZoom = 5;
        this.scanSettings = {
            minFrames: 8,
            maxFrames: 36,
            frameInterval: 500, // ms
            autoCapture: true
        };

        this.init();
    }

    async init() {
        console.log('[Scan360] Module initialized');
    }

    /**
     * Start 360° scan
     */
    async start360Scan() {
        if (this.isScanning) return false;

        this.isScanning = true;
        this.scanFrames = [];
        this.scanProgress = 0;

        console.log('[Scan360] Starting 360° scan');
        
        // Guide user to rotate
        if (window.app) {
            window.app.showToast('Slowly rotate 360° around the object', 'info');
        }

        // Start capture loop
        this.captureScanLoop();

        return true;
    }

    /**
     * Capture scan frames in loop
     */
    async captureScanLoop() {
        const captureInterval = setInterval(() => {
            if (!this.isScanning) {
                clearInterval(captureInterval);
                return;
            }

            const frame = this.captureFrame();
            
            if (frame) {
                this.scanFrames.push({
                    image: frame,
                    angle: this.estimateAngle(this.scanFrames.length),
                    timestamp: Date.now()
                });

                this.scanProgress = (this.scanFrames.length / this.scanSettings.maxFrames) * 100;

                // Check if we have enough frames
                if (this.scanFrames.length >= this.scanSettings.minFrames) {
                    this.checkScanComplete();
                }
            }
        }, this.scanSettings.frameInterval);
    }

    /**
     * Capture current frame
     */
    captureFrame() {
        return window.cameraModule?.captureFrame();
    }

    /**
     * Estimate rotation angle
     */
    estimateAngle(frameIndex) {
        // Simplified - would use gyroscope/accelerometer in production
        const degreesPerFrame = 360 / this.scanSettings.maxFrames;
        return (frameIndex * degreesPerFrame) % 360;
    }

    /**
     * Check if scan is complete
     */
    checkScanComplete() {
        // Check if we've captured enough of the rotation
        const firstFrame = this.scanFrames[0];
        const lastFrame = this.scanFrames[this.scanFrames.length - 1];

        // Simple similarity check
        const similarity = this.calculateFrameSimilarity(firstFrame.image, lastFrame.image);

        if (similarity > 0.8) {
            // We've come full circle
            this.complete360Scan();
        }
    }

    /**
     * Calculate similarity between frames
     */
    calculateFrameSimilarity(frame1, frame2) {
        // Simplified histogram comparison
        if (!frame1 || !frame2) return 0;

        const hist1 = this.getColorHistogram(frame1);
        const hist2 = this.getColorHistogram(frame2);

        let correlation = 0;
        for (let i = 0; i < hist1.length; i++) {
            correlation += Math.min(hist1[i], hist2[i]);
        }

        return correlation;
    }

    /**
     * Get color histogram
     */
    getColorHistogram(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const histogram = new Array(32).fill(0);

        for (let i = 0; i < imageData.data.length; i += 4) {
            const gray = Math.floor((imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3);
            const bin = Math.floor(gray / 8);
            histogram[bin]++;
        }

        // Normalize
        const total = imageData.data.length / 4;
        return histogram.map(v => v / total);
    }

    /**
     * Complete 360° scan
     */
    complete360Scan() {
        this.isScanning = false;
        this.scanProgress = 100;

        console.log(`[Scan360] Scan complete with ${this.scanFrames.length} frames`);

        if (window.app) {
            window.app.showToast('360° scan complete!', 'success');
        }

        return this.getScanResult();
    }

    /**
     * Stop scan
     */
    stopScan() {
        this.isScanning = false;
        console.log('[Scan360] Scan stopped');
    }

    /**
     * Get scan result
     */
    getScanResult() {
        return {
            frames: this.scanFrames.length,
            images: this.scanFrames.map(f => f.image),
            angles: this.scanFrames.map(f => f.angle),
            progress: this.scanProgress,
            timestamp: Date.now()
        };
    }

    /**
     * Digital zoom
     */
    setZoom(level) {
        this.currentZoom = Math.max(1, Math.min(level, this.maxZoom));
        console.log(`[Scan360] Zoom set to ${this.currentZoom}x`);
        return this.currentZoom;
    }

    /**
     * Zoom in
     */
    zoomIn(step = 0.5) {
        return this.setZoom(this.currentZoom + step);
    }

    /**
     * Zoom out
     */
    zoomOut(step = 0.5) {
        return this.setZoom(this.currentZoom - step);
    }

    /**
     * Reset zoom
     */
    resetZoom() {
        this.currentZoom = 1;
        return 1;
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        return this.currentZoom;
    }

    /**
     * Multi-angle capture
     */
    async captureMultiAngle(angles = ['front', 'top', 'side']) {
        const captures = [];

        for (const angle of angles) {
            if (window.app) {
                window.app.showToast(`Capture ${angle} view`, 'info');
            }

            // Wait for user confirmation (simplified)
            await new Promise(resolve => setTimeout(resolve, 2000));

            const frame = this.captureFrame();
            if (frame) {
                captures.push({
                    angle: angle,
                    image: frame,
                    timestamp: Date.now()
                });
            }
        }

        return captures;
    }

    /**
     * Get scan progress
     */
    getProgress() {
        return this.scanProgress;
    }

    /**
     * Is currently scanning
     */
    isScanningActive() {
        return this.isScanning;
    }

    /**
     * Export scan
     */
    exportScan(format = 'zip') {
        if (this.scanFrames.length === 0) {
            console.warn('[Scan360] No scan data to export');
            return null;
        }

        // Export as JSON with base64 images
        const exportData = {
            frames: this.scanFrames.map((f, i) => ({
                angle: f.angle,
                timestamp: f.timestamp,
                image: f.image.toDataURL('image/jpeg', 0.8)
            })),
            metadata: {
                totalFrames: this.scanFrames.length,
                scanDate: new Date().toISOString()
            }
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scan360-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return exportData;
    }

    /**
     * Clear scan data
     */
    clearScan() {
        this.scanFrames = [];
        this.scanProgress = 0;
        this.isScanning = false;
    }
}

// Initialize 360 scan module
window.scan360 = new Scan360Module();
