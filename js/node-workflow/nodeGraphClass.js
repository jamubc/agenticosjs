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
    this.inputData = null;
    this.timerId = null;
    this.setupNodeUI();
    this.createPorts();
  }

  setupNodeUI() {
    this.domElement.setAttribute('data-type', this.type);

    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'node-header';

    const nodeTitle = document.createElement('div');
    nodeTitle.className = 'node-title';

    let icon, title;
    switch (this.type) {
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
      case 'CLICK_TRIGGER':
        icon = 'fa-mouse-pointer';
        title = 'Click Trigger';
        break;
      case 'WEBHOOK_TRIGGER':
        icon = 'fa-link';
        title = 'Webhook Trigger';
        break;
      case 'TIMER_TRIGGER':
        icon = 'fa-clock';
        title = 'Timer Trigger';
        break;
      case 'DISPLAY':
        icon = 'fa-tv';
        title = 'Display Node';
        break;
      default:
        icon = 'fa-code';
        title = this.type;
    }

    nodeTitle.innerHTML = `<i class="fas ${icon}"></i> ${title}`;
    nodeHeader.appendChild(nodeTitle);

    const nodeControls = document.createElement('div');
    nodeControls.className = 'node-controls';

    const runBtn = document.createElement('button');
    runBtn.className = 'node-control-btn';
    runBtn.innerHTML = '<i class="fas fa-play"></i>';
    runBtn.title = 'Run Node';
    runBtn.addEventListener('click', () => this.run());

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'node-control-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete Node';
    deleteBtn.addEventListener('click', () => window.deleteNode(this.id));

    nodeControls.appendChild(runBtn);
    nodeControls.appendChild(deleteBtn);
    nodeHeader.appendChild(nodeControls);

    const nodeBody = document.createElement('div');
    nodeBody.className = 'node-body';

    switch (this.type) {
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
      case 'CLICK_TRIGGER':
        this.createClickTriggerNode(nodeBody);
        break;
      case 'WEBHOOK_TRIGGER':
        this.createWebhookTriggerNode(nodeBody);
        break;
      case 'TIMER_TRIGGER':
        this.createTimerTriggerNode(nodeBody);
        break;
      case 'DISPLAY':
        this.createDisplayNode(nodeBody);
        break;
    }

    const nodeFooter = document.createElement('div');
    nodeFooter.className = 'node-footer';

    const nodeStatus = document.createElement('div');
    nodeStatus.className = 'node-status ready';
    nodeStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Ready</span>';
    this.statusElement = nodeStatus;

    nodeFooter.appendChild(nodeStatus);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'node-resize-handle';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '10px';
    resizeHandle.style.height = '10px';
    resizeHandle.style.cursor = 'se-resize';

    this.domElement.appendChild(nodeHeader);
    this.domElement.appendChild(nodeBody);
    this.domElement.appendChild(nodeFooter);
    this.domElement.appendChild(resizeHandle);

    this.domElement.style.left = `${this.position.x}px`;
    this.domElement.style.top = `${this.position.y}px`;
    this.domElement.style.position = 'absolute';
  }

  createPorts() {
    switch (this.type) {
      case 'URL':
      case 'PICTURE':
      case 'CLICK_TRIGGER':
      case 'WEBHOOK_TRIGGER':
      case 'TIMER_TRIGGER':
        this.createPort('output');
        break;
      case 'CHAT':
      case 'DISPLAY':
        this.createPort('input');
        this.createPort('output');
        break;
      case 'HTTP_REQUEST':
        this.createPort('output');
        break;
      default:
        this.createPort('input');
        this.createPort('output');
    }
  }

  createPort(type) {
    const port = document.createElement('div');
    port.className = `node-port ${type}`;
    port.setAttribute('data-port-type', type);
    port.setAttribute('data-node-id', this.id);
    this.domElement.appendChild(port);
  }

  createUrlNode(container) {
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

    this.inputs.url.addEventListener('change', () => {
      this.updateUrlPreview();
    });

    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(this.inputs.url);
    container.appendChild(urlGroup);

    const previewBtn = document.createElement('button');
    previewBtn.textContent = 'Show Preview';
    previewBtn.style.marginTop = '8px';
    previewBtn.style.padding = '4px 8px';
    previewBtn.style.backgroundColor = '#3f8cff';
    previewBtn.style.color = 'white';
    previewBtn.style.border = 'none';
    previewBtn.style.borderRadius = '4px';
    previewBtn.style.cursor = 'pointer';

    previewBtn.addEventListener('click', () => {
      this.updateUrlPreview();
    });

    container.appendChild(previewBtn);

    this.outputs.preview = document.createElement('div');
    this.outputs.preview.className = 'url-preview';
    this.outputs.preview.style.width = '100%';
    this.outputs.preview.style.height = '120px';
    this.outputs.preview.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.preview.style.border = '1px solid rgba(0,0,0,0.2)';
    this.outputs.preview.style.borderRadius = '4px';
    this.outputs.preview.style.marginTop = '8px';
    this.outputs.preview.style.overflow = 'hidden';
    this.outputs.preview.style.display = 'flex';
    this.outputs.preview.style.alignItems = 'center';
    this.outputs.preview.style.justifyContent = 'center';
    this.outputs.preview.textContent = 'URL preview will appear here';

    container.appendChild(this.outputs.preview);
  }

  updateUrlPreview() {
    const url = this.inputs.url.value;
    if (!url) {
      this.outputs.preview.textContent = 'Please enter a URL';
      return;
    }

    this.outputs.preview.innerHTML = '';

    try {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      this.outputs.preview.appendChild(iframe);

      this.outputData = {
        type: 'url',
        url: url,
        timestamp: new Date().toISOString()
      };

      this.executed = true;
    } catch (error) {
      this.outputs.preview.textContent = 'Error loading preview';
      console.error('Error updating URL preview:', error);
    }
  }

  createPictureNode(container) {
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

    const cameraBtn = document.createElement('button');
    cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
    cameraBtn.title = 'Take Photo';
    cameraBtn.addEventListener('click', () => {
      alert('Camera functionality would be triggered here');
    });

    fileInputGroup.appendChild(cameraBtn);
    container.appendChild(fileInputGroup);

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

  createChatNode(container) {
    const queryGroup = document.createElement('div');
    queryGroup.style.marginBottom = '8px';

    const queryLabel = document.createElement('label');
    queryLabel.textContent = 'Query:';
    queryLabel.style.display = 'block';
    queryLabel.style.marginBottom = '4px';

    this.inputs.query = document.createElement('textarea');
    this.inputs.query.placeholder = 'Enter your query...';
    this.inputs.query.rows = 3;
    this.inputs.query.style.width = '100%';
    this.inputs.query.style.padding = '4px';
    this.inputs.query.style.boxSizing = 'border-box';

    queryGroup.appendChild(queryLabel);
    queryGroup.appendChild(this.inputs.query);
    container.appendChild(queryGroup);

    this.outputs.response = document.createElement('div');
    this.outputs.response.className = 'response-output';
    this.outputs.response.textContent = 'API response will appear here';
    this.outputs.response.style.marginTop = '8px';
    this.outputs.response.style.padding = '8px';
    this.outputs.response.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.response.style.borderRadius = '4px';
    this.outputs.response.style.minHeight = '80px';
    this.outputs.response.style.maxHeight = '200px';
    this.outputs.response.style.overflowY = 'auto';

    container.appendChild(this.outputs.response);
  }

  createHttpRequestNode(container) {
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

    const headersGroup = document.createElement('div');
    headersGroup.style.marginBottom = '8px';

    const headersLabel = document.createElement('label');
    headersLabel.textContent = 'Headers:';
    headersLabel.style.display = 'block';
    headersLabel.style.marginBottom = '4px';

    this.inputs.headers = document.createElement('textarea');
    this.inputs.headers.placeholder = 'Key: Value\nKey: Value';
    this.inputs.headers.style.width = '100%';
    this.inputs.headers.style.height = '60px';
    this.inputs.headers.style.padding = '4px';

    headersGroup.appendChild(headersLabel);
    headersGroup.appendChild(this.inputs.headers);
    container.appendChild(headersGroup);

    const bodyGroup = document.createElement('div');
    bodyGroup.style.marginBottom = '8px';

    const bodyLabel = document.createElement('label');
    bodyLabel.textContent = 'Body:';
    bodyLabel.style.display = 'block';
    bodyLabel.style.marginBottom = '4px';

    this.inputs.body = document.createElement('textarea');
    this.inputs.body.placeholder = 'Request body (e.g., JSON)';
    this.inputs.body.style.width = '100%';
    this.inputs.body.style.height = '80px';
    this.inputs.body.style.padding = '4px';

    bodyGroup.appendChild(bodyLabel);
    bodyGroup.appendChild(this.inputs.body);
    container.appendChild(bodyGroup);

    const responseFormatGroup = document.createElement('div');
    responseFormatGroup.style.marginBottom = '8px';

    const responseFormatLabel = document.createElement('label');
    responseFormatLabel.textContent = 'Response Format:';
    responseFormatLabel.style.display = 'block';
    responseFormatLabel.style.marginBottom = '4px';

    this.inputs.responseFormat = document.createElement('select');
    this.inputs.responseFormat.style.width = '100%';
    this.inputs.responseFormat.style.padding = '4px';

    ['Autodetect', 'JSON', 'Text'].forEach(format => {
      const option = document.createElement('option');
      option.value = format.toLowerCase();
      option.textContent = format;
      this.inputs.responseFormat.appendChild(option);
    });

    this.inputs.responseFormat.value = 'autodetect';

    responseFormatGroup.appendChild(responseFormatLabel);
    responseFormatGroup.appendChild(this.inputs.responseFormat);
    container.appendChild(responseFormatGroup);

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

  createClickTriggerNode(container) {
    const triggerBtn = document.createElement('button');
    triggerBtn.textContent = 'Trigger';
    triggerBtn.style.padding = '8px 16px';
    triggerBtn.style.backgroundColor = '#3f8cff';
    triggerBtn.style.color = 'white';
    triggerBtn.style.border = 'none';
    triggerBtn.style.borderRadius = '4px';
    triggerBtn.style.cursor = 'pointer';

    triggerBtn.addEventListener('click', () => this.run());

    container.appendChild(triggerBtn);
  }

  createWebhookTriggerNode(container) {
    const webhookLabel = document.createElement('div');
    webhookLabel.textContent = 'Webhook URL: Not implemented';
    webhookLabel.style.padding = '8px';
    container.appendChild(webhookLabel);
    // Placeholder for webhook implementation
  }

  createTimerTriggerNode(container) {
    const timerLabel = document.createElement('div');
    timerLabel.textContent = 'Runs every 30 seconds';
    timerLabel.style.padding = '8px';
    container.appendChild(timerLabel);
  }

  createDisplayNode(container) {
    this.outputs.display = document.createElement('div');
    this.outputs.display.className = 'display-output';
    this.outputs.display.textContent = 'Waiting for data...';
    this.outputs.display.style.marginTop = '8px';
    this.outputs.display.style.padding = '8px';
    this.outputs.display.style.backgroundColor = 'rgba(0,0,0,0.1)';
    this.outputs.display.style.borderRadius = '4px';
    this.outputs.display.style.minHeight = '80px';
    this.outputs.display.style.maxHeight = '200px';
    this.outputs.display.style.overflowY = 'auto';

    container.appendChild(this.outputs.display);
  }

  parseHeaders(headersString) {
    const headers = {};
    const lines = headersString.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split(':').map(str => str.trim());
      if (key && value) {
        headers[key] = value;
      }
    });
    return headers;
  }

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

  setStatus(status) {
    if (!this.statusElement) return;

    this.statusElement.classList.remove('ready', 'running', 'error', 'completed');
    this.statusElement.classList.add(status);

    const statusText = this.statusElement.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  async run() {
    if (this.executed && !this.getRerunStatus()) {
      console.log(`Node ${this.id} already executed`);
      return;
    }

    try {
      this.setStatus('running');

      switch (this.type) {
        case 'URL':
          await this.runUrlNode();
          break;
        case 'PICTURE':
          this.setStatus('ready');
          break;
        case 'CHAT':
          await this.runChatNode();
          break;
        case 'HTTP_REQUEST':
          await this.runHttpRequestNode();
          break;
        case 'CLICK_TRIGGER':
          await this.runClickTriggerNode();
          break;
        case 'WEBHOOK_TRIGGER':
          await this.runWebhookTriggerNode();
          break;
        case 'TIMER_TRIGGER':
          await this.runTimerTriggerNode();
          break;
        case 'DISPLAY':
          this.setStatus('completed');
          break;
      }

      this.executed = true;
      this.setStatus('completed');

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

  async runUrlNode() {
    const url = this.inputs.url.value;
    if (!url) {
      throw new Error('URL is required');
    }

    this.outputs.preview.textContent = `Processing URL: ${url}`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.updateUrlPreview();

    return this.outputData;
  }

  async runChatNode() {
    const query = this.inputs.query.value;
    if (!query) {
      throw new Error('Query is required');
    }

    this.outputs.response.textContent = 'Processing...';

    const response = await callGroqAPI(query);
    this.outputs.response.textContent = response;
    this.outputData = {
      type: 'text',
      response: response,
      timestamp: new Date().toISOString()
    };

    return this.outputData;
  }

  async runHttpRequestNode() {
    const method = this.inputs.method.value;
    const url = this.inputs.url.value;
    const headers = this.parseHeaders(this.inputs.headers.value);
    const body = this.inputs.body.value;
    const responseFormat = this.inputs.responseFormat.value;

    if (!url) {
      throw new Error('URL is required');
    }

    this.outputs.response.textContent = `Sending ${method} request to ${url}...`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      if (responseFormat === 'json' || (responseFormat === 'autodetect' && contentType && contentType.includes('application/json'))) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      this.outputs.response.textContent = responseFormat === 'json' ? JSON.stringify(data, null, 2) : data;
      this.outputData = {
        type: 'api',
        request: {
          method,
          url,
          headers,
          body
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          data: data
        }
      };
    } catch (error) {
      this.outputs.response.textContent = `Error: ${error.message}`;
      this.setStatus('error');
      throw error;
    }

    return this.outputData;
  }

  async runClickTriggerNode() {
    this.outputData = {
      type: 'trigger',
      timestamp: new Date().toISOString()
    };
    return this.outputData;
  }

  async runWebhookTriggerNode() {
    // Placeholder for webhook implementation
    this.outputData = {
      type: 'webhook',
      timestamp: new Date().toISOString(),
      message: 'Webhook trigger not implemented'
    };
    return this.outputData;
  }

  async runTimerTriggerNode() {
    this.outputData = {
      type: 'timer',
      timestamp: new Date().toISOString()
    };
    return this.outputData;
  }

  startTimer() {
    if (this.type === 'TIMER_TRIGGER' && !this.timerId) {
      this.timerId = setInterval(async () => {
        await this.run();
        const outgoingConnections = window.connections.filter(conn => conn.from === this.id);
        for (const conn of outgoingConnections) {
          const targetNodeItem = window.nodeItems.find(node => node.id === conn.to);
          if (targetNodeItem && typeof targetNodeItem.receiveData === 'function') {
            const outputData = this.getOutputData();
            targetNodeItem.receiveData(outputData);
            await window.executeDependentNodes(targetNodeItem);
          }
        }
      }, 30000); // Every 30 seconds
    }
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  receiveData(data) {
    this.inputData = data;

    if (this.type === 'DISPLAY' && data) {
      this.outputs.display.textContent = data.response || JSON.stringify(data, null, 2);
      this.outputData = data; // Pass through data
    } else if (this.type === 'CHAT' && data) {
      // Optionally prepend input data to query
      let inputInfo = `Input: ${data.response || JSON.stringify(data)}`;
      if (!this.inputs.dataDisplay) {
        this.inputs.dataDisplay = document.createElement('div');
        this.inputs.dataDisplay.className = 'input-data-display';
        this.inputs.dataDisplay.style.marginBottom = '8px';
        this.inputs.dataDisplay.style.padding = '4px';
        this.inputs.dataDisplay.style.backgroundColor = 'rgba(63, 140, 255, 0.1)';
        this.inputs.dataDisplay.style.borderRadius = '4px';
        this.inputs.dataDisplay.style.fontSize = '0.85em';

        const nodeBody = this.domElement.querySelector('.node-body');
        if (nodeBody && nodeBody.firstChild) {
          nodeBody.insertBefore(this.inputs.dataDisplay, nodeBody.firstChild);
        }
      }
      this.inputs.dataDisplay.textContent = inputInfo;
    }
  }

  getInputData() {
    return this.inputData || null;
  }

  getOutputData() {
    return this.outputData;
  }

  getRerunStatus() {
    return false; // Simplified for this implementation
  }
}

async function callGroqAPI(query) {
  const apiKey = 'your-groq-api-key-here'; // Replace with your actual API key
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions'; // Example endpoint
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // Specify your model
        messages: [{ role: 'user', content: query }],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`GROQ API error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GROQ API call failed:', error);
    return `Error: ${error.message}`;
  }
}

export default NodeItem;