// js/datamanager.js - Enhanced Circle Data Management System
import { updateStatus } from './scene.js';

// ============================================================================
// DATA CONFIGURATION
// ============================================================================

const DATA_CONFIG = {
    filename: './circle_data.json',
    autoSave: true,
    saveInterval: 3000, // Auto-save every 3 seconds
    backupInterval: 30000 // Backup every 30 seconds
};

// ============================================================================
// DATA STATE
// ============================================================================

let dataState = {
    currentUser: 'User1',
    circlesData: {
        users: {},
        lastUpdated: null,
        version: 1.0
    },
    loadedFromFile: false,
    autoSaveInterval: null,
    backupInterval: null,
    hasUnsavedChanges: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize data manager
 */
export function initDataManager() {
    console.log('Enhanced data manager initialized');
    
    // Try to load existing data
    loadExistingData();
    
    // Setup auto-save if enabled
    if (DATA_CONFIG.autoSave) {
        setupAutoSave();
    }
    
    // Setup backup system
    setupBackupSystem();
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
    if (dataState.autoSaveInterval) {
        clearInterval(dataState.autoSaveInterval);
    }
    
    dataState.autoSaveInterval = setInterval(() => {
        if (dataState.hasUnsavedChanges && Object.keys(dataState.circlesData.users).length > 0) {
            saveDataToFile();
        }
    }, DATA_CONFIG.saveInterval);
    
    console.log('Auto-save enabled every', DATA_CONFIG.saveInterval / 1000, 'seconds');
}

/**
 * Setup backup system
 */
function setupBackupSystem() {
    if (dataState.backupInterval) {
        clearInterval(dataState.backupInterval);
    }
    
    dataState.backupInterval = setInterval(() => {
        if (dataState.hasUnsavedChanges) {
            createBackup();
        }
    }, DATA_CONFIG.backupInterval);
    
    console.log('Backup system enabled every', DATA_CONFIG.backupInterval / 1000, 'seconds');
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load existing circle data from JSON file or create sample data
 */
export async function loadExistingData() {
    try {
        console.log('Attempting to load data from:', DATA_CONFIG.filename);
        
        // Try to load from JSON file
        const response = await fetch(DATA_CONFIG.filename);
        if (response.ok) {
            const jsonData = await response.json();
            console.log('Raw JSON data loaded:', jsonData);
            
            // Convert simple format to internal format
            dataState.circlesData = convertSimpleJsonToInternalFormat(jsonData);
            dataState.loadedFromFile = true;
            
            console.log('Circle data loaded and converted:', dataState.circlesData);
            updateStatus(`✅ Loaded ${jsonData.circles.length} circles from JSON file`);
            
            return dataState.circlesData;
        } else {
            console.warn('Could not fetch JSON file, status:', response.status);
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.warn('Could not load JSON file, using built-in sample data:', error.message);
        
        // Fallback to built-in sample data
        const sampleData = createSampleCircleData();
        dataState.circlesData = sampleData;
        dataState.loadedFromFile = false;
        
        console.log('Built-in sample circle data loaded:', dataState.circlesData);
        updateStatus('📁 Using built-in sample data (place sample_circle_data.json in data/ folder)');
        
        return dataState.circlesData;
    }
}

/**
 * Convert simple JSON format to internal format
 */
function convertSimpleJsonToInternalFormat(simpleJson) {
    const internalFormat = {
        users: {},
        lastUpdated: new Date().toISOString(),
        version: 1.0,
        totalCircles: simpleJson.circles.length,
        loadedFrom: 'JSON file'
    };
    
    // Group circles by user and assign colors
    simpleJson.circles.forEach((circle, index) => {
        const userId = circle.user;
        
        if (!internalFormat.users[userId]) {
            internalFormat.users[userId] = {
                userId: userId,
                circles: [],
                color: getUserColor(userId),
                createdAt: new Date().toISOString()
            };
        }
        
        // Add circle with generated ID and user color
        internalFormat.users[userId].circles.push({
            id: `${userId.toLowerCase()}_${index + 1}`,
            x: circle.x,
            z: circle.z,
            radius: circle.radius,
            timestamp: new Date().toISOString(),
            color: getUserColor(userId),
            userId: userId,
            source: 'JSON file'
        });
    });
    
    console.log('Converted to internal format:', internalFormat);
    return internalFormat;
}

/**
 * Create sample circle data for testing intersections
 */
function createSampleCircleData() {
    return {
        users: {
            "Alice": {
                userId: "Alice",
                color: "#ff6b6b",
                createdAt: "2024-01-15T10:30:00Z",
                circles: [
                    {
                        id: "alice_1",
                        x: 2.0,
                        z: 1.5,
                        radius: 1.8,
                        timestamp: "2024-01-15T10:30:00Z",
                        color: "#ff6b6b",
                        userId: "Alice",
                        source: "Built-in sample"
                    },
                    {
                        id: "alice_2", 
                        x: -1.0,
                        z: -2.0,
                        radius: 1.5,
                        timestamp: "2024-01-15T10:32:00Z",
                        color: "#ff6b6b",
                        userId: "Alice",
                        source: "Built-in sample"
                    }
                ]
            },
            "Bob": {
                userId: "Bob",
                color: "#4ecdc4",
                createdAt: "2024-01-15T11:15:00Z",
                circles: [
                    {
                        id: "bob_1",
                        x: 1.0,
                        z: 2.0,
                        radius: 1.2,
                        timestamp: "2024-01-15T11:15:00Z",
                        color: "#4ecdc4",
                        userId: "Bob",
                        source: "Built-in sample"
                    },
                    {
                        id: "bob_2",
                        x: -2.5,
                        z: 0.5,
                        radius: 1.6,
                        timestamp: "2024-01-15T11:18:00Z",
                        color: "#4ecdc4",
                        userId: "Bob",
                        source: "Built-in sample"
                    }
                ]
            },
            "Charlie": {
                userId: "Charlie",
                color: "#45b7d1",
                createdAt: "2024-01-15T14:20:00Z",
                circles: [
                    {
                        id: "charlie_1",
                        x: 0.0,
                        z: 0.0,
                        radius: 2.0,
                        timestamp: "2024-01-15T14:20:00Z",
                        color: "#45b7d1",
                        userId: "Charlie",
                        source: "Built-in sample"
                    }
                ]
            }
        },
        lastUpdated: new Date().toISOString(),
        version: 1.0,
        totalCircles: 5,
        loadedFrom: 'Built-in sample data'
    };
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

/**
 * Add new circle data for current user
 */
export function addCircleData(circleData) {
    const userId = dataState.currentUser;
    
    // Ensure user exists in data
    if (!dataState.circlesData.users[userId]) {
        dataState.circlesData.users[userId] = {
            userId: userId,
            circles: [],
            color: getUserColor(userId),
            createdAt: new Date().toISOString()
        };
    }
    
    // Add circle with unique ID
    const circle = {
        id: `${userId.toLowerCase()}_${Date.now()}`,
        x: parseFloat(circleData.x.toFixed(2)),
        z: parseFloat(circleData.z.toFixed(2)),
        radius: parseFloat(circleData.radius.toFixed(2)),
        timestamp: new Date().toISOString(),
        color: getUserColor(userId),
        userId: userId,
        source: 'User drawn'
    };
    
    dataState.circlesData.users[userId].circles.push(circle);
    dataState.circlesData.lastUpdated = new Date().toISOString();
    dataState.circlesData.totalCircles = getTotalCircleCount();
    dataState.hasUnsavedChanges = true;
    
    console.log('Circle added for user', userId, ':', circle);
    
    // Immediate save for important data
    if (DATA_CONFIG.autoSave) {
        setTimeout(() => saveDataToFile(), 100);
    }
    
    return circle;
}

/**
 * Get all circles from all users except current user
 */
export function getAllOtherUsersCircles() {
    const allCircles = [];
    const currentUser = dataState.currentUser;
    
    Object.keys(dataState.circlesData.users).forEach(userId => {
        if (userId !== currentUser) {
            const userCircles = dataState.circlesData.users[userId].circles || [];
            userCircles.forEach(circle => {
                allCircles.push({
                    ...circle,
                    userId: userId
                });
            });
        }
    });
    
    console.log(`Retrieved ${allCircles.length} circles from other users`);
    return allCircles;
}

/**
 * Get current user's circles
 */
export function getCurrentUserCircles() {
    const userId = dataState.currentUser;
    const circles = dataState.circlesData.users[userId]?.circles || [];
    console.log(`Current user ${userId} has ${circles.length} circles`);
    return circles;
}

/**
 * Find intersections between a new circle and existing circles
 */
export function findCircleIntersections(newCircle) {
    const intersections = [];
    const otherCircles = getAllOtherUsersCircles();
    
    console.log(`Checking intersections for new circle at (${newCircle.x}, ${newCircle.z}) with radius ${newCircle.radius}`);
    console.log(`Against ${otherCircles.length} existing circles`);
    
    otherCircles.forEach(existingCircle => {
        const intersectionPoints = calculateCircleIntersection(newCircle, existingCircle);
        
        if (intersectionPoints.length > 0) {
            const intersection = {
                circle1: newCircle,
                circle2: existingCircle,
                points: intersectionPoints,
                users: [dataState.currentUser, existingCircle.userId],
                timestamp: new Date().toISOString()
            };
            
            intersections.push(intersection);
            
            console.log(`🎯 Intersection found between ${dataState.currentUser} and ${existingCircle.userId}:`, {
                points: intersectionPoints,
                circle1: `(${newCircle.x}, ${newCircle.z}) r=${newCircle.radius}`,
                circle2: `(${existingCircle.x}, ${existingCircle.z}) r=${existingCircle.radius}`
            });
        }
    });
    
    console.log(`Total intersections found: ${intersections.length}`);
    return intersections;
}

/**
 * Calculate intersection points between two circles
 */
function calculateCircleIntersection(circle1, circle2) {
    const dx = circle2.x - circle1.x;
    const dz = circle2.z - circle1.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    console.log(`Calculating intersection between circles:`, {
        circle1: `(${circle1.x}, ${circle1.z}) r=${circle1.radius}`,
        circle2: `(${circle2.x}, ${circle2.z}) r=${circle2.radius}`,
        distance: distance.toFixed(2),
        sumRadii: (circle1.radius + circle2.radius).toFixed(2),
        diffRadii: Math.abs(circle1.radius - circle2.radius).toFixed(2)
    });
    
    // Check if circles intersect
    if (distance > circle1.radius + circle2.radius) {
        console.log('❌ Circles too far apart - no intersection');
        return [];
    }
    
    if (distance < Math.abs(circle1.radius - circle2.radius)) {
        console.log('❌ One circle inside the other - no intersection');
        return [];
    }
    
    if (distance === 0 && circle1.radius === circle2.radius) {
        console.log('❌ Circles are identical - infinite intersections');
        return [];
    }
    
    // Calculate intersection points using geometric formula
    const a = (circle1.radius * circle1.radius - circle2.radius * circle2.radius + distance * distance) / (2 * distance);
    const h = Math.sqrt(circle1.radius * circle1.radius - a * a);
    
    // Point on the line between circle centers
    const px = circle1.x + a * dx / distance;
    const pz = circle1.z + a * dz / distance;
    
    // The two intersection points
    const intersections = [
        { 
            x: parseFloat((px + h * (-dz) / distance).toFixed(3)), 
            z: parseFloat((pz + h * (dx) / distance).toFixed(3))
        },
        { 
            x: parseFloat((px - h * (-dz) / distance).toFixed(3)), 
            z: parseFloat((pz - h * (dx) / distance).toFixed(3))
        }
    ];
    
    console.log('✅ Intersection points calculated:', intersections);
    return intersections;
}

// ============================================================================
// DATA PERSISTENCE
// ============================================================================

/**
 * Save data to JSON file (simulated with localStorage + download)
 */
export function saveDataToFile() {
    const dataToSave = {
        ...dataState.circlesData,
        savedAt: new Date().toISOString(),
        saveType: 'auto-save'
    };
    
    const jsonString = JSON.stringify(dataToSave, null, 2);
    
    try {
        // Store in localStorage as backup
        localStorage.setItem('circle_data_backup', jsonString);
        dataState.hasUnsavedChanges = false;
        
        console.log('✅ Circle data saved to localStorage backup');
        updateStatus('💾 Data auto-saved');
        
        return jsonString;
    } catch (error) {
        console.warn('❌ Could not save to localStorage:', error);
        updateStatus('⚠️ Save failed - storage full');
        return null;
    }
}

/**
 * Create backup of current data
 */
function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `circle_data_backup_${timestamp}`;
    
    const backupData = {
        ...dataState.circlesData,
        backupCreatedAt: new Date().toISOString(),
        backupType: 'scheduled'
    };
    
    try {
        localStorage.setItem(backupKey, JSON.stringify(backupData, null, 2));
        console.log(`📦 Backup created: ${backupKey}`);
        
        // Keep only last 5 backups
        cleanupOldBackups();
        
    } catch (error) {
        console.warn('❌ Could not create backup:', error);
    }
}

/**
 * Clean up old backups to save space
 */
function cleanupOldBackups() {
    const backupKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('circle_data_backup_')) {
            backupKeys.push(key);
        }
    }
    
    // Sort by timestamp (newest first)
    backupKeys.sort().reverse();
    
    // Remove old backups (keep only 5 most recent)
    while (backupKeys.length > 5) {
        const oldKey = backupKeys.pop();
        localStorage.removeItem(oldKey);
        console.log(`🗑️ Removed old backup: ${oldKey}`);
    }
}

/**
 * Download circle data as JSON file
 */
export function downloadDataAsFile() {
    // Convert internal format back to simple format for download
    const simpleFormat = convertInternalFormatToSimpleJson(dataState.circlesData);
    
    const jsonString = JSON.stringify(simpleFormat, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `circle_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus('📥 Circle data downloaded as JSON file');
    console.log('📥 Circle data downloaded');
}

/**
 * Download full internal data (for debugging)
 */
export function downloadFullDataAsFile() {
    const fullData = {
        ...dataState.circlesData,
        exportedAt: new Date().toISOString(),
        exportType: 'full-internal'
    };
    
    const jsonString = JSON.stringify(fullData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_circle_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus('📥 Full data exported');
    console.log('📥 Full internal data downloaded');
}

/**
 * Convert internal format back to simple JSON format
 */
function convertInternalFormatToSimpleJson(internalData) {
    const simpleFormat = {
        circles: [],
        exportedAt: new Date().toISOString(),
        originalVersion: internalData.version || 1.0
    };
    
    // Extract all circles from all users
    Object.keys(internalData.users).forEach(userId => {
        const userCircles = internalData.users[userId].circles || [];
        userCircles.forEach(circle => {
            simpleFormat.circles.push({
                x: circle.x,
                z: circle.z,
                radius: circle.radius,
                user: userId
            });
        });
    });
    
    console.log(`Converted ${simpleFormat.circles.length} circles to simple format`);
    return simpleFormat;
}

/**
 * Load data from uploaded file
 */
export async function loadDataFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                console.log('Data loaded from uploaded file:', jsonData);
                
                // Convert and merge with existing data
                const convertedData = convertSimpleJsonToInternalFormat(jsonData);
                
                // Ask user if they want to replace or merge
                const shouldReplace = confirm('Replace existing data with uploaded file? (Cancel to merge)');
                
                if (shouldReplace) {
                    dataState.circlesData = convertedData;
                } else {
                    // Merge data
                    mergeCircleData(convertedData);
                }
                
                dataState.loadedFromFile = true;
                dataState.hasUnsavedChanges = true;
                
                updateStatus(`📁 Data loaded from file: ${jsonData.circles?.length || 0} circles`);
                resolve(dataState.circlesData);
                
            } catch (error) {
                console.error('Error parsing uploaded file:', error);
                updateStatus('❌ Error loading file - invalid JSON');
                reject(error);
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            updateStatus('❌ Error reading file');
            reject(new Error('File read error'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Merge new circle data with existing data
 */
function mergeCircleData(newData) {
    Object.keys(newData.users).forEach(userId => {
        if (!dataState.circlesData.users[userId]) {
            // New user - add all their data
            dataState.circlesData.users[userId] = newData.users[userId];
        } else {
            // Existing user - merge circles (avoid duplicates)
            const existingCircles = dataState.circlesData.users[userId].circles;
            const newCircles = newData.users[userId].circles;
            
            newCircles.forEach(newCircle => {
                const isDuplicate = existingCircles.some(existing => 
                    Math.abs(existing.x - newCircle.x) < 0.1 &&
                    Math.abs(existing.z - newCircle.z) < 0.1 &&
                    Math.abs(existing.radius - newCircle.radius) < 0.1
                );
                
                if (!isDuplicate) {
                    existingCircles.push({
                        ...newCircle,
                        id: `${userId.toLowerCase()}_merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            });
        }
    });
    
    dataState.circlesData.lastUpdated = new Date().toISOString();
    dataState.circlesData.totalCircles = getTotalCircleCount();
    
    console.log('Data merged successfully');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Set current user
 */
export function setCurrentUser(userId) {
    dataState.currentUser = userId;
    console.log('Current user set to:', userId);
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return dataState.currentUser;
}

/**
 * Get total circle count
 */
function getTotalCircleCount() {
    let total = 0;
    Object.keys(dataState.circlesData.users).forEach(userId => {
        total += dataState.circlesData.users[userId].circles?.length || 0;
    });
    return total;
}

/**
 * Get consistent color for user
 */
function getUserColor(userId) {
    const colors = [
        '#ff6b6b', // Red
        '#4ecdc4', // Teal
        '#45b7d1', // Blue
        '#f9ca24', // Yellow
        '#f0932b', // Orange
        '#eb4d4b', // Dark Red
        '#6c5ce7', // Purple
        '#a55eea', // Light Purple
        '#26de81', // Green
        '#fd79a8'  // Pink
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Get data statistics
 */
export function getDataStats() {
    const stats = {
        totalUsers: Object.keys(dataState.circlesData.users).length,
        totalCircles: getTotalCircleCount(),
        currentUser: dataState.currentUser,
        loadedFromFile: dataState.loadedFromFile,
        lastUpdated: dataState.circlesData.lastUpdated,
        dataSource: dataState.loadedFromFile ? 'JSON file' : 'Built-in sample data',
        hasUnsavedChanges: dataState.hasUnsavedChanges
    };
    
    // Add per-user statistics
    stats.userBreakdown = {};
    Object.keys(dataState.circlesData.users).forEach(userId => {
        stats.userBreakdown[userId] = {
            circleCount: dataState.circlesData.users[userId].circles?.length || 0,
            color: dataState.circlesData.users[userId].color
        };
    });
    
    return stats;
}

/**
 * Clear all circle data (for testing)
 */
export function clearAllData() {
    const confirm = window.confirm('Are you sure you want to clear all circle data? This cannot be undone.');
    
    if (confirm) {
        dataState.circlesData = {
            users: {},
            lastUpdated: new Date().toISOString(),
            version: 1.0,
            totalCircles: 0
        };
        
        dataState.hasUnsavedChanges = true;
        
        console.log('🗑️ All circle data cleared');
        updateStatus('🗑️ All circle data cleared');
    }
}

/**
 * Clear specific user's data
 */
export function clearUserData(userId) {
    if (dataState.circlesData.users[userId]) {
        const circleCount = dataState.circlesData.users[userId].circles?.length || 0;
        delete dataState.circlesData.users[userId];
        
        dataState.circlesData.lastUpdated = new Date().toISOString();
        dataState.circlesData.totalCircles = getTotalCircleCount();
        dataState.hasUnsavedChanges = true;
        
        console.log(`🗑️ Cleared ${circleCount} circles for user: ${userId}`);
        updateStatus(`🗑️ Cleared data for ${userId}`);
    }
}

/**
 * Get all circle data for debugging
 */
export function getAllData() {
    return {
        circlesData: dataState.circlesData,
        state: {
            currentUser: dataState.currentUser,
            loadedFromFile: dataState.loadedFromFile,
            hasUnsavedChanges: dataState.hasUnsavedChanges
        },
        config: DATA_CONFIG
    };
}

/**
 * Test intersection calculation (for debugging)
 */
export function testIntersectionCalculation() {
    console.log('🧪 Testing intersection calculations...');
    
    // Test case 1: Two overlapping circles
    const circle1 = { x: 0, z: 0, radius: 2 };
    const circle2 = { x: 3, z: 0, radius: 2 };
    const intersections1 = calculateCircleIntersection(circle1, circle2);
    console.log('Test 1 - Overlapping circles:', intersections1);
    
    // Test case 2: Non-overlapping circles
    const circle3 = { x: 0, z: 0, radius: 1 };
    const circle4 = { x: 5, z: 0, radius: 1 };
    const intersections2 = calculateCircleIntersection(circle3, circle4);
    console.log('Test 2 - Non-overlapping circles:', intersections2);
    
    // Test case 3: Touching circles
    const circle5 = { x: 0, z: 0, radius: 1.5 };
    const circle6 = { x: 3, z: 0, radius: 1.5 };
    const intersections3 = calculateCircleIntersection(circle5, circle6);
    console.log('Test 3 - Touching circles:', intersections3);
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cleanup data manager
 */
export function cleanupDataManager() {
    // Clear intervals
    if (dataState.autoSaveInterval) {
        clearInterval(dataState.autoSaveInterval);
        dataState.autoSaveInterval = null;
    }
    
    if (dataState.backupInterval) {
        clearInterval(dataState.backupInterval);
        dataState.backupInterval = null;
    }
    
    // Final save
    if (DATA_CONFIG.autoSave && dataState.hasUnsavedChanges) {
        saveDataToFile();
    }
    
    console.log('🧹 Data manager cleaned up');
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dataState.hasUnsavedChanges) {
        cleanupDataManager();
    }
});