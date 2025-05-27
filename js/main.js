// js/main.js
import { initScene, updateStatus } from './scene.js';
import { loadModels, updateModels } from './modelloader.js';
import { initHandTracking, startHandTracking, stopHandTracking } from './mediapipe.js';
import { 
  initializePrayer, 
  handleHandResults, 
  updatePrayer, 
  triggerPrayer, 
  getPrayerStats,
  startPrayerSession,
  stopPrayerSession,
  getPrayerSessionStatus
} from './prayer.js';

// Application state
let appInitialized = false;
let handTrackingInitialized = false;
let prayerSessionActive = false;

/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
  updateStatus('Initializing 3D Prayer Experience...');
  console.log('Starting 3D Prayer Interaction application...');
  
  try {
    // Initialize in sequence
    await initializeApplication();
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    updateStatus('Error: Failed to initialize application');
  }
});

/**
 * Initialize all application systems
 */
async function initializeApplication() {
  // Step 1: Initialize Three.js scene
  updateStatus('Setting up 3D scene...');
  initScene('threecontainer');
  await sleep(500); // Give scene time to initialize
  
  // Step 2: Load 3D models
  updateStatus('Loading 3D models...');
  loadModels(true); // Load real models
  await sleep(1000); // Wait for models to load
  
  // Step 3: Initialize prayer interaction system
  updateStatus('Setting up prayer system...');
  initializePrayer();
  
  // Step 4: Set up UI controls
  setupUIControls();
  
  // Step 5: Initialize hand tracking (but don't start it yet)
  updateStatus('Initializing hand tracking...');
  await initializeHandTracking();
  
  // Step 6: Start main application loop
  startApplicationLoop();
  
  // Mark as initialized
  appInitialized = true;
  updateStatus('Ready! Click "Start Prayer" to begin prayer session 🙏');
  console.log('Application initialized successfully!');
}

/**
 * Set up UI controls
 */
function setupUIControls() {
  const prayButton = document.getElementById('prayBtn');
  
  if (prayButton) {
    prayButton.addEventListener('click', () => {
      if (!prayerSessionActive) {
        // Start prayer session
        startPrayerSessionWithHandTracking();
      } else {
        // Stop prayer session
        stopPrayerSessionWithHandTracking();
      }
    });
  } else {
    console.error('Pray button not found!');
  }
}

/**
 * Start prayer session with hand tracking
 */
function startPrayerSessionWithHandTracking() {
  if (!handTrackingInitialized) {
    updateStatus('Error: Hand tracking not available');
    return;
  }
  
  // Start prayer session
  startPrayerSession();
  prayerSessionActive = true;
  
  // Start hand tracking
  const success = startHandTracking();
  if (!success) {
    updateStatus('Error: Could not start hand tracking');
    stopPrayerSessionWithHandTracking();
    return;
  }
  
  // Update button
  const prayButton = document.getElementById('prayBtn');
  if (prayButton) {
    prayButton.textContent = '⏹️ Stop Prayer';
    prayButton.classList.add('prayer-active');
  }
  
  updateStatus('Prayer session started! Join hands together 🙏');
  console.log('Prayer session with hand tracking activated');
}

/**
 * Stop prayer session and hand tracking
 */
function stopPrayerSessionWithHandTracking() {
  // Stop hand tracking
  stopHandTracking();
  
  // Stop prayer session
  stopPrayerSession();
  prayerSessionActive = false;
  
  // Update button
  const prayButton = document.getElementById('prayBtn');
  if (prayButton) {
    prayButton.textContent = '🙏 Start Prayer';
    prayButton.classList.remove('prayer-active');
  }
  
  updateStatus('Prayer session ended. Models are now static.');
  console.log('Prayer session deactivated');
}

/**
 * Initialize MediaPipe hand tracking
 */
async function initializeHandTracking() {
  const videoElement = document.getElementById('videoElement');
  
  if (!videoElement) {
    console.error('Video element not found');
    updateStatus('Error: Video element not found');
    return;
  }
  
  try {
    // Check if MediaPipe is available
    if (typeof Hands === 'undefined') {
      throw new Error('MediaPipe Hands not loaded');
    }
    
    // Initialize hand tracking (but don't start camera yet)
    const success = initHandTracking(videoElement, onHandTrackingResults);
    if (success) {
      handTrackingInitialized = true;
      console.log('Hand tracking initialized successfully');
    } else {
      throw new Error('Failed to initialize hand tracking');
    }
    
  } catch (error) {
    console.error('Hand tracking initialization failed:', error);
    updateStatus('Warning: Hand tracking not available - manual test mode only');
    handTrackingInitialized = false;
  }
}

/**
 * Handle hand tracking results
 * @param {Object} results - Processed hand tracking results
 */
function onHandTrackingResults(results) {
  if (!appInitialized || !prayerSessionActive) return;
  
  try {
    // Forward results to prayer system
    handleHandResults(results);
    
    // Update UI with current gesture info
    updateGestureUI(results);
    
  } catch (error) {
    console.error('Error processing hand tracking results:', error);
  }
}

/**
 * Update UI with gesture information
 */
function updateGestureUI(results) {
  if (!results.distances) return;
  
  const { indexDistance, palmDistance } = results.distances;
  
  // Update status with distance information
  if (results.isPrayerGesture) {
    const indexCm = (indexDistance * 100).toFixed(1);
    const palmCm = (palmDistance * 100).toFixed(1);
    
    // Check if currently praying
    const prayerStatus = getPrayerSessionStatus();
    if (prayerStatus.isPraying) {
      updateStatus(`🙏 Praying - Index: ${indexCm}cm, Palm: ${palmCm}cm (Particle Scale Controlled)`);
    } else {
      updateStatus(`Prayer gesture detected - Index: ${indexCm}cm, Palm: ${palmCm}cm`);
    }
  }
}

/**
 * Main application update loop
 */
function startApplicationLoop() {
  function applicationLoop() {
    try {
      // Update models
      updateModels();
      
      // Update prayer system
      updatePrayer();
      
      // Continue loop
      requestAnimationFrame(applicationLoop);
      
    } catch (error) {
      console.error('Error in application loop:', error);
    }
  }
  
  // Start the loop
  applicationLoop();
  console.log('Application loop started');
}

/**
 * Utility function for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle window focus/blur for performance optimization
 */
window.addEventListener('focus', () => {
  console.log('Window focused - resuming full performance');
});

window.addEventListener('blur', () => {
  console.log('Window blurred - reducing performance for battery saving');
});

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  updateStatus('Error occurred - check console for details');
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  updateStatus('Error occurred - check console for details');
});

/**
 * Development/debugging functions
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Development mode - add debug functions to global scope
  window.debugPrayer = {
    getAppState: () => ({
      initialized: appInitialized,
      handTracking: handTrackingInitialized,
      prayerSession: prayerSessionActive
    }),
    
    triggerPrayer: () => {
      if (!prayerSessionActive) {
        startPrayerSessionWithHandTracking();
        // Auto-trigger prayer for testing
        setTimeout(() => {
          triggerPrayer();
        }, 1000);
      } else {
        triggerPrayer();
      }
    },
    
    getStats: getPrayerStats,
    
    startSession: startPrayerSessionWithHandTracking,
    stopSession: stopPrayerSessionWithHandTracking,
    
    testGesture: (indexDist = 0.1, palmDist = 0.08) => {
      // Simulate gesture for testing
      const mockResults = {
        handsDetected: 2,
        hands: [],
        distances: {
          indexDistance: indexDist,
          palmDistance: palmDist
        },
        isPrayerGesture: palmDist < 0.15 && indexDist < 0.2,
        keyPoints: {}
      };
      
      onHandTrackingResults(mockResults);
    },
    
    // Test different gesture distances
    testCloseGesture: () => window.debugPrayer.testGesture(0.05, 0.03),
    testMediumGesture: () => window.debugPrayer.testGesture(0.15, 0.10),
    testFarGesture: () => window.debugPrayer.testGesture(0.25, 0.18)
  };
  
  console.log('Development mode: debug functions available via window.debugPrayer');
  console.log('Try: window.debugPrayer.testCloseGesture() for close hand test');
  console.log('Try: window.debugPrayer.testFarGesture() for far hand test');
}

// Export for potential external use
export {
  initializeApplication,
  onHandTrackingResults,
  startPrayerSessionWithHandTracking,
  stopPrayerSessionWithHandTracking
};