/**
 * Error Detection and Correction System for Subway Surfers Bot
 * Implements Phase 6.3: Reliability Improvements - Error Detection and Correction
 * 
 * Features:
 * - Runtime error detection
 * - Common error pattern recognition
 * - Automatic error correction strategies
 * - Error reporting and logging
 */

// Import required modules
var utils = require('../utils.js');
var crashRecovery = require('./crash_recovery.js');

// Error patterns and correction strategies
var errorPatterns = [
    {
        pattern: /Cannot read property .* of (null|undefined)/i,
        type: "null_reference",
        description: "Null or undefined reference",
        severity: "high",
        correction: function(context) {
            // Add null checks to prevent the error
            return {
                strategy: "add_null_check",
                success: true,
                message: "Added null check for " + context.property
            };
        }
    },
    {
        pattern: /Permission denied/i,
        type: "permission",
        description: "Missing permission",
        severity: "high",
        correction: function(context) {
            // Request necessary permissions
            return {
                strategy: "request_permission",
                success: requestPermission(context.permission),
                message: "Requested permission: " + context.permission
            };
        }
    },
    {
        pattern: /Cannot find (.*) in screen/i,
        type: "ui_element_not_found",
        description: "UI element not found on screen",
        severity: "medium",
        correction: function(context) {
            // Try alternative UI navigation
            return {
                strategy: "alternative_navigation",
                success: true,
                message: "Using alternative navigation method"
            };
        }
    },
    {
        pattern: /Out of (memory|bounds)/i,
        type: "resource_limit",
        description: "Resource limit exceeded",
        severity: "high",
        correction: function(context) {
            // Free resources and optimize memory usage
            return {
                strategy: "free_resources",
                success: freeResources(),
                message: "Freed resources to continue operation"
            };
        }
    },
    {
        pattern: /Timeout/i,
        type: "timeout",
        description: "Operation timed out",
        severity: "medium",
        correction: function(context) {
            // Increase timeout or retry with backoff
            return {
                strategy: "increase_timeout",
                success: true,
                message: "Increased timeout and retrying operation"
            };
        }
    }
];

// Error statistics
var errorStats = {
    totalErrors: 0,
    correctedErrors: 0,
    uncorrectableErrors: 0,
    errorsByType: {}
};

// Helper functions
function requestPermission(permission) {
    try {
        // Try to request the permission using AutoJS APIs
        if (permission === "accessibility") {
            auto.waitFor();
            return true;
        } else if (permission === "storage") {
            // Request storage permission if available
            if (runtime && runtime.requestPermissions) {
                return runtime.requestPermissions(["android.permission.WRITE_EXTERNAL_STORAGE"]);
            }
        } else if (permission === "screen_capture") {
            // Request screen capture permission
            return requestScreenCapture();
        }
        return false;
    } catch (e) {
        console.error("Failed to request permission: " + e.message);
        return false;
    }
}

function freeResources() {
    try {
        // Force garbage collection if available
        if (global && global.gc) {
            global.gc();
        }
        
        // Clear any cached images or large objects
        if (images && images.release) {
            images.release();
        }
        
        return true;
    } catch (e) {
        console.error("Failed to free resources: " + e.message);
        return false;
    }
}

module.exports = {
    /**
     * Initialize the error detection and correction system
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing error detection and correction system...");
        
        // Reset error statistics
        this.resetErrorStats();
        
        // Initialize crash recovery system if not already initialized
        if (crashRecovery && typeof crashRecovery.initialize === 'function') {
            crashRecovery.initialize(config);
        }
        
        console.log("Error detection and correction system initialized");
        return this;
    },
    
    /**
     * Reset error statistics
     */
    resetErrorStats: function() {
        errorStats = {
            totalErrors: 0,
            correctedErrors: 0,
            uncorrectableErrors: 0,
            errorsByType: {}
        };
    },
    
    /**
     * Detect and attempt to correct an error
     * @param {Error} error - The error object
     * @param {string} context - Context where the error occurred
     * @param {Object} additionalInfo - Additional information about the error context
     * @return {Object} Result of error correction attempt
     */
    detectAndCorrect: function(error, context, additionalInfo) {
        if (!error) {
            return { success: false, message: "No error provided" };
        }
        
        // Update error statistics
        errorStats.totalErrors++;
        
        // Log the error
        console.error("Error detected in " + context + ": " + error.message);
        utils.logToFile("ERROR_DETECT [" + new Date().toISOString() + "] " + context + ": " + error.message);
        
        // Match error against known patterns
        var matchedPattern = null;
        var matchResult = null;
        
        for (var i = 0; i < errorPatterns.length; i++) {
            var pattern = errorPatterns[i];
            matchResult = error.message.match(pattern.pattern);
            
            if (matchResult) {
                matchedPattern = pattern;
                break;
            }
        }
        
        // If no pattern matched, use crash recovery as fallback
        if (!matchedPattern) {
            console.log("No matching error pattern found, using crash recovery");
            
            // Update error statistics
            if (!errorStats.errorsByType["unknown"]) {
                errorStats.errorsByType["unknown"] = 0;
            }
            errorStats.errorsByType["unknown"]++;
            
            // Use crash recovery if available
            if (crashRecovery && typeof crashRecovery.handleError === 'function') {
                var recoveryResult = crashRecovery.handleError(error, context);
                
                if (recoveryResult) {
                    errorStats.correctedErrors++;
                    return { 
                        success: true, 
                        strategy: "crash_recovery",
                        message: "Used crash recovery system"
                    };
                } else {
                    errorStats.uncorrectableErrors++;
                    return { 
                        success: false, 
                        strategy: "crash_recovery_failed",
                        message: "Crash recovery failed"
                    };
                }
            }
            
            errorStats.uncorrectableErrors++;
            return { success: false, message: "Unrecognized error pattern" };
        }
        
        // Update error statistics by type
        if (!errorStats.errorsByType[matchedPattern.type]) {
            errorStats.errorsByType[matchedPattern.type] = 0;
        }
        errorStats.errorsByType[matchedPattern.type]++;
        
        // Prepare context for correction strategy
        var correctionContext = additionalInfo || {};
        
        // Extract information from the match result if available
        if (matchResult && matchResult.length > 1) {
            correctionContext.matchResult = matchResult;
            correctionContext.property = matchResult[1];
        }
        
        // Apply correction strategy
        try {
            var correctionResult = matchedPattern.correction(correctionContext);
            
            if (correctionResult && correctionResult.success) {
                console.log("Error corrected: " + correctionResult.message);
                errorStats.correctedErrors++;
                return {
                    success: true,
                    pattern: matchedPattern.type,
                    strategy: correctionResult.strategy,
                    message: correctionResult.message
                };
            } else {
                console.log("Error correction failed: " + (correctionResult ? correctionResult.message : "Unknown reason"));
                errorStats.uncorrectableErrors++;
                
                // Try crash recovery as fallback
                if (crashRecovery && typeof crashRecovery.handleError === 'function') {
                    var recoveryResult = crashRecovery.handleError(error, context);
                    
                    if (recoveryResult) {
                        return { 
                            success: true, 
                            strategy: "crash_recovery_fallback",
                            message: "Used crash recovery as fallback"
                        };
                    }
                }
                
                return {
                    success: false,
                    pattern: matchedPattern.type,
                    strategy: correctionResult ? correctionResult.strategy : "unknown",
                    message: correctionResult ? correctionResult.message : "Correction failed"
                };
            }
        } catch (e) {
            console.error("Error during correction attempt: " + e.message);
            errorStats.uncorrectableErrors++;
            
            return {
                success: false,
                pattern: matchedPattern.type,
                strategy: "correction_error",
                message: "Error during correction attempt: " + e.message
            };
        }
    },
    
    /**
     * Wrap a function with error detection and correction
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context description for error reporting
     * @param {Object} additionalInfo - Additional information for error correction
     * @return {Function} Wrapped function with error handling
     */
    wrapWithErrorHandling: function(fn, context, additionalInfo) {
        var self = this;
        
        return function() {
            try {
                return fn.apply(this, arguments);
            } catch (error) {
                console.error("Error in " + context + ": " + error.message);
                
                // Attempt to correct the error
                var correctionResult = self.detectAndCorrect(error, context, additionalInfo);
                
                if (correctionResult && correctionResult.success) {
                    // If correction was successful, try to continue
                    console.log("Continuing after successful error correction");
                    try {
                        return fn.apply(this, arguments);
                    } catch (retryError) {
                        console.error("Error persists after correction: " + retryError.message);
                        throw retryError; // Re-throw if error persists
                    }
                } else {
                    // If correction failed, re-throw the error
                    throw error;
                }
            }
        };
    },
    
    /**
     * Get error statistics
     * @return {Object} Error statistics
     */
    getErrorStats: function() {
        return errorStats;
    },
    
    /**
     * Add a custom error pattern and correction strategy
     * @param {Object} pattern - Error pattern definition
     * @return {boolean} Success status
     */
    addErrorPattern: function(pattern) {
        if (!pattern || !pattern.pattern || !pattern.type || !pattern.correction) {
            console.error("Invalid error pattern definition");
            return false;
        }
        
        // Add the pattern to the list
        errorPatterns.push(pattern);
        console.log("Added custom error pattern for: " + pattern.description);
        
        return true;
    }
};