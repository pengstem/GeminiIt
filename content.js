let lastGPressTime = 0; // Renamed variable
const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

console.log('Gemini Helper content script loaded.'); // Add this line

document.addEventListener('keydown', (event) => {
  console.log(`Key pressed: ${event.key}`); // Log every key press
  // Check if the pressed key is 'g'
  if (event.key === 'g') { // Changed from 'Alt' to 'g'
    const now = Date.now();
    console.log(`'g' pressed. Time since last 'g': ${now - lastGPressTime}ms`); // Log 'g' press timing

    if (now - lastGPressTime < DOUBLE_PRESS_THRESHOLD) { // Use renamed variable
      // Double press detected
      console.log('Double "g" press detected!'); // Updated log message
      event.preventDefault(); // Prevent default 'g' behavior if needed (e.g., typing 'g')

      const selectedText = window.getSelection().toString().trim();

      if (selectedText) {
        console.log('Selected Text:', selectedText);
        // Send selected text to background script
        console.log('Sending processText message...'); // Log before sending
        if (chrome && chrome.runtime) {
         // --- Add detailed check ---
         console.log('Check PASSED: chrome object exists:', typeof chrome);
         console.log('Check PASSED: chrome.runtime object exists:', typeof chrome.runtime);
         console.log('Check PASSED: chrome.runtime.sendMessage function exists:', typeof chrome.runtime.sendMessage);
         // --- End detailed check ---
          chrome.runtime.sendMessage({ type: 'processText', text: selectedText });
        } else {
          console.error("Error: chrome.runtime is not available to send message.");
        }
      } else {
        console.log('No text selected, sending page source.');
        const pageSource = document.documentElement.outerHTML;
        // Send page source to background script
        console.log('Sending processPage message...'); // Log before sending
        if (chrome && chrome.runtime) {
         // --- Add detailed check ---
         console.log('Check PASSED: chrome object exists:', typeof chrome);
         console.log('Check PASSED: chrome.runtime object exists:', typeof chrome.runtime);
         console.log('Check PASSED: chrome.runtime.sendMessage function exists:', typeof chrome.runtime.sendMessage);
         // --- End detailed check ---
          chrome.runtime.sendMessage({ type: 'processPage', source: pageSource });
        } else {
          console.error("Error: chrome.runtime is not available to send message.");
        }
      }

      lastGPressTime = 0; // Use renamed variable
    } else {
      // First press or press after long delay
      console.log('First "g" press or press after delay.'); // Log first press
      lastGPressTime = now; // Use renamed variable
    }
  } else {
    // Reset time if another key is pressed
    if (lastGPressTime !== 0) { // Only log reset if timer was active
        console.log(`Other key (${event.key}) pressed. Resetting double-press timer.`);
    }
    lastGPressTime = 0; // Use renamed variable
  }
});

// Optional: Reset time if the window loses focus
window.addEventListener('blur', () => {
  console.log('Window lost focus. Resetting double-press timer.'); // Log blur reset
  lastGPressTime = 0; // Use renamed variable
});
