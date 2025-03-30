/**
 * Reinforcement Learning Module for Subway Surfers Bot
 * Implements advanced AI features with reinforcement learning capabilities
 * Part of Phase 5.3: Advanced AI Features implementation
 */

// Import required modules
var utils = require('./utils.js');
var neuralNetwork = require('./neural_network.js');
var files = require('files');

// Reinforcement learning configuration
var rlConfig = {
    // Learning parameters
    learningRate: 0.1,       // Rate at which the agent learns from new experiences
    discountFactor: 0.95,    // How much future rewards are valued (gamma)
    explorationRate: 0.2,    // Initial exploration rate (epsilon)
    minExplorationRate: 0.01, // Minimum exploration rate
    explorationDecay: 0.995, // Rate at which exploration decreases
    
    // Experience replay buffer
    replayBuffer: [],        // Stores past experiences for batch learning
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
    },
    
    // State tracking
    currentState: null,      // Current game state
    lastState: null,         // Previous game state
    lastAction: null,        // Last action taken
    lastReward: 0,           // Last reward received
    episodeRewards: [],      // Rewards for each episode
    initialized: false       // Whether the RL system has been initialized
};

module.exports = {
    /**
     * Initializes the reinforcement learning module
     * @param {Object} config - Optional custom configuration
     */
    initialize: function(config) {
        console.log("Initializing reinforcement learning module...");
        
        // Update configuration if provided
        if (config && config.reinforcementLearning) {
            var rlSettings = config.reinforcementLearning;
            rlConfig.learningRate = rlSettings.learningRate || rlConfig.learningRate;
            rlConfig.discountFactor = rlSettings.discountFactor || rlConfig.discountFactor;
            rlConfig.explorationRate = rlSettings.explorationRate || rlConfig.explorationRate;
            rlConfig.minExplorationRate = rlSettings.minExplorationRate || rlConfig.minExplorationRate;
            rlConfig.explorationDecay = rlSettings.explorationDecay || rlConfig.explorationDecay;
            rlConfig.replayBufferSize = rlSettings.replayBufferSize || rlConfig.replayBufferSize;
            rlConfig.miniBatchSize = rlSettings.miniBatchSize || rlConfig.miniBatchSize;
            
            // Update reward values if provided
            if (rlSettings.rewards) {
                for (var rewardType in rlSettings.rewards) {
                    if (rlConfig.rewards.hasOwnProperty(rewardType)) {
                        rlConfig.rewards[rewardType] = rlSettings.rewards[rewardType];
                    }
                }
            }
        }
        
        // Initialize neural network if not already initialized
        if (!neuralNetwork.isInitialized()) {
            neuralNetwork.initialize(config);
        }
        
        // Try to load existing replay buffer if available
        this.loadReplayBuffer(config);
        
        rlConfig.initialized = true;
        console.log("Reinforcement learning module initialized with learning rate: " + 
                  rlConfig.learningRate + ", discount factor: " + 
                  rlConfig.discountFactor + ", exploration rate: " + 
                  rlConfig.explorationRate);
    },
    
    /**
     * Loads the replay buffer from storage if available
     * @param {Object} config - Configuration object with paths
     */
    loadReplayBuffer: function(config) {
        try {
            var bufferPath = "/storage/emulated/0/SubwayBot/data/replay_buffer.json";
            if (config && config.reinforcementLearning && config.reinforcementLearning.bufferPath) {
                bufferPath = config.reinforcementLearning.bufferPath;
            }
            
            if (files.exists(bufferPath)) {
                var bufferData = files.read(bufferPath);
                var parsedBuffer = JSON.parse(bufferData);
                
                // Validate and use the loaded buffer
                if (Array.isArray(parsedBuffer) && parsedBuffer.length > 0) {
                    rlConfig.replayBuffer = parsedBuffer.slice(0, rlConfig.replayBufferSize);
                    console.log("Loaded replay buffer with " + rlConfig.replayBuffer.length + " experiences");
                }
            } else {
                console.log("No existing replay buffer found, starting with empty buffer");
            }
        } catch (e) {
            console.error("Error loading replay buffer: " + e.message);
            // Start with empty buffer on error
            rlConfig.replayBuffer = [];
        }
    },
    
    /**
     * Saves the replay buffer to storage
     * @param {Object} config - Configuration object with paths
     */
    saveReplayBuffer: function(config) {
        try {
            var bufferPath = "/storage/emulated/0/SubwayBot/data/replay_buffer.json";
            if (config && config.reinforcementLearning && config.reinforcementLearning.bufferPath) {
                bufferPath = config.reinforcementLearning.bufferPath;
            }
            
            // Ensure directory exists
            var dirPath = bufferPath.substring(0, bufferPath.lastIndexOf('/'));
            if (!files.exists(dirPath)) {
                files.createWithDirs(dirPath);
            }
            
            // Save buffer to file
            files.write(bufferPath, JSON.stringify(rlConfig.replayBuffer));
            console.log("Saved replay buffer with " + rlConfig.replayBuffer.length + " experiences");
        } catch (e) {
            console.error("Error saving replay buffer: " + e.message);
        }
    },
    
    /**
     * Chooses an action based on the current state using epsilon-greedy policy
     * @param {Object} gameState - Current game state
     * @return {string} Selected action ("left", "right", "jump", "roll", or "none")
     */
    selectAction: function(gameState) {
        if (!rlConfig.initialized) {
            console.error("Reinforcement learning module not initialized");
            return "none";
        }
        
        // Update current state
        rlConfig.lastState = rlConfig.currentState;
        rlConfig.currentState = gameState;
        
        // Skip if not in gameplay
        if (gameState.screenType !== "gameplay") {
            return "none";
        }
        
        // Epsilon-greedy action selection
        if (Math.random() < rlConfig.explorationRate) {
            // Exploration: choose random action
            var actions = ["left", "right", "jump", "roll", "none"];
            var randomAction = actions[Math.floor(Math.random() * actions.length)];
            rlConfig.lastAction = randomAction;
            return randomAction;
        } else {
            // Exploitation: choose best action according to neural network
            var features = neuralNetwork.extractFeatures(gameState);
            var prediction = neuralNetwork.predict(features);
            
            // Find action with highest Q-value
            var maxIndex = 0;
            for (var i = 1; i < prediction[0].length; i++) {
                if (prediction[0][i] > prediction[0][maxIndex]) {
                    maxIndex = i;
                }
            }
            
            // Map index to action
            var actionMap = ["left", "right", "jump", "roll"];
            var bestAction = maxIndex < actionMap.length ? actionMap[maxIndex] : "none";
            
            rlConfig.lastAction = bestAction;
            return bestAction;
        }
    },
    
    /**
     * Calculates reward based on current and previous game states
     * @param {Object} currentState - Current game state
     * @param {Object} previousState - Previous game state
     * @param {string} action - Action taken
     * @param {boolean} isDead - Whether the player died
     * @return {number} Calculated reward
     */
    calculateReward: function(currentState, previousState, action, isDead) {
        if (!currentState || !previousState) {
            return 0;
        }
        
        var reward = 0;
        
        // Reward for survival
        reward += rlConfig.rewards.survival;
        
        // Reward for distance traveled
        if (currentState.score > previousState.score) {
            var scoreDiff = currentState.score - previousState.score;
            reward += scoreDiff * rlConfig.rewards.distance;
        }
        
        // Reward for collecting coins
        if (currentState.coins > previousState.coins) {
            var coinsDiff = currentState.coins - previousState.coins;
            reward += coinsDiff * rlConfig.rewards.coin;
        }
        
        // Reward for collecting powerups
        if (currentState.powerups && previousState.powerups) {
            var newPowerups = currentState.powerups.filter(function(p) {
                return !previousState.powerups.includes(p);
            });
            reward += newPowerups.length * rlConfig.rewards.powerup;
        }
        
        // Penalty for hitting obstacles or dying
        if (isDead) {
            reward += rlConfig.rewards.death;
        }
        
        // Store the reward
        rlConfig.lastReward = reward;
        
        return reward;
    },
    
    /**
     * Adds an experience to the replay buffer
     * @param {Object} state - Current state
     * @param {string} action - Action taken
     * @param {number} reward - Reward received
     * @param {Object} nextState - Next state
     * @param {boolean} done - Whether the episode is done
     */
    addExperience: function(state, action, reward, nextState, done) {
        // Create experience object
        var experience = {
            state: state,
            action: action,
            reward: reward,
            nextState: nextState,
            done: done,
            timestamp: Date.now()
        };
        
        // Add to replay buffer
        rlConfig.replayBuffer.push(experience);
        
        // Limit buffer size
        if (rlConfig.replayBuffer.length > rlConfig.replayBufferSize) {
            rlConfig.replayBuffer.shift(); // Remove oldest experience
        }
    },
    
    /**
     * Trains the neural network using a random batch from the replay buffer
     */
    trainFromReplayBuffer: function() {
        if (rlConfig.replayBuffer.length < rlConfig.miniBatchSize) {
            // Not enough experiences to train
            return;
        }
        
        // Select random mini-batch
        var batchIndices = [];
        for (var i = 0; i < rlConfig.miniBatchSize; i++) {
            var randomIndex = Math.floor(Math.random() * rlConfig.replayBuffer.length);
            batchIndices.push(randomIndex);
        }
        
        // Process each experience in the batch
        for (var j = 0; j < batchIndices.length; j++) {
            var experience = rlConfig.replayBuffer[batchIndices[j]];
            
            // Extract features from states
            var stateFeatures = neuralNetwork.extractFeatures(experience.state);
            var nextStateFeatures = neuralNetwork.extractFeatures(experience.nextState);
            
            // Get current Q values
            var currentQ = neuralNetwork.predict(stateFeatures);
            
            // Get next Q values
            var nextQ = neuralNetwork.predict(nextStateFeatures);
            
            // Find max Q value for next state
            var maxNextQ = 0;
            for (var k = 0; k < nextQ[0].length; k++) {
                if (nextQ[0][k] > maxNextQ) {
                    maxNextQ = nextQ[0][k];
                }
            }
            
            // Map action to index
            var actionMap = {"left": 0, "right": 1, "jump": 2, "roll": 3, "none": 4};
            var actionIndex = actionMap[experience.action] || 0;
            
            // Calculate target Q value using Q-learning formula
            var targetQ = experience.reward;
            if (!experience.done) {
                targetQ += rlConfig.discountFactor * maxNextQ;
            }
            
            // Update Q value for the action taken
            var updatedQ = currentQ.slice();
            if (actionIndex < updatedQ[0].length) {
                updatedQ[0][actionIndex] = (1 - rlConfig.learningRate) * updatedQ[0][actionIndex] + 
                                         rlConfig.learningRate * targetQ;
            }
            
            // Train network with this sample
            neuralNetwork.train(stateFeatures, updatedQ);
        }
        
        // Decay exploration rate
        rlConfig.explorationRate = Math.max(
            rlConfig.minExplorationRate, 
            rlConfig.explorationRate * rlConfig.explorationDecay
        );
        
        // If adaptive difficulty module is provided, adjust exploration rate based on skill level
        if (adaptiveDifficulty && typeof adaptiveDifficulty.getSkillLevel === 'function') {
            var skillLevel = adaptiveDifficulty.getSkillLevel();
            // Adjust exploration rate inversely to skill level
            // Higher skill = lower exploration (more exploitation)
            var skillAdjustment = 1.0 - (skillLevel * 0.5); // Scale factor
            rlConfig.explorationRate = Math.max(
                rlConfig.minExplorationRate,
                rlConfig.explorationRate * skillAdjustment
            );
        }
    },
    
    /**
     * Updates the reinforcement learning agent with a new state and reward
     * @param {Object} gameState - Current game state
     * @param {boolean} isDead - Whether the player died
     */
    update: function(gameState, isDead) {
        if (!rlConfig.initialized || !rlConfig.currentState || !rlConfig.lastAction) {
            // Not enough information to update
            rlConfig.currentState = gameState;
            return;
        }
        
        // Calculate reward
        var reward = this.calculateReward(gameState, rlConfig.currentState, rlConfig.lastAction, isDead);
        
        // Add experience to replay buffer
        this.addExperience(
            rlConfig.currentState,
            rlConfig.lastAction,
            reward,
            gameState,
            isDead
        );
        
        // Train from replay buffer periodically
        this.trainFromReplayBuffer();
        
        // Update current state
        rlConfig.currentState = gameState;
        
        // Track episode rewards
        if (isDead) {
            // End of episode
            rlConfig.episodeRewards.push({
                timestamp: Date.now(),
                totalReward: rlConfig.lastReward,
                explorationRate: rlConfig.explorationRate
            });
            
            // Limit episode history
            if (rlConfig.episodeRewards.length > 100) {
                rlConfig.episodeRewards.shift();
            }
        }
    },
    
    /**
     * Gets performance metrics for the reinforcement learning agent
     * @return {Object} Performance metrics
     */
    getPerformanceMetrics: function() {
        var metrics = {
            explorationRate: rlConfig.explorationRate,
            replayBufferSize: rlConfig.replayBuffer.length,
            episodeCount: rlConfig.episodeRewards.length,
            averageReward: 0,
            recentRewards: []
        };
        
        // Calculate average reward
        if (rlConfig.episodeRewards.length > 0) {
            var totalReward = 0;
            var recentEpisodes = rlConfig.episodeRewards.slice(-10); // Last 10 episodes
            
            for (var i = 0; i < recentEpisodes.length; i++) {
                totalReward += recentEpisodes[i].totalReward;
                metrics.recentRewards.push(recentEpisodes[i].totalReward);
            }
            
            metrics.averageReward = totalReward / recentEpisodes.length;
        }
        
        return metrics;
    },
    
    /**
     * Resets the reinforcement learning agent for a new episode
     */
    resetEpisode: function() {
        rlConfig.currentState = null;
        rlConfig.lastState = null;
        rlConfig.lastAction = null;
        rlConfig.lastReward = 0;
    },
    
    /**
     * Checks if the reinforcement learning module is initialized
     * @return {boolean} Whether the module is initialized
     */
    isInitialized: function() {
        return rlConfig.initialized;
    },
    
    /**
     * Gets the current configuration
     * @return {Object} Current configuration
     */
    getConfig: function() {
        return rlConfig;
    }
};