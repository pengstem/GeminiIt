
// Default settings
const DEFAULT_SETTINGS = {
    geminiApiKey: '',
    textModel: 'gemini-2.5-flash-preview-05-20',
    pageModel: 'gemini-2.5-pro-preview-05-06',
    widgetPosition: 'top-right',
    autoExpand: true
};

// DOM elements
let elements = {};

// Initialize the options page
function initializeOptionsPage() {
    // Cache DOM elements
    elements = {
        apiKey: document.getElementById('apiKey'),
        togglePassword: document.getElementById('togglePassword'),
        textModel: document.getElementById('textModel'),
        pageModel: document.getElementById('pageModel'),
        widgetPosition: document.getElementById('widgetPosition'),
        autoExpand: document.getElementById('autoExpand'),
        testConnection: document.getElementById('testConnection'),
        saveSettings: document.getElementById('saveSettings'),
        status: document.getElementById('status'),
        testSpinner: document.getElementById('testSpinner'),
        saveSpinner: document.getElementById('saveSpinner')
    };

    // Set up event listeners
    setupEventListeners();
    
    // Load saved settings
    loadSettings();
}

// Set up all event listeners
function setupEventListeners() {
    // Password toggle
    elements.togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Save settings button
    elements.saveSettings.addEventListener('click', saveSettings);
    
    // Test connection button
    elements.testConnection.addEventListener('click', testApiConnection);
    
    // Auto-save on input changes (debounced)
    const inputs = [elements.textModel, elements.pageModel, elements.widgetPosition, elements.autoExpand];
    inputs.forEach(input => {
        input.addEventListener('change', debounce(saveSettings, 500));
    });
    
    // API key validation on input
    elements.apiKey.addEventListener('input', debounce(validateApiKey, 800));
}

// Toggle password visibility
function togglePasswordVisibility() {
    const isPassword = elements.apiKey.type === 'password';
    elements.apiKey.type = isPassword ? 'text' : 'password';
    elements.togglePassword.textContent = isPassword ? '🙈' : '👁️';
}

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        elements.apiKey.value = items.geminiApiKey;
        elements.textModel.value = items.textModel;
        elements.pageModel.value = items.pageModel;
        elements.widgetPosition.value = items.widgetPosition;
        elements.autoExpand.checked = items.autoExpand;
        
        // Enable/disable test button based on API key
        elements.testConnection.disabled = !items.geminiApiKey;
    });
}

// Save settings to storage
async function saveSettings() {
    const settings = {
        geminiApiKey: elements.apiKey.value.trim(),
        textModel: elements.textModel.value,
        pageModel: elements.pageModel.value,
        widgetPosition: elements.widgetPosition.value,
        autoExpand: elements.autoExpand.checked
    };

    // Show saving spinner
    showSpinner(elements.saveSpinner, true);
    elements.saveSettings.disabled = true;

    try {
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set(settings, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });

        showStatus('Settings saved successfully! 🎉', 'success');
        
        // Enable/disable test button based on API key
        elements.testConnection.disabled = !settings.geminiApiKey;

    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings. Please try again.', 'error');
    } finally {
        showSpinner(elements.saveSpinner, false);
        elements.saveSettings.disabled = false;
    }
}

// Test API connection
async function testApiConnection() {
    const apiKey = elements.apiKey.value.trim();
    
    if (!apiKey) {
        showStatus('Please enter an API key first.', 'error');
        return;
    }

    // Show testing spinner
    showSpinner(elements.testSpinner, true);
    elements.testConnection.disabled = true;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (response.ok) {
            const data = await response.json();
            const modelCount = data.models ? data.models.length : 0;
            showStatus(`✅ API key is valid! Found ${modelCount} available models.`, 'success');
        } else if (response.status === 400) {
            showStatus('❌ Invalid API key format. Please check your key.', 'error');
        } else if (response.status === 403) {
            showStatus('❌ API key is valid but access is forbidden. Check your permissions.', 'error');
        } else {
            showStatus(`❌ API test failed with status ${response.status}. Please try again.`, 'error');
        }
    } catch (error) {
        console.error('API test error:', error);
        showStatus('❌ Connection failed. Check your internet connection and try again.', 'error');
    } finally {
        showSpinner(elements.testSpinner, false);
        elements.testConnection.disabled = false;
    }
}

// Validate API key format
function validateApiKey() {
    const apiKey = elements.apiKey.value.trim();
    
    if (!apiKey) {
        elements.testConnection.disabled = true;
        return;
    }
    
    // Basic validation - Gemini API keys typically start with specific patterns
    const isValidFormat = /^AI[a-zA-Z0-9_-]{35,}$/.test(apiKey);
    
    if (!isValidFormat && apiKey.length > 5) {
        showStatus('⚠️ API key format looks unusual. Make sure you copied it correctly.', 'info');
    } else if (elements.status.textContent.includes('format looks unusual')) {
        hideStatus();
    }
    
    elements.testConnection.disabled = !apiKey;
}

// Show status message
function showStatus(message, type = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
    elements.status.style.display = 'block';
    
    // Auto-hide success and info messages after 4 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(hideStatus, 4000);
    }
}

// Hide status message
function hideStatus() {
    elements.status.style.display = 'none';
    elements.status.textContent = '';
    elements.status.className = 'status';
}

// Show/hide spinner
function showSpinner(spinnerElement, show) {
    spinnerElement.style.display = show ? 'inline-block' : 'none';
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptionsPage);
