// Function to calculate the effective height of the password field
const getEffectiveHeight = (input) => {
  try {
    
    let effectiveHeight = input.offsetHeight; // Fallback to line-height; // Start with the input field's own height

    // Traverse up the DOM to account for parent containers
    let parent = input.parentElement;
    while (parent) {
      const parentStyles = window.getComputedStyle(parent);

      // Check if the parent container has padding or border
      const paddingTop = parseFloat(parentStyles.paddingTop) || 0;
      const paddingBottom = parseFloat(parentStyles.paddingBottom) || 0;
      const borderTop = parseFloat(parentStyles.borderTopWidth) || 0;
      const borderBottom = parseFloat(parentStyles.borderBottomWidth) || 0;

      // Add parent container's contribution to the effective height
      effectiveHeight += paddingTop + paddingBottom + borderTop + borderBottom;

      // Stop at the first parent with position "relative" or "absolute"
      if (parentStyles.position === "relative" || "absolute") {
        break;
      }

      parent = parent.parentElement;
    }

    // Return the effective height if it's valid
    return effectiveHeight > 0 ? effectiveHeight : null;
  } catch (error) {
    // If there's an error, fall back to null
    console.log("Error calculating effective height:", error);
    return null;
  }
};


// Function to handle focus on password fields
const handleFocus = (event) => {
  const input = event.target;
  
  if (input.nextElementSibling?.classList.contains("chess-image-button")) {
    return;
  }
  
  // Check if image button already exists
  if (document.querySelector(".chess-image-button")) {
    document.querySelector('.chess-image-button').remove();
  }

  // Get the input field's bounding box (to calculate its position)
  
  // Calculate the effective height of the password field
  const effectiveimg = getEffectiveHeight(input);
  const rect = input.getBoundingClientRect();
  
  // Create the image button
  const imageButton = document.createElement("img");
  imageButton.src = chrome.runtime.getURL("../img/chess-icon.png");
  imageButton.alt = "Chess Password";
  imageButton.title = "Generate Password";
  imageButton.className = "chess-image-button";
  imageButton.style.cursor = "pointer";
  imageButton.style.position = "absolute";
  imageButton.style.zIndex = "9999";
  imageButton.style.right = "5px"; // Position with a small margin
  imageButton.style.top = `${rect.top + (rect.height - rect.height) / 2}px`; // Center vertically
  imageButton.style.left = `${rect.right - rect.height}px`; // Position it on the right inside corner
  
  if (effectiveimg) {
    imageButton.style.height = `${effectiveimg}px`;
    imageButton.style.width = `${effectiveimg}px`; // Keep it square
  } else {
    imageButton.style.height = "34px"; // Fallback fixed height
    imageButton.style.width = "34px"; // Fallback fixed width
  }
  
  // imageButton.style.width = `${input.offsetWidth}px`; // Match input width
  input.parentNode.insertBefore(imageButton, input);
  

  // Add click event to open the popup
  imageButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openPopup" });
  });

  // Append the image button to the document body
  document.body.appendChild(imageButton);
  
};

// Function to handle new input elements (detected by MutationObserver)
const handleNewInputElements = (mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;

        // Find password fields in the newly added element
        const inputs = element.querySelectorAll(
          `input[type="password"], input[name*="password"], input[id*="password"]`
        );

        inputs.forEach((input) => {
          // Attach event listener if not already added
          if (input instanceof HTMLInputElement && !input.dataset.passwordListened) {
            input.dataset.passwordListened = "true"; // Mark as processed
            input.addEventListener("focus", handleFocus);
          }
        });
      }
    });
  });
};

// Initialize the MutationObserver to detect new password fields
const observer = new MutationObserver(handleNewInputElements);
observer.observe(document.body, { childList: true, subtree: true });

// Attach event listeners to existing password fields
document.querySelectorAll(`input[type="password"], input[name*="password"], input[id*="password"]`)
  .forEach((input) => {
    if (!input.dataset.passwordListened) {
      input.dataset.passwordListened = "true"; // Mark as processed
      input.addEventListener("focus", handleFocus);
    }
  });





function addBodyContent() {
  const frame = document.querySelector('iframe');
      
  if (frame) {
    frame.remove();  // Close or remove the iframe from the page
  }
  // Inject an iframe with popup.html
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('../popup/index.html');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.margin = '10px 0 0 10px';
  iframe.style.borderRadius = '15px';
  iframe.style.width = '320px'; // Set width for the iframe
  iframe.style.height = '470px'; // Set height for the iframe
  iframe.style.border = 'none';
  iframe.style.zIndex = '10000'; // Ensure it appears above other content
  
  document.body.appendChild(iframe);
  
}


// Initialize
function injectContent() {
  addBodyContent();
}

// Listen for messages from the background or popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.action === 'injectContent') {
    
    // console.log('Injecting content into the webpage...');
    
    injectContent(); // Function to inject the required HTML, CSS, and JS
    sendResponse({ success: true, message: 'Content injected successfully!' });
  }
  
  if (message.type === 'CLEAR_PASSWORD_FIELDS') {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length === 0) {
      console.log('No password fields found to clear.');
      sendResponse({ success: false, error: 'No password fields found to clear.' });
      return true;
    }

    // Clear all password fields
    passwordFields.forEach((field) => {
      field.value = '';
    });

    console.log('Password fields have been cleared.');
    sendResponse({ success: true });
  }

  if (message.type === 'GENERATED_PASSWORD') {
    const { hashedPassword } = message;

    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length === 0) {
      console.log('No password fields found to autofill.');
      sendResponse({ success: false, error: 'No password fields found to autofill.' });
      return true;
    }

    // Autofill all password fields
    passwordFields.forEach((field) => {
      field.value = hashedPassword;
    });

    console.log('Password has been auto-filled in the password field!');
    sendResponse({ success: true });
  }

  
  if (message.action === 'CLOSE_IFRAME') {
    
      // Find the iframe and remove it from the document
      const iframe = document.querySelector('iframe');
      
      if (iframe) {
        iframe.remove();  // Close or remove the iframe from the page
      }
      sendResponse({ success: true });
  }
  
  if (message.type === "DISABLE_SCROLL") {
    console.log("Disabling scroll");
    document.body.style.overflow = "hidden";
    document.body.style.overflowY = "hidden";
    document.body.style.overflowX = "hidden";
    sendResponse({ status: "Scroll disabled" }); // Send response
  } 
  else if (message.type === "ENABLE_SCROLL") {
    console.log("Enabling scroll");
    document.body.style.overflow = "auto";
    document.body.style.overflowY = "auto";
    document.body.style.overflowX = "auto";
    sendResponse({ status: "Scroll enabled" }); // Send response
    
  }

  return true; // Indicate that the response is asynchronous
});