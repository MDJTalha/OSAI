/**
 * Fixed Camera Module - Vercel & Mobile Compatible
 * Proper camera initialization with user permission flow
 * 
 * Fixes:
 * - User interaction required for camera (browser security)
 * - Proper HTTPS handling for Vercel
 * - Mobile browser compatibility
 * - Permission request flow
 * - Error recovery
 */

class FixedCameraModule {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.currentCamera = 'environment';
        this.flashEnabled = false;
        this.torchSupported = false;
        this.isCameraActive = false;
        this.permissionGranted = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 3;
        
        this.init();
    }

    async init() {
        console.log('[FixedCamera] Initializing...');
        
        this.video = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('cameraCanvas');
        
        // Wait for DOM to be ready
        if (!this.video || !this.canvas) {
            console.warn('[FixedCamera] Video/Canvas not ready, waiting...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        // Check HTTPS
        this.checkHTTPS();
        
        // Check camera permission
        await this.checkCameraPermission();
        
        // Setup UI controls
        this.setupControls();
        
        console.log('[FixedCamera] Initialization complete');
    }

    /**
     * Check HTTPS requirement
     */
    checkHTTPS() {
        const isSecure = window.location.protocol === 'https:' || 
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';
        
        if (!isSecure) {
            console.error('[FixedCamera] Camera requires HTTPS!');
            this.showToast('Camera requires HTTPS. Please use HTTPS or localhost.', 'error');
        } else {
            console.log('[FixedCamera] HTTPS verified:', window.location.hostname);
        }
    }

    /**
     * Check camera permission status
     */
    async checkCameraPermission() {
        try {
            if ('permissions' in navigator) {
                const result = await navigator.permissions.query({ name: 'camera' });
                this.permissionGranted = result.state === 'granted';
                
                console.log('[FixedCamera] Permission status:', result.state);
                
                result.onchange = () => {
                    this.permissionGranted = result.state === 'granted';
                    if (this.permissionGranted) {
                        this.startCamera();
                    }
                };
            } else {
                // Browser doesn't support permissions API
                this.permissionGranted = false;
            }
        } catch (error) {
            console.warn('[FixedCamera] Permission check failed:', error);
            this.permissionGranted = false;
        }
    }

    /**
     * Setup UI controls
     */
    setupControls() {
        // Create camera start button if camera not active
        if (!this.isCameraActive) {
            this.createStartButton();
        }
        
        // Setup existing controls
        const switchBtn = document.getElementById('switchCameraBtn');
        const flashBtn = document.getElementById('toggleFlashBtn');
        
        if (switchBtn) {
            switchBtn.addEventListener('click', () => this.switchCamera());
        }
        
        if (flashBtn) {
            flashBtn.addEventListener('click', () => this.toggleFlash());
            flashBtn.disabled = true;
        }
    }

    /**
     * Create camera start button
     */
    createStartButton() {
        // Check if button already exists
        if (document.getElementById('startCameraBtn')) return;
        
        const startBtn = document.createElement('button');
        startBtn.id = 'startCameraBtn';
        startBtn.className = 'control-fab primary';
        startBtn.innerHTML = '<i class="fas fa-camera"></i>';
        startBtn.title = 'Start Camera';
        startBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            border: none;
            color: white;
            font-size: 32px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            transition: all 0.3s;
        `;
        
        startBtn.addEventListener('click', () => {
            startBtn.style.opacity = '0';
            setTimeout(() => startBtn.remove(), 300);
            this.startCamera();
        });
        
        // Add to camera container
        const container = document.querySelector('.camera-container');
        if (container) {
            container.appendChild(startBtn);
        }
        
        console.log('[FixedCamera] Start button created');
    }

    /**
     * Start camera with proper error handling
     */
    async startCamera() {
        if (this.isCameraActive) {
            console.log('[FixedCamera] Already active');
            return true;
        }
        
        this.initAttempts++;
        if (this.initAttempts > this.maxInitAttempts) {
            this.showToast('Camera initialization failed. Please refresh the page.', 'error');
            return false;
        }
        
        try {
            console.log('[FixedCamera] Starting camera (attempt', this.initAttempts, ')...');
            
            // Stop existing stream
            if (this.stream) {
                this.stopStream();
            }
            
            // Request camera with optimal constraints
            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            // Get media stream
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Attach to video element
            if (this.video) {
                this.video.srcObject = this.stream;
                
                // Wait for video to load
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Video load timeout'));
                    }, 10000);
                    
                    this.video.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        this.video.play().then(() => {
                            this.setupCanvas();
                            this.isCameraActive = true;
                            this.permissionGranted = true;
                            this.checkTorchSupport();
                            this.showToast('Camera started successfully!', 'success');
                            resolve();
                        }).catch(reject);
                    };
                    
                    this.video.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video error'));
                    };
                });
                
                console.log('[FixedCamera] Camera started successfully');
                return true;
            }
            
        } catch (error) {
            console.error('[FixedCamera] Start error:', error);
            this.handleCameraError(error);
            return false;
        }
    }

    /**
     * Handle camera errors
     */
    handleCameraError(error) {
        console.error('[FixedCamera] Error:', error);
        
        let message = 'Camera error. ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            message += 'Please allow camera permission and refresh the page.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            message += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            message += 'Camera is being used by another application.';
        } else if (error.name === 'OverconstrainedError') {
            message += 'Camera does not support requested settings.';
        } else if (error.name === 'TypeError') {
            message += 'HTTPS required for camera access.';
        } else {
            message += error.message;
        }
        
        this.showToast(message, 'error');
        
        // Create retry button
        this.createRetryButton();
    }

    /**
     * Create retry button
     */
    createRetryButton() {
        if (document.getElementById('retryCameraBtn')) return;
        
        const retryBtn = document.createElement('button');
        retryBtn.id = 'retryCameraBtn';
        retryBtn.textContent = 'Retry Camera';
        retryBtn.style.cssText = `
            position: absolute;
            top: 60%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            padding: 12px 24px;
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        retryBtn.addEventListener('click', () => {
            retryBtn.remove();
            this.startCamera();
        });
        
        const container = document.querySelector('.camera-container');
        if (container) {
            container.appendChild(retryBtn);
        }
    }

    /**
     * Setup canvas
     */
    setupCanvas() {
        if (!this.video || !this.canvas) return;
        
        const ctx = this.canvas.getContext('2d');
        
        const updateSize = () => {
            this.canvas.width = this.video.videoWidth || 1280;
            this.canvas.height = this.video.videoHeight || 720;
            
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        };
        
        updateSize();
        this.video.addEventListener('resize', updateSize);
        
        console.log('[FixedCamera] Canvas setup:', this.canvas.width, 'x', this.canvas.height);
    }

    /**
     * Stop camera stream
     */
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.isCameraActive = false;
            console.log('[FixedCamera] Stream stopped');
        }
    }

    /**
     * Switch camera
     */
    async switchCamera() {
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        await this.startCamera();
        this.showToast(
            this.currentCamera === 'environment' ? 'Back camera' : 'Front camera',
            'info'
        );
    }

    /**
     * Check torch support
     */
    checkTorchSupport() {
        if (!this.stream) return;
        
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;
        
        try {
            const capabilities = track.getCapabilities();
            this.torchSupported = !!capabilities.torch;
            
            const flashBtn = document.getElementById('toggleFlashBtn');
            if (flashBtn) {
                flashBtn.disabled = !this.torchSupported;
                flashBtn.style.opacity = this.torchSupported ? '1' : '0.5';
            }
            
            console.log('[FixedCamera] Torch supported:', this.torchSupported);
        } catch (e) {
            console.warn('[FixedCamera] Torch check failed:', e);
            this.torchSupported = false;
        }
    }

    /**
     * Toggle flash
     */
    async toggleFlash() {
        if (!this.torchSupported) {
            this.showToast('Flash not supported', 'warning');
            return;
        }
        
        try {
            const track = this.stream.getVideoTracks()[0];
            if (!track) return;
            
            this.flashEnabled = !this.flashEnabled;
            
            await track.applyConstraints({
                advanced: [{ torch: this.flashEnabled }]
            });
            
            this.showToast(this.flashEnabled ? 'Flash on' : 'Flash off', 'info');
        } catch (error) {
            console.error('[FixedCamera] Flash error:', error);
            this.torchSupported = false;
        }
    }

    /**
     * Capture frame
     */
    captureFrame() {
        if (!this.video || !this.canvas || !this.isCameraActive) return null;
        
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        return this.canvas;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.app?.showToast) {
            window.app.showToast(message, type);
        } else {
            // Fallback toast
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#3B82F6'};
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    /**
     * Get camera status
     */
    getStatus() {
        return {
            isActive: this.isCameraActive,
            permissionGranted: this.permissionGranted,
            currentCamera: this.currentCamera,
            torchSupported: this.torchSupported,
            flashEnabled: this.flashEnabled,
            stream: !!this.stream
        };
    }
}

// Initialize fixed camera module
window.fixedCamera = new FixedCameraModule();

// Also assign to cameraModule for compatibility
window.cameraModule = window.fixedCamera;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FixedCameraModule;
}
