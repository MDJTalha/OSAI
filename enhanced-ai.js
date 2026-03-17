/**
 * Enhanced AI Module
 * Advanced AI capabilities for MeasureCount Pro
 * - Deep learning object detection
 * - Depth estimation
 * - Smart measurement
 * - Object recognition database
 */

class EnhancedAIModule {
    constructor() {
        this.models = {
            cocoSsd: null,
            mobilenet: null,
            depthEstimation: null
        };
        this.objectDatabase = this.initializeObjectDatabase();
        this.isCvReady = false;
        this.loadingModels = false;
        this.measurementHistory = [];
        
        this.init();
    }

    async init() {
        console.log('[EnhancedAI] Initializing enhanced AI module...');
        await this.loadAllModels();
    }

    async loadAllModels() {
        if (this.loadingModels) return;
        this.loadingModels = true;

        try {
            // Load COCO-SSD for object detection
            await this.loadCocoSsd();
            
            // Load MobileNet for classification
            await this.loadMobileNet();
            
            console.log('[EnhancedAI] All models loaded successfully');
        } catch (error) {
            console.error('[EnhancedAI] Error loading models:', error);
        } finally {
            this.loadingModels = false;
        }
    }

    async loadCocoSsd() {
        try {
            if (typeof cocoSsd !== 'undefined') {
                this.models.cocoSsd = await cocoSsd.load();
                console.log('[EnhancedAI] COCO-SSD model loaded');
                return true;
            }
        } catch (error) {
            console.warn('[EnhancedAI] COCO-SSD not available, using fallback');
        }
        return false;
    }

    async loadMobileNet() {
        try {
            if (typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
                this.models.mobilenet = await mobilenet.load();
                console.log('[EnhancedAI] MobileNet model loaded');
                return true;
            }
        } catch (error) {
            console.warn('[EnhancedAI] MobileNet not available');
        }
        return false;
    }

    // ========================================
    // Advanced Object Detection
    // ========================================

    async detectObjectsAdvanced(imageData, options = {}) {
        const {
            minConfidence = 0.5,
            maxDetections = 20,
            useDeepLearning = true
        } = options;

        let detections = [];

        // Try comprehensive detection first (if available)
        if (window.comprehensiveDetection) {
            detections = await window.comprehensiveDetection.analyzeItems(imageData);
            return detections;
        }

        // Try deep learning detection
        if (useDeepLearning && this.models.cocoSsd) {
            detections = await this.detectWithCocoSsd(imageData, minConfidence, maxDetections);
        }

        // Fallback to enhanced blob detection
        if (detections.length === 0) {
            detections = await this.enhancedBlobDetection(imageData);
        }

        // Enrich with object database
        detections = detections.map(detection => ({
            ...detection,
            enrichedData: this.enrichWithDatabase(detection.class)
        }));

        return detections;
    }

    async detectWithCocoSsd(imageData, minConfidence, maxDetections) {
        try {
            const predictions = await this.models.cocoSsd.detect(imageData);
            
            return predictions
                .filter(pred => pred.score >= minConfidence)
                .slice(0, maxDetections)
                .map(pred => ({
                    bbox: pred.bbox, // [x, y, width, height]
                    class: pred.class,
                    confidence: pred.score,
                    type: 'ml'
                }));
        } catch (error) {
            console.error('[EnhancedAI] COCO-SSD detection error:', error);
            return [];
        }
    }

    async enhancedBlobDetection(imageData) {
        if (!this.isCvReady || !window.cv) {
            // Fallback to basic blob detection
            return this.basicBlobDetection(imageData);
        }

        try {
            const src = cv.matFromImageData(imageData);
            const dst = new cv.Mat();
            const gray = new cv.Mat();
            const edges = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            // Apply Gaussian blur
            cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

            // Canny edge detection
            cv.Canny(gray, edges, 50, 150);

            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const detections = [];

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);

                // Filter small contours
                if (area > 1000) {
                    const rect = cv.boundingRect(contour);
                    const confidence = this.calculateBlobConfidence(area, rect);

                    if (confidence > 0.4) {
                        const className = this.classifyByShape(contour, rect);
                        
                        detections.push({
                            bbox: [rect.x, rect.y, rect.width, rect.height],
                            class: className,
                            confidence: confidence,
                            type: 'blob',
                            area: area
                        });
                    }
                }
            }

            // Cleanup
            src.delete();
            dst.delete();
            gray.delete();
            edges.delete();
            contours.delete();
            hierarchy.delete();

            return detections;
        } catch (error) {
            console.error('[EnhancedAI] OpenCV detection error:', error);
            return this.basicBlobDetection(imageData);
        }
    }

    basicBlobDetection(imageData) {
        // Original blob detection from object-detection.js
        const ctx = imageData instanceof ImageData ? null : imageData.getContext('2d');
        const data = ctx ? ctx.getImageData(0, 0, imageData.width, imageData.height).data : imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const blobs = this.detectBlobs(data, width, height);
        
        return blobs.map(blob => ({
            bbox: [blob.x, blob.y, blob.width, blob.height],
            class: this.estimateObjectType(blob),
            confidence: blob.confidence,
            type: 'basic'
        }));
    }

    detectBlobs(data, width, height) {
        const blobs = [];
        const visited = new Uint8Array(width * height);
        const gray = new Uint8Array(width * height);
        
        // Convert to grayscale
        for (let i = 0; i < width * height; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Threshold
        const threshold = 128;
        const binary = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            binary[i] = gray[i] < threshold ? 255 : 0;
        }

        // Find connected components
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                if (binary[i] === 255 && !visited[i]) {
                    const blob = this.traceBlob(binary, visited, x, y, width, height);
                    if (blob.area > 1000) {
                        blobs.push({
                            x: blob.x,
                            y: blob.y,
                            width: blob.width,
                            height: blob.height,
                            area: blob.area,
                            confidence: Math.min(0.95, 0.5 + blob.area / 10000)
                        });
                    }
                }
            }
        }

        return blobs;
    }

    traceBlob(binary, visited, startX, startY, width, height) {
        const stack = [[startX, startY]];
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        let area = 0;

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const i = y * width + x;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[i] || binary[i] === 0) continue;

            visited[i] = 1;
            area++;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, area };
    }

    classifyByShape(contour, rect) {
        if (!window.cv) return 'Object';

        const area = cv.contourArea(contour);
        const perimeter = cv.arcLength(contour, true);
        
        if (perimeter === 0) return 'Object';

        const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
        const aspectRatio = rect.width / rect.height;

        if (circularity > 0.8) return 'Round Object';
        if (aspectRatio > 1.5) return 'Elongated Object';
        if (aspectRatio < 0.67) return 'Tall Object';
        return 'Box/Object';
    }

    calculateBlobConfidence(area, rect) {
        const optimalArea = 5000;
        const areaFactor = Math.min(1, area / optimalArea);
        const shapeFactor = rect.width / rect.height;
        const symmetryFactor = 1 - Math.abs(1 - Math.min(shapeFactor, 1 / shapeFactor));
        
        return Math.min(0.95, (areaFactor * 0.5 + symmetryFactor * 0.5) + 0.3);
    }

    // ========================================
    // Object Recognition Database
    // ========================================

    initializeObjectDatabase() {
        return {
            // Electronics
            'cell phone': { category: 'electronics', avgSize: { width: 7, height: 15, depth: 0.8 }, unit: 'cm' },
            'smartphone': { category: 'electronics', avgSize: { width: 7, height: 15, depth: 0.8 }, unit: 'cm' },
            'laptop': { category: 'electronics', avgSize: { width: 30, height: 20, depth: 2 }, unit: 'cm' },
            'keyboard': { category: 'electronics', avgSize: { width: 44, height: 13, depth: 3 }, unit: 'cm' },
            'mouse': { category: 'electronics', avgSize: { width: 6, height: 10, depth: 4 }, unit: 'cm' },
            
            // Office Supplies
            'pen': { category: 'office', avgSize: { width: 1, height: 14, depth: 1 }, unit: 'cm' },
            'pencil': { category: 'office', avgSize: { width: 0.7, height: 18, depth: 0.7 }, unit: 'cm' },
            'scissors': { category: 'office', avgSize: { width: 5, height: 15, depth: 1 }, unit: 'cm' },
            'stapler': { category: 'office', avgSize: { width: 5, height: 15, depth: 8 }, unit: 'cm' },
            
            // Documents
            'book': { category: 'document', avgSize: { width: 15, height: 23, depth: 3 }, unit: 'cm' },
            'notebook': { category: 'document', avgSize: { width: 21, height: 30, depth: 2 }, unit: 'cm' },
            
            // Food & Kitchen
            'cup': { category: 'kitchen', avgSize: { width: 8, height: 10, depth: 8 }, unit: 'cm' },
            'bowl': { category: 'kitchen', avgSize: { width: 15, height: 8, depth: 15 }, unit: 'cm' },
            'spoon': { category: 'kitchen', avgSize: { width: 3, height: 25, depth: 2 }, unit: 'cm' },
            'fork': { category: 'kitchen', avgSize: { width: 3, height: 20, depth: 2 }, unit: 'cm' },
            
            // Common Objects
            'credit card': { category: 'card', avgSize: { width: 8.57, height: 5.4, depth: 0.1 }, unit: 'cm' },
            'coin': { category: 'money', avgSize: { width: 2.4, height: 2.4, depth: 0.2 }, unit: 'cm' },
            'key': { category: 'tool', avgSize: { width: 2, height: 6, depth: 0.3 }, unit: 'cm' },
            'bottle': { category: 'container', avgSize: { width: 7, height: 25, depth: 7 }, unit: 'cm' },
            'box': { category: 'container', avgSize: { width: 20, height: 20, depth: 20 }, unit: 'cm' }
        };
    }

    enrichWithDatabase(className) {
        const normalizedClass = className.toLowerCase();
        
        // Direct match
        if (this.objectDatabase[normalizedClass]) {
            return {
                ...this.objectDatabase[normalizedClass],
                knownObject: true,
                matchType: 'direct'
            };
        }

        // Partial match
        for (const [key, data] of Object.entries(this.objectDatabase)) {
            if (normalizedClass.includes(key) || key.includes(normalizedClass)) {
                return {
                    ...data,
                    knownObject: true,
                    matchType: 'partial',
                    matchedKey: key
                };
            }
        }

        return {
            knownObject: false,
            category: 'unknown',
            matchType: 'none'
        };
    }

    // ========================================
    // Smart Measurement Features
    // ========================================

    async estimateDepth(imageData) {
        // Simplified depth estimation using size priors
        // Full implementation would use MiDaS or similar
        
        const detections = await this.detectObjectsAdvanced(imageData);
        
        return detections.map(detection => {
            const enriched = detection.enrichedData;
            
            if (enriched.knownObject) {
                // Use known size to estimate distance
                const expectedWidth = enriched.avgSize.width;
                const pixelWidth = detection.bbox[2];
                
                // Simplified depth estimation
                const estimatedDistance = (expectedWidth * 100) / pixelWidth; // cm
                
                return {
                    ...detection,
                    depth: {
                        distance: estimatedDistance,
                        confidence: 0.7,
                        method: 'size-prior'
                    }
                };
            }
            
            return {
                ...detection,
                depth: {
                    distance: null,
                    confidence: 0,
                    method: 'unknown'
                }
            };
        });
    }

    async autoMeasure(imageData) {
        const detections = await this.estimateDepth(imageData);
        
        return detections.map(detection => {
            const measurement = {
                length: 0,
                width: 0,
                area: 0,
                confidence: detection.confidence,
                autoMeasured: true
            };

            if (detection.enrichedData?.knownObject) {
                const size = detection.enrichedData.avgSize;
                measurement.length = size.height;
                measurement.width = size.width;
                measurement.area = size.height * size.width;
                measurement.unit = detection.enrichedData.unit;
            }

            return {
                ...detection,
                measurement
            };
        });
    }

    // ========================================
    // Multi-frame Processing
    // ========================================

    async processMultipleFrames(frames) {
        const allDetections = [];

        for (const frame of frames) {
            const detections = await this.detectObjectsAdvanced(frame);
            allDetections.push(detections);
        }

        // Merge and average detections
        return this.mergeDetections(allDetections);
    }

    mergeDetections(detectionSets) {
        const merged = new Map();

        detectionSets.forEach((detections, frameIndex) => {
            detections.forEach(detection => {
                const key = `${detection.class}_${detection.bbox.join('_')}`;
                
                if (!merged.has(key)) {
                    merged.set(key, {
                        ...detection,
                        frameCount: 1,
                        totalConfidence: detection.confidence,
                        bboxHistory: [detection.bbox]
                    });
                } else {
                    const existing = merged.get(key);
                    existing.frameCount++;
                    existing.totalConfidence += detection.confidence;
                    existing.bboxHistory.push(detection.bbox);
                    
                    // Average the bounding boxes
                    existing.bbox = this.averageBbox(existing.bboxHistory);
                }
            });
        });

        // Filter and finalize
        return Array.from(merged.values())
            .filter(d => d.frameCount >= Math.ceil(detectionSets.length / 2))
            .map(d => ({
                ...d,
                confidence: d.totalConfidence / d.frameCount,
                stability: d.frameCount / detectionSets.length
            }));
    }

    averageBbox(bboxes) {
        const sum = bboxes.reduce((acc, bbox) => {
            return acc.map((val, i) => val + bbox[i]);
        }, [0, 0, 0, 0]);
        
        return sum.map(val => val / bboxes.length);
    }

    // ========================================
    // Learning & Adaptation
    // ========================================

    learnObject(className, measurements) {
        // Learn from user corrections
        const avgMeasurements = measurements.reduce((acc, m) => ({
            length: acc.length + m.length / measurements.length,
            width: acc.width + m.width / measurements.length
        }), { length: 0, width: 0 });

        this.objectDatabase[className.toLowerCase()] = {
            category: 'learned',
            avgSize: {
                width: avgMeasurements.width,
                height: avgMeasurements.length,
                depth: 1
            },
            unit: 'cm',
            learned: true,
            sampleCount: measurements.length
        };

        // Save to localStorage
        this.saveLearnedObjects();
    }

    saveLearnedObjects() {
        const learned = Object.entries(this.objectDatabase)
            .filter(([_, data]) => data.learned)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
        localStorage.setItem('measurecount_learned_objects', JSON.stringify(learned));
    }

    loadLearnedObjects() {
        try {
            const stored = localStorage.getItem('measurecount_learned_objects');
            if (stored) {
                const learned = JSON.parse(stored);
                Object.assign(this.objectDatabase, learned);
            }
        } catch (error) {
            console.error('[EnhancedAI] Failed to load learned objects:', error);
        }
    }

    // ========================================
    // Utility Functions
    // ========================================

    estimateObjectType(blob) {
        const aspectRatio = blob.width / blob.height;
        const area = blob.area;
        const circularity = (4 * Math.PI * area) / (Math.pow(2 * (blob.width + blob.height), 2));

        if (circularity > 0.8) return 'Round Object';
        if (aspectRatio > 1.5) return 'Elongated Object';
        if (aspectRatio < 0.67) return 'Tall Object';
        return 'Box/Object';
    }

    getConfidenceLevel(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }
}

// Initialize enhanced AI module
window.enhancedAI = new EnhancedAIModule();

// OpenCV ready callback
function onOpenCvReady() {
    window.enhancedAI.isCvReady = true;
    console.log('[EnhancedAI] OpenCV.js ready');
}
