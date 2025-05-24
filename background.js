chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in background:', message);

    if (message.type === 'processText') {
        const text = message.text;
        console.log('Processing selected text:', text);
        // Get user's preferred text model
        processWithUserSettings(text, 'textModel');
    } else if (message.type === 'processPage') {
        const source = message.source;
        console.log('Processing page source...');
        // Construct a prompt to ask Gemini to understand the page
        const prompt = `Analyze the following HTML source code and provide a brief summary or context:\n\n${source}`;
        // Get user's preferred page model
        processWithUserSettings(prompt, 'pageModel');
    }

    // Return true to indicate you wish to send a response asynchronously (important for fetch)
    // (if you were to send a response back to the content script)
    // return true;
});

// Process with user settings
async function processWithUserSettings(promptText, modelType) {
    try {
        // Get user settings
        const settings = await chrome.storage.sync.get({
            textModel: 'gemini-2.5-flash-preview-05-20',
            pageModel: 'gemini-2.5-pro-preview-05-06'
        });
        
        const model = settings[modelType];
        console.log(`Using user-selected model: ${model}`);
        
        callGeminiAPI(promptText, model);
    } catch (error) {
        console.error('Error getting user settings:', error);
        // Fallback to default models
        const defaultModel = modelType === 'textModel' 
            ? 'gemini-2.5-flash-preview-05-20' 
            : 'gemini-2.5-pro-preview-05-06';
        callGeminiAPI(promptText, defaultModel);
    }
}

// Function to call the Gemini API with simulated streaming
async function callGeminiAPI(promptText, model) {
    console.log(`Calling Gemini API with model: ${model} (with simulated streaming)`);

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

            // Store error in local storage for floating widget
            await chrome.storage.local.set({
                latestGeminiResponse: {
                    error: true,
                    message: errorMsg
                }
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

            // Store error in local storage for floating widget
            await chrome.storage.local.set({
                latestGeminiResponse: {
                    error: true,
                    message: errorMsg
                }
            });
            return;
        }

        const result = await response.json();
        console.log('Gemini API Success:', result);

        // Extract the text response
        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            console.log('Generated Text:', generatedText);

            // Simulate streaming for better UX
            await simulateStreamingResponse(generatedText);
        } else {
            const errorMsg = 'No text generated or unexpected response structure.';
            console.warn(errorMsg);

            // Store error in local storage for floating widget
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

        // Store error in local storage for floating widget
        await chrome.storage.local.set({
            latestGeminiResponse: {
                error: true,
                message: errorMsg
            }
        });
    }
}

// Simulate streaming response for better UX
async function simulateStreamingResponse(fullText) {
    const words = fullText.split(' ');
    let currentText = '';
    
    // Stream words gradually
    for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        
        // Update storage with partial response
        await chrome.storage.local.set({
            latestGeminiResponse: {
                text: currentText,
                streaming: i < words.length - 1,
                timestamp: Date.now()
            }
        });
        
        // Add delay between words for streaming effect
        if (i < words.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
    }
    
    // Final update to mark streaming complete
    await chrome.storage.local.set({
        latestGeminiResponse: {
            text: fullText,
            streaming: false,
            timestamp: Date.now()
        }
    });
}
