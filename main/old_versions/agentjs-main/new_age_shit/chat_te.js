// Select DOM elements
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
const fileUpload = document.getElementById('file-upload');
const aiSelector = document.getElementById('ai-selector');

let currentChatId = null;
let selectedAI = null;
let uploadedImage = null;

// Toggle sidebar state
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

// Event listeners
toggleSidebarButton.addEventListener('click', toggleSidebar);
chatHistoryButton.addEventListener('click', () => {
    if (!appContainer.classList.contains('sidebar-open')) {
        toggleSidebar();
    }
    // Optionally, focus or scroll to chat history here
    chatHistoryList.scrollIntoView({ behavior: 'smooth' });
});

// Add a message to the chat window
function addMessage(role, content, image = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    if (image) {
        const img = document.createElement('img');
        img.src = image;
        img.style.maxWidth = '200px';
        messageDiv.appendChild(img);
    }
    if (content) {
        const textDiv = document.createElement('div');
        textDiv.textContent = content;
        messageDiv.appendChild(textDiv);
    }
    messageArea.appendChild(messageDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Clear the chat window
function clearChat() {
    messageArea.innerHTML = '';
}

// Save the current chat to localStorage
function saveCurrentChat() {
    const messages = Array.from(messageArea.children).map(div => {
        const text = div.querySelector('div') ? div.querySelector('div').textContent : '';
        return {
            role: div.classList.contains('user') ? 'user' : 'ai',
            content: text
        };
    });
    if (messages.length === 0) return;

    if (!currentChatId) {
        currentChatId = Date.now().toString();
    }

    const chatTitle = messages[0].content.substring(0, 30) + '...';
    const chatData = {
        title: chatTitle,
        messages,
        aiId: selectedAI ? selectedAI.id : null
    };
    localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatData));
    updateChatHistory();
}

// Update the chat history in the sidebar
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

// Load a saved chat
function loadChat(key) {
    const chat = JSON.parse(localStorage.getItem(key));
    clearChat();
    chat.messages.forEach(msg => addMessage(msg.role, msg.content));
    currentChatId = key.split('_')[1];
    const aiId = chat.aiId;
    if (aiId) {
        aiSelector.value = aiId;
        selectedAI = getIntegrations().find(integration => integration.id === aiId);
    }
}

// Retrieve integrations from localStorage
function getIntegrations() {
    return JSON.parse(localStorage.getItem('integrations') || '[]');
}

// Populate the AI selector dropdown
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

// Handle AI selection change
aiSelector.addEventListener('change', (event) => {
    const selectedId = event.target.value;
    selectedAI = getIntegrations().find(integration => integration.id === selectedId);
});

// Handle sending a message
sendButton.addEventListener('click', async () => {
    const message = inputField.value.trim();
    const image = uploadedImage;
    if (message || image) {
        addMessage('user', message, image);
        inputField.value = '';
        fileUpload.value = '';
        uploadedImage = null;
        if (selectedAI) {
            const aiResponse = await getAIResponse(message, image);
            addMessage('ai', aiResponse);
        } else {
            addMessage('system', 'No AI selected. Please select an integration.');
        }
        saveCurrentChat();
    }
});

// Handle new chat button
newChatButton.addEventListener('click', () => {
    clearChat();
    currentChatId = null;
});

// Handle image upload
fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Placeholder function to prompt the AI
async function getAIResponse(message, image) {
    console.log(`Prompting ${selectedAI.name} with message: ${message}${image ? ' and an image' : ''}`);
    return `Response from ${selectedAI.name}: Echo - ${message || 'Image received'}`;
}

// Initialize with sidebar minimized
document.addEventListener('DOMContentLoaded', () => {
    appContainer.classList.remove('sidebar-open');
    sidebarContent.style.display = 'none';
    sidebarMinimized.style.display = 'flex';
    toggleSidebarButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    populateAISelector();
    updateChatHistory();
});