// Enhanced touch detection variables
var lastTouchX = 0;
var lastTouchY = 0;
var touchStartTime = 0;
var lastActionTime = 0;
var gestureHistory = [];
var keyboardControlsActive = false;

// Base path for the emulator environment
var emulatorBasePath = "/storage/emulated/0/SubwayBot/";

// Import duplicate detector utility
var duplicateDetector = require('./utils/duplicate_detector.js');

module.exports = {
    /**
     * Detects code duplications in the project
     * @param {string} basePath - Base directory path to analyze
     * @param {Object} options - Optional configuration options
     * @return {Array} List of potential duplications
     */
    detectDuplicates: function(basePath, options) {
        console.log("Detecting code duplications in: " + basePath);
        
        try {
            // Initialize duplicate detector with custom options if provided
            if (options) {
                duplicateDetector.initialize(options);
            } else {
                duplicateDetector.initialize();
            }
            
            // Analyze directory for duplications
            var duplications = duplicateDetector.analyzeDirectory(basePath, true);
            
            // Generate report if duplications found
            if (duplications.length > 0) {
                var reportPath = basePath + "/duplicate_report.txt";
                duplicateDetector.saveReport(duplications, reportPath);
                console.log("Found " + duplications.length + " potential code duplications");
                console.log("Duplication report saved to: " + reportPath);
            } else {
                console.log("No code duplications detected");
            }
            
            return duplications;
        } catch (e) {
            console.error("Error detecting duplicates: " + e.message);
            return [];
        }
    },
    
    verifyAndUpdatePaths: function(config) {
        console.log("Verifying and updating paths for emulator environment...");
        
        // Define all possible Android storage paths to check
        var androidPaths = [
            "/sdcard/",                // Most common Android path
            "/storage/emulated/0/",    // Standard Android storage path
            "/mnt/sdcard/",            // Legacy Android path
            "/storage/sdcard0/",       // Alternative Android path
            "/storage/self/primary/"    // Another possible Android path
        ];
        
        // Check which paths exist and log results
        var validPaths = [];
        var pathResults = "Storage path check results:\n";
        
        for (var i = 0; i < androidPaths.length; i++) {
            var pathExists = files.exists(androidPaths[i]);
            pathResults += androidPaths[i] + ": " + pathExists + "\n";
            
            if (pathExists) {
                validPaths.push(androidPaths[i]);
            }
        }
        console.log(pathResults);
        
        // Try to write a test file to each valid path to verify write access
        var writablePaths = [];
        var testContent = "Path test: " + new Date().toString();
        
        for (var j = 0; j < validPaths.length; j++) {
            try {
                var testPath = validPaths[j] + "SubwayBot/";
                var testFile = testPath + "path_test.txt";
                
                // Try to create directory and write file
                files.createWithDirs(testPath);
                files.write(testFile, testContent);
                
                // Verify file was created
                if (files.exists(testFile)) {
                    writablePaths.push(validPaths[j]);
                    console.log("Write test successful at: " + testFile);
                    // Clean up test file
                    files.remove(testFile);
                }
            } catch (e) {
                console.log("Write test failed for " + validPaths[j] + ": " + e.message);
            }
        }
        
        // Determine the best base path to use (prioritize writable paths)
        var basePath = "";
        if (writablePaths.length > 0) {
            // Prefer /sdcard/ if it's writable, otherwise use first writable path
            if (writablePaths.indexOf("/sdcard/") >= 0) {
                basePath = "/sdcard/";
            } else {
                basePath = writablePaths[0];
            }
        } else if (validPaths.length > 0) {
            // If no writable paths but some paths exist, try using them anyway
            basePath = validPaths[0];
            console.warn("WARNING: No writable paths found, but trying to use: " + basePath);
        } else {
            console.error("CRITICAL: No valid storage paths found!");
            toast("CRITICAL: Storage access failed. Bot may not function properly.");
            // Keep the original paths, but log the issue
            return;
        }
        
        console.log("Selected base path: " + basePath);
        
        // Update config paths if needed
        if (!config.training.dataPath.startsWith(basePath)) {
            config.training.dataPath = basePath + "SubwayBot/data/";
            console.log("Updated data path to: " + config.training.dataPath);
        }
        
        if (!config.training.trainingPath.startsWith(basePath)) {
            config.training.trainingPath = basePath + "SubwayBot/training_data/";
            console.log("Updated training path to: " + config.training.trainingPath);
        }
        
        if (!config.training.screenshotPath.startsWith(basePath)) {
            config.training.screenshotPath = basePath + "SubwayBot/screenshots/";
            console.log("Updated screenshot path to: " + config.training.screenshotPath);
        }
        
        if (config.neuralNet && config.neuralNet.modelPath && 
            !config.neuralNet.modelPath.startsWith(basePath)) {
            config.neuralNet.modelPath = basePath + "SubwayBot/model/";
            console.log("Updated model path to: " + config.neuralNet.modelPath);
        }
    },
    
    ensureDirectory: function(path) {
        try {
            if (!path) {
                console.error("Invalid directory path: empty path");
                return false;
            }
            
            // Handle relative paths
            if (path.startsWith('./')) {
                // Convert to absolute path based on current working directory
                var currentDir = files.cwd();
                path = files.join(currentDir, path.substring(2));
                console.log("Converted relative path to: " + path);
            }
            
            // Ensure path ends with a slash (for Android paths)
            if (!path.endsWith('/') && !path.endsWith('\\')) {
                // In MEmu emulator, we should always use forward slash
                path += '/';
            }
            
            // Normalize path to use forward slashes (Android standard)
            path = path.replace(/\\/g, '/');
            
            console.log("Checking directory: " + path);
            
            if (!files.exists(path)) {
                console.log("Creating directory: " + path);
                
                try {
                    files.createWithDirs(path);
                    
                    // Verify directory was created
                    if (files.exists(path)) {
                        console.log("Directory created successfully: " + path);
                        return true;
                    }
                } catch (createError) {
                    console.error("Error in first attempt to create directory: " + createError.message);
                }
                
                // If we get here, the first attempt failed - try alternative paths
                console.error("Failed to create directory: " + path);
                
                // Define all possible Android storage paths to try
                var androidBasePaths = [
                    "/sdcard/",
                    "/storage/emulated/0/",
                    "/mnt/sdcard/",
                    "/storage/sdcard0/",
                    "/storage/self/primary/"
                ];
                
                // Extract the relative path (everything after the base path)
                var relativePath = "";
                for (var i = 0; i < androidBasePaths.length; i++) {
                    if (path.startsWith(androidBasePaths[i])) {
                        relativePath = path.substring(androidBasePaths[i].length);
                        break;
                    }
                }
                
                // If we couldn't extract a relative path, use the last part of the path
                if (!relativePath) {
                    relativePath = "SubwayBot/" + path.split('/').pop();
                }
                
                // Try creating the directory with each base path
                for (var j = 0; j < androidBasePaths.length; j++) {
                    // Skip the original base path that already failed
                    if (path.startsWith(androidBasePaths[j])) continue;
                    
                    var altPath = androidBasePaths[j] + relativePath;
                    console.log("Trying alternative path: " + altPath);
                    
                    try {
                        files.createWithDirs(altPath);
                        if (files.exists(altPath)) {
                            console.log("Created directory at alternative path: " + altPath);
                            return true;
                        }
                    } catch (altError) {
                        console.log("Failed with alternative path " + altPath + ": " + altError.message);
                    }
                }
                
                // As a last resort, try creating in the current directory
                try {
                    var localPath = "./SubwayBot/" + relativePath;
                    console.log("Trying local path: " + localPath);
                    files.createWithDirs(localPath);
                    if (files.exists(localPath)) {
                        console.log("Created directory at local path: " + localPath);
                        return true;
                    }
                } catch (localError) {
                    console.log("Failed with local path: " + localError.message);
                }
                
                console.error("All attempts to create directory failed");
                return false;
            } else {
                console.log("Directory already exists: " + path);
                return true;
            }
        } catch (e) {
            console.error("Error in ensureDirectory: " + e.message);
            return false;
        }
    },
    
    logToFile: function(message, config) {
        // Always log to console regardless of file write success
        console.log(message);
        
        // Use config path if available, otherwise fallback to default path
        var logFilePath;
        
        if (typeof config !== 'undefined' && config.training && config.training.dataPath) {
            // Use config path but ensure it ends with a slash or backslash
            var dataPath = config.training.dataPath;
            if (!dataPath.endsWith('/') && !dataPath.endsWith('\\')) {
                dataPath += dataPath.includes('\\') ? '\\' : '/';
            }
            // Store logs in the SubwayBot root directory
            if (dataPath.includes('data')) {
                logFilePath = dataPath.replace(/data[\/\\]$/, "logs.txt");
            } else {
                logFilePath = dataPath + "logs.txt";
            }
        } else {
            // Try to determine the best path for the current environment
            var currentDir = files.cwd();
            
            // First try to use a local path relative to the current directory
            logFilePath = files.join(currentDir, "SubwayBot", "logs.txt");
            
            // If we're in an emulator, use appropriate Android paths
            var androidPaths = ["/sdcard/", "/storage/emulated/0/", "/mnt/sdcard/"];
            for (var i = 0; i < androidPaths.length; i++) {
                if (files.exists(androidPaths[i])) {
                    logFilePath = androidPaths[i] + "SubwayBot/logs.txt";
                    break;
                }
            }
        }
            
        var timestamp = new Date().toISOString();
        var logMessage = "[" + timestamp + "] " + message + "\n";

        // Direct approach without nested setTimeout
        try {
            // Ensure directory exists - handle both forward and backslash paths
            var logDir;
            if (logFilePath.includes('/')) {
                logDir = logFilePath.substring(0, logFilePath.lastIndexOf('/'));
            } else if (logFilePath.includes('\\')) {
                logDir = logFilePath.substring(0, logFilePath.lastIndexOf('\\'));
            } else {
                // If no slashes found, use the current directory
                logDir = files.cwd();
            }
            
            if (!files.exists(logDir)) {
                files.createWithDirs(logDir);
            }
            
            // Write to log file
            files.append(logFilePath, logMessage);
            return true;
        } catch (e) {
            console.error("Failed to write to log file: " + e.message);
            // Try alternative location as fallback
            try {
                var altLogPath = "/sdcard/SubwayBot/logs_alt.txt";
                files.createWithDirs("/sdcard/SubwayBot/");
                files.append(altLogPath, logMessage);
                return true;
            } catch (e2) {
                console.error("All log write attempts failed: " + e2.message);
                return false;
            }
        }
    },

    isGameRunning: function(config) {
        try {
            var currentPkg = currentPackage();
            console.log("Current package: " + currentPkg);
            return currentPkg === config.memu.packageName;
        } catch (e) {
            console.error("Error checking if game is running: " + e.message);
            // Use a non-blocking approach as fallback
            return app.getAppName(config.memu.packageName) != null;
        }
    },
    
    waitForGameLoad: function() {
        console.log("Waiting for game to load...");
        var timeout = 10; // seconds
        var startTime = Date.now();
        
        while (Date.now() - startTime < timeout * 1000) {
            // Check for loading screen completion
            if (text("PLAY").exists() || textContains("SCORE").exists()) {
                console.log("Game loaded successfully");
                return true;
            }
            
            // Click on any "close" or "x" buttons that might appear during loading
            if (text("x").exists() || text("X").exists() || text("close").exists()) {
                console.log("Closing startup popup");
                if (text("x").exists()) click(text("x").findOne().bounds().centerX(), text("").findOne().bounds().centerY());
                if (text("X").exists()) click(text("X").findOne().bounds().centerX(), text("X").findOne().bounds().centerY());
                if (text("close").exists()) click(text("close").findOne().bounds().centerX(), text("close").findOne().bounds().centerY());
            }
            
            sleep(500);
        }
        
        console.log("Game load timed out");
        return false;
    },

    showTrainingOverlay: function() {
        console.log("Showing training overlay...");
        toast("TRAINING MODE ACTIVE - Use keyboard (WASD) to record actions");
        
        // Reminder to use keyboard
        this.setupKeyboardControls();
        
        // Periodic reminder
        setInterval(function() {
            toast("Training mode: W=Jump, S=Roll, A=Left, D=Right");
        }, 30000);
    },
    
    detectUserAction: function() {
        // Manual detection through key presses
        // This is a fallback and should be triggered by key events
        
        // Check gesture history for recent actions
        if (gestureHistory.length > 0) {
            var action = gestureHistory.shift();
            return action;
        }
        
        return null;
    },
    
    captureGameState: function() {
        var img = null;
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            var state = {
                lanes: {
                    left: this.detectObstaclesInLane(img, 0.2, width, height),
                    center: this.detectObstaclesInLane(img, 0.5, width, height),
                    right: this.detectObstaclesInLane(img, 0.8, width, height)
                },
                timestamp: Date.now()
            };
            
            return state;
        } catch (e) {
            console.error("Error capturing game state: " + e.message);
            return this.getEmptyGameState();
        } finally {
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {
                    console.error("Error recycling image: " + e.message);
                }
            }
        }
    },
    
    detectObstaclesInLane: function(img, xPosition, width, height) {
        // Simplified obstacle detection
        return { hasObstacle: false };
    },
    
    getEmptyGameState: function() {
        return {
            lanes: {
                left: { hasObstacle: false },
                center: { hasObstacle: false },
                right: { hasObstacle: false }
            },
            timestamp: Date.now()
        };
    },
    
    saveTrainingDataWithVerification: function(gameState, action, config) {
        var timestamp = Date.now();
        var img = null;
        var self = this;
        
        // Get paths from config if available, otherwise use defaults
        var trainingPath = "";
        var screenshotBasePath = "";
        
        if (typeof config !== 'undefined' && config.training) {
            // Ensure paths end with a slash or backslash depending on OS
            if (config.training.trainingPath) {
                trainingPath = config.training.trainingPath;
                // Handle both Windows and Android paths
                if (!trainingPath.endsWith('/') && !trainingPath.endsWith('\\')) {
                    trainingPath += '/';
                }
            } else {
                // Default path - will be updated in ensureDirectory if needed
                trainingPath = "./SubwayBot/training_data/";
            }
            
            if (config.training.screenshotPath) {
                screenshotBasePath = config.training.screenshotPath;
                // Handle both Windows and Android paths
                if (!screenshotBasePath.endsWith('/') && !screenshotBasePath.endsWith('\\')) {
                    screenshotBasePath += '/';
                }
            } else {
                // Default path - will be updated in ensureDirectory if needed
                screenshotBasePath = "./SubwayBot/screenshots/";
            }
        } else {
            // Default paths - will be updated in ensureDirectory if needed
            trainingPath = "./SubwayBot/training_data/";
            screenshotBasePath = "./SubwayBot/screenshots/";
        }
        
        // Log the action attempt before trying to save
        console.log("Attempting to save training data for action: " + action);
        
        // Capture screenshot immediately to avoid delay
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screenshot for training data");
                self.logToFile("ERROR: Failed to capture screenshot for training data", config);
                return;
            }
        } catch (e) {
            console.error("Error capturing screenshot: " + e.message);
            self.logToFile("ERROR: Failed to capture screenshot: " + e.message, config);
            return;
        }
        
        // Use a promise-based approach for better async handling
        var ensureDirectoriesPromise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                try {
                    var dir1 = self.ensureDirectory(trainingPath);
                    var dir2 = self.ensureDirectory(screenshotBasePath);
                    if (dir1 && dir2) {
                        resolve();
                    } else {
                        // Try alternative paths if primary paths fail
                        var altTrainingPath = "/sdcard/SubwayBot/training_data/";
                        var altScreenshotPath = "/sdcard/SubwayBot/screenshots/";
                        
                        var altDir1 = self.ensureDirectory(altTrainingPath);
                        var altDir2 = self.ensureDirectory(altScreenshotPath);
                        
                        if (altDir1 && altDir2) {
                            trainingPath = altTrainingPath;
                            screenshotBasePath = altScreenshotPath;
                            resolve();
                        } else {
                            reject("Failed to create required directories");
                        }
                    }
                } catch (e) {
                    reject("Error ensuring directories: " + e.message);
                }
            }, 0);
        });
        
        ensureDirectoriesPromise.then(function() {
            // Save screenshot with verification
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    var screenshotPath = trainingPath + timestamp + ".png";
                    try {
                        images.save(img, screenshotPath);
                        if (files.exists(screenshotPath)) {
                            console.log("Screenshot saved and verified at: " + screenshotPath);
                            resolve(screenshotPath);
                        } else {
                            // Try alternative method if primary method fails
                            var altPath = trainingPath + timestamp + "_alt.png";
                            files.writeBytes(altPath, images.toBytes(img));
                            if (files.exists(altPath)) {
                                console.log("Screenshot saved with alternative method: " + altPath);
                                resolve(altPath);
                            } else {
                                reject("Failed to save screenshot using both methods");
                            }
                        }
                    } catch (e) {
                        console.error("Error saving screenshot: " + e.message);
                        // Try alternative method
                        try {
                            var altPath = trainingPath + timestamp + "_alt.png";
                            files.writeBytes(altPath, images.toBytes(img));
                            if (files.exists(altPath)) {
                                console.log("Screenshot saved with alternative method: " + altPath);
                                resolve(altPath);
                            } else {
                                reject("Failed to save screenshot: " + e.message);
                            }
                        } catch (e2) {
                            reject("All screenshot save attempts failed: " + e2.message);
                        }
                    } finally {
                        // Clean up image resource to prevent memory leaks
                        if (img && img.recycle) {
                            try { img.recycle(); } catch (e) { /* Ignore recycling errors */ }
                        }
                    }
                }, 0);
            });
        }).then(function(screenshotPath) {
            // Save JSON data with verification
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    var jsonPath = trainingPath + timestamp + ".json";
                    try {
                        var data = {
                            timestamp: timestamp,
                            action: action,
                            gameState: gameState,
                            screenshotPath: screenshotPath
                        };
                        
                        files.write(jsonPath, JSON.stringify(data, null, 2));
                        if (files.exists(jsonPath)) {
                            console.log("Training data saved and verified at: " + jsonPath);
                            resolve(true);
                        } else {
                            // Try alternative location
                            var altJsonPath = screenshotBasePath + timestamp + ".json";
                            files.write(altJsonPath, JSON.stringify(data, null, 2));
                            if (files.exists(altJsonPath)) {
                                console.log("JSON saved to alternate location: " + altJsonPath);
                                resolve(true);
                            } else {
                                reject("Failed to save JSON data to both primary and alternate locations");
                            }
                        }
                    } catch (e) {
                        console.error("Error saving JSON data: " + e.message);
                        // Try alternate location
                        try {
                            var altJsonPath = screenshotBasePath + timestamp + ".json";
                            files.write(altJsonPath, JSON.stringify(data, null, 2));
                            if (files.exists(altJsonPath)) {
                                console.log("JSON saved to alternate location: " + altJsonPath);
                                resolve(true);
                            } else {
                                reject("All JSON save attempts failed");
                            }
                        } catch (e2) {
                            reject("All JSON save attempts failed: " + e2.message);
                        }
                    }
                }, 0);
            });
        }).then(function() {
            // Update stats and log success
            console.log("Successfully saved training sample #" + (gestureHistory.length + 1));
            toast("Saved training data: " + action);
            gestureHistory.push(action);
            self.logToFile("Saved training data for action: " + action, config);
        }).catch(function(error) {
            console.error("Error saving training data: " + error);
        });
    },

    executeAction: function(action, config) {
        var width = device.width;
        var height = device.height;

        console.log("Executing action: " + action);

        switch (action) {
            case 'left':
                swipe(width * 0.8, height * 0.8, width * 0.2, height * 0.8, config.gameplay.swipeDuration);
                break;
            case 'right':
                swipe(width * 0.2, height * 0.8, width * 0.8, height * 0.8, config.gameplay.swipeDuration);
                break;
            case 'center':
                // Do nothing, stay in center
                break;
            case 'jump':
                swipe(width / 2, height * 0.8, width / 2, height * 0.2, config.gameplay.swipeDuration);
                break;
            case 'roll':
                swipe(width / 2, height * 0.2, width / 2, height * 0.8, config.gameplay.swipeDuration);
                break;
            case 'hoverboard':
                // Double tap center of screen
                click(width / 2, height * 0.8);
                sleep(50);
                click(width / 2, height * 0.8);
                break;
            default:
                console.error("Unknown action: " + action);
                break;
        }
    },

    collectTrainingData: function(state, action, config) {
        this.saveTrainingDataWithVerification(state, action, config);
    },

    recover: function(config) {
        console.log("Recovering from error...");
        
        // Check if game crashed
        if (!this.isGameRunning(config)) {
            console.log("Game not running, restarting...");
            app.launchPackage(config.memu.packageName);
            this.waitForGameLoad();
            return;
        }
        
        // Try handling different UI screens
        var screenType = this.detectGameScreen();
        if (screenType !== "gameplay") {
            console.log("Detected non-gameplay screen during recovery: " + screenType);
            // Try to return to gameplay
            back();
            sleep(1000);
            
            // If back doesn't work, try clicking center of screen
            click(device.width / 2, device.height / 2);
            sleep(1000);
        }
    },
    
    detectGameScreen: function() {
        try {
            // Enhanced screen detection with more text options and better error handling
            if (textContains("SCORE").exists() || textContains("COINS").exists() || 
                textContains("PUNTEGGIO").exists() || textContains("MONETE").exists()) {
                return "gameplay";
            } else if (text("PLAY").exists() || text("GIOCA").exists() || 
                      text("START").exists() || text("JUGAR").exists()) {
                return "main_menu";
            } else if (textContains("GAME OVER").exists() || textContains("REVIVE").exists() || 
                       textContains("TRY AGAIN").exists() || textContains("RIPROVA").exists()) {
                return "game_over";
            } else if (textContains("SHOP").exists() || textContains("STORE").exists() || 
                       textContains("NEGOZIO").exists()) {
                return "shop";
            } else if (textContains("MISSIONS").exists() || textContains("MISSIONI").exists()) {
                return "missions";
            } else {
                // Try to detect any Subway Surfers UI elements
                if (textContains("SUBWAY").exists() || textContains("SURFERS").exists()) {
                    return "subway_menu";
                }
                return "unknown";
            }
        } catch (e) {
            console.error("Error in detectGameScreen: " + e.message);
            return "unknown";
        }
    },
    
    // Advanced obstacle detection implementation
    detectObstaclesAndCoins: function(img, width, height) {
        try {
            // Define common colors for obstacles (usually red or dark colors)
            var obstacleColors = ["#FF0000", "#AA0000", "#880000"];
            
            // Define common colors for coins (usually yellow/gold)
            var coinColors = ["#FFD700", "#FFFF00", "#FFC125"];
            
            // Set up detection regions (3 lanes, look ahead of player)
            var lanePositions = [0.2, 0.5, 0.8]; // left, center, right
            var lookAheadY = height * 0.4; // Position ahead of player
            var laneWidth = width * 0.3;
            var scanHeight = height * 0.3;
            
            var results = {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            };
            
            // Scan each lane for obstacles and coins
            for (var i = 0; i < lanePositions.length; i++) {
                var laneX = Math.floor(width * lanePositions[i] - laneWidth / 2);
                var lane = i === 0 ? "left" : (i === 1 ? "center" : "right");
                
                // Scan for obstacles
                for (var j = 0; j < obstacleColors.length; j++) {
                    var obstacleFound = this.findColorInRegion(
                        img, 
                        obstacleColors[j], 
                        [laneX, lookAheadY, laneWidth, scanHeight], 
                        30
                    );
                    
                    if (obstacleFound) {
                        results[lane].obstacles = true;
                        break;
                    }
                }
                
                // Scan for coins
                for (var k = 0; k < coinColors.length; k++) {
                    var coinFound = this.findColorInRegion(
                        img, 
                        coinColors[k], 
                        [laneX, lookAheadY, laneWidth, scanHeight], 
                        30
                    );
                    
                    if (coinFound) {
                        results[lane].coins = true;
                        break;
                    }
                }
            }
            
            return results;
        } catch (e) {
            console.error("Error in advanced detection: " + e.message);
            return {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            };
        }
    },
    
    findColorInRegion: function(img, color, region, threshold) {
        try {
            var point = images.findColor(img, color, {
                region: region,
                threshold: threshold
            });
            return point !== null;
        } catch (e) {
            console.error("Error finding color: " + e.message);
            return false;
        }
    },
    
    saveTrainingData: function(gameState, action, config) {
        // Simplified version that calls the verification method
        this.saveTrainingDataWithVerification(gameState, action, config);
    }
};