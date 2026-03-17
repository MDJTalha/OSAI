/**
 * Internationalization (i18n) Module
 * Multi-language support for global accessibility
 * 
 * Target: 100+ languages by 2027
 * 
 * Features:
 * - Dynamic language switching
 * - RTL support (Arabic, Hebrew)
 * - Auto-detect browser language
 * - Community translations
 * - Fallback to English
 */

class I18nModule {
    constructor() {
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
        this.translations = new Map();
        this.supportedLanguages = {
            'en': { name: 'English', native: 'English', rtl: false },
            'es': { name: 'Spanish', native: 'Español', rtl: false },
            'fr': { name: 'French', native: 'Français', rtl: false },
            'de': { name: 'German', native: 'Deutsch', rtl: false },
            'zh': { name: 'Chinese', native: '中文', rtl: false },
            'ja': { name: 'Japanese', native: '日本語', rtl: false },
            'hi': { name: 'Hindi', native: 'हिन्दी', rtl: false },
            'pt': { name: 'Portuguese', native: 'Português', rtl: false },
            'ru': { name: 'Russian', native: 'Русский', rtl: false },
            'ar': { name: 'Arabic', native: 'العربية', rtl: true }
        };
        
        this.init();
    }

    async init() {
        console.log('[I18n] Initializing...');
        
        // Load default language
        await this.loadLanguage('en');
        
        // Auto-detect browser language
        const browserLang = this.detectBrowserLanguage();
        if (browserLang !== 'en') {
            await this.setLanguage(browserLang);
        }
        
        console.log('[I18n] Initialized, current language:', this.currentLanguage);
    }

    /**
     * Detect browser language
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        
        if (this.supportedLanguages[langCode]) {
            return langCode;
        }
        
        return 'en';
    }

    /**
     * Load language translations
     */
    async loadLanguage(langCode) {
        if (this.translations.has(langCode)) {
            return true;
        }

        try {
            // Try to load from translations folder
            const response = await fetch(`translations/${langCode}.json`);
            if (!response.ok) throw new Error('Not found');
            
            const translations = await response.json();
            this.translations.set(langCode, translations);
            
            console.log('[I18n] Loaded language:', langCode);
            return true;
            
        } catch (error) {
            console.warn('[I18n] Could not load language:', langCode, 'using fallback');
            
            // Load fallback if not already loaded
            if (!this.translations.has(this.fallbackLanguage)) {
                await this.loadLanguage(this.fallbackLanguage);
            }
            
            return false;
        }
    }

    /**
     * Set current language
     */
    async setLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            console.warn('[I18n] Unsupported language:', langCode);
            return false;
        }

        const loaded = await this.loadLanguage(langCode);
        if (loaded) {
            this.currentLanguage = langCode;
            this.applyTranslations();
            this.applyDirection();
            
            // Save preference
            localStorage.setItem('osai_language', langCode);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('language-changed', {
                detail: { language: langCode }
            }));
            
            console.log('[I18n] Language set to:', langCode);
            return true;
        }
        
        return false;
    }

    /**
     * Get translation by key
     */
    t(key, params = {}) {
        const langTranslations = this.translations.get(this.currentLanguage) || {};
        const fallbackTranslations = this.translations.get(this.fallbackLanguage) || {};
        
        // Try current language
        let translation = this.getNestedValue(langTranslations, key);
        
        // Fallback to English
        if (!translation) {
            translation = this.getNestedValue(fallbackTranslations, key);
        }
        
        // Fallback to key
        if (!translation) {
            translation = key;
        }
        
        // Replace parameters
        return this.replaceParams(translation, params);
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, key) {
        return key.split('.').reduce((current, part) => {
            return current && current[part] !== undefined ? current[part] : null;
        }, obj);
    }

    /**
     * Replace parameters in translation
     */
    replaceParams(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Apply translations to DOM
     */
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const params = {};
            
            // Get parameters from data-i18n-* attributes
            Array.from(el.attributes)
                .filter(attr => attr.name.startsWith('data-i18n-'))
                .forEach(attr => {
                    const param = attr.name.replace('data-i18n-', '');
                    params[param] = attr.value;
                });
            
            el.textContent = this.t(key, params);
        });
    }

    /**
     * Apply text direction (RTL/LTR)
     */
    applyDirection() {
        const langInfo = this.supportedLanguages[this.currentLanguage];
        const dir = langInfo.rtl ? 'rtl' : 'ltr';
        
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', this.currentLanguage);
        
        // Add RTL class for CSS
        if (langInfo.rtl) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }

    /**
     * Get language switcher HTML
     */
    getLanguageSwitcher() {
        const select = document.createElement('select');
        select.className = 'language-switcher';
        select.setAttribute('aria-label', this.t('common.selectLanguage'));
        
        Object.entries(this.supportedLanguages).forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = info.native;
            option.selected = code === this.currentLanguage;
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
        
        return select;
    }

    /**
     * Get current language info
     */
    getCurrentLanguage() {
        return {
            code: this.currentLanguage,
            ...this.supportedLanguages[this.currentLanguage]
        };
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return Object.entries(this.supportedLanguages).map(([code, info]) => ({
            code,
            ...info
        }));
    }

    /**
     * Add new language
     */
    addLanguage(code, name, native, rtl = false) {
        this.supportedLanguages[code] = { name, native, rtl };
    }

    /**
     * Add translations
     */
    addTranslations(langCode, translations) {
        this.translations.set(langCode, {
            ...(this.translations.get(langCode) || {}),
            ...translations
        });
    }
}

// Translation templates
const translationTemplates = {
    en: {
        common: {
            selectLanguage: 'Select Language',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            confirm: 'Confirm',
            close: 'Close',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit'
        },
        camera: {
            start: 'Start Camera',
            stop: 'Stop Camera',
            switch: 'Switch Camera',
            permission: 'Camera Permission',
            permissionDenied: 'Camera permission denied',
            notFound: 'No camera found',
            error: 'Camera error'
        },
        detection: {
            detect: 'Detect Objects',
            analyzing: 'Analyzing...',
            noObjects: 'No objects detected',
            confidence: 'Confidence',
            results: 'Detection Results'
        },
        measurement: {
            measure: 'Measure',
            calibrate: 'Calibrate',
            length: 'Length',
            width: 'Width',
            area: 'Area',
            unit: 'Unit'
        },
        scan: {
            scan: 'Scan',
            barcode: 'Barcode',
            qrCode: 'QR Code',
            result: 'Scan Result'
        },
        text: {
            ocr: 'Text Recognition',
            extracting: 'Extracting text...',
            noText: 'No text found',
            copy: 'Copy Text'
        },
        settings: {
            settings: 'Settings',
            language: 'Language',
            theme: 'Theme',
            privacy: 'Privacy',
            about: 'About'
        },
        accessibility: {
            highContrast: 'High Contrast',
            largeText: 'Large Text',
            reduceMotion: 'Reduce Motion',
            screenReader: 'Screen Reader'
        }
    },
    es: {
        common: {
            selectLanguage: 'Seleccionar Idioma',
            loading: 'Cargando...',
            error: 'Error',
            success: 'Éxito',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            close: 'Cerrar',
            save: 'Guardar',
            delete: 'Eliminar',
            edit: 'Editar'
        },
        camera: {
            start: 'Iniciar Cámara',
            stop: 'Detener Cámara',
            switch: 'Cambiar Cámara',
            permission: 'Permiso de Cámara',
            permissionDenied: 'Permiso de cámara denegado',
            notFound: 'No se encontró cámara',
            error: 'Error de cámara'
        },
        detection: {
            detect: 'Detectar Objetos',
            analyzing: 'Analizando...',
            noObjects: 'No se detectaron objetos',
            confidence: 'Confianza',
            results: 'Resultados de Detección'
        }
    },
    zh: {
        common: {
            selectLanguage: '选择语言',
            loading: '加载中...',
            error: '错误',
            success: '成功',
            cancel: '取消',
            confirm: '确认',
            close: '关闭',
            save: '保存',
            delete: '删除',
            edit: '编辑'
        },
        camera: {
            start: '启动相机',
            stop: '停止相机',
            switch: '切换相机',
            permission: '相机权限',
            permissionDenied: '相机权限被拒绝',
            notFound: '未找到相机',
            error: '相机错误'
        }
    },
    ar: {
        common: {
            selectLanguage: 'اختر اللغة',
            loading: 'جاري التحميل...',
            error: 'خطأ',
            success: 'نجاح',
            cancel: 'إلغاء',
            confirm: 'تأكيد',
            close: 'إغلاق',
            save: 'حفظ',
            delete: 'حذف',
            edit: 'تعديل'
        }
    }
};

// Initialize global i18n module
window.i18n = new I18nModule();

// Add template translations
Object.entries(translationTemplates).forEach(([lang, translations]) => {
    window.i18n.addTranslations(lang, translations);
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nModule;
}
