/**
 * Settings management for the Pepe AI Multitool application
 */

const Settings = {
    /**
     * Load settings into UI
     */
    loadSettings: function() {
        const settings = Storage.getSettings();
        
        // Apply settings to UI elements
        
        // Theme
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-theme') === settings.theme);
        });
        
        // Font size
        const fontSizeSlider = document.getElementById('font-size-slider');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeSlider && fontSizeValue) {
            fontSizeSlider.value = settings.fontSize;
            fontSizeValue.textContent = settings.fontSize;
        }
        
        // Reduce motion
        const reduceMotionCheckbox = document.getElementById('reduce-motion');
        if (reduceMotionCheckbox) {
            reduceMotionCheckbox.checked = settings.reduceMotion;
        }
        
        // Local storage only
        const localStorageOnlyCheckbox = document.getElementById('local-storage-only');
        if (localStorageOnlyCheckbox) {
            localStorageOnlyCheckbox.checked = settings.localStorageOnly;
        }
        
        // Clear on exit
        const clearOnExitCheckbox = document.getElementById('clear-on-exit');
        if (clearOnExitCheckbox) {
            clearOnExitCheckbox.checked = settings.clearOnExit;
        }
        
        // Disable analytics
        const disableAnalyticsCheckbox = document.getElementById('disable-analytics');
        if (disableAnalyticsCheckbox) {
            disableAnalyticsCheckbox.checked = settings.disableAnalytics;
        }
        
        // Auto read responses
        const autoReadResponsesCheckbox = document.getElementById('auto-read-responses');
        if (autoReadResponsesCheckbox) {
            autoReadResponsesCheckbox.checked = settings.autoReadResponses;
        }
        
        // Speech rate
        const speechRateSlider = document.getElementById('speech-rate-slider');
        const speechRateValue = document.getElementById('speech-rate-value');
        if (speechRateSlider && speechRateValue) {
            speechRateSlider.value = settings.speechRate;
            speechRateValue.textContent = settings.speechRate;
        }
        
        // Speech recognition language
        const speechRecognitionLanguage = document.getElementById('speech-recognition-language');
        if (speechRecognitionLanguage) {
            speechRecognitionLanguage.value = settings.speechRecognitionLang;
        }
        
        // Update TTS voice selection
        const ttsVoiceSelect = document.getElementById('tts-voice-select');
        if (ttsVoiceSelect && settings.speechVoice) {
            if (ttsVoiceSelect.querySelector(`option[value="${settings.speechVoice}"]`)) {
                ttsVoiceSelect.value = settings.speechVoice;
            }
        }
        
        // Update integrations list
        if (typeof Models !== 'undefined' && Models.updateIntegrationsList) {
            Models.updateIntegrationsList();
        } else {
            console.warn('Models module not initialized or missing updateIntegrationsList method');
        }
    },
    
    /**
     * Save settings from UI
     */
    saveSettings: function() {
        try {
            // Get values from UI elements
            
            // Theme - get it from the active theme option
            const activeThemeOption = document.querySelector('.theme-option.active');
            const theme = activeThemeOption ? activeThemeOption.getAttribute('data-theme') : 'default';
            
            // Font size
            const fontSizeSlider = document.getElementById('font-size-slider');
            const fontSize = fontSizeSlider ? parseInt(fontSizeSlider.value) : 16;
            
            // Reduce motion
            const reduceMotionCheckbox = document.getElementById('reduce-motion');
            const reduceMotion = reduceMotionCheckbox ? reduceMotionCheckbox.checked : false;
            
            // Local storage only
            const localStorageOnlyCheckbox = document.getElementById('local-storage-only');
            const localStorageOnly = localStorageOnlyCheckbox ? localStorageOnlyCheckbox.checked : true;
            
            // Clear on exit
            const clearOnExitCheckbox = document.getElementById('clear-on-exit');
            const clearOnExit = clearOnExitCheckbox ? clearOnExitCheckbox.checked : false;
            
            // Disable analytics
            const disableAnalyticsCheckbox = document.getElementById('disable-analytics');
            const disableAnalytics = disableAnalyticsCheckbox ? disableAnalyticsCheckbox.checked : true;
            
            // Auto read responses
            const autoReadResponsesCheckbox = document.getElementById('auto-read-responses');
            const autoReadResponses = autoReadResponsesCheckbox ? autoReadResponsesCheckbox.checked : false;
            
            // Speech rate
            const speechRateSlider = document.getElementById('speech-rate-slider');
            const speechRate = speechRateSlider ? parseFloat(speechRateSlider.value) : 1;
            
            // Speech recognition language
            const speechRecognitionLanguage = document.getElementById('speech-recognition-language');
            const speechRecognitionLang = speechRecognitionLanguage ? speechRecognitionLanguage.value : 'en-US';
            
            // Speech voice
            const ttsVoiceSelect = document.getElementById('tts-voice-select');
            
            // Create settings object
            const settings = {
                theme,
                fontSize,
                reduceMotion,
                localStorageOnly,
                clearOnExit,
                disableAnalytics,
                autoReadResponses,
                speechRate,
                speechRecognitionLang,
                // Preserve voice selection if available
                speechVoice: ttsVoiceSelect ? ttsVoiceSelect.value : (Storage.getSettings().speechVoice || '')
            };
            
            // Save settings
            Storage.saveSettings(settings);
            
            // Apply settings
            UI.applyTheme(theme);
            UI.applyFontSize(fontSize);
            
            if (typeof Speech !== 'undefined') {
                if (Speech.setSpeechRate) Speech.setSpeechRate(speechRate);
                if (Speech.setRecognitionLanguage) Speech.setRecognitionLanguage(speechRecognitionLang);
            }
            
            // Show success message
            Utils.showToast('Settings saved successfully', 'success');
            
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            Utils.showToast('Error saving settings', 'error');
            return false;
        }
    },
    
    /**
     * Reset settings to defaults
     */
    resetSettings: function() {
        Utils.showConfirm(
            'Are you sure you want to reset all settings to defaults?',
            'Reset Settings',
            () => {
                Storage.saveSettings(Config.defaultSettings);
                this.loadSettings();
                
                // Apply default theme and font size
                UI.applyTheme(Config.defaultSettings.theme);
                UI.applyFontSize(Config.defaultSettings.fontSize);
                
                Utils.showToast('Settings reset to defaults', 'success');
            }
        );
    },
    
    /**
     * Initialize settings module
     */
    init: function() {
        // Add event listener for reset settings button
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
        
        console.log('Settings module initialized');
    }
};