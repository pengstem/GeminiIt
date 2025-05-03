let lastGPressTime = 0; // Renamed variable
const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

document.addEventListener('keydown', (event) => {
  // Check if the pressed key is 'g'
  if (event.key === 'g') { // Changed from 'Alt' to 'g'
    const now = Date.now();

    if (now - lastGPressTime < DOUBLE_PRESS_THRESHOLD) { // Use renamed variable
      // Double press detected
      console.log('Double "g" press detected!'); // Updated log message
      event.preventDefault(); // Prevent default 'g' behavior if needed (e.g., typing 'g')

      const selectedText = window.getSelection().toString().trim();

      if (selectedText) {
        console.log('Selected Text:', selectedText);
        // Send selected text to background script
        chrome.runtime.sendMessage({ type: 'processText', text: selectedText });
      } else {
        console.log('No text selected, sending page source.');
        const pageSource = document.documentElement.outerHTML;
        // Send page source to background script
        chrome.runtime.sendMessage({ type: 'processPage', source: pageSource });
      }

      lastGPressTime = 0; // Use renamed variable
    } else {
      // First press or press after long delay
      lastGPressTime = now; // Use renamed variable
    }
  } else {
    // Reset time if another key is pressed
    lastGPressTime = 0; // Use renamed variable
  }
});

// Optional: Reset time if the window loses focus
window.addEventListener('blur', () => {
  lastGPressTime = 0; // Use renamed variable
});
