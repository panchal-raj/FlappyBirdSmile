// flappyWeb/static/js/smileDetector.js

// Path to your models directory from the HTML file's perspective
// If index.html is in templates/, and models are at the root of FLAPPYBIRDWEB/
// then the path might need to be relative to the deployed static files.
// Assuming your static files are served from /static/ and models are copied there:
import { getVideoElement, isWebcamReady } from './webcam.js'; // Modified: Added isWebcamReady
const MODEL_URL = '/static/models/'; // Adjust this path based on your final static file structure

let faceApiLoaded = false;
let lastSmileValue = -1; // To store the detected smile intensity or a boolean
let smileUpdateInterval = null;

let isSmileCalibrated = false;
let calibratedFixedSmileValue = 20; // Default placeholder, to be set by calibration (10-100)
let smileThreshold = 0.2; // Initial low threshold (0-1 raw) for differentiating smile vs neutral

export async function conditionalLoadModels(forceLoad = false) {
    // Only load models if the input method requires them or if forced
    const inputMethod = localStorage.getItem('flappyInputMethod') || 'space';
    if (forceLoad || inputMethod === 'smile' || inputMethod === 'altitude' || 
        (window.gameState && window.gameState.calibrationMode)) {
        return loadModels();
    } else {
        console.log("Skipping face model loading - not needed for current input method");
        return Promise.resolve();
    }
}


/*
// FUTURE IDEA: For making the bird jump with a smile
// The 'smileThreshold' (or a calibrated version of it) will be used to determine
// if a smile is sufficient to trigger a jump.
// This logic would interface with the game's input or bird control mechanism.
*/

// Function to load all necessary models
async function loadModels() {
    if (faceApiLoaded) {
        console.log("Face models already loaded, skipping");
        return;
    }
    
    console.log("Loading face-api.js models...");
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        console.log("Face-api.js models loaded successfully");
        faceApiLoaded = true;
    } catch (error) {
        console.error("Error loading face-api.js models:", error);
        throw error;
    }
}

// Function to detect smile from a video element
async function detectSmile(videoElement) {
    
    if (isSmileCalibrated) {
        lastSmileValue = calibratedFixedSmileValue; // This will be a value between 10-100
        return lastSmileValue;
    }

    if (!faceApiLoaded || !videoElement || videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        // Return -1 if models not loaded, video not ready, or webcam occluded (effectively no face)
        lastSmileValue = -1;
        return lastSmileValue;
    }

    try {
        // Configure detector options (can be tuned)
        const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }); // smaller is faster

        // Perform detection
        const detections = await faceapi.detectSingleFace(videoElement, tinyFaceDetectorOptions)
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections) {
            // 'happy' expression is a good proxy for a smile.
            // The value is a confidence score between 0 and 1.
            const smileIntensity = detections.expressions.happy;

            let scaledValue = 10 + (smileIntensity * 90);
            lastSmileValue = Math.round(scaledValue);

            // Ensure value is strictly capped within 10-100 for valid, scaled smile values
            lastSmileValue = Math.max(10, Math.min(100, lastSmileValue));
            return lastSmileValue

        } else {
            // No face detected
            lastSmileValue = -1; // Or 0 if you prefer to show no smile vs. occluded
            return lastSmileValue;
        }
    } catch (error) {
        console.error("Error during smile detection:", error);
        lastSmileValue = -1; // Error state
        return lastSmileValue;
    }
}

function setSmileCalibrated(status, fixedValue) {
  isSmileCalibrated = status;
  if (isSmileCalibrated && fixedValue !== undefined && fixedValue >= 10 && fixedValue <= 100) {
    calibratedFixedSmileValue = Math.round(fixedValue);
    // When calibrated, ensure lastSmileValue reflects this immediately
    lastSmileValue = calibratedFixedSmileValue;
  } else if (!isSmileCalibrated) {
    // If calibration is turned off, lastSmileValue will be determined by ongoing detections
  }
  console.log(`Smile calibration set to: ${status}, Fixed value: ${calibratedFixedSmileValue}`);
}

// Function to get the last detected smile value (for other modules to use)
function getSmileValue() {
    return lastSmileValue;
}

function updateSmileDisplay() {
    const videoElement = getVideoElement();
    const smileValueElement = document.getElementById('smile-intensity-value');

    if (videoElement && smileValueElement && isWebcamReady()) { // Added isWebcamReady check
        detectSmile(videoElement).then(smileValue => {
            if (smileValue !== null && smileValue >= -1) { // Allow -1 to be displayed
                smileValueElement.textContent = smileValue;
            } else {
                smileValueElement.textContent = "N/A"; // Or some other placeholder
            }
        }).catch(error => {
            console.error("Error updating smile display:", error);
            if (smileValueElement) {
                smileValueElement.textContent = "Error";
            }
        });
    } else if (smileValueElement && !isWebcamReady()) {
         smileValueElement.textContent = "CAMERA OFF";
    }
}



function startSmileUpdates() {
    if (!faceApiLoaded) {
        console.warn("Face API models not loaded. Cannot start smile updates.");
        return;
    }
    if (smileUpdateInterval) {
        clearInterval(smileUpdateInterval);
    }
    // Update rate: e.g., 5 times per second (every 200ms)
    smileUpdateInterval = setInterval(updateSmileDisplay, 200);
    console.log("Started continuous smile updates for display.");
}

function stopSmileUpdates() {
    if (smileUpdateInterval) {
        clearInterval(smileUpdateInterval);
        smileUpdateInterval = null;
        console.log("Stopped continuous smile updates for display.");
        const smileValueElement = document.getElementById('smile-intensity-value');
        if (smileValueElement) {
            smileValueElement.textContent = "N/A";
        }
    }
}

export { loadModels, detectSmile, getSmileValue, faceApiLoaded, startSmileUpdates, stopSmileUpdates, setSmileCalibrated };