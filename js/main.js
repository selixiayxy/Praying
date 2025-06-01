// js/main.js - Enhanced Main Application Controller
import { initScene, updateStatus } from './scene.js';
import { loadModels } from './modelloader.js';
import { initHandTracking, startHandTracking, stopHandTracking } from './mediapipe.js';
import { initConnectMode, startConnectMode, stopConnectMode, updateConnectMode, getConnectStats } from './connect.js';
import { initPrayerMode, startPrayerMode, stopPrayerMode, updatePrayer, getPrayerStats } from './prayer.js';
import { getDataStats, downloadDataAsFile, downloadFullDataAsFile, testIntersectionCalculation } from './datamanager.js';
import { initAudio } from './Audio.js';

// ============================================================================
// APPLICATION STATE
// ============================================================================

let appState = {
    mode: 'ready', // 'ready', 'connect', 'pray'
    currentUserId: 'User1',
    initialized: false,
    handTrackingReady: false,
    stats: {
        circles: 0,
        prayers: 0,
        stars: 0,
        intersections: 0
    },
    
    // Debug mode
    debugMode: false,
    
    // Performance monitoring
    lastStatsUpdate: 0,
    updateInterval: 1000 // Update stats every second
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        updateStatus('🚀 Initializing Enhanced 3D Prayer Experience...');
        await initializeApplication();
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        updateStatus('❌ Error: Failed to initialize application');
        showErrorDetails(error);
    }
});

async function initializeApplication() {
    // Step 1: Initialize Three.js scene
    updateStatus('🎬 Setting up 3D scene...');
    initScene('threeContainer');
    await sleep(500);
    
    // Step 2: Load 3D models
    updateStatus('🏛️ Loading 3D models...');
    await loadModels();
    await sleep(500);
    
    // Step 3: Initialize hand tracking
    updateStatus('👋 Initializing hand tracking...');
    await initializeHandTracking();
    
    // Step 4: Initialize mode systems
    updateStatus('⚙️ Setting up interaction modes...');
    initConnectMode();
    initPrayerMode();
    
    // Step 5: Setup UI controls
    updateStatus('🎮 Setting up controls...');
    setupEventListeners();
    setupFileHandling();
    
    // Step 6: Initialize data monitoring
    setupDataMonitoring();
    
    // Step 7: Start main loop
    startMainLoop();
    
    // Step 8: Show initial stats
    updateAllStats();

    initAudio();
    
    // Mark as ready
    appState.initialized = true;
    updateStatus('✅ Ready! Choose Connect or Pray mode 🙏');
    console.log('🎉 Enhanced application initialized successfully!');
    
    // Show debug info in development
    if (isDevelopmentMode()) {
        enableDebugMode();
    }
}

async function initializeHandTracking() {
    const videoElement = document.getElementById('videoElement');
    
    if (!videoElement) {
        throw new Error('Video element not found');
    }
    
    try {
        const success = await initHandTracking(videoElement, onHandTrackingResults);
        if (success) {
            appState.handTrackingReady = true;
            console.log('✅ Hand tracking initialized successfully');
        } else {
            throw new Error('Failed to initialize hand tracking');
        }
    } catch (error) {
        console.error('❌ Hand tracking initialization failed:', error);
        updateStatus('⚠️ Warning: Hand tracking not available - check camera permissions');
        appState.handTrackingReady = false;
        
        // Show fallback options
        showHandTrackingFallback();
    }
}

function showHandTrackingFallback() {
    const fallbackInfo = document.createElement('div');
    fallbackInfo.id = 'handTrackingFallback';
    fallbackInfo.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
        text-align: center;
        max-width: 400px;
    `;
    
    fallbackInfo.innerHTML = `
        <h3>📷 Camera Not Available</h3>
        <p>Hand tracking requires camera access. Please:</p>
        <ul style="text-align: left; margin: 10px 0;">
            <li>Check camera permissions</li>
            <li>Ensure camera is not in use by other apps</li>
            <li>Try refreshing the page</li>
            <li>Use a supported browser (Chrome/Firefox)</li>
        </ul>
        <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 8px 16px; background: white; color: black; border: none; border-radius: 5px; cursor: pointer;">
            Continue Without Hand Tracking
        </button>
    `;
    
    document.body.appendChild(fallbackInfo);
}

function showErrorDetails(error) {
    console.error('Application Error Details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    });
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventListeners() {
    // User ID input
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('change', handleUserIdChange);
        userInput.addEventListener('input', handleUserIdInput);
    }
    
    // Connect button
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnectButton);
    }
    
    // Pray button
    const prayBtn = document.getElementById('prayBtn');
    if (prayBtn) {
        prayBtn.addEventListener('click', handlePrayButton);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
}

function setupFileHandling() {
    // Create file input for data import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileImport);
    document.body.appendChild(fileInput);
    
    // Add file handling to debug mode
    window.importDataFile = () => fileInput.click();
}

function handleUserIdChange(e) {
    const newUserId = e.target.value.trim() || 'User1';
    appState.currentUserId = newUserId;
    updateStatus(`👤 User changed to: ${newUserId}`);
    console.log('User ID changed to:', newUserId);
    
    // Update stats when user changes
    setTimeout(updateAllStats, 100);
}

function handleUserIdInput(e) {
    // Real-time validation
    const input = e.target.value;
    if (input.length > 20) {
        e.target.value = input.substring(0, 20);
    }
    
    // Remove invalid characters
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function handleConnectButton() {
    if (!appState.handTrackingReady) {
        updateStatus('❌ Error: Hand tracking not available');
        showHandTrackingFallback();
        return;
    }
    
    if (appState.mode === 'connect') {
        exitConnectMode();
    } else {
        enterConnectMode();
    }
}

function handlePrayButton() {
    if (!appState.handTrackingReady) {
        updateStatus('❌ Error: Hand tracking not available');
        showHandTrackingFallback();
        return;
    }
    
    if (appState.mode === 'pray') {
        exitPrayMode();
    } else {
        enterPrayMode();
    }
}

function handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not typing in input fields
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.key.toLowerCase()) {
        case 'c':
            if (e.ctrlKey || e.metaKey) return; // Don't interfere with copy
            handleConnectButton();
            break;
        case 'p':
            if (e.ctrlKey || e.metaKey) return; // Don't interfere with print
            handlePrayButton();
            break;
        case 'escape':
            if (appState.mode !== 'ready') {
                if (appState.mode === 'connect') exitConnectMode();
                if (appState.mode === 'pray') exitPrayMode();
            }
            break;
        case 'd':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                toggleDebugMode();
            }
            break;
        case 's':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                downloadDataAsFile();
            }
            break;
    }
}

function handleBeforeUnload(e) {
    const dataStats = getDataStats();
    if (dataStats.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
}

function handleWindowFocus() {
    // Resume updates when window regains focus
    console.log('🔍 Window focused - resuming updates');
}

function handleWindowBlur() {
    // Pause some updates when window loses focus to save resources
    console.log('😴 Window blurred - reducing updates');
}

async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    updateStatus('📁 Loading data from file...');
    
    try {
        const { loadDataFromFile } = await import('./datamanager.js');
        await loadDataFromFile(file);
        
        updateStatus('✅ Data loaded successfully!');
        updateAllStats();
        
        // Refresh the display if in connect mode
        if (appState.mode === 'connect') {
            // Restart connect mode to show new data
            exitConnectMode();
            setTimeout(() => enterConnectMode(), 500);
        }
        
    } catch (error) {
        console.error('Error importing file:', error);
        updateStatus('❌ Error loading file - check console for details');
    }
}

// ============================================================================
// MODE MANAGEMENT
// ============================================================================

function enterConnectMode() {
    if (appState.mode === 'pray') {
        exitPrayMode();
    }
    
    appState.mode = 'connect';
    updateModeUI();
    
    // Start hand tracking
    const success = startHandTracking();
    if (!success) {
        updateStatus('❌ Error: Could not start hand tracking');
        exitConnectMode();
        return;
    }
    
    // Start connect mode
    startConnectMode(appState.currentUserId);
    
    updateStatus('🔗 Connect mode active! Point with index finger to draw circles 👉');
    console.log('🔗 Entered connect mode');
    
    // Update stats after a delay to get initial data
    setTimeout(updateAllStats, 1000);
}

function exitConnectMode() {
    appState.mode = 'ready';
    updateModeUI();
    
    // Stop hand tracking
    stopHandTracking();
    
    // Stop connect mode and get results
    const results = stopConnectMode();
    
    // Update stats
    if (results) {
        appState.stats.circles = results.totalCircles || 0;
        appState.stats.stars = results.totalStars || 0;
        updateStatsDisplay();
    }
    
    updateStatus('💾 Connection saved! ');
    console.log('💾 Exited connect mode');
    
    // Show results summary
    showModeResults('connect', results);
}

function enterPrayMode() {
    if (appState.mode === 'connect') {
        exitConnectMode();
    }
    
    appState.mode = 'pray';
    updateModeUI();
    
    // Start hand tracking
    const success = startHandTracking();
    if (!success) {
        updateStatus('❌ Error: Could not start hand tracking');
        exitPrayMode();
        return;
    }
    
    // Start prayer mode
    startPrayerMode();
    
    updateStatus('🙏 Prayer mode active! Join hands together to pray 🙏');
    console.log('🙏 Entered prayer mode');
}

function exitPrayMode() {
    appState.mode = 'ready';
    updateModeUI();
    
    // Stop hand tracking
    stopHandTracking();
    
    // Stop prayer mode and get results
    const results = stopPrayerMode();
    
    // Update stats
    if (results) {
        appState.stats.prayers = results.totalPrayers || 0;
        updateStatsDisplay();
    }
    
    updateStatus('🕊️ Prayer mode ended. Peace be with you 🕊️');
    console.log('🕊️ Exited prayer mode');
    
    // Show results summary
    showModeResults('pray', results);
}

function showModeResults(mode, results) {
    if (!results) return;
    
    const resultText = mode === 'connect' 
        ? `📊 Connect Session Results:\n• Circles drawn: ${results.userCircles || 0}\n• Stars created: ${results.totalStars || 0}\n• Total circles: ${results.totalCircles || 0}`
        : `📊 Prayer Session Results:\n• Prayers completed: ${results.totalPrayers || 0}\n• Session duration: ${results.sessionDuration || 'Unknown'}`;
    
    console.log(resultText);
    
    // Show brief result notification
    setTimeout(() => {
        if (appState.mode === 'ready') {
            updateStatus('Ready for next session! Choose Connect or Pray mode 🌟');
        }
    }, 3000);
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateModeUI() {
    const connectBtn = document.getElementById('connectBtn');
    const prayBtn = document.getElementById('prayBtn');
    const currentMode = document.getElementById('currentMode');
    const drawingOverlay = document.getElementById('drawingOverlay');
    const debugCanvas = document.getElementById('debugCanvas');
    
    // Reset button states
    if (connectBtn) {
        connectBtn.classList.remove('connect-active');
        connectBtn.disabled = false;
    }
    if (prayBtn) {
        prayBtn.classList.remove('pray-active');
        prayBtn.disabled = false;
    }
    
    // Update based on current mode
    switch (appState.mode) {
        case 'connect':
            if (connectBtn) {
                connectBtn.textContent = '💾 Save My Space';
                connectBtn.classList.add('connect-active');
            }
            if (prayBtn) {
                prayBtn.disabled = true;
                prayBtn.textContent = '🙏 Pray (Finish connecting first)';
            }
            if (currentMode) {
                currentMode.textContent = '🔗 Connect Mode';
                currentMode.style.color = '#38ef7d';
            }
            if (drawingOverlay) {
                drawingOverlay.style.display = 'block';
            }
            if (debugCanvas) {
                debugCanvas.style.display = 'block';
            }
            document.body.classList.add('connect-mode');
            document.body.classList.remove('pray-mode');
            break;
            
        case 'pray':
            if (prayBtn) {
                prayBtn.textContent = '🙏 Finish Praying';
                prayBtn.classList.add('pray-active');
            }
            if (connectBtn) {
                connectBtn.disabled = true;
                connectBtn.textContent = '🔗 Connect (Finish praying first)';
            }
            if (currentMode) {
                currentMode.textContent = '🙏 Prayer Mode';
                currentMode.style.color = '#ffd700';
            }
            if (drawingOverlay) {
                drawingOverlay.style.display = 'none';
            }
            if (debugCanvas) {
                debugCanvas.style.display = 'block';
            }
            document.body.classList.add('pray-mode');
            document.body.classList.remove('connect-mode');
            break;
            
        case 'ready':
        default:
            if (connectBtn) {
                connectBtn.textContent = '🔗 Connect';
            }
            if (prayBtn) {
                prayBtn.textContent = '🙏 Pray';
            }
            if (currentMode) {
                currentMode.textContent = '⚡ Ready';
                currentMode.style.color = '#ffffff';
            }
            if (drawingOverlay) {
                drawingOverlay.style.display = 'none';
            }
            if (debugCanvas) {
                debugCanvas.style.display = 'none';
            }
            document.body.classList.remove('connect-mode', 'pray-mode');
            break;
    }
    
    // Update accessibility
    updateAccessibility();
}

function updateStatsDisplay() {
    const circleCount = document.getElementById('circleCount');
    const prayerCount = document.getElementById('prayerCount');
    const starCount = document.getElementById('starCount');
    
    if (circleCount) circleCount.textContent = appState.stats.circles;
    if (prayerCount) prayerCount.textContent = appState.stats.prayers;
    if (starCount) starCount.textContent = appState.stats.stars;
    
    // Add animation effect when stats change
    [circleCount, prayerCount, starCount].forEach(element => {
        if (element) {
            element.classList.add('stat-updated');
            setTimeout(() => element.classList.remove('stat-updated'), 500);
        }
    });
}

function updateAccessibility() {
    // Update ARIA labels
    const connectBtn = document.getElementById('connectBtn');
    const prayBtn = document.getElementById('prayBtn');
    
    if (connectBtn) {
        connectBtn.setAttribute('aria-label', 
            appState.mode === 'connect' 
                ? 'Save your drawn circles and exit connect mode' 
                : 'Enter connect mode to draw circles with finger tracking'
        );
    }
    
    if (prayBtn) {
        prayBtn.setAttribute('aria-label',
            appState.mode === 'pray'
                ? 'Finish prayer session and return to ready mode'
                : 'Enter prayer mode for guided meditation with hand gestures'
        );
    }
}

// ============================================================================
// DATA MONITORING
// ============================================================================

function setupDataMonitoring() {
    // Monitor data changes and update stats periodically
    setInterval(updateAllStats, appState.updateInterval);
    
    console.log('📊 Data monitoring started');
}

function updateAllStats() {
    const now = Date.now();
    if (now - appState.lastStatsUpdate < appState.updateInterval) {
        return; // Throttle updates
    }
    
    try {
        // Get data statistics
        const dataStats = getDataStats();
        
        // Update application stats
        appState.stats.circles = dataStats.totalCircles;
        
        // Get mode-specific stats
        if (appState.mode === 'connect') {
            const connectStats = getConnectStats();
            appState.stats.stars = connectStats.totalStars;
        }
        
        if (appState.mode === 'pray') {
            const prayerStats = getPrayerStats();
            appState.stats.prayers = prayerStats.totalPrayers;
        }
        
        // Update display
        updateStatsDisplay();
        
        // Update debug info if enabled
        if (appState.debugMode) {
            updateDebugInfo(dataStats);
        }
        
        appState.lastStatsUpdate = now;
        
    } catch (error) {
        console.warn('Error updating stats:', error);
    }
}

function updateDebugInfo(dataStats) {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    const connectStats = appState.mode === 'connect' ? getConnectStats() : null;
    const prayerStats = appState.mode === 'pray' ? getPrayerStats() : null;
    
    debugInfo.innerHTML = `
        <h4>🔧 Debug Information</h4>
        <div><strong>Mode:</strong> ${appState.mode}</div>
        <div><strong>User:</strong> ${appState.currentUserId}</div>
        <div><strong>Hand Tracking:</strong> ${appState.handTrackingReady ? '✅' : '❌'}</div>
        <div><strong>Total Users:</strong> ${dataStats.totalUsers}</div>
        <div><strong>Total Circles:</strong> ${dataStats.totalCircles}</div>
        <div><strong>Data Source:</strong> ${dataStats.dataSource}</div>
        <div><strong>Unsaved Changes:</strong> ${dataStats.hasUnsavedChanges ? '⚠️' : '✅'}</div>
        ${connectStats ? `
        <div><strong>Drawing:</strong> ${connectStats.isDrawing ? '✏️' : '⏸️'}</div>
        <div><strong>Cursor Visible:</strong> ${connectStats.cursorVisible ? '👁️' : '👁️‍🗨️'}</div>
        <div><strong>Stars:</strong> ${connectStats.totalStars}</div>
        ` : ''}
        ${prayerStats ? `
        <div><strong>Praying:</strong> ${prayerStats.isPraying ? '🙏' : '⏸️'}</div>
        <div><strong>Gesture Detected:</strong> ${prayerStats.gestureDetected ? '✅' : '❌'}</div>
        <div><strong>Total Prayers:</strong> ${prayerStats.totalPrayers}</div>
        ` : ''}
    `;
}

// ============================================================================
// HAND TRACKING CALLBACK
// ============================================================================

function onHandTrackingResults(results) {
    if (!appState.initialized) return;
    
    try {
        // Forward results to active mode
        if (appState.mode === 'connect') {
            import('./connect.js').then(module => {
                module.handleConnectModeHandResults(results);
            }).catch(error => {
                console.error('Error in connect mode hand tracking:', error);
            });
        } else if (appState.mode === 'pray') {
            import('./prayer.js').then(module => {
                module.handlePrayerModeHandResults(results);
            }).catch(error => {
                console.error('Error in prayer mode hand tracking:', error);
            });
        }
        
    } catch (error) {
        console.error('Error processing hand tracking results:', error);
    }
}

// ============================================================================
// MAIN LOOP
// ============================================================================

function startMainLoop() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function mainLoop(currentTime) {
        try {
            frameCount++;
            
            // Update connect mode animations
            if (appState.mode === 'connect') {
                updateConnectMode();
            }
            
            // Update prayer effects if in prayer mode
            if (appState.mode === 'pray') {
                updatePrayer();
            }
            
            // Performance monitoring (every 60 frames)
            if (frameCount % 60 === 0) {
                const deltaTime = currentTime - lastTime;
                const fps = Math.round(60000 / deltaTime);
                
                if (appState.debugMode) {
                    updatePerformanceInfo(fps, deltaTime);
                }
                
                lastTime = currentTime;
            }
            
            // Continue loop
            requestAnimationFrame(mainLoop);
            
        } catch (error) {
            console.error('Error in main loop:', error);
            // Continue loop even if there's an error
            requestAnimationFrame(mainLoop);
        }
    }
    
    mainLoop(performance.now());
    console.log('🔄 Enhanced main loop started');
}

function updatePerformanceInfo(fps, deltaTime) {
    const perfInfo = document.getElementById('performanceInfo');
    if (!perfInfo) return;
    
    perfInfo.innerHTML = `
        <h4>⚡ Performance</h4>
        <div><strong>FPS:</strong> ${fps}</div>
        <div><strong>Frame Time:</strong> ${Math.round(deltaTime / 60)}ms</div>
        <div><strong>Memory:</strong> ${getMemoryUsage()}</div>
    `;
}

function getMemoryUsage() {
    if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
        const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
        return `${used}/${total} MB`;
    }
    return 'N/A';
}

// ============================================================================
// DEBUG MODE
// ============================================================================

function isDevelopmentMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.search.includes('debug=true');
}

function enableDebugMode() {
    appState.debugMode = true;
    
    // Create debug panel
    createDebugPanel();
    
    // Add debug global functions
    setupDebugGlobals();
    
    console.log('🐛 Debug mode enabled');
    updateStatus('🐛 Debug mode enabled - press Ctrl+D to toggle');
}

function toggleDebugMode() {
    if (appState.debugMode) {
        disableDebugMode();
    } else {
        enableDebugMode();
    }
}

function disableDebugMode() {
    appState.debugMode = false;
    
    // Remove debug panel
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        debugPanel.remove();
    }
    
    console.log('🐛 Debug mode disabled');
}

function createDebugPanel() {
    // Remove existing panel
    const existingPanel = document.getElementById('debugPanel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 50px;
        right: 350px;
        width: 300px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 200;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.3);
    `;
    
    debugPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #ff6b6b;">🐛 Debug Panel</h3>
            <button onclick="window.debugApp.toggleDebug()" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✕</button>
        </div>
        <div id="debugInfo"></div>
        <div id="performanceInfo" style="margin-top: 10px;"></div>
        <div style="margin-top: 15px;">
            <h4>🎮 Debug Actions</h4>
            <button onclick="window.debugApp.downloadData()" style="margin: 2px; padding: 5px 8px; font-size: 10px; background: #4ecdc4; color: white; border: none; border-radius: 3px; cursor: pointer;">📥 Download Data</button>
            <button onclick="window.debugApp.downloadFullData()" style="margin: 2px; padding: 5px 8px; font-size: 10px; background: #45b7d1; color: white; border: none; border-radius: 3px; cursor: pointer;">📥 Full Data</button>
            <button onclick="window.debugApp.importData()" style="margin: 2px; padding: 5px 8px; font-size: 10px; background: #f9ca24; color: black; border: none; border-radius: 3px; cursor: pointer;">📁 Import</button>
            <button onclick="window.debugApp.testIntersections()" style="margin: 2px; padding: 5px 8px; font-size: 10px; background: #6c5ce7; color: white; border: none; border-radius: 3px; cursor: pointer;">🧪 Test</button>
            <button onclick="window.debugApp.clearData()" style="margin: 2px; padding: 5px 8px; font-size: 10px; background: #eb4d4b; color: white; border: none; border-radius: 3px; cursor: pointer;">🗑️ Clear</button>
        </div>
    `;
    
   // document.body.appendChild(debugPanel);
}

function setupDebugGlobals() {
    window.debugApp = {
        getState: () => appState,
        enterConnect: enterConnectMode,
        exitConnect: exitConnectMode,
        enterPray: enterPrayMode,
        exitPray: exitPrayMode,
        updateStats: updateAllStats,
        toggleDebug: toggleDebugMode,
        downloadData: downloadDataAsFile,
        downloadFullData: downloadFullDataAsFile,
        importData: () => window.importDataFile(),
        testIntersections: testIntersectionCalculation,
        clearData: () => {
            if (confirm('Clear all data? This cannot be undone.')) {
                import('./datamanager.js').then(module => {
                    module.clearAllData();
                    updateAllStats();
                });
            }
        }
    };
    
    console.log('🐛 Debug functions available via window.debugApp');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    updateStatus('⚠️ Error occurred - check console for details');
    
    // Send error to debug panel if available
    if (appState.debugMode) {
        const errorInfo = `Error: ${event.error.message} at ${event.filename}:${event.lineno}`;
        console.error('Error details:', errorInfo);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    updateStatus('⚠️ Promise error - check console for details');
    
    if (appState.debugMode) {
        console.error('Promise rejection details:', event.reason);
    }
});

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

// Add CSS for stats animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .stat-updated {
        animation: statPulse 0.5s ease-out;
    }
    
    @keyframes statPulse {
        0% { transform: scale(1); background-color: transparent; }
        50% { transform: scale(1.1); background-color: rgba(56, 239, 125, 0.3); }
        100% { transform: scale(1); background-color: transparent; }
    }
    
    .connect-mode {
        transition: background 0.5s ease;
    }
    
    .pray-mode {
        transition: background 0.5s ease;
    }
`;
document.head.appendChild(styleSheet);

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export {
    enterConnectMode,
    exitConnectMode,
    enterPrayMode,
    exitPrayMode,
    updateStatsDisplay,
    updateAllStats
};