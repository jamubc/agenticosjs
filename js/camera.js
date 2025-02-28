/**
 * Camera functionality for the application
 */

const Camera = {
  // Camera state
  cameraStream: null,
  currentFacingMode: 'environment',

  /**
   * Initialize camera functionality
   */
  init: function() {
    console.log('Initializing camera functionality...');
    this.setupCameraButton();
  },

  /**
   * Setup camera button event listener
   */
  setupCameraButton: function() {
    const cameraButton = document.getElementById('camera-btn');
    if (cameraButton) {
      cameraButton.addEventListener('click', () => {
        Utils.showModal('camera-modal');
        this.initializeCamera();
      });
    }
  },

  /**
   * Initialize camera for taking photos
   */
  initializeCamera: function() {
    const cameraContainer = document.getElementById('camera-container');
    const cameraPreview = document.getElementById('camera-preview');
    const previewContainer = document.getElementById('camera-preview-container');
    
    if (!cameraContainer || !cameraPreview || !previewContainer) {
      console.warn('Camera elements not found');
      return;
    }
    
    // Ensure preview container is hidden initially
    previewContainer.style.display = 'none';
    
    // Setup camera capture button
    const captureButton = document.getElementById('camera-capture-btn');
    if (captureButton) {
      // Remove existing event listeners by cloning and replacing
      const newCaptureButton = captureButton.cloneNode(true);
      captureButton.parentNode.replaceChild(newCaptureButton, captureButton);
      
      newCaptureButton.addEventListener('click', () => this.capturePhoto());
    }
    
    // Setup camera retake button
    const retakeButton = document.getElementById('camera-retake-btn');
    if (retakeButton) {
      // Remove existing event listeners by cloning and replacing
      const newRetakeButton = retakeButton.cloneNode(true);
      retakeButton.parentNode.replaceChild(newRetakeButton, retakeButton);
      
      newRetakeButton.addEventListener('click', () => this.showCameraPreview());
    }
    
    // Setup camera accept button
    const acceptButton = document.getElementById('camera-accept-btn');
    if (acceptButton) {
      // Remove existing event listeners by cloning and replacing
      const newAcceptButton = acceptButton.cloneNode(true);
      acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
      
      newAcceptButton.addEventListener('click', () => this.acceptCapturedPhoto());
    }
    
    // Setup camera switch button
    const switchButton = document.getElementById('camera-switch-btn');
    if (switchButton) {
      // Remove existing event listeners by cloning and replacing
      const newSwitchButton = switchButton.cloneNode(true);
      switchButton.parentNode.replaceChild(newSwitchButton, switchButton);
      
      newSwitchButton.addEventListener('click', () => this.switchCamera());
    }
    
    // Start camera stream
    this.startCameraStream();
  },

  /**
   * Start camera stream
   */
  startCameraStream: async function() {
    const cameraPreview = document.getElementById('camera-preview');
    const cameraContainer = document.getElementById('camera-container');
    const previewContainer = document.getElementById('camera-preview-container');
    
    try {
      // Get user media with camera
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: this.currentFacingMode }
      });
      
      // Show camera preview
      cameraPreview.srcObject = this.cameraStream;
      cameraContainer.style.display = 'block';
      previewContainer.style.display = 'none';
    } catch (error) {
      console.error('Error accessing camera:', error);
      Utils.showToast('Could not access camera. Please ensure camera permissions are granted.', 'error');
      Utils.hideModal('camera-modal');
    }
  },

  /**
   * Capture photo from camera
   */
  capturePhoto: function() {
    if (!this.cameraStream) return;
    
    const cameraContainer = document.getElementById('camera-container');
    const previewContainer = document.getElementById('camera-preview-container');
    const canvas = document.getElementById('capture-canvas');
    const video = document.getElementById('camera-preview');
    
    if (!cameraContainer || !previewContainer || !canvas || !video) {
      console.warn('Camera capture elements not found');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Hide camera, show capture preview
    cameraContainer.style.display = 'none';
    previewContainer.style.display = 'block';
  },

  /**
   * Show camera preview (for retaking photo)
   */
  showCameraPreview: function() {
    const cameraContainer = document.getElementById('camera-container');
    const previewContainer = document.getElementById('camera-preview-container');
    
    if (!cameraContainer || !previewContainer) {
      console.warn('Camera container elements not found');
      return;
    }
    
    cameraContainer.style.display = 'block';
    previewContainer.style.display = 'none';
  },

  /**
   * Accept captured photo
   */
  acceptCapturedPhoto: function() {
    const canvas = document.getElementById('capture-canvas');
    if (!canvas) {
      console.warn('Capture canvas not found');
      return;
    }
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Convert data URL to File object
    const blob = this.dataURLToBlob(imageData);
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Add the file to uploads
    if (typeof UI !== 'undefined' && UI.handleFileUpload) {
      UI.handleFileUpload([file]);
    } else {
      // Fallback: Display the image in the attachment preview area
      const previewArea = document.getElementById('attachment-preview');
      if (previewArea) {
        const img = document.createElement('img');
        img.src = imageData;
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';
        previewArea.innerHTML = '';
        previewArea.appendChild(img);
        previewArea.style.display = 'block';
      }
    }
    
    // Hide the camera modal
    Utils.hideModal('camera-modal');
  },

  /**
   * Switch between front and back cameras
   */
  switchCamera: async function() {
    if (!this.cameraStream) return;
    
    // Get current camera facing mode
    const currentTracks = this.cameraStream.getVideoTracks();
    if (!currentTracks || currentTracks.length === 0) return;
    
    // Stop current stream
    this.stopCameraStream();
    
    try {
      // Toggle between environment and user facing
      this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
      
      // Get new stream with different camera
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: this.currentFacingMode }
      });
      
      // Update camera preview
      const cameraPreview = document.getElementById('camera-preview');
      if (cameraPreview) {
        cameraPreview.srcObject = this.cameraStream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      Utils.showToast('Could not switch camera', 'error');
    }
  },

  /**
   * Stop camera stream
   */
  stopCameraStream: function() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  },

  /**
   * Convert data URL to Blob
   * @param {string} dataURL - Data URL
   * @returns {Blob} Blob object
   */
  dataURLToBlob: function(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  }
};

// Initialize camera module when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  Camera.init();
});