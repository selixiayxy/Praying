// js/connect.js - Complete Enhanced Connect Mode with Purple Circle Visualization
import { scene, updateStatus, screenTo3D, clearObjectsByType } from './scene.js';
import { initDataManager, addCircleData, findCircleIntersections, setCurrentUser, getAllOtherUsersCircles } from './datamanager.js';

// ============================================================================
// CONNECT MODE STATE
// ============================================================================

let connectState = {
    isActive: false,
    currentUserId: 'User1',
    
    // Drawing state
    isDrawing: false,
    currentPath: [],
    drawingCanvas: null,
    drawingCtx: null,
    
    // Circle data
    userCircles: {},
    
    // 3D objects
    activeDrawingLines: [],
    completedCircles: [],
    
    // Configuration
    smoothingBuffer: 5,
    minCirclePoints: 10,
    circleDetectionThreshold: 0.3,
    
    // Cursor system
    cursor: {
        isActive: false,
        element: null,
        position: { x: 0, y: 0 },
        targetPosition: { x: 0, y: 0 },
        isVisible: false,
        isDrawing: false,
        config: {
            src: 'Assets/wand.png',
            width: 64,
            height: 64,
            smoothing: 0.15
        }
    },
    
    // Enhanced star system
    stars: {
        list: [],
        config: {
            iconSrc: 'Assets/star.png',
            size: 64,
            height: 1.0,
            animation: {
                enabled: true,
                rotationSpeed: 0.02,
                floatSpeed: 0.01,
                floatHeight: 0.3,
                pulseSpeed: 0.005
            },
            effects: {
                glow: true,
                sparkle: true
            }
        }
    },
    
    // 🎨 Enhanced visualization config
    visualization: {
            showUserLabels: true,
            animateCircles: true,
            glowEffects: true,
            statisticsEnabled: true,
            highlightIntersections: true,
            enhancedVisibility: true,  // NEW
            dramaticEffects: true      // NEW
            }
};

// ============================================================================
// CONNECT MODE MANAGEMENT
// ============================================================================

/**
 * Initialize connect mode system
 */
export function initConnectMode() {
    setupDrawingCanvas();
    initDataManager();
    initCursorSystem();
    initStarSystem();
    
    console.log('🎨 Connect mode initialized with enhanced purple circle visualization');
}

/**
 * Start connect mode
 */
export function startConnectMode(userId = 'User1') {
    connectState.isActive = true;
    connectState.currentUserId = userId;
    
    // Set current user in data manager
    setCurrentUser(userId);
    
    // Show drawing overlay
    const overlay = document.getElementById('drawingOverlay');
    if (overlay) {
        overlay.style.display = 'block';
    }
    
    // Start cursor tracking
    startCursorTracking();
    
    // Clear previous drawing
    clearDrawingCanvas();
    
    // 🎨 Load existing circles with enhanced visualization
    loadAndDisplayExistingCircles();
    
    // Show statistics after a delay
    setTimeout(() => {
        if (connectState.visualization.statisticsEnabled) {
            showCircleStatistics();
        }
    }, 1000);
    
    updateStatus('🔗 Connect mode active! Point with index finger to draw circles 👉');
    console.log('🔗 Connect mode started for user:', userId);
}

/**
 * Stop connect mode and return results
 */
export function stopConnectMode() {
    connectState.isActive = false;
    
    // Hide drawing overlay
    const overlay = document.getElementById('drawingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // Stop cursor tracking
    stopCursorTracking();
    
    // Finish any active drawing
    if (connectState.isDrawing) {
        finishDrawing();
    }
    
    // Save final data
    const results = saveCirclesData();
    
    updateStatus('💾 Connect mode stopped. Circles saved!');
    console.log('💾 Connect mode stopped');
    
    return results;
}

// ============================================================================
// CURSOR SYSTEM
// ============================================================================

/**
 * Initialize cursor system
 */
function initCursorSystem() {
    createCursorElement();
    setupCursorEvents();
    console.log('👆 Cursor system initialized');
}

/**
 * Create PNG cursor element
 */
function createCursorElement() {
    // Remove existing cursor if any
    const existingCursor = document.getElementById('finger-cursor');
    if (existingCursor) {
        existingCursor.remove();
    }
    
    // Create cursor element
    connectState.cursor.element = document.createElement('div');
    connectState.cursor.element.id = 'finger-cursor';
    connectState.cursor.element.style.cssText = `
        position: fixed;
        width: ${connectState.cursor.config.width}px;
        height: ${connectState.cursor.config.height}px;
        background-image: url('${connectState.cursor.config.src}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
        transition: all 0.1s ease-out;
        opacity: 0;
        display: none;
    `;
    
    document.body.appendChild(connectState.cursor.element);
    
    // Try to load the PNG icon
    loadCursorIcon();
}

/**
 * Load cursor icon and handle fallback
 */
function loadCursorIcon() {
    const img = new Image();
    img.onload = () => {
        console.log('✅ Cursor icon loaded successfully');
    };
    img.onerror = () => {
        console.warn('⚠️ Could not load cursor icon, using fallback');
        createFallbackCursor();
    };
    img.src = connectState.cursor.config.src;
}

/**
 * Create fallback cursor if PNG fails to load
 */
function createFallbackCursor() {
    if (!connectState.cursor.element) return;
    
    connectState.cursor.element.style.cssText += `
        background-image: none;
        background-color: #ffeb3b;
        border: 3px solid #ff9800;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
    `;
    
    connectState.cursor.element.innerHTML = '<div style="font-size: 20px; text-align: center; line-height: 26px;">👉</div>';
    console.log('✅ Fallback cursor created');
}

/**
 * Setup cursor event handling
 */
function setupCursorEvents() {
    document.addEventListener('mousemove', (e) => {
        if (connectState.cursor.isActive) {
            document.body.style.cursor = 'none';
        }
    });
    
    document.addEventListener('mouseleave', () => {
        if (connectState.cursor.isActive) {
            hideCursor();
        }
    });
}

/**
 * Start cursor tracking
 */
function startCursorTracking() {
    connectState.cursor.isActive = true;
    document.body.style.cursor = 'none';
    console.log('👆 Cursor tracking started');
}

/**
 * Stop cursor tracking
 */
function stopCursorTracking() {
    connectState.cursor.isActive = false;
    hideCursor();
    document.body.style.cursor = 'auto';
    console.log('👆 Cursor tracking stopped');
}

/**
 * Update cursor position from hand tracking
 */
function updateCursorPosition(x, y, isPointing = false) {
    if (!connectState.cursor.isActive || !connectState.cursor.element) return;
    
    // Convert normalized coordinates to screen coordinates
    const mirroredX = 1.0 - x;  // Flip X axis
    const screenX = mirroredX * window.innerWidth;
    const screenY = y * window.innerHeight;
    
    // Update target position
    connectState.cursor.targetPosition.x = screenX;
    connectState.cursor.targetPosition.y = screenY;
    
    // Show cursor if pointing
    if (isPointing && !connectState.cursor.isVisible) {
        showCursor();
    } else if (!isPointing && connectState.cursor.isVisible) {
        hideCursor();
    }
    
    // Update cursor state
    connectState.cursor.isDrawing = isPointing;
    
    // Smooth cursor movement
    smoothCursorMovement();
    
    // Update cursor appearance
    updateCursorAppearance();
}

/**
 * Smooth cursor movement with interpolation
 */
function smoothCursorMovement() {
    const smoothing = connectState.cursor.config.smoothing;
    
    // Interpolate position
    connectState.cursor.position.x += (connectState.cursor.targetPosition.x - connectState.cursor.position.x) * smoothing;
    connectState.cursor.position.y += (connectState.cursor.targetPosition.y - connectState.cursor.position.y) * smoothing;
    
    // Apply position
    if (connectState.cursor.element) {
        connectState.cursor.element.style.left = `${connectState.cursor.position.x}px`;
        connectState.cursor.element.style.top = `${connectState.cursor.position.y}px`;
    }
}

/**
 * Show cursor
 */
function showCursor() {
    if (!connectState.cursor.element) return;
    
    connectState.cursor.isVisible = true;
    connectState.cursor.element.style.display = 'block';
    connectState.cursor.element.style.opacity = '1';
}

/**
 * Hide cursor
 */
function hideCursor() {
    if (!connectState.cursor.element) return;
    
    connectState.cursor.isVisible = false;
    connectState.cursor.element.style.opacity = '0';
    
    setTimeout(() => {
        if (!connectState.cursor.isVisible && connectState.cursor.element) {
            connectState.cursor.element.style.display = 'none';
        }
    }, 100);
}

/**
 * Update cursor appearance based on current state
 */
function updateCursorAppearance() {
    if (!connectState.cursor.element) return;
    
    if (connectState.cursor.isDrawing) {
        // Drawing state - make cursor more prominent
        connectState.cursor.element.style.transform = 'translate(-50%, -50%) scale(1.2)';
        connectState.cursor.element.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 235, 59, 0.8))';
    } else {
        // Normal state
        connectState.cursor.element.style.transform = 'translate(-50%, -50%) scale(1.0)';
        connectState.cursor.element.style.filter = 'brightness(1.0) drop-shadow(0 0 4px rgba(255, 235, 59, 0.4))';
    }
}

/**
 * Add cursor click effect
 */
function addCursorClickEffect() {
    if (!connectState.cursor.element || !connectState.cursor.isVisible) return;
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        left: ${connectState.cursor.position.x}px;
        top: ${connectState.cursor.position.y}px;
        width: 10px;
        height: 10px;
        background: rgba(255, 235, 59, 0.6);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 999;
        animation: ripple-effect 0.6s ease-out forwards;
    `;
    
    // Add ripple animation CSS if not exists
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple-effect {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// ============================================================================
// PNG STAR SYSTEM
// ============================================================================

/**
 * Initialize star system
 */
function initStarSystem() {
    console.log('⭐ PNG Star system initialized');
}





/**
 * Create multiple PNG stars at intersection points
 */
function createStarsAtIntersections(intersections) {
    const createdStars = [];
    
    intersections.forEach(intersection => {
        intersection.points.forEach(point => {
            const star = createPNGStar(point.x, point.z, {
                users: intersection.users,
                circles: [intersection.circle1.id, intersection.circle2.id]
            });
            
            if (star) {
                createdStars.push(star);
            }
        });
    });
    
    console.log(`⭐ Created ${createdStars.length} PNG stars at intersections`);
    return createdStars;
}

/**
 * Add sparkle effect when star is created
 */
function addSparkleEffect(x, z) {
    if (typeof THREE === 'undefined') return;
    
    const sparkleCount = 15;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkleCount * 3);
    const colors = new Float32Array(sparkleCount * 3);
    const velocities = new Float32Array(sparkleCount * 3);
    
    for (let i = 0; i < sparkleCount; i++) {
        const i3 = i * 3;
        
        // Start positions around star location
        positions[i3] = x + (Math.random() - 0.5) * 1;
        positions[i3 + 1] = 0.5 + Math.random() * 1;
        positions[i3 + 2] = z + (Math.random() - 0.5) * 1;
        
        // Random velocities
        velocities[i3] = (Math.random() - 0.5) * 0.02;
        velocities[i3 + 1] = Math.random() * 0.03 + 0.01;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        
        // Golden colors
        colors[i3] = 1;
        colors[i3 + 1] = Math.random() * 0.5 + 0.7;
        colors[i3 + 2] = Math.random() * 0.3;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        transparent: true,
        opacity: 1,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    const sparkles = new THREE.Points(geometry, material);
    scene.add(sparkles);
    
    // Animate sparkles
    let time = 0;
    const maxTime = 2; // 2 seconds
    
    function animateSparkles() {
        time += 0.016; // ~60fps
        
        const positions = sparkles.geometry.attributes.position.array;
        const velocities = sparkles.geometry.attributes.velocity.array;
        
        // Update positions
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Apply gravity
            velocities[i + 1] -= 0.0005;
        }
        
        sparkles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        material.opacity = 1 - (time / maxTime);
        
        if (time < maxTime) {
            requestAnimationFrame(animateSparkles);
        } else {
            scene.remove(sparkles);
            geometry.dispose();
            material.dispose();
        }
    }
    
    animateSparkles();
}


/**
 * Create PNG star using mesh for Y-axis rotation
 */
function createPNGStar(x, z, intersectionData = {}) {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js not available for star creation');
        return null;
    }
    
    // 🎯 USE MESH for Y-axis rotation control
    const textureLoader = new THREE.TextureLoader();
    
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide // Important for Y-axis rotation visibility
    });
    
    const starMesh = new THREE.Mesh(geometry, material);
    starMesh.position.set(x, connectState.stars.config.height, z);
    
    // Add metadata
    starMesh.userData = {
        type: 'star',
        createdAt: Date.now(),
        position: { x, z },
        intersectionData: intersectionData,
        animationOffset: Math.random() * Math.PI * 2,
        baseY: connectState.stars.config.height,
        pulsePhase: Math.random() * Math.PI * 2
    };
    
    // Load PNG
    textureLoader.load(
        connectState.stars.config.iconSrc,
        (texture) => {
            console.log('✅ PNG loaded for Y-axis rotation');
            material.map = texture;
            material.color.setHex(0xffffff);
            material.needsUpdate = true;
        },
        undefined,
        (error) => {
            console.warn('⚠️ PNG load failed, golden star will still rotate');
        }
    );
    
    scene.add(starMesh);
    connectState.stars.list.push(starMesh);
    
    if (connectState.stars.config.effects.sparkle) {
        addSparkleEffect(x, z);
    }
    
    console.log('⭐ Y-axis rotating star created');
    return starMesh;
}

/**
 * Update stars with Y-axis rotation
 */
function updateStars() {
    if (!connectState.stars.config.animation.enabled) return;
    
    const time = Date.now() * 0.001;
    
    connectState.stars.list.forEach(star => {
        if (!star.userData) return;
        
        const offset = star.userData.animationOffset || 0;
        const pulsePhase = star.userData.pulsePhase || 0;
        
        // 🎯 Y-AXIS ROTATION: Makes star flip/tumble
        star.rotation.x = time * connectState.stars.config.animation.rotationSpeed + offset;
        
        // Floating animation
        const baseY = star.userData.baseY || connectState.stars.config.height;
        const floatOffset = Math.sin(time * connectState.stars.config.animation.floatSpeed + offset) * connectState.stars.config.animation.floatHeight;
        star.position.y = baseY + floatOffset;
        
        // Pulsing scale animation
        const pulseScale = 1 + Math.sin(time * connectState.stars.config.animation.pulseSpeed + pulsePhase) * 0.2;
        star.scale.setScalar(pulseScale);
        
        // Animate glow effects
        const glowChild = star.children.find(child => child.userData.type === 'glow');
        if (glowChild) {
            const glowPulse = Math.sin(time * 2 + offset) * 0.5 + 0.5;
            glowChild.material.opacity = 0.2 + glowPulse * 0.4;
        }
    });
}

/**
 * Clear all stars
 */
function clearAllStars() {
    connectState.stars.list.forEach(star => {
        scene.remove(star);
        
        // Clean up materials and textures
        if (star.material) {
            if (star.material.map) star.material.map.dispose();
            star.material.dispose();
        }
        if (star.geometry) star.geometry.dispose();
        
        // Clean up children (glow effects)
        star.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    });
    
    connectState.stars.list = [];
    console.log('⭐ All PNG stars cleared');
}




/**
 * 🎨 Show circle statistics
 */
function showCircleStatistics() {
    const allCircles = [];
    const userCounts = {};
    
    scene.traverse(child => {
        if (child.userData.type === 'circle') {
            allCircles.push(child);
            const userId = child.userData.userId;
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        }
    });
    
    console.log('📊 Circle Statistics:');
    console.log(`Total circles: ${allCircles.length}`);
    console.log('Per user:', userCounts);
    
    // Update status with statistics
    const totalUsers = Object.keys(userCounts).length;
    updateStatus(`📊 ${allCircles.length} circles from ${totalUsers} users displayed`);
}

// ============================================================================
// 🎨 DEBUG AND VISUALIZATION CONTROLS
// ============================================================================

/**
 * Toggle user labels visibility
 */
function toggleUserLabels() {
    connectState.visualization.showUserLabels = !connectState.visualization.showUserLabels;
    
    scene.traverse(child => {
        if (child.userData.type === 'circle' && child.userData.isExisting) {
            const label = child.children.find(c => c.userData.type === 'label');
            if (label) {
                label.visible = connectState.visualization.showUserLabels;
            }
        }
    });
    
    console.log(`🎨 User labels ${connectState.visualization.showUserLabels ? 'enabled' : 'disabled'}`);
    updateStatus(`User labels ${connectState.visualization.showUserLabels ? 'ON' : 'OFF'}`);
}

/**
 * Toggle glow effects
 */
function toggleGlowEffects() {
    connectState.visualization.glowEffects = !connectState.visualization.glowEffects;
    
    scene.traverse(child => {
        if (child.userData.type === 'circle' && child.userData.isExisting) {
            const glow = child.children.find(c => c.userData.type === 'glow');
            if (glow) {
                glow.visible = connectState.visualization.glowEffects;
            }
        }
    });
    
    console.log(`🎨 Glow effects ${connectState.visualization.glowEffects ? 'enabled' : 'disabled'}`);
    updateStatus(`Glow effects ${connectState.visualization.glowEffects ? 'ON' : 'OFF'}`);
}

/**
 * Highlight circles from specific user
 */
function highlightUserCircles(userId) {
    scene.traverse(child => {
        if (child.userData.type === 'circle') {
            if (child.userData.userId === userId) {
                // Highlight this user's circles
                child.material.opacity = 1.0;
                child.scale.setScalar(1.2);
                
                // Add highlight glow
                const highlightGlow = child.children.find(c => c.userData.type === 'highlight');
                if (!highlightGlow) {
                    addHighlightEffect(child);
                }
            } else {
                // Dim other circles
                child.material.opacity = 0.3;
                child.scale.setScalar(0.8);
                
                // Remove highlight if exists
                const highlightGlow = child.children.find(c => c.userData.type === 'highlight');
                if (highlightGlow) {
                    child.remove(highlightGlow);
                }
            }
        }
    });
    
    console.log(`🎯 Highlighted circles for user: ${userId}`);
    updateStatus(`Highlighting ${userId}'s circles`);
}

/**
 * Add highlight effect to a circle
 */
function addHighlightEffect(circle) {
    const highlightGeometry = new THREE.RingGeometry(
        circle.geometry.parameters.innerRadius * 0.5,
        circle.geometry.parameters.outerRadius * 1.5,
        32
    );
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotation.x = -Math.PI / 2;
    highlight.position.y = 0.02;
    highlight.userData = { type: 'highlight' };
    
    circle.add(highlight);
}

/**
 * Reset all circle highlighting
 */
function resetCircleHighlighting() {
    scene.traverse(child => {
        if (child.userData.type === 'circle') {
            if (child.userData.isExisting) {
                child.material.opacity = 0.7;
            } else {
                child.material.opacity = 0.7; // User's own circles
            }
            child.scale.setScalar(1.0);
            
            // Remove highlight effects
            const highlightChild = child.children.find(c => c.userData.type === 'highlight');
            if (highlightChild) {
                child.remove(highlightChild);
            }
        }
    });
    
    console.log('🎨 Circle highlighting reset');
    updateStatus('Circle highlighting reset');
}

// ============================================================================
// DRAWING CANVAS SETUP
// ============================================================================

/**
 * Setup 2D drawing canvas overlay
 */
function setupDrawingCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) {
        console.error('Drawing canvas not found');
        return;
    }
    
    connectState.drawingCanvas = canvas;
    connectState.drawingCtx = canvas.getContext('2d');
    
      canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 500;
        background: transparent;
    `;
    // Set canvas size to match window
    resizeDrawingCanvas();
    
    // Setup drawing context
    const ctx = connectState.drawingCtx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffeb3b';
    ctx.globalAlpha = 0.8;
    
    // Handle window resize
    window.addEventListener('resize', resizeDrawingCanvas);
}




/**
 * Resize drawing canvas to match window
 */
function resizeDrawingCanvas() {
    if (!connectState.drawingCanvas) return;
    
    connectState.drawingCanvas.width = window.innerWidth;
    connectState.drawingCanvas.height = window.innerHeight;
    


    // Reapply drawing context settings
    if (connectState.drawingCtx) {
        const ctx = connectState.drawingCtx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffeb3b';
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = '#ffeb3b';  // Yellow glow
        ctx.shadowBlur = 10;         // Glowing effect
    }
       
}

/**
 * Clear drawing canvas
 */
function clearDrawingCanvas() {
    if (!connectState.drawingCtx || !connectState.drawingCanvas) return;
    
    connectState.drawingCtx.clearRect(
        0, 0, 
        connectState.drawingCanvas.width, 
        connectState.drawingCanvas.height
    );
}

// ============================================================================
// HAND TRACKING INTEGRATION
// ============================================================================

/**
 * Process hand tracking results for connect mode
 */
export function processConnectHandResults(results) {
    if (!connectState.isActive || !results) return;
    
    // Update cursor position
    if (results.pointingGesture) {
        const indexTip = results.pointingGesture.indexTip;
        updateCursorPosition(indexTip.x, indexTip.y, results.pointingGesture.isPointing);
    }
    
    // Check for pointing gesture
    if (results.pointingGesture && results.pointingGesture.isPointing) {
        const indexTip = results.pointingGesture.indexTip;
        
        const mirroredX = 1.0 - indexTip.x;
        // Convert normalized coordinates to screen coordinates
        const screenX = mirroredX* window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;
        
        addDrawingPoint(screenX, screenY);
    } else {
        // No pointing gesture - finish current drawing
        finishDrawing();
    }
}

// ============================================================================
// DRAWING MECHANICS
// ============================================================================

/**
 * Add a point to the current drawing
 */
function addDrawingPoint(x, y) {
    if (!connectState.isDrawing) {
        startDrawing(x, y);
    } else {
        continueDrawing(x, y);
    }
}

/**
 * Start a new drawing stroke
 */
function startDrawing(x, y) {
    connectState.isDrawing = true;
    connectState.currentPath = [{ x, y, timestamp: Date.now() }];
    
    const ctx = connectState.drawingCtx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Create new 3D drawing line immediately
    const newLine = createNewDrawingLine();
    connectState.activeDrawingLines.push(newLine);
    
    // Add cursor click effect
    addCursorClickEffect();
    
    updateStatus('✏️ Drawing circle...');
}

/**
 * Continue current drawing stroke
 */
function continueDrawing(x, y) {
    if (!connectState.isDrawing) return;
    
    // Add point to path
    connectState.currentPath.push({ x, y, timestamp: Date.now() });
    
    // Update 2D canvas
    const ctx = connectState.drawingCtx;
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Update 3D drawing line in real-time
    if (connectState.activeDrawingLines.length > 0) {
        const currentLine = connectState.activeDrawingLines[connectState.activeDrawingLines.length - 1];
        updateDrawingLine(currentLine, connectState.currentPath);
    }
}

/**
 * Create a new yellow 3D line for drawing
 */
function createNewDrawingLine() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ 
        color: 0xffeb3b, 
        linewidth: 3 
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
}

/**
 * Update the 3D line geometry from screen coordinates
 */
function updateDrawingLine(line, path) {
    if (path.length < 2) return;
    
    // Convert screen coordinates to 3D world coordinates
    const points = [];
    path.forEach(point => {
        const worldCoords = screenTo3D(point.x, point.y, window.innerWidth, window.innerHeight);
        points.push(new THREE.Vector3(worldCoords.x, worldCoords.y, worldCoords.z));
    });
    
    // Update line geometry
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
    });
    
    line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    line.geometry.setDrawRange(0, points.length);
    line.geometry.attributes.position.needsUpdate = true;
}

/**
 * Finish current drawing and attempt circle detection
 */
function finishDrawing() {
    if (!connectState.isDrawing) return;
    
    connectState.isDrawing = false;
    
    // Clean up active drawing line
    if (connectState.activeDrawingLines.length > 0) {
        const currentLine = connectState.activeDrawingLines.pop();
        scene.remove(currentLine); // Remove the yellow line
    }
    
    if (connectState.currentPath.length < connectState.minCirclePoints) {
        clearDrawingCanvas();
        return;
    }
    
    // Attempt circle detection
    const circle = detectCircle(connectState.currentPath);
    
    if (circle) {
        // Valid circle detected - add to data manager and 3D scene
        const savedCircle = addCircleData(circle);
        addCircleTo3D(savedCircle);
        
        // Find intersections with existing circles
        const intersections = findCircleIntersections(savedCircle);
        
        // Create PNG stars at intersection points
        if (intersections.length > 0) {
            createStarsAtIntersections(intersections);
            updateStatus(`⭐ Circle added! Found ${intersections.length} intersections`);
        } else {
            updateStatus('⭕ Circle detected and added!');
        }
        
        // Update stats
        updateStats();
        
    } else {
        updateStatus('🔄 Shape not recognized as circle. Try drawing a more circular shape!');
    }
    
    // Clear drawing canvas after a delay
    setTimeout(() => {
        clearDrawingCanvas();
        if (connectState.isActive) {
            updateStatus('👉 Ready to draw next circle!');
        }
    }, 1500);
}

/**
 * Smooth drawing path using moving average
 */
function smoothPath(path) {
    if (path.length < 2) return path;
    
    const smoothed = [];
    const buffer = Math.min(connectState.smoothingBuffer, path.length);
    
    for (let i = 0; i < path.length; i++) {
        let sumX = 0, sumY = 0, count = 0;
        
        const start = Math.max(0, i - Math.floor(buffer / 2));
        const end = Math.min(path.length - 1, i + Math.floor(buffer / 2));
        
        for (let j = start; j <= end; j++) {
            sumX += path[j].x;
            sumY += path[j].y;
            count++;
        }
        
        smoothed.push({
            x: sumX / count,
            y: sumY / count,
            timestamp: path[i].timestamp
        });
    }
    
    return smoothed;
}

// ============================================================================
// CIRCLE DETECTION
// ============================================================================

/**
 * Detect if the drawn path represents a circle
 */
/*
function detectCircle(path) {
    if (path.length < 3) return null;
    
    // Find center point (average of all points)
    let sumX = 0, sumY = 0;
    path.forEach(p => { sumX += p.x; sumY += p.y; });
    const centerX = sumX / path.length;
    const centerY = sumY / path.length;
    
    // Find average distance from center (this becomes radius)
    let sumDist = 0;
    path.forEach(p => {
        sumDist += Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    });
    const avgRadius = sumDist / path.length;
    
    // Convert to world coordinates
    const worldCoords = screenTo3D(centerX, centerY, window.innerWidth, window.innerHeight);
    const edgeCoords = screenTo3D(centerX + avgRadius, centerY, window.innerWidth, window.innerHeight);
    const worldRadius = Math.sqrt(
        Math.pow(edgeCoords.x - worldCoords.x, 2) + 
        Math.pow(edgeCoords.z - worldCoords.z, 2)
    );
    
    console.log('✅ Any scribble → circle!', { 
        points: path.length, 
        radius: Math.max(0.2, Math.min(worldRadius, 4)).toFixed(2) 
    });
    
    return {
        x: worldCoords.x,
        z: worldCoords.z,
        radius: Math.max(0.2, Math.min(worldRadius, 4)),
        userId: connectState.currentUserId,
        timestamp: new Date().toISOString()
    };
}
    */

function detectCircle(path) {
    if (path.length < 3) return null;
    
    // 🎯 IMPROVED: Use bounding box for better size differentiation
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    path.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    });
    
     const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const screenRadius = Math.max(maxX - minX, maxY - minY) / 2;
    
    // Use your existing screenTo3D function
    const originalWorld = screenTo3D(centerX, centerY, window.innerWidth, window.innerHeight);
    
    // 🎯 SPREAD THEM OUT: Multiply coordinates by spread factor
    const spreadFactor = 2.0;  // 3x wider distribution!
    
    const worldX = originalWorld.x * spreadFactor;
    const worldZ = originalWorld.z * spreadFactor;
    
    // Calculate radius with the new spread
    const originalEdge = screenTo3D(centerX + screenRadius, centerY, window.innerWidth, window.innerHeight);
    const worldRadius = Math.sqrt(
        Math.pow(originalEdge.x * spreadFactor - worldX, 2) + 
        Math.pow(originalEdge.z * spreadFactor - worldZ, 2)
    );
    
    const finalRadius = Math.max(0.1, Math.min(worldRadius, 5));
    
    return {
        x: worldX,
        z: worldZ,
        radius: finalRadius,
        userId: connectState.currentUserId,
        timestamp: new Date().toISOString()
    };
}




// ============================================================================
// 3D CIRCLE MANAGEMENT
// ============================================================================

/**
 * Add detected circle to 3D scene as YELLOW ring (user's circle)
 */
function addCircleTo3D(circleData) {
    // Create ring geometry for yellow circle (user's own circle)
    const innerRadius = Math.max(0.1, circleData.radius - 0.1);
    const outerRadius = circleData.radius + 0.1;
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffeb3b, // Yellow for current user
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2; // Lay flat on floor
    ring.position.set(circleData.x, 2, circleData.z);
    
    // Add metadata
    ring.userData = {
        type: 'circle',
        userId: circleData.userId,
        circleId: circleData.id,
        circleData: circleData
    };
    
    // Add to scene
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    
    console.log('🟡 Yellow circle added to 3D scene for current user:', circleData);
}

// ============================================================================
// UTILITY AND ANIMATION
// ============================================================================

/**
 * Update connect mode animations (called from main loop)
 */
export function updateConnectMode() {
    // Update star animations
    updateStars();
    
    // 🎨 Update circle animations
    updateExistingCircleAnimations();
}

/**
 * Update statistics display
 */
function updateStats() {
    // This would update the UI stats - can be called from main.js
    console.log('📊 Stats updated - circles and intersections');
}

/**
 * Save circles data and return results
 */
function saveCirclesData() {
    // Data is automatically saved by datamanager
    const results = {
        totalCircles: Object.keys(connectState.userCircles).length,
        userCircles: connectState.userCircles[connectState.currentUserId]?.length || 0,
        currentUser: connectState.currentUserId,
        totalStars: connectState.stars.list.length
    };
    
    return results;
}

// Enhanced Purple Circle Visualization - Replace these functions in connect.js

/**
 * 🎨 Enhanced function to load and display existing circles with MORE OBVIOUS visualization
 */
function loadAndDisplayExistingCircles() {
    const otherUsersCircles = getAllOtherUsersCircles();
    
    if (otherUsersCircles.length === 0) {
        console.log('No existing circles found in JSON data');
        updateStatus('No existing circles to display - add data to sample_circle_data.json');
        return;
    }
    
    console.log(`🎨 Loading ${otherUsersCircles.length} existing circles with ENHANCED OBVIOUS visualization`);
    
    // Show immediate status
    updateStatus(`🔄 Loading ${otherUsersCircles.length} circles from JSON data...`);
    
    otherUsersCircles.forEach((circleData, index) => {
        // Add delay for dramatic loading animation
        setTimeout(() => {
            addExistingCircleTo3D(circleData);
            
            // Add spawn effect
            addCircleSpawnEffect(circleData.x, circleData.z, circleData.userId);
            
            // Show progress with sound-like feedback
            const progress = Math.round(((index + 1) / otherUsersCircles.length) * 100);
            updateStatus(`🔄 Loading circles... ${progress}% (${index + 1}/${otherUsersCircles.length})`);
            
            // Final completion message
            if (index === otherUsersCircles.length - 1) {
                setTimeout(() => {
                    updateStatus(`✨ ${otherUsersCircles.length} circles loaded! Start drawing to find intersections!`);
                    showCircleStatistics();
                    
                    // Add dramatic completion effect
                    addCompletionEffect();
                }, 200);
            }
        }, index * 200); // 200ms delay between each circle for dramatic effect
    });
}

/**
 * 🎨 SUPER ENHANCED function to add existing circles with MAXIMUM visibility
 */
function addExistingCircleTo3D(circleData) {
    const innerRadius = Math.max(0.1, circleData.radius - 0.1);
    const outerRadius = circleData.radius + 0.1;

    let color = 0xff0000;
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000, // Yellow for current user
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2; // Lay flat on floor
    ring.position.set(circleData.x, 0, circleData.z);



    
    
    // 🎨 Add MULTIPLE visual effects for maximum impact
  //  addEnhancedCircleGlowEffect(ring, color);
    addSimpleGlowEffect(ring,color);
  
  
  
    
    ring.userData = {
        type: 'circle',
        userId: circleData.userId,
        circleId: circleData.id,
        circleData: circleData,
        isExisting: true,
        color: color,
        spawnTime: Date.now()
    };
    
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    
    console.log(`🎨 SUPER ENHANCED circle added for ${circleData.userId}:`, {
        position: `(${circleData.x}, ${circleData.z})`,
        radius: circleData.radius,
        color: `#${color.toString(16).padStart(6, '0')}`,
        enhanced: true
    });
}



/**
 * 🎨 Get MORE DISTINCTIVE colors for different users
 */
function getUserVisualizationColor(userId) {
    const userColors = {
        'Alice': 0xff3366,    // Bright Pink-Red
        'Bob': 0x33ff99,      // Bright Teal-Green
        'Charlie': 0x3366ff,  // Bright Blue
        'Diana': 0xffcc33,    // Bright Gold
        'Eve': 0xff6633,      // Bright Orange
        'Frank': 0xff3333,    // Bright Red
        'Grace': 0x9933ff,    // Bright Purple
        'Henry': 0xcc33ff,    // Bright Magenta
        'Iris': 0x33ff33,     // Bright Green
        'Jack': 0xff33cc      // Bright Pink
    };
    
    // If user has predefined color, use it
    if (userColors[userId]) {
        return userColors[userId];
    }
    
    // Generate BRIGHT color based on username hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate bright, saturated colors
    const hue = Math.abs(hash) % 360;
    const saturation = 80 + (Math.abs(hash >> 8) % 20); // 80-100% saturation
    const lightness = 50 + (Math.abs(hash >> 16) % 30);  // 50-80% lightness
    
    return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to HEX color
 */
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
    };
    const r = f(0);
    const g = f(8);
    const b = f(4);
    return (r << 16) | (g << 8) | b;
}


function addSimpleGlowEffect(ring, color) {
    const glowGeometry = new THREE.RingGeometry(
        ring.geometry.parameters.innerRadius * 0.95,  // 🎚️ INNER: 0.8 → 0.9 (thinner inside)
        ring.geometry.parameters.outerRadius * 1.,  // 🎚️ OUTER: 1.4 → 1.2 (thinner outside)
        32
    );
    
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,  // 🎚️ OPACITY: 0.3 → 0.25 (slightly more transparent)
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.01;
    glow.userData = { type: 'simpleGlow' };
    ring.add(glow);
}


/**
 * 🎨 Add dramatic spawn effect when circle appears
 */
function addCircleSpawnEffect(x, z, userId) {
    // Create expanding ring effect
    const spawnGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const spawnMaterial = new THREE.MeshBasicMaterial({
        color: getUserVisualizationColor(userId),
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    const spawnRing = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawnRing.position.set(x, 0.1, z);
    spawnRing.rotation.x = -Math.PI / 2;
    
    scene.add(spawnRing);
    
    // Animate the spawn effect
    let scale = 0.1;
    let opacity = 1.0;
    
    function animateSpawn() {
        scale += 0.1;
        opacity -= 0.05;
        
        spawnRing.scale.setScalar(scale);
        spawnMaterial.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animateSpawn);
        } else {
            scene.remove(spawnRing);
            spawnGeometry.dispose();
            spawnMaterial.dispose();
        }
    }
    
    animateSpawn();
}

/**
 * 🎨 Add completion effect when all circles are loaded
 */
function addCompletionEffect() {
    // Create screen flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%);
        pointer-events: none;
        z-index: 1500;
        animation: flashEffect 1s ease-out forwards;
    `;
    
    // Add flash animation if not exists
    if (!document.getElementById('flash-styles')) {
        const style = document.createElement('style');
        style.id = 'flash-styles';
        style.textContent = `
            @keyframes flashEffect {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(flash);
    
    // Remove flash after animation
    setTimeout(() => {
        if (flash.parentNode) {
            flash.parentNode.removeChild(flash);
        }
    }, 1000);
}

/**
 * 🎨 ENHANCED circle animations with MORE dramatic effects
 */
function updateExistingCircleAnimations() {
    if (!connectState.visualization.animateCircles) return;
    
    const time = Date.now() * 0.001;
    
    scene.traverse(child => {
        if (child.userData.type === 'circle' && child.userData.isExisting) {
            const spawnTime = child.userData.spawnTime || 0;
            const age = (Date.now() - spawnTime) * 0.001; // Age in seconds
            
            // ENHANCED pulsing animation
            const pulse = Math.sin(time * 0.8 + child.userData.circleId.length) * 0.1 + 1;
            child.scale.setScalar(pulse);
            
            // Enhanced glow animations
            const innerGlow = child.children.find(c => c.userData.type === 'innerGlow');
            if (innerGlow) {
                const glowPulse = Math.sin(time * 0.5) * 0.5 + 0.5;
                innerGlow.material.opacity = 0.3 + glowPulse * 0.4;
                innerGlow.rotation.z = time * 0.1;
            }
            
            const outerGlow = child.children.find(c => c.userData.type === 'outerGlow');
            if (outerGlow) {
                const outerPulse = Math.sin(time * 0.3) * 0.5 + 0.5;
                outerGlow.material.opacity = 0.1 + outerPulse * 0.3;
                outerGlow.rotation.z = -time * 0.05;
            }
            
            // ENHANCED pulsing border
            const border = child.children.find(c => c.userData.type === 'pulsingBorder');
            if (border) {
                const borderPulse = Math.sin(time * 2) * 0.5 + 0.5;
                border.material.opacity = 0.4 + borderPulse * 0.6;
                border.scale.setScalar(1 + borderPulse * 0.1);
            }
            
            // ENHANCED label animation
            const label = child.children.find(c => c.userData.type === 'label');
            if (label) {
                // Always face camera
                label.lookAt(0, 10, 15);
                // MORE dramatic floating
                label.position.y = 2.5 + Math.sin(time * 0.7 + age) * 0.3;
                // Add slight rotation
                label.rotation.z = Math.sin(time * 0.3) * 0.1;
            }
        }
    });
}

/**
 * Get connect mode statistics
 */
export function getConnectStats() {
    return {
        isActive: connectState.isActive,
        isDrawing: connectState.isDrawing,
        currentUserId: connectState.currentUserId,
        totalStars: connectState.stars.list.length,
        cursorVisible: connectState.cursor.isVisible
    };
}

/**
 * Clear user's circles from scene and data
 */
export function clearUserCircles(userId) {
    // Remove from 3D scene
    const toRemove = [];
    scene.traverse(child => {
        if (child.userData.type === 'circle' && child.userData.userId === userId) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(obj => scene.remove(obj));
    
    // Remove from data
    delete connectState.userCircles[userId];
    
    console.log(`🗑️ Cleared circles for user: ${userId}`);
}

/**
 * Manual integration function that main.js can call
 */
export function handleConnectModeHandResults(results) {
    if (connectState.isActive) {
        processConnectHandResults(results);
    }
}

/**
 * Cleanup connect mode
 */
export function cleanupConnectMode() {
    // Stop cursor tracking
    stopCursorTracking();
    
    // Clean up cursor element
    if (connectState.cursor.element && connectState.cursor.element.parentNode) {
        connectState.cursor.element.parentNode.removeChild(connectState.cursor.element);
    }
    
    // Clear all stars
    clearAllStars();
    
    console.log('🧹 Connect mode cleaned up');
}

// ============================================================================
// 🎨 ENHANCED DEBUG FUNCTIONS (for main.js integration)
// ============================================================================

export const debugFunctions = {
    toggleLabels: toggleUserLabels,
    toggleGlow: toggleGlowEffects,
    highlightUser: highlightUserCircles,
    resetHighlight: resetCircleHighlighting,
    showStats: showCircleStatistics
};

// Export state for debugging
export { connectState };
