document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearChatButton = document.getElementById('clear-chat-button');
    const newChatButton = document.getElementById('new-chat-button');
    const chatHistoryContainer = document.getElementById('chat-history');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const searchHistoryInput = document.getElementById('search-history-input');
    const deleteAllHistoryButton = document.getElementById('delete-all-history-button');
    const menuButton = document.getElementById('menu-button');
    const appContainer = document.getElementById('app-container');
    const typingIndicator = document.getElementById('typing-indicator');

    // Webhook URL
    const webhookUrl = 'https://sadikco99.app.n8n.cloud/webhook/88cfdab2-29e8-4ee8-bd57-3881bec107ab/chat';

    // App State
    let conversations = [];
    let activeConversationId = null;

    // --- Initialization ---
    function initializeApp() {
        attachEventListeners();
        loadConversations();
        loadTheme();
        initializePinnedMessageFeature();
    }

    function attachEventListeners() {
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        clearChatButton.addEventListener('click', clearCurrentChat);
        newChatButton.addEventListener('click', createNewChat);
        themeToggleButton.addEventListener('click', toggleTheme);
        searchHistoryInput.addEventListener('input', filterChatHistory);
        deleteAllHistoryButton.addEventListener('click', deleteAllChatHistory);
        menuButton.addEventListener('click', toggleSidebar);
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    // --- Core Chat Functions ---
    function sendMessage() {
        const message = userInput.value;
        if (message.trim() === '') return;

        if (!activeConversationId) {
            createNewChat();
        }

        appendMessage(message, 'user');
        saveMessageToHistory(message, 'user');
        userInput.value = '';
        typingIndicator.style.display = 'flex';
        chatBox.scrollTop = chatBox.scrollHeight;

        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "chatInput": message,
                "sessionId": activeConversationId
            })
        })
        .then(response => response.json())
        .then(data => {
            typingIndicator.style.display = 'none';
            if (data && data.output) {
                appendMessage(data.output, 'bot');
                saveMessageToHistory(data.output, 'bot');
            }
        })
        .catch(error => {
            typingIndicator.style.display = 'none';
            console.error('Error:', error);
            appendMessage('Sorry, something went wrong.', 'bot');
            saveMessageToHistory('Sorry, something went wrong.', 'bot');
        });
    }

    function appendMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender + '-message');

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        const icon = document.createElement('i');
        icon.classList.add('material-icons');
        if (sender === 'user') {
            icon.textContent = 'person';
        } else {
            icon.textContent = 'smart_toy';
        }
        avatarElement.appendChild(icon);

        const messageTextElement = document.createElement('div');
        if (sender === 'bot') {
            const parts = message.split(/\*\*(.*?)\*\*/g);
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 1) {
                    const boldEl = document.createElement('b');
                    boldEl.textContent = parts[i];
                    messageTextElement.appendChild(boldEl);
                } else {
                    messageTextElement.appendChild(document.createTextNode(parts[i]));
                }
            }
        } else {
            messageTextElement.textContent = message;
        }

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(messageTextElement);
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Conversation Management ---
    function saveMessageToHistory(message, sender) {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            conversation.messages.push({ message, sender });
            localStorage.setItem('conversations', JSON.stringify(conversations));
            updateChatHistoryUI();
        }
    }

    function loadConversations() {
        const savedConversations = localStorage.getItem('conversations');
        if (savedConversations) {
            conversations = JSON.parse(savedConversations);
            if (conversations.length > 0) {
                activeConversationId = conversations[conversations.length - 1].id;
                loadConversation(activeConversationId);
            }
            updateChatHistoryUI();
        }
    }

    function loadConversation(conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            activeConversationId = conversationId;
            chatBox.innerHTML = ''; // Clear chatbox more efficiently
            conversation.messages.forEach(item => {
                appendMessage(item.message, item.sender);
            });
            updateChatHistoryUI();
        }
    }

    function createNewChat() {
        const newConversationId = 'chat-' + Date.now();
        conversations.push({ id: newConversationId, messages: [] });
        activeConversationId = newConversationId;
        chatBox.innerHTML = '';
        localStorage.setItem('conversations', JSON.stringify(conversations));
        updateChatHistoryUI();
    }

    function clearCurrentChat() {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            conversation.messages = [];
            localStorage.setItem('conversations', JSON.stringify(conversations));
            chatBox.innerHTML = '';
            updateChatHistoryUI();
        }
    }

    function updateChatHistoryUI() {
        chatHistoryContainer.innerHTML = '';
        conversations.forEach(conversation => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('chat-history-item');
            if (conversation.id === activeConversationId) {
                historyItem.classList.add('active-chat');
            }

            const textSpan = document.createElement('span');
            const firstMessage = conversation.messages.length > 0 ? conversation.messages[0].message : 'New Chat';
            textSpan.textContent = firstMessage.substring(0, 20) + (firstMessage.length > 20 ? '...' : '');
            textSpan.style.flexGrow = '1';
            textSpan.style.cursor = 'pointer';
            textSpan.addEventListener('click', () => {
                loadConversation(conversation.id);
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('pro-button', 'ghost', 'icon-only', 'small');
            
            const deleteIcon = document.createElement('i');
            deleteIcon.classList.add('material-icons');
            deleteIcon.textContent = 'delete';
            deleteButton.appendChild(deleteIcon);

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteConversation(conversation.id);
            });

            historyItem.appendChild(textSpan);
            historyItem.appendChild(deleteButton);
            chatHistoryContainer.appendChild(historyItem);
        });
    }

    function deleteAllChatHistory() {
        if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
            conversations = [];
            activeConversationId = null;
            localStorage.removeItem('conversations');
            chatBox.innerHTML = '';
            updateChatHistoryUI();
        }
    }

    function deleteConversation(conversationId) {
        if (!confirm('Are you sure you want to delete this chat?')) {
            return;
        }

        const wasActive = conversationId === activeConversationId;
        
        conversations = conversations.filter(c => c.id !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(conversations));

        if (wasActive) {
            if (conversations.length > 0) {
                const latestConversationId = conversations[conversations.length - 1].id;
                loadConversation(latestConversationId);
            } else {
                createNewChat();
            }
        }
        
        updateChatHistoryUI();
    }

    // --- UI Helpers ---
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    }

    function filterChatHistory() {
        const searchTerm = searchHistoryInput.value.toLowerCase();
        const chatHistoryItems = document.querySelectorAll('.chat-history-item');

        chatHistoryItems.forEach(item => {
            const firstMessage = item.textContent.toLowerCase();
            if (firstMessage.includes(searchTerm)) {
                item.style.display = 'flex'; // Use flex instead of block
            } else {
                item.style.display = 'none';
            }
        });
    }

    // --- Incomplete Features (Safely Handled) ---
    function initializePinnedMessageFeature() {
        const pinnedMessageEl = document.getElementById('pinned-message');
        const pinnedTextEl = document.getElementById('pinned-text');
        const pinToggleButton = document.getElementById('pin-toggle');
        const pinIcon = document.getElementById('pin-icon');
        const editPinnedButton = document.getElementById('edit-pinned');

        if (pinToggleButton && editPinnedButton) {
            pinToggleButton.addEventListener('click', () => togglePinnedVisibility(pinnedMessageEl, pinToggleButton, pinIcon));
            editPinnedButton.addEventListener('click', () => editPinnedMessage(pinnedTextEl, pinnedMessageEl));
            loadPinnedMessage(pinnedMessageEl, pinnedTextEl, pinToggleButton, pinIcon);
        }
    }

    function loadPinnedMessage(pinnedMessageEl, pinnedTextEl, pinToggleButton, pinIcon) {
        const pinned = localStorage.getItem('pinnedMessage');
        const pinnedVisible = localStorage.getItem('pinnedVisible');
        if (pinned && pinnedTextEl) {
            pinnedTextEl.textContent = pinned;
        }
        if (pinnedMessageEl) {
            if (pinnedVisible === null || pinnedVisible === 'true') {
                pinnedMessageEl.style.display = 'flex';
                if(pinIcon) pinIcon.textContent = 'push_pin';
                if(pinToggleButton) pinToggleButton.title = 'Unpin message';
            } else {
                pinnedMessageEl.style.display = 'none';
                if(pinIcon) pinIcon.textContent = 'push_pin';
                if(pinToggleButton) pinToggleButton.title = 'Pin message';
            }
        }
    }

    function togglePinnedVisibility(pinnedMessageEl, pinToggleButton, pinIcon) {
        if (!pinnedMessageEl) return;
        const isVisible = pinnedMessageEl.style.display !== 'none';
        if (isVisible) {
            pinnedMessageEl.style.display = 'none';
            localStorage.setItem('pinnedVisible', 'false');
            if(pinToggleButton) pinToggleButton.title = 'Pin message';
        }
        else {
            pinnedMessageEl.style.display = 'flex';
            localStorage.setItem('pinnedVisible', 'true');
            if(pinToggleButton) pinToggleButton.title = 'Unpin message';
        }
    }

    function editPinnedMessage(pinnedTextEl, pinnedMessageEl) {
        if (!pinnedTextEl) return;
        const current = pinnedTextEl.textContent || '';
        const newText = prompt('Edit pinned message:', current);
        if (newText !== null) {
            pinnedTextEl.textContent = newText;
            localStorage.setItem('pinnedMessage', newText);
            if (pinnedMessageEl && pinnedMessageEl.style.display === 'none') {
                pinnedMessageEl.style.display = 'flex';
                localStorage.setItem('pinnedVisible', 'true');
            }
        }
    }

    function toggleSidebar() {
        appContainer.classList.toggle('sidebar-collapsed');
    }

    // --- Run App ---
    initializeApp();
});
