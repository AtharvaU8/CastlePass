chrome.runtime.onInstalled.addListener(() => {
  console.log('Chess Password Generator Extension Installed');

  // Create the context menu
  chrome.contextMenus.create({
    id: 'chessPasswordGenerator',
    title: 'Generate Chess Password',
    contexts: ['all']
  });
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === 'GENERATED_PASSWORD') {
    const { hashedPassword } = message;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.log('No active tabs found to send the password.');
        sendResponse({ success: false, error: 'No active tabs found.' });
        return;
      }

      const activeTab = tabs[0];
      
      if (activeTab.url && activeTab.url.startsWith('chrome://')) {
        console.log('Cannot send messages to Chrome internal pages.');
        sendResponse({ success: false, error: 'Cannot send messages to Chrome internal pages.' });
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'GENERATED_PASSWORD', hashedPassword }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error sending message to content.js:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Password sent successfully:', response);
          sendResponse({ success: true });
        }
      });
    });
    return true; // Keep the message channel open for asynchronous response
  }

  if (message.type === 'CLEAR_PASSWORD_FIELDS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.log('No active tabs found to clear password fields.');
        sendResponse({ success: false, error: 'No active tabs found.' });
        return;
      }

      const activeTab = tabs[0];

      if (activeTab.url && activeTab.url.startsWith('chrome://')) {
        console.log('Cannot send messages to Chrome internal pages.');
        sendResponse({ success: false, error: 'Cannot send messages to Chrome internal pages.' });
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'CLEAR_PASSWORD_FIELDS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Error sending message to content.js:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Password fields cleared successfully:', response);
          sendResponse({ success: true });
        }
      });
    });
    return true; // Keep the message channel open for asynchronous response
  }
  
  // Relay messages between chess-bot.js and content.js
  if (message.type === "DISABLE_SCROLL" || message.type === "ENABLE_SCROLL") {
    // Forward message to content.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error sending message to content.js:", chrome.runtime.lastError);
            sendResponse({ status: "Error", error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response); // Pass the response back to chessboard.js
          }
        });
      } else {
        console.log("No active tabs found");
        sendResponse({ status: "Error", error: "No active tabs found" });
      }
    });

    // Return true to keep the message channel open for asynchronous sendResponse
    return true;
  }

  
  if (message.action === 'openPopup') {
    
    // chrome.action.openPopup() and fallback to content.js injection
    
    if (chrome.action && chrome.action.openPopup) {
      chrome.action.openPopup()
        .then(() => sendResponse({ success: true, method: 'openPopup' }))
        .catch((error) => {
          console.log('Error using openPopup:', error);
          fallbackInjectContent(sendResponse); // Fallback to content injection
        });
        
    } else {
      console.log('openPopup is not supported, falling back to content injection.');
      fallbackInjectContent(sendResponse);
    }
    return true; // Keep the message channel open for asynchronous response
  }
  
  if (message.action === 'CLOSE_IFRAME') {
    // Get the parent frame and check if the iframe exists
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, { action: 'CLOSE_IFRAME' });
    }
    sendResponse({ success: true });
  }

  return true; // Keep the message channel open for any asynchronous responses
});


// Helper function for fallback content injection
function fallbackInjectContent(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.log('No active tabs found.');
      sendResponse({ success: false, error: 'No active tabs found.' });
      return;
    }

    const activeTab = tabs[0];

    chrome.tabs.sendMessage(activeTab.id, { action: 'injectContent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error injecting content:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Content injection response:', response);
        sendResponse(response);
      }
    });
  });
}




// Handle context menu actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'chessPasswordGenerator') {
    if (!tab || !tab.id) {
      console.log('No valid tab found to inject the script.');
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['../content/content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.log('Failed to inject content script:', chrome.runtime.lastError);
      } else {
        console.log('Content script injected successfully.');
      }
    });
  }
});
