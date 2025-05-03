document.addEventListener('DOMContentLoaded', () => {
    const loadingDiv = document.getElementById('loading');
    const responseContainer = document.getElementById('response-container');
    const responseContent = document.getElementById('response-content');
    const errorContainer = document.getElementById('error-container');
    const copyButton = document.getElementById('copy-button');

    // Function to display data
    function displayData(data) {
        loadingDiv.style.display = 'none'; // Hide loading indicator

        if (data && data.error) {
            errorContainer.textContent = `Error: ${data.message || 'An unknown error occurred.'}`;
            errorContainer.style.display = 'block';
            responseContainer.style.display = 'none';
            copyButton.style.display = 'none';
        } else if (data && data.text) {
            responseContent.textContent = data.text;
            responseContainer.style.display = 'block';
            errorContainer.style.display = 'none';
            copyButton.style.display = 'block'; // Show copy button
        } else {
            // No data yet or empty response
            errorContainer.textContent = 'No response received yet. Trigger the extension (double-press \'g\') on a page.';
            errorContainer.style.display = 'block';
            responseContainer.style.display = 'none';
            copyButton.style.display = 'none';
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
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Optional: Visual feedback for copy
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 1500);
        }).catch(err => {
            console.error('Popup: Failed to copy text: ', err);
            // Optional: Show error to user
        });
    });

    // Optional: Listen for future changes in storage while popup is open
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.latestGeminiResponse) {
            console.log('Popup detected storage change:', changes.latestGeminiResponse.newValue);
            displayData(changes.latestGeminiResponse.newValue);
        }
    });
});
