# Subway Surfers Bot Documentation

## Architecture Overview

The Subway Surfers Bot is built on a modular architecture that separates concerns into distinct components. This design allows for easier maintenance, testing, and extension of functionality.

### Core Modules

1. **Brain Module** (`brain.js`)
   - Central decision-making component
   - Analyzes game environment and determines optimal actions
   - Coordinates between vision and control systems

2. **Vision Module** (`vision.js`)
   - Handles screen capture and image analysis
   - Detects game elements (obstacles, coins, powerups)
   - Identifies screen type (menu, gameplay, game over)
   - Supports different screen resolutions and languages

3. **Controls Module** (`controls.js`)
   - Manages touch gestures and keyboard inputs
   - Implements precise swipe mechanics
   - Handles timing calibration for responsive controls

4. **UI Module** (`ui.js`)
   - Handles game UI interaction
   - Detects and navigates menus
   - Manages in-game shop and character selection

5. **Utils Module** (`utils.js`)
   - Provides common utility functions
   - Handles file operations and logging
   - Manages environment setup and configuration

### Advanced AI Components

1. **Neural Network** (`neural_network.js`)
   - Implements a basic neural network for decision making
   - Handles model training, evaluation, and persistence
   - Processes game state into actionable decisions

2. **Reinforcement Learning** (`reinforcement_learning.js`)
   - Implements Q-learning for adaptive gameplay
   - Manages experience replay buffer
   - Handles reward calculation and policy updates

3. **Basic Decision System** (`basic_decision.js`)
   - Rule-based fallback decision system
   - Handles obstacle avoidance and coin collection
   - Used when AI systems are training or unavailable

### Training System

1. **Data Collection** (`data_collection.js`)
   - Records gameplay data for training
   - Captures screenshots with timestamps
   - Records user actions during training mode

2. **Data Processing** (`data_processing.js`)
   - Cleans and normalizes training data
   - Extracts features from raw gameplay data
   - Prepares data for neural network training

3. **Dataset Versioning** (`dataset_versioning.js`)
   - Manages different versions of training datasets
   - Tracks dataset changes and improvements
   - Enables reverting to previous datasets if needed

4. **Training UI** (`training_ui.js`)
   - Provides interface for training mode
   - Shows recording status and session information
   - Allows reviewing and managing training data

### Performance & Reliability

1. **Performance Optimization** (`performance_optimization.js`)
   - Optimizes image processing for reduced CPU usage
   - Implements region-of-interest (ROI) based processing
   - Manages frame skipping and memory resources

2. **Reliability Components** (in `reliability/` folder)
   - **Crash Recovery** - Handles error detection and recovery
   - **Error Detection** - Identifies and corrects common errors
   - **Performance Monitor** - Tracks system resources and performance

### Testing Framework

1. **Testing Components** (in `testing/` folder)
   - **Unit Tests** - Tests individual functions
   - **Integration Tests** - Tests module interactions
   - **Performance Benchmarks** - Measures system performance
   - **Stability Tests** - Tests long-term reliability

## Data Flow

1. **Screen Capture** → Vision Module analyzes the current game state
2. **Game State** → Brain Module processes the state and decides on actions
3. **Decision** → Controls Module executes the chosen action
4. **Feedback Loop** → Vision Module captures the new state after action

During training mode, the Data Collection module records all states and actions for later training.

## Configuration

The bot's behavior is controlled by the `config.js` file, which contains settings for:

- Vision detection sensitivity
- Control timing and responsiveness
- Neural network parameters
- Reinforcement learning settings
- Performance optimization options
- Training data paths and settings

## Usage Modes

### Training Mode

In training mode, the user controls the game while the bot records gameplay data. This data is used to train the neural network and reinforcement learning models.

### Auto-Play Mode

In auto-play mode, the bot plays the game autonomously using either:

1. **Rule-based system** (Basic Decision module)
2. **Neural network** for more advanced decision making
3. **Reinforcement learning** for adaptive gameplay

## Implementation Status

Refer to the `ROADMAP.md` file for the current implementation status of each feature.

## Extending the Bot

To add new features:

1. Identify the appropriate module for your feature
2. Follow the existing code patterns and documentation standards
3. Add appropriate configuration options to `config.js`
4. Update tests to cover new functionality
5. Update documentation to reflect changes

## Troubleshooting

Common issues:

1. **Screen capture fails** - Check permissions and AutoJS settings
2. **Controls not responsive** - Adjust timing in configuration
3. **Game not detected** - Check vision settings and screen resolution
4. **Performance issues** - Adjust performance optimization settings

Refer to the README.md for basic troubleshooting steps.


## Future Enhancements

To further improve the Subway Surfers Bot, the following core steps are recommended:

1. **Enhance Vision and Detection Systems**
   - Integrate advanced image recognition techniques to improve obstacle and item detection.
   - Implement machine learning models for dynamic environment adaptation.

2. **Optimize Performance**
   - Refactor code for better CPU and memory efficiency.
   - Implement asynchronous processing where applicable to reduce latency.

3. **Improve Decision-Making Algorithms**
   - Develop more sophisticated AI models for decision-making.
   - Integrate reinforcement learning for adaptive gameplay strategies.

4. **Expand Capabilities**
   - Enable the bot to handle more complex game scenarios and missions.
   - Add support for new game features and updates.

5. **Code Quality and Maintenance**
   - Conduct regular code reviews to ensure adherence to best practices.
   - Enhance documentation and comments for better maintainability.

These enhancements aim to make the bot more robust, efficient, and capable of handling a wider range of gameplay scenarios.