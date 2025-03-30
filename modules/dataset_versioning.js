/**
 * Dataset Versioning Module for Subway Surfers Bot
 * Handles dataset versioning, comparison, and management
 * Part of Phase 4.3: Data Processing implementation
 */

// Import files module if not available globally
var files = files || require('../utils/files.js');

module.exports = {
    /**
     * Creates a new version of a dataset with metadata
     * @param {Array} dataset - The dataset to version
     * @param {Object} metadata - Version metadata (optional)
     * @return {Object} Versioned dataset with metadata
     */
    createDatasetVersion: function(dataset, metadata) {
        if (!dataset || !Array.isArray(dataset)) {
            console.error("Invalid dataset provided for versioning");
            return null;
        }
        
        var versionInfo = {
            version_id: "v" + Date.now(),
            created_at: new Date().toISOString(),
            sample_count: dataset.length,
            metadata: metadata || {},
            statistics: this.generateDatasetStatistics(dataset)
        };
        
        return {
            version_info: versionInfo,
            data: dataset
        };
    },
    
    /**
     * Generates statistics for a dataset
     * @param {Array} dataset - Dataset to analyze
     * @return {Object} Statistics about the dataset
     */
    generateDatasetStatistics: function(dataset) {
        if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
            return {};
        }
        
        var stats = {
            action_distribution: {},
            player_position_distribution: {},
            average_score: 0,
            total_samples: dataset.length
        };
        
        var totalScore = 0;
        var scoreCount = 0;
        
        // Calculate distributions
        dataset.forEach(function(sample) {
            // Action distribution
            if (sample.action) {
                if (!stats.action_distribution[sample.action]) {
                    stats.action_distribution[sample.action] = 0;
                }
                stats.action_distribution[sample.action]++;
            }
            
            // Player position distribution
            if (sample.gameState && sample.gameState.playerPosition) {
                var position = sample.gameState.playerPosition;
                if (!stats.player_position_distribution[position]) {
                    stats.player_position_distribution[position] = 0;
                }
                stats.player_position_distribution[position]++;
            }
            
            // Score tracking
            if (sample.gameState && sample.gameState.score !== undefined) {
                totalScore += sample.gameState.score;
                scoreCount++;
            }
        });
        
        // Calculate average score
        if (scoreCount > 0) {
            stats.average_score = totalScore / scoreCount;
        }
        
        return stats;
    },
    
    /**
     * Saves a dataset version to storage
     * @param {Object} versionedDataset - Dataset with version info
     * @param {string} basePath - Base path for storage
     * @return {boolean} Success status
     */
    saveDatasetVersion: function(versionedDataset, basePath) {
        if (!versionedDataset || !versionedDataset.version_info) {
            console.error("Invalid versioned dataset");
            return false;
        }
        
        try {
            var versionId = versionedDataset.version_info.version_id;
            var versionPath = basePath + "/versions/";
            var versionFile = versionPath + versionId + ".json";
            var metadataFile = versionPath + "version_history.json";
            
            // Ensure directory exists
            if (!files.exists(versionPath)) {
                files.createWithDirs(versionPath);
            }
            
            // Save dataset
            files.write(versionFile, JSON.stringify(versionedDataset));
            
            // Update version history
            this.updateVersionHistory(versionedDataset.version_info, metadataFile);
            
            console.log("Dataset version " + versionId + " saved successfully");
            return true;
        } catch (e) {
            console.error("Error saving dataset version: " + e.message);
            return false;
        }
    },
    
    /**
     * Updates the version history metadata file
     * @param {Object} versionInfo - Version metadata
     * @param {string} metadataFile - Path to metadata file
     */
    updateVersionHistory: function(versionInfo, metadataFile) {
        try {
            var history = [];
            
            // Load existing history if available
            if (files.exists(metadataFile)) {
                var historyData = files.read(metadataFile);
                history = JSON.parse(historyData);
            }
            
            // Add new version to history
            history.push(versionInfo);
            
            // Sort by creation date (newest first)
            history.sort(function(a, b) {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            
            // Save updated history
            files.write(metadataFile, JSON.stringify(history, null, 2));
        } catch (e) {
            console.error("Error updating version history: " + e.message);
        }
    },
    
    /**
     * Loads a specific dataset version
     * @param {string} versionId - Version ID to load
     * @param {string} basePath - Base path for storage
     * @return {Object} Versioned dataset or null if not found
     */
    loadDatasetVersion: function(versionId, basePath) {
        try {
            var versionPath = basePath + "/versions/";
            var versionFile = versionPath + versionId + ".json";
            
            if (!files.exists(versionFile)) {
                console.error("Dataset version " + versionId + " not found");
                return null;
            }
            
            var datasetJson = files.read(versionFile);
            return JSON.parse(datasetJson);
        } catch (e) {
            console.error("Error loading dataset version: " + e.message);
            return null;
        }
    },
    
    /**
     * Gets the list of available dataset versions
     * @param {string} basePath - Base path for storage
     * @return {Array} List of version metadata
     */
    listDatasetVersions: function(basePath) {
        try {
            var metadataFile = basePath + "/versions/version_history.json";
            
            if (!files.exists(metadataFile)) {
                return [];
            }
            
            var historyData = files.read(metadataFile);
            return JSON.parse(historyData);
        } catch (e) {
            console.error("Error listing dataset versions: " + e.message);
            return [];
        }
    },
    
    /**
     * Compares two dataset versions and returns differences
     * @param {string} versionId1 - First version ID
     * @param {string} versionId2 - Second version ID
     * @param {string} basePath - Base path for storage
     * @return {Object} Comparison results
     */
    compareDatasetVersions: function(versionId1, versionId2, basePath) {
        var version1 = this.loadDatasetVersion(versionId1, basePath);
        var version2 = this.loadDatasetVersion(versionId2, basePath);
        
        if (!version1 || !version2) {
            return null;
        }
        
        var stats1 = version1.version_info.statistics;
        var stats2 = version2.version_info.statistics;
        
        var comparison = {
            version1: versionId1,
            version2: versionId2,
            sample_count_diff: version2.version_info.sample_count - version1.version_info.sample_count,
            action_distribution_changes: this.compareDistributions(
                stats1.action_distribution, 
                stats2.action_distribution
            ),
            position_distribution_changes: this.compareDistributions(
                stats1.player_position_distribution, 
                stats2.player_position_distribution
            ),
            score_change: stats2.average_score - stats1.average_score
        };
        
        return comparison;
    },
    
    /**
     * Compares two distributions and returns differences
     * @param {Object} dist1 - First distribution
     * @param {Object} dist2 - Second distribution
     * @return {Object} Distribution differences
     */
    compareDistributions: function(dist1, dist2) {
        var changes = {};
        var allKeys = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
        
        allKeys.forEach(function(key) {
            var val1 = dist1[key] || 0;
            var val2 = dist2[key] || 0;
            
            if (val1 !== val2) {
                changes[key] = {
                    before: val1,
                    after: val2,
                    change: val2 - val1,
                    percent_change: val1 === 0 ? 100 : ((val2 - val1) / val1) * 100
                };
            }
        });
        
        return changes;
    },
    
    /**
     * Manages version history by pruning old versions
     * @param {string} basePath - Base path for storage
     * @param {number} maxVersions - Maximum number of versions to keep
     * @return {boolean} Success status
     */
    manageVersionHistory: function(basePath, maxVersions) {
        try {
            var versions = this.listDatasetVersions(basePath);
            
            if (versions.length <= maxVersions) {
                return true; // No pruning needed
            }
            
            // Sort by creation date (oldest first)
            versions.sort(function(a, b) {
                return new Date(a.created_at) - new Date(b.created_at);
            });
            
            // Determine versions to delete
            var versionsToDelete = versions.slice(0, versions.length - maxVersions);
            
            // Delete old versions
            var versionPath = basePath + "/versions/";
            var deletedCount = 0;
            
            versionsToDelete.forEach(function(versionInfo) {
                var versionFile = versionPath + versionInfo.version_id + ".json";
                
                if (files.exists(versionFile)) {
                    files.remove(versionFile);
                    deletedCount++;
                }
            });
            
            // Update version history file
            var remainingVersions = versions.slice(versions.length - maxVersions);
            files.write(
                versionPath + "version_history.json", 
                JSON.stringify(remainingVersions, null, 2)
            );
            
            console.log("Pruned " + deletedCount + " old dataset versions");
            return true;
        } catch (e) {
            console.error("Error managing version history: " + e.message);
            return false;
        }
    },
    
    /**
     * Creates a new dataset version and manages version history
     * @param {Array} dataset - Dataset to version
     * @param {Object} metadata - Version metadata
     * @param {string} basePath - Base path for storage
     * @param {number} maxVersions - Maximum versions to keep
     * @return {string} New version ID or null on failure
     */
    createAndManageDatasetVersion: function(dataset, metadata, basePath, maxVersions) {
        try {
            // Create new version
            var versionedDataset = this.createDatasetVersion(dataset, metadata);
            if (!versionedDataset) {
                return null;
            }
            
            // Save the version
            var saveResult = this.saveDatasetVersion(versionedDataset, basePath);
            if (!saveResult) {
                return null;
            }
            
            // Manage version history
            this.manageVersionHistory(basePath, maxVersions);
            
            return versionedDataset.version_info.version_id;
        } catch (e) {
            console.error("Error in dataset version management: " + e.message);
            return null;
        }
    }
};