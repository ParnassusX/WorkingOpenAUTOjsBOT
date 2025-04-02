// Enhanced touch detection variables
var lastTouchX = 0;
var lastTouchY = 0;
var touchStartTime = 0;
var lastActionTime = 0;
var gestureHistory = [];
exports.gestureHistory = gestureHistory;
var keyboardControlsActive = false;

// Base path for the emulator environment
var emulatorBasePath = "/storage/emulated/0/SubwayBot/";

// Import duplicate detector utility
var duplicateHandler = require('./duplicateHandler.js');

// Optimized Click Timing
// Create a fallback for perf_hooks since it's not available in AutoJS
var performance;
try {
    // Try to load perf_hooks (works in Node.js environments)
    const perfHooks = require('perf_hooks');
    performance = perfHooks.performance;
    console.log("Successfully loaded perf_hooks");
} catch (e) {
    // Fallback implementation for AutoJS environment
    console.log("perf_hooks not available, using fallback implementation: " + e.message);
    performance = {
        now: function() {
            return Date.now(); // Use Date.now() as fallback
        },
        // Add additional performance methods if needed
        mark: function(name) {
            // Simple mark implementation
            if (!this._marks) this._marks = {};
            this._marks[name] = this.now();
        },
        measure: function(name, startMark, endMark) {
            // Simple measure implementation
            if (!this._marks) return 0;
            if (!this._measures) this._measures = {};
            var start = this._marks[startMark] || 0;
            var end = this._marks[endMark] || this.now();
            this._measures[name] = end - start;
            return this._measures[name];
        }
    };
}
// Export performance for use in other modules
exports.performance = performance;
// Remove system-sleep dependency and use AutoJS's built-in sleep function
// const { sleep } = require('system-sleep');

function optimizedClick(x, y) {
    const start = performance.now();
    press(x, y);
    while (performance.now() - start < 22) {
        // Use AutoJS's built-in sleep function instead
        sleep(1); // Use 1ms sleep as minimum in AutoJS
    }
    release(x, y);
}

/**
 * Prepares the environment for the bot to run
 * Creates necessary directories and verifies paths
 * @param {Object} config - Configuration settings
 */
exports.prepareEnvironment = function(config) {
    console.log("Preparing environment for bot...");
    
    // Verify and update paths if needed
    duplicateHandler.verifyAndUpdatePaths(config);
    
    // Create required directories
    var requiredDirs = [
        config.training.dataPath,
        config.training.trainingPath,
        config.training.screenshotPath,
        config.training.dataPath + "logs/",
        config.training.dataPath + "sessions/",
        config.training.dataPath + "stats/",
        config.training.dataPath + "error_screenshots/",
        config.training.dataPath + "actions/"
    ];
    
    // Add model directory if neural network is enabled
    if (config.neuralNet && config.neuralNet.modelPath) {
        requiredDirs.push(config.neuralNet.modelPath);
    }
    
    // Create each directory
    var dirResults = [];
    for (var i = 0; i < requiredDirs.length; i++) {
        var result = duplicateHandler.ensureDirectory(requiredDirs[i]);
        dirResults.push({
            path: requiredDirs[i],
            created: result
        });
    }
    
    // Log results
    console.log("Directory creation results:");
    for (var j = 0; j < dirResults.length; j++) {
        console.log(dirResults[j].path + ": " + (dirResults[j].created ? "✓" : "✗"));
    }
    
    console.log("Environment preparation complete");
    return true;
};

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} path - Directory path to ensure
 * @return {boolean} True if directory exists or was created
 */
exports.ensureDirectory = function(path) {
    return duplicateHandler.ensureDirectory(path);
}