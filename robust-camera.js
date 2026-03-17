/**
 * Robust Camera Module - Enterprise Grade
 * Continuous analysis with auto-capture for anomalies
 * - Non-blocking camera operation
 * - Continuous frame analysis
 * - Auto-capture on anomalies
 * - Clip recording
 * - Screenshot capture
 * - Error recovery
 */

class RobustCameraModule {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.currentCamera = 'environment';
        this.flashEnabled = false;
        this.torchSupported = false;
        this.isAnalyzing = false;
        this.analysisInterval = null;
        this.autoCaptureEnabled = true;
        this.recordedClips = [];
        this.capturedScreenshots = [];
        this.anomalyThreshold = 0.7;
        this.lastFrameData = null;
        this.frameHistory = [];
        this.settings = {
            continuousAnalysis: true,
            autoCaptureAnomalies: true,
            clipDuration: 10000, // 10 seconds
            screenshotOnDetect: true,
            maxFrameHistory: 30
        };

        this.init();
    }

    async init() {
        this.video = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('cameraCanvas');

        if (this.video) {
            await this.startCamera();
            if (this.settings.continuousAnalysis) {
                this.startContinuousAnalysis();
            }
        }
    }

    /**
     * Start camera with error recovery
     */
    async startCamera() {
        try {
            if (this.stream) {
                this.stopStream();
            }

            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (this.video) {
                this.video.srcObject = this.stream;

                await new Promise((resolve) => {
                    this.video.onloadedmetadata = () => {
                        this.video.play().catch(err => {
                            console.error('[RobustCamera] Play error:', err);
                            this.handleCameraError(err);
                        });
                        this.setupCanvas();
                        resolve();
                    };
                    
                    this.video.onerror = () => {
                        this.handleCameraError(new Error('Video playback failed'));
                    };
                });

                this.checkTorchSupport();
                console.log('[RobustCamera] Camera started successfully');
                return true;
            }
        } catch (error) {
            console.error('[RobustCamera] Start error:', error);
            this.handleCameraError(error);
            return false;
        }
    }

    /**
     * Handle camera errors gracefully
     */
    handleCameraError(error) {
        console.error('[RobustCamera] Error:', error);
        
        // Attempt recovery
        setTimeout(async () => {
            console.log('[RobustCamera] Attempting recovery...');
            await this.startCamera();
        }, 2000);

        // Notify app
        if (window.app) {
            window.app.showToast('Camera error - attempting recovery', 'error');
        }
    }

    /**
     * Setup canvas for frame capture
     */
    setupCanvas() {
        if (!this.video || !this.canvas) return;

        const ctx = this.canvas.getContext('2d');

        const updateSize = () => {
            this.canvas.width = this.video.videoWidth || 1280;
            this.canvas.height = this.video.videoHeight || 720;
        };

        updateSize();
        this.video.addEventListener('resize', updateSize);
    }

    /**
     * Start continuous frame analysis
     */
    startContinuousAnalysis() {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        console.log('[RobustCamera] Continuous analysis started');

        const analyze = () => {
            if (!this.isAnalyzing) return;

            try {
                const frameData = this.captureFrameData();
                
                if (frameData) {
                    this.analyzeFrame(frameData);
                    this.frameHistory.push(frameData);
                    
                    // Limit history
                    if (this.frameHistory.length > this.settings.maxFrameHistory) {
                        this.frameHistory.shift();
                    }
                }
            } catch (error) {
                console.error('[RobustCamera] Analysis error:', error);
            }

            // Continue analysis (adjust interval based on performance)
            this.analysisInterval = setTimeout(analyze, 500); // Analyze every 500ms
        };

        analyze();
    }

    /**
     * Stop continuous analysis
     */
    stopContinuousAnalysis() {
        this.isAnalyzing = false;
        if (this.analysisInterval) {
            clearTimeout(this.analysisInterval);
            this.analysisInterval = null;
        }
        console.log('[RobustCamera] Continuous analysis stopped');
    }

    /**
     * Capture current frame data
     */
    captureFrameData() {
        if (!this.video || !this.canvas) return null;

        const ctx = this.canvas.getContext('2d');
        
        if (this.video.readyState < 2) return null;

        try {
            ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            return {
                imageData: imageData,
                timestamp: Date.now(),
                brightness: this.calculateBrightness(imageData),
                contrast: this.calculateContrast(imageData),
                motion: this.calculateMotion(imageData)
            };
        } catch (error) {
            console.error('[RobustCamera] Capture error:', error);
            return null;
        }
    }

    /**
     * Analyze frame for anomalies
     */
    analyzeFrame(frameData) {
        if (!this.autoCaptureEnabled) return;

        // Check for significant changes
        if (this.lastFrameData) {
            const change = this.calculateFrameChange(this.lastFrameData, frameData);
            
            // Detect anomaly
            if (change > this.anomalyThreshold) {
                this.handleAnomalyDetected(frameData, change);
            }
        }

        this.lastFrameData = frameData;
    }

    /**
     * Handle anomaly detection
     */
    async handleAnomalyDetected(frameData, changeScore) {
        console.log(`[RobustCamera] Anomaly detected: ${Math.round(changeScore * 100)}% change`);

        // Auto-capture screenshot
        if (this.settings.screenshotOnDetect) {
            await this.captureScreenshot('anomaly', changeScore);
        }

        // Start clip recording if not already
        if (!this.isRecording) {
            this.startClipRecording();
        }

        // Notify app
        if (window.app) {
            window.app.onAnomalyDetected({
                type: 'scene_change',
                confidence: changeScore,
                timestamp: frameData.timestamp,
                frameData: frameData
            });
        }
    }

    /**
     * Calculate brightness of frame
     */
    calculateBrightness(imageData) {
        const data = imageData.data;
        let sum = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        
        return sum / (data.length / 4);
    }

    /**
     * Calculate contrast of frame
     */
    calculateContrast(imageData) {
        const data = imageData.data;
        let sum = 0;
        let sumSq = 0;
        const n = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sumSq += gray * gray;
        }

        const mean = sum / n;
        return Math.sqrt(sumSq / n - mean * mean);
    }

    /**
     * Calculate motion between frames
     */
    calculateMotion(currentFrame) {
        if (!this.lastFrameData) return 0;

        return this.calculateFrameChange(this.lastFrameData, currentFrame);
    }

    /**
     * Calculate frame change percentage
     */
    calculateFrameChange(prev, current) {
        if (!prev || !current) return 0;

        const prevData = prev.imageData.data;
        const currentData = current.imageData.data;
        
        let diff = 0;
        const sampleSize = Math.min(prevData.length, currentData.length, 10000);
        const step = Math.floor(prevData.length / sampleSize);

        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step;
            const pixelDiff = Math.abs(
                (prevData[idx] + prevData[idx + 1] + prevData[idx + 2]) / 3 -
                (currentData[idx] + currentData[idx + 1] + currentData[idx + 2]) / 3
            );
            
            if (pixelDiff > 30) { // Threshold for significant change
                diff++;
            }
        }

        return diff / sampleSize;
    }

    /**
     * Capture screenshot
     */
    async captureScreenshot(type = 'manual', metadata = {}) {
        if (!this.canvas) return null;

        try {
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/jpeg', 0.9);
            });

            const screenshot = {
                id: this.generateId(),
                type: type,
                blob: blob,
                url: URL.createObjectURL(blob),
                timestamp: Date.now(),
                metadata: metadata
            };

            this.capturedScreenshots.push(screenshot);
            
            // Limit screenshots
            if (this.capturedScreenshots.length > 50) {
                const old = this.capturedScreenshots.shift();
                URL.revokeObjectURL(old.url);
            }

            console.log(`[RobustCamera] Screenshot captured: ${type}`);
            return screenshot;
        } catch (error) {
            console.error('[RobustCamera] Screenshot error:', error);
            return null;
        }
    }

    /**
     * Start clip recording
     */
    async startClipRecording() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.currentClipFrames = [];
        
        console.log('[RobustCamera] Clip recording started');

        const recordFrame = () => {
            if (!this.isRecording) return;

            const frame = this.captureFrameData();
            if (frame) {
                this.currentClipFrames.push(frame);
            }

            // Continue recording
            setTimeout(recordFrame, 100); // 10 fps
        };

        recordFrame();

        // Auto-stop after duration
        setTimeout(() => this.stopClipRecording(), this.settings.clipDuration);
    }

    /**
     * Stop clip recording
     */
    async stopClipRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        
        // Create clip from frames
        const clip = {
            id: this.generateId(),
            frames: this.currentClipFrames,
            duration: this.settings.clipDuration,
            timestamp: Date.now(),
            frameCount: this.currentClipFrames.length
        };

        this.recordedClips.push(clip);
        
        // Limit clips
        if (this.recordedClips.length > 20) {
            this.recordedClips.shift();
        }

        console.log(`[RobustCamera] Clip recorded: ${clip.frameCount} frames`);
        return clip;
    }

    /**
     * Get recorded clips
     */
    getClips(limit = 10) {
        return this.recordedClips.slice(-limit);
    }

    /**
     * Get captured screenshots
     */
    getScreenshots(limit = 10) {
        return this.capturedScreenshots.slice(-limit);
    }

    /**
     * Switch camera
     */
    async switchCamera() {
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        return await this.startCamera();
    }

    /**
     * Toggle flash
     */
    async toggleFlash() {
        if (!this.torchSupported) {
            console.log('[RobustCamera] Flash not supported');
            return false;
        }

        try {
            const track = this.stream.getVideoTracks()[0];
            this.flashEnabled = !this.flashEnabled;

            await track.applyConstraints({
                advanced: [{ torch: this.flashEnabled }]
            });

            return this.flashEnabled;
        } catch (error) {
            console.error('[RobustCamera] Flash error:', error);
            return false;
        }
    }

    /**
     * Check torch support
     */
    checkTorchSupport() {
        if (!this.stream) return;

        const track = this.stream.getVideoTracks()[0];
        if (!track) return;

        const capabilities = track.getCapabilities();
        this.torchSupported = !!capabilities.torch;
    }

    /**
     * Stop stream
     */
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * Capture frame (legacy support)
     */
    captureFrame() {
        if (!this.video || !this.canvas) return null;

        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        return this.canvas;
    }

    /**
     * Get image data
     */
    getImageData() {
        if (!this.canvas) return null;

        const ctx = this.canvas.getContext('2d');
        return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get video dimensions
     */
    getVideoDimensions() {
        if (!this.video) return { width: 0, height: 0 };
        return {
            width: this.video.videoWidth,
            height: this.video.videoHeight
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.continuousAnalysis !== undefined) {
            if (newSettings.continuousAnalysis) {
                this.startContinuousAnalysis();
            } else {
                this.stopContinuousAnalysis();
            }
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stopContinuousAnalysis();
        this.stopStream();
        
        // Release URLs
        this.capturedScreenshots.forEach(s => URL.revokeObjectURL(s.url));
        this.recordedClips = [];
        this.capturedScreenshots = [];
    }
}

// Initialize robust camera module
window.robustCamera = new RobustCameraModule();
