/**
 * Main application entry point for the AI Assistant
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
      // Initialize storage first
      Storage.init();
      
      // Initialize UI components
      UI.init();
      
      // Initialize speech capabilities
      Speech.init();
      
      // Initialize models
      Models.init();
      
      // Initialize chat functionality
      Chat.init();
      
      // Add keyboard shortcuts
      setupKeyboardShortcuts();
      
      // Check browser compatibility
      checkBrowserCompatibility();
      
      console.log('AI Assistant initialized successfully');
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
        if (document.activeElement === UI.elements.messageInput) {
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
        Chat.startNewChat();
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
   * Settings management object
   */
  const Settings = {
    /**
     * Load settings into UI
     */
    loadSettings: function() {
      const settings = Storage.getSettings();
      
      // Apply settings to UI elements
      
      // Theme
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.getAttribute('data-theme') === settings.theme);
      });
      
      // Font size
      const fontSizeSlider = document.getElementById('font-size-slider');
      const fontSizeValue = document.getElementById('font-size-value');
      if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.value = settings.fontSize;
        fontSizeValue.textContent = settings.fontSize;
      }
      
      // Reduce motion
      const reduceMotionCheckbox = document.getElementById('reduce-motion');
      if (reduceMotionCheckbox) {
        reduceMotionCheckbox.checked = settings.reduceMotion;
      }
      
      // Local storage only
      const localStorageOnlyCheckbox = document.getElementById('local-storage-only');
      if (localStorageOnlyCheckbox) {
        localStorageOnlyCheckbox.checked = settings.localStorageOnly;
      }
      
      // Clear on exit
      const clearOnExitCheckbox = document.getElementById('clear-on-exit');
      if (clearOnExitCheckbox) {
        clearOnExitCheckbox.checked = settings.clearOnExit;
      }
      
      // Disable analytics
      const disableAnalyticsCheckbox = document.getElementById('disable-analytics');
      if (disableAnalyticsCheckbox) {
        disableAnalyticsCheckbox.checked = settings.disableAnalytics;
      }
      
      // Auto read responses
      const autoReadResponsesCheckbox = document.getElementById('auto-read-responses');
      if (autoReadResponsesCheckbox) {
        autoReadResponsesCheckbox.checked = settings.autoReadResponses;
      }
      
      // Speech rate
      const speechRateSlider = document.getElementById('speech-rate-slider');
      const speechRateValue = document.getElementById('speech-rate-value');
      if (speechRateSlider && speechRateValue) {
        speechRateSlider.value = settings.speechRate;
        speechRateValue.textContent = settings.speechRate;
      }
      
      // Speech recognition language
      const speechRecognitionLanguage = document.getElementById('speech-recognition-language');
      if (speechRecognitionLanguage) {
        speechRecognitionLanguage.value = settings.speechRecognitionLang;
      }
      
      // Update integrations list
      Models.updateIntegrationsList();
    },
    
    /**
     * Save settings from UI
     */
    saveSettings: function() {
      // Get values from UI elements
      
      // Theme
      const activeThemeOption = document.querySelector('.theme-option.active');
      const theme = activeThemeOption ? activeThemeOption.getAttribute('data-theme') : 'default';
      
      // Font size
      const fontSize = parseInt(document.getElementById('font-size-slider').value);
      
      // Reduce motion
      const reduceMotion = document.getElementById('reduce-motion').checked;
      
      // Local storage only
      const localStorageOnly = document.getElementById('local-storage-only').checked;
      
      // Clear on exit
      const clearOnExit = document.getElementById('clear-on-exit').checked;
      
      // Disable analytics
      const disableAnalytics = document.getElementById('disable-analytics').checked;
      
      // Auto read responses
      const autoReadResponses = document.getElementById('auto-read-responses').checked;
      
      // Speech rate
      const speechRate = parseFloat(document.getElementById('speech-rate-slider').value);
      
      // Speech recognition language
      const speechRecognitionLang = document.getElementById('speech-recognition-language').value;
      
      // Create settings object
      const settings = {
        theme,
        fontSize,
        reduceMotion,
        localStorageOnly,
        clearOnExit,
        disableAnalytics,
        autoReadResponses,
        speechRate,
        speechRecognitionLang,
        // Preserve voice selection
        speechVoice: Storage.getSettings().speechVoice
      };
      
      // Save settings
      Storage.saveSettings(settings);
      
      // Apply settings
      UI.applyTheme(theme);
      UI.applyFontSize(fontSize);
      Speech.setSpeechRate(speechRate);
      Speech.setRecognitionLanguage(speechRecognitionLang);
      
      // Show success message
      Utils.showToast('Settings saved successfully', 'success');
    },
    
    /**
     * Reset settings to defaults
     */
    resetSettings: function() {
      Utils.showConfirm(
        'Are you sure you want to reset all settings to defaults?',
        'Reset Settings',
        () => {
          Storage.saveSettings(Config.defaultSettings);
          this.loadSettings();
          
          // Apply default theme and font size
          UI.applyTheme(Config.defaultSettings.theme);
          UI.applyFontSize(Config.defaultSettings.fontSize);
          
          Utils.showToast('Settings reset to defaults', 'success');
        }
      );
    }
  };
  
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
    if (Chat.currentChat && Chat.currentChat.messages.length > 0 && 
        Chat.currentChat.messages[Chat.currentChat.messages.length - 1].role === 'user') {
      // The user sent a message but hasn't received a response yet
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });