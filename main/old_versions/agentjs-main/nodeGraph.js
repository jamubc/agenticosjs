import { generateText } from "./requests.js";
import { generateStreamingResponse } from "./requestsOffline.js";

class NodeItem {
  constructor(type, domElement) {
    this.type = type;
    this.domElement = domElement;
    this.id = domElement.getAttribute("id");
    this.executed = false;
    this.imageUrl = "";
    this.url = "";
    this.offline = true;
    this.rerun = false;
    
    // For CHAT nodes, add input fields
    if (type === "CHAT") {
      this.createChatInterface();
    }

    // For PICTURE nodes, add a file input button
    if (type === "PICTURE") {
      this.createPictureInterface();
    }
    this.createOutputArea();
    this.createResizeHandles();
  }

  createResizeHandles() {
    const resizeStyles = {
      position: "absolute",
      width: "10px",
      height: "10px",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      cursor: "se-resize",
    };

    // Create the bottom-right resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.style.position = "absolute";
    resizeHandle.style.width = "12px";
    resizeHandle.style.height = "12px";
    resizeHandle.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    resizeHandle.style.right = "0";
    resizeHandle.style.bottom = "0";
    resizeHandle.style.cursor = "se-resize";

    this.domElement.style.position = "relative"; // Make sure the node can be resized by setting position to relative

    resizeHandle.addEventListener("mousedown", (event) => {
      event.preventDefault(); // Prevent text selection

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = this.domElement.offsetWidth;
      const startHeight = this.domElement.offsetHeight;

      const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const newWidth = startWidth + deltaX;
        const newHeight = startHeight + deltaY;

        // Ensure the new width and height are greater than a minimum value
        if (newWidth > 100 && newHeight > 100) {
          this.domElement.style.width = `${newWidth}px`;
          this.domElement.style.height = `${newHeight}px`;

          this.updateScale(newWidth, newHeight);
        }
      };

      const onMouseUp = () => {
        // Remove event listeners when resizing ends
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      // Add event listeners to handle mouse movement and release
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Append the resize handle to the node
    this.domElement.appendChild(resizeHandle);
  }

  // Update the content of the node (e.g., icons, font sizes, output area) based on new dimensions
  updateScale(newWidth, newHeight) {
    const scaleFactorWidth = newWidth / this.initialWidth;
    const scaleFactorHeight = newHeight / this.initialHeight;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight); // Use the smallest scale factor to maintain aspect ratio

    // Update font sizes and other scalable properties
    this.domElement.querySelectorAll("i").forEach((icon) => {
      icon.style.fontSize = `${5 * scaleFactor}vw`; // Adjust icon size dynamically
    });

    this.outputContainer.style.fontSize = `${0.75 * scaleFactor}rem`; // Update font size for output area
    this.outputContainer.style.maxHeight = `${30 * scaleFactor}vh`; // Adjust max height
    this.outputContainer.style.width = `${50 * scaleFactor}vw`; // Adjust width

    // Update initial width and height
    this.initialWidth = newWidth;
    this.initialHeight = newHeight;
  }

  /**
   * Creates a file input button for PICTURE nodes
   */
  createPictureInterface() {
    const inputContainer = document.createElement("div");
    inputContainer.style.padding = "1rem";
    inputContainer.style.display = "flex";
    inputContainer.style.gap = "2vw";

    // Icon for selecting a file
    const fileIcon = document.createElement("i");
    fileIcon.classList.add("fas", "fa-file-image");
    fileIcon.style.cursor = "pointer";
    fileIcon.style.fontSize = "5vw"; // Dynamically scale icon size
    fileIcon.style.marginBottom = "1rem";

    // Icon for capturing from the camera
    const cameraIcon = document.createElement("i");
    cameraIcon.classList.add("fas", "fa-camera");
    cameraIcon.style.cursor = "pointer";
    cameraIcon.style.fontSize = "5vw"; // Dynamically scale icon size
    cameraIcon.style.marginBottom = "1rem";

    // File input for image selection
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";

     // Add event listener for file icon click
  fileIcon.addEventListener("click", () => {
    this.fileInput.click(); // Trigger the hidden file input
  });
  this.fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      this.displayImage(file);
    }
  });

  // Add event listener for camera icon click
  cameraIcon.addEventListener("click", async () => {
    // Activate the camera and show the video feed
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.style.display = "block"; // Show video feed
    videoElement.play();

    // Set up a button or action to take a picture
    const captureButton = document.createElement("button");
    captureButton.textContent = "Capture Image";
    captureButton.style.fontSize = "1rem"; // Font size in rem for scaling
    captureButton.addEventListener("click", () => {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      const context = canvasElement.getContext("2d");
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Convert the captured image to a data URL and handle it (e.g., display or save)
      const capturedImage = canvasElement.toDataURL("image/png");
      
      this.displayImage(capturedImage);
      
      // Stop the video stream after capture
      stream.getTracks().forEach(track => track.stop());
      videoElement.style.display = "none"; // Hide video feed
    });

    inputContainer.appendChild(captureButton);
  });


    inputContainer.appendChild(fileIcon);
    inputContainer.appendChild(cameraIcon);
    inputContainer.appendChild(this.fileInput);

    this.domElement.appendChild(inputContainer);
  }

  /**
   * Creates the output area for PICTURE nodes
   */
  createOutputArea() {
    this.outputContainer = document.createElement("div");
    this.outputContainer.style.fontSize = "1rem"; // Scale dynamically
    this.outputContainer.style.padding = "1rem";
    this.outputContainer.style.color = "#333";
    this.outputContainer.style.background = "#f9f9f9";
    this.outputContainer.style.borderTop = "1px solid #ccc";
    this.outputContainer.style.borderRadius = "1rem";
    this.outputContainer.style.overflow = "auto";
    this.outputContainer.style.maxHeight = "30vh";
    this.outputContainer.style.height = "20vh";
    this.outputContainer.style.width = "50vw";

    this.domElement.appendChild(this.outputContainer);
  }

  /**
   * Creates input fields for CHAT nodes
   */
  createChatInterface() {
    // Input container
    const inputContainer = document.createElement("div");
    inputContainer.style.padding = "1rem"; // Padding in rem for scaling
  
    // Question input field
    const questionLabel = document.createElement("label");
    questionLabel.textContent = "Question:";
    questionLabel.style.display = "block";
    // questionLabel.style.fontSize = "1rem"; // Font size in rem
    // questionLabel.style.marginBottom = "0.5rem"; // Margin in rem
  
    this.questionInput = document.createElement("textarea");
    this.questionInput.name = "question";
    this.questionInput.rows = 2;
    this.questionInput.placeholder = "Enter your question here...";
    this.questionInput.style.width = "100%";
    this.questionInput.style.borderRadius = "5px";
    // this.questionInput.style.fontSize = "1rem"; // Font size in rem
    // this.questionInput.style.marginBottom = "1rem"; // Margin in rem
  
    // Rerun icon (Recycle icon)
    const rerunIcon = document.createElement("i");
    rerunIcon.classList.add("fas", "fa-sync"); // Font Awesome recycle icon
    rerunIcon.style.fontSize = "1.5rem"; // Icon size
    rerunIcon.style.marginRight = "0.5rem"; // Margin between icons
    rerunIcon.style.cursor = "pointer"; // Cursor pointer for click event
    rerunIcon.style.color = "gray"; // Initial gray color to indicate "inactive" state
  
    // Offline icon (Wifi icon)
    const offlineIcon = document.createElement("i");
    offlineIcon.classList.add("fas", "fa-wifi"); // Font Awesome wifi icon
    offlineIcon.style.fontSize = "1.5rem"; // Icon size
    offlineIcon.style.cursor = "pointer"; // Cursor pointer for click event
    offlineIcon.style.color = "gray"; // Initial gray color to indicate "inactive" state
  
    // Toggle rerun icon click event
    rerunIcon.addEventListener("click", () => {
      if (rerunIcon.style.color === "gray") {
        rerunIcon.style.color = "CornflowerBlue"; // Active state
        this.rerun = true;
      } else {
        rerunIcon.style.color = "grey"; // Inactive state
        this.rerun = false;
      }
    });
  
    // Toggle offline icon click event
    offlineIcon.addEventListener("click", () => {
      if (offlineIcon.style.color === "gray") {
        offlineIcon.style.color = "DodgerBlue"; // Active state
        this.offline = false;
      } else {
        offlineIcon.style.color = "gray"; // Inactive state
        this.offline = true;
      }
    });
  
    // Add to input container
    inputContainer.appendChild(questionLabel);
    inputContainer.appendChild(this.questionInput);
  
    // Create a container for the icons (rerun and offline)
    const iconContainer = document.createElement("div");
    iconContainer.style.display = "flex";
    iconContainer.style.marginTop = "1rem"; // Margin above the icons
    iconContainer.style.alignItems = "center"; // Center icons vertically
  
    iconContainer.appendChild(rerunIcon);
    iconContainer.appendChild(offlineIcon);
  
    // Append the icon container to the input container
    inputContainer.appendChild(iconContainer);
  
    // Insert the input container at the top of the node
    this.domElement.appendChild(inputContainer);
  }
  

  /**
   * Displays the selected image in the output area
   * @param {File} file - The selected image file
   */
  displayImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      // Create an image element
      const imageElement = document.createElement("img");

      imageElement.alt = "Selected Picture";
      imageElement.style.maxWidth = "100%"; // Ensure the image fits within the container
      imageElement.style.height = "auto"; // Maintain aspect ratio
      imageElement.style.display = "block"; // Prevent inline spacing issues
      imageElement.style.margin = "0 auto"; // Center the image

      this.imageUrl = URL.createObjectURL(file);
      imageElement.src = this.imageUrl;
      // this.imageUrl = file;

      // Clear the output container and append the image
      this.outputContainer.innerHTML = "";
      this.outputContainer.appendChild(imageElement);

      // Mark the node as executed
      this.executed = true;
    };
    reader.readAsDataURL(file); // Read the file as a data URL
  }

  /**
   * Run the node's logic (i.e. perform a request) and display the result.
   * If the node has already executed and the rerun checkbox is not checked,
   * it will not re-run.
   */
  async run() {
    // Prevent re-running unless forced
    if (this.executed && !this.rerun) {
      console.log(
        `Node ${this.id} already executed. Check "Rerun" to force execution.`
      );
      return;
    }

    // Depending on the node type, make the corresponding request
    try {
      switch (this.type) {
        case "URL":
          const response = await fetch(
            "https://jsonplaceholder.typicode.com/posts/1"
          );
          const data = await response.json();
          this.setOutput(JSON.stringify(data, null, 2));
          this.executed = true;
          this.domElement.appendChild(document.createTextNode("not implemented yet"))
          

          break;

        case "PICTURE":
          // For PICTURE nodes, the image is already displayed via the file input
          console.log(
            "PICTURE node executed. Use the file input to select an image."
          );
          this.executed = true;
          break;

        case "CHAT":
          // Get the question from the input field
          const question = this.questionInput.value || "Default question";
          let imageUrl = null;

          // Check for connected nodes to get image URL
          const connectedNodes = this.getConnectedNodes();
          console.log(connectedNodes);
          for (const nodeId of connectedNodes) {
            const node = this.findNodeItemById(nodeId);
            if (node && (node.type === "URL" || node.type === "PICTURE")) {
              // Extract image URL from connected node's output
              try {
                if (node.type === "URL" && node.url) {
                  imageUrl = node.url;
                  console.log(imageUrl);
                  break;
                } else if (node.type === "PICTURE") {
                  // Using placeholder image URL for demo purposes
                  console.log("wow");
                  console.log("using", node.imageUrl);
                  // imageUrl = `https://picsum.photos/id/${outputData.id}/200/300`;
                  imageUrl = node.imageUrl;
                  break;
                }
              } catch (err) {
                console.warn("Could not parse connected node output", err);
              }
            }
          }

          // Call the generateText function
          this.setOutput("Processing request...");
          let fullOutput = "";
          try {
            let generatedText;
            console.log(imageUrl);
            if (imageUrl != null && !this.offline) {
              generatedText = await generateText(question, imageUrl);
            } else {
              await generateStreamingResponse(
                question,

                ({ output, state }) => {
                  // Handle token streaming
                  if (output) {
                    // console.log(output);
                    this.setOutput(fullOutput);
                    fullOutput += output;
                    //   outputElement.textContent = fullOutput;
                  }
                  // statusElement.textContent = `State: ${state}`;
                },
                (finalOutput) => {
                  // Handle completion
                  console.log("Generation complete!");
                  // statusElement.textContent = "Complete";
                },
                () => {
                  // Handle start
                  console.log("Generation started");
                  // statusElement.textContent = "Generating...";
                  fullOutput = "";
                },
                (errorMsg) => {
                  // Handle error
                  console.error(errorMsg);
                  // statusElement.textContent = "Error: " + errorMsg;
                }
              );
            }
          } catch (err) {
            this.setOutput(`Error generating text: ${err.message}`);
          }
          this.executed = true;
          break;
      }
    } catch (err) {
      this.setOutput(`Error in ${this.type} node: ${err.message}`);
      console.error(`Error in node ${this.id}:`, err);
      this.executed = true;
    }
  }

  /**
   * Get the IDs of nodes connected to this node
   * @returns {string[]} Array of node IDs
   */
  getConnectedNodes() {
    if (typeof connections !== "undefined") {
      return connections
        .filter((conn) => conn.to === this.id)
        .map((conn) => conn.from);
    }
    return [];
  }

  /**
   * Find a NodeItem by its ID
   * @param {string} nodeId - The ID of the node to find
   * @returns {NodeItem|null} The found NodeItem or null
   */
  findNodeItemById(nodeId) {
    // This function needs to access the nodeItems array from index.js
    if (typeof nodeItems !== "undefined") {
      return nodeItems.find((node) => node.id === nodeId) || null;
    }
    return null;
  }

  /**
   * Update the node's output container text.
   * @param {string} message - The text to display.
   */
  setOutput(message) {
    this.outputContainer.textContent = message;
  }
}

// Export as default and also make globally available
export default NodeItem;

// Make NodeItem available globally
window.NodeItem = NodeItem;
