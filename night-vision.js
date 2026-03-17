/**
 * Night Vision Enhancement Module
 * Enhance low-light camera performance
 * - Digital night vision
 * - Image brightening
 * - Noise reduction
 * - Contrast enhancement
 * - Infrared simulation
 */

class NightVisionModule {
    constructor() {
        this.isEnabled = false;
        this.enhancementLevel = 'medium'; // low, medium, high
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            brightness: 1.5,
            contrast: 1.3,
            saturation: 0.8,
            noiseReduction: true,
            greenTint: false, // Classic night vision look
            sharpening: true
        };

        this.init();
    }

    async init() {
        this.videoElement = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('cameraCanvas');
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        console.log('[NightVision] Module initialized');
    }

    /**
     * Enable night vision
     */
    async enableNightVision() {
        if (this.isEnabled) return true;

        try {
            // Request camera with exposure settings if supported
            if (this.videoElement && this.videoElement.srcObject) {
                const tracks = this.videoElement.srcObject.getVideoTracks();
                
                for (const track of tracks) {
                    const capabilities = track.getCapabilities();
                    const settings = {};

                    // Adjust exposure if available
                    if (capabilities.exposureMode) {
                        settings.exposureMode = 'manual';
                        if (capabilities.exposureTime) {
                            settings.exposureTime = capabilities.exposureTime.max;
                        }
                    }

                    // Adjust brightness if available
                    if (capabilities.brightness) {
                        settings.brightness = capabilities.brightness.max;
                    }

                    // Adjust ISO if available
                    if (capabilities.iso) {
                        settings.iso = capabilities.iso.max;
                    }

                    try {
                        await track.applyConstraints({ advanced: [settings] });
                    } catch (error) {
                        console.log('[NightVision] Hardware adjustment not supported');
                    }
                }
            }

            this.isEnabled = true;
            this.startEnhancement();
            
            console.log('[NightVision] Night vision enabled');
            return true;
        } catch (error) {
            console.error('[NightVision] Enable error:', error);
            return false;
        }
    }

    /**
     * Disable night vision
     */
    async disableNightVision() {
        if (!this.isEnabled) return true;

        try {
            // Reset camera settings
            if (this.videoElement && this.videoElement.srcObject) {
                const tracks = this.videoElement.srcObject.getVideoTracks();
                
                for (const track of tracks) {
                    try {
                        await track.applyConstraints({
                            advanced: [{
                                exposureMode: 'auto',
                                brightness: null,
                                iso: null
                            }]
                        });
                    } catch (error) {
                        // Ignore reset errors
                    }
                }
            }

            this.isEnabled = false;
            this.stopEnhancement();
            
            console.log('[NightVision] Night vision disabled');
            return true;
        } catch (error) {
            console.error('[NightVision] Disable error:', error);
            return false;
        }
    }

    /**
     * Toggle night vision
     */
    async toggleNightVision() {
        if (this.isEnabled) {
            return await this.disableNightVision();
        } else {
            return await this.enableNightVision();
        }
    }

    /**
     * Start image enhancement
     */
    startEnhancement() {
        if (!this.canvas || !this.videoElement) return;

        const enhance = () => {
            if (!this.isEnabled) return;

            this.enhanceFrame();
            requestAnimationFrame(enhance);
        };

        enhance();
    }

    /**
     * Stop image enhancement
     */
    stopEnhancement() {
        // Clear canvas and show normal video
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Enhance current frame
     */
    enhanceFrame() {
        if (!this.videoElement || !this.canvas || !this.ctx) return;

        const width = this.videoElement.videoWidth;
        const height = this.videoElement.videoHeight;

        if (width === 0 || height === 0) return;

        // Set canvas size
        this.canvas.width = width;
        this.canvas.height = height;

        // Draw current frame
        this.ctx.drawImage(this.videoElement, 0, 0, width, height);

        // Get image data
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Apply enhancements
        this.applyBrightness(data, this.settings.brightness);
        this.applyContrast(data, this.settings.contrast);
        
        if (this.settings.saturation !== 1) {
            this.applySaturation(data, this.settings.saturation);
        }

        if (this.settings.noiseReduction) {
            this.reduceNoise(data, width, height);
        }

        if (this.settings.greenTint) {
            this.applyGreenTint(data);
        }

        if (this.settings.sharpening) {
            this.applySharpening(data, width, height);
        }

        // Put enhanced image back
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Apply brightness enhancement
     */
    applyBrightness(data, brightness) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * brightness);     // R
            data[i + 1] = Math.min(255, data[i + 1] * brightness); // G
            data[i + 2] = Math.min(255, data[i + 2] * brightness); // B
        }
    }

    /**
     * Apply contrast enhancement
     */
    applyContrast(data, contrast) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }
    }

    /**
     * Apply saturation adjustment
     */
    applySaturation(data, saturation) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const gray = 0.2989 * r + 0.587 * g + 0.114 * b;

            data[i] = -gray * saturation + gray + r * saturation;
            data[i + 1] = -gray * saturation + gray + g * saturation;
            data[i + 2] = -gray * saturation + gray + b * saturation;
        }
    }

    /**
     * Simple noise reduction
     */
    reduceNoise(data, width, height) {
        // Simple box blur for noise reduction
        const copy = new Uint8ClampedArray(data);
        const kernelSize = 3;
        const halfKernel = Math.floor(kernelSize / 2);

        for (let y = halfKernel; y < height - halfKernel; y++) {
            for (let x = halfKernel; x < width - halfKernel; x++) {
                for (let c = 0; c < 3; c++) { // RGB channels
                    let sum = 0;
                    let count = 0;

                    for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += copy[idx];
                            count++;
                        }
                    }

                    const idx = (y * width + x) * 4 + c;
                    data[idx] = sum / count;
                }
            }
        }
    }

    /**
     * Apply green tint (classic night vision)
     */
    applyGreenTint(data) {
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg * 0.3;     // R (reduced)
            data[i + 1] = avg * 1.0; // G (full)
            data[i + 2] = avg * 0.3; // B (reduced)
        }
    }

    /**
     * Simple sharpening
     */
    applySharpening(data, width, height) {
        const copy = new Uint8ClampedArray(data);
        
        // Simple sharpening kernel
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    
                    const center = copy[idx];
                    const left = copy[((y) * width + (x - 1)) * 4 + c];
                    const right = copy[((y) * width + (x + 1)) * 4 + c];
                    const top = copy[((y - 1) * width + x) * 4 + c];
                    const bottom = copy[((y + 1) * width + x) * 4 + c];

                    const sharpened = 5 * center - left - right - top - bottom;
                    data[idx] = Math.min(255, Math.max(0, sharpened));
                }
            }
        }
    }

    /**
     * Set enhancement level
     */
    setEnhancementLevel(level) {
        this.enhancementLevel = level;

        switch (level) {
            case 'low':
                this.settings.brightness = 1.3;
                this.settings.contrast = 1.2;
                this.settings.noiseReduction = true;
                break;
            case 'medium':
                this.settings.brightness = 1.5;
                this.settings.contrast = 1.3;
                this.settings.noiseReduction = true;
                break;
            case 'high':
                this.settings.brightness = 2.0;
                this.settings.contrast = 1.5;
                this.settings.noiseReduction = true;
                this.settings.sharpening = true;
                break;
        }
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
     * Check if night vision is active
     */
    isActive() {
        return this.isEnabled;
    }
}

// Initialize night vision module
window.nightVision = new NightVisionModule();
