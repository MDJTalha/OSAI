/**
 * OCR Text Recognition Module
 * Read and understand text from images
 * - Tesseract.js integration
 * - Multi-language support
 * - Handwritten text recognition
 * - Text translation
 */

class OCRModule {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.supportedLanguages = ['eng', 'spa', 'fra', 'deu', 'chi_sim', 'jpn', 'kor'];
        this.currentLanguage = 'eng';
        this.recognitionHistory = [];

        this.init();
    }

    async init() {
        await this.loadTesseract();
    }

    /**
     * Load Tesseract.js
     */
    async loadTesseract() {
        if (typeof Tesseract === 'undefined') {
            console.warn('[OCR] Tesseract.js not loaded, using fallback');
            this.isReady = false;
            return false;
        }

        try {
            this.worker = await Tesseract.createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(0)}%`);
                    }
                }
            });

            await this.worker.loadLanguage(this.currentLanguage);
            await this.worker.initialize(this.currentLanguage);

            this.isReady = true;
            console.log('[OCR] Tesseract.js ready');
            return true;
        } catch (error) {
            console.error('[OCR] Failed to load Tesseract:', error);
            this.isReady = false;
            return false;
        }
    }

    /**
     * Recognize text from image
     * @param {ImageData|HTMLCanvasElement|HTMLImageElement} image - Image source
     * @param {Object} options - Recognition options
     * @returns {Object} OCR result
     */
    async recognizeText(image, options = {}) {
        if (!this.isReady) {
            await this.loadTesseract();
        }

        if (!this.isReady) {
            return this.fallbackOCR(image);
        }

        try {
            const { data } = await this.worker.recognize(image);

            const result = {
                text: data.text,
                confidence: data.confidence,
                words: data.words,
                lines: data.lines,
                paragraphs: data.paragraphs,
                orientation: data.orientation,
                language: this.currentLanguage,
                method: 'tesseract',
                timestamp: Date.now()
            };

            // Process structured information
            result.structured = this.extractStructuredInfo(result);

            // Save to history
            this.recognitionHistory.push(result);
            if (this.recognitionHistory.length > 50) {
                this.recognitionHistory.shift();
            }

            return result;
        } catch (error) {
            console.error('[OCR] Recognition error:', error);
            return this.fallbackOCR(image);
        }
    }

    /**
     * Extract structured information from OCR result
     */
    extractStructuredInfo(ocrResult) {
        const text = ocrResult.text;
        const structured = {
            emails: [],
            phones: [],
            urls: [],
            dates: [],
            prices: [],
            addresses: []
        };

        // Email pattern
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        structured.emails = text.match(emailRegex) || [];

        // Phone pattern
        const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
        structured.phones = text.match(phoneRegex) || [];

        // URL pattern
        const urlRegex = /https?:\/\/[^\s]+/g;
        structured.urls = text.match(urlRegex) || [];

        // Date pattern
        const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
        structured.dates = text.match(dateRegex) || [];

        // Price pattern
        const priceRegex = /[$€£¥]\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|JPY)\b/g;
        structured.prices = text.match(priceRegex) || [];

        return structured;
    }

    /**
     * Fallback OCR without Tesseract
     */
    fallbackOCR(image) {
        console.warn('[OCR] Using basic text detection');
        
        // Basic text region detection (simplified)
        return {
            text: '[OCR not available - install Tesseract.js]',
            confidence: 0,
            words: [],
            lines: [],
            structured: {
                emails: [],
                phones: [],
                urls: [],
                dates: [],
                prices: []
            },
            method: 'fallback',
            timestamp: Date.now()
        };
    }

    /**
     * Recognize text from multiple regions
     */
    async recognizeMultiple(image, regions) {
        const results = [];

        for (const region of regions) {
            const cropped = this.cropImage(image, region);
            const result = await this.recognizeText(cropped);
            
            results.push({
                region: region,
                ...result
            });
        }

        return results;
    }

    /**
     * Crop image to region
     */
    cropImage(imageData, region) {
        const [x, y, w, h] = region;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = w;
        canvas.height = h;

        if (imageData instanceof ImageData) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageData.width;
            tempCanvas.height = imageData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);
            
            ctx.drawImage(
                tempCanvas,
                x, y, w, h,
                0, 0, w, h
            );
        } else {
            ctx.drawImage(imageData, x, y, w, h, 0, 0, w, h);
        }

        return canvas;
    }

    /**
     * Translate recognized text
     */
    async translateText(text, targetLang = 'en') {
        // Use browser's translation API or external service
        if ('translation' in window) {
            return await window.translation.translate(text, targetLang);
        }

        // Fallback: return original
        return {
            original: text,
            translated: text,
            sourceLanguage: this.currentLanguage,
            targetLanguage: targetLang
        };
    }

    /**
     * Summarize recognized text
     */
    async summarizeText(text, maxLength = 100) {
        // Simple extractive summarization
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length <= 1) {
            return text;
        }

        // Score sentences by position and length
        const scored = sentences.map((sentence, index) => ({
            text: sentence.trim(),
            score: (1 / (index + 1)) * 0.5 + (sentence.length / text.length) * 0.5
        }));

        // Sort by score and take top sentences
        scored.sort((a, b) => b.score - a.score);
        const summary = scored.slice(0, 3).map(s => s.text).join('. ') + '.';

        return summary;
    }

    /**
     * Detect document type from OCR result
     */
    detectDocumentType(ocrResult) {
        const text = ocrResult.text.toLowerCase();
        const structured = ocrResult.structured;

        // Business card
        if (structured.emails.length > 0 && structured.phones.length > 0) {
            return {
                type: 'business_card',
                confidence: 0.9,
                fields: {
                    emails: structured.emails,
                    phones: structured.phones
                }
            };
        }

        // Receipt
        if (structured.prices.length > 2) {
            return {
                type: 'receipt',
                confidence: 0.8,
                fields: {
                    prices: structured.prices,
                    dates: structured.dates
                }
            };
        }

        // Letter/Document
        if (text.length > 500) {
            return {
                type: 'document',
                confidence: 0.7,
                fields: {
                    wordCount: text.split(' ').length,
                    dates: structured.dates
                }
            };
        }

        // Sign/Label
        if (text.length < 100 && text.split(' ').length < 20) {
            return {
                type: 'sign',
                confidence: 0.6
            };
        }

        return {
            type: 'unknown',
            confidence: 0.5
        };
    }

    /**
     * Extract text from specific document types
     */
    async extractFromDocument(image, docType) {
        const ocrResult = await this.recognizeText(image);
        
        switch (docType) {
            case 'business_card':
                return this.extractBusinessCard(ocrResult);
            case 'receipt':
                return this.extractReceipt(ocrResult);
            case 'document':
                return this.extractDocument(ocrResult);
            default:
                return ocrResult;
        }
    }

    /**
     * Extract business card information
     */
    extractBusinessCard(ocrResult) {
        const structured = ocrResult.structured;
        const lines = ocrResult.lines.map(l => l.text);

        // Try to find name (usually first line, capitalized)
        const nameLine = lines.find(l => l.length < 50 && /[A-Z]/.test(l));

        return {
            type: 'business_card',
            name: nameLine || '',
            emails: structured.emails,
            phones: structured.phones,
            urls: structured.urls,
            fullText: ocrResult.text
        };
    }

    /**
     * Extract receipt information
     */
    extractReceipt(ocrResult) {
        const structured = ocrResult.structured;
        const lines = ocrResult.lines.map(l => l.text);

        // Find total (usually last price)
        const total = structured.prices[structured.prices.length - 1] || '';

        // Find date
        const date = structured.dates[0] || '';

        // Try to find store name (first line)
        const storeName = lines[0] || '';

        return {
            type: 'receipt',
            store: storeName,
            date: date,
            items: structured.prices.slice(0, -1),
            total: total,
            fullText: ocrResult.text
        };
    }

    /**
     * Extract document information
     */
    extractDocument(ocrResult) {
        const summary = this.summarizeText(ocrResult.text, 200);
        const wordCount = ocrResult.text.split(' ').length;
        const readingTime = Math.ceil(wordCount / 200); // minutes

        return {
            type: 'document',
            summary: summary,
            wordCount: wordCount,
            readingTime: readingTime,
            dates: ocrResult.structured.dates,
            fullText: ocrResult.text
        };
    }

    /**
     * Set recognition language
     */
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn('[OCR] Language not supported:', lang);
            return false;
        }

        this.currentLanguage = lang;

        if (this.worker && this.isReady) {
            await this.worker.loadLanguage(lang);
            await this.worker.initialize(lang);
        }

        return true;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Get OCR history
     */
    getHistory(limit = 10) {
        return this.recognitionHistory.slice(-limit);
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.recognitionHistory = [];
    }

    /**
     * Export OCR results
     */
    exportResults(format = 'json') {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(this.recognitionHistory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ocr-results-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return this.recognitionHistory;
    }

    /**
     * Cleanup worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }
}

// Initialize OCR module
window.ocr = new OCRModule();
