/**
 * Object Detection Module
 * AI-powered item counting and classification using TensorFlow.js
 */

class ObjectDetectionModule {
    constructor() {
        this.model = null;
        this.classifierModel = null;
        this.overlayCanvas = null;
        this.ctx = null;
        this.detections = [];
        this.minConfidence = 0.6;
        this.modelLoaded = false;
        
        this.init();
    }
    
    async init() {
        this.overlayCanvas = document.getElementById('overlayCanvas');
        
        if (this.overlayCanvas) {
            this.ctx = this.overlayCanvas.getContext('2d');
        }
        
        // Load detection model
        await this.loadModel();
    }
    
    async loadModel() {
        try {
            // Use TensorFlow.js with COCO-SSD model
            // In production, you would load from a CDN or local files
            
            if (typeof tf !== 'undefined' && typeof cocoSsd !== 'undefined') {
                this.model = await cocoSsd.load();
                this.modelLoaded = true;
                console.log('Object detection model loaded');
            } else {
                // Fallback: Use simulated detection for demo
                console.log('Using simulated detection (TensorFlow.js not available)');
                this.modelLoaded = false;
            }
        } catch (error) {
            console.error('Failed to load detection model:', error);
            this.modelLoaded = false;
        }
    }
    
    async loadClassifierModel() {
        try {
            // Load a classification model for item type differentiation
            // This would typically be a MobileNet or custom trained model
            
            if (typeof tf !== 'undefined') {
                // Load MobileNet for feature extraction
                this.classifierModel = await tf.loadGraphModel(
                    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/2/default/1'
                );
                console.log('Classifier model loaded');
            }
        } catch (error) {
            console.error('Failed to load classifier model:', error);
            this.classifierModel = null;
        }
    }
    
    async detectObjects() {
        if (!window.cameraModule) {
            throw new Error('Camera not available');
        }

        // Capture current frame
        const canvas = window.cameraModule.captureFrame();
        if (!canvas) {
            throw new Error('Failed to capture frame');
        }

        let detections = [];

        // Use enhanced AI module if available
        if (window.enhancedAI) {
            detections = await window.enhancedAI.detectObjectsAdvanced(canvas, {
                minConfidence: this.minConfidence,
                useDeepLearning: this.modelLoaded
            });
        } else if (this.modelLoaded && this.model) {
            // Use TensorFlow.js model
            detections = await this.model.detect(canvas);
        } else {
            // Fallback: Simulated detection for demo purposes
            detections = await this.simulateDetection(canvas);
        }

        // Filter by confidence
        detections = detections.filter(d => d.confidence || d.score >= this.minConfidence);

        this.detections = detections;

        // Draw detection overlay
        this.drawDetections(detections);

        return detections;
    }
    
    async simulateDetection(canvas) {
        // Simulated detection for demo when TF.js is not available
        // In production, this would be replaced with actual ML inference
        
        return new Promise((resolve) => {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Simple blob detection based on color/contrast
            const blobs = this.detectBlobs(imageData, canvas.width, canvas.height);
            
            // Map blobs to detection objects
            const detections = blobs.map((blob, index) => ({
                bbox: [
                    blob.x,
                    blob.y,
                    blob.width,
                    blob.height
                ],
                class: this.estimateObjectType(blob, imageData, canvas.width, canvas.height),
                score: blob.confidence
            }));
            
            resolve(detections);
        });
    }
    
    detectBlobs(imageData, width, height) {
        const data = imageData.data;
        const blobs = [];
        const visited = new Uint8Array(width * height);
        
        // Convert to grayscale and threshold
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }
        
        // Simple thresholding
        const threshold = 128;
        const binary = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            binary[i] = gray[i] < threshold ? 255 : 0;
        }
        
        // Find connected components (blobs)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                if (binary[i] === 255 && !visited[i]) {
                    const blob = this.traceBlob(binary, visited, x, y, width, height);
                    
                    // Filter small blobs
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
            
            // Check 4 neighbors
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            area: area
        };
    }
    
    estimateObjectType(blob, imageData, width, height) {
        // Simple heuristic to estimate object type based on shape
        const aspectRatio = blob.width / blob.height;
        const area = blob.area;
        
        // Calculate circularity
        const perimeter = 2 * (blob.width + blob.height);
        const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
        
        // Classify based on shape characteristics
        if (circularity > 0.8) {
            return { name: 'Round Object', icon: '🔵' };
        } else if (aspectRatio > 1.5) {
            return { name: 'Elongated', icon: '📏' };
        } else if (aspectRatio < 0.67) {
            return { name: 'Tall Object', icon: '📦' };
        } else {
            return { name: 'Box/Object', icon: '📦' };
        }
    }
    
    async classifyObjects(detections) {
        // Group detections by type
        const typeGroups = new Map();
        
        for (const detection of detections) {
            const className = detection.class?.name || detection.class || 'Unknown';
            
            if (!typeGroups.has(className)) {
                typeGroups.set(className, {
                    name: className,
                    icon: detection.class?.icon || '📦',
                    count: 0,
                    detections: []
                });
            }
            
            const group = typeGroups.get(className);
            group.count++;
            group.detections.push(detection);
        }
        
        // If we have a classifier model, use it for finer differentiation
        if (this.classifierModel && detections.length > 0) {
            await this.refineClassification(typeGroups);
        }
        
        const types = Array.from(typeGroups.values());
        
        return {
            types: types,
            totalTypes: types.length,
            totalItems: detections.length
        };
    }
    
    async refineClassification(typeGroups) {
        // Use the classifier model to differentiate between similar objects
        // This is a placeholder for actual ML classification
        
        for (const [className, group] of typeGroups) {
            if (group.count > 1) {
                // Extract features from each detection and cluster them
                const features = await this.extractFeatures(group.detections);
                const clusters = this.clusterFeatures(features);
                
                // If we found distinct clusters, split the group
                if (clusters.length > 1) {
                    typeGroups.delete(className);
                    
                    clusters.forEach((cluster, index) => {
                        typeGroups.set(`${className} ${index + 1}`, {
                            name: `${className} Type ${index + 1}`,
                            icon: group.icon,
                            count: cluster.length,
                            detections: cluster.map(i => group.detections[i])
                        });
                    });
                }
            }
        }
    }
    
    async extractFeatures(detections) {
        // Extract visual features from each detection for classification
        const features = [];
        
        if (!window.cameraModule) return features;
        
        const canvas = window.cameraModule.captureFrame();
        if (!canvas) return features;
        
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < detections.length; i++) {
            const detection = detections[i];
            const [x, y, w, h] = detection.bbox;
            
            // Extract crop
            const crop = ctx.getImageData(x, y, w, h);
            
            // Calculate color histogram
            const histogram = this.calculateColorHistogram(crop);
            
            // Calculate texture features
            const texture = this.calculateTextureFeatures(crop);
            
            features.push({
                detectionIndex: i,
                histogram: histogram,
                texture: texture
            });
        }
        
        return features;
    }
    
    calculateColorHistogram(imageData) {
        const data = imageData.data;
        const bins = 16; // Number of bins per channel
        const histogram = new Array(bins * 3).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / (256 / bins));
            const g = Math.floor(data[i + 1] / (256 / bins));
            const b = Math.floor(data[i + 2] / (256 / bins));
            
            histogram[r]++;
            histogram[bins + g]++;
            histogram[bins * 2 + b]++;
        }
        
        // Normalize
        const total = data.length / 4;
        return histogram.map(v => v / total);
    }
    
    calculateTextureFeatures(imageData) {
        // Simple texture features based on edge density and variance
        const data = imageData.data;
        let sum = 0;
        let sumSq = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            sum += gray;
            sumSq += gray * gray;
        }
        
        const n = data.length / 4;
        const mean = sum / n;
        const variance = sumSq / n - mean * mean;
        
        return {
            brightness: mean / 255,
            contrast: Math.sqrt(variance) / 255
        };
    }
    
    clusterFeatures(features) {
        // Simple K-means clustering
        if (features.length < 2) return [[0]];
        
        // Determine optimal K (number of clusters)
        const k = Math.min(3, Math.floor(Math.sqrt(features.length / 2)) + 1);
        
        // Initialize centroids randomly
        const centroids = [];
        const indices = new Set();
        
        while (indices.size < k) {
            indices.add(Math.floor(Math.random() * features.length));
        }
        
        indices.forEach(i => {
            centroids.push({
                histogram: features[i].histogram,
                texture: features[i].texture
            });
        });
        
        // K-means iterations
        let clusters = new Array(k).fill(null).map(() => []);
        
        for (let iter = 0; iter < 10; iter++) {
            clusters = new Array(k).fill(null).map(() => []);
            
            // Assign points to nearest centroid
            features.forEach((feature, idx) => {
                let minDist = Infinity;
                let nearestCentroid = 0;
                
                centroids.forEach((centroid, cIdx) => {
                    const dist = this.featureDistance(feature, centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestCentroid = cIdx;
                    }
                });
                
                clusters[nearestCentroid].push(idx);
            });
            
            // Update centroids
            for (let c = 0; c < k; c++) {
                if (clusters[c].length === 0) continue;
                
                const avgHistogram = new Array(48).fill(0);
                const avgTexture = { brightness: 0, contrast: 0 };
                
                clusters[c].forEach(idx => {
                    features[idx].histogram.forEach((v, i) => {
                        avgHistogram[i] += v;
                    });
                    avgTexture.brightness += features[idx].texture.brightness;
                    avgTexture.contrast += features[idx].texture.contrast;
                });
                
                const n = clusters[c].length;
                centroids[c] = {
                    histogram: avgHistogram.map(v => v / n),
                    texture: {
                        brightness: avgTexture.brightness / n,
                        contrast: avgTexture.contrast / n
                    }
                };
            }
        }
        
        // Remove empty clusters
        return clusters.filter(c => c.length > 0);
    }
    
    featureDistance(f1, f2) {
        // Calculate distance between two feature vectors
        let histDist = 0;
        for (let i = 0; i < f1.histogram.length; i++) {
            histDist += Math.pow(f1.histogram[i] - f2.histogram[i], 2);
        }
        
        const textureDist = 
            Math.pow(f1.texture.brightness - f2.texture.brightness, 2) +
            Math.pow(f1.texture.contrast - f2.texture.contrast, 2);
        
        return histDist + textureDist * 10;
    }
    
    drawDetections(detections) {
        if (!this.ctx || !this.overlayCanvas) return;

        // Clear previous detections
        this.clearOverlay();

        detections.forEach((detection, index) => {
            // Handle both old and new detection formats
            const bbox = detection.bbox || [0, 0, 0, 0];
            const [x, y, w, h] = bbox;
            const confidence = detection.confidence || detection.score || 0;
            const className = detection.class?.name || detection.class || 'Unknown';

            // Generate consistent color for each class
            const color = this.getClassColor(className);

            // Draw bounding box
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, w, h);

            // Draw label background
            const label = `${className} ${(confidence * 100).toFixed(0)}%`;
            this.ctx.font = 'bold 14px sans-serif';
            const textWidth = this.ctx.measureText(label).width;

            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y - 25, textWidth + 16, 25);

            // Draw label text
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(label, x + 8, y - 7);

            // Draw index number
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x + w - 15, y + 15, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((index + 1).toString(), x + w - 15, y + 19);

            // Show enriched data if available
            if (detection.enrichedData?.knownObject) {
                const size = detection.enrichedData.avgSize;
                const sizeLabel = `${size.width}x${size.height}${size.unit}`;
                
                this.ctx.fillStyle = 'rgba(0, 217, 255, 0.9)';
                this.ctx.fillRect(x, y + h + 5, textWidth + 16, 20);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '11px sans-serif';
                this.ctx.fillText(sizeLabel, x + 8, y + h + 18);
            }
        });

        // Reset text alignment
        this.ctx.textAlign = 'left';
    }
    
    getClassColor(className) {
        // Generate consistent color based on class name
        let hash = 0;
        for (let i = 0; i < className.length; i++) {
            hash = className.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 80%, 50%)`;
    }
    
    clearOverlay() {
        if (!this.ctx || !this.overlayCanvas) return;
        
        // Save detection overlay state
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
    
    setMinConfidence(value) {
        this.minConfidence = value;
    }
    
    getDetections() {
        return this.detections;
    }
    
    async countSameItems() {
        // Count items assuming they're all the same type
        const detections = await this.detectObjects();
        
        return {
            count: detections.length,
            type: detections[0]?.class?.name || 'Item',
            icon: detections[0]?.class?.icon || '📦',
            detections: detections
        };
    }
    
    async countDifferentItems() {
        // Count and classify different item types
        const detections = await this.detectObjects();
        const classification = await this.classifyObjects(detections);
        
        return classification;
    }
}

// Initialize object detection module
window.objectDetection = new ObjectDetectionModule();
