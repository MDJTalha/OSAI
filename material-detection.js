/**
 * Material Detection Module
 * Identify material types from images
 * - Wood, metal, plastic, fabric, glass detection
 * - Texture analysis
 * - Reflectance estimation
 * - Color pattern recognition
 */

class MaterialDetectionModule {
    constructor() {
        this.materialClasses = {
            wood: {
                name: 'Wood',
                icon: '🪵',
                properties: {
                    typicalColors: ['brown', 'tan', 'reddish'],
                    texturePattern: 'grain',
                    reflectivity: 'low-medium'
                }
            },
            metal: {
                name: 'Metal',
                icon: '🔩',
                properties: {
                    typicalColors: ['silver', 'gray', 'metallic'],
                    texturePattern: 'smooth/brushed',
                    reflectivity: 'high'
                }
            },
            plastic: {
                name: 'Plastic',
                icon: '🧪',
                properties: {
                    typicalColors: ['various'],
                    texturePattern: 'smooth',
                    reflectivity: 'medium'
                }
            },
            fabric: {
                name: 'Fabric',
                icon: '🧶',
                properties: {
                    typicalColors: ['various'],
                    texturePattern: 'woven',
                    reflectivity: 'low'
                }
            },
            glass: {
                name: 'Glass',
                icon: '🥃',
                properties: {
                    typicalColors: ['transparent', 'tinted'],
                    texturePattern: 'smooth',
                    reflectivity: 'very-high'
                }
            },
            paper: {
                name: 'Paper',
                icon: '📄',
                properties: {
                    typicalColors: ['white', 'off-white'],
                    texturePattern: 'smooth/fibrous',
                    reflectivity: 'low-medium'
                }
            },
            leather: {
                name: 'Leather',
                icon: '👜',
                properties: {
                    typicalColors: ['brown', 'black', 'tan'],
                    texturePattern: 'grained',
                    reflectivity: 'low-medium'
                }
            },
            ceramic: {
                name: 'Ceramic',
                icon: '🏺',
                properties: {
                    typicalColors: ['white', 'colored'],
                    texturePattern: 'smooth/glazed',
                    reflectivity: 'medium-high'
                }
            }
        };

        this.isCvReady = false;
        this.init();
    }

    async init() {
        this.checkOpenCV();
    }

    checkOpenCV() {
        if (window.cv && window.cv.Mat) {
            this.isCvReady = true;
        } else {
            window.onOpenCvReady = () => {
                this.isCvReady = true;
            };
        }
    }

    /**
     * Detect material type from image
     */
    async detectMaterial(imageData, region = null) {
        if (!this.isCvReady) {
            return this.detectMaterialBasic(imageData);
        }

        try {
            // Extract region of interest
            let roi;
            if (region) {
                roi = this.extractROI(imageData, region);
            } else {
                roi = imageData;
            }

            // Extract material features
            const features = await this.extractMaterialFeatures(roi);

            // Classify material
            const classification = this.classifyMaterial(features);

            return {
                material: classification.material,
                confidence: classification.confidence,
                features: features,
                alternatives: classification.alternatives,
                method: 'opencv-analysis'
            };
        } catch (error) {
            console.error('[MaterialDetection] Error:', error);
            return this.detectMaterialBasic(imageData);
        }
    }

    /**
     * Extract material features using OpenCV
     */
    async extractMaterialFeatures(imageData) {
        const src = cv.matFromImageData(imageData);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Apply Gaussian blur
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        const features = {
            // Color features
            colorHistogram: this.extractColorHistogram(src),
            averageColor: this.extractAverageColor(src),
            colorVariance: this.extractColorVariance(src),

            // Texture features
            textureEnergy: this.calculateTextureEnergy(blurred),
            textureContrast: this.calculateContrast(blurred),
            textureHomogeneity: this.calculateHomogeneity(blurred),
            edgeDensity: this.calculateEdgeDensity(gray),

            // Reflectance features
            specularHighlights: this.detectSpecularHighlights(src),
            roughness: this.calculateRoughness(blurred),

            // Pattern features
            linePatterns: this.detectLinePatterns(gray),
            grainDirection: this.detectGrainDirection(gray)
        };

        // Cleanup
        src.delete();
        gray.delete();
        blurred.delete();

        return features;
    }

    /**
     * Extract color histogram
     */
    extractColorHistogram(src) {
        const histSize = 16;
        const histogram = {
            r: new Array(histSize).fill(0),
            g: new Array(histSize).fill(0),
            b: new Array(histSize).fill(0)
        };

        const data = src.data;
        const totalPixels = src.rows * src.cols;

        for (let i = 0; i < Math.min(data.length, totalPixels * 4); i += 4) {
            const r = Math.floor(data[i] / (256 / histSize));
            const g = Math.floor(data[i + 1] / (256 / histSize));
            const b = Math.floor(data[i + 2] / (256 / histSize));

            if (r < histSize) histogram.r[r]++;
            if (g < histSize) histogram.g[g]++;
            if (b < histSize) histogram.b[b]++;
        }

        // Normalize
        ['r', 'g', 'b'].forEach(channel => {
            const sum = histogram[channel].reduce((a, b) => a + b, 0);
            histogram[channel] = histogram[channel].map(v => v / sum);
        });

        return histogram;
    }

    /**
     * Extract average color
     */
    extractAverageColor(src) {
        const mean = cv.mean(src);
        return {
            r: mean[0],
            g: mean[1],
            b: mean[2],
            a: mean[3]
        };
    }

    /**
     * Extract color variance
     */
    extractColorVariance(src) {
        const data = src.data;
        let rSum = 0, gSum = 0, bSum = 0;
        let rSqSum = 0, gSqSum = 0, bSqSum = 0;
        const n = Math.min(data.length / 4, 1000);

        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];

            rSqSum += data[idx] * data[idx];
            gSqSum += data[idx + 1] * data[idx + 1];
            bSqSum += data[idx + 2] * data[idx + 2];
        }

        return {
            r: Math.sqrt(rSqSum / n - Math.pow(rSum / n, 2)),
            g: Math.sqrt(gSqSum / n - Math.pow(gSum / n, 2)),
            b: Math.sqrt(bSqSum / n - Math.pow(bSum / n, 2))
        };
    }

    /**
     * Calculate texture energy
     */
    calculateTextureEnergy(gray) {
        const data = gray.data64F || gray.data;
        let energy = 0;
        const n = Math.min(data.length, 1000);

        for (let i = 0; i < n; i++) {
            energy += data[i] * data[i];
        }

        return energy / n;
    }

    /**
     * Calculate texture contrast
     */
    calculateContrast(gray) {
        const data = gray.data;
        let contrast = 0;
        const n = Math.min(data.length - 4, 1000);

        for (let i = 0; i < n; i += 4) {
            contrast += Math.abs(data[i] - data[i + 4]);
        }

        return contrast / (n / 4);
    }

    /**
     * Calculate texture homogeneity
     */
    calculateHomogeneity(gray) {
        const data = gray.data;
        let homogeneity = 0;
        const n = Math.min(data.length - 4, 1000);

        for (let i = 0; i < n; i += 4) {
            const diff = Math.abs(data[i] - data[i + 4]);
            homogeneity += 1 / (1 + diff * diff);
        }

        return homogeneity / (n / 4);
    }

    /**
     * Calculate edge density
     */
    calculateEdgeDensity(gray) {
        const edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);

        let edgePixels = 0;
        const totalPixels = edges.rows * edges.cols;

        for (let i = 0; i < edges.rows; i++) {
            for (let j = 0; j < edges.cols; j++) {
                if (edges.ucharAt(i, j) > 0) {
                    edgePixels++;
                }
            }
        }

        edges.delete();
        return edgePixels / totalPixels;
    }

    /**
     * Detect specular highlights (indicates reflectivity)
     */
    detectSpecularHighlights(src) {
        const data = src.data;
        let highlightCount = 0;
        const n = Math.min(data.length / 4, 1000);

        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Specular highlight: high intensity, low saturation
            const intensity = (r + g + b) / 3;
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;

            if (intensity > 200 && saturation < 0.3) {
                highlightCount++;
            }
        }

        return highlightCount / n;
    }

    /**
     * Calculate surface roughness
     */
    calculateRoughness(gray) {
        const laplacian = new cv.Mat();
        cv.Laplacian(gray, laplacian, cv.CV_64F);

        let variance = 0;
        const data = laplacian.data64F;
        const n = Math.min(data.length, 1000);
        let sum = 0;

        for (let i = 0; i < n; i++) {
            sum += Math.abs(data[i]);
        }

        laplacian.delete();
        return sum / n;
    }

    /**
     * Detect line patterns
     */
    detectLinePatterns(gray) {
        const edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);

        const lines = new cv.Mat();
        cv.HoughLinesP(
            edges,
            lines,
            1,
            Math.PI / 180,
            50,
            30,
            10
        );

        const lineDensity = lines.rows / (gray.rows * gray.cols) * 10000;

        edges.delete();
        lines.delete();

        return {
            count: lines.rows,
            density: lineDensity
        };
    }

    /**
     * Detect grain direction
     */
    detectGrainDirection(gray) {
        // Use Sobel to detect dominant edge direction
        const gradX = new cv.Mat();
        const gradY = new cv.Mat();

        cv.Sobel(gray, gradX, cv.CV_64F, 1, 0, 3);
        cv.Sobel(gray, gradY, cv.CV_64F, 0, 1, 3);

        const meanX = cv.mean(gradX)[0];
        const meanY = cv.mean(gradY)[0];

        const angle = Math.atan2(meanY, meanX) * (180 / Math.PI);

        gradX.delete();
        gradY.delete();

        return {
            angle: angle,
            dominant: Math.abs(meanX) > Math.abs(meanY) ? 'horizontal' : 'vertical'
        };
    }

    /**
     * Classify material based on features
     */
    classifyMaterial(features) {
        const scores = {};

        // Score each material class
        for (const [key, material] of Object.entries(this.materialClasses)) {
            scores[key] = this.calculateMaterialScore(features, material);
        }

        // Sort by score
        const sorted = Object.entries(scores)
            .sort((a, b) => b[1] - a[1]);

        const topMaterial = sorted[0];
        const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
        const confidence = topMaterial[1] / totalScore;

        const alternatives = sorted.slice(1, 3).map(([key, score]) => ({
            material: this.materialClasses[key].name,
            icon: this.materialClasses[key].icon,
            confidence: score / totalScore
        }));

        return {
            material: this.materialClasses[topMaterial[0]].name,
            icon: this.materialClasses[topMaterial[0]].icon,
            confidence: confidence,
            alternatives: alternatives
        };
    }

    /**
     * Calculate score for material class
     */
    calculateMaterialScore(features, material) {
        let score = 0;

        // Reflectivity scoring
        const reflectivityScores = {
            'high': features.specularHighlights > 0.1,
            'very-high': features.specularHighlights > 0.2,
            'medium': features.specularHighlights > 0.05 && features.specularHighlights <= 0.1,
            'low-medium': features.specularHighlights > 0.02 && features.specularHighlights <= 0.05,
            'low': features.specularHighlights <= 0.02
        };

        if (reflectivityScores[material.properties.reflectivity]) {
            score += 3;
        }

        // Texture scoring
        if (material.properties.texturePattern === 'grain' && features.linePatterns.density > 0.5) {
            score += 2;
        }

        if (material.properties.texturePattern === 'smooth' && features.roughness < 10) {
            score += 2;
        }

        if (material.properties.texturePattern === 'woven' && features.textureHomogeneity < 0.5) {
            score += 2;
        }

        // Edge density scoring
        if (features.edgeDensity > 0.2 && ['metal', 'glass'].includes(material.name.toLowerCase())) {
            score += 1;
        }

        if (features.edgeDensity < 0.1 && ['fabric', 'plastic'].includes(material.name.toLowerCase())) {
            score += 1;
        }

        return score;
    }

    /**
     * Basic material detection (no OpenCV)
     */
    detectMaterialBasic(imageData) {
        const data = imageData.data;
        
        // Calculate basic color statistics
        let rSum = 0, gSum = 0, bSum = 0;
        let variance = 0;
        const n = Math.min(data.length / 4, 100);

        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
        }

        const avgR = rSum / n;
        const avgG = gSum / n;
        const avgB = bSum / n;
        const brightness = (avgR + avgG + avgB) / 3;

        // Simple heuristics
        if (brightness > 200 && Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20) {
            return {
                material: 'Paper',
                icon: '📄',
                confidence: 0.6,
                method: 'basic'
            };
        }

        if (avgR > 150 && avgG > 100 && avgB < 100) {
            return {
                material: 'Wood',
                icon: '🪵',
                confidence: 0.5,
                method: 'basic'
            };
        }

        if (brightness > 150 && Math.abs(avgR - avgG) < 30 && Math.abs(avgG - avgB) < 30) {
            return {
                material: 'Metal',
                icon: '🔩',
                confidence: 0.5,
                method: 'basic'
            };
        }

        return {
            material: 'Unknown',
            icon: '❓',
            confidence: 0.3,
            method: 'basic'
        };
    }

    /**
     * Extract ROI from image
     */
    extractROI(imageData, region) {
        const [x, y, w, h] = region;
        const data = imageData.data;
        const width = imageData.width;
        
        const roiData = new Uint8ClampedArray(w * h * 4);
        
        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const srcIdx = ((y + row) * width + (x + col)) * 4;
                const dstIdx = (row * w + col) * 4;
                
                roiData[dstIdx] = data[srcIdx];
                roiData[dstIdx + 1] = data[srcIdx + 1];
                roiData[dstIdx + 2] = data[srcIdx + 2];
                roiData[dstIdx + 3] = data[srcIdx + 3];
            }
        }

        return new ImageData(roiData, w, h);
    }

    /**
     * Detect multiple materials in scene
     */
    async detectMultipleMaterials(imageData, regions) {
        const results = [];

        for (const region of regions) {
            const result = await this.detectMaterial(imageData, region);
            results.push({
                region: region,
                ...result
            });
        }

        return results;
    }

    /**
     * Get material properties
     */
    getMaterialProperties(materialName) {
        const key = Object.keys(this.materialClasses).find(
            k => this.materialClasses[k].name.toLowerCase() === materialName.toLowerCase()
        );

        if (key) {
            return this.materialClasses[key];
        }

        return null;
    }

    /**
     * Get all material classes
     */
    getMaterialClasses() {
        return Object.values(this.materialClasses);
    }

    /**
     * Add custom material class
     */
    addMaterialClass(key, material) {
        this.materialClasses[key] = material;
    }
}

// Initialize material detection module
window.materialDetection = new MaterialDetectionModule();
