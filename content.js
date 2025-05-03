let lastAltPressTime = 0;
const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

document.addEventListener('keydown', (event) => {
  // Check if the pressed key is Alt (AltLeft or AltRight)
  if (event.key === 'Alt') {
    const now = Date.now();

    if (now - lastAltPressTime < DOUBLE_PRESS_THRESHOLD) {
      // Double press detected
      console.log('Double Alt press detected!');
      event.preventDefault(); // Prevent default Alt behavior if needed

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

      lastAltPressTime = 0; // Reset time after double press
    } else {
      // First press or press after long delay
      lastAltPressTime = now;
    }
  } else {
    // Reset time if another key is pressed
    lastAltPressTime = 0;
  }
});

// Optional: Reset time if the window loses focus
window.addEventListener('blur', () => {
  lastAltPressTime = 0;
});
