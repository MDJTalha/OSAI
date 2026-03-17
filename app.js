/**
 * MeasureCount Pro - Main Application
 * Camera-based measurement and AI item counting
 */

class MeasureCountApp {
    constructor() {
        this.currentMode = 'detect';
        this.currentView = 'camera';
        this.isCalibrated = false;
        this.calibrationData = null;
        this.measurements = [];
        this.countResults = [];
        this.history = [];
        this.deferredPrompt = null;
        this.learningEnabled = true;
        this.fps = 30;

        this.init();
    }

    async init() {
        await this.loadHistory();
        this.setupEventListeners();
        this.checkConnection();
        this.registerServiceWorker();
        this.updateStorageInfo();
        this.setupPWAInstall();
        this.checkAIModelsStatus();
        this.startFPSCounter();
        this.startContinuousLearning();
        this.initComprehensiveDetection();

        // Auto-detection is enabled by default in auto-detection.js
        console.log('[App] Initialization complete - Auto-detection active');
    }
    
    /**
     * Initialize comprehensive detection with all modules
     */
    initComprehensiveDetection() {
        if (window.comprehensiveDetection) {
            window.comprehensiveDetection.setModules({
                objectDetection: window.objectDetection || null,
                colorDetection: window.colorDetection || null,
                materialDetection: window.materialDetection || null
            });
            console.log('[App] Comprehensive detection initialized');
        }
    }

    /**
     * Handle auto-detection events
     */
    async onAutoDetection(data) {
        const { all, new: newObjects, timestamp } = data;

        // Update UI with REAL data
        this.updateItemCount(all.length);
        
        // Update item properties (color, material, size) - REAL data
        this.updateItemProperties(all);
        
        // Update average confidence - REAL data
        this.updateConfidence(all);

        // Update learned objects count - REAL data from memory
        this.updateLearnedCount();

        // Show notification for new objects
        if (newObjects.length > 0) {
            newObjects.forEach(obj => {
                const desc = obj.description || `${obj.class || 'Object'} detected`;
                this.showToast(`New: ${desc}`, 'info');
            });
        }
    }
    
    /**
     * Update item count display - REAL data
     */
    updateItemCount(count) {
        const el = document.getElementById('itemCount');
        if (el) {
            el.textContent = count;
        }
    }
    /**
     * Update item properties display (color, material, size) - REAL data
     */
    updateItemProperties(detections) {
        const el = document.getElementById('itemProps');
        if (!el) return;
        
        if (!detections || detections.length === 0) {
            el.textContent = '--';
            el.style.color = 'var(--gray-400)';
            return;
        }
        
        // Get properties from first detection
        const item = detections[0];
        const props = [];
        
        // Color
        if (item.color && item.color.dominant && item.color.dominant !== 'Unknown') {
            props.push(item.color.dominant);
        }
        
        // Material
        if (item.material && item.material.type && item.material.type !== 'Unknown') {
            props.push(item.material.type);
        }
        
        // Size
        if (item.size && item.size.category) {
            props.push(item.size.category);
        }
        
        if (props.length > 0) {
            el.textContent = props.join(' • ');
            el.style.color = 'var(--highlight-blue)';
        } else {
            el.textContent = 'Analyzing...';
            el.style.color = 'var(--gray-400)';
        }
    }
    
    /**
     * Update accuracy display from actual detections
     */
    updateConfidence(detections) {
        const el = document.getElementById('confidenceValue');
        if (!el) return;
        
        if (!detections || detections.length === 0) {
            el.textContent = '--';
            el.style.color = 'var(--gray-400)';
            return;
        }
        
        // Calculate average confidence from actual detections
        const confidences = detections.map(d => d.confidence || d.score || 0);
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        
        // Display actual measured accuracy
        el.textContent = `${Math.round(avgConfidence * 100)}%`;
        
        // Color code based on actual confidence
        if (avgConfidence >= 0.75) {
            el.style.color = 'var(--success-green)';
        } else if (avgConfidence >= 0.5) {
            el.style.color = 'var(--highlight-blue)';
        } else {
            el.style.color = 'var(--accent-red)';
        }
    }
    
    /**
     * Update learned objects count from visual memory
     */
    updateLearnedCount() {
        const el = document.getElementById('learnedCount');
        if (!el) return;
        
        // Get count from visual memory if available
        if (window.visualMemory) {
            const count = window.visualMemory.getStoredCount?.() || 0;
            el.textContent = count;
        } else {
            el.textContent = '0';
        }
    }

    /**
     * FPS Counter
     * Note: Higher FPS = more battery drain, CPU load
     * AI inference limits effective detection to ~10-20 FPS
     */
    startFPSCounter() {
        let lastTime = performance.now();
        let frameCount = 0;

        const updateFPS = () => {
            const currentTime = performance.now();
            frameCount++;

            if (currentTime - lastTime >= 1000) {
                this.fps = frameCount;
                const el = document.getElementById('fpsValue');
                if (el) {
                    el.textContent = this.fps;
                }
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(updateFPS);
        };

        updateFPS();
    }

    /**
     * Continuous Learning Mode
     */
    startContinuousLearning() {
        // Register with auto-detection
        if (window.autoDetection) {
            window.autoDetection.onNewObject((detection) => {
                // Learn from new objects
                if (window.visualMemory && detection.class) {
                    window.visualMemory.storeObjectMemory('current_location', {
                        class: detection.class,
                        bbox: detection.bbox,
                        confidence: detection.confidence
                    });
                }
            });
        }
    }
    
    setupEventListeners() {
        // Floating controls
        document.getElementById('detectBtn')?.addEventListener('click', () => this.detectItems());
        document.getElementById('captureBtn')?.addEventListener('click', () => this.captureMeasurement());
        document.getElementById('analyzeBtn')?.addEventListener('click', () => this.showAnalysis());
        document.getElementById('nightVisionBtn')?.addEventListener('click', () => this.toggleNightVision());

        // Quick actions bar
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // Camera controls
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        document.getElementById('toggleFlashBtn')?.addEventListener('click', () => this.toggleFlash());

        // Menu button
        document.querySelector('.action-btn[data-action="menu"]')?.addEventListener('click', () => this.toggleMenu());

        // Dashboard
        document.getElementById('dashboardBtn')?.addEventListener('click', () => this.showDashboard());
        document.getElementById('reportsBtn')?.addEventListener('click', () => this.showReports());

        // Results panel
        document.getElementById('panelClose')?.addEventListener('click', () => this.hideResults());
        document.getElementById('resultsClose')?.addEventListener('click', () => this.hideResults());
        document.getElementById('closeResultsBtn')?.addEventListener('click', () => this.hideResults());
        document.getElementById('saveResultsBtn')?.addEventListener('click', () => this.saveResults());
        document.getElementById('exportResultsBtn')?.addEventListener('click', () => this.exportResults());
        document.getElementById('shareResultsBtn')?.addEventListener('click', () => this.shareResults());

        // Calibration modal
        document.getElementById('closeCalibration')?.addEventListener('click', () => this.hideCalibrationModal());
        document.getElementById('confirmCalibration')?.addEventListener('click', () => this.confirmCalibration());
        document.getElementById('presetObjects')?.addEventListener('change', (e) => this.handlePresetObject(e));

        // PWA Install buttons
        document.getElementById('installBtn')?.addEventListener('click', () => this.installApp());
        document.getElementById('dismissInstallBtn')?.addEventListener('click', () => this.dismissInstallPrompt());

        console.log('[App] Event listeners setup complete');
    }
    
    /**
     * Handle quick action button clicks
     */
    handleQuickAction(e) {
        const action = e.currentTarget.dataset.action;
        console.log('[App] Quick action:', action);
        
        switch(action) {
            case 'measure':
                this.startMeasurement();
                break;
            case 'scan':
                this.scanBarcode();
                break;
            case 'text':
                this.scanText();
                break;
            case 'face':
                this.detectFaces();
                break;
            case 'voice':
                this.toggleVoiceControl();
                break;
            case 'menu':
                this.toggleMenu();
                break;
        }
    }
    
    /**
     * Show analysis results
     */
    showAnalysis() {
        const detections = window.comprehensiveDetection?.getDetections() || [];
        if (detections.length === 0) {
            this.showToast('No items detected yet', 'info');
            return;
        }
        
        this.showResults({
            title: 'Analysis Results',
            items: detections,
            type: 'analysis'
        });
    }
    
    /**
     * Show reports
     */
    showReports() {
        this.showToast('Reports feature - Coming soon', 'info');
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    setupModeSelector() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Show/hide controls based on mode
        const measureControls = document.getElementById('measureControls');
        const countControls = document.getElementById('countControls');
        
        if (mode === 'measure') {
            measureControls?.classList.remove('hidden');
            countControls?.classList.add('hidden');
        } else {
            measureControls?.classList.add('hidden');
            countControls?.classList.remove('hidden');
            
            // Enable/disable analyze button based on mode
            const analyzeBtn = document.getElementById('analyzeTypesBtn');
            if (analyzeBtn) {
                analyzeBtn.disabled = mode === 'count-same';
            }
        }
        
        // Reset results
        this.hideResults();
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide panels
        document.getElementById('historyPanel')?.classList.toggle('active', view === 'history');
        document.getElementById('settingsPanel')?.classList.toggle('active', view === 'settings');
        
        if (view === 'camera') {
            this.hideHistory();
            this.hideSettings();
        }
    }
    
    showCalibrationModal() {
        document.getElementById('calibrationModal')?.classList.add('active');
    }
    
    hideCalibrationModal() {
        document.getElementById('calibrationModal')?.classList.remove('active');
    }
    
    handleObjectTypeChange(e) {
        const sizes = {
            'credit-card': 8.57,
            'coin-quarter': 2.43,
            'coin-dime': 1.79,
            'paper-a4': 21,
            'paper-letter': 21.6
        };
        
        const value = e.target.value;
        const referenceSizeInput = document.getElementById('referenceSize');
        
        if (sizes[value] && referenceSizeInput) {
            referenceSizeInput.value = sizes[value];
        }
    }
    
    async confirmCalibration() {
        const referenceSize = parseFloat(document.getElementById('referenceSize')?.value);
        const referenceUnit = document.getElementById('referenceUnit')?.value;
        
        if (!referenceSize || referenceSize <= 0) {
            this.showToast('Please enter a valid reference size', 'error');
            return;
        }
        
        // Convert to cm for internal storage
        let sizeInCm = referenceSize;
        if (referenceUnit === 'mm') sizeInCm = referenceSize / 10;
        if (referenceUnit === 'in') sizeInCm = referenceSize * 2.54;
        
        this.calibrationData = {
            referenceSize: sizeInCm,
            timestamp: Date.now()
        };
        
        this.isCalibrated = true;
        this.hideCalibrationModal();
        this.showToast('Calibration successful!', 'success');
        
        // Enable capture button
        const captureBtn = document.getElementById('captureMeasureBtn');
        if (captureBtn) captureBtn.disabled = false;
    }
    
    async startMeasurement() {
        if (!this.isCalibrated) {
            this.showToast('Please calibrate first', 'warning');
            this.showCalibrationModal();
            return;
        }
        
        this.showToast('Tap on the screen to set start and end points', 'info');
        
        // Initialize measurement overlay
        if (window.measurementModule) {
            window.measurementModule.startMeasurement();
        }
    }
    
    async captureMeasurement() {
        this.showLoading(true);
        
        try {
            // Capture and calculate measurement
            const result = await window.measurementModule?.captureMeasurement();
            
            if (result) {
                this.measurements.push(result);
                this.displayMeasurementResults(result);
                this.showResults();
            }
        } catch (error) {
            console.error('Measurement error:', error);
            this.showToast('Measurement failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async detectItems() {
        this.showLoading(true);
        
        try {
            const result = await window.objectDetection?.detectObjects();
            
            if (result) {
                this.countResults = result;
                this.displayCountResults(result);
                this.showResults();
            }
        } catch (error) {
            console.error('Detection error:', error);
            this.showToast('Detection failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async analyzeItemTypes() {
        if (this.currentMode === 'count-same') {
            this.showToast('Switch to "Count Different" mode for type analysis', 'info');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const result = await window.objectDetection?.classifyObjects(this.countResults);
            
            if (result) {
                this.displayItemTypeResults(result);
            }
        } catch (error) {
            console.error('Classification error:', error);
            this.showToast('Classification failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    resetCount() {
        this.countResults = [];
        this.hideResults();
        
        // Clear overlay
        if (window.objectDetection) {
            window.objectDetection.clearOverlay();
        }
        
        this.showToast('Count reset', 'info');
    }
    
    displayMeasurementResults(result) {
        const precision = parseInt(document.getElementById('precision')?.value || '2');
        
        document.getElementById('lengthValue').textContent = 
            result.length.toFixed(precision);
        document.getElementById('widthValue').textContent = 
            (result.width || 0).toFixed(precision);
        document.getElementById('areaValue').textContent = 
            result.area.toFixed(precision);
        
        // Update confidence
        const confidence = result.confidence || 0.85;
        this.updateConfidence(confidence);
    }
    
    displayCountResults(result) {
        const totalItems = result.length || 0;
        document.getElementById('totalItemsValue').textContent = totalItems;
        
        // Update confidence
        const avgConfidence = result.reduce((sum, item) => sum + (item.confidence || 0), 0) / totalItems;
        this.updateConfidence(avgConfidence || 0);
        
        // Show analyze button for different items mode
        if (this.currentMode === 'count-different') {
            document.getElementById('analyzeTypesBtn').disabled = false;
        }
    }
    
    displayItemTypeResults(result) {
        const container = document.getElementById('itemTypesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        result.types.forEach(type => {
            const card = document.createElement('div');
            card.className = 'item-type-card';
            card.innerHTML = `
                <div class="type-icon">${type.icon || '📦'}</div>
                <div class="type-name">${type.name}</div>
                <div class="type-count">${type.count}</div>
            `;
            container.appendChild(card);
        });
        
        // Update total
        const total = result.types.reduce((sum, t) => sum + t.count, 0);
        document.getElementById('totalItemsValue').textContent = total;
    }
    
    updateConfidence(value) {
        const percentage = Math.round(value * 100);
        document.getElementById('confidenceFill').style.width = `${percentage}%`;
        document.getElementById('confidenceValue').textContent = `${percentage}%`;
    }
    
    updateDisplayedUnits() {
        // Update measurement display based on selected units
        if (this.measurements.length > 0 && window.measurementModule) {
            const latest = this.measurements[this.measurements.length - 1];
            window.measurementModule.updateDisplayUnits(latest);
        }
    }
    
    showResults() {
        document.getElementById('resultsPanel')?.classList.add('active');
    }
    
    hideResults() {
        document.getElementById('resultsPanel')?.classList.remove('active');
    }
    
    hideHistory() {
        document.getElementById('historyPanel')?.classList.remove('active');
    }
    
    hideSettings() {
        document.getElementById('settingsPanel')?.classList.remove('active');
    }
    
    async saveResults() {
        const result = {
            mode: this.currentMode,
            timestamp: Date.now(),
            data: this.currentMode === 'measure' ? 
                this.measurements[this.measurements.length - 1] : 
                this.countResults
        };
        
        this.history.unshift(result);
        await this.saveHistory();
        
        this.showToast('Results saved', 'success');
    }
    
    async exportResults() {
        const data = {
            exportDate: new Date().toISOString(),
            measurements: this.measurements,
            counts: this.countResults
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `measurecount-export-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Export complete', 'success');
    }
    
    async shareResults() {
        if (navigator.share) {
            try {
                const text = this.formatResultsForShare();
                await navigator.share({
                    title: 'MeasureCount Pro Results',
                    text: text
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.showToast('Share failed', 'error');
                }
            }
        } else {
            this.showToast('Share not supported on this device', 'warning');
        }
    }
    
    formatResultsForShare() {
        if (this.currentMode === 'measure') {
            const m = this.measurements[this.measurements.length - 1];
            return `📏 Measurement Results:\nLength: ${m?.length?.toFixed(2) || 0} cm\nWidth: ${m?.width?.toFixed(2) || 0} cm\nArea: ${m?.area?.toFixed(2) || 0} cm²`;
        } else {
            return `🔢 Item Count: ${this.countResults?.length || 0} items detected`;
        }
    }
    
    async switchCamera() {
        if (window.cameraModule) {
            await window.cameraModule.switchCamera();
        }
    }
    
    async toggleFlash() {
        if (window.cameraModule) {
            await window.cameraModule.toggleFlash();
        }
    }
    
    showLoading(show) {
        document.getElementById('loadingOverlay')?.classList.toggle('active', show);
    }
    
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#0f3460'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
    
    checkConnection() {
        const updateStatus = () => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            
            if (navigator.onLine) {
                statusDot.style.background = 'var(--success-color)';
                statusText.textContent = 'Online';
            } else {
                statusDot.style.background = 'var(--warning-color)';
                statusText.textContent = 'Offline';
            }
        };
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }
    
    async loadHistory() {
        try {
            const stored = localStorage.getItem('measurecount_history');
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    
    async saveHistory() {
        try {
            localStorage.setItem('measurecount_history', JSON.stringify(this.history.slice(0, 50)));
            this.updateStorageInfo();
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
    
    async clearHistory() {
        this.history = [];
        await this.saveHistory();
        document.getElementById('historyList').innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No history yet</p>';
        this.showToast('History cleared', 'success');
    }
    
    updateStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const used = (estimate.usage / 1024 / 1024).toFixed(2);
                document.getElementById('storageUsed').textContent = `${used} MB`;
            });
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('ServiceWorker registered:', registration.scope);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }
    
    updateConfidenceDisplay(e) {
        const value = Math.round(parseFloat(e.target.value) * 100);
        document.getElementById('confidenceDisplay').textContent = `${value}%`;
        
        // Update object detection confidence
        if (window.objectDetection) {
            window.objectDetection.setMinConfidence(parseFloat(e.target.value));
        }
    }

    updateDeepLearningSetting(e) {
        const enabled = e.target.checked;
        document.getElementById('deepLearningStatus').textContent = enabled ? 'On' : 'Off';
        this.showToast(enabled ? 'Deep learning enabled' : 'Deep learning disabled', 'info');
    }

    updateDetectionModel(e) {
        const model = e.target.value;
        this.showToast(`Detection model: ${model}`, 'info');
        
        // Reload AI models if needed
        if (window.enhancedAI && model === 'coco') {
            window.enhancedAI.loadCocoSsd();
        }
    }

    async checkAIModelsStatus() {
        const statusEl = document.getElementById('aiModels');
        if (!statusEl) return;

        // Wait for models to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check what's actually loaded
        const models = [];

        // Enhanced AI module
        if (window.enhancedAI) {
            if (window.enhancedAI.models.cocoSsd) models.push('COCO-SSD');
            if (window.enhancedAI.models.mobilenet) models.push('MobileNet');
            if (window.enhancedAI.isCvReady) models.push('OpenCV');
        }

        // Basic object detection
        if (window.objectDetection?.modelLoaded && !models.includes('COCO-SSD')) {
            models.push('COCO-SSD');
        }

        // Display actual loaded models
        if (models.length > 0) {
            statusEl.textContent = models.join(', ');
            statusEl.style.color = 'var(--success-green)';
        } else {
            statusEl.textContent = 'Basic detection';
            statusEl.style.color = 'var(--gray-400)';
        }
    }

    // ========================================
    // PWA Installation Methods
    // ========================================

    setupPWAInstall() {
        // Listen for install prompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
            console.log('PWA install prompt ready');
        });

        // Handle app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallPrompt();
            this.deferredPrompt = null;
            this.showToast('App installed successfully!', 'success');
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is already installed');
            this.hideInstallPrompt();
        }

        // iOS specific check
        if (navigator.userAgent.match(/iphone|ipad|ipod/i)) {
            const isStandalone = window.navigator.standalone === true;
            if (isStandalone) {
                this.hideInstallPrompt();
            }
        }
    }

    showInstallPrompt() {
        const prompt = document.getElementById('installPrompt');
        if (prompt) {
            // Don't show if user dismissed before
            const dismissed = localStorage.getItem('installPromptDismissed');
            if (!dismissed) {
                setTimeout(() => {
                    prompt.classList.add('active');
                }, 2000);
            }
        }
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('installPrompt');
        if (prompt) {
            prompt.classList.remove('active');
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            // Show iOS install instructions
            if (navigator.userAgent.match(/iphone|ipad|ipod/i)) {
                this.showIOSInstallInstructions();
                return;
            }

            this.showToast('Install option not available', 'warning');
            return;
        }

        // Trigger install prompt
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
            this.showToast('Installing app...', 'success');
        }

        this.deferredPrompt = null;
        this.hideInstallPrompt();
    }

    dismissInstallPrompt() {
        this.hideInstallPrompt();
        localStorage.setItem('installPromptDismissed', 'true');
    }

    showIOSInstallInstructions() {
        const instructions = `
📲 To install on iOS:

1. Tap the Share button 
   (square with arrow)
2. Scroll down and tap 
   "Add to Home Screen"
3. Tap "Add" in the top right

The app will be installed 
on your home screen!
        `;
        alert(instructions);
    }

    // ========================================
    // New Enterprise Features
    // ========================================

    /**
     * Switch industry mode
     */
    switchIndustry(e) {
        const industry = e.currentTarget.dataset.industry;
        
        // Update buttons
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.industry === industry);
        });

        // Update app context
        this.currentIndustry = industry;
        
        // Update UI based on industry
        this.updateIndustryUI(industry);
        
        this.showToast(`${industry} mode activated`, 'success');
    }

    /**
     * Update UI based on industry
     */
    updateIndustryUI(industry) {
        const industryConfig = {
            general: { modes: ['measure', 'detect', 'scan'] },
            retail: { modes: ['inventory', 'pricing', 'products'] },
            warehouse: { modes: ['count', 'inspect', 'track'] },
            construction: { modes: ['measure', 'inspect', 'estimate'] },
            manufacturing: { modes: ['quality', 'defect', 'measure'] },
            healthcare: { modes: ['identify', 'read', 'assist'] },
            agriculture: { modes: ['crop', 'health', 'count'] }
        };

        const config = industryConfig[industry] || industryConfig.general;
        
        // Update available features based on industry
        console.log(`[App] Industry: ${industry}, Config:`, config);
    }

    /**
     * Switch feature tab
     */
    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Show/hide panels
        this.switchView(tab);
    }

    /**
     * Scan text (OCR)
     */
    async scanText() {
        this.showLoading(true);
        document.getElementById('loadingText').textContent = 'Scanning text...';

        try {
            const canvas = window.cameraModule?.captureFrame();
            if (!canvas) throw new Error('Camera not available');

            const result = await window.ocr?.recognizeText(canvas);
            
            if (result && result.text) {
                this.displayOCRResults(result);
                this.showResults();
                this.showToast('Text extracted successfully', 'success');
            } else {
                this.showToast('No text detected', 'warning');
            }
        } catch (error) {
            console.error('OCR error:', error);
            this.showToast('Text scan failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display OCR results
     */
    displayOCRResults(result) {
        document.getElementById('extractedText').textContent = result.text || 'No text found';
        
        // Show structured data if available
        if (result.structured) {
            const { emails, phones, urls } = result.structured;
            let extraInfo = '';
            if (emails.length > 0) extraInfo += `\n📧 Emails: ${emails.join(', ')}`;
            if (phones.length > 0) extraInfo += `\n📱 Phones: ${phones.join(', ')}`;
            if (urls.length > 0) extraInfo += `\n🔗 URLs: ${urls.join(', ')}`;
            
            if (extraInfo) {
                document.getElementById('extractedText').textContent += extraInfo;
            }
        }
    }

    /**
     * Start 360° scan
     */
    async start360Scan() {
        if (!window.scan360) {
            this.showToast('360° scan module not available', 'error');
            return;
        }

        const started = await window.scan360.start360Scan();
        
        if (started) {
            this.showLoading(true);
            document.getElementById('loadingText').textContent = 'Capturing 360° view...';
            
            // Monitor progress
            const checkProgress = setInterval(() => {
                const progress = window.scan360.getProgress();
                
                if (progress >= 100 || !window.scan360.isScanningActive()) {
                    clearInterval(checkProgress);
                    this.showLoading(false);
                    const result = window.scan360.getScanResult();
                    this.showToast(`360° scan complete: ${result.frames} frames captured`, 'success');
                }
            }, 500);
        }
    }

    /**
     * Start 3D reconstruction
     */
    async start3DReconstruction() {
        if (!window.sceneReconstruction3D) {
            this.showToast('3D reconstruction module not available', 'error');
            return;
        }

        const started = await window.sceneReconstruction3D.startReconstruction();
        
        if (started) {
            this.showLoading(true);
            document.getElementById('loadingText').textContent = 'Building 3D model...';
            
            // Monitor progress
            const checkProgress = setInterval(() => {
                const progress = window.sceneReconstruction3D.getProgress();
                
                if (progress >= 100 || !window.sceneReconstruction3D.isReconstructing) {
                    clearInterval(checkProgress);
                    this.showLoading(false);
                    const result = window.sceneReconstruction3D.getReconstructionResult();
                    this.showToast(`3D model created: ${result.pointCloud.count} points`, 'success');
                }
            }, 500);
        }
    }

    /**
     * Check for damage/defects
     */
    async checkDamage() {
        this.showLoading(true);
        document.getElementById('loadingText').textContent = 'Inspecting for damage...';

        try {
            const canvas = window.cameraModule?.captureFrame();
            if (!canvas) throw new Error('Camera not available');

            const result = await window.damageDetection?.detectDamage(canvas);
            
            if (result) {
                this.displayDamageResults(result);
                this.showResults();
                
                const condition = result.overallCondition;
                this.showToast(`Inspection complete: ${condition}`, 
                    condition === 'excellent' || condition === 'good' ? 'success' : 'warning');
            }
        } catch (error) {
            console.error('Damage detection error:', error);
            this.showToast('Inspection failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display damage results
     */
    displayDamageResults(result) {
        document.getElementById('conditionValue').textContent = result.overallCondition;
        
        const defectsCount = result.defects?.length || 0;
        const materialCard = document.getElementById('materialValue');
        if (materialCard) {
            materialCard.textContent = defectsCount > 0 
                ? `${defectsCount} defect(s) found` 
                : 'No defects detected';
        }
    }

    /**
     * Toggle voice control
     */
    toggleVoiceControl() {
        if (!window.voiceCommands) {
            this.showToast('Voice control not available', 'error');
            return;
        }

        const isListening = window.voiceCommands.toggleListening();
        
        const btn = document.getElementById('voiceControlBtn');
        if (btn) {
            btn.classList.toggle('active', isListening);
        }
        
        this.showToast(isListening ? 'Voice control enabled' : 'Voice control disabled', 'info');
    }

    /**
     * Show voice help
     */
    showVoiceHelp() {
        if (!window.voiceCommands) return;
        
        const helpText = window.voiceCommands.showVoiceHelp();
        alert(helpText);
    }

    /**
     * Show dashboard
     */
    showDashboard() {
        this.switchView('dashboard');
        this.updateDashboardStats();
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        // Update stats
        document.getElementById('dashMeasurements').textContent = this.measurements.length;
        document.getElementById('dashDetections').textContent = this.countResults.length;
        document.getElementById('dashScans').textContent = this.history.length;
        document.getElementById('dashHistory').textContent = this.history.length;
    }

    /**
     * Toggle menu
     */
    toggleMenu() {
        if (window.advancedMenu) {
            window.advancedMenu.toggleMenu();
        }
    }

    // ========================================
    // New Scan Features
    // ========================================

    /**
     * Toggle night vision
     */
    async toggleNightVision() {
        if (!window.nightVision) {
            this.showToast('Night vision not available', 'error');
            return;
        }

        const enabled = await window.nightVision.toggleNightVision();
        const btn = document.getElementById('nightVisionBtn');
        
        if (btn) {
            btn.classList.toggle('active', enabled);
        }

        this.showToast(enabled ? 'Night vision enabled' : 'Night vision disabled', 'info');
    }

    /**
     * Scan barcode
     */
    async scanBarcode() {
        if (!window.barcodeQRScanner) {
            this.showToast('Barcode scanner not available', 'error');
            return;
        }

        this.showLoading(true);
        document.getElementById('loadingText').textContent = 'Scanning barcode...';

        try {
            const started = await window.barcodeQRScanner.startScanning();
            
            if (started) {
                // Wait for result
                const checkResult = setInterval(() => {
                    if (!window.barcodeQRScanner.isScanning) {
                        clearInterval(checkResult);
                        this.showLoading(false);
                        const history = window.barcodeQRScanner.getHistory(1);
                        if (history.length > 0) {
                            this.displayBarcodeResults(history[0]);
                        }
                    }
                }, 500);

                // Auto-stop after 5 seconds
                setTimeout(() => {
                    window.barcodeQRScanner.stopScanning();
                }, 5000);
            }
        } catch (error) {
            console.error('Barcode scan error:', error);
            this.showToast('Barcode scan failed', 'error');
            this.showLoading(false);
        }
    }

    /**
     * Scan QR code
     */
    async scanQRCode() {
        if (!window.barcodeQRScanner) {
            this.showToast('QR scanner not available', 'error');
            return;
        }

        this.showLoading(true);
        document.getElementById('loadingText').textContent = 'Scanning QR code...';

        try {
            const started = await window.barcodeQRScanner.startScanning();
            
            if (started) {
                // Wait for result
                const checkResult = setInterval(() => {
                    if (!window.barcodeQRScanner.isScanning) {
                        clearInterval(checkResult);
                        this.showLoading(false);
                        const history = window.barcodeQRScanner.getHistory(1);
                        if (history.length > 0) {
                            this.displayBarcodeResults(history[0]);
                        }
                    }
                }, 500);

                // Auto-stop after 5 seconds
                setTimeout(() => {
                    window.barcodeQRScanner.stopScanning();
                }, 5000);
            }
        } catch (error) {
            console.error('QR scan error:', error);
            this.showToast('QR scan failed', 'error');
            this.showLoading(false);
        }
    }

    /**
     * Display barcode/QR results
     */
    displayBarcodeResults(result) {
        const resultsPanel = document.getElementById('resultsPanel');
        const extractedText = document.getElementById('extractedText');
        
        if (extractedText) {
            extractedText.textContent = `Type: ${result.type}\n\nData: ${result.data}`;
        }

        // Show QR/barcode specific info
        this.showResults();
        this.showToast(`${result.type} scanned successfully`, 'success');
    }

    /**
     * Detect faces
     */
    async detectFaces() {
        if (!window.facialExpression) {
            this.showToast('Face detection not available', 'error');
            return;
        }

        this.showLoading(true);
        document.getElementById('loadingText').textContent = 'Detecting faces...';

        try {
            const started = await window.facialExpression.startDetection();
            
            if (started) {
                // Wait for results
                setTimeout(() => {
                    window.facialExpression.stopDetection();
                    this.showLoading(false);
                    
                    const faces = window.facialExpression.detectedFaces;
                    if (faces.length > 0) {
                        this.displayFaceResults(faces);
                        this.showToast(`${faces.length} face(s) detected`, 'success');
                    } else {
                        this.showToast('No faces detected', 'warning');
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Face detection error:', error);
            this.showToast('Face detection failed', 'error');
            this.showLoading(false);
        }
    }

    /**
     * Display face detection results
     */
    displayFaceResults(faces) {
        if (!faces || faces.length === 0) return;

        const face = faces[0]; // Show first face
        const extractedText = document.getElementById('extractedText');
        
        if (extractedText) {
            const dominantExpression = window.facialExpression.getDominantExpression(face.expressions);
            const expressionLabel = window.facialExpression.expressions[dominantExpression] || dominantExpression;
            
            extractedText.textContent = `Face Analysis:
            
Expression: ${expressionLabel}
Age: ${Math.round(face.age)} years
Gender: ${face.gender} (${Math.round(face.genderProbability * 100)}%)

Emotions:
- Happy: ${Math.round((face.expressions.happy || 0) * 100)}%
- Neutral: ${Math.round((face.expressions.neutral || 0) * 100)}%
- Sad: ${Math.round((face.expressions.sad || 0) * 100)}%
- Angry: ${Math.round((face.expressions.angry || 0) * 100)}%
- Surprised: ${Math.round((face.expressions.surprised || 0) * 100)}%`;
        }

        this.showResults();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MeasureCountApp();
});
