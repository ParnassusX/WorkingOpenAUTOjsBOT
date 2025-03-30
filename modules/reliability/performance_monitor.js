/**
 * Performance Monitoring and Logging System for Subway Surfers Bot
 * Implements Phase 6.3: Reliability Improvements - Performance Monitoring and Logging
 * 
 * Features:
 * - Real-time performance monitoring
 * - Resource usage tracking
 * - Performance logging to file
 * - Alert system for performance degradation
 * - Historical performance data analysis
 */

// Import required modules
var utils = require('../utils.js');

// Performance metrics storage
var performanceMetrics = {
    startTime: Date.now(),
    uptime: 0,
    frameRate: {
        current: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
    },
    cpuUsage: {
        current: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
    },
    memoryUsage: {
        current: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
    },
    responseTime: {
        current: 0,
        min: Infinity,
        max: 0,
        avg: 0,
        samples: []
    },
    gameStats: {
        gamesPlayed: 0,
        highScore: 0,
        totalCoins: 0,
        totalDistance: 0,
        averageScore: 0
    }
};

// Monitoring configuration
var monitorConfig = {
    enabled: true,
    sampleInterval: 5000, // 5 seconds between samples
    logInterval: 60000, // 1 minute between logs
    alertThresholds: {
        frameRate: 15, // Alert if FPS drops below this value
        cpuUsage: 80, // Alert if CPU usage exceeds this percentage
        memoryUsage: 200 * 1024 * 1024, // Alert if memory usage exceeds 200MB
        responseTime: 500 // Alert if response time exceeds 500ms
    },
    logFile: "/storage/emulated/0/SubwayBot/logs/performance.log",
    maxLogSize: 5 * 1024 * 1024, // 5MB max log size
    maxSampleCount: 1000 // Maximum number of samples to keep in memory
};

// Monitoring state
var isMonitoring = false;
 var sampleTimer = null;
var logTimer = null;
var lastFrameTime = 0;
var frameCount = 0;
var lastLogRotation = Date.now();

module.exports = {
    /**
     * Initialize the performance monitoring system
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing performance monitoring system...");
        
        // Reset performance metrics
        this.resetMetrics();
        
        // Update configuration if provided
        if (config && config.performance && config.performance.monitoring) {
            for (var key in config.performance.monitoring) {
                if (config.performance.monitoring.hasOwnProperty(key) && monitorConfig.hasOwnProperty(key)) {
                    monitorConfig[key] = config.performance.monitoring[key];
                }
            }
        }
        
        // Create log directory if it doesn't exist
        var logDir = monitorConfig.logFile.substring(0, monitorConfig.logFile.lastIndexOf('/'));
        utils.ensureDirectory(logDir);
        
        // Start monitoring if enabled
        if (monitorConfig.enabled) {
            this.startMonitoring();
        }
        
        console.log("Performance monitoring system initialized");
        return this;
    },
    
    /**
     * Reset performance metrics
     */
    resetMetrics: function() {
        var now = Date.now();
        performanceMetrics = {
            startTime: now,
            uptime: 0,
            frameRate: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: []
            },
            cpuUsage: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: []
            },
            memoryUsage: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: []
            },
            responseTime: {
                current: 0,
                min: Infinity,
                max: 0,
                avg: 0,
                samples: []
            },
            gameStats: {
                gamesPlayed: 0,
                highScore: 0,
                totalCoins: 0,
                totalDistance: 0,
                averageScore: 0
            }
        };
        
        lastFrameTime = now;
        frameCount = 0;
    },
    
    /**
     * Start performance monitoring
     */
    startMonitoring: function() {
        if (isMonitoring) {
            console.log("Performance monitoring already running");
            return false;
        }
        
        console.log("Starting performance monitoring");
        
        // Set up sample timer
        sampleTimer = setInterval(function() {
            this.takeSample();
        }.bind(this), monitorConfig.sampleInterval);
        
        // Set up log timer
        logTimer = setInterval(function() {
            this.logPerformance();
        }.bind(this), monitorConfig.logInterval);
        
        isMonitoring = true;
        lastFrameTime = Date.now();
        
        // Log initial state
        this.logPerformance("Performance monitoring started");
        
        return true;
    },
    
    /**
     * Stop performance monitoring
     */
    stopMonitoring: function() {
        if (!isMonitoring) {
            console.log("Performance monitoring not running");
            return false;
        }
        
        console.log("Stopping performance monitoring");
        
        // Clear timers
        if (sampleTimer) {
            clearInterval(sampleTimer);
            sampleTimer = null;
        }
        
        if (logTimer) {
            clearInterval(logTimer);
            logTimer = null;
        }
        
        isMonitoring = false;
        
        // Log final state
        this.logPerformance("Performance monitoring stopped");
        
        return true;
    },
    
    /**
     * Take a performance sample
     */
    takeSample: function() {
        if (!isMonitoring) {
            return;
        }
        
        var now = Date.now();
        
        // Update uptime
        performanceMetrics.uptime = now - performanceMetrics.startTime;
        
        // Sample frame rate
        this.sampleFrameRate();
        
        // Sample CPU usage
        this.sampleCpuUsage();
        
        // Sample memory usage
        this.sampleMemoryUsage();
        
        // Check for performance alerts
        this.checkPerformanceAlerts();
    },
    
    /**
     * Sample frame rate
     */
    sampleFrameRate: function() {
        var now = Date.now();
        var elapsed = now - lastFrameTime;
        
        if (elapsed >= 1000) { // Calculate FPS every second
            var fps = frameCount / (elapsed / 1000);
            
            // Update frame rate metrics
            performanceMetrics.frameRate.current = fps;
            performanceMetrics.frameRate.min = Math.min(performanceMetrics.frameRate.min, fps);
            performanceMetrics.frameRate.max = Math.max(performanceMetrics.frameRate.max, fps);
            
            // Add to samples
            performanceMetrics.frameRate.samples.push({
                timestamp: now,
                value: fps
            });
            
            // Limit sample count
            if (performanceMetrics.frameRate.samples.length > monitorConfig.maxSampleCount) {
                performanceMetrics.frameRate.samples.shift();
            }
            
            // Calculate average
            var sum = 0;
            for (var i = 0; i < performanceMetrics.frameRate.samples.length; i++) {
                sum += performanceMetrics.frameRate.samples[i].value;
            }
            performanceMetrics.frameRate.avg = sum / performanceMetrics.frameRate.samples.length;
            
            // Reset frame counter
            frameCount = 0;
            lastFrameTime = now;
        }
    },
    
    /**
     * Record a frame being processed
     * Call this method each time a frame is processed
     */
    recordFrame: function() {
        if (!isMonitoring) {
            return;
        }
        
        frameCount++;
    },
    
    /**
     * Sample CPU usage
     */
    sampleCpuUsage: function() {
        try {
            var cpuUsage = 0;
            
            // Try to use system APIs if available
            if (typeof device !== 'undefined' && device.getCpuUsage) {
                // Use AutoJS's device.getCpuUsage() if available
                cpuUsage = device.getCpuUsage();
            } else {
                // Estimate CPU usage based on frame processing time
                // This is a very rough estimate
                var now = Date.now();
                var elapsed = now - lastFrameTime;
                var processingTime = Math.min(elapsed, monitorConfig.sampleInterval);
                cpuUsage = (processingTime / monitorConfig.sampleInterval) * 100;
            }
            
            // Update CPU usage metrics
            performanceMetrics.cpuUsage.current = cpuUsage;
            performanceMetrics.cpuUsage.min = Math.min(performanceMetrics.cpuUsage.min, cpuUsage);
            performanceMetrics.cpuUsage.max = Math.max(performanceMetrics.cpuUsage.max, cpuUsage);
            
            // Add to samples
            performanceMetrics.cpuUsage.samples.push({
                timestamp: Date.now(),
                value: cpuUsage
            });
            
            // Limit sample count
            if (performanceMetrics.cpuUsage.samples.length > monitorConfig.maxSampleCount) {
                performanceMetrics.cpuUsage.samples.shift();
            }
            
            // Calculate average
            var sum = 0;
            for (var i = 0; i < performanceMetrics.cpuUsage.samples.length; i++) {
                sum += performanceMetrics.cpuUsage.samples[i].value;
            }
            performanceMetrics.cpuUsage.avg = sum / performanceMetrics.cpuUsage.samples.length;
        } catch (e) {
            console.error("Failed to sample CPU usage: " + e.message);
        }
    },
    
    /**
     * Sample memory usage
     */
    sampleMemoryUsage: function() {
        try {
            var memoryInfo = {};
            var memoryUsage = 0;
            
            // Try to use system APIs if available
            if (typeof device !== 'undefined' && device.getMemoryInfo) {
                // Use AutoJS's device.getMemoryInfo() if available
                memoryInfo = device.getMemoryInfo();
                memoryUsage = memoryInfo.totalMem - memoryInfo.availMem;
            } else if (typeof runtime !== 'undefined' && runtime.totalMemory) {
                // Use Java runtime memory info if available
                memoryUsage = runtime.totalMemory() - runtime.freeMemory();
            } else {
                // Provide placeholder value if no API available
                memoryUsage = 0;
            }
            
            // Update memory usage metrics
            performanceMetrics.memoryUsage.current = memoryUsage;
            performanceMetrics.memoryUsage.min = Math.min(performanceMetrics.memoryUsage.min, memoryUsage);
            performanceMetrics.memoryUsage.max = Math.max(performanceMetrics.memoryUsage.max, memoryUsage);
            
            // Add to samples
            performanceMetrics.memoryUsage.samples.push({
                timestamp: Date.now(),
                value: memoryUsage
            });
            
            // Limit sample count
            if (performanceMetrics.memoryUsage.samples.length > monitorConfig.maxSampleCount) {
                performanceMetrics.memoryUsage.samples.shift();
            }
            
            // Calculate average
            var sum = 0;
            for (var i = 0; i < performanceMetrics.memoryUsage.samples.length; i++) {
                sum += performanceMetrics.memoryUsage.samples[i].value;
            }
            performanceMetrics.memoryUsage.avg = sum / performanceMetrics.memoryUsage.samples.length;
        } catch (e) {
            console.error("Failed to sample memory usage: " + e.message);
        }
    },
    
    /**
     * Record response time for an action
     * @param {string} actionType - Type of action (e.g., "swipe", "tap")
     * @param {number} responseTime - Time in milliseconds
     */
    recordResponseTime: function(actionType, responseTime) {
        if (!isMonitoring) {
            return;
        }
        
        // Update response time metrics
        performanceMetrics.responseTime.current = responseTime;
        performanceMetrics.responseTime.min = Math.min(performanceMetrics.responseTime.min, responseTime);
        performanceMetrics.responseTime.max = Math.max(performanceMetrics.responseTime.max, responseTime);
        
        // Add to samples
        performanceMetrics.responseTime.samples.push({
            timestamp: Date.now(),
            actionType: actionType,
            value: responseTime
        });
        
        // Limit sample count
        if (performanceMetrics.responseTime.samples.length > monitorConfig.maxSampleCount) {
            performanceMetrics.responseTime.samples.shift();
        }
        
        // Calculate average
        var sum = 0;
        var count = 0;
        for (var i = 0; i < performanceMetrics.responseTime.samples.length; i++) {
            sum += performanceMetrics.responseTime.samples[i].value;
            count++;
        }
        performanceMetrics.responseTime.avg = count > 0 ? sum / count : 0;
    },
    
    /**
     * Update game statistics
     * @param {Object} stats - Game statistics
     */
    updateGameStats: function(stats) {
        if (!stats) {
            return;
        }
        
        // Update games played
        if (stats.gameCompleted) {
            performanceMetrics.gameStats.gamesPlayed++;
        }
        
        // Update high score
        if (stats.score && stats.score > performanceMetrics.gameStats.highScore) {
            performanceMetrics.gameStats.highScore = stats.score;
        }
        
        // Update total coins
        if (stats.coins) {
            performanceMetrics.gameStats.totalCoins += stats.coins;
        }
        
        // Update total distance
        if (stats.distance) {
            performanceMetrics.gameStats.totalDistance += stats.distance;
        }
        
        // Update average score
        if (stats.score && performanceMetrics.gameStats.gamesPlayed > 0) {
            var totalScore = performanceMetrics.gameStats.averageScore * (performanceMetrics.gameStats.gamesPlayed - 1) + stats.score;
            performanceMetrics.gameStats.averageScore = totalScore / performanceMetrics.gameStats.gamesPlayed;
        }
    },
    
    /**
     * Check for performance alerts
     */
    checkPerformanceAlerts: function() {
        var alerts = [];
        
        // Check frame rate
        if (performanceMetrics.frameRate.current < monitorConfig.alertThresholds.frameRate) {
            alerts.push({
                type: "frame_rate",
                message: "Low frame rate: " + performanceMetrics.frameRate.current.toFixed(2) + " FPS",
                value: performanceMetrics.frameRate.current,
                threshold: monitorConfig.alertThresholds.frameRate
            });
        }
        
        // Check CPU usage
        if (performanceMetrics.cpuUsage.current > monitorConfig.alertThresholds.cpuUsage) {
            alerts.push({
                type: "cpu_usage",
                message: "High CPU usage: " + performanceMetrics.cpuUsage.current.toFixed(2) + "%",
                value: performanceMetrics.cpuUsage.current,
                threshold: monitorConfig.alertThresholds.cpuUsage
            });
        }
        
        // Check memory usage
        if (performanceMetrics.memoryUsage.current > monitorConfig.alertThresholds.memoryUsage) {
            alerts.push({
                type: "memory_usage",
                message: "High memory usage: " + (performanceMetrics.memoryUsage.current / (1024 * 1024)).toFixed(2) + " MB",
                value: performanceMetrics.memoryUsage.current,
                threshold: monitorConfig.alertThresholds.memoryUsage
            });
        }
        
        // Check response time
        if (performanceMetrics.responseTime.current > monitorConfig.alertThresholds.responseTime) {
            alerts.push({
                type: "response_time",
                message: "Slow response time: " + performanceMetrics.responseTime.current.toFixed(2) + " ms",
                value: performanceMetrics.responseTime.current,
                threshold: monitorConfig.alertThresholds.responseTime
            });
        }
        
        // Log alerts
        for (var i = 0; i < alerts.length; i++) {
            console.warn("PERFORMANCE ALERT: " + alerts[i].message);
            this.logPerformance("ALERT: " + alerts[i].message);
        }
        
        return alerts;
    },
    
    /**
     * Log performance data to file
     * @param {string} message - Optional message to include in the log
     */
    logPerformance: function(message) {
        try {
            var now = new Date();
            var logEntry = {
                timestamp: now.toISOString(),
                uptime: (performanceMetrics.uptime / 1000).toFixed(2) + "s",
                frameRate: performanceMetrics.frameRate.current.toFixed(2) + " FPS",
                cpuUsage: performanceMetrics.cpuUsage.current.toFixed(2) + "%",
                memoryUsage: (performanceMetrics.memoryUsage.current / (1024 * 1024)).toFixed(2) + " MB",
                responseTime: performanceMetrics.responseTime.current.toFixed(2) + " ms",
                message: message || ""
            };
            
            var logLine = JSON.stringify(logEntry);
            
            // Check if log rotation is needed
            this.checkLogRotation();
            
            // Append to log file
            files.append(monitorConfig.logFile, logLine + "\n");
        } catch (e) {
            console.error("Failed to log performance data: " + e.message);
        }
    },
    
    /**
     * Check if log rotation is needed
     */
    checkLogRotation: function() {
        try {
            // Check if log file exists
            if (!files.exists(monitorConfig.logFile)) {
                return;
            }
            
            // Check log file size
            var fileSize = files.getSize(monitorConfig.logFile);
            
            if (fileSize > monitorConfig.maxLogSize) {
                // Rotate log file
                var timestamp = new Date().getTime();
                var rotatedLogFile = monitorConfig.logFile + "." + timestamp;
                
                // Rename current log file
                files.rename(monitorConfig.logFile, rotatedLogFile);
                
                // Create new log file
                files.create(monitorConfig.logFile);
                
                console.log("Rotated performance log file: " + rotatedLogFile);
                lastLogRotation = Date.now();
            }
        } catch (e) {
            console.error("Failed to rotate log file: " + e.message);
        }
    },
    
    /**
     * Get current performance metrics
     * @return {Object} Performance metrics
     */
    getPerformanceMetrics: function() {
        return performanceMetrics;
    },
    
    /**
     * Get performance summary
     * @return {Object} Performance summary
     */
    getPerformanceSummary: function() {
        return {
            uptime: performanceMetrics.uptime,
            frameRate: {
                current: performanceMetrics.frameRate.current,
                min: performanceMetrics.frameRate.min,
                max: performanceMetrics.frameRate.max,
                avg: performanceMetrics.frameRate.avg
            },
            cpuUsage: {
                current: performanceMetrics.cpuUsage.current,
                min: performanceMetrics.cpuUsage.min,
                max: performanceMetrics.cpuUsage.max,
                avg: performanceMetrics.cpuUsage.avg
            },
            memoryUsage: {
                current: performanceMetrics.memoryUsage.current,
                min: performanceMetrics.memoryUsage.min,
                max: performanceMetrics.memoryUsage.max,
                avg: performanceMetrics.memoryUsage.avg
            },
            responseTime: {
                current: performanceMetrics.responseTime.current,
                min: performanceMetrics.responseTime.min,
                max: performanceMetrics.responseTime.max,
                avg: performanceMetrics.responseTime.avg
            },
            gameStats: performanceMetrics.gameStats
        };
    }
};