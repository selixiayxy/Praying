// js/connect.js - Connect Mode (Circle Drawing with Complete Star System)
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
            src: 'assets/wand.png',
            width: 32,
            height: 32,
            smoothing: 0.15
        }
    },
    
    // Enhanced star system
    stars: {
        list: [],
        config: {
            iconSrc: 'assets/star.png',
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
    
    console.log('Connect mode initialized with complete star intersection system');
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
    
    // Load existing circles and display them
    loadAndDisplayExistingCircles();
    
    updateStatus('Connect mode active! Point with index finger to draw circles 👉');
    console.log('Connect mode started for user:', userId);
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
    
    updateStatus('Connect mode stopped. Circles saved!');
    console.log('Connect mode stopped');
    
    return results;
}

/**
 * Load and display existing circles from JSON data
 */
function loadAndDisplayExistingCircles() {
    const otherUsersCircles = getAllOtherUsersCircles();
    
    otherUsersCircles.forEach(circleData => {
        addExistingCircleTo3D(circleData);
    });
    
    console.log(`Loaded ${otherUsersCircles.length} existing circles from other users`);
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
    console.log('Cursor system initialized');
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
        console.log('Cursor icon loaded successfully');
    };
    img.onerror = () => {
        console.warn('Could not load cursor icon, using fallback');
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
    console.log('Fallback cursor created');
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
    console.log('Cursor tracking started');
}

/**
 * Stop cursor tracking
 */
function stopCursorTracking() {
    connectState.cursor.isActive = false;
    hideCursor();
    document.body.style.cursor = 'auto';
    console.log('Cursor tracking stopped');
}

/**
 * Update cursor position from hand tracking
 */
function updateCursorPosition(x, y, isPointing = false) {
    if (!connectState.cursor.isActive || !connectState.cursor.element) return;
    
    // Convert normalized coordinates to screen coordinates
    const screenX = x * window.innerWidth;
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
    console.log('PNG Star system initialized');
}

/**
 * Create PNG star at intersection point
 */
function createPNGStar(x, z, intersectionData = {}) {
    if (typeof THREE === 'undefined') {
        console.error('THREE.js not available for star creation');
        return null;
    }
    
    // Create canvas for star texture
    const canvas = document.createElement('canvas');
    const size = connectState.stars.config.size;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Load and draw star image
    const img = new Image();
    img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw star image
        ctx.drawImage(img, 0, 0, size, size);
        
        // Update texture
        if (starMesh && starMesh.material && starMesh.material.map) {
            starMesh.material.map.needsUpdate = true;
        }
    };
    
    img.onerror = () => {
        console.warn('Could not load star icon, creating fallback');
        createFallbackStarTexture(ctx, size);
    };
    
    // Create initial fallback texture
    createFallbackStarTexture(ctx, size);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    // Create plane geometry for star sprite
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
    });
    
    const starMesh = new THREE.Mesh(geometry, material);
    
    // Position star above the floor
    starMesh.position.set(x, connectState.stars.config.height, z);
    
    // Always face camera
    starMesh.lookAt(0, 10, 15); // Default camera position
    
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
    
    // Add glow effect if enabled
    if (connectState.stars.config.effects.glow) {
        addPNGStarGlowEffect(starMesh);
    }
    
    // Add to scene
    scene.add(starMesh);
    connectState.stars.list.push(starMesh);
    
    // Add sparkle effect on creation
    if (connectState.stars.config.effects.sparkle) {
        addSparkleEffect(x, z);
    }
    
    // Try to load the actual PNG after creating the mesh
    img.src = connectState.stars.config.iconSrc;
    
    console.log('PNG star created at intersection point:', { x, z });
    return starMesh;
}

/**
 * Create fallback star texture when PNG fails to load
 */
function createFallbackStarTexture(ctx, size) {
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, size, size);
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw star shape
    drawStarShape(ctx, size/2, size/2, size/3, size/6, 5);
    
    // Add text as final fallback
    ctx.fillStyle = '#FFD700';
    ctx.font = `${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', size/2, size/2);
}

/**
 * Draw star shape on canvas
 */
function drawStarShape(ctx, x, y, outerRadius, innerRadius, points) {
    ctx.beginPath();
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const pointX = x + Math.cos(angle) * radius;
        const pointY = y + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(pointX, pointY);
        } else {
            ctx.lineTo(pointX, pointY);
        }
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

/**
 * Add glow effect to PNG star
 */
function addPNGStarGlowEffect(star) {
    // Create glow geometry - larger plane behind the star
    const glowGeometry = new THREE.PlaneGeometry(1.8, 1.8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.z = -0.05; // Slightly behind the star
    glowMesh.userData.type = 'glow';
    
    // Add as child to main star
    star.add(glowMesh);
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
    
    console.log(`Created ${createdStars.length} PNG stars at intersections`);
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
 * Update star animations (called from main animation loop)
 */
function updateStars() {
    if (!connectState.stars.config.animation.enabled) return;
    
    const time = Date.now() * 0.001;
    
    connectState.stars.list.forEach(star => {
        if (!star.userData) return;
        
        const offset = star.userData.animationOffset || 0;
        const pulsePhase = star.userData.pulsePhase || 0;
        
        // Rotation animation
        star.rotation.z += connectState.stars.config.animation.rotationSpeed;
        
        // Floating animation
        const baseY = star.userData.baseY || connectState.stars.config.height;
        const floatOffset = Math.sin(time * connectState.stars.config.animation.floatSpeed + offset) * connectState.stars.config.animation.floatHeight;
        star.position.y = baseY + floatOffset;
        
        // Pulsing scale animation
        const pulseScale = 1 + Math.sin(time * connectState.stars.config.animation.pulseSpeed + pulsePhase) * 0.2;
        star.scale.setScalar(pulseScale);
        
        // Animate glow effect
        const glowChild = star.children.find(child => child.userData.type === 'glow');
        if (glowChild) {
            const glowPulse = Math.sin(time * 2 + offset) * 0.5 + 0.5;
            glowChild.material.opacity = 0.2 + glowPulse * 0.4;
            glowChild.rotation.z = -star.rotation.z; // Counter-rotate for effect
        }
        
        // Always face camera (billboard effect)
        star.lookAt(0, 10, 15); // Default camera position
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
    console.log('All PNG stars cleared');
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
        
        // Convert normalized coordinates to screen coordinates
        const screenX = indexTip.x * window.innerWidth;
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
    
    updateStatus('Drawing circle... ✏️');
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
            updateStatus(`Circle added! Found ${intersections.length} intersections ⭐`);
        } else {
            updateStatus('Circle detected and added! ⭕');
        }
        
        // Update stats
        updateStats();
        
    } else {
        updateStatus('Shape not recognized as circle. Try drawing a more circular shape! 🔄');
    }
    
    // Clear drawing canvas after a delay
    setTimeout(() => {
        clearDrawingCanvas();
        if (connectState.isActive) {
            updateStatus('Ready to draw next circle! 👉');
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
function detectCircle(path) {
    if (path.length < connectState.minCirclePoints) return null;
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    path.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const aspectRatio = width / height;
    
    // Check if roughly square (circular bounding box)
    if (aspectRatio < 0.7 || aspectRatio > 1.4) {
        console.log('Circle detection failed: aspect ratio', aspectRatio);
        return null;
    }
    
    // Calculate center and radius
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radius = Math.max(width, height) / 2;
    
    // Check if points roughly follow circular path
    const circularityScore = calculateCircularity(path, centerX, centerY, radius);
    
    if (circularityScore < connectState.circleDetectionThreshold) {
        console.log('Circle detection failed: circularity score', circularityScore);
        return null;
    }
    
    // Convert screen coordinates to 3D world coordinates
    const worldCoords = screenTo3D(centerX, centerY, window.innerWidth, window.innerHeight);
    
    // Scale radius for 3D world
    const worldRadius = (radius / Math.min(window.innerWidth, window.innerHeight)) * 10;
    
    return {
        x: worldCoords.x,
        z: worldCoords.z, // Note: using z instead of y for floor plane
        radius: Math.max(0.5, Math.min(worldRadius, 3)), // Clamp radius
        userId: connectState.currentUserId,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate how circular a path is (0 = not circular, 1 = perfect circle)
 */
function calculateCircularity(path, centerX, centerY, expectedRadius) {
    if (path.length === 0) return 0;
    
    let totalDeviation = 0;
    let validPoints = 0;
    
    path.forEach(point => {
        const distance = Math.sqrt(
            Math.pow(point.x - centerX, 2) + 
            Math.pow(point.y - centerY, 2)
        );
        
        const deviation = Math.abs(distance - expectedRadius) / expectedRadius;
        totalDeviation += deviation;
        validPoints++;
    });
    
    const averageDeviation = totalDeviation / validPoints;
    const circularityScore = Math.max(0, 1 - averageDeviation);
    
    return circularityScore;
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
    ring.position.set(circleData.x, 0, circleData.z);
    
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
    
    console.log('Yellow circle added to 3D scene for current user:', circleData);
}

/**
 * Add existing circle from other users to 3D scene
 */
function addExistingCircleTo3D(circleData) {
    const innerRadius = Math.max(0.1, circleData.radius - 0.1);
    const outerRadius = circleData.radius + 0.1;
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    
    // Convert hex color string to THREE.Color
    let color = 0x8866ff; // Default purple
    if (circleData.color && circleData.color.startsWith('#')) {
        color = parseInt(circleData.color.substring(1), 16);
    }
    
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5, // More transparent for other users
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(circleData.x, 0, circleData.z);
    
    ring.userData = {
        type: 'circle',
        userId: circleData.userId,
        circleId: circleData.id,
        circleData: circleData,
        isExisting: true
    };
    
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    
    console.log('Existing circle added to 3D scene:', circleData);
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
}

/**
 * Update statistics display
 */
function updateStats() {
    // This would update the UI stats - can be called from main.js
    console.log('Stats updated - circles and intersections');
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
    
    console.log(`Cleared circles for user: ${userId}`);
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
    
    console.log('Connect mode cleaned up');
}

// Export state for debugging
export { connectState };