console.log('Gemini Helper content script loaded.');

let lastGPressTime = 0;
const DOUBLE_PRESS_THRESHOLD = 300; // Milliseconds

// Floating widget state
let floatingWidget = null;
let isWidgetVisible = false;
let currentResponse = null;
let userSettings = {
    widgetPosition: 'top-right',
    autoExpand: true
};

// Tab-specific widget management
const tabId = Math.random().toString(36).substring(2, 15);

document.addEventListener('keydown', (event) => {
    // console.log(`Key pressed: ${event.key}`); // Keep commented unless debugging keys

    if (event.key === 'g') {
        const now = Date.now();

        if (now - lastGPressTime < DOUBLE_PRESS_THRESHOLD) {
            console.log('Double "g" press detected!');
            event.preventDefault(); // Prevent typing 'g'

            const selectedText = window.getSelection().toString().trim();            // --- Check chrome.runtime and attempt to send message ---
            // Check *immediately* before trying to use sendMessage
            // Revert back to standard chrome object check
            // Check standard chrome object in isolated world
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                console.log('Check PASSED: chrome.runtime.sendMessage is available.');
                
                // Show floating widget when processing starts
                showFloatingWidget();
                showLoading();
                
                try {
                    if (selectedText) {
                        console.log('Selected Text:', selectedText);
                        console.log('Sending processText message...');
                        // Use standard chrome object
                        chrome.runtime.sendMessage({ type: 'processText', text: selectedText });
                    } else {
                        console.log('No text selected, sending page source.');
                        const pageSource = document.documentElement.outerHTML;
                        console.log('Sending processPage message...');
                        // Use standard chrome object
                        chrome.runtime.sendMessage({ type: 'processPage', source: pageSource });
                    }
                    console.log('Message sending attempted via chrome.runtime.sendMessage.');
                } catch (error) {
                    // Catch errors specifically during the sendMessage call
                    console.error('Gemini Helper Runtime Error: Failed during sendMessage call.', error);
                    console.error('State of chrome.runtime object at time of error:', chrome?.runtime);
                    showError('Failed to send message to background script');
                }
            } else {
                // Log detailed info if the check fails
                console.error('Check FAILED: chrome.runtime.sendMessage is NOT available just before sending.');
                // Log details about chrome object
                console.error(`Details: typeof chrome = ${typeof chrome}, chrome.runtime = ${chrome?.runtime}, typeof sendMessage = ${typeof chrome?.runtime?.sendMessage}`);
                console.error('Inspecting chrome object:', chrome); // Log the object itself
                showFloatingWidget();
                showError('Chrome runtime not available');
            }
            // --- End check and attempt ---

            lastGPressTime = 0; // Reset time after successful double press
        } else {
            // First press or press after long delay
            lastGPressTime = now;
        }
    } else {
        // Reset time if another key is pressed
        lastGPressTime = 0;
    }
});

window.addEventListener('blur', () => {
    lastGPressTime = 0;
});

// Load user settings
function loadUserSettings() {
    chrome.storage.sync.get(['widgetPosition', 'autoExpand'], (result) => {
        userSettings.widgetPosition = result.widgetPosition || 'top-right';
        userSettings.autoExpand =
            result.autoExpand !== undefined ? result.autoExpand : true;
        
        // Update widget position if it already exists
        if (floatingWidget) {
            applyWidgetPosition();
        }
    });
}

// Apply widget positioning based on user settings
function applyWidgetPosition() {
    if (!floatingWidget) return;
    
    // Reset all position classes
    floatingWidget.classList.remove('position-top-left', 'position-top-right', 'position-bottom-left', 'position-bottom-right');
    
    // Apply the selected position
    floatingWidget.classList.add(`position-${userSettings.widgetPosition}`);
}

// Create floating widget
function createFloatingWidget() {
    if (floatingWidget) return floatingWidget;

    // Load user settings first
    loadUserSettings();

    // Main container
    floatingWidget = document.createElement('div');
    floatingWidget.id = 'gemini-floating-widget';
    floatingWidget.innerHTML = `
        <div class="gemini-widget-icon" id="gemini-widget-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>        <div class="gemini-widget-panel" id="gemini-widget-panel">
            <div class="gemini-widget-header">
                <span>Gemini Response</span>
                <div class="header-controls">
                    <button class="gemini-widget-minimize" id="gemini-widget-minimize" title="Minimize">−</button>
                    <button class="gemini-widget-close" id="gemini-widget-close" title="Close widget completely">×</button>
                </div>
            </div>
            <div class="gemini-widget-content" id="gemini-widget-content">
                <div class="gemini-loading" id="gemini-loading">
                    <div class="gemini-spinner"></div>
                    <span>Processing...</span>
                </div>
                <div class="gemini-response" id="gemini-response" style="display: none;">
                    <div class="typing-indicator" id="typing-indicator" style="display: none;">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="response-text" id="response-text"></div>
                </div>
                <div class="gemini-error" id="gemini-error" style="display: none;"></div>
            </div>
            <div class="gemini-widget-footer">
                <button class="gemini-copy-btn" id="gemini-copy-btn" style="display: none;">Copy</button>
            </div>
        </div>
    `;

    // Add styles with positioning
    const style = document.createElement('style');
    style.textContent = getWidgetStyles();
    document.head.appendChild(style);

    // Apply positioning based on user settings
    applyWidgetPosition();

    document.body.appendChild(floatingWidget);
    setupWidgetEvents();
    
    return floatingWidget;
}

// Widget styles
function getWidgetStyles() {
    return `
        #gemini-floating-widget {
            position: fixed;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
        }

        /* Widget positioning */
        #gemini-floating-widget.position-top-right {
            top: 20px;
            right: 20px;
        }

        #gemini-floating-widget.position-top-left {
            top: 20px;
            left: 20px;
        }

        #gemini-floating-widget.position-bottom-right {
            bottom: 20px;
            right: 20px;
        }

        #gemini-floating-widget.position-bottom-left {
            bottom: 20px;
            left: 20px;
        }

        .gemini-widget-icon {
            width: 50px;
            height: 50px;
            background: #4285F4;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            position: relative;
        }

        .gemini-widget-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .gemini-widget-icon.loading {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(66, 133, 244, 0); }
            100% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0); }
        }

        .gemini-widget-panel {
            position: absolute;
            width: 400px;
            max-height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            border: 1px solid #e0e0e0;
        }

        /* Panel positioning based on widget position */
        .position-top-right .gemini-widget-panel,
        .position-bottom-right .gemini-widget-panel {
            top: 60px;
            right: 0;
        }

        .position-top-left .gemini-widget-panel,
        .position-bottom-left .gemini-widget-panel {
            top: 60px;
            left: 0;
        }

        .position-bottom-right .gemini-widget-panel,
        .position-bottom-left .gemini-widget-panel {
            top: auto;
            bottom: 60px;
            transform: translateY(10px);
        }

        .position-bottom-right .gemini-widget-panel.visible,
        .position-bottom-left .gemini-widget-panel.visible {
            transform: translateY(0);
        }

        .gemini-widget-panel.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }        .gemini-widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e0e0e0;
            background: #f8f9fa;
            border-radius: 12px 12px 0 0;
        }

        .gemini-widget-header span {
            font-weight: 500;
            color: #202124;
        }

        .header-controls {
            display: flex;
            gap: 8px;
        }

        .gemini-widget-close, .gemini-widget-minimize {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .gemini-widget-close:hover {
            background: #fee;
            color: #d93025;
        }

        .gemini-widget-minimize:hover {
            background: #f0f0f0;
            color: #333;
        }

        .gemini-widget-content {
            padding: 20px;
            max-height: 350px;
            overflow-y: auto;
        }

        .gemini-loading {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #666;
        }

        .gemini-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e0e0e0;
            border-top: 2px solid #4285F4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }        .gemini-response {
            line-height: 1.6;
            color: #333;
            white-space: pre-wrap;
        }

        .response-text {
            line-height: 1.6;
            color: #333;
            white-space: pre-wrap;
        }

        .typing-indicator {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 8px;
        }

        .typing-indicator span {
            height: 8px;
            width: 8px;
            background: #4285F4;
            border-radius: 50%;
            animation: typing 1.5s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            30% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .gemini-error {
            color: #d93025;
            background: #fdecea;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
        }

        .gemini-widget-footer {
            padding: 12px 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: flex-end;
        }

        .gemini-copy-btn {
            background: #4285F4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }

        .gemini-copy-btn:hover {
            background: #357ae8;
        }

        .gemini-copy-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }        /* Responsive design for smaller screens */
        @media (max-width: 480px) {
            .position-top-right, .position-bottom-right {
                right: 10px;
            }
            
            .position-top-left, .position-bottom-left {
                left: 10px;
            }
            
            .position-top-right, .position-top-left {
                top: 10px;
            }
            
            .position-bottom-right, .position-bottom-left {
                bottom: 10px;
            }
            
            .gemini-widget-panel {
                width: calc(100vw - 40px);
            }
            
            .position-top-left .gemini-widget-panel,
            .position-bottom-left .gemini-widget-panel {
                left: -10px;
            }
            
            .position-top-right .gemini-widget-panel,
            .position-bottom-right .gemini-widget-panel {
                right: -10px;
            }
        }
    `;
}

// Setup widget events
function setupWidgetEvents() {
    const icon = document.getElementById('gemini-widget-icon');
    const panel = document.getElementById('gemini-widget-panel');
    const closeBtn = document.getElementById('gemini-widget-close');
    const minimizeBtn = document.getElementById('gemini-widget-minimize');
    const copyBtn = document.getElementById('gemini-copy-btn');

    // Toggle panel on icon click
    icon.addEventListener('click', togglePanel);

    // Close widget completely
    closeBtn.addEventListener('click', () => {
        hideFloatingWidget();
    });

    // Minimize panel (close panel but keep icon)
    minimizeBtn.addEventListener('click', closePanel);

    // Copy response
    copyBtn.addEventListener('click', copyResponse);

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!floatingWidget.contains(e.target)) {
            closePanel();
        }
    });
}

// Show floating widget
function showFloatingWidget() {
    if (!floatingWidget) {
        createFloatingWidget();
    }
    floatingWidget.style.display = 'block';
    isWidgetVisible = true;
}

// Hide floating widget
function hideFloatingWidget() {
    if (floatingWidget) {
        floatingWidget.style.display = 'none';
        closePanel();
    }
    isWidgetVisible = false;
}

// Make functions globally accessible for popup communication
window.showFloatingWidget = showFloatingWidget;
window.hideFloatingWidget = hideFloatingWidget;

// Toggle panel
function togglePanel() {
    const panel = document.getElementById('gemini-widget-panel');
    panel.classList.toggle('visible');
}

// Close panel
function closePanel() {
    const panel = document.getElementById('gemini-widget-panel');
    panel.classList.remove('visible');
}

// Open panel
function openPanel() {
    const panel = document.getElementById('gemini-widget-panel');
    panel.classList.add('visible');
}

// Show loading state
function showLoading() {
    const icon = document.getElementById('gemini-widget-icon');
    const loading = document.getElementById('gemini-loading');
    const response = document.getElementById('gemini-response');
    const error = document.getElementById('gemini-error');
    const copyBtn = document.getElementById('gemini-copy-btn');

    icon.classList.add('loading');
    loading.style.display = 'flex';
    response.style.display = 'none';
    error.style.display = 'none';
    copyBtn.style.display = 'none';
    
    // Auto-open panel if auto-expand is enabled
    if (userSettings.autoExpand) {
        openPanel();
    }
}

// Show response (supports streaming)
function showResponse(text, isStreaming = false) {
    const icon = document.getElementById('gemini-widget-icon');
    const loading = document.getElementById('gemini-loading');
    const response = document.getElementById('gemini-response');
    const responseText = document.getElementById('response-text');
    const typingIndicator = document.getElementById('typing-indicator');
    const error = document.getElementById('gemini-error');
    const copyBtn = document.getElementById('gemini-copy-btn');

    icon.classList.remove('loading');
    loading.style.display = 'none';
    response.style.display = 'block';
    error.style.display = 'none';
    
    // Show/hide typing indicator based on streaming status
    if (isStreaming) {
        typingIndicator.style.display = 'inline-flex';
        copyBtn.style.display = 'none';
    } else {
        typingIndicator.style.display = 'none';
        copyBtn.style.display = 'block';
    }
    
    responseText.textContent = text;
    currentResponse = text;
    
    // Auto-open panel if auto-expand is enabled
    if (userSettings.autoExpand) {
        openPanel();
    }
}

// Show error
function showError(message) {
    const icon = document.getElementById('gemini-widget-icon');
    const loading = document.getElementById('gemini-loading');
    const response = document.getElementById('gemini-response');
    const error = document.getElementById('gemini-error');
    const copyBtn = document.getElementById('gemini-copy-btn');

    icon.classList.remove('loading');
    loading.style.display = 'none';
    response.style.display = 'none';
    error.style.display = 'block';
    error.textContent = message;
    copyBtn.style.display = 'none';
    
    // Auto-open panel if auto-expand is enabled
    if (userSettings.autoExpand) {
        openPanel();
    }
}

// Copy response to clipboard
function copyResponse() {
    if (!currentResponse) return;
    
    const copyBtn = document.getElementById('gemini-copy-btn');
    const originalText = copyBtn.textContent;
    
    navigator.clipboard.writeText(currentResponse).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.disabled = true;
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text:', err);
        copyBtn.textContent = 'Copy Failed';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 1500);
    });
}

// Listen for storage changes to update widget
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        // Update widget when response changes
        if (changes.latestGeminiResponse) {
            const data = changes.latestGeminiResponse.newValue;
            
            if (!isWidgetVisible) {
                showFloatingWidget();
            }
            
            if (data && data.loading) {
                showLoading();
            } else if (data && data.error) {
                showError(`Error: ${data.message || 'An unknown error occurred.'}`);
            } else if (data && data.text) {
                // Support streaming display
                const isStreaming = data.streaming === true;
                showResponse(data.text, isStreaming);
            }
        }
        
    }

    if (namespace === 'sync') {
        // Update widget when settings change
        if (changes.widgetPosition || changes.autoExpand) {
            if (changes.widgetPosition) {
                userSettings.widgetPosition = changes.widgetPosition.newValue;
                applyWidgetPosition();
            }
            if (changes.autoExpand) {
                userSettings.autoExpand = changes.autoExpand.newValue;
            }
        }
    }
});

// Initialize user settings on script load
loadUserSettings();
