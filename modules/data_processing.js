/**
 * Data Processing Module for Subway Surfers Bot
 * Handles data cleaning, normalization, feature extraction, and dataset management
 * Part of Phase 4.3: Data Processing implementation
 */

// Import dataset versioning module
var datasetVersioning = require('./dataset_versioning.js');

// Storage for processed data statistics
var dataStats = {
    samplesProcessed: 0,
    lastProcessingTime: 0,
    featureDistribution: {},
    datasetVersions: []
};

module.exports = {
    /**
     * Configuration for data processing
     */
    config: {
        // Normalization settings
        normalization: {
            enabled: true,
            method: "min-max", // "min-max" or "z-score"
            featureRanges: {}
        },        // Cleaning settings
        cleaning: {
            removeOutliers: true,
            outlierThreshold: 3.0, // Standard deviations for z-score outlier detection
            removeIncomplete: true,
            deduplication: true
        },        // Feature extraction settings
        featureExtraction: {
            enabled: true,
            extractColors: true,
            extractShapes: true,
            extractPositions: true,
            extractTimings: true
        },        // Data augmentation settings
        augmentation: {
            enabled: false,
            methods: ["rotation", "noise", "colorShift"],
            augmentationFactor: 2 // How many augmented samples to create per original
        },        // Dataset versioning
        versioning: {
            enabled: true,
            maxVersions: 5,
            autoVersion: true
        }
    },    
    /**
     * Initializes the data processing module
     * @param {Object} customConfig - Optional custom configuration
     */
    initialize: function(customConfig) {
        console.log("Initializing data processing module...");
        
        // Merge custom config if provided
        if (customConfig) {
            this.mergeConfig(customConfig);
        }
        
        // Load previous statistics if available
        this.loadStats();
        
        console.log("Data processing module initialized with " + 
                  dataStats.samplesProcessed + " previously processed samples");
    },    
    /**
     * Merges custom configuration with default configuration
     * @param {Object} customConfig - Custom configuration to merge
     */
    mergeConfig: function(customConfig) {
        try {
            // Deep merge configuration objects
            for (var section in customConfig) {
                if (this.config[section]) {
                    for (var option in customConfig[section]) {
                        this.config[section][option] = customConfig[section][option];
                    }
                } else {
                    this.config[section] = customConfig[section];
                }
            }
            console.log("Configuration updated successfully");
        } catch (e) {
            console.error("Error merging configurations: " + e.message);
        }
    },    
    /**
     * Loads statistics from storage
     */
    loadStats: function() {
        try {
            var statsPath = "/storage/emulated/0/SubwayBot/data/processing_stats.json";
            if (files.exists(statsPath)) {
                var statsData = files.read(statsPath);
                var parsedStats = JSON.parse(statsData);
                
                // Update stats with loaded data
                dataStats.samplesProcessed = parsedStats.samplesProcessed || 0;
                dataStats.lastProcessingTime = parsedStats.lastProcessingTime || 0;
                dataStats.featureDistribution = parsedStats.featureDistribution || {};
                dataStats.datasetVersions = parsedStats.datasetVersions || [];
                
                console.log("Loaded processing statistics from storage");
            } else {
                console.log("No previous statistics found, using defaults");
            }
        } catch (e) {
            console.error("Error loading statistics: " + e.message);
        }
    },    
    /**
     * Saves statistics to storage
     */
    saveStats: function() {
        try {
            var statsPath = "/storage/emulated/0/SubwayBot/data/processing_stats.json";
            var statsDir = "/storage/emulated/0/SubwayBot/data/";
            
            // Ensure directory exists
            if (!files.exists(statsDir)) {
                files.createWithDirs(statsDir);
            }
            
            // Save stats as JSON
            var statsJson = JSON.stringify(dataStats, null, 2);
            files.write(statsPath, statsJson);
            
            console.log("Saved processing statistics to storage");
        } catch (e) {
            console.error("Error saving statistics: " + e.message);
        }
    },    
    /**
     * Creates a new dataset version with metadata
     * @param {Array} dataset - Dataset to version
     * @param {Object} metadata - Optional metadata about the version
     * @param {string} basePath - Base storage path
     * @return {string} Version ID or null on failure
     */
    createDatasetVersion: function(dataset, metadata, basePath) {
        if (!this.config.versioning.enabled) {
            console.log("Dataset versioning is disabled");
            return null;
        }
        
        try {
            console.log("Creating new dataset version with " + dataset.length + " samples");
            
            // Add processing information to metadata
            var versionMetadata = metadata || {};
            versionMetadata.processing = {
                normalization: this.config.normalization.enabled ? this.config.normalization.method : "none",
                cleaning: {
                    outliers_removed: this.config.cleaning.removeOutliers,
                    deduplication: this.config.cleaning.deduplication
                },
                augmentation: this.config.augmentation.enabled ? this.config.augmentation.methods : []
            };
            
            // Create and save version using the versioning module
            var versionId = datasetVersioning.createAndManageDatasetVersion(
                dataset, 
                versionMetadata, 
                basePath, 
                this.config.versioning.maxVersions
            );
            
            if (versionId) {
                // Update local version tracking
                dataStats.datasetVersions.push({
                    id: versionId,
                    timestamp: Date.now(),
                    sample_count: dataset.length
                });
                
                // Save updated stats
                this.saveStats();
                
                console.log("Created dataset version: " + versionId);
            }
            
            return versionId;
        } catch (e) {
            console.error("Error creating dataset version: " + e.message);
            return null;
        }
    },
    
    /**
     * Loads a specific dataset version
     * @param {string} versionId - Version ID to load
     * @param {string} basePath - Base storage path
     * @return {Array} Dataset or null if not found
     */
    loadDatasetVersion: function(versionId, basePath) {
        try {
            console.log("Loading dataset version: " + versionId);
            
            var versionedDataset = datasetVersioning.loadDatasetVersion(versionId, basePath);
            if (!versionedDataset) {
                return null;
            }
            
            return versionedDataset.data;
        } catch (e) {
            console.error("Error loading dataset version: " + e.message);
            return null;
        }
    },
    
    /**
     * Lists all available dataset versions
     * @param {string} basePath - Base storage path
     * @return {Array} List of version metadata
     */
    listDatasetVersions: function(basePath) {
        try {
            return datasetVersioning.listDatasetVersions(basePath);
        } catch (e) {
            console.error("Error listing dataset versions: " + e.message);
            return [];
        }
    },
    
    /**
     * Compares two dataset versions
     * @param {string} versionId1 - First version ID
     * @param {string} versionId2 - Second version ID
     * @param {string} basePath - Base storage path
     * @return {Object} Comparison results
     */
    compareDatasetVersions: function(versionId1, versionId2, basePath) {
        try {
            return datasetVersioning.compareDatasetVersions(versionId1, versionId2, basePath);
        } catch (e) {
            console.error("Error comparing dataset versions: " + e.message);
            return null;
        }
    },
    
    /**
     * Cleans a dataset by removing outliers, incomplete samples, and duplicates
     * @param {Array} dataset - Array of data samples to clean
     * @return {Array} Cleaned dataset
     */
    cleanDataset: function(dataset) {
        console.log("Cleaning dataset with " + dataset.length + " samples");
        var startTime = Date.now();
        var cleanedDataset = dataset;
        
        try {
            // Remove incomplete samples
            if (this.config.cleaning.removeIncomplete) {
                cleanedDataset = this.removeIncompleteSamples(cleanedDataset);
                console.log("After removing incomplete: " + cleanedDataset.length + " samples");
            }
            
            // Remove duplicates
            if (this.config.cleaning.deduplication) {
                cleanedDataset = this.removeDuplicates(cleanedDataset);
                console.log("After deduplication: " + cleanedDataset.length + " samples");
            }
            
            // Remove outliers
            if (this.config.cleaning.removeOutliers) {
                cleanedDataset = this.removeOutliers(cleanedDataset);
                console.log("After removing outliers: " + cleanedDataset.length + " samples");
            }
            
            // Update statistics
            dataStats.samplesProcessed += dataset.length;
            dataStats.lastProcessingTime = Date.now();
            
            var processingTime = Date.now() - startTime;
            console.log("Dataset cleaned in " + processingTime + "ms");
            
            return cleanedDataset;
        } catch (e) {
            console.error("Error cleaning dataset: " + e.message);
            return dataset; // Return original dataset on error
        }
    },
    
    /**
     * Removes incomplete samples from a dataset
     * @param {Array} dataset - Dataset to process
     * @return {Array} Dataset with incomplete samples removed
     */
    removeIncompleteSamples: function(dataset) {
        return dataset.filter(function(sample) {
            // Check for required fields
            if (!sample || !sample.gameState || !sample.action) {
                return false;
            }
            
            // Check for required gameState properties
            if (!sample.gameState.screenType || 
                !sample.gameState.lanes || 
                !sample.gameState.timestamp) {
                return false;
            }
            
            return true;
        });
    },
    
    /**
     * Removes duplicate samples from a dataset
     * @param {Array} dataset - Dataset to process
     * @return {Array} Dataset with duplicates removed
     */
    removeDuplicates: function(dataset) {
        var uniqueKeys = {};
        var uniqueDataset = [];
        
        dataset.forEach(function(sample) {
            // Create a key based on timestamp and action
            var key = sample.gameState.timestamp + '_' + sample.action;
            
            // Only add if this key hasn't been seen before
            if (!uniqueKeys[key]) {
                uniqueKeys[key] = true;
                uniqueDataset.push(sample);
            }
        });
        
        return uniqueDataset;
    },
    
    /**
     * Removes outlier samples from a dataset
     * @param {Array} dataset - Dataset to process
     * @return {Array} Dataset with outliers removed
     */
    removeOutliers: function(dataset) {
        // Calculate z-scores for numeric features
        var features = this.extractNumericFeatures(dataset);
        var outlierIndices = {};
        
        // For each feature, identify outliers
        for (var feature in features) {
            var values = features[feature];
            var mean = this.calculateMean(values);
            var stdDev = this.calculateStdDev(values, mean);
            
            // Skip features with zero standard deviation
            if (stdDev === 0) continue;
            
            // Find outliers based on z-score
            for (var i = 0; i < values.length; i++) {
                var zScore = Math.abs((values[i] - mean) / stdDev);
                if (zScore > this.config.cleaning.outlierThreshold) {
                    outlierIndices[i] = true;
                }
            }
        }
        
        // Filter out the outliers
        return dataset.filter(function(_, index) {
            return !outlierIndices[index];
        });
    },
    
    /**
     * Extracts numeric features from a dataset for statistical analysis
     * @param {Array} dataset - Dataset to analyze
     * @return {Object} Map of feature names to arrays of values
     */
    extractNumericFeatures: function(dataset) {
        var features = {};
        
        dataset.forEach(function(sample) {
            // Extract player position as numeric value
            var positionValue;
            switch(sample.gameState.playerPosition) {
                case "left": positionValue = 0; break;
                case "center": positionValue = 1; break;
                case "right": positionValue = 2; break;
                default: positionValue = 1; // Default to center
            }
            
            if (!features.playerPosition) features.playerPosition = [];
            features.playerPosition.push(positionValue);
            
            // Extract score
            if (sample.gameState.score !== undefined) {
                if (!features.score) features.score = [];
                features.score.push(sample.gameState.score);
            }
            
            // Extract coins
            if (sample.gameState.coins !== undefined) {
                if (!features.coins) features.coins = [];
                features.coins.push(sample.gameState.coins);
            }
            
            // Extract timing information
            if (sample.gameState.timestamp !== undefined) {
                if (!features.timestamp) features.timestamp = [];
                features.timestamp.push(sample.gameState.timestamp);
            }
        });
        
        return features;
    },
    
    /**
     * Calculates the mean of an array of values
     * @param {Array} values - Array of numeric values
     * @return {number} Mean value
     */
    calculateMean: function(values) {
        var sum = values.reduce(function(a, b) { return a + b; }, 0);
        return sum / values.length;
    },
    
    /**
     * Calculates the standard deviation of an array of values
     * @param {Array} values - Array of numeric values
     * @param {number} mean - Mean value (optional, will be calculated if not provided)
     * @return {number} Standard deviation
     */
    calculateStdDev: function(values, mean) {
        if (mean === undefined) {
            mean = this.calculateMean(values);
        }
        
        var squaredDiffs = values.map(function(value) {
            var diff = value - mean;
            return diff * diff;
        });
        
        var variance = this.calculateMean(squaredDiffs);
        return Math.sqrt(variance);
    },
    
    /**
     * Normalizes a dataset to standardize feature ranges
     * @param {Array} dataset - Dataset to normalize
     * @return {Array} Normalized dataset
     */
    normalizeDataset: function(dataset) {
        if (!this.config.normalization.enabled) {
            return dataset;
        }
        
        console.log("Normalizing dataset with " + dataset.length + " samples");
        var startTime = Date.now();
        
        try {
            // Extract features for normalization
            var features = this.extractNumericFeatures(dataset);
            var normalizedDataset = JSON.parse(JSON.stringify(dataset)); // Deep copy
            
            // Calculate feature ranges for min-max normalization
            var featureRanges = {};
            for (var feature in features) {
                var values = features[feature];
                var min = Math.min.apply(null, values);
                var max = Math.max.apply(null, values);
                var mean = this.calculateMean(values);
                var stdDev = this.calculateStdDev(values, mean);
                
                featureRanges[feature] = {
                    min: min,
                    max: max,
                    mean: mean,
                    stdDev: stdDev
                };
            }
            
            // Store feature ranges for future use
            this.config.normalization.featureRanges = featureRanges;
            
            // Apply normalization to each sample
            normalizedDataset.forEach(function(sample) {
                // Normalize player position
                if (sample.gameState.playerPosition !== undefined) {
                    var posValue;
                    switch(sample.gameState.playerPosition) {
                        case "left": posValue = 0; break;
                        case "center": posValue = 1; break;
                        case "right": posValue = 2; break;
                        default: posValue = 1;
                    }
                    
                    if (this.config.normalization.method === "min-max") {
                        var range = featureRanges.playerPosition;
                        sample.gameState.normalizedPosition = 
                            (posValue - range.min) / (range.max - range.min);
                    } else { // z-score
                        var stats = featureRanges.playerPosition;
                        sample.gameState.normalizedPosition = 
                            (posValue - stats.mean) / stats.stdDev;
                    }
                }
                
                // Normalize score
                if (sample.gameState.score !== undefined) {
                    if (this.config.normalization.method === "min-max") {
                        var scoreRange = featureRanges.score;
                        sample.gameState.normalizedScore = 
                            (sample.gameState.score - scoreRange.min) / (scoreRange.max - scoreRange.min);
                    } else { // z-score
                        var scoreStats = featureRanges.score;
                        sample.gameState.normalizedScore = 
                            (sample.gameState.score - scoreStats.mean) / scoreStats.stdDev;
                    }
                }
                
                // Normalize coins
                if (sample.gameState.coins !== undefined) {
                    if (this.config.normalization.method === "min-max") {
                        var coinsRange = featureRanges.coins;
                        sample.gameState.normalizedCoins = 
                            (sample.gameState.coins - coinsRange.min) / (coinsRange.max - coinsRange.min);
                    } else { // z-score
                        var coinsStats = featureRanges.coins;
                        sample.gameState.normalizedCoins = 
                            (sample.gameState.coins - coinsStats.mean) / coinsStats.stdDev;
                    }
                }
            }, this);
            
            var processingTime = Date.now() - startTime;
            console.log("Dataset normalized in " + processingTime + "ms");
            
            return normalizedDataset;
        } catch (e) {
            console.error("Error normalizing dataset: " + e.message);
            return dataset; // Return original dataset on error
        }
    }
};