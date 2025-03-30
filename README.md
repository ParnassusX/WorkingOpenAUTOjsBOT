# Subway Surfers Bot for AutoJS

## Overview
This is an automated bot for playing Subway Surfers on the MEmu emulator using AutoJS, featuring enhanced vision and detection capabilities. The bot can run in two modes:
- **Training Mode**: You control the game while the bot records your actions
- **Auto-Play Mode**: The bot plays the game automatically

## Setup Instructions

### Required Software
- MEmu Emulator
- AutoJS Pro (or compatible version)
- Subway Surfers game installed in the emulator

### Installation
1. Copy all files to your emulator's storage at `/storage/emulated/0/SubwayBot/`
2. Make sure to maintain the folder structure:
   ```
   /storage/emulated/0/SubwayBot/
   ├── config.js
   ├── main.js
   ├── modules/
   │   ├── brain.js
   │   ├── data_processing.js
   │   ├── dataset_versioning.js
   │   ├── gameElements.js
   │   ├── models/
   │   ├── neural_network.js
   │   ├── ui.js
   │   ├── utils.js
   │   └── vision.js
   ```

### Running the Bot
1. Open AutoJS in your emulator
2. Navigate to `/storage/emulated/0/SubwayBot/`
3. Run `main.js`
4. Grant all required permissions when prompted

## Troubleshooting

### Module Import Errors
If you see errors like "Can't resolve relative module ID", make sure:
- All files are in the correct location (`/storage/emulated/0/SubwayBot/`)
- The folder structure is maintained exactly as shown above
- You have proper read/write permissions for the storage location

### Permission Issues
The bot requires:
- Accessibility Service (for detecting game elements)
- Screen Capture permission (for analyzing the game)
- Storage permission (for saving training data)

## Production Deployment

Before deploying to production, run the compatibility tests to ensure the bot works correctly with your environment:

1. Open AutoJS in your emulator
2. Load and run the `run_compatibility_tests.js` script
3. Check the test results and fix any compatibility issues
4. Only proceed with deployment if all compatibility tests pass

## Controls (Training Mode)
- **W or Up Arrow**: Jump
- **S or Down Arrow**: Roll
- **A or Left Arrow**: Move Left
- **D or Right Arrow**: Move Right
- **Space or H**: Use Hoverboard

## Configuration
You can modify settings in `config.js` to adjust:
- Game detection sensitivity
- Action timing
- Training data storage locations
- And more

## Support
If you encounter any issues, try:
1. Restarting AutoJS
2. Checking all permissions are granted
3. Verifying file paths in the emulator