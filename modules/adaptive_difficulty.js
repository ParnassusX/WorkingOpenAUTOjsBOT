/**
 * Adaptive Difficulty Adjustment Module for Subway Surfers Bot
 * Implements Phase 5.3: Advanced AI Features
 * 
 * Features:
 * - Dynamic difficulty adjustment based on player performance
 * - Performance tracking and analysis
 * - Skill level estimation
 * - Progressive challenge system
 */

// Import required modules
var utils = require('./utils.js');
var reinforcementLearning = require('./reinforcement_learning.js');
var dataProcessing = require('./data_processing.js');

// Difficulty adjustment state
var difficultyState = {
    enabled: true,
    currentDifficulty: 0.5, // 0.0 to 1.0 scale (easiest to hardest)
    minDifficulty: 0.1,
    maxDifficulty: 0.9,
    difficultyHistory: [],
    maxHistorySize: 20,
    performanceMetrics: {
        recentScores: [],
        recentSurvivalTimes: [],
        recentCoinsCollected: [],
        recentObstaclesAvoided: [],
        maxMetricsCount: 10
    },
    skillEstimation: {
        currentSkillLevel: 0.5, // 0.0 to 1.0 scale (beginner to expert)
        confidenceLevel: 0.5,   // How confident we are in the skill estimation
        learningRate: 0.05      // How quickly skill estimation changes
    },
    adjustmentFactors: {
        scoreWeight: 0.4,
        survivalTimeWeight: 0.3,
        coinsWeight: 0.2,
        obstaclesWeight: 0.1
    },
    targetSuccessRate: 0.7, // Target success rate (70%)
    adjustmentInterval: 3,  // Adjust difficulty every N games
    gamesPlayed: 0,
    lastAdjustment: 0
};

module.exports = {
    /**
     * Initializes the adaptive difficulty adjustment module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing adaptive difficulty adjustment module...");
        
        // Reset state
        this.resetState();
        
        // Apply configuration settings
        if (config && config.adaptiveDifficulty) {
            difficultyState.enabled = config.adaptiveDifficulty.enabled !== undefined ? 
                config.adaptiveDifficulty.enabled : difficultyState.enabled;
                
            difficultyState.currentDifficulty = config.adaptiveDifficulty.initialDifficulty !== undefined ? 
                config.adaptiveDifficulty.initialDifficulty : difficultyState.currentDifficulty;
                
            difficultyState.targetSuccessRate = config.adaptiveDifficulty.targetSuccessRate !== undefined ? 
                config.adaptiveDifficulty.targetSuccessRate : difficultyState.targetSuccessRate;
                
            difficultyState.adjustmentInterval = config.adaptiveDifficulty.adjustmentInterval !== undefined ? 
                config.adaptiveDifficulty.adjustmentInterval : difficultyState.adjustmentInterval;
                
            // Apply adjustment factor weights if provided
            if (config.adaptiveDifficulty.adjustmentFactors) {
                var factors = config.adaptiveDifficulty.adjustmentFactors;
                difficultyState.adjustmentFactors.scoreWeight = factors.scoreWeight || 
                    difficultyState.adjustmentFactors.scoreWeight;
                    
                difficultyState.adjustmentFactors.survivalTimeWeight = factors.survivalTimeWeight || 
                    difficultyState.adjustmentFactors.survivalTimeWeight;
                    
                difficultyState.adjustmentFactors.coinsWeight = factors.coinsWeight || 
                    difficultyState.adjustmentFactors.coinsWeight;
                    
                difficultyState.adjustmentFactors.obstaclesWeight = factors.obstaclesWeight || 
                    difficultyState.adjustmentFactors.obstaclesWeight;
            }
        }
        
        // Load previous difficulty state if available
        this.loadDifficultyState();
        
        console.log("Adaptive difficulty adjustment initialized at level: " + 
                  (difficultyState.currentDifficulty * 100).toFixed(1) + "%");
        return true;
    },
    
    /**
     * Resets the difficulty adjustment state
     */
    resetState: function() {
        difficultyState = {
            enabled: true,
            currentDifficulty: 0.5,
            minDifficulty: 0.1,
            maxDifficulty: 0.9,
            difficultyHistory: [],
            maxHistorySize: 20,
            performanceMetrics: {
                recentScores: [],
                recentSurvivalTimes: [],
                recentCoinsCollected: [],
                recentObstaclesAvoided: [],
                maxMetricsCount: 10
            },
            skillEstimation: {
                currentSkillLevel: 0.5,
                confidenceLevel: 0.5,
                learningRate: 0.05
            },
            adjustmentFactors: {
                scoreWeight: 0.4,
                survivalTimeWeight: 0.3,
                coinsWeight: 0.2,
                obstaclesWeight: 0.1
            },
            targetSuccessRate: 0.7,
            adjustmentInterval: 3,
            gamesPlayed: 0,
            lastAdjustment: 0
        };
    },
    
    /**
     * Loads the difficulty state from storage
     */
    loadDifficultyState: function() {
        try {
            var statePath = "/storage/emulated/0/SubwayBot/data/difficulty_state.json";
            if (files.exists(statePath)) {
                var savedState = JSON.parse(files.read(statePath));
                
                // Apply saved values to current state
                if (savedState.currentDifficulty !== undefined) {
                    difficultyState.currentDifficulty = savedState.currentDifficulty;
                }
                
                if (savedState.skillEstimation !== undefined) {
                    difficultyState.skillEstimation = savedState.skillEstimation;
                }
                
                if (savedState.difficultyHistory !== undefined) {
                    difficultyState.difficultyHistory = savedState.difficultyHistory;
                }
                
                if (savedState.gamesPlayed !== undefined) {
                    difficultyState.gamesPlayed = savedState.gamesPlayed;
                }
                
                console.log("Loaded difficulty state: level=" + 
                          (difficultyState.currentDifficulty * 100).toFixed(1) + 
                          "%, skill=" + 
                          (difficultyState.skillEstimation.currentSkillLevel * 100).toFixed(1) + 
                          "%");
            }
        } catch (e) {
            console.error("Error loading difficulty state: " + e.message);
        }
    },
    
    /**
     * Saves the current difficulty state to storage
     */
    saveDifficultyState: function() {
        try {
            var statePath = "/storage/emulated/0/SubwayBot/data/difficulty_state.json";
            var stateToSave = {
                currentDifficulty: difficultyState.currentDifficulty,
                skillEstimation: difficultyState.skillEstimation,
                difficultyHistory: difficultyState.difficultyHistory,
                gamesPlayed: difficultyState.gamesPlayed,
                lastSaved: Date.now()
            };
            
            // Ensure directory exists
            var dir = "/storage/emulated/0/SubwayBot/data/";
            if (!files.exists(dir)) {
                files.createWithDirs(dir);
            }
            
            // Save state to file
            files.write(statePath, JSON.stringify(stateToSave));
            console.log("Saved difficulty state");
        } catch (e) {
            console.error("Error saving difficulty state: " + e.message);
        }
    },
    
    /**
     * Records game performance metrics after a game ends
     * @param {Object} gameStats - Statistics from the completed game
     */
    recordGamePerformance: function(gameStats) {
        if (!difficultyState.enabled) return;
        
        try {
            // Extract relevant metrics
            var score = gameStats.score || 0;
            var survivalTime = gameStats.survivalTime || 0; // in seconds
            var coinsCollected = gameStats.coinsCollected || 0;
            var obstaclesAvoided = gameStats.obstaclesAvoided || 0;
            
            // Add to performance metrics
            this.addMetric(difficultyState.performanceMetrics.recentScores, score);
            this.addMetric(difficultyState.performanceMetrics.recentSurvivalTimes, survivalTime);
            this.addMetric(difficultyState.performanceMetrics.recentCoinsCollected, coinsCollected);
            this.addMetric(difficultyState.performanceMetrics.recentObstaclesAvoided, obstaclesAvoided);
            
            // Increment games played counter
            difficultyState.gamesPlayed++;
            
            console.log("Recorded game performance: score=" + score + 
                      ", time=" + survivalTime + "s, coins=" + coinsCollected + 
                      ", obstacles=" + obstaclesAvoided);
            
            // Check if we should adjust difficulty
            if (difficultyState.gamesPlayed % difficultyState.adjustmentInterval === 0) {
                this.adjustDifficulty();
            }
            
            // Save state periodically
            if (difficultyState.gamesPlayed % 5 === 0) {
                this.saveDifficultyState();
            }
        } catch (e) {
            console.error("Error recording game performance: " + e.message);
        }
    },
    
    /**
     * Adds a metric to a metrics array, maintaining the max size
     * @param {Array} metricsArray - Array to add the metric to
     * @param {number} value - Value to add
     */
    addMetric: function(metricsArray, value) {
        metricsArray.push(value);
        if (metricsArray.length > difficultyState.performanceMetrics.maxMetricsCount) {
            metricsArray.shift();
        }
    },
    
    /**
     * Adjusts the difficulty based on recent performance metrics
     */
    adjustDifficulty: function() {
        if (!difficultyState.enabled) return;
        
        try {
            // Calculate performance score (0.0 to 1.0)
            var performanceScore = this.calculatePerformanceScore();
            
            // Update skill estimation
            this.updateSkillEstimation(performanceScore);
            
            // Calculate success rate (how often the player is succeeding at the current difficulty)
            var successRate = this.calculateSuccessRate();
            
            // Determine if difficulty should increase or decrease
            var targetDelta = difficultyState.targetSuccessRate - successRate;
            
            // Calculate adjustment amount (larger adjustments when far from target)
            var adjustmentAmount = targetDelta * 0.1;
            
            // Apply adjustment with limits
            var newDifficulty = difficultyState.currentDifficulty + adjustmentAmount;
            newDifficulty = Math.max(difficultyState.minDifficulty, 
                                   Math.min(difficultyState.maxDifficulty, newDifficulty));
            
            // Record the adjustment
            difficultyState.difficultyHistory.push({
                oldDifficulty: difficultyState.currentDifficulty,
                newDifficulty: newDifficulty,
                performanceScore: performanceScore,
                successRate: successRate,
                timestamp: Date.now()
            });
            
            // Trim history if needed
            if (difficultyState.difficultyHistory.length > difficultyState.maxHistorySize) {
                difficultyState.difficultyHistory.shift();
            }
            
            // Update current difficulty
            difficultyState.currentDifficulty = newDifficulty;
            difficultyState.lastAdjustment = Date.now();
            
            console.log("Adjusted difficulty from " + 
                      (difficultyState.difficultyHistory[difficultyState.difficultyHistory.length - 1].oldDifficulty * 100).toFixed(1) + 
                      "% to " + 
                      (newDifficulty * 100).toFixed(1) + 
                      "% (performance: " + 
                      (performanceScore * 100).toFixed(1) + 
                      "%, success rate: " + 
                      (successRate * 100).toFixed(1) + "%)");
            
            // Apply the new difficulty to game parameters
            this.applyDifficultyToGame(newDifficulty);
            
            return newDifficulty;
        } catch (e) {
            console.error("Error adjusting difficulty: " + e.message);
            return difficultyState.currentDifficulty;
        }
    },
    
    /**
     * Calculates an overall performance score based on recent metrics
     * @return {number} Performance score (0.0 to 1.0)
     */
    calculatePerformanceScore: function() {
        try {
            var metrics = difficultyState.performanceMetrics;
            var factors = difficultyState.adjustmentFactors;
            
            // Calculate normalized scores for each metric
            var scoreNorm = this.normalizeMetric(metrics.recentScores);
            var timeNorm = this.normalizeMetric(metrics.recentSurvivalTimes);
            var coinsNorm = this.normalizeMetric(metrics.recentCoinsCollected);
            var obstaclesNorm = this.normalizeMetric(metrics.recentObstaclesAvoided);
            
            // Calculate weighted average
            var performanceScore = 
                (scoreNorm * factors.scoreWeight) +
                (timeNorm * factors.survivalTimeWeight) +
                (coinsNorm * factors.coinsWeight) +
                (obstaclesNorm * factors.obstaclesWeight);
            
            return Math.min(1.0, Math.max(0.0, performanceScore));
        } catch (e) {
            console.error("Error calculating performance score: " + e.message);
            return 0.5; // Return middle value on error
        }
    },
    
    /**
     * Normalizes a metric array to a 0.0-1.0 scale
     * @param {Array} metricArray - Array of metric values
     * @return {number} Normalized value (0.0 to 1.0)
     */
    normalizeMetric: function(metricArray) {
        if (!metricArray || metricArray.length === 0) return 0.5;
        
        try {
            // Get the most recent value
            var current = metricArray[metricArray.length - 1];
            
            // Calculate average of previous values (excluding most recent)
            var previousValues = metricArray.slice(0, metricArray.length - 1);
            var average = 0;
            
            if (previousValues.length > 0) {
                average = previousValues.reduce(function(sum, value) {
                    return sum + value;
                }, 0) / previousValues.length;
            } else {
                // If no previous values, use predefined baselines
                if (metricArray === difficultyState.performanceMetrics.recentScores) {
                    average = 5000; // Baseline score
                } else if (metricArray === difficultyState.performanceMetrics.recentSurvivalTimes) {
                    average = 60; // Baseline survival time (1 minute)
                } else if (metricArray === difficultyState.performanceMetrics.recentCoinsCollected) {
                    average = 100; // Baseline coins
                } else if (metricArray === difficultyState.performanceMetrics.recentObstaclesAvoided) {
                    average = 50; // Baseline obstacles
                }
            }
            
            // Normalize based on comparison to average
            if (average === 0) return 0.5;
            
            var ratio = current / average;
            
            // Map ratio to 0.0-1.0 scale (ratio of 2.0 maps to 1.0, ratio of 0.0 maps to 0.0)
            var normalized = Math.min(1.0, Math.max(0.0, ratio / 2));
            
            return normalized;
        } catch (e) {
            console.error("Error normalizing metric: " + e.message);
            return 0.5; // Return middle value on error
        }
    },
    
    /**
     * Calculates the player's success rate at current difficulty
     * @return {number} Success rate (0.0 to 1.0)
     */
    calculateSuccessRate: function() {
        try {
            // Use survival time as primary success indicator
            var survivalTimes = difficultyState.performanceMetrics.recentSurvivalTimes;
            if (!survivalTimes || survivalTimes.length === 0) return 0.5;
            
            // Count games that exceeded the success threshold (e.g., 60 seconds)
            var successThreshold = 60; // 1 minute of gameplay is considered a success
            var successCount = 0;
            
            for (var i = 0; i < survivalTimes.length; i++) {
                if (survivalTimes[i] >= successThreshold) {
                    successCount++;
                }
            }
            
            return successCount / survivalTimes.length;
        } catch (e) {
            console.error("Error calculating success rate: " + e.message);
            return 0.5; // Return middle value on error
        }
    },
    
    /**
     * Updates the player's skill estimation based on performance
     * @param {number} performanceScore - Recent performance score (0.0 to 1.0)
     */
    updateSkillEstimation: function(performanceScore) {
        try {
            var skill = difficultyState.skillEstimation;
            
            // Calculate the difference between performance and current skill estimation
            var skillDelta = performanceScore - skill.currentSkillLevel;
            
            // Update skill level with learning rate
            skill.currentSkillLevel += skillDelta * skill.learningRate;
            
            // Ensure skill level stays within bounds
            skill.currentSkillLevel = Math.min(1.0, Math.max(0.0, skill.currentSkillLevel));
            
            // Increase confidence with more games played
            skill.confidenceLevel = Math.min(1.0, skill.confidenceLevel + 0.01);
            
            console.log("Updated skill estimation: " + 
                      (skill.currentSkillLevel * 100).toFixed(1) + 
                      "% (confidence: " + 
                      (skill.confidenceLevel * 100).toFixed(1) + "%)");
        } catch (e) {
            console.error("Error updating skill estimation: " + e.message);
        }
    },
    
    /**
     * Applies the current difficulty level to game parameters
     * @param {number} difficulty - Difficulty level (0.0 to 1.0)
     */
    applyDifficultyToGame: function(difficulty) {
        try {
            // Calculate game parameters based on difficulty
            var gameParams = {
                // Game speed increases with difficulty
                gameSpeed: 1.0 + (difficulty * 0.5), // 1.0 to 1.5x speed
                
                // Obstacle frequency increases with difficulty
                obstacleFrequency: 0.5 + (difficulty * 0.5), // 0.5 to 1.0 frequency
                
                // Coin frequency decreases slightly with difficulty
                coinFrequency: 1.0 - (difficulty * 0.3), // 1.0 to 0.7 frequency
                
                // Powerup frequency decreases with difficulty
                powerupFrequency: 1.0 - (difficulty * 0.7), // 1.0 to 0.3 frequency
                
                // Reaction time window decreases with difficulty
                reactionTimeWindow: 1.0 - (difficulty * 0.6) // 1.0 to 0.4 window
            };
            
            console.log("Applied difficulty parameters: speed=" + 
                      gameParams.gameSpeed.toFixed(2) + 
                      "x, obstacles=" + 
                      gameParams.obstacleFrequency.toFixed(2) + 
                      "x, coins=" + 
                      gameParams.coinFrequency.toFixed(2) + "x");
            
            // Store the parameters for use by other modules
            difficultyState.currentGameParams = gameParams;
            
            // Return the parameters for immediate use
            return gameParams;
        } catch (e) {
            console.error("Error applying difficulty to game: " + e.message);
            return null;
        }
    },
    
    /**
     * Gets the current difficulty level
     * @return {number} Current difficulty (0.0 to 1.0)
     */
    getCurrentDifficulty: function() {
        return difficultyState.currentDifficulty;
    },
    
    /**
     * Gets the current estimated skill level
     * @return {number} Current skill level (0.0 to 1.0)
     */
    getSkillLevel: function() {
        return difficultyState.skillEstimation.currentSkillLevel;
    },
    
    /**
     * Gets the confidence in the skill estimation
     * @return {number} Confidence level (0.0 to 1.0)
     */
    getConfidenceLevel: function() {
        return difficultyState.skillEstimation.confidenceLevel;
    },
    
    /**
     * Gets the current game parameters based on difficulty
     * @return {Object} Game parameters
     */
    getCurrentGameParams: function() {
        return difficultyState.currentGameParams || 
               this.applyDifficultyToGame(difficultyState.currentDifficulty);
    },
    
    /**
     * Gets the player's estimated skill level
     * @return {Object} Skill estimation data
     */
    getSkillEstimation: function() {
        return {
            level: difficultyState.skillEstimation.currentSkillLevel,
            confidence: difficultyState.skillEstimation.confidenceLevel
        };
    },
    
    /**
     * Gets a difficulty adjustment report for UI display
     * @return {Object} Difficulty adjustment report
     */
    getDifficultyReport: function() {
        return {
            currentDifficulty: difficultyState.currentDifficulty,
            skillLevel: difficultyState.skillEstimation.currentSkillLevel,
            gamesPlayed: difficultyState.gamesPlayed,
            lastAdjustment: difficultyState.lastAdjustment,
            difficultyHistory: difficultyState.difficultyHistory,
            performanceMetrics: {
                averageScore: this.calculateAverage(difficultyState.performanceMetrics.recentScores),
                averageSurvivalTime: this.calculateAverage(difficultyState.performanceMetrics.recentSurvivalTimes),
                averageCoins: this.calculateAverage(difficultyState.performanceMetrics.recentCoinsCollected),
                averageObstacles: this.calculateAverage(difficultyState.performanceMetrics.recentObstaclesAvoided)
            },
            successRate: this.calculateSuccessRate()
        };
    },
    
    /**
     * Calculates the average of an array of numbers
     * @param {Array} array - Array of numbers
     * @return {number} Average value
     */
    calculateAverage: function(array) {
        if (!array || array.length === 0) return 0;
        
        var sum = array.reduce(function(total, value) {
            return total + value;
        }, 0);
        
        return sum / array.length;
    }
};