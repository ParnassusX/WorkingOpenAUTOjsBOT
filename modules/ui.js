module.exports = {
    launchGame: function(config) {
        console.log("Launching Subway Surfers...");
        app.launchPackage(config.memu.packageName);
        // Use setTimeout instead of sleep to avoid UI thread blocking
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, 3000);
        });
    },

    detectGameScreen: function() {
        // Check for missions screens in multiple languages first (high priority)
        if (this.findText(["Missioni", "MISSIONI", "SET DI MISSIONI", "Rotola", "Spendi", "Totalizz", "Caccia", "Completata"])) {
            return "missions";
        }
        
        // Check for actual gameplay (running character)
        if (this.findText(["SCORE", "COINS", "PUNTEGGIO", "MONETE"]) && !this.findText(["MISSIONI", "MISSIONS"])) {
            return "gameplay";
        }
        
        // Main menu detection
        if (this.findText(["PLAY", "GIOCA", "START"])) {
            return "main_menu";
        }
        
        // Game over screen detection
        if (this.findText(["GAME OVER", "REVIVE", "TRY AGAIN", "RIPROVA"])) {
            return "game_over";
        }
        
        // Shop detection
        if (this.findText(["SHOP", "STORE", "CHARACTERS", "BUY", "NEGOZIO", "ACQUISTA"])) {
            return "shop";
        }
        
        // Settings detection
        if (this.findText(["SETTINGS", "OPTIONS", "AUDIO", "IMPOSTAZIONI"])) {
            return "settings";
        }
        
        // Enhanced unknown detection - look for ANY Subway Surfers UI elements
        if (this.findText(["SUBWAY", "SURFERS"])) {
            return "subway_menu"; // Generic Subway menu
        }
        
        console.log("Screen detection found no matching elements");
        return "unknown";
    },
    
    findText: function(textArray) {
        for (var i = 0; i < textArray.length; i++) {
            try {
                // Try exact text match first
                if (text(textArray[i]).exists()) {
                    console.log("Found exact text: " + textArray[i]);
                    return true;
                }
                
                // Try contains match
                if (textContains(textArray[i]).exists()) {
                    console.log("Found text containing: " + textArray[i]);
                    return true;
                }
                
                // Try case-insensitive match
                var lowerText = textArray[i].toLowerCase();
                if (textMatches("(?i)" + lowerText).exists()) {
                    console.log("Found case-insensitive text: " + textArray[i]);
                    return true;
                }
                
                // Try OCR for text that might be in images
                var img = captureScreen();
                if (img) {
                    // Use simple color detection for common UI elements
                    // This is a simplified approach - in a real implementation, you'd use proper OCR
                    if (this.detectTextInImage(img, textArray[i])) {
                        console.log("Found text in image: " + textArray[i]);
                        img.recycle();
                        return true;
                    }
                    img.recycle();
                }
            } catch (e) {
                console.error("Error checking for text '" + textArray[i] + "': " + e.message);
            }
        }
        return false;
    },
    
    detectTextInImage: function(img, targetText) {
        // This is a simplified implementation
        // In a real bot, you would use proper OCR or more sophisticated image recognition
        try {
            // For common game elements like "SCORE", "COINS", etc.
            if (targetText === "SCORE" || targetText === "COINS") {
                // Check top area of screen for white text (common for score/coins)
                var width = img.getWidth();
                var height = img.getHeight();
                var topArea = [width * 0.3, 0, width * 0.7, height * 0.2];
                
                // Look for white pixels in the top area (simplified approach)
                for (var x = topArea[0]; x < topArea[2]; x += 20) {
                    for (var y = topArea[1]; y < topArea[3]; y += 5) {
                        var pixel = images.pixel(img, x, y);
                        var r = colors.red(pixel);
                        var g = colors.green(pixel);
                        var b = colors.blue(pixel);
                        
                        // Check if pixel is white or yellow (common for UI text)
                        if ((r > 240 && g > 240 && b > 240) || 
                            (r > 240 && g > 240 && b < 100)) {
                            return true;
                        }
                    }
                }
            }
            
            // For "PLAY" button detection
            if (targetText === "PLAY" || targetText === "GIOCA" || targetText === "START") {
                // Check bottom area for green button (common for play buttons)
                var width = img.getWidth();
                var height = img.getHeight();
                var bottomArea = [width * 0.3, height * 0.7, width * 0.7, height];
                
                // Look for green pixels (simplified approach)
                for (var x = bottomArea[0]; x < bottomArea[2]; x += 20) {
                    for (var y = bottomArea[1]; y < bottomArea[3]; y += 5) {
                        var pixel = images.pixel(img, x, y);
                        var r = colors.red(pixel);
                        var g = colors.green(pixel);
                        var b = colors.blue(pixel);
                        
                        // Check if pixel is green (common for play buttons)
                        if (r < 100 && g > 200 && b < 100) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        } catch (e) {
            console.error("Error in detectTextInImage: " + e.message);
            return false;
        }
    },
    
    handleScreen: function(screenType, config) {
        console.log("Handling screen: " + screenType);
        
        switch (screenType) {
            case "main_menu":
                return this.handleMainMenu(config);
            case "game_over":
                return this.handleGameOver(config);
            case "shop":
                return this.handleShop(config);
            case "missions":
                return this.handleMissions(config);
            case "settings":
                return this.handleSettings(config);
            case "subway_menu":
                return this.handleGenericSubwayMenu();
            default:
                return this.handleUnknownScreen();
        }
    },
    
    handleMainMenu: function(config) {
        // Look for play buttons in all languages
        for (var i = 0; i < config.ui.playButtons.length; i++) {
            var buttonText = config.ui.playButtons[i];
            var button = text(buttonText).findOne(1000);
            
            if (button) {
                console.log("Found play button: " + buttonText);
                click(button.bounds().centerX(), button.bounds().centerY());
                sleep(1000);
                return true;
            }
        }
        
        // Try clicking center of screen as fallback
        console.log("No play button found, clicking center of screen");
        click(device.width / 2, device.height / 2);
        return true;
    },
    
    handleGameOver: function(config) {
        // Try to find and click "play again" buttons
        try {
            for (var i = 0; i < config.ui.gameOverButtons.length; i++) {
                var buttonText = config.ui.gameOverButtons[i];
                var button = text(buttonText).findOne(1000);
                
                if (button) {
                    console.log("Found game over button: " + buttonText);
                    click(button.bounds().centerX(), button.bounds().centerY());
                    sleep(1000);
                    return true;
                }
            }
            
            // Try clicking center of screen
            console.log("No game over button found, clicking center of screen");
            click(device.width / 2, device.height / 2);
            sleep(500);
        } catch (e) {
            console.error("Error in handleGameOver: " + e);
            // Fallback to clicking center
            click(device.width / 2, device.height / 2);
            sleep(500);
        }
        
        // If that doesn't work, press back
        back();
        sleep(500);
        
        return true;
    },
    
    handleShop: function(config) {
        // Just press back to exit the shop
        console.log("Exiting shop");
        back();
        sleep(1000);
        return true;
    },
    
    handleMissions: function(config) {
        // Look for exit buttons in multiple languages
        var exitTexts = ["ESCI", "RIPRENDI", "EXIT", "RESUME", "BACK", "CONTINUE"];
        
        for (var i = 0; i < exitTexts.length; i++) {
            var exitButton = text(exitTexts[i]).findOne(1000);
            if (exitButton) {
                console.log("Found exit button: " + exitTexts[i]);
                click(exitButton.bounds().centerX(), exitButton.bounds().centerY());
                sleep(1000);
                return true;
            }
        }
        
        // Press back as a fallback
        console.log("No exit button found, pressing back");
        back();
        sleep(1000);
        return true;
    },
    
    handleSettings: function(config) {
        // Exit settings by pressing back
        console.log("Exiting settings");
        back();
        sleep(1000);
        return true;
    },
    
    handleGenericSubwayMenu: function() {
        // For any Subway Surfers menu we can't specifically identify
        console.log("Generic Subway Surfers menu detected");
        
        // First try looking for a play button
        var playButton = text("PLAY").findOne(500) || 
                         text("GIOCA").findOne(500) || 
                         text("START").findOne(500);
        
        if (playButton) {
            console.log("Found play button on generic menu");
            click(playButton.bounds().centerX(), playButton.bounds().centerY());
            sleep(1000);
            return true;
        }
        
        // Try clicking center of screen
        console.log("Clicking center of screen on generic menu");
        click(device.width / 2, device.height / 2);
        sleep(800);
        
        return true;
    },
    
    handleUnknownScreen: function() {
        // Try a series of common UI interactions
        console.log("Unknown screen, trying common actions");
        
        // First check for any X buttons to close popups
        var closeButton = text("X").findOne(500) || 
                          text("x").findOne(500) || 
                          desc("Close").findOne(500);
        
        if (closeButton) {
            console.log("Found close button on unknown screen");
            click(closeButton.bounds().centerX(), closeButton.bounds().centerY());
            sleep(800);
            return true;
        }
        
        // Try clicking center of screen
        console.log("Clicking center of screen on unknown screen");
        click(device.width / 2, device.height / 2);
        sleep(800);
        
        // If nothing changes, try back button
        back();
        sleep(800);
        
        return true;
    },

    handleAds: function(config) {
        var adClosed = this.closeAds(config);
        if (adClosed) {
            return true;
        }
        
        // Detect and handle different screen types
        var screenType = this.detectGameScreen();
        if (screenType !== "gameplay") {
            return this.handleScreen(screenType, config);
        }
        
        return false;
    },

    closeAds: function(config) {
        var adPositions = config.memu.adPositions;
        var img = null;

        try {
            img = captureScreen();
            if (!img) return false;
            
            // Look for close buttons in common positions
            for (var i = 0; i < adPositions.length; i++) {
                var pos = adPositions[i];
                
                // Look for white Xin ad positions
                if (this.isCloseButton(img, pos.x, pos.y)) {
                    console.log("Closing ad at " + pos.x + "," + pos.y);
                    click(pos.x, pos.y);
                    sleep(1000);
                    return true;
                }
            }
            
            // Try to find X buttons by scanning the screen
            var foundCloseButton = this.findCloseButtonOnScreen(img);
            if (foundCloseButton) {
                console.log("Found close button by scanning: " + foundCloseButton.x + "," + foundCloseButton.y);
                click(foundCloseButton.x, foundCloseButton.y);
                sleep(1000);
                return true;
            }
            
            return false;
        } catch (e) {
            console.error("Error checking ad positions: " + e.message);
            return false;
        } finally {
            if (img && img.recycle) {
                try { img.recycle(); } catch (e) {}
            }
        }
    },
    
    isCloseButton: function(img, x, y) {
        try {
            // Check for white pixel (common in close buttons)
            var pixel = images.pixel(img, x, y);
            var r = colors.red(pixel);
            var g = colors.green(pixel);
            var b = colors.blue(pixel);
            
            // Check if it's close to white
            var isWhite = r > 240 && g > 240 && b > 240;
            
            // Also check surrounding pixels for X pattern
            if (isWhite) {
                // Check diagonal pixels (X pattern)
                var pixel1 = images.pixel(img, x - 5, y - 5);
                var pixel2 = images.pixel(img, x + 5, y - 5);
                var pixel3 = images.pixel(img, x - 5, y + 5);
                var pixel4 = images.pixel(img, x + 5, y + 5);
                
                // If surrounding pixels are also white, likely an X
                var surroundingWhiteCount = 0;
                if (colors.red(pixel1) > 240) surroundingWhiteCount++;
                if (colors.red(pixel2) > 240) surroundingWhiteCount++;
                if (colors.red(pixel3) > 240) surroundingWhiteCount++;
                if (colors.red(pixel4) > 240) surroundingWhiteCount++;
                
                return surroundingWhiteCount >= 2;
            }
            
            return false;
        } catch (e) {
            console.error("Error checking for close button: " + e.message);
            return false;
        }
    },
    
    findCloseButtonOnScreen: function(img) {
        try {
            // Look for X shapes or close buttons
            var width = img.getWidth();
            var height = img.getHeight();
            
            // First check top right corner (common for ads)
            var topRight = this.scanRegionForCloseButton(img, width * 0.7, 0, width * 0.3, height * 0.3);
            if (topRight) return topRight;
            
            // Then check top left
            var topLeft = this.scanRegionForCloseButton(img, 0, 0, width * 0.3, height * 0.3);
            if (topLeft) return topLeft;
            
            // Finally bottom right
            var bottomRight = this.scanRegionForCloseButton(img, width * 0.7, height * 0.7, width * 0.3, height * 0.3);
            if (bottomRight) return bottomRight;
            
            return null;
        } catch (e) {
            console.error("Error finding close button: " + e.message);
            return null;
        }
    },
    
    scanRegionForCloseButton: function(img, startX, startY, scanWidth, scanHeight) {
        try {
            // Find white pixels that could be close buttons
            for (var x = startX; x < startX + scanWidth; x += 10) {
                for (var y = startY; y < startY + scanHeight; y += 10) {
                    if (this.isCloseButton(img, x, y)) {
                        return {x: x, y: y};
                    }
                }
            }
            return null;
        } catch (e) {
            console.error("Error scanning for close button: " + e.message);
            return null;
        }
    }
};