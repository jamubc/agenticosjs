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