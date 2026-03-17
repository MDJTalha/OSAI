/**
 * Weather Detection Module
 * Analyze environmental conditions from camera
 * - Weather condition detection
 * - Lighting analysis
 * - Atmospheric conditions
 * - Environmental insights
 */

class WeatherDetectionModule {
    constructor() {
        this.conditions = {
            sunny: { name: 'Sunny', icon: '☀️', confidence: 0 },
            cloudy: { name: 'Cloudy', icon: '☁️', confidence: 0 },
            overcast: { name: 'Overcast', icon: '🌥️', confidence: 0 },
            rainy: { name: 'Rainy', icon: '🌧️', confidence: 0 },
            snowy: { name: 'Snowy', icon: '❄️', confidence: 0 },
            foggy: { name: 'Foggy', icon: '🌫️', confidence: 0 },
            night: { name: 'Night', icon: '🌙', confidence: 0 },
            indoor: { name: 'Indoor', icon: '🏠', confidence: 0 }
        };
        
        this.lastWeather = null;
        this.settings = {
            brightnessThresholds: {
                night: 50,
                dim: 100,
                normal: 200,
                bright: 255
            }
        };

        this.init();
    }

    async init() {
        console.log('[WeatherDetection] Module initialized');
    }

    /**
     * Detect weather conditions
     */
    async detectWeather() {
        const canvas = window.robustCamera?.captureFrame() || 
                       window.cameraModule?.captureFrame();
        
        if (!canvas) return null;

        const analysis = this.analyzeConditions(canvas);
        this.lastWeather = analysis;
        
        return analysis;
    }

    /**
     * Analyze environmental conditions
     */
    analyzeConditions(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze multiple factors
        const brightness = this.analyzeBrightness(data);
        const colorTemp = this.analyzeColorTemperature(data);
        const contrast = this.analyzeContrast(data);
        const blueSky = this.detectBlueSky(data);
        const grayness = this.analyzeGrayness(data);
        
        // Determine weather condition
        const condition = this.determineCondition({
            brightness,
            colorTemp,
            contrast,
            blueSky,
            grayness
        });
        
        return {
            condition: condition,
            brightness: brightness,
            colorTemperature: colorTemp,
            contrast: contrast,
            visibility: this.estimateVisibility(contrast, grayness),
            confidence: this.calculateConfidence(condition),
            timestamp: Date.now()
        };
    }

    /**
     * Analyze brightness
     */
    analyzeBrightness(data) {
        let sum = 0;
        const sampleSize = Math.min(data.length / 4, 10000);
        const step = Math.floor((data.length / 4) / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step * 4;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            sum += brightness;
        }
        
        const avg = sum / sampleSize;
        
        let level = 'normal';
        if (avg < this.settings.brightnessThresholds.night) level = 'night';
        else if (avg < this.settings.brightnessThresholds.dim) level = 'dim';
        else if (avg > this.settings.brightnessThresholds.bright) level = 'bright';
        
        return {
            average: Math.round(avg),
            level: level,
            isDaytime: avg > this.settings.brightnessThresholds.dim
        };
    }

    /**
     * Analyze color temperature
     */
    analyzeColorTemperature(data) {
        let rSum = 0, gSum = 0, bSum = 0;
        const sampleSize = Math.min(data.length / 4, 10000);
        const step = Math.floor((data.length / 4) / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
        }
        
        const total = rSum + gSum + bSum;
        const rPct = rSum / total;
        const gPct = gSum / total;
        const bPct = bSum / total;
        
        let temp = 'neutral';
        if (rPct > 0.4) temp = 'warm';
        else if (bPct > 0.4) temp = 'cool';
        else if (rPct > bPct) temp = 'slightly_warm';
        else if (bPct > rPct) temp = 'slightly_cool';
        
        return {
            temperature: temp,
            red: Math.round(rPct * 100),
            green: Math.round(gPct * 100),
            blue: Math.round(bPct * 100)
        };
    }

    /**
     * Analyze contrast
     */
    analyzeContrast(data) {
        let min = 255, max = 0;
        const sampleSize = Math.min(data.length / 4, 10000);
        const step = Math.floor((data.length / 4) / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step * 4;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            min = Math.min(min, brightness);
            max = Math.max(max, brightness);
        }
        
        const range = max - min;
        let contrast = 'normal';
        
        if (range < 50) contrast = 'low';
        else if (range > 150) contrast = 'high';
        
        return {
            range: Math.round(range),
            level: contrast,
            min: Math.round(min),
            max: Math.round(max)
        };
    }

    /**
     * Detect blue sky
     */
    detectBlueSky(data) {
        let bluePixels = 0;
        let lightBluePixels = 0;
        const sampleSize = Math.min(data.length / 4, 10000);
        const step = Math.floor((data.length / 4) / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Check for blue sky colors
            if (b > r + 50 && b > g + 20) {
                bluePixels++;
                if (b > 150 && b > r + 80) {
                    lightBluePixels++;
                }
            }
        }
        
        const bluePct = (bluePixels / sampleSize) * 100;
        const lightBluePct = (lightBluePixels / sampleSize) * 100;
        
        return {
            percentage: Math.round(bluePct),
            lightBluePercentage: Math.round(lightBluePct),
            isClearSky: bluePct > 30 && lightBluePct > 15
        };
    }

    /**
     * Analyze grayness (clouds/fog)
     */
    analyzeGrayness(data) {
        let grayPixels = 0;
        const sampleSize = Math.min(data.length / 4, 10000);
        const step = Math.floor((data.length / 4) / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
            const idx = i * step * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Check for gray (similar RGB values)
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            if (maxDiff < 30) {
                grayPixels++;
            }
        }
        
        const grayPct = (grayPixels / sampleSize) * 100;
        
        return {
            percentage: Math.round(grayPct),
            isOvercast: grayPct > 50
        };
    }

    /**
     * Determine weather condition
     */
    determineCondition(analysis) {
        const { brightness, colorTemp, contrast, blueSky, grayness } = analysis;
        
        // Night detection
        if (brightness.level === 'night') {
            return 'night';
        }
        
        // Indoor detection
        if (contrast.level === 'low' && brightness.level === 'dim') {
            return 'indoor';
        }
        
        // Clear sky
        if (blueSky.isClearSky && grayness.percentage < 20) {
            return 'sunny';
        }
        
        // Overcast
        if (grayness.isOvercast && blueSky.percentage < 10) {
            return 'overcast';
        }
        
        // Cloudy
        if (grayness.percentage > 30 && blueSky.percentage > 10) {
            return 'cloudy';
        }
        
        // Rain/Fog detection (would need more sophisticated analysis)
        if (grayness.percentage > 60 && contrast.level === 'low') {
            return brightness.average > 150 ? 'foggy' : 'rainy';
        }
        
        // Default
        return brightness.level === 'bright' ? 'sunny' : 'cloudy';
    }

    /**
     * Estimate visibility
     */
    estimateVisibility(contrast, grayness) {
        if (contrast.level === 'high' && grayness.percentage < 20) {
            return { distance: 'excellent', km: '>10' };
        } else if (contrast.level === 'normal' && grayness.percentage < 40) {
            return { distance: 'good', km: '5-10' };
        } else if (grayness.percentage < 60) {
            return { distance: 'moderate', km: '2-5' };
        } else {
            return { distance: 'poor', km: '<2' };
        }
    }

    /**
     * Calculate confidence
     */
    calculateConfidence(condition) {
        // Higher confidence for clear conditions
        const confidenceMap = {
            sunny: 0.9,
            night: 0.95,
            indoor: 0.8,
            cloudy: 0.75,
            overcast: 0.8,
            rainy: 0.6,
            snowy: 0.6,
            foggy: 0.65
        };
        
        return confidenceMap[condition] || 0.5;
    }

    /**
     * Get last weather reading
     */
    getLastWeather() {
        return this.lastWeather;
    }

    /**
     * Get condition icon
     */
    getConditionIcon(condition) {
        return this.conditions[condition]?.icon || '❓';
    }

    /**
     * Get condition name
     */
    getConditionName(condition) {
        return this.conditions[condition]?.name || 'Unknown';
    }
}

// Initialize weather detection module
window.weatherDetection = new WeatherDetectionModule();
