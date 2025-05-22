chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.type === 'processText') {
    const text = message.text;
    console.log('Processing selected text:', text);
    // TODO: Implement Gemini API call with the selected text
    // Use flash model for selected text
    callGeminiAPI(text, 'gemini-2.5-flash');
  } else if (message.type === 'processPage') {
    const source = message.source;
    console.log('Processing page source...');
    // Use pro model for full page source
    // Construct a prompt to ask Gemini to understand the page
    const prompt = `Analyze the following HTML source code and provide a brief summary or context:\n\n${source}`;
    callGeminiAPI(prompt, 'gemini-2.5-pro');
  }

  // Return true to indicate you wish to send a response asynchronously (important for fetch)
  // (if you were to send a response back to the content script)
  // return true;
});

// Function to call the Gemini API

// Function to call the Gemini API
async function callGeminiAPI(promptText, model) {
  console.log(`Calling Gemini API with model: ${model}`);
  
  // Store loading state
  await chrome.storage.local.set({
    latestGeminiResponse: { loading: true }
  });
  
  try {
    // 1. Get API Key from storage
    const items = await chrome.storage.sync.get('geminiApiKey');
    const apiKey = items.geminiApiKey;

    if (!apiKey) {
      const errorMsg = 'Gemini API Key not found. Please set it in the extension options.';
      console.error(errorMsg);
      
      // Store error in local storage for popup
      await chrome.storage.local.set({
        latestGeminiResponse: { 
          error: true, 
          message: errorMsg 
        }
      });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Gemini Helper Error',
        message: errorMsg
      });
      return;
    }

    // 2. Prepare API request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      "contents": [{
        "parts": [{ "text": promptText }]
      }]
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
      const errorMsg = `API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`;
      console.error('Gemini API Error:', response.status, errorData);
      
      // Store error in local storage for popup
      await chrome.storage.local.set({
        latestGeminiResponse: { 
          error: true, 
          message: errorMsg 
        }
      });
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Gemini Helper Error',
        message: errorMsg
      });
      return;
    }

    const result = await response.json();
    console.log('Gemini API Success:', result);

    // Extract the text response
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log('Generated Text:', generatedText);
      
      // Store successful response in local storage for popup
      await chrome.storage.local.set({
        latestGeminiResponse: { 
          text: generatedText,
          timestamp: Date.now()
        }
      });
      
      // Show notification with preview
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Gemini Response Ready',
        message: generatedText.substring(0, 200) + (generatedText.length > 200 ? '...' : '')
      });
    } else {
      const errorMsg = 'No text generated or unexpected response structure.';
      console.warn(errorMsg);
      
      // Store error in local storage for popup
      await chrome.storage.local.set({
        latestGeminiResponse: { 
          error: true, 
          message: errorMsg 
        }
      });
    }

  } catch (error) {
    const errorMsg = `Failed to call API: ${error.message}`;
    console.error('Error calling Gemini API:', error);
    
    // Store error in local storage for popup
    await chrome.storage.local.set({
      latestGeminiResponse: { 
        error: true, 
        message: errorMsg 
      }
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Gemini Helper Error',
      message: errorMsg
    });
  }
}
