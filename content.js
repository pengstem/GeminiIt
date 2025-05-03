
console.log('Gemini Helper content script loaded.');

// --- Start IIFE ---
// Wrap logic in a function to create a private scope and manage dependencies.
// Pass window.chrome?.runtime into the IIFE.
// The ?. (optional chaining) prevents an error if window.chrome itself is undefined.
(function(chromeRuntime) {
    'use strict'; // Enforce stricter parsing and error handling

    // --- Check for essential API availability AT THE START ---
    if (!chromeRuntime || typeof chromeRuntime.sendMessage !== 'function') {
        console.error('Gemini Helper Error: chrome.runtime.sendMessage is NOT available in this context. Script cannot attach listener or send messages.');
        // If the core API is missing, there's no point adding listeners.
        return;
    }

    // If the check above passed, we know chromeRuntime.sendMessage is available *at this point*.
    console.log('Gemini Helper Info: chrome.runtime.sendMessage IS available. Proceeding to add listener.');

    let lastGPressTime = 0;
    const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

    document.addEventListener('keydown', (event) => {
        // No need to log every key press unless debugging specific key events
        // console.log(`Key pressed: ${event.key}`);

        if (event.key === 'g') {
            const now = Date.now();
            // No need to log timing unless debugging double-press specifically
            // console.log(`'g' pressed. Time since last 'g': ${now - lastGPressTime}ms`);

            if (now - lastGPressTime < DOUBLE_PRESS_THRESHOLD) {
                console.log('Double "g" press detected!');
                event.preventDefault(); // Prevent typing 'g'

                const selectedText = window.getSelection().toString().trim();

                // --- Attempt to send message ---
                // We already confirmed chromeRuntime.sendMessage exists,
                // but wrap in try...catch in case it becomes undefined later unexpectedly.
                try {
                    if (selectedText) {
                        console.log('Selected Text:', selectedText);
                        console.log('Sending processText message...');
                        chromeRuntime.sendMessage({ type: 'processText', text: selectedText });
                    } else {
                        console.log('No text selected, sending page source.');
                        const pageSource = document.documentElement.outerHTML;
                        console.log('Sending processPage message...');
                        chromeRuntime.sendMessage({ type: 'processPage', source: pageSource });
                    }
                    console.log('Message sending attempted via chromeRuntime.sendMessage.');

                } catch (error) {
                    // Catch errors specifically during the sendMessage call
                    console.error('Gemini Helper Runtime Error: Failed during sendMessage call.', error);
                    // Log the state of chromeRuntime if an error occurs here
                    console.error('State of chromeRuntime object at time of error:', chromeRuntime);
                }
                // --- End attempt to send message ---

                lastGPressTime = 0; // Reset time after successful double press
            } else {
                // First press or press after long delay
                // console.log('First "g" press or press after delay.'); // Reduce noise
                lastGPressTime = now;
            }
        } else {
            // Reset time if another key is pressed
            if (lastGPressTime !== 0) {
                // console.log(`Other key (${event.key}) pressed. Resetting double-press timer.`); // Reduce noise
            }
            lastGPressTime = 0;
        }
    });

    window.addEventListener('blur', () => {
        // console.log('Window lost focus. Resetting double-press timer.'); // Reduce noise
        lastGPressTime = 0;
    });

})(window.chrome?.runtime);
// --- End IIFE ---
