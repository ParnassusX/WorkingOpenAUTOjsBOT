module.exports = {
    // Helper function to find color in a region
    findColorInRegion: function(img, targetColor, region, threshold) {
        try {
            var point = images.findColor(img, targetColor, {
                region: region,
                threshold: threshold
            });
            return point !== null;
        } catch (e) {
            console.error("Error finding color: " + e.message);
            return false;
        }
    },

    detectScreenType: function(img, width, height) {
        // Detect whether we're in gameplay, menu, game over, etc.
        
        // Look for score indicator (top of screen in gameplay)
        var scoreRegion = [width * 0.3, 0, width * 0.4, height * 0.1];
        var scorePresent = this.findColorInRegion(img, "#FFFFFF", scoreRegion, 40);
        
        // Look for play button (main menu)
        var playButtonRegion = [width * 0.3, height * 0.5, width * 0.4, height * 0.2];
        var playButtonPresent = this.findColorInRegion(img, "#FFFF00", playButtonRegion, 40);
        
        // Look for game over text
        var gameOverRegion = [width * 0.2, height * 0.3, width * 0.6, height * 0.2];
        var gameOverPresent = this.findColorInRegion(img, "#FF0000", gameOverRegion, 40);
        
        // Classify screen based on visual elements
        if (scorePresent && !playButtonPresent && !gameOverPresent) {
            return "gameplay";
        } else if (playButtonPresent) {
            return "menu";
        } else if (gameOverPresent) {
            return "game_over";
        } else {
            // Check for shop elements
            var shopRegion = [width * 0.1, height * 0.1, width * 0.8, height * 0.2];
            var shopPresent = this.findColorInRegion(img, "#FFFFFF", shopRegion, 40);
            if (shopPresent) {
                return "shop";
            }
        }
        
        // Default to unknown
        return "unknown";
    },

    getEmptyGameState: function() {
        return {
            screenType: "unknown",
            lanes: {
                left: {obstacles: false, coins: false},
                center: {obstacles: false, coins: false},
                right: {obstacles: false, coins: false}
            },
            playerPosition: "center",
            powerups: [],
            coins: 0,
            score: 0,
            obstacles: [],
            timestamp: Date.now()
        };
    },
    
    analyzeEnvironment: function(config) {
        var img = null;
        
        try {
            img = captureScreen();
            if (!img) {
                console.error("Failed to capture screen");
                return this.getEmptyGameState();
            }
            
            var width = img.getWidth();
            var height = img.getHeight();
            
            // Screen type detection
            var screenType = this.detectScreenType(img, width, height);
            if (screenType !== "gameplay") {
                return {
                    screenType: screenType,
                    timestamp: Date.now()
                };
            }
            
            // Full game state analysis
            var gameState = {
                screenType: "gameplay",
                lanes: {
                    left: this.analyzeLane(img, 0.2, width, height, config),
                    center: this.analyzeLane(img, 0.5, width, height, config),
                    right: this.analyzeLane(img, 0.8, width, height, config)
                },
                playerPosition: this.detectPlayer(img, width, height, config),
                powerups: this.detectPowerups(img, width, height),
                coins: this.countCoins(img, width, height, config),
                score: this.detectScore(img, width, height),
                obstacles: this.detectObstacles(img, width, height, config),
                timestamp: Date.now()
            };
            
            return gameState;
        } catch (e) {
            console.error("Error analyzing environment: " + e.message);
            return this.getEmptyGameState();
        } finally {
            // Properly clean up the image resource
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
        }
    },

    analyzeLane: function(img, xPercentage, width, height, config) {
        try {
            var laneWidth = width * 0.3;
            var xStart = Math.floor(width * xPercentage - laneWidth / 2);
            var yStart = Math.floor(height * config.vision.regions.obstacles.topPercent);
            var regionHeight = height * config.vision.regions.obstacles.heightPercent;
            
            // Advanced obstacle detection - look for multiple obstacle colors
            var hasObstacle = false;
            for (var i = 0; i < config.ui.colors.obstacles.length; i++) {
                var obstacleRegion = [xStart, yStart, laneWidth, regionHeight];
                if (this.findColorInRegion(img, config.ui.colors.obstacles[i], obstacleRegion, config.vision.colorThreshold)) {
                    hasObstacle = true;
                    break;
                }
            }
            
            // Advanced coin detection - look for multiple coin colors
            var hasCoins = false;
            for (var j = 0; j < config.ui.colors.coins.length; j++) {
                var coinRegion = [xStart, yStart, laneWidth, regionHeight];
                if (this.findColorInRegion(img, config.ui.colors.coins[j], coinRegion, config.vision.colorThreshold)) {
                    hasCoins = true;
                    break;
                }
            }
            
            return {
                obstacles: hasObstacle,
                coins: hasCoins,
                lane: xPercentage < 0.3 ? "left" : (xPercentage > 0.7 ? "right" : "center")
            };
        } catch (e) {
            console.error("Error analyzing lane: " + e.message);
            return {obstacles: false, coins: false};
        }
    },
    


    detectPlayer: function(img, width, height, config) {
        try {
            var bottomY = height * config.vision.regions.player.topPercent;
            var regionHeight = height * config.vision.regions.player.heightPercent;
            
            // Check each lane for player colors
            for (var i = 0; i < config.ui.colors.player.length; i++) {
                var leftPoint = this.findColorInRegion(img, config.ui.colors.player[i], 
                    [0, bottomY, width/3, regionHeight], config.vision.playerThreshold);
                    
                var centerPoint = this.findColorInRegion(img, config.ui.colors.player[i], 
                    [width/3, bottomY, width/3, regionHeight], config.vision.playerThreshold);
                    
                var rightPoint = this.findColorInRegion(img, config.ui.colors.player[i], 
                    [width*2/3, bottomY, width/3, regionHeight], config.vision.playerThreshold);
                
                if (leftPoint) return "left";
                if (centerPoint) return "center";
                if (rightPoint) return "right";
            }
            
            // Default to center if no player detected
            return "center";
        } catch (e) {
            console.error("Error detecting player: " + e.message);
            return "center";
        }
    },
    
    detectPowerups: function(img, width, height) {
        // Detect special items like hoverboards, magnets, etc.
        var powerups = [];
        
        try {
            // Hoverboard detection (typically at bottom of screen)
            var hoverboardRegion = [width * 0.1, height * 0.8, width * 0.2, height * 0.15];
            if (this.findColorInRegion(img, "#00FFFF", hoverboardRegion, 40)) {
                powerups.push("hoverboard");
            }
            
            // Magnet detection (typically at top of screen)
            var magnetRegion = [width * 0.1, height * 0.1, width * 0.2, height * 0.1];
            if (this.findColorInRegion(img, "#FFFFFF", magnetRegion, 40)) {
                powerups.push("magnet");
            }
            
            // Jetpack detection
            var jetpackRegion = [width* 0.4, height * 0.1, width * 0.2, height * 0.1];
            if (this.findColorInRegion(img, "#FF0000", jetpackRegion, 40)) {
                powerups.push("jetpack");
            }
        } catch (e) {
            console.error("Error detecting powerups: " + e.message);
        }
        
        return powerups;
    },
    
    countCoins: function(img, width, height, config) {
        // Simplified coin counter (in a real implementation, would count coin points)
        var coinCount = 0;
        
        try {
            for (var j = 0; j < config.ui.colors.coins.length; j++) {
                var points = images.findAllPointsForColor(img, config.ui.colors.coins[j], {
                    region: [0, 0, width, height],
                    threshold: config.vision.colorThreshold
                });
                
                if (points && points.length > 0) {
                    // Filter close points to avoid counting the same coin multiple times
                    var filteredPoints = this.filterClosePoints(points, 20);
                    coinCount += filteredPoints.length;
                }
            }
        } catch (e) {
            console.error("Error counting coins: " + e.message);
        }
        
        return coinCount;
    },
    
    filterClosePoints: function(points, minDistance) {
        if (!points || points.length === 0) return [];
        
        var result = [points[0]];
        
        for (var i = 1; i < points.length; i++) {
            var isClose = false;
            
            for (var j = 0; j < result.length; j++) {
                var distance = Math.sqrt(
                    Math.pow(points[i].x - result[j].x, 2) + 
                    Math.pow(points[i].y - result[j].y, 2)
                );
                
                if (distance < minDistance) {
                    isClose = true;
                    break;
                }
            }
            
            if (!isClose) {
                result.push(points[i]);
            }
        }
        
        return result;
    },
    
    detectScore: function(img, width, height) {
        // In a production bot, would use OCR to read the score
        // For this implementation, we'll just return a placeholder
        return 0;
    },
    
    detectObstacles: function(img, width, height, config) {
        // Get a more detailed view of obstacles ahead
        var obstacles = [];
        
        try {
            var yStart = Math.floor(height * config.vision.regions.obstacles.topPercent);
            var regionHeight = height * config.vision.regions.obstacles.heightPercent;
            
            // Check three lanes with sub-regions for better precision
            var lanes = [0.2, 0.5, 0.8]; // Left, center, right
            var distances = [0.3, 0.6, 0.9]; // Near, medium, far
            
            for (var laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
                var lane = lanes[laneIndex];
                var laneWidth = width * 0.3;
                var xStart = Math.floor(width * lane - laneWidth / 2);
                
                for (var distIndex = 0; distIndex < distances.length; distIndex++) {
                    var dist = distances[distIndex];
                    var yPos = yStart + (regionHeight * dist / 3);
                    var subRegionHeight = regionHeight / 3;
                    
                    // Check for obstacles in this sub-region
                    for (var i = 0; i < config.ui.colors.obstacles.length; i++) {
                        var obstacleRegion = [xStart, yPos, laneWidth, subRegionHeight];
                        if (this.findColorInRegion(img, config.ui.colors.obstacles[i], obstacleRegion, config.vision.colorThreshold)) {
                            obstacles.push({
                                lane: laneIndex === 0 ? "left" : (laneIndex === 1 ? "center" : "right"),
                                distance: distIndex === 0 ? "near" : (distIndex === 1 ? "medium" : "far"),
                                x: xStart + laneWidth/2,
                                y: yPos + subRegionHeight/2
                            });
                            // Don't check other colors once we found an obstacle here
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error detecting obstacles: " + e.message);
        }
        
        return obstacles;
    },
    
    decideAction: function(gameState, config) {
        // If not in gameplay, no action needed
        if (gameState.screenType !== "gameplay") {
            return null;
        }
        
        try {
            // Get player's current lane
            var currentLane = gameState.playerPosition;
            
            // Check for immediate obstacles in current lane
            var currentLaneHasObstacle = false;
            var nearObstacles = [];
            
            // Find near obstacles
            for (var i = 0; i < gameState.obstacles.length; i++) {
                var obstacle = gameState.obstacles[i];
                if (obstacle.distance === "near") {
                    nearObstacles.push(obstacle);
                    if (obstacle.lane === currentLane) {
                        currentLaneHasObstacle = true;
                    }
                }
            }
            
            // If there's an obstacle in current lane, decide where to move
            if (currentLaneHasObstacle) {
                // Check which lanes are safe
                var leftSafe = true;
                var rightSafe = true;
                
                for (var j = 0; j < nearObstacles.length; j++) {
                    if (nearObstacles[j].lane === "left") leftSafe = false;
                    if (nearObstacles[j].lane === "right") rightSafe = false;
                }
                
                // Decide which way to move
                if (currentLane === "center") {
                    // Prefer moving to a lane with coins if both are safe
                    if (leftSafe && rightSafe) {
                        if (gameState.lanes.left.coins) return "left";
                        if (gameState.lanes.right.coins) return "right";
                        // If no coins, randomly choose a direction
                        return Math.random() < 0.5 ? "left" : "right";
                    } else if (leftSafe) {
                        return "left";
                    } else if (rightSafe) {
                        return "right";
                    } else {
                        // Both sides have obstacles, try jumping
                        return "jump";
                    }
                } else if (currentLane === "left") {
                    // Can only move right or jump
                    if (rightSafe) {
                        return "right";
                    } else {
                        return "jump";
                    }
                } else { // currentLane === "right"
                    // Can only move left or jump
                    if (leftSafe) {
                        return "left";
                    } else {
                        return "jump";
                    }
                }
            }
            
            // No immediate obstacles, look for coins
            if (currentLane === "center") {
                if (gameState.lanes.left.coins) return "left";
                if (gameState.lanes.right.coins) return "right";
            } else if (currentLane === "left") {
                if (gameState.lanes.center.coins) return "right";
            } else { // currentLane === "right"
                if (gameState.lanes.center.coins) return "left";
            }
            
            // No obstacles or coins, stay in current lane
            return null;
        } catch (e) {
            console.error("Error deciding action: " + e.message);
            return null;
        }
    }
};

// Module is already exported at the beginning of the file
