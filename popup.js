// popup.js - Handles popup interface interactions

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
    // Check API key status
    await checkApiStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check widget visibility
    await checkWidgetVisibility();
}

// Check API key configuration status
async function checkApiStatus() {
    try {
        const result = await chrome.storage.sync.get('geminiApiKey');
        const apiStatusEl = document.getElementById('apiStatus');
        
        if (result.geminiApiKey && result.geminiApiKey.trim()) {
            apiStatusEl.textContent = '🟢 API Key configured';
            apiStatusEl.className = 'api-status connected';
        } else {
            apiStatusEl.textContent = '🔴 API Key not configured';
            apiStatusEl.className = 'api-status disconnected';
        }
    } catch (error) {
        console.error('Error checking API status:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Analyze current page button
    document.getElementById('analyzePageBtn').addEventListener('click', analyzeCurrentPage);
    
    // Hide/Show widget buttons
    document.getElementById('hideWidgetBtn').addEventListener('click', hideWidget);
    document.getElementById('showWidgetBtn').addEventListener('click', showWidget);
    
    // Settings link
    document.getElementById('settingsLink').addEventListener('click', openSettings);
}

// Analyze current page
async function analyzeCurrentPage() {
    try {
        showStatus('Analyzing current page...', 'info');
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Inject content script if needed and trigger page analysis
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: triggerPageAnalysis
        });
        
        showStatus('Analysis started! Check the floating widget.', 'success');
        
        // Close popup after a delay
        setTimeout(() => {
            window.close();
        }, 1500);
        
    } catch (error) {
        console.error('Error analyzing page:', error);
        showStatus('Failed to analyze page. Please try again.', 'error');
    }
}

// Function to inject into page to trigger analysis
function triggerPageAnalysis() {
    // This function runs in the context of the webpage
    const pageSource = document.documentElement.outerHTML;
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
            type: 'processPage', 
            source: pageSource 
        });
    }
}

// Hide widget
async function hideWidget() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // This runs in the content script context
                if (window.hideFloatingWidget) {
                    window.hideFloatingWidget();
                }
            }
        });
        
        showStatus('Widget hidden', 'success');
        updateWidgetButtons(false);
        
    } catch (error) {
        console.error('Error hiding widget:', error);
        showStatus('Failed to hide widget', 'error');
    }
}

// Show widget
async function showWidget() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // This runs in the content script context
                if (window.showFloatingWidget) {
                    window.showFloatingWidget();
                }
            }
        });
        
        showStatus('Widget shown', 'success');
        updateWidgetButtons(true);
        
    } catch (error) {
        console.error('Error showing widget:', error);
        showStatus('Failed to show widget', 'error');
    }
}

// Check widget visibility
async function checkWidgetVisibility() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Check if widget exists and is visible
                const widget = document.getElementById('gemini-floating-widget');
                return widget && widget.style.display !== 'none';
            }
        });
        
        const isVisible = result[0]?.result || false;
        updateWidgetButtons(isVisible);
        
    } catch (error) {
        console.error('Error checking widget visibility:', error);
        // Default to assuming widget is not visible
        updateWidgetButtons(false);
    }
}

// Update widget control buttons
function updateWidgetButtons(isVisible) {
    const hideBtn = document.getElementById('hideWidgetBtn');
    const showBtn = document.getElementById('showWidgetBtn');
    
    if (isVisible) {
        hideBtn.style.display = 'block';
        showBtn.style.display = 'none';
    } else {
        hideBtn.style.display = 'none';
        showBtn.style.display = 'block';
    }
}

// Open settings page
function openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
}

// Show status message
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide status after 3 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Listen for storage changes to update API status
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.geminiApiKey) {
        checkApiStatus();
    }
});
