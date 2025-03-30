/**
 * Crash Recovery System for Subway Surfers Bot
 * Implements Phase 6.3: Reliability Improvements - Crash Recovery
 * 
 * Features:
 * - Error detection and handling
 * - Automatic restart after failures
 * - Game state recovery
 * - Error logging and reporting
 */

// Import required modules
var utils = require('../utils.js');

// Error tracking variables
var errorHistory = [];
var lastErrorTime = 0;
var consecutiveErrors = 0;
var isRecovering = false;
var recoveryAttempts = 0;
var maxRecoveryAttempts = 3;

// Game state tracking
var lastKnownGameState = "unknown";
var lastScreenshotBeforeError = null;

module.exports = {
    /**
     * Initialize the crash recovery system
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing crash recovery system...");
        
        // Reset error tracking
        this.resetErrorTracking();
        
        // Update configuration if provided
        if (config && config.reliability && config.reliability.recovery) {
            if (config.reliability.recovery.maxRecoveryAttempts) {
                maxRecoveryAttempts = config.reliability.recovery.maxRecoveryAttempts;
            }
        }
        
        // Set up global error handler if possible
        this.setupGlobalErrorHandler();
        
        console.log("Crash recovery system initialized");
        return this;
    },
    
    /**
     * Reset error tracking variables
     */
    resetErrorTracking: function() {
        errorHistory = [];
        lastErrorTime = 0;
        consecutiveErrors = 0;
        isRecovering = false;
        recoveryAttempts = 0;
        lastKnownGameState = "unknown";
        lastScreenshotBeforeError = null;
    },
    
    /**
     * Set up global error handler
     */
    setupGlobalErrorHandler: function() {
        try {
            // Try to set up a global error handler using AutoJS's Thread.setUncaughtExceptionHandler
            if (typeof Thread !== 'undefined' && Thread.setUncaughtExceptionHandler) {
                Thread.setUncaughtExceptionHandler(function(thread, ex) {
                    console.error("Uncaught error detected: " + ex.message);
                    this.handleError(ex, "uncaught");
                }.bind(this));
                console.log("Global error handler set up successfully");
            } else {
                console.log("Global error handler not available, using try-catch blocks instead");
            }
        } catch (e) {
            console.error("Failed to set up global error handler: " + e.message);
        }
    },
    
    /**
     * Update the last known game state
     * @param {string} state - Current game state ("menu", "playing", "game_over", etc.)
     * @param {Object} screenshot - Current screenshot (optional)
     */
    updateGameState: function(state, screenshot) {
        lastKnownGameState = state;
        
        // Store the last screenshot if provided (for debugging)
        if (screenshot) {
            lastScreenshotBeforeError = screenshot;
        }
    },
    
    /**
     * Handle an error that occurred during bot operation
     * @param {Error} error - The error object
     * @param {string} context - Context where the error occurred
     * @return {boolean} True if recovery was successful, false otherwise
     */
    handleError: function(error, context) {
        var now = Date.now();
        var errorInfo = {
            timestamp: now,
            message: error.message,
            stack: error.stack,
            context: context || "unknown",
            gameState: lastKnownGameState
        };
        
        // Add to error history
        errorHistory.push(errorInfo);
        
        // Log the error
        console.error("Error in " + context + ": " + error.message);
        utils.logToFile("ERROR [" + new Date().toISOString() + "] " + context + ": " + error.message);
        
        // Check if this is a consecutive error
        if (now - lastErrorTime < 10000) { // 10 seconds
            consecutiveErrors++;
        } else {
            consecutiveErrors = 1;
        }
        
        lastErrorTime = now;
        
        // Save error screenshot if possible
        this.saveErrorScreenshot();
        
        // Attempt recovery
        return this.attemptRecovery(errorInfo);
    },
    
    /**
     * Save a screenshot of the error state for debugging
     */
    saveErrorScreenshot: function() {
        try {
            var screenshotPath = "/storage/emulated/0/SubwayBot/error_screenshots/";
            files.ensureDir(screenshotPath);
            
            var filename = screenshotPath + "error_" + new Date().getTime() + ".png";
            var screenshot = captureScreen();
            images.save(screenshot, filename);
            console.log("Error screenshot saved to: " + filename);
        } catch (e) {
            console.error("Failed to save error screenshot: " + e.message);
        }
    },
    
    /**
     * Attempt to recover from an error
     * @param {Object} errorInfo - Information about the error
     * @return {boolean} True if recovery was successful, false otherwise
     */
    attemptRecovery: function(errorInfo) {
        if (isRecovering) {
            console.log("Already in recovery mode, skipping additional recovery");
            return false;
        }
        
        isRecovering = true;
        recoveryAttempts++;
        
        console.log("Attempting recovery (attempt " + recoveryAttempts + " of " + maxRecoveryAttempts + ")");
        
        // Check if we've exceeded the maximum number of recovery attempts
        if (recoveryAttempts > maxRecoveryAttempts) {
            console.error("Maximum recovery attempts exceeded. Giving up.");
            isRecovering = false;
            return false;
        }
        
        // Different recovery strategies based on game state
        var recoverySuccess = false;
        
        try {
            switch (lastKnownGameState) {
                case "menu":
                    recoverySuccess = this.recoverFromMenuState();
                    break;
                case "playing":
                    recoverySuccess = this.recoverFromPlayingState();
                    break;
                case "game_over":
                    recoverySuccess = this.recoverFromGameOverState();
                    break;
                default:
                    recoverySuccess = this.recoverFromUnknownState();
            }
            
            if (recoverySuccess) {
                console.log("Recovery successful!");
                // Reset consecutive errors but keep recovery attempts count
                consecutiveErrors = 0;
            } else {
                console.log("Recovery failed, will try again later");
            }
        } catch (e) {
            console.error("Error during recovery attempt: " + e.message);
            recoverySuccess = false;
        }
        
        isRecovering = false;
        return recoverySuccess;
    },
    
    /**
     * Recover from an error in the menu state
     * @return {boolean} True if recovery was successful, false otherwise
     */
    recoverFromMenuState: function() {
        console.log("Attempting to recover from menu state");
        
        try {
            // Try to find and press the play button
            sleep(2000); // Wait for UI to stabilize
            
            // Look for play button text in multiple languages
            var playButtons = ["PLAY", "GIOCA", "START", "JUGAR", "JOUER", "SPIELEN"];
            var found = false;
            
            for (var i = 0; i < playButtons.length; i++) {
                var button = text(playButtons[i]).findOne(1000);
                if (button) {
                    console.log("Found play button: " + playButtons[i]);
                    button.click();
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                // Try tapping the center of the screen as fallback
                console.log("Play button not found, tapping center of screen");
                var screenWidth = device.width;
                var screenHeight = device.height;
                click(screenWidth / 2, screenHeight / 2);
            }
            
            sleep(3000); // Wait for game to start
            return true;
        } catch (e) {
            console.error("Error during menu recovery: " + e.message);
            return false;
        }
    },
    
    /**
     * Recover from an error during gameplay
     * @return {boolean} True if recovery was successful, false otherwise
     */
    recoverFromPlayingState: function() {
        console.log("Attempting to recover from playing state");
        
        try {
            // First check if we're actually in the game over screen
            sleep(2000); // Wait for UI to stabilize
            
            // Look for game over indicators
            var gameOverButtons = ["TRY AGAIN", "RIPROVA", "REVIVE", "CONTINUE", "REINTENTAR"];
            var found = false;
            
            for (var i = 0; i < gameOverButtons.length; i++) {
                var button = text(gameOverButtons[i]).findOne(1000);
                if (button) {
                    console.log("Found game over screen");
                    button.click();
                    found = true;
                    break;
                }
            }
            
            if (found) {
                // We were actually in game over screen
                sleep(3000); // Wait for game to restart
                return true;
            }
            
            // We're still in the game, try to continue playing
            // Perform a jump action to ensure the character is still moving
            console.log("Attempting to continue gameplay");
            swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.3, 200);
            
            sleep(1000);
            return true;
        } catch (e) {
            console.error("Error during gameplay recovery: " + e.message);
            return false;
        }
    },
    
    /**
     * Recover from an error in the game over state
     * @return {boolean} True if recovery was successful, false otherwise
     */
    recoverFromGameOverState: function() {
        console.log("Attempting to recover from game over state");
        
        try {
            // Try to find and press the try again button
            sleep(2000); // Wait for UI to stabilize
            
            // Look for try again button in multiple languages
            var tryAgainButtons = ["TRY AGAIN", "RIPROVA", "REVIVE", "CONTINUE", "REINTENTAR"];
            var found = false;
            
            for (var i = 0; i < tryAgainButtons.length; i++) {
                var button = text(tryAgainButtons[i]).findOne(1000);
                if (button) {
                    console.log("Found try again button: " + tryAgainButtons[i]);
                    button.click();
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                // Try tapping the center of the screen as fallback
                console.log("Try again button not found, tapping center of screen");
                var screenWidth = device.width;
                var screenHeight = device.height;
                click(screenWidth / 2, screenHeight * 0.7); // Try lower part of screen where buttons usually are
            }
            
            sleep(3000); // Wait for game to restart
            return true;
        } catch (e) {
            console.error("Error during game over recovery: " + e.message);
            return false;
        }
    },
    
    /**
     * Recover from an error when the game state is unknown
     * @return {boolean} True if recovery was successful, false otherwise
     */
    recoverFromUnknownState: function() {
        console.log("Attempting to recover from unknown state");
        
        try {
            // Try a series of actions to get back to a known state
            sleep(2000); // Wait for UI to stabilize
            
            // First, try pressing back button to exit any dialogs
            console.log("Pressing back button");
            back();
            sleep(1000);
            
            // Then try tapping the center of the screen
            console.log("Tapping center of screen");
            var screenWidth = device.width;
            var screenHeight = device.height;
            click(screenWidth / 2, screenHeight / 2);
            sleep(1000);
            
            // If all else fails, try restarting the app
            if (recoveryAttempts >= 2) {
                console.log("Attempting to restart the app");
                var packageName = "com.kiloo.subwaysurf";
                app.launch(packageName);
                sleep(5000); // Wait for app to start
            }
            
            return true;
        } catch (e) {
            console.error("Error during unknown state recovery: " + e.message);
            return false;
        }
    },
    
    /**
     * Check if the bot is currently in a recovery state
     * @return {boolean} True if in recovery mode, false otherwise
     */
    isInRecoveryMode: function() {
        return isRecovering;
    },
    
    /**
     * Get error statistics
     * @return {Object} Error statistics
     */
    getErrorStats: function() {
        return {
            totalErrors: errorHistory.length,
            consecutiveErrors: consecutiveErrors,
            recoveryAttempts: recoveryAttempts,
            lastErrorTime: lastErrorTime,
            isRecovering: isRecovering
        };
    },
    
    /**
     * Get detailed error history
     * @param {number} limit - Maximum number of errors to return (0 for all)
     * @return {Array} Error history
     */
    getErrorHistory: function(limit) {
        if (!limit || limit <= 0) {
            return errorHistory;
        }
        return errorHistory.slice(-limit);
    }
};