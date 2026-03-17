/**
 * Multi-Modal AI Integration
 * Combines vision, audio, and text for unified understanding
 * 
 * Modalities:
 * - Vision (object detection, OCR, scene understanding)
 * - Audio (voice commands, sound analysis, speech-to-text)
 * - Text (NLP, semantic understanding, context)
 * 
 * Integration:
 * - Cross-modal reasoning
 * - Unified representation
 * - Contextual understanding
 * - Multi-sensory fusion
 */

class MultiModalAI {
    constructor() {
        this.modalities = {
            vision: { active: true, models: [] },
            audio: { active: true, models: [] },
            text: { active: true, models: [] }
        };
        
        this.fusionEngine = new FusionEngine();
        this.crossModalReasoner = new CrossModalReasoner();
        this.contextManager = new ContextManager();
        
        this.unifiedRepresentation = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        console.log('[MultiModalAI] Initializing multi-modal integration...');
        
        // Initialize vision modality
        await this.initializeVision();
        
        // Initialize audio modality
        await this.initializeAudio();
        
        // Initialize text modality
        await this.initializeText();
        
        // Initialize fusion engine
        await this.fusionEngine.init();
        
        this.isInitialized = true;
        console.log('[MultiModalAI] Multi-modal system ready ✓');
    }

    /**
     * Initialize vision modality
     */
    async initializeVision() {
        console.log('[MultiModalAI] Initializing vision modality...');
        
        // Connect to existing vision modules
        this.modalities.vision.models = [
            {
                name: 'object-detection',
                module: window.comprehensiveDetection,
                capabilities: ['objects', 'bounding_boxes', 'confidence']
            },
            {
                name: 'ocr',
                module: window.ocrModule,
                capabilities: ['text_extraction', 'text_location']
            },
            {
                name: 'color-detection',
                module: window.colorDetection,
                capabilities: ['colors', 'palette']
            },
            {
                name: 'scene-understanding',
                module: window.enhancedAI,
                capabilities: ['scene_type', 'context', 'relationships']
            }
        ];
        
        // Filter active modules
        this.modalities.vision.models = this.modalities.vision.models.filter(m => m.module);
        
        console.log('[MultiModalAI] Vision modality ready:', this.modalities.vision.models.length, 'models');
    }

    /**
     * Initialize audio modality
     */
    async initializeAudio() {
        console.log('[MultiModalAI] Initializing audio modality...');
        
        this.modalities.audio.models = [
            {
                name: 'voice-commands',
                module: window.voiceCommands,
                capabilities: ['command_recognition', 'intent']
            },
            {
                name: 'audio-analysis',
                module: window.audioAnalysis,
                capabilities: ['sound_classification', 'ambient_sounds']
            },
            {
                name: 'speech-to-text',
                module: window.speechToText,
                capabilities: ['transcription', 'speaker_id']
            }
        ];
        
        // Filter active modules
        this.modalities.audio.models = this.modalities.audio.models.filter(m => m.module);
        
        console.log('[MultiModalAI] Audio modality ready:', this.modalities.audio.models.length, 'models');
    }

    /**
     * Initialize text modality
     */
    async initializeText() {
        console.log('[MultiModalAI] Initializing text modality...');
        
        this.modalities.text.models = [
            {
                name: 'nlp',
                module: window.nlpModule,
                capabilities: ['semantic_analysis', 'sentiment', 'entities']
            },
            {
                name: 'context-understanding',
                module: window.contextModule,
                capabilities: ['context_extraction', 'topic_modeling']
            }
        ];
        
        // Filter active modules
        this.modalities.text.models = this.modalities.text.models.filter(m => m.module);
        
        console.log('[MultiModalAI] Text modality ready:', this.modalities.text.models.length, 'models');
    }

    /**
     * Process multi-modal input
     */
    async process(input) {
        const { vision, audio, text } = input;
        
        const results = {
            vision: null,
            audio: null,
            text: null,
            fused: null,
            reasoning: null
        };
        
        // Process vision
        if (vision) {
            results.vision = await this.processVision(vision);
        }
        
        // Process audio
        if (audio) {
            results.audio = await this.processAudio(audio);
        }
        
        // Process text
        if (text) {
            results.text = await this.processText(text);
        }
        
        // Fuse modalities
        results.fused = await this.fusionEngine.fuse(results);
        
        // Cross-modal reasoning
        results.reasoning = await this.crossModalReasoner.reason(results.fused);
        
        // Update unified representation
        this.updateUnifiedRepresentation(results);
        
        // Update context
        await this.contextManager.update(results);
        
        return results;
    }

    /**
     * Process vision input
     */
    async processVision(visionInput) {
        const visionResult = {
            objects: [],
            text: [],
            colors: [],
            scene: null,
            timestamp: Date.now()
        };
        
        // Object detection
        if (this.modalities.vision.models.find(m => m.name === 'object-detection')) {
            const detections = await window.comprehensiveDetection?.analyzeItems?.(visionInput.canvas);
            visionResult.objects = detections || [];
        }
        
        // OCR
        if (this.modalities.vision.models.find(m => m.name === 'ocr') && visionInput.image) {
            const ocrResult = await window.ocrModule?.recognize?.(visionInput.image);
            visionResult.text = ocrResult?.text || [];
        }
        
        // Color detection
        if (this.modalities.vision.models.find(m => m.name === 'color-detection') && visionInput.canvas) {
            const colors = await window.colorDetection?.analyzeColors?.(visionInput.canvas);
            visionResult.colors = colors || [];
        }
        
        // Scene understanding
        if (this.modalities.vision.models.find(m => m.name === 'scene-understanding')) {
            visionResult.scene = await this.understandScene(visionInput);
        }
        
        return visionResult;
    }

    /**
     * Process audio input
     */
    async processAudio(audioInput) {
        const audioResult = {
            commands: [],
            sounds: [],
            transcription: null,
            timestamp: Date.now()
        };
        
        // Voice commands
        if (this.modalities.audio.models.find(m => m.name === 'voice-commands')) {
            const commands = await window.voiceCommands?.process?.(audioInput.audioBuffer);
            audioResult.commands = commands || [];
        }
        
        // Sound analysis
        if (this.modalities.audio.models.find(m => m.name === 'audio-analysis')) {
            const sounds = await window.audioAnalysis?.classify?.(audioInput.audioBuffer);
            audioResult.sounds = sounds || [];
        }
        
        // Speech-to-text
        if (this.modalities.audio.models.find(m => m.name === 'speech-to-text')) {
            const transcription = await window.speechToText?.transcribe?.(audioInput.audioBuffer);
            audioResult.transcription = transcription;
        }
        
        return audioResult;
    }

    /**
     * Process text input
     */
    async processText(textInput) {
        const textResult = {
            semantics: null,
            sentiment: null,
            entities: [],
            topics: [],
            timestamp: Date.now()
        };
        
        // NLP analysis
        if (this.modalities.text.models.find(m => m.name === 'nlp')) {
            textResult.semantics = await window.nlpModule?.analyze?.(textInput);
            textResult.sentiment = await window.nlpModule?.sentiment?.(textInput);
            textResult.entities = await window.nlpModule?.extractEntities?.(textInput);
        }
        
        // Context understanding
        if (this.modalities.text.models.find(m => m.name === 'context-understanding')) {
            textResult.topics = await window.contextModule?.extractTopics?.(textInput);
        }
        
        return textResult;
    }

    /**
     * Understand scene context
     */
    async understandScene(visionInput) {
        // Analyze object relationships
        const objects = visionInput.objects || [];
        
        const scene = {
            type: this.classifySceneType(objects),
            objects: objects.length,
            complexity: this.calculateSceneComplexity(objects),
            relationships: this.extractRelationships(objects),
            context: this.inferContext(objects)
        };
        
        return scene;
    }

    /**
     * Classify scene type
     */
    classifySceneType(objects) {
        const classes = objects.map(o => o.class);
        
        if (classes.includes('laptop') || classes.includes('keyboard') || classes.includes('mouse')) {
            return 'office';
        }
        if (classes.includes('cup') || classes.includes('bowl') || classes.includes('spoon')) {
            return 'kitchen';
        }
        if (classes.includes('person') && classes.length > 5) {
            return 'crowd';
        }
        if (classes.includes('car') || classes.includes('truck')) {
            return 'street';
        }
        
        return 'general';
    }

    /**
     * Calculate scene complexity
     */
    calculateSceneComplexity(objects) {
        const objectCount = objects.length;
        const uniqueClasses = new Set(objects.map(o => o.class)).size;
        const avgConfidence = objects.reduce((acc, o) => acc + (o.confidence || 0), 0) / (objectCount || 1);
        
        return {
            objectCount,
            uniqueClasses,
            avgConfidence,
            score: (objectCount * 0.3) + (uniqueClasses * 0.4) + (avgConfidence * 0.3)
        };
    }

    /**
     * Extract object relationships
     */
    extractRelationships(objects) {
        const relationships = [];
        
        // Spatial relationships
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const rel = this.inferRelationship(objects[i], objects[j]);
                if (rel) {
                    relationships.push(rel);
                }
            }
        }
        
        return relationships;
    }

    /**
     * Infer relationship between objects
     */
    inferRelationship(obj1, obj2) {
        const bbox1 = obj1.bbox || obj1.box;
        const bbox2 = obj2.bbox || obj2.box;
        
        if (!bbox1 || !bbox2) return null;
        
        const [x1, y1, w1, h1] = bbox1;
        const [x2, y2, w2, h2] = bbox2;
        
        // Check proximity
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const maxDim = Math.max(w1, h1, w2, h2);
        
        if (distance < maxDim * 2) {
            return {
                object1: obj1.class,
                object2: obj2.class,
                type: 'proximity',
                strength: 1 - (distance / (maxDim * 2))
            };
        }
        
        return null;
    }

    /**
     * Infer context from objects
     */
    inferContext(objects) {
        const classes = objects.map(o => o.class);
        
        // Activity inference
        if (classes.includes('person') && classes.includes('laptop')) {
            return 'working';
        }
        if (classes.includes('cup') && classes.includes('person')) {
            return 'drinking';
        }
        if (classes.includes('book') || classes.includes('laptop')) {
            return 'studying';
        }
        
        return 'general';
    }

    /**
     * Update unified representation
     */
    updateUnifiedRepresentation(results) {
        const key = `scene_${Date.now()}`;
        
        this.unifiedRepresentation.set(key, {
            timestamp: Date.now(),
            vision: results.vision,
            audio: results.audio,
            text: results.text,
            fused: results.fused,
            reasoning: results.reasoning
        });
        
        // Limit size
        if (this.unifiedRepresentation.size > 100) {
            const firstKey = this.unifiedRepresentation.keys().next().value;
            this.unifiedRepresentation.delete(firstKey);
        }
    }

    /**
     * Query unified representation
     */
    query(query) {
        const results = [];
        
        for (const [key, representation] of this.unifiedRepresentation) {
            if (this.matchesQuery(representation, query)) {
                results.push({ key, ...representation });
            }
        }
        
        return results;
    }

    /**
     * Check if representation matches query
     */
    matchesQuery(representation, query) {
        // Simple text matching
        const text = JSON.stringify(representation).toLowerCase();
        return text.includes(query.toLowerCase());
    }

    /**
     * Get multi-modal stats
     */
    getStats() {
        return {
            modalities: {
                vision: {
                    active: this.modalities.vision.active,
                    models: this.modalities.vision.models.length
                },
                audio: {
                    active: this.modalities.audio.active,
                    models: this.modalities.audio.models.length
                },
                text: {
                    active: this.modalities.text.active,
                    models: this.modalities.text.models.length
                }
            },
            unifiedRepresentations: this.unifiedRepresentation.size,
            contextHistory: this.contextManager.history.length
        };
    }
}

/**
 * Fusion Engine
 * Combines information from multiple modalities
 */
class FusionEngine {
    constructor() {
        this.fusionStrategies = [
            'early_fusion',    // Combine raw features
            'late_fusion',     // Combine decisions
            'hybrid_fusion'    // Combine both
        ];
        
        this.currentStrategy = 'hybrid_fusion';
    }

    async init() {
        console.log('[FusionEngine] Initialized');
    }

    /**
     * Fuse multi-modal results
     */
    async fuse(results) {
        switch (this.currentStrategy) {
            case 'early_fusion':
                return this.earlyFusion(results);
            case 'late_fusion':
                return this.lateFusion(results);
            case 'hybrid_fusion':
                return this.hybridFusion(results);
            default:
                return results;
        }
    }

    /**
     * Early fusion - combine raw features
     */
    earlyFusion(results) {
        const fused = {
            features: [],
            confidence: 0,
            timestamp: Date.now()
        };
        
        // Extract features from each modality
        if (results.vision) {
            fused.features.push({
                modality: 'vision',
                objects: results.vision.objects,
                text: results.vision.text,
                colors: results.vision.colors
            });
        }
        
        if (results.audio) {
            fused.features.push({
                modality: 'audio',
                commands: results.audio.commands,
                sounds: results.audio.sounds,
                transcription: results.audio.transcription
            });
        }
        
        if (results.text) {
            fused.features.push({
                modality: 'text',
                semantics: results.text.semantics,
                entities: results.text.entities
            });
        }
        
        // Calculate combined confidence
        const confidences = [];
        if (results.vision) confidences.push(results.vision.objects?.length || 0);
        if (results.audio) confidences.push(results.audio.commands?.length || 0);
        if (results.text) confidences.push(results.text.entities?.length || 0);
        
        fused.confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length || 0;
        
        return fused;
    }

    /**
     * Late fusion - combine decisions
     */
    lateFusion(results) {
        const decisions = [];
        
        // Get decisions from each modality
        if (results.vision?.scene) {
            decisions.push({
                modality: 'vision',
                decision: results.vision.scene.type,
                confidence: results.vision.scene.complexity?.avgConfidence || 0
            });
        }
        
        if (results.audio?.commands?.length > 0) {
            decisions.push({
                modality: 'audio',
                decision: results.audio.commands[0].intent,
                confidence: results.audio.commands[0].confidence || 0
            });
        }
        
        if (results.text?.sentiment) {
            decisions.push({
                modality: 'text',
                decision: results.text.sentiment.label,
                confidence: results.text.sentiment.score || 0
            });
        }
        
        // Weighted voting
        const weightedDecision = this.weightedVote(decisions);
        
        return {
            decision: weightedDecision,
            decisions: decisions,
            timestamp: Date.now()
        };
    }

    /**
     * Hybrid fusion - combine both
     */
    hybridFusion(results) {
        const early = this.earlyFusion(results);
        const late = this.lateFusion(results);
        
        return {
            ...early,
            ...late,
            strategy: 'hybrid',
            timestamp: Date.now()
        };
    }

    /**
     * Weighted voting
     */
    weightedVote(decisions) {
        if (decisions.length === 0) return null;
        
        const votes = {};
        let totalWeight = 0;
        
        for (const decision of decisions) {
            const weight = decision.confidence;
            votes[decision.decision] = (votes[decision.decision] || 0) + weight;
            totalWeight += weight;
        }
        
        // Get decision with highest weight
        let maxWeight = 0;
        let bestDecision = null;
        
        for (const [decision, weight] of Object.entries(votes)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                bestDecision = decision;
            }
        }
        
        return {
            decision: bestDecision,
            confidence: maxWeight / totalWeight,
            votes: votes
        };
    }
}

/**
 * Cross-Modal Reasoner
 * Performs reasoning across modalities
 */
class CrossModalReasoner {
    constructor() {
        this.reasoningRules = [
            'consistency_check',
            'contradiction_detection',
            'complementarity',
            'temporal_reasoning'
        ];
    }

    /**
     * Perform cross-modal reasoning
     */
    async reason(fusedData) {
        const reasoning = {
            consistent: true,
            contradictions: [],
            complementarities: [],
            inferences: []
        };
        
        // Check consistency
        reasoning.consistent = this.checkConsistency(fusedData);
        
        // Detect contradictions
        reasoning.contradictions = this.detectContradictions(fusedData);
        
        // Find complementarities
        reasoning.complementarities = this.findComplementarities(fusedData);
        
        // Make inferences
        reasoning.inferences = this.makeInferences(fusedData);
        
        return reasoning;
    }

    /**
     * Check consistency across modalities
     */
    checkConsistency(fusedData) {
        // Example: Check if audio and vision agree on activity
        const visionContext = fusedData.vision?.scene?.context;
        const audioCommand = fusedData.audio?.commands?.[0]?.intent;
        
        if (visionContext && audioCommand) {
            return this.contextsAgree(visionContext, audioCommand);
        }
        
        return true; // No conflict if only one modality present
    }

    /**
     * Detect contradictions
     */
    detectContradictions(fusedData) {
        const contradictions = [];
        
        // Example contradiction: Vision says "office" but audio says "outdoor sounds"
        const visionScene = fusedData.vision?.scene?.type;
        const audioSounds = fusedData.audio?.sounds;
        
        if (visionScene === 'office' && audioSounds?.some(s => s.type === 'outdoor')) {
            contradictions.push({
                type: 'scene_audio_mismatch',
                vision: visionScene,
                audio: audioSounds
            });
        }
        
        return contradictions;
    }

    /**
     * Find complementarities
     */
    findComplementarities(fusedData) {
        const complementarities = [];
        
        // Example: Vision detects person, audio detects speech → conversation
        const hasPerson = fusedData.vision?.objects?.some(o => o.class === 'person');
        const hasSpeech = fusedData.audio?.transcription !== null;
        
        if (hasPerson && hasSpeech) {
            complementarities.push({
                type: 'conversation_detected',
                vision: 'person',
                audio: 'speech',
                inference: 'conversation'
            });
        }
        
        return complementarities;
    }

    /**
     * Make inferences
     */
    makeInferences(fusedData) {
        const inferences = [];
        
        // Example inference: Multiple people + voices → meeting
        const peopleCount = fusedData.vision?.objects?.filter(o => o.class === 'person').length || 0;
        const hasVoices = fusedData.audio?.transcription !== null;
        
        if (peopleCount >= 3 && hasVoices) {
            inferences.push({
                type: 'meeting',
                confidence: Math.min(1, peopleCount / 10 + 0.5),
                evidence: [`${peopleCount} people`, 'voices detected']
            });
        }
        
        return inferences;
    }

    /**
     * Check if contexts agree
     */
    contextsAgree(visionContext, audioCommand) {
        const compatible = {
            'working': ['search', 'open', 'type'],
            'drinking': ['pour', 'drink'],
            'studying': ['search', 'read', 'open'],
            'general': ['search', 'open', 'close']
        };
        
        const compatibleCommands = compatible[visionContext] || compatible['general'];
        return compatibleCommands.includes(audioCommand);
    }
}

/**
 * Context Manager
 * Maintains contextual understanding over time
 */
class ContextManager {
    constructor() {
        this.history = [];
        this.currentContext = null;
        this.maxHistory = 100;
    }

    /**
     * Update context
     */
    async update(results) {
        const context = {
            timestamp: Date.now(),
            scene: results.fused?.decision?.decision,
            objects: results.vision?.objects?.map(o => o.class) || [],
            activities: results.reasoning?.inferences?.map(i => i.type) || [],
            confidence: results.fused?.confidence || 0
        };
        
        this.history.push(context);
        
        // Limit history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // Update current context
        this.currentContext = context;
        
        return context;
    }

    /**
     * Get context trend
     */
    getTrend() {
        if (this.history.length < 5) return 'insufficient_data';
        
        const recent = this.history.slice(-5);
        const scenes = recent.map(c => c.scene).filter(Boolean);
        
        if (scenes.length === 0) return 'unknown';
        
        const mode = scenes.sort((a, b) =>
            scenes.filter(v => v === a).length - scenes.filter(v => v === b).length
        ).pop();
        
        return mode;
    }
}

// Initialize global multi-modal AI
window.multiModalAI = new MultiModalAI();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiModalAI;
}
