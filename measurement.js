/**
 * Measurement Module
 * Handles AR-based measurement using camera and touch input
 */

class MeasurementModule {
    constructor() {
        this.overlayCanvas = null;
        this.ctx = null;
        this.isMeasuring = false;
        this.points = [];
        this.calibrationPixelsPerCm = null;
        this.measurementMode = 'line'; // line, rectangle, polygon
        
        this.init();
    }
    
    init() {
        this.overlayCanvas = document.getElementById('overlayCanvas');
        
        if (this.overlayCanvas) {
            this.ctx = this.overlayCanvas.getContext('2d');
            this.setupTouchHandlers();
            this.resizeCanvas();
            
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }
    
    resizeCanvas() {
        if (!this.overlayCanvas || !window.cameraModule) return;
        
        const video = document.getElementById('cameraFeed');
        if (!video) return;
        
        this.overlayCanvas.width = video.videoWidth || 1280;
        this.overlayCanvas.height = video.videoHeight || 720;
    }
    
    setupTouchHandlers() {
        if (!this.overlayCanvas) return;
        
        this.overlayCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.overlayCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.overlayCanvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Also support mouse for testing
        this.overlayCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.overlayCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.overlayCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    getTouchPosition(e) {
        const rect = this.overlayCanvas.getBoundingClientRect();
        const scaleX = this.overlayCanvas.width / rect.width;
        const scaleY = this.overlayCanvas.height / rect.height;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    handleTouchStart(e) {
        if (!this.isMeasuring) return;
        e.preventDefault();
        
        const pos = this.getTouchPosition(e);
        this.addPoint(pos);
    }
    
    handleTouchMove(e) {
        if (!this.isMeasuring) return;
        e.preventDefault();
        
        const pos = this.getTouchPosition(e);
        this.drawPreview(pos);
    }
    
    handleTouchEnd(e) {
        if (!this.isMeasuring) return;
        e.preventDefault();
        
        if (this.points.length >= 2 && this.measurementMode === 'line') {
            this.completeMeasurement();
        }
    }
    
    handleMouseDown(e) {
        if (!this.isMeasuring) return;
        
        const pos = this.getTouchPosition(e);
        this.addPoint(pos);
    }
    
    handleMouseMove(e) {
        if (!this.isMeasuring || this.points.length === 0) return;
        
        const pos = this.getTouchPosition(e);
        this.drawPreview(pos);
    }
    
    handleMouseUp(e) {
        if (!this.isMeasuring) return;
        
        if (this.points.length >= 2 && this.measurementMode === 'line') {
            this.completeMeasurement();
        }
    }
    
    startMeasurement() {
        this.isMeasuring = true;
        this.points = [];
        this.clearOverlay();
        
        if (window.app) {
            window.app.showToast('Tap to set start point', 'info');
        }
    }
    
    addPoint(point) {
        this.points.push(point);
        
        if (this.points.length === 1) {
            this.drawPoint(point, 'start');
            
            if (window.app) {
                window.app.showToast('Tap to set end point', 'info');
            }
        } else {
            this.drawPoint(point, 'end');
            this.drawLine(this.points[0], point);
        }
    }
    
    drawPoint(point, type = 'normal') {
        if (!this.ctx) return;
        
        const colors = {
            start: '#00d9ff',
            end: '#e94560',
            normal: '#ffffff'
        };
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = colors[type] || colors.normal;
        this.ctx.fill();
        
        // Outer ring
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = colors[type] || colors.normal;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawLine(start, end, color = '#00d9ff', dashed = false) {
        if (!this.ctx) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        
        if (dashed) {
            this.ctx.setLineDash([10, 5]);
        } else {
            this.ctx.setLineDash([]);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawPreview(currentPos) {
        this.clearOverlay();
        
        if (this.points.length > 0) {
            // Redraw existing points and lines
            this.points.forEach((point, index) => {
                this.drawPoint(point, index === 0 ? 'start' : 'normal');
                
                if (index > 0) {
                    this.drawLine(this.points[index - 1], point);
                }
            });
            
            // Draw preview line
            this.drawLine(this.points[this.points.length - 1], currentPos, '#ffffff', true);
        }
    }
    
    completeMeasurement() {
        if (this.points.length < 2) return;
        
        this.isMeasuring = false;
        
        // Calculate distance in pixels
        const pixelDistance = this.calculateDistance(this.points[0], this.points[1]);
        
        // Get calibration data
        const calibrationData = window.app?.calibrationData;
        
        if (!calibrationData) {
            if (window.app) {
                window.app.showToast('Please calibrate first', 'warning');
            }
            return;
        }
        
        // Estimate pixels per cm based on calibration
        // This is a simplified approach - production would use more sophisticated methods
        const estimatedPixelsPerCm = this.estimatePixelsPerCm();
        
        // Calculate real-world measurements
        const lengthCm = pixelDistance / estimatedPixelsPerCm;
        const widthCm = 0; // For line measurement
        const areaCm2 = 0;
        
        const result = {
            type: 'line',
            length: lengthCm,
            width: widthCm,
            area: areaCm2,
            points: [...this.points],
            pixelDistance: pixelDistance,
            confidence: this.calculateConfidence(pixelDistance),
            timestamp: Date.now(),
            unit: 'cm'
        };
        
        // Draw measurement label
        this.drawMeasurementLabel(result);
        
        if (window.app) {
            window.app.showToast(`Length: ${lengthCm.toFixed(2)} cm`, 'success');
        }
        
        return result;
    }
    
    async captureMeasurement() {
        // Capture current measurement
        const result = this.completeMeasurement();
        
        if (result) {
            // Also try to detect rectangle for width/area
            const rectangleResult = await this.detectRectangleMeasurement();
            
            if (rectangleResult) {
                result.width = rectangleResult.width;
                result.area = rectangleResult.area;
                result.type = 'rectangle';
            }
        }
        
        return result;
    }
    
    async detectRectangleMeasurement() {
        if (!window.cameraModule) return null;
        
        const canvas = window.cameraModule.captureFrame();
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple edge-based rectangle detection
        const edges = this.detectEdges(imageData);
        const contours = this.findContours(edges, canvas.width, canvas.height);
        
        // Find largest rectangular contour
        let largestRect = null;
        let maxArea = 0;
        
        contours.forEach(contour => {
            if (contour.length >= 4) {
                const rect = this.minAreaRect(contour);
                if (rect.area > maxArea) {
                    maxArea = rect.area;
                    largestRect = rect;
                }
            }
        });
        
        if (largestRect) {
            const estimatedPixelsPerCm = this.estimatePixelsPerCm();
            
            return {
                width: largestRect.width / estimatedPixelsPerCm,
                height: largestRect.height / estimatedPixelsPerCm,
                area: (largestRect.width * largestRect.height) / (estimatedPixelsPerCm ** 2)
            };
        }
        
        return null;
    }
    
    detectEdges(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const edges = new Uint8Array(width * height);
        
        // Simple Sobel edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x) * 4;
                
                // Convert to grayscale
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                
                // Sobel operators
                const gx = 
                    -data[i - 4] + data[i + 4] +
                    -2 * data[i + width * 4 - 4] + 2 * data[i + width * 4 + 4] +
                    -data[i + width * 8 - 4] + data[i + width * 8 + 4];
                
                const gy = 
                    -data[i - width * 4] + data[i + width * 4] +
                    -2 * data[i - width * 4 + 4] + 2 * data[i + width * 4 + 4] +
                    -data[i - width * 4 + 8] + data[i + width * 4 + 8];
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edges[y * width + x] = magnitude > 50 ? 255 : 0;
            }
        }
        
        return edges;
    }
    
    findContours(edges, width, height) {
        const contours = [];
        const visited = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                if (edges[i] === 255 && !visited[i]) {
                    const contour = this.traceContour(edges, visited, x, y, width, height);
                    if (contour.length >= 4) {
                        contours.push(contour);
                    }
                }
            }
        }
        
        return contours;
    }
    
    traceContour(edges, visited, startX, startY, width, height) {
        const contour = [];
        const stack = [[startX, startY]];
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const i = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[i] || edges[i] === 0) continue;
            
            visited[i] = 1;
            contour.push({ x, y });
            
            // Check 8 neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    stack.push([x + dx, y + dy]);
                }
            }
        }
        
        return contour;
    }
    
    minAreaRect(contour) {
        // Find bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        contour.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        return {
            x: minX,
            y: minY,
            width: width,
            height: height,
            area: width * height,
            corners: [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY }
            ]
        };
    }
    
    calculateDistance(p1, p2) {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
    }
    
    estimatePixelsPerCm() {
        // Use calibration data if available
        if (window.app?.calibrationData) {
            const calibration = window.app.calibrationData;
            
            // Estimate based on typical camera parameters
            // This is simplified - production would use proper camera calibration
            const video = document.getElementById('cameraFeed');
            if (video) {
                const focalLength = video.videoHeight * 1.2; // Approximate focal length
                const distance = 30; // Assume object is ~30cm from camera
                
                // Pixels per cm = (focal length in pixels * real size in cm) / distance in cm
                return (focalLength * calibration.referenceSize) / distance;
            }
        }
        
        // Default estimate (will be inaccurate without proper calibration)
        return 50;
    }
    
    calculateConfidence(pixelDistance) {
        // Higher confidence for measurements in optimal range
        const optimalRange = { min: 100, max: 800 };
        
        if (pixelDistance < optimalRange.min) {
            return 0.5 + (pixelDistance / optimalRange.min) * 0.4;
        } else if (pixelDistance > optimalRange.max) {
            return 0.9 - ((pixelDistance - optimalRange.max) / optimalRange.max) * 0.3;
        }
        
        return 0.9;
    }
    
    drawMeasurementLabel(result) {
        if (!this.ctx) return;
        
        const midX = (this.points[0].x + this.points[1].x) / 2;
        const midY = (this.points[0].y + this.points[1].y) / 2;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.roundRect(midX - 60, midY - 20, 120, 40, 8);
        this.ctx.fill();
        
        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const lengthText = `${result.length.toFixed(2)} cm`;
        this.ctx.fillText(lengthText, midX, midY - 5);
        
        if (result.area > 0) {
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`${result.area.toFixed(2)} cm²`, midX, midY + 10);
        }
    }
    
    clearOverlay() {
        if (!this.ctx || !this.overlayCanvas) return;
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
    
    updateDisplayUnits(result) {
        // Redraw measurement label with new units
        this.drawMeasurementLabel(result);
    }
}

// Initialize measurement module
window.measurementModule = new MeasurementModule();
