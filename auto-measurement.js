/**
 * Auto-Measurement Module
 * Automatic measurement without manual calibration
 * - AI-powered object recognition
 * - Instant dimension calculation
 * - Real-time measurement overlay
 */

class AutoMeasurementModule {
    constructor() {
        this.isAutoMeasuring = false;
        this.currentMeasurements = [];
        this.measurementCache = new Map();
        this.overlayCanvas = null;
        this.ctx = null;
        this.settings = {
            minConfidence: 0.6,
            snapToEdges: true,
            showGuides: true,
            autoCapture: true,
            precision: 2
        };

        this.init();
    }

    async init() {
        this.overlayCanvas = document.getElementById('overlayCanvas');
        if (this.overlayCanvas) {
            this.ctx = this.overlayCanvas.getContext('2d');
        }
        this.loadMeasurementHistory();
    }

    /**
     * Auto-measure all detected objects
     * @param {Array} detections - Detected objects
     * @returns {Array} Measurements with real-world dimensions
     */
    async autoMeasure(detections) {
        if (!detections || detections.length === 0) return [];

        const measurements = [];

        for (const detection of detections) {
            const measurement = await this.measureObject(detection);
            if (measurement) {
                measurements.push(measurement);
            }
        }

        this.currentMeasurements = measurements;
        this.drawMeasurementOverlay(measurements);
        
        return measurements;
    }

    /**
     * Measure a single object using AI and depth estimation
     * @param {Object} detection - Detected object with bbox
     * @returns {Object} Measurement result
     */
    async measureObject(detection) {
        const [x, y, pixelWidth, pixelHeight] = detection.bbox;
        
        // Check if object is in database
        const enrichedData = detection.enrichedData;
        
        if (enrichedData?.knownObject && enrichedData.avgSize) {
            // Known object - use database dimensions
            return this.measureKnownObject(detection, enrichedData);
        }

        // Unknown object - estimate using depth
        return this.measureUnknownObject(detection);
    }

    /**
     * Measure known object from database
     */
    measureKnownObject(detection, enrichedData) {
        const size = enrichedData.avgSize;
        const [x, y, pixelWidth, pixelHeight] = detection.bbox;

        // Calculate distance based on apparent size
        const depthResult = window.depthEstimation?.calculateDepthFromSize(
            size.width,
            pixelWidth
        );

        const distance = depthResult?.distance || 30; // Default 30cm

        // Calculate height using distance
        const realHeight = window.depthEstimation?.pixelsToRealWorld(
            pixelHeight,
            distance
        ) || size.height;

        const measurement = {
            ...detection,
            measurement: {
                length: size.height,
                width: size.width,
                depth: size.depth || 0,
                height: realHeight,
                area: size.width * size.height,
                volume: size.width * size.height * (size.depth || 0),
                unit: 'cm',
                distance: distance,
                confidence: detection.confidence,
                method: 'database-match',
                objectType: enrichedData.category,
                autoMeasured: true
            },
            timestamp: Date.now()
        };

        // Cache the measurement
        this.cacheMeasurement(detection.class, measurement.measurement);

        return measurement;
    }

    /**
     * Measure unknown object using depth estimation
     */
    async measureUnknownObject(detection) {
        const [x, y, pixelWidth, pixelHeight] = detection.bbox;

        // Try to estimate depth using available methods
        let depthResult = null;

        // Method 1: Use depth estimation module
        if (window.depthEstimation) {
            depthResult = window.depthEstimation.calculateDepthFromSize(
                10, // Assume 10cm as reference
                pixelWidth
            );
        }

        // Method 2: Use perspective cues
        if (detection.corners && detection.corners.length === 4) {
            const perspectiveDepth = window.depthEstimation?.calculateDepthFromPerspective(
                detection.corners,
                { width: 10, height: 10 }
            );
            
            if (perspectiveDepth) {
                depthResult = perspectiveDepth;
            }
        }

        const distance = depthResult?.distance || 50; // Default 50cm
        const confidence = depthResult?.confidence || 0.3;

        // Calculate real dimensions
        const realWidth = window.depthEstimation?.pixelsToRealWorld(
            pixelWidth,
            distance
        ) || 10;

        const realHeight = window.depthEstimation?.pixelsToRealWorld(
            pixelHeight,
            distance
        ) || 10;

        return {
            ...detection,
            measurement: {
                length: realHeight,
                width: realWidth,
                depth: 0,
                area: realWidth * realHeight,
                volume: 0,
                unit: 'cm',
                distance: distance,
                confidence: confidence * detection.confidence,
                method: 'depth-estimation',
                objectType: 'unknown',
                autoMeasured: true,
                estimated: true
            },
            timestamp: Date.now()
        };
    }

    /**
     * Real-time continuous measurement mode
     */
    startContinuousMeasurement() {
        this.isAutoMeasuring = true;
        
        const measure = async () => {
            if (!this.isAutoMeasuring) return;

            try {
                // Get current frame
                const canvas = window.cameraModule?.captureFrame();
                if (!canvas) return;

                // Detect objects
                const detections = await window.objectDetection?.detectObjects();
                
                if (detections && detections.length > 0) {
                    // Auto-measure all detected objects
                    await this.autoMeasure(detections);
                }

                // Continue measurement loop
                requestAnimationFrame(measure);
            } catch (error) {
                console.error('[AutoMeasure] Continuous measurement error:', error);
                setTimeout(measure, 1000); // Retry after 1 second
            }
        };

        measure();
    }

    /**
     * Stop continuous measurement
     */
    stopContinuousMeasurement() {
        this.isAutoMeasuring = false;
    }

    /**
     * Snap measurement to detected edges
     */
    snapToEdges(bbox, imageData) {
        if (!this.settings.snapToEdges || !window.cv) return bbox;

        try {
            const [x, y, w, h] = bbox;
            const src = cv.matFromImageData(imageData);
            const gray = new cv.Mat();
            const edges = new cv.Mat();

            // Extract ROI
            const roi = new cv.Rect(
                Math.max(0, x - 10),
                Math.max(0, y - 10),
                Math.min(src.cols - x, w + 20),
                Math.min(src.rows - y, h + 20)
            );

            const roiMat = src.roi(roi);
            cv.cvtColor(roiMat, gray, cv.COLOR_RGBA2GRAY);
            cv.Canny(gray, edges, 50, 150);

            // Find contours to refine edges
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            let maxArea = 0;
            let bestRect = { x: 0, y: 0, width: w, height: h };

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > maxArea) {
                    maxArea = area;
                    const rect = cv.boundingRect(contour);
                    bestRect = {
                        x: rect.x + roi.x,
                        y: rect.y + roi.y,
                        width: rect.width,
                        height: rect.height
                    };
                }
                contour.delete();
            }

            // Cleanup
            src.delete();
            gray.delete();
            edges.delete();
            roiMat.delete();
            contours.delete();
            hierarchy.delete();

            return [bestRect.x, bestRect.y, bestRect.width, bestRect.height];
        } catch (error) {
            console.error('[AutoMeasure] Edge snap error:', error);
            return bbox;
        }
    }

    /**
     * Draw measurement overlay on canvas
     */
    drawMeasurementOverlay(measurements) {
        if (!this.ctx || !this.overlayCanvas) return;

        // Clear previous overlay
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        measurements.forEach(m => {
            const [x, y, w, h] = m.bbox;
            const measurement = m.measurement;

            // Draw bounding box
            this.ctx.strokeStyle = '#00d9ff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, w, h);

            // Draw dimension lines
            this.drawDimensionLine(x, y - 10, x + w, y - 10, 
                `${measurement.width.toFixed(2)} cm`, 'top');
            
            this.drawDimensionLine(x + w + 10, y, x + w + 10, y + h,
                `${measurement.length.toFixed(2)} cm`, 'right');

            // Draw measurement info box
            if (this.settings.showGuides) {
                this.drawMeasurementInfo(x, y + h + 10, {
                    width: measurement.width.toFixed(this.settings.precision),
                    height: measurement.length.toFixed(this.settings.precision),
                    area: measurement.area.toFixed(this.settings.precision),
                    confidence: Math.round(measurement.confidence * 100),
                    method: measurement.method
                });
            }
        });
    }

    /**
     * Draw dimension line with label
     */
    drawDimensionLine(x1, y1, x2, y2, label, position) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw arrowheads
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 8;

        // Start arrow
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(
            x1 - arrowSize * Math.cos(angle - Math.PI / 6),
            y1 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(
            x1 - arrowSize * Math.cos(angle + Math.PI / 6),
            y1 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // End arrow
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 + arrowSize * Math.cos(angle - Math.PI / 6),
            y2 + arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 + arrowSize * Math.cos(angle + Math.PI / 6),
            y2 + arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();

        // Draw label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offset = position === 'top' ? -10 : 10;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const textWidth = this.ctx.measureText(label).width;
        this.ctx.fillRect(midX - textWidth / 2 - 4, midY + offset - 12, textWidth + 8, 20);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, midX, midY + offset + 4);
    }

    /**
     * Draw measurement info box
     */
    drawMeasurementInfo(x, y, info) {
        const padding = 8;
        const lineHeight = 18;
        const lines = [
            `W: ${info.width} cm`,
            `H: ${info.height} cm`,
            `A: ${info.area} cm²`,
            `Conf: ${info.confidence}%`,
            `Method: ${info.method}`
        ];

        const boxWidth = 140;
        const boxHeight = lines.length * lineHeight + padding * 2;

        // Background
        this.ctx.fillStyle = 'rgba(0, 217, 255, 0.9)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'left';

        lines.forEach((line, i) => {
            this.ctx.fillText(line, x + padding, y + padding + (i + 1) * lineHeight - 4);
        });
    }

    /**
     * Cache measurement for quick access
     */
    cacheMeasurement(objectType, measurement) {
        const key = objectType.toLowerCase();
        this.measurementCache.set(key, {
            ...measurement,
            cachedAt: Date.now()
        });

        // Limit cache size
        if (this.measurementCache.size > 100) {
            const firstKey = this.measurementCache.keys().next().value;
            this.measurementCache.delete(firstKey);
        }
    }

    /**
     * Get cached measurement
     */
    getCachedMeasurement(objectType) {
        const key = objectType.toLowerCase();
        const cached = this.measurementCache.get(key);
        
        if (cached && Date.now() - cached.cachedAt < 3600000) { // 1 hour
            return cached;
        }
        
        return null;
    }

    /**
     * Save measurement to history
     */
    saveToHistory(measurement) {
        const history = this.loadMeasurementHistory();
        history.unshift({
            ...measurement,
            savedAt: Date.now()
        });

        // Keep last 100 measurements
        const trimmed = history.slice(0, 100);
        localStorage.setItem('measurecount_auto_history', JSON.stringify(trimmed));
    }

    /**
     * Load measurement history
     */
    loadMeasurementHistory() {
        try {
            const stored = localStorage.getItem('measurecount_auto_history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[AutoMeasure] Load history error:', error);
            return [];
        }
    }

    /**
     * Get measurement statistics
     */
    getStatistics() {
        const history = this.loadMeasurementHistory();
        
        if (history.length === 0) return null;

        const widths = history.map(h => h.measurement?.width || 0).filter(w => w > 0);
        const heights = history.map(h => h.measurement?.length || 0).filter(h => h > 0);

        return {
            totalMeasurements: history.length,
            averageWidth: widths.reduce((a, b) => a + b, 0) / widths.length,
            averageHeight: heights.reduce((a, b) => a + b, 0) / heights.length,
            minWidth: Math.min(...widths),
            maxWidth: Math.max(...widths),
            minHeight: Math.min(...heights),
            maxHeight: Math.max(...heights)
        };
    }

    /**
     * Export measurements
     */
    exportMeasurements(format = 'json') {
        const history = this.loadMeasurementHistory();

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `measurements-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return history;
    }

    /**
     * Clear all cached and saved measurements
     */
    clearAll() {
        this.measurementCache.clear();
        localStorage.removeItem('measurecount_auto_history');
        this.currentMeasurements = [];
    }
}

// Initialize auto-measurement module
window.autoMeasurement = new AutoMeasurementModule();
