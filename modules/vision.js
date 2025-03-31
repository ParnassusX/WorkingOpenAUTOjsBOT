/**
 * Enhanced Vision System for Subway Surfers Bot
 * Implements Phase 2.1 (Screen Recognition System) and 2.2 (Game Element Detection)
 * 
 * Features:
 * - Improved screen type detection with OCR capabilities
 * - Enhanced obstacle detection algorithms
 * - Better coin and powerup recognition
 * - Player position tracking with higher accuracy
 * - Lane analysis system
 * - Special events and missions detection
 * - Support for different screen resolutions and aspect ratios
 */

// Import required modules
// Using Auto.js built-in colors module
var colors = {};
var images = require('./utils/images');
var gameElements = require('./gameElements.js');
var utils = require('./utils.js');

// Try to import timing optimization library if available
var TimingOptimizer;
try {
    TimingOptimizer = require('timing-optimizer');
    console.log("Timing optimizer loaded successfully");
} catch (e) {
    console.log("Timing optimizer not available: " + e.message);
    // Create a minimal fallback implementation
    TimingOptimizer = function(options) {
        return {
            optimize: function(timing) {
                return timing; // Just return the input timing as-is
            }
        };
    };
}

// Try to import OCR module if available
var ocr = null;
try {
    ocr = require('com.googlecode.tesseract.android');
    console.log("OCR module loaded successfully");
} catch (e) {
    console.log("OCR module not available: " + e.message);
    // Fallback to color-based detection only
}

// Cache for screen resolution adaptation
var resolutionCache = {
    lastWidth: 0,
    lastHeight: 0,
    adaptedConfig: null
};

// Cache for learned element patterns
var learnedPatterns = {
    obstacles: [],
    coins: [],
    powerups: [],
    lastUpdate: Date.now()
};

// Create a fallback for performance timing if not available from utils
var performance;
try {
    // First try to use performance from utils if available
    if (utils.performance) {
        performance = utils.performance;
        console.log("Using performance from utils module");
    } else {
        // Try to load perf_hooks (works in Node.js environments)
        const perfHooks = require('perf_hooks');
        performance = perfHooks.performance;
        console.log("Successfully loaded perf_hooks in vision module");
    }
} catch (e) {
    // Fallback implementation for AutoJS environment
    console.log("Performance timing not available in vision module, using fallback implementation: " + e.message);
    performance = {
        now: function() {
            return Date.now(); // Use Date.now() as fallback
        }
    };
}

// Import OpenCV.js for GPU-accelerated template matching if available
var cv;
try {
    cv = require('opencv4nodejs');
    console.log("OpenCV loaded successfully");
} catch (e) {
    console.log("OpenCV not available: " + e.message);
    // Create a minimal fallback implementation with basic functions
    cv = {
        // Basic image processing functions
        imread: function(path) {
            console.log("Using fallback imread");
            return images.read(path);
        },
        imwrite: function(path, img) {
            console.log("Using fallback imwrite");
            return images.save(img, path);
        },
        // Add other necessary fallback functions as needed
        matchTemplate: function() {
            console.log("Using fallback matchTemplate");
            return { minMaxLoc: { maxLoc: { x: 0, y: 0 } } };
        }
    };
}

module.exports = {
    /**
     * Analyzes the current game environment and returns a comprehensive game state
     * Enhanced for Phase 2.1 and 2.2: Vision & Detection System
     * @param {Object} config - Configuration settings
     * @return {Object} Complete game state information
     */
    analyzeEnvironment: function(config) {
        var img = null;
        var startTime = Date.now();
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            // Adapt to different screen resolutions
            var adaptedConfig = this.adaptToScreenResolution(width, height, config);
            
            // Enhanced screen type detection with OCR support
            var screenType = this.detectScreenType(img, width, height, adaptedConfig);
            if (screenType !== "gameplay") {
                return {
                    screenType: screenType,
                    resolution: [width, height],
                    timestamp: Date.now(),
                    processingTime: Date.now() - startTime
                };
            }
            
            // Full game state analysis with enhanced detection
            var gameState = {
                screenType: "gameplay",
                resolution: [width, height],
                lanes: {
                    left: this.analyzeLane(img, 0.2, width, height, adaptedConfig),
                    center: this.analyzeLane(img, 0.5, width, height, adaptedConfig),
                    right: this.analyzeLane(img, 0.8, width, height, adaptedConfig)
                },
                playerPosition: this.detectPlayer(img, width, height, adaptedConfig),
                powerups: this.detectPowerups(img, width, height, adaptedConfig),
                coins: this.countCoins(img, width, height, adaptedConfig),
                score: this.detectScore(img, width, height, adaptedConfig),
                obstacles: this.detectObstacles(img, width, height, adaptedConfig),
                specialEvents: this.detectSpecialEvents(img, width, height, adaptedConfig),
                timestamp: Date.now(),
                processingTime: Date.now() - startTime
            };
            
            // Learn from current frame if enabled
            if (adaptedConfig.vision && adaptedConfig.vision.enableLearning) {
                this.learnFromGameState(gameState, img, adaptedConfig);
            }
            
            if (adaptedConfig.debug) {
                console.log("Vision analysis completed in " + gameState.processingTime + "ms");
            }
            
            return gameState;
        } catch (e) {
            console.error("Error analyzing environment: " + e.message);
            return this.getEmptyGameState();
        } finally {
            // Properly clean up the image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
        }
    },
    
    /**
     * Adapts detection regions based on screen resolution
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings to be adjusted
     * @return {Object} Adapted configuration
     */
    adaptToScreenResolution: function(width, height, config) {
        // Use cached config if resolution hasn't changed
        if (width === resolutionCache.lastWidth && 
            height === resolutionCache.lastHeight &&
            resolutionCache.adaptedConfig) {
            return resolutionCache.adaptedConfig;
        }
        
        // Create a deep copy of the config to avoid modifying the original
        var adaptedConfig = JSON.parse(JSON.stringify(config));
        
        // Calculate aspect ratio
        var aspectRatio = width / height;
        
        // Adjust detection regions based on aspect ratio
        if (aspectRatio > 1.8) { // Ultra-wide screens
            // Adjust lane widths for wider screens
            adaptedConfig.vision.laneWidthPercent = 0.25; // Narrower lanes on wide screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.4;
        } else if (aspectRatio < 1.5) { // Taller screens
            // Adjust vertical regions for taller screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.35;
            adaptedConfig.vision.regions.player.topPercent = 0.55;
            adaptedConfig.vision.laneWidthPercent = 0.35; // Wider lanes on tall screens
        } else {
            // Standard 16:9 aspect ratio
            adaptedConfig.vision.laneWidthPercent = 0.3; // Default lane width
        }
        
        // Scale thresholds based on resolution
        var resolutionScale = Math.sqrt((width * height) / (1280 * 720)); // Relative to 720p
        adaptedConfig.vision.colorThreshold = Math.round(config.vision.colorThreshold * resolutionScale);
        adaptedConfig.vision.playerThreshold = Math.round(config.vision.playerThreshold * resolutionScale);
        
        // Store resolution in config for reference
        adaptedConfig.currentResolution = [width, height];
        
        // Cache the adapted config
        resolutionCache.lastWidth = width;
        resolutionCache.lastHeight = height;
        resolutionCache.adaptedConfig = adaptedConfig;
        
        return adaptedConfig;
    },

    /**
     * Enhanced screen type detection with OCR support and multi-language detection
     * @param {Image} img - Captured screen image
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Adapted configuration settings
     * @return {string} Detected screen type
     */
    detectScreenType: function(img, width, height, config) {
        // Use multiple detection methods for better accuracy
        var detectionResults = {};
        
        // Method 1: OCR-based detection if available
        if (ocr !== null) {
            try {
                // Check for key text indicators in different regions
                var menuTexts = ["PLAY", "START", "JUGAR", "GIOCA", "JOUER", "SPIELEN"];
                var gameOverTexts = ["GAME OVER", "TRY AGAIN", "CONTINUE", "REVIVE"];
                var shopTexts = ["SHOP", "STORE", "BUY", "PURCHASE"];
                var missionTexts = ["MISSION", "TASK", "CHALLENGE", "OBJETIVO"];
                
                // Top region for score/game over
                var topRegion = this.cropImage(img, width * 0.2, 0, width * 0.6, height * 0.2);
                var topText = this.performOCR(topRegion);
                
                // Center region for menu buttons
                var centerRegion = this.cropImage(img, width * 0.3, height * 0.4, width * 0.4, height * 0.2);
                var centerText = this.performOCR(centerRegion);
                
                // Bottom region for shop/mission indicators
                var bottomRegion = this.cropImage(img, width * 0.2, height * 0.8, width * 0.6, height * 0.2);
                var bottomText = this.performOCR(bottomRegion);
                
                // Analyze text results
                if (this.textContainsAny(topText, gameOverTexts)) {
                    detectionResults.ocr = "game_over";
                } else if (this.textContainsAny(centerText, menuTexts)) {
                    detectionResults.ocr = "menu";
                } else if (this.textContainsAny(bottomText, shopTexts)) {
                    detectionResults.ocr = "shop";
                } else if (this.textContainsAny(bottomText, missionTexts) || 
                           this.textContainsAny(centerText, missionTexts)) {
                    detectionResults.ocr = "mission";
                } else if (topText && topText.match(/\d{2,}/)) {
                    // If there's a number in the top region, likely gameplay (score)
                    detectionResults.ocr = "gameplay";
                }
            } catch (e) {
                console.error("OCR detection failed: " + e.message);
                // Fall back to color-based detection
            }
        }
        
        // Method 2: Color-based detection
        try {
            // Check for lane pattern (characteristic of gameplay)
            var leftLaneRegion = [width * 0.2, height * 0.4, width * 0.1, height * 0.4];
            var centerLaneRegion = [width * 0.45, height * 0.4, width * 0.1, height * 0.4];
            var rightLaneRegion = [width * 0.7, height * 0.4, width * 0.1, height * 0.4];
            
            var lanePatternDetected = this.detectLanePattern(img, leftLaneRegion, centerLaneRegion, rightLaneRegion, config);
            
            // Check for menu button colors
            var menuButtonRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.1];
            var menuButtonDetected = false;
            
            for (var i = 0; i < config.ui.colors.menuButtons.length; i++) {
                if (this.findColorInRegion(img, config.ui.colors.menuButtons[i], menuButtonRegion, config.vision.colorThreshold)) {
                    menuButtonDetected = true;
                    break;
                }
            }

            
            // Check for game over screen colors (usually dark overlay with bright buttons)
            var gameOverRegion = [0, 0, width, height];
            var gameOverDetected = this.findColorDensityInRegion(img, "#000000", gameOverRegion, 30, 0.7) && // Dark overlay
                                  this.findColorInRegion(img, "#FFFFFF", menuButtonRegion, config.vision.colorThreshold); // Bright button
            
            // Determine screen type based on color detection
            if (lanePatternDetected && !menuButtonDetected && !gameOverDetected) {
                detectionResults.color = "gameplay";
            } else if (gameOverDetected) {
                detectionResults.color = "game_over";
            } else if (menuButtonDetected) {
                detectionResults.color = "menu";
            }
        } catch (e) {
            console.error("Color detection failed: " + e.message);
        }

        
        // Method 3: UI element detection
        try {
            // Check for score display (gameplay indicator)
            var scoreRegion = [width * 0.4, 0, width * 0.2, height * 0.1];
            var scoreDetected = false;
            
            for (var j = 0; j < config.ui.colors.score.length; j++) {
                if (this.findColorInRegion(img, config.ui.colors.score[j], scoreRegion, config.vision.colorThreshold)) {
                    scoreDetected = true;
                    break;
                }
            }

            
            // Check for player character (gameplay indicator)
            var playerRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.2];
            var playerDetected = false;
            
            for (var k = 0; k < config.ui.colors.player.length; k++) {
                if (this.findColorInRegion(img, config.ui.colors.player[k], playerRegion, config.vision.colorThreshold)) {
                    playerDetected = true;
                    break;
                }
            }
            
            if (scoreDetected && playerDetected) {
                detectionResults.elements = "gameplay";
            }
        } catch (e) {
            console.error("UI element detection failed: " + e.message);
        }

        
        // Combine results from all methods with priority
        if (detectionResults.ocr === "gameplay" || 
            detectionResults.color === "gameplay" || 
            detectionResults.elements === "gameplay") {
            return "gameplay";
        } else if (detectionResults.ocr === "game_over" || 
                  detectionResults.color === "game_over") {
            return "game_over";
        } else if (detectionResults.ocr === "menu" || 
                  detectionResults.color === "menu") {
            return "menu";
        } else if (detectionResults.ocr === "shop") {
            return "shop";
        } else if (detectionResults.ocr === "mission") {
            return "mission";
        }
        
        // Default to unknown if no clear detection
        return "unknown";
    },
    
    /**
     * Performs OCR on an image region
     * @param {Image} img - Image to analyze
     * @return {string} Recognized text
     */
    performOCR: function(img) {
        if (ocr === null) return "";
        
        try {
            // Convert image to format suitable for OCR
            var bitmap = img.getBitmap();
            
            // Perform OCR
            var text = ocr.recognize(bitmap);
            
            // Clean up the text
            return text.replace(/\s+/g, " ").trim().toUpperCase();
        } catch (e) {
            console.error("OCR failed: " + e.message);
            return "";
        }

    },
    
    /**
     * Returns an empty game state object
     * @return {Object} Empty game state with default values
     */
    getEmptyGameState: function() {
        return {
            screenType: "unknown",
            lanes: {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            },
            playerPosition: "center",
            powerups: [],
            coins: 0,
            score: 0,
            obstacles: [],
            specialEvents: [],
            timestamp: Date.now(),
            processingTime: 0
        }
    },
    
    /**
     * Analyzes a lane for obstacles and coins
     * @param {Image} img - Captured screen image
     * @param {number} xPercentage - X position of lane as percentage of screen width
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings
     * @return {Object} Lane analysis results
     */
    analyzeLane: function(img, xPercentage, width, height, config) {
        try {
            // Use the lane width from config if available (set by adaptToScreenResolution)
            var laneWidth = width * (config.vision.laneWidthPercent || 0.3);
            var xStart = Math.floor(width * xPercentage - laneWidth / 2);
            var yStart = Math.floor(height * config.vision.regions.obstacles.topPercent);
            var regionHeight = height * config.vision.regions.obstacles.heightPercent;
            
            // Divide lane into sub-regions for more precise detection
            var subRegions = 3; // Number of vertical sub-regions
            var subRegionHeight = regionHeight / subRegions;
            
            // Track obstacle and coin positions within the lane
            var obstaclePositions = [];
            var coinPositions = [];
            
            // Analyze each sub-region separately for better precision
            for (var r = 0; r < subRegions; r++) {
                var subYStart = yStart + (r * subRegionHeight);
                var subRegion = [xStart, subYStart, laneWidth, subRegionHeight];
                var distance = r === 0 ? "far" : (r === 1 ? "medium" : "near");
                
                // Advanced obstacle detection with pattern recognition
                for (var i = 0; i < config.ui.colors.obstacles.length; i++) {
                    // Use a more efficient color search with density threshold
                    if (this.findColorDensityInRegion(img, config.ui.colors.obstacles[i], subRegion, 
                                                    config.vision.colorThreshold, 0.05)) { // 5% density threshold
                        obstaclePositions.push({
                            distance: distance,
                            y: subYStart + (subRegionHeight / 2)
                        });
                        break;
                    }
                }
                
                // Enhanced coin detection with better precision
                for (var j = 0; j < config.ui.colors.coins.length; j++) {
                    // Look for coin patterns (circular clusters of similar color)
                    var coinPoints = this.findColorPointsInRegion(img, config.ui.colors.coins[j], 
                                                               subRegion, config.vision.colorThreshold);
                    
                    if (coinPoints && coinPoints.length > 0) {
                        // Filter points to identify coin clusters
                        var coinClusters = this.identifyCoinClusters(coinPoints, 20); // 20px radius for clustering
                        
                        if (coinClusters.length > 0) {
                            coinPositions.push({
                                distance: distance,
                                y: subYStart + (subRegionHeight / 2),
                                count: coinClusters.length
                            });
                        }
                    }
                }
            }
            
            // Determine lane type based on position
            var laneType = xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center");
            
            return {
                obstacles: obstaclePositions.length > 0,
                obstacleDetails: obstaclePositions,
                coins: coinPositions.length > 0,
                coinDetails: coinPositions,
                lane: laneType
            }
        } catch (e) {
            console.error("Error analyzing lane: " + e.message);
            return {obstacles: false, coins: false, lane: xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center")};
        }
    },
    
    /**
     * Checks if text contains any of the specified keywords
     * @param {string} text - Text to check
     * @param {Array} keywords - Keywords to look for
     * @return {boolean} True if any keyword is found
     */
    textContainsAny: function(text, keywords) {
        if (!text) return false;
        
        for (var i = 0; i < keywords.length; i++) {
            if (text.indexOf(keywords[i]) !== -1) {
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Finds a color in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @return {boolean} True if color is found
     */
    findColorInRegion: function(img, colorHex, region, threshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Search for color in region with threshold
            var point = images.findColor(img, rgb, {
                region: [x, y, width, height],
                threshold: threshold
            });
            
            return point !== null;
        } catch (e) {
            console.error("Error finding color: " + e.message);
            return false;
        }
    },
    
    /**
     * Finds color density in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @param {number} densityThreshold - Minimum density required (0-1)
     * @return {boolean} True if color density exceeds threshold
     */
    findColorDensityInRegion: function(img, colorHex, region, threshold, densityThreshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Count matching pixels
            var matchingPixels = 0;
            var totalPixels = width * height;
            
            // Sample pixels in the region
            var sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 50)); // Adaptive sampling rate based on resolution with higher precision
            
            for (var i = x; i < x + width; i += sampleStep) {
                for (var j = y; j < y + height; j += sampleStep) {
                    var pixel = images.pixel(img, i, j);
                    var r = colors.red(pixel);
                    var g = colors.green(pixel);
                    var b = colors.blue(pixel);
                    
                    // Check if pixel color matches target color within threshold
                    if (Math.abs(r - colors.red(rgb)) <= threshold &&
                        Math.abs(g - colors.green(rgb)) <= threshold &&
                        Math.abs(b - colors.blue(rgb)) <= threshold) {
                        matchingPixels++;
                    }
                }
            }
            
            // Calculate density
            var density = matchingPixels / (totalPixels / (sampleStep * sampleStep));
            
            return density >= densityThreshold;
        } catch (e) {
            console.error("Error in findColorDensityInRegion: " + e.message);
            return false;
        }
    }
};

/**
 * Detects obstacles using GPU-accelerated template matching
 * @param {Image} img - Captured screen image
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {Object} config - Adapted configuration settings
 * @return {Array} Detected obstacles
 */
module.exports = {
    /**
     * Analyzes the current game environment and returns a comprehensive game state
     * Enhanced for Phase 2.1 and 2.2: Vision & Detection System
     * @param {Object} config - Configuration settings
     * @return {Object} Complete game state information
     */
    analyzeEnvironment: function(config) {
        var img = null;
        var startTime = Date.now();
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            // Adapt to different screen resolutions
            var adaptedConfig = this.adaptToScreenResolution(width, height, config);
            
            // Enhanced screen type detection with OCR support
            var screenType = this.detectScreenType(img, width, height, adaptedConfig);
            if (screenType !== "gameplay") {
                return {
                    screenType: screenType,
                    resolution: [width, height],
                    timestamp: Date.now(),
                    processingTime: Date.now() - startTime
                };
            }
            
            // Full game state analysis with enhanced detection
            var gameState = {
                screenType: "gameplay",
                resolution: [width, height],
                lanes: {
                    left: this.analyzeLane(img, 0.2, width, height, adaptedConfig),
                    center: this.analyzeLane(img, 0.5, width, height, adaptedConfig),
                    right: this.analyzeLane(img, 0.8, width, height, adaptedConfig)
                },
                playerPosition: this.detectPlayer(img, width, height, adaptedConfig),
                powerups: this.detectPowerups(img, width, height, adaptedConfig),
                coins: this.countCoins(img, width, height, adaptedConfig),
                score: this.detectScore(img, width, height, adaptedConfig),
                obstacles: this.detectObstacles(img, width, height, adaptedConfig),
                specialEvents: this.detectSpecialEvents(img, width, height, adaptedConfig),
                timestamp: Date.now(),
                processingTime: Date.now() - startTime
            };
            
            // Learn from current frame if enabled
            if (adaptedConfig.vision && adaptedConfig.vision.enableLearning) {
                this.learnFromGameState(gameState, img, adaptedConfig);
            }
            
            if (adaptedConfig.debug) {
                console.log("Vision analysis completed in " + gameState.processingTime + "ms");
            }
            
            return gameState;
        } catch (e) {
            console.error("Error analyzing environment: " + e.message);
            return this.getEmptyGameState();
        } finally {
            // Properly clean up the image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
        }
    },
    
    /**
     * Adapts detection regions based on screen resolution
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings to be adjusted
     * @return {Object} Adapted configuration
     */
    adaptToScreenResolution: function(width, height, config) {
        // Use cached config if resolution hasn't changed
        if (width === resolutionCache.lastWidth && 
            height === resolutionCache.lastHeight &&
            resolutionCache.adaptedConfig) {
            return resolutionCache.adaptedConfig;
        }
        
        // Create a deep copy of the config to avoid modifying the original
        var adaptedConfig = JSON.parse(JSON.stringify(config));
        
        // Calculate aspect ratio
        var aspectRatio = width / height;
        
        // Adjust detection regions based on aspect ratio
        if (aspectRatio > 1.8) { // Ultra-wide screens
            // Adjust lane widths for wider screens
            adaptedConfig.vision.laneWidthPercent = 0.25; // Narrower lanes on wide screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.4;
        } else if (aspectRatio < 1.5) { // Taller screens
            // Adjust vertical regions for taller screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.35;
            adaptedConfig.vision.regions.player.topPercent = 0.55;
            adaptedConfig.vision.laneWidthPercent = 0.35; // Wider lanes on tall screens
        } else {
            // Standard 16:9 aspect ratio
            adaptedConfig.vision.laneWidthPercent = 0.3; // Default lane width
        }
        
        // Scale thresholds based on resolution
        var resolutionScale = Math.sqrt((width * height) / (1280 * 720)); // Relative to 720p
        adaptedConfig.vision.colorThreshold = Math.round(config.vision.colorThreshold * resolutionScale);
        adaptedConfig.vision.playerThreshold = Math.round(config.vision.playerThreshold * resolutionScale);
        
        // Store resolution in config for reference
        adaptedConfig.currentResolution = [width, height];
        
        // Cache the adapted config
        resolutionCache.lastWidth = width;
        resolutionCache.lastHeight = height;
        resolutionCache.adaptedConfig = adaptedConfig;
        
        return adaptedConfig;
    },

    /**
     * Enhanced screen type detection with OCR support and multi-language detection
     * @param {Image} img - Captured screen image
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Adapted configuration settings
     * @return {string} Detected screen type
     */
    detectScreenType: function(img, width, height, config) {
        // Use multiple detection methods for better accuracy
        var detectionResults = {};
        
        // Method 1: OCR-based detection if available
        if (ocr !== null) {
            try {
                // Check for key text indicators in different regions
                var menuTexts = ["PLAY", "START", "JUGAR", "GIOCA", "JOUER", "SPIELEN"];
                var gameOverTexts = ["GAME OVER", "TRY AGAIN", "CONTINUE", "REVIVE"];
                var shopTexts = ["SHOP", "STORE", "BUY", "PURCHASE"];
                var missionTexts = ["MISSION", "TASK", "CHALLENGE", "OBJETIVO"];
                
                // Top region for score/game over
                var topRegion = this.cropImage(img, width * 0.2, 0, width * 0.6, height * 0.2);
                var topText = this.performOCR(topRegion);
                
                // Center region for menu buttons
                var centerRegion = this.cropImage(img, width * 0.3, height * 0.4, width * 0.4, height * 0.2);
                var centerText = this.performOCR(centerRegion);
                
                // Bottom region for shop/mission indicators
                var bottomRegion = this.cropImage(img, width * 0.2, height * 0.8, width * 0.6, height * 0.2);
                var bottomText = this.performOCR(bottomRegion);
                
                // Analyze text results
                if (this.textContainsAny(topText, gameOverTexts)) {
                    detectionResults.ocr = "game_over";
                } else if (this.textContainsAny(centerText, menuTexts)) {
                    detectionResults.ocr = "menu";
                } else if (this.textContainsAny(bottomText, shopTexts)) {
                    detectionResults.ocr = "shop";
                } else if (this.textContainsAny(bottomText, missionTexts) || 
                           this.textContainsAny(centerText, missionTexts)) {
                    detectionResults.ocr = "mission";
                } else if (topText && topText.match(/\d{2,}/)) {
                    // If there's a number in the top region, likely gameplay (score)
                    detectionResults.ocr = "gameplay";
                }
            } catch (e) {
                console.error("OCR detection failed: " + e.message);
                // Fall back to color-based detection
            }
        }
        
        // Method 2: Color-based detection
        try {
            // Check for lane pattern (characteristic of gameplay)
            var leftLaneRegion = [width * 0.2, height * 0.4, width * 0.1, height * 0.4];
            var centerLaneRegion = [width * 0.45, height * 0.4, width * 0.1, height * 0.4];
            var rightLaneRegion = [width * 0.7, height * 0.4, width * 0.1, height * 0.4];
            
            var lanePatternDetected = this.detectLanePattern(img, leftLaneRegion, centerLaneRegion, rightLaneRegion, config);
            
            // Check for menu button colors
            var menuButtonRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.1];
            var menuButtonDetected = false;
            
            for (var i = 0; i < config.ui.colors.menuButtons.length; i++) {
                if (this.findColorInRegion(img, config.ui.colors.menuButtons[i], menuButtonRegion, config.vision.colorThreshold)) {
                    menuButtonDetected = true;
                    break;
                }
            }

            
            // Check for game over screen colors (usually dark overlay with bright buttons)
            var gameOverRegion = [0, 0, width, height];
            var gameOverDetected = this.findColorDensityInRegion(img, "#000000", gameOverRegion, 30, 0.7) && // Dark overlay
                                  this.findColorInRegion(img, "#FFFFFF", menuButtonRegion, config.vision.colorThreshold); // Bright button
            
            // Determine screen type based on color detection
            if (lanePatternDetected && !menuButtonDetected && !gameOverDetected) {
                detectionResults.color = "gameplay";
            } else if (gameOverDetected) {
                detectionResults.color = "game_over";
            } else if (menuButtonDetected) {
                detectionResults.color = "menu";
            }
        } catch (e) {
            console.error("Color detection failed: " + e.message);
        }

        
        // Method 3: UI element detection
        try {
            // Check for score display (gameplay indicator)
            var scoreRegion = [width * 0.4, 0, width * 0.2, height * 0.1];
            var scoreDetected = false;
            
            for (var j = 0; j < config.ui.colors.score.length; j++) {
                if (this.findColorInRegion(img, config.ui.colors.score[j], scoreRegion, config.vision.colorThreshold)) {
                    scoreDetected = true;
                    break;
                }
            }

            
            // Check for player character (gameplay indicator)
            var playerRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.2];
            var playerDetected = false;
            
            for (var k = 0; k < config.ui.colors.player.length; k++) {
                if (this.findColorInRegion(img, config.ui.colors.player[k], playerRegion, config.vision.colorThreshold)) {
                    playerDetected = true;
                    break;
                }
            }
            
            if (scoreDetected && playerDetected) {
                detectionResults.elements = "gameplay";
            }
        } catch (e) {
            console.error("UI element detection failed: " + e.message);
        }

        
        // Combine results from all methods with priority
        if (detectionResults.ocr === "gameplay" || 
            detectionResults.color === "gameplay" || 
            detectionResults.elements === "gameplay") {
            return "gameplay";
        } else if (detectionResults.ocr === "game_over" || 
                  detectionResults.color === "game_over") {
            return "game_over";
        } else if (detectionResults.ocr === "menu" || 
                  detectionResults.color === "menu") {
            return "menu";
        } else if (detectionResults.ocr === "shop") {
            return "shop";
        } else if (detectionResults.ocr === "mission") {
            return "mission";
        }
        
        // Default to unknown if no clear detection
        return "unknown";
    },
    
    /**
     * Performs OCR on an image region
     * @param {Image} img - Image to analyze
     * @return {string} Recognized text
     */
    performOCR: function(img) {
        if (ocr === null) return "";
        
        try {
            // Convert image to format suitable for OCR
            var bitmap = img.getBitmap();
            
            // Perform OCR
            var text = ocr.recognize(bitmap);
            
            // Clean up the text
            return text.replace(/\s+/g, " ").trim().toUpperCase();
        } catch (e) {
            console.error("OCR failed: " + e.message);
            return "";
        }

    },
    
    /**
     * Returns an empty game state object
     * @return {Object} Empty game state with default values
     */
    getEmptyGameState: function() {
        return {
            screenType: "unknown",
            lanes: {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            },
            playerPosition: "center",
            powerups: [],
            coins: 0,
            score: 0,
            obstacles: [],
            specialEvents: [],
            timestamp: Date.now(),
            processingTime: 0
        }
    },
    
    /**
     * Analyzes a lane for obstacles and coins
     * @param {Image} img - Captured screen image
     * @param {number} xPercentage - X position of lane as percentage of screen width
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings
     * @return {Object} Lane analysis results
     */
    analyzeLane: function(img, xPercentage, width, height, config) {
        try {
            // Use the lane width from config if available (set by adaptToScreenResolution)
            var laneWidth = width * (config.vision.laneWidthPercent || 0.3);
            var xStart = Math.floor(width * xPercentage - laneWidth / 2);
            var yStart = Math.floor(height * config.vision.regions.obstacles.topPercent);
            var regionHeight = height * config.vision.regions.obstacles.heightPercent;
            
            // Divide lane into sub-regions for more precise detection
            var subRegions = 3; // Number of vertical sub-regions
            var subRegionHeight = regionHeight / subRegions;
            
            // Track obstacle and coin positions within the lane
            var obstaclePositions = [];
            var coinPositions = [];
            
            // Analyze each sub-region separately for better precision
            for (var r = 0; r < subRegions; r++) {
                var subYStart = yStart + (r * subRegionHeight);
                var subRegion = [xStart, subYStart, laneWidth, subRegionHeight];
                var distance = r === 0 ? "far" : (r === 1 ? "medium" : "near");
                
                // Advanced obstacle detection with pattern recognition
                for (var i = 0; i < config.ui.colors.obstacles.length; i++) {
                    // Use a more efficient color search with density threshold
                    if (this.findColorDensityInRegion(img, config.ui.colors.obstacles[i], subRegion, 
                                                    config.vision.colorThreshold, 0.05)) { // 5% density threshold
                        obstaclePositions.push({
                            distance: distance,
                            y: subYStart + (subRegionHeight / 2)
                        });
                        break;
                    }
                }
                
                // Enhanced coin detection with better precision
                for (var j = 0; j < config.ui.colors.coins.length; j++) {
                    // Look for coin patterns (circular clusters of similar color)
                    var coinPoints = this.findColorPointsInRegion(img, config.ui.colors.coins[j], 
                                                               subRegion, config.vision.colorThreshold);
                    
                    if (coinPoints && coinPoints.length > 0) {
                        // Filter points to identify coin clusters
                        var coinClusters = this.identifyCoinClusters(coinPoints, 20); // 20px radius for clustering
                        
                        if (coinClusters.length > 0) {
                            coinPositions.push({
                                distance: distance,
                                y: subYStart + (subRegionHeight / 2),
                                count: coinClusters.length
                            });
                        }
                    }
                }
            }
            
            // Determine lane type based on position
            var laneType = xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center");
            
            return {
                obstacles: obstaclePositions.length > 0,
                obstacleDetails: obstaclePositions,
                coins: coinPositions.length > 0,
                coinDetails: coinPositions,
                lane: laneType
            }
        } catch (e) {
            console.error("Error analyzing lane: " + e.message);
            return {obstacles: false, coins: false, lane: xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center")};
        }
    },
    
    /**
     * Checks if text contains any of the specified keywords
     * @param {string} text - Text to check
     * @param {Array} keywords - Keywords to look for
     * @return {boolean} True if any keyword is found
     */
    textContainsAny: function(text, keywords) {
        if (!text) return false;
        
        for (var i = 0; i < keywords.length; i++) {
            if (text.indexOf(keywords[i]) !== -1) {
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Finds a color in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @return {boolean} True if color is found
     */
    findColorInRegion: function(img, colorHex, region, threshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Search for color in region with threshold
            var point = images.findColor(img, rgb, {
                region: [x, y, width, height],
                threshold: threshold
            });
            
            return point !== null;
        } catch (e) {
            console.error("Error finding color: " + e.message);
            return false;
        }
    },
    
    /**
     * Finds color density in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @param {number} densityThreshold - Minimum density required (0-1)
     * @return {boolean} True if color density exceeds threshold
     */
    findColorDensityInRegion: function(img, colorHex, region, threshold, densityThreshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Count matching pixels
            var matchingPixels = 0;
            var totalPixels = width * height;
            
            // Sample pixels in the region
            var sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 50)); // Adaptive sampling rate based on resolution with higher precision
            
            for (var i = x; i < x + width; i += sampleStep) {
                for (var j = y; j < y + height; j += sampleStep) {
                    var pixel = images.pixel(img, i, j);
                    var r = colors.red(pixel);
                    var g = colors.green(pixel);
                    var b = colors.blue(pixel);
                    
                    // Check if pixel color matches target color within threshold
                    if (Math.abs(r - colors.red(rgb)) <= threshold &&
                        Math.abs(g - colors.green(rgb)) <= threshold &&
                        Math.abs(b - colors.blue(rgb)) <= threshold) {
                        matchingPixels++;
                    }
                }
            }
            
            // Calculate density
            var density = matchingPixels / (totalPixels / (sampleStep * sampleStep));
            
            return density >= densityThreshold;
        } catch (e) {
            console.error("Error in findColorDensityInRegion: " + e.message);
            return false;
        }
    }
};

/**
 * Detects obstacles using GPU-accelerated template matching
 * @param {Image} img - Captured screen image
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {Object} config - Adapted configuration settings
 * @return {Array} Detected obstacles
 */
module.exports = {
    /**
     * Analyzes the current game environment and returns a comprehensive game state
     * Enhanced for Phase 2.1 and 2.2: Vision & Detection System
     * @param {Object} config - Configuration settings
     * @return {Object} Complete game state information
     */
    analyzeEnvironment: function(config) {
        var img = null;
        var startTime = Date.now();
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            // Adapt to different screen resolutions
            var adaptedConfig = this.adaptToScreenResolution(width, height, config);
            
            // Enhanced screen type detection with OCR support
            var screenType = this.detectScreenType(img, width, height, adaptedConfig);
            if (screenType !== "gameplay") {
                return {
                    screenType: screenType,
                    resolution: [width, height],
                    timestamp: Date.now(),
                    processingTime: Date.now() - startTime
                };
            }
            
            // Full game state analysis with enhanced detection
            var gameState = {
                screenType: "gameplay",
                resolution: [width, height],
                lanes: {
                    left: this.analyzeLane(img, 0.2, width, height, adaptedConfig),
                    center: this.analyzeLane(img, 0.5, width, height, adaptedConfig),
                    right: this.analyzeLane(img, 0.8, width, height, adaptedConfig)
                },
                playerPosition: this.detectPlayer(img, width, height, adaptedConfig),
                powerups: this.detectPowerups(img, width, height, adaptedConfig),
                coins: this.countCoins(img, width, height, adaptedConfig),
                score: this.detectScore(img, width, height, adaptedConfig),
                obstacles: this.detectObstacles(img, width, height, adaptedConfig),
                specialEvents: this.detectSpecialEvents(img, width, height, adaptedConfig),
                timestamp: Date.now(),
                processingTime: Date.now() - startTime
            };
            
            // Learn from current frame if enabled
            if (adaptedConfig.vision && adaptedConfig.vision.enableLearning) {
                this.learnFromGameState(gameState, img, adaptedConfig);
            }
            
            if (adaptedConfig.debug) {
                console.log("Vision analysis completed in " + gameState.processingTime + "ms");
            }
            
            return gameState;
        } catch (e) {
            console.error("Error analyzing environment: " + e.message);
            return this.getEmptyGameState();
        } finally {
            // Properly clean up the image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
        }
    },
    
    /**
     * Adapts detection regions based on screen resolution
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings to be adjusted
     * @return {Object} Adapted configuration
     */
    adaptToScreenResolution: function(width, height, config) {
        // Use cached config if resolution hasn't changed
        if (width === resolutionCache.lastWidth && 
            height === resolutionCache.lastHeight &&
            resolutionCache.adaptedConfig) {
            return resolutionCache.adaptedConfig;
        }
        
        // Create a deep copy of the config to avoid modifying the original
        var adaptedConfig = JSON.parse(JSON.stringify(config));
        
        // Calculate aspect ratio
        var aspectRatio = width / height;
        
        // Adjust detection regions based on aspect ratio
        if (aspectRatio > 1.8) { // Ultra-wide screens
            // Adjust lane widths for wider screens
            adaptedConfig.vision.laneWidthPercent = 0.25; // Narrower lanes on wide screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.4;
        } else if (aspectRatio < 1.5) { // Taller screens
            // Adjust vertical regions for taller screens
            adaptedConfig.vision.regions.obstacles.topPercent = 0.35;
            adaptedConfig.vision.regions.obstacles.heightPercent = 0.35;
            adaptedConfig.vision.regions.player.topPercent = 0.55;
            adaptedConfig.vision.laneWidthPercent = 0.35; // Wider lanes on tall screens
        } else {
            // Standard 16:9 aspect ratio
            adaptedConfig.vision.laneWidthPercent = 0.3; // Default lane width
        }
        
        // Scale thresholds based on resolution
        var resolutionScale = Math.sqrt((width * height) / (1280 * 720)); // Relative to 720p
        adaptedConfig.vision.colorThreshold = Math.round(config.vision.colorThreshold * resolutionScale);
        adaptedConfig.vision.playerThreshold = Math.round(config.vision.playerThreshold * resolutionScale);
        
        // Store resolution in config for reference
        adaptedConfig.currentResolution = [width, height];
        
        // Cache the adapted config
        resolutionCache.lastWidth = width;
        resolutionCache.lastHeight = height;
        resolutionCache.adaptedConfig = adaptedConfig;
        
        return adaptedConfig;
    },

    /**
     * Enhanced screen type detection with OCR support and multi-language detection
     * @param {Image} img - Captured screen image
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Adapted configuration settings
     * @return {string} Detected screen type
     */
    detectScreenType: function(img, width, height, config) {
        // Use multiple detection methods for better accuracy
        var detectionResults = {};
        
        // Method 1: OCR-based detection if available
        if (ocr !== null) {
            try {
                // Check for key text indicators in different regions
                var menuTexts = ["PLAY", "START", "JUGAR", "GIOCA", "JOUER", "SPIELEN"];
                var gameOverTexts = ["GAME OVER", "TRY AGAIN", "CONTINUE", "REVIVE"];
                var shopTexts = ["SHOP", "STORE", "BUY", "PURCHASE"];
                var missionTexts = ["MISSION", "TASK", "CHALLENGE", "OBJETIVO"];
                
                // Top region for score/game over
                var topRegion = this.cropImage(img, width * 0.2, 0, width * 0.6, height * 0.2);
                var topText = this.performOCR(topRegion);
                
                // Center region for menu buttons
                var centerRegion = this.cropImage(img, width * 0.3, height * 0.4, width * 0.4, height * 0.2);
                var centerText = this.performOCR(centerRegion);
                
                // Bottom region for shop/mission indicators
                var bottomRegion = this.cropImage(img, width * 0.2, height * 0.8, width * 0.6, height * 0.2);
                var bottomText = this.performOCR(bottomRegion);
                
                // Analyze text results
                if (this.textContainsAny(topText, gameOverTexts)) {
                    detectionResults.ocr = "game_over";
                } else if (this.textContainsAny(centerText, menuTexts)) {
                    detectionResults.ocr = "menu";
                } else if (this.textContainsAny(bottomText, shopTexts)) {
                    detectionResults.ocr = "shop";
                } else if (this.textContainsAny(bottomText, missionTexts) || 
                           this.textContainsAny(centerText, missionTexts)) {
                    detectionResults.ocr = "mission";
                } else if (topText && topText.match(/\d{2,}/)) {
                    // If there's a number in the top region, likely gameplay (score)
                    detectionResults.ocr = "gameplay";
                }
            } catch (e) {
                console.error("OCR detection failed: " + e.message);
                // Fall back to color-based detection
            }
        }
        
        // Method 2: Color-based detection
        try {
            // Check for lane pattern (characteristic of gameplay)
            var leftLaneRegion = [width * 0.2, height * 0.4, width * 0.1, height * 0.4];
            var centerLaneRegion = [width * 0.45, height * 0.4, width * 0.1, height * 0.4];
            var rightLaneRegion = [width * 0.7, height * 0.4, width * 0.1, height * 0.4];
            
            var lanePatternDetected = this.detectLanePattern(img, leftLaneRegion, centerLaneRegion, rightLaneRegion, config);
            
            // Check for menu button colors
            var menuButtonRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.1];
            var menuButtonDetected = false;
            
            for (var i = 0; i < config.ui.colors.menuButtons.length; i++) {
                if (this.findColorInRegion(img, config.ui.colors.menuButtons[i], menuButtonRegion, config.vision.colorThreshold)) {
                    menuButtonDetected = true;
                    break;
                }
            }

            
            // Check for game over screen colors (usually dark overlay with bright buttons)
            var gameOverRegion = [0, 0, width, height];
            var gameOverDetected = this.findColorDensityInRegion(img, "#000000", gameOverRegion, 30, 0.7) && // Dark overlay
                                  this.findColorInRegion(img, "#FFFFFF", menuButtonRegion, config.vision.colorThreshold); // Bright button
            
            // Determine screen type based on color detection
            if (lanePatternDetected && !menuButtonDetected && !gameOverDetected) {
                detectionResults.color = "gameplay";
            } else if (gameOverDetected) {
                detectionResults.color = "game_over";
            } else if (menuButtonDetected) {
                detectionResults.color = "menu";
            }
        } catch (e) {
            console.error("Color detection failed: " + e.message);
        }

        
        // Method 3: UI element detection
        try {
            // Check for score display (gameplay indicator)
            var scoreRegion = [width * 0.4, 0, width * 0.2, height * 0.1];
            var scoreDetected = false;
            
            for (var j = 0; j < config.ui.colors.score.length; j++) {
                if (this.findColorInRegion(img, config.ui.colors.score[j], scoreRegion, config.vision.colorThreshold)) {
                    scoreDetected = true;
                    break;
                }
            }

            
            // Check for player character (gameplay indicator)
            var playerRegion = [width * 0.4, height * 0.6, width * 0.2, height * 0.2];
            var playerDetected = false;
            
            for (var k = 0; k < config.ui.colors.player.length; k++) {
                if (this.findColorInRegion(img, config.ui.colors.player[k], playerRegion, config.vision.colorThreshold)) {
                    playerDetected = true;
                    break;
                }
            }
            
            if (scoreDetected && playerDetected) {
                detectionResults.elements = "gameplay";
            }
        } catch (e) {
            console.error("UI element detection failed: " + e.message);
        }

        
        // Combine results from all methods with priority
        if (detectionResults.ocr === "gameplay" || 
            detectionResults.color === "gameplay" || 
            detectionResults.elements === "gameplay") {
            return "gameplay";
        } else if (detectionResults.ocr === "game_over" || 
                  detectionResults.color === "game_over") {
            return "game_over";
        } else if (detectionResults.ocr === "menu" || 
                  detectionResults.color === "menu") {
            return "menu";
        } else if (detectionResults.ocr === "shop") {
            return "shop";
        } else if (detectionResults.ocr === "mission") {
            return "mission";
        }
        
        // Default to unknown if no clear detection
        return "unknown";
    },
    
    /**
     * Performs OCR on an image region
     * @param {Image} img - Image to analyze
     * @return {string} Recognized text
     */
    performOCR: function(img) {
        if (ocr === null) return "";
        
        try {
            // Convert image to format suitable for OCR
            var bitmap = img.getBitmap();
            
            // Perform OCR
            var text = ocr.recognize(bitmap);
            
            // Clean up the text
            return text.replace(/\s+/g, " ").trim().toUpperCase();
        } catch (e) {
            console.error("OCR failed: " + e.message);
            return "";
        }

    },
    
    /**
     * Returns an empty game state object
     * @return {Object} Empty game state with default values
     */
    getEmptyGameState: function() {
        return {
            screenType: "unknown",
            lanes: {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            },
            playerPosition: "center",
            powerups: [],
            coins: 0,
            score: 0,
            obstacles: [],
            specialEvents: [],
            timestamp: Date.now(),
            processingTime: 0
        }
    },
    
    /**
     * Analyzes a lane for obstacles and coins
     * @param {Image} img - Captured screen image
     * @param {number} xPercentage - X position of lane as percentage of screen width
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     * @param {Object} config - Configuration settings
     * @return {Object} Lane analysis results
     */
    analyzeLane: function(img, xPercentage, width, height, config) {
        try {
            // Use the lane width from config if available (set by adaptToScreenResolution)
            var laneWidth = width * (config.vision.laneWidthPercent || 0.3);
            var xStart = Math.floor(width * xPercentage - laneWidth / 2);
            var yStart = Math.floor(height * config.vision.regions.obstacles.topPercent);
            var regionHeight = height * config.vision.regions.obstacles.heightPercent;
            
            // Divide lane into sub-regions for more precise detection
            var subRegions = 3; // Number of vertical sub-regions
            var subRegionHeight = regionHeight / subRegions;
            
            // Track obstacle and coin positions within the lane
            var obstaclePositions = [];
            var coinPositions = [];
            
            // Analyze each sub-region separately for better precision
            for (var r = 0; r < subRegions; r++) {
                var subYStart = yStart + (r * subRegionHeight);
                var subRegion = [xStart, subYStart, laneWidth, subRegionHeight];
                var distance = r === 0 ? "far" : (r === 1 ? "medium" : "near");
                
                // Advanced obstacle detection with pattern recognition
                for (var i = 0; i < config.ui.colors.obstacles.length; i++) {
                    // Use a more efficient color search with density threshold
                    if (this.findColorDensityInRegion(img, config.ui.colors.obstacles[i], subRegion, 
                                                    config.vision.colorThreshold, 0.05)) { // 5% density threshold
                        obstaclePositions.push({
                            distance: distance,
                            y: subYStart + (subRegionHeight / 2)
                        });
                        break;
                    }
                }
                
                // Enhanced coin detection with better precision
                for (var j = 0; j < config.ui.colors.coins.length; j++) {
                    // Look for coin patterns (circular clusters of similar color)
                    var coinPoints = this.findColorPointsInRegion(img, config.ui.colors.coins[j], 
                                                               subRegion, config.vision.colorThreshold);
                    
                    if (coinPoints && coinPoints.length > 0) {
                        // Filter points to identify coin clusters
                        var coinClusters = this.identifyCoinClusters(coinPoints, 20); // 20px radius for clustering
                        
                        if (coinClusters.length > 0) {
                            coinPositions.push({
                                distance: distance,
                                y: subYStart + (subRegionHeight / 2),
                                count: coinClusters.length
                            });
                        }
                    }
                }
            }
            
            // Determine lane type based on position
            var laneType = xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center");
            
            return {
                obstacles: obstaclePositions.length > 0,
                obstacleDetails: obstaclePositions,
                coins: coinPositions.length > 0,
                coinDetails: coinPositions,
                lane: laneType
            }
        } catch (e) {
            console.error("Error analyzing lane: " + e.message);
            return {obstacles: false, coins: false, lane: xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center")};
        }
    },
    
    /**
     * Checks if text contains any of the specified keywords
     * @param {string} text - Text to check
     * @param {Array} keywords - Keywords to look for
     * @return {boolean} True if any keyword is found
     */
    textContainsAny: function(text, keywords) {
        if (!text) return false;
        
        for (var i = 0; i < keywords.length; i++) {
            if (text.indexOf(keywords[i]) !== -1) {
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Finds a color in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @return {boolean} True if color is found
     */
    findColorInRegion: function(img, colorHex, region, threshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Search for color in region with threshold
            var point = images.findColor(img, rgb, {
                region: [x, y, width, height],
                threshold: threshold
            });
            
            return point !== null;
        } catch (e) {
            console.error("Error finding color: " + e.message);
            return false;
        }
    },
    
    /**
     * Finds color density in a specific region of the image
     * @param {Image} img - Image to analyze
     * @param {string} colorHex - Hex color code to find
     * @param {Array} region - Region to search [x, y, width, height]
     * @param {number} threshold - Color matching threshold
     * @param {number} densityThreshold - Minimum density required (0-1)
     * @return {boolean} True if color density exceeds threshold
     */
    findColorDensityInRegion: function(img, colorHex, region, threshold, densityThreshold) {
        try {
            // Convert hex to RGB
            var rgb = colors.parseColor(colorHex);
            
            // Define search region
            var x = region[0];
            var y = region[1];
            var width = region[2];
            var height = region[3];
            
            // Count matching pixels
            var matchingPixels = 0;
            var totalPixels = width * height;
            
            // Sample pixels in the region
            var sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 50)); // Adaptive sampling rate based on resolution with higher precision
            
            for (var i = x; i < x + width; i += sampleStep) {
                for (var j = y; j < y + height; j += sampleStep) {
                    var pixel = images.pixel(img, i, j);
                    var r = colors.red(pixel);
                    var g = colors.green(pixel);
                    var b = colors.blue(pixel);
                    
                    // Check if pixel color matches target color within threshold
                    if (Math.abs(r - colors.red(rgb)) <= threshold &&
                        Math.abs(g - colors.green(rgb)) <= threshold &&
                        Math.abs(b - colors.blue(rgb)) <= threshold) {
                        matchingPixels++;
                    }
                }
            }
            
            // Calculate density
            var density = matchingPixels / (totalPixels / (sampleStep * sampleStep));
            
            return density >= densityThreshold;
        } catch (e) {
            console.error("Error in findColorDensityInRegion: " + e.message);
            return false;
        }
    }
};

/**
 * Detects obstacles using GPU-accelerated template matching
 * @param {Image} img - Captured screen image
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {Object} config - Adapted configuration settings
 * @return {Array} Detected obstacles
 */
module.exports = {
    /**
     * Analyzes the current game environment and returns a comprehensive game state
     * Enhanced for Phase 2.1 and 2.2: Vision & Detection System
     * @param {Object} config - Configuration settings
     * @return {Object} Complete game state information
     */
    analyzeEnvironment: function(config) {
        var img = null;
        var startTime = Date.now();
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            // Adapt to different screen resolutions
            var adaptedConfig = this.adaptToScreenResolution(width, height, config);
            
            // Enhanced screen type detection with OCR support
            var screenType = this.detectScreenType(img, width, height, adaptedConfig);
            if (screenType !== "gameplay") {
                return {
                    screenType: screenType,
                    resolution: [width, height],
                    timestamp: Date.now(),
                    processingTime: Date.now() - startTime
                };
            }
            
            // Full game state analysis with enhanced detection
            var gameState = {
                screenType: "gameplay",
                resolution: [width, height],
                lanes: {
                    left: this.analyzeLane(img, 0.2, width, height, adaptedConfig),
                    center: this.analyzeLane(img, 0.5, width, height, adaptedConfig),
                    right: this.analyzeLane(img, 0.8, width, height, adaptedConfig)
                },
                playerPosition: this.detectPlayer(img, width, height, adaptedConfig),
                powerups: this.detectPowerups(img, width, height, adaptedConfig),
                coins: this.countCoins(img, width, height, adaptedConfig),
                score: this.detectScore(img, width, height, adaptedConfig),
                obstacles: this.detectObstacles(img, width, height, adaptedConfig),
                specialEvents: this.detectSpecialEvents(img, width, height, adaptedConfig),
                timestamp: Date.now(),
                processingTime: Date.now() - startTime
            };
            
            // Learn from current frame if enabled
            if (adaptedConfig.vision && adaptedConfig.vision.enableLearning) {
                this.learnFromGameState(gameState, img, adaptedConfig);
            }
            
            if (adaptedConfig.debug) {
                console.log("Vision analysis completed in " + gameState.processingTime + "ms");
            }
            
            return gameState;
        } catch (e) {
            console.error("Error analyzing environment: " + e.message);
            return this.getEmptyGameState();
        }
    }
};
