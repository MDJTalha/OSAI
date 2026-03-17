/**
 * Intelligent Auto-Detection System
 * Smart autonomous AI that automatically detects and responds
 * 
 * Features:
 * - Auto facial expression detection
 * - Auto voice recognition & understanding
 * - Auto barcode/QR scanning
 * - Auto text/OCR detection
 * - Smart surveillance mode
 * - Engineering support analysis
 * - Industry-ready deployment
 * 
 * No buttons needed - AI works autonomously
 */

class IntelligentAutoDetection {
    constructor() {
        this.isActive = false;
        this.autoMode = true;
        this.detectionQueue = [];
        this.processing = false;
        this.lastDetection = {};
        this.surveillanceMode = false;
        this.engineeringMode = false;
        
        // Auto-detection settings
        this.settings = {
            faceExpression: true,
            voiceRecognition: true,
            barcodeQR: true,
            textOCR: true,
            objectTracking: true,
            anomalyDetection: true,
            surveillanceMode: false,
            engineeringSupport: false
        };
        
        // Multi-language voice support
        this.supportedLanguages = [
            'en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN',
            'ja-JP', 'hi-IN', 'pt-BR', 'ru-RU', 'ar-SA'
        ];
        
        this.init();
    }

    async init() {
        console.log('[IntelligentAutoDetection] Initializing autonomous system...');
        
        // Start autonomous detection loop
        this.startAutonomousLoop();
        
        // Setup voice recognition
        if (this.settings.voiceRecognition) {
            this.initVoiceRecognition();
        }
        
        // Setup facial expression detection
        if (this.settings.faceExpression) {
            this.initFaceExpressionDetection();
        }
        
        console.log('[IntelligentAutoDetection] ✓ Autonomous system active');
        this.isActive = true;
    }

    /**
     * Start autonomous detection loop
     */
    startAutonomousLoop() {
        const detect = async () => {
            if (!this.isActive) return;
            
            try {
                await this.autonomousDetectionCycle();
            } catch (error) {
                console.error('[AutoDetection] Cycle error:', error);
            }
            
            // Continue autonomous operation
            setTimeout(detect, 1000); // Run every second
        };
        
        detect();
        console.log('[IntelligentAutoDetection] Autonomous loop started');
    }

    /**
     * Autonomous detection cycle
     */
    async autonomousDetectionCycle() {
        if (this.processing) return;
        
        this.processing = true;
        
        try {
            // Get current frame
            const canvas = this.captureFrame();
            if (!canvas) return;
            
            // Run all auto-detections in parallel
            const promises = [];
            
            if (this.settings.faceExpression) {
                promises.push(this.detectFacialExpressions(canvas));
            }
            
            if (this.settings.barcodeQR) {
                promises.push(this.scanBarcodeQR(canvas));
            }
            
            if (this.settings.textOCR) {
                promises.push(this.detectTextOCR(canvas));
            }
            
            if (this.settings.objectTracking) {
                promises.push(this.trackObjects(canvas));
            }
            
            if (this.settings.anomalyDetection) {
                promises.push(this.detectAnomalies(canvas));
            }
            
            // Process all detections
            const results = await Promise.all(promises);
            
            // Process significant findings
            results.forEach(result => {
                if (result && result.significant) {
                    this.handleSignificantDetection(result);
                }
            });
            
        } catch (error) {
            console.error('[AutoDetection] Processing error:', error);
        } finally {
            this.processing = false;
        }
    }

    /**
     * Capture current frame
     */
    captureFrame() {
        return window.fixedCamera?.captureFrame();
    }

    /**
     * Detect facial expressions automatically
     */
    async detectFacialExpressions(canvas) {
        try {
            if (!window.facialExpression) return null;
            
            const expressions = await window.facialExpression.detectExpressions(canvas);
            
            if (expressions && expressions.length > 0) {
                const dominant = expressions[0];
                
                // Check if expression changed
                if (this.lastDetection.expression !== dominant.emotion) {
                    this.lastDetection.expression = dominant.emotion;
                    
                    return {
                        type: 'facial_expression',
                        significant: true,
                        data: dominant,
                        message: `Detected ${dominant.emotion} expression (${Math.round(dominant.confidence * 100)}% confidence)`
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('[AutoDetection] Face expression error:', error);
            return null;
        }
    }

    /**
     * Auto scan barcode/QR codes
     */
    async scanBarcodeQR(canvas) {
        try {
            if (!window.barcodeScanner) return null;
            
            const result = await window.barcodeScanner.scan(canvas);
            
            if (result && result.length > 0) {
                const code = result[0];
                
                // Check if new code detected
                if (this.lastDetection.barcode !== code.rawValue) {
                    this.lastDetection.barcode = code.rawValue;
                    
                    return {
                        type: 'barcode_qr',
                        significant: true,
                        data: code,
                        message: `Scanned ${code.format}: ${code.rawValue}`
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('[AutoDetection] Barcode error:', error);
            return null;
        }
    }

    /**
     * Auto detect text/OCR
     */
    async detectTextOCR(canvas) {
        try {
            if (!window.ocrModule) return null;
            
            const result = await window.ocrModule.recognize(canvas);
            
            if (result && result.text && result.text.trim().length > 0) {
                // Check if text changed
                if (this.lastDetection.text !== result.text.substring(0, 50)) {
                    this.lastDetection.text = result.text.substring(0, 50);
                    
                    return {
                        type: 'text_ocr',
                        significant: true,
                        data: result,
                        message: `Detected text: "${result.text.substring(0, 50)}${result.text.length > 50 ? '...' : ''}"`
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('[AutoDetection] OCR error:', error);
            return null;
        }
    }

    /**
     * Auto track objects
     */
    async trackObjects(canvas) {
        try {
            if (!window.comprehensiveDetection) return null;
            
            const detections = await window.comprehensiveDetection.analyzeItems(canvas);
            
            if (detections && detections.length > 0) {
                // Check for significant changes
                const newObjects = detections.filter(d => 
                    !this.lastDetection.objects?.includes(d.class)
                );
                
                if (newObjects.length > 0) {
                    this.lastDetection.objects = detections.map(d => d.class);
                    
                    return {
                        type: 'object_tracking',
                        significant: newObjects.length > 2,
                        data: detections,
                        message: `Detected ${detections.length} objects: ${detections.map(d => d.class).join(', ')}`
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('[AutoDetection] Object tracking error:', error);
            return null;
        }
    }

    /**
     * Detect anomalies (surveillance mode)
     */
    async detectAnomalies(canvas) {
        if (!this.settings.surveillanceMode) return null;
        
        try {
            // Check for unusual activity
            const detections = await window.comprehensiveDetection?.analyzeItems(canvas);
            
            if (detections) {
                // Count people
                const peopleCount = detections.filter(d => d.class === 'person').length;
                
                // Detect unusual crowd
                if (peopleCount > 10) {
                    return {
                        type: 'anomaly',
                        significant: true,
                        data: { peopleCount, type: 'crowd' },
                        message: `Alert: Large crowd detected (${peopleCount} people)`
                    };
                }
                
                // Detect unusual objects
                const unusualObjects = ['knife', 'scissors', 'baseball bat'];
                const foundUnusual = detections.filter(d => 
                    unusualObjects.includes(d.class.toLowerCase())
                );
                
                if (foundUnusual.length > 0) {
                    return {
                        type: 'anomaly',
                        significant: true,
                        data: { objects: foundUnusual, type: 'potential_threat' },
                        message: `Alert: Unusual objects detected: ${foundUnusual.map(o => o.class).join(', ')}`
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('[AutoDetection] Anomaly error:', error);
            return null;
        }
    }

    /**
     * Handle significant detections
     */
    handleSignificantDetection(result) {
        console.log('[AutoDetection] Significant:', result.message);
        
        // Show notification
        if (window.app?.showToast) {
            window.app.showToast(result.message, 'info');
        }
        
        // Announce for accessibility
        if (window.accessibility) {
            window.accessibility.announce(result.message);
        }
        
        // Log for surveillance
        if (this.settings.surveillanceMode) {
            this.logSurveillanceEvent(result);
        }
        
        // Trigger engineering analysis
        if (this.settings.engineeringSupport) {
            this.triggerEngineeringAnalysis(result);
        }
    }

    /**
     * Initialize voice recognition
     */
    initVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('[AutoDetection] Voice recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = this.detectUserLanguage();
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this.processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('[AutoDetection] Voice recognition error:', event.error);
        };
        
        recognition.start();
        console.log('[AutoDetection] Voice recognition active');
    }

    /**
     * Detect user's language
     */
    detectUserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        
        const langMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'hi': 'hi-IN',
            'pt': 'pt-BR',
            'ru': 'ru-RU',
            'ar': 'ar-SA'
        };
        
        return langMap[langCode] || 'en-US';
    }

    /**
     * Process voice commands
     */
    processVoiceCommand(transcript) {
        const command = transcript.toLowerCase().trim();
        
        console.log('[AutoDetection] Voice command:', command);
        
        // Auto-execute commands
        if (command.includes('detect') || command.includes('what do you see')) {
            window.app?.detectItems();
        } else if (command.includes('measure')) {
            window.app?.startMeasurement();
        } else if (command.includes('scan')) {
            window.app?.startScan();
        } else if (command.includes('read') || command.includes('text')) {
            window.app?.startOCR();
        } else if (command.includes('help')) {
            window.app?.showToast('How can I help you?', 'info');
        }
    }

    /**
     * Initialize facial expression detection
     */
    initFaceExpressionDetection() {
        console.log('[AutoDetection] Facial expression detection active');
        // Continuous detection handled by autonomous loop
    }

    /**
     * Log surveillance event
     */
    logSurveillanceEvent(event) {
        const log = {
            timestamp: Date.now(),
            type: event.type,
            data: event.data,
            message: event.message
        };
        
        // Store in localStorage
        const logs = JSON.parse(localStorage.getItem('osai_surveillance_logs') || '[]');
        logs.push(log);
        
        // Keep last 1000 events
        if (logs.length > 1000) logs.shift();
        
        localStorage.setItem('osai_surveillance_logs', JSON.stringify(logs));
    }

    /**
     * Trigger engineering analysis
     */
    triggerEngineeringAnalysis(detection) {
        // Analyze for engineering insights
        const analysis = {
            timestamp: Date.now(),
            detection,
            recommendations: this.generateEngineeringRecommendations(detection)
        };
        
        console.log('[Engineering Support] Analysis:', analysis);
    }

    /**
     * Generate engineering recommendations
     */
    generateEngineeringRecommendations(detection) {
        const recommendations = [];
        
        if (detection.type === 'object_tracking') {
            recommendations.push({
                type: 'measurement',
                text: 'Consider measuring detected objects for engineering analysis'
            });
        }
        
        if (detection.type === 'text_ocr') {
            recommendations.push({
                type: 'documentation',
                text: 'Extracted text can be used for technical documentation'
            });
        }
        
        return recommendations;
    }

    /**
     * Enable surveillance mode
     */
    enableSurveillanceMode() {
        this.settings.surveillanceMode = true;
        this.settings.anomalyDetection = true;
        console.log('[AutoDetection] Surveillance mode enabled');
        if (window.app?.showToast) {
            window.app.showToast('Surveillance mode active', 'info');
        }
    }

    /**
     * Enable engineering support mode
     */
    enableEngineeringMode() {
        this.settings.engineeringSupport = true;
        this.settings.objectTracking = true;
        this.settings.textOCR = true;
        console.log('[AutoDetection] Engineering support mode enabled');
        if (window.app?.showToast) {
            window.app.showToast('Engineering support active', 'info');
        }
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            autoMode: this.autoMode,
            settings: this.settings,
            lastDetection: this.lastDetection,
            surveillanceMode: this.settings.surveillanceMode,
            engineeringMode: this.settings.engineeringSupport,
            language: this.detectUserLanguage()
        };
    }
}

// Initialize global intelligent auto-detection
window.intelligentAutoDetection = new IntelligentAutoDetection();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentAutoDetection;
}
