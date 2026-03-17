/**
 * Advanced Menu System
 * Enterprise-grade feature organization
 * - Categorized features
 * - Search functionality
 * - Quick access
 * - Settings integration
 */

class AdvancedMenuSystem {
    constructor() {
        this.menuPanel = null;
        this.searchInput = null;
        this.categories = this.initializeCategories();
        this.recentFeatures = [];
        this.favorites = this.loadFavorites();
        
        this.init();
    }

    async init() {
        this.createMenuPanel();
        console.log('[MenuSystem] Initialized');
    }

    /**
     * Initialize feature categories
     */
    initializeCategories() {
        return {
            'detection': {
                name: 'Detection & Analysis',
                icon: 'fas fa-search',
                features: [
                    {
                        id: 'detect-objects',
                        name: 'Object Detection',
                        icon: 'fas fa-search',
                        description: 'Detect and identify objects',
                        action: () => window.objectDetection?.detectObjects(),
                        shortcut: 'Ctrl+D'
                    },
                    {
                        id: 'auto-detect',
                        name: 'Auto Detection',
                        icon: 'fas fa-sync',
                        description: 'Continuous automatic detection',
                        action: () => window.autoDetection?.toggle(),
                        toggle: true,
                        default: true
                    },
                    {
                        id: 'face-detect',
                        name: 'Face Detection',
                        icon: 'fas fa-smile',
                        description: 'Detect faces and emotions',
                        action: () => window.facialExpression?.startDetection()
                    },
                    {
                        id: 'material-detect',
                        name: 'Material Analysis',
                        icon: 'fas fa-layer-group',
                        description: 'Identify materials',
                        action: () => this.triggerFeature('material')
                    }
                ]
            },
            'measurement': {
                name: 'Measurement',
                icon: 'fas fa-ruler',
                features: [
                    {
                        id: 'ar-measure',
                        name: 'AR Measurement',
                        icon: 'fas fa-ruler-horizontal',
                        description: 'Measure with augmented reality',
                        action: () => this.triggerFeature('measure')
                    },
                    {
                        id: 'auto-measure',
                        name: 'Auto Measure',
                        icon: 'fas fa-ruler-combined',
                        description: 'Automatic measurement',
                        action: () => window.autoMeasurement?.autoMeasure([])
                    },
                    {
                        id: '3d-reconstruct',
                        name: '3D Reconstruction',
                        icon: 'fas fa-cube',
                        description: 'Create 3D models',
                        action: () => window.sceneReconstruction3D?.startReconstruction()
                    },
                    {
                        id: 'depth-estimate',
                        name: 'Depth Estimation',
                        icon: 'fas fa-arrows-alt',
                        description: 'Estimate distances',
                        action: () => this.triggerFeature('depth')
                    }
                ]
            },
            'scanning': {
                name: 'Scanning',
                icon: 'fas fa-barcode',
                features: [
                    {
                        id: 'barcode-scan',
                        name: 'Barcode Scanner',
                        icon: 'fas fa-barcode',
                        description: 'Scan barcodes',
                        action: () => window.barcodeQRScanner?.startScanning()
                    },
                    {
                        id: 'qr-scan',
                        name: 'QR Code Scanner',
                        icon: 'fas fa-qrcode',
                        description: 'Scan QR codes',
                        action: () => window.barcodeQRScanner?.startScanning()
                    },
                    {
                        id: 'text-ocr',
                        name: 'Text Recognition (OCR)',
                        icon: 'fas fa-font',
                        description: 'Extract text from images',
                        action: () => window.ocr?.recognizeText()
                    },
                    {
                        id: '360-scan',
                        name: '360° Scan',
                        icon: 'fas fa-sync-alt',
                        description: 'Panoramic scanning',
                        action: () => window.scan360?.start360Scan()
                    }
                ]
            },
            'analysis': {
                name: 'Advanced Analysis',
                icon: 'fas fa-chart-bar',
                features: [
                    {
                        id: 'damage-detect',
                        name: 'Damage Detection',
                        icon: 'fas fa-exclamation-triangle',
                        description: 'Detect defects and damage',
                        action: () => window.damageDetection?.detectDamage()
                    },
                    {
                        id: 'emotion-analyze',
                        name: 'Emotion Analysis',
                        icon: 'fas fa-heart',
                        description: 'Analyze facial emotions',
                        action: () => this.triggerFeature('emotion')
                    },
                    {
                        id: 'scene-analyze',
                        name: 'Scene Analysis',
                        icon: 'fas fa-image',
                        description: 'Understand entire scenes',
                        action: () => this.triggerFeature('scene')
                    },
                    {
                        id: 'inventory',
                        name: 'Inventory Count',
                        icon: 'fas fa-boxes',
                        description: 'Count and catalog items',
                        action: () => this.triggerFeature('inventory')
                    }
                ]
            },
            'camera': {
                name: 'Camera Controls',
                icon: 'fas fa-camera',
                features: [
                    {
                        id: 'night-vision',
                        name: 'Night Vision',
                        icon: 'fas fa-moon',
                        description: 'Enhance low-light vision',
                        action: () => window.nightVision?.toggleNightVision(),
                        toggle: true
                    },
                    {
                        id: 'switch-camera',
                        name: 'Switch Camera',
                        icon: 'fas fa-exchange-alt',
                        description: 'Front/back camera',
                        action: () => window.robustCamera?.switchCamera() || window.cameraModule?.switchCamera()
                    },
                    {
                        id: 'toggle-flash',
                        name: 'Toggle Flash',
                        icon: 'fas fa-lightbulb',
                        description: 'Flash on/off',
                        action: () => window.robustCamera?.toggleFlash() || window.cameraModule?.toggleFlash()
                    },
                    {
                        id: 'capture-photo',
                        name: 'Capture Photo',
                        icon: 'fas fa-camera-retro',
                        description: 'Take screenshot',
                        action: () => window.robustCamera?.captureScreenshot('manual')
                    }
                ]
            },
            'voice': {
                name: 'Voice Control',
                icon: 'fas fa-microphone',
                features: [
                    {
                        id: 'voice-commands',
                        name: 'Voice Commands',
                        icon: 'fas fa-microphone-alt',
                        description: 'Control with voice',
                        action: () => window.voiceCommands?.toggleListening(),
                        toggle: true
                    },
                    {
                        id: 'voice-help',
                        name: 'Voice Help',
                        icon: 'fas fa-question-circle',
                        description: 'List voice commands',
                        action: () => window.voiceCommands?.showVoiceHelp()
                    }
                ]
            },
            'data': {
                name: 'Data & Reports',
                icon: 'fas fa-database',
                features: [
                    {
                        id: 'view-history',
                        name: 'View History',
                        icon: 'fas fa-history',
                        description: 'Past detections',
                        action: () => this.showPanel('history')
                    },
                    {
                        id: 'export-data',
                        name: 'Export Data',
                        icon: 'fas fa-file-export',
                        description: 'Export analysis',
                        action: () => this.exportData()
                    },
                    {
                        id: 'generate-report',
                        name: 'Generate Report',
                        icon: 'fas fa-file-alt',
                        description: 'Create PDF report',
                        action: () => this.generateReport()
                    },
                    {
                        id: 'dashboard',
                        name: 'Dashboard',
                        icon: 'fas fa-chart-line',
                        description: 'Analytics dashboard',
                        action: () => this.showPanel('dashboard')
                    }
                ]
            },
            'settings': {
                name: 'Settings',
                icon: 'fas fa-cog',
                features: [
                    {
                        id: 'app-settings',
                        name: 'App Settings',
                        icon: 'fas fa-sliders-h',
                        description: 'Configure app',
                        action: () => this.showPanel('settings')
                    },
                    {
                        id: 'ai-settings',
                        name: 'AI Settings',
                        icon: 'fas fa-brain',
                        description: 'AI configuration',
                        action: () => this.showPanel('settings')
                    },
                    {
                        id: 'about',
                        name: 'About',
                        icon: 'fas fa-info-circle',
                        description: 'App information',
                        action: () => this.showAbout()
                    }
                ]
            }
        };
    }

    /**
     * Create menu panel HTML
     */
    createMenuPanel() {
        const menuHTML = `
            <div class="menu-panel" id="advancedMenuPanel">
                <div class="menu-header">
                    <h3><i class="fas fa-bars"></i> Features Menu</h3>
                    <button class="menu-close" id="closeMenuBtn">&times;</button>
                </div>
                <div class="menu-search">
                    <i class="fas fa-search"></i>
                    <input type="text" id="menuSearch" placeholder="Search features...">
                </div>
                <div class="menu-tabs">
                    <button class="menu-tab active" data-tab="all">All</button>
                    <button class="menu-tab" data-tab="favorites">Favorites</button>
                    <button class="menu-tab" data-tab="recent">Recent</button>
                </div>
                <div class="menu-content" id="menuContent">
                    ${this.renderCategories()}
                </div>
            </div>
        `;

        // Add to DOM
        const container = document.querySelector('.app-container');
        if (container) {
            container.insertAdjacentHTML('beforeend', menuHTML);
        }

        // Add event listeners
        this.addMenuListeners();
    }

    /**
     * Render categories
     */
    renderCategories() {
        return Object.entries(this.categories).map(([key, category]) => `
            <div class="menu-category" data-category="${key}">
                <h4><i class="${category.icon}"></i> ${category.name}</h4>
                <div class="menu-features">
                    ${category.features.map(feature => this.renderFeature(feature)).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render single feature
     */
    renderFeature(feature) {
        const isFavorite = this.favorites.includes(feature.id);
        
        return `
            <div class="menu-feature" data-id="${feature.id}">
                <div class="feature-icon">
                    <i class="${feature.icon}"></i>
                </div>
                <div class="feature-info">
                    <div class="feature-name">${feature.name}</div>
                    <div class="feature-desc">${feature.description}</div>
                </div>
                <div class="feature-actions">
                    ${feature.toggle ? `
                        <button class="feature-toggle" data-id="${feature.id}">
                            <i class="fas fa-toggle-on"></i>
                        </button>
                    ` : `
                        <button class="feature-launch" data-id="${feature.id}">
                            <i class="fas fa-play"></i>
                        </button>
                    `}
                    <button class="feature-favorite" data-id="${feature.id}" data-fav="${isFavorite}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Add menu event listeners
     */
    addMenuListeners() {
        // Close button
        document.getElementById('closeMenuBtn')?.addEventListener('click', () => this.hideMenu());

        // Search
        document.getElementById('menuSearch')?.addEventListener('input', (e) => this.searchFeatures(e.target.value));

        // Tabs
        document.querySelectorAll('.menu-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Feature buttons (delegated)
        document.getElementById('menuContent')?.addEventListener('click', (e) => this.handleFeatureClick(e));
    }

    /**
     * Handle feature click
     */
    handleFeatureClick(e) {
        const toggle = e.target.closest('.feature-toggle');
        const launch = e.target.closest('.feature-launch');
        const favorite = e.target.closest('.feature-favorite');

        if (toggle) {
            this.toggleFeature(toggle.dataset.id);
        } else if (launch) {
            this.launchFeature(launch.dataset.id);
        } else if (favorite) {
            this.toggleFavorite(favorite.dataset.id);
        }
    }

    /**
     * Launch feature
     */
    async launchFeature(featureId) {
        const feature = this.findFeature(featureId);
        if (feature && feature.action) {
            // Add to recent
            this.addToRecent(featureId);
            
            // Execute action
            try {
                await feature.action();
            } catch (error) {
                console.error('[MenuSystem] Feature error:', error);
            }
        }
    }

    /**
     * Toggle feature
     */
    async toggleFeature(featureId) {
        const feature = this.findFeature(featureId);
        if (feature && feature.action) {
            await feature.action();
            
            // Update UI
            const btn = document.querySelector(`.feature-toggle[data-id="${featureId}"]`);
            if (btn) {
                const icon = btn.querySelector('i');
                icon.classList.toggle('fa-toggle-on');
                icon.classList.toggle('fa-toggle-off');
            }
        }
    }

    /**
     * Find feature by ID
     */
    findFeature(featureId) {
        for (const category of Object.values(this.categories)) {
            const feature = category.features.find(f => f.id === featureId);
            if (feature) return feature;
        }
        return null;
    }

    /**
     * Search features
     */
    searchFeatures(query) {
        const features = document.querySelectorAll('.menu-feature');
        query = query.toLowerCase();

        features.forEach(feature => {
            const name = feature.querySelector('.feature-name').textContent.toLowerCase();
            const desc = feature.querySelector('.feature-desc').textContent.toLowerCase();
            
            const matches = name.includes(query) || desc.includes(query);
            feature.style.display = matches ? 'flex' : 'none';
        });
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.menu-tab[data-tab="${tabName}"]`)?.classList.add('active');

        // Filter content
        this.renderFilteredContent(tabName);
    }

    /**
     * Render filtered content
     */
    renderFilteredContent(filter) {
        const content = document.getElementById('menuContent');
        if (!content) return;

        if (filter === 'all') {
            content.innerHTML = this.renderCategories();
        } else if (filter === 'favorites') {
            content.innerHTML = this.renderFavorites();
        } else if (filter === 'recent') {
            content.innerHTML = this.renderRecent();
        }
    }

    /**
     * Render favorites
     */
    renderFavorites() {
        const favFeatures = this.favorites
            .map(id => this.findFeature(id))
            .filter(f => f);

        return this.renderFeatureGroup('Favorites', favFeatures);
    }

    /**
     * Render recent
     */
    renderRecent() {
        const recentFeatures = this.recentFeatures
            .slice(-10)
            .reverse()
            .map(id => this.findFeature(id))
            .filter(f => f);

        return this.renderFeatureGroup('Recent', recentFeatures);
    }

    /**
     * Render feature group
     */
    renderFeatureGroup(title, features) {
        return `
            <div class="menu-category">
                <h4>${title}</h4>
                <div class="menu-features">
                    ${features.map(f => this.renderFeature(f)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Toggle favorite
     */
    toggleFavorite(featureId) {
        const index = this.favorites.indexOf(featureId);
        if (index >= 0) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(featureId);
        }
        
        this.saveFavorites();
        this.renderFilteredContent('all');
    }

    /**
     * Add to recent
     */
    addToRecent(featureId) {
        const index = this.recentFeatures.indexOf(featureId);
        if (index >= 0) {
            this.recentFeatures.splice(index, 1);
        }
        this.recentFeatures.push(featureId);
        
        // Limit to 20
        if (this.recentFeatures.length > 20) {
            this.recentFeatures.shift();
        }
    }

    /**
     * Load favorites
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem('menu_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Save favorites
     */
    saveFavorites() {
        try {
            localStorage.setItem('menu_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('[MenuSystem] Save error:', error);
        }
    }

    /**
     * Show menu
     */
    showMenu() {
        const panel = document.getElementById('advancedMenuPanel');
        if (panel) {
            panel.classList.add('active');
        }
    }

    /**
     * Hide menu
     */
    hideMenu() {
        const panel = document.getElementById('advancedMenuPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    /**
     * Toggle menu
     */
    toggleMenu() {
        const panel = document.getElementById('advancedMenuPanel');
        if (panel?.classList.contains('active')) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

    /**
     * Trigger feature by name
     */
    triggerFeature(name) {
        // Map to actual function
        const actions = {
            'measure': () => window.app?.startMeasurement(),
            'material': () => window.materialDetection?.detectMaterial(),
            'depth': () => window.depthEstimation?.estimateDepthCombined(),
            'emotion': () => window.facialExpression?.startDetection(),
            'scene': () => window.aiExplanation?.explainScene(),
            'inventory': () => window.objectDetection?.detectObjects()
        };

        if (actions[name]) {
            actions[name]();
        }
    }

    /**
     * Show panel
     */
    showPanel(panelName) {
        if (window.app) {
            window.app.switchView(panelName);
        }
        this.hideMenu();
    }

    /**
     * Export data
     */
    exportData() {
        if (window.app) {
            window.app.exportResults();
        }
        this.hideMenu();
    }

    /**
     * Generate report
     */
    generateReport() {
        // Create comprehensive report
        const report = {
            timestamp: Date.now(),
            detections: window.objectDetection?.detections || [],
            measurements: window.app?.measurements || [],
            history: window.app?.history || [],
            statistics: {
                totalDetections: window.objectDetection?.detections.length || 0,
                totalMeasurements: window.app?.measurements.length || 0,
                sessionDuration: performance.now()
            }
        };

        // Download
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.hideMenu();
    }

    /**
     * Show about
     */
    showAbout() {
        alert(`MeasureCount Pro v7.0.0\n\nUniversal AI Vision System\n\nFeatures:\n- Auto-detection (Always On)\n- 26 AI Modules\n- Continuous Learning\n- Real-time Analysis`);
        this.hideMenu();
    }
}

// Initialize menu system
window.advancedMenu = new AdvancedMenuSystem();
