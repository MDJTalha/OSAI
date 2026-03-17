/**
 * AI Explanation Engine
 * Explain objects, scenes, and concepts
 * - Object explanations
 * - Scene understanding
 * - Context-aware descriptions
 * - Educational content
 */

class AIExplanationEngine {
    constructor() {
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.explanationHistory = [];
        this.settings = {
            detailLevel: 'medium', // simple, medium, detailed
            includeFunFacts: true,
            maxLength: 500
        };

        this.init();
    }

    async init() {
        console.log('[AIExplanation] Engine initialized');
    }

    /**
     * Initialize knowledge base with object information
     */
    initializeKnowledgeBase() {
        return {
            // Electronics
            'phone': {
                category: 'Electronics',
                description: 'A smartphone is a portable computer device that connects to a cellular network.',
                uses: ['Communication', 'Internet browsing', 'Photography', 'Navigation'],
                funFact: 'The first smartphone was invented in 1992 by IBM.',
                related: ['tablet', 'laptop', 'computer']
            },
            'laptop': {
                category: 'Electronics',
                description: 'A laptop is a portable personal computer with a clamshell form factor.',
                uses: ['Work', 'Entertainment', 'Education', 'Communication'],
                funFact: 'The first laptop was released in 1981 and weighed 24 pounds.',
                related: ['computer', 'tablet', 'keyboard']
            },
            'keyboard': {
                category: 'Electronics',
                description: 'A keyboard is an input device that allows you to type text and commands.',
                uses: ['Typing', 'Gaming', 'Data entry'],
                funFact: 'The QWERTY keyboard layout was designed to prevent typewriter jams.',
                related: ['mouse', 'computer', 'laptop']
            },

            // Furniture
            'chair': {
                category: 'Furniture',
                description: 'A chair is a piece of furniture designed for sitting, typically with a back and four legs.',
                uses: ['Sitting', 'Resting', 'Working'],
                funFact: 'The oldest known chair dates back to ancient Egypt around 2600 BC.',
                related: ['table', 'desk', 'sofa']
            },
            'table': {
                category: 'Furniture',
                description: 'A table is a flat surface supported by legs, used for eating, working, or placing objects.',
                uses: ['Dining', 'Working', 'Display'],
                funFact: 'The word "table" comes from the Latin "tabula" meaning a flat board.',
                related: ['chair', 'desk', 'furniture']
            },
            'bed': {
                category: 'Furniture',
                description: 'A bed is a piece of furniture for sleeping or resting.',
                uses: ['Sleeping', 'Resting', 'Relaxing'],
                funFact: 'Humans spend about one-third of their lives in bed.',
                related: ['pillow', 'blanket', 'bedroom']
            },

            // Kitchen items
            'cup': {
                category: 'Kitchen',
                description: 'A cup is a small container used for drinking liquids.',
                uses: ['Drinking', 'Measuring', 'Decoration'],
                funFact: 'The world\'s largest cup holds over 2,000 liters.',
                related: ['mug', 'glass', 'bowl']
            },
            'bowl': {
                category: 'Kitchen',
                description: 'A bowl is a round, deep dish used for holding food or liquids.',
                uses: ['Eating', 'Serving', 'Mixing'],
                funFact: 'Bowls have been used since ancient times, with the earliest made of wood or clay.',
                related: ['plate', 'cup', 'spoon']
            },
            'spoon': {
                category: 'Kitchen',
                description: 'A spoon is a utensil consisting of a shallow bowl on a handle, used for eating or stirring.',
                uses: ['Eating', 'Stirring', 'Serving'],
                funFact: 'The word "spoon" comes from the Old English "spōn" meaning chip of wood.',
                related: ['fork', 'knife', 'bowl']
            },

            // Office supplies
            'pen': {
                category: 'Office',
                description: 'A pen is a writing instrument that uses ink to leave marks on surfaces.',
                uses: ['Writing', 'Drawing', 'Signing'],
                funFact: 'The ballpoint pen was invented in 1888 but became popular in the 1940s.',
                related: ['pencil', 'paper', 'notebook']
            },
            'book': {
                category: 'Office',
                description: 'A book is a set of written or printed pages bound together.',
                uses: ['Reading', 'Learning', 'Reference'],
                funFact: 'The world\'s oldest known book is the Epic of Gilgamesh from around 2100 BC.',
                related: ['paper', 'library', 'reading']
            },

            // Common objects
            'credit card': {
                category: 'Finance',
                description: 'A credit card is a payment card that allows the holder to borrow funds for purchases.',
                uses: ['Payment', 'Online shopping', 'Building credit'],
                funFact: 'The first credit card was introduced by Diners Club in 1950.',
                related: ['debit card', 'payment', 'bank']
            },
            'coin': {
                category: 'Finance',
                description: 'A coin is a small, flat piece of metal used as money.',
                uses: ['Payment', 'Collecting', 'Making change'],
                funFact: 'Coins were first used in ancient Lydia (modern Turkey) around 600 BC.',
                related: ['money', 'currency', 'cash']
            },

            // Materials
            'wood': {
                category: 'Material',
                description: 'Wood is a natural material from trees, used for construction and furniture.',
                properties: ['Durable', 'Renewable', 'Insulating'],
                uses: ['Construction', 'Furniture', 'Paper production'],
                funFact: 'Wood can float because it is less dense than water.',
                related: ['tree', 'furniture', 'paper']
            },
            'metal': {
                category: 'Material',
                description: 'Metal is a hard, shiny material that conducts heat and electricity.',
                properties: ['Strong', 'Conductive', 'Malleable'],
                uses: ['Construction', 'Manufacturing', 'Electronics'],
                funFact: 'Mercury is the only metal that is liquid at room temperature.',
                related: ['steel', 'iron', 'aluminum']
            },
            'plastic': {
                category: 'Material',
                description: 'Plastic is a synthetic material made from polymers, versatile and lightweight.',
                properties: ['Lightweight', 'Durable', 'Moldable'],
                uses: ['Packaging', 'Manufacturing', 'Consumer goods'],
                funFact: 'Plastic was first invented in 1907 as Bakelite.',
                related: ['polymer', 'recycling', 'synthetic']
            },
            'glass': {
                category: 'Material',
                description: 'Glass is a transparent, hard material made from melted sand.',
                properties: ['Transparent', 'Brittle', 'Recyclable'],
                uses: ['Windows', 'Containers', 'Optics'],
                funFact: 'Glass can be recycled infinitely without losing quality.',
                related: ['window', 'bottle', 'transparent']
            }
        };
    }

    /**
     * Explain detected object
     */
    async explainObject(detection) {
        const objectClass = (detection.class || 'unknown').toLowerCase();
        
        // Find matching knowledge
        let knowledge = this.findKnowledge(objectClass);
        
        if (!knowledge) {
            knowledge = this.generateGenericExplanation(detection);
        }

        const explanation = {
            object: detection.class || 'Unknown Object',
            category: knowledge.category || 'Unknown',
            description: this.formatDescription(knowledge.description, this.settings.detailLevel),
            uses: knowledge.uses || [],
            properties: knowledge.properties || [],
            funFact: this.settings.includeFunFacts ? knowledge.funFact : null,
            related: knowledge.related || [],
            confidence: detection.confidence || 0,
            context: this.inferContext(detection)
        };

        // Save to history
        this.explanationHistory.push(explanation);
        if (this.explanationHistory.length > 50) {
            this.explanationHistory.shift();
        }

        return explanation;
    }

    /**
     * Find knowledge for object
     */
    findKnowledge(objectClass) {
        // Direct match
        if (this.knowledgeBase[objectClass]) {
            return this.knowledgeBase[objectClass];
        }

        // Partial match
        for (const [key, knowledge] of Object.entries(this.knowledgeBase)) {
            if (objectClass.includes(key) || key.includes(objectClass)) {
                return knowledge;
            }
        }

        return null;
    }

    /**
     * Generate generic explanation for unknown objects
     */
    generateGenericExplanation(detection) {
        const { class: objectClass, confidence, bbox } = detection;
        
        const size = bbox ? this.estimateSize(bbox) : 'unknown';
        
        return {
            category: 'Unknown Object',
            description: `This appears to be a ${objectClass || 'common object'}. Based on its appearance, it may be used in everyday situations.`,
            uses: ['General purpose'],
            properties: [`Size: ${size}`],
            funFact: `This object was detected with ${Math.round(confidence * 100)}% confidence.`,
            related: []
        };
    }

    /**
     * Estimate object size from bounding box
     */
    estimateSize(bbox) {
        const [x, y, w, h] = bbox;
        const area = w * h;
        
        if (area < 1000) return 'Small (palm-sized)';
        if (area < 5000) return 'Medium (hand-sized)';
        if (area < 20000) return 'Large';
        return 'Very Large';
    }

    /**
     * Format description based on detail level
     */
    formatDescription(description, level) {
        if (level === 'simple') {
            return description.split('.')[0] + '.';
        }
        
        if (level === 'detailed') {
            return description + ' This item is commonly found in homes, offices, or commercial settings.';
        }
        
        return description;
    }

    /**
     * Infer context from detection
     */
    inferContext(detection) {
        const context = {
            location: 'unknown',
            purpose: 'unknown',
            importance: 'normal'
        };

        // Infer from object class
        const objectClass = (detection.class || '').toLowerCase();
        
        if (['phone', 'laptop', 'keyboard', 'mouse'].includes(objectClass)) {
            context.location = 'workspace';
            context.purpose = 'work or communication';
        } else if (['cup', 'bowl', 'spoon', 'fork'].includes(objectClass)) {
            context.location = 'kitchen or dining area';
            context.purpose = 'eating or food preparation';
        } else if (['chair', 'table', 'bed', 'sofa'].includes(objectClass)) {
            context.location = 'living space';
            context.purpose = 'comfort or seating';
        } else if (['book', 'pen', 'notebook'].includes(objectClass)) {
            context.location = 'study or office';
            context.purpose = 'learning or work';
        }

        return context;
    }

    /**
     * Explain entire scene
     */
    async explainScene(objects) {
        if (!objects || objects.length === 0) {
            return {
                summary: 'No objects detected in the scene.',
                objects: [],
                context: 'empty',
                activities: []
            };
        }

        const explanations = [];
        const categories = new Set();
        const contexts = [];

        for (const obj of objects) {
            const explanation = await this.explainObject(obj);
            explanations.push(explanation);
            
            if (explanation.category) {
                categories.add(explanation.category);
            }
            
            if (explanation.context?.location) {
                contexts.push(explanation.context.location);
            }
        }

        // Find most common context
        const contextCount = {};
        contexts.forEach(c => {
            contextCount[c] = (contextCount[c] || 0) + 1;
        });
        
        const primaryContext = Object.keys(contextCount).sort((a, b) => contextCount[b] - contextCount[a])[0] || 'mixed';

        return {
            summary: this.generateSceneSummary(objects, categories, primaryContext),
            objectCount: objects.length,
            categories: Array.from(categories),
            objects: explanations,
            context: primaryContext,
            activities: this.inferActivities(objects),
            timestamp: Date.now()
        };
    }

    /**
     * Generate scene summary
     */
    generateSceneSummary(objects, categories, context) {
        const objectList = objects.slice(0, 5).map(o => o.class || 'object').join(', ');
        const categoryList = Array.from(categories).slice(0, 3).join(', ');
        
        return `Detected ${objects.length} objects including ${objectList}. ` +
               `Scene appears to be ${context} with ${categoryList} items.`;
    }

    /**
     * Infer activities from objects
     */
    inferActivities(objects) {
        const activities = [];
        const objectClasses = objects.map(o => (o.class || '').toLowerCase());

        if (objectClasses.some(c => ['laptop', 'keyboard', 'mouse'].includes(c))) {
            activities.push('Working on computer');
        }

        if (objectClasses.some(c => ['cup', 'bowl', 'spoon'].includes(c))) {
            activities.push('Eating or drinking');
        }

        if (objectClasses.some(c => ['book', 'pen', 'notebook'].includes(c))) {
            activities.push('Studying or writing');
        }

        if (objectClasses.some(c => ['phone'].includes(c))) {
            activities.push('Communication');
        }

        return activities;
    }

    /**
     * Answer questions about object
     */
    async answerQuestion(object, question) {
        const knowledge = this.findKnowledge((object.class || '').toLowerCase());
        
        if (!knowledge) {
            return "I don't have specific information about this object.";
        }

        const q = question.toLowerCase();
        
        if (q.includes('what') && q.includes('use')) {
            return `This ${object.class} is used for: ${knowledge.uses.join(', ')}.`;
        }
        
        if (q.includes('what') && q.includes('category')) {
            return `This belongs to the ${knowledge.category} category.`;
        }
        
        if (q.includes('fun fact') || q.includes('interesting')) {
            return knowledge.funFact || 'No fun facts available for this item.';
        }
        
        if (q.includes('related') || q.includes('similar')) {
            return `Related items include: ${knowledge.related.join(', ')}.`;
        }

        // Default: return description
        return knowledge.description;
    }

    /**
     * Set explanation settings
     */
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Get explanation history
     */
    getHistory(limit = 10) {
        return this.explanationHistory.slice(-limit);
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.explanationHistory = [];
    }

    /**
     * Add custom knowledge
     */
    addKnowledge(objectClass, knowledge) {
        this.knowledgeBase[objectClass.toLowerCase()] = knowledge;
        console.log(`[AIExplanation] Added knowledge for: ${objectClass}`);
    }

    /**
     * Export explanations
     */
    exportExplanations(format = 'json') {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(this.explanationHistory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `explanations-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return this.explanationHistory;
    }
}

// Initialize AI explanation engine
window.aiExplanation = new AIExplanationEngine();
