/**
 * UI management for the Pepe AI Multitool application
 */

const UI = {
  // Store elements that we'll reference frequently
  elements: {
      appContainer: null,
      sidebar: null,
      sidebarToggle: null,
      messageContainer: null,
      messageInput: null,
      sendButton: null,
      voiceInputButton: null,
      uploadButton: null,
      cameraButton: null,
      fileUpload: null,
      tokenCount: null,
      modelSelector: null,
      modelBadge: null,
      modelStatus: null,
      modelTypingStatus: null,
      attachmentPreview: null,
      chatHistoryList: null,
      newChatButton: null,
      settingsButton: null,
      lightThemeButton: null,
      darkThemeButton: null,
      tabButtons: null,
      tabContents: null
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
      console.log('Initializing UI...');
      
      // Initialize element references
      this.initializeElements();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup tab system
      this.setupTabs();
      
      // Setup resizable textarea
      this.setupResizableTextarea();
      
      // Setup modals
      this.setupModals();
      
      // Apply theme from storage or default to Pepe theme
      const storedSettings = Storage.getSettings();
      this.applyTheme(storedSettings.theme || 'default');
      this.applyFontSize(storedSettings.fontSize || 16);
      
      // Set initial state - collapse sidebar on small screens
      if (window.innerWidth < 768) {
          this.toggleSidebar(true);
      }
      
      console.log('UI initialized successfully');
  },
  
  /**
   * Initialize element references
   */
  initializeElements: function() {
      this.elements.appContainer = document.getElementById('app-container');
      this.elements.sidebar = document.getElementById('sidebar');
      this.elements.sidebarToggle = document.getElementById('sidebar-toggle');
      this.elements.messageContainer = document.getElementById('message-container');
      this.elements.messageInput = document.getElementById('message-input');
      this.elements.sendButton = document.getElementById('send-btn');
      this.elements.voiceInputButton = document.getElementById('voice-input-btn');
      this.elements.uploadButton = document.getElementById('upload-btn');
      this.elements.cameraButton = document.getElementById('camera-btn');
      this.elements.fileUpload = document.getElementById('file-upload');
      this.elements.tokenCount = document.getElementById('token-count');
      this.elements.modelSelector = document.getElementById('model-selector');
      this.elements.modelBadge = document.getElementById('model-badge');
      this.elements.modelStatus = document.getElementById('model-status');
      this.elements.modelTypingStatus = document.getElementById('model-typing-status');
      this.elements.attachmentPreview = document.getElementById('attachment-preview');
      this.elements.chatHistoryList = document.getElementById('chat-history-list');
      this.elements.newChatButton = document.getElementById('new-chat-btn');
      this.elements.settingsButton = document.getElementById('settings-btn');
      this.elements.lightThemeButton = document.getElementById('light-theme-btn');
      this.elements.darkThemeButton = document.getElementById('dark-theme-btn');
      this.elements.tabButtons = document.querySelectorAll('.tab-button');
      this.elements.tabContents = document.querySelectorAll('.tab-content');
      
      // Log any missing elements as warnings
      Object.entries(this.elements).forEach(([key, element]) => {
          if (element === null && key !== 'tabButtons' && key !== 'tabContents') {
              console.warn(`UI element "${key}" not found in DOM`);
          }
      });
  },
  
  /**
 * Setup all event listeners for UI elements
 */
setupEventListeners: function() {
    // Sidebar toggle
    if (this.elements.sidebarToggle) {
        this.elements.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });
    }
    
    // Message input events
    if (this.elements.messageInput) {
        this.elements.messageInput.addEventListener('input', this.handleInputChange.bind(this));
        this.elements.messageInput.addEventListener('keydown', (e) => {
            // Send on Enter (but not with Shift key)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }
    
    // Send button
    if (this.elements.sendButton) {
        this.elements.sendButton.addEventListener('click', this.handleSendMessage.bind(this));
    }
    
    // Voice input button
    if (this.elements.voiceInputButton) {
        this.elements.voiceInputButton.addEventListener('click', () => {
            this.showModal('voice-modal');
            Speech.startSpeechRecognition();
        });
    }
    
    // File upload
    if (this.elements.uploadButton && this.elements.fileUpload) {
        this.elements.uploadButton.addEventListener('click', () => {
            this.elements.fileUpload.click();
        });
        
        this.elements.fileUpload.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }
    
    // Camera button is now handled by the Camera module
    // The event listener is set up in Camera.init()
    
    // New chat button
    if (this.elements.newChatButton) {
        this.elements.newChatButton.addEventListener('click', () => {
            Chat.startNewChat();
        });
    }
    
    // Settings button
    if (this.elements.settingsButton) {
        this.elements.settingsButton.addEventListener('click', () => {
            this.showModal('settings-modal');
            Settings.loadSettings();
        });
    }
    
    // Theme buttons
    if (this.elements.lightThemeButton) {
        this.elements.lightThemeButton.addEventListener('click', () => {
            this.applyTheme('light');
            Storage.updateSettings({ theme: 'light' });
        });
    }
    
    if (this.elements.darkThemeButton) {
        this.elements.darkThemeButton.addEventListener('click', () => {
            this.applyTheme('dark');
            Storage.updateSettings({ theme: 'dark' });
        });
    }
    
    // Model selector
    if (this.elements.modelSelector) {
        this.elements.modelSelector.addEventListener('change', (e) => {
            const modelId = e.target.value;
            Models.selectModel(modelId);
        });
    }
    
    // Quick prompt buttons
    document.querySelectorAll('.prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (this.elements.messageInput) {
                this.elements.messageInput.value = e.target.textContent;
                this.handleInputChange();
                this.elements.messageInput.focus();
            }
        });
    });
    
    // Node menu items
    document.querySelectorAll('.node-menu-item').forEach(item => {
        if (item.dataset.nodeType) {
            item.addEventListener('click', () => {
                if (typeof window.addNode === 'function') {
                    window.addNode(item.dataset.nodeType, document.getElementById('node-canvas'));
                } else {
                    console.warn('addNode function not found');
                    Utils.showToast('Node functionality not available', 'warning');
                }
            });
        }
    });
    
    // Execute all button for node workflow
    const executeAllBtn = document.getElementById('execute-all-btn');
    if (executeAllBtn) {
        executeAllBtn.addEventListener('click', () => {
            if (typeof window.executeRequests === 'function') {
                window.executeRequests();
            } else {
                console.warn('executeRequests function not found');
                Utils.showToast('Node execution functionality not available', 'warning');
            }
        });
    }
    
    // Window resize handling
    window.addEventListener('resize', Utils.debounce(() => {
        // Auto collapse sidebar on small screens
        if (window.innerWidth < 768 && !this.state.isSidebarCollapsed) {
            this.toggleSidebar(true);
        }
    }, 250));
  },
  
  /**
   * Setup tab system
   */
  setupTabs: function() {
      // Set initial active tab
      this.activateTab('chat-tab');
      
      // Add click event listeners to tab buttons
      this.elements.tabButtons.forEach(button => {
          button.addEventListener('click', () => {
              const tabId = button.getAttribute('data-tab');
              this.activateTab(tabId);
          });
      });
      
      // Connect sidebar workflow button to tab
      const workflowBtn = document.getElementById('node-workflow-btn');
      if (workflowBtn) {
          workflowBtn.addEventListener('click', () => {
              this.activateTab('node-workflow-tab');
          });
      }
  },
  
  /**
   * Activate a specific tab
   * @param {string} tabId - ID of tab to activate
   */
  activateTab: function(tabId) {
      // Remove active class from all tab buttons and contents
      this.elements.tabButtons.forEach(btn => {
          btn.classList.remove('active');
      });
      
      this.elements.tabContents.forEach(content => {
          content.classList.remove('active');
      });
      
      // Add active class to selected tab button and content
      const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
      const selectedContent = document.getElementById(tabId);
      
      if (selectedButton) {
          selectedButton.classList.add('active');
      }
      
      if (selectedContent) {
          selectedContent.classList.add('active');
      }
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
      document.querySelectorAll('.modal-tabs .tab-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const tab = e.target.getAttribute('data-tab');
              this.switchSettingsTab(tab);
          });
      });
      
      // Save settings button
      const saveSettingsBtn = document.getElementById('save-settings-btn');
      if (saveSettingsBtn) {
          saveSettingsBtn.addEventListener('click', () => {
              Settings.saveSettings();
              this.hideModal('settings-modal');
          });
      }
      
      // Theme options
      document.querySelectorAll('.theme-option').forEach(option => {
          option.addEventListener('click', () => {
              const theme = option.getAttribute('data-theme');
              this.applyTheme(theme);
              Storage.updateSettings({ theme });
              
              // Update active state
              document.querySelectorAll('.theme-option').forEach(opt => {
                  opt.classList.toggle('active', opt === option);
              });
          });
      });
      
      // Font size slider
      const fontSizeSlider = document.getElementById('font-size-slider');
      const fontSizeValue = document.getElementById('font-size-value');
      
      if (fontSizeSlider && fontSizeValue) {
          fontSizeSlider.addEventListener('input', (e) => {
              const size = parseInt(e.target.value);
              fontSizeValue.textContent = size;
              this.applyFontSize(size);
          });
      }
      
      // Camera controls are now handled by the Camera module
      // These event listeners are set up in Camera.initializeCamera()
      
      // Voice controls
      const voiceStopBtn = document.getElementById('voice-stop-btn');
      const voiceSendBtn = document.getElementById('voice-send-btn');
      
      if (voiceStopBtn) {
          voiceStopBtn.addEventListener('click', () => {
              Speech.stopSpeechRecognition();
          });
      }
      
      if (voiceSendBtn) {
          voiceSendBtn.addEventListener('click', () => {
              const transcript = document.getElementById('voice-transcript-text');
              if (transcript && transcript.textContent && transcript.textContent !== 'Speak now...') {
                  this.elements.messageInput.value = transcript.textContent;
                  this.handleInputChange();
                  this.hideModal('voice-modal');
                  setTimeout(() => {
                      this.handleSendMessage();
                  }, 100);
              }
          });
      }
      
      // Export data button
      const exportDataBtn = document.getElementById('export-data-btn');
      if (exportDataBtn) {
          exportDataBtn.addEventListener('click', () => {
              Storage.exportData();
          });
      }
      
      // Clear all data button
      const clearAllDataBtn = document.getElementById('clear-all-data-btn');
      if (clearAllDataBtn) {
          clearAllDataBtn.addEventListener('click', () => {
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
      }
      
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
      if (!textarea) return;
      
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
      if (!this.elements.appContainer) return;
      
      if (forceCollapse) {
          this.elements.appContainer.classList.add('sidebar-collapsed');
          this.state.isSidebarCollapsed = true;
      } else {
          this.elements.appContainer.classList.toggle('sidebar-collapsed');
          this.state.isSidebarCollapsed = this.elements.appContainer.classList.contains('sidebar-collapsed');
      }
      
      // Update icon
      if (this.elements.sidebarToggle) {
          if (this.state.isSidebarCollapsed) {
              this.elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
          } else {
              this.elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
          }
      }
  },
  
  /**
   * Handle changes to the message input
   */
  handleInputChange: function() {
      if (!this.elements.messageInput) return;
      
      const text = this.elements.messageInput.value.trim();
      this.updateButtonStates();
      this.updateTokenCount(text);
  },
  
  /**
   * Update enabled/disabled state of buttons
   */
  updateButtonStates: function() {
      if (!this.elements.messageInput || !this.elements.sendButton) return;
      
      const text = this.elements.messageInput.value.trim();
      const hasAttachments = this.state.uploadedFiles.length > 0;
      
      // Enable send button if there's text or attachments
      this.elements.sendButton.disabled = !(text || hasAttachments);
      
      // Update voice button state
      if (this.elements.voiceInputButton) {
          if (this.state.isRecording) {
              this.elements.voiceInputButton.classList.add('active');
          } else {
              this.elements.voiceInputButton.classList.remove('active');
          }
      }
  },
  
  /**
   * Update token count display
   * @param {string} text - Text to count tokens for
   */
  updateTokenCount: function(text) {
      if (!this.elements.tokenCount) return;
      
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
      if (!this.elements.messageInput) return;
      
      const text = this.elements.messageInput.value.trim();
      if (!text && this.state.uploadedFiles.length === 0) return;
      
      // Send the message
      Chat.sendMessage(text, this.state.uploadedFiles);
      
      // Clear input and files
      this.elements.messageInput.value = '';
      this.elements.messageInput.style.height = 'auto';
      this.state.uploadedFiles = [];
      
      if (this.elements.attachmentPreview) {
          this.elements.attachmentPreview.innerHTML = '';
      }
      
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
      if (this.elements.fileUpload) {
          this.elements.fileUpload.value = '';
      }
      
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
      if (!this.elements.attachmentPreview) return;
      
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
      if (this.elements.attachmentPreview) {
          this.elements.attachmentPreview.innerHTML = '';
          this.state.uploadedFiles.forEach((file, i) => {
              this.addFileToPreview(file);
          });
      }
      
      this.updateButtonStates();
  },
  
  /**
   * Show a modal dialog
   * @param {string} modalId - ID of the modal to show
   */
  showModal: function(modalId) {
      // Delegate to the Utils showModal function
      Utils.showModal(modalId);
  },
  
  /**
   * Hide a modal dialog
   * @param {string} modalId - ID of the modal to hide
   */
  hideModal: function(modalId) {
      // Delegate to the Utils hideModal function
      Utils.hideModal(modalId);
      
      // Additional cleanup for special modals
      if (modalId === 'voice-modal') {
          Speech.stopSpeechRecognition();
      }
  },
  
  /**
   * Switch settings tab
   * @param {string} tabName - Name of tab to switch to
   */
  switchSettingsTab: function(tabName) {
      // Update tab buttons
      document.querySelectorAll('.modal-tabs .tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });
      
      // Update tab content
      document.querySelectorAll('.modal-body .tab-content').forEach(content => {
          content.classList.remove('active');
      });
      
      const tabContent = document.getElementById(`${tabName}-tab`);
      if (tabContent) {
          tabContent.classList.add('active');
      }
  },
  
  /**
   * Add a message to the chat
   * @param {Object} message - Message object
   * @param {boolean} isNewMessage - Whether this is a newly sent message
   */
  addMessage: function(message, isNewMessage = false) {
      if (!this.elements.messageContainer) return;
      
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
      
      if (actionsDiv) {
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
      if (!this.elements.chatHistoryList) return;
      
      this.elements.chatHistoryList.innerHTML = '';
      
      if (!chats || chats.length === 0) {
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
      if (!typingIndicator) return;
      
      if (isTyping) {
          typingIndicator.classList.add('active');
          if (this.elements.modelTypingStatus) {
              this.elements.modelTypingStatus.textContent = 'Typing...';
          }
      } else {
          typingIndicator.classList.remove('active');
          if (this.elements.modelTypingStatus) {
              this.elements.modelTypingStatus.textContent = 'Idle';
          }
      }
  },
  
  /**
   * Show welcome screen
   * @param {boolean} show - Whether to show the welcome screen
   */
  toggleWelcomeScreen: function(show) {
      if (!this.elements.messageContainer) return;
      
      const welcomeScreen = this.elements.messageContainer.querySelector('.welcome-screen');
      
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
                  <h2>Welcome to Pepe AI Multitool</h2>
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
                      if (this.elements.messageInput) {
                          this.elements.messageInput.value = e.target.textContent;
                          this.handleInputChange();
                          this.elements.messageInput.focus();
                      }
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
      if (!this.elements.modelBadge || !this.elements.modelStatus) return;
      
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
      if (this.elements.messageContainer) {
          this.elements.messageContainer.scrollTop = this.elements.messageContainer.scrollHeight;
      }
  },
  
  /**
   * Apply a theme to the application
   * @param {string} theme - Theme name
   */
  applyTheme: function(theme) {
      if (!this.elements.appContainer) return;
      
      console.log(`Applying theme: ${theme}`);
      
      // Remove existing theme classes
      this.elements.appContainer.classList.remove('theme-default', 'theme-dark', 'theme-light', 'theme-contrast');
      
      // Add new theme class
      this.elements.appContainer.classList.add(`theme-${theme}`);
      this.state.currentTheme = theme;
      
      // Update theme buttons
      if (this.elements.lightThemeButton && this.elements.darkThemeButton) {
          this.elements.lightThemeButton.classList.remove('active');
          this.elements.darkThemeButton.classList.remove('active');
          
          if (theme === 'light') {
              this.elements.lightThemeButton.classList.add('active');
          } else if (theme === 'dark') {
              this.elements.darkThemeButton.classList.add('active');
          }
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
   * Stop camera stream - kept for backward compatibility
   * @deprecated Use Camera.stopCameraStream() instead
   */
  stopCamera: function() {
      if (typeof Camera !== 'undefined' && Camera.stopCameraStream) {
          Camera.stopCameraStream();
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
      
      if (!feedbackDiv || !feedbackMessage) return;
      
      if (show && message) {
          feedbackMessage.textContent = message;
          feedbackDiv.classList.add('visible');
      } else {
          feedbackDiv.classList.remove('visible');
      }
  }
};

// Initialize UI when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  UI.init();
});