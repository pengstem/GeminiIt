

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
            // Try checking window.chrome explicitly as well
            if (typeof window.chrome !== 'undefined' && window.chrome.runtime && typeof window.chrome.runtime.sendMessage === 'function') {
                console.log('Check PASSED: window.chrome.runtime.sendMessage is available.');
                try {
                    if (selectedText) {
                        console.log('Selected Text:', selectedText);
                        console.log('Sending processText message...');
                        // Use window.chrome explicitly
                        window.chrome.runtime.sendMessage({ type: 'processText', text: selectedText });
                    } else {
                        console.log('No text selected, sending page source.');
                        const pageSource = document.documentElement.outerHTML;
                        console.log('Sending processPage message...');
                        // Use window.chrome explicitly
                        window.chrome.runtime.sendMessage({ type: 'processPage', source: pageSource });
                    }
                    console.log('Message sending attempted via window.chrome.runtime.sendMessage.');
                } catch (error) {
                    // Catch errors specifically during the sendMessage call
                    console.error('Gemini Helper Runtime Error: Failed during sendMessage call.', error);
                    console.error('State of window.chrome.runtime object at time of error:', window.chrome?.runtime);
                }
            } else {
                // Log detailed info if the check fails
                console.error('Check FAILED: window.chrome.runtime.sendMessage is NOT available just before sending.');
                // Log the entire chrome object to see what's available
                console.error(`Details: typeof window.chrome = ${typeof window.chrome}, window.chrome.runtime = ${window.chrome?.runtime}, typeof sendMessage = ${typeof window.chrome?.runtime?.sendMessage}`);
                console.error('Inspecting window.chrome object:', window.chrome); // Log the object itself
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
