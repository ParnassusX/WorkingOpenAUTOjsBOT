// Enhanced Subway Surfers Bot with Phase 2.1 and 2.2 Features
// Screen Recognition System and Game Element Detection

// Get the current script directory for proper module resolution
var currentDir = files.cwd();
console.log("Current directory: " + currentDir);

// Import all modules using absolute paths for reliable resolution
var config = require('/storage/emulated/0/SubwayBot/config.js');
var uiModule = require('/storage/emulated/0/SubwayBot/modules/ui.js');
var vision = require('/storage/emulated/0/SubwayBot/modules/vision.js');
var brain = require('/storage/emulated/0/SubwayBot/modules/brain.js');
var utils = require('/storage/emulated/0/SubwayBot/modules/utils.js');
var gameElements = require('/storage/emulated/0/SubwayBot/modules/gameElements.js');
var neuralNetwork = require('/storage/emulated/0/SubwayBot/modules/neural_network.js');
var reinforcementLearning = require('/storage/emulated/0/SubwayBot/modules/reinforcement_learning.js');
var controls = require('/storage/emulated/0/SubwayBot/modules/controls.js');
var performanceOptimization = require('/storage/emulated/0/SubwayBot/modules/performance_optimization.js');
var dataCollection = require('/storage/emulated/0/SubwayBot/modules/data_collection.js');
var trainingUI = require('/storage/emulated/0/SubwayBot/modules/training_ui.js');
var uiInteraction = require('/storage/emulated/0/SubwayBot/modules/ui_interaction.js');
var basicDecision = require('/storage/emulated/0/SubwayBot/modules/basic_decision.js');
var dataProcessing = require('/storage/emulated/0/SubwayBot/modules/data_processing.js');

// Import reliability modules (Phase 6.3)
var crashRecovery = require('/storage/emulated/0/SubwayBot/modules/reliability/crash_recovery.js');
var errorDetection = require('/storage/emulated/0/SubwayBot/modules/reliability/error_detection.js');
var performanceMonitor = require('/storage/emulated/0/SubwayBot/modules/reliability/performance_monitor.js');

// Alternative imports if above fails
try {
    if (typeof config === 'undefined') {
        console.log("Trying alternative import method...");
        config = require('/storage/emulated/0/SubwayBot/config.js');
        uiModule = require('/storage/emulated/0/SubwayBot/modules/ui.js');
        vision = require('/storage/emulated/0/SubwayBot/modules/vision.js');
        brain = require('/storage/emulated/0/SubwayBot/modules/brain.js');
        utils = require('/storage/emulated/0/SubwayBot/modules/utils.js');
        gameElements = require('/storage/emulated/0/SubwayBot/modules/gameElements.js');
        neuralNetwork = require('/storage/emulated/0/SubwayBot/modules/neural_network.js');
        reinforcementLearning = require('/storage/emulated/0/SubwayBot/modules/reinforcement_learning.js');
        controls = require('/storage/emulated/0/SubwayBot/modules/controls.js');
        performanceOptimization = require('/storage/emulated/0/SubwayBot/modules/performance_optimization.js');
        dataCollection = require('/storage/emulated/0/SubwayBot/modules/data_collection.js');
        trainingUI = require('/storage/emulated/0/SubwayBot/modules/training_ui.js');
        uiInteraction = require('/storage/emulated/0/SubwayBot/modules/ui_interaction.js');
        basicDecision = require('/storage/emulated/0/SubwayBot/modules/basic_decision.js');
        dataProcessing = require('/storage/emulated/0/SubwayBot/modules/data_processing.js');
    }
} catch (e) {
    console.error("Alternative import failed: " + e.message);
}

// Log successful imports
console.log("All modules imported successfully");

// Set up error handling
// Create a process polyfill since it's not available in AutoJS
var process = {};
process.on = function(event, callback) {
    if (event === 'uncaughtException') {
        // AutoJS has its own error handling mechanism
        console.log("Setting up custom error handler");
        try {
            // Use AutoJS's Thread.setUncaughtExceptionHandler if available
            if (typeof Thread !== 'undefined' && Thread.setUncaughtExceptionHandler) {
                Thread.setUncaughtExceptionHandler(function(thread, ex) {
                    console.error("Uncaught error: " + ex.message);
                    console.error(ex.stack);
                    callback(ex);
                });
            }
        } catch (err) {
            console.error("Could not set exception handler: " + err.message);
        }
    }
};

try {
    process.on('uncaughtException', function(e) {
        console.error("Uncaught error: " + e.message);
        console.error(e.stack);
    });
} catch (e) {
    console.error("Error setting up error handler: " + e.message);
}

// Show console for debugging
console.show();
console.log("Starting Subway Surfers Bot v2.2 with Enhanced Vision System...");

// Track current mode
var currentMode = config.training.manualMode ? "training" : "auto";

// Create a floating button for mode switching
function setupModeButton() {
    try {
        // Create floating window using AutoJS's UI builder instead of JSX
        var window = floaty.window(
            '<frame gravity="center">\n' +
            '    <button id="modeBtn" text="M" w="40" h="40" bg="#4CAF50"/>\n' +
            '</frame>'
        );
        
        window.setPosition(50, 150);
        window.modeBtn.click(() => {
            config.training.manualMode = !config.training.manualMode;
            currentMode = config.training.manualMode ? "training" : "auto";
            
            // Update button color
            var newColor = config.training.manualMode ? "#4CAF50" : "#2196F3";
            window.modeBtn.setBackgroundColor(colors.parseColor(newColor));
            
            toast("Mode switched to: " + currentMode.toUpperCase());
            
            // Restart the bot
            restart();
        });
    } catch (e) {
        console.error("Failed to create mode button: " + e.message);
    }
}

// Restart the bot
function restart() {
    console.log("Restarting bot in " + currentMode + " mode");
    if (currentMode === "training") {
        runTrainingMode();
    } else {
        runAutoPlayMode();
    }
}

// Initialize environment
function init() {
    try {
        utils.prepareEnvironment(config);
        
        // Check for code duplications if in debug mode
        if (config.debug) {
            console.log("Checking for code duplications...");
            utils.detectDuplicates(currentDir);
        }
        auto.waitFor();
        
        // Request screen capture permission
        if (!requestScreenCapture()) {
            console.log("Retrying screen capture permission...");
            sleep(1000);
            if (!requestScreenCapture()) {
                console.log("Failed to request screen capture. Exiting.");
                toast("Screen capture permission denied");
                exit();
            }
        }
        console.log("Screen capture enabled successfully!");
        
        // Create log file and verify write access
        utils.logToFile("Enhanced Bot started at " + new Date().toLocaleString());
        
        // Initialize modules using the new centralized function
        var installer = require('/storage/emulated/0/SubwayBot/modules/installer.js');
        installer.initialize(config);
        
        // Verify and request permissions if needed
        if (!installer.verifyPermissions(true)) {
            console.warn("Some permissions are missing. Bot may not function correctly.");
        }
        
        // Initialize all modules
        initializeAllModules();
        
        // Display bot information with AI capabilities
        var botVersion = "v2.5"; // Updated version with reliability modules
        var aiMode = config.reinforcementLearning.enabled ? "RL-AI" : 
                    (config.neuralNet.enabled ? "Neural-AI" : "Rule-Based");
        
        toast("Subway Surfers Bot " + botVersion + " - " + aiMode + " - " + 
              (config.training.manualMode ? "TRAINING MODE" : "AUTO-PLAY MODE"));
        
        console.log("Bot initialized with AI mode: " + aiMode);
    } catch (e) {
        console.error("Critical initialization error: " + e.message);
        toast("Bot initialization failed: " + e.message);
    }
}

// Initialize all modules in a centralized function
function initializeAllModules() {
    try {
        console.log("Initializing all modules...");
        
        // Initialize utility modules first
        utils.initialize(config);
        
        // Initialize vision system
        vision.initialize(config);
        
        // Initialize game elements detection
        gameElements.initialize(config);
        
        // Initialize controls
        controls.initialize(config);
        
        // Initialize UI module
        uiModule.initialize(config);
        
        // Initialize data collection for training
        dataCollection.initialize(config);
        
        // Initialize UI interaction
        uiInteraction.initialize(config);
        
        // Initialize basic decision system
        basicDecision.initialize(config);
        
        // Initialize data processing
        dataProcessing.initialize(config);
        
        // Initialize neural network if enabled
        if (config.neuralNet && config.neuralNet.enabled) {
            neuralNetwork.initialize(config);
        }
        
        // Initialize adaptive difficulty module
        var adaptiveDifficulty = require('/storage/emulated/0/SubwayBot/modules/adaptive_difficulty.js');
        adaptiveDifficulty.initialize(config);
        
        // Initialize reinforcement learning if enabled and integrate with adaptive difficulty
        if (config.reinforcementLearning && config.reinforcementLearning.enabled) {
            reinforcementLearning.initialize(config);
            // Connect reinforcement learning with adaptive difficulty
            global.adaptiveDifficultyModule = adaptiveDifficulty;
        }
        
        // Initialize performance optimization
        performanceOptimization.initialize(config);
        
        // Initialize reliability modules
        if (config.reliability && config.reliability.recovery && config.reliability.recovery.enabled) {
            console.log("Initializing crash recovery system...");
            crashRecovery.initialize(config);
            console.log("Crash recovery system initialized successfully");
        }
        
        if (config.reliability && config.reliability.errorDetection && config.reliability.errorDetection.enabled) {
            console.log("Initializing error detection system...");
            errorDetection.initialize(config, crashRecovery);
            console.log("Error detection system initialized successfully");
        }
        
        if (config.reliability && config.reliability.performanceMonitoring && config.reliability.performanceMonitoring.enabled) {
            console.log("Initializing performance monitoring system...");
            performanceMonitor.initialize(config);
            console.log("Performance monitoring system initialized successfully");
        }
        
        console.log("All modules initialized successfully");
        return true;
    } catch (e) {
        console.error("Error initializing modules: " + e.message);
        console.error(e.stack);
        return false;
    }
}

function runTrainingMode() {
    utils.logToFile("Starting in MANUAL TRAINING MODE - You control the game while bot records data");
    
    // Initialize training UI
    try {
        console.log("Initializing training mode UI...");
        trainingUI.initialize(config);
        trainingUI.setVisible(true);
        console.log("Training mode UI initialized successfully");
    } catch (e) {
        console.error("Failed to initialize training UI: " + e.message);
    }
    
    // Launch game if not running
    if (!utils.isGameRunning(config)) {
        utils.logToFile("Launching Subway Surfers...");
        uiModule.launchGame(config).then(function() {
            // Continue with training mode setup after game launches
            utils.setupKeyboardControls(config);
            toast("Training mode active. Use keyboard to play and record actions.");
        });
        return; // Exit this function call and let the promise handle the rest
    }
    
    // Setup keyboard controls
    utils.setupKeyboardControls(config);
    
    // Wait for user to start playing
    toast("Training mode active. Use keyboard to play and record actions.");
    
    // Main training loop
    while (currentMode === "training") {
        try {
            if (!utils.isGameRunning(config)) {
                utils.logToFile("Game closed. Exiting training mode.");
                break;
            }
            
            // Detect game screen type using enhanced vision system
            var img = captureScreen();
            var screenType = vision.detectScreenType(img, img.getWidth(), img.getHeight(), config);
            utils.logToFile("Current screen: " + screenType);
            
            // Clean up image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
            
            // Handle non-gameplay screens
            if (screenType !== "gameplay" && screenType !== "unknown") {
                uiModule.handleScreen(screenType, config);
                sleep(1000);
                continue;
            }
            
            // Apply performance optimizations to the game state analysis
            if (performanceOptimization.shouldProcessFrame(config)) {
                // Capture current game state
                var gameState = vision.analyzeEnvironment(config);
                
                // Capture screenshot for training data if in gameplay
                if (screenType === "gameplay") {
                    dataCollection.captureScreen(gameState);
                }
                
                // Update training UI
                trainingUI.update(gameState);
            }
            
            // Check for user actions
            var userAction = utils.detectUserAction();
            if (userAction) {
                utils.logToFile("Detected user action: " + userAction);
                
                // Capture current game state
                var gameState = vision.analyzeEnvironment(config);
                
                // Save training data
                utils.collectTrainingData(gameState, userAction, config);
                dataCollection.recordAction(userAction, null, gameState);
                toast("Recorded: " + userAction);
            }
            
            sleep(config.training.sampleRate); // Sample rate
        } catch (e) {
            utils.logToFile("ERROR: " + e.message);
            sleep(1000);
        }
    }
}

function runAutoPlayMode() {
    utils.logToFile("Starting in AUTO-PLAY MODE - Bot will play automatically");
    
    // Initialize neural network and reinforcement learning modules if enabled
    if (config.neuralNet.enabled) {
        try {
            neuralNetwork.initialize(config);
            console.log("Neural network initialized successfully");
        } catch (e) {
            console.error("Failed to initialize neural network: " + e.message);
        }
    }
    
    if (config.reinforcementLearning.enabled) {
        try {
            reinforcementLearning.initialize(config);
            console.log("Reinforcement learning initialized successfully");
        } catch (e) {
            console.error("Failed to initialize reinforcement learning: " + e.message);
        }
    }
    
    // Launch game if not running
    if (!utils.isGameRunning(config)) {
        utils.logToFile("Launching Subway Surfers...");
        uiModule.launchGame(config).then(function() {
            // Continue with auto-play setup after game launches
            toast("Auto-play mode active. Bot will play automatically.");
        });
        return; // Exit this function call and let the promise handle the rest
    }
    
    // Wait for game to be ready
    toast("Auto-play mode active. Bot will play automatically.");
    
    // Main auto-play loop
    var lastActionTime = 0;
    var gameRunTime = 0;
    var startTime = Date.now();
    var isDead = false;
    var previousGameState = null;
    // Initialize performance timer with zero
    var performanceUpdateTime = 0;
    
    // Start performance monitoring if enabled
    if (config.reliability && config.reliability.performanceMonitoring && config.reliability.performanceMonitoring.enabled) {
        performanceMonitor.startMonitoring();
    }
    
    while (currentMode === "auto") {
        try {
            if (!utils.isGameRunning(config)) {
                utils.logToFile("Game closed. Exiting auto-play mode.");
                break;
            }
            
            // Check if max run time exceeded
            gameRunTime = Date.now() - startTime;
            if (gameRunTime > config.gameplay.maxRunTime) {
                utils.logToFile("Maximum run time exceeded. Restarting game.");
                
                // Save reinforcement learning buffer before restart
                if (config.reinforcementLearning.enabled) {
                    reinforcementLearning.saveReplayBuffer(config);
                }
                
                uiModule.restartGame(config);
                startTime = Date.now();
                isDead = false;
                previousGameState = null;
                
                // Reset reinforcement learning episode
                if (config.reinforcementLearning.enabled) {
                    reinforcementLearning.resetEpisode();
                }
                
                continue;
            }
            
            // Detect game screen type using enhanced vision system
            var img = captureScreen();
            var screenType = vision.detectScreenType(img, img.getWidth(), img.getHeight(), config);
            
            // Check if player died (transition from gameplay to game_over)
            if (previousGameState && previousGameState.screenType === "gameplay" && screenType === "game_over") {
                isDead = true;
                
                // Update reinforcement learning with death penalty
                if (config.reinforcementLearning.enabled) {
                    reinforcementLearning.update(previousGameState, true);
                    
                    // Log performance metrics
                    var metrics = reinforcementLearning.getPerformanceMetrics();
                    utils.logToFile("RL Performance: Avg Reward: " + metrics.averageReward.toFixed(2) + 
                                  ", Exploration Rate: " + metrics.explorationRate.toFixed(3));

                }
            }
            
            // Handle non-gameplay screens
            if (screenType !== "gameplay") {
                uiModule.handleScreen(screenType, config);
                
                // Clean up image resource
                if (img && img.recycle) {
                    try { img.recycle(); } catch (e) {}
                }
                
                // Reset state if game restarted
                if (screenType === "menu" && isDead) {
                    isDead = false;
                    previousGameState = null;
                    
                    // Reset reinforcement learning episode
                    if (config.reinforcementLearning.enabled) {
                        reinforcementLearning.resetEpisode();
                    }
                }
                
                sleep(1000);
                continue;
            }
            
            // Analyze game environment
            var gameState = brain.analyzeEnvironment(config);
            
            // Determine best action based on selected decision-making system
            var action = "none";
            
            if (config.reinforcementLearning.enabled) {
                // Use reinforcement learning for decision making
                action = reinforcementLearning.selectAction(gameState);
                
                // Update reinforcement learning with new state (not dead)
                if (previousGameState) {
                    reinforcementLearning.update(gameState, false);
                }
            } else {
                // Use traditional rule-based decision making
                action = brain.determineAction(gameState, config);
            }
            
            // Execute action if enough time has passed since last action
            var currentTime = Date.now();
            if (action !== "none" && (currentTime - lastActionTime) > config.gameplay.actionDelay) {
                utils.logToFile("Executing action: " + action);
                uiModule.performAction(action, config);
                lastActionTime = currentTime;
            }
            
            // Store current state for next iteration
            previousGameState = gameState;
            
            // Clean up image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
            
            // Update performance metrics if enabled
            var currentTime = Date.now();
            if (config.reliability && config.reliability.performanceMonitoring && 
                config.reliability.performanceMonitoring.enabled && 
                (currentTime - performanceUpdateTime) > config.reliability.performanceMonitoring.sampleInterval) {
                
                // Update frame rate
                performanceMonitor.updateFrameRate();
                
                // Update game statistics
                if (gameState && gameState.score) {
                    performanceMonitor.updateGameStats({
                        score: gameState.score,
                        coins: gameState.coins,
                        distance: gameState.distance
                    });
                }
                
                performanceUpdateTime = currentTime;
            }
            
            sleep(50); // Short sleep to prevent CPU overuse
        } catch (e) {
            console.error("Error in auto-play mode: " + e.message);
            utils.logToFile("Auto-play error: " + e.message);
            
            // Use error detection and crash recovery if enabled
            if (config.reliability && config.reliability.errorDetection && config.reliability.errorDetection.enabled) {
                // Detect error pattern and get correction strategy
                var errorInfo = errorDetection.detectError(e, {
                    screenType: previousGameState ? previousGameState.screenType : "unknown",
                    gameState: previousGameState
                });
                
                console.log("Error detected: " + errorInfo.type + " - " + errorInfo.description);
                
                // Apply correction if available
                if (errorInfo.correction && errorInfo.correction.strategy) {
                    console.log("Applying correction strategy: " + errorInfo.correction.strategy);
                    errorDetection.applyCorrection(errorInfo.correction.strategy, {
                        screenType: previousGameState ? previousGameState.screenType : "unknown",
                        gameState: previousGameState
                    });
                }
            }
            
            // Attempt recovery if enabled
            if (config.reliability && config.reliability.recovery && config.reliability.recovery.enabled) {
                // Update game state in crash recovery
                if (previousGameState) {
                    crashRecovery.updateGameState(previousGameState.screenType, null);
                }
                
                // Handle the error and attempt recovery
                crashRecovery.handleError(e, "auto_play");
                
                // Check if we're in recovery mode
                if (crashRecovery.isInRecoveryMode()) {
                    console.log("In recovery mode, waiting for recovery to complete...");
                    sleep(config.reliability.recovery.recoveryDelay || 2000);
                }
            } else {
                // Default error handling if recovery not enabled
                sleep(1000);
            }
        }
    }
    
    // Save reinforcement learning buffer when exiting
    if (config.reinforcementLearning.enabled) {
        reinforcementLearning.saveReplayBuffer(config);
    }
    
    // Stop performance monitoring if enabled
    if (config.reliability && config.reliability.performanceMonitoring && config.reliability.performanceMonitoring.enabled) {
        performanceMonitor.stopMonitoring();
        performanceMonitor.saveMetrics();
        console.log("Performance monitoring stopped and metrics saved");
    }
    
    // Log error statistics if error detection was enabled
    if (config.reliability && config.reliability.errorDetection && config.reliability.errorDetection.enabled) {
        var errorStats = errorDetection.getErrorStats();
        console.log("Error statistics: " + 
                   "Total errors: " + errorStats.totalErrors + 
                   ", Corrected: " + errorStats.correctedErrors + 
                   ", Uncorrectable: " + errorStats.uncorrectableErrors);
    }
}

function runAutoPlayLoop() {
    // Main gameplay loop
    while (currentMode === "auto") {
        try {
            utils.logToFile("Checking if game is running...");
            if (!utils.isGameRunning(config)) {
                utils.logToFile("Game not running. Launching...");
                uiModule.launchGame(config).then(function() {
                    // Continue with auto-play mode after game launches
                    setTimeout(runAutoPlayLoop, 1000);
                });
                return; // Exit this function call and let the promise handle the rest
            }

            // Detect screen type
            var screenType = uiModule.detectGameScreen();
            utils.logToFile("Detected screen: " + screenType);
            
            // Handle non-gameplay screens
            if (screenType !== "gameplay") {
                uiModule.handleScreen(screenType, config);
                sleep(1000);
                continue;
            }

            // Analyze game state and make a decision
            var gameState = vision.analyzeEnvironment(config);
            var action = brain.decideAction(gameState, config);
            
            if (action) {
                utils.logToFile("Performing action: " + action);
                utils.executeAction(action, config);
            }

            sleep(config.gameplay.actionDelay);
        } catch (e) {
            utils.logToFile("ERROR: " + e.message);
            utils.recover(config);
            sleep(2000);
        }
    }
}

// Start the bot
function start() {
    init();
    setupModeButton();
    
    if (config.training.manualMode) {
        runTrainingMode();
    } else {
        runAutoPlayMode();
    }
}

// Run the bot
start();