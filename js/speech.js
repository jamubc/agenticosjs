/**
 * Speech functionality for the AI Assistant application
 */

const Speech = {
    // Store speech synthesis and recognition instances
    speechSynthesis: window.speechSynthesis,
    speechRecognition: null,
    
    // State
    isListening: false,
    isSpeaking: false,
    availableVoices: [],
    selectedVoice: null,
    speechRate: 1,
    
    /**
     * Initialize speech functionality
     */
    init: function() {
      // Initialize speech recognition if available
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        
        // Set language from settings
        const settings = Storage.getSettings();
        this.speechRecognition.lang = settings.speechRecognitionLang || 'en-US';
        
        // Set up event handlers
        this.setupSpeechRecognitionEvents();
      }
      
      // Load available voices
      this.loadVoices();
      
      // Load settings
      const settings = Storage.getSettings();
      this.speechRate = settings.speechRate || 1;
      
      // Check if a specific voice was previously selected
      if (settings.speechVoice) {
        setTimeout(() => {
          this.selectVoiceById(settings.speechVoice);
        }, 1000); // Delay to ensure voices are loaded
      }
    },
    
    /**
     * Load available speech synthesis voices
     */
    loadVoices: function() {
      // Get available voices
      this.availableVoices = this.speechSynthesis.getVoices();
      
      if (this.availableVoices.length === 0) {
        // If voices aren't loaded yet, wait for them
        this.speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = this.speechSynthesis.getVoices();
          this.populateVoiceOptions();
        };
      } else {
        this.populateVoiceOptions();
      }
    },
    
    /**
     * Populate voice selection dropdown
     */
    populateVoiceOptions: function() {
      const voiceSelect = document.getElementById('tts-voice-select');
      if (!voiceSelect) return;
      
      // Clear existing options
      voiceSelect.innerHTML = '';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Default voice';
      voiceSelect.appendChild(defaultOption);
      
      // Add all available voices
      this.availableVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (voice.default) {
          option.textContent += ' - Default';
        }
        
        voiceSelect.appendChild(option);
      });
      
      // Select previously chosen voice if available
      const settings = Storage.getSettings();
      if (settings.speechVoice) {
        voiceSelect.value = settings.speechVoice;
      }
      
      // Add change event listener
      voiceSelect.addEventListener('change', (e) => {
        this.selectVoiceById(e.target.value);
        Storage.updateSettings({ speechVoice: e.target.value });
      });
    },
    
    /**
     * Select a voice by its URI
     * @param {string} voiceURI - Voice URI
     */
    selectVoiceById: function(voiceURI) {
      if (!voiceURI) {
        this.selectedVoice = null;
        return;
      }
      
      this.selectedVoice = this.availableVoices.find(voice => voice.voiceURI === voiceURI);
    },
    
    /**
     * Set up speech recognition event handlers
     */
    setupSpeechRecognitionEvents: function() {
      if (!this.speechRecognition) return;
      
      // Result event
      this.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update UI with transcript
        const transcriptElement = document.getElementById('voice-transcript-text');
        if (transcriptElement) {
          transcriptElement.textContent = finalTranscript || interimTranscript || 'Speak now...';
        }
        
        // Enable send button if we have some text
        const sendButton = document.getElementById('voice-send-btn');
        if (sendButton) {
          sendButton.disabled = !(finalTranscript || interimTranscript);
        }
      };
      
      // Error event
      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'An error occurred with speech recognition';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
        }
        
        Utils.showToast(errorMessage, 'error');
        this.stopSpeechRecognition();
      };
      
      // End event
      this.speechRecognition.onend = () => {
        if (this.isListening) {
          // If still listening, restart recognition
          this.speechRecognition.start();
        } else {
          // Update UI
          const voiceStatus = document.getElementById('voice-status');
          if (voiceStatus) {
            voiceStatus.textContent = 'Finished';
          }
          
          // Stop animation
          document.querySelectorAll('.wave').forEach(wave => {
            wave.style.animationPlayState = 'paused';
          });
        }
      };
    },
    
    /**
     * Start speech recognition
     */
    startSpeechRecognition: function() {
      if (!this.speechRecognition) {
        Utils.showToast('Speech recognition is not supported in your browser', 'error');
        return;
      }
      
      try {
        this.speechRecognition.start();
        this.isListening = true;
        
        // Update UI
        const voiceStatus = document.getElementById('voice-status');
        const transcriptText = document.getElementById('voice-transcript-text');
        
        if (voiceStatus) voiceStatus.textContent = 'Listening...';
        if (transcriptText) transcriptText.textContent = 'Speak now...';
        
        // Start animation
        document.querySelectorAll('.wave').forEach(wave => {
          wave.style.animationPlayState = 'running';
        });
        
        // Disable send button initially
        const sendButton = document.getElementById('voice-send-btn');
        if (sendButton) sendButton.disabled = true;
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        Utils.showToast('Could not start speech recognition', 'error');
      }
    },
    
    /**
     * Stop speech recognition
     */
    stopSpeechRecognition: function() {
      if (!this.speechRecognition || !this.isListening) return;
      
      try {
        this.speechRecognition.stop();
        this.isListening = false;
        
        // Update UI
        const voiceStatus = document.getElementById('voice-status');
        if (voiceStatus) voiceStatus.textContent = 'Stopped';
        
        // Stop animation
        document.querySelectorAll('.wave').forEach(wave => {
          wave.style.animationPlayState = 'paused';
        });
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    },
    
    /**
     * Speak text using speech synthesis
     * @param {string} text - Text to speak
     */
    speak: function(text) {
      if (!text) return;
      
      // Cancel any current speech
      this.stop();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if one is selected
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      
      // Set speech rate
      utterance.rate = this.speechRate;
      
      // Add events
      utterance.onstart = () => {
        this.isSpeaking = true;
        Utils.showToast('Started speaking', 'info');
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isSpeaking = false;
        Utils.showToast('Error while speaking', 'error');
      };
      
      // Start speaking
      this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Stop speaking
     */
    stop: function() {
      if (this.isSpeaking) {
        this.speechSynthesis.cancel();
        this.isSpeaking = false;
      }
    },
    
    /**
     * Set speech rate
     * @param {number} rate - Speech rate (0.5 to 2)
     */
    setSpeechRate: function(rate) {
      this.speechRate = Math.max(0.5, Math.min(2, rate));
      Storage.updateSettings({ speechRate: this.speechRate });
      
      // Update UI
      const speechRateValue = document.getElementById('speech-rate-value');
      if (speechRateValue) {
        speechRateValue.textContent = this.speechRate;
      }
    },
    
    /**
     * Set speech recognition language
     * @param {string} language - Language code (e.g., 'en-US')
     */
    setRecognitionLanguage: function(language) {
      if (!this.speechRecognition) return;
      
      this.speechRecognition.lang = language;
      Storage.updateSettings({ speechRecognitionLang: language });
    },
    
    /**
     * Check if speech recognition is supported
     * @returns {boolean} Whether speech recognition is supported
     */
    isRecognitionSupported: function() {
      return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    },
    
    /**
     * Check if speech synthesis is supported
     * @returns {boolean} Whether speech synthesis is supported
     */
    isSynthesisSupported: function() {
      return 'speechSynthesis' in window;
    }
  };