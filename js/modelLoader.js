// js/modelLoader.js
import { scene, updateStatus } from './scene.js';

// Check if THREE is available
if (typeof THREE === 'undefined') {
  console.error('THREE.js not loaded! Make sure to include the script tag in your HTML.');
}

export const models = {};  // Will hold all loaded models
export let goddessMesh = null;

// ============================================================================
// MODEL POSITIONING CONFIGURATION - MODIFY THESE VALUES TO ADJUST MODELS
// ============================================================================

const MODEL_CONFIGS = {
  goddess: {
    position: { x: 0, y: -3, z: 0 },
    rotation: { x: 0, y: 0.7, z: 0 },
    scale: { x: 1.5, y: 1.5, z: 1.5 },
    autoRotate: false,        // Static initially - only rotates during prayer
    canBecomeParticles: true // Only goddess becomes particles
  },
  altar: {
    position: { x: 0, y: -2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1.5, y: 1.5, z: 1.5 },
    autoRotate: false,       // Static model
    canBecomeParticles: false // Cannot become particles
  },
  roof: {
    position: { x: 0, y: 8, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 5, y: 5, z: 5 },
    autoRotate: false,       // Static model
    canBecomeParticles: false // Cannot become particles
  }
};

// ============================================================================
// MODEL LOADING FUNCTIONS
// ============================================================================

/**
 * Load your actual 3D models from the models folder
 */
export function loadModels(useRealModels = true) {
  updateStatus('Loading 3D models...');
  
  if (useRealModels) {
    loadRealModels();
  } else {
    createPlaceholderModels();
  }
}

/**
 * Load real OBJ/MTL model files from your models folder
 */
function loadRealModels() {
  // Check if THREE is available
  if (typeof THREE === 'undefined') {
    console.error('THREE.js not loaded for model loading');
    updateStatus('Error: THREE.js not available');
    return;
  }

  // Check if required loaders are available
  if (typeof THREE.MTLLoader === 'undefined' || typeof THREE.OBJLoader === 'undefined') {
    console.error('MTLLoader or OBJLoader not available. Make sure to include them in your HTML.');
    updateStatus('Error: Model loaders not available');
    createPlaceholderModels(); // Fallback to placeholders
    return;
  }

  const modelNames = ['goddess', 'altar', 'roof'];
  let loadedCount = 0;
  const totalModels = modelNames.length;
  
  // Load models sequentially to avoid race conditions
  loadModelSequentially(modelNames, 0, () => {
    updateStatus('All models loaded. Ready to pray! 🙏');
    console.log('All real models loaded successfully');
  });
}

/**
 * Load models one by one to avoid race conditions
 */
function loadModelSequentially(modelNames, index, onAllComplete) {
  if (index >= modelNames.length) {
    if (onAllComplete) onAllComplete();
    return;
  }
  
  const modelName = modelNames[index];
  console.log(`Loading model ${index + 1}/${modelNames.length}: ${modelName}`);
  
  // Create fresh loaders for each model to avoid conflicts
  const mtlLoader = new THREE.MTLLoader();
  const objLoader = new THREE.OBJLoader();
  
  // Set the path for textures and models
  mtlLoader.setPath('models/');
  objLoader.setPath('models/');
  
  loadOBJModel(modelName, mtlLoader, objLoader, () => {
    const loadedCount = index + 1;
    updateStatus(`Loaded ${loadedCount}/${modelNames.length} models`);
    
    // Load next model after a small delay to ensure cleanup
    setTimeout(() => {
      loadModelSequentially(modelNames, index + 1, onAllComplete);
    }, 100); // 100ms delay between models
  });
}

/**
 * Load individual OBJ/MTL model with better material handling
 */
function loadOBJModel(modelName, mtlLoader, objLoader, onComplete) {
  const mtlPath = `${modelName}.mtl`;
  const objPath = `${modelName}.obj`;
  
  console.log(`Loading ${modelName} model from: ${mtlPath} and ${objPath}`);
  updateStatus(`Loading ${modelName}...`);
  
  // Clear any previous materials from the loader
  objLoader.setMaterials(null);
  
  // Load MTL file first
  mtlLoader.load(
    mtlPath,
    (materials) => {
      console.log(`${modelName} materials loaded successfully`);
      
      // Fix material paths - remove double models/ path
      Object.keys(materials.materials).forEach(key => {
        const material = materials.materials[key];
        if (material.map && material.map.image && material.map.image.src) {
          // Fix double models/ path issue
          const src = material.map.image.src;
          if (src.includes('models/models/')) {
            const newSrc = src.replace('models/models/', 'models/');
            console.log(`Fixed texture path: ${src} → ${newSrc}`);
            material.map.image.src = newSrc;
          }
        }
      });
      
      materials.preload();
      
      // Apply materials to OBJ loader
      objLoader.setMaterials(materials);
      
      // Load OBJ file
      objLoader.load(
        objPath,
        (object) => {
          console.log(`${modelName} object loaded successfully`);
          
          // Ensure materials are properly applied
          object.traverse(child => {
            if (child.isMesh && child.material) {
              // Fix any remaining texture path issues
              if (child.material.map && child.material.map.image && child.material.map.image.src) {
                const src = child.material.map.image.src;
                if (src.includes('models/models/')) {
                  const newSrc = src.replace('models/models/', 'models/');
                  child.material.map.image.src = newSrc;
                  child.material.map.needsUpdate = true;
                }
              }
              child.material.needsUpdate = true;
            }
          });
          
          setupModel(modelName, object);
          if (onComplete) onComplete();
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
            updateStatus(`Loading ${modelName}: ${percentComplete}%`);
          }
        },
        (error) => {
          console.error(`Error loading ${modelName} OBJ:`, error);
          updateStatus(`Error loading ${modelName} - using placeholder`);
          
          // Create placeholder if real model fails
          console.log(`Creating placeholder for ${modelName} due to loading error`);
          createPlaceholderForModel(modelName);
          if (onComplete) onComplete();
        }
      );
    },
    (progress) => {
      if (progress.lengthComputable) {
        const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
        updateStatus(`Loading ${modelName} materials: ${percentComplete}%`);
      }
    },
    (error) => {
      console.error(`Error loading ${modelName} MTL:`, error);
      console.log(`Trying to load ${modelName} OBJ without materials...`);
      
      // Clear materials and try loading OBJ without them
      objLoader.setMaterials(null);
      
      // Try loading OBJ without materials
      objLoader.load(
        objPath,
        (object) => {
          console.log(`${modelName} object loaded without materials`);
          
          // Apply a default material based on model type
          const defaultColor = getDefaultModelColor(modelName);
          object.traverse(child => {
            if (child.isMesh) {
              child.material = new THREE.MeshLambertMaterial({ 
                color: defaultColor,
                transparent: modelName === 'goddess' ? true : false,
                opacity: modelName === 'goddess' ? 0.9 : 1.0
              });
              child.material.needsUpdate = true;
            }
          });
          
          setupModel(modelName, object);
          if (onComplete) onComplete();
        },
        undefined,
        (error) => {
          console.error(`Error loading ${modelName} OBJ without materials:`, error);
          console.log(`Creating placeholder for ${modelName}`);
          createPlaceholderForModel(modelName);
          if (onComplete) onComplete();
        }
      );
    }
  );
}

/**
 * Get default color for each model type
 */
function getDefaultModelColor(modelName) {
  switch (modelName) {
    case 'goddess': return 0x8866aa; // Purple/violet for goddess
    case 'altar': return 0x654321;   // Brown for altar
    case 'roof': return 0x8B4513;    // Saddle brown for roof
    default: return 0x666666;        // Gray default
  }
}

/**
 * Apply positioning and configuration to a loaded model
 */
function setupModel(name, object) {
  const config = MODEL_CONFIGS[name] || MODEL_CONFIGS.goddess;
  
  // Apply position, rotation, scale
  object.position.set(config.position.x, config.position.y, config.position.z);
  object.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
  object.scale.set(config.scale.x, config.scale.y, config.scale.z);
  
  // Enable shadows and optimize materials
  object.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Ensure materials are set up properly
      if (child.material) {
        child.material.needsUpdate = true;
        
        // Special handling for goddess model materials
        if (name === 'goddess' && child.material) {
          // Make goddess slightly transparent for particle effect
          child.material.transparent = true;
          child.material.opacity = 0.95;
        }
      }
    }
  });
  
  // Set user data for animation and particle control
  object.userData = {
    autoRotate: config.autoRotate,
    isPraying: false,
    modelName: name,
    canBecomeParticles: config.canBecomeParticles,
    originalPosition: { ...config.position },
    originalRotation: { ...config.rotation },
    originalScale: { ...config.scale }
  };
  
  // Add to scene and store reference
  scene.add(object);
  models[name] = object;
  
  // Special handling for goddess model
  if (name === 'goddess') {
    goddessMesh = object;
    console.log('Goddess model set as main prayer target');
    console.log('Goddess can rotate:', config.autoRotate);
    console.log('Goddess can become particles:', config.canBecomeParticles);
  }
  
  console.log(`${name} model positioned at:`, config.position);
  console.log(`${name} model setup complete`);
}

// ============================================================================
// PLACEHOLDER MODEL CREATION (FALLBACK)
// ============================================================================

/**
 * Create placeholder models if real models fail to load
 */
function createPlaceholderModels() {
  updateStatus('Creating placeholder models...');
  
  createPlaceholderForModel('goddess');
  createPlaceholderForModel('altar');
  createPlaceholderForModel('roof');
  
  updateStatus('Placeholder models loaded. Ready to pray! 🙏');
}

/**
 * Create placeholder for a specific model
 */
function createPlaceholderForModel(name) {
  console.log(`Creating placeholder for ${name}`);
  
  switch (name) {
    case 'goddess':
      createPlaceholderGoddess();
      break;
    case 'altar':
      createPlaceholderAltar();
      break;
    case 'roof':
      createPlaceholderRoof();
      break;
    default:
      console.warn(`No placeholder defined for ${name}`);
  }
}

function createPlaceholderGoddess() {
  const config = MODEL_CONFIGS.goddess;
  const group = new THREE.Group();
  
  // Main body (cylinder)
  const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 12);
  const bodyMat = new THREE.MeshLambertMaterial({ 
    color: 0x8866aa,
    transparent: true,
    opacity: 0.9
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.5;
  body.castShadow = true;
  group.add(body);
  
  // Head (sphere)
  const headGeo = new THREE.SphereGeometry(0.6, 12, 8);
  const headMat = new THREE.MeshLambertMaterial({ 
    color: 0xaa8866,
    transparent: true,
    opacity: 0.9
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 3.5;
  head.castShadow = true;
  group.add(head);
  
  // Arms (boxes)
  const armGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
  const armMat = new THREE.MeshLambertMaterial({ 
    color: 0xaa8866,
    transparent: true,
    opacity: 0.9
  });
  
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-1.2, 2.2, 0);
  leftArm.rotation.z = 0.3;
  leftArm.castShadow = true;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(1.2, 2.2, 0);
  rightArm.rotation.z = -0.3;
  rightArm.castShadow = true;
  group.add(rightArm);
  
  setupModel('goddess', group);
}

function createPlaceholderAltar() {
  const altarGeo = new THREE.BoxGeometry(3, 1, 2);
  const altarMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
  const altar = new THREE.Mesh(altarGeo, altarMat);
  altar.castShadow = true;
  altar.receiveShadow = true;
  
  setupModel('altar', altar);
}

function createPlaceholderRoof() {
  const roofGeo = new THREE.ConeGeometry(4, 2, 8);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.castShadow = true;
  roof.receiveShadow = true;
  
  setupModel('roof', roof);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Update models (called from animation loop)
 */
export function updateModels() {
  Object.keys(models).forEach(name => {
    const model = models[name];
    // Only rotate if specifically enabled during prayer
    if (model && model.userData.autoRotate && model.userData.isPraying) {
      model.rotation.y += 0.005; // Slow rotation only during prayer
    }
  });
}

/**
 * Enable goddess rotation (called when prayer starts)
 */
export function enableGoddessRotation() {
  if (models.goddess) {
    models.goddess.userData.autoRotate = true;
    models.goddess.userData.isPraying = true;
    console.log('Goddess rotation enabled for prayer');
  }
}

/**
 * Disable goddess rotation (called when prayer ends)
 */
export function disableGoddessRotation() {
  if (models.goddess) {
    models.goddess.userData.autoRotate = false;
    models.goddess.userData.isPraying = false;
    console.log('Goddess rotation disabled');
  }
}

/**
 * Get model by name
 */
export function getModel(modelName) {
  return models[modelName] || null;
}

/**
 * Check if a model can become particles
 */
export function canModelBecomeParticles(modelName) {
  const config = MODEL_CONFIGS[modelName];
  return config ? config.canBecomeParticles : false;
}

/**
 * Get goddess mesh specifically (for particle effects)
 */
export function getGoddessMesh() {
  return goddessMesh;
}

/**
 * Print all current model positions (for debugging)
 */
export function logModelPositions() {
  console.log('Current model configurations:');
  Object.keys(MODEL_CONFIGS).forEach(name => {
    if (models[name]) {
      console.log(`${name}:`, MODEL_CONFIGS[name]);
      console.log(`${name} autoRotate:`, MODEL_CONFIGS[name].autoRotate);
      console.log(`${name} canBecomeParticles:`, MODEL_CONFIGS[name].canBecomeParticles);
    }
  });
}