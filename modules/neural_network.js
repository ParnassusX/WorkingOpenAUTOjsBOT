/**
 * Neural Network Module for Subway Surfers Bot
 * Implements a basic neural network for game decision making
 * Part of Phase 5.2: Neural Network Implementation
 */

// Import required modules
var utils = require('./utils.js');
var files = require('files');

// Neural network configuration
var networkConfig = {
    inputNodes: 20,     // Number of input features
    hiddenNodes: 16,    // Number of hidden layer neurons
    outputNodes: 4,     // Number of output actions (left, right, jump, roll)
    learningRate: 0.1,  // Learning rate for training
    activation: 'sigmoid', // Activation function
    initialized: false, // Whether the network has been initialized
    weights: {          // Network weights
        inputToHidden: null,
        hiddenToOutput: null
    },
    biases: {           // Network biases
        hidden: null,
        output: null
    }
};

module.exports = {
    /**
     * Initializes the neural network
     * @param {Object} config - Optional custom configuration
     */
    initialize: function(config) {
        console.log("Initializing neural network...");
        
        // Update configuration if provided
        if (config) {
            if (config.neuralNet) {
                networkConfig.inputNodes = config.neuralNet.inputNodes || networkConfig.inputNodes;
                networkConfig.hiddenNodes = config.neuralNet.hiddenNodes || networkConfig.hiddenNodes;
                networkConfig.outputNodes = config.neuralNet.outputNodes || networkConfig.outputNodes;
                networkConfig.learningRate = config.neuralNet.learningRate || networkConfig.learningRate;
            }
        }
        
        // Initialize weights and biases
        this.initializeWeights();
        
        // Try to load existing model if available
        var modelLoaded = false;
        if (config && config.neuralNet && config.neuralNet.modelPath) {
            modelLoaded = this.loadModel(config.neuralNet.modelPath);
            
            if (!modelLoaded) {
                console.log("No existing model found, using random initialization");
            } else {
                console.log("Successfully loaded model from: " + config.neuralNet.modelPath);
            }
        } else {
            console.log("No model path provided, using random initialization");
        }
        
        networkConfig.initialized = true;
        console.log("Neural network initialized with " + 
                  networkConfig.inputNodes + " inputs, " + 
                  networkConfig.hiddenNodes + " hidden nodes, and " + 
                  networkConfig.outputNodes + " outputs");
    },
    
    /**
     * Initializes network weights with random values
     */
    initializeWeights: function() {
        // Initialize input to hidden weights
        networkConfig.weights.inputToHidden = this.createMatrix(
            networkConfig.hiddenNodes, 
            networkConfig.inputNodes, 
            true // randomize
        );
        
        // Initialize hidden to output weights
        networkConfig.weights.hiddenToOutput = this.createMatrix(
            networkConfig.outputNodes, 
            networkConfig.hiddenNodes, 
            true // randomize
        );
        
        // Initialize biases
        networkConfig.biases.hidden = this.createMatrix(
            networkConfig.hiddenNodes, 
            1, 
            true // randomize
        );
        
        networkConfig.biases.output = this.createMatrix(
            networkConfig.outputNodes, 
            1, 
            true // randomize
        );
    },
    
    /**
     * Creates a matrix with optional random initialization
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @param {boolean} randomize - Whether to randomize values
     * @return {Array} Matrix as 2D array
     */
    createMatrix: function(rows, cols, randomize) {
        var matrix = [];
        
        for (var i = 0; i < rows; i++) {
            matrix[i] = [];
            for (var j = 0; j < cols; j++) {
                if (randomize) {
                    // Initialize with small random values between -0.5 and 0.5
                    matrix[i][j] = Math.random() - 0.5;
                } else {
                    matrix[i][j] = 0;
                }
            }
        }
        
        return matrix;
    },
    
    /**
     * Applies the activation function to a value
     * @param {number} x - Input value
     * @return {number} Activated value
     */
    activate: function(x) {
        // Sigmoid activation function
        if (networkConfig.activation === 'sigmoid') {
            return 1 / (1 + Math.exp(-x));
        }
        // ReLU activation function
        else if (networkConfig.activation === 'relu') {
            return Math.max(0, x);
        }
        // Tanh activation function
        else if (networkConfig.activation === 'tanh') {
            return Math.tanh(x);
        }
        
        // Default to sigmoid
        return 1 / (1 + Math.exp(-x));
    },
    
    /**
     * Derivative of the activation function
     * @param {number} y - Activated value
     * @return {number} Derivative value
     */
    activationDerivative: function(y) {
        // Sigmoid derivative: y * (1 - y)
        if (networkConfig.activation === 'sigmoid') {
            return y * (1 - y);
        }
        // ReLU derivative: 1 if x > 0, 0 otherwise
        else if (networkConfig.activation === 'relu') {
            return y > 0 ? 1 : 0;
        }
        // Tanh derivative: 1 - y^2
        else if (networkConfig.activation === 'tanh') {
            return 1 - (y * y);
        }
        
        // Default to sigmoid derivative
        return y * (1 - y);
    },
    
    /**
     * Performs matrix multiplication: a * b
     * @param {Array} a - First matrix
     * @param {Array} b - Second matrix
     * @return {Array} Result matrix
     */
    matrixMultiply: function(a, b) {
        if (!a || !b || a[0].length !== b.length) {
            console.error("Invalid matrix dimensions for multiplication");
            return null;
        }
        
        var result = [];
        var aRows = a.length;
        var aCols = a[0].length;
        var bCols = b[0].length;
        
        for (var i = 0; i < aRows; i++) {
            result[i] = [];
            for (var j = 0; j < bCols; j++) {
                var sum = 0;
                for (var k = 0; k < aCols; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        
        return result;
    },
    
    /**
     * Adds two matrices element-wise
     * @param {Array} a - First matrix
     * @param {Array} b - Second matrix
     * @return {Array} Result matrix
     */
    matrixAdd: function(a, b) {
        if (!a || !b || a.length !== b.length || a[0].length !== b[0].length) {
            console.error("Invalid matrix dimensions for addition");
            return null;
        }
        
        var result = [];
        var rows = a.length;
        var cols = a[0].length;
        
        for (var i = 0; i < rows; i++) {
            result[i] = [];
            for (var j = 0; j < cols; j++) {
                result[i][j] = a[i][j] + b[i][j];
            }
        }
        
        return result;
    },
    
    /**
     * Applies activation function to each element in a matrix
     * @param {Array} matrix - Input matrix
     * @return {Array} Activated matrix
     */
    activateMatrix: function(matrix) {
        var result = [];
        var rows = matrix.length;
        var cols = matrix[0].length;
        
        for (var i = 0; i < rows; i++) {
            result[i] = [];
            for (var j = 0; j < cols; j++) {
                result[i][j] = this.activate(matrix[i][j]);
            }
        }
        
        return result;
    },
    
    /**
     * Converts game state to neural network input features
     * @param {Object} gameState - Current game state
     * @return {Array} Feature matrix (2D array with 1 row)
     */
    extractFeatures: function(gameState) {
        if (!gameState) {
            console.error("Neural network received null or undefined game state");
            return this.createMatrix(1, networkConfig.inputNodes, false);
        }
        
        // Initialize feature matrix with zeros
        var features = this.createMatrix(1, networkConfig.inputNodes, false);
        
        try {
            // Skip if not in gameplay
            if (gameState.screenType !== "gameplay") {
                return features;
            }
            
            // Feature 1-3: Player position (one-hot encoding)
            if (gameState.playerPosition === "left") {
                features[0][0] = 1;
            } else if (gameState.playerPosition === "center") {
                features[0][1] = 1;
            } else if (gameState.playerPosition === "right") {
                features[0][2] = 1;
            }
            
            // Feature 4-6: Left lane obstacles
            if (gameState.lanes && gameState.lanes.left) {
                features[0][3] = gameState.lanes.left.obstacles ? 1 : 0;
                features[0][4] = gameState.lanes.left.coins ? 1 : 0;
            }
            
            // Feature 7-9: Center lane obstacles
            if (gameState.lanes && gameState.lanes.center) {
                features[0][6] = gameState.lanes.center.obstacles ? 1 : 0;
                features[0][7] = gameState.lanes.center.coins ? 1 : 0;
            }
            
            // Feature 10-12: Right lane obstacles
            if (gameState.lanes && gameState.lanes.right) {
                features[0][9] = gameState.lanes.right.obstacles ? 1 : 0;
                features[0][10] = gameState.lanes.right.coins ? 1 : 0;
            }
            
            // Feature 13-15: Powerups (if available)
            if (gameState.powerups && gameState.powerups.length > 0) {
                for (var i = 0; i < gameState.powerups.length && i < 3; i++) {
                    features[0][12 + i] = 1;
                }
            }
            
            // Feature 16-17: Normalized score and coins (if available)
            if (gameState.score !== undefined) {
                // Normalize score (assuming max score of 100000)
                features[0][15] = Math.min(gameState.score / 100000, 1);
            }
            
            if (gameState.coins !== undefined) {
                // Normalize coins (assuming max coins of 1000)
                features[0][16] = Math.min(gameState.coins / 1000, 1);
            }
            
            // Feature 18-20: Reserved for future use
            // Can be used for additional game state information
            
            return features;
        } catch (e) {
            console.error("Error extracting features: " + e.message);
            return this.createMatrix(1, networkConfig.inputNodes, false);
        }
    },
    
    /**
     * Predicts the best action based on current game state
     * @param {Object} gameState - Current game state
     * @return {Object} Predicted action and confidence
     */
    predict: function(gameState) {
        if (!networkConfig.initialized) {
            console.error("Neural network not initialized");
            return { action: "none", confidence: 0 };
        }
        
        try {
            // Extract features from game state
            var inputFeatures = this.extractFeatures(gameState);
            
            // Forward propagation
            // Hidden layer: input -> hidden
            var hiddenInputs = this.matrixMultiply(networkConfig.weights.inputToHidden, utils.transposeMatrix(inputFeatures));
            hiddenInputs = this.matrixAdd(hiddenInputs, networkConfig.biases.hidden);
            var hiddenOutputs = this.activateMatrix(hiddenInputs);
            
            // Output layer: hidden -> output
            var finalInputs = this.matrixMultiply(networkConfig.weights.hiddenToOutput, hiddenOutputs);
            finalInputs = this.matrixAdd(finalInputs, networkConfig.biases.output);
            var finalOutputs = this.activateMatrix(finalInputs);
            
            // Find the highest confidence prediction
            var maxConfidence = 0;
            var predictedAction = "none";
            var actionMap = ["left", "right", "jump", "roll"];
            
            for (var i = 0; i < finalOutputs.length; i++) {
                var confidence = finalOutputs[i][0];
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    predictedAction = actionMap[i];
                }
            }
            
            return {
                action: predictedAction,
                confidence: maxConfidence,
                allConfidences: {
                    left: finalOutputs[0][0],
                    right: finalOutputs[1][0],
                    jump: finalOutputs[2][0],
                    roll: finalOutputs[3][0]
                }
            };
        } catch (e) {
            console.error("Error making prediction: " + e.message);
            return { action: "none", confidence: 0 };
        }
    },
    
    /**
     * Trains the neural network on a dataset of game states and actions
     * @param {Array} trainingData - Array of {gameState, action} pairs
     * @param {number} epochs - Number of training epochs
     * @param {function} progressCallback - Optional callback for progress updates
     * @return {Object} Training results
     */
    train: function(trainingData, epochs, progressCallback) {
        if (!networkConfig.initialized) {
            console.error("Neural network not initialized");
            return { success: false, error: "Network not initialized" };
        }
        
        if (!trainingData || !Array.isArray(trainingData) || trainingData.length === 0) {
            console.error("Invalid training data provided");
            return { success: false, error: "Invalid training data" };
        }
        
        epochs = epochs || 1;
        var batchSize = 10; // Process 10 samples at a time
        var totalSamples = trainingData.length;
        var actionMap = { "left": 0, "right": 1, "jump": 2, "roll": 3 };
        var errors = [];
        
        console.log("Starting training with " + totalSamples + " samples for " + epochs + " epochs");
        
        try {
            // Training loop
            for (var epoch = 0; epoch < epochs; epoch++) {
                var epochError = 0;
                
                // Shuffle training data for each epoch
                var shuffledData = this.shuffleArray(trainingData);
                
                // Process in batches
                for (var batchStart = 0; batchStart < totalSamples; batchStart += batchSize) {
                    var batchEnd = Math.min(batchStart + batchSize, totalSamples);
                    var batchError = 0;
                    
                    // Process each sample in the batch
                    for (var i = batchStart; i < batchEnd; i++) {
                        var sample = shuffledData[i];
                        var gameState = sample.gameState;
                        var targetAction = sample.action;
                        
                        // Skip invalid samples
                        if (!gameState || !targetAction || !(targetAction in actionMap)) {
                            continue;
                        }
                        
                        // Create target output (one-hot encoding)
                        var targetOutput = this.createMatrix(networkConfig.outputNodes, 1, false);
                        targetOutput[actionMap[targetAction]][0] = 1;
                        
                        // Extract features
                        var inputFeatures = this.extractFeatures(gameState);
                        
                        // Forward pass
                        // Hidden layer
                        var hiddenInputs = this.matrixMultiply(
                            networkConfig.weights.inputToHidden, 
                            utils.transposeMatrix(inputFeatures)
                        );
                        hiddenInputs = this.matrixAdd(hiddenInputs, networkConfig.biases.hidden);
                        var hiddenOutputs = this.activateMatrix(hiddenInputs);
                        
                        // Output layer
                        var finalInputs = this.matrixMultiply(
                            networkConfig.weights.hiddenToOutput,
                            hiddenOutputs
                        );
                        finalInputs = this.matrixAdd(finalInputs, networkConfig.biases.output);
                        var finalOutputs = this.activateMatrix(finalInputs);
                        
                        // Calculate output layer error
                        var outputErrors = [];
                        for (var j = 0; j < networkConfig.outputNodes; j++) {
                            outputErrors[j] = [];
                            outputErrors[j][0] = targetOutput[j][0] - finalOutputs[j][0];
                        }
                        
                        // Calculate hidden layer error
                        var transposedHiddenToOutput = utils.transposeMatrix(networkConfig.weights.hiddenToOutput);
                        var hiddenErrors = this.matrixMultiply(transposedHiddenToOutput, outputErrors);
                        
                        // Update hidden to output weights
                        for (var j = 0; j < networkConfig.outputNodes; j++) {
                            for (var k = 0; k < networkConfig.hiddenNodes; k++) {
                                var delta = outputErrors[j][0] * 
                                          this.activationDerivative(finalOutputs[j][0]) * 
                                          hiddenOutputs[k][0] * 
                                          networkConfig.learningRate;
                                          
                                networkConfig.weights.hiddenToOutput[j][k] += delta;
                            }
                            // Update output bias
                            networkConfig.biases.output[j][0] += outputErrors[j][0] * 
                                                              this.activationDerivative(finalOutputs[j][0]) * 
                                                              networkConfig.learningRate;
                        }
                        
                        // Update input to hidden weights
                        for (var j = 0; j < networkConfig.hiddenNodes; j++) {
                            for (var k = 0; k < networkConfig.inputNodes; k++) {
                                var delta = hiddenErrors[j][0] * 
                                          this.activationDerivative(hiddenOutputs[j][0]) * 
                                          inputFeatures[0][k] * 
                                          networkConfig.learningRate;
                                          
                                networkConfig.weights.inputToHidden[j][k] += delta;
                            }
                            // Update hidden bias
                            networkConfig.biases.hidden[j][0] += hiddenErrors[j][0] * 
                                                              this.activationDerivative(hiddenOutputs[j][0]) * 
                                                              networkConfig.learningRate;
                        }
                        
                        // Calculate error for this sample
                        var sampleError = 0;
                        for (var j = 0; j < outputErrors.length; j++) {
                            sampleError += Math.abs(outputErrors[j][0]);
                        }
                        batchError += sampleError / outputErrors.length;
                    }
                    
                    // Average batch error
                    batchError = batchError / (batchEnd - batchStart);
                    epochError += batchError;
                    
                    // Report progress if callback provided
                    if (progressCallback && typeof progressCallback === 'function') {
                        var progress = {
                            epoch: epoch + 1,
                            totalEpochs: epochs,
                            batchStart: batchStart,
                            batchEnd: batchEnd,
                            totalSamples: totalSamples,
                            batchError: batchError
                        };
                        progressCallback(progress);
                    }
                }
                
                // Average epoch error
                epochError = epochError / Math.ceil(totalSamples / batchSize);
                errors.push(epochError);
                
                console.log("Epoch " + (epoch + 1) + "/" + epochs + ", Error: " + epochError.toFixed(4));
            }
            
            console.log("Training completed with final error: " + errors[errors.length - 1].toFixed(4));
            
            return {
                success: true,
                epochs: epochs,
                errors: errors,
                finalError: errors[errors.length - 1],
                samplesProcessed: totalSamples
            };
        } catch (e) {
            console.error("Error during training: " + e.message);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Shuffles an array randomly
     * @param {Array} array - Array to shuffle
     * @return {Array} Shuffled array
     */
    shuffleArray: function(array) {
        var shuffled = array.slice(0);
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    },
    
    /**
     * Saves the neural network model to a file
     * @param {string} filePath - Path to save the model
     * @return {boolean} Success status
     */
    saveModel: function(filePath) {
        if (!networkConfig.initialized) {
            console.error("Cannot save model: Neural network not initialized");
            return false;
        }
        
        try {
            // Create model data object
            var modelData = {
                config: {
                    inputNodes: networkConfig.inputNodes,
                    hiddenNodes: networkConfig.hiddenNodes,
                    outputNodes: networkConfig.outputNodes,
                    learningRate: networkConfig.learningRate,
                    activation: networkConfig.activation
                },
                weights: {
                    inputToHidden: networkConfig.weights.inputToHidden,
                    hiddenToOutput: networkConfig.weights.hiddenToOutput
                },
                biases: {
                    hidden: networkConfig.biases.hidden,
                    output: networkConfig.biases.output
                },
                metadata: {
                    timestamp: new Date().getTime(),
                    version: "1.0"
                }
            };
            
            // Convert to JSON string
            var modelJson = JSON.stringify(modelData);
            
            // Ensure directory exists
            var modelDir = filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
            
            // Try multiple paths if the primary one fails
            var success = false;
            
            // First try the provided path
            try {
                if (!files.exists(modelDir)) {
                    files.createWithDirs(modelDir);
                }
                files.write(filePath, modelJson);
                success = true;
            } catch (pathError) {
                console.log("Could not save to primary path: " + pathError.message + ". Trying alternative paths...");
            }
            
            // If primary path fails, try alternative paths for MEmu emulator
            if (!success) {
                var altPaths = [
                    "/storage/emulated/0/SubwayBot/model/model.json",
                    "/sdcard/SubwayBot/model/model.json",
                    "./model/model.json"
                ];
                
                for (var i = 0; i < altPaths.length; i++) {
                    try {
                        var altDir = altPaths[i].substring(0, Math.max(altPaths[i].lastIndexOf('/'), altPaths[i].lastIndexOf('\\')));
                        if (!files.exists(altDir)) {
                            files.createWithDirs(altDir);
                        }
                        files.write(altPaths[i], modelJson);
                        console.log("Model saved to alternative path: " + altPaths[i]);
                        success = true;
                        break;
                    } catch (altError) {
                        console.log("Could not save to alternative path: " + altPaths[i]);
                    }
                }
            }
            
            if (success) {
                console.log("Model successfully saved to: " + filePath);
                return true;
            } else {
                throw new Error("Failed to save model to any available path");
            }
        } catch (e) {
            console.error("Error saving model: " + e.message);
            return false;
        }
    },
    
    /**
     * Saves the model with a timestamp in the filename
     * @param {string} baseDir - Base directory to save the model
     * @param {string} prefix - Optional prefix for the filename
     * @return {boolean} Success status
     */
    saveModelWithTimestamp: function(baseDir, prefix) {
        if (!networkConfig.initialized) {
            console.error("Cannot save model: Neural network not initialized");
            return false;
        }
        
        try {
            // Create timestamp
            var now = new Date();
            var timestamp = now.getFullYear() + "-" +
                           ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
                           ("0" + now.getDate()).slice(-2) + "_" +
                           ("0" + now.getHours()).slice(-2) + "-" +
                           ("0" + now.getMinutes()).slice(-2) + "-" +
                           ("0" + now.getSeconds()).slice(-2);
            
            // Create filename with prefix if provided
            var filename = (prefix ? prefix + "_" : "") + "model_" + timestamp + ".json";
            
            // Ensure directory path ends with a slash
            if (baseDir.charAt(baseDir.length - 1) !== '/' && baseDir.charAt(baseDir.length - 1) !== '\\') {
                baseDir += '/';
            }
            
            // Full path
            var fullPath = baseDir + filename;
            
            // Save the model
            return this.saveModel(fullPath);
        } catch (e) {
            console.error("Error saving model with timestamp: " + e.message);
            return false;
        }
    },
    
    /**
     * Loads a neural network model from a file
     * @param {string} filePath - Path to load the model from
     * @return {boolean} Success status
     */
    loadModel: function(filePath) {
        try {
            // Check if file exists
            if (!files.exists(filePath)) {
                console.error("Model file not found: " + filePath);
                return false;
            }
            
            // Read and parse model file
            var modelJson = files.read(filePath);
            var modelData = JSON.parse(modelJson);
            
            // Validate model structure
            if (!this.validateModel(modelData)) {
                console.error("Invalid model format");
                return false;
            }
            
            // Update network configuration
            networkConfig.inputNodes = modelData.config.inputNodes;
            networkConfig.hiddenNodes = modelData.config.hiddenNodes;
            networkConfig.outputNodes = modelData.config.outputNodes;
            networkConfig.learningRate = modelData.config.learningRate;
            networkConfig.activation = modelData.config.activation;
            
            // Load weights and biases
            networkConfig.weights.inputToHidden = modelData.weights.inputToHidden;
            networkConfig.weights.hiddenToOutput = modelData.weights.hiddenToOutput;
            networkConfig.biases.hidden = modelData.biases.hidden;
            networkConfig.biases.output = modelData.biases.output;
            
            console.log("Model successfully loaded from: " + filePath);
            return true;
        } catch (e) {
            console.error("Error loading model: " + e.message);
            return false;
        }
    },
    
    /**
     * Validates the structure of a loaded model
     * @param {Object} modelData - The loaded model data
     * @return {boolean} Whether the model is valid
     */
    validateModel: function(modelData) {
        // Check if all required properties exist
        if (!modelData.config || !modelData.weights || !modelData.biases) {
            return false;
        }
        
        // Check config parameters
        var config = modelData.config;
        if (!config.inputNodes || !config.hiddenNodes || !config.outputNodes) {
            return false;
        }
        
        // Check weights
        var weights = modelData.weights;
        if (!weights.inputToHidden || !weights.hiddenToOutput) {
            return false;
        }
        
        // Check biases
        var biases = modelData.biases;
        if (!biases.hidden || !biases.output) {
            return false;
        }
        
        // Check dimensions
        if (weights.inputToHidden.length !== config.hiddenNodes ||
            weights.inputToHidden[0].length !== config.inputNodes ||
            weights.hiddenToOutput.length !== config.outputNodes ||
            weights.hiddenToOutput[0].length !== config.hiddenNodes ||
            biases.hidden.length !== config.hiddenNodes ||
            biases.output.length !== config.outputNodes) {
            return false;
        }
        
        return true;
    }
};