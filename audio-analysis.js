/**
 * Audio Analysis Module
 * Listen to and understand sounds
 * - Sound detection
 * - Audio classification
 * - Voice activity detection
 * - Environmental sound recognition
 */

class AudioAnalysisModule {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isListening = false;
        this.soundClasses = {
            speech: { minFreq: 85, maxFreq: 255, threshold: 0.3 },
            music: { minFreq: 20, maxFreq: 20000, threshold: 0.2 },
            noise: { minFreq: 100, maxFreq: 8000, threshold: 0.4 },
            alert: { minFreq: 500, maxFreq: 4000, threshold: 0.5 },
            glass_break: { minFreq: 2000, maxFreq: 8000, threshold: 0.6 },
            dog_bark: { minFreq: 100, maxFreq: 2000, threshold: 0.5 },
            vehicle: { minFreq: 50, maxFreq: 500, threshold: 0.4 }
        };
        this.soundHistory = [];
        this.settings = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            detectionThreshold: 0.3
        };

        this.init();
    }

    async init() {
        console.log('[AudioAnalysis] Module initialized');
    }

    /**
     * Start audio analysis
     */
    async startListening() {
        if (this.isListening) return true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = this.settings.fftSize;
            this.analyser.smoothingTimeConstant = this.settings.smoothingTimeConstant;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            this.isListening = true;
            console.log('[AudioAnalysis] Listening started');
            
            return true;
        } catch (error) {
            console.error('[AudioAnalysis] Failed to start:', error);
            return false;
        }
    }

    /**
     * Stop audio analysis
     */
    stopListening() {
        if (this.microphone) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
            this.microphone.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }

        this.isListening = false;
        console.log('[AudioAnalysis] Listening stopped');
    }

    /**
     * Analyze current sound
     */
    analyzeSound() {
        if (!this.isListening || !this.analyser) {
            return null;
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Uint8Array(bufferLength);

        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getByteTimeDomainData(timeDataArray);

        // Calculate features
        const features = {
            rms: this.calculateRMS(timeDataArray),
            zeroCrossingRate: this.calculateZeroCrossingRate(timeDataArray),
            spectralCentroid: this.calculateSpectralCentroid(dataArray),
            spectralRolloff: this.calculateSpectralRolloff(dataArray),
            dominantFrequency: this.calculateDominantFrequency(dataArray)
        };

        // Classify sound
        const classification = this.classifySound(features);

        // Store in history
        this.soundHistory.push({
            timestamp: Date.now(),
            features: features,
            classification: classification
        });

        if (this.soundHistory.length > 100) {
            this.soundHistory.shift();
        }

        return {
            features: features,
            classification: classification,
            timestamp: Date.now()
        };
    }

    /**
     * Calculate Root Mean Square (volume)
     */
    calculateRMS(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128;
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / data.length);
    }

    /**
     * Calculate Zero Crossing Rate
     */
    calculateZeroCrossingRate(data) {
        let crossings = 0;
        for (let i = 1; i < data.length; i++) {
            if ((data[i] >= 128 && data[i-1] < 128) || 
                (data[i] < 128 && data[i-1] >= 128)) {
                crossings++;
            }
        }
        return crossings / data.length;
    }

    /**
     * Calculate Spectral Centroid
     */
    calculateSpectralCentroid(data) {
        let num = 0;
        let den = 0;
        
        for (let i = 0; i < data.length; i++) {
            num += i * data[i];
            den += data[i];
        }
        
        return den > 0 ? num / den : 0;
    }

    /**
     * Calculate Spectral Rolloff
     */
    calculateSpectralRolloff(data) {
        const totalEnergy = data.reduce((a, b) => a + b, 0);
        const threshold = 0.85 * totalEnergy;
        
        let cumulative = 0;
        for (let i = 0; i < data.length; i++) {
            cumulative += data[i];
            if (cumulative >= threshold) {
                return i / data.length;
            }
        }
        
        return 1;
    }

    /**
     * Calculate Dominant Frequency
     */
    calculateDominantFrequency(data) {
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] > maxValue) {
                maxValue = data[i];
                maxIndex = i;
            }
        }
        
        const nyquist = this.audioContext.sampleRate / 2;
        return (maxIndex / data.length) * nyquist;
    }

    /**
     * Classify sound based on features
     */
    classifySound(features) {
        let bestMatch = 'unknown';
        let bestScore = 0;

        for (const [soundClass, params] of Object.entries(this.soundClasses)) {
            const score = this.calculateSoundMatch(features, params);
            
            if (score > bestScore && score > this.settings.detectionThreshold) {
                bestScore = score;
                bestMatch = soundClass;
            }
        }

        return {
            class: bestMatch,
            confidence: bestScore,
            volume: features.rms
        };
    }

    /**
     * Calculate match score for sound class
     */
    calculateSoundMatch(features, params) {
        const { dominantFrequency, rms } = features;
        
        // Check if frequency is in range
        const inFrequencyRange = dominantFrequency >= params.minFreq && 
                                  dominantFrequency <= params.maxFreq;
        
        // Check if volume is above threshold
        const aboveThreshold = rms >= params.threshold;

        if (inFrequencyRange && aboveThreshold) {
            return 0.5 + (rms - params.threshold) * 0.5;
        }

        return 0;
    }

    /**
     * Detect specific sound events
     */
    detectSoundEvent(eventType) {
        const analysis = this.analyzeSound();
        
        if (!analysis) return false;

        return analysis.classification.class === eventType && 
               analysis.classification.confidence > 0.6;
    }

    /**
     * Continuous sound monitoring
     */
    startMonitoring(callback) {
        if (!this.isListening) {
            this.startListening();
        }

        const monitor = () => {
            if (!this.isListening) return;

            const analysis = this.analyzeSound();
            
            if (analysis && callback) {
                callback(analysis);
            }

            requestAnimationFrame(monitor);
        };

        monitor();
    }

    /**
     * Get sound history
     */
    getHistory(limit = 10) {
        return this.soundHistory.slice(-limit);
    }

    /**
     * Clear sound history
     */
    clearHistory() {
        this.soundHistory = [];
    }

    /**
     * Get supported sound classes
     */
    getSupportedClasses() {
        return Object.keys(this.soundClasses);
    }

    /**
     * Add custom sound class
     */
    addSoundClass(name, params) {
        this.soundClasses[name] = params;
    }

    /**
     * Export sound analysis
     */
    exportAnalysis(format = 'json') {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(this.soundHistory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio-analysis-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return this.soundHistory;
    }
}

// Initialize audio analysis module
window.audioAnalysis = new AudioAnalysisModule();
