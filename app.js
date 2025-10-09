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

        appendMessage(message, 'user', new Date());
        saveMessageToHistory(message, 'user');
        userInput.value = '';
        showLoadingIndicator();

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
            hideLoadingIndicator();
            if (data && data.output) {
                appendMessage(data.output, 'bot', new Date());
                saveMessageToHistory(data.output, 'bot');
            }
        })
        .catch(error => {
            hideLoadingIndicator();
            console.error('Error:', error);
            appendMessage('Sorry, something went wrong.', 'bot', new Date());
            saveMessageToHistory('Sorry, something went wrong.', 'bot');
        });
    }

    function appendMessage(message, sender, timestamp) {
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

        const messageContent = document.createElement('div');

        const messageTextElement = document.createElement('div');
        if (sender === 'bot') {
            messageTextElement.innerHTML = marked.parse(message);
        } else {
            messageTextElement.textContent = message;
        }

        if (sender === 'user') {
            messageTextElement.addEventListener('dblclick', () => {
                const input = document.createElement('textarea');
                input.value = message;
                input.style.width = '100%';
                input.style.height = messageTextElement.offsetHeight + 'px';
                input.addEventListener('blur', () => {
                    updateMessage(timestamp, input.value);
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        updateMessage(timestamp, input.value);
                    }
                });
                messageTextElement.innerHTML = '';
                messageTextElement.appendChild(input);
                input.focus();
            });
        }

        const timestampElement = document.createElement('div');
        timestampElement.classList.add('message-timestamp');
        timestampElement.textContent = new Date(timestamp).toLocaleTimeString();

        messageContent.appendChild(messageTextElement);
        messageContent.appendChild(timestampElement);

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(messageContent);


        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Conversation Management ---
    function saveMessageToHistory(message, sender) {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            conversation.messages.push({ message, sender, timestamp: new Date() });
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
                appendMessage(item.message, item.sender, item.timestamp);
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
            const conversationTitle = conversation.title || (conversation.messages.length > 0 ? conversation.messages[0].message : 'New Chat');
            textSpan.textContent = conversationTitle.substring(0, 20) + (conversationTitle.length > 20 ? '...' : '');
            textSpan.style.flexGrow = '1';
            textSpan.style.cursor = 'pointer';
            textSpan.addEventListener('click', () => {
                loadConversation(conversation.id);
            });

            textSpan.addEventListener('dblclick', () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = conversationTitle;
                input.style.flexGrow = '1';
                input.addEventListener('blur', () => {
                    renameConversation(conversation.id, input.value);
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        renameConversation(conversation.id, input.value);
                    }
                });
                historyItem.replaceChild(input, textSpan);
                input.focus();
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

    function updateMessage(timestamp, newMessage) {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            const message = conversation.messages.find(m => new Date(m.timestamp).getTime() === new Date(timestamp).getTime());
            if (message) {
                message.message = newMessage;
                localStorage.setItem('conversations', JSON.stringify(conversations));
                loadConversation(activeConversationId);
            }
        }
    }

    function renameConversation(conversationId, newTitle) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.title = newTitle;
            localStorage.setItem('conversations', JSON.stringify(conversations));
            updateChatHistoryUI();
        }
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

    function showLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.classList.add('message', 'bot-message');

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        const icon = document.createElement('i');
        icon.classList.add('material-icons');
        icon.textContent = 'smart_toy';
        avatarElement.appendChild(icon);

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            typingIndicator.appendChild(dot);
        }

        loadingIndicator.appendChild(avatarElement);
        loadingIndicator.appendChild(typingIndicator);
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // --- Run App ---
    initializeApp();
});
