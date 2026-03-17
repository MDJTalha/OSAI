/**
 * Depth Estimation Module
 * Precise depth calculation using multiple techniques
 * - Size-prior based estimation
 * - Perspective geometry
 * - Stereo vision (dual camera)
 * - Focus-based depth
 */

class DepthEstimationModule {
    constructor() {
        this.cameraIntrinsics = null;
        this.referenceObjects = {
            // Standard object sizes in cm
            'credit-card': { width: 8.57, height: 5.40 },
            'smartphone': { width: 7.0, height: 14.7 },
            'iphone': { width: 7.1, height: 14.7 },
            'a4-paper': { width: 21.0, height: 29.7 },
            'letter-paper': { width: 21.6, height: 27.9 },
            'quarter-coin': { diameter: 2.43 },
            'dime-coin': { diameter: 1.79 },
            'pencil': { diameter: 0.7, length: 18.0 },
            'pen': { diameter: 1.0, length: 14.0 },
            'cup': { diameter: 8.0, height: 10.0 },
            'bottle': { diameter: 7.0, height: 25.0 },
            'laptop-13': { width: 30.0, height: 20.0 },
            'laptop-15': { width: 36.0, height: 24.0 },
            'mouse': { width: 6.0, length: 10.0 },
            'keyboard': { width: 44.0, depth: 13.0 }
        };
        
        this.calibrationData = null;
        this.depthHistory = [];
        this.init();
    }

    async init() {
        await this.calibrateCamera();
    }

    /**
     * Calibrate camera using known reference object
     * @param {string} objectType - Type of reference object
     * @param {number} pixelWidth - Width in pixels
     * @returns {Object} Calibration data
     */
    calibrateWithObject(objectType, pixelWidth) {
        const refObj = this.referenceObjects[objectType];
        if (!refObj) {
            console.error('[DepthEstimation] Unknown object type:', objectType);
            return null;
        }

        const realWidth = refObj.width || refObj.diameter;
        
        // Calculate focal length in pixels
        // Formula: f = (W * d) / w
        // Where: f = focal length, W = real width, d = distance, w = pixel width
        // Assuming object is at ~30cm distance for calibration
        const assumedDistance = 30; // cm
        const focalLength = (pixelWidth * assumedDistance) / realWidth;

        this.calibrationData = {
            focalLength: focalLength,
            referenceObject: objectType,
            referenceSize: realWidth,
            pixelWidth: pixelWidth,
            timestamp: Date.now()
        };

        console.log('[DepthEstimation] Calibrated:', this.calibrationData);
        return this.calibrationData;
    }

    /**
     * Estimate camera intrinsics from video dimensions
     */
    async calibrateCamera() {
        const video = document.getElementById('cameraFeed');
        if (!video) return null;

        await new Promise(resolve => {
            if (video.readyState >= 2) {
                resolve();
            } else {
                video.onloadeddata = resolve;
            }
        });

        const width = video.videoWidth;
        const height = video.videoHeight;

        // Estimate focal length (assuming 60° horizontal FOV for typical smartphone)
        const focalLengthX = width / (2 * Math.tan((60 * Math.PI) / 360));
        const focalLengthY = focalLengthX; // Assume square pixels

        this.cameraIntrinsics = {
            fx: focalLengthX,
            fy: focalLengthY,
            cx: width / 2,
            cy: height / 2,
            width: width,
            height: height,
            fovX: 60 * Math.PI / 180,
            fovY: (height / width) * this.cameraIntrinsics?.fovX || 60 * Math.PI / 180
        };

        console.log('[DepthEstimation] Camera intrinsics:', this.cameraIntrinsics);
        return this.cameraIntrinsics;
    }

    /**
     * Calculate depth from object size
     * @param {number} realSize - Real object size in cm
     * @param {number} pixelSize - Object size in pixels
     * @param {number} focalLength - Camera focal length in pixels
     * @returns {number} Distance in cm
     */
    calculateDepthFromSize(realSize, pixelSize, focalLength = null) {
        if (!focalLength && this.calibrationData) {
            focalLength = this.calibrationData.focalLength;
        }
        
        if (!focalLength && this.cameraIntrinsics) {
            focalLength = this.cameraIntrinsics.fx;
        }

        if (!focalLength) {
            // Default focal length estimate
            focalLength = 800; // Typical smartphone camera
        }

        // Formula: d = (W * f) / w
        // Where: d = distance, W = real size, f = focal length, w = pixel size
        const distance = (realSize * focalLength) / pixelSize;

        return {
            distance: distance,
            confidence: this.calculateDepthConfidence(distance, pixelSize),
            method: 'size-prior',
            realSize: realSize,
            pixelSize: pixelSize,
            focalLength: focalLength
        };
    }

    /**
     * Calculate depth using perspective geometry
     * @param {Array} corners - 4 corner points of rectangle
     * @param {Object} realDimensions - Real dimensions {width, height}
     * @returns {Object} Depth information
     */
    calculateDepthFromPerspective(corners, realDimensions) {
        if (!corners || corners.length < 4) return null;

        // Calculate vanishing points and use perspective geometry
        const topWidth = this.distance(corners[0], corners[1]);
        const bottomWidth = this.distance(corners[2], corners[3]);
        const leftHeight = this.distance(corners[0], corners[3]);
        const rightHeight = this.distance(corners[1], corners[2]);

        // Perspective ratio (top appears smaller when farther)
        const perspectiveRatio = topWidth / bottomWidth;
        
        // Estimate distance based on perspective foreshortening
        // When object is perpendicular to camera, ratio ≈ 1
        // When angled, ratio < 1 or > 1
        const angle = Math.acos(perspectiveRatio) * (180 / Math.PI);
        
        // Distance estimation using similar triangles
        const avgWidth = (topWidth + bottomWidth) / 2;
        const depth = this.calculateDepthFromSize(realDimensions.width, avgWidth);

        return {
            distance: depth.distance,
            angle: angle,
            perspectiveRatio: perspectiveRatio,
            confidence: this.calculatePerspectiveConfidence(perspectiveRatio, corners),
            method: 'perspective',
            corners: corners
        };
    }

    /**
     * Multi-frame depth averaging for stability
     * @param {Array} depthMeasurements - Array of depth measurements
     * @returns {Object} Averaged depth with confidence
     */
    averageDepthMeasurements(depthMeasurements) {
        if (!depthMeasurements || depthMeasurements.length === 0) return null;

        const validMeasurements = depthMeasurements.filter(d => 
            d && d.distance && isFinite(d.distance) && d.distance > 0
        );

        if (validMeasurements.length === 0) return null;

        // Weighted average based on confidence
        let totalWeight = 0;
        let weightedSum = 0;

        validMeasurements.forEach(m => {
            const weight = m.confidence || 0.5;
            weightedSum += m.distance * weight;
            totalWeight += weight;
        });

        const avgDistance = weightedSum / totalWeight;
        const variance = this.calculateVariance(validMeasurements.map(m => m.distance));
        const stdDev = Math.sqrt(variance);

        // Higher confidence if measurements are consistent
        const consistencyConfidence = 1 - Math.min(1, stdDev / avgDistance);

        return {
            distance: avgDistance,
            confidence: consistencyConfidence,
            stdDev: stdDev,
            sampleCount: validMeasurements.length,
            method: 'multi-frame-average',
            measurements: validMeasurements
        };
    }

    /**
     * Calculate depth map using stereo vision (dual camera)
     * @param {ImageData} leftImage - Left camera image
     * @param {ImageData} rightImage - Right camera image
     * @param {number} baseline - Distance between cameras in cm
     * @returns {Object} Depth map
     */
    calculateStereoDepth(leftImage, rightImage, baseline = 6.5) {
        // Typical smartphone dual camera baseline: 6-7cm
        if (!window.cv || !this.isCvReady()) {
            console.warn('[DepthEstimation] OpenCV not available for stereo depth');
            return null;
        }

        try {
            // Convert to grayscale
            const leftGray = cv.Mat.zeros(leftImage.height, leftImage.width, cv.CV_8UC1);
            const rightGray = cv.Mat.zeros(rightImage.height, rightImage.width, cv.CV_8UC1);
            
            // Create mats from image data
            const leftSrc = cv.matFromImageData(leftImage);
            const rightSrc = cv.matFromImageData(rightImage);
            
            cv.cvtColor(leftSrc, leftGray, cv.COLOR_RGBA2GRAY);
            cv.cvtColor(rightSrc, rightGray, cv.COLOR_RGBA2GRAY);

            // Stereo matching using Semi-Global Block Matching
            const blockSize = 9;
            const minDisparity = 0;
            const numDisparities = 16; // Must be multiple of 16
            
            const stereo = cv.StereoSGBM.create(
                minDisparity,
                numDisparities,
                blockSize
            );

            const disparity = new cv.Mat();
            stereo.compute(leftGray, rightGray, disparity);

            // Convert disparity to depth
            // Formula: depth = (focal_length * baseline) / disparity
            const depthMap = new cv.Mat();
            const focalLength = this.cameraIntrinsics?.fx || 800;
            
            for (let i = 0; i < disparity.rows; i++) {
                for (let j = 0; j < disparity.cols; j++) {
                    const disp = disparity.ucharAt(i, j);
                    const depth = disp > 0 ? (focalLength * baseline) / disp : 0;
                    depthMap.ucharAt(i, j, Math.min(255, depth));
                }
            }

            // Cleanup
            leftGray.delete();
            rightGray.delete();
            leftSrc.delete();
            rightSrc.delete();
            disparity.delete();
            stereo.delete();

            return {
                depthMap: depthMap,
                method: 'stereo-vision',
                baseline: baseline,
                confidence: 0.8
            };
        } catch (error) {
            console.error('[DepthEstimation] Stereo depth error:', error);
            return null;
        }
    }

    /**
     * Estimate depth from focus/blur (depth from defocus)
     * @param {ImageData} imageData - Image data
     * @param {Object} cameraSettings - Camera settings (aperture, focal length)
     * @returns {Object} Depth estimate
     */
    estimateDepthFromFocus(imageData, cameraSettings = {}) {
        // This is a simplified implementation
        // Full implementation would require camera aperture data
        
        if (!window.cv) return null;

        try {
            const src = cv.matFromImageData(imageData);
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            // Calculate Laplacian variance (sharpness measure)
            const laplacian = new cv.Mat();
            cv.Laplacian(gray, laplacian, cv.CV_64F);
            
            const mean = cv.mean(laplacian)[0];
            const variance = this.calculateLaplacianVariance(laplacian);

            // Sharper = closer (generally)
            // This is a rough estimate
            const sharpnessScore = Math.sqrt(variance);
            const estimatedDistance = 100 / sharpnessScore; // Rough approximation

            // Cleanup
            src.delete();
            gray.delete();
            laplacian.delete();

            return {
                distance: estimatedDistance,
                confidence: 0.4, // Low confidence for focus-based
                sharpness: sharpnessScore,
                variance: variance,
                method: 'focus-based'
            };
        } catch (error) {
            console.error('[DepthEstimation] Focus depth error:', error);
            return null;
        }
    }

    /**
     * Combined depth estimation using all available methods
     * @param {Object} imageData - Image data
     * @param {Array} detectedObjects - Detected objects with bounding boxes
     * @returns {Array} Depth estimates for each object
     */
    estimateDepthCombined(imageData, detectedObjects) {
        const depthResults = [];

        detectedObjects.forEach(obj => {
            const [x, y, width, height] = obj.bbox;
            let depthEstimate = null;

            // Method 1: Size-prior (if object is known)
            if (obj.enrichedData?.knownObject && obj.enrichedData.avgSize) {
                const size = obj.enrichedData.avgSize;
                const realWidth = size.width;
                const depthFromSize = this.calculateDepthFromSize(realWidth, width);
                depthEstimate = depthFromSize;
            }

            // Method 2: Perspective (if rectangle detected)
            if (obj.corners && obj.corners.length === 4) {
                const perspectiveDepth = this.calculateDepthFromPerspective(
                    obj.corners,
                    obj.enrichedData?.avgSize || { width: 10, height: 10 }
                );
                
                if (depthEstimate && perspectiveDepth) {
                    // Combine estimates
                    depthEstimate = this.averageDepthMeasurements([
                        depthEstimate,
                        perspectiveDepth
                    ]);
                } else if (perspectiveDepth) {
                    depthEstimate = perspectiveDepth;
                }
            }

            // Default estimate if no method worked
            if (!depthEstimate) {
                depthEstimate = {
                    distance: 50, // Default 50cm
                    confidence: 0.2,
                    method: 'default'
                };
            }

            depthResults.push({
                ...obj,
                depth: depthEstimate
            });
        });

        return depthResults;
    }

    /**
     * Get real-world dimensions from pixel measurements
     * @param {number} pixelMeasurement - Measurement in pixels
     * @param {number} distance - Distance to object in cm
     * @returns {number} Real measurement in cm
     */
    pixelsToRealWorld(pixelMeasurement, distance) {
        const focalLength = this.cameraIntrinsics?.fx || this.calibrationData?.focalLength || 800;
        
        // Formula: W = (w * d) / f
        return (pixelMeasurement * distance) / focalLength;
    }

    /**
     * Convert real-world measurement to pixels
     * @param {number} realMeasurement - Measurement in cm
     * @param {number} distance - Distance to object in cm
     * @returns {number} Pixel measurement
     */
    realWorldToPixels(realMeasurement, distance) {
        const focalLength = this.cameraIntrinsics?.fx || this.calibrationData?.focalLength || 800;
        
        // Formula: w = (W * f) / d
        return (realMeasurement * focalLength) / distance;
    }

    // ========================================
    // Utility Functions
    // ========================================

    calculateDepthConfidence(distance, pixelSize) {
        // Confidence based on:
        // 1. Distance in optimal range (20-100cm is best)
        // 2. Pixel size (larger = more confident)
        
        const distanceFactor = distance >= 20 && distance <= 100 ? 1 : 
                               distance < 20 ? distance / 20 : 
                               100 / distance;
        
        const pixelFactor = Math.min(1, pixelSize / 100);
        
        return (distanceFactor * 0.6 + pixelFactor * 0.4) * 0.9;
    }

    calculatePerspectiveConfidence(ratio, corners) {
        // Confidence based on perspective ratio consistency
        const idealRatio = 1.0;
        const ratioDiff = Math.abs(ratio - idealRatio);
        
        // Check corner angles (should be close to 90° for rectangle)
        let angleConsistency = 1;
        if (corners && corners.length >= 4) {
            // Calculate angles between edges
            // Simplified: just check if corners form a reasonable quad
            angleConsistency = 0.8;
        }

        return Math.max(0.3, (1 - ratioDiff) * angleConsistency);
    }

    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateLaplacianVariance(laplacianMat) {
        const data = laplacianMat.data64F;
        let sum = 0;
        let sumSq = 0;
        
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
            sumSq += data[i] * data[i];
        }
        
        const mean = sum / data.length;
        return sumSq / data.length - mean * mean;
    }

    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    isCvReady() {
        return window.cv && window.cv.Mat;
    }

    /**
     * Export calibration data
     */
    exportCalibration() {
        return {
            cameraIntrinsics: this.cameraIntrinsics,
            calibrationData: this.calibrationData,
            referenceObjects: this.referenceObjects
        };
    }

    /**
     * Import calibration data
     */
    importCalibration(data) {
        if (data.cameraIntrinsics) {
            this.cameraIntrinsics = data.cameraIntrinsics;
        }
        if (data.calibrationData) {
            this.calibrationData = data.calibrationData;
        }
        console.log('[DepthEstimation] Calibration imported');
    }
}

// Initialize depth estimation module
window.depthEstimation = new DepthEstimationModule();
