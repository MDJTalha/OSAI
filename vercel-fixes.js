/**
 * Vercel Production Fixes
 * Critical fixes for camera, AI models, and UI issues
 */

// Fix 1: Ensure camera starts properly on Vercel
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[VercelFix] DOM Ready - Starting fixes...');
    
    // Wait for all modules to load
    await waitForModules();
    
    // Fix camera initialization
    fixCameraInitialization();
    
    // Fix AI models loading
    fixAIModels();
    
    // Fix UI modals
    fixUIModals();
    
    // Fix install prompt
    fixInstallPrompt();
    
    console.log('[VercelFix] All fixes applied');
});

/**
 * Wait for all modules to load
 */
async function waitForModules() {
    const modules = [
        'fixedCamera',
        'appController',
        'comprehensiveDetection',
        'intelligentAutoDetection'
    ];
    
    for (let i = 0; i < 100; i++) { // Wait up to 10 seconds
        const allLoaded = modules.every(mod => window[mod]);
        if (allLoaded) {
            console.log('[VercelFix] All modules loaded');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.warn('[VercelFix] Some modules may not have loaded');
}

/**
 * Fix camera initialization
 */
function fixCameraInitialization() {
    console.log('[VercelFix] Fixing camera initialization...');
    
    // Create prominent camera start button if camera not active
    if (!window.fixedCamera?.isCameraActive) {
        createCameraStartButton();
    }
    
    // Override camera error handler to show better messages
    if (window.fixedCamera) {
        const originalHandleError = window.fixedCamera.handleCameraError;
        window.fixedCamera.handleCameraError = function(error) {
            console.error('[Camera Error]', error);
            
            let message = 'Camera error. ';
            
            if (error.name === 'NotAllowedError') {
                message += 'Please allow camera permission and refresh.';
            } else if (error.name === 'NotFoundError') {
                message += 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                message += 'Camera is being used by another application.';
            } else if (window.location.protocol !== 'https:') {
                message += 'HTTPS required. Please use HTTPS.';
            } else {
                message += error.message;
            }
            
            if (window.app?.showToast) {
                window.app.showToast(message, 'error');
            } else {
                alert(message);
            }
        };
        
        console.log('[VercelFix] Camera error handler fixed');
    }
}

/**
 * Create prominent camera start button
 */
function createCameraStartButton() {
    // Remove existing if any
    const existing = document.getElementById('cameraStartButton');
    if (existing) existing.remove();
    
    const button = document.createElement('button');
    button.id = 'cameraStartButton';
    button.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">📷</div>
            <h2 style="font-size: 24px; margin-bottom: 10px; color: var(--text-primary, #F9FAFB);">
                Start Camera
            </h2>
            <p style="color: var(--text-secondary, #D1D5DB); margin-bottom: 30px;">
                Click to enable camera access
            </p>
            <div style="
                background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                color: white;
                padding: 16px 40px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
            ">
                <i class="fas fa-power-off" style="margin-right: 10px;"></i>
                Enable Camera
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: var(--text-muted, #9CA3AF);">
                <i class="fas fa-lock"></i> Your privacy is protected - 100% on-device processing
            </p>
        </div>
    `;
    
    button.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999;
        background: var(--bg-card, #1F2937);
        border: 2px solid var(--highlight-blue, #3B82F6);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.3s;
    `;
    
    button.addEventListener('click', async () => {
        button.style.opacity = '0.5';
        button.style.pointerEvents = 'none';
        
        try {
            const success = await window.fixedCamera.startCamera();
            if (success) {
                button.style.display = 'none';
                if (window.app?.showToast) {
                    window.app.showToast('Camera started successfully!', 'success');
                }
            } else {
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            }
        } catch (error) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    });
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translate(-50%, -50%) scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    document.body.appendChild(button);
    console.log('[VercelFix] Camera start button created');
}

/**
 * Fix AI models loading
 */
function fixAIModels() {
    console.log('[VercelFix] Fixing AI models...');
    
    // Update AI models status display
    const updateModelsStatus = () => {
        const el = document.getElementById('aiModels');
        if (el) {
            // Check what models are available
            const models = {
                cocoSsd: typeof cocoSsd !== 'undefined',
                mobilenet: typeof mobilenet !== 'undefined',
                cv: typeof cv !== 'undefined',
                tesseract: typeof Tesseract !== 'undefined',
                jsQR: typeof jsQR !== 'undefined'
            };
            
            const loaded = Object.values(models).filter(Boolean).length;
            const total = Object.keys(models).length;
            
            el.textContent = `${loaded}/${total}`;
            el.style.color = loaded === total ? 'var(--success-green, #10B981)' : 'var(--warning-amber, #F59E0B)';
            
            if (loaded === 0) {
                console.warn('[VercelFix] No AI models loaded - checking CDN connections...');
                // Models are loaded via CDN in index.html, should be available
            }
        }
    };
    
    // Run immediately and then periodically
    updateModelsStatus();
    setInterval(updateModelsStatus, 2000);
    
    console.log('[VercelFix] AI models status monitor active');
}

/**
 * Fix UI modals - ensure only one is open at a time
 */
function fixUIModals() {
    console.log('[VercelFix] Fixing UI modals...');
    
    // Close all modals initially
    const modals = [
        'bottomPanel',
        'resultsOverlay',
        'calibrationModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            
            // Fix close buttons
            const closeButtons = modal.querySelectorAll('.panel-close, .close-btn');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            });
        }
    });
    
    // Fix overlay clicks to close
    document.querySelectorAll('.results-overlay, .modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    console.log('[VercelFix] UI modals fixed');
}

/**
 * Fix install prompt
 */
function fixInstallPrompt() {
    console.log('[VercelFix] Fixing install prompt...');
    
    const installPrompt = document.getElementById('installPrompt');
    const dismissBtn = document.getElementById('dismissInstallBtn');
    
    if (installPrompt) {
        // Hide by default
        installPrompt.style.display = 'none';
        
        // Show only if user hasn't dismissed
        const dismissed = localStorage.getItem('osai_install_dismissed');
        
        if (!dismissed && dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                installPrompt.style.display = 'none';
                localStorage.setItem('osai_install_dismissed', 'true');
            });
            
            // Show after 30 seconds
            setTimeout(() => {
                installPrompt.style.display = 'flex';
            }, 30000);
        }
    }
    
    console.log('[VercelFix] Install prompt fixed');
}

/**
 * Fix all button event listeners
 */
function fixButtonListeners() {
    console.log('[VercelFix] Fixing button listeners...');
    
    // Wait for app to be ready
    const checkAndFix = setInterval(() => {
        if (!window.app) return;
        
        clearInterval(checkAndFix);
        
        // Fix detect button
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn && !detectBtn.dataset.fixed) {
            detectBtn.addEventListener('click', () => {
                console.log('[Button] Detect clicked');
                window.app.detectItems();
            });
            detectBtn.dataset.fixed = true;
        }
        
        // Fix capture button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn && !captureBtn.dataset.fixed) {
            captureBtn.addEventListener('click', () => {
                console.log('[Button] Capture clicked');
                window.app.captureFrame();
            });
            captureBtn.dataset.fixed = true;
        }
        
        // Fix analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn && !analyzeBtn.dataset.fixed) {
            analyzeBtn.addEventListener('click', () => {
                console.log('[Button] Analyze clicked');
                window.app.showAnalysis();
            });
            analyzeBtn.dataset.fixed = true;
        }
        
        // Fix quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            if (!btn.dataset.fixed) {
                btn.addEventListener('click', (e) => {
                    const action = btn.dataset.action;
                    console.log('[Button] Quick action:', action);
                    
                    if (window.app) {
                        switch(action) {
                            case 'measure':
                                window.app.startMeasurement();
                                break;
                            case 'scan':
                                window.app.startScan();
                                break;
                            case 'text':
                                window.app.startOCR();
                                break;
                            case 'face':
                                window.app.startFaceDetection();
                                break;
                            case 'voice':
                                window.app.toggleVoice();
                                break;
                            case 'menu':
                                window.app.toggleMenu();
                                break;
                        }
                    }
                });
                btn.dataset.fixed = true;
            }
        });
        
        console.log('[VercelFix] All button listeners fixed');
    }, 100);
}

// Initialize button fixes
fixButtonListeners();

/**
 * Add CSS fixes
 */
function addCSSFixes() {
    const style = document.createElement('style');
    style.textContent = `
        /* Fix button visibility and clickability */
        button, .action-btn, .control-fab {
            cursor: pointer !important;
            z-index: 100 !important;
            position: relative !important;
        }
        
        /* Fix modal stacking */
        .modal, .results-overlay, .bottom-panel {
            z-index: 1000 !important;
        }
        
        .modal.active, .results-overlay.active, .bottom-panel.active {
            z-index: 10000 !important;
        }
        
        /* Fix camera container */
        .camera-container {
            position: relative !important;
            z-index: 1 !important;
        }
        
        /* Fix loading overlay */
        .loading-overlay {
            z-index: 9999 !important;
        }
        
        /* Fix toast notifications */
        .toast-notification {
            z-index: 100000 !important;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .quick-actions {
                flex-wrap: wrap !important;
            }
            
            .action-btn {
                min-width: 60px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('[VercelFix] CSS fixes applied');
}

addCSSFixes();

console.log('[VercelFix] All production fixes loaded');
