// js/prayer.js - Prayer Mode System
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
    
    // Particle effects
    particles: {
        baseCount: 200,                 // Base number of particles
        maxCount: 1000,                 // Maximum particles
        baseScale: 0.02,                // Base particle size
        maxScale: 0.1,                  // Maximum particle size
        lifetime: 5000,                 // Particle lifetime in ms
        fadeTime: 2000                  // Time to fade out
    },
    
    // Visual effects
    effects: {
        glowIntensity: 1.5,
        cameraShakeIntensity: 0.01
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
    
    // Particle system
    particleSystem: null,
    particles: [],
    
    // Current gesture data
    currentDistances: null,
    gestureDetected: false,
    
    // Visual effects
    glowEffect: null,
    rotationInterval: null,            // For continuous goddess rotation
    
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
    console.log('Prayer system initialized');
    resetPrayerState();
}

/**
 * Start prayer session
 */
export function startPrayerMode() {
    prayerState.isActive = true;
    prayerState.goddessMesh = getGoddessMesh();
    
    updateStatus('Prayer session started! Join hands to begin prayer 🙏');
    console.log('Prayer session activated');
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
    updateStatus('Prayer session ended');
    console.log('Prayer session deactivated');
    
    return results;
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
    
    // Update particle effects based on gesture
    if (prayerState.isPraying && results.prayerGesture && results.prayerGesture.distances) {
        updateParticleEffects(results.prayerGesture.distances);
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
    
    // Store current distances for particle control
    prayerState.currentDistances = results.prayerGesture.distances;
    
    // Check if gesture just started
    if (!prayerState.gestureDetected) {
        prayerState.gestureDetected = true;
        prayerState.gestureStartTime = currentTime;
        updateStatus('Prayer gesture detected - hold position...');
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
            updateStatus(`🙏 Praying... Index: ${indexDist}cm, Palm: ${palmDist}cm`);
        }
    } else {
        // Show progress
        const progress = Math.floor((gestureHoldTime / PRAYER_CONFIG.handDetection.activationTime) * 100);
        updateStatus(`Hold prayer position: ${progress}%`);
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
    
    console.log('Starting prayer mode...');
    prayerState.isPraying = true;
    prayerState.lastActivationTime = Date.now();
    prayerState.prayerCount++;
    
    updateStatus(`Prayer ${prayerState.prayerCount} activated! 🙏`);
    
    // Transform goddess into particles
    transformGoddessToParticles();
    
    // Add visual effects
    createGlowEffect();
    startCameraShake();
}

/**
 * End prayer mode
 */
function endPrayer() {
    if (!prayerState.isPraying) return;
    
    console.log('Ending prayer mode...');
    prayerState.isPraying = false;
    
    // Stop goddess rotation
    stopGoddessAutoRotation();
    
    // Fade out particles
    fadeOutParticles();
    
    // Remove effects
    removeGlowEffect();
    
    // Reset goddess after fade
    setTimeout(() => {
        restoreGoddess();
    }, PRAYER_CONFIG.particles.fadeTime);
    
    updateStatus('Prayer complete - join hands again to pray');
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

/**
 * Transform goddess model into particles
 */
function transformGoddessToParticles() {
    const goddess = prayerState.goddessMesh;
    if (!goddess) {
        console.log('No goddess mesh available for particle transformation');
        return;
    }
    
    // Enable goddess rotation during prayer
    startGoddessAutoRotation();
    
    // Create particle system
    createParticleSystem();
}

/**
 * Start continuous goddess rotation during prayer
 */
function startGoddessAutoRotation() {
    if (!prayerState.rotationInterval) {
        prayerState.rotationInterval = setInterval(() => {
            const goddess = prayerState.goddessMesh;
            if (goddess && prayerState.isPraying) {
                goddess.rotation.y += 0.02; // Continuous rotation speed
            }
        }, 16); // ~60fps
    }
}

/**
 * Stop goddess auto rotation
 */
function stopGoddessAutoRotation() {
    if (prayerState.rotationInterval) {
        clearInterval(prayerState.rotationInterval);
        prayerState.rotationInterval = null;
    }
}

/**
 * Create particle system based on goddess model
 */
function createParticleSystem() {
    const goddess = prayerState.goddessMesh;
    if (!goddess) return;
    
    // Get goddess bounding box and position
    const box = new THREE.Box3().setFromObject(goddess);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Create particle geometry
    const particleCount = PRAYER_CONFIG.particles.baseCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Position particles in goddess shape
        const x = center.x + (Math.random() - 0.5) * size.x;
        const y = center.y + (Math.random() - 0.5) * size.y;
        const z = center.z + (Math.random() - 0.5) * size.z;
        
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        
        // Store original positions
        originalPositions[i3] = x;
        originalPositions[i3 + 1] = y;
        originalPositions[i3 + 2] = z;
        
        // Random velocities
        velocities[i3] = (Math.random() - 0.5) * 0.01;
        velocities[i3 + 1] = Math.random() * 0.02 + 0.005; // Slight upward drift
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
        
        // Golden/divine colors
        const color = new THREE.Color();
        const hue = 0.15 + Math.random() * 0.1; // Golden range
        const saturation = 0.7 + Math.random() * 0.3;
        const lightness = 0.6 + Math.random() * 0.4;
        color.setHSL(hue, saturation, lightness);
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    
    // Create particle material
    const material = new THREE.PointsMaterial({
        size: PRAYER_CONFIG.particles.baseScale,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    // Create particle system
    prayerState.particleSystem = new THREE.Points(geometry, material);
    prayerState.particleSystem.userData = {
        type: 'particles',
        startTime: Date.now()
    };
    
    scene.add(prayerState.particleSystem);
    
    console.log(`Created particle system with ${particleCount} particles`);
}

/**
 * Update particle effects based on hand gesture distances
 */
function updateParticleEffects(distances) {
    if (!prayerState.particleSystem) return;
    
    const { indexDistance, palmDistance } = distances;
    
    // Calculate scale based on index finger distance
    // SMALLER index distance = SMALLER particles
    const maxIndexDistance = 0.4;
    const minIndexDistance = 0.02;
    
    const clampedIndexDistance = Math.max(minIndexDistance, Math.min(indexDistance, maxIndexDistance));
    const distanceNormalized = (clampedIndexDistance - minIndexDistance) / (maxIndexDistance - minIndexDistance);
    
    // Calculate particle scale
    const minScale = 0.005; // Very small particles when hands are close
    const maxScale = 0.08;  // Larger particles when hands are apart
    const particleScale = minScale + (distanceNormalized * (maxScale - minScale));
    
    // Update particle size
    prayerState.particleSystem.material.size = particleScale;
    
    // Calculate expansion based on palm distance
    const palmNormalized = Math.min(palmDistance / 0.3, 1.0);
    const expansionFactor = 1.0 + palmNormalized * 1.5; // 1x to 2.5x expansion
    
    // Update particle positions with expansion
    const positions = prayerState.particleSystem.geometry.attributes.position.array;
    const originalPositions = prayerState.particleSystem.geometry.attributes.originalPosition.array;
    const velocities = prayerState.particleSystem.geometry.attributes.velocity.array;
    
    const time = (Date.now() - prayerState.particleSystem.userData.startTime) * 0.001;
    
    for (let i = 0; i < positions.length; i += 3) {
        // Apply expansion from original position
        positions[i] = originalPositions[i] * expansionFactor + velocities[i] * time;
        positions[i + 1] = originalPositions[i + 1] * expansionFactor + velocities[i + 1] * time;
        positions[i + 2] = originalPositions[i + 2] * expansionFactor + velocities[i + 2] * time;
        
        // Add swirling motion based on index distance
        const swirl = time * (0.5 + indexDistance * 2);
        positions[i] += Math.sin(swirl + i * 0.1) * indexDistance * 0.3;
        positions[i + 2] += Math.cos(swirl + i * 0.1) * indexDistance * 0.3;
    }
    
    // Mark for update
    prayerState.particleSystem.geometry.attributes.position.needsUpdate = true;
    
    // Update material opacity based on palm distance
    const opacity = 0.5 + palmNormalized * 0.4; // 0.5 to 0.9
    prayerState.particleSystem.material.opacity = opacity;
}

/**
 * Fade out particles
 */
function fadeOutParticles() {
    if (!prayerState.particleSystem) return;
    
    const startTime = Date.now();
    const fadeTime = PRAYER_CONFIG.particles.fadeTime;
    
    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / fadeTime;
        
        if (progress < 1.0 && prayerState.particleSystem) {
            prayerState.particleSystem.material.opacity = (1.0 - progress) * 0.8;
            requestAnimationFrame(fade);
        } else {
            // Remove particle system
            if (prayerState.particleSystem) {
                scene.remove(prayerState.particleSystem);
                prayerState.particleSystem = null;
            }
        }
    }
    
    fade();
}

/**
 * Restore goddess visibility
 */
function restoreGoddess() {
    const goddess = prayerState.goddessMesh;
    if (goddess) {
        goddess.visible = true;
    }
    
    console.log('Goddess restored to normal state');
}

// ============================================================================
// VISUAL EFFECTS
// ============================================================================

/**
 * Create glow effect around goddess area
 */
function createGlowEffect() {
    const goddess = prayerState.goddessMesh;
    if (!goddess) return;
    
    // Create glow geometry
    const glowGeometry = new THREE.SphereGeometry(4, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    
    prayerState.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
    prayerState.glowEffect.position.copy(goddess.position);
    prayerState.glowEffect.userData = { type: 'glow' };
    
    scene.add(prayerState.glowEffect);
}

/**
 * Remove glow effect
 */
function removeGlowEffect() {
    if (prayerState.glowEffect) {
        scene.remove(prayerState.glowEffect);
        prayerState.glowEffect = null;
    }
}

/**
 * Start camera shake effect
 */
function startCameraShake() {
    const originalPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    
    const shakeIntensity = PRAYER_CONFIG.effects.cameraShakeIntensity;
    const shakeDuration = 1000; // 1 second
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
    updateGlowEffect();
    
    // Update particles if active
    if (prayerState.particleSystem && prayerState.isPraying && prayerState.currentDistances) {
        updateParticleEffects(prayerState.currentDistances);
    }
}

/**
 * Update glow effect animation
 */
function updateGlowEffect() {
    if (prayerState.glowEffect && prayerState.isPraying) {
        // Pulsing glow effect
        const time = Date.now() * 0.003;
        const pulse = Math.sin(time) * 0.5 + 0.5;
        prayerState.glowEffect.material.opacity = 0.05 + pulse * 0.15;
        prayerState.glowEffect.rotation.y += 0.01;
        
        // Scale based on current distances if available
        if (prayerState.currentDistances) {
            const scale = 1.0 + prayerState.currentDistances.palmDistance * 2;
            prayerState.glowEffect.scale.setScalar(scale);
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Reset prayer state
 */
function resetPrayerState() {
    prayerState = {
        isActive: false,
        isPraying: false,
        gestureStartTime: 0,
        lastActivationTime: 0,
        prayerCount: 0,
        particleSystem: null,
        particles: [],
        currentDistances: null,
        gestureDetected: false,
        glowEffect: null,
        rotationInterval: null,
        goddessMesh: null
    };
    
    // Clean up any existing effects
    if (prayerState.particleSystem) {
        scene.remove(prayerState.particleSystem);
        prayerState.particleSystem = null;
    }
    
    // Stop rotation
    stopGoddessAutoRotation();
    
    removeGlowEffect();
    restoreGoddess();
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
        currentDistances: prayerState.currentDistances
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
        
        // Auto-end after 3 seconds for testing
        setTimeout(() => {
            if (prayerState.isPraying) {
                endPrayer();
            }
        }, 3000);
    }
}

/**
 * Get current prayer session status
 */
export function getPrayerSessionStatus() {
    return {
        isActive: prayerState.isActive,
        isPraying: prayerState.isPraying,
        gestureDetected: prayerState.gestureDetected,
        prayerCount: prayerState.prayerCount
    };
}

// ============================================================================
// AUTO-INTEGRATION WITH HAND TRACKING
// ============================================================================

// Manual integration function that main.js can call
export function handlePrayerModeHandResults(results) {
    if (prayerState.isActive) {
        processPrayerHandResults(results);
    }
}

// Export state for debugging
export { prayerState, PRAYER_CONFIG };