/**
 * Onboarding Module
 * First-time user experience and feature tutorials
 * - Welcome screen
 * - Permission requests
 * - Feature tutorials
 * - Interactive guides
 */

class OnboardingModule {
    constructor() {
        this.hasCompletedOnboarding = false;
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.highlightElement = null;
        
        this.init();
    }

    init() {
        this.checkOnboardingStatus();
        this.setupSteps();
        console.log('[Onboarding] Module initialized');
    }

    /**
     * Check if user has completed onboarding
     */
    checkOnboardingStatus() {
        const completed = localStorage.getItem('osai_onboarding_completed');
        this.hasCompletedOnboarding = completed === 'true';
    }

    /**
     * Setup onboarding steps
     */
    setupSteps() {
        this.steps = [
            {
                id: 'welcome',
                title: 'Welcome to OSAI',
                content: `
                    <div class="onboarding-welcome">
                        <div class="welcome-icon">👁️</div>
                        <h2>Enterprise AI Vision System</h2>
                        <p>Discover the power of AI-powered object detection, measurement, and analysis.</p>
                        <ul class="feature-highlights">
                            <li>🎯 Real-time object detection</li>
                            <li>📏 AR measurement tools</li>
                            <li>🔍 Advanced image analysis</li>
                            <li>📊 Detailed reporting</li>
                        </ul>
                    </div>
                `,
                buttons: [
                    { text: 'Skip Tour', action: 'complete', variant: 'secondary' },
                    { text: 'Get Started', action: 'next', variant: 'primary' }
                ]
            },
            {
                id: 'camera',
                title: 'Camera Access',
                content: `
                    <div class="onboarding-step">
                        <div class="step-icon">📷</div>
                        <h3>Camera Permission</h3>
                        <p>OSAI needs camera access to analyze your environment.</p>
                        <div class="permission-info">
                            <p><strong>Your privacy matters:</strong></p>
                            <ul>
                                <li>✓ All processing happens on your device</li>
                                <li>✓ No images are uploaded to servers</li>
                                <li>✓ Camera is only active when you choose</li>
                            </ul>
                        </div>
                    </div>
                `,
                buttons: [
                    { text: 'Skip', action: 'skip', variant: 'secondary' },
                    { text: 'Grant Permission', action: 'request-camera', variant: 'primary' }
                ],
                highlight: { element: '#cameraFeed', position: 'center' }
            },
            {
                id: 'detect',
                title: 'Object Detection',
                content: `
                    <div class="onboarding-step">
                        <div class="step-icon">🔍</div>
                        <h3>Detect Objects</h3>
                        <p>Click the Detect button to identify objects in view.</p>
                        <p>Our AI recognizes 80+ object categories with real-time bounding boxes and confidence scores.</p>
                    </div>
                `,
                buttons: [
                    { text: 'Back', action: 'prev', variant: 'secondary' },
                    { text: 'Try It', action: 'demo-detect', variant: 'primary' }
                ],
                highlight: { element: '#detectBtn', position: 'right' }
            },
            {
                id: 'measure',
                title: 'AR Measurement',
                content: `
                    <div class="onboarding-step">
                        <div class="step-icon">📏</div>
                        <h3>Measure Objects</h3>
                        <p>Use the Measure tool for augmented reality measurements.</p>
                        <p>Calibrate with a reference object (like a credit card) for accurate results.</p>
                    </div>
                `,
                buttons: [
                    { text: 'Back', action: 'prev', variant: 'secondary' },
                    { text: 'Continue', action: 'next', variant: 'primary' }
                ],
                highlight: { element: '[data-action="measure"]', position: 'top' }
            },
            {
                id: 'scan',
                title: 'Barcode & QR Scanner',
                content: `
                    <div class="onboarding-step">
                        <div class="step-icon">📱</div>
                        <h3>Scan Codes</h3>
                        <p>Quickly scan barcodes and QR codes.</p>
                        <p>Supports all major barcode formats including UPC, EAN, and Code 128.</p>
                    </div>
                `,
                buttons: [
                    { text: 'Back', action: 'prev', variant: 'secondary' },
                    { text: 'Continue', action: 'next', variant: 'primary' }
                ],
                highlight: { element: '[data-action="scan"]', position: 'top' }
            },
            {
                id: 'settings',
                title: 'Settings & Preferences',
                content: `
                    <div class="onboarding-step">
                        <div class="step-icon">⚙️</div>
                        <h3>Customize Your Experience</h3>
                        <p>Access settings to adjust:</p>
                        <ul>
                            <li>Measurement units (cm, mm, inches)</li>
                            <li>Detection confidence threshold</li>
                            <li>Auto-detection settings</li>
                            <li>Display preferences</li>
                        </ul>
                    </div>
                `,
                buttons: [
                    { text: 'Back', action: 'prev', variant: 'secondary' },
                    { text: 'Finish', action: 'complete', variant: 'primary' }
                ],
                highlight: { element: '.header-btn', position: 'left' }
            },
            {
                id: 'complete',
                title: 'You\'re All Set!',
                content: `
                    <div class="onboarding-complete">
                        <div class="complete-icon">🎉</div>
                        <h2>Ready to Explore</h2>
                        <p>You're now ready to use OSAI's powerful features.</p>
                        <p>Need help anytime? Look for the <strong>?</strong> icon or press <kbd>H</kbd> for help.</p>
                        <div class="quick-tips">
                            <h4>Quick Tips:</h4>
                            <ul>
                                <li>💡 Good lighting improves detection accuracy</li>
                                <li>💡 Hold your device steady for best results</li>
                                <li>💡 Use the Menu for advanced features</li>
                            </ul>
                        </div>
                    </div>
                `,
                buttons: [
                    { text: 'Start Using OSAI', action: 'complete', variant: 'primary' }
                ]
            }
        ];
    }

    /**
     * Show onboarding if needed
     */
    async showOnboarding() {
        if (this.hasCompletedOnboarding) {
            console.log('[Onboarding] Already completed, skipping');
            return false;
        }

        this.currentStep = 0;
        await this.showStep(this.currentStep);
        return true;
    }

    /**
     * Show specific onboarding step
     */
    async showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;

        // Create or update overlay
        if (!this.overlay) {
            this.createOverlay();
        }

        // Update content
        this.updateOverlayContent(step);

        // Highlight element if specified
        if (step.highlight) {
            this.highlightElement = this.highlight(step.highlight.element);
        }

        // Update progress
        this.updateProgress(stepIndex);
    }

    /**
     * Create overlay element
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.innerHTML = `
            <div class="onboarding-modal">
                <div class="onboarding-content"></div>
                <div class="onboarding-buttons"></div>
                <div class="onboarding-progress"></div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Add styles
        this.addStyles();
    }

    /**
     * Update overlay content
     */
    updateOverlayContent(step) {
        const contentEl = this.overlay.querySelector('.onboarding-content');
        const buttonsEl = this.overlay.querySelector('.onboarding-buttons');

        contentEl.innerHTML = `
            <h3>${step.title}</h3>
            <div class="onboarding-body">${step.content}</div>
        `;

        buttonsEl.innerHTML = step.buttons.map(btn => `
            <button 
                class="onboarding-btn onboarding-btn--${btn.variant}"
                data-action="${btn.action}"
            >
                ${btn.text}
            </button>
        `).join('');

        // Add button listeners
        buttonsEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => this.handleButtonAction(btn.dataset.action));
        });
    }

    /**
     * Handle button action
     */
    async handleButtonAction(action) {
        switch (action) {
            case 'next':
                this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
                await this.showStep(this.currentStep);
                break;

            case 'prev':
                this.currentStep = Math.max(this.currentStep - 1, 0);
                await this.showStep(this.currentStep);
                break;

            case 'skip':
                await this.completeOnboarding();
                break;

            case 'complete':
                await this.completeOnboarding();
                break;

            case 'request-camera':
                await this.requestCameraPermission();
                break;

            case 'demo-detect':
                await this.demoDetection();
                break;
        }
    }

    /**
     * Request camera permission
     */
    async requestCameraPermission() {
        try {
            if (window.cameraModule?.startCamera) {
                await window.cameraModule.startCamera();
                this.showToast('Camera permission granted!', 'success');
            }
            // Move to next step after brief delay
            setTimeout(() => this.handleButtonAction('next'), 1000);
        } catch (error) {
            this.showToast('Camera permission denied. You can grant it later.', 'warning');
            this.handleButtonAction('next');
        }
    }

    /**
     * Demo detection
     */
    async demoDetection() {
        if (window.app?.detectItems) {
            await window.app.detectItems();
        }
        setTimeout(() => this.handleButtonAction('next'), 2000);
    }

    /**
     * Highlight element
     */
    highlight(selector) {
        const element = document.querySelector(selector);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        
        const highlight = document.createElement('div');
        highlight.className = 'onboarding-highlight';
        highlight.style.cssText = `
            position: fixed;
            left: ${rect.left - 10}px;
            top: ${rect.top - 10}px;
            width: ${rect.width + 20}px;
            height: ${rect.height + 20}px;
            border: 3px solid #3B82F6;
            border-radius: 8px;
            background: rgba(59, 130, 246, 0.1);
            pointer-events: none;
            z-index: 99999;
            animation: pulse 2s infinite;
        `;

        document.body.appendChild(highlight);

        return highlight;
    }

    /**
     * Update progress indicator
     */
    updateProgress(stepIndex) {
        const progressEl = this.overlay.querySelector('.onboarding-progress');
        const total = this.steps.length;
        const current = stepIndex + 1;

        progressEl.innerHTML = `
            <div class="progress-dots">
                ${this.steps.map((_, i) => `
                    <span class="progress-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}"></span>
                `).join('')}
            </div>
            <span class="progress-text">${current} of ${total}</span>
        `;
    }

    /**
     * Complete onboarding
     */
    async completeOnboarding() {
        localStorage.setItem('osai_onboarding_completed', 'true');
        this.hasCompletedOnboarding = true;
        
        this.hideOverlay();
        
        if (window.app?.showToast) {
            window.app.showToast('Welcome to OSAI!', 'success');
        }

        console.log('[Onboarding] Completed');
    }

    /**
     * Hide overlay
     */
    hideOverlay() {
        if (this.highlightElement) {
            this.highlightElement.remove();
            this.highlightElement = null;
        }

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * Add onboarding styles
     */
    addStyles() {
        const styleId = 'onboarding-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                animation: fadeIn 0.3s ease;
            }

            .onboarding-modal {
                background: var(--bg-card, #1F2937);
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            }

            .onboarding-content h3 {
                font-size: 1.5rem;
                margin-bottom: 16px;
                color: var(--text-primary, #F9FAFB);
            }

            .onboarding-body {
                color: var(--text-secondary, #D1D5DB);
                line-height: 1.6;
            }

            .onboarding-buttons {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                justify-content: flex-end;
            }

            .onboarding-btn {
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                font-size: 1rem;
            }

            .onboarding-btn--primary {
                background: var(--highlight-blue, #3B82F6);
                color: white;
            }

            .onboarding-btn--primary:hover {
                background: #2563EB;
            }

            .onboarding-btn--secondary {
                background: transparent;
                color: var(--text-secondary, #D1D5DB);
                border: 1px solid var(--border-color, #374151);
            }

            .onboarding-btn--secondary:hover {
                background: var(--bg-secondary, #1F2937);
            }

            .onboarding-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color, #374151);
            }

            .progress-dots {
                display: flex;
                gap: 8px;
            }

            .progress-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: var(--gray-600, #4B5563);
                transition: all 0.3s;
            }

            .progress-dot.active {
                background: var(--highlight-blue, #3B82F6);
                transform: scale(1.2);
            }

            .progress-dot.completed {
                background: var(--success-green, #10B981);
            }

            .progress-text {
                font-size: 0.875rem;
                color: var(--text-muted, #9CA3AF);
            }

            .feature-highlights {
                list-style: none;
                padding: 0;
            }

            .feature-highlights li {
                padding: 8px 0;
                font-size: 1rem;
            }

            .permission-info {
                background: var(--bg-secondary, #1F2937);
                padding: 16px;
                border-radius: 8px;
                margin-top: 16px;
            }

            .permission-info ul {
                margin: 8px 0;
                padding-left: 20px;
            }

            .quick-tips {
                background: var(--bg-secondary, #1F2937);
                padding: 16px;
                border-radius: 8px;
                margin-top: 16px;
            }

            .quick-tips h4 {
                margin-bottom: 8px;
                color: var(--text-primary, #F9FAFB);
            }

            .quick-tips ul {
                margin: 0;
                padding-left: 20px;
            }

            .step-icon, .welcome-icon, .complete-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                display: block;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 600px) {
                .onboarding-modal {
                    padding: 24px;
                }

                .onboarding-buttons {
                    flex-direction: column;
                }

                .onboarding-btn {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (window.app?.showToast) {
            window.app.showToast(message, type);
        }
    }

    /**
     * Reset onboarding (for testing)
     */
    reset() {
        localStorage.removeItem('osai_onboarding_completed');
        this.hasCompletedOnboarding = false;
        this.hideOverlay();
    }
}

// Initialize global onboarding module
window.onboarding = new OnboardingModule();

// Auto-show on first visit
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.onboarding.showOnboarding();
        }, 1000);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingModule;
}
