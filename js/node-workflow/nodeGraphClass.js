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
      case 'HTTP_REQUEST':
        icon = 'fa-globe';
        title = 'HTTP Request';
        break;
      case 'DISPLAY':
        icon = 'fa-desktop';
        title = 'Display';
        break;
      case 'TEXT_INPUT':
        icon = 'fa-keyboard';
        title = 'Text Input';
        break;
      default:
        icon = 'fa-code';
        title = 'Node';
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
      case 'HTTP_REQUEST':
        this.createHttpRequestUI(nodeBody);
        break;
      case 'DISPLAY':
        this.createDisplayUI(nodeBody);
        break;
      case 'TEXT_INPUT':
        this.createTextInputUI(nodeBody);
        break;
    }
    
    // Node footer
    const nodeFooter = document.createElement('div');
    nodeFooter.className = 'node-footer';
    
    // Status indicator
    const nodeStatus = document.createElement('div');
    nodeStatus.className = 'node-status ready';
    nodeStatus.innerHTML = '<i class="fas fa-circle"></i> Ready';
    this.statusElement = nodeStatus;
    
    nodeFooter.appendChild(nodeStatus);
    
    // Append all parts to the node
    this.domElement.appendChild(nodeHeader);
    this.domElement.appendChild(nodeBody);
    this.domElement.appendChild(nodeFooter);
    
    // Position the node
    this.domElement.style.left = `${this.position.x}px`;
    this.domElement.style.top = `${this.position.y}px`;
  }
  
  /**
   * Creates input and output ports for the node
   */
  createPorts() {
    // Input port
    if (this.type !== 'HTTP_REQUEST' && this.type !== 'TEXT_INPUT') {
      const inputPort = document.createElement('div');
      inputPort.className = 'node-port input';
      inputPort.setAttribute('data-port-type', 'input');
      inputPort.setAttribute('data-node-id', this.id);
      this.domElement.appendChild(inputPort);
    }
    
    // Output port
    if (this.type !== 'DISPLAY') {
      const outputPort = document.createElement('div');
      outputPort.className = 'node-port output';
      outputPort.setAttribute('data-port-type', 'output');
      outputPort.setAttribute('data-node-id', this.id);
      this.domElement.appendChild(outputPort);
    }
  }
  
  /**
   * Creates UI for HTTP Request nodes
   */
  createHttpRequestUI(container) {
    // Method selector
    const methodGroup = document.createElement('div');
    methodGroup.innerHTML = `
      <label>HTTP Method</label>
      <select class="http-method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>
    `;
    
    // URL input
    const urlGroup = document.createElement('div');
    urlGroup.innerHTML = `
      <label>URL</label>
      <input type="text" class="http-url" placeholder="https://example.com/api">
    `;
    
    // Headers input (optional)
    const headersGroup = document.createElement('div');
    headersGroup.innerHTML = `
      <label>Headers (optional JSON)</label>
      <textarea class="http-headers" placeholder='{"Content-Type": "application/json"}'></textarea>
    `;
    
    // Body input (for POST/PUT)
    const bodyGroup = document.createElement('div');
    bodyGroup.innerHTML = `
      <label>Body (for POST/PUT)</label>
      <textarea class="http-body" placeholder='{"key": "value"}'></textarea>
    `;
    
    container.appendChild(methodGroup);
    container.appendChild(urlGroup);
    container.appendChild(headersGroup);
    container.appendChild(bodyGroup);
    
    // Store references to the inputs
    this.inputs.method = methodGroup.querySelector('.http-method');
    this.inputs.url = urlGroup.querySelector('.http-url');
    this.inputs.headers = headersGroup.querySelector('.http-headers');
    this.inputs.body = bodyGroup.querySelector('.http-body');
    
    // Output preview area
    const outputGroup = document.createElement('div');
    outputGroup.innerHTML = `
      <label>Response Preview</label>
      <div class="output-preview">No data yet</div>
    `;
    
    container.appendChild(outputGroup);
    this.outputs.preview = outputGroup.querySelector('.output-preview');
  }
  
  /**
   * Creates UI for Display nodes
   */
  createDisplayUI(container) {
    // Output display area
    const displayGroup = document.createElement('div');
    displayGroup.innerHTML = `
      <label>Output Display</label>
      <div class="display-output">Waiting for input data...</div>
    `;
    
    container.appendChild(displayGroup);
    this.outputs.display = displayGroup.querySelector('.display-output');
  }
  
  /**
   * Creates UI for Text Input nodes
   */
  createTextInputUI(container) {
    // Text input area
    const textGroup = document.createElement('div');
    textGroup.innerHTML = `
      <label>Text Input</label>
      <textarea class="text-input" placeholder="Enter text here..."></textarea>
    `;
    
    container.appendChild(textGroup);
    this.inputs.text = textGroup.querySelector('.text-input');
  }
  
  /**
   * Sets the node status (ready, running, error, etc.)
   */
  setStatus(status) {
    // Remove all status classes
    this.statusElement.classList.remove('ready', 'running', 'error');
    
    // Set new status
    this.statusElement.classList.add(status);
    
    // Update status text
    let statusText = '';
    let icon = '';
    
    switch(status) {
      case 'ready':
        statusText = 'Ready';
        icon = 'fa-circle';
        break;
      case 'running':
        statusText = 'Running';
        icon = 'fa-spinner fa-spin';
        break;
      case 'error':
        statusText = 'Error';
        icon = 'fa-exclamation-circle';
        break;
      default:
        statusText = status;
        icon = 'fa-circle';
    }
    
    this.statusElement.innerHTML = `<i class="fas ${icon}"></i> ${statusText}`;
  }
  
  /**
   * Receives data from connected nodes
   */
  receiveData(data) {
    if (this.type === 'DISPLAY') {
      this.outputs.display.textContent = typeof data === 'object' ? 
        JSON.stringify(data, null, 2) : String(data);
    }
  }
  
  /**
   * Gets output data to send to connected nodes
   */
  getOutputData() {
    switch(this.type) {
      case 'HTTP_REQUEST':
        return this.lastResponse;
      case 'TEXT_INPUT':
        return this.inputs.text.value;
      default:
        return null;
    }
  }
  
  /**
   * Run the node logic
   */
  async run() {
    this.setStatus('running');
    
    try {
      switch(this.type) {
        case 'HTTP_REQUEST':
          await this.runHttpRequest();
          break;
        case 'TEXT_INPUT':
          // Just mark as executed since there's nothing to "run"
          this.executed = true;
          this.setStatus('ready');
          break;
        case 'DISPLAY':
          // Nothing to run, just update display
          this.executed = true;
          this.setStatus('ready');
          break;
      }
    } catch (error) {
      console.error(`Error running node ${this.id}:`, error);
      this.setStatus('error');
    }
  }
  
  /**
   * Run HTTP request node
   */
  async runHttpRequest() {
    try {
      const method = this.inputs.method.value;
      const url = this.inputs.url.value;
      
      if (!url) {
        throw new Error('URL is required');
      }
      
      // Parse headers if provided
      let headers = {};
      if (this.inputs.headers.value) {
        try {
          headers = JSON.parse(this.inputs.headers.value);
        } catch (e) {
          throw new Error('Invalid JSON in headers');
        }
      }
      
      // Prepare request options
      const options = {
        method,
        headers
      };
      
      // Add body for POST/PUT requests
      if ((method === 'POST' || method === 'PUT') && this.inputs.body.value) {
        try {
          const bodyObj = JSON.parse(this.inputs.body.value);
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          // If not valid JSON, send as raw text
          options.body = this.inputs.body.value;
        }
      }
      
      // Execute the fetch request
      const response = await fetch(url, options);
      
      // Parse response based on content type
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Store the response for connections
      this.lastResponse = data;
      
      // Display in preview
      this.outputs.preview.textContent = typeof data === 'object' ? 
        JSON.stringify(data, null, 2) : String(data);
      
      this.executed = true;
      this.setStatus('ready');
      
      return data;
    } catch (error) {
      this.outputs.preview.textContent = `Error: ${error.message}`;
      throw error;
    }
  }
}

export default NodeItem;