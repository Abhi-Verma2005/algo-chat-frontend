// Handle side panel setup
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Store authentication state
let authToken = null;
let currentUser = null;
const BACKEND_API_BASE = 'http://localhost:3001';

// Unified message handler (auth + submissions)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    chrome.action.openPopup(); // Opens the popup programmatically
  }
  
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open(); // Opens the side panel
  }
  
  if (message.action === 'toggleSidePanel') {
    chrome.sidePanel.getOptions({}).then((options) => {
      if (options.enabled) {
        chrome.sidePanel.close()
      } else {
        chrome.sidePanel.open()
      }
    })
  }

  // Handle authentication
  if (message.action === 'login') {
    handleLogin(message.credentials, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.action === 'logout') {
    handleLogout(sendResponse);
    return true;
  }

  if (message.action === 'getAuthState') {
    sendResponse({ 
      isAuthenticated: !!authToken, 
      user: currentUser 
    });
  }

  if (message.action === 'verifyToken') {
    verifyToken(sendResponse);
    return true;
  }

  // Submission relay from content script
  if (message.action === 'send_to_backend') {
    handleSubmitToBackend(message, sendResponse);
    return true;
  }
});

// Handle login
async function handleLogin(credentials, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.data.token;
      currentUser = data.data.user;
      
      // Store token in chrome storage
      chrome.storage.local.set({ 
        authToken: authToken,
        user: currentUser 
      });

      sendResponse({ 
        success: true, 
        message: 'Login successful',
        user: currentUser 
      });
    } else {
      sendResponse({ 
        success: false, 
        message: data.message || 'Login failed' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    sendResponse({ 
      success: false, 
      message: 'Network error during login' 
    });
  }
}

// Handle logout
async function handleLogout(sendResponse) {
  try {
    authToken = null;
    currentUser = null;
    
    // Clear stored data
    chrome.storage.local.remove(['authToken', 'user']);
    
    sendResponse({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    sendResponse({ 
      success: false, 
      message: 'Error during logout' 
    });
  }
}

// Verify token validity
async function verifyToken(sendResponse) {
  if (!authToken) {
    sendResponse({ 
      success: false, 
      message: 'No token found' 
    });
    return;
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      // Update user data
      currentUser = data.data.user;
      chrome.storage.local.set({ user: currentUser });
      
      sendResponse({ 
        success: true, 
        message: 'Token verified',
        user: currentUser 
      });
    } else {
      // Token is invalid, clear it
      authToken = null;
      currentUser = null;
      chrome.storage.local.remove(['authToken', 'user']);
      
      sendResponse({ 
        success: false, 
        message: 'Token invalid, please login again' 
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    sendResponse({ 
      success: false, 
      message: 'Network error during token verification' 
    });
  }
}

// Restore authentication state on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(['authToken', 'user']);
    if (result.authToken && result.user) {
      authToken = result.authToken;
      currentUser = result.user;
      
      // Verify token is still valid
      verifyToken(() => {});
    }
  } catch (error) {
    console.error('Error restoring auth state:', error);
  }
});

// Set up side panel when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  // Check for stored authentication
  chrome.storage.local.get(['authToken', 'user'], (result) => {
    if (result.authToken && result.user) {
      authToken = result.authToken;
      currentUser = result.user;
    }
  });
});

// Relay to backend submissions endpoint with retry and status storage
async function handleSubmitToBackend(message, sendResponse) {
  try {
    const { data, authToken: tokenFromContent } = message;
    const token = tokenFromContent || authToken;
    if (!token) {
      sendResponse({ error: 'No auth token found' });
      return;
    }

    const backendUrl = `${BACKEND_API_BASE}/api/submissions`;
    const maxRetries = 3;
    const baseDelay = 800;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questionSlug: data.slug,
            code: data.code,
            language: data.language,
            problemTitle: data.problemTitle,
            submissionStatus: data.submissionStatus || 'accepted'
          })
        });

        if (!resp.ok) {
          const text = await resp.text();
          if (attempt === maxRetries) {
            sendResponse({ error: `HTTP ${resp.status}: ${text}` });
            return;
          }
          await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
          continue;
        }

        const result = await resp.json();

        // update local stats
        const stored = await chrome.storage.local.get(null);
        const problemsSynced = (stored.problemsSynced || 0) + 1;
        await chrome.storage.local.set({
          syncStatus: 'Synced',
          problemsSynced,
          lastSync: new Date().toISOString()
        });

        sendResponse({ success: true, data: result?.data || result });
        return;
      } catch (err) {
        if (attempt === maxRetries) {
          sendResponse({ error: err?.message || 'Network error' });
          return;
        }
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  } catch (error) {
    sendResponse({ error: error?.message || 'Unknown error' });
  }
}
