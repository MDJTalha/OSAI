/**
 * Dashboard UI Module
 * Analytics dashboard with charts and metrics
 * - Real-time statistics
 * - Historical trends
 * - Performance metrics
 * - Export functionality
 */

class DashboardModule {
    constructor() {
        this.isVisible = false;
        this.refreshInterval = null;
        this.chartInstances = {};
        
        this.init();
    }

    init() {
        this.createDashboard();
        this.setupEventListeners();
        console.log('[Dashboard] Module initialized');
    }

    /**
     * Create dashboard HTML
     */
    createDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'analyticsDashboard';
        dashboard.className = 'analytics-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-overlay"></div>
            <div class="dashboard-content">
                <div class="dashboard-header">
                    <h2><i class="fas fa-chart-line"></i> Analytics Dashboard</h2>
                    <div class="dashboard-actions">
                        <button class="dashboard-btn" id="dashboardRefresh" title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="dashboard-btn" id="dashboardExport" title="Export">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="dashboard-close" id="dashboardClose">&times;</button>
                    </div>
                </div>
                
                <div class="dashboard-body">
                    <!-- Summary Cards -->
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-icon">📊</div>
                            <div class="summary-content">
                                <div class="summary-label">Total Sessions</div>
                                <div class="summary-value" id="totalSessions">0</div>
                                <div class="summary-change" id="sessionsChange">--</div>
                            </div>
                        </div>
                        
                        <div class="summary-card">
                            <div class="summary-icon">🎯</div>
                            <div class="summary-content">
                                <div class="summary-label">Detections</div>
                                <div class="summary-value" id="totalDetections">0</div>
                                <div class="summary-change" id="detectionsChange">--</div>
                            </div>
                        </div>
                        
                        <div class="summary-card">
                            <div class="summary-icon">📏</div>
                            <div class="summary-content">
                                <div class="summary-label">Measurements</div>
                                <div class="summary-value" id="totalMeasurements">0</div>
                                <div class="summary-change" id="measurementsChange">--</div>
                            </div>
                        </div>
                        
                        <div class="summary-card">
                            <div class="summary-icon">⚡</div>
                            <div class="summary-content">
                                <div class="summary-label">Avg FPS</div>
                                <div class="summary-value" id="avgFPS">0</div>
                                <div class="summary-change" id="fpsChange">--</div>
                            </div>
                        </div>
                        
                        <div class="summary-card">
                            <div class="summary-icon">🎯</div>
                            <div class="summary-content">
                                <div class="summary-label">Avg Confidence</div>
                                <div class="summary-value" id="avgConfidence">0%</div>
                                <div class="summary-change" id="confidenceChange">--</div>
                            </div>
                        </div>
                        
                        <div class="summary-card">
                            <div class="summary-icon">⚠️</div>
                            <div class="summary-content">
                                <div class="summary-label">Errors</div>
                                <div class="summary-value" id="totalErrors">0</div>
                                <div class="summary-change" id="errorsChange">--</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Charts Row -->
                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Detections Over Time</h3>
                            <div class="chart-container">
                                <canvas id="detectionsChart"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-card">
                            <h3>Performance Metrics</h3>
                            <div class="chart-container">
                                <canvas id="performanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="activity-section">
                        <h3>Recent Activity</h3>
                        <div class="activity-list" id="activityList">
                            <div class="activity-empty">No recent activity</div>
                        </div>
                    </div>
                    
                    <!-- System Status -->
                    <div class="system-status">
                        <h3>System Status</h3>
                        <div class="status-grid">
                            <div class="status-item">
                                <span class="status-label">Memory Usage:</span>
                                <span class="status-value" id="memoryStatus">--</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Worker Status:</span>
                                <span class="status-value" id="workerStatus">--</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Models Loaded:</span>
                                <span class="status-value" id="modelsStatus">--</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Storage Used:</span>
                                <span class="status-value" id="storageStatus">--</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        this.addStyles();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('dashboardClose')?.addEventListener('click', () => this.hide());
        document.querySelector('.dashboard-overlay')?.addEventListener('click', () => this.hide());
        document.getElementById('dashboardRefresh')?.addEventListener('click', () => this.refresh());
        document.getElementById('dashboardExport')?.addEventListener('click', () => this.export());

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Toggle dashboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show dashboard
     */
    show() {
        const dashboard = document.getElementById('analyticsDashboard');
        if (!dashboard) return;

        dashboard.classList.add('active');
        this.isVisible = true;
        this.refresh();
        
        // Start auto-refresh
        this.refreshInterval = setInterval(() => this.refresh(), 30000);
    }

    /**
     * Hide dashboard
     */
    hide() {
        const dashboard = document.getElementById('analyticsDashboard');
        if (!dashboard) return;

        dashboard.classList.remove('active');
        this.isVisible = false;
        
        // Stop auto-refresh
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Refresh dashboard data
     */
    async refresh() {
        if (!window.analyticsModule) return;

        const summary = window.analyticsModule.getSummary();
        this.updateSummary(summary);
        this.updateCharts();
        this.updateActivity();
        this.updateSystemStatus();
    }

    /**
     * Update summary cards
     */
    updateSummary(summary) {
        // Sessions
        document.getElementById('totalSessions').textContent = summary.sessions.total;
        document.getElementById('sessionsChange').textContent = 
            `+${summary.sessions.last24h} today`;

        // Detections
        document.getElementById('totalDetections').textContent = summary.detections.total;
        document.getElementById('detectionsChange').textContent = 
            `+${summary.detections.last24h} today`;

        // Measurements
        document.getElementById('totalMeasurements').textContent = summary.measurements.total;
        document.getElementById('measurementsChange').textContent = 
            `+${summary.measurements.last24h} today`;

        // FPS
        document.getElementById('avgFPS').textContent = summary.performance.avgFPS;
        document.getElementById('fpsChange').textContent = 'Live';

        // Confidence
        document.getElementById('avgConfidence').textContent = 
            `${Math.round(summary.detections.avgConfidence * 100)}%`;
        document.getElementById('confidenceChange').textContent = 
            summary.detections.avgConfidence >= 0.7 ? '✓ Good' : '⚠ Low';

        // Errors
        document.getElementById('totalErrors').textContent = summary.errors.total;
        document.getElementById('errorsChange').textContent = 
            summary.errors.last24h === 0 ? '✓ None today' : `${summary.errors.last24h} today`;
    }

    /**
     * Update charts
     */
    updateCharts() {
        if (!window.analyticsModule) return;

        const chartData = window.analyticsModule.getChartData('7d');
        
        // Detections chart
        this.updateChart('detectionsChart', chartData.detections);
        
        // Performance chart
        this.updateChart('performanceChart', chartData.measurements);
    }

    /**
     * Update individual chart
     */
    updateChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) {
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Simple line chart
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxValue = Math.max(...data.map(d => d.value), 1);
        const stepX = chartWidth / (data.length - 1 || 1);

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, i) => {
            const x = padding + (i * stepX);
            const y = height - padding - (point.value / maxValue) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#3B82F6';
        data.forEach((point, i) => {
            const x = padding + (i * stepX);
            const y = height - padding - (point.value / maxValue) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Update activity list
     */
    updateActivity() {
        const list = document.getElementById('activityList');
        if (!list || !window.analyticsModule) return;

        const metrics = window.analyticsModule.metrics;
        const allEvents = [
            ...metrics.detections.slice(0, 5).map(d => ({
                type: 'detection',
                timestamp: d.timestamp,
                text: `Detected ${d.objectsCount} objects`
            })),
            ...metrics.measurements.slice(0, 5).map(m => ({
                type: 'measurement',
                timestamp: m.timestamp,
                text: `Measured ${m.length} ${m.unit}`
            })),
            ...metrics.errors.slice(0, 5).map(e => ({
                type: 'error',
                timestamp: e.timestamp,
                text: e.message
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        if (allEvents.length === 0) {
            list.innerHTML = '<div class="activity-empty">No recent activity</div>';
            return;
        }

        list.innerHTML = allEvents.map(event => `
            <div class="activity-item activity-${event.type}">
                <span class="activity-icon">${this.getActivityIcon(event.type)}</span>
                <span classactivity-text">${event.text}</span>
                <span class="activity-time">${this.formatTime(event.timestamp)}</span>
            </div>
        `).join('');
    }

    /**
     * Update system status
     */
    updateSystemStatus() {
        // Memory
        if (window.memoryManager) {
            const stats = window.memoryManager.getStats();
            document.getElementById('memoryStatus').textContent = 
                `${Math.round(stats.memoryUsage * 100)}%`;
        }

        // Workers
        if (window.workerManager) {
            const stats = window.workerManager.getStats();
            document.getElementById('workerStatus').textContent = 
                `${stats.busyWorkers}/${stats.totalWorkers} active`;
        }

        // Models
        if (window.stateManager) {
            const models = window.stateManager.get('models');
            const loaded = Object.values(models).filter(m => m.loaded).length;
            const total = Object.keys(models).length;
            document.getElementById('modelsStatus').textContent = 
                `${loaded}/${total} loaded`;
        }

        // Storage
        if (navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                const used = (estimate.usage / 1024 / 1024).toFixed(1);
                const quota = (estimate.quota / 1024 / 1024 / 1024).toFixed(1);
                document.getElementById('storageStatus').textContent = 
                    `${used}MB / ${quota}GB`;
            });
        }
    }

    /**
     * Get activity icon
     */
    getActivityIcon(type) {
        const icons = {
            detection: '🎯',
            measurement: '📏',
            error: '⚠️'
        };
        return icons[type] || '📊';
    }

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    /**
     * Export analytics
     */
    export() {
        if (window.analyticsModule) {
            window.analyticsModule.downloadExport('json');
        }
    }

    /**
     * Add dashboard styles
     */
    addStyles() {
        const styleId = 'dashboard-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .analytics-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .analytics-dashboard.active {
                display: flex;
            }

            .dashboard-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }

            .dashboard-content {
                position: relative;
                background: var(--bg-card, #1F2937);
                border-radius: 16px;
                width: 95%;
                max-width: 1200px;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid var(--border-color, #374151);
            }

            .dashboard-header h2 {
                margin: 0;
                font-size: 1.5rem;
                color: var(--text-primary, #F9FAFB);
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .dashboard-actions {
                display: flex;
                gap: 8px;
            }

            .dashboard-btn {
                background: var(--bg-secondary, #1F2937);
                border: 1px solid var(--border-color, #374151);
                color: var(--text-secondary, #D1D5DB);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .dashboard-btn:hover {
                background: var(--highlight-blue, #3B82F6);
                border-color: var(--highlight-blue, #3B82F6);
                color: white;
            }

            .dashboard-close {
                background: none;
                border: none;
                color: var(--text-secondary, #D1D5DB);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
            }

            .dashboard-body {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 16px;
                margin-bottom: 32px;
            }

            .summary-card {
                background: var(--bg-secondary, #1F2937);
                border-radius: 12px;
                padding: 20px;
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .summary-icon {
                font-size: 2.5rem;
            }

            .summary-content {
                flex: 1;
            }

            .summary-label {
                font-size: 0.75rem;
                color: var(--text-muted, #9CA3AF);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .summary-value {
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-primary, #F9FAFB);
                margin: 4px 0;
            }

            .summary-change {
                font-size: 0.75rem;
                color: var(--success-green, #10B981);
            }

            .charts-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 24px;
                margin-bottom: 32px;
            }

            .chart-card {
                background: var(--bg-secondary, #1F2937);
                border-radius: 12px;
                padding: 20px;
            }

            .chart-card h3 {
                margin: 0 0 16px 0;
                font-size: 1rem;
                color: var(--text-primary, #F9FAFB);
            }

            .chart-container {
                height: 200px;
            }

            .activity-section {
                margin-bottom: 32px;
            }

            .activity-section h3 {
                margin: 0 0 16px 0;
                font-size: 1rem;
                color: var(--text-primary, #F9FAFB);
            }

            .activity-list {
                background: var(--bg-secondary, #1F2937);
                border-radius: 12px;
                padding: 16px;
                max-height: 300px;
                overflow-y: auto;
            }

            .activity-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 0;
                border-bottom: 1px solid var(--border-color, #374151);
            }

            .activity-item:last-child {
                border-bottom: none;
            }

            .activity-icon {
                font-size: 1.25rem;
            }

            .activity-text {
                flex: 1;
                color: var(--text-secondary, #D1D5DB);
                font-size: 0.875rem;
            }

            .activity-time {
                color: var(--text-muted, #9CA3AF);
                font-size: 0.75rem;
            }

            .system-status {
                background: var(--bg-secondary, #1F2937);
                border-radius: 12px;
                padding: 20px;
            }

            .system-status h3 {
                margin: 0 0 16px 0;
                font-size: 1rem;
                color: var(--text-primary, #F9FAFB);
            }

            .status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                padding: 12px;
                background: var(--bg-card, #374151);
                border-radius: 8px;
            }

            .status-label {
                color: var(--text-muted, #9CA3AF);
                font-size: 0.875rem;
            }

            .status-value {
                color: var(--text-primary, #F9FAFB);
                font-weight: 600;
                font-size: 0.875rem;
            }

            .activity-empty {
                text-align: center;
                color: var(--text-muted, #9CA3AF);
                padding: 40px;
            }

            @media (max-width: 768px) {
                .dashboard-content {
                    width: 100%;
                    height: 100%;
                    max-height: none;
                    border-radius: 0;
                }

                .summary-grid {
                    grid-template-columns: repeat(2, 1fr);
                }

                .charts-row {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize global dashboard module
window.dashboardModule = new DashboardModule();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardModule;
}
