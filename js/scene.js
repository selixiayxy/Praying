// js/scene.js - Three.js Scene Management

export let scene, camera, renderer;

/**
 * Initialize Three.js scene
 */
export function initScene(containerId = 'threeContainer') {
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error('THREE.js not loaded! Make sure to include the script tag in your HTML.');
        throw new Error('THREE.js not loaded');
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found`);
        throw new Error(`Container '${containerId}' not found`);
    }
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    
    // Camera - positioned for both circle drawing and prayer viewing
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(80, aspect, 0.1, 1000);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e, 1.0);
    container.appendChild(renderer.domElement);
    
    // Lighting setup
    setupLighting();
    
    // Create floor for circle drawing
    createFloor();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
    
    console.log('Three.js scene initialized successfully');
    
    return { scene, camera, renderer };
}

/**
 * Setup lighting for the scene
 */
function setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x554433, 0.4);
    scene.add(ambient);
    
    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);
    
    // Accent lights for mystical effect
    const light1 = new THREE.PointLight(0x9966cc, 0.5, 10);
    light1.position.set(-3, 2, 3);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0x6699cc, 0.5, 10);
    light2.position.set(3, 2, -3);
    scene.add(light2);
    
    // Additional fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
}

/**
 * Create floor plane for circle drawing
 */

function createFloor() {
    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshLambertMaterial({ 
        color: 0x2c3e50, 
        transparent: true, 
        opacity: 0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData = { type: 'floor' };
    scene.add(floor);
    
    /*
    // Grid helper
    const grid = new THREE.GridHelper(20, 40, 0x444444, 0x444444);
    grid.userData = { type: 'grid' };
    scene.add(grid);
    */
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('threeContainer');
    if (!container || !camera || !renderer) return;
    
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate intersection stars
    rotateStars();
    
    // Render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Rotate intersection stars for visual effect
 */
function rotateStars() {
    scene.traverse(child => {
        if (child.userData.type === 'star') {
            child.rotation.y += 0.02;
            child.rotation.z += 0.01;
        }
    });
}

/**
 * Utility function to update status display
 */
export function updateStatus(message) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
    }
    console.log('Status:', message);
}

/**
 * Get scene objects by type
 */
export function getObjectsByType(type) {
    const objects = [];
    scene.traverse(child => {
        if (child.userData.type === type) {
            objects.push(child);
        }
    });
    return objects;
}

/**
 * Clear objects of specific type from scene
 */
export function clearObjectsByType(type) {
    const toRemove = [];
    scene.traverse(child => {
        if (child.userData.type === type) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(obj => scene.remove(obj));
    return toRemove.length;
}

/**
 * Clear objects by user ID
 */
export function clearObjectsByUserId(userId) {
    const toRemove = [];
    scene.traverse(child => {
        if (child.userData.userId === userId) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(obj => scene.remove(obj));
    return toRemove.length;
}

/**
 * Add object to scene with proper setup
 */
export function addObjectToScene(object, userData = {}) {
    object.userData = { ...object.userData, ...userData };
    
    // Enable shadows if it's a mesh
    if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
    }
    
    // Enable shadows for children
    object.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    scene.add(object);
    return object;
}

/**
 * Get scene bounds for coordinate mapping
 */
export function getSceneBounds() {
    return {
        minX: -10,
        maxX: 10,
        minZ: -10,
        maxZ: 10,
        width: 20,
        height: 20
    };
}

/**
 * Convert screen coordinates to 3D world coordinates
 */
export function screenTo3D(screenX, screenY, screenWidth, screenHeight) {
    const bounds = getSceneBounds();
    
    // Normalize screen coordinates (0 to 1)
    const normalizedX = screenX / screenWidth;
    const normalizedY = screenY / screenHeight;
    
    // Map to 3D world coordinates
    const worldX = (normalizedX - 0.5) * bounds.width;
    const worldZ = (normalizedY - 0.5) * bounds.height;
    
    return {
        x: worldX,
        y: 0, // On the floor
        z: worldZ
    };
}

/**
 * Get current scene statistics
 */
export function getSceneStats() {
    const stats = {
        circles: 0,
        stars: 0,
        models: 0,
        particles: 0
    };
    
    scene.traverse(child => {
        switch (child.userData.type) {
            case 'circle':
                stats.circles++;
                break;
            case 'star':
                stats.stars++;
                break;
            case 'model':
                stats.models++;
                break;
            case 'particles':
                stats.particles++;
                break;
        }
    });
    
    return stats;
}