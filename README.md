# Gemini Helper Chrome Extension

This Chrome extension allows you to quickly send selected text or the entire page source to Google's Gemini AI models by double-pressing the 'g' key. The model is asked to **explain** the provided content.

-   **Double 'g' on selected text:** Sends the selected text to the `gemini-2.5-flash-preview-05-20` model, requesting an explanation.
-   **Double 'g' with no selection:** Sends the full page HTML source to the `gemini-2.5-pro-preview-05-06` model, requesting an explanation.

The response from Gemini is displayed in a **beautiful floating widget** that appears automatically when you trigger the extension.

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
2.  **To analyze selected text:** Highlight the text you want to process, then quickly press the `g` key twice.
3.  **To analyze the whole page:** Ensure no text is selected, then quickly press the `g` key twice.
4.  A floating widget will automatically appear in the top-right corner of the page showing the processing status and Gemini's response.
5.  You can click on the floating icon to toggle the response panel, copy the response, or close it.
6.  You can also check the extension's Service Worker console for detailed logs (find the extension on `chrome://extensions/` and click the "Service Worker" link).

## Development Notes

*   The API response is now displayed in a beautiful floating widget that appears automatically when you trigger the extension.
*   The floating widget includes a loading animation, error handling, and a copy-to-clipboard feature.
*   Error handling is robust with user-friendly error messages displayed in the widget.
*   Consider adding `safetySettings` and `generationConfig` to the API calls in `background.js` for more control.
*   Consider adding options for model selection, prompt customization, etc.
*   **Limitation:** Sending very large page sources might exceed API limits or cause performance issues. Future improvements could involve content truncation or summarization before sending.
