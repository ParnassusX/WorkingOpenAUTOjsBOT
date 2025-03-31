// Enhanced touch detection variables
var lastTouchX = 0;
var lastTouchY = 0;
var touchStartTime = 0;
var lastActionTime = 0;
var gestureHistory = [];
exports.gestureHistory = gestureHistory;
var keyboardControlsActive = false;

// Base path for the emulator environment
var emulatorBasePath = "/storage/emulated/0/SubwayBot/";

// Import duplicate detector utility


// Optimized Click Timing
const { performance } = require('perf_hooks');
// Remove system-sleep dependency and use AutoJS's built-in sleep function
// const { sleep } = require('system-sleep');

function optimizedClick(x, y) {
    const start = performance.now();
    press(x, y);
    while (performance.now() - start < 22) {
        // Use AutoJS's built-in sleep function instead
        sleep(1); // Use 1ms sleep as minimum in AutoJS
    }
    release(x, y);
}