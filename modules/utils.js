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
const { sleep } = require('system-sleep');

function optimizedClick(x, y) {
    const start = performance.now();
    press(x, y);
    while (performance.now() - start < 22) {
        sleep(0.5); // 0.5ms precision via kernel timer
    }
    release(x, y);
}