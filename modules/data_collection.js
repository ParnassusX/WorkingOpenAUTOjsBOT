/**
 * Data Collection Module for Subway Surfers Bot
 * Implements Phase 4.1: Data Collection features
 * 
 * Features:
 * - Training data recording system
 * - Screenshot capture and labeling
 * - User action recording with timestamps
 * - Data storage and retrieval system
 */

// Import required modules
var utils = require('./utils.js');
var vision = require('./vision.js');
var dataProcessing = require('./data_processing.js');
var datasetVersioning = require('./dataset_versioning.js');

// Data collection state
var collectionState = {
    isRecording: false,
    startTime: 0,
    sessionId: "",
    samplesCollected: 0,
    lastSampleTime: 0,
    lastActionTime: 0,
    currentScreenshots: [],
    currentActions: [],
    sessionStats: {}
};

// Paths for data storage (will be updated at runtime)
var dataPaths = {
    screenshots: "/storage/emulated/0/SubwayBot/screenshots/",
    actions: "/storage/emulated/0/SubwayBot/actions/",
    sessions: "/storage/emulated/0/SubwayBot/sessions/",
    merged: "/storage/emulated/0/SubwayBot/training_data/"
};

module.exports = {
    /**
     * Initializes the data collection module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing data collection module...");
        
        // Update paths based on config
        if (config && config.training) {
            dataPaths.screenshots = config.training.screenshotPath || dataPaths.screenshots;
            dataPaths.merged = config.training.trainingPath || dataPaths.merged;
            dataPaths.actions = config.training.dataPath + "actions/";
            dataPaths.sessions = config.training.dataPath + "sessions/";
        }
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Reset collection state
        this.resetCollectionState();
        
        console.log("Data collection module initialized");
        return true;
    },
    
    /**
     * Ensures all required directories exist
     */
    ensureDirectories: function() {
        try {
            for (var key in dataPaths) {
                var path = dataPaths[key];
                if (!files.exists(path)) {
                    files.createWithDirs(path);
                    console.log("Created directory: " + path);
                }
            }
        } catch (e) {
            console.error("Error creating directories: " + e.message);
        }
    },
    
    /**
     * Resets the collection state
     */
    resetCollectionState: function() {
        collectionState = {
            isRecording: false,
            startTime: 0,
            sessionId: "",
            samplesCollected: 0,
            lastSampleTime: 0,
            lastActionTime: 0,
            currentScreenshots: [],
            currentActions: [],
            sessionStats: {}
        };
    },
    
    /**
     * Starts a new recording session
     * @return {boolean} Success status
     */
    startRecording: function() {
        if (collectionState.isRecording) {
            console.log("Already recording, stopping current session first");
            this.stopRecording();
        }
        
        try {
            // Generate unique session ID
            var timestamp = Date.now();
            var sessionId = "session_" + timestamp;
            
            collectionState.isRecording = true;
            collectionState.startTime = timestamp;
            collectionState.sessionId = sessionId;
            collectionState.lastSampleTime = timestamp;
            collectionState.lastActionTime = timestamp;
            collectionState.samplesCollected = 0;
            collectionState.currentScreenshots = [];
            collectionState.currentActions = [];
            collectionState.sessionStats = {
                startTime: timestamp,
                endTime: 0,
                duration: 0,
                sampleCount: 0,
                actionCount: 0,
                averageFps: 0
            };
            
            console.log("Started recording session: " + sessionId);
            return true;
        } catch (e) {
            console.error("Error starting recording: " + e.message);
            return false;
        }
    },
    
    /**
     * Stops the current recording session and saves collected data
     * @return {boolean} Success status
     */
    stopRecording: function() {
        if (!collectionState.isRecording) {
            console.log("Not currently recording");
            return false;
        }
        
        try {
            var endTime = Date.now();
            var duration = endTime - collectionState.startTime;
            
            // Update session stats
            collectionState.sessionStats.endTime = endTime;
            collectionState.sessionStats.duration = duration;
            collectionState.sessionStats.sampleCount = collectionState.samplesCollected;
            collectionState.sessionStats.actionCount = collectionState.currentActions.length;
            collectionState.sessionStats.averageFps = duration > 0 ? 
                (collectionState.samplesCollected * 1000 / duration).toFixed(2) : 0;
            
            // Save session data
            this.saveSessionData();
            
            // Reset state
            var sessionId = collectionState.sessionId;
            var sampleCount = collectionState.samplesCollected;
            this.resetCollectionState();
            
            console.log("Stopped recording session: " + sessionId + 
                      " with " + sampleCount + " samples");
            return true;
        } catch (e) {
            console.error("Error stopping recording: " + e.message);
            return false;
        }
    },
    
    /**
     * Captures the current screen and adds it to the dataset
     * @param {Object} gameState - Current game state from vision module
     * @param {number} timestamp - Optional timestamp (defaults to now)
     * @return {boolean} Success status
     */
    captureScreen: function(gameState, timestamp) {
        if (!collectionState.isRecording) {
            return false;
        }
        
        timestamp = timestamp || Date.now();
        var timeSinceLastSample = timestamp - collectionState.lastSampleTime;
        
        try {
            // Capture screen image
            var img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return false;
            }
            
            // Generate filename
            var filename = collectionState.sessionId + "_" + 
                         collectionState.samplesCollected + ".png";
            var filepath = dataPaths.screenshots + filename;
            
            // Save image
            images.save(img, filepath);
            
            // Create metadata
            var metadata = {
                timestamp: timestamp,
                filename: filename,
                index: collectionState.samplesCollected,
                timeSinceLastSample: timeSinceLastSample,
                gameState: gameState || {}
            };
            
            // Add to current screenshots
            collectionState.currentScreenshots.push(metadata);
            collectionState.samplesCollected++;
            collectionState.lastSampleTime = timestamp;
            
            // Periodically save data to prevent loss
            if (collectionState.samplesCollected % 50 === 0) {
                this.saveSessionData();
            }
            
            return true;
        } catch (e) {
            console.error("Error capturing screen: " + e.message);
            return false;
        }
    },
    
    /**
     * Records a user action with the current game state
     * @param {string} actionType - Type of action (swipe_left, swipe_right, swipe_up, swipe_down, tap)
     * @param {Object} actionData - Additional action data
     * @param {Object} gameState - Current game state from vision module
     * @param {number} timestamp - Optional timestamp (defaults to now)
     * @return {boolean} Success status
     */
    recordAction: function(actionType, actionData, gameState, timestamp) {
        if (!collectionState.isRecording) {
            return false;
        }
        
        timestamp = timestamp || Date.now();
        var timeSinceLastAction = timestamp - collectionState.lastActionTime;
        
        try {
            // Create action record
            var actionRecord = {
                timestamp: timestamp,
                actionType: actionType,
                actionData: actionData || {},
                timeSinceLastAction: timeSinceLastAction,
                sampleIndex: collectionState.samplesCollected - 1, // Link to last screenshot
                gameState: gameState || {}
            };
            
            // Add to current actions
            collectionState.currentActions.push(actionRecord);
            collectionState.lastActionTime = timestamp;
            
            return true;
        } catch (e) {
            console.error("Error recording action: " + e.message);
            return false;
        }
    },
    
    /**
     * Saves the current session data to storage
     * @return {boolean} Success status
     */
    saveSessionData: function() {
        if (!collectionState.sessionId) {
            return false;
        }
        
        try {
            // Create session data object
            var sessionData = {
                sessionId: collectionState.sessionId,
                stats: collectionState.sessionStats,
                screenshots: collectionState.currentScreenshots,
                actions: collectionState.currentActions
            };
            
            // Save screenshots metadata
            var screenshotsFile = dataPaths.screenshots + collectionState.sessionId + "_metadata.json";
            files.write(screenshotsFile, JSON.stringify(collectionState.currentScreenshots));
            
            // Save actions data
            var actionsFile = dataPaths.actions + collectionState.sessionId + "_actions.json";
            files.write(actionsFile, JSON.stringify(collectionState.currentActions));
            
            // Save session summary
            var sessionFile = dataPaths.sessions + collectionState.sessionId + "_summary.json";
            files.write(sessionFile, JSON.stringify(sessionData));
            
            console.log("Saved session data for: " + collectionState.sessionId);
            return true;
        } catch (e) {
            console.error("Error saving session data: " + e.message);
            return false;
        }
    },
    
    /**
     * Retrieves a list of all recorded sessions
     * @return {Array} List of session summaries
     */
    getRecordedSessions: function() {
        try {
            var sessions = [];
            var sessionFiles = files.listDir(dataPaths.sessions, function(name) {
                return name.endsWith("_summary.json");
            });
            
            for (var i = 0; i < sessionFiles.length; i++) {
                var sessionFile = dataPaths.sessions + sessionFiles[i];
                var sessionData = JSON.parse(files.read(sessionFile));
                sessions.push(sessionData.stats);
            }
            
            return sessions;
        } catch (e) {
            console.error("Error retrieving sessions: " + e.message);
            return [];
        }
    },
    
    /**
     * Loads a specific session's data
     * @param {string} sessionId - ID of the session to load
     * @return {Object} Session data or null if not found
     */
    loadSession: function(sessionId) {
        try {
            var sessionFile = dataPaths.sessions + sessionId + "_summary.json";
            if (!files.exists(sessionFile)) {
                console.error("Session not found: " + sessionId);
                return null;
            }
            
            var sessionData = JSON.parse(files.read(sessionFile));
            return sessionData;
        } catch (e) {
            console.error("Error loading session: " + e.message);
            return null;
        }
    },
    
    /**
     * Merges multiple sessions into a single training dataset
     * @param {Array} sessionIds - Array of session IDs to merge
     * @param {string} datasetName - Name for the merged dataset
     * @return {boolean} Success status
     */
    mergeSessionsIntoDataset: function(sessionIds, datasetName) {
        try {
            if (!sessionIds || sessionIds.length === 0) {
                console.error("No sessions provided for merging");
                return false;
            }
            
            datasetName = datasetName || "dataset_" + Date.now();
            var mergedData = {
                name: datasetName,
                createdAt: Date.now(),
                sessions: sessionIds,
                samples: [],
                actions: []
            };
            
            // Merge each session
            for (var i = 0; i < sessionIds.length; i++) {
                var sessionId = sessionIds[i];
                var session = this.loadSession(sessionId);
                
                if (session) {
                    // Load screenshots metadata
                    var screenshotsFile = dataPaths.screenshots + sessionId + "_metadata.json";
                    var screenshots = JSON.parse(files.read(screenshotsFile));
                    
                    // Load actions
                    var actionsFile = dataPaths.actions + sessionId + "_actions.json";
                    var actions = JSON.parse(files.read(actionsFile));
                    
                    // Add to merged data with session index for reference
                    for (var j = 0; j < screenshots.length; j++) {
                        var screenshot = screenshots[j];
                        screenshot.sessionId = sessionId;
                        screenshot.sessionIndex = i;
                        mergedData.samples.push(screenshot);
                    }
                    
                    for (var k = 0; k < actions.length; k++) {
                        var action = actions[k];
                        action.sessionId = sessionId;
                        action.sessionIndex = i;
                        mergedData.actions.push(action);
                    }
                }
            }
            
            // Save merged dataset
            var datasetFile = dataPaths.merged + datasetName + ".json";
            files.write(datasetFile, JSON.stringify(mergedData));
            
            // Create a new dataset version
            if (typeof datasetVersioning !== 'undefined' && 
                typeof datasetVersioning.createVersion === 'function') {
                datasetVersioning.createVersion(datasetName, mergedData);
            }
            
            console.log("Created merged dataset: " + datasetName + 
                      " with " + mergedData.samples.length + " samples and " + 
                      mergedData.actions.length + " actions");
            return true;
        } catch (e) {
            console.error("Error merging sessions: " + e.message);
            return false;
        }
    },
    
    /**
     * Gets the current recording state
     * @return {Object} Current recording state
     */
    getRecordingState: function() {
        return {
            isRecording: collectionState.isRecording,
            sessionId: collectionState.sessionId,
            samplesCollected: collectionState.samplesCollected,
            actionsRecorded: collectionState.currentActions.length,
            duration: collectionState.isRecording ? 
                (Date.now() - collectionState.startTime) : 0
        };
    },
    
    /**
     * Deletes a specific session and its associated data
     * @param {string} sessionId - ID of the session to delete
     * @return {boolean} Success status
     */
    deleteSession: function(sessionId) {
        try {
            // Check if session exists
            var sessionFile = dataPaths.sessions + sessionId + "_summary.json";
            if (!files.exists(sessionFile)) {
                console.error("Session not found: " + sessionId);
                return false;
            }
            
            // Delete session summary
            files.remove(sessionFile);
            
            // Delete screenshots metadata
            var screenshotsFile = dataPaths.screenshots + sessionId + "_metadata.json";
            if (files.exists(screenshotsFile)) {
                files.remove(screenshotsFile);
            }
            
            // Delete actions data
            var actionsFile = dataPaths.actions + sessionId + "_actions.json";
            if (files.exists(actionsFile)) {
                files.remove(actionsFile);
            }
            
            // Delete screenshot images
            var screenshotFiles = files.listDir(dataPaths.screenshots, function(name) {
                return name.startsWith(sessionId + "_") && name.endsWith(".png");
            });
            
            for (var i = 0; i < screenshotFiles.length; i++) {
                files.remove(dataPaths.screenshots + screenshotFiles[i]);
            }
            
            console.log("Deleted session: " + sessionId);
            return true;
        } catch (e) {
            console.error("Error deleting session: " + e.message);
            return false;
        }
    }
};