/**
 * Basic Decision System Module for Subway Surfers Bot
 * Implements Phase 5.1: Basic Decision System features
 * 
 * Features:
 * - Rule-based decision making (Implemented)
 * - Obstacle avoidance algorithms (Implemented)
 * - Coin collection optimization (Implemented)
 * - Powerup usage strategy (Implemented)
 */

// Import required modules
var utils = require('./utils.js');
var vision = require('./vision.js');
var gameElements = require('./gameElements.js');
var controls = require('./controls.js');

// Decision state tracking
var decisionState = {
    lastAction: "",
    lastActionTime: 0,
    actionHistory: [],
    obstacleAvoidanceStats: {
        successfulAvoids: 0,
        collisions: 0
    },
    coinCollectionStats: {
        coinsCollected: 0,
        coinsMissed: 0
    },
    powerupStats: {
        powerupsUsed: {},
        powerupEfficiency: {}
    }
};

// Decision weights for different game elements
var decisionWeights = {
    obstacles: 10.0,  // Highest priority - avoid obstacles
    coins: 5.0,       // Medium priority - collect coins
    powerups: 7.0,    // High priority - get powerups
    lanes: {          // Lane preference weights
        left: 1.0,
        center: 1.2,  // Slight preference for center lane
        right: 1.0
    }
};

module.exports = {
    /**
     * Initializes the basic decision system
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing basic decision system...");
        
        // Reset decision state
        this.resetDecisionState();
        
        // Adjust weights based on config if provided
        if (config && config.decisionSystem) {
            this.updateWeights(config.decisionSystem);
        }
        
        console.log("Basic decision system initialized");
        return true;
    },
    
    /**
     * Resets the decision state
     */
    resetDecisionState: function() {
        decisionState = {
            lastAction: "",
            lastActionTime: 0,
            actionHistory: [],
            obstacleAvoidanceStats: {
                successfulAvoids: 0,
                collisions: 0
            },
            coinCollectionStats: {
                coinsCollected: 0,
                coinsMissed: 0
            },
            powerupStats: {
                powerupsUsed: {},
                powerupEfficiency: {}
            }
        };
    },
    
    /**
     * Updates decision weights based on configuration
     * @param {Object} config - Decision system configuration
     */
    updateWeights: function(config) {
        if (config.weights) {
            if (config.weights.obstacles) {
                decisionWeights.obstacles = config.weights.obstacles;
            }
            if (config.weights.coins) {
                decisionWeights.coins = config.weights.coins;
            }
            if (config.weights.powerups) {
                decisionWeights.powerups = config.weights.powerups;
            }
            if (config.weights.lanes) {
                decisionWeights.lanes = config.weights.lanes;
            }
        }
        console.log("Updated decision weights");
    },
    
    /**
     * Makes a decision based on the current game state
     * @param {Object} gameState - Current game state from vision module
     * @param {Object} config - Configuration settings
     * @return {Object} Decision with action type and parameters
     */
    makeDecision: function(gameState, config) {
        if (!gameState || gameState.screenType !== "gameplay") {
            return { action: "none", reason: "Not in gameplay" };
        }
        
        var now = Date.now();
        var timeSinceLastAction = now - decisionState.lastActionTime;
        
        // Don't make decisions too frequently
        if (timeSinceLastAction < config.gameplay.actionDelay) {
            return { action: "none", reason: "Too soon after last action" };
        }
        
        // Analyze game state and make decision
        var decision = this.analyzeGameState(gameState, config);
        
        // Record decision
        if (decision.action !== "none") {
            decisionState.lastAction = decision.action;
            decisionState.lastActionTime = now;
            
            // Keep action history limited to last 20 actions
            decisionState.actionHistory.push({
                action: decision.action,
                time: now,
                reason: decision.reason
            });
            
            if (decisionState.actionHistory.length > 20) {
                decisionState.actionHistory.shift();
            }
        }
        
        return decision;
    },
    
    /**
     * Analyzes the game state to determine the best action
     * @param {Object} gameState - Current game state
     * @param {Object} config - Configuration settings
     * @return {Object} Decision with action type and parameters
     */
    analyzeGameState: function(gameState, config) {
        // Get player's current lane
        var currentLane = this.determineCurrentLane(gameState.playerPosition);
        
        // Check for immediate obstacles that need to be avoided
        var obstacleDecision = this.avoidObstacles(gameState, currentLane, config);
        if (obstacleDecision.action !== "none") {
            return obstacleDecision;
        }
        
        // Check for powerups to collect
        var powerupDecision = this.collectPowerups(gameState, currentLane, config);
        if (powerupDecision.action !== "none") {
            return powerupDecision;
        }
        
        // Check for coins to collect
        var coinDecision = this.collectCoins(gameState, currentLane, config);
        if (coinDecision.action !== "none") {
            return coinDecision;
        }
        
        // If no specific action needed, maintain current lane or optimize position
        return this.optimizePosition(gameState, currentLane, config);
    },
    
    /**
     * Determines the current lane of the player
     * @param {Object} playerPosition - Player position information
     * @return {string} Current lane ("left", "center", or "right")
     */
    determineCurrentLane: function(playerPosition) {
        if (!playerPosition || typeof playerPosition.x === 'undefined') {
            return "center"; // Default to center if position unknown
        }
        
        var xPos = playerPosition.x;
        var screenWidth = playerPosition.screenWidth || 1;
        var relativePos = xPos / screenWidth;
        
        if (relativePos < 0.33) {
            return "left";
        } else if (relativePos > 0.66) {
            return "right";
        } else {
            return "center";
        }
    },
    
    /**
     * Determines actions to avoid obstacles
     * @param {Object} gameState - Current game state
     * @param {string} currentLane - Current lane of the player
     * @param {Object} config - Configuration settings
     * @return {Object} Decision for obstacle avoidance
     */
    avoidObstacles: function(gameState, currentLane, config) {
        var obstacles = gameState.obstacles || [];
        
        // No obstacles detected
        if (obstacles.length === 0) {
            return { action: "none", reason: "No obstacles detected" };
        }
        
        // Check each lane for obstacles
        var laneObstacles = {
            left: false,
            center: false,
            right: false
        };
        
        // Identify which lanes have obstacles
        for (var i = 0; i < obstacles.length; i++) {
            var obstacle = obstacles[i];
            
            // Skip obstacles that are too far away
            if (obstacle.distance > 0.7) {
                continue;
            }
            
            // Determine which lane the obstacle is in
            if (obstacle.x < 0.33) {
                laneObstacles.left = true;
            } else if (obstacle.x > 0.66) {
                laneObstacles.right = true;
            } else {
                laneObstacles.center = true;
            }
        }
        
        // If obstacle in current lane, need to move
        if (laneObstacles[currentLane]) {
            // Determine best lane to move to
            if (currentLane === "left") {
                if (!laneObstacles.center) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_right", reason: "Avoiding obstacle in left lane" };
                } else if (!laneObstacles.right) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_right", reason: "Avoiding obstacle in left lane (jumping to right)" };
                }
            } else if (currentLane === "center") {
                if (!laneObstacles.left) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_left", reason: "Avoiding obstacle in center lane" };
                } else if (!laneObstacles.right) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_right", reason: "Avoiding obstacle in center lane" };
                }
            } else if (currentLane === "right") {
                if (!laneObstacles.center) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_left", reason: "Avoiding obstacle in right lane" };
                } else if (!laneObstacles.left) {
                    decisionState.obstacleAvoidanceStats.successfulAvoids++;
                    return { action: "swipe_left", reason: "Avoiding obstacle in right lane (jumping to left)" };
                }
            }
            
            // If all lanes have obstacles, try to jump or roll
            var jumpableObstacle = this.isJumpableObstacle(obstacles, currentLane);
            if (jumpableObstacle) {
                decisionState.obstacleAvoidanceStats.successfulAvoids++;
                return { action: "swipe_up", reason: "Jumping over obstacle" };
            }
            
            var rollableObstacle = this.isRollableObstacle(obstacles, currentLane);
            if (rollableObstacle) {
                decisionState.obstacleAvoidanceStats.successfulAvoids++;
                return { action: "swipe_down", reason: "Rolling under obstacle" };
            }
            
            // If we can't avoid, record collision
            decisionState.obstacleAvoidanceStats.collisions++;
            return { action: "none", reason: "Unable to avoid obstacle" };
        }
        
        return { action: "none", reason: "No immediate obstacle threat" };
    },
    
    /**
     * Determines if an obstacle can be jumped over
     * @param {Array} obstacles - List of detected obstacles
     * @param {string} currentLane - Current lane of the player
     * @return {boolean} True if obstacle can be jumped over
     */
    isJumpableObstacle: function(obstacles, currentLane) {
        for (var i = 0; i < obstacles.length; i++) {
            var obstacle = obstacles[i];
            
            // Check if obstacle is in current lane and close enough
            var inCurrentLane = false;
            if (currentLane === "left" && obstacle.x < 0.33) {
                inCurrentLane = true;
            } else if (currentLane === "center" && obstacle.x >= 0.33 && obstacle.x <= 0.66) {
                inCurrentLane = true;
            } else if (currentLane === "right" && obstacle.x > 0.66) {
                inCurrentLane = true;
            }
            
            if (inCurrentLane && obstacle.distance < 0.5 && obstacle.distance > 0.2) {
                // Check if obstacle type is jumpable (barriers, small obstacles)
                if (obstacle.type === "barrier" || obstacle.type === "small") {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Determines if an obstacle can be rolled under
     * @param {Array} obstacles - List of detected obstacles
     * @param {string} currentLane - Current lane of the player
     * @return {boolean} True if obstacle can be rolled under
     */
    isRollableObstacle: function(obstacles, currentLane) {
        for (var i = 0; i < obstacles.length; i++) {
            var obstacle = obstacles[i];
            
            // Check if obstacle is in current lane and close enough
            var inCurrentLane = false;
            if (currentLane === "left" && obstacle.x < 0.33) {
                inCurrentLane = true;
            } else if (currentLane === "center" && obstacle.x >= 0.33 && obstacle.x <= 0.66) {
                inCurrentLane = true;
            } else if (currentLane === "right" && obstacle.x > 0.66) {
                inCurrentLane = true;
            }
            
            if (inCurrentLane && obstacle.distance < 0.5 && obstacle.distance > 0.2) {
                // Check if obstacle type is rollable (overhead barriers)
                if (obstacle.type === "overhead" || obstacle.type === "high") {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    /**
     * Determines actions to collect powerups
     * @param {Object} gameState - Current game state
     * @param {string} currentLane - Current lane of the player
     * @param {Object} config - Configuration settings
     * @return {Object} Decision for powerup collection
     */
    collectPowerups: function(gameState, currentLane, config) {
        var powerups = gameState.powerups || [];
        
        // No powerups detected
        if (powerups.length === 0) {
            return { action: "none", reason: "No powerups detected" };
        }
        
        // Find the closest powerup
        var closestPowerup = null;
        var closestDistance = 1.0;
        
        for (var i = 0; i < powerups.length; i++) {
            var powerup = powerups[i];
            if (powerup.distance < closestDistance) {
                closestPowerup = powerup;
                closestDistance = powerup.distance;
            }
        }
        
        if (!closestPowerup) {
            return { action: "none", reason: "No powerups in range" };
        }
        
        // Determine which lane the powerup is in
        var powerupLane = "center";
        if (closestPowerup.x < 0.33) {
            powerupLane = "left";
        } else if (closestPowerup.x > 0.66) {
            powerupLane = "right";
        }
        
        // If powerup is in a different lane, move to that lane
        if (powerupLane !== currentLane) {
            if (powerupLane === "left" && currentLane === "center") {
                return { action: "swipe_left", reason: "Moving to collect powerup in left lane" };
            } else if (powerupLane === "left" && currentLane === "right") {
                return { action: "swipe_left", reason: "Moving to collect powerup in left lane" };
            } else if (powerupLane === "center" && currentLane === "left") {
                return { action: "swipe_right", reason: "Moving to collect powerup in center lane" };
            } else if (powerupLane === "center" && currentLane === "right") {
                return { action: "swipe_left", reason: "Moving to collect powerup in center lane" };
            } else if (powerupLane === "right" && currentLane === "left") {
                return { action: "swipe_right", reason: "Moving to collect powerup in right lane" };
            } else if (powerupLane === "right" && currentLane === "center") {
                return { action: "swipe_right", reason: "Moving to collect powerup in right lane" };
            }
        }
        
        // If powerup requires jumping or special action
        if (closestPowerup.type === "jetpack" && closestPowerup.distance < 0.4) {
            // Track powerup usage
            if (!decisionState.powerupStats.powerupsUsed["jetpack"]) {
                decisionState.powerupStats.powerupsUsed["jetpack"] = 0;
            }
            decisionState.powerupStats.powerupsUsed["jetpack"]++;
            
            return { action: "swipe_up", reason: "Activating jetpack powerup" };
        }
        
        return { action: "none", reason: "No immediate powerup action needed" };
    },
    
    /**
     * Determines actions to collect coins
     * @param {Object} gameState - Current game state
     * @param {string} currentLane - Current lane of the player
     * @param {Object} config - Configuration settings
     * @return {Object} Decision for coin collection
     */
    collectCoins: function(gameState, currentLane, config) {
        // Analyze coin distribution in lanes
        var lanes = gameState.lanes || {};
        var leftCoins = lanes.left && lanes.left.coins ? lanes.left.coins : 0;
        var centerCoins = lanes.center && lanes.center.coins ? lanes.center.coins : 0;
        var rightCoins = lanes.right && lanes.right.coins ? lanes.right.coins : 0;
        
        // Apply lane preference weights
        leftCoins *= decisionWeights.lanes.left;
        centerCoins *= decisionWeights.lanes.center;
        rightCoins *= decisionWeights.lanes.center;
        
        // Find lane with most coins
        var bestLane = currentLane;
        var bestCoinCount = 0;
        
        if (currentLane === "left") {
            bestCoinCount = leftCoins;
        } else if (currentLane === "center") {
            bestCoinCount = centerCoins;
        } else if (currentLane === "right") {
            bestCoinCount = rightCoins;
        }
        
        // Check if another lane has significantly more coins
        var threshold = 3; // Minimum difference to change lanes
        
        if (centerCoins > bestCoinCount + threshold) {
            bestLane = "center";
            bestCoinCount = centerCoins;
        }
        
        if (rightCoins > bestCoinCount + threshold) {
            bestLane = "right";
            bestCoinCount = rightCoins;
        }
        
        if (leftCoins > bestCoinCount + threshold) {
            bestLane = "left";
            bestCoinCount = leftCoins;
        }
        
        // If best lane is different from current, move to it
        if (bestLane !== currentLane && bestCoinCount > 0) {
            if (bestLane === "left" && currentLane === "center") {
                return { action: "swipe_left", reason: "Moving to collect coins in left lane" };
            } else if (bestLane === "left" && currentLane === "right") {
                return { action: "swipe_left", reason: "Moving to collect coins in left lane" };
            } else if (bestLane === "center" && currentLane === "left") {
                return { action: "swipe_right", reason: "Moving to collect coins in center lane" };
            } else if (bestLane === "center" && currentLane === "right") {
                return { action: "swipe_left", reason: "Moving to collect coins in center lane" };
            } else if (bestLane === "right" && currentLane === "left") {
                return { action: "swipe_right", reason: "Moving to collect coins in right lane" };
            } else if (bestLane === "right" && currentLane === "center") {
                return { action: "swipe_right", reason: "Moving to collect coins in right lane" };
            }
        }
        
        return { action: "none", reason: "No coin collection action needed" };
    },
    
    /**
     * Optimizes player position when no immediate actions are needed
     * @param {Object} gameState - Current game state
     * @param {string} currentLane - Current lane of the player
     * @param {Object} config - Configuration settings
     * @return {Object} Decision for position optimization
     */
    optimizePosition: function(gameState, currentLane, config) {
        // By default, prefer center lane for better visibility and options
        if (currentLane !== "center" && Math.random() < 0.1) { // 10% chance to move to center
            if (currentLane === "left") {
                return { action: "swipe_right", reason: "Optimizing position to center lane" };
            } else if (currentLane === "right") {
                return { action: "swipe_left", reason: "Optimizing position to center lane" };
            }
        }
        
        return { action: "none", reason: "Maintaining current position" };
    },
    
    /**
     * Gets the current decision state statistics
     * @return {Object} Decision statistics
     */
    getDecisionStats: function() {
        return {
            obstacleAvoidance: decisionState.obstacleAvoidanceStats,
            coinCollection: decisionState.coinCollectionStats,
            powerupUsage: decisionState.powerupStats,
            actionHistory: decisionState.actionHistory
        };
    }
};