/**
 * Help System & Keyboard Shortcuts
 * - Contextual help
 * - Keyboard shortcuts
 * - Quick reference
 * - Searchable help
 */

class HelpSystem {
    constructor() {
        this.shortcuts = new Map();
        this.helpTopics = new Map();
        this.isHelpOpen = false;
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.setupShortcuts();
        this.setupHelpTopics();
        this.setupKeyboardListener();
        this.createHelpPanel();
        
        console.log('[HelpSystem] Initialized');
    }

    /**
     * Setup keyboard shortcuts
     */
    setupShortcuts() {
        // Navigation
        this.shortcuts.set('?', { description: 'Show help', action: () => this.toggleHelp() });
        this.shortcuts.set('Escape', { description: 'Close panels', action: () => this.closeAll() });
        
        // Detection
        this.shortcuts.set('d', { description: 'Detect objects', action: () => this.triggerAction('detect') });
        this.shortcuts.set('c', { description: 'Capture', action: () => this.triggerAction('capture') });
        this.shortcuts.set('a', { description: 'Analyze', action: () => this.triggerAction('analyze') });
        
        // Tools
        this.shortcuts.set('m', { description: 'Measure mode', action: () => this.triggerAction('measure') });
        this.shortcuts.set('s', { description: 'Scan mode', action: () => this.triggerAction('scan') });
        this.shortcuts.set('t', { description: 'Text/OCR mode', action: () => this.triggerAction('text') });
        this.shortcuts.set('f', { description: 'Face detection', action: () => this.triggerAction('face') });
        
        // Settings
        this.shortcuts.set('n', { description: 'Toggle night vision', action: () => this.triggerAction('nightVision') });
        this.shortcuts.set('h', { description: 'Toggle flash', action: () => this.triggerAction('flash') });
        
        // System
        this.shortcuts.set('r', { description: 'Reports', action: () => this.triggerAction('reports') });
        this.shortcuts.set('g', { description: 'Dashboard', action: () => this.triggerAction('dashboard') });
    }

    /**
     * Setup help topics
     */
    setupHelpTopics() {
        this.helpTopics.set('getting-started', {
            title: 'Getting Started',
            icon: '🚀',
            content: `
                <h3>Welcome to OSAI</h3>
                <p>OSAI is an enterprise AI vision system that provides:</p>
                <ul>
                    <li><strong>Object Detection:</strong> Identify 80+ object categories in real-time</li>
                    <li><strong>AR Measurement:</strong> Measure objects using augmented reality</li>
                    <li><strong>Image Analysis:</strong> Deep analysis of colors, materials, and shapes</li>
                    <li><strong>Code Scanning:</strong> Read barcodes and QR codes</li>
                    <li><strong>OCR:</strong> Extract text from images</li>
                </ul>
                <h4>Quick Start:</h4>
                <ol>
                    <li>Grant camera permission when prompted</li>
                    <li>Point your camera at objects</li>
                    <li>Click "Detect" or press 'D' to identify objects</li>
                    <li>Use the bottom toolbar for specific tools</li>
                </ol>
            `
        });

        this.helpTopics.set('object-detection', {
            title: 'Object Detection',
            icon: '🔍',
            content: `
                <h3>Detecting Objects</h3>
                <p>Our AI can identify objects in real-time using advanced deep learning.</p>
                <h4>How to use:</h4>
                <ol>
                    <li>Ensure good lighting</li>
                    <li>Point camera at objects</li>
                    <li>Click the Detect button or press 'D'</li>
                    <li>View results with bounding boxes and confidence scores</li>
                </ol>
                <h4>Tips for best results:</h4>
                <ul>
                    <li>Keep objects well-lit</li>
                    <li>Hold camera steady</li>
                    <li>Ensure objects are clearly visible</li>
                    <li>Avoid motion blur</li>
                </ul>
                <h4>Supported categories:</h4>
                <p>Person, vehicle, animal, furniture, electronics, kitchen items, office supplies, and 70+ more.</p>
            `
        });

        this.helpTopics.set('measurement', {
            title: 'AR Measurement',
            icon: '📏',
            content: `
                <h3>Measuring with AR</h3>
                <p>Use augmented reality to measure real-world objects.</p>
                <h4>Calibration:</h4>
                <ol>
                    <li>Place a reference object of known size in view</li>
                    <li>Click "Calibrate" or select a preset (credit card, A4 paper)</li>
                    <li>Enter the reference size</li>
                    <li>Confirm calibration</li>
                </ol>
                <h4>Measuring:</h4>
                <ol>
                    <li>Select Measure mode (or press 'M')</li>
                    <li>Tap to set start point</li>
                    <li>Tap to set end point</li>
                    <li>View measurement results</li>
                </ol>
                <h4>Supported units:</h4>
                <p>Centimeters (cm), millimeters (mm), inches (in), feet (ft)</p>
            `
        });

        this.helpTopics.set('scanning', {
            title: 'Barcode & QR Scanning',
            icon: '📱',
            content: `
                <h3>Scanning Codes</h3>
                <p>Quickly scan and decode barcodes and QR codes.</p>
                <h4>Supported formats:</h4>
                <ul>
                    <li><strong>1D Barcodes:</strong> UPC-A, UPC-E, EAN-8, EAN-13, Code 39, Code 93, Code 128</li>
                    <li><strong>2D Codes:</strong> QR Code, Data Matrix, PDF417, Aztec</li>
                </ul>
                <h4>How to scan:</h4>
                <ol>
                    <li>Select Scan mode (or press 'S')</li>
                    <li>Point camera at the code</li>
                    <li>Hold steady until decoded</li>
                    <li>View results instantly</li>
                </ol>
            `
        });

        this.helpTopics.set('ocr', {
            title: 'Text Recognition (OCR)',
            icon: '📝',
            content: `
                <h3>Extracting Text</h3>
                <p>Optical Character Recognition to extract text from images.</p>
                <h4>How to use:</h4>
                <ol>
                    <li>Select Text mode (or press 'T')</li>
                    <li>Capture image with text</li>
                    <li>Wait for processing</li>
                    <li>View extracted text</li>
                </ol>
                <h4>Supported languages:</h4>
                <p>English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, and 100+ more.</p>
                <h4>Tips:</h4>
                <ul>
                    <li>Ensure text is clear and legible</li>
                    <li>Good lighting improves accuracy</li>
                    <li>Avoid shadows and glare</li>
                </ul>
            `
        });

        this.helpTopics.set('settings', {
            title: 'Settings',
            icon: '⚙️',
            content: `
                <h3>Customizing OSAI</h3>
                <p>Adjust settings to match your preferences.</p>
                <h4>Available settings:</h4>
                <ul>
                    <li><strong>Units:</strong> Choose measurement units (cm, mm, inches, feet)</li>
                    <li><strong>Precision:</strong> Set decimal places (1-4)</li>
                    <li><strong>Confidence Threshold:</strong> Minimum detection confidence (0.3-0.9)</li>
                    <li><strong>Auto-Detection:</strong> Enable/disable continuous detection</li>
                    <li><strong>Deep Learning:</strong> Use advanced AI models</li>
                    <li><strong>Night Vision:</strong> Enhanced low-light mode</li>
                </ul>
            `
        });

        this.helpTopics.set('privacy', {
            title: 'Privacy & Security',
            icon: '🔒',
            content: `
                <h3>Your Privacy Matters</h3>
                <p>OSAI is designed with privacy in mind.</p>
                <h4>Data handling:</h4>
                <ul>
                    <li><strong>Local Processing:</strong> All AI processing happens on your device</li>
                    <li><strong>No Uploads:</strong> Images are never sent to servers</li>
                    <li><strong>Local Storage:</strong> Data is stored only in your browser</li>
                    <li><strong>No Tracking:</strong> We don't track your usage</li>
                </ul>
                <h4>Camera access:</h4>
                <ul>
                    <li>Camera is only active when you choose</li>
                    <li>Browser shows camera indicator when active</li>
                    <li>You can revoke permission anytime</li>
                </ul>
            `
        });
    }

    /**
     * Setup keyboard listener
     */
    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toLowerCase();
            
            // Check for shortcut
            if (this.shortcuts.has(key)) {
                e.preventDefault();
                this.shortcuts.get(key).action();
            }

            // Handle help panel search
            if (this.isHelpOpen && e.key === '/') {
                e.preventDefault();
                document.getElementById('helpSearch')?.focus();
            }
        });
    }

    /**
     * Create help panel
     */
    createHelpPanel() {
        const panel = document.createElement('div');
        panel.id = 'helpPanel';
        panel.className = 'help-panel';
        panel.innerHTML = `
            <div class="help-overlay" tabindex="-1"></div>
            <div class="help-content">
                <div class="help-header">
                    <h2>Help & Shortcuts</h2>
                    <button class="help-close" aria-label="Close help">&times;</button>
                </div>
                <div class="help-search">
                    <input type="text" id="helpSearch" placeholder="Search help... (press /)" aria-label="Search help">
                </div>
                <div class="help-body">
                    <div class="shortcuts-section">
                        <h3>Keyboard Shortcuts</h3>
                        <div class="shortcuts-grid" id="shortcutsGrid"></div>
                    </div>
                    <div class="topics-section">
                        <h3>Help Topics</h3>
                        <div class="topics-list" id="topicsList"></div>
                    </div>
                    <div class="topic-content" id="topicContent"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Add styles
        this.addHelpStyles();

        // Setup event listeners
        panel.querySelector('.help-close').addEventListener('click', () => this.hideHelp());
        panel.querySelector('.help-overlay').addEventListener('click', () => this.hideHelp());
        panel.querySelector('#helpSearch').addEventListener('input', (e) => this.searchHelp(e.target.value));
    }

    /**
     * Toggle help panel
     */
    toggleHelp() {
        if (this.isHelpOpen) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }

    /**
     * Show help panel
     */
    showHelp() {
        const panel = document.getElementById('helpPanel');
        if (!panel) return;

        panel.classList.add('active');
        this.isHelpOpen = true;
        
        this.renderShortcuts();
        this.renderTopics();

        // Focus search
        setTimeout(() => {
            document.getElementById('helpSearch')?.focus();
        }, 100);

        console.log('[HelpSystem] Help panel opened');
    }

    /**
     * Hide help panel
     */
    hideHelp() {
        const panel = document.getElementById('helpPanel');
        if (!panel) return;

        panel.classList.remove('active');
        this.isHelpOpen = false;
        this.searchQuery = '';

        console.log('[HelpSystem] Help panel closed');
    }

    /**
     * Close all panels
     */
    closeAll() {
        this.hideHelp();
        
        // Close other panels
        document.querySelectorAll('.bottom-panel, .modal, .results-overlay').forEach(panel => {
            panel.classList.remove('active');
        });
    }

    /**
     * Render shortcuts grid
     */
    renderShortcuts() {
        const grid = document.getElementById('shortcutsGrid');
        if (!grid) return;

        grid.innerHTML = Array.from(this.shortcuts.entries()).map(([key, info]) => `
            <div class="shortcut-item">
                <kbd>${key === ' ' ? 'Space' : key.toUpperCase()}</kbd>
                <span>${info.description}</span>
            </div>
        `).join('');
    }

    /**
     * Render topics list
     */
    renderTopics() {
        const list = document.getElementById('topicsList');
        if (!list) return;

        list.innerHTML = Array.from(this.helpTopics.entries()).map(([id, topic]) => `
            <div class="topic-item" data-topic="${id}">
                <span class="topic-icon">${topic.icon}</span>
                <span class="topic-title">${topic.title}</span>
            </div>
        `).join('');

        // Add click listeners
        list.querySelectorAll('.topic-item').forEach(item => {
            item.addEventListener('click', () => {
                this.showTopic(item.dataset.topic);
            });
        });
    }

    /**
     * Show topic content
     */
    showTopic(topicId) {
        const topic = this.helpTopics.get(topicId);
        const content = document.getElementById('topicContent');
        
        if (!topic || !content) return;

        content.innerHTML = `
            <button class="topic-back" onclick="window.helpSystem.showTopicsList()">← Back to topics</button>
            ${topic.content}
        `;

        list.classList.add('hidden');
        document.getElementById('shortcutsGrid').closest('.shortcuts-section').classList.add('hidden');
        content.classList.add('active');
    }

    /**
     * Show topics list
     */
    showTopicsList() {
        document.getElementById('topicContent').classList.remove('active');
        document.getElementById('topicsList').classList.remove('hidden');
        document.querySelector('.shortcuts-section').classList.remove('hidden');
    }

    /**
     * Search help topics
     */
    searchHelp(query) {
        this.searchQuery = query.toLowerCase();
        
        const topics = document.querySelectorAll('.topic-item');
        topics.forEach(item => {
            const title = item.querySelector('.topic-title').textContent.toLowerCase();
            const matches = title.includes(this.searchQuery);
            item.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Trigger action by name
     */
    triggerAction(actionName) {
        const actionMap = {
            detect: () => document.getElementById('detectBtn')?.click(),
            capture: () => document.getElementById('captureBtn')?.click(),
            analyze: () => document.getElementById('analyzeBtn')?.click(),
            measure: () => document.querySelector('[data-action="measure"]')?.click(),
            scan: () => document.querySelector('[data-action="scan"]')?.click(),
            text: () => document.querySelector('[data-action="text"]')?.click(),
            face: () => document.querySelector('[data-action="face"]')?.click(),
            nightVision: () => document.getElementById('nightVisionBtn')?.click(),
            reports: () => document.getElementById('reportsBtn')?.click(),
            dashboard: () => document.getElementById('dashboardBtn')?.click()
        };

        const action = actionMap[actionName];
        if (action) {
            action();
            this.showToast(`${actionName} triggered`, 'info');
        }
    }

    /**
     * Add help panel styles
     */
    addHelpStyles() {
        const styleId = 'help-system-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .help-panel {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100000;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .help-panel.active {
                display: flex;
            }

            .help-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }

            .help-content {
                position: relative;
                background: var(--bg-card, #1F2937);
                border-radius: 16px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid var(--border-color, #374151);
            }

            .help-header h2 {
                margin: 0;
                font-size: 1.5rem;
                color: var(--text-primary, #F9FAFB);
            }

            .help-close {
                background: none;
                border: none;
                color: var(--text-secondary, #D1D5DB);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .help-close:hover {
                color: var(--text-primary, #F9FAFB);
            }

            .help-search {
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-color, #374151);
            }

            .help-search input {
                width: 100%;
                padding: 12px 16px;
                background: var(--bg-secondary, #1F2937);
                border: 1px solid var(--border-color, #374151);
                border-radius: 8px;
                color: var(--text-primary, #F9FAFB);
                font-size: 1rem;
            }

            .help-body {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .help-body h3 {
                color: var(--text-primary, #F9FAFB);
                margin-bottom: 16px;
            }

            .shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 32px;
            }

            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: var(--bg-secondary, #1F2937);
                border-radius: 8px;
            }

            .shortcut-item kbd {
                background: var(--bg-card, #374151);
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.875rem;
                min-width: 32px;
                text-align: center;
            }

            .shortcut-item span {
                color: var(--text-secondary, #D1D5DB);
                font-size: 0.875rem;
            }

            .topics-list {
                display: grid;
                gap: 8px;
            }

            .topic-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: var(--bg-secondary, #1F2937);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .topic-item:hover {
                background: var(--accent-blue, #233554);
            }

            .topic-icon {
                font-size: 1.5rem;
            }

            .topic-title {
                color: var(--text-primary, #F9FAFB);
                font-weight: 500;
            }

            .topic-content {
                display: none;
            }

            .topic-content.active {
                display: block;
            }

            .topic-content h3, .topic-content h4 {
                color: var(--text-primary, #F9FAFB);
            }

            .topic-content p, .topic-content li {
                color: var(--text-secondary, #D1D5DB);
                line-height: 1.6;
            }

            .topic-content ul, .topic-content ol {
                margin: 16px 0;
                padding-left: 24px;
            }

            .topic-back {
                background: none;
                border: none;
                color: var(--highlight-blue, #3B82F6);
                cursor: pointer;
                padding: 8px 0;
                margin-bottom: 16px;
                font-size: 1rem;
            }

            .hidden {
                display: none !important;
            }

            @media (max-width: 600px) {
                .help-content {
                    width: 95%;
                    height: 95%;
                    max-height: none;
                }

                .shortcuts-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show toast
     */
    showToast(message, type = 'info') {
        if (window.app?.showToast) {
            window.app.showToast(message, type);
        }
    }
}

// Initialize global help system
window.helpSystem = new HelpSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HelpSystem;
}
