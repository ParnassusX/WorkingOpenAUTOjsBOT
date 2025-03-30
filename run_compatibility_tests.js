// Compatibility Test Runner for Subway Surfers Bot
// Run this script before production deployment to verify compatibility

// Import required modules
var testRunner = require('./modules/testing/test_runner.js');
var config = require('./config.js');

// Show console for debugging
console.show();
console.log("Starting Compatibility Tests for Production Readiness...");

// Initialize test runner with custom configuration
testRunner.initialize({
    testing: {
        runUnitTests: false,
        runIntegrationTests: false,
        runPerformanceTests: false,
        runStabilityTests: false,
        runCompatibilityTests: true,
        generateReports: true,
        reportPath: "/storage/emulated/0/SubwayBot/test_reports/",
        testTimeout: 30000 // 30 seconds timeout for tests
    }
});

// Run only compatibility tests
testRunner.runCompatibilityTests().then(function(results) {
    console.log("\n=== Compatibility Test Results ===");
    
    // Check if compatible with MEmu
    if (results.memuCompatibility.compatible) {
        console.log("✓ MEmu Compatibility: PASSED");
        console.log("  Version detected: " + results.memuCompatibility.version);
    } else {
        console.log("✗ MEmu Compatibility: FAILED");
        console.log("  Issues: " + results.memuCompatibility.issues.join(", "));
    }
    
    // Check if compatible with AutoJS/OpenAutoJS
    if (results.autoJsCompatibility.compatible) {
        console.log("✓ AutoJS Compatibility: PASSED");
        console.log("  Version detected: " + results.autoJsCompatibility.version);
    } else {
        console.log("✗ AutoJS Compatibility: FAILED");
        console.log("  Issues: " + results.autoJsCompatibility.issues.join(", "));
    }
    
    // Check environment tests
    var envTests = results.environmentTests;
    var envPassed = envTests.screenCapture && envTests.fileAccess && 
                   envTests.permissions && envTests.touchSimulation;
    
    if (envPassed) {
        console.log("✓ Environment Tests: PASSED");
    } else {
        console.log("✗ Environment Tests: FAILED");
        if (!envTests.screenCapture) console.log("  - Screen capture not working");
        if (!envTests.fileAccess) console.log("  - File access not working");
        if (!envTests.permissions) console.log("  - Required permissions not granted");
        if (!envTests.touchSimulation) console.log("  - Touch simulation not working");
    }
    
    // Overall result
    var overallCompatible = results.memuCompatibility.compatible && 
                           results.autoJsCompatibility.compatible && 
                           envPassed;
    
    console.log("\n=== OVERALL RESULT ===");
    if (overallCompatible) {
        console.log("✓ COMPATIBLE: The bot is ready for production deployment");
    } else {
        console.log("✗ NOT COMPATIBLE: Please fix the issues before production deployment");
    }
});