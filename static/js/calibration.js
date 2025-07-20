// file: flappyWeb/static/js/calibration.js

import { gameState } from './gameState.js';
import { drawWebcamBackground, initWebcam, isWebcamReady } from './webcam.js';
import { updateBirdPhysics, drawBird, drawGround } from './utils/rendering.js';
import { checkCollisions } from './utils/collisions.js';
// UPDATE IMPORTS: Remove unused functions and add detectSmile
import { loadModels as loadFaceModels, faceApiLoaded, getSmileValue, detectSmile } from './smileDetector.js';
import { jump } from './utils/input.js';

let requestNextFrameCallback = null;
let scoreElement = null;
let livesElement = null;

// UPDATE THRESHOLD: Change to a ratio-based value suitable for MediaPipe
const SMILE_JUMP_THRESHOLD = 1.8;

// ADD ASYNC: Make the loop asynchronous to use await
export async function calibrationLoop(ctx, canvas) {
    if (document.hidden) {
        if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
            requestNextFrameCallback(calibrationLoop);
        }
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawWebcamBackground(ctx, canvas);

    if (gameState.running && gameState.calibrationMode) {
        // ADD THIS LINE: Actively run detection on each frame for live feedback
        await detectSmile();

        updateBirdPhysics();

        const currentSmileValue = getSmileValue();
        // ADD THIS LINE: Update the UI with the live smile score
        document.getElementById('smile-intensity-value').textContent = currentSmileValue.toFixed(2);

        if (currentSmileValue > SMILE_JUMP_THRESHOLD) {
            jump();
        }

        const hoverEffect = Math.sin(Date.now() / 200) * 0.5;
        gameState.bird.y += hoverEffect;

        checkCollisions(() => {});

        drawBird(ctx);

        gameState.groundPos = (gameState.groundPos - (gameState.speed || 0.5)) % 24;
        drawGround(ctx, canvas);
    }

    if (gameState.running && gameState.calibrationMode && requestNextFrameCallback) {
        requestNextFrameCallback(calibrationLoop);
    }
}

export async function startCalibrationScreen(ctx, canvas, startLoopFunc, requestFrameFunc) {
    console.log("Starting calibration screen (with smile jump and ground hover)...");

    if (!scoreElement) scoreElement = document.getElementById('score-display');
    if (!livesElement) livesElement = document.getElementById('lives-display');
    if (scoreElement) scoreElement.style.display = 'none';
    if (livesElement) livesElement.style.display = 'none';

    if (!isWebcamReady()) {
        console.log("Webcam not ready, attempting to initialize for calibration...");
        await initWebcam();
        if (!isWebcamReady()) {
            alert("Webcam could not be started. Calibration screen will show fallback background.");
        }
    }

    if (typeof loadFaceModels === 'function' && !faceApiLoaded) {
        try {
            await loadFaceModels();
            console.log("Face models loaded for calibration.");
        } catch (error) {
            console.error("Failed to load face models for calibration:", error);
            alert("Could not load smile detection models. Calibration might not work as expected.");
        }
    }
    requestNextFrameCallback = requestFrameFunc;

    gameState.running = true;
    gameState.calibrationMode = true;
    gameState.pipes = [];
    gameState.stars = [];
    gameState.bird.x = canvas.width * 0.25;
    gameState.bird.y = canvas.height / 2;
    gameState.bird.velocity = 0;

    startLoopFunc(calibrationLoop);
}

export function stopCalibration() {
    gameState.calibrationMode = false;
    requestNextFrameCallback = null;
    console.log("Calibration stopped, cleaning up resources.");

    if (scoreElement) scoreElement.style.display = 'block';
    if (livesElement) livesElement.style.display = 'block';

    const inputMethod = localStorage.getItem('flappyInputMethod') || 'space';
    if (inputMethod !== 'smile' && inputMethod !== 'altitude') {
        setTimeout(() => {
            if (typeof cleanupWebcamResources === 'function') {
                cleanupWebcamResources(false);
            }
        }, 100);
    }
}