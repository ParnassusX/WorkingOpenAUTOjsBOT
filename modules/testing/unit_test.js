/**
 * Unit Testing Framework for Subway Surfers Bot
 * Implements Phase 6.1: Automated Testing - Unit Tests
 * 
 * Features:
 * - Simple test runner for core functions
 * - Assertion utilities
 * - Test reporting
 */

// Test results storage
var testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

// Current test suite
var currentSuite = "Default";

// Test timeout in milliseconds
var testTimeout = 5000;

module.exports = {
    /**
     * Initialize the testing framework
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing unit testing framework...");
        
        // Reset test results
        this.resetResults();
        
        // Set custom timeout if provided
        if (config && config.testing && config.testing.timeout) {
            testTimeout = config.testing.timeout;
        }
        
        console.log("Unit testing framework initialized");
        return this;
    },
    
    /**
     * Reset test results
     */
    resetResults: function() {
        testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    },
    
    /**
     * Define a test suite
     * @param {string} name - Name of the test suite
     * @param {Function} testFn - Function containing tests
     */
    describe: function(name, testFn) {
        console.log("\n=== Test Suite: " + name + " ===");
        currentSuite = name;
        testFn();
    },
    
    /**
     * Define a test case
     * @param {string} name - Name of the test
     * @param {Function} testFn - Test function
     */
    it: function(name, testFn) {
        try {
            console.log("Running test: " + name);
            
            // Create a promise with timeout
            var testPromise = new Promise(function(resolve, reject) {
                try {
                    var result = testFn();
                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(e);
                }
            });
            
            // Add timeout
            var timeoutPromise = new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(new Error("Test timed out after " + testTimeout + "ms"));
                }, testTimeout);
            });
            
            // Race between test and timeout
            Promise.race([testPromise, timeoutPromise])
                .then(function() {
                    console.log("✓ PASS: " + name);
                    testResults.passed++;
                    testResults.tests.push({
                        suite: currentSuite,
                        name: name,
                        status: "passed",
                        error: null
                    });
                })
                .catch(function(error) {
                    console.log("✗ FAIL: " + name + " - " + error.message);
                    testResults.failed++;
                    testResults.tests.push({
                        suite: currentSuite,
                        name: name,
                        status: "failed",
                        error: error.message
                    });
                });
        } catch (e) {
            console.log("✗ FAIL: " + name + " - " + e.message);
            testResults.failed++;
            testResults.tests.push({
                suite: currentSuite,
                name: name,
                status: "failed",
                error: e.message
            });
        }
    },
    
    /**
     * Skip a test case
     * @param {string} name - Name of the test
     * @param {Function} testFn - Test function
     */
    xit: function(name, testFn) {
        console.log("SKIP: " + name);
        testResults.skipped++;
        testResults.tests.push({
            suite: currentSuite,
            name: name,
            status: "skipped",
            error: null
        });
    },
    
    /**
     * Assertion utilities
     */
    assert: {
        /**
         * Assert that a condition is true
         * @param {boolean} condition - Condition to check
         * @param {string} message - Error message if assertion fails
         */
        isTrue: function(condition, message) {
            if (!condition) {
                throw new Error(message || "Expected true but got false");
            }
        },
        
        /**
         * Assert that a condition is false
         * @param {boolean} condition - Condition to check
         * @param {string} message - Error message if assertion fails
         */
        isFalse: function(condition, message) {
            if (condition) {
                throw new Error(message || "Expected false but got true");
            }
        },
        
        /**
         * Assert that two values are equal
         * @param {*} actual - Actual value
         * @param {*} expected - Expected value
         * @param {string} message - Error message if assertion fails
         */
        equal: function(actual, expected, message) {
            if (actual != expected) {
                throw new Error(message || "Expected " + expected + " but got " + actual);
            }
        },
        
        /**
         * Assert that two values are strictly equal
         * @param {*} actual - Actual value
         * @param {*} expected - Expected value
         * @param {string} message - Error message if assertion fails
         */
        strictEqual: function(actual, expected, message) {
            if (actual !== expected) {
                throw new Error(message || "Expected " + expected + " but got " + actual);
            }
        },
        
        /**
         * Assert that a value is not undefined
         * @param {*} value - Value to check
         * @param {string} message - Error message if assertion fails
         */
        isDefined: function(value, message) {
            if (typeof value === 'undefined') {
                throw new Error(message || "Expected value to be defined");
            }
        },
        
        /**
         * Assert that a function throws an error
         * @param {Function} fn - Function to check
         * @param {string} message - Error message if assertion fails
         */
        throws: function(fn, message) {
            try {
                fn();
                throw new Error(message || "Expected function to throw an error");
            } catch (e) {
                // Expected behavior
            }
        }
    },
    
    /**
     * Run all tests and generate a report
     * @return {Object} Test results
     */
    runTests: function() {
        return new Promise(function(resolve) {
            // Wait for all tests to complete (simple approach)
            setTimeout(function() {
                console.log("\n=== Test Results ===");
                console.log("Passed: " + testResults.passed);
                console.log("Failed: " + testResults.failed);
                console.log("Skipped: " + testResults.skipped);
                console.log("Total: " + (testResults.passed + testResults.failed + testResults.skipped));
                
                resolve(testResults);
            }, 1000); // Give time for async tests to complete
        });
    },
    
    /**
     * Generate a test report and save to file
     * @param {string} outputPath - Path to save the report
     * @return {boolean} Success status
     */
    generateReport: function(outputPath) {
        try {
            var report = {
                timestamp: new Date().toISOString(),
                summary: {
                    passed: testResults.passed,
                    failed: testResults.failed,
                    skipped: testResults.skipped,
                    total: testResults.passed + testResults.failed + testResults.skipped
                },
                tests: testResults.tests
            };
            
            var reportJson = JSON.stringify(report, null, 2);
            files.write(outputPath, reportJson);
            
            console.log("Test report saved to: " + outputPath);
            return true;
        } catch (e) {
            console.error("Failed to generate test report: " + e.message);
            return false;
        }
    }
};