/**
 * AR Measurement Guides Module
 * Augmented Reality guides for precise measurements
 * - Real-time alignment guides
 * - Distance feedback
 * - Auto-capture assistance
 * - Visual positioning system
 */

class ARMeasurementGuides {
    constructor() {
        this.overlayCanvas = null;
        this.ctx = null;
        this.guides = {
            showGrid: true,
            showCenterLines: true,
            showDistanceGuide: true,
            showAngleGuide: true,
            showEdgeSnap: true,
            autoCapture: true
        };
        this.calibrationData = null;
        this.currentGuides = [];
        this.isCalibrated = false;

        this.init();
    }

    async init() {
        this.overlayCanvas = document.getElementById('overlayCanvas');
        if (this.overlayCanvas) {
            this.ctx = this.overlayCanvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
        console.log('[ARGuides] Module initialized');
    }

    resizeCanvas() {
        if (!this.overlayCanvas) return;
        
        const video = document.getElementById('cameraFeed');
        if (video) {
            this.overlayCanvas.width = video.videoWidth || 1280;
            this.overlayCanvas.height = video.videoHeight || 720;
        }
    }

    /**
     * Draw all AR guides
     */
    drawGuides(context = null) {
        const ctx = context || this.ctx;
        if (!ctx || !this.overlayCanvas) return;

        // Clear previous guides
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // Draw guides
        if (this.guides.showGrid) {
            this.drawGrid(ctx);
        }

        if (this.guides.showCenterLines) {
            this.drawCenterLines(ctx);
        }

        if (this.guides.showDistanceGuide) {
            this.drawDistanceGuide(ctx);
        }

        if (this.guides.showAngleGuide) {
            this.drawAngleGuide(ctx);
        }
    }

    /**
     * Draw grid overlay
     */
    drawGrid(ctx) {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Rule of thirds grid
        const thirdW = width / 3;
        const thirdH = height / 3;

        // Vertical lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * thirdW, 0);
            ctx.lineTo(i * thirdW, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * thirdH);
            ctx.lineTo(width, i * thirdH);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    /**
     * Draw center alignment lines
     */
    drawCenterLines(ctx) {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;

        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);

        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Center point
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.8)';
        ctx.stroke();

        ctx.setLineDash([]);
    }

    /**
     * Draw distance guide
     */
    drawDistanceGuide(ctx, distance = null) {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;

        // Distance indicator bar
        const barWidth = 200;
        const barHeight = 20;
        const barX = width - barWidth - 20;
        const barY = 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 5, barY - 25, barWidth + 10, barHeight + 30);

        // Border
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 5, barY - 25, barWidth + 10, barHeight + 30);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Distance', barX, barY - 8);

        // Distance bar
        const optimalMin = 20; // cm
        const optimalMax = 50; // cm
        const currentDistance = distance || 35; // Default

        const normalizedDistance = Math.max(0, Math.min(1, (currentDistance - optimalMin) / (optimalMax - optimalMin)));
        
        // Bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar fill with gradient
        const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#ff4444'); // Too close
        gradient.addColorStop(0.3, '#44ff44'); // Optimal
        gradient.addColorStop(0.7, '#44ff44'); // Optimal
        gradient.addColorStop(1, '#ff4444'); // Too far

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * normalizedDistance, barHeight);

        // Optimal zone indicator
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX + barWidth * 0.3, barY - 5);
        ctx.lineTo(barX + barWidth * 0.3, barY + barHeight + 5);
        ctx.moveTo(barX + barWidth * 0.7, barY - 5);
        ctx.lineTo(barX + barWidth * 0.7, barY + barHeight + 5);
        ctx.stroke();

        // Current distance value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentDistance.toFixed(1)} cm`, barX + barWidth / 2, barY + barHeight + 20);

        // Status text
        let status = '';
        let statusColor = '#ffffff';
        
        if (currentDistance < optimalMin) {
            status = 'Too Close';
            statusColor = '#ff4444';
        } else if (currentDistance > optimalMax) {
            status = 'Too Far';
            statusColor = '#ff4444';
        } else {
            status = 'Perfect';
            statusColor = '#44ff44';
        }

        ctx.fillStyle = statusColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(status, barX + barWidth / 2, barY - 15);
    }

    /**
     * Draw angle guide for perpendicular alignment
     */
    drawAngleGuide(ctx, angle = 0) {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const size = 80;
        const x = 30;
        const y = height - 30;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, size + 15, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Protractor arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size, Math.PI, 0);
        ctx.stroke();

        // Angle indicator line
        const angleRad = (angle * Math.PI) / 180;
        const endX = x + size * Math.cos(angleRad - Math.PI);
        const endY = y + size * Math.sin(angleRad - Math.PI);

        ctx.strokeStyle = 'rgba(0, 217, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Angle value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${angle.toFixed(0)}°`, x, y - size / 2);

        // Perfect angle indicator (0°)
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Status
        const angleStatus = Math.abs(angle) < 5 ? 'Level' : 'Tilted';
        ctx.fillStyle = Math.abs(angle) < 5 ? '#44ff44' : '#ffaa00';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(angleStatus, x, y + size / 2 + 5);
    }

    /**
     * Draw edge snap guides for detected objects
     */
    drawEdgeSnapGuides(ctx, detection) {
        if (!detection || !detection.bbox) return;

        const [x, y, w, h] = detection.bbox;

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;

        // Draw corner brackets
        const bracketSize = 20;
        const lineWidth = 3;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x - bracketSize, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y - bracketSize);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w + bracketSize, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y - bracketSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x - bracketSize, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + h + bracketSize);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w + bracketSize, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h + bracketSize);
        ctx.stroke();

        // Draw dimension lines
        this.drawDimensionLine(ctx, x, y - 30, x + w, y - 30, `${w.toFixed(1)} px`);
        this.drawDimensionLine(ctx, x + w + 30, y, x + w + 30, y + h, `${h.toFixed(1)} px`, 'vertical');
    }

    /**
     * Draw dimension line
     */
    drawDimensionLine(ctx, x1, y1, x2, y2, label, orientation = 'horizontal') {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);

        // Line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrowheads
        const angle = orientation === 'horizontal' ? 0 : Math.PI / 2;
        const arrowSize = 8;

        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        
        // Label background
        const textWidth = ctx.measureText(label).width;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, midX, midY + 4);
    }

    /**
     * Draw auto-capture indicator
     */
    drawAutoCaptureIndicator(ctx, isReady) {
        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;
        const size = 60;
        const x = width / 2 - size / 2;
        const y = height / 2 - size / 2;

        if (isReady) {
            // Pulsing capture indicator
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            
            ctx.strokeStyle = `rgba(76, 175, 80, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 3 + pulse * 2;
            
            // Outer ring
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, size / 2 + pulse * 10, 0, Math.PI * 2);
            ctx.stroke();

            // Inner square
            ctx.strokeStyle = `rgba(76, 175, 80, ${0.8 + pulse * 0.2})`;
            ctx.strokeRect(x, y, size, size);

            // Ready text
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('READY', width / 2, height / 2 + size / 2 + 25);
        }
    }

    /**
     * Draw measurement point indicators
     */
    drawMeasurementPoints(ctx, points) {
        if (!points || points.length === 0) return;

        points.forEach((point, index) => {
            const { x, y, type } = point;

            // Point circle
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            
            if (type === 'start') {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
            } else if (type === 'end') {
                ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(0, 217, 255, 0.8)';
            }
            
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Point label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(index + 1, x, y + 4);
        });
    }

    /**
     * Draw object tracking overlay
     */
    drawTrackingOverlay(ctx, trackedObjects) {
        if (!trackedObjects || trackedObjects.length === 0) return;

        trackedObjects.forEach(track => {
            const [x, y, w, h] = track.bbox;

            // Color based on track state
            const color = track.state === 'confirmed' ? 
                'rgba(76, 175, 80, 0.8)' : 
                'rgba(255, 193, 7, 0.8)';

            // Bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Track ID
            ctx.fillStyle = color;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`#${track.id}`, x + 5, y + 15);

            // Velocity indicator
            if (track.velocity && (track.velocity[0] !== 0 || track.velocity[1] !== 0)) {
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                const arrowLength = 30;
                const angle = Math.atan2(track.velocity[1], track.velocity[0]);

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + arrowLength * Math.cos(angle),
                    centerY + arrowLength * Math.sin(angle)
                );
                ctx.stroke();
            }
        });
    }

    /**
     * Check if camera is properly aligned for measurement
     */
    checkAlignment(detectedRect) {
        if (!detectedRect || !detectedRect.corners) {
            return {
                aligned: false,
                angleError: 0,
                distanceError: 0,
                suggestions: ['No object detected']
            };
        }

        const corners = detectedRect.corners;
        const suggestions = [];

        // Check if rectangle is level
        const topAngle = Math.atan2(
            corners[1].y - corners[0].y,
            corners[1].x - corners[0].x
        ) * (180 / Math.PI);

        const angleError = Math.abs(topAngle);
        const isLevel = angleError < 5;

        if (!isLevel) {
            suggestions.push(`Rotate camera ${topAngle > 0 ? 'counter-clockwise' : 'clockwise'} by ${angleError.toFixed(1)}°`);
        }

        // Check distance (based on object size)
        const width = Math.sqrt(
            Math.pow(corners[1].x - corners[0].x, 2) +
            Math.pow(corners[1].y - corners[0].y, 2)
        );

        const optimalWidth = 300; // pixels
        const distanceRatio = width / optimalWidth;
        
        let distanceSuggestion = '';
        if (distanceRatio < 0.5) {
            distanceSuggestion = 'Move closer to the object';
        } else if (distanceRatio > 1.5) {
            distanceSuggestion = 'Move farther from the object';
        } else {
            distanceSuggestion = 'Distance is good';
        }

        suggestions.push(distanceSuggestion);

        return {
            aligned: isLevel && distanceRatio >= 0.5 && distanceRatio <= 1.5,
            angleError: angleError,
            distanceRatio: distanceRatio,
            suggestions: suggestions
        };
    }

    /**
     * Enable/disable specific guides
     */
    toggleGuide(name, enabled) {
        if (this.guides.hasOwnProperty(name)) {
            this.guides[name] = enabled;
            
            if (!enabled) {
                this.clearGuides();
            }
        }
    }

    /**
     * Clear all guides
     */
    clearGuides() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
    }

    /**
     * Get guide settings
     */
    getSettings() {
        return { ...this.guides };
    }

    /**
     * Update guide settings
     */
    updateSettings(newSettings) {
        this.guides = { ...this.guides, ...newSettings };
    }
}

// Initialize AR guides module
window.arGuides = new ARMeasurementGuides();
