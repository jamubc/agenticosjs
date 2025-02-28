/**
 * Utility functions for the AI Assistant application
 */

const Utils = {
    /**
     * Generates a unique ID
     * @returns {string} A unique identifier
     */
    generateId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    /**
     * Format a date to a human-readable string
     * @param {Date|string|number} date - The date to format
     * @param {boolean} includeTime - Whether to include the time
     * @returns {string} The formatted date string
     */
    formatDate: function(date, includeTime = false) {
      const d = new Date(date);
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return d.toLocaleDateString(undefined, options);
    },
    
    /**
     * Debounce a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Time to wait in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },
    
    /**
     * Throttle a function call
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: function(func, limit) {
      let inThrottle;
      return function(...args) {
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    /**
     * Truncate a string to a maximum length
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncateString: function(str, maxLength) {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength - 3) + '...';
    },
    
    /**
     * Convert file size to human-readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Human-readable file size
     */
    formatFileSize: function(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Get file extension from filename
     * @param {string} filename - Filename to process
     * @returns {string} File extension
     */
    getFileExtension: function(filename) {
      return filename.split('.').pop().toLowerCase();
    },
    
    /**
     * Check if a file is an image
     * @param {string} filename - Filename to check
     * @returns {boolean} True if file is an image
     */
    isImageFile: function(filename) {
      const ext = this.getFileExtension(filename);
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    },
    
    /**
     * Check if a file is a document
     * @param {string} filename - Filename to check
     * @returns {boolean} True if file is a document
     */
    isDocumentFile: function(filename) {
      const ext = this.getFileExtension(filename);
      return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(ext);
    },
    
    /**
     * Convert base64 to blob
     * @param {string} base64 - Base64 string
     * @param {string} mimeType - MIME type of the file
     * @returns {Blob} Blob object
     */
    base64ToBlob: function(base64, mimeType) {
      const byteString = atob(base64.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([ab], { type: mimeType });
    },
    
    /**
     * Creates a simple token counter (not perfect, but reasonable approximation)
     * @param {string} text - Text to count tokens for
     * @returns {number} Approximate token count
     */
    estimateTokenCount: function(text) {
      if (!text) return 0;
      // This is a simple approximation, assuming ~4 chars per token on average
      return Math.ceil(text.length / 4);
    },
    
    /**
     * Create a download link for content
     * @param {string} content - Content to download
     * @param {string} filename - Filename for download
     * @param {string} mimeType - MIME type of the file
     */
    downloadContent: function(content, filename, mimeType = 'text/plain') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    
    /**
     * Parse markdown to HTML
     * @param {string} markdown - Markdown string to parse
     * @returns {string} HTML string
     */
    markdownToHtml: function(markdown) {
      if (!markdown) return '';
  
      // Parse code blocks with syntax highlighting
      markdown = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
        language = language || 'plaintext';
        try {
          const highlighted = hljs.highlight(code, { language }).value;
          return `<pre><code class="language-${language}">${highlighted}</code></pre>`;
        } catch (e) {
          return `<pre><code>${code}</code></pre>`;
        }
      });
      
      // Parse inline code
      markdown = markdown.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      // Parse headers
      markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      
      // Parse bold and italic
      markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Parse links
      markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // Parse unordered lists
      markdown = markdown.replace(/^\s*-\s*(.*)/gm, '<li>$1</li>');
      markdown = markdown.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
      
      // Parse ordered lists - this is simplified and could be improved
      markdown = markdown.replace(/^\s*(\d+)\.\s*(.*)/gm, '<li>$2</li>');
      
      // Parse paragraphs
      markdown = markdown.replace(/^(?!<[a-z]).+/gm, '<p>$&</p>');
      
      return markdown;
    },
    
    /**
     * Shows a toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, warning, error)
     * @param {string} title - Optional title
     * @param {number} duration - Duration in milliseconds
     */
    showToast: function(message, type = 'info', title = '', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      // Set icon based on type
      let icon = '';
      switch(type) {
        case 'success':
          icon = 'fa-check-circle';
          title = title || 'Success';
          break;
        case 'warning':
          icon = 'fa-exclamation-triangle';
          title = title || 'Warning';
          break;
        case 'error':
          icon = 'fa-times-circle';
          title = title || 'Error';
          break;
        default:
          icon = 'fa-info-circle';
          title = title || 'Information';
      }
      
      toast.innerHTML = `
        <div class="toast-icon">
          <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">${title}</div>
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      container.appendChild(toast);
      
      // Auto remove after duration
      setTimeout(() => {
        toast.remove();
      }, duration);
      
      // Manual close button
      toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
      });
    },
    
    /**
     * Shows a confirmation dialog
     * @param {string} message - Dialog message
     * @param {string} title - Dialog title
     * @param {Function} onConfirm - Callback function on confirmation
     * @param {Function} onCancel - Callback function on cancellation
     */
    showConfirm: function(message, title = 'Confirm', onConfirm, onCancel) {
      const modal = document.getElementById('alert-modal');
      const titleEl = document.getElementById('alert-title');
      const messageEl = document.getElementById('alert-message');
      const confirmBtn = document.getElementById('alert-confirm-btn');
      const cancelBtn = document.getElementById('alert-cancel-btn');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      modal.classList.add('visible');
      
      // Remove existing event listeners
      const confirmClone = confirmBtn.cloneNode(true);
      const cancelClone = cancelBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);
      cancelBtn.parentNode.replaceChild(cancelClone, cancelBtn);
      
      // Add new event listeners
      document.getElementById('alert-confirm-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
        if (onConfirm) onConfirm();
      });
      
      document.getElementById('alert-cancel-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
        if (onCancel) onCancel();
      });
    },
    
    /**
     * Shows an alert dialog
     * @param {string} message - Dialog message
     * @param {string} title - Dialog title
     * @param {Function} onClose - Callback function on close
     */
    showAlert: function(message, title = 'Alert', onClose) {
      const modal = document.getElementById('alert-modal');
      const titleEl = document.getElementById('alert-title');
      const messageEl = document.getElementById('alert-message');
      const confirmBtn = document.getElementById('alert-confirm-btn');
      const cancelBtn = document.getElementById('alert-cancel-btn');
      
      titleEl.textContent = title;
      messageEl.textContent = message;
      modal.classList.add('visible');
      
      // Hide cancel button
      cancelBtn.style.display = 'none';
      
      // Remove existing event listeners
      const confirmClone = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(confirmClone, confirmBtn);
      
      // Add new event listener
      document.getElementById('alert-confirm-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
        cancelBtn.style.display = 'block'; // Reset for future use
        if (onClose) onClose();
      });
    },
    
    /**
     * Encrypt sensitive data
     * @param {string} value - Value to encrypt
     * @param {string} key - Encryption key
     * @returns {string} Encrypted string
     */
    encrypt: function(value, key) {
      return CryptoJS.AES.encrypt(value, key).toString();
    },
    
    /**
     * Decrypt sensitive data
     * @param {string} encryptedValue - Encrypted value
     * @param {string} key - Encryption key
     * @returns {string} Decrypted string
     */
    decrypt: function(encryptedValue, key) {
      try {
        return CryptoJS.AES.decrypt(encryptedValue, key).toString(CryptoJS.enc.Utf8);
      } catch (e) {
        console.error('Decryption error:', e);
        return '';
      }
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    copyToClipboard: async function(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        return false;
      }
    },
    
    /**
     * Initialize modal functionality
     * This function should be called during app initialization
     */
    initializeModals: function() {
      // Make sure all modals are hidden by default and don't have conflicting display properties
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('visible');
      });
      
      // Set up close buttons for all modals
      document.querySelectorAll('.close-modal-btn, .cancel-btn').forEach(btn => {
        // Remove existing event listeners by cloning and replacing
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new event listener
        newBtn.addEventListener('click', (e) => {
          const modal = e.target.closest('.modal');
          if (modal) {
            this.hideModal(modal.id);
          }
        });
      });
      
      // Close modal when clicking outside of content
      document.querySelectorAll('.modal').forEach(modal => {
        // Remove existing event listeners by cloning and replacing
        const newModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(newModal, modal);
        
        // Add new event listener
        newModal.addEventListener('click', (e) => {
          if (e.target === newModal) {
            this.hideModal(newModal.id);
          }
        });
      });
    },
    
    /**
     * Show a modal by ID
     * @param {string} modalId - ID of modal to show
     */
    showModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) {
        console.warn(`Modal ${modalId} not found`);
        return;
      }
      
      // Ensure proper display style and add visible class
      modal.style.display = 'flex';
      modal.classList.add('visible');
      
      // Special handling for camera modal
      if (modalId === 'camera-modal' && typeof Camera !== 'undefined' && Camera.initializeCamera) {
        Camera.initializeCamera();
      }
    },
    
    /**
     * Hide a modal by ID
     * @param {string} modalId - ID of modal to hide
     */
    hideModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) {
        console.warn(`Modal ${modalId} not found`);
        return;
      }
      
      // Remove visible class and ensure it's hidden
      modal.classList.remove('visible');
      modal.style.display = 'none';
      
      // Special handling for camera modal
      if (modalId === 'camera-modal' && typeof Camera !== 'undefined' && Camera.stopCameraStream) {
        Camera.stopCameraStream();
      }
    }
  };