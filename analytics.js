/**
 * Analytics Dashboard Module
 * Track usage, performance, and accuracy metrics
 * - Usage statistics
 * - Performance monitoring
 * - Accuracy tracking
 * - Export capabilities
 */

class AnalyticsModule {
    constructor() {
        this.metrics = {
            sessions: [],
            detections: [],
            measurements: [],
            errors: [],
            performance: []
        };
        
        this.sessionStart = Date.now();
        this.isInitialized = false;
        this.autoTrack = true;
        this.storageKey = 'osai_analytics';
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.loadMetrics();
        this.startSession();
        this.setupAutoTracking();
        
        this.isInitialized = true;
        console.log('[Analytics] Module initialized');
    }

    /**
     * Start new session
     */
    startSession() {
        const session = {
            id: this.generateId(),
            startTime: Date.now(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            online: navigator.onLine
        };
        
        this.metrics.sessions.unshift(session);
        this.limitStorage('sessions', 100);
        
        console.log('[Analytics] Session started:', session.id);
    }

    /**
     * Track detection event
     */
    trackDetection(data) {
        if (!this.autoTrack) return;
        
        const event = {
            timestamp: Date.now(),
            type: 'detection',
            objectsCount: data.objectsCount || 0,
            avgConfidence: data.avgConfidence || 0,
            processingTime: data.processingTime || 0,
            model: data.model || 'unknown'
        };
        
        this.metrics.detections.unshift(event);
        this.limitStorage('detections', 500);
        this.saveMetrics();
    }

    /**
     * Track measurement event
     */
    trackMeasurement(data) {
        if (!this.autoTrack) return;
        
        const event = {
            timestamp: Date.now(),
            type: 'measurement',
            length: data.length,
            width: data.width,
            area: data.area,
            unit: data.unit || 'cm',
            confidence: data.confidence || 0
        };
        
        this.metrics.measurements.unshift(event);
        this.limitStorage('measurements', 200);
        this.saveMetrics();
    }

    /**
     * Track error event
     */
    trackError(data) {
        const event = {
            timestamp: Date.now(),
            type: 'error',
            module: data.module || 'unknown',
            message: data.message,
            severity: data.severity || 'error'
        };
        
        this.metrics.errors.unshift(event);
        this.limitStorage('errors', 100);
        this.saveMetrics();
    }

    /**
     * Track performance metrics
     */
    trackPerformance(data) {
        if (!this.autoTrack) return;
        
        const event = {
            timestamp: Date.now(),
            type: 'performance',
            loadTime: data.loadTime,
            fps: data.fps,
            memoryUsage: data.memoryUsage,
            cpuUsage: data.cpuUsage
        };
        
        this.metrics.performance.unshift(event);
        this.limitStorage('performance', 100);
        this.saveMetrics();
    }

    /**
     * Setup automatic tracking
     */
    setupAutoTracking() {
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // Track online/offline
        window.addEventListener('online', () => {
            this.trackEvent('connectivity', { status: 'online' });
        });
        
        window.addEventListener('offline', () => {
            this.trackEvent('connectivity', { status: 'offline' });
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility', { 
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });

        // Track errors
        if (window.errorBoundary) {
            window.errorBoundary.subscribe((error) => {
                this.trackError({
                    module: 'errorBoundary',
                    message: error.message,
                    severity: 'error'
                });
            });
        }
    }

    /**
     * Track custom event
     */
    trackEvent(category, data = {}) {
        const event = {
            timestamp: Date.now(),
            type: 'custom',
            category,
            ...data
        };
        
        if (!this.metrics[category]) {
            this.metrics[category] = [];
        }
        
        this.metrics[category].unshift(event);
        this.saveMetrics();
    }

    /**
     * End current session
     */
    endSession() {
        const session = this.metrics.sessions[0];
        if (session) {
            session.endTime = Date.now();
            session.duration = session.endTime - session.startTime;
        }
        this.saveMetrics();
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        const now = Date.now();
        const last24h = now - 86400000;
        const last7d = now - 604800000;
        
        return {
            sessions: {
                total: this.metrics.sessions.length,
                last24h: this.metrics.sessions.filter(s => s.startTime > last24h).length,
                last7d: this.metrics.sessions.filter(s => s.startTime > last7d).length,
                avgDuration: this.calculateAvgDuration()
            },
            
            detections: {
                total: this.metrics.detections.length,
                last24h: this.metrics.detections.filter(d => d.timestamp > last24h).length,
                avgObjects: this.calculateAvgObjects(),
                avgConfidence: this.calculateAvgConfidence()
            },
            
            measurements: {
                total: this.metrics.measurements.length,
                last24h: this.metrics.measurements.filter(m => m.timestamp > last24h).length
            },
            
            errors: {
                total: this.metrics.errors.length,
                last24h: this.metrics.errors.filter(e => e.timestamp > last24h).length
            },
            
            performance: {
                avgFPS: this.calculateAvgFPS(),
                avgLoadTime: this.calculateAvgLoadTime()
            }
        };
    }

    /**
     * Calculate average session duration
     */
    calculateAvgDuration() {
        const sessions = this.metrics.sessions.filter(s => s.duration);
        if (sessions.length === 0) return 0;
        
        const total = sessions.reduce((sum, s) => sum + s.duration, 0);
        return Math.round(total / sessions.length);
    }

    /**
     * Calculate average objects detected
     */
    calculateAvgObjects() {
        const detections = this.metrics.detections.filter(d => d.objectsCount);
        if (detections.length === 0) return 0;
        
        const total = detections.reduce((sum, d) => sum + d.objectsCount, 0);
        return Math.round((total / detections.length) * 100) / 100;
    }

    /**
     * Calculate average confidence
     */
    calculateAvgConfidence() {
        const detections = this.metrics.detections.filter(d => d.avgConfidence);
        if (detections.length === 0) return 0;
        
        const total = detections.reduce((sum, d) => sum + d.avgConfidence, 0);
        return Math.round((total / detections.length) * 100) / 100;
    }

    /**
     * Calculate average FPS
     */
    calculateAvgFPS() {
        const performance = this.metrics.performance.filter(p => p.fps);
        if (performance.length === 0) return 0;
        
        const total = performance.reduce((sum, p) => sum + p.fps, 0);
        return Math.round(total / performance.length);
    }

    /**
     * Calculate average load time
     */
    calculateAvgLoadTime() {
        const performance = this.metrics.performance.filter(p => p.loadTime);
        if (performance.length === 0) return 0;
        
        const total = performance.reduce((sum, p) => sum + p.loadTime, 0);
        return Math.round((total / performance.length) * 100) / 100;
    }

    /**
     * Export analytics data
     */
    exportData(format = 'json') {
        if (format === 'json') {
            return this.exportJSON();
        } else if (format === 'csv') {
            return this.exportCSV();
        }
    }

    /**
     * Export as JSON
     */
    exportJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '8.0.0',
            summary: this.getSummary(),
            metrics: this.metrics
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export as CSV
     */
    exportCSV() {
        const rows = [['Type', 'Timestamp', 'Data']];
        
        // Flatten all metrics
        Object.entries(this.metrics).forEach(([type, events]) => {
            events.forEach(event => {
                rows.push([
                    type,
                    new Date(event.timestamp).toISOString(),
                    JSON.stringify(event).replace(/"/g, '""')
                ]);
            });
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }

    /**
     * Download export file
     */
    downloadExport(format = 'json') {
        const data = this.exportData(format);
        const blob = new Blob([data], { 
            type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `osai-analytics-${Date.now()}.${format}`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Load metrics from storage
     */
    loadMetrics() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.metrics = { ...this.metrics, ...parsed };
            }
        } catch (error) {
            console.error('[Analytics] Load error:', error);
        }
    }

    /**
     * Save metrics to storage
     */
    saveMetrics() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
        } catch (error) {
            console.error('[Analytics] Save error:', error);
        }
    }

    /**
     * Limit storage size
     */
    limitStorage(key, max) {
        if (this.metrics[key].length > max) {
            this.metrics[key] = this.metrics[key].slice(0, max);
        }
    }

    /**
     * Clear all analytics data
     */
    clear() {
        this.metrics = {
            sessions: [],
            detections: [],
            measurements: [],
            errors: [],
            performance: []
        };
        localStorage.removeItem(this.storageKey);
        console.log('[Analytics] Data cleared');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get chart data for dashboard
     */
    getChartData(period = '7d') {
        const now = Date.now();
        const periods = {
            '24h': now - 86400000,
            '7d': now - 604800000,
            '30d': now - 2592000000
        };
        
        const since = periods[period] || periods['7d'];
        
        return {
            detections: this.getTimeSeriesData('detections', since),
            measurements: this.getTimeSeriesData('measurements', since),
            errors: this.getTimeSeriesData('errors', since)
        };
    }

    /**
     * Get time series data
     */
    getTimeSeriesData(type, since) {
        const data = this.metrics[type]
            .filter(item => item.timestamp > since)
            .reverse();
        
        return data.map(item => ({
            timestamp: item.timestamp,
            value: item.objectsCount || item.length || 1
        }));
    }
}

// Initialize global analytics module
window.analyticsModule = new AnalyticsModule();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsModule;
}
