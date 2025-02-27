/**
 * Storage management for the AI Assistant application
 */

const Storage = {
    // Store encryption key
    encryptionKey: null,
    
    /**
     * Initialize storage
     */
    init: function() {
      // Set up encryption key
      this.encryptionKey = localStorage.getItem(Config.storage.encryptionKey);
      if (!this.encryptionKey) {
        this.encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        localStorage.setItem(Config.storage.encryptionKey, this.encryptionKey);
      }
      
      // Initialize settings if needed
      if (!localStorage.getItem(Config.storage.settings)) {
        this.saveSettings(Config.defaultSettings);
      }
    },
    
    /**
     * Save application settings
     * @param {Object} settings - Settings object
     */
    saveSettings: function(settings) {
      localStorage.setItem(Config.storage.settings, JSON.stringify(settings));
    },
    
    /**
     * Get application settings
     * @returns {Object} Settings object
     */
    getSettings: function() {
      const settings = localStorage.getItem(Config.storage.settings);
      return settings ? JSON.parse(settings) : Config.defaultSettings;
    },
    
    /**
     * Update specific settings
     * @param {Object} newSettings - New settings to merge
     * @returns {Object} Updated settings object
     */
    updateSettings: function(newSettings) {
      const settings = this.getSettings();
      const updatedSettings = { ...settings, ...newSettings };
      this.saveSettings(updatedSettings);
      return updatedSettings;
    },
    
    /**
     * Save a chat to storage
     * @param {Object} chat - Chat object
     */
    saveChat: function(chat) {
      let chats = this.getChats();
      const existingIndex = chats.findIndex(c => c.id === chat.id);
      
      if (existingIndex >= 0) {
        chats[existingIndex] = chat;
      } else {
        chats.push(chat);
      }
      
      localStorage.setItem(Config.storage.chats, JSON.stringify(chats));
      localStorage.setItem(Config.storage.currentChatId, chat.id);
    },
    
    /**
     * Get all chats from storage
     * @returns {Array} Array of chat objects
     */
    getChats: function() {
      const chats = localStorage.getItem(Config.storage.chats);
      return chats ? JSON.parse(chats) : [];
    },
    
    /**
     * Get a specific chat by ID
     * @param {string} chatId - Chat ID
     * @returns {Object|null} Chat object or null if not found
     */
    getChat: function(chatId) {
      const chats = this.getChats();
      return chats.find(chat => chat.id === chatId) || null;
    },
    
    /**
     * Delete a chat
     * @param {string} chatId - Chat ID
     * @returns {boolean} Success status
     */
    deleteChat: function(chatId) {
      let chats = this.getChats();
      const initialLength = chats.length;
      chats = chats.filter(chat => chat.id !== chatId);
      
      localStorage.setItem(Config.storage.chats, JSON.stringify(chats));
      
      // If current chat is deleted, clear current chat ID
      if (this.getCurrentChatId() === chatId) {
        localStorage.removeItem(Config.storage.currentChatId);
      }
      
      return chats.length < initialLength;
    },
    
    /**
     * Get current chat ID
     * @returns {string|null} Current chat ID or null
     */
    getCurrentChatId: function() {
      return localStorage.getItem(Config.storage.currentChatId);
    },
    
    /**
     * Set current chat ID
     * @param {string} chatId - Chat ID
     */
    setCurrentChatId: function(chatId) {
      localStorage.setItem(Config.storage.currentChatId, chatId);
    },
    
    /**
     * Save an AI integration
     * @param {Object} integration - Integration object
     */
    saveIntegration: function(integration) {
      let integrations = this.getIntegrations();
      const existingIndex = integrations.findIndex(i => i.id === integration.id);
      
      // Encrypt sensitive fields
      const encryptedIntegration = { ...integration };
      for (const field of Object.keys(encryptedIntegration)) {
        if (field.includes('api_key') || field.includes('token') || field.includes('secret')) {
          encryptedIntegration[field] = Utils.encrypt(encryptedIntegration[field], this.encryptionKey);
        }
      }
      
      if (existingIndex >= 0) {
        integrations[existingIndex] = encryptedIntegration;
      } else {
        integrations.push(encryptedIntegration);
      }
      
      localStorage.setItem(Config.storage.integrations, JSON.stringify(integrations));
    },
    
    /**
     * Get all AI integrations
     * @returns {Array} Array of integration objects
     */
    getIntegrations: function() {
      const integrations = localStorage.getItem(Config.storage.integrations);
      return integrations ? JSON.parse(integrations) : [];
    },
    
    /**
     * Get a specific integration
     * @param {string} integrationId - Integration ID
     * @returns {Object|null} Integration object or null
     */
    getIntegration: function(integrationId) {
      const integrations = this.getIntegrations();
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) return null;
      
      // Decrypt sensitive fields
      const decryptedIntegration = { ...integration };
      for (const field of Object.keys(decryptedIntegration)) {
        if (field.includes('api_key') || field.includes('token') || field.includes('secret')) {
          try {
            decryptedIntegration[field] = Utils.decrypt(decryptedIntegration[field], this.encryptionKey);
          } catch (error) {
            console.error('Failed to decrypt field:', field, error);
            decryptedIntegration[field] = '';
          }
        }
      }
      
      return decryptedIntegration;
    },
    
    /**
     * Delete an integration
     * @param {string} integrationId - Integration ID
     * @returns {boolean} Success status
     */
    deleteIntegration: function(integrationId) {
      let integrations = this.getIntegrations();
      const initialLength = integrations.length;
      integrations = integrations.filter(i => i.id !== integrationId);
      
      localStorage.setItem(Config.storage.integrations, JSON.stringify(integrations));
      
      return integrations.length < initialLength;
    },
    
    /**
     * Export all data as JSON
     */
    exportData: function() {
      // Decrypt sensitive data for export
      const decryptedIntegrations = this.getIntegrations().map(integration => {
        const decrypted = { ...integration };
        for (const field of Object.keys(decrypted)) {
          if (field.includes('api_key') || field.includes('token') || field.includes('secret')) {
            try {
              decrypted[field] = Utils.decrypt(decrypted[field], this.encryptionKey);
            } catch (error) {
              decrypted[field] = '';
            }
          }
        }
        return decrypted;
      });
      
      const data = {
        settings: this.getSettings(),
        integrations: decryptedIntegrations,
        chats: this.getChats()
      };
      
      // Create and download the file
      const json = JSON.stringify(data, null, 2);
      const filename = `ai_assistant_export_${new Date().toISOString().slice(0, 10)}.json`;
      Utils.downloadContent(json, filename, 'application/json');
    },
    
    /**
     * Import data from JSON
     * @param {string} json - JSON data to import
     * @returns {Object} Import results
     */
    importData: function(json) {
      try {
        const data = JSON.parse(json);
        let results = {
          settings: false,
          integrations: 0,
          chats: 0
        };
        
        // Import settings
        if (data.settings) {
          this.saveSettings(data.settings);
          results.settings = true;
        }
        
        // Import integrations
        if (data.integrations && Array.isArray(data.integrations)) {
          data.integrations.forEach(integration => {
            // Re-encrypt sensitive fields
            const encryptedIntegration = { ...integration };
            for (const field of Object.keys(encryptedIntegration)) {
              if (field.includes('api_key') || field.includes('token') || field.includes('secret')) {
                encryptedIntegration[field] = Utils.encrypt(encryptedIntegration[field], this.encryptionKey);
              }
            }
            
            let integrations = this.getIntegrations();
            const existingIndex = integrations.findIndex(i => i.id === integration.id);
            
            if (existingIndex >= 0) {
              integrations[existingIndex] = encryptedIntegration;
            } else {
              integrations.push(encryptedIntegration);
              results.integrations++;
            }
            
            localStorage.setItem(Config.storage.integrations, JSON.stringify(integrations));
          });
        }
        
        // Import chats
        if (data.chats && Array.isArray(data.chats)) {
          data.chats.forEach(chat => {
            let chats = this.getChats();
            const existingIndex = chats.findIndex(c => c.id === chat.id);
            
            if (existingIndex >= 0) {
              chats[existingIndex] = chat;
            } else {
              chats.push(chat);
              results.chats++;
            }
            
            localStorage.setItem(Config.storage.chats, JSON.stringify(chats));
          });
        }
        
        return results;
      } catch (error) {
        console.error('Error importing data:', error);
        throw new Error('Invalid data format');
      }
    },
    
    /**
     * Clear all data from storage
     */
    clearAllData: function() {
      // Keep encryption key for backwards compatibility
      const key = this.encryptionKey;
      
      localStorage.clear();
      
      // Restore encryption key
      localStorage.setItem(Config.storage.encryptionKey, key);
      
      // Restore default settings
      this.saveSettings(Config.defaultSettings);
    }
  };