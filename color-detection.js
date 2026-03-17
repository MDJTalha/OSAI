/**
 * Color Detection Module
 * Advanced color analysis and identification
 * - Color spectrum analysis
 * - Color name identification
 * - Color palette extraction
 * - Color matching
 */

class ColorDetectionModule {
    constructor() {
        this.colorNames = this.initializeColorDatabase();
        this.lastColors = [];
        this.settings = {
            maxColors: 10,
            minSaturation: 0.1,
            minBrightness: 0.1
        };

        this.init();
    }

    async init() {
        console.log('[ColorDetection] Module initialized');
    }

    /**
     * Initialize color database
     */
    initializeColorDatabase() {
        return {
            // Reds
            '#FF0000': 'Red',
            '#DC143C': 'Crimson',
            '#8B0000': 'Dark Red',
            '#FF6347': 'Tomato',
            '#FF4500': 'Orange Red',
            
            // Blues
            '#0000FF': 'Blue',
            '#000080': 'Navy',
            '#00BFFF': 'Deep Sky Blue',
            '#1E90FF': 'Dodger Blue',
            '#4169E1': 'Royal Blue',
            '#87CEEB': 'Sky Blue',
            
            // Greens
            '#008000': 'Green',
            '#00FF00': 'Lime',
            '#32CD32': 'Lime Green',
            '#228B22': 'Forest Green',
            '#006400': 'Dark Green',
            '#7FFFD4': 'Aquamarine',
            
            // Yellows
            '#FFFF00': 'Yellow',
            '#FFD700': 'Gold',
            '#FFA500': 'Orange',
            '#FF8C00': 'Dark Orange',
            '#F0E68C': 'Khaki',
            
            // Purples
            '#800080': 'Purple',
            '#9370DB': 'Medium Purple',
            '#8A2BE2': 'Blue Violet',
            '#9400D3': 'Dark Violet',
            '#DDA0DD': 'Plum',
            
            // Pinks
            '#FFC0CB': 'Pink',
            '#FF69B4': 'Hot Pink',
            '#FF1493': 'Deep Pink',
            '#DB7093': 'Pale Violet Red',
            
            // Cyans
            '#00FFFF': 'Cyan',
            '#00CED1': 'Dark Turquoise',
            '#20B2AA': 'Light Sea Green',
            '#48D1CC': 'Medium Turquoise',
            
            // Grays
            '#808080': 'Gray',
            '#A9A9A9': 'Dark Gray',
            '#D3D3D3': 'Light Gray',
            '#DCDCDC': 'Gainsboro',
            '#F5F5F5': 'White Smoke',
            
            // Browns
            '#A52A2A': 'Brown',
            '#8B4513': 'Saddle Brown',
            '#D2691E': 'Chocolate',
            '#DEB887': 'Burlywood',
            '#F5DEB3': 'Wheat',
            
            // Blacks
            '#000000': 'Black',
            '#2F4F4F': 'Dark Slate Gray',
            '#696969': 'Dim Gray',
            '#778899': 'Light Slate Gray'
        };
    }

    /**
     * Detect dominant colors in frame
     */
    async detectColors() {
        const canvas = window.robustCamera?.captureFrame() || 
                       window.cameraModule?.captureFrame();
        
        if (!canvas) return [];

        const colors = this.extractDominantColors(canvas);
        this.lastColors = colors;
        
        return colors;
    }

    /**
     * Extract dominant colors from canvas
     */
    extractDominantColors(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample colors (every 10th pixel for performance)
        const colorMap = new Map();
        const sampleRate = 10;
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Quantize colors (reduce to nearest 32 for grouping)
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            
            const key = `${qr},${qg},${qb}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Sort by frequency
        const sorted = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.settings.maxColors);
        
        // Convert to color objects
        return sorted.map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number);
            const hex = this.rgbToHex(r, g, b);
            const hsl = this.rgbToHsl(r, g, b);
            
            return {
                rgb: { r, g, b },
                hex: hex,
                hsl: hsl,
                name: this.getColorName(hex),
                percentage: Math.round((count / (canvas.width * canvas.height / sampleRate)) * 100),
                brightness: this.calculateBrightness(r, g, b)
            };
        });
    }

    /**
     * Get color name from hex
     */
    getColorName(hex) {
        // Exact match
        if (this.colorNames[hex]) {
            return this.colorNames[hex];
        }
        
        // Find closest color
        let minDistance = Infinity;
        let closestName = 'Unknown';
        
        for (const [knownHex, name] of Object.entries(this.colorNames)) {
            const distance = this.colorDistance(hex, knownHex);
            if (distance < minDistance) {
                minDistance = distance;
                closestName = name;
            }
        }
        
        return closestName;
    }

    /**
     * Calculate color distance
     */
    colorDistance(hex1, hex2) {
        const r1 = parseInt(hex1.slice(1, 3), 16);
        const g1 = parseInt(hex1.slice(3, 5), 16);
        const b1 = parseInt(hex1.slice(5, 7), 16);
        
        const r2 = parseInt(hex2.slice(1, 3), 16);
        const g2 = parseInt(hex2.slice(3, 5), 16);
        const b2 = parseInt(hex2.slice(5, 7), 16);
        
        return Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );
    }

    /**
     * RGB to Hex
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    /**
     * RGB to HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Calculate brightness
     */
    calculateBrightness(r, g, b) {
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    /**
     * Get color temperature
     */
    getColorTemperature(colors) {
        if (colors.length === 0) return 'neutral';
        
        const avgHue = colors.reduce((sum, c) => sum + c.hsl.h, 0) / colors.length;
        
        if (avgHue < 60) return 'warm';      // Reds, oranges, yellows
        if (avgHue < 180) return 'neutral';  // Greens, cyans
        return 'cool';                        // Blues, purples
    }

    /**
     * Get color harmony
     */
    getColorHarmony(colors) {
        if (colors.length < 2) return 'monochrome';
        
        const hues = colors.map(c => c.hsl.h);
        const hueRange = Math.max(...hues) - Math.min(...hues);
        
        if (hueRange < 30) return 'monochrome';
        if (hueRange < 90) return 'analogous';
        if (hueRange > 150 && hueRange < 210) return 'complementary';
        return 'polychromatic';
    }

    /**
     * Get last detected colors
     */
    getLastColors() {
        return this.lastColors;
    }

    /**
     * Clear color history
     */
    clearHistory() {
        this.lastColors = [];
    }
}

// Initialize color detection module
window.colorDetection = new ColorDetectionModule();
