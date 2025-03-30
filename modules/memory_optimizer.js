/**
 * Memory Optimizer Module for Subway Surfers Bot
 * Implements Phase 6.2: Performance Optimization features
 * 
 * Features:
 * - Memory footprint reduction
 * - Automatic garbage collection
 * - Resource caching and reuse
 * - Memory leak detection and prevention
 */

// Import required modules
var utils = require('./utils.js');

// Memory optimization state
var memoryState = {
    enabled: true,
    autoGcEnabled: true,
    gcInterval: 60000, // Run GC every 60 seconds
    lastGcTime: 0,
    memoryUsageHistory: [],
    maxHistorySize: 10,
    resourceCache: {},
    maxCacheSize: 20,
    leakDetectionEnabled: true,
    memoryThresholds: {
        warning: 150 * 1024 * 1024, // 150MB
        critical: 250 * 1024 * 1024  // 250MB
    },
    lastMemoryCheck: 0,
    memoryCheckInterval: 10000, // Check memory every 10 seconds
    imageRecyclingEnabled: true,
    unusedResourceCleanupEnabled: true,
    unusedResourceTimeout: 300000, // 5 minutes
    resourceUsageTracking: {},
    memoryLeakSuspects: [],
    memoryLeakThreshold: 5 * 1024 * 1024, // 5MB continuous growth
    consecutiveGrowthCount: 0,
    maxConsecutiveGrowthCount: 3
};

module.exports = {
    /**
     * Initializes the memory optimizer module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing memory optimizer module...");
        
        // Reset state
        this.resetState();
        
        // Apply configuration settings
        if (config && config.performance && config.performance.memory) {
            memoryState.enabled = config.performance.memory.enabled !== undefined ? 
                config.performance.memory.enabled : memoryState.enabled;
                
            memoryState.autoGcEnabled = config.performance.memory.autoGc !== undefined ? 
                config.performance.memory.autoGc : memoryState.autoGcEnabled;
                
            memoryState.imageRecyclingEnabled = config.performance.memory.imageRecycling !== undefined ? 
                config.performance.memory.imageRecycling : memoryState.imageRecyclingEnabled;
                
            memoryState.leakDetectionEnabled = config.performance.memory.leakDetection !== undefined ? 
                config.performance.memory.leakDetection : memoryState.leakDetectionEnabled;
                
            // Apply threshold settings if provided
            if (config.performance.memory.thresholds) {
                if (config.performance.memory.thresholds.warning) {
                    memoryState.memoryThresholds.warning = config.performance.memory.thresholds.warning;
                }
                if (config.performance.memory.thresholds.critical) {
                    memoryState.memoryThresholds.critical = config.performance.memory.thresholds.critical;
                }
            }
        }
        
        // Schedule periodic memory checks
        if (memoryState.enabled) {
            this.scheduleMemoryChecks();
        }
        
        console.log("Memory optimizer module initialized with auto GC " + 
                  (memoryState.autoGcEnabled ? "enabled" : "disabled"));
        return true;
    },
    
    /**
     * Resets the memory optimizer state
     */
    resetState: function() {
        // Clear resource cache
        this.clearResourceCache();
        
        memoryState = {
            enabled: true,
            autoGcEnabled: true,
            gcInterval: 60000,
            lastGcTime: 0,
            memoryUsageHistory: [],
            maxHistorySize: 10,
            resourceCache: {},
            maxCacheSize: 20,
            leakDetectionEnabled: true,
            memoryThresholds: {
                warning: 150 * 1024 * 1024,
                critical: 250 * 1024 * 1024
            },
            lastMemoryCheck: 0,
            memoryCheckInterval: 10000,
            imageRecyclingEnabled: true,
            unusedResourceCleanupEnabled: true,
            unusedResourceTimeout: 300000,
            resourceUsageTracking: {},
            memoryLeakSuspects: [],
            memoryLeakThreshold: 5 * 1024 * 1024,
            consecutiveGrowthCount: 0,
            maxConsecutiveGrowthCount: 3
        };
    },
    
    /**
     * Schedules periodic memory checks
     */
    scheduleMemoryChecks: function() {
        // Clear any existing interval
        if (memoryState.checkInterval) {
            clearInterval(memoryState.checkInterval);
        }
        
        // Set up new interval
        memoryState.checkInterval = setInterval(() => {
            this.checkMemoryUsage();
            
            // Run garbage collection if needed
            if (memoryState.autoGcEnabled) {
                this.runGarbageCollectionIfNeeded();
            }
            
            // Clean up unused resources
            if (memoryState.unusedResourceCleanupEnabled) {
                this.cleanupUnusedResources();
            }
            
            // Detect memory leaks
            if (memoryState.leakDetectionEnabled) {
                this.detectMemoryLeaks();
            }
        }, memoryState.memoryCheckInterval);
    },
    
    /**
     * Checks current memory usage and updates history
     */
    checkMemoryUsage: function() {
        try {
            var memoryUsage = this.getCurrentMemoryUsage();
            
            // Update memory usage history
            memoryState.memoryUsageHistory.push({
                timestamp: Date.now(),
                usage: memoryUsage
            });
            
            // Keep history size limited
            if (memoryState.memoryUsageHistory.length > memoryState.maxHistorySize) {
                memoryState.memoryUsageHistory.shift();
            }
            
            // Check if memory usage exceeds thresholds
            if (memoryUsage > memoryState.memoryThresholds.critical) {
                console.warn("CRITICAL: Memory usage exceeds critical threshold: " + 
                           (memoryUsage / (1024 * 1024)).toFixed(2) + " MB");
                
                // Force garbage collection
                this.forceGarbageCollection();
                
                // Clear resource cache
                this.clearResourceCache();
            } else if (memoryUsage > memoryState.memoryThresholds.warning) {
                console.warn("WARNING: Memory usage exceeds warning threshold: " + 
                           (memoryUsage / (1024 * 1024)).toFixed(2) + " MB");
                
                // Run garbage collection
                this.runGarbageCollection();
            }
            
            memoryState.lastMemoryCheck = Date.now();
        } catch (e) {
            console.error("Error checking memory usage: " + e.message);
        }
    },
    
    /**
     * Gets the current memory usage
     * @return {number} Current memory usage in bytes
     */
    getCurrentMemoryUsage: function() {
        try {
            // Try to get memory usage from runtime if available
            if (typeof runtime !== 'undefined' && runtime.getMemoryUsage) {
                return runtime.getMemoryUsage();
            }
            
            // Try to get memory usage from Java Runtime if available
            if (typeof java !== 'undefined' && java.lang && java.lang.Runtime) {
                var runtime = java.lang.Runtime.getRuntime();
                var usedMemory = runtime.totalMemory() - runtime.freeMemory();
                return usedMemory;
            }
            
            // Fallback to a default value if memory usage can't be determined
            return 50 * 1024 * 1024; // Assume 50MB as default
        } catch (e) {
            console.error("Error getting memory usage: " + e.message);
            return 50 * 1024 * 1024; // Assume 50MB as default
        }
    },
    
    /**
     * Runs garbage collection if needed based on time interval
     */
    runGarbageCollectionIfNeeded: function() {
        var now = Date.now();
        var timeSinceLastGc = now - memoryState.lastGcTime;
        
        // Run GC if enough time has passed since last GC
        if (timeSinceLastGc >= memoryState.gcInterval) {
            this.runGarbageCollection();
        }
    },
    
    /**
     * Runs garbage collection
     */
    runGarbageCollection: function() {
        try {
            console.log("Running garbage collection...");
            
            // Record memory usage before GC
            var memoryBefore = this.getCurrentMemoryUsage();
            
            // Run garbage collection
            this.forceGarbageCollection();
            
            // Record memory usage after GC
            var memoryAfter = this.getCurrentMemoryUsage();
            var memoryFreed = memoryBefore - memoryAfter;
            
            console.log("Garbage collection complete. Memory freed: " + 
                      (memoryFreed / (1024 * 1024)).toFixed(2) + " MB");
            
            memoryState.lastGcTime = Date.now();
            return memoryFreed;
        } catch (e) {
            console.error("Error running garbage collection: " + e.message);
            return 0;
        }
    },
    
    /**
     * Forces garbage collection
     */
    forceGarbageCollection: function() {
        try {
            // Try to force garbage collection if available
            if (typeof global !== 'undefined' && global.gc) {
                global.gc();
            } else {
                // Manual memory management
                // In JavaScript, we can help the garbage collector by nullifying references
                this.clearUnusedReferences();
            }
        } catch (e) {
            console.error("Error forcing garbage collection: " + e.message);
        }
    },
    
    /**
     * Clears unused references to help garbage collection
     */
    clearUnusedReferences: function() {
        // Clear resource cache if it's getting too large
        if (Object.keys(memoryState.resourceCache).length > memoryState.maxCacheSize / 2) {
            this.trimResourceCache();
        }
        
        // Clear memory leak suspects
        memoryState.memoryLeakSuspects = [];
        
        // Suggest global garbage collection
        console.log("Manual memory cleanup performed. Consider restarting the application if memory usage remains high.");
    },
    
    /**
     * Clears the resource cache
     */
    clearResourceCache: function() {
        try {
            // Recycle any image resources in the cache
            for (var key in memoryState.resourceCache) {
                var resource = memoryState.resourceCache[key];
                if (resource && typeof resource.recycle === 'function') {
                    resource.recycle();
                }
            }
            
            // Clear the cache
            memoryState.resourceCache = {};
            memoryState.resourceUsageTracking = {};
            
            console.log("Resource cache cleared");
        } catch (e) {
            console.error("Error clearing resource cache: " + e.message);
        }
    },
    
    /**
     * Trims the resource cache to keep it within size limits
     */
    trimResourceCache: function() {
        try {
            var keys = Object.keys(memoryState.resourceCache);
            if (keys.length <= memoryState.maxCacheSize) return;
            
            // Sort resources by last access time
            keys.sort(function(a, b) {
                var timeA = memoryState.resourceUsageTracking[a] ? memoryState.resourceUsageTracking[a].lastAccess : 0;
                var timeB = memoryState.resourceUsageTracking[b] ? memoryState.resourceUsageTracking[b].lastAccess : 0;
                return timeA - timeB; // Oldest first
            });
            
            // Remove oldest resources until we're under the limit
            var toRemove = keys.length - memoryState.maxCacheSize;
            for (var i = 0; i < toRemove; i++) {
                var key = keys[i];
                var resource = memoryState.resourceCache[key];
                
                // Recycle the resource if it's an image
                if (resource && typeof resource.recycle === 'function') {
                    resource.recycle();
                }
                
                // Remove from cache and tracking
                delete memoryState.resourceCache[key];
                delete memoryState.resourceUsageTracking[key];
            }
            
            console.log("Trimmed resource cache, removed " + toRemove + " items");
        } catch (e) {
            console.error("Error trimming resource cache: " + e.message);
        }
    },
    
    /**
     * Adds a resource to the cache
     * @param {string} key - Cache key
     * @param {Object} resource - Resource to cache
     */
    cacheResource: function(key, resource) {
        if (!memoryState.enabled) return resource;
        
        try {
            // Add to cache
            memoryState.resourceCache[key] = resource;
            
            // Track usage
            memoryState.resourceUsageTracking[key] = {
                createdAt: Date.now(),
                lastAccess: Date.now(),
                accessCount: 1
            };
            
            // Trim cache if needed
            if (Object.keys(memoryState.resourceCache).length > memoryState.maxCacheSize) {
                this.trimResourceCache();
            }
            
            return resource;
        } catch (e) {
            console.error("Error caching resource: " + e.message);
            return resource;
        }
    },
    
    /**
     * Gets a resource from the cache
     * @param {string} key - Cache key
     * @return {Object} Cached resource or null if not found
     */
    getCachedResource: function(key) {
        if (!memoryState.enabled) return null;
        
        try {
            var resource = memoryState.resourceCache[key];
            
            if (resource) {
                // Update usage tracking
                if (memoryState.resourceUsageTracking[key]) {
                    memoryState.resourceUsageTracking[key].lastAccess = Date.now();
                    memoryState.resourceUsageTracking[key].accessCount++;
                }
                
                return resource;
            }
            
            return null;
        } catch (e) {
            console.error("Error getting cached resource: " + e.message);
            return null;
        }
    },
    
    /**
     * Cleans up unused resources
     */
    cleanupUnusedResources: function() {
        if (!memoryState.enabled || !memoryState.unusedResourceCleanupEnabled) return;
        
        try {
            var now = Date.now();
            var keys = Object.keys(memoryState.resourceCache);
            var removedCount = 0;
            
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var tracking = memoryState.resourceUsageTracking[key];
                
                // Skip if no tracking info
                if (!tracking) continue;
                
                // Check if resource hasn't been accessed for a while
                var timeSinceLastAccess = now - tracking.lastAccess;
                if (timeSinceLastAccess > memoryState.unusedResourceTimeout) {
                    var resource = memoryState.resourceCache[key];
                    
                    // Recycle the resource if it's an image
                    if (resource && typeof resource.recycle === 'function') {
                        resource.recycle();
                    }
                    
                    // Remove from cache and tracking
                    delete memoryState.resourceCache[key];
                    delete memoryState.resourceUsageTracking[key];
                    removedCount++;
                }
            }
            
            if (removedCount > 0) {
                console.log("Cleaned up " + removedCount + " unused resources");
            }
        } catch (e) {
            console.error("Error cleaning up unused resources: " + e.message);
        }
    },
    
    /**
     * Recycles an image resource
     * @param {Object} img - Image to recycle
     */
    recycleImage: function(img) {
        if (!memoryState.enabled || !memoryState.imageRecyclingEnabled) return;
        
        try {
            if (img && typeof img.recycle === 'function') {
                img.recycle();
            }
        } catch (e) {
            console.error("Error recycling image: " + e.message);
        }
    },
    
    /**
     * Detects potential memory leaks
     */
    detectMemoryLeaks: function() {
        if (!memoryState.enabled || !memoryState.leakDetectionEnabled) return;
        
        try {
            // Need at least 2 memory measurements to detect leaks
            if (memoryState.memoryUsageHistory.length < 2) return;
            
            // Get the last two memory measurements
            var lastIndex = memoryState.memoryUsageHistory.length - 1;
            var currentMemory = memoryState.memoryUsageHistory[lastIndex].usage;
            var previousMemory = memoryState.memoryUsageHistory[lastIndex - 1].usage;
            
            // Check if memory usage is continuously increasing
            var memoryDiff = currentMemory - previousMemory;
            
            if (memoryDiff > memoryState.memoryLeakThreshold) {
                // Memory usage increased significantly
                cpuState.consecutiveGrowthCount++;
                
                if (cpuState.consecutiveGrowthCount >= cpuState.maxConsecutiveGrowthCount) {
                    console.warn("POTENTIAL MEMORY LEAK DETECTED: Memory usage has increased by " + 
                               (memoryDiff / (1024 * 1024)).toFixed(2) + " MB over " + 
                               cpuState.maxConsecutiveGrowthCount + " consecutive checks");
                    
                    // Force garbage collection
                    this.forceGarbageCollection();
                    
                    // Reset counter after taking action
                    cpuState.consecutiveGrowthCount = 0;
                }
            } else {
                // Memory usage is stable or decreasing
                cpuState.consecutiveGrowthCount = 0;
            }
        } catch (e) {
            console.error("Error detecting memory leaks: " + e.message);
        }
    },
    
    /**
     * Gets memory optimization metrics
     * @return {Object} Memory optimization metrics
     */
    getMetrics: function() {
        var currentMemory = 0;
        var peakMemory = 0;
        
        try {
            currentMemory = this.getCurrentMemoryUsage();
            
            // Calculate peak memory from history
            if (memoryState.memoryUsageHistory.length > 0) {
                for (var i = 0; i < memoryState.memoryUsageHistory.length; i++) {
                    var usage = memoryState.memoryUsageHistory[i].usage;
                    if (usage > peakMemory) {
                        peakMemory = usage;
                    }
                }
            } else {
                peakMemory = currentMemory;
            }
        } catch (e) {
            console.error("Error getting memory metrics: " + e.message);
        }
        
        return {
            enabled: memoryState.enabled,
            autoGcEnabled: memoryState.autoGcEnabled,
            currentMemory: Math.round(currentMemory / (1024 * 1024)), // MB
            peakMemory: Math.round(peakMemory / (1024 * 1024)), // MB
            lastGcTime: memoryState.lastGcTime,
            cacheSize: Object.keys(memoryState.resourceCache).length,
            maxCacheSize: memoryState.maxCacheSize,
            imageRecyclingEnabled: memoryState.imageRecyclingEnabled,
            leakDetectionEnabled: memoryState.leakDetectionEnabled
        };
    }
};