// js/mediapipe.js - Hand Tracking System
import { updateStatus } from './scene.js';

let hands = null;
let camera = null;
let onHandResultsCallback = null;
let debugCanvas = null;
let debugCtx = null;
let isActive = false;

/**
 * Initialize MediaPipe hand tracking
 * @param {HTMLVideoElement} videoElement - Hidden video element for camera feed
 * @param {Function} onResults - Callback function to handle hand tracking results
 */
export async function initHandTracking(videoElement, onResults) {
    updateStatus('Initializing hand tracking...');
    onHandResultsCallback = onResults;
    
    // Check if MediaPipe libraries are loaded
    if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
        console.error('MediaPipe libraries not loaded');
        updateStatus('Error: MediaPipe libraries not found');
        return false;
    }
    
    try {
        // Setup debug canvas
        setupDebugCanvas();
        
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
                if (isActive && hands) {
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
 * Setup debug canvas for hand visualization
 */
function setupDebugCanvas() {
    debugCanvas = document.getElementById('debugCanvas');
    if (!debugCanvas) {
        console.warn('Debug canvas not found');
        return;
    }
    
    debugCanvas.width = 640;
    debugCanvas.height = 480;
    debugCtx = debugCanvas.getContext('2d');
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
    
    // Show debug canvas
    if (debugCanvas) {
        debugCanvas.style.display = 'block';
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
    
    // Hide debug canvas
    if (debugCanvas) {
        debugCanvas.style.display = 'none';
    }
    
    if (camera) {
        camera.stop();
    }
    
    // Clear debug canvas
    if (debugCtx && debugCanvas) {
        debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    }
    
    updateStatus('Hand tracking stopped');
    console.log('Hand tracking stopped');
}

/**
 * Internal callback for MediaPipe hand results
 */
function onHandResults(results) {
    if (!isActive) return;
    
    // Draw debug visualization
    drawDebugVisualization(results);
    
    // Process results and forward to callback
    if (onHandResultsCallback) {
        const processedResults = processHandResults(results);
        onHandResultsCallback(processedResults);
    }
}

/**
 * Draw debug visualization on canvas
 */
function drawDebugVisualization(results) {
    if (!debugCtx || !debugCanvas) return;
    
    debugCtx.save();
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    
    // Draw the video feed
    if (results.image) {
        debugCtx.drawImage(results.image, 0, 0, debugCanvas.width, debugCanvas.height);
    }
    
    // Draw hand landmarks
    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i] ? results.multiHandedness[i].label : 'Unknown';
            
            // Draw hand connections
            drawHandConnections(landmarks);
            
            // Draw landmark points
            drawLandmarkPoints(landmarks, handedness);
            
            // Highlight key points
            highlightKeyPoints(landmarks, handedness);
        }
        
        // Draw gesture information if both hands detected
        if (results.multiHandLandmarks.length === 2) {
            drawGestureInfo(results.multiHandLandmarks);
        }
    }
    
    debugCtx.restore();
}

/**
 * Draw hand connections
 */
function drawHandConnections(landmarks) {
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
    
    debugCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    debugCtx.lineWidth = 2;
    debugCtx.beginPath();
    
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        debugCtx.moveTo(startPoint.x * debugCanvas.width, startPoint.y * debugCanvas.height);
        debugCtx.lineTo(endPoint.x * debugCanvas.width, endPoint.y * debugCanvas.height);
    });
    
    debugCtx.stroke();
}

/**
 * Draw landmark points
 */
function drawLandmarkPoints(landmarks, handedness) {
    const color = handedness === 'Left' ? '#00ff00' : '#ff0000';
    
    landmarks.forEach((landmark, index) => {
        debugCtx.fillStyle = color;
        debugCtx.beginPath();
        debugCtx.arc(
            landmark.x * debugCanvas.width,
            landmark.y * debugCanvas.height,
            3, 0, 2 * Math.PI
        );
        debugCtx.fill();
    });
}

/**
 * Highlight key points (index finger tip and palm center)
 */
function highlightKeyPoints(landmarks, handedness) {
    const indexTip = landmarks[8];  // Index finger tip
    const palmCenter = landmarks[9]; // Palm center approximation
    
    // Highlight index finger tip
    debugCtx.fillStyle = '#ffff00';
    debugCtx.strokeStyle = '#ffffff';
    debugCtx.lineWidth = 2;
    debugCtx.beginPath();
    debugCtx.arc(
        indexTip.x * debugCanvas.width,
        indexTip.y * debugCanvas.height,
        8, 0, 2 * Math.PI
    );
    debugCtx.fill();
    debugCtx.stroke();
    
    // Highlight palm center
    debugCtx.fillStyle = '#00ffff';
    debugCtx.beginPath();
    debugCtx.arc(
        palmCenter.x * debugCanvas.width,
        palmCenter.y * debugCanvas.height,
        6, 0, 2 * Math.PI
    );
    debugCtx.fill();
    debugCtx.stroke();
    
    // Draw labels
    debugCtx.fillStyle = '#ffffff';
    debugCtx.font = '12px Arial';
    debugCtx.fillText(
        `${handedness} Index`,
        indexTip.x * debugCanvas.width + 10,
        indexTip.y * debugCanvas.height - 5
    );
    debugCtx.fillText(
        `${handedness} Palm`,
        palmCenter.x * debugCanvas.width + 10,
        palmCenter.y * debugCanvas.height - 5
    );
}

/**
 * Draw gesture information for prayer detection
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
    debugCtx.strokeStyle = '#ff00ff';
    debugCtx.lineWidth = 3;
    debugCtx.setLineDash([5, 5]);
    
    // Index finger distance line
    debugCtx.beginPath();
    debugCtx.moveTo(leftIndex.x * debugCanvas.width, leftIndex.y * debugCanvas.height);
    debugCtx.lineTo(rightIndex.x * debugCanvas.width, rightIndex.y * debugCanvas.height);
    debugCtx.stroke();
    
    // Palm distance line
    debugCtx.beginPath();
    debugCtx.moveTo(leftPalm.x * debugCanvas.width, leftPalm.y * debugCanvas.height);
    debugCtx.lineTo(rightPalm.x * debugCanvas.width, rightPalm.y * debugCanvas.height);
    debugCtx.stroke();
    
    debugCtx.setLineDash([]);
    
    // Draw distance text
    debugCtx.fillStyle = '#ffffff';
    debugCtx.fillRect(10, 10, 220, 100);
    debugCtx.fillStyle = '#000000';
    debugCtx.font = '14px Arial';
    debugCtx.fillText(`Index Distance: ${(indexDistance * 100).toFixed(1)}cm`, 15, 30);
    debugCtx.fillText(`Palm Distance: ${(palmDistance * 100).toFixed(1)}cm`, 15, 50);
    
    // Prayer gesture indicator
    const isPrayerGesture = palmDistance < 0.25 && indexDistance < 0.35;
    debugCtx.fillStyle = isPrayerGesture ? '#00ff00' : '#ff0000';
    debugCtx.fillText(`Prayer Gesture: ${isPrayerGesture ? 'YES' : 'NO'}`, 15, 70);
    
    // Show thresholds for reference
    debugCtx.fillStyle = '#666666';
    debugCtx.font = '12px Arial';
    debugCtx.fillText(`Thresholds: Palm<25cm, Index<35cm`, 15, 90);
}

/**
 * Process hand results for gesture detection
 */
function processHandResults(results) {
    const processedResults = {
        handsDetected: results.multiHandLandmarks ? results.multiHandLandmarks.length : 0,
        hands: results.multiHandLandmarks || [],
        handedness: results.multiHandedness || [],
        
        // Connect mode gestures
        pointingGesture: null,
        
        // Prayer mode gestures
        prayerGesture: null,
        distances: null,
        
        // Raw results for advanced processing
        rawResults: results
    };
    
    // Process pointing gesture (for connect mode)
    if (processedResults.handsDetected > 0) {
        const firstHand = processedResults.hands[0];
        processedResults.pointingGesture = {
            isPointing: isPointingGesture(firstHand),
            indexTip: firstHand[8],
            hand: firstHand
        };
    }
    
    // Process prayer gesture (for prayer mode)
    if (processedResults.handsDetected === 2) {
        const leftHand = processedResults.hands[0];
        const rightHand = processedResults.hands[1];
        
        const leftIndex = leftHand[8];
        const rightIndex = rightHand[8];
        const leftPalm = leftHand[9];
        const rightPalm = rightHand[9];
        
        const indexDistance = calculateDistance(leftIndex, rightIndex);
        const palmDistance = calculateDistance(leftPalm, rightPalm);
        
        processedResults.distances = {
            indexDistance,
            palmDistance
        };
        
        processedResults.prayerGesture = {
            isPrayerGesture: palmDistance < 0.25 && indexDistance < 0.35,
            distances: processedResults.distances,
            keyPoints: {
                leftIndex,
                rightIndex,
                leftPalm,
                rightPalm
            }
        };
    }
    
    return processedResults;
}

/**
 * Check if hand is making pointing gesture
 */
function isPointingGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const indexMcp = landmarks[5];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Index finger extended
    const indexExtended = indexTip.y < indexPip.y && indexPip.y < indexMcp.y;
    
    // Other fingers folded
    const middleFolded = middleTip.y > middlePip.y;
    const ringFolded = ringTip.y > landmarks[14].y;
    const pinkyFolded = pinkyTip.y > landmarks[18].y;
    
    return indexExtended && middleFolded && ringFolded && pinkyFolded;
}

/**
 * Calculate distance between two landmark points
 */
export function calculateDistance(point1, point2) {
    if (!point1 || !point2) return 0;
    
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
        hasDebugCanvas: debugCanvas !== null
    };
}

/**
 * Convert screen coordinates to normalized coordinates
 */
export function screenToNormalized(x, y, width, height) {
    return {
        x: x / width,
        y: y / height
    };
}

/**
 * Convert normalized coordinates to screen coordinates
 */
export function normalizedToScreen(normalizedX, normalizedY, width, height) {
    return {
        x: normalizedX * width,
        y: normalizedY * height
    };
}