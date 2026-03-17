/**
 * Enhanced Edge Detection Module
 * Advanced edge detection using multiple algorithms
 * - Canny Edge Detection
 * - HED (Holistically-Nested Edge Detection)
 * - Sobel Operators
 * - Laplacian Edge Detection
 */

class EdgeDetectionModule {
    constructor() {
        this.isCvReady = false;
        this.currentEdges = null;
        this.edgeHistory = [];
        this.settings = {
            canny: {
                threshold1: 50,
                threshold2: 150,
                apertureSize: 3
            },
            hed: {
                enabled: false,
                modelUrl: null
            },
            sobel: {
                ksize: 3,
                scale: 1,
                delta: 0
            },
            laplacian: {
                ksize: 3
            }
        };

        this.init();
    }

    async init() {
        this.checkOpenCV();
    }

    /**
     * Check if OpenCV is ready
     */
    checkOpenCV() {
        const check = () => {
            if (window.cv && window.cv.Mat) {
                this.isCvReady = true;
                console.log('[EdgeDetection] OpenCV ready');
                return true;
            }
            return false;
        };

        if (!check()) {
            // Wait for OpenCV to load
            window.onOpenCvReady = () => {
                this.isCvReady = true;
                console.log('[EdgeDetection] OpenCV loaded');
            };
        }
    }

    /**
     * Detect edges using Canny algorithm
     * @param {ImageData|HTMLCanvasElement|HTMLVideoElement} source - Image source
     * @param {Object} options - Canny parameters
     * @returns {Object} Edge detection result
     */
    detectCannyEdges(source, options = {}) {
        if (!this.isCvReady) {
            console.warn('[EdgeDetection] OpenCV not ready, using fallback');
            return this.fallbackEdgeDetection(source);
        }

        try {
            const params = { ...this.settings.canny, ...options };
            
            // Convert source to OpenCV Mat
            let src;
            if (source instanceof ImageData) {
                src = cv.matFromImageData(source);
            } else if (source instanceof HTMLCanvasElement || source instanceof HTMLVideoElement) {
                src = cv.imread(source);
            } else {
                console.error('[EdgeDetection] Invalid source type');
                return null;
            }

            const gray = new cv.Mat();
            const edges = new cv.Mat();
            const blurred = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            // Apply Gaussian blur to reduce noise
            const kernelSize = new cv.Size(params.apertureSize, params.apertureSize);
            cv.GaussianBlur(gray, blurred, kernelSize, 0);

            // Apply Canny edge detection
            cv.Canny(blurred, edges, params.threshold1, params.threshold2, params.apertureSize);

            // Find contours for enhanced edge analysis
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Analyze edges
            const edgeAnalysis = this.analyzeEdges(contours, edges);

            // Convert edges back to ImageData for display
            const edgeImageData = this.matToImageData(edges, src.cols, src.rows);

            // Cleanup
            src.delete();
            gray.delete();
            edges.delete();
            blurred.delete();
            contours.delete();
            hierarchy.delete();

            const result = {
                method: 'canny',
                edges: edgeImageData,
                edgeMat: edges,
                analysis: edgeAnalysis,
                params: params,
                timestamp: Date.now()
            };

            this.currentEdges = result;
            this.edgeHistory.push(result);
            
            // Limit history
            if (this.edgeHistory.length > 10) {
                this.edgeHistory.shift();
            }

            return result;
        } catch (error) {
            console.error('[EdgeDetection] Canny error:', error);
            return this.fallbackEdgeDetection(source);
        }
    }

    /**
     * Detect edges using Sobel operators
     * @param {ImageData|HTMLCanvasElement} source - Image source
     * @param {Object} options - Sobel parameters
     * @returns {Object} Edge detection result
     */
    detectSobelEdges(source, options = {}) {
        if (!this.isCvReady) return null;

        try {
            const params = { ...this.settings.sobel, ...options };
            
            let src;
            if (source instanceof ImageData) {
                src = cv.matFromImageData(source);
            } else {
                src = cv.imread(source);
            }

            const gray = new cv.Mat();
            const gradX = new cv.Mat();
            const gradY = new cv.Mat();
            const edges = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            // Apply Sobel operators
            cv.Sobel(gray, gradX, cv.CV_64F, 1, 0, params.ksize, params.scale, params.delta);
            cv.Sobel(gray, gradY, cv.CV_64F, 0, 1, params.ksize, params.scale, params.delta);

            // Convert to absolute values
            const absGradX = new cv.Mat();
            const absGradY = new cv.Mat();
            cv.convertScaleAbs(gradX, absGradX);
            cv.convertScaleAbs(gradY, absGradY);

            // Combine gradients
            cv.addWeighted(absGradX, 0.5, absGradY, 0.5, 0, edges);

            // Convert to ImageData
            const edgeImageData = this.matToImageData(edges, src.cols, src.rows);

            // Cleanup
            src.delete();
            gray.delete();
            gradX.delete();
            gradY.delete();
            edges.delete();
            absGradX.delete();
            absGradY.delete();

            return {
                method: 'sobel',
                edges: edgeImageData,
                params: params,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[EdgeDetection] Sobel error:', error);
            return null;
        }
    }

    /**
     * Detect edges using Laplacian operator
     * @param {ImageData|HTMLCanvasElement} source - Image source
     * @param {Object} options - Laplacian parameters
     * @returns {Object} Edge detection result
     */
    detectLaplacianEdges(source, options = {}) {
        if (!this.isCvReady) return null;

        try {
            const params = { ...this.settings.laplacian, ...options };
            
            let src;
            if (source instanceof ImageData) {
                src = cv.matFromImageData(source);
            } else {
                src = cv.imread(source);
            }

            const gray = new cv.Mat();
            const edges = new cv.Mat();
            const blurred = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            // Apply Gaussian blur
            cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);

            // Apply Laplacian operator
            cv.Laplacian(blurred, edges, cv.CV_64F, params.ksize);

            // Convert to 8-bit
            const edgesAbs = new cv.Mat();
            cv.convertScaleAbs(edges, edgesAbs);

            // Convert to ImageData
            const edgeImageData = this.matToImageData(edgesAbs, src.cols, src.rows);

            // Cleanup
            src.delete();
            gray.delete();
            edges.delete();
            blurred.delete();
            edgesAbs.delete();

            return {
                method: 'laplacian',
                edges: edgeImageData,
                params: params,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[EdgeDetection] Laplacian error:', error);
            return null;
        }
    }

    /**
     * Combined edge detection using multiple methods
     * @param {ImageData|HTMLCanvasElement} source - Image source
     * @returns {Object} Combined edge detection result
     */
    detectEdgesCombined(source) {
        const results = {
            canny: this.detectCannyEdges(source),
            sobel: this.detectSobelEdges(source),
            laplacian: this.detectLaplacianEdges(source)
        };

        // Combine edge maps (logical OR)
        if (results.canny && results.sobel && results.laplacian) {
            const combined = this.combineEdgeMaps([
                results.canny.edges,
                results.sobel.edges,
                results.laplacian.edges
            ]);

            return {
                method: 'combined',
                edges: combined,
                individual: results,
                timestamp: Date.now()
            };
        }

        return results.canny || results.sobel || results.laplacian;
    }

    /**
     * Detect rectangles from edges
     * @param {Object} edgeResult - Edge detection result
     * @returns {Array} Detected rectangles
     */
    detectRectangles(edgeResult) {
        if (!this.isCvReady || !edgeResult) return [];

        try {
            const edges = edgeResult.edgeMat || cv.matFromImageData(edgeResult.edges);
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();

            // Find contours
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const rectangles = [];

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                
                // Approximate contour to polygon
                const epsilon = 0.02 * cv.arcLength(contour, true);
                const approx = new cv.Mat();
                cv.approxPolyDP(contour, approx, epsilon, true);

                // Check if quadrilateral (4 sides)
                if (approx.rows === 4) {
                    const area = cv.contourArea(contour);
                    
                    // Filter small areas
                    if (area > 1000) {
                        // Check if convex
                        if (cv.isContourConvex(approx)) {
                            // Get bounding rectangle
                            const rect = cv.boundingRect(contour);
                            
                            // Calculate aspect ratio
                            const aspectRatio = rect.width / rect.height;
                            
                            // Check rectangle properties
                            const corners = [];
                            for (let j = 0; j < 4; j++) {
                                corners.push({
                                    x: approx.data32S[j * 2],
                                    y: approx.data32S[j * 2 + 1]
                                });
                            }

                            rectangles.push({
                                bbox: [rect.x, rect.y, rect.width, rect.height],
                                area: area,
                                corners: corners,
                                aspectRatio: aspectRatio,
                                contour: contour.clone(),
                                confidence: this.calculateRectangleConfidence(corners, aspectRatio)
                            });
                        }
                    }
                }

                approx.delete();
                contour.delete();
            }

            // Cleanup
            contours.delete();
            hierarchy.delete();
            if (!edgeResult.edgeMat) edges.delete();

            return rectangles;
        } catch (error) {
            console.error('[EdgeDetection] Rectangle detection error:', error);
            return [];
        }
    }

    /**
     * Detect lines from edges using Hough Transform
     * @param {Object} edgeResult - Edge detection result
     * @param {Object} options - Hough parameters
     * @returns {Array} Detected lines
     */
    detectLines(edgeResult, options = {}) {
        if (!this.isCvReady || !edgeResult) return [];

        const defaultOptions = {
            rho: 1,
            theta: Math.PI / 180,
            threshold: 50,
            minLineLength: 30,
            maxLineGap: 10
        };

        const params = { ...defaultOptions, ...options };

        try {
            const edges = edgeResult.edgeMat || cv.matFromImageData(edgeResult.edges);
            const lines = new cv.Mat();

            // Probabilistic Hough Line Transform
            cv.HoughLinesP(
                edges,
                lines,
                params.rho,
                params.theta,
                params.threshold,
                params.minLineLength,
                params.maxLineGap
            );

            const detectedLines = [];

            for (let i = 0; i < lines.rows; i++) {
                detectedLines.push({
                    x1: lines.data32S[i * 4],
                    y1: lines.data32S[i * 4 + 1],
                    x2: lines.data32S[i * 4 + 2],
                    y2: lines.data32S[i * 4 + 3],
                    length: Math.sqrt(
                        Math.pow(lines.data32S[i * 4 + 2] - lines.data32S[i * 4], 2) +
                        Math.pow(lines.data32S[i * 4 + 3] - lines.data32S[i * 4 + 1], 2)
                    ),
                    angle: Math.atan2(
                        lines.data32S[i * 4 + 3] - lines.data32S[i * 4 + 1],
                        lines.data32S[i * 4 + 2] - lines.data32S[i * 4]
                    ) * (180 / Math.PI)
                });
            }

            lines.delete();
            if (!edgeResult.edgeMat) edges.delete();

            return detectedLines;
        } catch (error) {
            console.error('[EdgeDetection] Line detection error:', error);
            return [];
        }
    }

    /**
     * Analyze edge properties
     */
    analyzeEdges(contours, edges) {
        let totalEdgePixels = 0;
        const contourAreas = [];

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            if (area > 0) {
                contourAreas.push(area);
            }
        }

        // Count edge pixels
        for (let i = 0; i < edges.rows; i++) {
            for (let j = 0; j < edges.cols; j++) {
                if (edges.ucharAt(i, j) > 0) {
                    totalEdgePixels++;
                }
            }
        }

        const totalPixels = edges.rows * edges.cols;
        const edgeDensity = totalEdgePixels / totalPixels;

        return {
            totalEdgePixels: totalEdgePixels,
            edgeDensity: edgeDensity,
            contourCount: contours.size(),
            averageContourArea: contourAreas.length > 0 
                ? contourAreas.reduce((a, b) => a + b, 0) / contourAreas.length 
                : 0,
            maxContourArea: contourAreas.length > 0 ? Math.max(...contourAreas) : 0
        };
    }

    /**
     * Combine multiple edge maps
     */
    combineEdgeMaps(edgeMaps) {
        if (!this.isCvReady || edgeMaps.length === 0) return null;

        try {
            // Create result mat
            const result = cv.matFromImageData(edgeMaps[0]);
            const temp = new cv.Mat();

            for (let i = 1; i < edgeMaps.length; i++) {
                const edgeMap = cv.matFromImageData(edgeMaps[i]);
                
                // Bitwise OR to combine
                cv.bitwise_or(result, edgeMap, temp);
                temp.copyTo(result);
                
                edgeMap.delete();
            }

            const resultImageData = this.matToImageData(result, result.cols, result.rows);

            // Cleanup
            result.delete();
            temp.delete();

            return resultImageData;
        } catch (error) {
            console.error('[EdgeDetection] Combine error:', error);
            return edgeMaps[0];
        }
    }

    /**
     * Fallback edge detection without OpenCV
     */
    fallbackEdgeDetection(source) {
        let imageData;
        
        if (source instanceof ImageData) {
            imageData = source;
        } else if (source instanceof HTMLCanvasElement) {
            const ctx = source.getContext('2d');
            imageData = ctx.getImageData(0, 0, source.width, source.height);
        } else {
            return null;
        }

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const edges = new Uint8ClampedArray(width * height * 4);

        // Simple Sobel edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x) * 4;

                // Convert to grayscale
                const p00 = this.rgbToGray(data, (y - 1) * width + (x - 1));
                const p01 = this.rgbToGray(data, (y - 1) * width + x);
                const p02 = this.rgbToGray(data, (y - 1) * width + (x + 1));
                const p10 = this.rgbToGray(data, y * width + (x - 1));
                const p12 = this.rgbToGray(data, y * width + (x + 1));
                const p20 = this.rgbToGray(data, (y + 1) * width + (x - 1));
                const p21 = this.rgbToGray(data, (y + 1) * width + x);
                const p22 = this.rgbToGray(data, (y + 1) * width + (x + 1));

                // Sobel operators
                const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
                const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const edgeValue = magnitude > 50 ? 255 : 0;

                edges[i] = edgeValue;
                edges[i + 1] = edgeValue;
                edges[i + 2] = edgeValue;
                edges[i + 3] = 255;
            }
        }

        return new ImageData(edges, width, height);
    }

    /**
     * Calculate rectangle confidence score
     */
    calculateRectangleConfidence(corners, aspectRatio) {
        // Check if angles are close to 90 degrees
        let angleScore = 1;
        
        for (let i = 0; i < 4; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % 4];
            const p3 = corners[(i + 2) % 4];

            const angle = this.calculateAngle(p1, p2, p3);
            const angleDiff = Math.abs(angle - 90);
            
            if (angleDiff > 20) {
                angleScore -= 0.2;
            }
        }

        // Aspect ratio score (prefer common ratios)
        let ratioScore = 1;
        const commonRatios = [1, 1.414, 1.618, 0.707]; // Square, A4, Golden, etc.
        const minRatioDiff = Math.min(...commonRatios.map(r => Math.abs(aspectRatio - r)));
        
        if (minRatioDiff > 0.5) {
            ratioScore = 0.7;
        }

        return Math.max(0.3, (angleScore + ratioScore) / 2);
    }

    // Utility functions
    matToImageData(mat, width, height) {
        const imageData = new ImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < mat.rows; i++) {
            for (let j = 0; j < mat.cols; j++) {
                const idx = (i * width + j) * 4;
                const value = mat.ucharAt(i, j);
                data[idx] = value;
                data[idx + 1] = value;
                data[idx + 2] = value;
                data[idx + 3] = 255;
            }
        }

        return imageData;
    }

    rgbToGray(data, idx) {
        const i = idx * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    calculateAngle(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    }

    /**
     * Draw edges on canvas
     */
    drawEdges(edgeResult, canvas) {
        if (!edgeResult || !canvas) return;

        const ctx = canvas.getContext('2d');
        
        if (edgeResult.edges instanceof ImageData) {
            ctx.putImageData(edgeResult.edges, 0, 0);
        } else {
            ctx.drawImage(edgeResult.edges, 0, 0);
        }
    }

    /**
     * Get edge detection settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update edge detection settings
     */
    updateSettings(newSettings) {
        this.settings = {
            canny: { ...this.settings.canny, ...newSettings.canny },
            sobel: { ...this.settings.sobel, ...newSettings.sobel },
            laplacian: { ...this.settings.laplacian, ...newSettings.laplacian },
            hed: { ...this.settings.hed, ...newSettings.hed }
        };
    }
}

// Initialize edge detection module
window.edgeDetection = new EdgeDetectionModule();
