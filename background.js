chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.type === 'processText') {
    const text = message.text;
    console.log('Processing selected text:', text);
    // TODO: Implement Gemini API call with the selected text
    // Example: callGeminiAPI(text);
    // Be mindful of API keys and asynchronous operations.
  } else if (message.type === 'processPage') {
    const source = message.source;
    console.log('Processing page source (first 100 chars):', source.substring(0, 100) + '...');
    // TODO: Implement Gemini API call with the page source
    // Example: callGeminiAPI(source);
    // Be mindful of API keys, potential data size limits, and asynchronous operations.
  }

  // Return true to indicate you wish to send a response asynchronously
  // (if you were to send a response back to the content script)
  // return true;
});

// Placeholder for the actual API call function
// async function callGeminiAPI(data) {
//   console.log("Calling Gemini API with:", data);
//   // Replace with actual fetch call to Gemini API endpoint
//   // Remember to handle API key securely (e.g., from chrome.storage)
//   // const apiKey = await chrome.storage.sync.get('geminiApiKey');
//   // ... fetch logic ...
// }
