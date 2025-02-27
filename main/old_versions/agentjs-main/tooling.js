
(function() {
    

    // CSS styles for tooltips and popups
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .tooltip-container {
        position: relative;
        display: inline-block;
      }
      .tooltip {
        position: absolute;
        background-color: #333;
        color: #fffff;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        width: max-content;
        max-width: 200px;

      }
      .tooltip.top { bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-10px); }
      .tooltip.bottom { top: 100%; left: 50%; transform: translateX(-50%) translateY(10px); }
      .tooltip.left { right: 100%; top: 50%; transform: translateY(-50%) translateX(-10px); }
      .tooltip.right { left: 100%; top: 50%; transform: translateY(-50%) translateX(10px); }
      
      .popup {
        position: fixed;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9999; /* Extremely high z-index to appear over everything */
        max-width: 300px;
        display: none;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      .popup.fade-out {
        opacity: 0;
      }
      .popup-close {
        position: absolute;
        right: 10px;
        top: 10px;
        cursor: pointer;
        font-weight: bold;
      }
        p{
        color:black;}
        h3 
        {
        color : grey;
        }
    `;
    document.head.appendChild(styleElement);
  
    // Track popup timer
    let popupTimer = null;
  
    // Helper functions
    function positionTooltip(tooltip, element, position) {
      const rect = element.getBoundingClientRect();
      
      tooltip.className = `tooltip ${position}`;
      
      // Position calculations handled by CSS classes
      if (position === 'top' || position === 'bottom') {
        tooltip.style.left = `${rect.left + rect.width/2}px`;
      } else if (position === 'left' || position === 'right') {
        tooltip.style.top = `${rect.top + rect.height/2}px`;
      }
    }
  
    function positionPopup(popup, element) {
      const rect = element.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate best position for popup
      let left = rect.left + rect.width/2 - popup.offsetWidth/2;
      let top = rect.bottom + 10;
      
      // Adjust if popup would go off-screen
      if (left < 10) left = 10;
      if (left + popup.offsetWidth > windowWidth - 10) 
        left = windowWidth - popup.offsetWidth - 10;
      if (top + popup.offsetHeight > windowHeight - 10)
        top = rect.top - popup.offsetHeight - 10;
      
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    }
  
    function hidePopup(popup) {
      popup.classList.add('fade-out');
      setTimeout(() => {
        popup.style.display = 'none';
        popup.classList.remove('fade-out');
      }, 300); // Match transition time
    }
  
    // Main function to add tooltip and popup functionality
    window.addInteractivity = function(selector, options = {}) {
      const elements = document.querySelectorAll(selector);
      const autoHideDelay = options.autoHideDelay || 3000; // Default 3 seconds
      
      elements.forEach(element => {
        // Make element container for tooltip positioning
        const container = document.createElement('div');
        container.className = 'tooltip-container';
        element.parentNode.insertBefore(container, element);
        container.appendChild(element);
        
        // Create tooltip if content provided
        if (options.tooltip) {
          const tooltip = document.createElement('div');
          tooltip.className = `tooltip ${options.position || 'top'}`;
          tooltip.textContent = options.tooltip;
          container.appendChild(tooltip);
          
          // Show tooltip on hover
          element.addEventListener('mouseenter', () => {
            positionTooltip(tooltip, element, options.position || 'top');
            tooltip.style.opacity = '1';
          });
          
          element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
          });
        }
        
        // Handle popup if content provided
        if (options.popup) {
          // Create popup element (create a new one each time for proper stacking)
          const popupId = `popup-${Math.random().toString(36).substr(2, 9)}`;
          let popup = document.createElement('div');
          popup.className = 'popup';
          popup.id = popupId;
          document.body.appendChild(popup);
          
          // Show popup on click
          element.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Hide all other popups
            document.querySelectorAll('.popup').forEach(p => {
              if (p.id !== popupId && p.style.display === 'block') {
                hidePopup(p);
              }
            });
            
            // Clear any existing timers
            if (popupTimer) {
              clearTimeout(popupTimer);
            }
            
            // Create popup content
            popup.innerHTML = `
              <span class="popup-close">&times;</span>
              <div class="popup-content">${options.popup}</div>
            `;
            
            // Position and show popup
            popup.style.display = 'block';
            popup.style.opacity = '1';
            positionPopup(popup, element);
            
            // Set auto-hide timer
            popupTimer = setTimeout(() => {
              hidePopup(popup);
            }, autoHideDelay);
            
            // Close button functionality
            popup.querySelector('.popup-close').addEventListener('click', (e) => {
              e.stopPropagation();
              hidePopup(popup);
              clearTimeout(popupTimer);
            });
            
            // Stop auto-hide on hover
            popup.addEventListener('mouseenter', () => {
              clearTimeout(popupTimer);
            });
            
            // Resume auto-hide when mouse leaves
            popup.addEventListener('mouseleave', () => {
              popupTimer = setTimeout(() => {
                hidePopup(popup);
              }, autoHideDelay);
            });
          });
          
          // Close popup when clicking outside
          document.addEventListener('click', (e) => {
            if (popup && popup.style.display === 'block' && 
                e.target !== popup && !popup.contains(e.target)) {
              hidePopup(popup);
              if (popupTimer) {
                clearTimeout(popupTimer);
              }
            }
          });
        }
      });
    };
  })();



addInteractivity("div.menu-item:nth-child(-n + 3)", {
  tooltip: "pre-chat requests",
  popup:
    "<h3>Button Info</h3><p>Add these requests as initalizers</p>",
  position: "top",
  autoHideDelay: 100
});


