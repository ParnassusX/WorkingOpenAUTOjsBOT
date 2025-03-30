/**
 * Control Panel Module for Subway Surfers Bot
 * Implements Phase 7.1: User Interface features
 * 
 * Features:
 * - Intuitive control panel for bot configuration
 * - Statistics dashboard for performance monitoring
 * - Visual feedback system for bot status
 * - Configuration interface for easy settings adjustment
 */

// Import required modules
var utils = require('./utils.js');
var performanceOptimization = require('./performance_optimization.js');
var performanceMonitor = require('./reliability/performance_monitor.js');

// UI state for control panel
var controlPanelState = {
    isVisible: false,
    currentTab: "dashboard", // dashboard, settings, performance, about
    window: null,
    updateInterval: null,
    statistics: {
        runtime: 0,
        score: 0,
        coins: 0,
        distance: 0,
        gamesPlayed: 0,
        highScore: 0
    },
    performance: {
        fps: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        batteryLevel: 0
    }
};

// Colors for UI elements
var uiColors = {
    primary: "#4CAF50", // Green
    secondary: "#2196F3", // Blue
    accent: "#FF9800", // Orange
    warning: "#F44336", // Red
    background: "#333333", // Dark background
    cardBackground: "#424242", // Slightly lighter background
    text: "#FFFFFF", // White text
    secondaryText: "#BBBBBB" // Light gray text
};

module.exports = {
    /**
     * Initializes the control panel
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing control panel...");
        
        // Reset UI state
        this.resetState();
        
        // Create control panel window if not already created
        if (!controlPanelState.window) {
            this.createControlPanel();
        }
        
        console.log("Control panel initialized");
        return true;
    },
    
    /**
     * Resets the control panel state
     */
    resetState: function() {
        // Close any existing UI elements
        this.hidePanel();
        
        // Reset state
        controlPanelState = {
            isVisible: false,
            currentTab: "dashboard",
            window: null,
            updateInterval: null,
            statistics: {
                runtime: 0,
                score: 0,
                coins: 0,
                distance: 0,
                gamesPlayed: 0,
                highScore: 0
            },
            performance: {
                fps: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                batteryLevel: 0
            }
        };
    },
    
    /**
     * Creates the control panel UI
     */
    createControlPanel: function() {
        try {
            // Create floating window using AutoJS's UI builder
            var window = floaty.window(
                '<frame id="rootFrame" gravity="center" bg="#333333" alpha="0.9">' +
                '    <vertical padding="16">' +
                '        <horizontal gravity="center_vertical">' +
                '            <text text="Subway Bot Control Panel" textColor="#FFFFFF" textSize="18sp" layout_weight="1"/>' +
                '            <button id="closeBtn" text="×" textSize="18sp" w="40" h="40" bg="#F44336"/>' +
                '        </horizontal>' +
                '        <horizontal id="tabBar" gravity="center" marginTop="8" marginBottom="8">' +
                '            <button id="dashboardTab" text="Dashboard" textColor="#FFFFFF" w="*" h="40" layout_weight="1" bg="#4CAF50"/>' +
                '            <button id="settingsTab" text="Settings" textColor="#FFFFFF" w="*" h="40" layout_weight="1" bg="#424242"/>' +
                '            <button id="performanceTab" text="Performance" textColor="#FFFFFF" w="*" h="40" layout_weight="1" bg="#424242"/>' +
                '            <button id="aboutTab" text="About" textColor="#FFFFFF" w="*" h="40" layout_weight="1" bg="#424242"/>' +
                '        </horizontal>' +
                '        <frame id="contentContainer" w="*" h="*" marginTop="8">' +
                '            <!-- Content will be dynamically updated based on selected tab -->' +
                '            <text id="contentText" text="Loading..." textColor="#FFFFFF" gravity="center"/>' +
                '        </frame>' +
                '        <horizontal gravity="center" marginTop="8">' +
                '            <button id="startBtn" text="Start Bot" w="*" h="50" layout_weight="1" bg="#4CAF50" marginRight="4"/>' +
                '            <button id="stopBtn" text="Stop Bot" w="*" h="50" layout_weight="1" bg="#F44336" marginLeft="4"/>' +
                '        </horizontal>' +
                '    </vertical>' +
                '</frame>'
            );
            
            // Store window reference
            controlPanelState.window = window;
            
            // Set initial position
            window.setPosition(100, 100);
            window.setSize(device.width * 0.8, device.height * 0.7);
            
            // Set up button click handlers
            window.closeBtn.click(() => {
                this.hidePanel();
            });
            
            window.dashboardTab.click(() => {
                this.switchTab("dashboard");
            });
            
            window.settingsTab.click(() => {
                this.switchTab("settings");
            });
            
            window.performanceTab.click(() => {
                this.switchTab("performance");
            });
            
            window.aboutTab.click(() => {
                this.switchTab("about");
            });
            
            window.startBtn.click(() => {
                this.startBot();
            });
            
            window.stopBtn.click(() => {
                this.stopBot();
            });
            
            // Make the panel draggable
            this.makeDraggable(window.rootFrame);
            
            // Show the dashboard tab by default
            this.switchTab("dashboard");
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            controlPanelState.isVisible = true;
        } catch (e) {
            console.error("Error creating control panel: " + e.message);
        }
    },
    
    /**
     * Makes a UI element draggable
     * @param {Object} element - UI element to make draggable
     */
    makeDraggable: function(element) {
        var x = 0, y = 0;
        var windowX, windowY;
        var downTime;
        
        element.setOnTouchListener(function(view, event) {
            switch (event.getAction()) {
                case event.ACTION_DOWN:
                    x = event.getRawX();
                    y = event.getRawY();
                    windowX = controlPanelState.window.getX();
                    windowY = controlPanelState.window.getY();
                    downTime = new Date().getTime();
                    return true;
                case event.ACTION_MOVE:
                    // Calculate the distance moved
                    var dx = event.getRawX() - x;
                    var dy = event.getRawY() - y;
                    // Update the window position
                    controlPanelState.window.setPosition(windowX + dx, windowY + dy);
                    return true;
                case event.ACTION_UP:
                    // Check if this was a short tap or a drag
                    if (new Date().getTime() - downTime < 100) {
                        // This was a short tap, pass to onClick handlers
                        view.performClick();
                    }
                    return true;
            }
            return false;
        });
    },
    
    /**
     * Switches between tabs in the control panel
     * @param {string} tabName - Name of the tab to switch to
     */
    switchTab: function(tabName) {
        if (!controlPanelState.window) return;
        
        // Update current tab
        controlPanelState.currentTab = tabName;
        
        // Update tab button colors
        var tabs = ["dashboardTab", "settingsTab", "performanceTab", "aboutTab"];
        for (var i = 0; i < tabs.length; i++) {
            var tabId = tabs[i];
            var tabPrefix = tabId.replace("Tab", "");
            var color = (tabPrefix === tabName) ? uiColors.primary : uiColors.cardBackground;
            controlPanelState.window[tabId].setBackgroundColor(colors.parseColor(color));
        }
        
        // Update content based on selected tab
        this.updateTabContent();
    },
    
    /**
     * Updates the content of the current tab
     */
    updateTabContent: function() {
        if (!controlPanelState.window) return;
        
        var content = "";
        
        switch (controlPanelState.currentTab) {
            case "dashboard":
                content = this.getDashboardContent();
                break;
            case "settings":
                content = this.getSettingsContent();
                break;
            case "performance":
                content = this.getPerformanceContent();
                break;
            case "about":
                content = this.getAboutContent();
                break;
            default:
                content = "Unknown tab";
        }
        
        // Update the content text
        ui.run(function() {
            controlPanelState.window.contentText.setText(content);
        });
    },
    
    /**
     * Gets the content for the dashboard tab
     * @return {string} HTML content for the dashboard
     */
    getDashboardContent: function() {
        var stats = controlPanelState.statistics;
        var perf = controlPanelState.performance;
        
        // Format runtime as HH:MM:SS
        var hours = Math.floor(stats.runtime / 3600);
        var minutes = Math.floor((stats.runtime % 3600) / 60);
        var seconds = Math.floor(stats.runtime % 60);
        var runtimeStr = hours.toString().padStart(2, '0') + ':' + 
                         minutes.toString().padStart(2, '0') + ':' + 
                         seconds.toString().padStart(2, '0');
        
        return '<vertical padding="8">' +
               '  <text text="Current Session" textColor="#FFFFFF" textSize="16sp"/>' +
               '  <grid columns="2" rowHeight="wrap_content" padding="8">' +
               '    <text text="Runtime:" textColor="#BBBBBB"/>' +
               '    <text text="' + runtimeStr + '" textColor="#FFFFFF"/>' +
               '    <text text="Current Score:" textColor="#BBBBBB"/>' +
               '    <text text="' + stats.score + '" textColor="#FFFFFF"/>' +
               '    <text text="Coins Collected:" textColor="#BBBBBB"/>' +
               '    <text text="' + stats.coins + '" textColor="#FFFFFF"/>' +
               '    <text text="Distance:" textColor="#BBBBBB"/>' +
               '    <text text="' + stats.distance + ' m" textColor="#FFFFFF"/>' +
               '    <text text="Games Played:" textColor="#BBBBBB"/>' +
               '    <text text="' + stats.gamesPlayed + '" textColor="#FFFFFF"/>' +
               '    <text text="High Score:" textColor="#BBBBBB"/>' +
               '    <text text="' + stats.highScore + '" textColor="#FFFFFF"/>' +
               '  </grid>' +
               '  <text text="Performance" textColor="#FFFFFF" textSize="16sp" marginTop="16"/>' +
               '  <grid columns="2" rowHeight="wrap_content" padding="8">' +
               '    <text text="FPS:" textColor="#BBBBBB"/>' +
               '    <text text="' + perf.fps + '" textColor="#FFFFFF"/>' +
               '    <text text="CPU Usage:" textColor="#BBBBBB"/>' +
               '    <text text="' + perf.cpuUsage + '%" textColor="#FFFFFF"/>' +
               '    <text text="Memory Usage:" textColor="#BBBBBB"/>' +
               '    <text text="' + Math.round(perf.memoryUsage / (1024 * 1024)) + ' MB" textColor="#FFFFFF"/>' +
               '    <text text="Battery:" textColor="#BBBBBB"/>' +
               '    <text text="' + perf.batteryLevel + '%" textColor="#FFFFFF"/>' +
               '  </grid>' +
               '</vertical>';
    },
    
    /**
     * Gets the content for the settings tab
     * @return {string} HTML content for the settings
     */
    getSettingsContent: function() {
        // Get current config
        var config = typeof global !== 'undefined' && global.config ? global.config : {};
        
        return '<vertical padding="8">' +
               '  <text text="Bot Settings" textColor="#FFFFFF" textSize="16sp"/>' +
               '  <vertical padding="8" bg="#424242" marginTop="8">' +
               '    <text text="Game Mode" textColor="#FFFFFF"/>' +
               '    <radiogroup id="modeRadioGroup">' +
               '      <radio id="autoMode" text="Auto-Play Mode" textColor="#FFFFFF" ' + 
                      (!config.training || !config.training.manualMode ? 'checked="true"' : '') + '/>' +
               '      <radio id="trainingMode" text="Training Mode" textColor="#FFFFFF" ' + 
                      (config.training && config.training.manualMode ? 'checked="true"' : '') + '/>' +
               '    </radiogroup>' +
               '  </vertical>' +
               '  <vertical padding="8" bg="#424242" marginTop="8">' +
               '    <text text="Performance Settings" textColor="#FFFFFF"/>' +
               '    <checkbox id="frameSkipCheck" text="Enable Frame Skipping" textColor="#FFFFFF" ' + 
                    (config.vision && config.vision.performance && config.vision.performance.frameSkip > 1 ? 'checked="true"' : '') + '/>' +
               '    <checkbox id="roiCheck" text="Use Region of Interest" textColor="#FFFFFF" ' + 
                    (config.vision && config.vision.performance && config.vision.performance.regionOfInterest ? 'checked="true"' : '') + '/>' +
               '    <checkbox id="lowResCheck" text="Low Resolution Mode" textColor="#FFFFFF" ' + 
                    (config.vision && config.vision.performance && config.vision.performance.lowResolutionMode ? 'checked="true"' : '') + '/>' +
               '    <checkbox id="memManageCheck" text="Memory Management" textColor="#FFFFFF" ' + 
                    (config.vision && config.vision.performance && config.vision.performance.memoryManagement ? 'checked="true"' : '') + '/>' +
               '  </vertical>' +
               '  <vertical padding="8" bg="#424242" marginTop="8">' +
               '    <text text="AI Settings" textColor="#FFFFFF"/>' +
               '    <checkbox id="neuralNetCheck" text="Enable Neural Network" textColor="#FFFFFF" ' + 
                    (config.neuralNet && config.neuralNet.enabled ? 'checked="true"' : '') + '/>' +
               '  </vertical>' +
               '</vertical>';
    }
};