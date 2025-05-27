// js/scene.js
// Note: This assumes THREE.js is loaded via script tag in HTML
// Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

export let scene, camera, renderer;

export function initScene(containerId = 'threecontainer') {
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
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
  
  // Camera - better positioned for viewing models
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(8, 4, 8);  // Back and up from the scene
  camera.lookAt(0, 1, 0);        // Look at center, slightly up
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0a0a0a, 1.0);
  container.appendChild(renderer.domElement);
  
  // Lighting setup
  setupLighting();
  
  // Handle resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
  
  console.log('Three.js scene initialized successfully');
  
  return { scene, camera, renderer };
}

function setupLighting() {
  // Ambient light
  const ambient = new THREE.AmbientLight(0x404040, 0.4);
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

function onWindowResize() {
  const container = document.getElementById('threecontainer');
  if (!container || !camera || !renderer) return;
  
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  
  // Render the scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Utility function to update status display
export function updateStatus(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
  }
  console.log('Status:', message);
}