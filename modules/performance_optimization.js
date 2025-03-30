/**
 * Performance Optimization Module for Subway Surfers Bot
 * Implements Phase 2.3: Performance Optimization features
 * 
 * Features:
 * - Image processing optimization for reduced CPU usage
 * - Region-of-interest (ROI) based processing
 * - Frame skipping for performance improvement
 * - Memory management system for image resources
 */

// Import required modules
var utils = require('./utils.js');
var cpuOptimizer = require('./cpu_optimizer.js');
var memoryOptimizer = require('./memory_optimizer.js');

// Import timing optimization library
const TimingOptimizer = require('timing-optimizer');

// Initialize timing optimizer for click timing
var clickTimingOptimizer = new TimingOptimizer({targetWindow: 50});

// Performance metrics tracking
var performanceMetrics = {
    frameProcessingTimes: [],     // Array of recent frame processing times in ms
    memoryUsage: [],             // Array of memory usage snapshots
    skippedFrames: 0,            // Count of frames skipped
    totalFramesProcessed: 0,     // Total frames processed
    lastGarbageCollection: 0,     // Timestamp of last garbage collection
    regionOfInterestStats: {      // Stats for ROI processing
        totalPixelsProcessed: 0,
        totalPixelsSkipped: 0
    }
};

// Default ROI definitions (will be updated based on screen dimensions)
var regionOfInterest = {
    obstacles: { x: 0, y: 0, width: 0, height: 0 },
    player: { x: 0, y: 0, width: 0, height: 0 },
    coins: { x: 0, y: 0, width: 0, height: 0 },
    powerups: { x: 0, y: 0, width: 0, height: 0 },
    ui: { x: 0, y: 0, width: 0, height: 0 }
};

module.exports = {
    /**
     * Initializes the performance optimization module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing performance optimization module...");
        
        // Reset performance metrics
        this.resetMetrics();
        
        // Initialize CPU optimizer
        try {
            console.log("Initializing CPU optimizer...");
            cpuOptimizer.initialize(config);
            console.log("CPU optimizer initialized successfully");
        } catch (e) {
            console.error("Failed to initialize CPU optimizer: " + e.message);
        }
        
        // Initialize memory optimizer
        try {
            console.log("Initializing memory optimizer...");
            memoryOptimizer.initialize(config);
            console.log("Memory optimizer initialized successfully");
        } catch (e) {
            console.error("Failed to initialize memory optimizer: " + e.message);
        }
        
        // Schedule periodic garbage collection if available
        if (typeof global !== 'undefined' && global.gc) {
            console.log("Garbage collection available, scheduling periodic cleanup");
            setInterval(function() {
                this.forceGarbageCollection();
            }.bind(this), 30000); // Run every 30 seconds
        } else {
            console.log("Automatic garbage collection not available, will use manual memory management");
        }
        
        console.log("Performance optimization module initialized");
    },
    
    /**
     * Resets performance metrics
     */
    resetMetrics: function() {
        performanceMetrics = {
            frameProcessingTimes: [],
            memoryUsage: [],
            skippedFrames: 0,
            totalFramesProcessed: 0,
            lastGarbageCollection: Date.now(),
            regionOfInterestStats: {
                totalPixelsProcessed: 0,
                totalPixelsSkipped: 0
            }
        };
    },
    
    /**
     * Updates region of interest areas based on screen dimensions
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings
     */
    updateRegionsOfInterest: function(width, height, config) {
        // Calculate ROIs based on screen dimensions and config settings
        var visionConfig = config.vision;
        
        // Obstacles ROI - middle portion of the screen where obstacles appear
        regionOfInterest.obstacles = {
            x: Math.floor(width * 0.1),
            y: Math.floor(height * visionConfig.regions.obstacles.topPercent),
            width: Math.floor(width * 0.8),
            height: Math.floor(height * visionConfig.regions.obstacles.heightPercent)
        };
        
        // Player ROI - bottom portion where player character is visible
        regionOfInterest.player = {
            x: Math.floor(width * 0.3),
            y: Math.floor(height * visionConfig.regions.player.topPercent),
            width: Math.floor(width * 0.4),
            height: Math.floor(height * visionConfig.regions.player.heightPercent)
        };
        
        // Coins ROI - middle-top portion where coins appear
        regionOfInterest.coins = {
            x: Math.floor(width * 0.2),
            y: Math.floor(height * visionConfig.regions.coins.topPercent),
            width: Math.floor(width * 0.6),
            height: Math.floor(height * visionConfig.regions.coins.heightPercent)
        };
        
        // Powerups ROI - similar to coins but slightly larger
        regionOfInterest.powerups = {
            x: Math.floor(width * 0.15),
            y: Math.floor(height * visionConfig.regions.powerups.topPercent),
            width: Math.floor(width * 0.7),
            height: Math.floor(height * visionConfig.regions.powerups.heightPercent)
        };
        
        // UI ROI - top portion of screen for score, coins count, etc.
        regionOfInterest.ui = {
            x: 0,
            y: 0,
            width: width,
            height: Math.floor(height * 0.15)
        };
        
        console.log("Updated regions of interest for screen dimensions: " + width + "x" + height);
    },
    
    /**
     * Determines if the current frame should be processed or skipped
     * @param {Object} config - Configuration settings
     * @return {boolean} True if frame should be processed, false if it should be skipped
     */
    shouldProcessFrame: function(config) {
        // Increment total frames counter
        performanceMetrics.totalFramesProcessed++;
        
        // If frame skipping is disabled, always process
        if (!config.vision.performance.frameSkip || config.vision.performance.frameSkip <= 1) {
            return true;
        }
        
        // Process every nth frame based on frameSkip setting
        if (performanceMetrics.totalFramesProcessed % config.vision.performance.frameSkip === 0) {
            return true;
        }
        
        // Skip this frame
        performanceMetrics.skippedFrames++;
        return false;
    },
    
    /**
     * Extracts a region of interest from the full screen image
     * @param {Object} img - Full screen image
     * @param {string} regionType - Type of region to extract (obstacles, player, coins, etc.)
     * @return {Object} Cropped image containing only the region of interest
     */
    extractRegionOfInterest: function(img, regionType) {
        if (!img || !regionOfInterest[regionType]) {
            console.error("Invalid image or region type: " + regionType);
            return null;
        }
        
        try {
            var region = regionOfInterest[regionType];
            var roiImg = images.clip(img, region.x, region.y, region.width, region.height);
            
            // Update statistics
            performanceMetrics.regionOfInterestStats.totalPixelsProcessed += (region.width * region.height);
            performanceMetrics.regionOfInterestStats.totalPixelsSkipped += 
                (img.getWidth() * img.getHeight()) - (region.width * region.height);
            
            return roiImg;
        } catch (e) {
            console.error("Error extracting region of interest: " + e.message);
            return null;
        }
    },
    
    /**
     * Manages memory by recycling image resources
     * @param {Array} images - Array of image objects to recycle
     */
    recycleImages: function(images) {
        if (!images || !Array.isArray(images)) {
            return;
        }
        
        for (var i = 0; i < images.length; i++) {
            try {
                if (images[i] && typeof images[i].recycle === 'function') {
                    images[i].recycle();
                }
            } catch (e) {
                console.error("Error recycling image: " + e.message);
            }
        }
    },
    
    /**
     * Forces garbage collection if available
     */
    forceGarbageCollection: function() {
        try {
            // Record current memory usage if available
            if (typeof runtime !== 'undefined' && runtime.getMemoryUsage) {
                var memBefore = runtime.getMemoryUsage();
                performanceMetrics.memoryUsage.push(memBefore);
                
                // Keep only the last 10 measurements
                if (performanceMetrics.memoryUsage.length > 10) {
                    performanceMetrics.memoryUsage.shift();
                }
            }
            
            // Use memory optimizer if available
            if (memoryOptimizer && typeof memoryOptimizer.forceGarbageCollection === 'function') {
                memoryOptimizer.forceGarbageCollection();
                console.log("Forced garbage collection using memory optimizer at " + new Date().toISOString());
            }
            // Fallback to global GC if memory optimizer is not available
            else if (typeof global !== 'undefined' && global.gc) {
                global.gc();
                console.log("Forced garbage collection at " + new Date().toISOString());
            } else {
                // Manual memory management
                // In JavaScript, we can help the garbage collector by nullifying references
                // This is a simple approach and may not be as effective as true garbage collection
                console.log("Manual memory cleanup at " + new Date().toISOString());
            }
            
            performanceMetrics.lastGarbageCollection = Date.now();
            
            // Record memory usage after collection if available
            if (typeof runtime !== 'undefined' && runtime.getMemoryUsage) {
                var memAfter = runtime.getMemoryUsage();
                console.log("Memory before: " + memBefore + ", after: " + memAfter + 
                          ", freed: " + (memBefore - memAfter) + " bytes");
            }
        } catch (e) {
            console.error("Error during garbage collection: " + e.message);
        }
    },
    
    /**
     * Records frame processing time
     * @param {number} processingTime - Time taken to process the frame in ms
     */
    recordFrameProcessingTime: function(processingTime) {
        performanceMetrics.frameProcessingTimes.push(processingTime);
        
        // Keep only the last 100 measurements
        if (performanceMetrics.frameProcessingTimes.length > 100) {
            performanceMetrics.frameProcessingTimes.shift();
        }
    },
    
    /**
     * Gets current performance metrics
     * @return {Object} Current performance metrics
     */
    getPerformanceMetrics: function() {
        // Calculate average processing time
        var avgProcessingTime = 0;
        if (performanceMetrics.frameProcessingTimes.length > 0) {
            var sum = 0;
            for (var i = 0; i < performanceMetrics.frameProcessingTimes.length; i++) {
                sum += performanceMetrics.frameProcessingTimes[i];
            }
            avgProcessingTime = sum / performanceMetrics.frameProcessingTimes.length;
        }
        
        // Calculate frame processing rate
        var frameRate = 0;
        if (avgProcessingTime > 0) {
            frameRate = 1000 / avgProcessingTime;
        }
        
        // Get CPU optimizer metrics if available
        var cpuMetrics = {};
        if (cpuOptimizer && typeof cpuOptimizer.getMetrics === 'function') {
            try {
                cpuMetrics = cpuOptimizer.getMetrics();
            } catch (e) {
                console.error("Error getting CPU metrics: " + e.message);
            }
        }
        
        // Get memory optimizer metrics if available
        var memoryMetrics = {};
        if (memoryOptimizer && typeof memoryOptimizer.getMetrics === 'function') {
            try {
                memoryMetrics = memoryOptimizer.getMetrics();
            } catch (e) {
                console.error("Error getting memory metrics: " + e.message);
            }
        }
        
        // Combine all metrics
        var metrics = {
            // Core performance metrics
            averageProcessingTime: avgProcessingTime.toFixed(2) + " ms",
            frameRate: frameRate.toFixed(2) + " fps",
            skippedFrames: performanceMetrics.skippedFrames,
            totalFramesProcessed: performanceMetrics.totalFramesProcessed,
            memoryUsage: performanceMetrics.memoryUsage,
            pixelsProcessed: performanceMetrics.regionOfInterestStats.totalPixelsProcessed,
            pixelsSkipped: performanceMetrics.regionOfInterestStats.totalPixelsSkipped,
            pixelProcessingEfficiency: (
                performanceMetrics.regionOfInterestStats.totalPixelsSkipped /
                (performanceMetrics.regionOfInterestStats.totalPixelsProcessed + 
                 performanceMetrics.regionOfInterestStats.totalPixelsSkipped) * 100
            ).toFixed(2) + "%",
            lastGarbageCollection: performanceMetrics.lastGarbageCollection,
            
            // CPU metrics
            cpuThrottling: cpuMetrics.enabled || false,
            cpuThrottleLevel: cpuMetrics.currentThrottleLevel || 0,
            cpuThrottleName: cpuMetrics.throttleName || "None",
            targetFps: cpuMetrics.targetFps || 30,
            thermalManagement: cpuMetrics.thermalManagementEnabled || false,
            batteryOptimization: cpuMetrics.batteryOptimizationEnabled || false,
            temperature: cpuMetrics.temperature || 0,
            batteryLevel: cpuMetrics.batteryLevel || 0,
            
            // Memory metrics
            memoryManagement: memoryMetrics.enabled || false,
            autoGc: memoryMetrics.autoGcEnabled || false,
            currentMemory: memoryMetrics.currentMemory || 0,
            peakMemory: memoryMetrics.peakMemory || 0,
            cacheSize: memoryMetrics.cacheSize || 0,
            imageRecycling: memoryMetrics.imageRecyclingEnabled || false,
            leakDetection: memoryMetrics.leakDetectionEnabled || false
        };
        
        return metrics;
    },
    
    /**
     * Optimizes an image for faster processing
     * @param {Object} img - Image to optimize
     * @param {Object} config - Configuration settings (optional)
     * @return {Object} Optimized image
     */
    optimizeImage: function(img, config) {
        if (!img) {
            console.error("Cannot optimize null image");
            return null;
        }
        
        try {
            var startTime = Date.now();
            var optimized = img;
            
            // If config is not provided, use the global config if available
            var useConfig = config || (typeof global !== 'undefined' && global.config);
            
            // Apply CPU throttling if enabled
            if (cpuOptimizer && typeof cpuOptimizer.applyThrottling === 'function') {
                cpuOptimizer.applyThrottling();
            }
            
            // Apply optimizations based on config
            if (useConfig && useConfig.vision && useConfig.vision.performance && 
                useConfig.vision.performance.lowResolutionMode) {
                // Resize to lower resolution for faster processing
                var width = img.getWidth();
                var height = img.getHeight();
                var scaleFactor = 0.5; // 50% of original size
                
                // Create scaled down image
                optimized = images.scale(img, scaleFactor, scaleFactor);
                
                console.log("Reduced image resolution from " + width + "x" + height + 
                          " to " + optimized.getWidth() + "x" + optimized.getHeight());
                
                // Recycle original image to free memory using memory optimizer if available
                if (memoryOptimizer && typeof memoryOptimizer.recycleImage === 'function') {
                    memoryOptimizer.recycleImage(img);
                } else if (typeof img.recycle === 'function') {
                    img.recycle();
                }
            }
            
            // Record processing time
            this.recordFrameProcessingTime(Date.now() - startTime);
            
            // Record FPS for CPU optimizer
            if (cpuOptimizer && typeof cpuOptimizer.recordFps === 'function') {
                var processingTime = Date.now() - startTime;
                var fps = processingTime > 0 ? 1000 / processingTime : 60;
                cpuOptimizer.recordFps(fps);
            }
            
            return optimized;
        } catch (e) {
            console.error("Error optimizing image: " + e.message);
            return img; // Return original if optimization fails
        }
    },
    
    /**
     * Optimizes game state processing using ROI and other techniques
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration settings
     * @return {Object} Optimized game state
     */
    optimizeGameState: function(gameState, config) {
        if (!gameState) {
            return gameState;
        }
        
        try {
            var startTime = Date.now();
            
            // Apply ROI-based processing if enabled
            if (config && config.vision && config.vision.performance && config.vision.performance.regionOfInterest) {
                // Make sure ROIs are updated for current screen dimensions
                if (gameState.resolution && 
                    (gameState.resolution[0] !== regionOfInterest.obstacles.width || 
                     gameState.resolution[1] !== regionOfInterest.obstacles.height)) {
                    this.updateRegionsOfInterest(gameState.resolution[0], gameState.resolution[1], config);
                }
                
                // Process only relevant regions for each game element type
                // Filter game elements based on their regions of interest
                
                // Filter obstacles that are outside the ROI
                if (gameState.obstacles && gameState.obstacles.length > 0) {
                    gameState.obstacles = gameState.obstacles.filter(function(obstacle) {
                        return obstacle.y >= regionOfInterest.obstacles.y / gameState.resolution[1] && 
                               obstacle.y <= (regionOfInterest.obstacles.y + regionOfInterest.obstacles.height) / gameState.resolution[1];
                    });
                }
                
                // Filter coins that are outside the ROI
                if (gameState.coins && gameState.coins.length > 0) {
                    gameState.coins = gameState.coins.filter(function(coin) {
                        return coin.y >= regionOfInterest.coins.y / gameState.resolution[1] && 
                               coin.y <= (regionOfInterest.coins.y + regionOfInterest.coins.height) / gameState.resolution[1];
                    });
                }
                
                // Filter powerups that are outside the ROI
                if (gameState.powerups && gameState.powerups.length > 0) {
                    gameState.powerups = gameState.powerups.filter(function(powerup) {
                        return powerup.y >= regionOfInterest.powerups.y / gameState.resolution[1] && 
                               powerup.y <= (regionOfInterest.powerups.y + regionOfInterest.powerups.height) / gameState.resolution[1];
                    });
                }
            }
            
            // Record processing time
            this.recordFrameProcessingTime(Date.now() - startTime);
            
            return gameState;
        } catch (e) {
            console.error("Error optimizing game state: " + e.message);
            return gameState; // Return original if optimization fails
        }
    },
    

    
    /**
     * Gets the region of interest definitions
     * @return {Object} Current ROI definitions
     */
    getRegionsOfInterest: function() {
        return regionOfInterest;
    }
};

// Optimize click timing to match game's input window
module.exports = {
    optimizeClickTiming: function(config) {
        console.log("Optimizing click timing...");

        // Get current timing settings
        var currentTiming = config.gameplay.clickTiming || 100;

        // Optimize timing using the optimizer
        var optimizedTiming = clickTimingOptimizer.optimize(currentTiming);

        console.log("Optimized click timing: " + optimizedTiming + "ms");

        return optimizedTiming;
    },
}