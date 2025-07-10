// flappyWeb/static/js/calibration.js

// Import necessary functions and state
import { gameState } from './gameState.js';
// Import webcam functions (ensure path is correct)
import { drawWebcamBackground, initWebcam, isWebcamReady } from './webcam.js';
// Import rendering utilities
import { updateBirdPhysics, drawBird, drawGround } from './utils/rendering.js';
// checkCollisions might not be used or a simplified version if needed for floor collision
import { checkCollisions } from './utils/collisions.js';

// Import smile detection modules
import { loadModels as loadFaceModels, startSmileUpdates, stopSmileUpdates, faceApiLoaded, getSmileValue } from './smileDetector.js'; // MODIFIED: Added getSmileValue
// Import jump function for bird
import { jump } from './utils/input.js'; // MODIFIED: Added jump import

// Store the function that requests the next animation frame
let requestNextFrameCallback = null;
let scoreElement = null; // To hide main game score
let livesElement = null; // To hide main game lives

// Define a threshold for smile detection to trigger a jump
const SMILE_JUMP_THRESHOLD = 18; // Example threshold: if smile value > 30, bird jumps. Adjust as needed.
                                 // Smile values from smileDetector range from 10 (neutral) to 100 (max smile), or -1 (no face).


/**
 * The main loop for the calibration screen.
 * Draws the webcam feed, instructions, bird, and ground.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The game canvas element.
 */
// function calibrationLoop(ctx, canvas) {
//     // Clear canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw background (webcam feed or fallback)
//     drawWebcamBackground(ctx, canvas); // From webcam.js

//     // Bird and Ground for visual feedback during calibration
//     if (gameState.running && gameState.calibrationMode) {
//         // Bird physics (e.g., make it hover or respond to a dummy input for now if desired)
//         // For a simple hover:
//         gameState.bird.y += Math.sin(Date.now() / 200) * 0.5; // Gentle hover
//         if (gameState.bird.y < canvas.height * 0.4) gameState.bird.y = canvas.height * 0.4;
//         if (gameState.bird.y > canvas.height * 0.6) gameState.bird.y = canvas.height * 0.6;


//         // updateBirdPhysics(); // Or use simplified physics if not jumping yet
//         const floorY = canvas.height - gameState.groundHeight - gameState.bird.height / 2;
//         if (gameState.bird.y > floorY) {
//             gameState.bird.y = floorY;
//             gameState.bird.velocity = 0;
//         }
//         // checkCollisions(() => {}); // Optional for calibration, mainly for floor

//         drawBird(ctx);

//         // Draw ground with animation
//         gameState.groundPos = (gameState.groundPos - (gameState.speed || 0.5)) % 24; // Slower speed
//         drawGround(ctx, canvas);
//     }

//     // Continue calibration loop if still in calibration mode
//     if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
//         requestNextFrameCallback(calibrationLoop);
//     }
// }
export function calibrationLoop(ctx, canvas) {
    // Skip frames if tab is not visible for performance
    if (document.hidden) {
        if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
            requestNextFrameCallback(calibrationLoop);
        }
        return;
    }
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (webcam feed or fallback)
    drawWebcamBackground(ctx, canvas);

    // Bird and Ground for visual feedback during calibration
    if (gameState.running && gameState.calibrationMode) {
        // Apply gravity (and update position based on current velocity)
        updateBirdPhysics(); // Bird falls or continues upward momentum from a jump

        const currentSmileValue = getSmileValue();

        // Check for smile to jump
        if (currentSmileValue > SMILE_JUMP_THRESHOLD) {
            jump(); // Sets bird.velocity to jumpStrength
        }

        // ADD THE HOVER EFFECT START
        // This line is inspired by your previously commented-out hover logic.
        const hoverEffect = Math.sin(Date.now() / 200) * 0.5; // Calculates a small vertical oscillation.
        gameState.bird.y += hoverEffect; // Adds the oscillation to the bird's current y position.
        // ADD THE HOVER EFFECT END

        // Use checkCollisions for ground/ceiling interaction.
        // gameState.pipes is empty during calibration, so pipe collision logic within
        // checkCollisions will not trigger loseLife/gameOver.
        // The ground and ceiling collision logic in checkCollisions will prevent the bird
        // from going off-screen.
        checkCollisions(() => {
            // This is a dummy gameOverCallback.
            // It won't be called by ground/ceiling collisions in checkCollisions.
            // It also won't be called by pipe collisions because gameState.pipes is empty.
            // console.log("Game over conditions met in calibration, but ignored.");
        });

        drawBird(ctx);

        // Draw ground with animation
        gameState.groundPos = (gameState.groundPos - (gameState.speed || 0.5)) % 24;
        drawGround(ctx, canvas);
    }

    // Continue calibration loop if still in calibration mode
    if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
        requestNextFrameCallback(calibrationLoop);
    }
}
/**
 * Initializes and starts the calibration screen.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {HTMLCanvasElement} canvas - The game canvas element.
 * @param {Function} startLoopFunc - Function from game.js to start the animation loop.
 * @param {Function} requestFrameFunc - Function from game.js to request the next animation frame.
 */
// export async function startCalibrationScreen(ctx, canvas, startLoopFunc, requestFrameFunc) {
//     console.log("Starting calibration screen (original basic version)...");

//     // Hide main game score/lives if they exist and are managed by these IDs
//     if (!scoreElement) scoreElement = document.getElementById('score-display');
//     if (!livesElement) livesElement = document.getElementById('lives-display');
//     if (scoreElement) scoreElement.style.display = 'none';
//     if (livesElement) livesElement.style.display = 'none';


//     // Attempt to initialize webcam if not already ready
//     if (!isWebcamReady()) {
//         console.log("Webcam not ready, attempting to initialize for calibration...");
//         await initWebcam(); // Initialize webcam from webcam.js
//         if (!isWebcamReady()) {
//             alert("Webcam could not be started. Calibration screen will show fallback background.");
//             // Proceed without webcam if it fails, drawWebcamBackground will show fallback
//         }
//     }

//     // Load face-api models if not already loaded
//     // Assuming loadModels is the one from smileDetector.js
//     if (typeof loadFaceModels === 'function' && !faceApiLoaded) { // Check if faceApiLoaded is a global or part of smileDetector export
//         try {
//             await loadFaceModels(); // from smileDetector.js
//             console.log("Face models loaded for calibration.");
//         } catch (error) {
//             console.error("Failed to load face models for calibration:", error);
//             alert("Could not load smile detection models. Calibration might not work as expected.");
//             // Optionally, decide if you want to proceed or return to menu
//         }
//     }
//     requestNextFrameCallback = requestFrameFunc;

//     // Set game state for calibration
//     gameState.running = true;
//     gameState.calibrationMode = true;
//     gameState.pipes = []; // Clear pipes
//     gameState.stars = []; // Clear stars (if you have them)
//     // Reset bird position for calibration screen
//     gameState.bird.x = canvas.width * 0.25; // Position bird more to the left
//     gameState.bird.y = canvas.height / 2;   // Center vertically
//     gameState.bird.velocity = 0;
//     // gameState.bird.canJump = false; // No jumping in this basic version yet

//     // Use the provided function from game.js to start the calibration loop
//     startLoopFunc(calibrationLoop);
    
//     // Start updating the smile intensity display
//     // MODIFIED_BLOCK: Changed window.faceApiLoaded to the imported faceApiLoaded and improved warning
//     if (isWebcamReady() && faceApiLoaded) {
//          startSmileUpdates();
//     } else {
//         let reason = "";
//         if (!isWebcamReady() && !faceApiLoaded) {
//             reason = "Webcam and face models are not ready";
//         } else if (!isWebcamReady()) {
//             reason = "Webcam is not ready";
//         } else {
//             reason = "Face models are not ready"; // This will now correctly trigger if models truly failed or are still loading
//         }
//         console.warn(`${reason}, smile intensity display will not update.`);
//         const smileValueElement = document.getElementById('smile-intensity-value');
//         if(smileValueElement) smileValueElement.textContent = "N/A";
//     }
// }
export async function startCalibrationScreen(ctx, canvas, startLoopFunc, requestFrameFunc) {
    console.log("Starting calibration screen (with smile jump and ground hover)...");

    if (!scoreElement) scoreElement = document.getElementById('score-display'); //
    if (!livesElement) livesElement = document.getElementById('lives-display'); //
    if (scoreElement) scoreElement.style.display = 'none'; //
    if (livesElement) livesElement.style.display = 'none'; //

    if (!isWebcamReady()) { //
        console.log("Webcam not ready, attempting to initialize for calibration...");
        await initWebcam(); //
        if (!isWebcamReady()) { //
            alert("Webcam could not be started. Calibration screen will show fallback background.");
        }
    }

    if (typeof loadFaceModels === 'function' && !faceApiLoaded) { //
        try {
            await loadFaceModels(); //
            console.log("Face models loaded for calibration.");
        } catch (error) {
            console.error("Failed to load face models for calibration:", error);
            alert("Could not load smile detection models. Calibration might not work as expected.");
        }
    }
    requestNextFrameCallback = requestFrameFunc; //

    gameState.running = true; //
    gameState.calibrationMode = true; //
    gameState.pipes = [];  //
    gameState.stars = [];  //
    gameState.bird.x = canvas.width * 0.25;  //
    gameState.bird.y = canvas.height / 2;    //
    gameState.bird.velocity = 0; //

    startLoopFunc(calibrationLoop); //
    
    if (isWebcamReady() && faceApiLoaded) { //
         startSmileUpdates(); //
    } else {
        let reason = "";
        if (!isWebcamReady() && !faceApiLoaded) { //
            reason = "Webcam and face models are not ready";
        } else if (!isWebcamReady()) { //
            reason = "Webcam is not ready";
        } else { //
            reason = "Face models are not ready"; 
        }
        console.warn(`${reason}, smile intensity display will not update.`);
        const smileValueElement = document.getElementById('smile-intensity-value'); //
        if(smileValueElement) smileValueElement.textContent = "N/A"; //
    }
}
/**
 * Stops the calibration loop.
 */
export function stopCalibration() {
    gameState.calibrationMode = false;
    requestNextFrameCallback = null; // Clear the callback
    console.log("Calibration stopped, cleaning up resources.");

    // Stop updating the smile intensity display
    if (typeof stopSmileUpdates === 'function') {
        stopSmileUpdates();
    }

    // Show main game score/lives again if they were hidden
    if (scoreElement) scoreElement.style.display = 'block'; // Or original display value
    if (livesElement) livesElement.style.display = 'block'; // Or original display value

    // Clean up webcam resources if we're not using smile input for the game
    const inputMethod = localStorage.getItem('flappyInputMethod') || 'space';
    if (inputMethod !== 'smile' && inputMethod !== 'altitude') {
        // Add a small delay to ensure calibration is fully complete
        setTimeout(() => {
            if (typeof cleanupWebcamResources === 'function') {
                cleanupWebcamResources(false); // Force cleanup regardless of calibration mode
            }
        }, 100);
    }
}
