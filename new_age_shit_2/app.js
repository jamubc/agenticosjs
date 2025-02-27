/**
 * Main application entry point for the Pepe AI Multitool
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initializeApp();
});

/**
* Initialize the application
*/
function initializeApp() {
  try {
      console.log('Initializing Pepe AI Multitool...');
      
      // Initialize storage first
      Storage.init();
      
      // Initialize settings
      Settings.init();
      
      // Initialize speech capabilities
      if (typeof Speech !== 'undefined') {
          Speech.init();
      } else {
          console.warn('Speech module not found');
      }
      
      // Initialize models
      if (typeof Models !== 'undefined') {
          Models.init();
      } else {
          console.warn('Models module not found');
      }
      
      // Initialize chat functionality
      if (typeof Chat !== 'undefined') {
          Chat.init();
      } else {
          console.warn('Chat module not found');
      }
      
      // UI should be initialized after other modules
      // This is handled by the UI module itself with DOMContentLoaded
      
      // Add keyboard shortcuts
      setupKeyboardShortcuts();
      
      // Check browser compatibility
      checkBrowserCompatibility();
      
      // Add legacy global functions for node workflow
      setupLegacyGlobals();
      
      console.log('Pepe AI Multitool initialized successfully');
  } catch (error) {
      console.error('Error initializing application:', error);
      
      // Show error message to user
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.innerHTML = `
          <h2>Error Initializing Application</h2>
          <p>${error.message || 'An unknown error occurred'}</p>
          <button onclick="window.location.reload()">Reload</button>
      `;
      
      document.body.innerHTML = '';
      document.body.appendChild(errorMessage);
  }
}

/**
* Set up keyboard shortcuts
*/
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
      // Cmd/Ctrl + Enter - Send message even if textarea has multiple lines
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          const messageInput = document.getElementById('message-input');
          if (document.activeElement === messageInput) {
              e.preventDefault();
              UI.handleSendMessage();
          }
      }
      
      // Cmd/Ctrl + / - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          UI.toggleSidebar();
      }
      
      // Cmd/Ctrl + N - New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
          e.preventDefault();
          if (typeof Chat !== 'undefined' && Chat.startNewChat) {
              Chat.startNewChat();
          }
      }
      
      // Escape - Close any open modal
      if (e.key === 'Escape') {
          const openModal = document.querySelector('.modal.visible');
          if (openModal) {
              e.preventDefault();
              UI.hideModal(openModal.id);
          }
      }
  });
}

/**
* Check browser compatibility
*/
function checkBrowserCompatibility() {
  const warnings = [];
  
  // Check for IndexedDB/localStorage support
  if (!window.localStorage) {
      warnings.push('LocalStorage is not supported. Chat history and settings cannot be saved.');
  }
  
  // Check for fetch API
  if (!window.fetch) {
      warnings.push('Fetch API is not supported. Communication with AI models may not work.');
  }
  
  // Check for speech synthesis
  if (!window.speechSynthesis) {
      warnings.push('Speech Synthesis is not supported. Text-to-speech features will be disabled.');
  }
  
  // Check for speech recognition
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      warnings.push('Speech Recognition is not supported. Voice input features will be disabled.');
  }
  
  // Display warnings if any
  if (warnings.length > 0) {
      warnings.forEach(warning => {
          Utils.showToast(warning, 'warning', 'Compatibility Warning', 6000);
      });
  }
}

/**
* Setup legacy global functions for node workflow
*/
function setupLegacyGlobals() {
  // These functions need to be in global scope for the old node workflow code
  window.addNode = function(type) {
      console.log(`Creating node of type: ${type}`);
      
      // Check if NodeItem class exists
      if (typeof NodeItem !== 'undefined') {
          // Create a node DOM element
          const nodeDom = document.createElement('div');
          nodeDom.className = 'node';
          nodeDom.style.top = `${Math.random() * 300}px`;
          nodeDom.style.left = `${Math.random() * 300}px`;
          const nodeId = `node-${window.nodeCounter || 0}`;
          window.nodeCounter = (window.nodeCounter || 0) + 1;
          nodeDom.setAttribute('id', nodeId);
          
          // Make it draggable
          nodeDom.onmousedown = window.startDrag;
          nodeDom.onclick = window.handleNodeClick;
          
          // Append to canvas
          const canvas = document.getElementById('node-canvas');
          if (canvas) {
              canvas.appendChild(nodeDom);
              
              // Create NodeItem instance
              try {
                  const nodeObj = new NodeItem(type, nodeDom, window.connecting);
                  window.nodeItems = window.nodeItems || [];
                  window.nodeItems.push(nodeObj);
                  
                  console.log(`Node created: ${nodeId}`);
                  
                  // Show tooltip if it's the first node
                  if (nodeId === 'node-0' && typeof addInteractivity === 'function') {
                      addInteractivity("#node-0", {
                          tooltip: "this is a node",
                          popup: "<h3>offline mode:</h3><p>to use offline mode only have one chat node up</p>",
                          position: "top",
                          autoHideDelay: 1000,
                      });
                  }
              } catch (error) {
                  console.error('Error creating node:', error);
                  Utils.showToast('Error creating node', 'error');
              }
          } else {
              console.error('Node canvas not found');
          }
      } else {
          console.warn('NodeItem class not found');
          Utils.showToast('Node workflow functionality not fully loaded', 'warning');
      }
  };
  
  window.executeRequests = function() {
      console.log('Executing all node requests');
      
      if (window.nodeItems && Array.isArray(window.nodeItems)) {
          window.nodeItems.forEach(node => {
              if (typeof node.run === 'function') {
                  node.run();
              }
          });
      } else {
          console.warn('No nodes to execute');
          Utils.showToast('No nodes to execute', 'warning');
      }
  };
  
  // Initialize global variables for node workflow
  window.nodeCounter = 0;
  window.nodeItems = [];
  window.connections = [];
  window.connecting = false;
  window.connectionStartNode = null;
  window.selectedNode = null;
  
  console.log('Legacy global functions for node workflow setup complete');
}

// Handle visibility change to implement "Clear on exit" if needed
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
      const settings = Storage.getSettings();
      if (settings.clearOnExit) {
          // Clear all chats but keep settings and integrations
          const chats = Storage.getChats();
          chats.forEach(chat => {
              Storage.deleteChat(chat.id);
          });
      }
  }
});

// Handle beforeunload to show confirmation if needed
window.addEventListener('beforeunload', function(e) {
  // Check if we have unsaved changes
  if (typeof Chat !== 'undefined' && Chat.currentChat && 
      Chat.currentChat.messages.length > 0 && 
      Chat.currentChat.messages[Chat.currentChat.messages.length - 1].role === 'user') {
      // The user sent a message but hasn't received a response yet
      e.preventDefault();
      e.returnValue = '';
      return '';
  }
});