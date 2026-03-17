/**
 * AI Processing Web Worker
 * Offloads heavy AI processing from main thread
 * - Object detection
 * - Image analysis
 * - Model inference
 */

// Model references
let cocoSsdModel = null;
let mobilenetModel = null;
let cvReady = false;

/**
 * Load COCO-SSD model
 */
async function loadCocoSsd() {
    try {
        if (typeof cocoSsd !== 'undefined') {
            cocoSsdModel = await cocoSsd.load();
            self.postMessage({
                type: 'MODEL_LOADED',
                model: 'cocoSsd',
                success: true
            });
        }
    } catch (error) {
        self.postMessage({
            type: 'MODEL_LOAD_ERROR',
            model: 'cocoSsd',
            error: error.message
        });
    }
}

/**
 * Load MobileNet model
 */
async function loadMobileNet() {
    try {
        if (typeof mobilenet !== 'undefined') {
            mobilenetModel = await mobilenet.load();
            self.postMessage({
                type: 'MODEL_LOADED',
                model: 'mobilenet',
                success: true
            });
        }
    } catch (error) {
        self.postMessage({
            type: 'MODEL_LOAD_ERROR',
            model: 'mobilenet',
            error: error.message
        });
    }
}

/**
 * Detect objects using COCO-SSD
 * @param {ImageData|HTMLCanvasElement|HTMLImageElement} imageData 
 * @param {number} minConfidence 
 */
async function detectObjects(imageData, minConfidence = 0.5) {
    const startTime = performance.now();
    
    try {
        if (!cocoSsdModel) {
            throw new Error('COCO-SSD model not loaded');
        }
        
        const predictions = await cocoSsdModel.detect(imageData);
        
        const filtered = predictions
            .filter(pred => pred.score >= minConfidence)
            .map(pred => ({
                bbox: pred.bbox,
                class: pred.class,
                confidence: pred.score,
                type: 'ml'
            }));
        
        const endTime = performance.now();
        
        self.postMessage({
            type: 'DETECTION_RESULT',
            detections: filtered,
            processingTime: endTime - startTime,
            timestamp: Date.now()
        });
    } catch (error) {
        self.postMessage({
            type: 'DETECTION_ERROR',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Classify image using MobileNet
 * @param {ImageData|HTMLCanvasElement|HTMLImageElement} imageData 
 */
async function classifyImage(imageData) {
    const startTime = performance.now();
    
    try {
        if (!mobilenetModel) {
            throw new Error('MobileNet model not loaded');
        }
        
        const predictions = await mobilenetModel.classify(imageData);
        
        const endTime = performance.now();
        
        self.postMessage({
            type: 'CLASSIFICATION_RESULT',
            predictions: predictions,
            processingTime: endTime - startTime,
            timestamp: Date.now()
        });
    } catch (error) {
        self.postMessage({
            type: 'CLASSIFICATION_ERROR',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * OpenCV-based edge detection
 * @param {ImageData} imageData 
 */
function detectEdges(imageData) {
    const startTime = performance.now();
    
    try {
        if (!cvReady || !self.cv) {
            throw new Error('OpenCV not ready');
        }
        
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
        
        // Convert back to ImageData
        const result = new ImageData(edges.cols, edges.rows);
        cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
        dst.data.copyTo(result.data);
        
        // Cleanup
        src.delete();
        dst.delete();
        gray.delete();
        edges.delete();
        
        const endTime = performance.now();
        
        self.postMessage({
            type: 'EDGE_DETECTION_RESULT',
            edges: result,
            processingTime: endTime - startTime,
            timestamp: Date.now()
        }, [result.data.buffer]);
    } catch (error) {
        self.postMessage({
            type: 'EDGE_DETECTION_ERROR',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Blob detection using OpenCV
 * @param {ImageData} imageData 
 * @param {number} minArea 
 */
function detectBlobs(imageData, minArea = 1000) {
    const startTime = performance.now();
    
    try {
        if (!cvReady || !self.cv) {
            throw new Error('OpenCV not ready');
        }
        
        const src = cv.matFromImageData(imageData);
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
        
        const blobs = [];
        
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > minArea) {
                const rect = cv.boundingRect(contour);
                const confidence = Math.min(1, area / 10000);
                
                blobs.push({
                    bbox: [rect.x, rect.y, rect.width, rect.height],
                    class: 'blob',
                    confidence: confidence,
                    type: 'blob',
                    area: area
                });
            }
        }
        
        // Cleanup
        src.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        
        const endTime = performance.now();
        
        self.postMessage({
            type: 'BLOB_DETECTION_RESULT',
            blobs: blobs,
            processingTime: endTime - startTime,
            timestamp: Date.now()
        });
    } catch (error) {
        self.postMessage({
            type: 'BLOB_DETECTION_ERROR',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Calculate image histogram
 * @param {ImageData} imageData 
 */
function calculateHistogram(imageData) {
    const startTime = performance.now();
    
    const histogram = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0)
    };
    
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        histogram.r[data[i]]++;
        histogram.g[data[i + 1]]++;
        histogram.b[data[i + 2]]++;
    }
    
    const endTime = performance.now();
    
    self.postMessage({
        type: 'HISTOGRAM_RESULT',
        histogram: histogram,
        processingTime: endTime - startTime,
        timestamp: Date.now()
    });
}

/**
 * Calculate average color
 * @param {ImageData} imageData 
 */
function calculateAverageColor(imageData) {
    const startTime = performance.now();
    
    let r = 0, g = 0, b = 0;
    const data = imageData.data;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }
    
    const endTime = performance.now();
    
    self.postMessage({
        type: 'AVERAGE_COLOR_RESULT',
        color: {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount)
        },
        processingTime: endTime - startTime,
        timestamp: Date.now()
    });
}

/**
 * Message handler
 */
self.onmessage = function(e) {
    const { type, payload } = e.data;
    
    switch (type) {
        case 'INIT':
            cvReady = payload.cvReady;
            break;
            
        case 'LOAD_COCO_SSD':
            loadCocoSsd();
            break;
            
        case 'LOAD_MOBILENET':
            loadMobileNet();
            break;
            
        case 'DETECT_OBJECTS':
            detectObjects(payload.imageData, payload.minConfidence);
            break;
            
        case 'CLASSIFY_IMAGE':
            classifyImage(payload.imageData);
            break;
            
        case 'DETECT_EDGES':
            detectEdges(payload.imageData);
            break;
            
        case 'DETECT_BLOBS':
            detectBlobs(payload.imageData, payload.minArea);
            break;
            
        case 'CALCULATE_HISTOGRAM':
            calculateHistogram(payload.imageData);
            break;
            
        case 'CALCULATE_AVERAGE_COLOR':
            calculateAverageColor(payload.imageData);
            break;
            
        case 'TERMINATE':
            self.close();
            break;
            
        default:
            console.warn('[AI Worker] Unknown message type:', type);
    }
};

console.log('[AI Worker] Worker initialized');
