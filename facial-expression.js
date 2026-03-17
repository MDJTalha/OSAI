/**
 * Facial Expression Detection Module
 * Detect and analyze human facial expressions
 * - Face detection
 * - Emotion recognition
 * - Facial landmark detection
 * - Expression analysis
 */

class FacialExpressionModule {
    constructor() {
        this.faceapi = null;
        this.isLoaded = false;
        this.isDetecting = false;
        this.detectedFaces = [];
        this.expressionHistory = [];
        this.settings = {
            minConfidence: 0.6,
            detectEmotions: true,
            detectLandmarks: true,
            detectAge: true,
            detectGender: true,
            continuousDetection: false
        };

        this.expressions = {
            neutral: '😐 Neutral',
            happy: '😊 Happy',
            sad: '😢 Sad',
            angry: '😠 Angry',
            fearful: '😨 Fearful',
            disgusted: '🤢 Disgusted',
            surprised: '😲 Surprised'
        };

        this.init();
    }

    async init() {
        await this.loadFaceAPI();
    }

    /**
     * Load face-api.js library
     */
    async loadFaceAPI() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof faceapi !== 'undefined') {
                this.faceapi = window.faceapi;
                this.isLoaded = true;
                resolve();
                return;
            }

            // Load face-api.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
            script.onload = async () => {
                this.faceapi = window.faceapi;
                await this.loadModels();
                resolve();
            };
            script.onerror = () => {
                console.error('[FaceExpression] Failed to load face-api.js');
                reject(new Error('Failed to load face-api.js'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load face detection models
     */
    async loadModels() {
        try {
            // Load models from CDN
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

            await Promise.all([
                this.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                this.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                this.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                this.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                this.faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
            ]);

            this.isLoaded = true;
            console.log('[FaceExpression] Models loaded');
        } catch (error) {
            console.error('[FaceExpression] Model load error:', error);
            this.isLoaded = false;
        }
    }

    /**
     * Start face detection
     */
    async startDetection() {
        if (!this.isLoaded) {
            await this.loadFaceAPI();
        }

        if (!this.isLoaded) {
            console.error('[FaceExpression] Models not loaded');
            return false;
        }

        this.isDetecting = true;
        console.log('[FaceExpression] Detection started');

        this.detectionLoop();
        return true;
    }

    /**
     * Stop face detection
     */
    stopDetection() {
        this.isDetecting = false;
        this.detectedFaces = [];
        console.log('[FaceExpression] Detection stopped');
    }

    /**
     * Continuous detection loop
     */
    async detectionLoop() {
        if (!this.isDetecting) return;

        try {
            const result = await this.detectFaces();
            
            if (result && result.length > 0) {
                this.detectedFaces = result;
                this.handleDetection(result);
            }
        } catch (error) {
            console.error('[FaceExpression] Detection error:', error);
        }

        if (this.isDetecting && this.settings.continuousDetection) {
            setTimeout(() => this.detectionLoop(), 500);
        }
    }

    /**
     * Detect faces in current frame
     */
    async detectFaces() {
        const video = document.getElementById('cameraFeed');
        if (!video || !this.isLoaded) return [];

        try {
            const detections = await this.faceapi
                .detectAllFaces(video, new this.faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();

            return detections.map(detection => ({
                box: detection.detection.box,
                expressions: detection.expressions,
                age: detection.age,
                gender: detection.gender,
                genderProbability: detection.genderProbability,
                landmarks: detection.landmarks
            }));
        } catch (error) {
            console.error('[FaceExpression] Detect error:', error);
            return [];
        }
    }

    /**
     * Handle detection results
     */
    handleDetection(faces) {
        // Add to history
        faces.forEach(face => {
            const dominantExpression = this.getDominantExpression(face.expressions);
            
            this.expressionHistory.push({
                expression: dominantExpression,
                emotions: face.expressions,
                age: face.age,
                gender: face.gender,
                timestamp: Date.now()
            });
        });

        // Limit history
        if (this.expressionHistory.length > 100) {
            this.expressionHistory.shift();
        }

        // Notify app
        if (window.app) {
            window.app.displayFaceResults(faces);
        }
    }

    /**
     * Get dominant expression
     */
    getDominantExpression(expressions) {
        if (!expressions) return 'neutral';

        let maxExpression = 'neutral';
        let maxValue = 0;

        for (const [expression, value] of Object.entries(expressions)) {
            if (value > maxValue) {
                maxValue = value;
                maxExpression = expression;
            }
        }

        return maxExpression;
    }

    /**
     * Detect single face from image
     */
    async detectFromImage(canvas) {
        if (!this.isLoaded || !canvas) return null;

        try {
            const detection = await this.faceapi
                .detectSingleFace(canvas, new this.faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();

            if (detection) {
                return {
                    box: detection.detection.box,
                    expressions: detection.expressions,
                    age: detection.age,
                    gender: detection.gender,
                    genderProbability: detection.genderProbability,
                    dominantExpression: this.getDominantExpression(detection.expressions),
                    confidence: detection.detection.score
                };
            }

            return null;
        } catch (error) {
            console.error('[FaceExpression] Image detect error:', error);
            return null;
        }
    }

    /**
     * Analyze mood from expressions
     */
    analyzeMood(faces) {
        if (!faces || faces.length === 0) return null;

        const moodScores = {
            positive: 0,
            neutral: 0,
            negative: 0
        };

        faces.forEach(face => {
            const expressions = face.expressions;
            
            // Positive emotions
            moodScores.positive += (expressions.happy || 0);
            moodScores.positive += (expressions.surprised || 0) * 0.5;

            // Neutral
            moodScores.neutral += (expressions.neutral || 0);

            // Negative emotions
            moodScores.negative += (expressions.sad || 0);
            moodScores.negative += (expressions.angry || 0);
            moodScores.negative += (expressions.fearful || 0);
            moodScores.negative += (expressions.disgusted || 0);
        });

        const total = moodScores.positive + moodScores.neutral + moodScores.negative;
        
        if (total === 0) return { mood: 'unknown', confidence: 0 };

        const positive = moodScores.positive / total;
        const neutral = moodScores.neutral / total;
        const negative = moodScores.negative / total;

        let mood = 'neutral';
        if (positive > 0.5) mood = 'positive';
        else if (negative > 0.3) mood = 'negative';

        return {
            mood,
            positive: Math.round(positive * 100),
            neutral: Math.round(neutral * 100),
            negative: Math.round(negative * 100),
            confidence: Math.max(positive, neutral, negative)
        };
    }

    /**
     * Get expression statistics
     */
    getExpressionStats() {
        if (this.expressionHistory.length === 0) return null;

        const stats = {
            total: this.expressionHistory.length,
            expressions: {},
            averageAge: 0,
            genderDistribution: { male: 0, female: 0 }
        };

        let ageSum = 0;

        this.expressionHistory.forEach(entry => {
            // Count expressions
            stats.expressions[entry.expression] = (stats.expressions[entry.expression] || 0) + 1;
            
            // Sum age
            ageSum += entry.age || 0;
            
            // Count gender
            if (entry.gender === 'male') {
                stats.genderDistribution.male++;
            } else if (entry.gender === 'female') {
                stats.genderDistribution.female++;
            }
        });

        stats.averageAge = Math.round(ageSum / stats.total);

        return stats;
    }

    /**
     * Draw face overlays
     */
    drawFaceOverlays(ctx, faces) {
        if (!ctx || !faces || faces.length === 0) return;

        faces.forEach(face => {
            const { box, expressions, age, gender } = face;

            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Draw expression label
            const dominantExpression = this.getDominantExpression(expressions);
            const expressionLabel = this.expressions[dominantExpression] || dominantExpression;
            
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(expressionLabel, box.x + 5, box.y + 25);

            // Draw age and gender
            if (age && gender) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px sans-serif';
                ctx.fillText(`${gender}, ${Math.round(age)}yo`, box.x + 5, box.y + 45);
            }

            // Draw expression bars
            const barWidth = box.width;
            const barHeight = 4;
            const barY = box.y + box.height + 5;
            
            let xOffset = box.x;
            Object.entries(expressions).forEach(([expr, value]) => {
                if (value > 0.1) {
                    const barLength = barWidth * value;
                    
                    // Color based on emotion type
                    if (['happy', 'surprised'].includes(expr)) {
                        ctx.fillStyle = '#4caf50'; // Green for positive
                    } else if (['sad', 'angry', 'fearful', 'disgusted'].includes(expr)) {
                        ctx.fillStyle = '#f44336'; // Red for negative
                    } else {
                        ctx.fillStyle = '#ff9800'; // Orange for neutral
                    }
                    
                    ctx.fillRect(xOffset, barY, barLength, barHeight);
                    xOffset += barLength + 2;
                }
            });
        });
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.expressionHistory = [];
    }

    /**
     * Get history
     */
    getHistory(limit = 10) {
        return this.expressionHistory.slice(-limit);
    }

    /**
     * Export results
     */
    exportResults(format = 'json') {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(this.expressionHistory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `face-analysis-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return this.expressionHistory;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Check if module is ready
     */
    isReady() {
        return this.isLoaded;
    }
}

// Initialize facial expression module
window.facialExpression = new FacialExpressionModule();
