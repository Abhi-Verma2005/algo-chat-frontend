// Handle side panel setup
console.log('[background] init: setting side panel behavior');
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Store authentication state
let authToken = null;
let currentUser = null;
// Use unified API base with /api prefix for consistency
const BACKEND_API_BASE = 'http://localhost:3001/api';

// Unified message handler (auth + submissions)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[background] onMessage:', message?.action, { fromTabId: sender?.tab?.id });
  if (message.action === 'openPopup') {
    console.log('[background] action: openPopup');
    chrome.action.openPopup(); // Opens the popup programmatically
  }
  
  if (message.action === 'openSidePanel') {
    console.log('[background] action: openSidePanel');
    // Open side panel for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (tab && tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
      } else {
        // fallback
        chrome.sidePanel.open();
      }
    });
  }
  
  if (message.action === 'toggleSidePanel') {
    console.log('[background] action: toggleSidePanel');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab || !tab.id) return;
      chrome.sidePanel.getOptions({ tabId: tab.id }).then((options) => {
        if (options && options.enabled) {
          chrome.sidePanel.close({ tabId: tab.id });
        } else {
          chrome.sidePanel.open({ tabId: tab.id });
        }
      });
    });
  }

  // Handle authentication
  if (message.action === 'login') {
    console.log('[background] action: login');
    handleLogin(message.credentials, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.action === 'logout') {
    console.log('[background] action: logout');
    handleLogout(sendResponse);
    return true;
  }

  if (message.action === 'getAuthState') {
    console.log('[background] action: getAuthState');
    sendResponse({ 
      isAuthenticated: !!authToken, 
      user: currentUser 
    });
  }

  if (message.action === 'verifyToken') {
    console.log('[background] action: verifyToken');
    verifyToken(sendResponse);
    return true;
  }

  // Submission relay from content script
  if (message.action === 'send_to_backend') {
    try { console.log('[background] action: send_to_backend', { slug: message?.data?.slug, status: message?.data?.submissionStatus }) } catch {}
    handleSubmitToBackend(message, sendResponse);
    return true;
  }
});

// Handle login
async function handleLogin(credentials, sendResponse) {
  try {
    console.log('[background] handleLogin: start');
  const response = await fetch(`${BACKEND_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('[background] handleLogin: response status', response.status);
    const data = await response.json();

    if (data.success) {
      console.log('[background] handleLogin: success for user', data?.data?.user?.email || data?.data?.user?.id);
      authToken = data.data.token;
      currentUser = data.data.user;
      
      // Store token in chrome storage (unified key: token)
      chrome.storage.local.set({ 
        token: authToken,
        user: currentUser,
        timestamp: Date.now()
      });

      sendResponse({ 
        success: true, 
        message: 'Login successful',
        user: currentUser 
      });
    } else {
      console.warn('[background] handleLogin: failed', data?.message);
      sendResponse({ 
        success: false, 
        message: data.message || 'Login failed' 
      });
    }
  } catch (error) {
    console.error('[background] handleLogin: error', error);
    sendResponse({ 
      success: false, 
      message: 'Network error during login' 
    });
  }
}

// Handle logout
async function handleLogout(sendResponse) {
  try {
    console.log('[background] handleLogout: clearing session');
    authToken = null;
    currentUser = null;
    
    // Clear stored data
  chrome.storage.local.remove(['token', 'user', 'timestamp']);
    
    sendResponse({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('[background] handleLogout: error', error);
    sendResponse({ 
      success: false, 
      message: 'Error during logout' 
    });
  }
}

// Verify token validity
async function verifyToken(sendResponse) {
  console.log('[background] verifyToken: start');
  if (!authToken) {
    console.warn('[background] verifyToken: no token');
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

    console.log('[background] verifyToken: response status', response.status);
    const data = await response.json();

    if (data.success) {
      // Update user data
  currentUser = data.data.user;
  chrome.storage.local.set({ user: currentUser, timestamp: Date.now() });
      console.log('[background] verifyToken: success');
      
      sendResponse({ 
        success: true, 
        message: 'Token verified',
        user: currentUser 
      });
    } else {
      // Token is invalid, clear it
      console.warn('[background] verifyToken: invalid token');
      authToken = null;
      currentUser = null;
  chrome.storage.local.remove(['token', 'user', 'timestamp']);
      
      sendResponse({ 
        success: false, 
        message: 'Token invalid, please login again' 
      });
    }
  } catch (error) {
    console.error('[background] verifyToken: error', error);
    sendResponse({ 
      success: false, 
      message: 'Network error during token verification' 
    });
  }
}

// Restore authentication state on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[background] onStartup: restore session');
  try {
    const result = await chrome.storage.local.get(['token', 'user']);
    if (result.token && result.user) {
      authToken = result.token;
      currentUser = result.user;
      
      // Verify token is still valid
      console.log('[background] onStartup: verifying restored token');
      verifyToken(() => {});
    }
  } catch (error) {
    console.error('[background] onStartup: restore error', error);
  }
});

// Set up side panel when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('[background] onInstalled: init');
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  // Check for stored authentication
  chrome.storage.local.get(['token', 'user'], (result) => {
    if (result.token && result.user) {
      console.log('[background] onInstalled: found stored session');
      authToken = result.token;
      currentUser = result.user;
    }
  });
});

// Relay to backend submissions endpoint with retry and status storage
async function handleSubmitToBackend(message, sendResponse) {
  try {
    console.log('[background] handleSubmitToBackend: start');
    const { data, token: tokenFromContent } = message || {};
    const token = tokenFromContent || authToken;
    if (!token) {
      console.warn('[background] handleSubmitToBackend: no token');
      sendResponse({ error: 'No auth token found' });
      return;
    }

    // Only process accepted submissions; content adapters should already filter
    if (data?.submissionStatus && data.submissionStatus !== 'accepted') {
      console.log('[background] handleSubmitToBackend: ignoring non-accepted submission', data?.submissionStatus);
      sendResponse({ success: false, skipped: true, reason: 'non-accepted' });
      return;
    }

    // Dedupe: avoid re-sending accepted code for the same problem
    const keyParts = [data?.slug || 'unknown', data?.problemTitle || ''];
    const dedupeKey = keyParts.join('::').toLowerCase();
    try {
      const stored = await chrome.storage.local.get(['acceptedIndex']);
      const acceptedIndex = stored?.acceptedIndex || {};
      if (acceptedIndex[dedupeKey]) {
        console.log('[background] handleSubmitToBackend: duplicate accepted submission, skipping', dedupeKey);
        sendResponse({ success: true, skipped: true, reason: 'duplicate' });
        return;
      }
    } catch (e) {
      console.warn('[background] handleSubmitToBackend: dedupe check failed (continuing)', e);
    }

    const backendUrl = `${BACKEND_API_BASE}/submissions`;
    const maxRetries = 3;
    const baseDelay = 800;
    const submittedAt = new Date().toISOString();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log('[background] handleSubmitToBackend: attempt', attempt);
        const resp = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Identifiers
            questionSlug: data.slug,
            // Required storage fields
            problemTitle: data.problemTitle,
            language: data.language,
            code: data.code,
            submittedAt,
            // Optional legacy/status compat
            submissionStatus: data.submissionStatus || 'accepted'
          })
        });

        console.log('[background] handleSubmitToBackend: status', resp.status);
        if (!resp.ok) {
          const text = await resp.text();
          if (attempt === maxRetries) {
            console.error('[background] handleSubmitToBackend: failed after retries', resp.status, text);
            sendResponse({ error: `HTTP ${resp.status}: ${text}` });
            return;
          }
          await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
          continue;
        }

        const result = await resp.json();
        console.log('[background] handleSubmitToBackend: success');

        // update local stats
        const stored = await chrome.storage.local.get(null);
        const problemsSynced = (stored.problemsSynced || 0) + 1;
        await chrome.storage.local.set({
          syncStatus: 'Synced',
          problemsSynced,
          lastSync: submittedAt
        });

        // Mark as accepted to prevent duplicates
        try {
          const prev = await chrome.storage.local.get(['acceptedIndex']);
          const acceptedIndex = prev?.acceptedIndex || {};
          acceptedIndex[dedupeKey] = {
            submittedAt,
            language: data.language,
            problemTitle: data.problemTitle,
          };
          await chrome.storage.local.set({ acceptedIndex });
        } catch (e) {
          console.warn('[background] handleSubmitToBackend: failed to update dedupe index', e);
        }

        sendResponse({ success: true, data: result?.data || result });
        return;
      } catch (err) {
        console.warn('[background] handleSubmitToBackend: network error on attempt', attempt, err);
        if (attempt === maxRetries) {
          sendResponse({ error: err?.message || 'Network error' });
          return;
        }
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  } catch (error) {
    console.error('[background] handleSubmitToBackend: unexpected error', error);
    sendResponse({ error: error?.message || 'Unknown error' });
  }
}
