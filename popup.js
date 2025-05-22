document.addEventListener('DOMContentLoaded', () => {
    const loadingDiv = document.getElementById('loading');
    const responseContainer = document.getElementById('response-container');
    const responseContent = document.getElementById('response-content');
    const errorContainer = document.getElementById('error-container');
    const copyButton = document.getElementById('copy-button');

    // Function to display data
    function displayData(data) {
        // Hide all sections first
        loadingDiv.style.display = 'none';
        responseContainer.style.display = 'none';
        errorContainer.style.display = 'none';
        copyButton.style.display = 'none';

        if (data && data.loading) {
            // Show loading state
            loadingDiv.style.display = 'block';
        } else if (data && data.error) {
            // Show error state
            errorContainer.textContent = `Error: ${data.message || 'An unknown error occurred.'}`;
            errorContainer.style.display = 'block';
        } else if (data && data.text) {
            // Show successful response
            responseContent.textContent = data.text;
            responseContainer.style.display = 'block';
            copyButton.style.display = 'block';
        } else {
            // No data yet or empty response
            errorContainer.textContent = 'No response received yet. Trigger the extension (double-press \'g\') on a page.';
            errorContainer.style.display = 'block';
        }
    }

    // Retrieve the last response from storage
    chrome.storage.local.get(['latestGeminiResponse'], (result) => {
        console.log('Popup received from storage:', result.latestGeminiResponse);
        displayData(result.latestGeminiResponse);
    });

    // Add listener for copy button
    copyButton.addEventListener('click', () => {
        const textToCopy = responseContent.textContent;
        const originalText = copyButton.textContent;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback for copy
            copyButton.textContent = 'Copied!';
            copyButton.disabled = true;
            
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Popup: Failed to copy text: ', err);
            // Show error feedback
            copyButton.textContent = 'Copy Failed';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 1500);
        });
    });

    // Listen for future changes in storage while popup is open
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.latestGeminiResponse) {
            console.log('Popup detected storage change:', changes.latestGeminiResponse.newValue);
            displayData(changes.latestGeminiResponse.newValue);
        }
    });
});
