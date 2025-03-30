# Subway Surfers Bot User Guide

## Introduction

This guide provides detailed instructions for installing, configuring, and using the Subway Surfers Bot. The bot is designed to run on the MEmu emulator using AutoJS and can operate in both training and auto-play modes.

## Installation

### Prerequisites

1. **MEmu Emulator** - Download and install from [MEmu's official website](https://www.memuplay.com/)
2. **AutoJS Pro** (or compatible version) - Install on your emulator
3. **Subway Surfers** - Install the game from the Google Play Store within MEmu

### Setup Steps

1. **Prepare the emulator**:
   - Set MEmu resolution to 1280x720 (recommended)
   - Allocate at least 2GB RAM and 2 CPU cores to the emulator
   - Enable root access in MEmu settings

2. **Install the bot**:
   - Download the bot files
   - Copy all files to your emulator's storage at `/storage/emulated/0/SubwayBot/`
   - Ensure you maintain the folder structure as shown in the README.md

3. **Configure permissions**:
   - Open AutoJS in your emulator
   - Grant all required permissions:
     - Accessibility Service
     - Screen Capture permission
     - Storage permission

## Configuration

The bot's behavior can be customized by editing the `config.js` file. Here are the key settings you can adjust:

### General Settings

```javascript
// General settings
version: "2.3",
debug: true,  // Set to false in production for better performance
```

### Training Mode Settings

```javascript
training: {
    manualMode: true,  // Start in training mode by default
    dataPath: "/storage/emulated/0/SubwayBot/data/",
    trainingPath: "/storage/emulated/0/SubwayBot/training_data/",
    screenshotPath: "/storage/emulated/0/SubwayBot/screenshots/",
    sampleRate: 200,  // ms between samples (lower = more data, higher CPU usage)
    minActionInterval: 500  // ms between actions
},
```

### Vision Detection Settings

```javascript
vision: {
    colorThreshold: 40,  // Color matching threshold (lower = more precise)
    playerThreshold: 30,  // Player detection threshold
    enableLearning: true, // Enable learning from gameplay
    // ... other vision settings
},
```

### Neural Network Settings

```javascript
neuralNet: {
    enabled: true,  // Set to false to use only rule-based decisions
    modelPath: "/storage/emulated/0/SubwayBot/model/",
    inputNodes: 20,
    hiddenNodes: 16,
    outputNodes: 4,  // left, right, jump, roll
    learningRate: 0.1
},
```

### Reinforcement Learning Settings

```javascript
reinforcementLearning: {
    enabled: true,  // Set to false to use only neural network or rule-based
    // ... other RL settings
},
```

## Using the Bot

### Starting the Bot

1. Open AutoJS in your emulator
2. Navigate to `/storage/emulated/0/SubwayBot/`
3. Run `main.js`
4. Grant all required permissions when prompted

### Switching Modes

The bot has two primary modes of operation:

1. **Training Mode** - You control the game while the bot records your actions
2. **Auto-Play Mode** - The bot plays the game automatically

To switch between modes:
- Tap the floating mode button (labeled "M") that appears on the screen
- The button will change color (green for training, blue for auto-play)

### Training Mode Controls

In training mode, you can use either touch controls or keyboard controls:

**Keyboard Controls**:
- **W or Up Arrow**: Jump
- **S or Down Arrow**: Roll
- **A or Left Arrow**: Move Left
- **D or Right Arrow**: Move Right
- **Space or H**: Use Hoverboard

**Training UI**:
- Tap the "REC" button to start/stop recording your gameplay
- Tap the menu button (≡) to access training session management

### Auto-Play Mode

In auto-play mode, the bot will:
1. Launch the game if not already running
2. Navigate menus automatically
3. Play the game using either rule-based decisions, neural network, or reinforcement learning (depending on configuration)
4. Restart automatically after game over (if configured)

## Advanced Features

### Data Collection

The bot collects training data in the following locations:
- Screenshots: `/storage/emulated/0/SubwayBot/screenshots/`
- Actions: `/storage/emulated/0/SubwayBot/data/actions/`
- Sessions: `/storage/emulated/0/SubwayBot/data/sessions/`
- Merged training data: `/storage/emulated/0/SubwayBot/training_data/`

### Neural Network Training

The neural network is trained using collected gameplay data. The model is saved to:
`/storage/emulated/0/SubwayBot/model/`

To force retraining of the neural network:
1. Delete the existing model files
2. Restart the bot

### Performance Optimization

If you experience performance issues:
1. Set `debug: false` in config.js
2. Increase `frameSkip` in the vision.performance settings
3. Set `lowResolutionMode: true` for faster processing
4. Reduce `sampleRate` in training settings

## Troubleshooting

### Common Issues

1. **Screen Capture Permission Denied**
   - Restart AutoJS
   - Grant permissions again
   - Restart the emulator if needed

2. **Module Import Errors**
   - Verify all files are in the correct location
   - Check folder structure matches the README.md
   - Ensure proper read/write permissions

3. **Game Not Detected**
   - Check if the game is installed and updated
   - Verify the package name in config.js matches your game version
   - Try adjusting vision detection thresholds

4. **Poor Performance**
   - Allocate more resources to the emulator
   - Adjust performance settings in config.js
   - Close other applications running in the emulator

5. **Bot Not Responding to Controls**
   - Check if Accessibility Service is enabled
   - Adjust control timing in config.js
   - Restart the bot and the game

### Logs and Debugging

Log files are stored in:
`/storage/emulated/0/SubwayBot/logs/`

To enable verbose logging, set `debug: true` in config.js.

## Support and Updates

For support and updates, refer to the project repository. If you encounter issues not covered in this guide, check the troubleshooting section in the README.md or submit an issue on the project repository.

## Advanced Configuration

For advanced users who want to modify the bot's behavior beyond the standard configuration options, refer to the DOCUMENTATION.md file for a detailed explanation of the bot's architecture and module interactions.