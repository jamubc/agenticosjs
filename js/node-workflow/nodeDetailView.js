/**
 * Node detail view functionality for large outputs
 */

// Maximum characters to show in node before truncating
const MAX_VISIBLE_CHARS = 500;

/**
 * Creates the detail view modal for large node outputs
 */
export function createNodeDetailModal() {
  // Create modal if it doesn't exist yet
  if (!document.getElementById('node-detail-modal')) {
    const modal = document.createElement('div');
    modal.id = 'node-detail-modal';
    modal.className = 'modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content node-detail-content">
        <div class="modal-header">
          <h2 id="detail-modal-title">Node Output</h2>
          <button class="close-modal-btn" aria-label="Close Modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-view-options">
            <button id="copy-output-btn" class="secondary-btn">
              <i class="fas fa-copy"></i> Copy to Clipboard
            </button>
            <select id="output-format-select">
              <option value="auto">Auto-detect Format</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="text">Plain Text</option>
            </select>
          </div>
          <div id="detail-content-container" class="detail-content-container">
            <pre id="detail-content" class="detail-content"></pre>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Copy button functionality
    const copyBtn = document.getElementById('copy-output-btn');
    copyBtn.addEventListener('click', () => {
      const content = document.getElementById('detail-content').textContent;
      navigator.clipboard.writeText(content)
        .then(() => {
          // Show a toast notification
          showToast('Copied to clipboard!');
        })
        .catch(err => console.error('Failed to copy: ', err));
    });
    
    // Format selection functionality
    const formatSelect = document.getElementById('output-format-select');
    formatSelect.addEventListener('change', () => {
      const detailContent = document.getElementById('detail-content');
      const format = formatSelect.value;
      const rawContent = detailContent.getAttribute('data-raw');
      
      if (!rawContent) return;
      
      try {
        switch(format) {
          case 'json':
            const jsonObj = JSON.parse(rawContent);
            detailContent.textContent = JSON.stringify(jsonObj, null, 2);
            detailContent.className = 'detail-content language-json';
            break;
          case 'html':
            detailContent.textContent = rawContent;
            detailContent.className = 'detail-content language-html';
            break;
          default:
            detailContent.textContent = rawContent;
            detailContent.className = 'detail-content';
        }
        
        // Apply syntax highlighting if hljs is available
        if (window.hljs) {
          hljs.highlightElement(detailContent);
        }
      } catch (err) {
        console.error('Error formatting content:', err);
        detailContent.textContent = rawContent;
      }
    });
  }
}

/**
 * Shows the node detail modal with the provided content
 * @param {string} title - Modal title
 * @param {string} content - Content to display
 */
export function showNodeDetailView(title, content) {
  // Make sure the modal exists
  createNodeDetailModal();
  
  const modal = document.getElementById('node-detail-modal');
  const titleEl = document.getElementById('detail-modal-title');
  const contentEl = document.getElementById('detail-content');
  
  // Set content
  titleEl.textContent = title;
  contentEl.textContent = content;
  
  // Store raw content for format switching
  contentEl.setAttribute('data-raw', content);
  
  // Detect format and apply highlighting
  const formatSelect = document.getElementById('output-format-select');
  
  // Auto-detect format
  let detectedFormat = 'text';
  try {
    JSON.parse(content);
    detectedFormat = 'json';
  } catch (e) {
    if (content.includes('<') && content.includes('>')) {
      detectedFormat = 'html';
    }
  }
  
  // Set the detected format
  formatSelect.value = detectedFormat;
  
  // Apply formatting
  switch(detectedFormat) {
    case 'json':
      try {
        contentEl.textContent = JSON.stringify(JSON.parse(content), null, 2);
        contentEl.className = 'detail-content language-json';
      } catch (err) {
        contentEl.textContent = content;
      }
      break;
    case 'html':
      contentEl.textContent = content;
      contentEl.className = 'detail-content language-html';
      break;
    default:
      contentEl.textContent = content;
      contentEl.className = 'detail-content';
  }
  
  // Apply syntax highlighting if hljs is available
  if (window.hljs) {
    hljs.highlightElement(contentEl);
  }
  
  // Show the modal
  modal.style.display = 'flex';
}

/**
 * Show a simple toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms
 */
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * Handles large outputs by truncating and adding a view details button
 * @param {HTMLElement} outputElement - The element to display output in
 * @param {string} content - The full content
 * @param {string} nodeType - The type of node
 * @param {string} nodeId - The ID of the node
 * @returns {string} The potentially truncated content
 */
export function handleLargeOutput(outputElement, content, nodeType, nodeId) {
  if (content && content.length > MAX_VISIBLE_CHARS) {
    // Create truncated version for display
    const truncated = content.substring(0, MAX_VISIBLE_CHARS) + '...';
    
    // Add detail view button if not already present
    if (!outputElement.nextElementSibling || !outputElement.nextElementSibling.classList.contains('output-actions')) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'output-actions';
      btnContainer.style.marginTop = '10px';
      btnContainer.style.textAlign = 'center';
      
      const detailBtn = document.createElement('button');
      detailBtn.className = 'view-details-btn';
      detailBtn.innerHTML = '<i class="fas fa-expand"></i> View Full Output';
      detailBtn.style.fontSize = '0.85rem';
      detailBtn.style.padding = '6px 12px';
      detailBtn.style.backgroundColor = 'rgba(63, 140, 255, 0.1)';
      detailBtn.style.color = '#3f8cff';
      detailBtn.style.border = 'none';
      detailBtn.style.borderRadius = '4px';
      detailBtn.style.cursor = 'pointer';
      
      // Store full content as a data attribute
      detailBtn.setAttribute('data-full-content', content);
      
      detailBtn.addEventListener('click', () => {
        showNodeDetailView(`${nodeType} Node Output`, content);
      });
      
      btnContainer.appendChild(detailBtn);
      
      // Insert after output element
      if (outputElement.parentNode) {
        outputElement.parentNode.insertBefore(btnContainer, outputElement.nextSibling);
      }
    }
    
    return truncated;
  }
  
  return content;
}