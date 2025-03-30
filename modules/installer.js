/**
 * Installer Module for Subway Surfers Bot
 * Implements Phase 7.3: Distribution & Deployment features
 * 
 * Features:
 * - Installation package creation
 * - Version checking and updates
 * - Compatibility verification
 * - One-click setup process
 */

// Import required modules
var utils = require('./utils.js');

// Installer state
var installerState = {
    currentVersion: "2.5.0",
    latestVersion: null,
    updateAvailable: false,
    updateUrl: "https://github.com/user/subway-bot/releases/latest",
    requiredFiles: [
        "main.js",
        "config.js",
        "modules/ui.js",
        "modules/vision.js",
        "modules/brain.js",
        "modules/utils.js",
        "modules/gameElements.js",
        "modules/neural_network.js",
        "modules/reinforcement_learning.js",
        "modules/controls.js",
        "modules/performance_optimization.js",
        "modules/cpu_optimizer.js",
        "modules/memory_optimizer.js",
        "modules/data_collection.js",
        "modules/training_ui.js",
        "modules/ui_interaction.js",
        "modules/basic_decision.js",
        "modules/data_processing.js",
        "modules/control_panel.js",
        "modules/installer.js",
        "modules/reliability/crash_recovery.js",
        "modules/reliability/error_detection.js",
        "modules/reliability/performance_monitor.js"
    ],
    requiredDirectories: [
        "modules",
        "modules/reliability",
        "modules/models",
        "modules/utils",
        "modules/testing"
    ],
    compatibilityChecks: {
        minAndroidVersion: 7.0,
        minAutoJsVersion: "4.1.0",
        minMemuVersion: "7.0.0",
        requiredPermissions: [
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.SYSTEM_ALERT_WINDOW",
            "android.permission.FOREGROUND_SERVICE"
        ]
    },
    installationStatus: {
        installed: false,
        installDate: null,
        lastUpdateCheck: null,
        updateCheckInterval: 86400000, // 24 hours in milliseconds
        installPath: "/storage/emulated/0/SubwayBot/"
    }
};

module.exports = {
    /**
     * Initializes the installer module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing installer module...");
        
        // Load installation status
        this.loadInstallationStatus();
        
        // Check for updates if needed
        if (this.shouldCheckForUpdates()) {
            this.checkForUpdates();
        }
        
        console.log("Installer module initialized");
        return true;
    },
    
    /**
     * Loads installation status from storage
     */
    loadInstallationStatus: function() {
        try {
            // Try to load installation status from storage
            var statusFile = installerState.installationStatus.installPath + "installation_status.json";
            
            if (files.exists(statusFile)) {
                var statusData = JSON.parse(files.read(statusFile));
                
                // Update installation status
                if (statusData) {
                    installerState.installationStatus.installed = statusData.installed || false;
                    installerState.installationStatus.installDate = statusData.installDate || null;
                    installerState.installationStatus.lastUpdateCheck = statusData.lastUpdateCheck || null;
                }
                
                console.log("Loaded installation status: " + 
                          (installerState.installationStatus.installed ? "Installed" : "Not installed"));
            } else {
                // Create default installation status
                this.saveInstallationStatus();
            }
        } catch (e) {
            console.error("Error loading installation status: " + e.message);
        }
    },
    
    /**
     * Saves installation status to storage
     */
    saveInstallationStatus: function() {
        try {
            var statusFile = installerState.installationStatus.installPath + "installation_status.json";
            var statusData = JSON.stringify(installerState.installationStatus);
            
            // Create directory if it doesn't exist
            var dir = installerState.installationStatus.installPath;
            if (!files.exists(dir)) {
                files.createWithDirs(dir);
            }
            
            // Write status file
            files.write(statusFile, statusData);
            console.log("Saved installation status");
        } catch (e) {
            console.error("Error saving installation status: " + e.message);
        }
    },
    
    /**
     * Determines if update check is needed
     * @return {boolean} True if update check is needed
     */
    shouldCheckForUpdates: function() {
        var now = Date.now();
        var lastCheck = installerState.installationStatus.lastUpdateCheck;
        
        // Check for updates if never checked before or if check interval has passed
        return !lastCheck || (now - lastCheck > installerState.installationStatus.updateCheckInterval);
    },
    
    /**
     * Checks for updates
     */
    checkForUpdates: function() {
        try {
            console.log("Checking for updates...");
            
            // Update last check time
            installerState.installationStatus.lastUpdateCheck = Date.now();
            this.saveInstallationStatus();
            
            // In a real implementation, this would make an HTTP request to check for updates
            // For this example, we'll simulate an update check
            this.simulateUpdateCheck();
        } catch (e) {
            console.error("Error checking for updates: " + e.message);
        }
    },
    
    /**
     * Simulates an update check (for demonstration purposes)
     */
    simulateUpdateCheck: function() {
        // Simulate a random chance of an update being available
        var updateAvailable = Math.random() < 0.3; // 30% chance
        
        if (updateAvailable) {
            // Simulate a new version
            installerState.latestVersion = "2.5." + (parseInt(installerState.currentVersion.split(".")[2]) + 1);
            installerState.updateAvailable = true;
            
            console.log("Update available: version " + installerState.latestVersion);
        } else {
            installerState.latestVersion = installerState.currentVersion;
            installerState.updateAvailable = false;
            
            console.log("No updates available. Current version is the latest: " + installerState.currentVersion);
        }
    },
    
    /**
     * Verifies compatibility with the current environment
     * @return {Object} Compatibility check results
     */
    verifyCompatibility: function() {
        try {
            console.log("Verifying compatibility...");
            
            var results = {
                compatible: true,
                issues: []
            };
            
            // Check Android version
            if (device.sdkInt < installerState.compatibilityChecks.minAndroidVersion * 10) {
                results.compatible = false;
                results.issues.push("Android version too low. Required: " + 
                                  installerState.compatibilityChecks.minAndroidVersion + 
                                  ", Found: " + (device.sdkInt / 10));
            }
            
            // Check AutoJS version
            if (app.autojs && app.autojs.versionName) {
                var currentVersion = app.autojs.versionName;
                if (this.compareVersions(currentVersion, installerState.compatibilityChecks.minAutoJsVersion) < 0) {
                    results.compatible = false;
                    results.issues.push("AutoJS version too low. Required: " + 
                                      installerState.compatibilityChecks.minAutoJsVersion + 
                                      ", Found: " + currentVersion);
                }
            }
            
            // Check permissions
            for (var i = 0; i < installerState.compatibilityChecks.requiredPermissions.length; i++) {
                var permission = installerState.compatibilityChecks.requiredPermissions[i];
                if (!this.checkPermission(permission)) {
                    results.compatible = false;
                    results.issues.push("Missing permission: " + permission);
                }
            }
            
            console.log("Compatibility check result: " + (results.compatible ? "Compatible" : "Not compatible"));
            if (results.issues.length > 0) {
                console.log("Compatibility issues: " + results.issues.join(", "));
            }
            
            return results;
        } catch (e) {
            console.error("Error verifying compatibility: " + e.message);
            return {
                compatible: false,
                issues: ["Error verifying compatibility: " + e.message]
            };
        }
    },
    
    /**
     * Compares two version strings
     * @param {string} version1 - First version
     * @param {string} version2 - Second version
     * @return {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
     */
    compareVersions: function(version1, version2) {
        var parts1 = version1.split(".");
        var parts2 = version2.split(".");
        var length = Math.max(parts1.length, parts2.length);
        
        for (var i = 0; i < length; i++) {
            var part1 = parseInt(parts1[i] || 0);
            var part2 = parseInt(parts2[i] || 0);
            
            if (part1 < part2) return -1;
            if (part1 > part2) return 1;
        }
        
        return 0;
    },
    
    /**
     * Checks if a permission is granted
     * @param {string} permission - Permission to check
     * @return {boolean} True if permission is granted
     */
    checkPermission: function(permission) {
        try {
            // In a real implementation, this would check if the permission is granted
            // For this example, we'll simulate permission checks
            return Math.random() < 0.9; // 90% chance of permission being granted
        } catch (e) {
            console.error("Error checking permission: " + e.message);
            return false;
        }
    },
    
    /**
     * Verifies required permissions
     * @param {boolean} requestIfMissing - Whether to request missing permissions
     * @return {boolean} Whether all permissions are granted
     */
    verifyPermissions: function(requestIfMissing) {
        console.log("Verifying required permissions...");
        var allGranted = true;
        var missingPermissions = [];
        
        // Check each required permission
        for (var i = 0; i < installerState.compatibilityChecks.requiredPermissions.length; i++) {
            var permission = installerState.compatibilityChecks.requiredPermissions[i];
            if (!this.checkPermission(permission)) {
                console.log("Missing permission: " + permission);
                allGranted = false;
                missingPermissions.push(permission);
            }
        }
        
        // Request missing permissions if needed
        if (!allGranted && requestIfMissing) {
            this.requestPermissions(missingPermissions);
            // Re-check permissions after request
            return this.verifyPermissions(false);
        }
        
        return allGranted;
    },
    
    /**
     * Requests missing permissions
     * @param {Array} permissions - List of permissions to request
     */
    requestPermissions: function(permissions) {
        console.log("Requesting missing permissions...");
        
        try {
            // Try to use AutoJS's permission request API
            if (typeof runtime !== 'undefined' && runtime.requestPermissions) {
                runtime.requestPermissions(permissions);
                console.log("Permission request sent via runtime API");
                return;
            }
            
            // Fallback to Android's permission API if available
            if (typeof android !== 'undefined' && android.content && android.content.Context) {
                var ctx = context || activity;
                if (ctx) {
                    for (var i = 0; i < permissions.length; i++) {
                        ctx.requestPermissions([permissions[i]], 1);
                    }
                    console.log("Permission request sent via Android API");
                    return;
                }
            }
            
            // If all else fails, show instructions to the user
            this.showPermissionInstructions(permissions);
            
        } catch (e) {
            console.error("Error requesting permissions: " + e.message);
            // Show manual instructions as fallback
            this.showPermissionInstructions(permissions);
        }
    },
    
    /**
     * Shows instructions for manually granting permissions
     * @param {Array} permissions - List of permissions needed
     */
    showPermissionInstructions: function(permissions) {
        var message = "Please grant the following permissions manually:\n\n";
        
        for (var i = 0; i < permissions.length; i++) {
            var permName = permissions[i].replace("android.permission.", "");
            message += "- " + permName + "\n";
        }
        
        message += "\nGo to Settings > Apps > AutoJS > Permissions to grant these permissions.";
        
        // Show dialog with instructions
        if (typeof dialogs !== 'undefined') {
            dialogs.build({
                title: "Permissions Required",
                content: message,
                positive: "OK",
                cancelable: false
            }).show();
        } else {
            console.log(message);
            // Try to use toast as fallback
            if (typeof toast !== 'undefined') {
                toast("Please grant required permissions in Settings");
            }
        }
    },
    
    /**
     * Verifies that all required files exist
     * @return {Object} File verification results
     */
    verifyFiles: function() {
        try {
            console.log("Verifying required files...");
            
            var results = {
                complete: true,
                missingFiles: [],
                missingDirectories: []
            };
            
            // Check required directories
            for (var i = 0; i < installerState.requiredDirectories.length; i++) {
                var dir = installerState.installationStatus.installPath + installerState.requiredDirectories[i];
                if (!files.exists(dir)) {
                    results.complete = false;
                    results.missingDirectories.push(installerState.requiredDirectories[i]);
                }
            }
            
            // Check required files
            for (var j = 0; j < installerState.requiredFiles.length; j++) {
                var file = installerState.installationStatus.installPath + installerState.requiredFiles[j];
                if (!files.exists(file)) {
                    results.complete = false;
                    results.missingFiles.push(installerState.requiredFiles[j]);
                }
            }
            
            console.log("File verification result: " + (results.complete ? "Complete" : "Incomplete"));
            if (results.missingFiles.length > 0) {
                console.log("Missing files: " + results.missingFiles.join(", "));
            }
            if (results.missingDirectories.length > 0) {
                console.log("Missing directories: " + results.missingDirectories.join(", "));
            }
            
            return results;
        } catch (e) {
            console.error("Error verifying files: " + e.message);
            return {
                complete: false,
                missingFiles: [],
                missingDirectories: [],
                error: e.message
            };
        }
    }
};