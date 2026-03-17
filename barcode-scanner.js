/**
 * Barcode & QR Code Scanner Module
 * Scan and decode various barcode and QR code formats
 * - QR Code detection
 * - Barcode detection (EAN, UPC, Code128, etc.)
 * - Batch scanning
 * - Result history
 */

class BarcodeQRScanner {
    constructor() {
        this.jsQR = null;
        this.isScanning = false;
        this.scanHistory = [];
        this.supportedFormats = [
            'QR Code',
            'EAN-13',
            'EAN-8',
            'UPC-A',
            'UPC-E',
            'Code 128',
            'Code 39',
            'Code 93',
            'ITF',
            'Codabar'
        ];
        this.settings = {
            continuous: false,
            beepOnScan: true,
            vibrateOnScan: true
        };

        this.init();
    }

    async init() {
        // Load jsQR library dynamically if not available
        if (typeof jsQR === 'undefined') {
            await this.loadJsQR();
        }
        console.log('[BarcodeQR] Module initialized');
    }

    /**
     * Load jsQR library from CDN
     */
    async loadJsQR() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            script.onload = () => {
                this.jsQR = window.jsQR;
                console.log('[BarcodeQR] jsQR loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('[BarcodeQR] Failed to load jsQR');
                reject(new Error('Failed to load jsQR library'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Start scanning for barcodes/QR codes
     */
    async startScanning() {
        if (this.isScanning) return false;

        this.isScanning = true;
        console.log('[BarcodeQR] Scanning started');

        this.scanLoop();
        return true;
    }

    /**
     * Stop scanning
     */
    stopScanning() {
        this.isScanning = false;
        console.log('[BarcodeQR] Scanning stopped');
    }

    /**
     * Continuous scan loop
     */
    async scanLoop() {
        if (!this.isScanning) return;

        try {
            const result = await this.scanFrame();
            
            if (result) {
                this.handleScanResult(result);
                
                if (!this.settings.continuous) {
                    this.stopScanning();
                }
            }
        } catch (error) {
            console.error('[BarcodeQR] Scan error:', error);
        }

        if (this.isScanning) {
            requestAnimationFrame(() => this.scanLoop());
        }
    }

    /**
     * Scan single frame
     */
    async scanFrame() {
        const canvas = window.cameraModule?.captureFrame();
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Use jsQR for QR code detection
        if (this.jsQR) {
            const qrCode = this.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (qrCode) {
                return {
                    type: 'QR Code',
                    data: qrCode.data,
                    corners: qrCode.location,
                    confidence: 0.95,
                    timestamp: Date.now()
                };
            }
        }

        // Fallback: Use barcode detection API if available
        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39']
                });

                const barcodes = await barcodeDetector.detect(imageData);
                
                if (barcodes.length > 0) {
                    return {
                        type: barcodes[0].format,
                        data: barcodes[0].rawValue,
                        corners: barcodes[0].cornerPoints,
                        confidence: barcodes[0].confidence || 0.8,
                        timestamp: Date.now()
                    };
                }
            } catch (error) {
                console.log('[BarcodeQR] BarcodeDetector not available');
            }
        }

        return null;
    }

    /**
     * Handle scan result
     */
    handleScanResult(result) {
        console.log('[BarcodeQR] Scanned:', result);

        // Add to history
        this.scanHistory.push(result);
        if (this.scanHistory.length > 100) {
            this.scanHistory.shift();
        }

        // Feedback
        if (this.settings.beepOnScan) {
            this.playBeep();
        }

        if (this.settings.vibrateOnScan && navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Notify app
        if (window.app) {
            window.app.displayBarcodeResults(result);
        }
    }

    /**
     * Play beep sound
     */
    playBeep() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    /**
     * Scan from image file
     */
    async scanFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Try QR detection
                    if (this.jsQR) {
                        const qrCode = this.jsQR(imageData.data, imageData.width, imageData.height);
                        if (qrCode) {
                            resolve({
                                type: 'QR Code',
                                data: qrCode.data,
                                corners: qrCode.location,
                                confidence: 0.95,
                                source: 'file'
                            });
                            return;
                        }
                    }

                    // Try BarcodeDetector
                    if ('BarcodeDetector' in window) {
                        try {
                            const barcodeDetector = new BarcodeDetector();
                            const barcodes = await barcodeDetector.detect(imageData);
                            if (barcodes.length > 0) {
                                resolve({
                                    type: barcodes[0].format,
                                    data: barcodes[0].rawValue,
                                    corners: barcodes[0].cornerPoints,
                                    confidence: barcodes[0].confidence || 0.8,
                                    source: 'file'
                                });
                                return;
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }

                    resolve(null);
                };
                img.src = event.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Batch scan multiple codes
     */
    async batchScan(imageData) {
        const results = [];
        
        if ('BarcodeDetector' in window) {
            try {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'itf', 'codabar']
                });

                const barcodes = await barcodeDetector.detect(imageData);
                
                barcodes.forEach(barcode => {
                    results.push({
                        type: barcode.format,
                        data: barcode.rawValue,
                        corners: barcode.cornerPoints,
                        confidence: barcode.confidence || 0.8,
                        timestamp: Date.now()
                    });
                });
            } catch (error) {
                console.error('[BarcodeQR] Batch scan error:', error);
            }
        }

        return results;
    }

    /**
     * Get scan history
     */
    getHistory(limit = 10) {
        return this.scanHistory.slice(-limit);
    }

    /**
     * Clear scan history
     */
    clearHistory() {
        this.scanHistory = [];
    }

    /**
     * Export scan history
     */
    exportHistory(format = 'json') {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(this.scanHistory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barcode-scan-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return this.scanHistory;
    }

    /**
     * Get supported formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
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
}

// Initialize barcode/QR scanner module
window.barcodeQRScanner = new BarcodeQRScanner();
