chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.type === 'processText') {
    const text = message.text;
    console.log('Processing selected text:', text);
    // Use flash model for selected text
    // Pass the text directly, system prompt is handled in callGeminiAPI
    callGeminiAPI(text, 'gemini-1.5-flash-latest');
  } else if (message.type === 'processPage') {
    const source = message.source;
    console.log('Processing page source...');
    // Use pro model for full page source
    // Pass the source directly, system prompt is handled in callGeminiAPI
    callGeminiAPI(source, 'gemini-1.5-pro-latest');
  }

  // Return true to indicate you wish to send a response asynchronously (important for fetch)
  // (if you were to send a response back to the content script)
  // return true;
});

// Function to call the Gemini API
async function callGeminiAPI(userContent, model) { // Renamed parameter
  console.log(`Calling Gemini API with model: ${model}`);
  try {
    // 1. Get API Key from storage
    const items = await chrome.storage.sync.get('geminiApiKey');
    const apiKey = items.geminiApiKey;

    if (!apiKey) {
      console.error('Gemini API Key not found. Please set it in the extension options.');
      // --- Store error state for popup ---
      const errorData = { text: null, error: true, message: 'API Key not set. Please configure it via Extension Options.', timestamp: Date.now() };
      await chrome.storage.local.set({ latestGeminiResponse: errorData });
      // --- End store error ---
      return; // Stop if no key
    }

    // 2. Prepare API request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      // Change system instruction to ask for explanation generally
      "systemInstruction": {
          "parts": [{"text": "Please explain the following content."}]
      },
      "contents": [{
        // Use the userContent parameter here
        "parts": [{ "text": userContent }]
      }]
      // Add safetySettings or generationConfig if needed
      // "safetySettings": [ ... ],
      // "generationConfig": { ... }
    };

    // 3. Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 4. Handle the response
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', response.status, errorData);
      throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Gemini API Success:', result);

    // Extract the text response (structure might vary slightly)
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log('Generated Text:', generatedText);

      // --- Store result for popup ---
      const resultData = { text: generatedText, error: false, timestamp: Date.now() };
      await chrome.storage.local.set({ latestGeminiResponse: resultData });
      console.log('Stored response in local storage.');
      // --- End store result ---

    } else {
      console.warn('No text generated or unexpected response structure.');
      // --- Store error/empty state for popup ---
      const errorData = { text: null, error: true, message: 'Received an empty or unexpected response from the API.', timestamp: Date.now() };
      await chrome.storage.local.set({ latestGeminiResponse: errorData });
      // --- End store error ---
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // --- Store error state for popup ---
    const errorData = {
        text: null,
        error: true,
        message: (error.message.includes("API key not valid"))
                 ? 'Invalid API Key. Please check Extension Options.'
                 : `Failed to call API: ${error.message}`,
        timestamp: Date.now()
    };
    await chrome.storage.local.set({ latestGeminiResponse: errorData });
    // --- End store error ---
  }
}

// Optional: Add default icon paths if you add icons
// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Gemini Helper installed.');
//   // You might set default options here if needed
// });
