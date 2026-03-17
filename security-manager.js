/**
 * Security Configuration Module
 * - Content Security Policy
 * - Security headers simulation (for PWA)
 * - Input sanitization
 * - XSS prevention
 * - Secure storage
 */

class SecurityManager {
    constructor() {
        this.isInitialized = false;
        this.sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupCSP();
        this.setupSecurityHeaders();
        this.patchInsecureFunctions();
        
        this.isInitialized = true;
        console.log('[SecurityManager] Initialized');
    }

    /**
     * Setup Content Security Policy
     */
    setupCSP() {
        const cspDirectives = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.jsdelivr.net',
                'https://docs.opencv.org',
                'https://cdnjs.cloudflare.com'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com'
            ],
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com',
                'https://cdnjs.cloudflare.com'
            ],
            'img-src': [
                "'self'",
                'data:',
                'blob:',
                'https:'
            ],
            'connect-src': [
                "'self'",
                'https:',
                'wss:',
                'localhost:*'
            ],
            'media-src': [
                "'self'",
                'blob:',
                'mediastream:'
            ],
            'object-src': ["'none'"],
            'frame-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': []
        };

        // Create CSP meta tag
        const cspContent = Object.entries(cspDirectives)
            .map(([directive, values]) => {
                if (values.length === 0) return directive;
                return `${directive} ${values.join(' ')}`;
            })
            .join('; ');

        // Check if CSP meta tag already exists
        let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        
        if (!cspMeta) {
            cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = 'Content-Security-Policy';
            cspMeta.content = cspContent;
            document.head.prepend(cspMeta);
        } else {
            cspMeta.content = cspContent;
        }

        console.log('[SecurityManager] CSP configured');
    }

    /**
     * Setup security headers (simulated for client-side)
     */
    setupSecurityHeaders() {
        // X-Content-Type-Options
        const contentTypeMeta = document.createElement('meta');
        contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
        contentTypeMeta.content = 'nosniff';
        document.head.appendChild(contentTypeMeta);

        // X-Frame-Options
        const frameOptionsMeta = document.createElement('meta');
        frameOptionsMeta.httpEquiv = 'X-Frame-Options';
        frameOptionsMeta.content = 'DENY';
        document.head.appendChild(frameOptionsMeta);

        // X-XSS-Protection
        const xssProtectMeta = document.createElement('meta');
        xssProtectMeta.httpEquiv = 'X-XSS-Protection';
        xssProtectMeta.content = '1; mode=block';
        document.head.appendChild(xssProtectMeta);

        // Referrer-Policy
        const referrerMeta = document.createElement('meta');
        referrerMeta.name = 'referrer';
        referrerMeta.content = 'strict-origin-when-cross-origin';
        document.head.appendChild(referrerMeta);

        // Permissions-Policy
        const permissionsMeta = document.createElement('meta');
        permissionsMeta.httpEquiv = 'Permissions-Policy';
        permissionsMeta.content = [
            'accelerometer=()',
            'ambient-light-sensor=()',
            'autoplay=(self)',
            'battery=()',
            'camera=(self)',
            'cross-origin-isolated=()',
            'display-capture=()',
            'document-domain=()',
            'encrypted-media=(self)',
            'execution-while-not-rendered=()',
            'execution-while-out-of-viewport=()',
            'fullscreen=(self)',
            'geolocation=()',
            'gyroscope=()',
            'keyboard-map=()',
            'magnetometer=()',
            'microphone=(self)',
            'midi=()',
            'navigation-override=()',
            'payment=()',
            'picture-in-picture=(self)',
            'publickey-credentials-get=()',
            'screen-wake-lock=()',
            'sync-xhr=()',
            'usb=()',
            'web-share=(self)',
            'xr-spatial-tracking=()'
        ].join(', ');
        document.head.appendChild(permissionsMeta);

        console.log('[SecurityManager] Security headers configured');
    }

    /**
     * Patch insecure global functions
     */
    patchInsecureFunctions() {
        // Wrap eval to prevent usage
        const originalEval = window.eval;
        window.eval = (code) => {
            console.warn('[SecurityManager] eval() usage detected - this is a security risk');
            console.trace();
            return originalEval.call(window, code);
        };

        // Monitor innerHTML usage (XSS risk)
        this.monitorInnerHTML();
    }

    /**
     * Monitor innerHTML assignments for XSS
     */
    monitorInnerHTML() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanForXSS(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Scan element for potential XSS
     */
    scanForXSS(element) {
        const dangerousPatterns = [
            /javascript:/i,
            /on\w+\s*=/i,
            /<script/i,
            /data:text\/html/i,
            /vbscript:/i
        ];

        if (element.innerHTML) {
            dangerousPatterns.forEach(pattern => {
                if (pattern.test(element.innerHTML)) {
                    console.warn('[SecurityManager] Potential XSS detected:', element);
                    element.innerHTML = this.sanitizeHTML(element.innerHTML);
                }
            });
        }
    }

    /**
     * Sanitize HTML string
     */
    sanitizeHTML(html) {
        if (!html) return '';
        
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    /**
     * Sanitize user input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Encode for HTML context
     */
    encodeHTML(str) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return String(str).replace(/[&<>"'/]/g, char => escapeMap[char]);
    }

    /**
     * Encode for URL context
     */
    encodeURL(str) {
        return encodeURIComponent(String(str));
    }

    /**
     * Secure localStorage wrapper
     */
    secureStorage = {
        set: (key, value) => {
            // Don't store sensitive data
            if (this.sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                console.warn('[SecurityManager] Attempting to store sensitive data:', key);
                return false;
            }
            
            try {
                const serialized = JSON.stringify(value);
                localStorage.setItem(key, serialized);
                return true;
            } catch (e) {
                console.error('[SecurityManager] Storage error:', e);
                return false;
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('[SecurityManager] Storage read error:', e);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        },
        
        clear: () => {
            // Clear only app data, not everything
            const appPrefix = 'osai_';
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(appPrefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    };

    /**
     * Generate secure random ID
     */
    generateSecureId(length = 16) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash string (simple hash for non-sensitive data)
     */
    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate file type before upload
     */
    validateFileType(file, allowedTypes) {
        if (!file || !file.type) return false;
        
        return allowedTypes.some(type => {
            if (type.includes('*')) {
                const prefix = type.replace('*', '');
                return file.type.startsWith(prefix);
            }
            return file.type === type;
        });
    }

    /**
     * Validate file size
     */
    validateFileSize(file, maxSizeMB) {
        if (!file) return false;
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }

    /**
     * Check for security vulnerabilities
     */
    runSecurityAudit() {
        const issues = [];
        
        // Check for eval usage
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent.includes('eval(')) {
                issues.push('eval() usage detected');
            }
        });
        
        // Check for inline event handlers
        const elementsWithEvents = document.querySelectorAll('[onclick], [onerror], [onload]');
        if (elementsWithEvents.length > 0) {
            issues.push(`${elementsWithEvents.length} elements with inline event handlers`);
        }
        
        // Check for external scripts over HTTP
        const httpScripts = document.querySelectorAll('script[src^="http://"]');
        if (httpScripts.length > 0) {
            issues.push(`${httpScripts.length} scripts loaded over insecure HTTP`);
        }
        
        return {
            issues,
            score: Math.max(0, 100 - (issues.length * 10)),
            passed: issues.length === 0
        };
    }
}

// Initialize global security manager
window.securityManager = new SecurityManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}
