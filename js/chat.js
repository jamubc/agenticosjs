/**
 * Chat functionality for the AI Assistant application
 */

const Chat = {
    // Store chat state
    currentChat: null,
    
    /**
     * Initialize chat functionality
     */
    init: function() {
      // Load any existing chat or show welcome screen
      const currentChatId = Storage.getCurrentChatId();
      
      if (currentChatId) {
        this.loadChat(currentChatId);
      } else {
        UI.toggleWelcomeScreen(true);
      }
    },
    
    /**a
     * Start a new chat
     * @param {Array} initialMessages - Optional initial messages
     */
    startNewChat: function(initialMessages = []) {
      // Create new chat object
      this.currentChat = {
        id: Utils.generateId(),
        title: 'New Chat',
        type: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: initialMessages
      };
      
      // Save to storage
      Storage.saveChat(this.currentChat);
      
      // Update UI
      UI.toggleWelcomeScreen(false);
      this.renderMessages();
      
      // Update chat history in sidebar
      UI.updateChatHistory(Storage.getChats(), this.currentChat.id);
    },
    
    /**
     * Load a chat
     * @param {string} chatId - ID of chat to load
     */
    loadChat: function(chatId) {
      const chat = Storage.getChat(chatId);
      
      if (!chat) {
        console.error('Chat not found:', chatId);
        return;
      }
      
      this.currentChat = chat;
      Storage.setCurrentChatId(chatId);
      
      // Update UI
      UI.toggleWelcomeScreen(false);
      this.renderMessages();
      
      // Update chat history in sidebar
      UI.updateChatHistory(Storage.getChats(), chatId);
    },
    
    /**
     * Render all messages in the current chat
     */
    renderMessages: function() {
      // Clear message container
      const messageContainer = document.getElementById('message-container');
      messageContainer.innerHTML = '';
      
      // Add each message
      if (this.currentChat && this.currentChat.messages) {
        this.currentChat.messages.forEach(message => {
          // Skip system messages unless they're the only message
          if (message.role === 'system' && this.currentChat.messages.length > 1) {
            return;
          }
          
          UI.addMessage(message);
        });
      }
    },
    
    /**
     * Send a message
     * @param {string} text - Message text
     * @param {Array} files - Array of files to attach
     */
    sendMessage: async function(text, files = []) {
      // If no chat is active, start a new one
      if (!this.currentChat) {
        this.startNewChat();
      }
      
      // Check if a model is selected
      if (!Models.currentModel) {
        Utils.showToast('Please select an AI model first', 'warning');
        return;
      }
      
      // Process files for attachments
      const attachments = await this.processAttachments(files);
      
      // Create user message
      const userMessage = {
        id: Utils.generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        attachments: attachments
      };
      
      // Add to chat and update UI
      this.currentChat.messages.push(userMessage);
      UI.addMessage(userMessage, true);
      
      // Save chat after user message
      this.updateChatMetadata();
      Storage.saveChat(this.currentChat);
      
      // Send to AI and get response
      try {
        // Show typing indicator
        UI.setTypingIndicator(true);
        
        // Get all messages to send to AI, filtering out attachments info
        const messages = this.currentChat.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Generate AI response
        const response = await Models.sendRequest(messages);
        
        // Create assistant message
        const assistantMessage = {
          id: Utils.generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        
        // Add to chat and update UI
        this.currentChat.messages.push(assistantMessage);
        UI.addMessage(assistantMessage, true);
        
        // Update chat metadata and save
        this.updateChatMetadata();
        Storage.saveChat(this.currentChat);
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Add error message
        UI.addMessage({
          id: Utils.generateId(),
          role: 'system',
          content: `Error: ${error.message || 'Failed to get response from AI'}`,
          timestamp: new Date()
        }, true);
        
        // Show error toast
        Utils.showToast('Failed to get response from AI', 'error');
      } finally {
        // Hide typing indicator
        UI.setTypingIndicator(false);
      }
    },
    
    /**
     * Process attachments before sending
     * @param {Array} files - Array of files
     * @returns {Promise<Array>} Processed attachments
     */
    processAttachments: async function(files) {
      if (!files || files.length === 0) return [];
      
      const attachments = [];
      
      for (const file of files) {
        try {
          // For now, we'll just convert to data URLs
          // In a real app, you might want to upload to server or cloud storage
          const dataUrl = await this.fileToDataUrl(file);
          
          attachments.push({
            id: Utils.generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl
          });
        } catch (error) {
          console.error('Error processing attachment:', error);
        }
      }
      
      return attachments;
    },
    
    /**
     * Convert file to data URL
     * @param {File} file - File to convert
     * @returns {Promise<string>} Data URL
     */
    fileToDataUrl: function(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        
        reader.readAsDataURL(file);
      });
    },
    
    /**
     * Regenerate the last assistant message
     * @param {string} messageId - ID of message to regenerate
     */
    regenerateMessage: async function(messageId) {
      if (!this.currentChat || !this.currentChat.messages) return;
      
      // Find the message
      const index = this.currentChat.messages.findIndex(msg => msg.id === messageId);
      if (index === -1 || this.currentChat.messages[index].role !== 'assistant') return;
      
      // Remove this and any subsequent messages
      const messages = this.currentChat.messages.slice(0, index);
      this.currentChat.messages = messages;
      
      // Update UI
      this.renderMessages();
      
      // Save chat
      this.updateChatMetadata();
      Storage.saveChat(this.currentChat);
      
      // Now get new response (similar to sendMessage)
      try {
        // Show typing indicator
        UI.setTypingIndicator(true);
        
        // Get messages to send to AI
        const aiMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Generate AI response
        const response = await Models.sendRequest(aiMessages);
        
        // Create assistant message
        const assistantMessage = {
          id: Utils.generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        
        // Add to chat and update UI
        this.currentChat.messages.push(assistantMessage);
        UI.addMessage(assistantMessage, true);
        
        // Update chat metadata and save
        this.updateChatMetadata();
        Storage.saveChat(this.currentChat);
      } catch (error) {
        console.error('Error regenerating response:', error);
        
        // Add error message
        UI.addMessage({
          id: Utils.generateId(),
          role: 'system',
          content: `Error: ${error.message || 'Failed to get response from AI'}`,
          timestamp: new Date()
        }, true);
        
        // Show error toast
        Utils.showToast('Failed to regenerate response', 'error');
      } finally {
        // Hide typing indicator
        UI.setTypingIndicator(false);
      }
    },
    
    /**
     * Update chat metadata
     */
    updateChatMetadata: function() {
      if (!this.currentChat) return;
      
      // Update timestamp
      this.currentChat.updatedAt = new Date();
      
      // Update title from first user message if needed
      if (this.currentChat.title === 'New Chat') {
        const firstUserMessage = this.currentChat.messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
          this.currentChat.title = Utils.truncateString(firstUserMessage.content, 40);
        }
      }
      
      // Update chat type based on content
      this.updateChatType();
    },
    
    /**
     * Update chat type based on content
     */
    updateChatType: function() {
      if (!this.currentChat || !this.currentChat.messages) return;
      
      // Default to general
      let type = 'general';
      
      // Check for code content
      const hasCodeContent = this.currentChat.messages.some(msg => {
        return msg.content && msg.content.includes('```');
      });
      
      // Check for image content
      const hasImageContent = this.currentChat.messages.some(msg => {
        return msg.attachments && msg.attachments.some(att => att.type.startsWith('image/'));
      });
      
      // Check for document content
      const hasDocumentContent = this.currentChat.messages.some(msg => {
        return msg.attachments && msg.attachments.some(att => !att.type.startsWith('image/'));
      });
      
      // Set type based on content
      if (hasCodeContent) type = 'code';
      else if (hasImageContent) type = 'image';
      else if (hasDocumentContent) type = 'document';
      
      this.currentChat.type = type;
    },
    
    /**
     * Delete the current chat
     */
    deleteCurrentChat: function() {
      if (!this.currentChat) return;
      
      Utils.showConfirm(
        'Are you sure you want to delete this chat?',
        'Delete Chat',
        () => {
          const chatId = this.currentChat.id;
          
          // Delete from storage
          if (Storage.deleteChat(chatId)) {
            // Clear current chat
            this.currentChat = null;
            
            // Update chat history
            UI.updateChatHistory(Storage.getChats());
            
            // Show welcome screen
            UI.toggleWelcomeScreen(true);
            
            Utils.showToast('Chat deleted', 'success');
          } else {
            Utils.showToast('Failed to delete chat', 'error');
          }
        }
      );
    },
    
    /**
     * Export current chat as markdown
     */
    exportChatAsMarkdown: function() {
      if (!this.currentChat || !this.currentChat.messages) {
        Utils.showToast('No chat to export', 'warning');
        return;
      }
      
      let markdown = `# ${this.currentChat.title}\n\n`;
      markdown += `_Exported on ${new Date().toLocaleString()}_\n\n`;
      
      this.currentChat.messages.forEach(message => {
        if (message.role === 'system') return;
        
        const role = message.role === 'user' ? 'User' : 'Assistant';
        const timestamp = new Date(message.timestamp).toLocaleString();
        
        markdown += `## ${role} - ${timestamp}\n\n`;
        markdown += `${message.content}\n\n`;
        
        // Add info about attachments
        if (message.attachments && message.attachments.length > 0) {
          markdown += `*Attachments: ${message.attachments.length} file(s)*\n\n`;
        }
        
        markdown += '---\n\n';
      });
      
      // Download as file
      const filename = `chat_export_${this.currentChat.id}.md`;
      Utils.downloadContent(markdown, filename, 'text/markdown');
      
      Utils.showToast('Chat exported as Markdown', 'success');
    }
  };