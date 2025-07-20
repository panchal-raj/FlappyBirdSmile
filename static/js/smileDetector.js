// file: flappyWeb/static/js/smileDetector.js

import { handleSmileJump } from './utils/input.js';
import { getVideoElement } from './webcam.js';

let faceMesh;
let lastSmileScore = 0;
// This threshold can be adjusted during a calibration step.
let smileThreshold = 2.5; 

let faceApiLoaded = false;

// Function to load the MediaPipe model
export async function loadModels() {
    if (faceApiLoaded) return;
    faceMesh = new FaceMesh({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    faceMesh.onResults(onResults);
    faceApiLoaded = true;
    console.log("MediaPipe FaceMesh model loaded.");
}

// Callback function to process detection results
function onResults(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        const p1 = landmarks[61];  // Left mouth corner
        const p2 = landmarks[291]; // Right mouth corner
        const p3 = landmarks[0];   // Top lip
        const p4 = landmarks[17];  // Bottom lip

        const mouthWidth = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const mouthHeight = Math.hypot(p3.x - p4.x, p3.y - p4.y);

        if (mouthHeight > 0.01) { // Avoid division by zero
           lastSmileScore = mouthWidth / mouthHeight;
        }

        // Trigger a jump if the smile score exceeds the threshold
        if (lastSmileScore > smileThreshold) {
            handleSmileJump();
        }
    } else {
        lastSmileScore = 0;
    }
}

// Function to send the current video frame to the model for processing
export async function detectSmile() {
    const videoElement = getVideoElement();
    if (faceMesh && videoElement && videoElement.readyState >= 4) {
        await faceMesh.send({image: videoElement});
    }
}

// Export a function to get the current score for calibration UI
export function getSmileValue() {
    return lastSmileScore;
}

export { faceApiLoaded };

// Functions no longer needed with this approach but exported to avoid breaking imports elsewhere.
// You can clean these up later.
export function startSmileUpdates() {}
export function stopSmileUpdates() {}
export function setSmileCalibrated() {}