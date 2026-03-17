/**
 * Visual Memory & Knowledge Graph Module
 * AI brain memory system for remembering and reasoning
 * - Visual memory storage
 * - Change detection over time
 * - Knowledge graph relationships
 * - Reasoning engine
 */

class VisualMemoryModule {
    constructor() {
        this.memoryPalace = new Map(); // Store memories by location
        this.objectMemories = new Map(); // Store object memories
        this.knowledgeGraph = new Map(); // Store relationships
        this.temporalMemories = new Map(); // Time-based memories
        this.settings = {
            maxMemoriesPerLocation: 100,
            memoryDecayDays: 30,
            confidenceThreshold: 0.7
        };

        this.init();
    }

    async init() {
        this.loadMemories();
        this.initializeKnowledgeGraph();
        console.log('[VisualMemory] Module initialized');
    }

    // ========================================
    // VISUAL MEMORY SYSTEM
    // ========================================

    /**
     * Store visual memory of a scene
     */
    async storeMemory(locationId, sceneData) {
        const memory = {
            id: this.generateId(),
            locationId: locationId,
            timestamp: Date.now(),
            objects: sceneData.objects || [],
            layout: sceneData.layout || null,
            image: sceneData.image || null, // Compressed thumbnail
            metadata: {
                lighting: sceneData.lighting,
                camera: sceneData.camera,
                confidence: sceneData.confidence
            }
        };

        // Get or create location memory
        let locationMemory = this.memoryPalace.get(locationId);
        
        if (!locationMemory) {
            locationMemory = {
                locationId: locationId,
                name: sceneData.locationName || 'Unknown Location',
                memories: [],
                firstVisit: memory.timestamp,
                lastVisit: memory.timestamp,
                visitCount: 0
            };
            this.memoryPalace.set(locationId, locationMemory);
        }

        // Add memory
        locationMemory.memories.push(memory);
        locationMemory.lastVisit = memory.timestamp;
        locationMemory.visitCount++;

        // Limit memories
        if (locationMemory.memories.length > this.settings.maxMemoriesPerLocation) {
            locationMemory.memories.shift();
        }

        // Store individual object memories
        memory.objects.forEach(obj => {
            this.storeObjectMemory(locationId, obj);
        });

        // Update temporal memories
        this.updateTemporalMemory(locationId, memory);

        this.saveMemories();
        console.log(`[VisualMemory] Stored memory for ${locationId}`);

        return memory;
    }

    /**
     * Store individual object memory
     */
    storeObjectMemory(locationId, object) {
        const key = `${locationId}_${object.class || 'unknown'}`;
        
        let objectMemory = this.objectMemories.get(key);
        
        if (!objectMemory) {
            objectMemory = {
                locationId: locationId,
                objectClass: object.class || 'unknown',
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                sightings: [],
                positions: [],
                stable: false
            };
            this.objectMemories.set(key, objectMemory);
        }

        objectMemory.lastSeen = Date.now();
        objectMemory.sightings.push({
            timestamp: Date.now(),
            bbox: object.bbox,
            confidence: object.confidence
        });

        if (object.bbox) {
            objectMemory.positions.push(object.bbox);
        }

        // Object is stable if seen multiple times in similar position
        if (objectMemory.sightings.length >= 3) {
            objectMemory.stable = true;
        }

        // Limit sightings
        if (objectMemory.sightings.length > 50) {
            objectMemory.sightings.shift();
        }
    }

    /**
     * Update temporal memory for change detection
     */
    updateTemporalMemory(locationId, memory) {
        let temporal = this.temporalMemories.get(locationId);
        
        if (!temporal) {
            temporal = {
                locationId: locationId,
                timeline: [],
                changes: []
            };
            this.temporalMemories.set(locationId, temporal);
        }

        temporal.timeline.push({
            timestamp: memory.timestamp,
            objectCount: memory.objects.length,
            objects: memory.objects.map(o => o.class || 'unknown')
        });

        // Detect changes from previous memory
        if (temporal.timeline.length > 1) {
            const previous = temporal.timeline[temporal.timeline.length - 2];
            const changes = this.detectChanges(previous, memory);
            
            if (changes.length > 0) {
                temporal.changes.push(...changes);
            }
        }
    }

    /**
     * Detect changes between memories
     */
    detectChanges(previous, current) {
        const changes = [];
        const prevObjects = new Set(previous.objects);
        const currObjects = new Set(current.objects);

        // New objects
        currObjects.forEach(obj => {
            if (!prevObjects.has(obj)) {
                changes.push({
                    type: 'added',
                    object: obj,
                    timestamp: current.timestamp,
                    confidence: 0.8
                });
            }
        });

        // Removed objects
        prevObjects.forEach(obj => {
            if (!currObjects.has(obj)) {
                changes.push({
                    type: 'removed',
                    object: obj,
                    timestamp: current.timestamp,
                    confidence: 0.8
                });
            }
        });

        return changes;
    }

    /**
     * Query memory for location
     */
    queryMemory(locationId, options = {}) {
        const locationMemory = this.memoryPalace.get(locationId);
        
        if (!locationMemory) {
            return null;
        }

        const {
            timeRange = null,
            objectClass = null,
            limit = 10
        } = options;

        let memories = locationMemory.memories;

        // Filter by time
        if (timeRange) {
            memories = memories.filter(m => 
                m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
            );
        }

        // Filter by object class
        if (objectClass) {
            memories = memories.filter(m =>
                m.objects.some(o => o.class === objectClass)
            );
        }

        return {
            location: locationMemory,
            memories: memories.slice(-limit),
            objectMemories: this.getObjectMemories(locationId)
        };
    }

    /**
     * Get object memories for location
     */
    getObjectMemories(locationId) {
        const objects = [];
        
        this.objectMemories.forEach((memory, key) => {
            if (key.startsWith(locationId)) {
                objects.push({
                    class: memory.objectClass,
                    firstSeen: memory.firstSeen,
                    lastSeen: memory.lastSeen,
                    stable: memory.stable,
                    sightingCount: memory.sightings.length
                });
            }
        });

        return objects;
    }

    /**
     * Compare current scene with memory
     */
    compareWithMemory(locationId, currentObjects) {
        const query = this.queryMemory(locationId, { limit: 1 });
        
        if (!query || query.memories.length === 0) {
            return {
                isNewLocation: true,
                changes: [],
                newObjects: currentObjects.map(o => o.class)
            };
        }

        const lastMemory = query.memories[query.memories.length - 1];
        const rememberedObjects = new Set(
            lastMemory.objects.map(o => o.class || 'unknown')
        );

        const currentClasses = currentObjects.map(o => o.class || 'unknown');
        const currentSet = new Set(currentClasses);

        const newObjects = currentClasses.filter(c => !rememberedObjects.has(c));
        const removedObjects = [...rememberedObjects].filter(c => !currentSet.has(c));

        return {
            isNewLocation: false,
            lastVisit: lastMemory.timestamp,
            changes: {
                newObjects: newObjects,
                removedObjects: removedObjects,
                unchanged: currentClasses.filter(c => rememberedObjects.has(c))
            },
            summary: this.generateChangeSummary(newObjects, removedObjects)
        };
    }

    /**
     * Generate human-readable change summary
     */
    generateChangeSummary(newObjects, removedObjects) {
        const parts = [];

        if (newObjects.length > 0) {
            parts.push(`${newObjects.length} new object(s): ${newObjects.join(', ')}`);
        }

        if (removedObjects.length > 0) {
            parts.push(`${removedObjects.length} object(s) removed: ${removedObjects.join(', ')}`);
        }

        if (parts.length === 0) {
            return 'No significant changes detected';
        }

        return parts.join('. ');
    }

    // ========================================
    // KNOWLEDGE GRAPH SYSTEM
    // ========================================

    /**
     * Initialize base knowledge graph
     */
    initializeKnowledgeGraph() {
        // Basic ontology
        const ontology = {
            // Physical objects
            'object': {
                parent: null,
                children: ['physical_object', 'abstract_concept']
            },
            'physical_object': {
                parent: 'object',
                children: ['animate', 'inanimate']
            },
            'animate': {
                parent: 'physical_object',
                children: ['person', 'animal']
            },
            'inanimate': {
                parent: 'physical_object',
                children: ['furniture', 'electronics', 'vehicle', 'tool', 'food']
            },
            
            // Furniture
            'furniture': {
                parent: 'inanimate',
                children: ['chair', 'table', 'desk', 'bed', 'sofa', 'shelf']
            },
            
            // Electronics
            'electronics': {
                parent: 'inanimate',
                children: ['phone', 'laptop', 'computer', 'tv', 'tablet']
            },

            // Relationships
            'relationships': {
                'on': ['supported_by'],
                'in': ['contained_by'],
                'under': ['below'],
                'next_to': ['adjacent'],
                'near': ['proximate']
            }
        };

        Object.entries(ontology).forEach(([key, data]) => {
            this.knowledgeGraph.set(key, {
                type: 'concept',
                ...data
            });
        });

        console.log('[VisualMemory] Knowledge graph initialized');
    }

    /**
     * Add relationship to knowledge graph
     */
    addRelationship(subject, predicate, object) {
        const key = `${subject}_${predicate}_${object}`;
        
        this.knowledgeGraph.set(key, {
            type: 'relationship',
            subject: subject,
            predicate: predicate,
            object: object,
            confidence: 1.0,
            timestamp: Date.now()
        });

        this.saveMemories();
    }

    /**
     * Query knowledge graph
     */
    queryKnowledgeGraph(subject = null, predicate = null, object = null) {
        const results = [];

        this.knowledgeGraph.forEach((node, key) => {
            if (node.type !== 'relationship') return;

            if (subject && node.subject !== subject) return;
            if (predicate && node.predicate !== predicate) return;
            if (object && node.object !== object) return;

            results.push(node);
        });

        return results;
    }

    /**
     * Get object relationships
     */
    getObjectRelationships(objectName) {
        const relationships = {
            incoming: [], // Relationships where object is the target
            outgoing: []  // Relationships where object is the source
        };

        this.knowledgeGraph.forEach((node, key) => {
            if (node.type !== 'relationship') return;

            if (node.object === objectName) {
                relationships.incoming.push({
                    subject: node.subject,
                    predicate: node.predicate
                });
            }

            if (node.subject === objectName) {
                relationships.outgoing.push({
                    predicate: node.predicate,
                    object: node.object
                });
            }
        });

        return relationships;
    }

    /**
     * Infer new relationships
     */
    inferRelationships(objects) {
        const inferences = [];

        // Spatial reasoning
        objects.forEach((obj1, i) => {
            objects.forEach((obj2, j) => {
                if (i >= j) return;

                const relationship = this.inferSpatialRelationship(obj1, obj2);
                
                if (relationship) {
                    inferences.push(relationship);
                    this.addRelationship(obj1.class, relationship.predicate, obj2.class);
                }
            });
        });

        return inferences;
    }

    /**
     * Infer spatial relationship between two objects
     */
    inferSpatialRelationship(obj1, obj2) {
        if (!obj1.bbox || !obj2.bbox) return null;

        const [x1, y1, w1, h1] = obj1.bbox;
        const [x2, y2, w2, h2] = obj2.bbox;

        const center1 = { x: x1 + w1/2, y: y1 + h1/2 };
        const center2 = { x: x2 + w2/2, y: y2 + h2/2 };

        // Check if obj1 is on obj2 (obj1 below obj2 in image = on top in 3D)
        if (Math.abs(center1.x - center2.x) < 50 && center1.y > center2.y + h2/2) {
            return {
                subject: obj1.class,
                predicate: 'on',
                object: obj2.class,
                confidence: 0.8
            };
        }

        // Check if obj1 is in obj2
        if (x1 > x2 && y1 > y2 && x1 + w1 < x2 + w2 && y1 + h1 < y2 + h2) {
            return {
                subject: obj1.class,
                predicate: 'in',
                object: obj2.class,
                confidence: 0.9
            };
        }

        // Check if obj1 is next to obj2
        const horizontalDist = Math.abs(center1.x - center2.x);
        const verticalDist = Math.abs(center1.y - center2.y);

        if (verticalDist < 50 && horizontalDist > 100) {
            return {
                subject: obj1.class,
                predicate: 'next_to',
                object: obj2.class,
                confidence: 0.7
            };
        }

        return null;
    }

    /**
     * Reason about scene
     */
    reasonAboutScene(objects) {
        const reasoning = {
            objects: objects.map(o => o.class),
            relationships: this.inferRelationships(objects),
            categories: this.categorizeObjects(objects),
            summary: this.generateSceneSummary(objects)
        };

        return reasoning;
    }

    /**
     * Categorize objects in scene
     */
    categorizeObjects(objects) {
        const categories = {};

        objects.forEach(obj => {
            const category = this.getCategory(obj.class);
            
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push(obj.class);
        });

        return categories;
    }

    /**
     * Get category for object
     */
    getCategory(objectName) {
        let current = objectName;
        let depth = 0;

        while (depth < 5) {
            const node = this.knowledgeGraph.get(current);
            
            if (!node || !node.parent) {
                return current;
            }

            current = node.parent;
            depth++;
        }

        return current;
    }

    /**
     * Generate scene summary
     */
    generateSceneSummary(objects) {
        const categories = this.categorizeObjects(objects);
        
        const parts = Object.entries(categories).map(([category, items]) => {
            const uniqueItems = [...new Set(items)];
            return `${uniqueItems.length} ${category}(s)`;
        });

        return `Scene contains: ${parts.join(', ')}`;
    }

    // ========================================
    // PERSISTENCE
    // ========================================

    /**
     * Save memories to localStorage
     */
    saveMemories() {
        try {
            const data = {
                memoryPalace: Array.from(this.memoryPalace.entries()),
                objectMemories: Array.from(this.objectMemories.entries()),
                knowledgeGraph: Array.from(this.knowledgeGraph.entries()),
                temporalMemories: Array.from(this.temporalMemories.entries()),
                savedAt: Date.now()
            };

            // Compress before saving (simplified)
            const json = JSON.stringify(data);
            localStorage.setItem('measurecount_visual_memory', json);
            
            console.log('[VisualMemory] Memories saved');
        } catch (error) {
            console.error('[VisualMemory] Save error:', error);
        }
    }

    /**
     * Load memories from localStorage
     */
    loadMemories() {
        try {
            const stored = localStorage.getItem('measurecount_visual_memory');
            
            if (stored) {
                const data = JSON.parse(stored);
                
                this.memoryPalace = new Map(data.memoryPalace || []);
                this.objectMemories = new Map(data.objectMemories || []);
                this.knowledgeGraph = new Map(data.knowledgeGraph || []);
                this.temporalMemories = new Map(data.temporalMemories || []);

                console.log('[VisualMemory] Memories loaded');
            }
        } catch (error) {
            console.error('[VisualMemory] Load error:', error);
        }
    }

    /**
     * Clear all memories
     */
    clearMemories() {
        this.memoryPalace.clear();
        this.objectMemories.clear();
        this.knowledgeGraph.clear();
        this.temporalMemories.clear();
        localStorage.removeItem('measurecount_visual_memory');
        console.log('[VisualMemory] All memories cleared');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `vm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get memory statistics
     */
    getStatistics() {
        return {
            locations: this.memoryPalace.size,
            objectMemories: this.objectMemories.size,
            knowledgeNodes: this.knowledgeGraph.size,
            temporalMemories: this.temporalMemories.size,
            totalMemories: Array.from(this.memoryPalace.values())
                .reduce((sum, loc) => sum + loc.memories.length, 0)
        };
    }
    
    /**
     * Get total stored objects count
     */
    getStoredCount() {
        return Array.from(this.memoryPalace.values())
            .reduce((sum, loc) => sum + loc.memories.length, 0);
    }

    /**
     * Export memories
     */
    exportMemories(format = 'json') {
        const data = {
            memoryPalace: Array.from(this.memoryPalace.entries()),
            objectMemories: Array.from(this.objectMemories.entries()),
            knowledgeGraph: Array.from(this.knowledgeGraph.entries())
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `visual-memory-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return data;
    }
}

// Initialize visual memory module
window.visualMemory = new VisualMemoryModule();
