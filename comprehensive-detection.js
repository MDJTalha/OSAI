/**
 * Comprehensive Detection Module
 * Advanced multi-property item recognition
 * - Object detection + classification
 * - Color analysis
 * - Size/dimension estimation
 * - Material identification
 * - Complete item profiling
 */

class ComprehensiveDetectionModule {
    constructor() {
        this.detections = [];
        this.minConfidence = 0.5;
        this.isReady = false;
        
        // Reference to other modules
        this.objectDetection = null;
        this.colorDetection = null;
        this.materialDetection = null;
        
        this.init();
    }

    async init() {
        console.log('[ComprehensiveDetection] Initializing...');
        this.isReady = true;
    }

    /**
     * Set module references
     */
    setModules(modules) {
        if (modules.objectDetection) this.objectDetection = modules.objectDetection;
        if (modules.colorDetection) this.colorDetection = modules.colorDetection;
        if (modules.materialDetection) this.materialDetection = modules.materialDetection;
    }

    /**
     * Comprehensive item analysis
     * Returns complete item profile with all properties
     */
    async analyzeItems(canvas) {
        if (!canvas) return [];

        const results = [];

        // 1. Detect objects
        const objects = await this.detectObjects(canvas);

        // 2. For each object, analyze all properties
        for (const obj of objects) {
            const itemProfile = await this.createItemProfile(obj, canvas);
            results.push(itemProfile);
        }

        this.detections = results;
        return results;
    }

    /**
     * Detect objects in frame
     */
    async detectObjects(canvas) {
        let detections = [];

        // Try enhanced AI first
        if (window.enhancedAI) {
            detections = await window.enhancedAI.detectObjectsAdvanced(canvas, {
                minConfidence: this.minConfidence,
                useDeepLearning: true
            });
        }
        // Try object detection module
        else if (window.objectDetection) {
            detections = await window.objectDetection.detectObjects();
        }
        // Fallback to basic detection
        else {
            detections = await this.basicDetection(canvas);
        }

        return detections;
    }

    /**
     * Create complete item profile
     */
    async createItemProfile(detection, canvas) {
        const bbox = detection.bbox || detection.box || [0, 0, canvas.width, canvas.height];
        const [x, y, width, height] = bbox;

        // Extract object region for detailed analysis
        const objectRegion = this.extractRegion(canvas, bbox);

        // Analyze all properties
        const colorAnalysis = await this.analyzeColor(objectRegion, canvas, bbox);
        const sizeAnalysis = this.analyzeSize(bbox, canvas);
        const materialAnalysis = await this.analyzeMaterial(objectRegion, detection);
        const shapeAnalysis = this.analyzeShape(bbox, width, height);

        return {
            // Basic detection
            id: detection.id || Date.now() + Math.random(),
            class: detection.class || detection.label || 'object',
            confidence: detection.confidence || detection.score || 0,
            
            // Bounding box
            bbox: bbox,
            x: x,
            y: y,
            
            // Comprehensive properties
            color: colorAnalysis,
            size: sizeAnalysis,
            material: materialAnalysis,
            shape: shapeAnalysis,
            
            // Complete description
            description: this.generateDescription({
                class: detection.class || detection.label || 'object',
                color: colorAnalysis,
                size: sizeAnalysis,
                material: materialAnalysis,
                shape: shapeAnalysis
            }),
            
            // Timestamp
            timestamp: Date.now()
        };
    }

    /**
     * Extract region from canvas
     */
    extractRegion(canvas, bbox) {
        const [x, y, width, height] = bbox;
        const ctx = canvas.getContext('2d');
        
        try {
            const imageData = ctx.getImageData(x, y, width, height);
            return { imageData, width, height };
        } catch (e) {
            return null;
        }
    }

    /**
     * Analyze color properties
     */
    async analyzeColor(region, fullCanvas, bbox) {
        const [x, y, width, height] = bbox;
        
        // Use color detection module if available
        if (window.colorDetection && region) {
            const colors = await window.colorDetection.analyzeColors(region.imageData, region.width, region.height);
            return {
                dominant: colors.dominant || 'Unknown',
                palette: colors.palette || [],
                hex: colors.hex || '#888888',
                rgb: colors.rgb || { r: 128, g: 128, b: 128 }
            };
        }

        // Basic color analysis
        if (region && region.imageData) {
            const avgColor = this.calculateAverageColor(region.imageData);
            return {
                dominant: this.getColorName(avgColor),
                hex: this.rgbToHex(avgColor.r, avgColor.g, avgColor.b),
                rgb: avgColor
            };
        }

        return {
            dominant: 'Unknown',
            hex: '#888888',
            rgb: { r: 128, g: 128, b: 128 }
        };
    }

    /**
     * Analyze size properties
     */
    analyzeSize(bbox, canvas) {
        const [x, y, width, height] = bbox;
        const area = width * height;
        const aspectRatio = width / height;
        
        // Size category
        let sizeCategory;
        const frameArea = canvas.width * canvas.height;
        const relativeSize = area / frameArea;

        if (relativeSize > 0.5) sizeCategory = 'Large';
        else if (relativeSize > 0.2) sizeCategory = 'Medium';
        else if (relativeSize > 0.05) sizeCategory = 'Small';
        else sizeCategory = 'Very Small';

        // Shape-based size description
        let shapeDesc;
        if (aspectRatio > 1.5) shapeDesc = 'Wide';
        else if (aspectRatio < 0.67) shapeDesc = 'Tall';
        else shapeDesc = 'Square-ish';

        return {
            width: Math.round(width),
            height: Math.round(height),
            area: Math.round(area),
            aspectRatio: parseFloat(aspectRatio.toFixed(2)),
            category: sizeCategory,
            shape: shapeDesc,
            relativeSize: parseFloat((relativeSize * 100).toFixed(1)) + '%'
        };
    }

    /**
     * Analyze material type
     */
    async analyzeMaterial(region, detection) {
        // Use material detection module if available
        if (window.materialDetection && region) {
            const material = await window.materialDetection.identifyMaterial(region.imageData, region.width, region.height);
            return {
                type: material.type || 'Unknown',
                confidence: material.confidence || 0,
                properties: material.properties || {}
            };
        }

        // Heuristic-based material estimation
        const objectClass = (detection.class || detection.label || '').toLowerCase();
        const materialGuess = this.estimateMaterialFromClass(objectClass);

        return {
            type: materialGuess,
            confidence: 0.6,
            properties: {}
        };
    }

    /**
     * Analyze shape properties
     */
    analyzeShape(bbox, width, height) {
        const aspectRatio = width / height;
        
        let primaryShape;
        if (Math.abs(aspectRatio - 1) < 0.2) {
            primaryShape = 'Square';
        } else if (aspectRatio > 1.5) {
            primaryShape = 'Rectangle (horizontal)';
        } else if (aspectRatio < 0.67) {
            primaryShape = 'Rectangle (vertical)';
        } else {
            primaryShape = 'Rectangle';
        }

        return {
            primary: primaryShape,
            aspectRatio: parseFloat(aspectRatio.toFixed(2)),
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    /**
     * Generate human-readable description
     */
    generateDescription(item) {
        const parts = [];
        
        // Color
        if (item.color && item.color.dominant && item.color.dominant !== 'Unknown') {
            parts.push(item.color.dominant);
        }
        
        // Size
        if (item.size && item.size.category) {
            parts.push(item.size.category);
        }
        
        // Material
        if (item.material && item.material.type && item.material.type !== 'Unknown') {
            parts.push(item.material.type);
        }
        
        // Object class
        parts.push(item.class);
        
        // Shape (optional)
        if (item.shape && item.shape.primary) {
            // parts.push(`(${item.shape.primary})`);
        }

        return parts.join(' ');
    }

    /**
     * Basic detection fallback
     */
    async basicDetection(canvas) {
        return new Promise((resolve) => {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Simple blob detection
            const blobs = this.detectBlobs(imageData, canvas.width, canvas.height);
            
            const detections = blobs.map((blob, i) => ({
                class: 'object',
                confidence: blob.confidence,
                bbox: [blob.x, blob.y, blob.width, blob.height],
                label: 'object'
            }));
            
            resolve(detections);
        });
    }

    /**
     * Detect blobs in image
     */
    detectBlobs(imageData, width, height) {
        const data = imageData.data;
        const blobs = [];
        const visited = new Uint8Array(width * height);
        
        // Convert to grayscale
        const gray = new Uint8Array(width * height);
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
                    if (blob && blob.width > 20 && blob.height > 20) {
                        blobs.push(blob);
                    }
                }
            }
        }
        
        return blobs;
    }

    traceBlob(binary, visited, startX, startY, width, height) {
        const queue = [[startX, startY]];
        let minX = startX, maxX = startX;
        let minY = startY, maxY = startY;
        
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const i = y * width + x;
            
            if (visited[i] || binary[i] !== 255) continue;
            visited[i] = 1;
            
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            
            if (x > 0) queue.push([x - 1, y]);
            if (x < width - 1) queue.push([x + 1, y]);
            if (y > 0) queue.push([x, y - 1]);
            if (y < height - 1) queue.push([x, y + 1]);
        }
        
        const blobWidth = maxX - minX + 1;
        const blobHeight = maxY - minY + 1;
        
        return {
            x: minX,
            y: minY,
            width: blobWidth,
            height: blobHeight,
            confidence: 0.5 + Math.random() * 0.3
        };
    }

    /**
     * Calculate average color from image data
     */
    calculateAverageColor(imageData) {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        
        const pixelCount = data.length / 4;
        return {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount)
        };
    }

    /**
     * Get color name from RGB
     */
    getColorName(rgb) {
        const { r, g, b } = rgb;
        
        // Simple color naming
        if (r > 200 && g < 100 && b < 100) return 'Red';
        if (r < 100 && g > 200 && b < 100) return 'Green';
        if (r < 100 && g < 100 && b > 200) return 'Blue';
        if (r > 200 && g > 200 && b < 100) return 'Yellow';
        if (r > 200 && g < 150 && b > 200) return 'Magenta';
        if (r < 100 && g > 200 && b > 200) return 'Cyan';
        if (r > 200 && g > 150 && b < 100) return 'Orange';
        if (r > 180 && g < 100 && b > 180) return 'Purple';
        
        if (r > 200 && g > 200 && b > 200) return 'White';
        if (r < 50 && g < 50 && b < 50) return 'Black';
        if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'Gray';
        
        return 'Mixed';
    }

    /**
     * Convert RGB to Hex
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    /**
     * Estimate material from object class
     */
    estimateMaterialFromClass(objectClass) {
        const classLower = objectClass.toLowerCase();
        
        if (classLower.includes('chair') || classLower.includes('table') || classLower.includes('couch')) {
            return 'Wood/Fabric';
        }
        if (classLower.includes('bottle') || classLower.includes('cup') || classLower.includes('vase')) {
            return 'Glass/Plastic';
        }
        if (classLower.includes('laptop') || classLower.includes('phone') || classLower.includes('tv')) {
            return 'Plastic/Metal';
        }
        if (classLower.includes('book') || classLower.includes('paper')) {
            return 'Paper';
        }
        if (classLower.includes('car') || classLower.includes('vehicle')) {
            return 'Metal';
        }
        
        return 'Unknown';
    }

    /**
     * Get current detections
     */
    getDetections() {
        return this.detections;
    }

    /**
     * Clear detections
     */
    clear() {
        this.detections = [];
    }
}

// Initialize comprehensive detection module
window.comprehensiveDetection = new ComprehensiveDetectionModule();
