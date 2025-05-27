// js/mediapipe.js
import { updateStatus } from './scene.js';

let hands = null;
let camera = null;
let onHandResultsCallback = null;
let canvasElement = null;
let canvasCtx = null;
let isActive = false;

/**
 * Initialize MediaPipe hand tracking
 * @param {HTMLVideoElement} videoElement - Hidden video element for camera feed
 * @param {Function} onResults - Callback function to handle hand tracking results
 */
export function initHandTracking(videoElement, onResults) {
  updateStatus('Initializing hand tracking...');
  onHandResultsCallback = onResults;
  
  // Check if MediaPipe libraries are loaded
  if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
    console.error('MediaPipe libraries not loaded');
    updateStatus('Error: MediaPipe libraries not found');
    return;
  }
  
  try {
    // Create canvas for drawing landmarks
    createLandmarkCanvas();
    
    // Initialize MediaPipe Hands
    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    // Configure hand detection options
    hands.setOptions({
      maxNumHands: 2,              // Detect up to 2 hands
      modelComplexity: 1,          // 0=lite, 1=full (better accuracy)
      minDetectionConfidence: 0.5, // Minimum confidence for detection
      minTrackingConfidence: 0.5   // Minimum confidence for tracking
    });
    
    // Set up results callback
    hands.onResults(onHandResults);
    
    // Initialize camera
    camera = new Camera(videoElement, {
      onFrame: async () => {
        if (isActive) {
          try {
            await hands.send({ image: videoElement });
          } catch (error) {
            console.error('Error processing frame:', error);
          }
        }
      },
      width: 640,
      height: 480
    });
    
    console.log('MediaPipe hand tracking initialized successfully');
    return true;
      
  } catch (error) {
    console.error('Error initializing hand tracking:', error);
    updateStatus('Error initializing hand tracking');
    return false;
  }
}

/**
 * Create canvas for drawing hand landmarks
 */
function createLandmarkCanvas() {
  // Create canvas element if it doesn't exist
  canvasElement = document.getElementById('landmarkCanvas');
  if (!canvasElement) {
    canvasElement = document.createElement('canvas');
    canvasElement.id = 'landmarkCanvas';
    canvasElement.width = 640;
    canvasElement.height = 480;
    canvasElement.style.position = 'fixed';
    canvasElement.style.top = '20px';
    canvasElement.style.right = '20px';
    canvasElement.style.width = '300px';
    canvasElement.style.height = '200px';
    canvasElement.style.zIndex = '1001';
    canvasElement.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    canvasElement.style.borderRadius = '10px';
    canvasElement.style.background = 'rgba(0, 0, 0, 0.8)';
    canvasElement.style.display = 'none';
    document.body.appendChild(canvasElement);
  }
  
  canvasCtx = canvasElement.getContext('2d');
}

/**
 * Start hand tracking
 */
export function startHandTracking() {
  if (!camera) {
    console.error('Hand tracking not initialized');
    return false;
  }
  
  isActive = true;
  
  // Show canvas
  if (canvasElement) {
    canvasElement.style.display = 'block';
  }
  
  // Start camera
  camera.start()
    .then(() => {
      updateStatus('Hand tracking active - show your hands!');
      console.log('Hand tracking started');
    })
    .catch((error) => {
      console.error('Error starting camera:', error);
      updateStatus('Error: Could not access camera');
      isActive = false;
    });
    
  return true;
}

/**
 * Stop hand tracking
 */
export function stopHandTracking() {
  isActive = false;
  
  // Hide canvas
  if (canvasElement) {
    canvasElement.style.display = 'none';
  }
  
  if (camera) {
    camera.stop();
  }
  
  // Clear canvas
  if (canvasCtx) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
  
  updateStatus('Hand tracking stopped');
  console.log('Hand tracking stopped');
}

/**
 * Internal callback for MediaPipe hand results
 * Processes results, draws landmarks, and forwards to the main callback
 */
function onHandResults(results) {
  if (!isActive) return;
  
  // Clear canvas
  if (canvasCtx) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video feed
    if (results.image) {
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    
    // Draw hand landmarks
    if (results.multiHandLandmarks) {
      drawHandLandmarks(results);
    }
    
    canvasCtx.restore();
  }
  
  // Forward to main callback with processed data
  if (onHandResultsCallback) {
    const processedResults = processHandResults(results);
    onHandResultsCallback(processedResults);
  }
}

/**
 * Draw hand landmarks on canvas
 */
function drawHandLandmarks(results) {
  const { multiHandLandmarks, multiHandedness } = results;
  
  for (let i = 0; i < multiHandLandmarks.length; i++) {
    const landmarks = multiHandLandmarks[i];
    const handedness = multiHandedness && multiHandedness[i] ? multiHandedness[i].label : 'Unknown';
    
    // Draw connections
    drawConnections(landmarks);
    
    // Draw landmarks
    drawLandmarkPoints(landmarks, handedness);
    
    // Highlight important points (index finger and palm)
    highlightKeyPoints(landmarks, handedness, i);
  }
  
  // Draw gesture information
  if (multiHandLandmarks.length === 2) {
    drawGestureInfo(multiHandLandmarks);
  }
}

/**
 * Draw hand connections
 */
function drawConnections(landmarks) {
  const connections = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm
    [5, 9], [9, 13], [13, 17]
  ];
  
  canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  canvasCtx.lineWidth = 2;
  canvasCtx.beginPath();
  
  connections.forEach(([start, end]) => {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];
    
    canvasCtx.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
    canvasCtx.lineTo(endPoint.x * canvasElement.width, endPoint.y * canvasElement.height);
  });
  
  canvasCtx.stroke();
}

/**
 * Draw landmark points
 */
function drawLandmarkPoints(landmarks, handedness) {
  const color = handedness === 'Left' ? '#00ff00' : '#ff0000';
  
  landmarks.forEach((landmark, index) => {
    canvasCtx.fillStyle = color;
    canvasCtx.beginPath();
    canvasCtx.arc(
      landmark.x * canvasElement.width,
      landmark.y * canvasElement.height,
      3, 0, 2 * Math.PI
    );
    canvasCtx.fill();
  });
}

/**
 * Highlight key points (index finger tip and palm center)
 */
function highlightKeyPoints(landmarks, handedness, handIndex) {
  const indexTip = landmarks[8];  // Index finger tip
  const palmCenter = landmarks[9]; // Palm center approximation
  
  // Highlight index finger tip
  canvasCtx.fillStyle = '#ffff00';
  canvasCtx.strokeStyle = '#ffffff';
  canvasCtx.lineWidth = 2;
  canvasCtx.beginPath();
  canvasCtx.arc(
    indexTip.x * canvasElement.width,
    indexTip.y * canvasElement.height,
    8, 0, 2 * Math.PI
  );
  canvasCtx.fill();
  canvasCtx.stroke();
  
  // Highlight palm center
  canvasCtx.fillStyle = '#00ffff';
  canvasCtx.beginPath();
  canvasCtx.arc(
    palmCenter.x * canvasElement.width,
    palmCenter.y * canvasElement.height,
    6, 0, 2 * Math.PI
  );
  canvasCtx.fill();
  canvasCtx.stroke();
  
  // Draw labels
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.font = '12px Arial';
  canvasCtx.fillText(
    `${handedness} Index`,
    indexTip.x * canvasElement.width + 10,
    indexTip.y * canvasElement.height - 5
  );
  canvasCtx.fillText(
    `${handedness} Palm`,
    palmCenter.x * canvasElement.width + 10,
    palmCenter.y * canvasElement.height - 5
  );
}

/**
 * Draw gesture information
 */
function drawGestureInfo(hands) {
  const leftHand = hands[0];
  const rightHand = hands[1];
  
  const leftIndex = leftHand[8];
  const rightIndex = rightHand[8];
  const leftPalm = leftHand[9];
  const rightPalm = rightHand[9];
  
  // Calculate distances
  const indexDistance = calculateDistance(leftIndex, rightIndex);
  const palmDistance = calculateDistance(leftPalm, rightPalm);
  
  // Draw distance lines
  canvasCtx.strokeStyle = '#ff00ff';
  canvasCtx.lineWidth = 3;
  canvasCtx.setLineDash([5, 5]);
  
  // Index finger distance line
  canvasCtx.beginPath();
  canvasCtx.moveTo(leftIndex.x * canvasElement.width, leftIndex.y * canvasElement.height);
  canvasCtx.lineTo(rightIndex.x * canvasElement.width, rightIndex.y * canvasElement.height);
  canvasCtx.stroke();
  
  // Palm distance line
  canvasCtx.beginPath();
  canvasCtx.moveTo(leftPalm.x * canvasElement.width, leftPalm.y * canvasElement.height);
  canvasCtx.lineTo(rightPalm.x * canvasElement.width, rightPalm.y * canvasElement.height);
  canvasCtx.stroke();
  
  canvasCtx.setLineDash([]);
  
  // Draw distance text
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.fillRect(10, 10, 220, 100);
  canvasCtx.fillStyle = '#000000';
  canvasCtx.font = '14px Arial';
  canvasCtx.fillText(`Index Distance: ${(indexDistance * 100).toFixed(1)}cm`, 15, 30);
  canvasCtx.fillText(`Palm Distance: ${(palmDistance * 100).toFixed(1)}cm`, 15, 50);
  
  // Prayer gesture indicator - UPDATED THRESHOLDS
  const isPrayerGesture = palmDistance < 0.25 && indexDistance < 0.35;
  canvasCtx.fillStyle = isPrayerGesture ? '#00ff00' : '#ff0000';
  canvasCtx.fillText(`Prayer Gesture: ${isPrayerGesture ? 'YES' : 'NO'}`, 15, 70);
  
  // Show thresholds for reference
  canvasCtx.fillStyle = '#666666';
  canvasCtx.font = '12px Arial';
  canvasCtx.fillText(`Thresholds: Palm<25cm, Index<35cm`, 15, 90);
}

/**
 * Process hand results for prayer detection
 */
function processHandResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length < 2) {
    return {
      handsDetected: results.multiHandLandmarks ? results.multiHandLandmarks.length : 0,
      hands: [],
      distances: null,
      isPrayerGesture: false
    };
  }
  
  const leftHand = results.multiHandLandmarks[0];
  const rightHand = results.multiHandLandmarks[1];
  
  // Key points
  const leftIndex = leftHand[8];
  const rightIndex = rightHand[8];
  const leftPalm = leftHand[9];
  const rightPalm = rightHand[9];
  
  // Calculate distances
  const indexDistance = calculateDistance(leftIndex, rightIndex);
  const palmDistance = calculateDistance(leftPalm, rightPalm);
  
  // Determine prayer gesture - UPDATED THRESHOLDS
  const isPrayerGesture = palmDistance < 0.25 && indexDistance < 0.35;
  
  return {
    handsDetected: 2,
    hands: [leftHand, rightHand],
    distances: {
      indexDistance,
      palmDistance
    },
    isPrayerGesture,
    keyPoints: {
      leftIndex,
      rightIndex,
      leftPalm,
      rightPalm
    }
  };
}

/**
 * Calculate distance between two landmark points
 * @param {Object} point1 - First landmark {x, y, z}
 * @param {Object} point2 - Second landmark {x, y, z}
 * @returns {number} Distance between points
 */
export function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = (point1.z || 0) - (point2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if hand tracking is currently active
 */
export function isHandTrackingActive() {
  return isActive && hands !== null && camera !== null;
}

/**
 * Get current hand tracking status
 */
export function getHandTrackingStatus() {
  return {
    isActive,
    hasHands: hands !== null,
    hasCamera: camera !== null,
    hasCanvas: canvasElement !== null
  };
}

/**
 * Debug function to log hand tracking information
 * @param {Object} results - MediaPipe results
 */
export function debugHandTracking(results) {
  const processed = processHandResults(results);
  console.log('Hands detected:', processed.handsDetected);
  
  if (processed.distances) {
    console.log('Index finger distance:', processed.distances.indexDistance);
    console.log('Palm distance:', processed.distances.palmDistance);
    console.log('Prayer gesture:', processed.isPrayerGesture);
  }
}