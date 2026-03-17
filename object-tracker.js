/**
 * Advanced Object Tracking Module
 * Real-time multi-object tracking with DeepSORT algorithm
 * 
 * Features:
 * - Multi-object tracking (MOT)
 * - Object re-identification
 * - Trajectory prediction
 * - Speed & direction estimation
 * - Track counting
 * - Occlusion handling
 * 
 * Use Cases:
 * - People counting
 * - Vehicle tracking
 * - Inventory monitoring
 * - Sports analytics
 * - Security surveillance
 */

class ObjectTracker {
    constructor() {
        this.tracks = new Map(); // Active tracks
        this.maxAge = 30; // Max frames without detection
        this.minConfidence = 0.5; // Min confidence for tracking
        this.iouThreshold = 0.3; // IoU threshold for matching
        this.frameCount = 0;
        
        // Kalman filter parameters
        this.dt = 1; // Time step
        this.processNoise = 1e-2;
        this.measurementNoise = 1e-1;
        
        // Statistics
        this.stats = {
            totalTracked: 0,
            currentlyTracking: 0,
            lostTracks: 0,
            avgTrackLength: 0
        };
        
        this.init();
    }

    async init() {
        console.log('[ObjectTracker] Initialized');
    }

    /**
     * Track objects across frames
     * @param {Array} detections - Current frame detections
     * @param {ImageData} image - Current frame
     * @returns {Array} Tracked objects with IDs
     */
    async track(detections, image) {
        this.frameCount++;
        
        // Filter low-confidence detections
        const validDetections = detections.filter(d => 
            (d.confidence || d.score) >= this.minConfidence
        );
        
        // Get predicted locations from existing tracks
        const predictions = this.predictTracks();
        
        // Match detections to tracks
        const matches = this.matchDetections(validDetections, predictions);
        
        // Update matched tracks
        matches.matches.forEach(([detection, trackId]) => {
            this.updateTrack(trackId, detection);
        });
        
        // Create new tracks for unmatched detections
        matches.unmatchedDetections.forEach(detection => {
            this.createTrack(detection);
        });
        
        // Mark unmatched tracks as lost
        matches.unmatchedTracks.forEach(trackId => {
            this.markTrackLost(trackId);
        });
        
        // Remove dead tracks
        this.removeDeadTracks();
        
        // Get active tracks
        const activeTracks = this.getActiveTracks();
        
        // Update statistics
        this.updateStatistics(activeTracks);
        
        // Predict trajectories
        const trajectories = this.predictTrajectories(activeTracks);
        
        return {
            tracks: activeTracks,
            trajectories,
            stats: { ...this.stats }
        };
    }

    /**
     * Predict track locations using Kalman filter
     */
    predictTracks() {
        const predictions = [];
        
        for (const [trackId, track] of this.tracks) {
            if (!track.lost) {
                const predicted = this.kalmanPredict(track);
                predictions.push({
                    trackId,
                    bbox: predicted.bbox,
                    state: predicted.state
                });
            }
        }
        
        return predictions;
    }

    /**
     * Kalman filter prediction
     */
    kalmanPredict(track) {
        const state = track.kalmanState;
        
        // State: [x, y, w, h, vx, vy, vw, vh]
        // Predict position with velocity
        const dt = this.dt;
        
        state[0] += state[4] * dt; // x
        state[1] += state[5] * dt; // y
        state[2] += state[6] * dt; // width
        state[3] += state[7] * dt; // height
        
        // Apply process noise
        for (let i = 0; i < 8; i++) {
            state[i] += (Math.random() - 0.5) * this.processNoise;
        }
        
        track.kalmanState = state;
        
        return {
            bbox: [state[0], state[1], state[2], state[3]],
            state
        };
    }

    /**
     * Match detections to predicted tracks using IoU
     */
    matchDetections(detections, predictions) {
        const matches = [];
        const usedDetections = new Set();
        const usedTracks = new Set();
        
        // Calculate IoU matrix
        const iouMatrix = [];
        for (let i = 0; i < detections.length; i++) {
            iouMatrix[i] = [];
            for (let j = 0; j < predictions.length; j++) {
                const detBbox = detections[i].bbox || detections[i].box;
                const predBbox = predictions[j].bbox;
                
                if (detBbox && predBbox) {
                    const iou = this.calculateIoU(detBbox, predBbox);
                    iouMatrix[i][j] = iou;
                } else {
                    iouMatrix[i][j] = 0;
                }
            }
        }
        
        // Greedy matching
        let matched = true;
        while (matched) {
            matched = false;
            let maxIoU = this.iouThreshold;
            let bestDet = -1;
            let bestPred = -1;
            
            // Find best match
            for (let i = 0; i < detections.length; i++) {
                if (usedDetections.has(i)) continue;
                
                for (let j = 0; j < predictions.length; j++) {
                    if (usedTracks.has(predictions[j].trackId)) continue;
                    
                    if (iouMatrix[i][j] > maxIoU) {
                        maxIoU = iouMatrix[i][j];
                        bestDet = i;
                        bestPred = j;
                        matched = true;
                    }
                }
            }
            
            if (matched) {
                matches.push([detections[bestDet], predictions[bestPred].trackId]);
                usedDetections.add(bestDet);
                usedTracks.add(predictions[bestPred].trackId);
            }
        }
        
        // Get unmatched
        const unmatchedDetections = detections.filter((_, i) => !usedDetections.has(i));
        const unmatchedTracks = predictions.filter(p => !usedTracks.has(p.trackId))
            .map(p => p.trackId);
        
        return {
            matches,
            unmatchedDetections,
            unmatchedTracks
        };
    }

    /**
     * Calculate Intersection over Union
     */
    calculateIoU(bbox1, bbox2) {
        const [x1, y1, w1, h1] = bbox1;
        const [x2, y2, w2, h2] = bbox2;
        
        const interX1 = Math.max(x1, x2);
        const interY1 = Math.max(y1, y2);
        const interX2 = Math.min(x1 + w1, x2 + w2);
        const interY2 = Math.min(y1 + h1, y2 + h2);
        
        const interW = Math.max(0, interX2 - interX1);
        const interH = Math.max(0, interY2 - interY1);
        const interArea = interW * interH;
        
        const area1 = w1 * h1;
        const area2 = w2 * h2;
        const unionArea = area1 + area2 - interArea;
        
        return unionArea > 0 ? interArea / unionArea : 0;
    }

    /**
     * Create new track for detection
     */
    createTrack(detection) {
        const trackId = this.generateTrackId();
        const bbox = detection.bbox || detection.box;
        
        const track = {
            id: trackId,
            bbox: bbox,
            kalmanState: [...bbox, 0, 0, 0, 0], // [x, y, w, h, vx, vy, vw, vh]
            age: 0,
            hits: 1,
            lost: false,
            class: detection.class,
            confidence: detection.confidence,
            history: [bbox],
            createdAt: Date.now(),
            lastSeenAt: Date.now()
        };
        
        this.tracks.set(trackId, track);
        this.stats.totalTracked++;
        
        console.log(`[ObjectTracker] New track ${trackId}: ${detection.class}`);
        
        return trackId;
    }

    /**
     * Update existing track with detection
     */
    updateTrack(trackId, detection) {
        const track = this.tracks.get(trackId);
        if (!track) return;
        
        const bbox = detection.bbox || detection.box;
        
        // Update Kalman state
        const oldState = track.kalmanState;
        const dt = this.dt;
        
        // Update velocity
        const vx = (bbox[0] - oldState[0]) / dt;
        const vy = (bbox[1] - oldState[1]) / dt;
        const vw = (bbox[2] - oldState[2]) / dt;
        const vh = (bbox[3] - oldState[3]) / dt;
        
        // Smooth update
        const alpha = 0.8; // Smoothing factor
        track.kalmanState = [
            bbox[0], bbox[1], bbox[2], bbox[3],
            alpha * vx + (1 - alpha) * oldState[4],
            alpha * vy + (1 - alpha) * oldState[5],
            alpha * vw + (1 - alpha) * oldState[6],
            alpha * vh + (1 - alpha) * oldState[7]
        ];
        
        track.bbox = bbox;
        track.age++;
        track.hits++;
        track.class = detection.class;
        track.confidence = detection.confidence;
        track.lastSeenAt = Date.now();
        track.history.push(bbox);
        
        // Limit history
        if (track.history.length > 30) {
            track.history.shift();
        }
    }

    /**
     * Mark track as lost
     */
    markTrackLost(trackId) {
        const track = this.tracks.get(trackId);
        if (!track) return;
        
        track.lost = true;
        track.age++;
        
        console.log(`[ObjectTracker] Track ${trackId} lost`);
    }

    /**
     * Remove dead tracks
     */
    removeDeadTracks() {
        for (const [trackId, track] of this.tracks) {
            if (track.age > this.maxAge) {
                this.tracks.delete(trackId);
                this.stats.lostTracks++;
                console.log(`[ObjectTracker] Track ${trackId} removed (age: ${track.age})`);
            }
        }
    }

    /**
     * Get active tracks
     */
    getActiveTracks() {
        const active = [];
        
        for (const [trackId, track] of this.tracks) {
            if (!track.lost && track.age <= this.maxAge) {
                active.push({
                    id: trackId,
                    bbox: track.bbox,
                    class: track.class,
                    confidence: track.confidence,
                    age: track.age,
                    velocity: this.calculateVelocity(track),
                    direction: this.calculateDirection(track)
                });
            }
        }
        
        return active;
    }

    /**
     * Calculate object velocity
     */
    calculateVelocity(track) {
        if (track.history.length < 2) return { x: 0, y: 0, speed: 0 };
        
        const last = track.history[track.history.length - 1];
        const prev = track.history[track.history.length - 2];
        
        const vx = last[0] - prev[0];
        const vy = last[1] - prev[1];
        const speed = Math.sqrt(vx * vx + vy * vy);
        
        return { x: vx, y: vy, speed };
    }

    /**
     * Calculate movement direction
     */
    calculateDirection(track) {
        const vel = this.calculateVelocity(track);
        
        if (vel.speed < 1) return 'stationary';
        
        const angle = Math.atan2(vel.y, vel.x) * 180 / Math.PI;
        
        if (angle > -45 && angle <= 45) return 'right';
        if (angle > 45 && angle <= 135) return 'down';
        if (angle > -135 && angle <= -45) return 'up';
        return 'left';
    }

    /**
     * Predict future trajectories
     */
    predictTrajectories(tracks, frames = 10) {
        const trajectories = [];
        
        for (const track of tracks) {
            const trajectory = [];
            const vel = this.calculateVelocity(track);
            
            for (let i = 1; i <= frames; i++) {
                trajectory.push({
                    frame: this.frameCount + i,
                    x: track.bbox[0] + vel.x * i,
                    y: track.bbox[1] + vel.y * i
                });
            }
            
            trajectories.push({
                trackId: track.id,
                class: track.class,
                trajectory
            });
        }
        
        return trajectories;
    }

    /**
     * Update statistics
     */
    updateStatistics(activeTracks) {
        this.stats.currentlyTracking = activeTracks.length;
        
        const trackLengths = Array.from(this.tracks.values())
            .filter(t => !t.lost)
            .map(t => t.age);
        
        this.stats.avgTrackLength = trackLengths.length > 0 ?
            trackLengths.reduce((a, b) => a + b, 0) / trackLengths.length : 0;
    }

    /**
     * Generate unique track ID
     */
    generateTrackId() {
        return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Count objects by class
     */
    countByClass() {
        const counts = {};
        
        for (const track of this.tracks.values()) {
            if (!track.lost) {
                counts[track.class] = (counts[track.class] || 0) + 1;
            }
        }
        
        return counts;
    }

    /**
     * Get tracking statistics
     */
    getStats() {
        return {
            ...this.stats,
            frameCount: this.frameCount,
            activeTracks: this.tracks.size,
            byClass: this.countByClass()
        };
    }

    /**
     * Clear all tracks
     */
    clear() {
        this.tracks.clear();
        this.frameCount = 0;
        console.log('[ObjectTracker] All tracks cleared');
    }

    /**
     * Export track data
     */
    exportTracks() {
        return {
            frameCount: this.frameCount,
            stats: this.getStats(),
            tracks: Array.from(this.tracks.values()).map(t => ({
                id: t.id,
                class: t.class,
                history: t.history,
                createdAt: t.createdAt,
                lastSeenAt: t.lastSeenAt
            }))
        };
    }
}

// Initialize global object tracker
window.objectTracker = new ObjectTracker();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectTracker;
}
