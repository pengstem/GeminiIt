# Gemini Helper Chrome Extension

This Chrome extension allows you to quickly send selected text or the entire page source to Google's Gemini AI models by double-pressing the Alt key.

-   **Double Alt on selected text:** Sends the selected text to the `gemini-1.5-flash-latest` model.
-   **Double Alt with no selection:** Sends the full page HTML source to the `gemini-1.5-pro-latest` model with a prompt asking for analysis.

The response from Gemini is **copied to your clipboard** and also displayed as a system notification (showing the first part of the response).

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

4.  **Create Icons Folder and Files:**
    *   In the extension's root directory (where `manifest.json` is), create a folder named `icons`.
    *   Inside the `icons` folder, place three icon files (PNG format recommended):
        *   `icon16.png` (16x16 pixels)
        *   `icon48.png` (48x48 pixels)
        *   `icon128.png` (128x128 pixels)
    *   These files are required and referenced in `manifest.json`. You can create simple placeholders if you don't have final icons yet.

## Usage

1.  Navigate to any webpage.
2.  **To analyze selected text:** Highlight the text you want to process, then quickly press the `Alt` key twice.
3.  **To analyze the whole page:** Ensure no text is selected, then quickly press the `Alt` key twice.
4.  A system notification should appear shortly indicating success or failure.
5.  If successful, the full response text from Gemini will be **copied to your clipboard**.
6.  You can also check the extension's Service Worker console for detailed logs (find the extension on `chrome://extensions/` and click the "Service Worker" link).

## Development Notes

*   The API response is copied to the clipboard and shown via `chrome.notifications`. Display could be further enhanced (e.g., popup, page injection).
*   User feedback during processing (before the API responds) could be added.
*   Error handling is improved slightly but could be more robust.
*   Consider adding `safetySettings` and `generationConfig` to the API calls in `background.js` for more control.
*   Consider adding options for model selection, prompt customization, etc.
*   **Limitation:** Sending very large page sources might exceed API limits or cause performance issues. Future improvements could involve content truncation or summarization before sending.
