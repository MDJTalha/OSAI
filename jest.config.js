/**
 * Jest Configuration for OSAI
 * Testing framework setup
 */

module.exports = {
    // Test environment
    testEnvironment: 'jsdom',
    
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.js',
        '**/*.test.js',
        '**/*.spec.js'
    ],
    
    // Coverage configuration
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/*.min.js',
        '!**/coverage/**'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    
    // Module name mapper for aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    
    // Transform configuration
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    
    // Verbose output
    verbose: true,
    
    // Test timeout
    testTimeout: 10000,
    
    // Max workers
    maxWorkers: '50%',
    
    // Coverage directory
    coverageDirectory: 'coverage',
    
    // Coverage reporters
    coverageReporters: ['text', 'lcov', 'html', 'clover'],
    
    // Test results processor
    testResultsProcessor: 'jest-sonar-reporter'
};
