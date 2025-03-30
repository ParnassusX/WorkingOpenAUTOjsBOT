/**
 * Training Mode UI Module for Subway Surfers Bot
 * Implements Phase 4.2: Training Mode UI features
 * 
 * Features:
 * - Training mode toggle
 * - Visual indicators for recording status
 * - Training session management
 * - Training data review interface
 */

// Import required modules
var utils = require('./utils.js');
var ui = require('./ui.js');
var dataCollection = require('./data_collection.js');

// UI state for training mode
var trainingUIState = {
    isVisible: false,
    currentScreen: "main", // main, recording, review, settings
    floatingControls: null,
    statusIndicator: null,
    sessionInfo: null,
    reviewData: null
};

// Colors for UI elements
var uiColors = {
    recording: "#FF0000", // Red for recording
    stopped: "#4CAF50", // Green for stopped/ready
    background: "#333333", // Dark background
    text: "#FFFFFF", // White text
    highlight: "#2196F3" // Blue highlight
};

module.exports = {
    /**
     * Initializes the training mode UI
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing training mode UI...");
        
        // Reset UI state
        this.resetUIState();
        
        // Create floating controls if not already created
        if (!trainingUIState.floatingControls) {
            this.createFloatingControls();
        }
        
        console.log("Training mode UI initialized");
        return true;
    },
    
    /**
     * Resets the UI state
     */
    resetUIState: function() {
        // Close any existing UI elements
        this.hideAllUI();
        
        trainingUIState = {
            isVisible: false,
            currentScreen: "main",
            floatingControls: null,
            statusIndicator: null,
            sessionInfo: null,
            reviewData: null
        };
    },
    
    /**
     * Creates the floating controls for training mode
     */
    createFloatingControls: function() {
        try {
            // Create floating window using AutoJS's UI builder
            var window = floaty.window(
                '<frame gravity="center">' +
                '    <vertical>' +
                '        <button id="recordBtn" text="REC" w="50" h="50" bg="#4CAF50"/>' +
                '        <button id="menuBtn" text="≡" w="50" h="50" bg="#2196F3"/>' +
                '    </vertical>' +
                '</frame>'
            );
            
            // Position the window
            window.setPosition(50, 300);
            
            // Set up button click handlers
            window.recordBtn.click(() => {
                this.toggleRecording();
            });
            
            window.menuBtn.click(() => {
                this.showTrainingMenu();
            });
            
            // Store the window reference
            trainingUIState.floatingControls = window;
            
            // Create status indicator
            this.createStatusIndicator();
            
            console.log("Created floating controls for training mode");
        } catch (e) {
            console.error("Error creating floating controls: " + e.message);
        }
    },
    
    /**
     * Creates the status indicator for recording
     */
    createStatusIndicator: function() {
        try {
            // Create floating window for status indicator
            var statusWindow = floaty.window(
                '<frame gravity="center">' +
                '    <horizontal>' +
                '        <text id="statusText" text="Ready" textColor="#FFFFFF" textSize="12sp"/>' +
                '        <text id="statusDot" text="●" textColor="#4CAF50" textSize="16sp" marginLeft="5"/>' +
                '    </horizontal>' +
                '</frame>'
            );
            
            // Position at top of screen
            statusWindow.setPosition(device.width - 150, 100);
            
            // Store the window reference
            trainingUIState.statusIndicator = statusWindow;
            
            console.log("Created status indicator");
        } catch (e) {
            console.error("Error creating status indicator: " + e.message);
        }
    },
    
    /**
     * Toggles recording state
     */
    toggleRecording: function() {
        try {
            // Get current recording state
            var recordingState = dataCollection.getRecordingState();
            
            if (recordingState.isRecording) {
                // Stop recording
                dataCollection.stopRecording();
                
                // Update UI
                if (trainingUIState.floatingControls) {
                    trainingUIState.floatingControls.recordBtn.setText("REC");
                    trainingUIState.floatingControls.recordBtn.setBackgroundColor(colors.parseColor(uiColors.stopped));
                }
                
                if (trainingUIState.statusIndicator) {
                    trainingUIState.statusIndicator.statusText.setText("Ready");
                    trainingUIState.statusIndicator.statusDot.setTextColor(colors.parseColor(uiColors.stopped));
                }
                
                // Show session summary
                this.showSessionSummary(recordingState);
            } else {
                // Start recording
                dataCollection.startRecording();
                
                // Update UI
                if (trainingUIState.floatingControls) {
                    trainingUIState.floatingControls.recordBtn.setText("STOP");
                    trainingUIState.floatingControls.recordBtn.setBackgroundColor(colors.parseColor(uiColors.recording));
                }
                
                if (trainingUIState.statusIndicator) {
                    trainingUIState.statusIndicator.statusText.setText("Recording");
                    trainingUIState.statusIndicator.statusDot.setTextColor(colors.parseColor(uiColors.recording));
                }
                
                // Start session info display
                this.createSessionInfoDisplay();
            }
        } catch (e) {
            console.error("Error toggling recording: " + e.message);
        }
    },
    
    /**
     * Creates the session info display
     */
    createSessionInfoDisplay: function() {
        try {
            // Remove existing session info if any
            if (trainingUIState.sessionInfo) {
                trainingUIState.sessionInfo.close();
                trainingUIState.sessionInfo = null;
            }
            
            // Create floating window for session info
            var infoWindow = floaty.window(
                '<frame gravity="left" bg="#33000000" padding="5">' +
                '    <vertical>' +
                '        <text id="sessionId" text="Session: -" textColor="#FFFFFF" textSize="10sp"/>' +
                '        <text id="sampleCount" text="Samples: 0" textColor="#FFFFFF" textSize="10sp"/>' +
                '        <text id="actionCount" text="Actions: 0" textColor="#FFFFFF" textSize="10sp"/>' +
                '        <text id="duration" text="Time: 0s" textColor="#FFFFFF" textSize="10sp"/>' +
                '    </vertical>' +
                '</frame>'
            );
            
            // Position at bottom left
            infoWindow.setPosition(10, device.height - 200);
            
            // Store the window reference
            trainingUIState.sessionInfo = infoWindow;
            
            // Start update interval
            this.startSessionInfoUpdates();
            
            console.log("Created session info display");
        } catch (e) {
            console.error("Error creating session info display: " + e.message);
        }
    },
    
    /**
     * Starts periodic updates for session info
     */
    startSessionInfoUpdates: function() {
        // Create interval to update session info
        var updateInterval = setInterval(function() {
            try {
                // Get current recording state
                var recordingState = dataCollection.getRecordingState();
                
                // If not recording anymore, clear interval
                if (!recordingState.isRecording) {
                    clearInterval(updateInterval);
                    return;
                }
                
                // Update session info display
                if (trainingUIState.sessionInfo) {
                    var sessionId = recordingState.sessionId.split('_')[1] || recordingState.sessionId;
                    trainingUIState.sessionInfo.sessionId.setText("Session: " + sessionId);
                    trainingUIState.sessionInfo.sampleCount.setText("Samples: " + recordingState.samplesCollected);
                    trainingUIState.sessionInfo.actionCount.setText("Actions: " + recordingState.actionsRecorded);
                    
                    // Format duration
                    var seconds = Math.floor(recordingState.duration / 1000);
                    var minutes = Math.floor(seconds / 60);
                    seconds = seconds % 60;
                    trainingUIState.sessionInfo.duration.setText(
                        "Time: " + minutes + "m " + seconds + "s"
                    );
                }
            } catch (e) {
                console.error("Error updating session info: " + e.message);
                clearInterval(updateInterval);
            }
        }, 1000); // Update every second
    },
    
    /**
     * Shows the training menu
     */
    showTrainingMenu: function() {
        try {
            // Set current screen
            trainingUIState.currentScreen = "menu";
            
            // Create dialog for training menu
            var dialog = dialogs.build({
                title: "Training Mode Menu",
                content: "Select an option:",
                positive: "Close",
                items: ["View Sessions", "Review Data", "Settings", "Help"]
            }).on("item_select", (index, item) => {
                switch(index) {
                    case 0: // View Sessions
                        this.showSessionsList();
                        break;
                    case 1: // Review Data
                        this.showDataReview();
                        break;
                    case 2: // Settings
                        this.showSettings();
                        break;
                    case 3: // Help
                        this.showHelp();
                        break;
                }
            }).show();
        } catch (e) {
            console.error("Error showing training menu: " + e.message);
        }
    },
    
    /**
     * Shows the list of recorded sessions
     */
    showSessionsList: function() {
        try {
            // Set current screen
            trainingUIState.currentScreen = "sessions";
            
            // Get list of sessions
            var sessions = dataCollection.getRecordedSessions();
            
            if (sessions.length === 0) {
                dialogs.alert("No Sessions", "No training sessions have been recorded yet.");
                return;
            }
            
            // Format session items for display
            var sessionItems = [];
            for (var i = 0; i < sessions.length; i++) {
                var session = sessions[i];
                var date = new Date(session.startTime);
                var dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                
                sessionItems.push(
                    dateStr + " - " + 
                    session.sampleCount + " samples, " + 
                    session.actionCount + " actions"
                );
            }
            
            // Show dialog with sessions
            var dialog = dialogs.build({
                title: "Recorded Sessions",
                items: sessionItems,
                positive: "Close",
                negative: "Merge Selected",
                neutral: "Delete"
            }).on("item_select", (index, item) => {
                // Show session details
                this.showSessionDetails(sessions[index]);
            }).on("negative", () => {
                // Merge sessions functionality
                this.showMergeSessionsDialog(sessions);
            }).on("neutral", () => {
                // Delete session functionality
                this.showDeleteSessionDialog(sessions);
            }).show();
        } catch (e) {
            console.error("Error showing sessions list: " + e.message);
        }
    },
    
    /**
     * Shows details for a specific session
     * @param {Object} session - Session data
     */
    showSessionDetails: function(session) {
        try {
            // Format session details
            var startDate = new Date(session.startTime);
            var endDate = new Date(session.endTime);
            
            var details = 
                "Session ID: " + session.sessionId + "\n" +
                "Start: " + startDate.toLocaleString() + "\n" +
                "End: " + endDate.toLocaleString() + "\n" +
                "Duration: " + Math.floor(session.duration / 1000 / 60) + "m " + 
                              Math.floor(session.duration / 1000 % 60) + "s\n" +
                "Samples: " + session.sampleCount + "\n" +
                "Actions: " + session.actionCount + "\n" +
                "Avg FPS: " + session.averageFps;
            
            // Show dialog with details
            dialogs.build({
                title: "Session Details",
                content: details,
                positive: "Close",
                neutral: "Load for Review"
            }).on("neutral", () => {
                // Load session data for review
                this.loadSessionForReview(session.sessionId);
            }).show();
        } catch (e) {
            console.error("Error showing session details: " + e.message);
        }
    },
    
    /**
     * Shows dialog for merging sessions
     * @param {Array} sessions - List of sessions
     */
    showMergeSessionsDialog: function(sessions) {
        try {
            // Format session items for multi-choice
            var sessionItems = [];
            for (var i = 0; i < sessions.length; i++) {
                var session = sessions[i];
                var date = new Date(session.startTime);
                sessionItems.push(date.toLocaleString() + " - " + session.sampleCount + " samples");
            }
            
            // Show multi-choice dialog
            dialogs.multiChoice("Select sessions to merge", sessionItems, function(indices) {
                if (!indices || indices.length < 2) {
                    toast("Select at least 2 sessions to merge");
                    return;
                }
                
                // Get session IDs for selected indices
                var sessionIds = [];
                for (var i = 0; i < indices.length; i++) {
                    sessionIds.push(sessions[indices[i]].sessionId);
                }
                
                // Prompt for dataset name
                dialogs.rawInput("Enter name for merged dataset", "dataset_" + Date.now(), function(datasetName) {
                    if (!datasetName) return;
                    
                    // Merge sessions
                    var success = dataCollection.mergeSessionsIntoDataset(sessionIds, datasetName);
                    
                    if (success) {
                        toast("Sessions merged successfully into " + datasetName);
                    } else {
                        toast("Failed to merge sessions");
                    }
                });
            });
        } catch (e) {
            console.error("Error showing merge dialog: " + e.message);
        }
    },
    
    /**
     * Shows dialog for deleting sessions
     * @param {Array} sessions - List of sessions
     */
    showDeleteSessionDialog: function(sessions) {
        try {
            // Format session items for multi-choice
            var sessionItems = [];
            for (var i = 0; i < sessions.length; i++) {
                var session = sessions[i];
                var date = new Date(session.startTime);
                sessionItems.push(date.toLocaleString() + " - " + session.sampleCount + " samples");
            }
            
            // Show multi-choice dialog
            dialogs.multiChoice("Select sessions to delete", sessionItems, function(indices) {
                if (!indices || indices.length === 0) {
                    return;
                }
                
                // Confirm deletion
                dialogs.confirm(
                    "Confirm Deletion", 
                    "Are you sure you want to delete " + indices.length + " sessions? This cannot be undone.",
                    function(confirmed) {
                        if (!confirmed) return;
                        
                        // Delete selected sessions
                        var deletedCount = 0;
                        for (var i = 0; i < indices.length; i++) {
                            var sessionId = sessions[indices[i]].sessionId;
                            if (dataCollection.deleteSession(sessionId)) {
                                deletedCount++;
                            }
                        }
                        
                        toast("Deleted " + deletedCount + " sessions");
                        
                        // Refresh sessions list if any were deleted
                        if (deletedCount > 0) {
                            setTimeout(function() {
                                this.showSessionsList();
                            }.bind(this), 1000);
                        }
                    }.bind(this)
                );
            }.bind(this));
        } catch (e) {
            console.error("Error showing delete dialog: " + e.message);
        }
    },
    
    /**
     * Shows the data review interface
     */
    showDataReview: function() {
        try {
            // Set current screen
            trainingUIState.currentScreen = "review";
            
            // Check if we have review data loaded
            if (!trainingUIState.reviewData) {
                // Show sessions list to select data for review
                this.showSessionsList();
                return;
            }
            
            // TODO: Implement data review interface with visualizations
            toast("Data review interface not yet implemented");
        } catch (e) {
            console.error("Error showing data review: " + e.message);
        }
    },
    
    /**
     * Loads a session for review
     * @param {string} sessionId - ID of the session to load
     */
    loadSessionForReview: function(sessionId) {
        try {
            // Load session data
            var sessionData = dataCollection.loadSession(sessionId);
            
            if (!sessionData) {
                toast("Failed to load session data");
                return;
            }
            
            // Store for review
            trainingUIState.reviewData = sessionData;
            
            // Show review interface
            this.showDataReview();
        } catch (e) {
            console.error("Error loading session for review: " + e.message);
        }
    },
    
    /**
     * Shows the settings interface
     */
    showSettings: function() {
        try {
            // Set current screen
            trainingUIState.currentScreen = "settings";
            
            // TODO: Implement settings interface
            toast("Settings interface not yet implemented");
        } catch (e) {
            console.error("Error showing settings: " + e.message);
        }
    },
    
    /**
     * Shows the help interface
     */
    showHelp: function() {
        try {
            // Show help dialog
            dialogs.build({
                title: "Training Mode Help",
                content: 
                    "Training Mode allows you to record gameplay data for the bot to learn from.\n\n" +
                    "Controls:\n" +
                    "- REC button: Start/stop recording\n" +
                    "- Menu button: Open training menu\n\n" +
                    "During recording:\n" +
                    "- Play the game normally\n" +
                    "- The bot will record your actions and the game state\n" +
                    "- A red indicator shows recording is active\n\n" +
                    "After recording:\n" +
                    "- Review your recorded sessions\n" +
                    "- Merge multiple sessions for training\n" +
                    "- Delete unwanted sessions",
                positive: "Close"
            }).show();
        } catch (e) {
            console.error("Error showing help: " + e.message);
        }
    },
    
    /**
     * Shows a summary of the recording session
     * @param {Object} recordingState - Recording state information
     */
    showSessionSummary: function(recordingState) {
        try {
            // Format duration
            var seconds = Math.floor(recordingState.duration / 1000);
            var minutes = Math.floor(seconds / 60);
            seconds = seconds % 60;
            
            // Show summary dialog
            dialogs.build({
                title: "Recording Complete",
                content: 
                    "Session ID: " + recordingState.sessionId + "\n" +
                    "Duration: " + minutes + "m " + seconds + "s\n" +
                    "Samples collected: " + recordingState.samplesCollected + "\n" +
                    "Actions recorded: " + recordingState.actionsRecorded,
                positive: "OK",
                neutral: "View Sessions"
            }).on("neutral", () => {
                this.showSessionsList();
            }).show();
        } catch (e) {
            console.error("Error showing session summary: " + e.message);
        }
    },
    
    /**
     * Hides all UI elements
     */
    hideAllUI: function() {
        try {
            // Close floating controls
            if (trainingUIState.floatingControls) {
                trainingUIState.floatingControls.close();
                trainingUIState.floatingControls = null;
            }
            
            // Close status indicator
            if (trainingUIState.statusIndicator) {
                trainingUIState.statusIndicator.close();
                trainingUIState.statusIndicator = null;
            }
            
            // Close session info
            if (trainingUIState.sessionInfo) {
                trainingUIState.sessionInfo.close();
                trainingUIState.sessionInfo = null;
            }
        } catch (e) {
            console.error("Error hiding UI: " + e.message);
        }
    },
    
    /**
     * Updates the training mode UI based on current state
     * @param {Object} gameState - Current game state
     */
    update: function(gameState) {
        // Only update if UI is visible
        if (!trainingUIState.isVisible) {
            return;
        }
        
        try {
            // Get current recording state
            var recordingState = dataCollection.getRecordingState();
            
            // Update status indicator if recording
            if (recordingState.isRecording && trainingUIState.statusIndicator) {
                // Blink the recording indicator
                var now = Date.now();
                if (now % 1000 < 500) { // Blink every half second
                    trainingUIState.statusIndicator.statusDot.setTextColor(
                        colors.parseColor(uiColors.recording)
                    );
                } else {
                    trainingUIState.statusIndicator.statusDot.setTextColor(
                        colors.parseColor("#00000000") // Transparent
                    );
                }
            }
        } catch (e) {
            console.error("Error updating training UI: " + e.message);
        }
    },
    
    /**
     * Shows or hides the training mode UI
     * @param {boolean} visible - Whether UI should be visible
     */
    setVisible: function(visible) {
        try {
            if (visible === trainingUIState.isVisible) {
                return; // Already in desired state
            }
            
            trainingUIState.isVisible = visible;
            
            if (visible) {
                // Show UI elements
                this.createFloatingControls();
            } else {
                // Hide UI elements
                this.hideAllUI();
            }
            
            console.log("Training UI visibility set to: " + visible);
        } catch (e) {
            console.error("Error setting UI visibility: " + e.message);
        }
    },
    
    /**
     * Gets the current UI state
     * @return {Object} Current UI state
     */
    getUIState: function() {
        return {
            isVisible: trainingUIState.isVisible,
            currentScreen: trainingUIState.currentScreen,
            hasReviewData: !!trainingUIState.reviewData
        };
    }
};