/**
 * OSAI Type Definitions (JSDoc)
 * Provides TypeScript-like type safety for JavaScript
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} 0 - X coordinate (top-left)
 * @property {number} 1 - Y coordinate (top-left)
 * @property {number} 2 - Width
 * @property {number} 3 - Height
 */

/**
 * @typedef {Object} Detection
 * @property {string} id - Unique identifier
 * @property {string} class - Object class/label
 * @property {string} [label] - Alternative label name
 * @property {number} confidence - Confidence score (0-1)
 * @property {number} [score] - Alternative score name
 * @property {BoundingBox} bbox - Bounding box coordinates
 * @property {BoundingBox} [box] - Alternative box name
 * @property {number} timestamp - Detection timestamp
 * @property {'ml' | 'blob' | 'basic'} [type] - Detection type
 */

/**
 * @typedef {Object} ColorAnalysis
 * @property {string} dominant - Dominant color name
 * @property {string[]} [palette] - Color palette
 * @property {string} hex - Hex color code
 * @property {RGB} [rgb] - RGB color values
 */

/**
 * @typedef {Object} RGB
 * @property {number} r - Red (0-255)
 * @property {number} g - Green (0-255)
 * @property {number} b - Blue (0-255)
 */

/**
 * @typedef {Object} SizeAnalysis
 * @property {string} category - Size category (Small, Medium, Large)
 * @property {number} area - Area in pixels
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 * @property {number} [aspectRatio] - Aspect ratio
 */

/**
 * @typedef {Object} MaterialAnalysis
 * @property {string} [type] - Material type
 * @property {number} [confidence] - Material confidence
 * @property {string} [texture] - Texture description
 */

/**
 * @typedef {Object} ShapeAnalysis
 * @property {string} type - Shape type (rectangle, circle, etc.)
 * @property {number} [aspectRatio] - Aspect ratio
 * @property {number} [circularity] - Circularity score
 */

/**
 * @typedef {Object} ItemProfile
 * @property {string} id - Item ID
 * @property {string} class - Item class
 * @property {number} confidence - Confidence score
 * @property {BoundingBox} bbox - Bounding box
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {ColorAnalysis} color - Color analysis
 * @property {SizeAnalysis} size - Size analysis
 * @property {MaterialAnalysis} material - Material analysis
 * @property {ShapeAnalysis} shape - Shape analysis
 * @property {string} description - Item description
 * @property {number} timestamp - Timestamp
 */

/**
 * @typedef {Object} ModelStatus
 * @property {boolean} loaded - Is model loaded
 * @property {boolean} loading - Is model loading
 * @property {string|null} error - Error message if any
 */

/**
 * @typedef {Object} AppState
 * @property {AppConfig} config - App configuration
 * @property {CameraState} camera - Camera state
 * @property {Object.<string, ModelStatus>} models - AI models status
 * @property {DetectionState} detection - Detection state
 * @property {MeasurementState} measurement - Measurement state
 * @property {MemoryState} memory - Memory state
 * @property {UIState} ui - UI state
 * @property {HistoryState} history - History state
 */

/**
 * @typedef {Object} AppConfig
 * @property {string} units - Measurement units (cm, mm, inches)
 * @property {number} precision - Decimal precision
 * @property {boolean} autoDetection - Auto-detection enabled
 * @property {boolean} deepLearning - Deep learning enabled
 * @property {number} confidenceThreshold - Minimum confidence (0-1)
 * @property {boolean} nightVision - Night vision mode
 * @property {number} fps - Target FPS
 */

/**
 * @typedef {Object} CameraState
 * @property {boolean} active - Is camera active
 * @property {'environment' | 'user'} facingMode - Camera facing mode
 * @property {boolean} flash - Flash enabled
 * @property {MediaStream|null} stream - Media stream
 * @property {string|null} error - Error message
 */

/**
 * @typedef {Object} DetectionState
 * @property {ItemProfile[]} items - Detected items
 * @property {number|null} lastDetection - Last detection timestamp
 * @property {boolean} isDetecting - Is currently detecting
 * @property {boolean} autoDetectionRunning - Auto-detection running
 */

/**
 * @typedef {Object} MeasurementState
 * @property {boolean} isCalibrated - Is calibrated
 * @property {Object|null} calibrationData - Calibration data
 * @property {Measurement[]} measurements - Measurement history
 * @property {boolean} isMeasuring - Is currently measuring
 * @property {Point[]} points - Current measurement points
 */

/**
 * @typedef {Object} Measurement
 * @property {number} length - Length in cm
 * @property {number} [width] - Width in cm
 * @property {number} area - Area in cm²
 * @property {number} [confidence] - Measurement confidence
 * @property {number} timestamp - Measurement timestamp
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} MemoryState
 * @property {number} learnedObjects - Number of learned objects
 * @property {Map} locations - Location memories
 * @property {number|null} lastSync - Last sync timestamp
 */

/**
 * @typedef {Object} UIState
 * @property {boolean} loading - Is loading
 * @property {string} loadingMessage - Loading message
 * @property {string|null} activePanel - Active panel name
 * @property {Object|null} toast - Current toast
 * @property {'dark' | 'light'} theme - Theme
 */

/**
 * @typedef {Object} HistoryState
 * @property {HistoryEntry[]} past - Past states for undo
 * @property {HistoryEntry[]} future - Future states for redo
 * @property {number} maxSize - Max history size
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} path - State path
 * @property {*} value - State value
 * @property {number} timestamp - Timestamp
 */

/**
 * @typedef {Object} ErrorInfo
 * @property {'javascript' | 'promise' | 'execution' | 'module_init'} type - Error type
 * @property {string} message - Error message
 * @property {string} [filename] - Source file
 * @property {number} [lineno] - Line number
 * @property {number} [colno] - Column number
 * @property {string} [stack] - Stack trace
 * @property {number} timestamp - Timestamp
 */

/**
 * @typedef {Object} ToastOptions
 * @property {'info' | 'success' | 'warning' | 'error'} type - Toast type
 * @property {number} [duration] - Duration in ms
 */

/**
 * @typedef {Object} DetectionOptions
 * @property {number} [minConfidence] - Minimum confidence (0-1)
 * @property {number} [maxDetections] - Max detections
 * @property {boolean} [useDeepLearning] - Use deep learning
 */

/**
 * @typedef {Object} StateUpdateOptions
 * @property {boolean} [silent] - Don't notify listeners
 * @property {boolean} [persist] - Persist to localStorage
 * @property {boolean} [history] - Save to undo history
 */

/**
 * @typedef {Object} ResourceStats
 * @property {Object.<string, number>} resources - Resources by type
 * @property {number} intervals - Active intervals
 * @property {number} timeouts - Active timeouts
 * @property {number} eventListeners - Active event listeners
 * @property {number} observers - Active observers
 * @property {number} streams - Active streams
 * @property {number} memoryUsage - Memory usage ratio
 */

/**
 * @typedef {Object} SecurityAuditResult
 * @property {string[]} issues - Security issues found
 * @property {number} score - Security score (0-100)
 * @property {boolean} passed - All checks passed
 */

/**
 * @callback StateListener
 * @param {*} newValue - New state value
 * @param {*} oldValue - Old state value
 * @param {string} path - State path
 * @returns {void}
 */

/**
 * @callback RecoveryHandler
 * @param {ErrorInfo} errorInfo - Error information
 * @returns {Promise<void>}
 */

/**
 * @callback DetectionCallback
 * @param {ItemProfile} detection - Detection result
 * @returns {void}
 */
