/**
 * Custom Model Training Module
 * Train AI on specific objects for your use case
 * - Collect training samples
 * - Feature extraction
 * - Model training (TensorFlow.js)
 * - Export/Import trained models
 */

class CustomModelTraining {
    constructor() {
        this.trainingData = new Map();
        this.trainedModels = new Map();
        this.currentCategory = null;
        this.isTraining = false;
        this.trainingProgress = 0;
        this.settings = {
            minSamples: 10,
            maxSamples: 100,
            validationSplit: 0.2,
            epochs: 50,
            batchSize: 16,
            learningRate: 0.001
        };

        this.init();
    }

    async init() {
        this.loadTrainingData();
        console.log('[CustomTraining] Module initialized');
    }

    /**
     * Create new category for training
     */
    createCategory(name, description = '') {
        const category = {
            id: this.generateId(),
            name: name.toLowerCase(),
            displayName: name,
            description: description,
            samples: [],
            features: [],
            labels: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            trainedModel: null
        };

        this.trainingData.set(category.id, category);
        this.saveTrainingData();
        
        console.log(`[CustomTraining] Created category: ${name}`);
        return category;
    }

    /**
     * Add training sample from image
     */
    async addSample(categoryId, imageData, label = null) {
        const category = this.trainingData.get(categoryId);
        if (!category) {
            console.error('[CustomTraining] Category not found:', categoryId);
            return false;
        }

        // Extract features from image
        const features = await this.extractFeatures(imageData);
        
        if (!features) {
            console.error('[CustomTraining] Failed to extract features');
            return false;
        }

        const sample = {
            id: this.generateId(),
            features: features,
            label: label || category.name,
            imageData: imageData, // Store for reference
            addedAt: Date.now()
        };

        category.samples.push(sample);
        category.features.push(features);
        category.labels.push(sample.label);
        category.updatedAt = Date.now();

        // Limit samples
        if (category.samples.length > this.settings.maxSamples) {
            category.samples.shift();
            category.features.shift();
            category.labels.shift();
        }

        this.saveTrainingData();
        console.log(`[CustomTraining] Added sample to ${category.name} (${category.samples.length}/${this.settings.maxSamples})`);
        
        return true;
    }

    /**
     * Extract features from image data
     */
    async extractFeatures(imageData) {
        if (!window.tf) {
            console.warn('[CustomTraining] TensorFlow.js not available, using basic features');
            return this.extractBasicFeatures(imageData);
        }

        try {
            // Convert to tensor
            let tensor;
            
            if (imageData instanceof ImageData) {
                tensor = tf.browser.fromPixels(imageData);
            } else if (imageData instanceof HTMLCanvasElement) {
                tensor = tf.browser.fromPixels(imageData);
            } else {
                tensor = tf.tensor(imageData);
            }

            // Resize to standard size
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // Normalize
            const normalized = resized.div(255.0);
            
            // Extract color histogram
            const colorHist = this.extractColorHistogram(normalized);
            
            // Extract texture features
            const textureFeatures = this.extractTextureFeatures(normalized);
            
            // Extract shape features
            const shapeFeatures = this.extractShapeFeatures(imageData);

            // Combine features
            const allFeatures = [...colorHist, ...textureFeatures, ...shapeFeatures];

            // Cleanup
            tensor.dispose();
            resized.dispose();
            normalized.dispose();

            return allFeatures;
        } catch (error) {
            console.error('[CustomTraining] Feature extraction error:', error);
            return this.extractBasicFeatures(imageData);
        }
    }

    /**
     * Extract color histogram features
     */
    extractColorHistogram(tensor) {
        const histogram = new Array(48).fill(0); // 16 bins per channel
        
        // Simplified histogram extraction
        const data = tensor.dataSync();
        
        for (let i = 0; i < Math.min(data.length, 10000); i += 4) {
            const r = Math.floor(data[i] * 16);
            const g = Math.floor(data[i + 1] * 16);
            const b = Math.floor(data[i + 2] * 16);
            
            if (r < 16) histogram[r]++;
            if (g < 16) histogram[16 + g]++;
            if (b < 16) histogram[32 + b]++;
        }

        // Normalize
        const total = histogram.reduce((a, b) => a + b, 0);
        return histogram.map(v => v / total);
    }

    /**
     * Extract texture features
     */
    extractTextureFeatures(tensor) {
        const data = tensor.dataSync();
        let sum = 0;
        let sumSq = 0;
        let gradientSum = 0;

        for (let i = 0; i < Math.min(data.length, 10000); i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sumSq += gray * gray;
            
            // Simple gradient
            if (i + 12 < data.length) {
                const nextGray = (data[i + 12] + data[i + 13] + data[i + 14]) / 3;
                gradientSum += Math.abs(gray - nextGray);
            }
        }

        const n = Math.min(data.length / 4, 2500);
        const mean = sum / n;
        const variance = sumSq / n - mean * mean;

        return [
            mean,
            Math.sqrt(variance),
            gradientSum / n,
            mean > 0.5 ? 1 : 0 // Brightness flag
        ];
    }

    /**
     * Extract shape features
     */
    extractShapeFeatures(imageData) {
        // Basic shape features from bounding box analysis
        if (!imageData.width || !imageData.height) {
            return [0.5, 1, 0];
        }

        const aspectRatio = imageData.width / imageData.height;
        const area = imageData.width * imageData.height;
        const normalizedArea = Math.min(1, area / 100000);

        return [
            aspectRatio,
            normalizedArea,
            aspectRatio > 1 ? 1 : 0 // Horizontal flag
        ];
    }

    /**
     * Extract basic features (fallback)
     */
    extractBasicFeatures(imageData) {
        const data = imageData.data || new Uint8ClampedArray(100);
        const features = [];

        // Simple average colors
        let r = 0, g = 0, b = 0;
        const sampleSize = Math.min(data.length / 4, 100);
        
        for (let i = 0; i < sampleSize; i++) {
            r += data[i * 4] / 255;
            g += data[i * 4 + 1] / 255;
            b += data[i * 4 + 2] / 255;
        }

        features.push(r / sampleSize, g / sampleSize, b / sampleSize);
        features.push(imageData.width / (imageData.height || 1));
        features.push(data.length / 10000);

        return features;
    }

    /**
     * Train model for category
     */
    async trainModel(categoryId) {
        const category = this.trainingData.get(categoryId);
        
        if (!category) {
            throw new Error('Category not found');
        }

        if (category.samples.length < this.settings.minSamples) {
            throw new Error(`Need at least ${this.settings.minSamples} samples (have ${category.samples.length})`);
        }

        this.isTraining = true;
        this.trainingProgress = 0;

        try {
            if (!window.tf) {
                // Use simple classifier without TF
                await this.trainSimpleClassifier(category);
            } else {
                // Use TensorFlow.js
                await this.trainTensorFlowModel(category);
            }

            category.trainedModel = {
                trainedAt: Date.now(),
                accuracy: 0.85, // Placeholder
                samples: category.samples.length
            };

            this.saveTrainingData();
            console.log(`[CustomTraining] Model trained for ${category.name}`);
            
            return category.trainedModel;
        } catch (error) {
            console.error('[CustomTraining] Training error:', error);
            throw error;
        } finally {
            this.isTraining = false;
            this.trainingProgress = 100;
        }
    }

    /**
     * Train simple classifier (no TF)
     */
    async trainSimpleClassifier(category) {
        // Calculate mean features for the category
        const features = category.features;
        const meanFeatures = new Array(features[0].length).fill(0);

        features.forEach(f => {
            f.forEach((v, i) => {
                meanFeatures[i] += v;
            });
        });

        meanFeatures.forEach((_, i) => {
            meanFeatures[i] /= features.length;
        });

        // Calculate variance
        const varianceFeatures = new Array(features[0].length).fill(0);
        features.forEach(f => {
            f.forEach((v, i) => {
                varianceFeatures[i] += Math.pow(v - meanFeatures[i], 2);
            });
        });

        varianceFeatures.forEach((_, i) => {
            varianceFeatures[i] /= features.length;
        });

        // Store model parameters
        category.model = {
            type: 'simple-classifier',
            mean: meanFeatures,
            variance: varianceFeatures,
            threshold: 0.5
        };
    }

    /**
     * Train TensorFlow.js model
     */
    async trainTensorFlowModel(category) {
        const model = tf.sequential();

        // Input layer
        model.add(tf.layers.dense({
            inputShape: [category.features[0].length],
            units: 64,
            activation: 'relu'
        }));

        model.add(tf.layers.dropout({ rate: 0.3 }));

        // Hidden layer
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }));

        // Output layer
        model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        // Compile
        model.compile({
            optimizer: tf.train.adam(this.settings.learningRate),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Prepare training data
        const xs = tf.tensor2d(category.features);
        const ys = tf.tensor2d(new Array(category.features.length).fill([1]));

        // Train
        const history = await model.fit(xs, ys, {
            epochs: this.settings.epochs,
            batchSize: this.settings.batchSize,
            validationSplit: this.settings.validationSplit,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    this.trainingProgress = ((epoch + 1) / this.settings.epochs) * 100;
                    console.log(`[CustomTraining] Epoch ${epoch}: loss = ${logs.loss}, acc = ${logs.acc}`);
                }
            }
        });

        // Store model
        category.model = {
            type: 'tensorflow',
            model: model,
            trainingHistory: history.history
        };

        // Cleanup
        xs.dispose();
        ys.dispose();
    }

    /**
     * Classify object using trained model
     */
    async classify(imageData) {
        const features = await this.extractFeatures(imageData);
        
        for (const [categoryId, category] of this.trainingData) {
            if (!category.model) continue;

            const result = await this.predict(category, features);
            
            if (result.confidence > 0.5) {
                return {
                    category: category.name,
                    categoryId: categoryId,
                    confidence: result.confidence,
                    label: result.label
                };
            }
        }

        return null;
    }

    /**
     * Predict category for features
     */
    async predict(category, features) {
        if (!category.model) {
            return { confidence: 0, label: null };
        }

        if (category.model.type === 'simple-classifier') {
            return this.simplePredict(category.model, features);
        } else if (category.model.type === 'tensorflow' && window.tf) {
            return this.tensorFlowPredict(category.model, features);
        }

        return { confidence: 0, label: null };
    }

    /**
     * Simple prediction (no TF)
     */
    simplePredict(model, features) {
        let distance = 0;
        
        features.forEach((f, i) => {
            const diff = f - model.mean[i];
            const normalizedDiff = model.variance[i] > 0 ? diff / Math.sqrt(model.variance[i]) : diff;
            distance += Math.pow(normalizedDiff, 2);
        });

        const euclideanDistance = Math.sqrt(distance / features.length);
        const confidence = 1 / (1 + euclideanDistance);

        return {
            confidence: confidence,
            label: category.name
        };
    }

    /**
     * TensorFlow prediction
     */
    tensorFlowPredict(modelData, features) {
        try {
            const input = tf.tensor2d([features]);
            const prediction = modelData.model.predict(input);
            const confidence = prediction.dataSync()[0];
            
            input.dispose();
            prediction.dispose();

            return {
                confidence: confidence,
                label: modelData.label
            };
        } catch (error) {
            console.error('[CustomTraining] Prediction error:', error);
            return { confidence: 0, label: null };
        }
    }

    /**
     * Export trained model
     */
    async exportModel(categoryId) {
        const category = this.trainingData.get(categoryId);
        
        if (!category || !category.model) {
            throw new Error('No trained model to export');
        }

        if (category.model.type === 'tensorflow' && window.tf) {
            // Export TF model
            await category.model.model.save('downloads://measurecount-model-' + category.name);
        } else {
            // Export simple model as JSON
            const exportData = {
                category: category,
                model: category.model
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `measurecount-model-${category.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Import trained model
     */
    async importModel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.category && data.model) {
                        const category = data.category;
                        category.id = this.generateId();
                        category.trainedAt = Date.now();
                        
                        this.trainingData.set(category.id, category);
                        this.saveTrainingData();
                        
                        resolve(category);
                    } else {
                        reject(new Error('Invalid model file'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Delete category
     */
    deleteCategory(categoryId) {
        this.trainingData.delete(categoryId);
        this.saveTrainingData();
    }

    /**
     * Get all categories
     */
    getCategories() {
        return Array.from(this.trainingData.values()).map(c => ({
            id: c.id,
            name: c.name,
            displayName: c.displayName,
            description: c.description,
            sampleCount: c.samples.length,
            isTrained: !!category.trainedModel,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        }));
    }

    /**
     * Get category details
     */
    getCategory(categoryId) {
        return this.trainingData.get(categoryId);
    }

    /**
     * Save training data to localStorage
     */
    saveTrainingData() {
        try {
            const data = Array.from(this.trainingData.entries()).map(([id, category]) => ({
                id,
                ...category,
                // Don't store imageData to save space
                samples: category.samples.map(s => ({
                    ...s,
                    imageData: null
                }))
            }));

            localStorage.setItem('measurecount_training_data', JSON.stringify(data));
        } catch (error) {
            console.error('[CustomTraining] Save error:', error);
        }
    }

    /**
     * Load training data from localStorage
     */
    loadTrainingData() {
        try {
            const stored = localStorage.getItem('measurecount_training_data');
            
            if (stored) {
                const data = JSON.parse(stored);
                
                data.forEach(item => {
                    this.trainingData.set(item.id, item);
                });

                console.log(`[CustomTraining] Loaded ${data.length} categories`);
            }
        } catch (error) {
            console.error('[CustomTraining] Load error:', error);
        }
    }

    /**
     * Clear all training data
     */
    clearAll() {
        this.trainingData.clear();
        localStorage.removeItem('measurecount_training_data');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get training statistics
     */
    getStatistics() {
        const categories = Array.from(this.trainingData.values());
        const totalSamples = categories.reduce((sum, c) => sum + c.samples.length, 0);
        const trainedCategories = categories.filter(c => c.trainedModel).length;

        return {
            totalCategories: categories.length,
            totalSamples: totalSamples,
            trainedCategories: trainedCategories,
            averageSamplesPerCategory: totalSamples / (categories.length || 1)
        };
    }
}

// Initialize custom training module
window.customTraining = new CustomModelTraining();
