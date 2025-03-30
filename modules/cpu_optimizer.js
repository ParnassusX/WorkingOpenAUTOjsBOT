/**
 * CPU Optimizer Module for Subway Surfers Bot
 * Implements Phase 6.2: Performance Optimization features
 * 
 * Features:
 * - CPU usage optimization through adaptive throttling
 * - Process priority management
 * - Background task management
 * - Thermal management for extended play
 */

// Import required modules
var utils = require('./utils.js');

// CPU optimization state
var cpuState = {
    throttlingEnabled: false,
    currentThrottleLevel: 0, // 0-5, where 0 is no throttling and 5 is maximum throttling
    targetFps: 30, // Target frames per second
    minFps: 20, // Minimum acceptable FPS
    maxFps: 60, // Maximum FPS to cap at
    thermalManagementEnabled: true,
    backgroundTasksEnabled: true,
    processPriorityEnabled: true,
    adaptiveThrottlingEnabled: true,
    batteryOptimizationEnabled: true,
    fpsHistory: [],
    maxFpsHistorySize: 10,
    temperatureHistory: [],
    maxTemperatureHistorySize: 10,
    batteryLevelHistory: [],
    maxBatteryHistorySize: 10,
    lastThrottleAdjustment: 0,
    throttleAdjustmentInterval: 5000, // 5 seconds
    lastThermalCheck: 0,
    thermalCheckInterval: 30000, // 30 seconds
    lastBatteryCheck: 0,
    batteryCheckInterval: 60000, // 60 seconds
    backgroundTasks: [],
    pausedTasks: [],
    throttleLevels: [
        { name: "None", frameDelay: 0, taskReduction: 0 },
        { name: "Low", frameDelay: 5, taskReduction: 0.2 },
        { name: "Medium", frameDelay: 10, taskReduction: 0.4 },
        { name: "High", frameDelay: 20, taskReduction: 0.6 },
        { name: "Very High", frameDelay: 30, taskReduction: 0.8 },
        { name: "Maximum", frameDelay: 50, taskReduction: 0.9 }
    ]
};

module.exports = {
    /**
     * Initializes the CPU optimizer module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing CPU optimizer module...");
        
        // Reset state
        this.resetState();
        
        // Apply configuration settings
        if (config && config.performance && config.performance.cpu) {
            cpuState.throttlingEnabled = config.performance.cpu.throttling !== undefined ? 
                config.performance.cpu.throttling : cpuState.throttlingEnabled;
                
            cpuState.thermalManagementEnabled = config.performance.cpu.thermalManagement !== undefined ? 
                config.performance.cpu.thermalManagement : cpuState.thermalManagementEnabled;
                
            cpuState.backgroundTasksEnabled = config.performance.cpu.backgroundTasks !== undefined ? 
                config.performance.cpu.backgroundTasks : cpuState.backgroundTasksEnabled;
                
            cpuState.processPriorityEnabled = config.performance.cpu.processPriority !== undefined ? 
                config.performance.cpu.processPriority : cpuState.processPriorityEnabled;
                
            cpuState.adaptiveThrottlingEnabled = config.performance.cpu.adaptiveThrottling !== undefined ? 
                config.performance.cpu.adaptiveThrottling : cpuState.adaptiveThrottlingEnabled;
                
            cpuState.batteryOptimizationEnabled = config.performance.cpu.batteryOptimization !== undefined ? 
                config.performance.cpu.batteryOptimization : cpuState.batteryOptimizationEnabled;
                
            // Apply FPS settings if provided
            if (config.performance.cpu.fps) {
                if (config.performance.cpu.fps.target) {
                    cpuState.targetFps = config.performance.cpu.fps.target;
                }
                if (config.performance.cpu.fps.min) {
                    cpuState.minFps = config.performance.cpu.fps.min;
                }
                if (config.performance.cpu.fps.max) {
                    cpuState.maxFps = config.performance.cpu.fps.max;
                }
            }
        }
        
        // Set initial throttle level based on device capabilities
        this.setInitialThrottleLevel();
        
        // Schedule periodic checks
        this.schedulePeriodicChecks();
        
        console.log("CPU optimizer module initialized with throttling " + 
                  (cpuState.throttlingEnabled ? "enabled" : "disabled"));
        return true;
    },
    
    /**
     * Resets the CPU optimizer state
     */
    resetState: function() {
        cpuState = {
            throttlingEnabled: false,
            currentThrottleLevel: 0,
            targetFps: 30,
            minFps: 20,
            maxFps: 60,
            thermalManagementEnabled: true,
            backgroundTasksEnabled: true,
            processPriorityEnabled: true,
            adaptiveThrottlingEnabled: true,
            batteryOptimizationEnabled: true,
            fpsHistory: [],
            maxFpsHistorySize: 10,
            temperatureHistory: [],
            maxTemperatureHistorySize: 10,
            batteryLevelHistory: [],
            maxBatteryHistorySize: 10,
            lastThrottleAdjustment: 0,
            throttleAdjustmentInterval: 5000,
            lastThermalCheck: 0,
            thermalCheckInterval: 30000,
            lastBatteryCheck: 0,
            batteryCheckInterval: 60000,
            backgroundTasks: [],
            pausedTasks: [],
            throttleLevels: [
                { name: "None", frameDelay: 0, taskReduction: 0 },
                { name: "Low", frameDelay: 5, taskReduction: 0.2 },
                { name: "Medium", frameDelay: 10, taskReduction: 0.4 },
                { name: "High", frameDelay: 20, taskReduction: 0.6 },
                { name: "Very High", frameDelay: 30, taskReduction: 0.8 },
                { name: "Maximum", frameDelay: 50, taskReduction: 0.9 }
            ]
        };
    },
    
    /**
     * Sets the initial throttle level based on device capabilities
     */
    setInitialThrottleLevel: function() {
        try {
            // Check device specs to determine initial throttle level
            var deviceInfo = this.getDeviceInfo();
            
            // Set throttle level based on device capabilities
            if (deviceInfo.isHighEnd) {
                cpuState.currentThrottleLevel = 0; // No throttling for high-end devices
            } else if (deviceInfo.isMidRange) {
                cpuState.currentThrottleLevel = 1; // Low throttling for mid-range devices
            } else {
                cpuState.currentThrottleLevel = 2; // Medium throttling for low-end devices
            }
            
            console.log("Initial throttle level set to " + cpuState.currentThrottleLevel + 
                      " (" + cpuState.throttleLevels[cpuState.currentThrottleLevel].name + ")");
        } catch (e) {
            console.error("Error setting initial throttle level: " + e.message);
            cpuState.currentThrottleLevel = 1; // Default to low throttling
        }
    },
    
    /**
     * Gets device information
     * @return {Object} Device information
     */
    getDeviceInfo: function() {
        try {
            var deviceInfo = {
                isHighEnd: false,
                isMidRange: false,
                isLowEnd: false,
                cpuCores: 4, // Default assumption
                totalMemory: 2048, // Default assumption (MB)
                screenResolution: [1280, 720] // Default assumption
            };
            
            // Try to get actual device information
            if (typeof device !== 'undefined') {
                // Get CPU cores if available
                if (device.getCpuCores) {
                    deviceInfo.cpuCores = device.getCpuCores();
                }
                
                // Get screen resolution if available
                if (device.width && device.height) {
                    deviceInfo.screenResolution = [device.width, device.height];
                }
            }
            
            // Try to get memory information
            if (typeof java !== 'undefined' && java.lang && java.lang.Runtime) {
                var runtime = java.lang.Runtime.getRuntime();
                deviceInfo.totalMemory = Math.round(runtime.maxMemory() / (1024 * 1024));
            }
            
            // Categorize device based on specs
            if (deviceInfo.cpuCores >= 8 && deviceInfo.totalMemory >= 4096) {
                deviceInfo.isHighEnd = true;
            } else if (deviceInfo.cpuCores >= 4 && deviceInfo.totalMemory >= 2048) {
                deviceInfo.isMidRange = true;
            } else {
                deviceInfo.isLowEnd = true;
            }
            
            return deviceInfo;
        } catch (e) {
            console.error("Error getting device info: " + e.message);
            return {
                isHighEnd: false,
                isMidRange: true,
                isLowEnd: false,
                cpuCores: 4,
                totalMemory: 2048,
                screenResolution: [1280, 720]
            };
        }
    },
    
    /**
     * Schedules periodic checks for CPU optimization
     */
    schedulePeriodicChecks: function() {
        // Clear any existing intervals
        if (cpuState.throttleInterval) {
            clearInterval(cpuState.throttleInterval);
        }
        if (cpuState.thermalInterval) {
            clearInterval(cpuState.thermalInterval);
        }
        if (cpuState.batteryInterval) {
            clearInterval(cpuState.batteryInterval);
        }
        
        // Set up throttle adjustment interval
        if (cpuState.adaptiveThrottlingEnabled) {
            cpuState.throttleInterval = setInterval(() => {
                this.adjustThrottleLevel();
            }, cpuState.throttleAdjustmentInterval);
        }
        
        // Set up thermal management interval
        if (cpuState.thermalManagementEnabled) {
            cpuState.thermalInterval = setInterval(() => {
                this.checkTemperature();
            }, cpuState.thermalCheckInterval);
        }
        
        // Set up battery optimization interval
        if (cpuState.batteryOptimizationEnabled) {
            cpuState.batteryInterval = setInterval(() => {
                this.checkBatteryLevel();
            }, cpuState.batteryCheckInterval);
        }
    },
    
    /**
     * Records FPS for adaptive throttling
     * @param {number} fps - Current frames per second
     */
    recordFps: function(fps) {
        // Add FPS to history
        cpuState.fpsHistory.push({
            timestamp: Date.now(),
            fps: fps
        });
        
        // Keep history size limited
        if (cpuState.fpsHistory.length > cpuState.maxFpsHistorySize) {
            cpuState.fpsHistory.shift();
        }
    },
    
    /**
     * Adjusts throttle level based on performance metrics
     */
    adjustThrottleLevel: function() {
        if (!cpuState.throttlingEnabled || !cpuState.adaptiveThrottlingEnabled) return;
        
        try {
            var now = Date.now();
            var timeSinceLastAdjustment = now - cpuState.lastThrottleAdjustment;
            
            // Only adjust throttle level at specified intervals
            if (timeSinceLastAdjustment < cpuState.throttleAdjustmentInterval) return;
            
            // Calculate average FPS
            var avgFps = this.getAverageFps();
            
            // Adjust throttle level based on FPS
            var oldLevel = cpuState.currentThrottleLevel;
            
            if (avgFps > cpuState.targetFps * 1.2) {
                // FPS is much higher than target, increase throttling
                this.increaseThrottleLevel();
            } else if (avgFps < cpuState.minFps) {
                // FPS is below minimum, decrease throttling
                this.decreaseThrottleLevel();
            } else if (avgFps < cpuState.targetFps * 0.9) {
                // FPS is slightly below target, slightly decrease throttling
                if (Math.random() < 0.5) { // Only decrease 50% of the time to avoid oscillation
                    this.decreaseThrottleLevel();
                }
            }
            
            // Log throttle level change
            if (oldLevel !== cpuState.currentThrottleLevel) {
                console.log("Throttle level adjusted from " + oldLevel + " to " + cpuState.currentThrottleLevel + 
                      " (" + cpuState.throttleLevels[cpuState.currentThrottleLevel].name + ")");
            }
            
            cpuState.lastThrottleAdjustment = now;
        } catch (e) {
            console.error("Error adjusting throttle level: " + e.message);
        }
    },
    
    /**
     * Gets the average FPS from history
     * @return {number} Average FPS
     */
    getAverageFps: function() {
        if (cpuState.fpsHistory.length === 0) return cpuState.targetFps;
        
        var sum = 0;
        for (var i = 0; i < cpuState.fpsHistory.length; i++) {
            sum += cpuState.fpsHistory[i].fps;
        }
        
        return sum / cpuState.fpsHistory.length;
    },
    
    /**
     * Increases the throttle level
     */
    increaseThrottleLevel: function() {
        if (cpuState.currentThrottleLevel < cpuState.throttleLevels.length - 1) {
            cpuState.currentThrottleLevel++;
            console.log("Increased throttle level to " + cpuState.currentThrottleLevel + 
                      " (" + cpuState.throttleLevels[cpuState.currentThrottleLevel].name + ")");
        }
    },
    
    /**
     * Decreases the throttle level
     */
    decreaseThrottleLevel: function() {
        if (cpuState.currentThrottleLevel > 0) {
            cpuState.currentThrottleLevel--;
            console.log("Decreased throttle level to " + cpuState.currentThrottleLevel + 
                      " (" + cpuState.throttleLevels[cpuState.currentThrottleLevel].name + ")");
        }
    },
    
    /**
     * Applies throttling to the current frame
     */
    applyThrottling: function() {
        if (!cpuState.throttlingEnabled) return;
        
        try {
            // Get the current throttle level settings
            var throttleLevel = cpuState.throttleLevels[cpuState.currentThrottleLevel];
            
            // Apply frame delay if needed
            if (throttleLevel.frameDelay > 0) {
                sleep(throttleLevel.frameDelay);
            }
        } catch (e) {
            console.error("Error applying throttling: " + e.message);
        }
    },
    
    /**
     * Checks device temperature and adjusts throttling if needed
     */
    checkTemperature: function() {
        if (!cpuState.thermalManagementEnabled) return;
        
        try {
            var now = Date.now();
            var timeSinceLastCheck = now - cpuState.lastThermalCheck;
            
            // Only check temperature at specified intervals
            if (timeSinceLastCheck < cpuState.thermalCheckInterval) return;
            
            // Get device temperature if available
            var temperature = this.getDeviceTemperature();
            
            // Add temperature to history
            cpuState.temperatureHistory.push({
                timestamp: now,
                temperature: temperature
            });
            
            // Keep history size limited
            if (cpuState.temperatureHistory.length > cpuState.maxTemperatureHistorySize) {
                cpuState.temperatureHistory.shift();
            }
            
            // Adjust throttling based on temperature
            if (temperature > 45) { // Very hot
                // Increase throttling to maximum
                cpuState.currentThrottleLevel = cpuState.throttleLevels.length - 1;
                console.log("Device temperature critical (" + temperature + "°C), maximizing throttling");
            } else if (temperature > 40) { // Hot
                // Increase throttling significantly
                cpuState.currentThrottleLevel = Math.min(cpuState.currentThrottleLevel + 2, 
                                                    cpuState.throttleLevels.length - 1);
                console.log("Device temperature high (" + temperature + "°C), increasing throttling");
            } else if (temperature > 35) { // Warm
                // Increase throttling slightly
                this.increaseThrottleLevel();
                console.log("Device temperature warm (" + temperature + "°C), slightly increasing throttling");
            }
            
            cpuState.lastThermalCheck = now;
        } catch (e) {
            console.error("Error checking temperature: " + e.message);
        }
    },
    
    /**
     * Gets the device temperature
     * @return {number} Device temperature in Celsius
     */
    getDeviceTemperature: function() {
        try {
            // Try to get device temperature if available
            if (typeof device !== 'undefined' && device.getBatteryTemperature) {
                return device.getBatteryTemperature();
            }
            
            // Fallback to a default value
            return 30; // Assume 30°C as default
        } catch (e) {
            console.error("Error getting device temperature: " + e.message);
            return 30; // Assume 30°C as default
        }
    },
    
    /**
     * Checks battery level and adjusts throttling if needed
     */
    checkBatteryLevel: function() {
        if (!cpuState.batteryOptimizationEnabled) return;
        
        try {
            var now = Date.now();
            var timeSinceLastCheck = now - cpuState.lastBatteryCheck;
            
            // Only check battery at specified intervals
            if (timeSinceLastCheck < cpuState.batteryCheckInterval) return;
            
            // Get battery level if available
            var batteryLevel = this.getBatteryLevel();
            
            // Add battery level to history
            cpuState.batteryLevelHistory.push({
                timestamp: now,
                level: batteryLevel
            });
            
            // Keep history size limited
            if (cpuState.batteryLevelHistory.length > cpuState.maxBatteryHistorySize) {
                cpuState.batteryLevelHistory.shift();
            }
            
            // Adjust throttling based on battery level
            if (batteryLevel < 15) { // Critical battery
                // Increase throttling to maximum
                cpuState.currentThrottleLevel = cpuState.throttleLevels.length - 1;
                console.log("Battery level critical (" + batteryLevel + "%), maximizing throttling");
            } else if (batteryLevel < 30) { // Low battery
                // Increase throttling significantly
                cpuState.currentThrottleLevel = Math.min(cpuState.currentThrottleLevel + 2, 
                                                    cpuState.throttleLevels.length - 1);
                console.log("Battery level low (" + batteryLevel + "%), increasing throttling");
            } else if (batteryLevel < 50) { // Medium battery
                // Increase throttling slightly
                this.increaseThrottleLevel();
                console.log("Battery level medium (" + batteryLevel + "%), slightly increasing throttling");
            }
            
            cpuState.lastBatteryCheck = now;
        } catch (e) {
            console.error("Error checking battery level: " + e.message);
        }
    },
    
    /**
     * Gets the battery level
     * @return {number} Battery level percentage
     */
    getBatteryLevel: function() {
        try {
            // Try to get battery level if available
            if (typeof device !== 'undefined' && device.getBattery) {
                return device.getBattery();
            }
            
            // Fallback to a default value
            return 50; // Assume 50% as default
        } catch (e) {
            console.error("Error getting battery level: " + e.message);
            return 50; // Assume 50% as default
        }
    },
    
    /**
     * Registers a background task
     * @param {string} taskId - Unique task identifier
     * @param {Function} taskFn - Task function
     * @param {number} priority - Task priority (0-10, where 10 is highest)
     * @param {number} interval - Task interval in ms
     */
    registerBackgroundTask: function(taskId, taskFn, priority, interval) {
        if (!cpuState.backgroundTasksEnabled) return null;
        
        try {
            // Create task object
            var task = {
                id: taskId,
                fn: taskFn,
                priority: priority || 5,
                interval: interval || 1000,
                lastRun: 0,
                enabled: true
            };
            
            // Add to background tasks
            cpuState.backgroundTasks.push(task);
            
            console.log("Registered background task: " + taskId);
            return task;
        } catch (e) {
            console.error("Error registering background task: " + e.message);
            return null;
        }
    },
    
    /**
     * Runs background tasks based on current throttle level
     */
    runBackgroundTasks: function() {
        if (!cpuState.backgroundTasksEnabled) return;
        
        try {
            var now = Date.now();
            var throttleLevel = cpuState.throttleLevels[cpuState.currentThrottleLevel];
            var taskReductionFactor = throttleLevel.taskReduction;
            
            // Sort tasks by priority (highest first)
            cpuState.backgroundTasks.sort(function(a, b) {
                return b.priority - a.priority;
            });
            
            // Calculate how many tasks to run based on throttle level
            var tasksToRun = Math.ceil(cpuState.backgroundTasks.length * (1 - taskReductionFactor));
            
            // Run high priority tasks
            var tasksRun = 0;
            for (var i = 0; i < cpuState.backgroundTasks.length && tasksRun < tasksToRun; i++) {
                var task = cpuState.backgroundTasks[i];
                
                // Skip disabled tasks
                if (!task.enabled) continue;
                
                // Check if it's time to run this task
                var timeSinceLastRun = now - task.lastRun;
                if (timeSinceLastRun >= task.interval) {
                    try {
                        task.fn();
                        task.lastRun = now;
                        tasksRun++;
                    } catch (e) {
                        console.error("Error running background task " + task.id + ": " + e.message);
                    }
                }
            }
        } catch (e) {
            console.error("Error running background tasks: " + e.message);
        }
    },
    
    /**
     * Pauses a background task
     * @param {string} taskId - Task identifier
     */
    pauseBackgroundTask: function(taskId) {
        try {
            for (var i = 0; i < cpuState.backgroundTasks.length; i++) {
                if (cpuState.backgroundTasks[i].id === taskId) {
                    cpuState.backgroundTasks[i].enabled = false;
                    cpuState.pausedTasks.push(taskId);
                    console.log("Paused background task: " + taskId);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error("Error pausing background task: " + e.message);
            return false;
        }
    },
    
    /**
     * Resumes a paused background task
     * @param {string} taskId - Task identifier
     */
    resumeBackgroundTask: function(taskId) {
        try {
            // Remove from paused tasks
            var index = cpuState.pausedTasks.indexOf(taskId);
            if (index !== -1) {
                cpuState.pausedTasks.splice(index, 1);
            }
            
            // Enable the task
            for (var i = 0; i < cpuState.backgroundTasks.length; i++) {
                if (cpuState.backgroundTasks[i].id === taskId) {
                    cpuState.backgroundTasks[i].enabled = true;
                    console.log("Resumed background task: " + taskId);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error("Error resuming background task: " + e.message);
            return false;
        }
    },
    
    /**
     * Gets CPU optimization metrics
     * @return {Object} CPU optimization metrics
     */
    getMetrics: function() {
        var avgFps = this.getAverageFps();
        var currentThrottle = cpuState.throttleLevels[cpuState.currentThrottleLevel];
        
        return {
            enabled: cpuState.throttlingEnabled,
            currentThrottleLevel: cpuState.currentThrottleLevel,
            throttleName: currentThrottle.name,
            frameDelay: currentThrottle.frameDelay,
            avgFps: avgFps.toFixed(2),
            targetFps: cpuState.targetFps,
            thermalManagementEnabled: cpuState.thermalManagementEnabled,
            batteryOptimizationEnabled: cpuState.batteryOptimizationEnabled,
            backgroundTasksEnabled: cpuState.backgroundTasksEnabled,
            activeBackgroundTasks: cpuState.backgroundTasks.filter(function(task) {
                return task.enabled;
            }).length,
            pausedBackgroundTasks: cpuState.pausedTasks.length,
            temperature: cpuState.temperatureHistory.length > 0 ? 
                cpuState.temperatureHistory[cpuState.temperatureHistory.length - 1].temperature : 0,
            batteryLevel: cpuState.batteryLevelHistory.length > 0 ? 
                cpuState.batteryLevelHistory[cpuState.batteryLevelHistory.length - 1].level : 0
        };
    }
};