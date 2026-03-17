/**
 * CRITICAL FIX: Force hide modals on page load
 * This overrides any CSS that might be showing modals
 */

// Run immediately when script loads
(function() {
    'use strict';
    
    console.log('[Critical Fixes] Applying modal fixes...');
    
    // Force hide all modals immediately
    const modalsToHide = [
        'bottomPanel',
        'resultsOverlay',
        'calibrationModal',
        'installPrompt'
    ];
    
    modalsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.setProperty('display', 'none', 'important');
            el.classList.remove('active');
            console.log('[Critical Fixes] Hidden:', id);
        }
    });
    
    // Hide recording badge until camera starts
    const recordingBadge = document.getElementById('recordingBadge');
    if (recordingBadge) {
        recordingBadge.style.setProperty('display', 'none', 'important');
    }
    
    // Show video element only when camera active
    const video = document.getElementById('cameraFeed');
    if (video) {
        video.style.setProperty('display', 'none', 'important');
    }
    
    // Create camera start button if camera not active
    setTimeout(() => {
        if (!window.fixedCamera?.isCameraActive) {
            createCameraStartButton();
        }
    }, 1000);
    
    console.log('[Critical Fixes] All fixes applied');
})();

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
            <h2 style="font-size: 24px; margin-bottom: 10px; color: #F9FAFB;">
                Start Camera
            </h2>
            <p style="color: #D1D5DB; margin-bottom: 30px;">
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
            <p style="margin-top: 20px; font-size: 14px; color: #9CA3AF;">
                <i class="fas fa-lock"></i> Your privacy is protected - 100% on-device processing
            </p>
        </div>
    `;
    
    button.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999 !important;
        background: #1F2937;
        border: 2px solid #3B82F6;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.3s;
    `;
    
    button.addEventListener('click', async () => {
        button.style.opacity = '0.5';
        button.style.pointerEvents = 'none';
        
        try {
            if (window.fixedCamera) {
                const success = await window.fixedCamera.startCamera();
                if (success) {
                    button.style.display = 'none';
                    const video = document.getElementById('cameraFeed');
                    if (video) video.style.display = 'block';
                    const badge = document.getElementById('recordingBadge');
                    if (badge) badge.style.display = 'block';
                } else {
                    button.style.opacity = '1';
                    button.style.pointerEvents = 'auto';
                }
            }
        } catch (error) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            alert('Camera error: ' + error.message);
        }
    });
    
    document.body.appendChild(button);
    console.log('[Critical Fixes] Camera start button created');
}

// Fix model display
(function() {
    const updateModelsDisplay = setInterval(() => {
        const el = document.getElementById('aiModels');
        if (el && el.textContent === 'Loading...') {
            // Check if models are actually loaded
            if (window.aiModelManager) {
                const status = window.aiModelManager.getAllStatuses();
                el.textContent = `${status.loadedCount}/${status.totalCount}`;
                if (status.loadedCount === status.totalCount) {
                    el.style.color = '#10B981';
                    clearInterval(updateModelsDisplay);
                }
            }
        }
    }, 1000);
    
    // Stop after 30 seconds
    setTimeout(() => clearInterval(updateModelsDisplay), 30000);
})();
