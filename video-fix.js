/**
 * CRITICAL FIX: Force video element to display
 * This overrides any CSS hiding the video
 */

(function() {
    'use strict';
    
    console.log('[Video Fix] Applying video display fix...');
    
    // Force show video element
    const video = document.getElementById('cameraFeed');
    if (video) {
        video.style.setProperty('display', 'block', 'important');
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        console.log('[Video Fix] Video element forced visible');
    }
    
    // Force show canvas
    const canvas = document.getElementById('cameraCanvas');
    if (canvas) {
        canvas.style.setProperty('display', 'block', 'important');
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        console.log('[Video Fix] Canvas forced visible');
    }
    
    // Hide modals forcefully
    const modals = ['bottomPanel', 'resultsOverlay', 'calibrationModal', 'installPrompt'];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.setProperty('display', 'none', 'important');
        }
    });
    
    // Create "Show Video" button as backup
    setTimeout(() => {
        const video = document.getElementById('cameraFeed');
        if (video && video.style.display === 'none') {
            const btn = document.createElement('button');
            btn.textContent = '📺 Show Video Feed';
            btn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
                background: #10B981;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
            `;
            btn.addEventListener('click', () => {
                video.style.display = 'block';
                video.style.visibility = 'visible';
                btn.style.display = 'none';
            });
            document.body.appendChild(btn);
        }
    }, 2000);
    
    console.log('[Video Fix] All fixes applied');
})();
