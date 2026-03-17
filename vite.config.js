/**
 * Vite Configuration for OSAI
 * Modern build tool with HMR, optimized builds
 */

import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';

export default defineConfig({
    // Base path for production
    base: './',
    
    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'terser',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    // Split vendor libraries
                    'vendor-tf': ['@tensorflow/tfjs'],
                    'vendor-coco': ['@tensorflow-models/coco-ssd'],
                    'vendor-mobile': ['@tensorflow-models/mobilenet'],
                    'vendor-vision': ['tesseract.js', 'jsqr'],
                    // Split core modules
                    'core-infra': [
                        './error-boundary.js',
                        './security-manager.js',
                        './state-manager.js',
                        './memory-manager.js'
                    ]
                }
            }
        },
        // Chunk size warnings
        chunkSizeWarningLimit: 500,
        // CSS code splitting
        cssCodeSplit: true,
        // Assets inline limit
        assetsInlineLimit: 4096
    },
    
    // Development server configuration
    server: {
        port: 8080,
        host: true,
        https: true,
        open: true,
        cors: true,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    
    // Preview configuration
    preview: {
        port: 8081,
        host: true,
        https: true
    },
    
    // Plugins
    plugins: [
        basicSsl() // Enable HTTPS for camera access
    ],
    
    // Resolve aliases
    resolve: {
        alias: {
            '@': resolve(__dirname, '.'),
            '@core': resolve(__dirname, '.'),
            '@modules': resolve(__dirname, '.'),
            '@tests': resolve(__dirname, '__tests__')
        }
    },
    
    // Optimize dependencies
    optimizeDeps: {
        include: [
            '@tensorflow/tfjs',
            '@tensorflow-models/coco-ssd',
            '@tensorflow-models/mobilenet'
        ],
        exclude: ['opencv.js'] // OpenCV loads from CDN
    },
    
    // Worker configuration
    worker: {
        format: 'es'
    },
    
    // CSS configuration
    css: {
        devSourcemap: true
    },
    
    // JSON configuration
    json: {
        stringify: true
    },
    
    // Log level
    logLevel: 'info',
    
    // Clear screen on start
    clearScreen: true,
    
    // Environment variable prefix
    envPrefix: 'OSAI_',
    
    // Define global constants
    define: {
        __APP_VERSION__: JSON.stringify('8.0.0'),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
});
