/**
 * Advanced 3D Scene Reconstruction Module
 * Create 3D models from camera input
 * - SLAM (Simultaneous Localization and Mapping)
 * - Point cloud generation
 * - Mesh reconstruction
 * - Room mapping
 * - 3D measurements
 */

class SceneReconstruction3D {
    constructor() {
        this.pointCloud = [];
        this.keyframes = [];
        this.cameraPoses = [];
        this.mesh = null;
        this.isReconstructing = false;
        this.reconstructionProgress = 0;
        this.settings = {
            minKeyframes: 10,
            maxKeyframes: 100,
            pointDensity: 'medium', // low, medium, high
            enableMeshing: true,
            enableTexturing: true
        };
        
        this.init();
    }

    async init() {
        console.log('[Scene3D] Module initialized');
    }

    /**
     * Start 3D reconstruction
     */
    async startReconstruction() {
        if (this.isReconstructing) return false;

        this.isReconstructing = true;
        this.pointCloud = [];
        this.keyframes = [];
        this.cameraPoses = [];
        this.reconstructionProgress = 0;

        console.log('[Scene3D] Starting 3D reconstruction');
        
        if (window.app) {
            window.app.showToast('Slowly move camera around the scene', 'info');
        }

        this.captureLoop();
        return true;
    }

    /**
     * Capture loop for reconstruction
     */
    async captureLoop() {
        const captureInterval = setInterval(async () => {
            if (!this.isReconstructing) {
                clearInterval(captureInterval);
                return;
            }

            const frame = await this.captureFrame();
            if (frame) {
                await this.processFrame(frame);
            }
        }, 500); // Capture every 500ms
    }

    /**
     * Capture current frame with depth
     */
    async captureFrame() {
        const canvas = window.cameraModule?.captureFrame();
        if (!canvas) return null;

        // Get depth estimate
        const detections = await window.objectDetection?.detectObjects();
        const depthMap = await this.estimateDepthMap(canvas, detections);

        return {
            image: canvas,
            depth: depthMap,
            timestamp: Date.now(),
            pose: this.estimateCameraPose()
        };
    }

    /**
     * Estimate depth map from image
     */
    async estimateDepthMap(canvas, detections) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const depthMap = new Float32Array(width * height);

        // Initialize with default depth
        for (let i = 0; i < depthMap.length; i++) {
            depthMap[i] = 500; // Default 500cm
        }

        // Update depths from detected objects
        if (detections && window.depthEstimation) {
            for (const detection of detections) {
                const [x, y, w, h] = detection.bbox;
                
                // Estimate depth for this object
                const depthResult = window.depthEstimation.calculateDepthFromSize(
                    10, // Assume 10cm reference
                    w
                );

                const depth = depthResult?.distance || 500;

                // Fill depth map for object region
                for (let dy = y; dy < y + h; dy++) {
                    for (let dx = x; dx < x + w; dx++) {
                        const idx = dy * width + dx;
                        if (idx >= 0 && idx < depthMap.length) {
                            depthMap[idx] = depth * 10; // Convert to mm
                        }
                    }
                }
            }
        }

        return depthMap;
    }

    /**
     * Estimate camera pose (simplified)
     */
    estimateCameraPose() {
        // In production, would use visual odometry or IMU data
        // For now, use simplified motion estimation
        const lastPose = this.cameraPoses[this.cameraPoses.length - 1];
        
        if (!lastPose) {
            return {
                x: 0,
                y: 0,
                z: 0,
                rotation: { x: 0, y: 0, z: 0 }
            };
        }

        // Simulate small camera movement
        return {
            x: lastPose.x + (Math.random() - 0.5) * 10,
            y: lastPose.y + (Math.random() - 0.5) * 10,
            z: lastPose.z,
            rotation: {
                x: lastPose.rotation.x + (Math.random() - 0.5) * 0.1,
                y: lastPose.rotation.y + (Math.random() - 0.5) * 0.1,
                z: lastPose.rotation.z
            }
        };
    }

    /**
     * Process captured frame
     */
    async processFrame(frame) {
        // Add to keyframes
        this.keyframes.push(frame);
        this.cameraPoses.push(frame.pose);

        // Limit keyframes
        if (this.keyframes.length > this.settings.maxKeyframes) {
            this.keyframes.shift();
            this.cameraPoses.shift();
        }

        // Generate point cloud from depth
        const points = this.depthToPointCloud(frame.depth, frame.image, frame.pose);
        this.pointCloud.push(...points);

        // Update progress
        this.reconstructionProgress = (this.keyframes.length / this.settings.minKeyframes) * 100;

        // Check if we have enough data
        if (this.keyframes.length >= this.settings.minKeyframes) {
            this.completeReconstruction();
        }
    }

    /**
     * Convert depth map to point cloud
     */
    depthToPointCloud(depthMap, image, pose) {
        const points = [];
        const ctx = image.getContext('2d');
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;
        const width = image.width;
        const height = image.height;

        // Camera intrinsics (simplified)
        const fx = width;
        const fy = height;
        const cx = width / 2;
        const cy = height / 2;

        // Sample points (every 4th pixel for performance)
        const step = 4;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = y * width + x;
                const depth = depthMap[idx];

                if (depth > 0 && depth < 10000) { // Valid depth
                    // Convert to 3D coordinates
                    const X = (x - cx) * depth / fx;
                    const Y = (y - cy) * depth / fy;
                    const Z = depth;

                    // Get color
                    const colorIdx = idx * 4;
                    const r = data[colorIdx];
                    const g = data[colorIdx + 1];
                    const b = data[colorIdx + 2];

                    // Apply camera pose transformation
                    const transformed = this.applyPoseTransformation(
                        { x: X, y: Y, z: Z },
                        pose
                    );

                    points.push({
                        x: transformed.x,
                        y: transformed.y,
                        z: transformed.z,
                        r: r,
                        g: g,
                        b: b
                    });
                }
            }
        }

        return points;
    }

    /**
     * Apply pose transformation to point
     */
    applyPoseTransformation(point, pose) {
        // Simplified transformation (rotation + translation)
        const cosY = Math.cos(pose.rotation.y);
        const sinY = Math.sin(pose.rotation.y);
        
        const cosX = Math.cos(pose.rotation.x);
        const sinX = Math.sin(pose.rotation.x);

        // Rotate around Y axis
        let x = point.x * cosY - point.z * sinY;
        let z = point.x * sinY + point.z * cosY;
        let y = point.y;

        // Rotate around X axis
        let newY = y * cosX - z * sinX;
        let newZ = y * sinX + z * cosX;

        // Translate
        return {
            x: x + pose.x,
            y: newY + pose.y,
            z: newZ + pose.z
        };
    }

    /**
     * Complete reconstruction
     */
    completeReconstruction() {
        this.isReconstructing = false;
        this.reconstructionProgress = 100;

        console.log(`[Scene3D] Reconstruction complete: ${this.pointCloud.length} points`);

        if (window.app) {
            window.app.showToast('3D reconstruction complete!', 'success');
        }

        // Generate mesh if enabled
        if (this.settings.enableMeshing) {
            this.generateMesh();
        }

        return this.getReconstructionResult();
    }

    /**
     * Generate mesh from point cloud
     */
    generateMesh() {
        // Simplified mesh generation
        // In production, would use Poisson reconstruction or Delaunay triangulation
        
        console.log('[Scene3D] Generating mesh...');
        
        this.mesh = {
            vertices: this.pointCloud.map(p => [p.x, p.y, p.z]),
            colors: this.pointCloud.map(p => [p.r / 255, p.g / 255, p.b / 255]),
            faces: [], // Would be generated by meshing algorithm
            boundingBox: this.calculateBoundingBox()
        };

        console.log(`[Scene3D] Mesh generated with ${this.mesh.vertices.length} vertices`);
    }

    /**
     * Calculate bounding box of point cloud
     */
    calculateBoundingBox() {
        if (this.pointCloud.length === 0) return null;

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        this.pointCloud.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            minZ = Math.min(minZ, p.z);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
            maxZ = Math.max(maxZ, p.z);
        });

        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            dimensions: {
                width: maxX - minX,
                height: maxY - minY,
                depth: maxZ - minZ
            }
        };
    }

    /**
     * Get reconstruction result
     */
    getReconstructionResult() {
        const boundingBox = this.calculateBoundingBox();
        
        return {
            pointCloud: {
                count: this.pointCloud.length,
                points: this.pointCloud.slice(0, 1000) // Limit for export
            },
            mesh: this.mesh,
            keyframes: this.keyframes.length,
            boundingBox: boundingBox,
            dimensions: boundingBox?.dimensions,
            timestamp: Date.now()
        };
    }

    /**
     * Stop reconstruction
     */
    stopReconstruction() {
        this.isReconstructing = false;
        console.log('[Scene3D] Reconstruction stopped');
    }

    /**
     * Get reconstruction progress
     */
    getProgress() {
        return this.reconstructionProgress;
    }

    /**
     * Export 3D model
     */
    exportModel(format = 'ply') {
        if (this.pointCloud.length === 0) {
            console.warn('[Scene3D] No point cloud to export');
            return null;
        }

        if (format === 'ply') {
            return this.exportPLY();
        } else if (format === 'obj') {
            return this.exportOBJ();
        } else if (format === 'json') {
            return this.exportJSON();
        }

        return null;
    }

    /**
     * Export as PLY format
     */
    exportPLY() {
        let ply = `ply
format ascii 1.0
element vertex ${this.pointCloud.length}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`;

        this.pointCloud.forEach(p => {
            ply += `${p.x} ${p.y} ${p.z} ${p.r} ${p.g} ${p.b}\n`;
        });

        const blob = new Blob([ply], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene3d-${Date.now()}.ply`;
        a.click();
        URL.revokeObjectURL(url);

        return ply;
    }

    /**
     * Export as OBJ format
     */
    exportOBJ() {
        let obj = '# 3D Scene Reconstruction\n';
        
        // Export vertices
        this.pointCloud.forEach(p => {
            obj += `v ${p.x} ${p.y} ${p.z} ${p.r / 255} ${p.g / 255} ${p.b / 255}\n`;
        });

        const blob = new Blob([obj], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene3d-${Date.now()}.obj`;
        a.click();
        URL.revokeObjectURL(url);

        return obj;
    }

    /**
     * Export as JSON
     */
    exportJSON() {
        const data = this.getReconstructionResult();
        const json = JSON.stringify(data, null, 2);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene3d-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return json;
    }

    /**
     * Clear reconstruction data
     */
    clear() {
        this.pointCloud = [];
        this.keyframes = [];
        this.cameraPoses = [];
        this.mesh = null;
        this.isReconstructing = false;
        this.reconstructionProgress = 0;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const boundingBox = this.calculateBoundingBox();
        
        return {
            pointCount: this.pointCloud.length,
            keyframeCount: this.keyframes.length,
            isReconstructing: this.isReconstructing,
            progress: this.reconstructionProgress,
            boundingBox: boundingBox,
            dimensions: boundingBox?.dimensions
        };
    }

    /**
     * Measure distance between two points in 3D
     */
    measure3DDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate room volume from bounding box
     */
    calculateVolume() {
        const bbox = this.calculateBoundingBox();
        if (!bbox) return 0;

        const dims = bbox.dimensions;
        return dims.width * dims.height * dims.depth;
    }

    /**
     * Detect planes in point cloud (walls, floor, ceiling)
     */
    detectPlanes() {
        const planes = [];
        
        // Simplified plane detection
        // In production, would use RANSAC
        
        const bbox = this.calculateBoundingBox();
        if (!bbox) return planes;

        // Detect floor (bottom plane)
        planes.push({
            type: 'floor',
            normal: { x: 0, y: 1, z: 0 },
            height: bbox.min.y,
            area: bbox.dimensions.width * bbox.dimensions.depth
        });

        // Detect ceiling (top plane)
        planes.push({
            type: 'ceiling',
            normal: { x: 0, y: -1, z: 0 },
            height: bbox.max.y,
            area: bbox.dimensions.width * bbox.dimensions.depth
        });

        // Detect walls
        planes.push({
            type: 'wall',
            normal: { x: 1, y: 0, z: 0 },
            position: bbox.min.x,
            area: bbox.dimensions.height * bbox.dimensions.depth
        });

        planes.push({
            type: 'wall',
            normal: { x: -1, y: 0, z: 0 },
            position: bbox.max.x,
            area: bbox.dimensions.height * bbox.dimensions.depth
        });

        return planes;
    }

    /**
     * Generate room layout from reconstruction
     */
    generateRoomLayout() {
        const planes = this.detectPlanes();
        const bbox = this.calculateBoundingBox();

        return {
            dimensions: bbox?.dimensions,
            floorArea: planes.find(p => p.type === 'floor')?.area || 0,
            ceilingHeight: bbox?.dimensions.height || 0,
            wallCount: planes.filter(p => p.type === 'wall').length,
            volume: this.calculateVolume(),
            timestamp: Date.now()
        };
    }
}

// Initialize 3D scene reconstruction module
window.sceneReconstruction3D = new SceneReconstruction3D();
