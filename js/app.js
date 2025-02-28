/**
 * Main application entry point for the Pepe AI Multitool
 */
document.addEventListener('DOMContentLoaded', function () {
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

    // Initialize modals
    Utils.initializeModals();

    // Check browser compatibility
    checkBrowserCompatibility();

    // Add legacy global functions for node workflow
    setupLegacyGlobals();

    // Conditionally initialize analytics based on settings
    const settings = Storage.getSettings();
    if (!settings.disableAnalytics) {
      initializeAnalytics();
    }

    console.log('Pepe AI Multitool initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
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
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      const messageInput = document.getElementById('message-input');
      if (document.activeElement === messageInput) {
        e.preventDefault();
        UI.handleSendMessage();
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      UI.toggleSidebar();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      if (typeof Chat !== 'undefined' && Chat.startNewChat) {
        Chat.startNewChat();
      }
    }
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.visible');
      if (openModal) {
        e.preventDefault();
        Utils.hideModal(openModal.id);
      }
    }
  });
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
  const warnings = [];
  if (!window.localStorage) {
    warnings.push('LocalStorage is not supported. Chat history and settings cannot be saved.');
  }
  if (!window.fetch) {
    warnings.push('Fetch API is not supported. Communication with AI models may not work.');
  }
  if (!window.speechSynthesis) {
    warnings.push('Speech Synthesis is not supported. Text-to-speech features will be disabled.');
  }
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    warnings.push('Speech Recognition is not supported. Voice input features will be disabled.');
  }
  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      Utils.showToast(warning, 'warning', 'Compatibility Warning', 6000);
    });
  }
}

function setupLegacyGlobals() {
  // Define a basic NodeItem class directly in app.js to prevent the "not fully loaded" warning
  window.NodeItem = class {
    constructor(type, domElement, connecting) {
      this.type = type;
      this.domElement = domElement;
      this.id = domElement.getAttribute("id");
      this.executed = false;
      this.connecting = connecting;
      this.imageUrl = "";
      this.url = "";
      this.offline = true;
      this.rerun = false;
      
      // Set up basic structure
      this.setupBasicUI();
      
      // For CHAT nodes, add input fields
      if (type === "CHAT") {
        this.createChatInterface();
      }

      // For PICTURE nodes, add a file input button
      if (type === "PICTURE") {
        this.createPictureInterface();
      }
    }
    
    setupBasicUI() {
      // Add type-specific content
      const header = document.createElement('div');
      header.style.padding = '10px';
      header.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      header.textContent = `${this.type} Node`;
      
      this.domElement.appendChild(header);
      
      // Add content area
      this.outputContainer = document.createElement('div');
      this.outputContainer.style.padding = '10px';
      this.outputContainer.textContent = `${this.type} content will appear here`;
      
      this.domElement.appendChild(this.outputContainer);
    }
    
    createChatInterface() {
      // Input container
      const inputContainer = document.createElement("div");
      inputContainer.style.padding = "1rem";
      
      // Question input field
      const questionLabel = document.createElement("label");
      questionLabel.textContent = "Question:";
      questionLabel.style.display = "block";
      
      this.questionInput = document.createElement("textarea");
      this.questionInput.name = "question";
      this.questionInput.rows = 2;
      this.questionInput.placeholder = "Enter your question here...";
      this.questionInput.style.width = "100%";
      this.questionInput.style.borderRadius = "5px";
      
      inputContainer.appendChild(questionLabel);
      inputContainer.appendChild(this.questionInput);
      
      this.domElement.insertBefore(inputContainer, this.outputContainer);
    }
    
    createPictureInterface() {
      const inputContainer = document.createElement("div");
      inputContainer.style.padding = "1rem";
      
      // File input for image selection
      this.fileInput = document.createElement("input");
      this.fileInput.type = "file";
      this.fileInput.accept = "image/*";
      
      inputContainer.appendChild(this.fileInput);
      this.domElement.insertBefore(inputContainer, this.outputContainer);
    }
    
    run() {
      if (this.executed && !this.rerun) {
        console.log(`Node ${this.id} already executed`);
        return;
      }
      
      console.log(`Running node ${this.id} of type ${this.type}`);
      
      if (this.type === "CHAT" && this.questionInput) {
        this.outputContainer.textContent = `Processing question: ${this.questionInput.value}`;
      } else {
        this.outputContainer.textContent = `${this.type} node executed at ${new Date().toLocaleTimeString()}`;
      }
      
      this.executed = true;
    }
    
    getConnectedNodes() {
      if (typeof connections !== "undefined") {
        return connections
          .filter((conn) => conn.to === this.id)
          .map((conn) => conn.from);
      }
      return [];
    }
    
    findNodeItemById(nodeId) {
      if (typeof nodeItems !== "undefined") {
        return nodeItems.find((node) => node.id === nodeId) || null;
      }
      return null;
    }
    
    setOutput(message) {
      this.outputContainer.textContent = message;
    }
  };
  
  window.addNode = function (type) {
    console.log(`Creating node of type: ${type}`);
    if (typeof NodeItem !== 'undefined') {
      const nodeDom = document.createElement('div');
      nodeDom.className = 'node';
      nodeDom.style.top = `${Math.random() * 300}px`;
      nodeDom.style.left = `${Math.random() * 300}px`;
      const nodeId = `node-${window.nodeCounter || 0}`;
      window.nodeCounter = (window.nodeCounter || 0) + 1;
      nodeDom.setAttribute('id', nodeId);
      nodeDom.onmousedown = window.startDrag;
      nodeDom.onclick = window.handleNodeClick;
      const canvas = document.getElementById('node-canvas');
      if (canvas) {
        canvas.appendChild(nodeDom);
        try {
          const nodeObj = new NodeItem(type, nodeDom, window.connecting);
          window.nodeItems = window.nodeItems || [];
          window.nodeItems.push(nodeObj);
          console.log(`Node created: ${nodeId}`);
          if (nodeId === 'node-0' && typeof addInteractivity === 'function') {
            addInteractivity('#node-0', {
              tooltip: 'this is a node',
              popup: '<h3>offline mode:</h3><p>to use offline mode only have one chat node up</p>',
              position: 'top',
              autoHideDelay: 1000
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

  window.executeRequests = function () {
    console.log('Executing all node requests');
    if (window.nodeItems && Array.isArray(window.nodeItems)) {
      window.nodeItems.forEach((node) => {
        if (typeof node.run === 'function') {
          node.run();
        }
      });
    } else {
      console.warn('No nodes to execute');
      Utils.showToast('No nodes to execute', 'warning');
    }
  };

  window.nodeCounter = 0;
  window.nodeItems = [];
  window.connections = [];
  window.connecting = false;
  window.connectionStartNode = null;
  window.selectedNode = null;
  
  window.startDrag = function(event) {
    event.preventDefault();
    // Get the target node
    const node = event.target.closest('.node');
    if (!node) return;
    
    // Store the initial mouse position
    const startX = event.clientX;
    const startY = event.clientY;
    
    // Store the initial node position
    const nodeRect = node.getBoundingClientRect();
    const nodeLeft = parseInt(node.style.left) || 0;
    const nodeTop = parseInt(node.style.top) || 0;
    
    // Define the mousemove handler
    const mouseMoveHandler = function(e) {
      // Calculate the new position
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Update the node position
      node.style.left = `${nodeLeft + dx}px`;
      node.style.top = `${nodeTop + dy}px`;
    };
    
    // Define the mouseup handler
    const mouseUpHandler = function() {
      // Remove the event listeners
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    
    // Add the event listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };
  
  window.handleNodeClick = function(event) {
    // Simple click handler
    const node = event.target.closest('.node');
    if (!node) return;
    
    // Deselect any previously selected node
    const selectedNode = document.querySelector('.node.selected');
    if (selectedNode) {
      selectedNode.classList.remove('selected');
    }
    
    // Select this node
    node.classList.add('selected');
    
    // Store the selected node
    window.selectedNode = node;
  };

  console.log('Legacy global functions for node workflow setup complete');
}

/**
 * Initialize analytics (placeholder function)
 */
function initializeAnalytics() {
  // Placeholder for actual analytics initialization
  console.log('Analytics initialized');
}

// Handle visibility change to implement "Clear on exit" if enabled
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') {
    const settings = Storage.getSettings();
    if (settings.clearOnExit) {
      const chats = Storage.getChats();
      chats.forEach((chat) => {
        Storage.deleteChat(chat.id);
      });
      if (Chat.currentChat) {
        Chat.currentChat = null;
        UI.toggleWelcomeScreen(true);
      }
    }
  }
});

// Handle beforeunload to show confirmation if needed
window.addEventListener('beforeunload', function (e) {
  if (
    typeof Chat !== 'undefined' &&
    Chat.currentChat &&
    Chat.currentChat.messages.length > 0 &&
    Chat.currentChat.messages[Chat.currentChat.messages.length - 1].role === 'user'
  ) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});