// js/prayer.js - Prayer Mode System with Goddess Point Cloud (Dual Layer)
import { scene, camera, updateStatus, clearObjectsByType } from './scene.js';
import { getGoddessMesh } from './modelloader.js';

// ============================================================================
// PRAYER CONFIGURATION
// ============================================================================

const PRAYER_CONFIG = {
    // Hand detection thresholds
    handDetection: {
        palmDistanceThreshold: 0.25,    // Maximum palm distance for prayer gesture
        indexDistanceThreshold: 0.35,   // Maximum index finger distance for prayer gesture
        activationTime: 300,            // Time to hold gesture before activation (ms)
        cooldownTime: 500               // Cooldown between prayer activations (ms)
    },
    
    // 🎨 ENHANCED: Point cloud configuration
    pointCloud: {
        scale: 1.2,                     // 1.2x scale factor for goddess point cloud
        basePointSize: 0.02,            // Base point size (smaller for layering)
        maxPointSize: 0.08,             // Maximum point size (reduced for subtlety)
        pointDensity: 0.8,              // Density multiplier (slightly reduced)
        maxPoints: 25000,               // Maximum points for performance
        vertexColors: true,             // Use gradient colors
        opacity: 0.6,                   // Point opacity (reduced for layering)
        sizeAttenuation: true,          // Points get smaller with distance
        lifetime: 5000,                 // Point cloud lifetime in ms
        fadeTime: 2000,                 // Time to fade out
        animation: {
            enabled: true,
            floatSpeed: 0.002,
            expansionSpeed: 0.001,
            rotationSpeed: 0.008,
            particleMovement: true
        }
    },
    
    // 🎨 NEW: Layering configuration
    layering: {
        pointCloudOffset: { x: 0, y: 0.05, z: 0 },  // Slight upward offset
        modelOpacity: 1.0,              // Keep original model fully visible
        pointCloudOpacity: 0.6,         // Semi-transparent point cloud
        differentRotationSpeeds: true,  // Different rotation speeds for layers
        rotationSpeedRatio: 0.8,        // Point cloud rotates 80% speed of model
        modelRotationSpeed: 0.008       // Base rotation speed for model
    },
    
    // Visual effects
    effects: {
        glowIntensity: 1.8,
        cameraShakeIntensity: 0.015,
        etherealBlending: true,
        sparkleEffect: true
    }
};

// ============================================================================
// PRAYER STATE
// ============================================================================

let prayerState = {
    isActive: false,                  // Prayer session active
    isPraying: false,                 // Currently in prayer mode
    gestureStartTime: 0,              // When gesture was first detected
    lastActivationTime: 0,            // Last time prayer was activated
    prayerCount: 0,                   // Total prayers performed
    
    // 🎨 ENHANCED: Point cloud system
    goddessPointCloud: null,          // Main goddess point cloud
    originalVertices: null,           // Original goddess vertices
    originalColors: null,             // Original colors for vertices
    pointCloudGeometry: null,         // Point cloud geometry
    pointCloudMaterial: null,         // Point cloud material
    
    // Current gesture data
    currentDistances: null,
    gestureDetected: false,
    
    // Visual effects
    glowEffect: null,
    sparkleSystem: null,
    modelRotationInterval: null,      // For goddess model rotation
    pointCloudRotationInterval: null, // For point cloud rotation
    
    // Animation state
    animationTime: 0,
    originalPositions: null,
    currentPositions: null,
    
    // Goddess reference
    goddessMesh: null
};

// ============================================================================
// PRAYER MODE MANAGEMENT
// ============================================================================

/**
 * Initialize prayer system
 */
export function initPrayerMode() {
    console.log('🙏 Prayer system with dual-layer point cloud initialized');
    resetPrayerState();
}

/**
 * Start prayer session
 */
export function startPrayerMode() {
    prayerState.isActive = true;
    prayerState.goddessMesh = getGoddessMesh();
    
    // 🎨 ENHANCED: Pre-extract goddess vertices for point cloud
    if (prayerState.goddessMesh) {
        extractGoddessVertices();
    }
    
    updateStatus('🙏 Prayer session started! Join hands to begin prayer');
    console.log('✨ Prayer session activated with dual-layer point cloud system');
}

/**
 * Stop prayer session and return results
 */
export function stopPrayerMode() {
    prayerState.isActive = false;
    
    // End current prayer if active
    if (prayerState.isPraying) {
        endPrayer();
    }
    
    const results = {
        totalPrayers: prayerState.prayerCount,
        sessionActive: false
    };
    
    resetPrayerState();
    updateStatus('🙏 Prayer session ended');
    console.log('✨ Prayer session deactivated');
    
    return results;
}

// ============================================================================
// 🎨 GODDESS VERTEX EXTRACTION
// ============================================================================

/**
 * Extract vertices from goddess model for point cloud
 */
function extractGoddessVertices() {
    const goddess = prayerState.goddessMesh;
    if (!goddess) {
        console.warn('⚠️ No goddess mesh available for vertex extraction');
        return;
    }
    
    const vertices = [];
    const colors = [];
    
    // Traverse goddess model to extract all vertices
    goddess.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geometry = child.geometry;
            const positionAttribute = geometry.attributes.position;
            
            if (positionAttribute) {
                // Get world matrix for proper positioning
                child.updateMatrixWorld();
                const matrix = child.matrixWorld;
                
                for (let i = 0; i < positionAttribute.count; i++) {
                    const vertex = new THREE.Vector3(
                        positionAttribute.getX(i),
                        positionAttribute.getY(i),
                        positionAttribute.getZ(i)
                    );
                    
                    // Apply world transform
                    vertex.applyMatrix4(matrix);
                    
                    // 🎨 Apply 1.2x scale
                    vertex.multiplyScalar(PRAYER_CONFIG.pointCloud.scale);
                    
                    vertices.push(vertex);
                    
                    // Generate ethereal goddess colors
                    const color = generateGoddessPointColor(vertex, i);
                    colors.push(color);
                }
            }
        }
    });
    
    // Optimize vertex count for performance
    const optimizedData = optimizePointCloudData(vertices, colors);
    
    prayerState.originalVertices = optimizedData.vertices;
    prayerState.originalColors = optimizedData.colors;
    
    console.log(`✨ Extracted ${optimizedData.vertices.length} vertices from goddess (1.2x scaled)`);
}

/**
 * Generate ethereal color for goddess point
 */
function generateGoddessPointColor(vertex, index) {
    if (PRAYER_CONFIG.pointCloud.vertexColors) {
        // Create divine gradient based on height and position
        const heightNormalized = (vertex.y + 3) / 6; // Normalize height
        const distanceFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z) / 3;
        
        // Divine golden to white gradient
        const hue = 0.15 + Math.sin(index * 0.01) * 0.05; // Golden range with variation
        const saturation = 0.9 - heightNormalized * 0.3 - distanceFromCenter * 0.2;
        const lightness = 0.6 + heightNormalized * 0.3 + Math.sin(index * 0.02) * 0.1;
        
        const color = new THREE.Color().setHSL(
            Math.max(0.1, Math.min(0.25, hue)),
            Math.max(0.4, Math.min(1.0, saturation)),
            Math.max(0.4, Math.min(1.0, lightness))
        );
        
        return color;
    } else {
        return new THREE.Color(0xffd700); // Pure gold
    }
}

/**
 * Optimize point cloud data for performance
 */
function optimizePointCloudData(vertices, colors) {
    const maxPoints = PRAYER_CONFIG.pointCloud.maxPoints;
    const density = PRAYER_CONFIG.pointCloud.pointDensity;
    
    if (vertices.length <= maxPoints * density) {
        return { vertices, colors };
    }
    
    // Sample vertices to reduce count while maintaining shape
    const step = Math.ceil(vertices.length / (maxPoints * density));
    const optimizedVertices = [];
    const optimizedColors = [];
    
    for (let i = 0; i < vertices.length; i += step) {
        optimizedVertices.push(vertices[i]);
        optimizedColors.push(colors[i]);
    }
    
    console.log(`🔧 Optimized point cloud: ${vertices.length} → ${optimizedVertices.length} points`);
    return { vertices: optimizedVertices, colors: optimizedColors };
}

// ============================================================================
// HAND TRACKING INTEGRATION
// ============================================================================

/**
 * Process hand tracking results for prayer mode
 */
export function processPrayerHandResults(results) {
    if (!prayerState.isActive || !results) return;
    
    // Process gesture detection
    processGestureDetection(results);
    
    // 🎨 ENHANCED: Update point cloud effects based on gesture
    if (prayerState.isPraying && results.prayerGesture && results.prayerGesture.distances) {
        updatePointCloudEffects(results.prayerGesture.distances);
    }
}

/**
 * Process gesture detection from hand tracking results
 */
function processGestureDetection(results) {
    const currentTime = Date.now();
    
    // Check if we have valid prayer gesture data
    if (!results.prayerGesture || !results.prayerGesture.isPrayerGesture) {
        // Reset gesture detection
        prayerState.gestureDetected = false;
        prayerState.gestureStartTime = 0;
        
        if (prayerState.isPraying) {
            endPrayer();
        }
        return;
    }
    
    // Store current distances for point cloud control
    prayerState.currentDistances = results.prayerGesture.distances;
    
    // Check if gesture just started
    if (!prayerState.gestureDetected) {
        prayerState.gestureDetected = true;
        prayerState.gestureStartTime = currentTime;
        updateStatus('🙏 Prayer gesture detected - hold position...');
        return;
    }
    
    // Check if gesture has been held long enough
    const gestureHoldTime = currentTime - prayerState.gestureStartTime;
    
    if (gestureHoldTime >= PRAYER_CONFIG.handDetection.activationTime) {
        // Check cooldown
        const timeSinceLastActivation = currentTime - prayerState.lastActivationTime;
        
        if (!prayerState.isPraying && timeSinceLastActivation >= PRAYER_CONFIG.handDetection.cooldownTime) {
            startPrayer();
        } else if (prayerState.isPraying) {
            // Continue prayer - update status with distances
            const indexDist = (results.prayerGesture.distances.indexDistance * 100).toFixed(1);
            const palmDist = (results.prayerGesture.distances.palmDistance * 100).toFixed(1);
            updateStatus(`✨ Praying... Index: ${indexDist}cm, Palm: ${palmDist}cm`);
        }
    } else {
        // Show progress
        const progress = Math.floor((gestureHoldTime / PRAYER_CONFIG.handDetection.activationTime) * 100);
        updateStatus(`🙏 Hold prayer position: ${progress}%`);
    }
}

// ============================================================================
// PRAYER MECHANICS
// ============================================================================

/**
 * Start prayer mode
 */
function startPrayer() {
    if (prayerState.isPraying) return;
    
    console.log('✨ Starting prayer mode with dual-layer point cloud...');
    prayerState.isPraying = true;
    prayerState.lastActivationTime = Date.now();
    prayerState.prayerCount++;
    
    updateStatus(`✨ Prayer ${prayerState.prayerCount} activated! 🙏`);
    
    // 🎨 ENHANCED: Transform goddess into dual-layer system
    transformGoddessToPointCloud();
    
    // Add enhanced visual effects
    createEnhancedGlowEffect();
    createSparkleEffect();
    startCameraShake();
}

/**
 * End prayer mode
 */
function endPrayer() {
    if (!prayerState.isPraying) return;
    
    console.log('✨ Ending prayer mode...');
    prayerState.isPraying = false;
    
    // Stop all rotations
    stopAllRotations();
    
    // 🎨 ENHANCED: Fade out point cloud while keeping model visible
    fadeOutPointCloud();
    
    // Remove effects
    removeAllEffects();
    
    updateStatus('✨ Prayer complete - join hands again to pray');
}

// ============================================================================
// 🎨 ENHANCED DUAL-LAYER POINT CLOUD SYSTEM
// ============================================================================

/**
 * Transform goddess model into dual-layer system (model + point cloud)
 */
function transformGoddessToPointCloud() {
    if (!prayerState.originalVertices) {
        console.warn('⚠️ No goddess vertices available for point cloud');
        return;
    }
    
    // 🎨 ENHANCED: Keep original goddess visible for dual-layer effect
    // Original model stays fully visible and solid
    
    // Enable dual rotations (model and point cloud at different speeds)
    startDualRotations();
    
    // Create enhanced point cloud system
    createEnhancedPointCloud();
}

/**
 * Create enhanced goddess point cloud
 */
function createEnhancedPointCloud() {
    const vertices = prayerState.originalVertices;
    const colors = prayerState.originalColors;
    
    if (!vertices || vertices.length === 0) {
        console.error('❌ No vertices available for point cloud creation');
        return;
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Convert vertices to position array
    const positions = new Float32Array(vertices.length * 3);
    const colorArray = new Float32Array(vertices.length * 3);
    
    for (let i = 0; i < vertices.length; i++) {
        const i3 = i * 3;
        
        // Set positions
        positions[i3] = vertices[i].x;
        positions[i3 + 1] = vertices[i].y;
        positions[i3 + 2] = vertices[i].z;
        
        // Set colors
        colorArray[i3] = colors[i].r;
        colorArray[i3 + 1] = colors[i].g;
        colorArray[i3 + 2] = colors[i].b;
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    // Store original positions for animation
    prayerState.originalPositions = positions.slice();
    prayerState.currentPositions = positions.slice();
    
    // Create enhanced material for layering
    const material = createLayeredPointCloudMaterial();
    
    // Create point cloud
    prayerState.goddessPointCloud = new THREE.Points(geometry, material);
    prayerState.goddessPointCloud.userData = {
        type: 'goddessPointCloud',
        startTime: Date.now(),
        vertexCount: vertices.length
    };
    
    // 🎨 ENHANCED: Position point cloud with slight offset for layering effect
    if (prayerState.goddessMesh) {
        prayerState.goddessPointCloud.position.copy(prayerState.goddessMesh.position);
        const offset = PRAYER_CONFIG.layering.pointCloudOffset;
        prayerState.goddessPointCloud.position.add(new THREE.Vector3(offset.x, offset.y, offset.z));
    }
    
    // Store references
    prayerState.pointCloudGeometry = geometry;
    prayerState.pointCloudMaterial = material;
    
    // Add to scene
    scene.add(prayerState.goddessPointCloud);
    
    console.log(`✨ Dual-layer goddess point cloud created with ${vertices.length} points (layered with original model)`);
}

/**
 * Create enhanced point cloud material optimized for layering
 */
function createLayeredPointCloudMaterial() {
    const config = PRAYER_CONFIG.pointCloud;
    const layering = PRAYER_CONFIG.layering;
    
    const material = new THREE.PointsMaterial({
        size: config.basePointSize,
        color: config.vertexColors ? 0xffffff : 0xffd700,
        opacity: layering.pointCloudOpacity, // 🎨 Reduced opacity for layering
        transparent: true,
        sizeAttenuation: config.sizeAttenuation,
        vertexColors: config.vertexColors,
        blending: THREE.AdditiveBlending, // 🎨 Always additive for magical overlay
        depthWrite: false,
        depthTest: true
    });
    
    return material;
}

/**
 * 🎨 NEW: Start dual rotations (model and point cloud at different speeds)
 */
function startDualRotations() {
    const layering = PRAYER_CONFIG.layering;
    
    // Model rotation
    if (!prayerState.modelRotationInterval && layering.differentRotationSpeeds) {
        prayerState.modelRotationInterval = setInterval(() => {
            if (prayerState.goddessMesh && prayerState.isPraying) {
                prayerState.goddessMesh.rotation.y += layering.modelRotationSpeed;
            }
        }, 16); // ~60fps
    }
    
    // Point cloud rotation (different speed)
    if (!prayerState.pointCloudRotationInterval && layering.differentRotationSpeeds) {
        prayerState.pointCloudRotationInterval = setInterval(() => {
            if (prayerState.goddessPointCloud && prayerState.isPraying) {
                prayerState.goddessPointCloud.rotation.y += layering.modelRotationSpeed * layering.rotationSpeedRatio;
            }
        }, 16); // ~60fps
    }
    
    console.log('🔄 Dual rotations started - model and point cloud rotating at different speeds');
}

/**
 * 🎨 NEW: Stop all rotations
 */
function stopAllRotations() {
    if (prayerState.modelRotationInterval) {
        clearInterval(prayerState.modelRotationInterval);
        prayerState.modelRotationInterval = null;
    }
    
    if (prayerState.pointCloudRotationInterval) {
        clearInterval(prayerState.pointCloudRotationInterval);
        prayerState.pointCloudRotationInterval = null;
    }
    
    console.log('🔄 All rotations stopped');
}

/**
 * 🎨 ENHANCED: Update point cloud effects based on hand gesture distances
 */
function updatePointCloudEffects(distances) {
    if (!prayerState.goddessPointCloud) return;
    
    const { indexDistance, palmDistance } = distances;
    
    // Calculate point size based on index finger distance
    // SMALLER index distance = SMALLER points (more focused energy)
    const maxIndexDistance = 0.4;
    const minIndexDistance = 0.02;
    
    const clampedIndexDistance = Math.max(minIndexDistance, Math.min(indexDistance, maxIndexDistance));
    const distanceNormalized = (clampedIndexDistance - minIndexDistance) / (maxIndexDistance - minIndexDistance);
    
    // Calculate point size
    const minSize = 0.005;  // Very small points when hands are close
    const maxSize = PRAYER_CONFIG.pointCloud.maxPointSize;
    const pointSize = minSize + (distanceNormalized * (maxSize - minSize));
    
    // Update point size
    prayerState.pointCloudMaterial.size = pointSize;
    
    // Calculate expansion based on palm distance
    const palmNormalized = Math.min(palmDistance / 0.3, 1.0);
    const expansionFactor = 1.0 + palmNormalized * 2.0; // 1x to 3x expansion
    
    // Update point positions with expansion and animation
    updatePointCloudAnimation(expansionFactor, indexDistance, palmDistance);
    
    // Update material opacity based on gesture intensity
    const intensity = 1.0 - (indexDistance + palmDistance) / 2;
    const baseOpacity = PRAYER_CONFIG.layering.pointCloudOpacity;
    const opacity = baseOpacity * (0.6 + intensity * 0.4);
    prayerState.pointCloudMaterial.opacity = opacity;
}

/**
 * Update point cloud animation
 */
function updatePointCloudAnimation(expansionFactor, indexDistance, palmDistance) {
    if (!prayerState.goddessPointCloud || !prayerState.originalPositions) return;
    
    const positions = prayerState.goddessPointCloud.geometry.attributes.position.array;
    const originalPositions = prayerState.originalPositions;
    
    const time = (Date.now() - prayerState.goddessPointCloud.userData.startTime) * 0.001;
    prayerState.animationTime = time;
    
    // Animation configuration
    const config = PRAYER_CONFIG.pointCloud.animation;
    
    for (let i = 0; i < positions.length; i += 3) {
        const index = i / 3;
        
        // Base expanded position
        const baseX = originalPositions[i] * expansionFactor;
        const baseY = originalPositions[i + 1] * expansionFactor;
        const baseZ = originalPositions[i + 2] * expansionFactor;
        
        // Add floating animation
        const floatOffset = Math.sin(time * config.floatSpeed + index * 0.01) * 0.1;
        
        // Add swirling motion based on gesture
        const swirl = time * (0.3 + indexDistance * 1.5);
        const swirlRadius = indexDistance * 0.5;
        const swirlX = Math.sin(swirl + index * 0.05) * swirlRadius;
        const swirlZ = Math.cos(swirl + index * 0.05) * swirlRadius;
        
        // Add breathing effect based on palm distance
        const breathe = Math.sin(time * 2 + index * 0.02) * palmDistance * 0.2;
        
        // Combine all animations
        positions[i] = baseX + swirlX + breathe;
        positions[i + 1] = baseY + floatOffset + breathe * 0.5;
        positions[i + 2] = baseZ + swirlZ + breathe;
    }
    
    // Mark for update
    prayerState.goddessPointCloud.geometry.attributes.position.needsUpdate = true;
}

/**
 * 🎨 ENHANCED: Fade out point cloud (keeping model visible)
 */
function fadeOutPointCloud() {
    if (!prayerState.goddessPointCloud) return;
    
    const startTime = Date.now();
    const fadeTime = PRAYER_CONFIG.pointCloud.fadeTime;
    const originalOpacity = prayerState.pointCloudMaterial.opacity;
    
    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / fadeTime;
        
        if (progress < 1.0 && prayerState.goddessPointCloud) {
            // Fade opacity
            prayerState.pointCloudMaterial.opacity = originalOpacity * (1.0 - progress);
            
            // Shrink points
            const currentSize = prayerState.pointCloudMaterial.size;
            prayerState.pointCloudMaterial.size = currentSize * (1.0 - progress * 0.5);
            
            requestAnimationFrame(fade);
        } else {
            // Remove point cloud system (model stays visible)
            if (prayerState.goddessPointCloud) {
                scene.remove(prayerState.goddessPointCloud);
                
                // Clean up
                if (prayerState.pointCloudGeometry) {
                    prayerState.pointCloudGeometry.dispose();
                }
                if (prayerState.pointCloudMaterial) {
                    prayerState.pointCloudMaterial.dispose();
                }
                
                prayerState.goddessPointCloud = null;
                prayerState.pointCloudGeometry = null;
                prayerState.pointCloudMaterial = null;
            }
            
            console.log('✨ Point cloud faded out - goddess model remains visible');
        }
    }
    
    fade();
}

// ============================================================================
// 🎨 ENHANCED VISUAL EFFECTS
// ============================================================================

/**
 * Create enhanced glow effect around goddess area
 */
function createEnhancedGlowEffect() {
    const goddess = prayerState.goddessMesh;
    if (!goddess) return;
    
    // Create multiple glow layers for depth
    const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.12, // Slightly reduced for dual-layer effect
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    
    prayerState.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
    prayerState.glowEffect.position.copy(goddess.position);
    prayerState.glowEffect.userData = { type: 'enhancedGlow' };
    
    scene.add(prayerState.glowEffect);
    
    console.log('✨ Enhanced glow effect created for dual-layer system');
}

/**
 * Create sparkle effect around goddess
 */
function createSparkleEffect() {
    if (!PRAYER_CONFIG.effects.sparkleEffect) return;
    
    const sparkleCount = 120; // Increased for dual-layer effect
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleColors = new Float32Array(sparkleCount * 3);
    
    // Create sparkles around goddess area
    for (let i = 0; i < sparkleCount; i++) {
        const i3 = i * 3;
        
        // Random positions in sphere around goddess
        const radius = 3 + Math.random() * 5; // Larger radius for dual-layer
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        sparklePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        sparklePositions[i3 + 1] = radius * Math.cos(phi) + 2; // Offset up
        sparklePositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        
        // Golden sparkle colors with more variation
        const color = new THREE.Color().setHSL(
            0.15 + Math.random() * 0.15, // More hue variation
            0.8 + Math.random() * 0.2,
            0.7 + Math.random() * 0.3
        );
        
        sparkleColors[i3] = color.r;
        sparkleColors[i3 + 1] = color.g;
        sparkleColors[i3 + 2] = color.b;
    }
    
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
    
    const sparkleMaterial = new THREE.PointsMaterial({
        size: 0.025, // Slightly larger for visibility
        transparent: true,
        opacity: 0.7,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    prayerState.sparkleSystem = new THREE.Points(sparkleGeometry, sparkleMaterial);
    prayerState.sparkleSystem.userData = { type: 'sparkles', startTime: Date.now() };
    
    scene.add(prayerState.sparkleSystem);
    
    console.log('✨ Enhanced sparkle effect created for dual-layer system');
}

/**
 * Remove all effects
 */
function removeAllEffects() {
    // Remove glow effect
    if (prayerState.glowEffect) {
        scene.remove(prayerState.glowEffect);
        if (prayerState.glowEffect.geometry) prayerState.glowEffect.geometry.dispose();
        if (prayerState.glowEffect.material) prayerState.glowEffect.material.dispose();
        prayerState.glowEffect = null;
    }
    
    // Remove sparkle effect
    if (prayerState.sparkleSystem) {
        scene.remove(prayerState.sparkleSystem);
        if (prayerState.sparkleSystem.geometry) {
            prayerState.sparkleSystem.geometry.dispose();
        }
        if (prayerState.sparkleSystem.material) {
            prayerState.sparkleSystem.material.dispose();
        }
        prayerState.sparkleSystem = null;
    }
    
    console.log('🧹 All visual effects removed');
}

/**
 * Start enhanced camera shake effect
 */
function startCameraShake() {
    const originalPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    
    const shakeIntensity = PRAYER_CONFIG.effects.cameraShakeIntensity;
    const shakeDuration = 1500; // 1.5 seconds
    const startTime = Date.now();
    
    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed < shakeDuration && prayerState.isPraying) {
            // Diminishing shake over time
            const progress = elapsed / shakeDuration;
            const currentIntensity = shakeIntensity * (1 - progress);
            
            camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
            camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
            camera.position.z = originalPosition.z + (Math.random() - 0.5) * currentIntensity;
            
            requestAnimationFrame(shake);
        } else {
            // Reset camera position
            camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
        }
    }
    
    shake();
}

// ============================================================================
// ANIMATION AND UPDATES
// ============================================================================

/**
 * Update prayer system (called from main animation loop)
 */
export function updatePrayer() {
    // Update glow effect
    updateEnhancedGlowEffect();
    
    // Update sparkle effect
    updateSparkleEffect();
    
    // 🎨 ENHANCED: Update point cloud if active
    if (prayerState.goddessPointCloud && prayerState.isPraying && prayerState.currentDistances) {
        updatePointCloudEffects(prayerState.currentDistances);
    }
}

/**
 * Update enhanced glow effect animation
 */
function updateEnhancedGlowEffect() {
    if (prayerState.glowEffect && prayerState.isPraying) {
        // Enhanced pulsing glow effect
        const time = Date.now() * 0.002;
        const pulse = Math.sin(time) * 0.5 + 0.5;
        const pulse2 = Math.sin(time * 1.3) * 0.3 + 0.7;
        
        prayerState.glowEffect.material.opacity = 0.06 + pulse * 0.15; // Reduced for dual-layer
        prayerState.glowEffect.rotation.y += 0.006; // Slightly slower
        prayerState.glowEffect.rotation.x += 0.003;
        
        // Scale based on current distances if available
        if (prayerState.currentDistances) {
            const scale = 1.0 + prayerState.currentDistances.palmDistance * 1.2 + pulse2 * 0.2;
            prayerState.glowEffect.scale.setScalar(scale);
        }
    }
}

/**
 * Update sparkle effect animation
 */
function updateSparkleEffect() {
    if (prayerState.sparkleSystem && prayerState.isPraying) {
        const time = (Date.now() - prayerState.sparkleSystem.userData.startTime) * 0.001;
        
        // Rotate sparkles around goddess (counter to point cloud for layered effect)
        prayerState.sparkleSystem.rotation.y += 0.008; // Different speed
        prayerState.sparkleSystem.rotation.x += 0.004;
        
        // Animate sparkle positions
        const positions = prayerState.sparkleSystem.geometry.attributes.position.array;
        const sparkleCount = positions.length / 3;
        
        for (let i = 0; i < sparkleCount; i++) {
            const i3 = i * 3;
            
            // Add floating motion
            const floatOffset = Math.sin(time * 1.5 + i * 0.15) * 0.08;
            positions[i3 + 1] += floatOffset * 0.01;
            
            // Add twinkling by varying opacity
            if (Math.random() < 0.015) { // 1.5% chance per frame
                const opacity = 0.4 + Math.random() * 0.5;
                prayerState.sparkleSystem.material.opacity = opacity;
            }
        }
        
        prayerState.sparkleSystem.geometry.attributes.position.needsUpdate = true;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Reset prayer state
 */
function resetPrayerState() {
    // Stop any ongoing animations
    stopAllRotations();
    
    // Clean up point cloud
    if (prayerState.goddessPointCloud) {
        scene.remove(prayerState.goddessPointCloud);
        if (prayerState.pointCloudGeometry) {
            prayerState.pointCloudGeometry.dispose();
            prayerState.pointCloudGeometry = null;
        }
        if (prayerState.pointCloudMaterial) {
            prayerState.pointCloudMaterial.dispose();
            prayerState.pointCloudMaterial = null;
        }
        prayerState.goddessPointCloud = null;
    }
    
    // Remove all effects
    removeAllEffects();
    
    // Reset state
    prayerState = {
        isActive: false,
        isPraying: false,
        gestureStartTime: 0,
        lastActivationTime: 0,
        prayerCount: 0,
        goddessPointCloud: null,
        originalVertices: null,
        originalColors: null,
        pointCloudGeometry: null,
        pointCloudMaterial: null,
        currentDistances: null,
        gestureDetected: false,
        glowEffect: null,
        sparkleSystem: null,
        modelRotationInterval: null,
        pointCloudRotationInterval: null,
        animationTime: 0,
        originalPositions: null,
        currentPositions: null,
        goddessMesh: null
    };
    
    console.log('🧹 Prayer state reset and cleaned up (dual-layer system)');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get current prayer statistics
 */
export function getPrayerStats() {
    return {
        totalPrayers: prayerState.prayerCount,
        isPraying: prayerState.isPraying,
        isActive: prayerState.isActive,
        gestureDetected: prayerState.gestureDetected,
        currentDistances: prayerState.currentDistances,
        pointCloudActive: !!prayerState.goddessPointCloud,
        vertexCount: prayerState.originalVertices ? prayerState.originalVertices.length : 0,
        scale: PRAYER_CONFIG.pointCloud.scale,
        dualLayerActive: !!(prayerState.goddessPointCloud && prayerState.goddessMesh),
        modelVisible: prayerState.goddessMesh ? prayerState.goddessMesh.visible : false
    };
}

/**
 * Manually trigger prayer (for testing)
 */
export function triggerPrayer() {
    if (prayerState.isActive && !prayerState.isPraying) {
        // Simulate gesture detection
        prayerState.gestureDetected = true;
        prayerState.gestureStartTime = Date.now() - PRAYER_CONFIG.handDetection.activationTime;
        prayerState.currentDistances = {
            indexDistance: 0.1,
            palmDistance: 0.08
        };
        
        startPrayer();
        
        // Auto-end after 5 seconds for testing
        setTimeout(() => {
            if (prayerState.isPraying) {
                endPrayer();
            }
        }, 5000);
        
        console.log('🧪 Dual-layer prayer triggered manually for testing');
    }
}

/**
 * Update point cloud configuration
 */
export function updatePointCloudConfig(newConfig) {
    Object.assign(PRAYER_CONFIG.pointCloud, newConfig);
    
    // Apply changes to existing point cloud
    if (prayerState.goddessPointCloud && prayerState.pointCloudMaterial) {
        const material = prayerState.pointCloudMaterial;
        material.size = PRAYER_CONFIG.pointCloud.basePointSize;
        material.opacity = PRAYER_CONFIG.layering.pointCloudOpacity;
    }
    
    console.log('🎨 Point cloud configuration updated (dual-layer):', newConfig);
}

/**
 * Update layering configuration
 */
export function updateLayeringConfig(newConfig) {
    Object.assign(PRAYER_CONFIG.layering, newConfig);
    
    // Apply changes to existing system
    if (prayerState.goddessPointCloud && prayerState.pointCloudMaterial) {
        prayerState.pointCloudMaterial.opacity = PRAYER_CONFIG.layering.pointCloudOpacity;
    }
    
    console.log('🎨 Layering configuration updated:', newConfig);
}

/**
 * Get current prayer session status
 */
export function getPrayerSessionStatus() {
    return {
        isActive: prayerState.isActive,
        isPraying: prayerState.isPraying,
        gestureDetected: prayerState.gestureDetected,
        prayerCount: prayerState.prayerCount,
        pointCloudVertices: prayerState.originalVertices ? prayerState.originalVertices.length : 0,
        currentScale: PRAYER_CONFIG.pointCloud.scale,
        dualLayerMode: true,
        modelRotating: !!prayerState.modelRotationInterval,
        pointCloudRotating: !!prayerState.pointCloudRotationInterval
    };
}

/**
 * Set point cloud scale
 */
export function setPointCloudScale(scale) {
    PRAYER_CONFIG.pointCloud.scale = scale;
    
    // Re-extract vertices if prayer session is active
    if (prayerState.isActive && prayerState.goddessMesh) {
        extractGoddessVertices();
        console.log(`📏 Point cloud scale updated to ${scale}x (dual-layer mode)`);
    }
}

/**
 * Toggle point cloud animation
 */
export function togglePointCloudAnimation() {
    PRAYER_CONFIG.pointCloud.animation.enabled = !PRAYER_CONFIG.pointCloud.animation.enabled;
    
    const status = PRAYER_CONFIG.pointCloud.animation.enabled ? 'ON' : 'OFF';
    console.log(`🎭 Point cloud animation ${status} (dual-layer mode)`);
    updateStatus(`Point cloud animation ${status}`);
}

/**
 * Toggle dual rotation system
 */
export function toggleDualRotation() {
    PRAYER_CONFIG.layering.differentRotationSpeeds = !PRAYER_CONFIG.layering.differentRotationSpeeds;
    
    if (prayerState.isPraying) {
        if (PRAYER_CONFIG.layering.differentRotationSpeeds) {
            startDualRotations();
        } else {
            stopAllRotations();
        }
    }
    
    const status = PRAYER_CONFIG.layering.differentRotationSpeeds ? 'ON' : 'OFF';
    console.log(`🔄 Dual rotation system ${status}`);
    updateStatus(`Dual rotation ${status}`);
}

/**
 * Set rotation speed ratio
 */
export function setRotationSpeedRatio(ratio) {
    PRAYER_CONFIG.layering.rotationSpeedRatio = ratio;
    console.log(`🔄 Rotation speed ratio set to ${ratio} (point cloud vs model)`);
}

// ============================================================================
// AUTO-INTEGRATION WITH HAND TRACKING
// ============================================================================

/**
 * Manual integration function that main.js can call
 */
export function handlePrayerModeHandResults(results) {
    if (prayerState.isActive) {
        processPrayerHandResults(results);
    }
}

// Export state for debugging
export { prayerState, PRAYER_CONFIG };