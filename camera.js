/**
 * Camera Module
 * Handles camera access, switching, and flash control
 */

class CameraModule {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.currentCamera = 'environment';
        this.flashEnabled = false;
        this.torchSupported = false;
        
        this.init();
    }
    
    async init() {
        this.video = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('cameraCanvas');
        
        if (this.video) {
            await this.startCamera();
        }
    }
    
    async startCamera() {
        try {
            // Stop existing stream
            if (this.stream) {
                this.stopStream();
            }
            
            // Request camera access
            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (this.video) {
                this.video.srcObject = this.stream;
                
                // Wait for video to load
                await new Promise((resolve) => {
                    this.video.onloadedmetadata = () => {
                        this.video.play();
                        this.setupCanvas();
                        resolve();
                    };
                });
                
                // Check torch support
                this.checkTorchSupport();
            }
            
            return true;
        } catch (error) {
            console.error('Camera start error:', error);
            
            if (error.name === 'NotAllowedError') {
                if (window.app) {
                    window.app.showToast('Camera permission denied', 'error');
                }
            } else if (error.name === 'NotFoundError') {
                if (window.app) {
                    window.app.showToast('No camera found', 'error');
                }
            }
            
            return false;
        }
    }
    
    setupCanvas() {
        if (!this.video || !this.canvas) return;
        
        const ctx = this.canvas.getContext('2d');
        
        // Match canvas size to video
        const updateSize = () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        };
        
        updateSize();
        this.video.addEventListener('resize', updateSize);
    }
    
    async switchCamera() {
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        await this.startCamera();
        
        if (window.app) {
            window.app.showToast(
                this.currentCamera === 'environment' ? 'Back camera' : 'Front camera',
                'info'
            );
        }
    }
    
    checkTorchSupport() {
        if (!this.stream) return;
        
        const track = this.stream.getVideoTracks()[0];
        if (!track) return;
        
        const capabilities = track.getCapabilities();
        this.torchSupported = !!capabilities.torch;
        
        // Update flash button state
        const flashBtn = document.getElementById('toggleFlashBtn');
        if (flashBtn) {
            flashBtn.style.opacity = this.torchSupported ? '1' : '0.5';
        }
    }
    
    async toggleFlash() {
        if (!this.torchSupported) {
            if (window.app) {
                window.app.showToast('Flash not supported on this device', 'warning');
            }
            return;
        }
        
        try {
            const track = this.stream.getVideoTracks()[0];
            if (!track) return;
            
            this.flashEnabled = !this.flashEnabled;
            
            await track.applyConstraints({
                advanced: [{ torch: this.flashEnabled }]
            });
            
            if (window.app) {
                window.app.showToast(
                    this.flashEnabled ? 'Flash on' : 'Flash off',
                    'info'
                );
            }
        } catch (error) {
            console.error('Flash toggle error:', error);
            this.torchSupported = false;
        }
    }
    
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
    
    captureFrame() {
        if (!this.video || !this.canvas) return null;
        
        const ctx = this.canvas.getContext('2d');
        
        // Draw current video frame to canvas
        ctx.drawImage(
            this.video,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );
        
        return this.canvas;
    }
    
    getImageData() {
        if (!this.canvas) return null;
        
        const ctx = this.canvas.getContext('2d');
        return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    async takePhoto() {
        const canvas = this.captureFrame();
        if (!canvas) return null;
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    }
    
    getVideoDimensions() {
        if (!this.video) return { width: 0, height: 0 };
        
        return {
            width: this.video.videoWidth,
            height: this.video.videoHeight
        };
    }
    
    // Get camera intrinsics (approximate)
    getCameraIntrinsics() {
        const dimensions = this.getVideoDimensions();
        
        // Approximate focal length based on typical smartphone camera
        // This is a simplification - real apps would calibrate this
        const diagonalPixels = Math.sqrt(
            dimensions.width ** 2 + dimensions.height ** 2
        );
        
        // Assume ~60° horizontal FOV for typical smartphone
        const focalLengthPixels = diagonalPixels / (2 * Math.tan(30 * Math.PI / 180));
        
        return {
            fx: focalLengthPixels,
            fy: focalLengthPixels,
            cx: dimensions.width / 2,
            cy: dimensions.height / 2
        };
    }
}

// Initialize camera module
window.cameraModule = new CameraModule();
