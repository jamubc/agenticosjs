/**
 * nodeModule.js
 * Main controller for the node workflow functionality
 */

import NodeItem from './nodeGraphClass.js';

// Arrays for nodes and connections
let nodeItems = []; 
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
  console.log("Initializing node workflow...");
  // Get references to DOM elements
  const canvas = document.getElementById('node-canvas');
  const svg = document.getElementById('connections');
  const sidebar = document.getElementById('node-sidebar');
  const toolbar = document.getElementById('node-toolbar');
  
  if (!canvas || !svg) {
    console.error("Required DOM elements not found");
    return;
  }
  
  // Set up canvas for panning and zooming
  setupCanvasInteractions(canvas, svg);
  
  // Set up event listeners for node creation from sidebar
  setupNodeCreation(sidebar, canvas);
  
  // Set up event listeners for node connections
  setupConnectionHandling(canvas, svg);
  
  // Set up workflow execution
  setupWorkflowExecution();
  
  // Make the canvas and node items globally accessible
  window.nodeItems = nodeItems;
  window.connections = connections;
  window.canvasScale = canvasScale;
  window.canvasOffset = canvasOffset;
  
  // Clear any existing nodes and connections
  clearWorkflow();
  
  console.log("Node workflow initialized successfully");
}

/**
 * Set up canvas interactions (panning and zooming)
 */
function setupCanvasInteractions(canvas, svg) {
  const content = document.createElement('div');
  content.id = 'canvas-content';
  content.style.position = 'absolute';
  content.style.top = '0';
  content.style.left = '0';
  content.style.width = '100%';
  content.style.height = '100%';
  content.style.transform = 'scale(1) translate(0px, 0px)';
  content.style.transformOrigin = '0 0';
  
  // Move existing SVG inside content
  if (canvas.contains(svg)) {
    canvas.removeChild(svg);
  }
  content.appendChild(svg);
  canvas.appendChild(content);
  
  // Set up zoom controls
  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  zoomControls.style.position = 'absolute';
  zoomControls.style.bottom = '20px';
  zoomControls.style.left = '20px';
  zoomControls.style.zIndex = '100';
  
  // Zoom in button
  const zoomInBtn = document.createElement('button');
  zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
  zoomInBtn.title = 'Zoom In';
  zoomInBtn.style.margin = '5px';
  zoomInBtn.addEventListener('click', () => zoomCanvas(0.1));
  
  // Zoom out button
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
  zoomOutBtn.title = 'Zoom Out';
  zoomOutBtn.style.margin = '5px';
  zoomOutBtn.addEventListener('click', () => zoomCanvas(-0.1));
  
  // Reset zoom button
  const resetZoomBtn = document.createElement('button');
  resetZoomBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
  resetZoomBtn.title = 'Reset View';
  resetZoomBtn.style.margin = '5px';
  resetZoomBtn.addEventListener('click', resetCanvasTransform);
  
  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(resetZoomBtn);
  zoomControls.appendChild(zoomInBtn);
  canvas.appendChild(zoomControls);
  
  // Canvas dragging (panning)
  canvas.addEventListener('mousedown', (e) => {
    // Only start dragging on direct canvas background clicks
    if (e.target === canvas || e.target === content) {
      isDraggingCanvas = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });
  
  // Mouse wheel zooming
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      zoomCanvas(delta, { x: e.clientX, y: e.clientY });
    }
  });
  
  // Mouse move for dragging
  document.addEventListener('mousemove', (e) => {
    if (isDraggingCanvas) {
      const deltaX = (e.clientX - lastMousePos.x) / canvasScale;
      const deltaY = (e.clientY - lastMousePos.y) / canvasScale;
      
      canvasOffset.x += deltaX;
      canvasOffset.y += deltaY;
      
      applyCanvasTransform();
      
      lastMousePos = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  });
  
  // Mouse up to end dragging
  document.addEventListener('mouseup', () => {
    if (isDraggingCanvas) {
      isDraggingCanvas = false;
      canvas.style.cursor = 'default';
      updateConnections();
    }
  });
  
  // Space key for temporary panning
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
 * Zoom canvas by a delta amount
 */
function zoomCanvas(delta, point) {
  const canvas = document.getElementById('node-canvas');
  const content = document.getElementById('canvas-content');
  
  if (!canvas || !content) return;
  
  // Calculate new scale
  const newScale = Math.max(0.25, Math.min(3, canvasScale + delta));
  
  // If scale didn't change, return
  if (newScale === canvasScale) return;
  
  // If point is specified, zoom towards that point
  if (point) {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = point.x - canvasRect.left;
    const mouseY = point.y - canvasRect.top;
    
    // Calculate offsets to keep the point under the mouse cursor
    const scaleRatio = newScale / canvasScale;
    canvasOffset.x = mouseX - scaleRatio * (mouseX - canvasOffset.x * canvasScale) / canvasScale;
    canvasOffset.y = mouseY - scaleRatio * (mouseY - canvasOffset.y * canvasScale) / canvasScale;
  }
  
  // Update scale
  canvasScale = newScale;
  
  // Apply transform
  applyCanvasTransform();
  
  // Update connections
  updateConnections();
}

/**
 * Apply canvas transform based on scale and offset
 */
function applyCanvasTransform() {
  const content = document.getElementById('canvas-content');
  if (!content) return;
  
  content.style.transform = `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
}

/**
 * Reset canvas transform to default
 */
function resetCanvasTransform() {
  canvasScale = 1;
  canvasOffset = { x: 0, y: 0 };
  
  applyCanvasTransform();
  updateConnections();
}

/**
 * Set up node creation from sidebar
 */
function setupNodeCreation(sidebar, canvas) {
  if (!sidebar) return;
  
  // Add click event listeners to node menu items
  const nodeMenuItems = sidebar.querySelectorAll('.node-menu-item[data-node-type]');
  
  nodeMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const nodeType = item.getAttribute('data-node-type');
      createNode(nodeType, canvas);
    });
  });
}

/**
 * Create a new node
 */
function createNode(type, canvas) {
  const content = document.getElementById('canvas-content');
  if (!content) return null;
  
  // Create a DOM element for the node
  const nodeElement = document.createElement('div');
  nodeElement.className = 'node';
  nodeElement.setAttribute('id', `node-${Date.now()}`);
  nodeElement.setAttribute('data-type', type);
  
  // Calculate position in canvas space
  const canvasRect = canvas.getBoundingClientRect();
  const centerX = (canvasRect.width / 2 - canvasOffset.x * canvasScale) / canvasScale;
  const centerY = (canvasRect.height / 2 - canvasOffset.y * canvasScale) / canvasScale;
  
  // Add some randomness to position
  const randomOffset = 100;
  const posX = centerX + (Math.random() * 2 - 1) * randomOffset;
  const posY = centerY + (Math.random() * 2 - 1) * randomOffset;
  
  // Set initial position
  nodeElement.style.left = `${posX}px`;
  nodeElement.style.top = `${posY}px`;
  
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
 * Set up node dragging
 */
function setupNodeDrag(nodeElement) {
  nodeElement.addEventListener('mousedown', (e) => {
    // Skip if clicking on ports or other interactive elements
    if (e.target.classList.contains('node-port') || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'BUTTON') {
      return;
    }
    
    // Skip if connecting
    if (isConnecting) return;
    
    // Prevent event from bubbling to canvas
    e.stopPropagation();
    
    // Start dragging
    draggedNode = nodeElement;
    
    // Calculate offset from mouse to node corner
    const rect = nodeElement.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
  });
}

/**
 * Handle node dragging
 */
document.addEventListener('mousemove', (e) => {
  if (draggedNode) {
    const canvasContent = document.getElementById('canvas-content');
    if (!canvasContent) return;
    
    const canvasRect = canvasContent.getBoundingClientRect();
    
    // Calculate new position in canvas space
    const left = (e.clientX - canvasRect.left - dragOffset.x) / canvasScale;
    const top = (e.clientY - canvasRect.top - dragOffset.y) / canvasScale;
    
    // Update node position
    draggedNode.style.left = `${left}px`;
    draggedNode.style.top = `${top}px`;
    
    // Update connections
    updateConnections();
    
    e.preventDefault();
  }
});

/**
 * End node dragging
 */
document.addEventListener('mouseup', () => {
  draggedNode = null;
});

/**
 * Set up connection handling between nodes
 */
function setupConnectionHandling(canvas, svg) {
  if (!canvas || !svg) return;
  
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
      // Prevent event from bubbling
      e.stopPropagation();
      
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
          
          // Check if connection already exists
          const connectionExists = connections.some(conn => 
            conn.from === fromNodeId && conn.to === toNodeId);
          
          // Add connection if it doesn't exist
          if (!connectionExists) {
            connections.push({
              from: fromNodeId,
              to: toNodeId
            });
            
            // Update connections
            updateConnections();
          }
        }
      }
      
      // Clean up
      isConnecting = false;
      connectionStartNode = null;
      connectionStartPort = null;
      
      if (tempConnectionLine) {
        tempConnectionLine.remove();
        tempConnectionLine = null;
      }
    }
  });
}

/**
 * Update temporary connection line
 */
function updateTempConnectionLine(startX, startY, endX, endY) {
  if (!tempConnectionLine) return;
  
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

// Update the updateConnections function to make connections more obvious

function updateConnections() {
  const svg = document.getElementById('connections');
  if (!svg) return;
  
  // Clear existing connections
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  
  // Add marker definitions for arrow tips
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '12');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'userSpaceOnUse');
  
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrowPath.setAttribute('points', '0 0, 12 4, 0 8');
  arrowPath.setAttribute('fill', '#3f8cff');
  
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  
  // Add flow animation definitions
  const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  glowFilter.setAttribute('id', 'glow');
  glowFilter.setAttribute('x', '-20%');
  glowFilter.setAttribute('y', '-20%');
  glowFilter.setAttribute('width', '140%');
  glowFilter.setAttribute('height', '140%');
  
  const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  feGaussianBlur.setAttribute('stdDeviation', '3');
  feGaussianBlur.setAttribute('result', 'blur');
  
  const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
  feComposite.setAttribute('in', 'SourceGraphic');
  feComposite.setAttribute('in2', 'blur');
  feComposite.setAttribute('operator', 'over');
  
  glowFilter.appendChild(feGaussianBlur);
  glowFilter.appendChild(feComposite);
  defs.appendChild(glowFilter);
  
  // Add animated gradient
  const flowDef = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  flowDef.setAttribute('id', 'flow-gradient');
  flowDef.setAttribute('gradientUnits', 'userSpaceOnUse');
  
  // Add animated stops
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#3f8cff');
  stop1.setAttribute('stop-opacity', '0.2');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '50%');
  stop2.setAttribute('stop-color', '#3f8cff');
  stop2.setAttribute('stop-opacity', '1');
  
  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', '#3f8cff');
  stop3.setAttribute('stop-opacity', '0.2');
  
  // Add animation
  const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animate.setAttribute('attributeName', 'offset');
  animate.setAttribute('values', '-1;1');
  animate.setAttribute('dur', '3s');
  animate.setAttribute('repeatCount', 'indefinite');
  
  stop2.appendChild(animate);
  
  flowDef.appendChild(stop1);
  flowDef.appendChild(stop2);
  flowDef.appendChild(stop3);
  defs.appendChild(flowDef);
  
  // Mark connected ports
  connections.forEach(conn => {
    const fromNode = document.getElementById(conn.from);
    const toNode = document.getElementById(conn.to);
    
    if (fromNode && toNode) {
      const outputPort = fromNode.querySelector('.node-port.output');
      const inputPort = toNode.querySelector('.node-port.input');
      
      if (outputPort && inputPort) {
        outputPort.classList.add('connected');
        inputPort.classList.add('connected');
      }
    }
  });
  
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
    const contentRect = document.getElementById('canvas-content').getBoundingClientRect();
    
    // Calculate port center positions in canvas space
    const fromX = (fromRect.left + fromRect.width / 2 - contentRect.left) / canvasScale;
    const fromY = (fromRect.top + fromRect.height / 2 - contentRect.top) / canvasScale;
    const toX = (toRect.left + toRect.width / 2 - contentRect.left) / canvasScale;
    const toY = (toRect.top + toRect.height / 2 - contentRect.top) / canvasScale;
    
    // Create connection container group
    const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionGroup.setAttribute('class', 'connection-group');
    connectionGroup.setAttribute('data-from', conn.from);
    connectionGroup.setAttribute('data-to', conn.to);
    
    // Calculate distance for control points
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlPointOffset = Math.min(distance * 0.5, 150);
    
    // Create curved path
    const pathD = `M ${fromX} ${fromY} 
                 C ${fromX + controlPointOffset} ${fromY}, 
                   ${toX - controlPointOffset} ${toY}, 
                   ${toX} ${toY}`;
    
    // Base path (thicker, with glow)
    const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    basePath.setAttribute('d', pathD);
    basePath.setAttribute('stroke', '#3f8cff');
    basePath.setAttribute('stroke-width', '4');
    basePath.setAttribute('fill', 'none');
    basePath.setAttribute('stroke-opacity', '0.3');
    basePath.setAttribute('filter', 'url(#glow)');
    connectionGroup.appendChild(basePath);
    
    // Main path
    const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mainPath.setAttribute('d', pathD);
    mainPath.setAttribute('stroke', 'url(#flow-gradient)');
    mainPath.setAttribute('stroke-width', '2.5');
    mainPath.setAttribute('fill', 'none');
    mainPath.setAttribute('marker-end', 'url(#arrowhead)');
    mainPath.setAttribute('class', 'flow-path');
    connectionGroup.appendChild(mainPath);
    
    // Add connection endpoint dots for extra visibility
    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('cx', fromX);
    startDot.setAttribute('cy', fromY);
    startDot.setAttribute('r', '3');
    startDot.setAttribute('class', 'connection-dot');
    connectionGroup.appendChild(startDot);
    
    svg.appendChild(connectionGroup);
    
    // Make connection interactive
    connectionGroup.addEventListener('mouseenter', () => {
      mainPath.classList.add('connection-highlight');
    });
    
    connectionGroup.addEventListener('mouseleave', () => {
      mainPath.classList.remove('connection-highlight');
    });
  });
}

/**
 * Set up workflow execution
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
 * Execute the workflow
 */
async function executeWorkflow() {
  // Build graph representation
  const graph = buildDependencyGraph();
  
  // Execute in order
  for (const nodeId of graph.executionOrder) {
    const nodeItem = nodeItems.find(node => node.id === nodeId);
    
    if (nodeItem) {
      try {
        // Show running state
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
          nodeElement.classList.add('running');
        }
        
        // Run node
        await nodeItem.run();
        
        // Pass data to connected nodes
        const outgoingConnections = connections.filter(conn => conn.from === nodeId);
        
        for (const conn of outgoingConnections) {
          const targetNodeItem = nodeItems.find(node => node.id === conn.to);
          if (targetNodeItem && typeof targetNodeItem.receiveData === 'function') {
            const outputData = nodeItem.getOutputData();
            targetNodeItem.receiveData(outputData);
          }
        }
        
        // Show completed state
        if (nodeElement) {
          nodeElement.classList.remove('running');
          nodeElement.classList.add('completed');
          
          // Reset after a delay
          setTimeout(() => {
            nodeElement.classList.remove('completed');
          }, 2000);
        }
      } catch (error) {
        console.error(`Error executing node ${nodeId}:`, error);
        
        // Show error state
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
          nodeElement.classList.remove('running');
          nodeElement.classList.add('error');
        }
      }
    }
  }
}

/**
 * Build a dependency graph for execution ordering
 */
function buildDependencyGraph() {
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
  
  // Topological sort
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
 * Clear the workflow
 */
function clearWorkflow() {
  const canvasContent = document.getElementById('canvas-content');
  
  // Remove node elements
  nodeItems.forEach(node => {
    const element = document.getElementById(node.id);
    if (element && element.parentNode === canvasContent) {
      canvasContent.removeChild(element);
    }
  });
  
  // Clear arrays
  nodeItems = [];
  connections = [];
  
  // Update UI
  updateConnections();
}

// Export useful functions to window
window.createNode = createNode;
window.executeWorkflow = executeWorkflow;
window.clearWorkflow = clearWorkflow;
window.updateConnections = updateConnections;
window.zoomCanvas = zoomCanvas;
window.resetCanvasTransform = resetCanvasTransform;