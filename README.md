# Gemini Helper Chrome Extension

This Chrome extension allows you to quickly send selected text or the entire page source to Google's Gemini AI models by double-pressing the Alt key.

-   **Double Alt on selected text:** Sends the selected text to the `gemini-1.5-flash-latest` model.
-   **Double Alt with no selection:** Sends the full page HTML source to the `gemini-1.5-pro-latest` model with a prompt asking for analysis.

The response from Gemini is currently displayed as a system notification.

## Setup

1.  **Get a Gemini API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Sign in with your Google account.
    *   Click "Create API key" and copy the generated key.

2.  **Load the Extension in Chrome:**
    *   Download or clone this repository's code.
    *   Open Chrome and navigate to `chrome://extensions/`.
    *   Enable "Developer mode" (usually a toggle in the top-right corner).
    *   Click "Load unpacked".
    *   Select the folder containing the extension's files (`manifest.json`, `background.js`, etc.).

3.  **Configure the API Key:**
    *   Once loaded, find the "Gemini Helper" extension card on the `chrome://extensions/` page.
    *   Click the "Details" button.
    *   Click "Extension options".
    *   Alternatively, right-click the extension icon (if visible in your toolbar) and select "Options".
    *   Paste your Gemini API key into the input field and click "Save".

4.  **(Optional) Add Icons:**
    *   Create an `icons` folder in the extension directory.
    *   Add icons named `icon16.png`, `icon48.png`, and `icon128.png`.
    *   Update `manifest.json` to include the icons:
        ```json
        "icons": {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        },
        ```

## Usage

1.  Navigate to any webpage.
2.  **To analyze selected text:** Highlight the text you want to process, then quickly press the `Alt` key twice.
3.  **To analyze the whole page:** Ensure no text is selected, then quickly press the `Alt` key twice.
4.  A system notification should appear shortly with the response from Gemini. You can also check the extension's Service Worker console for detailed logs (find the extension on `chrome://extensions/` and click the "Service Worker" link).

## Development Notes

*   The API response is currently shown via `chrome.notifications`. This could be enhanced to display in a popup or inject into the page.
*   Error handling is basic. More robust error reporting could be added.
*   Consider adding `safetySettings` and `generationConfig` to the API calls in `background.js` for more control over the output.
