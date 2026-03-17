/**
 * Multi-Object Tracking Module
 * Track objects across video frames
 * - Kalman Filter prediction
 * - Hungarian algorithm assignment
 * - IOU matching
 * - Track management
 */

class MultiObjectTracker {
    constructor() {
        this.tracks = new Map();
        this.nextTrackId = 1;
        this.maxAge = 30; // Frames before track is deleted
        this.minHits = 3; // Frames before track is confirmed
        this.iouThreshold = 0.3;
        this.history = [];
        this.frameCount = 0;
        
        this.init();
    }

    async init() {
        console.log('[Tracker] Multi-object tracker initialized');
    }

    /**
     * Track objects in current frame
     * @param {Array} detections - Current frame detections
     * @returns {Array} Tracked objects with IDs
     */
    track(detections) {
        this.frameCount++;

        if (!detections || detections.length === 0) {
            // No detections - update existing tracks
            this.updateTracksNoDetections();
            return this.getTrackedObjects();
        }

        // Get active tracks
        const activeTracks = Array.from(this.tracks.values())
            .filter(track => track.state === 'confirmed' || track.state === 'tentative');

        // Match detections to tracks
        const associations = this.associateTracksToDetections(activeTracks, detections);

        // Update matched tracks
        associations.matches.forEach(([trackIndex, detectionIndex]) => {
            const track = activeTracks[trackIndex];
            const detection = detections[detectionIndex];
            
            this.updateTrack(track, detection);
        });

        // Create new tracks for unmatched detections
        associations.unmatchedDetections.forEach(detectionIndex => {
            this.createTrack(detections[detectionIndex]);
        });

        // Mark unmatched tracks as deleted
        associations.unmatchedTracks.forEach(trackIndex => {
            const track = activeTracks[trackIndex];
            this.markTrackDeleted(track);
        });

        // Cleanup old tracks
        this.cleanupTracks();

        return this.getTrackedObjects();
    }

    /**
     * Associate tracks to detections using Hungarian algorithm
     */
    associateTracksToDetections(tracks, detections) {
        if (tracks.length === 0 || detections.length === 0) {
            return {
                matches: [],
                unmatchedTracks: tracks.map((_, i) => i),
                unmatchedDetections: detections.map((_, i) => i)
            };
        }

        // Build cost matrix (IOU distance)
        const costMatrix = this.buildCostMatrix(tracks, detections);

        // Hungarian algorithm for optimal assignment
        const assignments = this.hungarianAlgorithm(costMatrix);

        const matches = [];
        const usedTracks = new Set();
        const usedDetections = new Set();

        // Process assignments
        assignments.forEach(([trackIdx, detIdx]) => {
            if (costMatrix[trackIdx][detIdx] <= this.iouThreshold) {
                matches.push([trackIdx, detIdx]);
                usedTracks.add(trackIdx);
                usedDetections.add(detIdx);
            }
        });

        // Find unmatched
        const unmatchedTracks = tracks
            .map((_, i) => i)
            .filter(i => !usedTracks.has(i));

        const unmatchedDetections = detections
            .map((_, i) => i)
            .filter(i => !usedDetections.has(i));

        return { matches, unmatchedTracks, unmatchedDetections };
    }

    /**
     * Build IOU cost matrix
     */
    buildCostMatrix(tracks, detections) {
        const matrix = [];

        for (let i = 0; i < tracks.length; i++) {
            const row = [];
            for (let j = 0; j < detections.length; j++) {
                const iou = this.calculateIOU(tracks[i].bbox, detections[j].bbox);
                // Convert IOU to cost (1 - IOU)
                row.push(1 - iou);
            }
            matrix.push(row);
        }

        return matrix;
    }

    /**
     * Hungarian algorithm for optimal assignment
     */
    hungarianAlgorithm(costMatrix) {
        const rows = costMatrix.length;
        const cols = costMatrix[0].length;
        const assignments = [];

        // Simplified greedy assignment (full Hungarian would be more complex)
        const usedRows = new Set();
        const usedCols = new Set();

        // Create cost-index pairs and sort
        const costs = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                costs.push({
                    cost: costMatrix[i][j],
                    row: i,
                    col: j
                });
            }
        }

        costs.sort((a, b) => a.cost - b.cost);

        // Greedy assignment
        for (const item of costs) {
            if (!usedRows.has(item.row) && !usedCols.has(item.col)) {
                assignments.push([item.row, item.col]);
                usedRows.add(item.row);
                usedCols.add(item.col);
            }
        }

        return assignments;
    }

    /**
     * Create new track from detection
     */
    createTrack(detection) {
        const track = {
            id: this.nextTrackId++,
            bbox: [...detection.bbox],
            state: 'tentative',
            age: 0,
            hits: 1,
            history: [detection.bbox],
            kalmanFilter: this.createKalmanFilter(detection.bbox),
            velocity: [0, 0, 0, 0],
            lastDetection: detection,
            createdAt: this.frameCount
        };

        this.tracks.set(track.id, track);
        return track;
    }

    /**
     * Create Kalman filter for track
     */
    createKalmanFilter(bbox) {
        // State: [x, y, w, h, vx, vy, vw, vh]
        // Measurement: [x, y, w, h]
        return {
            state: [bbox[0], bbox[1], bbox[2], bbox[3], 0, 0, 0, 0],
            covariance: this.identityMatrix(8).map(row => row.map(v => v * 1000)),
            processNoise: 1,
            measurementNoise: 10
        };
    }

    /**
     * Update track with new detection
     */
    updateTrack(track, detection) {
        track.age = 0;
        track.hits++;
        track.history.push([...detection.bbox]);

        // Limit history size
        if (track.history.length > 30) {
            track.history.shift();
        }

        // Update state
        const oldBbox = track.bbox;
        track.bbox = [...detection.bbox];

        // Calculate velocity
        track.velocity = [
            detection.bbox[0] - oldBbox[0],
            detection.bbox[1] - oldBbox[1],
            detection.bbox[2] - oldBbox[2],
            detection.bbox[3] - oldBbox[3]
        ];

        // Update Kalman filter
        this.updateKalmanFilter(track.kalmanFilter, detection.bbox);

        // Confirm track if enough hits
        if (track.hits >= this.minHits) {
            track.state = 'confirmed';
        }

        track.lastDetection = detection;
    }

    /**
     * Update Kalman filter with measurement
     */
    updateKalmanFilter(kf, measurement) {
        // Predict
        kf.state[0] += kf.state[4]; // x += vx
        kf.state[1] += kf.state[5]; // y += vy
        kf.state[2] += kf.state[6]; // w += vw
        kf.state[3] += kf.state[7]; // h += vh

        // Update (simplified Kalman update)
        const alpha = kf.processNoise / (kf.processNoise + kf.measurementNoise);

        kf.state[0] = (1 - alpha) * kf.state[0] + alpha * measurement[0];
        kf.state[1] = (1 - alpha) * kf.state[1] + alpha * measurement[1];
        kf.state[2] = (1 - alpha) * kf.state[2] + alpha * measurement[2];
        kf.state[3] = (1 - alpha) * kf.state[3] + alpha * measurement[3];

        // Update velocity based on innovation
        kf.state[4] = alpha * (measurement[0] - kf.state[0]);
        kf.state[5] = alpha * (measurement[1] - kf.state[1]);
        kf.state[6] = alpha * (measurement[2] - kf.state[2]);
        kf.state[7] = alpha * (measurement[3] - kf.state[3]);
    }

    /**
     * Update tracks when no detections
     */
    updateTracksNoDetections() {
        this.tracks.forEach(track => {
            if (track.state === 'confirmed' || track.state === 'tentative') {
                track.age++;

                // Predict using Kalman filter
                const predicted = this.predictTrack(track);
                track.bbox = predicted;
                track.history.push([...predicted]);

                if (track.history.length > 30) {
                    track.history.shift();
                }
            }
        });
    }

    /**
     * Predict track position using Kalman filter
     */
    predictTrack(track) {
        const kf = track.kalmanFilter;

        // Simple prediction based on velocity
        return [
            track.bbox[0] + track.velocity[0],
            track.bbox[1] + track.velocity[1],
            Math.max(10, track.bbox[2] + track.velocity[2]),
            Math.max(10, track.bbox[3] + track.velocity[3])
        ];
    }

    /**
     * Mark track for deletion
     */
    markTrackDeleted(track) {
        track.age++;
        track.state = 'deleted';
    }

    /**
     * Cleanup old/deleted tracks
     */
    cleanupTracks() {
        const toDelete = [];

        this.tracks.forEach((track, id) => {
            if (track.age > this.maxAge || track.state === 'deleted') {
                toDelete.push(id);
            }
        });

        toDelete.forEach(id => {
            this.tracks.delete(id);
        });
    }

    /**
     * Get all active tracked objects
     */
    getTrackedObjects() {
        return Array.from(this.tracks.values())
            .filter(track => track.state === 'confirmed' || track.state === 'tentative')
            .map(track => ({
                id: track.id,
                bbox: track.bbox,
                velocity: track.velocity,
                age: track.age,
                hits: track.hits,
                state: track.state,
                history: track.history,
                lastDetection: track.lastDetection,
                confidence: this.calculateTrackConfidence(track)
            }));
    }

    /**
     * Calculate track confidence
     */
    calculateTrackConfidence(track) {
        const ageFactor = Math.max(0, 1 - track.age / this.maxAge);
        const hitsFactor = Math.min(1, track.hits / this.minHits);
        const historyConsistency = this.calculateHistoryConsistency(track.history);

        return (ageFactor * 0.4 + hitsFactor * 0.3 + historyConsistency * 0.3);
    }

    /**
     * Calculate history consistency
     */
    calculateHistoryConsistency(history) {
        if (history.length < 2) return 1;

        const recent = history.slice(-5);
        const sizes = recent.map(h => h[2] * h[3]); // Area

        if (sizes.length < 2) return 1;

        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        const variance = sizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / sizes.length;
        const stdDev = Math.sqrt(variance);

        // Lower variance = higher consistency
        return Math.max(0, 1 - stdDev / avgSize);
    }

    /**
     * Calculate IOU (Intersection over Union)
     */
    calculateIOU(bbox1, bbox2) {
        const [x1, y1, w1, h1] = bbox1;
        const [x2, y2, w2, h2] = bbox2;

        const area1 = w1 * h1;
        const area2 = w2 * h2;

        const xi1 = Math.max(x1, x2);
        const yi1 = Math.max(y1, y2);
        const xi2 = Math.min(x1 + w1, x2 + w2);
        const yi2 = Math.min(y1 + h1, y2 + h2);

        const interWidth = Math.max(0, xi2 - xi1);
        const interHeight = Math.max(0, yi2 - yi1);
        const intersection = interWidth * interHeight;

        const union = area1 + area2 - intersection;

        return union > 0 ? intersection / union : 0;
    }

    /**
     * Identity matrix
     */
    identityMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = new Array(size).fill(0);
            matrix[i][i] = 1;
        }
        return matrix;
    }

    /**
     * Get track by ID
     */
    getTrackById(id) {
        return this.tracks.get(id);
    }

    /**
     * Get track history
     */
    getTrackHistory(id, limit = 10) {
        const track = this.tracks.get(id);
        if (!track) return [];
        return track.history.slice(-limit);
    }

    /**
     * Draw tracks on canvas
     */
    drawTracks(trackedObjects, canvas) {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        trackedObjects.forEach(track => {
            const [x, y, w, h] = track.bbox;

            // Color based on state
            const color = track.state === 'confirmed' ? '#00ff00' : '#ffff00';

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // Draw track ID
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`ID: ${track.id}`, x + 5, y + 20);

            // Draw velocity vector
            if (track.velocity[0] !== 0 || track.velocity[1] !== 0) {
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                const arrowLength = 30;
                const angle = Math.atan2(track.velocity[1], track.velocity[0]);

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + arrowLength * Math.cos(angle),
                    centerY + arrowLength * Math.sin(angle)
                );
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw history trail
            if (track.history.length > 1) {
                ctx.beginPath();
                track.history.forEach((hist, i) => {
                    const hx = hist[0] + hist[2] / 2;
                    const hy = hist[1] + hist[3] / 2;
                    
                    if (i === 0) {
                        ctx.moveTo(hx, hy);
                    } else {
                        ctx.lineTo(hx, hy);
                    }
                });
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }

    /**
     * Get tracking statistics
     */
    getStatistics() {
        const tracks = Array.from(this.tracks.values());
        const confirmed = tracks.filter(t => t.state === 'confirmed').length;
        const tentative = tracks.filter(t => t.state === 'tentative').length;

        return {
            totalTracks: tracks.length,
            confirmed: confirmed,
            tentative: tentative,
            frameCount: this.frameCount,
            averageAge: tracks.reduce((sum, t) => sum + t.age, 0) / (tracks.length || 1),
            averageHits: tracks.reduce((sum, t) => sum + t.hits, 0) / (tracks.length || 1)
        };
    }

    /**
     * Reset tracker
     */
    reset() {
        this.tracks.clear();
        this.nextTrackId = 1;
        this.frameCount = 0;
        this.history = [];
    }

    /**
     * Export tracking data
     */
    exportData() {
        return {
            tracks: Array.from(this.tracks.values()),
            frameCount: this.frameCount,
            statistics: this.getStatistics()
        };
    }
}

// Initialize multi-object tracker
window.multiObjectTracker = new MultiObjectTracker();
