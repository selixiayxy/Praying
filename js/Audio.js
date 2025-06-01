// js/audio.js - Simple Background Music Player

let backgroundAudio = null;
let userInteracted = false;

/**
 * Initialize simple background music
 */
export function initAudio() {

    
    // Create audio element
    backgroundAudio = document.createElement('audio');
    backgroundAudio.src = 'Assets/background.mp3';  // Put your MP3 file here
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.1;  // 30% volume - adjust this number (0.0 to 1.0)
    backgroundAudio.preload = 'auto';
    
    // Hide the audio element
    backgroundAudio.style.display = 'none';
    document.body.appendChild(backgroundAudio);
    
    // Wait for user interaction (browser requirement)
    setupUserInteraction();
    
    console.log('🎵 Background music ready - will start after first click');
}

/**
 * Setup user interaction to start music
 */
function setupUserInteraction() {
    const startMusic = () => {
        if (!userInteracted) {
            userInteracted = true;
            
            // Start playing
            backgroundAudio.play()
                .then(() => {
                    console.log('🎵 Background music started!');
                })
                .catch((error) => {
                    console.warn('🎵 Could not start background music:', error);
                });
            
            // Remove listeners after first interaction
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
            document.removeEventListener('touchstart', startMusic);
        }
    };
    
    // Listen for any user interaction
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
    document.addEventListener('touchstart', startMusic);
}

/**
 * Stop background music
 */
export function stopAudio() {
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
    }
}

/**
 * Check if music is playing
 */
export function isPlaying() {
    return backgroundAudio && !backgroundAudio.paused;
}