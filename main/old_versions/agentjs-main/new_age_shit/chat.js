const appContainer = document.getElementById('app-container');
const toggleSidebarButton = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');
const sidebarMinimized = document.getElementById('sidebar-minimized');
const chatHistoryButton = document.getElementById('chat-history-button');
const messageArea = document.getElementById('message-area');
const inputField = document.getElementById('input-field');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat-button');
const chatHistoryList = document.getElementById('chat-history-list');
const cameraButton = document.querySelector('.camera-button');
const fileUpload = document.getElementById('file-upload');
const aiSelector = document.getElementById('ai-selector');

let currentChatId = null;
let selectedAI = null;
let uploadedImages = []; // Array to store multiple images
let videoStream = null;

function toggleSidebar() {
    if (appContainer.classList.contains('sidebar-open')) {
        appContainer.classList.remove('sidebar-open');
        toggleSidebarButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        sidebarContent.style.display = 'none';
        sidebarMinimized.style.display = 'flex';
    } else {
        appContainer.classList.add('sidebar-open');
        toggleSidebarButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        sidebarContent.style.display = 'block';
        sidebarMinimized.style.display = 'none';
    }
}

toggleSidebarButton.addEventListener('click', toggleSidebar);
chatHistoryButton.addEventListener('click', () => {
    if (!appContainer.classList.contains('sidebar-open')) toggleSidebar();
    chatHistoryList.scrollIntoView({ behavior: 'smooth' });
});

function addMessage(role, content, images = []) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    images.forEach(image => {
        const img = document.createElement('img');
        img.src = image;
        img.style.maxWidth = '200px';
        messageDiv.appendChild(img);
    });
    if (content) {
        const textDiv = document.createElement('div');
        textDiv.textContent = content;
        messageDiv.appendChild(textDiv);
    }
    messageArea.appendChild(messageDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function clearChat() {
    messageArea.innerHTML = '';
}

function saveCurrentChat() {
    const messages = Array.from(messageArea.children).map(div => {
        const text = div.querySelector('div') ? div.querySelector('div').textContent : '';
        const images = Array.from(div.querySelectorAll('img')).map(img => img.src);
        return { role: div.classList.contains('user') ? 'user' : 'ai', content: text, images };
    });
    if (messages.length === 0) return;
    if (!currentChatId) currentChatId = Date.now().toString();
    const chatTitle = messages[0].content.substring(0, 30) + '...';
    const chatData = { title: chatTitle, messages, aiId: selectedAI ? selectedAI.id : null };
    localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatData));
    updateChatHistory();
}

function updateChatHistory() {
    chatHistoryList.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('chat_')) {
            const chat = JSON.parse(localStorage.getItem(key));
            const chatItem = document.createElement('div');
            chatItem.textContent = chat.title;
            chatItem.classList.add('chat-item');
            chatItem.addEventListener('click', () => loadChat(key));
            chatHistoryList.appendChild(chatItem);
        }
    }
}

function loadChat(key) {
    const chat = JSON.parse(localStorage.getItem(key));
    clearChat();
    chat.messages.forEach(msg => addMessage(msg.role, msg.content, msg.images || []));
    currentChatId = key.split('_')[1];
    const aiId = chat.aiId;
    if (aiId) {
        aiSelector.value = aiId;
        selectedAI = getIntegrations().find(integration => integration.id === aiId);
    }
}

function getIntegrations() {
    return JSON.parse(localStorage.getItem('integrations') || '[]');
}

function populateAISelector() {
    aiSelector.innerHTML = '';
    const integrations = getIntegrations();
    integrations.forEach(integration => {
        const option = document.createElement('option');
        option.value = integration.id;
        option.textContent = integration.name;
        aiSelector.appendChild(option);
    });
    if (integrations.length > 0) {
        selectedAI = integrations[0];
        aiSelector.value = selectedAI.id;
        sendButton.disabled = false;
    } else {
        addMessage('system', 'Please add an AI integration in the settings to start chatting.');
        sendButton.disabled = true;
    }
}

aiSelector.addEventListener('change', (event) => {
    const selectedId = event.target.value;
    const previousAI = selectedAI;
    selectedAI = getIntegrations().find(integration => integration.id === selectedId);
    if (selectedAI && previousAI && selectedAI.id !== previousAI.id && messageArea.children.length > 0) {
        addMessage('system', `Model changed from ${previousAI.name} to ${selectedAI.name}`);
    }
});

sendButton.addEventListener('click', async () => {
    const message = inputField.value.trim();
    if (message || uploadedImages.length > 0) {
        addMessage('user', message, uploadedImages);
        inputField.value = '';
        fileUpload.value = '';
        uploadedImages = [];
        displayImagePreview();
        stopCamera();
        if (selectedAI) {
            const aiResponse = await getAIResponse(message, uploadedImages);
            addMessage('ai', aiResponse);
        } else {
            addMessage('system', 'No AI selected. Please select an integration.');
        }
        saveCurrentChat();
    }
});

newChatButton.addEventListener('click', () => {
    clearChat();
    currentChatId = null;
    stopCamera();
    uploadedImages = [];
    displayImagePreview();
});

// Camera functionality with dragging fix and multiple captures
cameraButton.addEventListener('click', async () => {
    try {
        stopCamera();
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });

        const container = document.createElement('div');
        container.id = 'camera-preview-container';
        container.style.position = 'fixed';
        container.style.zIndex = '1000';
        container.style.background = '#333'; // Adjust based on your CSS variables
        container.style.padding = '10px';
        container.style.borderRadius = '8px';
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.cursor = 'grab';

        const video = document.createElement('video');
        video.id = 'camera-preview';
        video.autoplay = true;
        video.style.maxWidth = '300px';
        video.srcObject = videoStream;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.textAlign = 'center';
        buttonsDiv.style.marginTop = '10px';

        const captureButton = document.createElement('button');
        captureButton.textContent = 'Capture';
        captureButton.style.padding = '5px 10px';
        captureButton.style.backgroundColor = '#007bff'; // Adjust based on your theme
        captureButton.style.color = '#fff';
        captureButton.style.border = 'none';
        captureButton.style.borderRadius = '4px';
        captureButton.style.cursor = 'pointer';
        captureButton.style.marginRight = '10px';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.padding = '5px 10px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.color = '#fff';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';

        buttonsDiv.appendChild(captureButton);
        buttonsDiv.appendChild(closeButton);
        container.appendChild(video);
        container.appendChild(buttonsDiv);
        document.body.appendChild(container);

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        container.addEventListener('mousedown', (e) => {
            if (e.target === container || e.target === video) {
                e.preventDefault();
                e.stopPropagation();
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = container.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                container.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                container.style.left = `${initialLeft + dx}px`;
                container.style.top = `${initialTop + dy}px`;
                container.style.transform = 'none';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
            }
        });

        captureButton.addEventListener('click', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/png');
            addImageToPreview(imageData);
            // Preview remains open for more captures
        });

        closeButton.addEventListener('click', () => {
            stopCamera();
        });
    } catch (err) {
        console.error('Error accessing camera:', err);
        addMessage('system', 'Failed to access camera. Please ensure permissions are granted.');
    }
});

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const container = document.getElementById('camera-preview-container');
    if (container) container.remove();
}

// Handle multiple file uploads
fileUpload.addEventListener('change', (event) => {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => addImageToPreview(e.target.result);
        reader.readAsDataURL(file);
    });
});

async function getAIResponse(message, images) {
    // Mock AI response; replace with actual API call if needed
    console.log(`Prompting ${selectedAI.name} with message: ${message}${images.length > 0 ? ' and images' : ''}`);
    return `Response from ${selectedAI.name}: Echo - ${message || 'Images received'}`;
}

// Add image to preview area
function addImageToPreview(imageData) {
    uploadedImages.push(imageData);
    displayImagePreview();
}

// Display all images in preview with remove buttons
function displayImagePreview() {
    const previewDiv = document.getElementById('image-preview');
    previewDiv.innerHTML = '';
    uploadedImages.forEach((imageData, index) => {
        const imageItem = document.createElement('div');
        imageItem.style.position = 'relative';
        imageItem.style.width = '50px';
        imageItem.style.height = '50px';

        const img = document.createElement('img');
        img.src = imageData;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        imageItem.appendChild(img);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '0';
        removeBtn.style.right = '0';
        removeBtn.style.background = 'none';
        removeBtn.style.border = 'none';
        removeBtn.style.color = '#ff4444';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '16px';
        removeBtn.addEventListener('click', () => {
            uploadedImages.splice(index, 1); // Remove the specific image
            displayImagePreview(); // Refresh preview
        });
        imageItem.appendChild(removeBtn);

        previewDiv.appendChild(imageItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    appContainer.classList.remove('sidebar-open');
    sidebarContent.style.display = 'none';
    sidebarMinimized.style.display = 'flex';
    toggleSidebarButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    populateAISelector();
    updateChatHistory();
    const previewDiv = document.getElementById('image-preview');
    previewDiv.style.display = 'flex';
    previewDiv.style.flexWrap = 'wrap';
    previewDiv.style.gap = '10px';
    previewDiv.style.marginBottom = '10px';
});