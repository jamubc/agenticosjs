// nodeModule.js
// This module integrates the node workflow functionality from old_versions

// Import necessary components from the old module
import NodeItem from './old_versions/agentjs-main/nodeGraph.js';
import { generateText } from './old_versions/agentjs-main/requests.js';
import { generateStreamingResponse } from './old_versions/agentjs-main/requestsOffline.js';

// Arrays for nodes and connections
let nodeCounter = 0;
let nodeItems = []; // Each element is a NodeItem instance
let connections = [];

/** 
 * If we are connecting nodes, store if a connection is
 * in progress (connecting === true) and which node
 * we started from (connectionStartNode).
 */
let connecting = false;
let connectionStartNode = null;

/** 
 * Selected node for dragging
 */
let selectedNode = null;
let offsetX, offsetY;

// Function to initialize the node workflow
export function initNodeWorkflow() {
  // Make nodeItems and connections globally available 
  // (needed by NodeItem instances)
  window.nodeItems = nodeItems;
  window.connections = connections;

  // Get references to the necessary DOM elements
  const nodeCanvas = document.getElementById('node-canvas');
  const svg = document.getElementById('connections');
  const executeAllBtn = document.getElementById('execute-all-btn');

  // Set up node menu event listeners
  document.getElementById('url').addEventListener('click', () => addNode('URL'));
  document.getElementById('picture').addEventListener('click', () => addNode('PICTURE'));
  document.getElementById('chat').addEventListener('click', () => addNode('CHAT'));

  // Add execute all button listener
  executeAllBtn.addEventListener('click', executeRequests);

  // Ensure connections is visible globally for node connections
  updateConnections();
}

/**
 * Create and place a new node on the canvas
 */
function addNode(type) {
  // 1) Create a <div> for the node's visual representation
  const nodeDom = document.createElement('div');
  nodeDom.className = 'node';
  nodeDom.style.top = `${Math.random() * 300}px`;
  nodeDom.style.left = `${Math.random() * 300}px`;
  nodeDom.setAttribute('id', `node-${nodeCounter++}`);

  // 2) Make it draggable
  nodeDom.onmousedown = startDrag;
  nodeDom.onclick = handleNodeClick; // for connection logic

  // 3) Append to the canvas
  const canvas = document.getElementById('node-canvas');
  canvas.appendChild(nodeDom);

  // 4) Create a NodeItem instance to handle the logic of this node
  const nodeObj = new NodeItem(type, nodeDom, connecting);
  nodeItems.push(nodeObj);
}

/**
 * Called when user mouses down on a node
 */
function startDrag(event) {
  // If alt-clicking, we skip drag to handle connection logic
  if (event.altKey) return;

  selectedNode = event.target;
  offsetX = event.clientX - selectedNode.offsetLeft;
  offsetY = event.clientY - selectedNode.offsetTop;

  document.addEventListener('mousemove', dragNode);
  document.addEventListener('mouseup', stopDrag);
}

/**
 * Called while dragging the node
 */
function dragNode(event) {
  if (!selectedNode) return;
  selectedNode.style.left = `${event.clientX - offsetX}px`;
  selectedNode.style.top = `${event.clientY - offsetY}px`;

  // If you have connections/lines, update them here
  updateConnections();
}

/**
 * Called when mouse is released
 */
function stopDrag() {
  document.removeEventListener('mousemove', dragNode);
  document.removeEventListener('mouseup', stopDrag);
  selectedNode = null;
}

/**
 * If user alt-clicks on a node, we connect them
 */
function handleNodeClick(event) {
  if (event.altKey) {
    const clickedNode = event.currentTarget;
    // If not currently connecting, start a connection
    if (!connecting) {
      connecting = true;
      connectionStartNode = clickedNode;
      clickedNode.style.outline = '2px dashed #ff9900'; // highlight
    } else {
      // Finish the connection
      connecting = false;
      connectionStartNode.style.outline = 'none';

      // If second node is different from first
      if (clickedNode !== connectionStartNode) {
        connections.push({
          from: connectionStartNode.getAttribute('id'),
          to: clickedNode.getAttribute('id')
        });
      }
      connectionStartNode = null;
      
      updateConnections();
    }
  }
}

function updateConnections() {
  // Get the SVG element
  const svg = document.getElementById('connections');
  
  // Clear existing lines
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  defineArrowMarker(); // Call BEFORE drawing lines

  connections.forEach(conn => {
    const fromNode = document.getElementById(conn.from);
    const toNode = document.getElementById(conn.to);
    if (!fromNode || !toNode) return;

    // Get center points of each node
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const canvas = document.getElementById('node-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const x2 = toRect.left + toRect.width / 2 - canvasRect.left;
    const y2 = toRect.top + toRect.height / 2 - canvasRect.top;

    // Create a new line in SVG
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#555');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrow)'); // optional arrow
    line.setAttribute('stroke', fromNode === connectionStartNode ? '#ff9900' : '#555');

    svg.appendChild(line);
  });

  defineArrowMarker();
}

/**
 * Optional arrow marker definition
 */
function defineArrowMarker() {
  const svg = document.getElementById('connections');
  if (document.getElementById('arrow')) return; // Already defined
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrow');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'strokeWidth');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M0,0 L0,6 L6,3 Z');
  path.setAttribute('fill', '#555');

  marker.appendChild(path);

  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
  }
  defs.appendChild(marker);
}

/**
 * Execute all node requests by calling each node's run() method
 */
function executeRequests() {
  nodeItems.forEach(node => {
    node.run();
  });
}