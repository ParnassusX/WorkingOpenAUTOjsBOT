/**
 * Statistics Dashboard Module for Subway Surfers Bot
 * Implements Phase 7.1: User Interface features
 * 
 * Features:
 * - Real-time performance metrics display
 * - Gameplay statistics tracking and visualization
 * - Historical data comparison
 * - Export functionality for data analysis
 */

// Import required modules
var utils = require('./utils.js');
var performanceMonitor = require('./reliability/performance_monitor.js');
var cpuOptimizer = require('./cpu_optimizer.js');
var memoryOptimizer = require('./memory_optimizer.js');
var batteryOptimizer = require('./battery_optimizer.js');

// Dashboard state
var dashboardState = {
    isVisible: false,
    window: null,
    updateInterval: null,
    updateFrequency: 1000, // Update every second
    gameStats: {
        totalGames: 0,
        highScore: 0,
        totalCoins: 0,
        totalDistance: 0,
        averageScore: 0,
        longestRun: 0,
        lastGameStats: null,
        gameHistory: []
    },
    performanceStats: {
        fps: [],
        cpuUsage: [],
        memoryUsage: [],
        batteryLevel: [],
        maxDataPoints: 60 // Store 1 minute of data
    },
    exportData: {
        lastExport: 0,
        exportPath: "/storage/emulated/0/SubwayBot/stats/",
        autoExport: false,
        autoExportInterval: 3600000 // 1 hour
    }
};

// UI colors for dashboard
var dashboardColors = {
    background: "#333333",
    cardBackground: "#424242",
    text: "#FFFFFF",
    accent: "#4CAF50",
    warning: "#FFC107",
    error: "#F44336",
    chartLine: "#2196F3",
    chartGrid: "#555555"
};

module.exports = {
    /**
     * Initializes the statistics dashboard
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing statistics dashboard...");
        
        // Reset dashboard state
        this.resetState();
        
        // Apply configuration settings
        if (config && config.statistics) {
            if (config.statistics.updateFrequency) {
                dashboardState.updateFrequency = config.statistics.updateFrequency;
            }
            
            if (config.statistics.export) {
                dashboardState.exportData.autoExport = config.statistics.export.autoExport || false;
                dashboardState.exportData.autoExportInterval = config.statistics.export.interval || 
                    dashboardState.exportData.autoExportInterval;
                    
                if (config.statistics.export.path) {
                    dashboardState.exportData.exportPath = config.statistics.export.path;
                }
            }
        }
        
        // Load saved statistics if available
        this.loadStatistics();
        
        console.log("Statistics dashboard initialized");
        return true;
    },
    
    /**
     * Resets the dashboard state
     */
    resetState: function() {
        // Close any existing UI elements
        this.hideDashboard();
        
        dashboardState = {
            isVisible: false,
            window: null,
            updateInterval: null,
            updateFrequency: 1000,
            gameStats: {
                totalGames: 0,
                highScore: 0,
                totalCoins: 0,
                totalDistance: 0,
                averageScore: 0,
                longestRun: 0,
                lastGameStats: null,
                gameHistory: []
            },
            performanceStats: {
                fps: [],
                cpuUsage: [],
                memoryUsage: [],
                batteryLevel: [],
                maxDataPoints: 60
            },
            exportData: {
                lastExport: 0,
                exportPath: "/storage/emulated/0/SubwayBot/stats/",
                autoExport: false,
                autoExportInterval: 3600000
            }
        };
    },
    
    /**
     * Loads saved statistics from storage
     */
    loadStatistics: function() {
        try {
            var statsPath = dashboardState.exportData.exportPath + "game_stats.json";
            if (files.exists(statsPath)) {
                var savedStats = JSON.parse(files.read(statsPath));
                
                // Apply saved game stats
                if (savedStats.gameStats) {
                    dashboardState.gameStats.totalGames = savedStats.gameStats.totalGames || 0;
                    dashboardState.gameStats.highScore = savedStats.gameStats.highScore || 0;
                    dashboardState.gameStats.totalCoins = savedStats.gameStats.totalCoins || 0;
                    dashboardState.gameStats.totalDistance = savedStats.gameStats.totalDistance || 0;
                    dashboardState.gameStats.averageScore = savedStats.gameStats.averageScore || 0;
                    dashboardState.gameStats.longestRun = savedStats.gameStats.longestRun || 0;
                    
                    // Load game history (limited to last 50 games)
                    if (savedStats.gameStats.gameHistory && Array.isArray(savedStats.gameStats.gameHistory)) {
                        dashboardState.gameStats.gameHistory = savedStats.gameStats.gameHistory.slice(-50);
                    }
                }
                
                console.log("Loaded statistics: " + dashboardState.gameStats.totalGames + 
                          " games, high score: " + dashboardState.gameStats.highScore);
            }
        } catch (e) {
            console.error("Error loading statistics: " + e.message);
        }
    },
    
    /**
     * Saves current statistics to storage
     */
    saveStatistics: function() {
        try {
            // Ensure directory exists
            var dir = dashboardState.exportData.exportPath;
            if (!files.exists(dir)) {
                files.createWithDirs(dir);
            }
            
            // Prepare data to save
            var dataToSave = {
                gameStats: dashboardState.gameStats,
                lastSaved: Date.now()
            };
            
            // Save to file
            var statsPath = dir + "game_stats.json";
            files.write(statsPath, JSON.stringify(dataToSave));
            
            console.log("Statistics saved to " + statsPath);
        } catch (e) {
            console.error("Error saving statistics: " + e.message);
        }
    },
    
    /**
     * Shows the statistics dashboard
     */
    showDashboard: function() {
        if (dashboardState.isVisible) return;
        
        try {
            console.log("Showing statistics dashboard");
            
            // Create dashboard UI
            this.createDashboardUI();
            
            // Start update interval
            this.startDashboardUpdates();
            
            dashboardState.isVisible = true;
        } catch (e) {
            console.error("Error showing dashboard: " + e.message);
        }
    },
    
    /**
     * Hides the statistics dashboard
     */
    hideDashboard: function() {
        if (!dashboardState.isVisible) return;
        
        try {
            console.log("Hiding statistics dashboard");
            
            // Stop update interval
            this.stopDashboardUpdates();
            
            // Close window if it exists
            if (dashboardState.window) {
                dashboardState.window.close();
                dashboardState.window = null;
            }
            
            dashboardState.isVisible = false;
        } catch (e) {
            console.error("Error hiding dashboard: " + e.message);
        }
    },
    
    /**
     * Creates the dashboard UI
     */
    createDashboardUI: function() {
        try {
            // Create a floating window using AutoJS's UI builder
            var window = floaty.window(
                '<frame gravity="center" bg="#333333">' +
                '    <vertical padding="16">' +
                '        <text id="titleText" text="Statistics Dashboard" textColor="#FFFFFF" textSize="18sp" gravity="center"/>' +
                '        <card margin="8" cardCornerRadius="8dp" cardElevation="2dp" foreground="?selectableItemBackground">' +
                '            <vertical padding="16">' +
                '                <text id="gameStatsTitle" text="Game Statistics" textColor="#4CAF50" textSize="16sp"/>' +
                '                <text id="gameStatsText" text="Loading..." textColor="#FFFFFF" textSize="14sp"/>' +
                '            </vertical>' +
                '        </card>' +
                '        <card margin="8" cardCornerRadius="8dp" cardElevation="2dp" foreground="?selectableItemBackground">' +
                '            <vertical padding="16">' +
                '                <text id="perfStatsTitle" text="Performance Metrics" textColor="#2196F3" textSize="16sp"/>' +
                '                <text id="perfStatsText" text="Loading..." textColor="#FFFFFF" textSize="14sp"/>' +
                '            </vertical>' +
                '        </card>' +
                '        <horizontal>' +
                '            <button id="closeBtn" text="Close" style="Widget.AppCompat.Button.Colored" w="*"/>' +
                '            <button id="exportBtn" text="Export" style="Widget.AppCompat.Button" w="*"/>' +
                '        </horizontal>' +
                '    </vertical>' +
                '</frame>'
            );
            
            // Set up button click handlers
            window.closeBtn.click(() => {
                this.hideDashboard();
            });
            
            window.exportBtn.click(() => {
                this.exportStatistics();
                toast("Statistics exported");
            });
            
            // Store window reference
            dashboardState.window = window;
            
            // Position the window
            window.setPosition(50, 100);
            window.setSize(device.width - 100, device.height - 200);
        } catch (e) {
            console.error("Error creating dashboard UI: " + e.message);
        }
    },
    
    /**
     * Starts periodic dashboard updates
     */
    startDashboardUpdates: function() {
        // Clear any existing interval
        this.stopDashboardUpdates();
        
        // Set up new update interval
        dashboardState.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, dashboardState.updateFrequency);
        
        console.log("Started dashboard updates every " + 
                  (dashboardState.updateFrequency / 1000) + " seconds");
    },
    
    /**
     * Stops periodic dashboard updates
     */
    stopDashboardUpdates: function() {
        if (dashboardState.updateInterval) {
            clearInterval(dashboardState.updateInterval);
            dashboardState.updateInterval = null;
        }
    },
    
    /**
     * Updates the dashboard with current statistics
     */
    updateDashboard: function() {
        if (!dashboardState.isVisible || !dashboardState.window) return;
        
        try {
            // Update performance metrics
            this.updatePerformanceMetrics();
            
            // Update UI elements
            var window = dashboardState.window;
            
            // Update game statistics text
            var gameStats = dashboardState.gameStats;
            var gameStatsText = 
                "Total Games: " + gameStats.totalGames + "\n" +
                "High Score: " + gameStats.highScore + "\n" +
                "Average Score: " + Math.round(gameStats.averageScore) + "\n" +
                "Total Coins: " + gameStats.totalCoins + "\n" +
                "Longest Run: " + this.formatTime(gameStats.longestRun) + "\n" +
                "Total Distance: " + Math.round(gameStats.totalDistance) + "m";
                
            if (gameStats.lastGameStats) {
                gameStatsText += "\n\nLast Game:\n" +
                    "Score: " + gameStats.lastGameStats.score + "\n" +
                    "Coins: " + gameStats.lastGameStats.coins + "\n" +
                    "Distance: " + gameStats.lastGameStats.distance + "m\n" +
                    "Duration: " + this.formatTime(gameStats.lastGameStats.duration);
            }
            
            window.gameStatsText.setText(gameStatsText);
            
            // Update performance metrics text
            var perfStats = dashboardState.performanceStats;
            var currentFps = perfStats.fps.length > 0 ? perfStats.fps[perfStats.fps.length - 1] : 0;
            var currentCpu = perfStats.cpuUsage.length > 0 ? perfStats.cpuUsage[perfStats.cpuUsage.length - 1] : 0;
            var currentMem = perfStats.memoryUsage.length > 0 ? perfStats.memoryUsage[perfStats.memoryUsage.length - 1] : 0;
            var currentBattery = perfStats.batteryLevel.length > 0 ? perfStats.batteryLevel[perfStats.batteryLevel.length - 1] : 0;
            
            var perfStatsText = 
                "FPS: " + currentFps.toFixed(1) + "\n" +
                "CPU Usage: " + currentCpu.toFixed(1) + "%\n" +
                "Memory Usage: " + this.formatMemory(currentMem) + "\n" +
                "Battery Level: " + currentBattery + "%";
                
            // Add battery optimizer info if available
            if (typeof batteryOptimizer !== 'undefined' && batteryOptimizer.getStatus) {
                var batteryStatus = batteryOptimizer.getStatus();
                perfStatsText += "\n\nBattery Optimization:\n" +
                    "Level: " + batteryStatus.optimizationLevel + "\n" +
                    "Discharge: " + batteryStatus.dischargeTrend + "\n" +
                    "Remaining: " + batteryStatus.estimatedRemainingTime;
            }
            
            window.perfStatsText.setText(perfStatsText);
        } catch (e) {
            console.error("Error updating dashboard: " + e.message);
        }
    },
    
    /**
     * Updates performance metrics with current values
     */
    updatePerformanceMetrics: function() {
        try {
            var perfStats = dashboardState.performanceStats;
            
            // Get current performance metrics
            var currentMetrics = this.getCurrentPerformanceMetrics();
            
            // Add to arrays
            this.addMetric(perfStats.fps, currentMetrics.fps);
            this.addMetric(perfStats.cpuUsage, currentMetrics.cpuUsage);
            this.addMetric(perfStats.memoryUsage, currentMetrics.memoryUsage);
            this.addMetric(perfStats.batteryLevel, currentMetrics.batteryLevel);
        } catch (e) {
            console.error("Error updating performance metrics: " + e.message);
        }
    },
    
    /**
     * Adds a metric to a metrics array, maintaining the max size
     * @param {Array} metricsArray - Array to add the metric to
     * @param {number} value - Value to add
     */
    addMetric: function(metricsArray, value) {
        metricsArray.push(value);
        if (metricsArray.length > dashboardState.performanceStats.maxDataPoints) {
            metricsArray.shift();
        }
    },
    
    /**
     * Gets current performance metrics from various sources
     * @return {Object} Current performance metrics
     */
    getCurrentPerformanceMetrics: function() {
        var metrics = {
            fps: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            batteryLevel: 100
        };
        
        try {
            // Try to get metrics from performance monitor if available
            if (typeof performanceMonitor !== 'undefined' && performanceMonitor.getCurrentMetrics) {
                var monitorMetrics = performanceMonitor.getCurrentMetrics();
                metrics.fps = monitorMetrics.frameRate.current || 0;
                metrics.cpuUsage = monitorMetrics.cpuUsage.current || 0;
                metrics.memoryUsage = monitorMetrics.memoryUsage.current || 0;
            }
            
            // Try to get battery level from battery optimizer if available
            if (typeof batteryOptimizer !== 'undefined' && batteryOptimizer.updateBatteryLevel) {
                metrics.batteryLevel = batteryOptimizer.updateBatteryLevel();
            } else if (typeof device !== 'undefined' && device.getBattery) {
                metrics.batteryLevel = device.getBattery();
            }
            
            // Fallbacks for metrics not available from monitors
            if (metrics.memoryUsage === 0 && typeof runtime !== 'undefined') {
                metrics.memoryUsage = runtime.totalMemory() - runtime.freeMemory();
            }
        } catch (e) {
            console.error("Error getting current performance metrics: " + e.message);
        }
        
        return metrics;
    },
    
    /**
     * Records game statistics after a game ends
     * @param {Object} gameStats - Statistics from the completed game
     */
    recordGameStats: function(gameStats) {
        try {
            var stats = dashboardState.gameStats;
            
            // Extract game data
            var score = gameStats.score || 0;
            var coins = gameStats.coins || 0;
            var distance = gameStats.distance || 0;
            var duration = gameStats.duration || 0; // in seconds
            
            // Update total stats
            stats.totalGames++;
            stats.totalCoins += coins;
            stats.totalDistance += distance;
            
            // Update high score if needed
            if (score > stats.highScore) {
                stats.highScore = score;
            }
            
            // Update longest run if needed
            if (duration > stats.longestRun) {
                stats.longestRun = duration;
            }
            
            // Update average score
            stats.averageScore = ((stats.averageScore * (stats.totalGames - 1)) + score) / stats.totalGames;
            
            // Store last game stats
            stats.lastGameStats = {
                score: score,
                coins: coins,
                distance: distance,
                duration: duration,
                timestamp: Date.now()
            };
            
            // Add to game history
            stats.gameHistory.push(stats.lastGameStats);
            
            // Trim history if needed (keep last 50 games)
            if (stats.gameHistory.length > 50) {
                stats.gameHistory.shift();
            }
            
            console.log("Recorded game stats: score=" + score + 
                      ", coins=" + coins + ", distance=" + distance + "m");
            
            // Save statistics periodically
            if (stats.totalGames % 5 === 0) {
                this.saveStatistics();
            }
            
            // Check if auto-export is enabled
            if (dashboardState.exportData.autoExport && 
                Date.now() - dashboardState.exportData.lastExport > dashboardState.exportData.autoExportInterval) {
                this.exportStatistics();
            }
        } catch (e) {
            console.error("Error recording game stats: " + e.message);
        }
    },
    
    /**
     * Exports statistics to CSV files
     */
    exportStatistics: function() {
        try {
            var exportPath = dashboardState.exportData.exportPath;
            
            // Ensure directory exists
            if (!files.exists(exportPath)) {
                files.createWithDirs(exportPath);
            }
            
            // Export game history to CSV
            var gameHistoryPath = exportPath + "game_history_" + this.getTimestamp() + ".csv";
            var gameHistoryContent = "Timestamp,Score,Coins,Distance,Duration\n";
            
            dashboardState.gameStats.gameHistory.forEach(function(game) {
                gameHistoryContent += 
                    new Date(game.timestamp).toISOString() + "," +
                    game.score + "," +
                    game.coins + "," +
                    game.distance + "," +
                    game.duration + "\n";
            });
            
            files.write(gameHistoryPath, gameHistoryContent);
            
            // Export performance metrics to CSV
            var perfMetricsPath = exportPath + "performance_metrics_" + this.getTimestamp() + ".csv";
            var perfMetricsContent = "FPS,CPU_Usage,Memory_Usage,Battery_Level\n";
            
            var perfStats = dashboardState.performanceStats;
            var dataPoints = Math.min(
                perfStats.fps.length,
                perfStats.cpuUsage.length,
                perfStats.memoryUsage.length,
                perfStats.batteryLevel.length
            );
            
            for (var i = 0; i < dataPoints; i++) {
                perfMetricsContent += 
                    perfStats.fps[i] + "," +
                    perfStats.cpuUsage[i] + "," +
                    perfStats.memoryUsage[i] + "," +
                    perfStats.batteryLevel[i] + "\n";
            }
            
            files.write(perfMetricsPath, perfMetricsContent);
            
            // Update last export time
            dashboardState.exportData.lastExport = Date.now();
            
            console.log("Statistics exported to " + exportPath);
            return true;
        } catch (e) {
            console.error("Error exporting statistics: " + e.message);
            return false;
        }
    },
    
    /**
     * Gets a timestamp string for file naming
     * @return {string} Timestamp string (YYYYMMDD_HHMMSS)
     */
    getTimestamp: function() {
        var now = new Date();
        return now.getFullYear() + 
               this.padZero(now.getMonth() + 1) + 
               this.padZero(now.getDate()) + "_" +
               this.padZero(now.getHours()) + 
               this.padZero(now.getMinutes()) + 
               this.padZero(now.getSeconds());
    },
    
    /**
     * Pads a number with leading zero if needed
     * @param {number} num - Number to pad
     * @return {string} Padded number string
     */
    padZero: function(num) {
        return ("0" + num).slice(-2);
    },
    
    /**
     * Formats time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @return {string} Formatted time string
     */
    formatTime: function(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ":" + this.padZero(secs);
    },
    
    /**
     * Formats memory size in bytes to human-readable format
     * @param {number} bytes - Memory size in bytes
     * @return {string} Formatted memory size
     */
    formatMemory: function(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    },
    
    /**
     * Gets current game statistics
     * @return {Object} Current game statistics
     */
    getGameStats: function() {
        return dashboardState.gameStats;
    },
    
    /**
     * Gets current performance statistics
     * @return {Object} Current performance statistics
     */
    getPerformanceStats: function() {
        return dashboardState.performanceStats;
    }
};