chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.type === 'processText') {
    const text = message.text;
    console.log('Processing selected text:', text);
    // TODO: Implement Gemini API call with the selected text
    // Use flash model for selected text
    callGeminiAPI(text, 'gemini-1.5-flash-latest');
  } else if (message.type === 'processPage') {
    const source = message.source;
    console.log('Processing page source...');
    // Use pro model for full page source
    // Construct a prompt to ask Gemini to understand the page
    const prompt = `Analyze the following HTML source code and provide a brief summary or context:\n\n${source}`;
    callGeminiAPI(prompt, 'gemini-1.5-pro-latest');
  }

  // Return true to indicate you wish to send a response asynchronously (important for fetch)
  // (if you were to send a response back to the content script)
  // return true;
});

// Function to call the Gemini API
async function callGeminiAPI(promptText, model) {
  console.log(`Calling Gemini API with model: ${model}`);
  try {
    // 1. Get API Key from storage
    const items = await chrome.storage.sync.get('geminiApiKey');
    const apiKey = items.geminiApiKey;

    if (!apiKey) {
      console.error('Gemini API Key not found. Please set it in the extension options.');
      // Notify the user to set the key
      chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png', // Use defined icon
          title: 'Gemini Helper Error',
          message: 'API Key not set. Please configure it via Extension Options.'
      });
      return; // Stop if no key
    }

    // 2. Prepare API request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      "contents": [{
        "parts": [{ "text": promptText }]
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

      // --- Copy to Clipboard ---
      try {
        await navigator.clipboard.writeText(generatedText);
        console.log('Copied to clipboard.');
        // Notify user of success + copy
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Use defined icon
            title: 'Gemini Response Copied',
            message: generatedText.substring(0, 150) + (generatedText.length > 150 ? '...' : '') // Show snippet
        });
      } catch (copyError) {
        console.error('Failed to copy to clipboard:', copyError);
        // Notify user of success but failed copy
         chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Use defined icon
            title: 'Gemini Response Received',
            message: 'Received response, but failed to copy to clipboard. Check console.'
        });
      }
      // --- End Copy to Clipboard ---

    } else {
      console.warn('No text generated or unexpected response structure.');
       chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Use defined icon
            title: 'Gemini Response',
            message: 'Received an empty or unexpected response from the API.'
        });
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
     // Notify user of the error
     chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png', // Use defined icon
          title: 'Gemini API Error',
          // Provide a slightly more user-friendly message for common errors
          message: (error.message.includes("API key not valid"))
                   ? 'Invalid API Key. Please check Extension Options.'
                   : `Failed to call API: ${error.message}`
      });
  }
}

// Optional: Add default icon paths if you add icons
// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Gemini Helper installed.');
//   // You might set default options here if needed
// });
