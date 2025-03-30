// Enhanced Configuration for Subway Surfers Bot
// Optimized for Phase 2.1 (Screen Recognition) and 2.2 (Game Element Detection)
// Updated with Phase 6.3 (Reliability Improvements)

module.exports = {
    // General settings
    version: "2.3",
    debug: true,
    
    // Code quality settings
    codeQuality: {
        duplicateDetection: {
            enabled: true,
            similarityThreshold: 0.8,
            minLineCount: 5,
            excludeDirs: ["node_modules", ".git", "models"]
        }
    },
    
    // Training mode settings
    training: {
        manualMode: true,  // Start in training mode by default
        // Paths will be updated at runtime based on available storage
        dataPath: "/storage/emulated/0/SubwayBot/data/",  // Default path, will be updated
        trainingPath: "/storage/emulated/0/SubwayBot/training_data/",  // Default path, will be updated
        screenshotPath: "/storage/emulated/0/SubwayBot/screenshots/",  // Default path, will be updated
        sampleRate: 200,  // ms between samples
        minActionInterval: 500  // ms between actions
    },
    
    // MEmu emulator settings
    memu: {
        packageName: "com.kiloo.subwaysurf",  // Subway Surfers package name
        resolution: [1280, 720],  // Default MEmu resolution
        touchDelay: 50  // ms delay between touch events
    },
    
    // Gameplay settings
    gameplay: {
        actionDelay: 100,  // ms between actions
        recoveryDelay: 2000,  // ms to wait after recovery
        maxRunTime: 30 * 60 * 1000,  // 30 minutes max run time
        autoRestart: true,  // Auto restart after game over
        swipeDuration: 200  // ms duration for swipe gestures
    },
    
    // Enhanced vision detection settings for Phase 2.1 and 2.2
    vision: {
        colorThreshold: 40,  // Color matching threshold
        playerThreshold: 30,  // Player detection threshold
        enableLearning: true, // Enable learning from gameplay
        learningInterval: 5000, // ms between learning updates
        laneWidthPercent: 0.3, // Default lane width as percentage of screen width
        ocrEnabled: true, // Enable OCR if available
        regions: {
            obstacles: {
                topPercent: 0.4,  // Top of obstacle detection region
                heightPercent: 0.3  // Height of obstacle detection region
            },
            player: {
                topPercent: 0.6,  // Top of player detection region
                heightPercent: 0.2  // Height of player detection region
            },
            coins: {
                topPercent: 0.3,  // Top of coin detection region
                heightPercent: 0.4  // Height of coin detection region
            },
            powerups: {
                topPercent: 0.3,  // Top of powerup detection region
                heightPercent: 0.4  // Height of powerup detection region
            },
            specialEvents: {
                topPercent: 0.1,  // Top of special events detection region
                heightPercent: 0.2  // Height of special events detection region
            }
        },
        // Performance optimization settings
        performance: {
            frameSkip: 1, // Process every nth frame
            regionOfInterest: true, // Use ROI-based processing
            lowResolutionMode: false, // Use lower resolution for faster processing
            memoryManagement: true // Enable automatic memory management
        }
    },
    
    // UI elements with enhanced multi-language support
    ui: {
        playButtons: ["PLAY", "GIOCA", "START", "JUGAR", "JOUER", "SPIELEN"],
        gameOverButtons: ["TRY AGAIN", "RIPROVA", "REVIVE", "CONTINUE", "REINTENTAR"],
        colors: {
            obstacles: [
                "#FF0000", "#AA0000", "#880000", // Red shades for obstacles
                "#444444", "#222222", "#111111"  // Dark shades for obstacles
            ],
            coins: [
                "#FFFF00", "#FFCC00", "#FFD700", // Yellow/gold for coins
                "#FFFFAA", "#FFEE88"             // Light yellow for coins
            ],
            player: [
                "#0000FF", "#4444FF", "#0044FF", // Blue shades for player
                "#FFFFFF", "#CCCCFF"             // White/light blue for player highlights
            ],
            powerups: {
                jetpack: ["#00FFFF", "#0088FF"],
                magnet: ["#FF00FF", "#8800FF"],
                multiplier: ["#FFFF00", "#FF8800"],
                hoverboard: ["#00FFFF", "#FFFFFF"]
            }
        }
    },
    
    // Neural network settings
    neuralNet: {
        enabled: true,
        modelPath: "/storage/emulated/0/SubwayBot/model/",
        inputNodes: 20,
        hiddenNodes: 16,
        outputNodes: 4,  // left, right, jump, roll
        learningRate: 0.1
    },
    
    // Reinforcement learning settings
    reinforcementLearning: {
        enabled: true,
        bufferPath: "/storage/emulated/0/SubwayBot/data/replay_buffer.json",
        learningRate: 0.1,       // Rate at which the agent learns from new experiences
        discountFactor: 0.95,    // How much future rewards are valued (gamma)
        explorationRate: 0.2,    // Initial exploration rate (epsilon)
        minExplorationRate: 0.01, // Minimum exploration rate
        explorationDecay: 0.995, // Rate at which exploration decreases
        replayBufferSize: 1000,  // Maximum size of replay buffer
        miniBatchSize: 32,       // Size of mini-batch for training
        // Reward configuration
        rewards: {
            coin: 1,             // Reward for collecting a coin
            obstacle: -5,        // Penalty for hitting an obstacle
            survival: 0.1,       // Small reward for each frame survived
            distance: 0.01,      // Reward per distance unit traveled
            powerup: 3,          // Reward for collecting a powerup
            mission: 5,          // Reward for completing a mission
            death: -10           // Penalty for dying
        }
    },
    
    // Reliability improvement settings (Phase 6.3)
    reliability: {
        // Crash recovery settings
        recovery: {
            enabled: true,
            maxRecoveryAttempts: 3,      // Maximum number of recovery attempts before giving up
            recoveryDelay: 2000,         // ms to wait between recovery attempts
            screenshotBeforeError: true, // Save screenshot before error for debugging
            autoRestart: true            // Automatically restart after unrecoverable errors
        },
        // Error detection settings
        errorDetection: {
            enabled: true,
            patternMatching: true,       // Use pattern matching to identify common errors
            autoCorrection: true,        // Attempt to automatically correct detected errors
            logErrors: true              // Log all errors to file for later analysis
        },
        // Performance monitoring settings
        performanceMonitoring: {
            enabled: true,
            sampleInterval: 5000,        // ms between performance samples
            logInterval: 60000,          // ms between writing performance logs
            alertThresholds: {
                frameRate: 15,            // Alert if FPS drops below this value
                cpuUsage: 80,            // Alert if CPU usage exceeds this percentage
                memoryUsage: 200 * 1024 * 1024, // Alert if memory usage exceeds 200MB
                responseTime: 500        // Alert if response time exceeds 500ms
            },
            logFile: "/storage/emulated/0/SubwayBot/logs/performance.log",
            maxLogSize: 5 * 1024 * 1024, // 5MB max log size
            maxSampleCount: 1000         // Maximum number of samples to keep in memory
        }
    }
};