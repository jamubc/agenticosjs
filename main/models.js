/**
 * AI model management for the Pepe AI Multitool application
 */

const Models = {
  // Store available providers, models, and current selections
  providers: {},
  availableModels: [],
  currentProvider: null,
  currentModel: null,
  
  /**
   * Initialize models
   */
  init: function() {
      console.log('Initializing Models module...');
      
      // Load all integrations and providers
      this.loadProviders();
      
      // Populate provider dropdown
      this.populateProviderTypes();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('Models module initialized');
  },
  
  /**
   * Setup event listeners for model management
   */
  setupEventListeners: function() {
      // Model selector
      const modelSelector = document.getElementById('model-selector');
      if (modelSelector) {
          modelSelector.addEventListener('change', (e) => {
              this.selectModel(e.target.value);
          });
      }
      
      // Add integration button
      const addIntegrationBtn = document.getElementById('add-integration-btn');
      if (addIntegrationBtn) {
          addIntegrationBtn.addEventListener('click', this.addIntegration.bind(this));
      }
      
      // Integration type dropdown
      const integrationType = document.getElementById('integration-type');
      if (integrationType) {
          integrationType.addEventListener('change', this.handleProviderTypeChange.bind(this));
      }
  },
  
  /**
   * Populate provider type dropdown
   */
  populateProviderTypes: function() {
      const dropdown = document.getElementById('integration-type');
      if (!dropdown) return;
      
      // Clear existing options
      dropdown.innerHTML = '<option value="" selected disabled>Select provider</option>';
      
      // Add provider types from config
      if (typeof Config !== 'undefined' && Config.providers) {
          Object.keys(Config.providers).forEach(type => {
              const option = document.createElement('option');
              option.value = type;
              option.textContent = Config.providers[type].displayName || type;
              dropdown.appendChild(option);
          });
      }
  },
  
  /**
   * Load providers from integrations
   */
  loadProviders: function() {
      this.providers = {};
      
      // Get all integrations from storage
      const integrations = Storage.getIntegrations();
      
      // Group by provider type
      integrations.forEach(integration => {
          if (!this.providers[integration.type]) {
              this.providers[integration.type] = [];
          }
          
          this.providers[integration.type].push(integration);
      });
      
      // Update models selector
      this.updateModelSelector();
      
      console.log('Providers loaded:', Object.keys(this.providers));
  },
  
  /**
   * Update model selector dropdown
   */
  updateModelSelector: function() {
      const selector = document.getElementById('model-selector');
      if (!selector) {
          console.warn('Model selector not found');
          return;
      }
      
      selector.innerHTML = '';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select AI Model';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      selector.appendChild(defaultOption);
      
      // Reset available models
      this.availableModels = [];
      
      // Add provider groups and models
      Object.keys(this.providers).forEach(providerType => {
          const providers = this.providers[providerType];
          const displayName = Config?.providers[providerType]?.displayName || providerType;
          
          // Create optgroup for provider type
          const group = document.createElement('optgroup');
          group.label = displayName;
          
          // Add models for each integration of this type
          providers.forEach(provider => {
              // Determine available models for this provider
              let models = [];
              
              // For custom providers, they define their own models
              if (providerType === 'custom' && provider.model) {
                  models = [{ id: provider.model, name: provider.model }];
              } else {
                  // Use default models for standard providers
                  models = Config?.providers[providerType]?.defaultModels || [];
              }
              
              models.forEach(model => {
                  const option = document.createElement('option');
                  const modelId = `${provider.id}:${model.id}`;
                  option.value = modelId;
                  option.textContent = `${provider.name} - ${model.name}`;
                  
                  // Store model info for later use
                  this.availableModels.push({
                      id: modelId,
                      name: `${model.name} (${provider.name})`,
                      modelId: model.id,
                      providerId: provider.id,
                      providerType: providerType
                  });
                  
                  group.appendChild(option);
              });
          });
          
          // Only add group if it has models
          if (group.children.length > 0) {
              selector.appendChild(group);
          }
      });
      
      // Check if we have any models
      if (this.availableModels.length === 0) {
          const noModelsOption = document.createElement('option');
          noModelsOption.value = '';
          noModelsOption.textContent = 'No AI models available';
          noModelsOption.disabled = true;
          selector.appendChild(noModelsOption);
      }
      
      console.log(`Model selector updated with ${this.availableModels.length} models`);
  },
  
  /**
   * Select a model
   * @param {string} modelId - ID of model to select (providerId:modelId)
   */
  selectModel: function(modelId) {
      if (!modelId) {
          this.currentModel = null;
          this.currentProvider = null;
          if (typeof UI !== 'undefined' && UI.updateModelInfo) {
              UI.updateModelInfo(null);
          }
          return;
      }
      
      // Find the model in available models
      const model = this.availableModels.find(m => m.id === modelId);
      
      if (!model) {
          console.error('Model not found:', modelId);
          return;
      }
      
      // Set current model and provider
      this.currentModel = model;
      this.currentProvider = Storage.getIntegration(model.providerId);
      
      console.log(`Selected model: ${model.name}`);
      
      // Update UI
      if (typeof UI !== 'undefined' && UI.updateModelInfo) {
          UI.updateModelInfo(model);
      }
      
      // Add system message to explain this model's capabilities if starting a new chat
      if (typeof Chat !== 'undefined' && (!Chat.currentChat || Chat.currentChat.messages.length === 0)) {
          if (typeof UI !== 'undefined') {
              UI.toggleWelcomeScreen(false);
          }
          
          const systemMessage = {
              id: Utils.generateId(),
              role: 'system',
              content: this.getSystemPromptForModel(model.modelId),
              timestamp: new Date()
          };
          
          // Start a new chat with this message
          if (typeof Chat !== 'undefined' && Chat.startNewChat) {
              Chat.startNewChat([systemMessage]);
          }
      }
  },
  
  /**
   * Get appropriate system prompt for a model
   * @param {string} modelId - Model ID
   * @returns {string} System prompt
   */
  getSystemPromptForModel: function(modelId) {
      if (!Config) return "You are a helpful assistant.";
      
      // Determine the type of model and return appropriate prompt
      if (modelId.includes('gpt') || modelId.includes('claude') || modelId.includes('gemini')) {
          return Config.defaultPrompts.general;
      }
      
      if (modelId.includes('code') || modelId.includes('cursor')) {
          return Config.defaultPrompts.codeAssistant;
      }
      
      // Default to general prompt
      return Config.defaultPrompts.general;
  },
  
  /**
   * Get context size for the current model
   * @returns {number} Context size in tokens
   */
  getCurrentContextSize: function() {
      if (!this.currentModel || !Config) return 16000; // Default context size
      
      // Look up context size for this model
      return Config.contextSizes[this.currentModel.modelId] || Config.contextSizes.default;
  },
  
  /**
   * Handle provider type change in settings
   */
  handleProviderTypeChange: function() {
      const type = document.getElementById('integration-type').value;
      const fieldsContainer = document.getElementById('integration-fields');
      
      if (!fieldsContainer) return;
      
      // Clear fields
      fieldsContainer.innerHTML = '';
      
      if (!type || !Config?.providers[type]) return;
      
      // Create form fields for this provider type
      Config.providers[type].fields.forEach(field => {
          const fieldGroup = document.createElement('div');
          fieldGroup.className = 'form-group';
          
          const label = document.createElement('label');
          label.textContent = field.label;
          
          const input = document.createElement('input');
          input.type = field.type;
          input.id = `field-${field.name}`;
          input.name = field.name;
          input.required = field.required;
          
          fieldGroup.appendChild(label);
          fieldGroup.appendChild(input);
          
          if (field.help) {
              const helpText = document.createElement('p');
              helpText.className = 'form-help';
              helpText.textContent = field.help;
              fieldGroup.appendChild(helpText);
          }
          
          fieldsContainer.appendChild(fieldGroup);
      });
  },
  
  /**
   * Add a new integration
   */
  addIntegration: function() {
      const name = document.getElementById('integration-name')?.value;
      const type = document.getElementById('integration-type')?.value;
      const rotateKeys = document.getElementById('integration-rotate-keys')?.checked;
      
      if (!name || !type) {
          Utils.showToast('Please provide a name and select a provider type', 'warning');
          return;
      }
      
      if (!Config?.providers[type]) {
          Utils.showToast('Invalid provider type', 'error');
          return;
      }
      
      // Create integration object
      const integration = {
          id: Utils.generateId(),
          name,
          type,
          rotateKeys: rotateKeys || false
      };
      
      // Add fields
      const fields = Config.providers[type].fields;
      for (const field of fields) {
          const input = document.getElementById(`field-${field.name}`);
          if (!input) continue;
          
          if (field.required && !input.value) {
              Utils.showToast(`Please provide a value for ${field.label}`, 'warning');
              input.focus();
              return;
          }
          
          integration[field.name] = input.value;
      }
      
      // Save integration
      Storage.saveIntegration(integration);
      
      // Update providers and models
      this.loadProviders();
      
      // Update integrations list in settings
      this.updateIntegrationsList();
      
      // Clear form
      document.getElementById('integration-name').value = '';
      document.getElementById('integration-type').value = '';
      document.getElementById('integration-fields').innerHTML = '';
      document.getElementById('integration-rotate-keys').checked = false;
      
      Utils.showToast('Integration added successfully', 'success');
  },
  
  /**
   * Update integrations list in settings
   */
  updateIntegrationsList: function() {
      const container = document.getElementById('active-integrations');
      if (!container) return;
      
      container.innerHTML = '';
      
      const integrations = Storage.getIntegrations();
      
      if (integrations.length === 0) {
          container.innerHTML = '<p>No AI integrations added yet.</p>';
          return;
      }
      
      integrations.forEach(integration => {
          const item = document.createElement('div');
          item.className = 'integration-item';
          
          const providerName = Config?.providers[integration.type]?.displayName || integration.type;
          
          item.innerHTML = `
              <div class="integration-info">
                  <div class="integration-name">${integration.name}</div>
                  <div class="integration-provider">${providerName}</div>
              </div>
              <div class="integration-actions">
                  <button class="integration-btn edit-btn" data-id="${integration.id}" title="Edit">
                      <i class="fas fa-edit"></i>
                  </button>
                  <button class="integration-btn delete-btn" data-id="${integration.id}" title="Delete">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          `;
          
          container.appendChild(item);
      });
      
      // Add event listeners
      container.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', this.editIntegration.bind(this));
      });
      
      container.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', this.deleteIntegration.bind(this));
      });
  },
  
  /**
   * Edit an integration
   * @param {Event} event - Click event
   */
  editIntegration: function(event) {
      const integrationId = event.currentTarget.getAttribute('data-id');
      const integration = Storage.getIntegration(integrationId);
      
      if (!integration) {
          Utils.showToast('Integration not found', 'error');
          return;
      }
      
      // Fill form with integration data
      document.getElementById('integration-name').value = integration.name;
      document.getElementById('integration-type').value = integration.type;
      document.getElementById('integration-rotate-keys').checked = integration.rotateKeys;
      
      // Trigger type change to populate fields
      this.handleProviderTypeChange();
      
      // Fill fields
      const fields = Config?.providers[integration.type]?.fields || [];
      fields.forEach(field => {
          const input = document.getElementById(`field-${field.name}`);
          if (!input) return;
          
          input.value = integration[field.name] || '';
      });
      
      // Delete old integration
      Storage.deleteIntegration(integrationId);
      
      // Show message
      Utils.showToast('Please update the integration and click Add Integration', 'info');
  },
  
  /**
   * Delete an integration
   * @param {Event} event - Click event
   */
  deleteIntegration: function(event) {
      const integrationId = event.currentTarget.getAttribute('data-id');
      
      Utils.showConfirm(
          'Are you sure you want to delete this integration?',
          'Delete Integration',
          () => {
              if (Storage.deleteIntegration(integrationId)) {
                  this.loadProviders();
                  this.updateIntegrationsList();
                  Utils.showToast('Integration deleted', 'success');
              } else {
                  Utils.showToast('Failed to delete integration', 'error');
              }
          }
      );
  },
  
  /**
   * Get API endpoint for current model
   * @returns {string} API endpoint
   */
  getCurrentModelEndpoint: function() {
      if (!this.currentModel || !this.currentProvider) return null;
      
      // Use appropriate endpoint based on provider type
      switch (this.currentModel.providerType) {
          case 'openai':
              return 'https://api.openai.com/v1/chat/completions';
          case 'anthropic':
              return 'https://api.anthropic.com/v1/messages';
          case 'groq':
              return 'https://api.groq.com/openai/v1/chat/completions';
          case 'gemini':
              return `https://generativelanguage.googleapis.com/v1beta/models/${this.currentModel.modelId}:generateContent`;
          case 'mistral':
              return 'https://api.mistral.ai/v1/chat/completions';
          case 'azure_openai':
              return `${this.currentProvider.endpoint}/openai/deployments/${this.currentProvider.deployment}/chat/completions?api-version=2023-05-15`;
          case 'custom':
              return this.currentProvider.api_endpoint;
          default:
              return null;
      }
  },
  
  /**
   * Get API headers for current model
   * @returns {Object} Headers object
   */
  getCurrentModelHeaders: function() {
      if (!this.currentModel || !this.currentProvider) return {};
      
      // Use appropriate headers based on provider type
      switch (this.currentModel.providerType) {
          case 'openai':
              return {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.currentProvider.api_key}`,
                  'OpenAI-Organization': this.currentProvider.organization || ''
              };
          case 'anthropic':
              return {
                  'Content-Type': 'application/json',
                  'x-api-key': this.currentProvider.api_key,
                  'anthropic-version': '2023-06-01'
              };
          case 'groq':
              return {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.currentProvider.api_key}`
              };
          case 'gemini':
              return {
                  'Content-Type': 'application/json'
              };
          case 'mistral':
              return {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.currentProvider.api_key}`
              };
          case 'azure_openai':
              return {
                  'Content-Type': 'application/json',
                  'api-key': this.currentProvider.api_key
              };
          case 'custom':
              return {
                  'Content-Type': 'application/json',
                  [this.currentProvider.auth_header]: this.currentProvider.api_key
              };
          default:
              return {
                  'Content-Type': 'application/json'
              };
      }
  },
  
  /**
   * Format messages for API request
   * @param {Array} messages - Array of message objects
   * @returns {Array} Formatted messages
   */
  formatMessagesForAPI: function(messages) {
      if (!this.currentModel || !this.currentProvider) return [];
      
      // Format messages based on provider type
      switch (this.currentModel.providerType) {
          case 'openai':
          case 'azure_openai':
          case 'mistral':
          case 'groq':  // Groq uses OpenAI-compatible format
              // OpenAI format (also used by Mistral, Azure, and Groq)
              return messages.map(msg => ({
                  role: msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user'),
                  content: msg.content
              }));
          
          case 'anthropic':
              // Anthropic format
              return messages.map(msg => ({
                  role: msg.role === 'assistant' ? 'assistant' : 'user',
                  content: msg.role === 'system' ? `<system>${msg.content}</system>` : msg.content
              }));
          
          case 'gemini':
              // Gemini format
              return messages.map(msg => ({
                  role: msg.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: msg.content }]
              }));
          
          case 'custom':
              // Default to OpenAI format for custom providers
              return messages.map(msg => ({
                  role: msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user'),
                  content: msg.content
              }));
          
          default:
              return [];
      }
  },
  
  /**
   * Format API request body
   * @param {Array} messages - Array of message objects
   * @returns {Object} Request body
   */
  formatRequestBody: function(messages) {
      if (!this.currentModel || !this.currentProvider) return {};
      
      const formattedMessages = this.formatMessagesForAPI(messages);
      
      // Format request body based on provider type
      switch (this.currentModel.providerType) {
          case 'openai':
          case 'azure_openai':
              return {
                  model: this.currentModel.modelId,
                  messages: formattedMessages,
                  temperature: 0.7,
                  max_tokens: 1000,
                  stream: false
              };
          
          case 'groq':
              return {
                  model: this.currentModel.modelId,
                  messages: formattedMessages,
                  temperature: 0.7,
                  max_tokens: 1000,
                  stream: false
              };
          
          case 'anthropic':
              return {
                  model: this.currentModel.modelId,
                  messages: formattedMessages,
                  max_tokens: 1000,
                  temperature: 0.7
              };
          
          case 'gemini':
              return {
                  contents: formattedMessages,
                  generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 1000
                  }
              };
          
          case 'mistral':
              return {
                  model: this.currentModel.modelId,
                  messages: formattedMessages,
                  temperature: 0.7,
                  max_tokens: 1000
              };
          
          case 'custom':
              // For custom, allow some flexibility in the format
              return {
                  model: this.currentModel.modelId,
                  messages: formattedMessages,
                  temperature: 0.7,
                  max_tokens: 1000
              };
          
          default:
              return {};
      }
  },
  
  /**
   * Parse API response
   * @param {Object} response - API response object
   * @returns {string} Response content
   */
  parseResponse: function(response) {
      if (!response) return '';
      
      try {
          switch (this.currentModel.providerType) {
              case 'openai':
              case 'azure_openai':
              case 'groq':  // Groq uses OpenAI-compatible response format
                  return response.choices?.[0]?.message?.content || '';
              
              case 'anthropic':
                  return response.content?.[0]?.text || '';
              
              case 'gemini':
                  return response.candidates?.[0]?.content?.parts?.[0]?.text || 
                         response.candidates?.[0]?.output || '';
              
              case 'mistral':
                  return response.choices?.[0]?.message?.content || '';
              
              case 'custom':
                  // Try different common formats
                  return response.choices?.[0]?.message?.content || 
                         response.message?.content ||
                         response.text ||
                         response.content ||
                         response.output ||
                         response.result ||
                         JSON.stringify(response);
              
              default:
                  return JSON.stringify(response);
          }
      } catch (error) {
          console.error('Error parsing AI response:', error);
          return 'Error parsing response';
      }
  },
  
  /**
   * Send a request to the AI model
   * @param {Array} messages - Messages to send
   * @returns {Promise<string>} AI response
   */
  sendRequest: async function(messages) {
      if (!this.currentModel || !this.currentProvider) {
          throw new Error('No model selected');
      }
      
      const endpoint = this.getCurrentModelEndpoint();
      const headers = this.getCurrentModelHeaders();
      const body = this.formatRequestBody(messages);
      
      try {
          let url = endpoint;
          
          // Add API key as query param for Gemini
          if (this.currentModel.providerType === 'gemini') {
              url += `?key=${this.currentProvider.api_key}`;
          }
          
          const response = await fetch(url, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(body)
          });
          
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('API request failed:', response.status, errorData);
              throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          return this.parseResponse(data);
      } catch (error) {
          console.error('Error sending request to AI model:', error);
          throw error;
      }
  }
};