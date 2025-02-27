/**
 * UI management for the AI Assistant application
 */

const UI = {
    // Store elements that we'll reference frequently
    elements: {
      appContainer: document.getElementById('app-container'),
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      messageContainer: document.getElementById('message-container'),
      messageInput: document.getElementById('message-input'),
      sendButton: document.getElementById('send-btn'),
      voiceInputButton: document.getElementById('voice-input-btn'),
      uploadButton: document.getElementById('upload-btn'),
      cameraButton: document.getElementById('camera-btn'),
      fileUpload: document.getElementById('file-upload'),
      tokenCount: document.getElementById('token-count'),
      modelSelector: document.getElementById('model-selector'),
      modelBadge: document.getElementById('model-badge'),
      modelStatus: document.getElementById('model-status'),
      modelTypingStatus: document.getElementById('model-typing-status'),
      attachmentPreview: document.getElementById('attachment-preview'),
      chatHistoryList: document.getElementById('chat-history-list'),
      newChatButton: document.getElementById('new-chat-btn'),
      settingsButton: document.getElementById('settings-btn'),
      lightThemeButton: document.getElementById('light-theme-btn'),
      darkThemeButton: document.getElementById('dark-theme-btn')
    },
    
    // Store UI state
    state: {
      isSidebarCollapsed: false,
      isTyping: false,
      inputHeight: 24,
      uploadedFiles: [],
      currentTheme: 'default',
      fontSize: 16
    },
    
    /**
     * Initialize UI components and event listeners
     */
    init: function() {
      this.setupEventListeners();
      this.updateButtonStates();
      this.setupResizableTextarea();
      this.setupModals();
      this.applyTheme(Storage.getSettings().theme || 'default');
      this.applyFontSize(Storage.getSettings().fontSize || 16);
      
      // Set initial state
      if (window.innerWidth < 768) {
        this.toggleSidebar(true);
      }
    },
    
    /**
     * Setup all event listeners for UI elements
     */
    setupEventListeners: function() {
      // Sidebar toggle
      this.elements.sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
      
      // Message input events
      this.elements.messageInput.addEventListener('input', this.handleInputChange.bind(this));
      this.elements.messageInput.addEventListener('keydown', (e) => {
        // Send on Enter (but not with Shift key)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
      
      // Send button
      this.elements.sendButton.addEventListener('click', this.handleSendMessage.bind(this));
      
      // Voice input button
      this.elements.voiceInputButton.addEventListener('click', () => {
        this.showModal('voice-modal');
        Speech.startSpeechRecognition();
      });
      
      // File upload
      this.elements.uploadButton.addEventListener('click', () => {
        this.elements.fileUpload.click();
      });
      
      this.elements.fileUpload.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files);
      });
      
      // Camera button
      this.elements.cameraButton.addEventListener('click', () => {
        this.showModal('camera-modal');
        this.initializeCamera();
      });
      
      // New chat button
      this.elements.newChatButton.addEventListener('click', () => {
        Chat.startNewChat();
      });
      
      // Settings button
      this.elements.settingsButton.addEventListener('click', () => {
        this.showModal('settings-modal');
        Settings.loadSettings();
      });
      
      // Theme buttons
      this.elements.lightThemeButton.addEventListener('click', () => {
        this.applyTheme('light');
        Storage.updateSettings({ theme: 'light' });
      });
      
      this.elements.darkThemeButton.addEventListener('click', () => {
        this.applyTheme('dark');
        Storage.updateSettings({ theme: 'dark' });
      });
      
      // Model selector
      this.elements.modelSelector.addEventListener('change', (e) => {
        const modelId = e.target.value;
        Models.selectModel(modelId);
      });
      
      // Quick prompt buttons
      document.querySelectorAll('.prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.elements.messageInput.value = e.target.textContent;
          this.handleInputChange();
          this.elements.messageInput.focus();
        });
      });
      
      // Window resize handling
      window.addEventListener('resize', Utils.debounce(() => {
        // Auto collapse sidebar on small screens
        if (window.innerWidth < 768 && !this.state.isSidebarCollapsed) {
          this.toggleSidebar(true);
        }
      }, 250));
    },
    
    /**
     * Setup modals and their event handlers
     */
    setupModals: function() {
      // Close modal buttons
      document.querySelectorAll('.close-modal-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const modal = e.target.closest('.modal');
          this.hideModal(modal.id);
        });
      });
      
      // Settings tab handling
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.target.getAttribute('data-tab');
          this.switchSettingsTab(tab);
        });
      });
      
      // Save settings button
      document.getElementById('save-settings-btn').addEventListener('click', () => {
        Settings.saveSettings();
        this.hideModal('settings-modal');
      });
      
      // Font size slider
      const fontSizeSlider = document.getElementById('font-size-slider');
      const fontSizeValue = document.getElementById('font-size-value');
      
      fontSizeSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        fontSizeValue.textContent = size;
        this.applyFontSize(size);
      });
      
      // Camera controls
      document.getElementById('camera-capture-btn').addEventListener('click', () => {
        this.capturePhoto();
      });
      
      document.getElementById('camera-retake-btn').addEventListener('click', () => {
        this.showCameraPreview();
      });
      
      document.getElementById('camera-accept-btn').addEventListener('click', () => {
        this.acceptCapturedPhoto();
      });
      
      document.getElementById('camera-switch-btn').addEventListener('click', () => {
        this.switchCamera();
      });
      
      // Voice controls
      document.getElementById('voice-stop-btn').addEventListener('click', () => {
        Speech.stopSpeechRecognition();
      });
      
      document.getElementById('voice-send-btn').addEventListener('click', () => {
        const transcript = document.getElementById('voice-transcript-text').textContent;
        if (transcript && transcript !== 'Speak now...') {
          this.elements.messageInput.value = transcript;
          this.handleInputChange();
          this.hideModal('voice-modal');
          setTimeout(() => {
            this.handleSendMessage();
          }, 100);
        }
      });
      
      // Export data button
      document.getElementById('export-data-btn').addEventListener('click', () => {
        Storage.exportData();
      });
      
      // Clear all data button
      document.getElementById('clear-all-data-btn').addEventListener('click', () => {
        Utils.showConfirm(
          'Are you sure you want to clear all data? This action cannot be undone.',
          'Clear All Data',
          () => {
            Storage.clearAllData();
            Utils.showToast('All data has been cleared', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        );
      });
      
      // Close modals when clicking outside
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.hideModal(modal.id);
          }
        });
      });
    },
    
    /**
     * Setup resizable textarea for message input
     */
    setupResizableTextarea: function() {
      const textarea = this.elements.messageInput;
      this.state.inputHeight = textarea.scrollHeight;
      
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(150, textarea.scrollHeight) + 'px';
      });
    },
    
    /**
     * Toggle sidebar state
     * @param {boolean} forceCollapse - Force the sidebar to collapse
     */
    toggleSidebar: function(forceCollapse = false) {
      if (forceCollapse) {
        this.elements.appContainer.classList.add('sidebar-collapsed');
        this.state.isSidebarCollapsed = true;
      } else {
        this.elements.appContainer.classList.toggle('sidebar-collapsed');
        this.state.isSidebarCollapsed = this.elements.appContainer.classList.contains('sidebar-collapsed');
      }
      
      // Update icon
      if (this.state.isSidebarCollapsed) {
        this.elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
      } else {
        this.elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
      }
    },
    
    /**
     * Handle changes to the message input
     */
    handleInputChange: function() {
      const text = this.elements.messageInput.value.trim();
      this.updateButtonStates();
      this.updateTokenCount(text);
    },
    
    /**
     * Update enabled/disabled state of buttons
     */
    updateButtonStates: function() {
      const text = this.elements.messageInput.value.trim();
      const hasAttachments = this.state.uploadedFiles.length > 0;
      
      // Enable send button if there's text or attachments
      this.elements.sendButton.disabled = !(text || hasAttachments);
      
      // Update voice button state
      if (this.state.isRecording) {
        this.elements.voiceInputButton.classList.add('active');
      } else {
        this.elements.voiceInputButton.classList.remove('active');
      }
    },
    
    /**
     * Update token count display
     * @param {string} text - Text to count tokens for
     */
    updateTokenCount: function(text) {
      const count = Utils.estimateTokenCount(text);
      this.elements.tokenCount.textContent = count;
      
      // Add warning class if approaching context limit
      if (count > Models.getCurrentContextSize() * 0.8) {
        this.elements.tokenCount.classList.add('warning');
      } else {
        this.elements.tokenCount.classList.remove('warning');
      }
    },
    
    /**
     * Handle sending a message
     */
    handleSendMessage: function() {
      const text = this.elements.messageInput.value.trim();
      if (!text && this.state.uploadedFiles.length === 0) return;
      
      // Send the message
      Chat.sendMessage(text, this.state.uploadedFiles);
      
      // Clear input and files
      this.elements.messageInput.value = '';
      this.elements.messageInput.style.height = 'auto';
      this.state.uploadedFiles = [];
      this.elements.attachmentPreview.innerHTML = '';
      this.updateButtonStates();
      this.updateTokenCount('');
    },
    
    /**
     * Handle file uploads
     * @param {FileList} files - The uploaded files
     */
    handleFileUpload: function(files) {
      if (!files || files.length === 0) return;
      
      Array.from(files).forEach(file => {
        // Check file size
        if (file.size > Config.maxFileSizes.total) {
          Utils.showToast(
            Config.messages.fileTooBig.replace('{size}', Utils.formatFileSize(Config.maxFileSizes.total)),
            'error'
          );
          return;
        }
        
        // Check if we support this file type
        if (!this.isSupportedFileType(file)) {
          Utils.showToast(Config.messages.unsupportedFileType, 'error');
          return;
        }
        
        // Add file to state
        this.state.uploadedFiles.push(file);
        
        // Add file to preview
        this.addFileToPreview(file);
      });
      
      // Clear input so same file can be selected again
      this.elements.fileUpload.value = '';
      this.updateButtonStates();
    },
    
    /**
     * Check if file type is supported
     * @param {File} file - The file to check
     * @returns {boolean} Whether the file type is supported
     */
    isSupportedFileType: function(file) {
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        return true;
      }
      
      // Check if it's a supported document
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      return supportedTypes.includes(file.type);
    },
    
    /**
     * Add file to preview area
     * @param {File} file - The file to preview
     */
    addFileToPreview: function(file) {
      const reader = new FileReader();
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      
      reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
          previewItem.innerHTML = `
            <img src="${e.target.result}" class="preview-image" alt="${file.name}">
            <button class="preview-remove" data-index="${this.state.uploadedFiles.length - 1}">
              <i class="fas fa-times"></i>
            </button>
          `;
        } else {
          // Document icon with filename
          previewItem.innerHTML = `
            <div class="preview-image document-preview">
              <i class="fas fa-file-alt"></i>
              <span>${Utils.truncateString(file.name, 10)}</span>
            </div>
            <button class="preview-remove" data-index="${this.state.uploadedFiles.length - 1}">
              <i class="fas fa-times"></i>
            </button>
          `;
        }
        
        this.elements.attachmentPreview.appendChild(previewItem);
        
        // Add remove button event listener
        previewItem.querySelector('.preview-remove').addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.getAttribute('data-index'));
          this.removeFileFromPreview(index);
        });
      };
      
      reader.readAsDataURL(file);
    },
    
    /**
     * Remove file from preview
     * @param {number} index - Index of file to remove
     */
    removeFileFromPreview: function(index) {
      // Remove file from state
      this.state.uploadedFiles.splice(index, 1);
      
      // Rebuild preview
      this.elements.attachmentPreview.innerHTML = '';
      this.state.uploadedFiles.forEach((file, i) => {
        this.addFileToPreview(file);
      });
      
      this.updateButtonStates();
    },
    
    /**
     * Show a modal dialog
     * @param {string} modalId - ID of the modal to show
     */
    showModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('visible');
      }
    },
    
    /**
     * Hide a modal dialog
     * @param {string} modalId - ID of the modal to hide
     */
    hideModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('visible');
        
        // Stop camera if camera modal is closed
        if (modalId === 'camera-modal') {
          this.stopCamera();
        }
        
        // Stop speech recognition if voice modal is closed
        if (modalId === 'voice-modal') {
          Speech.stopSpeechRecognition();
        }
      }
    },
    
    /**
     * Switch settings tab
     * @param {string} tabName - Name of tab to switch to
     */
    switchSettingsTab: function(tabName) {
      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });
      
      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      document.getElementById(`${tabName}-tab`).classList.add('active');
    },
    
    /**
     * Add a message to the chat
     * @param {Object} message - Message object
     * @param {boolean} isNewMessage - Whether this is a newly sent message
     */
    addMessage: function(message, isNewMessage = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.role}`;
      messageDiv.setAttribute('data-message-id', message.id);
      
      // Create message content
      let avatarIcon = 'fa-robot';
      if (message.role === 'user') {
        avatarIcon = 'fa-user';
      } else if (message.role === 'system') {
        avatarIcon = 'fa-info-circle';
      }
      
      // Format the message text with markdown if it's not a system message
      let messageText = message.content;
      if (message.role !== 'system') {
        messageText = Utils.markdownToHtml(message.content);
      }
      
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <i class="fas ${avatarIcon}"></i>
        </div>
        <div class="message-content">
          <div class="message-text">${messageText}</div>
          ${this.renderAttachments(message.attachments)}
          <div class="message-actions">
            ${message.role === 'assistant' ? `
              <button class="action-icon play-tts-btn" title="Listen to response">
                <i class="fas fa-volume-up"></i>
              </button>
            ` : ''}
            <button class="action-icon copy-btn" title="Copy to clipboard">
              <i class="fas fa-copy"></i>
            </button>
            ${message.role === 'assistant' ? `
              <button class="action-icon regenerate-btn" title="Regenerate response">
                <i class="fas fa-redo"></i>
              </button>
            ` : ''}
          </div>
          <div class="message-timestamp">${Utils.formatDate(message.timestamp, true)}</div>
        </div>
      `;
      
      // Add the message to the container
      this.elements.messageContainer.appendChild(messageDiv);
      
      // Auto-scroll to the new message
      if (isNewMessage) {
        this.scrollToBottom();
      }
      
      // Add event listeners for message actions
      const actionsDiv = messageDiv.querySelector('.message-actions');
      
      // Copy button
      const copyBtn = actionsDiv.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          Utils.copyToClipboard(message.content).then(() => {
            Utils.showToast('Message copied to clipboard', 'success');
          });
        });
      }
      
      // Play TTS button
      const ttsBtn = actionsDiv.querySelector('.play-tts-btn');
      if (ttsBtn) {
        ttsBtn.addEventListener('click', () => {
          Speech.speak(message.content);
        });
      }
      
      // Regenerate button
      const regenerateBtn = actionsDiv.querySelector('.regenerate-btn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
          Chat.regenerateMessage(message.id);
        });
      }
      
      // If this is an assistant message, check if auto-read is enabled
      if (message.role === 'assistant' && isNewMessage) {
        const settings = Storage.getSettings();
        if (settings.autoReadResponses) {
          Speech.speak(message.content);
        }
      }
    },
    
    /**
     * Render attachments for a message
     * @param {Array} attachments - Array of attachment objects
     * @returns {string} HTML for attachments
     */
    renderAttachments: function(attachments) {
      if (!attachments || attachments.length === 0) {
        return '';
      }
      
      let html = '<div class="message-attachments">';
      
      attachments.forEach(attachment => {
        if (attachment.type.startsWith('image/')) {
          html += `
            <img 
              src="${attachment.data}" 
              class="attachment-thumbnail" 
              alt="Attachment" 
              data-attachment-id="${attachment.id}"
            >
          `;
        } else {
          // Document icon
          html += `
            <div class="attachment-doc" data-attachment-id="${attachment.id}">
              <i class="fas fa-file-alt"></i>
              <span>${Utils.truncateString(attachment.name, 15)}</span>
            </div>
          `;
        }
      });
      
      html += '</div>';
      return html;
    },
    
    /**
     * Update the chat history list in the sidebar
     * @param {Array} chats - Array of chat objects
     * @param {string} currentChatId - ID of current chat
     */
    updateChatHistory: function(chats, currentChatId) {
      this.elements.chatHistoryList.innerHTML = '';
      
      if (chats.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.textContent = Config.messages.emptyChatHistory;
        this.elements.chatHistoryList.appendChild(emptyDiv);
        return;
      }
      
      chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (chat.id === currentChatId) {
          chatItem.classList.add('active');
        }
        
        // Get the icon based on chat type or default to message icon
        let icon = 'fa-comment';
        if (chat.type === 'code') icon = 'fa-code';
        if (chat.type === 'document') icon = 'fa-file-alt';
        if (chat.type === 'image') icon = 'fa-image';
        
        chatItem.innerHTML = `
          <div class="chat-item-icon">
            <i class="fas ${icon}"></i>
          </div>
          <div class="chat-item-title">${Utils.truncateString(chat.title, 25)}</div>
        `;
        
        chatItem.addEventListener('click', () => {
          Chat.loadChat(chat.id);
        });
        
        this.elements.chatHistoryList.appendChild(chatItem);
      });
    },
    
    /**
     * Show typing indicator while waiting for AI response
     * @param {boolean} isTyping - Whether the AI is typing
     */
    setTypingIndicator: function(isTyping) {
      this.state.isTyping = isTyping;
      const typingIndicator = document.querySelector('.typing-indicator');
      
      if (isTyping) {
        typingIndicator.classList.add('active');
        this.elements.modelTypingStatus.textContent = 'Typing...';
      } else {
        typingIndicator.classList.remove('active');
        this.elements.modelTypingStatus.textContent = 'Idle';
      }
    },
    
    /**
     * Show welcome screen
     * @param {boolean} show - Whether to show the welcome screen
     */
    toggleWelcomeScreen: function(show) {
      const welcomeScreen = document.querySelector('.welcome-screen');
      
      if (show) {
        // Clear message container except welcome screen
        while (this.elements.messageContainer.firstChild) {
          this.elements.messageContainer.removeChild(this.elements.messageContainer.firstChild);
        }
        
        // Create welcome screen if it doesn't exist
        if (!welcomeScreen) {
          const welcomeDiv = document.createElement('div');
          welcomeDiv.className = 'welcome-screen';
          welcomeDiv.innerHTML = `
            <img src="assets/welcome-illustration.svg" alt="Welcome" class="welcome-image">
            <h2>Welcome to AI Assistant</h2>
            <p>Start a conversation with one of the available AI models</p>
            <div class="quick-prompts">
              ${Config.quickPrompts.map(prompt => `
                <button class="prompt-btn">${prompt}</button>
              `).join('')}
            </div>
          `;
          this.elements.messageContainer.appendChild(welcomeDiv);
          
          // Add event listeners to quick prompt buttons
          welcomeDiv.querySelectorAll('.prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              this.elements.messageInput.value = e.target.textContent;
              this.handleInputChange();
              this.elements.messageInput.focus();
            });
          });
        }
      } else if (welcomeScreen) {
        // Remove welcome screen
        welcomeScreen.remove();
      }
    },
    
    /**
     * Update model info display
     * @param {Object} model - Model object with id and name
     */
    updateModelInfo: function(model) {
      if (!model) {
        this.elements.modelBadge.textContent = 'No Model';
        this.elements.modelStatus.textContent = 'Not Selected';
        this.elements.modelStatus.style.color = 'var(--text-tertiary)';
        this.elements.modelStatus.classList.remove('ready');
        return;
      }
      
      this.elements.modelBadge.textContent = model.name;
      this.elements.modelStatus.textContent = 'Ready';
      this.elements.modelStatus.style.color = 'var(--success-color)';
      this.elements.modelStatus.classList.add('ready');
    },
    
    /**
     * Scroll the message container to the bottom
     */
    scrollToBottom: function() {
      this.elements.messageContainer.scrollTop = this.elements.messageContainer.scrollHeight;
    },
    
    /**
     * Apply a theme to the application
     * @param {string} theme - Theme name
     */
    applyTheme: function(theme) {
      // Remove existing theme classes
      const appContainer = this.elements.appContainer;
      appContainer.classList.remove('theme-default', 'theme-dark', 'theme-light', 'theme-contrast');
      
      // Add new theme class
      appContainer.classList.add(`theme-${theme}`);
      this.state.currentTheme = theme;
      
      // Update theme buttons
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      if (theme === 'light') {
        this.elements.lightThemeButton.classList.add('active');
      } else {
        this.elements.darkThemeButton.classList.add('active');
      }
      
      // Also update theme options in settings
      document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.getAttribute('data-theme') === theme);
      });
    },
    
    /**
     * Apply font size to the application
     * @param {number} size - Font size in pixels
     */
    applyFontSize: function(size) {
      document.documentElement.style.fontSize = `${size}px`;
      this.state.fontSize = size;
      
      // Update font size slider in settings
      const fontSizeSlider = document.getElementById('font-size-slider');
      const fontSizeValue = document.getElementById('font-size-value');
      
      if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.value = size;
        fontSizeValue.textContent = size;
      }
    },
    
    /**
     * Initialize camera for taking photos
     */
    initializeCamera: async function() {
      const cameraContainer = document.getElementById('camera-container');
      const cameraPreview = document.getElementById('camera-preview');
      const previewContainer = document.getElementById('camera-preview-container');
      
      try {
        // Get user media with camera
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
        
        // Show camera preview
        cameraPreview.srcObject = this.cameraStream;
        cameraContainer.style.display = 'block';
        previewContainer.style.display = 'none';
      } catch (error) {
        console.error('Error accessing camera:', error);
        Utils.showToast('Could not access camera. Please ensure camera permissions are granted.', 'error');
        this.hideModal('camera-modal');
      }
    },
    
    /**
     * Switch between front and back cameras
     */
    switchCamera: async function() {
      if (!this.cameraStream) return;
      
      // Get current camera facing mode
      const currentTracks = this.cameraStream.getVideoTracks();
      if (!currentTracks || currentTracks.length === 0) return;
      
      const currentFacingMode = currentTracks[0].getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      
      // Stop current stream
      this.stopCamera();
      
      try {
        // Get new stream with different camera
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newFacingMode }
        });
        
        // Update camera preview
        document.getElementById('camera-preview').srcObject = this.cameraStream;
      } catch (error) {
        console.error('Error switching camera:', error);
        Utils.showToast('Could not switch camera', 'error');
      }
    },
    
    /**
     * Capture photo from camera
     */
    capturePhoto: function() {
      if (!this.cameraStream) return;
      
      const cameraContainer = document.getElementById('camera-container');
      const previewContainer = document.getElementById('camera-preview-container');
      const canvas = document.getElementById('capture-canvas');
      const video = document.getElementById('camera-preview');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Hide camera, show capture preview
      cameraContainer.style.display = 'none';
      previewContainer.style.display = 'block';
    },
    
    /**
     * Show camera preview (for retaking photo)
     */
    showCameraPreview: function() {
      const cameraContainer = document.getElementById('camera-container');
      const previewContainer = document.getElementById('camera-preview-container');
      
      cameraContainer.style.display = 'block';
      previewContainer.style.display = 'none';
    },
    
    /**
     * Accept captured photo
     */
    acceptCapturedPhoto: function() {
      const canvas = document.getElementById('capture-canvas');
      const imageData = canvas.toDataURL('image/jpeg');
      
      // Convert data URL to File object
      const blob = Utils.base64ToBlob(imageData, 'image/jpeg');
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Add the file to uploads
      this.state.uploadedFiles.push(file);
      this.addFileToPreview(file);
      this.updateButtonStates();
      
      // Hide the camera modal
      this.hideModal('camera-modal');
    },
    
    /**
     * Stop camera stream
     */
    stopCamera: function() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
    },
    
    /**
     * Set input feedback message
     * @param {string} message - Feedback message
     * @param {boolean} show - Whether to show the feedback
     */
    setInputFeedback: function(message, show = true) {
      const feedbackDiv = document.getElementById('input-feedback');
      const feedbackMessage = document.getElementById('feedback-message');
      
      if (show && message) {
        feedbackMessage.textContent = message;
        feedbackDiv.classList.add('visible');
      } else {
        feedbackDiv.classList.remove('visible');
      }
    }
  };