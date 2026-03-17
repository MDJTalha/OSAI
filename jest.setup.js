/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Mock Performance API
global.performance = {
    memory: {
        usedJSHeapSize: 50000000,
        jsHeapSizeLimit: 100000000
    },
    now: () => Date.now()
};

// Mock Crypto API
global.crypto = {
    getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    },
    subtle: {
        digest: async (algorithm, data) => {
            // Simple mock hash
            return new Uint8Array(32);
        }
    }
};

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = String(value);
    },
    removeItem: function(key) {
        delete this.store[key];
    },
    clear: function() {
        this.store = {};
    },
    get length() {
        return Object.keys(this.store).length;
    },
    key: function(index) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
};

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
    value: localStorageMock
});

// Mock navigator
global.navigator = {
    ...global.navigator,
    mediaDevices: {
        getUserMedia: jest.fn(),
        enumerateDevices: jest.fn()
    },
    onLine: true,
    storage: {
        estimate: jest.fn().mockResolvedValue({
            usage: 1000000,
            quota: 5000000000
        })
    },
    share: jest.fn()
};

// Mock fetch
global.fetch = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
};

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillStyle: '',
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
        data: new Array(4).fill(0)
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    reset: jest.fn()
}));

// Mock video element
HTMLVideoElement.prototype.captureStream = jest.fn(() => ({
    getTracks: jest.fn(() => [])
}));

// Mock service worker
navigator.serviceWorker = {
    register: jest.fn().mockResolvedValue({
        scope: '/'
    }),
    ready: Promise.resolve()
};

// Mock matchMedia
Object.defineProperty(global, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
});

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'mock-url');
URL.revokeObjectURL = jest.fn();

// Console mock to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Helper function to wait for async operations
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to flush promises
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));
