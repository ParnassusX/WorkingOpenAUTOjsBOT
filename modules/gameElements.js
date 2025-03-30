/**
 * Subway Surfers Game Elements Configuration
 * Optimized for 1280x720 resolution on MEmu emulator
 * Contains coordinates, colors, and detection parameters for all game UI elements
 * 
 * Enhanced with dynamic learning capabilities to adapt to game updates and seasonal themes
 */

// Files module is a built-in global object in AutoJS
// No need to require it

// Storage for learned element data
var learnedElements = {
    lastUpdate: Date.now(),
    colorProfiles: {},
    detectionRegions: {},
    newElements: []
};

module.exports = {
    // Base screen resolution for coordinate calculations
    screenResolution: {
        width: 1280,
        height: 720
    },
    
    // Main menu screen elements
    mainMenuScreen: {
        regions: {
            // Top section with player stats
            topRun: {
                x: 133, 
                y: 220, 
                width: 100, 
                height: 60
            },
            highScore: {
                x: 144, 
                y: 130, 
                width: 100, 
                height: 60
            },
            // Currency indicators (keys, coins)
            keys: {
                x: 42, 
                y: 52, 
                width: 60, 
                height: 30
            },
            coins: {
                x: 130, 
                y: 52, 
                width: 80, 
                height: 30
            },
            // Bottom navigation buttons
            missionsButton: {
                x: 77, 
                y: 905, 
                width: 150, 
                height: 70,
                text: "Missions",
                colors: ["#FFFF00", "#0000FF"]
            },
            meButton: {
                x: 223, 
                y: 905, 
                width: 150, 
                height: 70,
                text: "ME",
                colors: ["#FFFFFF", "#0000FF"]
            },
            shopButton: {
                x: 369, 
                y: 905, 
                width: 150, 
                height: 70,
                text: "Shop",
                colors: ["#FFFF00", "#0000FF"]
            },
            eventsButton: {
                x: 515, 
                y: 905, 
                width: 150, 
                height: 70,
                text: "Events",
                colors: ["#FFFFFF", "#444444"]
            },
            // Center play button
            playButton: {
                x: 640, 
                y: 770, 
                width: 300, 
                height: 80,
                text: "Tap to Play",
                colors: ["#FFFFFF"]
            },
            // Daily login reward
            claimRewardButton: {
                x: 183, 
                y: 397, 
                width: 200, 
                height: 60,
                text: "Claim your daily login reward!",
                colors: ["#4444FF", "#FFFFFF"]
            },
            // Connection problem indicator
            connectionProblem: {
                x: 420, 
                y: 140, 
                width: 180, 
                height: 60,
                text: "Connection Problem",
                colors: ["#FFFFFF", "#FF0000"]
            }
        },
        colors: {
            background: ["#9966CC", "#6633CC"], // Purple background colors
            playText: "#FFFFFF",
            buttonActive: "#FFFF00",
            buttonInactive: "#AAAAAA"
        },
        fonts: {
            title: "bold 24px sans-serif",
            button: "bold 18px sans-serif",
            stats: "16px sans-serif"
        }
    },
    
    // Gameplay screen elements
    gameplayScreen: {
        regions: {
            // Top UI elements
            pauseButton: {
                x: 40, 
                y: 40, 
                width: 60, 
                height: 60,
                colors: ["#4444FF", "#FFFFFF"]
            },
            scoreCounter: {
                x: 640, 
                y: 40, 
                width: 200, 
                height: 40,
                colors: ["#00FFFF", "#FF00FF", "#FFFF00"]
            },
            // Bottom UI elements
            hoverboardButton: {
                x: 60, 
                y: 600, 
                width: 80, 
                height: 80,
                colors: ["#00FFFF", "#FFFFFF"]
            },
            boostButton: {
                x: 60, 
                y: 500, 
                width: 80, 
                height: 80,
                colors: ["#FF0000", "#FFFF00"]
            }
        },
        // Game lanes for obstacle detection
        lanes: {
            left: {
                x: 320, // Adjusted for MEmu's 1280x720 resolution
                y: 360, // Middle of screen height
                width: 100,
                height: 300
            },
            center: {
                x: 640, // Center of screen
                y: 360,
                width: 100,
                height: 300
            },
            right: {
                x: 960, // Adjusted for MEmu's 1280x720 resolution
                y: 360,
                width: 100,
                height: 300
            }
        },
        colors: {
            background: ["#87CEEB", "#1E90FF"], // Sky blue background colors
            obstacles: ["#FF0000", "#8B0000", "#A52A2A"] // Red/brown obstacle colors
        }
    }
}