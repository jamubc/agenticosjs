/**
 * nodeModule.js
 * Main controller for the node workflow functionality
 */

import NodeItem from './nodeGraphClass.js';

// Arrays for nodes and connections
let nodeItems = []; // Each element is a NodeItem instance
let connections = [];

// Canvas state
let canvasScale = 1;
let canvasOffset = { x: 0, y: 0 };
let isDraggingCanvas = false;
let lastMousePos = { x: 0, y: 0 };

// Connection state
let isConnecting = false;
let connectionStartNode = null;
let connectionStartPort = null;
let tempConnectionLine = null;

// Node dragging state
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };

/**
 * Initialize the node workflow editor
 */
export function initNodeWorkflow() {
  // Get references to DOM elements
  const canvas = document.getElementById('node-canvas');
  const svg = document.getElementById('connections');
  const sidebar = document.getElementById('node-sidebar');
  const toolbar = document.getElementById('node-toolbar');
  
  // Modify sidebar to include our new node types
  updateSidebar(sidebar);
  
  // Modify toolbar to include our new controls
  updateToolbar(toolbar);
  
  // Add dotted background pattern to canvas
  setupCanvasBackground(canvas);
  
  // Add zoom and pan controls
  setupZoomControls(canvas);
  
  // Make the canvas draggable
  setupCanvasDrag(canvas);
  
  // Set up event listeners for node creation from sidebar
  setupNodeCreation(sidebar, canvas);
  
  // Set up event listeners for node connections
  setupConnectionHandling(canvas, svg);
  
  // Set up workflow execution
  setupWorkflowExecution();
  
  // Make the canvas and node items globally accessible
  window.nodeItems = nodeItems;
  window.connections = connections;
  
  // Clear any existing nodes and connections
  clearWorkflow();
}

/**
 * Updates the sidebar with our custom node types
 */
function updateSidebar(sidebar) {
  // Clear existing node menu items
  const existingItems = sidebar.querySelectorAll('.node-menu-item');
  existingItems.forEach(item => {
    if (item.id !== 'node-settings' && item.id !== 'node-help') {
      item.remove();
    }
  });
  
  // Find the first h3 tag to insert our items after
  const firstHeading = sidebar.querySelector('h3');
  
  // Create node type menu items
  const nodeTypes = [
    { id: 'http-request-node', type: 'HTTP_REQUEST', icon: 'fa-globe', label: 'HTTP Request' },
    { id: 'display-node', type: 'DISPLAY', icon: 'fa-desktop', label: 'Display' },
    { id: 'text-input-node', type: 'TEXT_INPUT', icon: 'fa-keyboard', label: 'Text Input' }
  ];
  
  // Add each node type to the sidebar
  nodeTypes.forEach(nodeType => {
    const menuItem = document.createElement('div');
    menuItem.className = 'node-menu-item';
    menuItem.id = nodeType.id;
    menuItem.setAttribute('data-node-type', nodeType.type);
    menuItem.innerHTML = `<i class="fas ${nodeType.icon}"></i> ${nodeType.label}`;
    
    // Insert after the first heading
    if (firstHeading && firstHeading.nextSibling) {
      sidebar.insertBefore(menuItem, firstHeading.nextSibling);
    } else {
      sidebar.appendChild(menuItem);
    }
  });
}

/**
 * Updates the toolbar with additional controls
 */
function updateToolbar(toolbar) {
  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-workflow-btn';
  clearBtn.innerHTML = '<i class="fas fa-trash"></i> Clear';
  clearBtn.title = 'Clear Workflow';
  clearBtn.addEventListener('click', clearWorkflow);
  
  // Add to toolbar
  toolbar.appendChild(clearBtn);
  
  // Find the execute all button and update its styling
  const executeBtn = document.getElementById('execute-all-btn');
  if (executeBtn) {
    executeBtn.innerHTML = '<i class="fas fa-play"></i> Run Workflow';
  }
}

/**
 * Adds dotted background to canvas
 */
function setupCanvasBackground(canvas) {
  // Background is already styled via CSS in nodeModule.css
  
  // Add a container for zoom/pan
  const canvasContent = document.createElement('div');
  canvasContent.id = 'canvas-content';
  canvasContent.style.position = 'absolute';
  canvasContent.style.top = '0';
  canvasContent.style.left = '0';
  canvasContent.style.width = '100%';
  canvasContent.style.height = '100%';
  canvasContent.style.transform = 'scale(1) translate(0px, 0px)';
  canvasContent.style.transformOrigin = '0 0';
  canvasContent.style.transition = 'transform 0.1s';
  
  // Move SVG inside canvas content
  const svg = document.getElementById('connections');
  canvas.removeChild(svg);
  canvasContent.appendChild(svg);
  
  canvas.appendChild(canvasContent);
}

/**
 * Sets up zoom controls for the canvas
 */
function setupZoomControls(canvas) {
  // Create zoom controls container
  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  
  // Zoom in button
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-btn';
  zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
  zoomInBtn.title = 'Zoom In';
  zoomInBtn.addEventListener('click', () => {
    zoomCanvas(0.1);
  });
  
  // Zoom out button
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-btn';
  zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
  zoomOutBtn.title = 'Zoom Out';
  zoomOutBtn.addEventListener('click', () => {
    zoomCanvas(-0.1);
  });
  
  // Reset zoom button
  const resetZoomBtn = document.createElement('button');
  resetZoomBtn.className = 'zoom-btn';
  resetZoomBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
  resetZoomBtn.title = 'Reset Zoom';
  resetZoomBtn.addEventListener('click', () => {
    resetCanvasTransform();
  });
  
  // Add buttons to controls
  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(resetZoomBtn);
  zoomControls.appendChild(zoomInBtn);
  
  // Add zoom controls to canvas
  canvas.appendChild(zoomControls);
  
  // Add mouse wheel zoom
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      zoomCanvas(delta, { x: e.clientX, y: e.clientY });
    }
  });
}

/**
 * Zooms the canvas by the specified delta
 */
function zoomCanvas(delta, point) {
  const canvas = document.getElementById('node-canvas');
  const content = document.getElementById('canvas-content');
  
  // Calculate new scale
  const newScale = Math.max(0.5, Math.min(2, canvasScale + delta));
  
  // If scale didn't change, return
  if (newScale === canvasScale) return;
  
  // If point is specified, zoom towards that point
  if (point) {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = point.x - canvasRect.left;
    const mouseY = point.y - canvasRect.top;
    
    // Calculate offsets to keep the point under the mouse cursor
    const scaleRatio = newScale / canvasScale;
    canvasOffset.x = mouseX - scaleRatio * (mouseX - canvasOffset.x);
    canvasOffset.y = mouseY - scaleRatio * (mouseY - canvasOffset.y);
  }
  
  // Update scale
  canvasScale = newScale;
  
  // Apply transform
  content.style.transform = `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
  
  // Update connections
  updateConnections();
}

/**
 * Resets the canvas transform (zoom and pan)
 */
function resetCanvasTransform() {
  const content = document.getElementById('canvas-content');
  
  canvasScale = 1;
  canvasOffset = { x: 0, y: 0 };
  
  content.style.transform = 'scale(1) translate(0px, 0px)';
  
  // Update connections
  updateConnections();
}

/**
 * Makes the canvas draggable (panning)
 */
function setupCanvasDrag(canvas) {
  canvas.addEventListener('mousedown', (e) => {
    // Only enable canvas dragging with middle mouse button or when holding Space
    if (e.button === 1 || e.altKey) {
      isDraggingCanvas = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDraggingCanvas) {
      const deltaX = (e.clientX - lastMousePos.x) / canvasScale;
      const deltaY = (e.clientY - lastMousePos.y) / canvasScale;
      
      canvasOffset.x += deltaX;
      canvasOffset.y += deltaY;
      
      const content = document.getElementById('canvas-content');
      content.style.transform = `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
      
      lastMousePos = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDraggingCanvas) {
      isDraggingCanvas = false;
      canvas.style.cursor = 'default';
      updateConnections();
    }
  });
  
  // Add keyboard shortcut for panning (Space)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      canvas.style.cursor = 'grab';
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      canvas.style.cursor = 'default';
    }
  });
}

/**
 * Sets up node creation from sidebar menu
 */
function setupNodeCreation(sidebar, canvas) {
  // Add click handler to node menu items
  const nodeMenuItems = sidebar.querySelectorAll('.node-menu-item[data-node-type]');
  
  nodeMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const nodeType = item.getAttribute('data-node-type');
      createNode(nodeType, canvas);
    });
  });
}

/**
 * Creates a new node on the canvas
 */
function createNode(type, canvas) {
  const content = document.getElementById('canvas-content');
  
  // Create a DOM element for the node
  const nodeElement = document.createElement('div');
  nodeElement.className = 'node';
  nodeElement.setAttribute('id', `node-${Date.now()}`);
  
  // Calculate position in canvas space
  const canvasRect = canvas.getBoundingClientRect();
  const centerX = (canvasRect.width / 2 - canvasOffset.x * canvasScale) / canvasScale;
  const centerY = (canvasRect.height / 2 - canvasOffset.y * canvasScale) / canvasScale;
  
  // Add some randomness to position
  const randomOffset = 100;
  const posX = centerX + (Math.random() * 2 - 1) * randomOffset;
  const posY = centerY + (Math.random() * 2 - 1) * randomOffset;
  
  // Create and set up the node
  const nodeItem = new NodeItem(type, nodeElement, { x: posX, y: posY });
  nodeItems.push(nodeItem);
  
  // Add node to canvas content
  content.appendChild(nodeElement);
  
  // Make node draggable
  setupNodeDrag(nodeElement);
  
  return nodeItem;
}

/**
 * Makes a node draggable
 */
function setupNodeDrag(nodeElement) {
  nodeElement.addEventListener('mousedown', (e) => {
    // Skip if clicking on inputs, buttons, etc.
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || 
        e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' ||
        e.target.classList.contains('node-port')) {
      return;
    }
    
    // Skip if connecting
    if (isConnecting) return;
    
    // Start dragging
    draggedNode = nodeElement;
    
    // Get current position
    const rect = nodeElement.getBoundingClientRect();
    
    // Calculate offset from mouse position to node corner
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Prevent event from bubbling to canvas
    e.stopPropagation();
  });
}

/**
 * Updates node position during dragging
 */
document.addEventListener('mousemove', (e) => {
  if (draggedNode) {
    const canvasContent = document.getElementById('canvas-content');
    const canvasRect = canvasContent.getBoundingClientRect();
    
    // Calculate new position in canvas space
    let left = (e.clientX - canvasRect.left - dragOffset.x) / canvasScale;
    let top = (e.clientY - canvasRect.top - dragOffset.y) / canvasScale;
    
    // Update node position
    draggedNode.style.left = `${left}px`;
    draggedNode.style.top = `${top}px`;
    
    // Update connections
    updateConnections();
    
    e.preventDefault();
  }
});

/**
 * Ends node dragging
 */
document.addEventListener('mouseup', () => {
  draggedNode = null;
});

/**
 * Sets up connection handling between nodes
 */
function setupConnectionHandling(canvas, svg) {
  // Handle port mouseover
  canvas.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('node-port')) {
      e.target.style.transform = e.target.classList.contains('input') ? 
        'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1.3)';
    }
  });
  
  // Handle port mouseout
  canvas.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('node-port')) {
      e.target.style.transform = e.target.classList.contains('input') ? 
        'translateY(-50%)' : 'translateY(-50%)';
    }
  });
  
  // Handle port mousedown (start connection)
  canvas.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('node-port')) {
      // Start connection
      isConnecting = true;
      connectionStartNode = e.target.getAttribute('data-node-id');
      connectionStartPort = e.target.getAttribute('data-port-type');
      
      // Create temporary connection line
      tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempConnectionLine.setAttribute('stroke', '#3f8cff');
      tempConnectionLine.setAttribute('stroke-width', '2');
      tempConnectionLine.setAttribute('fill', 'none');
      tempConnectionLine.setAttribute('stroke-dasharray', '5,5');
      
      svg.appendChild(tempConnectionLine);
      
      // Get starting position
      const portRect = e.target.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      
      // Calculate port center position
      const startX = (portRect.left + portRect.width / 2 - svgRect.left) / canvasScale;
      const startY = (portRect.top + portRect.height / 2 - svgRect.top) / canvasScale;
      
      // Update line
      updateTempConnectionLine(startX, startY, e.clientX, e.clientY);
      
      e.preventDefault();
      e.stopPropagation();
    }
  });
  
  // Handle mousemove during connection
  document.addEventListener('mousemove', (e) => {
    if (isConnecting && tempConnectionLine) {
      const svgRect = svg.getBoundingClientRect();
      const canvasContent = document.getElementById('canvas-content');
      const contentRect = canvasContent.getBoundingClientRect();
      
      // Get the port we started from
      const startPortElement = document.querySelector(`.node-port[data-node-id="${connectionStartNode}"][data-port-type="${connectionStartPort}"]`);
      
      if (startPortElement) {
        const portRect = startPortElement.getBoundingClientRect();
        
        // Calculate start and end positions
        const startX = (portRect.left + portRect.width / 2 - contentRect.left) / canvasScale;
        const startY = (portRect.top + portRect.height / 2 - contentRect.top) / canvasScale;
        const endX = (e.clientX - contentRect.left) / canvasScale;
        const endY = (e.clientY - contentRect.top) / canvasScale;
        
        // Update the connection line
        updateTempConnectionLine(startX, startY, endX, endY);
      }
    }
  });
  
  // Handle mouseup (end connection)
  document.addEventListener('mouseup', (e) => {
    if (isConnecting) {
      // Check if we're over a compatible port
      if (e.target.classList.contains('node-port')) {
        const endNodeId = e.target.getAttribute('data-node-id');
        const endPortType = e.target.getAttribute('data-port-type');
        
        // Ensure we're connecting output -> input
        if ((connectionStartPort === 'output' && endPortType === 'input') ||
            (connectionStartPort === 'input' && endPortType === 'output')) {
          
          // Determine from/to based on port types
          let fromNodeId, toNodeId;
          
          if (connectionStartPort === 'output') {
            fromNodeId = connectionStartNode;
            toNodeId = endNodeId;
          } else {
            fromNodeId = endNodeId;
            toNodeId = connectionStartNode;
          }
          
          // Add connection
          connections.push({
            from: fromNodeId,
            to: toNodeId
          });
          
          // Update connections
          updateConnections();
        }
      }
      
      // Clean up
      isConnecting = false;
      connectionStartNode = null;
      connectionStartPort = null;
      
      if (tempConnectionLine) {
        svg.removeChild(tempConnectionLine);
        tempConnectionLine = null;
      }
    }
  });
}

/**
 * Updates the temporary connection line during creation
 */
function updateTempConnectionLine(startX, startY, endX, endY) {
  if (tempConnectionLine) {
    // Create a curved path
    const dx = endX - startX;
    const dy = endY - startY;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 150);
    
    // Calculate control points for bezier curve
    const path = `M ${startX} ${startY} 
                 C ${startX + controlPointOffset} ${startY}, 
                   ${endX - controlPointOffset} ${endY}, 
                   ${endX} ${endY}`;
    
    tempConnectionLine.setAttribute('d', path);
  }
}

/**
 * Updates all connections based on node positions
 */
function updateConnections() {
  const svg = document.getElementById('connections');
  const canvasContent = document.getElementById('canvas-content');
  
  // Clear existing connections
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  
  // Add marker definitions for arrow tips
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '4');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '2');
  marker.setAttribute('orient', 'auto');
  
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M0,0 L0,4 L6,2 Z');
  arrowPath.setAttribute('fill', '#3f8cff');
  
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  
  // Draw connections
  connections.forEach(conn => {
    // Find ports
    const fromNode = document.getElementById(conn.from);
    const toNode = document.getElementById(conn.to);
    
    if (!fromNode || !toNode) return;
    
    const outputPort = fromNode.querySelector('.node-port.output');
    const inputPort = toNode.querySelector('.node-port.input');
    
    if (!outputPort || !inputPort) return;
    
    // Get port positions
    const fromRect = outputPort.getBoundingClientRect();
    const toRect = inputPort.getBoundingClientRect();
    const contentRect = canvasContent.getBoundingClientRect();
    
    // Calculate port center positions in canvas space
    const fromX = (fromRect.left + fromRect.width / 2 - contentRect.left) / canvasScale;
    const fromY = (fromRect.top + fromRect.height / 2 - contentRect.top) / canvasScale;
    const toX = (toRect.left + toRect.width / 2 - contentRect.left) / canvasScale;
    const toY = (toRect.top + toRect.height / 2 - contentRect.top) / canvasScale;
    
    // Create curved path
    const dx = toX - fromX;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 150);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${fromX} ${fromY} 
                            C ${fromX + controlPointOffset} ${fromY}, 
                              ${toX - controlPointOffset} ${toY}, 
                              ${toX} ${toY}`);
    path.setAttribute('stroke', '#3f8cff');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    
    svg.appendChild(path);
  });
}

/**
 * Sets up workflow execution
 */
function setupWorkflowExecution() {
  const executeBtn = document.getElementById('execute-all-btn');
  
  if (executeBtn) {
    executeBtn.addEventListener('click', async () => {
      await executeWorkflow();
    });
  }
}

/**
 * Executes the workflow, processing nodes in topological order
 */
async function executeWorkflow() {
  // Build graph representation
  const graph = buildConnectionGraph();
  
  // Execute in topological order
  const nodePromises = [];
  
  for (const nodeId of graph.executionOrder) {
    const nodeItem = findNodeById(nodeId);
    
    if (nodeItem) {
      // Execute node
      const promise = nodeItem.run();
      nodePromises.push(promise);
      
      try {
        await promise;
        
        // Pass data to connected nodes
        const outputData = nodeItem.getOutputData();
        
        if (outputData !== null && outputData !== undefined) {
          // Find connections from this node
          const outgoingConnections = connections.filter(conn => conn.from === nodeId);
          
          for (const conn of outgoingConnections) {
            const targetNode = findNodeById(conn.to);
            if (targetNode) {
              targetNode.receiveData(outputData);
            }
          }
        }
      } catch (error) {
        console.error(`Error executing node ${nodeId}:`, error);
      }
    }
  }
  
  // Wait for all nodes to complete
  await Promise.all(nodePromises);
}

/**
 * Builds a connection graph for execution ordering
 */
function buildConnectionGraph() {
  const graph = {
    nodes: {},
    executionOrder: []
  };
  
  // Initialize nodes
  nodeItems.forEach(node => {
    graph.nodes[node.id] = {
      id: node.id,
      incoming: [],
      outgoing: []
    };
  });
  
  // Add connections
  connections.forEach(conn => {
    if (graph.nodes[conn.from] && graph.nodes[conn.to]) {
      graph.nodes[conn.from].outgoing.push(conn.to);
      graph.nodes[conn.to].incoming.push(conn.from);
    }
  });
  
  // Determine execution order (topological sort)
  const visited = new Set();
  const temp = new Set();
  
  function visit(nodeId) {
    if (temp.has(nodeId)) {
      console.warn('Circular dependency detected in workflow');
      return;
    }
    
    if (visited.has(nodeId)) return;
    
    temp.add(nodeId);
    
    const node = graph.nodes[nodeId];
    if (node) {
      for (const neighbor of node.outgoing) {
        visit(neighbor);
      }
    }
    
    temp.delete(nodeId);
    visited.add(nodeId);
    graph.executionOrder.unshift(nodeId);
  }
  
  // Start with nodes that have no inputs
  for (const nodeId in graph.nodes) {
    if (graph.nodes[nodeId].incoming.length === 0) {
      visit(nodeId);
    }
  }
  
  // Handle remaining nodes
  for (const nodeId in graph.nodes) {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  }
  
  return graph;
}

/**
 * Finds a node by its ID
 */
function findNodeById(id) {
  return nodeItems.find(node => node.id === id);
}

/**
 * Clears the entire workflow
 */
function clearWorkflow() {
  // Remove all nodes from the canvas
  const canvasContent = document.getElementById('canvas-content');
  
  // Remove all node elements
  nodeItems.forEach(node => {
    if (node.domElement && node.domElement.parentNode === canvasContent) {
      canvasContent.removeChild(node.domElement);
    }
  });
  
  // Clear arrays
  nodeItems = [];
  connections = [];
  
  // Clear connections in SVG
  updateConnections();
}

// Initialize when the module is loaded
// initNodeWorkflow();