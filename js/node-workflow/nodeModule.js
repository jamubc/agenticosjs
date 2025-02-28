import NodeItem from './NodeGraphClass.js';

let nodeItems = [];
let connections = [];
let canvasScale = 1;
let canvasOffset = { x: 0, y: 0 };
let isDraggingCanvas = false;
let lastMousePos = { x: 0, y: 0 };
let isConnecting = false;
let connectionStartNode = null;
let connectionStartPort = null;
let tempConnectionLine = null;
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };

export function initNodeWorkflow() {
  console.log("Initializing node workflow...");
  const canvas = document.getElementById('node-canvas');
  const svg = document.getElementById('connections');
  const sidebar = document.getElementById('node-sidebar');

  if (!canvas || !svg) {
    console.error("Required DOM elements not found");
    return;
  }

  setupCanvasInteractions(canvas, svg);
  setupNodeCreation(sidebar, canvas);
  setupConnectionHandling(canvas, svg);
  setupWorkflowExecution();

  window.nodeItems = nodeItems;
  window.connections = connections;
  window.canvasScale = canvasScale;
  window.canvasOffset = canvasOffset;
  window.deleteNode = deleteNode;

  clearWorkflow();

  console.log("Node workflow initialized successfully");
}

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

  if (canvas.contains(svg)) {
    canvas.removeChild(svg);
  }
  content.appendChild(svg);
  canvas.appendChild(content);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  zoomControls.style.position = 'absolute';
  zoomControls.style.bottom = '20px';
  zoomControls.style.left = '20px';
  zoomControls.style.zIndex = '100';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
  zoomInBtn.title = 'Zoom In';
  zoomInBtn.style.margin = '5px';
  zoomInBtn.addEventListener('click', () => zoomCanvas(0.1));

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
  zoomOutBtn.title = 'Zoom Out';
  zoomOutBtn.style.margin = '5px';
  zoomOutBtn.addEventListener('click', () => zoomCanvas(-0.1));

  const resetZoomBtn = document.createElement('button');
  resetZoomBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
  resetZoomBtn.title = 'Reset View';
  resetZoomBtn.style.margin = '5px';
  resetZoomBtn.addEventListener('click', resetCanvasTransform);

  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(resetZoomBtn);
  zoomControls.appendChild(zoomInBtn);
  canvas.appendChild(zoomControls);

  canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas || e.target === content) {
      isDraggingCanvas = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      zoomCanvas(delta, { x: e.clientX, y: e.clientY });
    }
  });

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

  document.addEventListener('mouseup', () => {
    if (isDraggingCanvas) {
      isDraggingCanvas = false;
      canvas.style.cursor = 'default';
      updateConnections();
    }
  });
}

function zoomCanvas(delta, point) {
  const canvas = document.getElementById('node-canvas');
  const content = document.getElementById('canvas-content');

  if (!canvas || !content) return;

  const newScale = Math.max(0.25, canvasScale + delta);

  if (newScale === canvasScale) return;

  if (point) {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = point.x - canvasRect.left;
    const mouseY = point.y - canvasRect.top;

    const scaleRatio = newScale / canvasScale;
    canvasOffset.x = mouseX - scaleRatio * (mouseX - canvasOffset.x * canvasScale) / canvasScale;
    canvasOffset.y = mouseY - scaleRatio * (mouseY - canvasOffset.y * canvasScale) / canvasScale;
  }

  canvasScale = newScale;

  applyCanvasTransform();
  updateConnections();
}

function applyCanvasTransform() {
  const content = document.getElementById('canvas-content');
  if (!content) return;

  content.style.transform = `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
}

function resetCanvasTransform() {
  canvasScale = 1;
  canvasOffset = { x: 0, y: 0 };

  applyCanvasTransform();
  updateConnections();
}

function setupNodeCreation(sidebar, canvas) {
  if (!sidebar) return;

  const nodeTypes = [
    'URL', 'PICTURE', 'CHAT', 'HTTP_REQUEST', 
    'CLICK_TRIGGER', 'WEBHOOK_TRIGGER', 'TIMER_TRIGGER', 'DISPLAY'
  ];

  nodeTypes.forEach(type => {
    const item = document.createElement('div');
    item.className = 'node-menu-item';
    item.setAttribute('data-node-type', type);
    item.textContent = type.replace('_', ' ').toLowerCase();
    item.addEventListener('click', () => createNode(type, canvas));
    sidebar.appendChild(item);
  });
}

function createNode(type, canvas) {
  const content = document.getElementById('canvas-content');
  if (!content) return null;

  const nodeElement = document.createElement('div');
  nodeElement.className = 'node';
  nodeElement.setAttribute('id', `node-${Date.now()}`);
  nodeElement.setAttribute('data-type', type);

  const canvasRect = canvas.getBoundingClientRect();
  const centerX = (canvasRect.width / 2 - canvasOffset.x * canvasScale) / canvasScale;
  const centerY = (canvasRect.height / 2 - canvasOffset.y * canvasScale) / canvasScale;

  const randomOffset = 100;
  let posX = centerX + (Math.random() * 2 - 1) * randomOffset;
  let posY = centerY + (Math.random() * 2 - 1) * randomOffset;

  const nodeWidth = 280;
  const nodeHeight = 120;
  const margin = 20;

  posX = Math.max(margin, Math.min(posX, canvasRect.width / canvasScale - nodeWidth - margin));
  posY = Math.max(margin, Math.min(posY, canvasRect.height / canvasScale - nodeHeight - margin));

  nodeElement.style.left = `${posX}px`;
  nodeElement.style.top = `${posY}px`;

  const nodeItem = new NodeItem(type, nodeElement, { x: posX, y: posY });
  nodeItems.push(nodeItem);

  content.appendChild(nodeElement);
  setupNodeDrag(nodeElement);
  setupNodeResize(nodeElement);

  // Start timer for TIMER_TRIGGER nodes
  if (type === 'TIMER_TRIGGER') {
    nodeItem.startTimer();
  }

  return nodeItem;
}

function setupNodeDrag(nodeElement) {
  nodeElement.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('node-port') ||
        e.target.classList.contains('node-resize-handle') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'BUTTON') {
      return;
    }

    if (isConnecting) return;

    e.stopPropagation();

    draggedNode = nodeElement;

    const rect = nodeElement.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
  });
}

function setupNodeResize(nodeElement) {
  const resizeHandle = nodeElement.querySelector('.node-resize-handle');
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(nodeElement.style.width, 10) || nodeElement.offsetWidth;
    startHeight = parseInt(nodeElement.style.height, 10) || nodeElement.offsetHeight;
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      const dx = (e.clientX - startX) / canvasScale;
      const dy = (e.clientY - startY) / canvasScale;
      nodeElement.style.width = `${Math.max(280, startWidth + dx)}px`;
      nodeElement.style.height = `${Math.max(120, startHeight + dy)}px`;
      updateConnections();
      e.preventDefault();
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

document.addEventListener('mousemove', (e) => {
  if (draggedNode) {
    const canvasContent = document.getElementById('canvas-content');
    const canvas = document.getElementById('node-canvas');
    if (!canvasContent || !canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const contentRect = canvasContent.getBoundingClientRect();

    let left = (e.clientX - contentRect.left - dragOffset.x) / canvasScale;
    let top = (e.clientY - contentRect.top - dragOffset.y) / canvasScale;

    const nodeWidth = draggedNode.offsetWidth;
    const nodeHeight = draggedNode.offsetHeight;
    const margin = 20;

    left = Math.max(margin, Math.min(left, canvasRect.width / canvasScale - nodeWidth - margin));
    top = Math.max(margin, Math.min(top, canvasRect.height / canvasScale - nodeHeight - margin));

    draggedNode.style.left = `${left}px`;
    draggedNode.style.top = `${top}px`;

    updateConnections();
    e.preventDefault();
  }
});

document.addEventListener('mouseup', () => {
  draggedNode = null;
});

function deleteNode(nodeId) {
  const nodeElement = document.getElementById(nodeId);
  if (!nodeElement) return;

  const nodeItem = nodeItems.find(node => node.id === nodeId);
  if (nodeItem && nodeItem.type === 'TIMER_TRIGGER') {
    nodeItem.stopTimer();
  }

  if (nodeElement.parentNode) {
    nodeElement.parentNode.removeChild(nodeElement);
  }

  connections = connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId);
  nodeItems = nodeItems.filter(node => node.id !== nodeId);

  updateConnections();
}

function setupConnectionHandling(canvas, svg) {
  if (!canvas || !svg) return;

  canvas.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('node-port')) {
      e.stopPropagation();

      isConnecting = true;
      connectionStartNode = e.target.getAttribute('data-node-id');
      connectionStartPort = e.target.getAttribute('data-port-type');

      tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempConnectionLine.setAttribute('stroke', '#3f8cff');
      tempConnectionLine.setAttribute('stroke-width', '2');
      tempConnectionLine.setAttribute('fill', 'none');
      tempConnectionLine.setAttribute('stroke-dasharray', '5,5');

      svg.appendChild(tempConnectionLine);

      const portRect = e.target.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const startX = (portRect.left + portRect.width / 2 - svgRect.left) / canvasScale;
      const startY = (portRect.top + portRect.height / 2 - svgRect.top) / canvasScale;

      updateTempConnectionLine(startX, startY, e.clientX, e.clientY);
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isConnecting && tempConnectionLine) {
      const svgRect = svg.getBoundingClientRect();
      const canvasContent = document.getElementById('canvas-content');
      const contentRect = canvasContent.getBoundingClientRect();

      const startPortElement = document.querySelector(`.node-port[data-node-id="${connectionStartNode}"][data-port-type="${connectionStartPort}"]`);

      if (startPortElement) {
        const portRect = startPortElement.getBoundingClientRect();

        const startX = (portRect.left + portRect.width / 2 - contentRect.left) / canvasScale;
        const startY = (portRect.top + portRect.height / 2 - contentRect.top) / canvasScale;
        const endX = (e.clientX - contentRect.left) / canvasScale;
        const endY = (e.clientY - contentRect.top) / canvasScale;

        updateTempConnectionLine(startX, startY, endX, endY);

        const compatiblePorts = document.querySelectorAll(`.node-port.${connectionStartPort === 'output' ? 'input' : 'output'}:not([data-node-id="${connectionStartNode}"])`);
        compatiblePorts.forEach(port => port.classList.add('compatible-port'));
      }
    } else {
      document.querySelectorAll('.node-port.compatible-port').forEach(port => port.classList.remove('compatible-port'));
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (isConnecting) {
      if (e.target.classList.contains('node-port')) {
        const endNodeId = e.target.getAttribute('data-node-id');
        const endPortType = e.target.getAttribute('data-port-type');

        if (connectionStartNode === endNodeId) {
          isConnecting = false;
          connectionStartNode = null;
          connectionStartPort = null;
          if (tempConnectionLine) {
            tempConnectionLine.remove();
            tempConnectionLine = null;
          }
          return;
        }

        if ((connectionStartPort === 'output' && endPortType === 'input') ||
            (connectionStartPort === 'input' && endPortType === 'output')) {

          let fromNodeId, toNodeId;

          if (connectionStartPort === 'output') {
            fromNodeId = connectionStartNode;
            toNodeId = endNodeId;
          } else {
            fromNodeId = endNodeId;
            toNodeId = connectionStartNode;
          }

          const connectionExists = connections.some(conn =>
            conn.from === fromNodeId && conn.to === toNodeId);

          if (!connectionExists) {
            connections.push({
              from: fromNodeId,
              to: toNodeId
            });
            updateConnections();
          }
        }
      }

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

function updateTempConnectionLine(startX, startY, endX, endY) {
  if (!tempConnectionLine) return;

  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const controlPointOffset = Math.min(distance / 2, 100);

  const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
  tempConnectionLine.setAttribute('d', path);
}

function updateConnections() {
  const svg = document.getElementById('connections');
  if (!svg) return;

  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '7');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '3.5');
  marker.setAttribute('orient', 'auto');
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
  polygon.setAttribute('fill', '#3f8cff');
  marker.appendChild(polygon);
  defs.appendChild(marker);

  svg.appendChild(defs);

  connections.forEach(conn => {
    const fromNode = document.getElementById(conn.from);
    const toNode = document.getElementById(conn.to);

    if (!fromNode || !toNode) return;

    const outputPort = fromNode.querySelector('.node-port.output');
    const inputPort = toNode.querySelector('.node-port.input');

    if (!outputPort || !inputPort) return;

    const fromRect = outputPort.getBoundingClientRect();
    const toRect = inputPort.getBoundingClientRect();
    const contentRect = document.getElementById('canvas-content').getBoundingClientRect();

    const fromX = (fromRect.left + fromRect.width / 2 - contentRect.left) / canvasScale;
    const fromY = (fromRect.top + fromRect.height / 2 - contentRect.top) / canvasScale;
    const toX = (toRect.left + toRect.width / 2 - contentRect.left) / canvasScale;
    const toY = (toRect.top + toRect.height / 2 - contentRect.top) / canvasScale;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlPointOffset = Math.min(distance / 2, 100);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`);
    path.setAttribute('stroke', '#3f8cff');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('data-from', conn.from);
    path.setAttribute('data-to', conn.to);
    path.style.cursor = 'pointer';

    path.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      connections = connections.filter(c => c.from !== conn.from || c.to !== conn.to);
      updateConnections();
    });

    svg.appendChild(path);
  });
}

function setupWorkflowExecution() {
  const executeBtn = document.getElementById('execute-all-btn');

  if (executeBtn) {
    executeBtn.addEventListener('click', async () => {
      await executeWorkflow();
    });
  }
}

async function executeWorkflow() {
  const graph = buildDependencyGraph();
  const inputNodes = Object.values(graph.nodes).filter(node => node.incoming.length === 0);

  for (const node of inputNodes) {
    const nodeItem = nodeItems.find(n => n.id === node.id);
    if (nodeItem) {
      try {
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) {
          nodeElement.classList.add('running');
        }

        await nodeItem.run();

        const outgoingConnections = connections.filter(conn => conn.from === node.id);
        for (const conn of outgoingConnections) {
          const targetNodeItem = nodeItems.find(n => n.id === conn.to);
          if (targetNodeItem && typeof targetNodeItem.receiveData === 'function') {
            const outputData = nodeItem.getOutputData();
            targetNodeItem.receiveData(outputData);
            // Recursively execute dependent nodes
            await executeDependentNodes(targetNodeItem);
          }
        }

        if (nodeElement) {
          nodeElement.classList.remove('running');
          nodeElement.classList.add('completed');
          setTimeout(() => {
            nodeElement.classList.remove('completed');
          }, 2000);
        }
      } catch (error) {
        console.error(`Error executing node ${node.id}:`, error);
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) {
          nodeElement.classList.remove('running');
          nodeElement.classList.add('error');
        }
      }
    }
  }
}

async function executeDependentNodes(nodeItem) {
  try {
    const nodeElement = document.getElementById(nodeItem.id);
    if (nodeElement) {
      nodeElement.className = 'running';
    }

    await nodeItem.run();

    const outgoingConnections = connections.filter(conn => conn.from === nodeItem.id);
    for (const conn of outgoingConnections) {
      const targetNodeItem = nodeItems.find(n => n.id === conn.to);
      if (targetNodeItem && typeof targetNodeItem.receiveData === 'function') {
        const outputData = nodeItem.getOutputData();
        targetNodeItem.receiveData(outputData);
        await executeDependentNodes(targetNodeItem);
      }
    }

    if (nodeElement) {
      nodeElement.classList.remove('running');
      nodeElement.classList.add('completed');
      setTimeout(() => {
        nodeElement.classList.remove('completed');
      }, 2000);
    }
  } catch (error) {
    console.error(`Error executing dependent node ${nodeItem.id}:`, error);
    const nodeElement = document.getElementById(nodeItem.id);
    if (nodeElement) {
      nodeElement.classList.remove('running');
      nodeElement.classList.add('error');
    }
  }
}

function buildDependencyGraph() {
  const graph = {
    nodes: {},
    executionOrder: []
  };

  nodeItems.forEach(node => {
    graph.nodes[node.id] = {
      id: node.id,
      incoming: [],
      outgoing: []
    };
  });

  connections.forEach(conn => {
    if (graph.nodes[conn.from] && graph.nodes[conn.to]) {
      graph.nodes[conn.from].outgoing.push(conn.to);
      graph.nodes[conn.to].incoming.push(conn.from);
    }
  });

  return graph;
}

function clearWorkflow() {
  const canvasContent = document.getElementById('canvas-content');

  nodeItems.forEach(node => {
    if (node.type === 'TIMER_TRIGGER') {
      node.stopTimer();
    }
    const element = document.getElementById(node.id);
    if (element && element.parentNode === canvasContent) {
      canvasContent.removeChild(element);
    }
  });

  nodeItems = [];
  connections = [];

  updateConnections();
}

window.createNode = createNode;
window.executeWorkflow = executeWorkflow;
window.clearWorkflow = clearWorkflow;
window.updateConnections = updateConnections;
window.zoomCanvas = zoomCanvas;
window.resetCanvasTransform = resetCanvasTransform;