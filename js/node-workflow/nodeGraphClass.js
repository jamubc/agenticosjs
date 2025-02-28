/**
 * nodeGraphClass.js
 * NodeItem class that represents a node in the workflow graph
 */

class NodeItem {
  constructor(type, domElement, position) {
    this.type = type;
    this.id = domElement.getAttribute("id");
    this.domElement = domElement;
    this.inputs = {};
    this.outputs = {};
    this.executed = false;
    this.position = position || { x: 100, y: 100 };
    this.outputData = null;
    
    // Set up the node UI based on type
    this.setupNodeUI();
    
    // Create input and output ports
    this.createPorts();
  }
  
  /**
   * Sets up the node UI structure based on node type
   */
  setupNodeUI() {
    // Set data attribute for type-specific styling
    this.domElement.setAttribute('data-type', this.type);
    
    // Create node structure
    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'node-header';
    
    const nodeTitle = document.createElement('div');
    nodeTitle.className = 'node-title';
    
    // Icon and title based on node type
    let icon, title;
    switch(this.type) {
      case 'URL':
        icon = 'fa-globe';
        title = 'URL Node';
        break;
      case 'PICTURE':
        icon = 'fa-image';
        title = 'Picture Node';
        break;
      case 'CHAT':
        icon = 'fa-comment-dots';
        title = 'Chat Node';
        break;
      case 'HTTP_REQUEST':
        icon = 'fa-globe';
        title = 'HTTP Request';
        break;
      default:
        icon = 'fa-code';
        title = this.type;
    }
    
    // Add icon and title
    nodeTitle.innerHTML = `<i class="fas ${icon}"></i> ${title}`;
    nodeHeader.appendChild(nodeTitle);
    
    // Controls
    const nodeControls = document.createElement('div');
    nodeControls.className = 'node-controls';
    
    // Run node button
    const runBtn = document.createElement('button');
    runBtn.className = 'node-control-btn';
    runBtn.innerHTML = '<i class="fas fa-play"></i>';
    runBtn.title = 'Run Node';
    runBtn.addEventListener('click', () => this.run());
    
    nodeControls.appendChild(runBtn);
    nodeHeader.appendChild(nodeControls);
    
    // Node body
    const nodeBody = document.createElement('div');
    nodeBody.className = 'node-body';
    
    // Create type-specific UI elements
    switch(this.type) {
      case 'URL':
        this.createUrlNode(nodeBody);
        break;
      case 'PICTURE':
        this.createPictureNode(nodeBody);
        break;
      case 'CHAT':
        this.createChatNode(nodeBody);
        break;
      case 'HTTP_REQUEST':
        this.createHttpRequestNode(nodeBody);
        break;
    }
    
    // Node footer
    const nodeFooter = document.createElement('div');
    nodeFooter.className = 'node-footer';
    
    // Status indicator
    const nodeStatus = document.createElement('div');
    nodeStatus.className = 'node-status ready';
    nodeStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Ready</span>';
    this.statusElement = nodeStatus;
    
    nodeFooter.appendChild(nodeStatus);
    
    // Append all parts to the node
    this.domElement.appendChild(nodeHeader);
    this.domElement.appendChild(nodeBody);
    this.domElement.appendChild(nodeFooter);
    
    // Position the node
    this.domElement.style.left = `${this.position.x}px`;
    this.domElement.style.top = `${this.position.y}px`;
    this.domElement.style.position = 'absolute';
  }
  
  /**
   * Creates input and output ports for the node
   */
  createPorts() {
    // Create ports based on node type
    switch(this.type) {
      case 'URL':
      case 'PICTURE':
        // These have only output ports
        this.createPort('output');
        break;
      case 'CHAT':
        // Chat has both input and output
        this.createPort('input');
        this.createPort('output');
        break;
      case 'HTTP_REQUEST':
        // HTTP Request has only output
        this.createPort('output');
        break;
      default:
        // Default has both
        this.createPort('input');
        this.createPort('output');
    }
  }
  
  /**
   * Create a single port
   */
  createPort(type) {
    const port = document.createElement('div');
    port.className = `node-port ${type}`;
    port.setAttribute('data-port-type', type);
    port.setAttribute('data-node-id', this.id);
    this.domElement.appendChild(port);
  }
  
  /**
   * Create URL node interface
   */
  createUrlNode(container) {
    // URL input field
    const urlGroup = document.createElement('div');
    urlGroup.style.marginBottom = '8px';
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL:';
    urlLabel.style.display = 'block';
    urlLabel.style.marginBottom = '4px';
    
    this.inputs.url = document.createElement('input');
    this.inputs.url.type = 'text';
    this.inputs.url.placeholder = 'https://example.com';
    this.inputs.url.style.width = '100%';
    this.inputs.url.style.padding = '4px';
    this.inputs.url.style.boxSizing = 'border-box';
    
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(this.inputs.url);
    container.appendChild(urlGroup);
    
    // Output area
    this.outputs.preview = document.createElement('div');
    this.outputs.preview.className = 'output-preview';
    this.outputs.preview.textContent = 'URL output will appear here';
    this.outputs.preview.style.marginTop = '8px';
    this.outputs.preview.style.padding = '4px';
    this.outputs.preview.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.preview.style.borderRadius = '4px';
    this.outputs.preview.style.minHeight = '60px';
    this.outputs.preview.style.overflowWrap = 'break-word';
    
    container.appendChild(this.outputs.preview);
  }
  
  /**
   * Create Picture node interface
   */
  createPictureNode(container) {
    // File input button
    const fileInputGroup = document.createElement('div');
    fileInputGroup.style.marginBottom = '8px';
    
    const fileInputBtn = document.createElement('button');
    fileInputBtn.textContent = 'Select Image';
    fileInputBtn.style.marginRight = '8px';
    
    this.inputs.fileInput = document.createElement('input');
    this.inputs.fileInput.type = 'file';
    this.inputs.fileInput.accept = 'image/*';
    this.inputs.fileInput.style.display = 'none';
    
    fileInputBtn.addEventListener('click', () => {
      this.inputs.fileInput.click();
    });
    
    this.inputs.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageUpload(e.target.files[0]);
      }
    });
    
    fileInputGroup.appendChild(fileInputBtn);
    fileInputGroup.appendChild(this.inputs.fileInput);
    
    // Camera button
    const cameraBtn = document.createElement('button');
    cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
    cameraBtn.title = 'Take Photo';
    cameraBtn.addEventListener('click', () => {
      // This would integrate with camera functionality
      alert('Camera functionality would be triggered here');
    });
    
    fileInputGroup.appendChild(cameraBtn);
    container.appendChild(fileInputGroup);
    
    // Image preview
    this.outputs.imagePreview = document.createElement('div');
    this.outputs.imagePreview.className = 'image-preview';
    this.outputs.imagePreview.style.width = '100%';
    this.outputs.imagePreview.style.height = '120px';
    this.outputs.imagePreview.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.imagePreview.style.backgroundSize = 'contain';
    this.outputs.imagePreview.style.backgroundPosition = 'center';
    this.outputs.imagePreview.style.backgroundRepeat = 'no-repeat';
    this.outputs.imagePreview.style.borderRadius = '4px';
    this.outputs.imagePreview.style.marginTop = '8px';
    
    container.appendChild(this.outputs.imagePreview);
  }
  
  /**
   * Create Chat node interface
   */
  createChatNode(container) {
    // Question input
    const questionGroup = document.createElement('div');
    questionGroup.style.marginBottom = '8px';
    
    const questionLabel = document.createElement('label');
    questionLabel.textContent = 'Question:';
    questionLabel.style.display = 'block';
    questionLabel.style.marginBottom = '4px';
    
    this.inputs.question = document.createElement('textarea');
    this.inputs.question.placeholder = 'Enter your question...';
    this.inputs.question.rows = 3;
    this.inputs.question.style.width = '100%';
    this.inputs.question.style.padding = '4px';
    this.inputs.question.style.boxSizing = 'border-box';
    
    questionGroup.appendChild(questionLabel);
    questionGroup.appendChild(this.inputs.question);
    container.appendChild(questionGroup);
    
    // Settings toggles
    const settingsGroup = document.createElement('div');
    settingsGroup.style.display = 'flex';
    settingsGroup.style.alignItems = 'center';
    settingsGroup.style.marginBottom = '8px';
    
    // Rerun toggle
    const rerunLabel = document.createElement('label');
    rerunLabel.style.display = 'flex';
    rerunLabel.style.alignItems = 'center';
    rerunLabel.style.marginRight = '12px';
    
    this.inputs.rerun = document.createElement('input');
    this.inputs.rerun.type = 'checkbox';
    this.inputs.rerun.style.marginRight = '4px';
    
    rerunLabel.appendChild(this.inputs.rerun);
    rerunLabel.appendChild(document.createTextNode('Rerun'));
    
    // Offline toggle
    const offlineLabel = document.createElement('label');
    offlineLabel.style.display = 'flex';
    offlineLabel.style.alignItems = 'center';
    
    this.inputs.offline = document.createElement('input');
    this.inputs.offline.type = 'checkbox';
    this.inputs.offline.checked = true;
    this.inputs.offline.style.marginRight = '4px';
    
    offlineLabel.appendChild(this.inputs.offline);
    offlineLabel.appendChild(document.createTextNode('Offline Mode'));
    
    settingsGroup.appendChild(rerunLabel);
    settingsGroup.appendChild(offlineLabel);
    container.appendChild(settingsGroup);
    
    // Response output
    this.outputs.response = document.createElement('div');
    this.outputs.response.className = 'response-output';
    this.outputs.response.textContent = 'AI response will appear here';
    this.outputs.response.style.marginTop = '8px';
    this.outputs.response.style.padding = '8px';
    this.outputs.response.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.response.style.borderRadius = '4px';
    this.outputs.response.style.minHeight = '80px';
    this.outputs.response.style.maxHeight = '200px';
    this.outputs.response.style.overflowY = 'auto';
    
    container.appendChild(this.outputs.response);
  }
  
  /**
   * Create HTTP Request node interface
   */
  createHttpRequestNode(container) {
    // Method selector
    const methodGroup = document.createElement('div');
    methodGroup.style.marginBottom = '8px';
    
    const methodLabel = document.createElement('label');
    methodLabel.textContent = 'Method:';
    methodLabel.style.display = 'block';
    methodLabel.style.marginBottom = '4px';
    
    this.inputs.method = document.createElement('select');
    this.inputs.method.style.width = '100%';
    this.inputs.method.style.padding = '4px';
    
    ['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
      const option = document.createElement('option');
      option.value = method;
      option.textContent = method;
      this.inputs.method.appendChild(option);
    });
    
    methodGroup.appendChild(methodLabel);
    methodGroup.appendChild(this.inputs.method);
    container.appendChild(methodGroup);
    
    // URL input
    const urlGroup = document.createElement('div');
    urlGroup.style.marginBottom = '8px';
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL:';
    urlLabel.style.display = 'block';
    urlLabel.style.marginBottom = '4px';
    
    this.inputs.url = document.createElement('input');
    this.inputs.url.type = 'text';
    this.inputs.url.placeholder = 'https://example.com/api';
    this.inputs.url.style.width = '100%';
    this.inputs.url.style.padding = '4px';
    
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(this.inputs.url);
    container.appendChild(urlGroup);
    
    // Response output
    this.outputs.response = document.createElement('div');
    this.outputs.response.className = 'response-output';
    this.outputs.response.textContent = 'Response will appear here';
    this.outputs.response.style.marginTop = '8px';
    this.outputs.response.style.padding = '8px';
    this.outputs.response.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.response.style.borderRadius = '4px';
    this.outputs.response.style.minHeight = '80px';
    this.outputs.response.style.maxHeight = '150px';
    this.outputs.response.style.overflowY = 'auto';
    
    container.appendChild(this.outputs.response);
  }
  
  /**
   * Handle image upload for Picture node
   */
  handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageUrl = e.target.result;
      this.outputs.imagePreview.style.backgroundImage = `url(${this.imageUrl})`;
      this.outputData = {
        type: 'image',
        url: this.imageUrl,
        file: file
      };
      this.executed = true;
      this.setStatus('ready');
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Set node status
   */
  setStatus(status) {
    if (!this.statusElement) return;
    
    // Remove all status classes
    this.statusElement.classList.remove('ready', 'running', 'error', 'completed');
    
    // Add new status class
    this.statusElement.classList.add(status);
    
    // Update status text
    const statusText = this.statusElement.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
  
  /**
   * Run the node
   */
  async run() {
    if (this.executed && !this.getRerunStatus()) {
      console.log(`Node ${this.id} already executed`);
      return;
    }
    
    try {
      this.setStatus('running');
      
      switch(this.type) {
        case 'URL':
          await this.runUrlNode();
          break;
        case 'PICTURE':
          // Picture nodes run when images are uploaded
          this.setStatus('ready');
          break;
        case 'CHAT':
          await this.runChatNode();
          break;
        case 'HTTP_REQUEST':
          await this.runHttpRequestNode();
          break;
      }
      
      this.executed = true;
      this.setStatus('completed');
      
      // Reset to ready after a delay
      setTimeout(() => {
        this.setStatus('ready');
      }, 2000);
      
      return this.outputData;
    } catch (error) {
      console.error(`Error running node ${this.id}:`, error);
      this.setStatus('error');
      throw error;
    }
  }
  
  /**
   * Run URL node
   */
  async runUrlNode() {
    const url = this.inputs.url.value;
    if (!url) {
      throw new Error('URL is required');
    }
    
    this.outputs.preview.textContent = `Processing URL: ${url}`;
    
    // Simulate fetching from URL
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.outputs.preview.textContent = `URL processed: ${url}`;
    this.outputData = {
      type: 'url',
      url: url,
      timestamp: new Date().toISOString()
    };
    
    return this.outputData;
  }
  
  /**
   * Run Chat node
   */
  async runChatNode() {
    const question = this.inputs.question.value;
    if (!question) {
      throw new Error('Question is required');
    }
    
    const isOffline = this.inputs.offline.checked;
    this.outputs.response.textContent = 'Processing...';
    
    // Get data from connected nodes
    const connectedData = this.getInputData();
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response;
    if (connectedData && Object.keys(connectedData).length > 0) {
      response = `Response to: "${question}"\n\nI've analyzed the ${connectedData.type} you provided.`;
      
      if (connectedData.type === 'image') {
        response += ' The image appears to contain visual content that I could analyze in detail.';
      } else if (connectedData.type === 'url') {
        response += ` The URL ${connectedData.url} contains information that might be relevant to your query.`;
      }
    } else {
      response = `Response to: "${question}"\n\nThis is a simulated ${isOffline ? 'offline' : 'online'} AI response.`;
    }
    
    this.outputs.response.textContent = response;
    this.outputData = {
      type: 'text',
      question: question,
      response: response,
      timestamp: new Date().toISOString()
    };
    
    return this.outputData;
  }
  
  /**
   * Run HTTP Request node
   */
  async runHttpRequestNode() {
    const method = this.inputs.method.value;
    const url = this.inputs.url.value;
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    this.outputs.response.textContent = `Sending ${method} request to ${url}...`;
    
    // Simulate HTTP request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = {
      status: 200,
      statusText: 'OK',
      data: {
        message: 'Success',
        timestamp: new Date().toISOString()
      }
    };
    
    this.outputs.response.textContent = JSON.stringify(response, null, 2);
    this.outputData = {
      type: 'api',
      request: {
        method,
        url
      },
      response: response
    };
    
    return this.outputData;
  }
  
  /**
   * Receive data from connected nodes
   */
  receiveData(data) {
    this.inputData = data;
    
    // Update UI based on received data
    if (this.type === 'CHAT' && data) {
      let inputInfo = '';
      
      if (data.type === 'image') {
        inputInfo = 'Image data received for processing';
      } else if (data.type === 'url') {
        inputInfo = `URL data received: ${data.url}`;
      } else if (data.type === 'api') {
        inputInfo = `API response received from ${data.request.url}`;
      } else {
        inputInfo = 'Data received for processing';
      }
      
      // Create or update input data display
      if (!this.inputs.dataDisplay) {
        this.inputs.dataDisplay = document.createElement('div');
        this.inputs.dataDisplay.className = 'input-data-display';
        this.inputs.dataDisplay.style.marginBottom = '8px';
        this.inputs.dataDisplay.style.padding = '4px';
        this.inputs.dataDisplay.style.backgroundColor = 'rgba(63, 140, 255, 0.1)';
        this.inputs.dataDisplay.style.borderRadius = '4px';
        this.inputs.dataDisplay.style.fontSize = '0.85em';
        
        // Insert before question input
        const nodeBody = this.domElement.querySelector('.node-body');
        if (nodeBody && nodeBody.firstChild) {
          nodeBody.insertBefore(this.inputs.dataDisplay, nodeBody.firstChild);
        }
      }
      
      this.inputs.dataDisplay.textContent = inputInfo;
    }
  }
  
  /**
   * Get data from connected input nodes
   */
  getInputData() {
    return this.inputData || null;
  }
  
  /**
   * Get output data to send to connected nodes
   */
  getOutputData() {
    return this.outputData;
  }
  
  /**
   * Get rerun status
   */
  getRerunStatus() {
    if (this.type === 'CHAT' && this.inputs.rerun) {
      return this.inputs.rerun.checked;
    }
    return false;
  }
}

export default NodeItem;