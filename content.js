

console.log('Gemini Helper content script loaded.');

let lastGPressTime = 0;
const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

document.addEventListener('keydown', (event) => {
    // console.log(`Key pressed: ${event.key}`); // Keep commented unless debugging keys

    if (event.key === 'g') {
        const now = Date.now();

        if (now - lastGPressTime < DOUBLE_PRESS_THRESHOLD) {
            console.log('Double "g" press detected!');
            event.preventDefault(); // Prevent typing 'g'

            const selectedText = window.getSelection().toString().trim();

            // --- Check chrome.runtime and attempt to send message ---
            // Check *immediately* before trying to use sendMessage
            // Revert back to standard chrome object check
            // Check standard chrome object in isolated world
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                console.log('Check PASSED: chrome.runtime.sendMessage is available.');
                try {
                    if (selectedText) {
                        console.log('Selected Text:', selectedText);
                        console.log('Sending processText message...');
                        // Use standard chrome object
                        chrome.runtime.sendMessage({ type: 'processText', text: selectedText });
                    } else {
                        console.log('No text selected, sending page source.');
                        const pageSource = document.documentElement.outerHTML;
                        console.log('Sending processPage message...');
                        // Use standard chrome object
                        chrome.runtime.sendMessage({ type: 'processPage', source: pageSource });
                    }
                    console.log('Message sending attempted via chrome.runtime.sendMessage.');
                } catch (error) {
                    // Catch errors specifically during the sendMessage call
                    console.error('Gemini Helper Runtime Error: Failed during sendMessage call.', error);
                    console.error('State of chrome.runtime object at time of error:', chrome?.runtime);
                }
            } else {
                // Log detailed info if the check fails
                console.error('Check FAILED: chrome.runtime.sendMessage is NOT available just before sending.');
                // Log details about chrome object
                console.error(`Details: typeof chrome = ${typeof chrome}, chrome.runtime = ${chrome?.runtime}, typeof sendMessage = ${typeof chrome?.runtime?.sendMessage}`);
                console.error('Inspecting chrome object:', chrome); // Log the object itself
            }
            // --- End check and attempt ---

            lastGPressTime = 0; // Reset time after successful double press
        } else {
            // First press or press after long delay
            lastGPressTime = now;
        }
    } else {
        // Reset time if another key is pressed
        lastGPressTime = 0;
    }
});

window.addEventListener('blur', () => {
    lastGPressTime = 0;
});
