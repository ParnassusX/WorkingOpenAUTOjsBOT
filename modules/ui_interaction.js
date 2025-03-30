/**
 * UI Interaction Module for Subway Surfers Bot
 * Implements Phase 3.3: UI Interaction features
 * 
 * Features:
 * - Menu navigation system (Implemented)
 * - Mission selection and completion tracking (Implemented)
 * - Character and hoverboard selection system (Implemented)
 * - Shop interaction for upgrades (Implemented)
 */

// Import required modules
var utils = require('./utils.js');
var ui = require('./ui.js');

// Cache for UI element positions
var uiElementCache = {
    menuButtons: {},
    missionButtons: {},
    characterButtons: {},
    hoverboardButtons: {},
    shopButtons: {},
    lastUpdate: 0
};

// Mission tracking
var missionTracking = {
    currentMissions: [],
    completedMissions: [],
    missionProgress: {}
};

// Character and hoverboard tracking
var characterTracking = {
    unlockedCharacters: [],
    currentCharacter: "",
    unlockedHoverboards: [],
    currentHoverboard: ""
};

module.exports = {
    /**
     * Initializes the UI interaction module
     * @param {Object} config - Configuration settings
     */
    initialize: function(config) {
        console.log("Initializing UI interaction module...");
        
        // Reset caches
        this.resetCaches();
        
        // Load saved mission and character data if available
        this.loadSavedData(config);
        
        console.log("UI interaction module initialized");
    },
    
    /**
     * Resets UI element caches
     */
    resetCaches: function() {
        uiElementCache = {
            menuButtons: {},
            missionButtons: {},
            characterButtons: {},
            hoverboardButtons: {},
            shopButtons: {},
            lastUpdate: Date.now()
        };
    },
    
    /**
     * Loads saved mission and character data
     * @param {Object} config - Configuration settings
     */
    loadSavedData: function(config) {
        try {
            var dataPath = config.training.dataPath + "ui_data.json";
            if (files.exists(dataPath)) {
                var data = JSON.parse(files.read(dataPath));
                
                if (data.missionTracking) {
                    missionTracking = data.missionTracking;
                }
                
                if (data.characterTracking) {
                    characterTracking = data.characterTracking;
                }
                
                console.log("Loaded UI data: " + 
                          missionTracking.completedMissions.length + " completed missions, " + 
                          characterTracking.unlockedCharacters.length + " unlocked characters");
            }
        } catch (e) {
            console.error("Error loading saved UI data: " + e.message);
        }
    },
    
    /**
     * Saves current mission and character data
     * @param {Object} config - Configuration settings
     */
    saveData: function(config) {
        try {
            var dataPath = config.training.dataPath + "ui_data.json";
            var data = {
                missionTracking: missionTracking,
                characterTracking: characterTracking,
                lastUpdate: Date.now()
            };
            
            files.write(dataPath, JSON.stringify(data, null, 2));
            console.log("Saved UI data successfully");
        } catch (e) {
            console.error("Error saving UI data: " + e.message);
        }
    },
    
    /**
     * Navigates to a specific menu in the game
     * @param {string} targetMenu - The menu to navigate to (main, missions, characters, shop, etc.)
     * @param {Object} config - Configuration settings
     * @return {boolean} Success status
     */
    navigateToMenu: function(targetMenu, config) {
        console.log("Navigating to menu: " + targetMenu);
        
        // First, determine current screen
        var currentScreen = ui.detectGameScreen();
        console.log("Current screen detected as: " + currentScreen);
        
        // If we're already on the target menu, return success
        if (this.isTargetMenu(currentScreen, targetMenu)) {
            console.log("Already on target menu: " + targetMenu);
            return true;
        }
        
        // Navigation paths from different screens
        switch (currentScreen) {
            case "gameplay":
                // Need to pause first
                this.tapPauseButton();
                sleep(1000);
                // Then navigate from pause menu
                return this.navigateFromPauseMenu(targetMenu);
                
            case "main_menu":
                return this.navigateFromMainMenu(targetMenu);
                
            case "game_over":
                // Need to get back to main menu first
                this.tapButton("main_menu");
                sleep(1500);
                return this.navigateToMenu(targetMenu, config);
                
            case "missions":
                if (targetMenu === "missions") {
                    return true;
                }
                // Go back to main menu first
                this.tapButton("back");
                sleep(1000);
                return this.navigateToMenu(targetMenu, config);
                
            case "shop":
                if (targetMenu === "shop") {
                    return true;
                }
                // Go back to main menu first
                this.tapButton("back");
                sleep(1000);
                return this.navigateToMenu(targetMenu, config);
                
            case "characters":
                if (targetMenu === "characters") {
                    return true;
                }
                // Go back to main menu first
                this.tapButton("back");
                sleep(1000);
                return this.navigateToMenu(targetMenu, config);
                
            case "settings":
                // Go back to previous screen
                this.tapButton("back");
                sleep(1000);
                return this.navigateToMenu(targetMenu, config);
                
            case "unknown":
            default:
                // Try to get to main menu by tapping back or menu buttons
                console.log("On unknown screen, attempting to find main menu");
                this.tapButton("back");
                sleep(1000);
                // Check if we reached main menu
                if (ui.detectGameScreen() === "main_menu") {
                    return this.navigateToMenu(targetMenu, config);
                }
                
                // If still unknown, try tapping center of screen and then try again
                this.tapScreenCenter();
                sleep(1000);
                return this.navigateToMenu(targetMenu, config);
        }
    },
    
    /**
     * Checks if current screen matches target menu
     * @param {string} currentScreen - Current detected screen
     * @param {string} targetMenu - Target menu to navigate to
     * @return {boolean} True if current screen matches target menu
     */
    isTargetMenu: function(currentScreen, targetMenu) {
        switch (targetMenu) {
            case "main":
            case "main_menu":
                return currentScreen === "main_menu";
                
            case "missions":
                return currentScreen === "missions";
                
            case "characters":
                return currentScreen === "characters";
                
            case "shop":
            case "store":
                return currentScreen === "shop";
                
            case "settings":
                return currentScreen === "settings";
                
            case "gameplay":
                return currentScreen === "gameplay";
                
            default:
                return false;
        }
    },
    
    /**
     * Navigates from main menu to target menu
     * @param {string} targetMenu - Target menu to navigate to
     * @return {boolean} Success status
     */
    navigateFromMainMenu: function(targetMenu) {
        switch (targetMenu) {
            case "main":
            case "main_menu":
                return true; // Already on main menu
                
            case "missions":
                return this.tapButton("missions");
                
            case "characters":
                return this.tapButton("characters");
                
            case "shop":
            case "store":
                return this.tapButton("shop");
                
            case "settings":
                return this.tapButton("settings");
                
            case "gameplay":
                return this.tapButton("play");
                
            default:
                console.log("Unknown target menu: " + targetMenu);
                return false;
        }
    },
    
    /**
     * Navigates from pause menu to target menu
     * @param {string} targetMenu - Target menu to navigate to
     * @return {boolean} Success status
     */
    navigateFromPauseMenu: function(targetMenu) {
        switch (targetMenu) {
            case "gameplay":
                return this.tapButton("resume");
                
            case "main":
            case "main_menu":
                return this.tapButton("quit");
                
            default:
                // For other menus, go to main menu first, then navigate
                if (this.tapButton("quit")) {
                    sleep(1500); // Wait for transition
                    return this.navigateFromMainMenu(targetMenu);
                }
                return false;
        }
    },
    
    /**
     * Taps a button by its identifier
     * @param {string} buttonId - Button identifier
     * @return {boolean} Success status
     */
    tapButton: function(buttonId) {
        // Button text mapping for different languages
        var buttonTexts = {
            "play": ["PLAY", "GIOCA", "START", "JUGAR", "JOUER", "SPIELEN"],
            "missions": ["MISSIONS", "MISSIONI", "MISIONES", "MISSIONS", "MISSIONEN"],
            "characters": ["CHARACTERS", "PERSONAGGI", "PERSONAJES", "PERSONNAGES", "CHARAKTERE"],
            "shop": ["SHOP", "NEGOZIO", "TIENDA", "BOUTIQUE", "LADEN"],
            "settings": ["SETTINGS", "IMPOSTAZIONI", "AJUSTES", "PARAMÈTRES", "EINSTELLUNGEN"],
            "back": ["BACK", "INDIETRO", "ATRÁS", "RETOUR", "ZURÜCK"],
            "resume": ["RESUME", "RIPRENDI", "REANUDAR", "REPRENDRE", "FORTSETZEN"],
            "quit": ["QUIT", "ESCI", "SALIR", "QUITTER", "BEENDEN"],
            "main_menu": ["MAIN MENU", "MENU PRINCIPALE", "MENÚ PRINCIPAL", "MENU PRINCIPAL", "HAUPTMENÜ"]
        };
        
        // Get the appropriate text array for the button
        var textArray = buttonTexts[buttonId.toLowerCase()];
        if (!textArray) {
            console.error("Unknown button ID: " + buttonId);
            return false;
        }
        
        // Try to find and tap the button
        for (var i = 0; i < textArray.length; i++) {
            try {
                // Try exact text match
                if (text(textArray[i]).exists()) {
                    var button = text(textArray[i]).findOne(1000);
                    if (button) {
                        console.log("Found button: " + textArray[i]);
                        button.click();
                        return true;
                    }
                }
                
                // Try contains match
                if (textContains(textArray[i]).exists()) {
                    var button = textContains(textArray[i]).findOne(1000);
                    if (button) {
                        console.log("Found button containing: " + textArray[i]);
                        button.click();
                        return true;
                    }
                }
                
                // Try case-insensitive match
                var lowerText = textArray[i].toLowerCase();
                if (textMatches("(?i)" + lowerText).exists()) {
                    var button = textMatches("(?i)" + lowerText).findOne(1000);
                    if (button) {
                        console.log("Found case-insensitive button: " + textArray[i]);
                        button.click();
                        return true;
                    }
                }
            } catch (e) {
                console.error("Error finding button '" + textArray[i] + "': " + e.message);
            }
        }
        
        // If button not found by text, try using cached positions
        if (uiElementCache.menuButtons[buttonId]) {
            var pos = uiElementCache.menuButtons[buttonId];
            console.log("Using cached position for button: " + buttonId);
            click(pos.x, pos.y);
            return true;
        }
        
        console.log("Button not found: " + buttonId);
        return false;
    },
    
    /**
     * Taps the center of the screen
     */
    tapScreenCenter: function() {
        var width = device.width;
        var height = device.height;
        click(width / 2, height / 2);
    },
    
    /**
     * Taps the pause button during gameplay
     * @return {boolean} Success status
     */
    tapPauseButton: function() {
        // Pause button is typically in the top-left or top-right corner
        // Try top-left first
        click(50, 50);
        sleep(500);
        
        // Check if we're paused
        if (ui.findText(["RESUME", "RIPRENDI", "REANUDAR", "REPRENDRE", "FORTSETZEN"])) {
            return true;
        }
        
        // Try top-right
        click(device.width - 50, 50);
        sleep(500);
        
        // Check again
        return ui.findText(["RESUME", "RIPRENDI", "REANUDAR", "REPRENDRE", "FORTSETZEN"]);
    },
    
    /**
     * Selects a mission from the missions menu
     * @param {number} missionIndex - Index of the mission to select (0-based)
     * @return {boolean} Success status
     */
    selectMission: function(missionIndex) {
        // First navigate to missions menu
        if (!this.navigateToMenu("missions")) {
            console.error("Failed to navigate to missions menu");
            return false;
        }
        
        // Wait for missions to load
        sleep(1000);
        
        // Find mission elements
        var missionElements = [];
        try {
            // Look for mission elements based on common UI patterns
            // This is a simplified approach - in a real implementation, you'd use more sophisticated detection
            missionElements = this.findMissionElements();
            
            if (missionElements.length === 0) {
                console.error("No mission elements found");
                return false;
            }
            
            console.log("Found " + missionElements.length + " mission elements");
            
            // Select the requested mission if it exists
            if (missionIndex >= 0 && missionIndex < missionElements.length) {
                var mission = missionElements[missionIndex];
                mission.click();
                
                // Update mission tracking
                this.updateCurrentMissions();
                
                return true;
            } else {
                console.error("Mission index out of range: " + missionIndex);
                return false;
            }
        } catch (e) {
            console.error("Error selecting mission: " + e.message);
            return false;
        }
    },
    
    /**
     * Finds mission elements in the missions menu
     * @return {Array} Array of mission UI elements
     */
    findMissionElements: function() {
        var missionElements = [];
        
        // Look for common mission-related text
        var missionKeywords = [
            "COLLECT", "SCORE", "JUMP", "ROLL", "DODGE", "RACCOGLI", "PUNTEGGIO", 
            "SALTA", "ROTOLA", "SCHIVA", "COINS", "MONETE"
        ];
        
        for (var i = 0; i < missionKeywords.length; i++) {
            try {
                var elements = textContains(missionKeywords[i]).find();
                for (var j = 0; j < elements.length; j++) {
                    missionElements.push(elements[j]);
                }
            } catch (e) {
                console.error("Error finding mission elements with keyword '" + 
                           missionKeywords[i] + "': " + e.message);
            }
        }
        
        return missionElements;
    },
    
    /**
     * Updates the list of current missions
     */
    updateCurrentMissions: function() {
        try {
            // Clear current missions
            missionTracking.currentMissions = [];
            
            // Find mission text elements
            var missionElements = this.findMissionElements();
            
            // Extract mission text and progress
            for (var i = 0; i < missionElements.length; i++) {
                var missionText = missionElements[i].text();
                
                // Extract progress if available (e.g., "10/20 coins")
                var progressMatch = missionText.match(/(\d+)\s*\/\s*(\d+)/);
                var progress = progressMatch ? {
                    current: parseInt(progressMatch[1]),
                    total: parseInt(progressMatch[2])
                } : null;
                
                var mission = {
                    text: missionText,
                    progress: progress,
                    completed: progress ? (progress.current >= progress.total) : false
                };
                
                missionTracking.currentMissions.push(mission);
                
                // Update mission progress tracking
                if (mission.text && !missionTracking.missionProgress[mission.text]) {
                    missionTracking.missionProgress[mission.text] = {
                        firstSeen: Date.now(),
                        lastUpdated: Date.now(),
                        progress: mission.progress,
                        completed: mission.completed
                    };
                } else if (mission.text) {
                    missionTracking.missionProgress[mission.text].lastUpdated = Date.now();
                    missionTracking.missionProgress[mission.text].progress = mission.progress;
                    missionTracking.missionProgress[mission.text].completed = mission.completed;
                }
                
                // If mission is completed, add to completed missions if not already there
                if (mission.completed && 
                    missionTracking.completedMissions.indexOf(mission.text) === -1) {
                    missionTracking.completedMissions.push(mission.text);
                }
            }
            
            console.log("Updated current missions: " + missionTracking.currentMissions.length + 
                      " active, " + missionTracking.completedMissions.length + " completed");
        } catch (e) {
            console.error("Error updating current missions: " + e.message);
        }
    },
    
    /**
     * Selects a character from the characters menu
     * @param {string} characterName - Name of the character to select
     * @return {boolean} Success status
     */
    selectCharacter: function(characterName) {
        // First navigate to characters menu
        if (!this.navigateToMenu("characters")) {
            console.error("Failed to navigate to characters menu");
            return false;
        }
        
        // Wait for characters to load
        sleep(1000);
        
        // Try to find and select the character
        try {
            // Look for the character name
            if (text(characterName).exists()) {
                var charElement = text(characterName).findOne(1000);
                if (charElement) {
                    charElement.click();
                    
                    // Update character tracking
                    characterTracking.currentCharacter = characterName;
                    if (characterTracking.unlockedCharacters.indexOf(characterName) === -1) {
                        characterTracking.unlockedCharacters.push(characterName);
                    }
                    
                    return true;
                }
            }
            
            // Try case-insensitive match
            if (textMatches("(?i)" + characterName).exists()) {
                var charElement = textMatches("(?i)" + characterName).findOne(1000);
                if (charElement) {
                    charElement.click();
                    
                    // Update character tracking
                    characterTracking.currentCharacter = characterName;
                    if (characterTracking.unlockedCharacters.indexOf(characterName) === -1) {
                        characterTracking.unlockedCharacters.push(characterName);
                    }
                    
                    return true;
                }
            }
            
            console.error("Character not found: " + characterName);
            return false;
        } catch (e) {
            console.error("Error selecting character: " + e.message);
            return false;
        }
    },
    
    /**
     * Selects a hoverboard from the hoverboards menu
     * @param {string} hoverboardName - Name of the hoverboard to select
     * @return {boolean} Success status
     */
    selectHoverboard: function(hoverboardName) {
        // First navigate to hoverboards section (usually in the shop)
        if (!this.navigateToMenu("shop")) {
            console.error("Failed to navigate to shop menu");
            return false;
        }
        
        // Wait for shop to load
        sleep(1000);
        
        // Try to find and navigate to hoverboards section
        try {
            // Look for hoverboards section button
            var hoverboardSectionFound = false;
            var hoverboardSectionKeywords = [
                "HOVERBOARD", "SKATEBOARD", "SURF", "TAVOLA"
            ];
            
            for (var i = 0; i < hoverboardSectionKeywords.length; i++) {
                if (textContains(hoverboardSectionKeywords[i]).exists()) {
                    var sectionButton = textContains(hoverboardSectionKeywords[i]).findOne(1000);
                    if (sectionButton) {
                        sectionButton.click();
                        hoverboardSectionFound = true;
                        break;
                    }
                }
            }
            
            if (!hoverboardSectionFound) {
                console.error("Hoverboard section not found");
                return false;
            }
            
            // Wait for hoverboards to load
            sleep(1000);
            
            // Try to find and select the hoverboard
            if (text(hoverboardName).exists()) {
                var hoverboardElement = text(hoverboardName).findOne(1000);
                if (hoverboardElement) {
                    hoverboardElement.click();
                    
                    // Update hoverboard tracking
                    characterTracking.currentHoverboard = hoverboardName;
                    if (characterTracking.unlockedHoverboards.indexOf(hoverboardName) === -1) {
                        characterTracking.unlockedHoverboards.push(hoverboardName);
                    }
                    
                    return true;
                }
            }
            
            // Try case-insensitive match
            if (textMatches("(?i)" + hoverboardName).exists()) {
                var hoverboardElement = textMatches("(?i)" + hoverboardName).findOne(1000);
                if (hoverboardElement) {
                    hoverboardElement.click();
                    
                    // Update hoverboard tracking
                    characterTracking.currentHoverboard = hoverboardName;
                    if (characterTracking.unlockedHoverboards.indexOf(hoverboardName) === -1) {
                        characterTracking.unlockedHoverboards.push(hoverboardName);
                    }
                    
                    return true;
                }
            }
            
            console.error("Hoverboard not found: " + hoverboardName);
            return false;
        } catch (e) {
            console.error("Error selecting hoverboard: " + e.message);
            return false;
        }
    },
    
    /**
     * Performs a shop purchase if enough coins are available
     * @param {string} itemName - Name of the item to purchase
     * @return {boolean} Success status
     */
    purchaseItem: function(itemName) {
        // First navigate to shop menu
        if (!this.navigateToMenu("shop")) {
            console.error("Failed to navigate to shop menu");
            return false;
        }
        
        // Wait for shop to load
        sleep(1000);
        
        try {
            // Look for the item
            if (text(itemName).exists() || textContains(itemName).exists()) {
                var itemElement = text(itemName).exists() ? 
                    text(itemName).findOne(1000) : 
                    textContains(itemName).findOne(1000);
                
                if (itemElement) {
                    // Click on the item
                    itemElement.click();
                    sleep(500);
                    
                    // Look for purchase button
                    var purchaseKeywords = [
                        "BUY", "PURCHASE", "ACQUISTA", "COMPRAR", "ACHETER", "KAUFEN"
                    ];
                    
                    for (var i = 0; i < purchaseKeywords.length; i++) {
                        if (text(purchaseKeywords[i]).exists()) {
                            var buyButton = text(purchaseKeywords[i]).findOne(1000);
                            if (buyButton) {
                                buyButton.click();
                                sleep(1000);
                                
                                // Check for confirmation or success message
                                if (this.checkPurchaseSuccess()) {
                                    console.log("Successfully purchased: " + itemName);
                                    return true;
                                } else {
                                    console.log("Purchase may have failed for: " + itemName);
                                    return false;
                                }
                            }
                        }
                    }
                    
                    console.error("Purchase button not found for: " + itemName);
                    return false;
                }
            }
            
            console.error("Item not found in shop: " + itemName);
            return false;
        } catch (e) {
            console.error("Error purchasing item: " + e.message);
            return false;
        }
    },
    
    /**
     * Checks if a purchase was successful
     * @return {boolean} True if purchase appears successful
     */
    checkPurchaseSuccess: function() {
        // Look for success indicators
        var successKeywords = [
            "SUCCESS", "PURCHASED", "UNLOCKED", "ACQUISTATO", "SBLOCCATO",
            "COMPRADO", "DESBLOQUEADO", "ACHETÉ", "DÉBLOQUÉ", "GEKAUFT", "FREIGESCHALTET"
        ];
        
        for (var i = 0; i < successKeywords.length; i++) {
            if (textContains(successKeywords[i]).exists()) {
                return true;
            }
        }
        
        // Look for failure indicators
        var failureKeywords = [
            "NOT ENOUGH", "INSUFFICIENT", "FAILED", "NON ABBASTANZA", "INSUFFICIENTE",
            "NO SUFICIENTE", "INSUFICIENTE", "PAS ASSEZ", "INSUFFISANT", "NICHT GENUG", "UNZUREICHEND"
        ];
        
        for (var i = 0; i < failureKeywords.length; i++) {
            if (textContains(failureKeywords[i]).exists()) {
                return false;
            }
        }
        
        // If no clear indicators, assume success
        return true;
    },
    
    /**
     * Gets the current mission progress
     * @return {Object} Mission progress information
     */
    getMissionProgress: function() {
        return {
            currentMissions: missionTracking.currentMissions,
            completedMissions: missionTracking.completedMissions,
            missionProgress: missionTracking.missionProgress
        };
    },
    
    /**
     * Gets character and hoverboard information
     * @return {Object} Character and hoverboard information
     */
    getCharacterInfo: function() {
        return {
            currentCharacter: characterTracking.currentCharacter,
            unlockedCharacters: characterTracking.unlockedCharacters,
            currentHoverboard: characterTracking.currentHoverboard,
            unlockedHoverboards: characterTracking.unlockedHoverboards
        };
    }
};