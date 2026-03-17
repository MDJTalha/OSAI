/**
 * Voice Commands Module
 * Hands-free control using voice recognition
 * - Web Speech API integration
 * - Custom command recognition
 * - Voice feedback
 * - Multi-language support
 */

class VoiceCommandsModule {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isEnabled = false;
        this.commands = new Map();
        this.currentLanguage = 'en-US';
        this.callbacks = new Map();
        this.commandHistory = [];
        this.settings = {
            continuous: true,
            interimResults: false,
            autoRestart: true,
            silenceThreshold: 1000,
            confidenceThreshold: 0.7
        };

        this.init();
    }

    async init() {
        this.setupRecognition();
        this.registerDefaultCommands();
        console.log('[VoiceCommands] Module initialized');
    }

    /**
     * Setup speech recognition
     */
    setupRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('[VoiceCommands] Speech recognition not supported');
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();

        // Configure recognition
        this.recognition.continuous = this.settings.continuous;
        this.recognition.interimResults = this.settings.interimResults;
        this.recognition.lang = this.currentLanguage;

        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onend = () => this.onRecognitionEnd();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
    }

    /**
     * Register default voice commands
     */
    registerDefaultCommands() {
        // Measurement commands
        this.registerCommand('measure', () => {
            this.executeCallback('measure');
            this.speak('Starting measurement mode');
        });

        this.registerCommand('start measure', () => {
            this.executeCallback('measure');
            this.speak('Measurement started');
        });

        this.registerCommand('capture', () => {
            this.executeCallback('capture');
            this.speak('Capturing measurement');
        });

        this.registerCommand('take measurement', () => {
            this.executeCallback('capture');
            this.speak('Measurement captured');
        });

        // Counting commands
        this.registerCommand('count', () => {
            this.executeCallback('count');
            this.speak('Starting item detection');
        });

        this.registerCommand('count items', () => {
            this.executeCallback('count');
            this.speak('Counting items');
        });

        this.registerCommand('detect', () => {
            this.executeCallback('count');
            this.speak('Detecting objects');
        });

        this.registerCommand('detect objects', () => {
            this.executeCallback('count');
            this.speak('Object detection started');
        });

        // Calibration commands
        this.registerCommand('calibrate', () => {
            this.executeCallback('calibrate');
            this.speak('Starting calibration');
        });

        this.registerCommand('start calibration', () => {
            this.executeCallback('calibrate');
            this.speak('Calibration mode activated');
        });

        // Camera commands
        this.registerCommand('switch camera', () => {
            this.executeCallback('switchCamera');
            this.speak('Switching camera');
        });

        this.registerCommand('flip camera', () => {
            this.executeCallback('switchCamera');
            this.speak('Camera flipped');
        });

        this.registerCommand('toggle flash', () => {
            this.executeCallback('toggleFlash');
            this.speak('Toggling flash');
        });

        this.registerCommand('flash on', () => {
            this.executeCallback('flashOn');
            this.speak('Flash enabled');
        });

        this.registerCommand('flash off', () => {
            this.executeCallback('flashOff');
            this.speak('Flash disabled');
        });

        // Navigation commands
        this.registerCommand('show results', () => {
            this.executeCallback('showResults');
            this.speak('Showing results');
        });

        this.registerCommand('hide results', () => {
            this.executeCallback('hideResults');
            this.speak('Results hidden');
        });

        this.registerCommand('close results', () => {
            this.executeCallback('hideResults');
            this.speak('Closing results');
        });

        this.registerCommand('show history', () => {
            this.executeCallback('showHistory');
            this.speak('Showing history');
        });

        this.registerCommand('show settings', () => {
            this.executeCallback('showSettings');
            this.speak('Opening settings');
        });

        // Control commands
        this.registerCommand('reset', () => {
            this.executeCallback('reset');
            this.speak('Reset complete');
        });

        this.registerCommand('clear', () => {
            this.executeCallback('reset');
            this.speak('Cleared');
        });

        this.registerCommand('save', () => {
            this.executeCallback('save');
            this.speak('Results saved');
        });

        this.registerCommand('export', () => {
            this.executeCallback('export');
            this.speak('Exporting results');
        });

        this.registerCommand('share', () => {
            this.executeCallback('share');
            this.speak('Sharing results');
        });

        // Voice control commands
        this.registerCommand('voice help', () => {
            this.showVoiceHelp();
            this.speak('Showing voice commands help');
        });

        this.registerCommand('list commands', () => {
            this.showVoiceHelp();
            this.speak('Displaying available commands');
        });

        this.registerCommand('stop listening', () => {
            this.stopListening();
            this.speak('Voice control disabled');
        });

        this.registerCommand('start listening', () => {
            this.startListening();
            this.speak('Voice control enabled');
        });

        // Mode selection
        this.registerCommand('measure mode', () => {
            this.executeCallback('measureMode');
            this.speak('Switched to measure mode');
        });

        this.registerCommand('count same mode', () => {
            this.executeCallback('countSameMode');
            this.speak('Count same mode activated');
        });

        this.registerCommand('count different mode', () => {
            this.executeCallback('countDifferentMode');
            this.speak('Count different mode activated');
        });
    }

    /**
     * Register custom command
     */
    registerCommand(phrase, callback, aliases = []) {
        const command = {
            phrase: phrase.toLowerCase(),
            aliases: aliases.map(a => a.toLowerCase()),
            callback: callback,
            usage: 0
        };

        this.commands.set(phrase.toLowerCase(), command);
        
        aliases.forEach(alias => {
            this.commands.set(alias.toLowerCase(), command);
        });

        console.log(`[VoiceCommands] Registered: "${phrase}"`);
    }

    /**
     * Start listening for voice commands
     */
    startListening() {
        if (!this.isSupported) {
            console.warn('[VoiceCommands] Not supported');
            return false;
        }

        if (this.isListening) {
            console.log('[VoiceCommands] Already listening');
            return true;
        }

        try {
            this.recognition.start();
            this.isEnabled = true;
            return true;
        } catch (error) {
            console.error('[VoiceCommands] Start error:', error);
            return false;
        }
    }

    /**
     * Stop listening for voice commands
     */
    stopListening() {
        if (!this.recognition) return;

        try {
            this.recognition.stop();
            this.isEnabled = false;
        } catch (error) {
            console.error('[VoiceCommands] Stop error:', error);
        }
    }

    /**
     * Toggle listening
     */
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    /**
     * Recognition started
     */
    onRecognitionStart() {
        this.isListening = true;
        console.log('[VoiceCommands] Listening started');
        
        // Notify callbacks
        this.executeCallback('listeningStart');
    }

    /**
     * Recognition ended
     */
    onRecognitionEnd() {
        this.isListening = false;
        console.log('[VoiceCommands] Listening ended');
        
        // Auto-restart if enabled
        if (this.isEnabled && this.settings.autoRestart) {
            setTimeout(() => {
                if (this.isEnabled) {
                    this.recognition.start();
                }
            }, 100);
        }

        // Notify callbacks
        this.executeCallback('listeningEnd');
    }

    /**
     * Recognition result received
     */
    onRecognitionResult(event) {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.trim().toLowerCase();
        const confidence = result[0].confidence;

        console.log(`[VoiceCommands] Heard: "${transcript}" (confidence: ${confidence})`);

        // Check confidence threshold
        if (confidence < this.settings.confidenceThreshold) {
            console.log('[VoiceCommands] Confidence too low');
            return;
        }

        // Find matching command
        const command = this.findCommand(transcript);

        if (command) {
            console.log(`[VoiceCommands] Matched: "${command.phrase}"`);
            command.usage++;
            
            // Add to history
            this.commandHistory.push({
                transcript: transcript,
                command: command.phrase,
                confidence: confidence,
                timestamp: Date.now()
            });

            // Keep history limited
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }

            // Execute command
            command.callback();
        } else {
            console.log('[VoiceCommands] No matching command found');
        }
    }

    /**
     * Recognition error
     */
    onRecognitionError(event) {
        console.error('[VoiceCommands] Error:', event.error);

        if (event.error === 'not-allowed') {
            console.error('[VoiceCommands] Permission denied');
            this.isEnabled = false;
        }
    }

    /**
     * Find matching command from transcript
     */
    findCommand(transcript) {
        // Direct match
        if (this.commands.has(transcript)) {
            return this.commands.get(transcript);
        }

        // Partial match
        for (const [key, command] of this.commands) {
            if (transcript.includes(key) || key.includes(transcript)) {
                return command;
            }
        }

        // Word match (check if all words from command are in transcript)
        for (const [key, command] of this.commands) {
            const commandWords = key.split(' ');
            const allMatch = commandWords.every(word => transcript.includes(word));
            
            if (allMatch) {
                return command;
            }
        }

        return null;
    }

    /**
     * Execute callback for command
     */
    executeCallback(commandName) {
        if (this.callbacks.has(commandName)) {
            this.callbacks.get(commandName)();
        }
    }

    /**
     * Register callback for command
     */
    on(commandName, callback) {
        this.callbacks.set(commandName, callback);
        console.log(`[VoiceCommands] Callback registered for: ${commandName}`);
    }

    /**
     * Speak text using speech synthesis
     */
    speak(text, options = {}) {
        if (!('speechSynthesis' in window)) {
            console.warn('[VoiceCommands] Speech synthesis not supported');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        utterance.lang = options.lang || this.currentLanguage;
        utterance.pitch = options.pitch || 1;
        utterance.rate = options.rate || 1;
        utterance.volume = options.volume || 1;

        // Select voice if specified
        if (options.voice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name.includes(options.voice));
            if (voice) {
                utterance.voice = voice;
            }
        }

        // Event handlers
        utterance.onstart = () => console.log('[VoiceCommands] Speaking:', text);
        utterance.onend = () => console.log('[VoiceCommands] Speech ended');
        utterance.onerror = (event) => console.error('[VoiceCommands] Speech error:', event);

        window.speechSynthesis.speak(utterance);
    }

    /**
     * Show voice commands help
     */
    showVoiceHelp() {
        const helpText = `
🎤 Voice Commands Available:

📐 Measurement:
  • "Measure" - Start measurement
  • "Capture" - Capture measurement
  • "Calibrate" - Start calibration

🔢 Counting:
  • "Count" - Detect items
  • "Count items" - Count objects

📷 Camera:
  • "Switch camera" - Flip camera
  • "Flash on/off" - Toggle flash

📱 Navigation:
  • "Show results" - Display results
  • "Show history" - View history
  • "Show settings" - Open settings

💾 Actions:
  • "Save" - Save results
  • "Export" - Export data
  • "Share" - Share results
  • "Reset" - Reset current

🎤 Control:
  • "Stop listening" - Disable voice
  • "Start listening" - Enable voice
  • "Voice help" - Show this help
`;
        console.log(helpText);
        return helpText;
    }

    /**
     * Get command statistics
     */
    getStatistics() {
        const commands = Array.from(this.commands.values());
        const totalUsage = commands.reduce((sum, c) => sum + c.usage, 0);

        return {
            totalCommands: commands.length,
            totalUsage: totalUsage,
            mostUsed: commands
                .sort((a, b) => b.usage - a.usage)
                .slice(0, 5)
                .map(c => ({ phrase: c.phrase, usage: c.usage })),
            history: this.commandHistory.slice(-10)
        };
    }

    /**
     * Get available commands
     */
    getCommands() {
        return Array.from(this.commands.values())
            .map(c => ({
                phrase: c.phrase,
                aliases: c.aliases,
                usage: c.usage
            }));
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.recognition) {
            this.recognition.continuous = this.settings.continuous;
            this.recognition.interimResults = this.settings.interimResults;
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Check if voice is supported
     */
    isSupported() {
        return this.isSupported && 'SpeechRecognition' in window;
    }
}

// Initialize voice commands module
window.voiceCommands = new VoiceCommandsModule();
