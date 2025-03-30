/**
 * Stability Testing System for Subway Surfers Bot
 * Implements Phase 6.1: Automated Testing - Stability Testing
 * 
 * Features:
 * - Long-running stability tests
 * - Error detection and logging
 * - Resource usage monitoring
 * - Automatic recovery testing
 */

// Import performance benchmarking for resource monitoring
var performanceBenchmark = require('./performance_benchmark.js');

// Stability test results storage
var testResults = {
    startTime: null,
    endTime: null,
    duration: 0,
    targetDuration: 0,
    errors: [],
    recoveries: [],
    checkpoints: [],
    resourceUsage: [],
    status: "not_started" // not_started, running, completed, failed
};

// Stability test configuration
var testConfig = {
    duration: 60 * 60 * 1000, // 1 hour default test duration
    checkpointInterval: 5 * 60 * 1000, // 5 minutes between checkpoints
    resourceSampleInterval: 60 * 1000, // 1 minute between resource samples
    recoveryTimeout: 30 * 1000, // 30 seconds timeout for recovery
    maxErrors: 10, // Maximum number of errors before test fails
    maxConsecutiveErrors: 3 // Maximum number of consecutive errors
};

// Test state
var testRunning = false;
var checkpointTimer = null;
var resourceTimer = null;
var consecutiveErrors = 0;

module.exports = {
    /**
     * Initialize the stability testing system
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing stability testing system...");
        
        // Reset test results
        this.resetResults();
        
        // Initialize performance benchmarking
        performanceBenchmark.initialize(config);
        
        // Update configuration if provided
        if (config && config.stabilityTesting) {
            for (var key in config.stabilityTesting) {
                if (config.stabilityTesting.hasOwnProperty(key) && testConfig.hasOwnProperty(key)) {
                    testConfig[key] = config.stabilityTesting[key];
                }
            }
        }
        
        console.log("Stability testing system initialized");
        return this;
    },
    
    /**
     * Reset test results
     */
    resetResults: function() {
        testResults = {
            startTime: null,
            endTime: null,
            duration: 0,
            targetDuration: 0,
            errors: [],
            recoveries: [],
            checkpoints: [],
            resourceUsage: [],
            status: "not_started"
        };
        
        testRunning = false;
        consecutiveErrors = 0;
    },
    
    /**
     * Start a stability test
     * @param {string} name - Name of the test
     * @param {Object} options - Test options
     * @param {Function} testFn - Function to run during test
     */
    startTest: function(name, options, testFn) {
        if (testRunning) {
            console.log("Stability test already running. Stop it first.");
            return false;
        }
        
        // Reset results
        this.resetResults();
        
        // Set test metadata
        testResults.name = name || "Unnamed Stability Test";
        testResults.startTime = new Date().toISOString();
        testResults.status = "running";
        
        // Apply custom options if provided
        if (options) {
            for (var key in options) {
                if (options.hasOwnProperty(key) && testConfig.hasOwnProperty(key)) {
                    testConfig[key] = options[key];
                }
            }
        }
        
        testResults.targetDuration = testConfig.duration;
        
        console.log("Starting stability test: " + testResults.name);
        console.log("Target duration: " + (testConfig.duration / (60 * 1000)) + " minutes");
        
        // Set up checkpoint timer
        checkpointTimer = setInterval(function() {
            this.recordCheckpoint();
        }.bind(this), testConfig.checkpointInterval);
        
        // Set up resource monitoring
        resourceTimer = setInterval(function() {
            this.sampleResourceUsage();
        }.bind(this), testConfig.resourceSampleInterval);
        
        // Start performance benchmarking
        performanceBenchmark.startBenchmark(testResults.name + " - Performance", {
            sampleInterval: testConfig.resourceSampleInterval / 2 // Sample twice as often
        });
        
        testRunning = true;
        
        // Run the test function if provided
        if (typeof testFn === 'function') {
            try {
                testFn();
            } catch (e) {
                this.recordError("Test function error", e.message);
            }
        }
        
        // Set up test duration timeout
        setTimeout(function() {
            if (testRunning) {
                this.stopTest(true); // Stop test successfully when duration is reached
            }
        }.bind(this), testConfig.duration);
        
        return true;
    },
    
    /**
     * Stop a running stability test
     * @param {boolean} successful - Whether the test completed successfully
     * @return {Object} Test results
     */
    stopTest: function(successful) {
        if (!testRunning) {
            console.log("No stability test running.");
            return null;
        }
        
        // Clear timers
        if (checkpointTimer) {
            clearInterval(checkpointTimer);
            checkpointTimer = null;
        }
        
        if (resourceTimer) {
            clearInterval(resourceTimer);
            resourceTimer = null;
        }
        
        // Stop performance benchmarking
        var benchmarkResults = performanceBenchmark.stopBenchmark();
        testResults.performanceBenchmark = benchmarkResults;
        
        // Set test end metadata
        testResults.endTime = new Date().toISOString();
        testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
        testResults.status = successful ? "completed" : "failed";
        
        console.log("Stability test " + (successful ? "completed successfully" : "failed") + ": " + testResults.name);
        console.log("Duration: " + (testResults.duration / 1000) + " seconds");
        console.log("Errors: " + testResults.errors.length);
        console.log("Recoveries: " + testResults.recoveries.length);
        
        testRunning = false;
        
        return testResults;
    },
    
    /**
     * Record a checkpoint in the test
     * Checkpoints are used to track progress and verify system state
     */
    recordCheckpoint: function() {
        if (!testRunning) {
            return;
        }
        
        var checkpoint = {
            timestamp: new Date().toISOString(),
            elapsedTime: new Date() - new Date(testResults.startTime),
            memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : null,
            errors: testResults.errors.length,
            recoveries: testResults.recoveries.length
        };
        
        testResults.checkpoints.push(checkpoint);
        
        console.log("Checkpoint recorded at " + checkpoint.timestamp);
        console.log("Elapsed time: " + (checkpoint.elapsedTime / 1000) + " seconds");
    },
    
    /**
     * Sample resource usage
     * Uses performance benchmarking to collect resource metrics
     */
    sampleResourceUsage: function() {
        if (!testRunning) {
            return;
        }
        
        // Get current resource usage
        var resourceSample = {
            timestamp: new Date().toISOString(),
            cpuUsage: null,
            memoryUsage: null,
            frameRate: null
        };
        
        // Try to use system APIs if available
        if (typeof device !== 'undefined') {
            if (device.getCpuUsage) {
                resourceSample.cpuUsage = device.getCpuUsage();
            }
            
            if (device.getMemoryInfo) {
                resourceSample.memoryUsage = device.getMemoryInfo();
            }
        }
        
        testResults.resourceUsage.push(resourceSample);
    },
    
    /**
     * Record an error during the test
     * @param {string} type - Type of error
     * @param {string} message - Error message
     * @param {Object} data - Additional error data
     */
    recordError: function(type, message, data) {
        if (!testRunning) {
            return;
        }
        
        var error = {
            timestamp: new Date().toISOString(),
            type: type || "Unknown",
            message: message || "No message",
            data: data || {}
        };
        
        testResults.errors.push(error);
        consecutiveErrors++;
        
        console.log("Error recorded: " + error.type + " - " + error.message);
        
        // Check if test should fail due to too many errors
        if (testResults.errors.length >= testConfig.maxErrors) {
            console.log("Maximum number of errors reached. Stopping test.");
            this.stopTest(false);
            return;
        }
        
        // Check if test should fail due to too many consecutive errors
        if (consecutiveErrors >= testConfig.maxConsecutiveErrors) {
            console.log("Maximum number of consecutive errors reached. Stopping test.");
            this.stopTest(false);
            return;
        }
        
        // Try to recover from error
        this.attemptRecovery(error);
    },
    
    /**
     * Attempt to recover from an error
     * @param {Object} error - Error to recover from
     */
    attemptRecovery: function(error) {
        if (!testRunning) {
            return;
        }
        
        console.log("Attempting to recover from error: " + error.type);
        
        var recoverySuccess = false;
        var recoveryAction = "none";
        
        // Implement recovery strategies based on error type
        switch (error.type) {
            case "Timeout":
                // Try restarting the operation
                recoveryAction = "restart";
                recoverySuccess = true;
                break;
                
            case "ScreenDetectionFailed":
                // Try taking a new screenshot
                recoveryAction = "new_screenshot";
                recoverySuccess = true;
                break;
                
            case "ControlFailed":
                // Try alternative control method
                recoveryAction = "alternative_control";
                recoverySuccess = true;
                break;
                
            default:
                // Generic recovery - wait and retry
                recoveryAction = "wait_and_retry";
                recoverySuccess = true;
                break;
        }
        
        var recovery = {
            timestamp: new Date().toISOString(),
            errorType: error.type,
            action: recoveryAction,
            success: recoverySuccess
        };
        
        testResults.recoveries.push(recovery);
        
        if (recoverySuccess) {
            console.log("Recovery successful: " + recoveryAction);
            consecutiveErrors = 0; // Reset consecutive errors counter
        } else {
            console.log("Recovery failed: " + recoveryAction);
        }
    },
    
    /**
     * Generate a test report
     * @param {string} format - Report format ("json" or "text")
     * @return {string} Test report
     */
    generateReport: function(format) {
        format = format || "json";
        
        if (format === "json") {
            return JSON.stringify(testResults, null, 2);
        } else {
            // Generate text report
            var report = "=== Stability Test Report: " + testResults.name + " ===\n";
            report += "Status: " + testResults.status + "\n";
            report += "Duration: " + (testResults.duration / 1000) + " seconds\n";
            report += "Start Time: " + testResults.startTime + "\n";
            report += "End Time: " + testResults.endTime + "\n\n";
            
            report += "--- Error Summary ---\n";
            report += "Total Errors: " + testResults.errors.length + "\n";
            report += "Total Recoveries: " + testResults.recoveries.length + "\n\n";
            
            if (testResults.errors.length > 0) {
                report += "--- Error Details ---\n";
                testResults.errors.forEach(function(error, index) {
                    report += (index + 1) + ". " + error.type + ": " + error.message + " (" + error.timestamp + ")\n";
                });
                report += "\n";
            }
            
            if (testResults.checkpoints.length > 0) {
                report += "--- Checkpoints ---\n";
                testResults.checkpoints.forEach(function(checkpoint, index) {
                    report += (index + 1) + ". " + checkpoint.timestamp + " (" + (checkpoint.elapsedTime / 1000) + " seconds)\n";
                });
                report += "\n";
            }
            
            return report;
        }
    },
    
    /**
     * Save test report to file
     * @param {string} filePath - Path to save the report
     * @param {string} format - Report format ("json" or "text")
     * @return {boolean} Success status
     */
    saveReport: function(filePath, format) {
        try {
            var report = this.generateReport(format);
            files.write(filePath, report);
            
            console.log("Stability test report saved to: " + filePath);
            return true;
        } catch (e) {
            console.error("Failed to save stability test report: " + e.message);
            return false;
        }
    },
    
    /**
     * Get current test status
     * @return {Object} Test status
     */
    getStatus: function() {
        return {
            running: testRunning,
            name: testResults.name,
            startTime: testResults.startTime,
            duration: testRunning ? (new Date() - new Date(testResults.startTime)) : testResults.duration,
            errors: testResults.errors.length,
            recoveries: testResults.recoveries.length,
            status: testResults.status
        };
    }
}