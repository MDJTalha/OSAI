/**
 * Damage & Defect Detection Module
 * Identify damage, defects, and anomalies
 * - Crack detection
 * - Scratch detection
 * - Rust/corrosion detection
 * - Dent detection
 * - General anomaly detection
 */

class DamageDetectionModule {
    constructor() {
        this.defectTypes = {
            crack: {
                name: 'Crack',
                severity: 'high',
                patterns: ['linear', 'branching'],
                colors: ['dark', 'contrasting']
            },
            scratch: {
                name: 'Scratch',
                severity: 'medium',
                patterns: ['linear', 'parallel'],
                colors: ['light', 'reflective']
            },
            rust: {
                name: 'Rust/Corrosion',
                severity: 'medium',
                patterns: ['patchy', 'spotted'],
                colors: ['orange', 'brown', 'red']
            },
            dent: {
                name: 'Dent',
                severity: 'medium',
                patterns: ['concave', 'shadow'],
                colors: ['shadow_gradient']
            },
            broken: {
                name: 'Broken',
                severity: 'critical',
                patterns: ['irregular', 'jagged'],
                colors: ['contrasting']
            },
            stain: {
                name: 'Stain',
                severity: 'low',
                patterns: ['irregular', 'spread'],
                colors: ['darker', 'discolored']
            },
            burn: {
                name: 'Burn Mark',
                severity: 'high',
                patterns: ['charred', 'blackened'],
                colors: ['black', 'dark_brown']
            }
        };

        this.isCvReady = false;
        this.detectionHistory = [];
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
     * Detect damage in image
     */
    async detectDamage(imageData, region = null) {
        if (!this.isCvReady) {
            return this.detectDamageBasic(imageData);
        }

        try {
            let src;
            if (imageData instanceof ImageData) {
                src = cv.matFromImageData(imageData);
            } else {
                src = cv.imread(imageData);
            }

            const results = {
                defects: [],
                overallCondition: 'good',
                confidence: 0
            };

            // Run multiple detection algorithms
            const cracks = await this.detectCracks(src);
            const scratches = await this.detectScratches(src);
            const rust = await this.detectRust(src);
            const dents = await this.detectDents(src);

            // Combine results
            results.defects.push(...cracks, ...scratches, ...rust, ...dents);

            // Calculate overall condition
            results.overallCondition = this.assessOverallCondition(results.defects);
            results.confidence = this.calculateDetectionConfidence(results.defects);

            // Cleanup
            src.delete();

            // Store in history
            this.detectionHistory.push(results);
            if (this.detectionHistory.length > 50) {
                this.detectionHistory.shift();
            }

            return results;
        } catch (error) {
            console.error('[DamageDetection] Error:', error);
            return this.detectDamageBasic(imageData);
        }
    }

    /**
     * Detect cracks
     */
    async detectCracks(src) {
        const defects = [];
        
        try {
            const gray = new cv.Mat();
            const edges = new cv.Mat();
            const blurred = new cv.Mat();

            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            cv.Canny(blurred, edges, 50, 150);

            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                // Cracks are typically long and thin
                if (area > 100 && area < 5000) {
                    const rect = cv.boundingRect(contour);
                    const aspectRatio = rect.width / rect.height;
                    
                    // Crack detection: high aspect ratio or very thin
                    if (aspectRatio > 5 || aspectRatio < 0.2) {
                        const arcLength = cv.arcLength(contour, true);
                        const compactness = (4 * Math.PI * area) / (arcLength * arcLength);
                        
                        if (compactness < 0.3) { // Low compactness indicates linear shape
                            defects.push({
                                type: 'crack',
                                bbox: [rect.x, rect.y, rect.width, rect.height],
                                area: area,
                                severity: this.calculateCrackSeverity(rect),
                                confidence: 0.7 + (1 - compactness) * 0.3
                            });
                        }
                    }
                }
                
                contour.delete();
            }

            // Cleanup
            gray.delete();
            edges.delete();
            blurred.delete();
            contours.delete();
            hierarchy.delete();
        } catch (error) {
            console.error('[DamageDetection] Crack detection error:', error);
        }

        return defects;
    }

    /**
     * Detect scratches
     */
    async detectScratches(src) {
        const defects = [];
        
        try {
            const gray = new cv.Mat();
            const blurred = new cv.Mat();
            const edges = new cv.Mat();

            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
            
            // Use adaptive thresholding for scratch detection
            cv.adaptiveThreshold(
                blurred, 
                edges, 
                255, 
                cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv.THRESH_BINARY_INV, 
                11, 
                2
            );

            // Morphological operations to enhance linear features
            const kernel = cv.Mat.ones(3, 1, cv.CV_8U);
            const dilated = new cv.Mat();
            cv.dilate(edges, dilated, kernel);

            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 50 && area < 2000) {
                    const rect = cv.boundingRect(contour);
                    const aspectRatio = rect.width / rect.height;
                    
                    // Scratches are thin and linear
                    if ((aspectRatio > 3 || aspectRatio < 0.33) && rect.width > 10) {
                        defects.push({
                            type: 'scratch',
                            bbox: [rect.x, rect.y, rect.width, rect.height],
                            length: Math.max(rect.width, rect.height),
                            severity: 'low',
                            confidence: 0.6
                        });
                    }
                }
                
                contour.delete();
            }

            // Cleanup
            gray.delete();
            blurred.delete();
            edges.delete();
            dilated.delete();
            kernel.delete();
            contours.delete();
            hierarchy.delete();
        } catch (error) {
            console.error('[DamageDetection] Scratch detection error:', error);
        }

        return defects;
    }

    /**
     * Detect rust/corrosion
     */
    async detectRust(src) {
        const defects = [];
        
        try {
            const hsv = new cv.Mat();
            const mask = new cv.Mat();

            cv.cvtColor(src, hsv, cv.COLOR_RGBA2HSV);

            // Rust color range (orange/brown/red)
            const lowerRust = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 100, 100, 0]);
            const upperRust = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [15, 255, 255, 0]);
            
            cv.inRange(hsv, lowerRust, upperRust, mask);

            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 500) {
                    const rect = cv.boundingRect(contour);
                    
                    // Rust typically has irregular, patchy appearance
                    const circularity = this.calculateCircularity(contour);
                    
                    if (circularity < 0.7) { // Irregular shape
                        defects.push({
                            type: 'rust',
                            bbox: [rect.x, rect.y, rect.width, rect.height],
                            area: area,
                            severity: area > 2000 ? 'medium' : 'low',
                            confidence: 0.65
                        });
                    }
                }
                
                contour.delete();
            }

            // Cleanup
            hsv.delete();
            mask.delete();
            lowerRust.delete();
            upperRust.delete();
            contours.delete();
            hierarchy.delete();
        } catch (error) {
            console.error('[DamageDetection] Rust detection error:', error);
        }

        return defects;
    }

    /**
     * Detect dents
     */
    async detectDents(src) {
        const defects = [];
        
        try {
            const gray = new cv.Mat();
            const blurred = new cv.Mat();
            const gradient = new cv.Mat();

            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

            // Calculate gradient to detect shadow patterns
            const kernelX = cv.Mat.ones(3, 3, cv.CV_32F);
            const kernelY = cv.Mat.ones(3, 3, cv.CV_32F);
            
            // Simple gradient approximation
            cv.Sobel(blurred, gradient, cv.CV_64F, 1, 1, 3);

            // Threshold gradient changes
            const threshold = new cv.Mat();
            cv.threshold(gradient, threshold, 30, 255, cv.THRESH_BINARY);

            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(threshold, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 200 && area < 10000) {
                    const rect = cv.boundingRect(contour);
                    
                    // Dents often have circular/oval shadow patterns
                    const circularity = this.calculateCircularity(contour);
                    
                    if (circularity > 0.5 && circularity < 0.9) {
                        defects.push({
                            type: 'dent',
                            bbox: [rect.x, rect.y, rect.width, rect.height],
                            area: area,
                            depth: 'estimated',
                            severity: 'medium',
                            confidence: 0.55
                        });
                    }
                }
                
                contour.delete();
            }

            // Cleanup
            gray.delete();
            blurred.delete();
            gradient.delete();
            threshold.delete();
            kernelX.delete();
            kernelY.delete();
            contours.delete();
            hierarchy.delete();
        } catch (error) {
            console.error('[DamageDetection] Dent detection error:', error);
        }

        return defects;
    }

    /**
     * Basic damage detection (no OpenCV)
     */
    detectDamageBasic(imageData) {
        const data = imageData.data;
        const anomalies = [];
        
        // Simple anomaly detection based on color variance
        let rSum = 0, gSum = 0, bSum = 0;
        let rVar = 0, gVar = 0, bVar = 0;
        const n = Math.min(data.length / 4, 1000);

        // Calculate mean
        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
        }

        const rMean = rSum / n;
        const gMean = gSum / n;
        const bMean = bSum / n;

        // Calculate variance
        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            rVar += Math.pow(data[idx] - rMean, 2);
            gVar += Math.pow(data[idx + 1] - gMean, 2);
            bVar += Math.pow(data[idx + 2] - bMean, 2);
        }

        const totalVariance = (rVar + gVar + bVar) / (3 * n);
        const stdDev = Math.sqrt(totalVariance);

        // High variance might indicate damage/anomaly
        const hasAnomaly = stdDev > 50;

        return {
            defects: hasAnomaly ? [{
                type: 'anomaly',
                severity: 'unknown',
                confidence: 0.4,
                note: 'High color variance detected'
            }] : [],
            overallCondition: hasAnomaly ? 'needs_inspection' : 'good',
            confidence: 0.4,
            method: 'basic'
        };
    }

    /**
     * Calculate crack severity
     */
    calculateCrackSeverity(rect) {
        const length = Math.max(rect.width, rect.height);
        
        if (length > 200) return 'critical';
        if (length > 100) return 'high';
        if (length > 50) return 'medium';
        return 'low';
    }

    /**
     * Calculate contour circularity
     */
    calculateCircularity(contour) {
        const area = cv.contourArea(contour);
        const perimeter = cv.arcLength(contour, true);
        
        if (perimeter === 0) return 0;
        
        return (4 * Math.PI * area) / (perimeter * perimeter);
    }

    /**
     * Assess overall condition
     */
    assessOverallCondition(defects) {
        if (defects.length === 0) return 'excellent';

        const severityScores = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };

        let totalScore = 0;
        defects.forEach(d => {
            totalScore += severityScores[d.severity] || 1;
        });

        const avgScore = totalScore / defects.length;

        if (avgScore >= 3.5) return 'critical';
        if (avgScore >= 2.5) return 'poor';
        if (avgScore >= 1.5) return 'fair';
        return 'good';
    }

    /**
     * Calculate detection confidence
     */
    calculateDetectionConfidence(defects) {
        if (defects.length === 0) return 0.9;

        const avgConfidence = defects.reduce((sum, d) => sum + (d.confidence || 0.5), 0) / defects.length;
        return avgConfidence;
    }

    /**
     * Generate inspection report
     */
    generateReport(detectionResult, locationId = null) {
        return {
            reportId: this.generateId(),
            timestamp: Date.now(),
            location: locationId,
            overallCondition: detectionResult.overallCondition,
            defectsFound: detectionResult.defects.length,
            defects: detectionResult.defects.map(d => ({
                type: this.defectTypes[d.type]?.name || d.type,
                severity: d.severity,
                confidence: Math.round(d.confidence * 100) + '%',
                location: d.bbox,
                recommendedAction: this.getRecommendedAction(d)
            })),
            summary: this.generateSummary(detectionResult),
            confidence: Math.round(detectionResult.confidence * 100) + '%'
        };
    }

    /**
     * Get recommended action for defect
     */
    getRecommendedAction(defect) {
        const actions = {
            crack: {
                critical: 'Immediate repair required',
                high: 'Schedule repair soon',
                medium: 'Monitor and plan repair',
                low: 'Monitor for growth'
            },
            scratch: {
                low: 'Cosmetic - optional repair'
            },
            rust: {
                medium: 'Treat to prevent spread',
                low: 'Clean and monitor'
            },
            dent: {
                medium: 'Assess structural impact'
            },
            broken: {
                critical: 'Replace immediately'
            }
        };

        return actions[defect.type]?.[defect.severity] || 'Inspect further';
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(result) {
        if (result.defects.length === 0) {
            return 'No significant damage detected. Item is in good condition.';
        }

        const defectTypes = {};
        result.defects.forEach(d => {
            defectTypes[d.type] = (defectTypes[d.type] || 0) + 1;
        });

        const parts = Object.entries(defectTypes).map(([type, count]) => {
            const name = this.defectTypes[type]?.name || type;
            return `${count} ${name}${count > 1 ? 's' : ''}`;
        });

        return `Detected: ${parts.join(', ')}. Overall condition: ${result.overallCondition}.`;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `dd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get detection history
     */
    getHistory(limit = 10) {
        return this.detectionHistory.slice(-limit);
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.detectionHistory = [];
    }

    /**
     * Get supported defect types
     */
    getDefectTypes() {
        return Object.values(this.defectTypes);
    }
}

// Initialize damage detection module
window.damageDetection = new DamageDetectionModule();
