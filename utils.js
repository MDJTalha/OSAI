/**
 * Utility Functions
 * Common helpers for MeasureCount Pro
 */

const Utils = {
    /**
     * Format a date to locale string
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted date string
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Relative time string
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },

    /**
     * Convert between units
     * @param {number} value - Value in cm
     * @param {string} toUnit - Target unit
     * @returns {number} Converted value
     */
    convertUnit(value, toUnit) {
        const conversions = {
            cm: 1,
            mm: 10,
            in: 0.393701,
            ft: 0.0328084
        };
        return value * (conversions[toUnit] || 1);
    },

    /**
     * Get unit symbol
     * @param {string} unit - Unit name
     * @returns {string} Unit symbol
     */
    getUnitSymbol(unit) {
        const symbols = {
            cm: 'cm',
            mm: 'mm',
            in: 'in',
            ft: 'ft'
        };
        return symbols[unit] || unit;
    },

    /**
     * Get area unit symbol
     * @param {string} unit - Base unit
     * @returns {string} Area unit symbol
     */
    getAreaUnitSymbol(unit) {
        const symbols = {
            cm: 'cm²',
            mm: 'mm²',
            in: 'in²',
            ft: 'ft²'
        };
        return symbols[unit] || 'cm²';
    },

    /**
     * Round to specified precision
     * @param {number} value - Value to round
     * @param {number} precision - Decimal places
     * @returns {number} Rounded value
     */
    roundToPrecision(value, precision) {
        const multiplier = Math.pow(10, precision);
        return Math.round(value * multiplier) / multiplier;
    },

    /**
     * Format number with locale
     * @param {number} value - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(value) {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 2
        });
    },

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return `mc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Download file
     * @param {Blob} blob - File content
     * @param {string} filename - File name
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    },

    /**
     * Check if device is mobile
     * @returns {boolean} Is mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Check if PWA is installed
     * @returns {boolean} Is installed
     */
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    },

    /**
     * Get battery status
     * @returns {Promise<Object>} Battery info
     */
    async getBatteryStatus() {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            return {
                level: battery.level,
                charging: battery.charging
            };
        }
        return null;
    },

    /**
     * Vibrate device (haptic feedback)
     * @param {number|Array} pattern - Vibration pattern
     */
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    /**
     * Request wake lock (keep screen on)
     * @returns {Promise<Object>} Wake lock sentinel
     */
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                return await navigator.wakeLock.request('screen');
            } catch (error) {
                console.error('Wake Lock error:', error);
            }
        }
        return null;
    },

    /**
     * Calculate statistics
     * @param {Array<number>} values - Array of numbers
     * @returns {Object} Statistics object
     */
    calculateStats(values) {
        if (values.length === 0) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { sum, avg, min, max, count: values.length };
    },

    /**
     * Parse CSS color to RGB
     * @param {string} color - CSS color string
     * @returns {Object} RGB values
     */
    parseColor(color) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        const rgb = ctx.fillStyle;
        const match = rgb.match(/\d+/g);
        
        if (match) {
            return {
                r: parseInt(match[0]),
                g: parseInt(match[1]),
                b: parseInt(match[2])
            };
        }
        return { r: 0, g: 0, b: 0 };
    },

    /**
     * Check if element is in viewport
     * @param {Element} element - DOM element
     * @returns {boolean} Is visible
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     * @param {Element} element - Target element
     */
    scrollToElement(element) {
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    /**
     * Group array by key
     * @param {Array} array - Array to group
     * @param {string|Function} key - Key or key function
     * @returns {Object} Grouped object
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            (result[groupKey] = result[groupKey] || []).push(item);
            return result;
        }, {});
    },

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} Is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Get storage quota info
     * @returns {Promise<Object>} Storage info
     */
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: (estimate.usage / 1024 / 1024).toFixed(2),
                quota: (estimate.quota / 1024 / 1024).toFixed(2),
                percent: ((estimate.usage / estimate.quota) * 100).toFixed(1)
            };
        }
        return null;
    }
};

// Make Utils globally available
window.utils = Utils;
