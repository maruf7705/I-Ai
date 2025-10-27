document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
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

    // --- Modal Elements ---
    const modal = {
        backdrop: document.getElementById('modal-backdrop'),
        container: document.getElementById('modal-container'),
        title: document.getElementById('modal-title'),
        text: document.getElementById('modal-text'),
        inputContainer: document.getElementById('modal-input-container'),
        input: document.getElementById('modal-input'),
        confirmButton: document.getElementById('modal-confirm-button'),
        cancelButton: document.getElementById('modal-cancel-button'),
    };

    // Webhook URL
    const webhookUrl = 'https://fahimislam997078.app.n8n.cloud/webhook/14833ee0-d754-4f1d-a4ce-a0644181e4fc/chat';

    // App State
    let conversations = [];
    let activeConversationId = null;

    // --- Modal Utility ---
    const Modal = {
        show(title, text, options = {}) {
            return new Promise((resolve) => {
                modal.title.textContent = title;
                modal.text.textContent = text;

                modal.inputContainer.classList.toggle('hidden', !options.prompt);
                modal.input.value = options.prompt ? (options.placeholder || '') : '';

                modal.confirmButton.textContent = options.confirmText || 'Confirm';
                modal.cancelButton.textContent = options.cancelText || 'Cancel';

                modal.backdrop.classList.remove('hidden');

                const onConfirm = () => {
                    this.hide();
                    resolve(options.prompt ? modal.input.value : true);
                };

                const onCancel = () => {
                    this.hide();
                    resolve(options.prompt ? null : false);
                };

                modal.confirmButton.onclick = onConfirm;
                modal.cancelButton.onclick = onCancel;
                modal.backdrop.onclick = (e) => {
                    if (e.target === modal.backdrop) {
                        onCancel();
                    }
                };

                if (options.prompt) {
                    modal.input.focus();
                }
            });
        },
        hide() {
            modal.backdrop.classList.add('hidden');
        }
    };

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
        icon.textContent = (sender === 'user') ? 'person' : 'smart_toy';
        avatarElement.appendChild(icon);

        const messageContent = document.createElement('div');

        const messageTextElement = document.createElement('div');
        messageTextElement.innerHTML = (sender === 'bot') ? marked.parse(message) : message;

        if (sender === 'user') {
            messageTextElement.addEventListener('dblclick', async () => {
                const newText = await Modal.show('Edit Message', '', { prompt: true, placeholder: message, confirmText: 'Save' });
                if (newText !== null) {
                    updateMessage(timestamp, newText);
                }
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
            chatBox.innerHTML = '';
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
            textSpan.addEventListener('click', () => loadConversation(conversation.id));

            textSpan.addEventListener('dblclick', async () => {
                const newTitle = await Modal.show('Rename Chat', '', { prompt: true, placeholder: conversationTitle, confirmText: 'Rename' });
                if (newTitle !== null && newTitle.trim() !== '') {
                    renameConversation(conversation.id, newTitle);
                }
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

    async function deleteAllChatHistory() {
        const confirmed = await Modal.show('Delete All History?', 'This action cannot be undone.');
        if (confirmed) {
            conversations = [];
            activeConversationId = null;
            localStorage.removeItem('conversations');
            chatBox.innerHTML = '';
            updateChatHistoryUI();
        }
    }

    async function deleteConversation(conversationId) {
        const confirmed = await Modal.show('Delete Chat?', 'Are you sure you want to delete this chat?');
        if (!confirmed) return;

        const wasActive = conversationId === activeConversationId;
        
        conversations = conversations.filter(c => c.id !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(conversations));

        if (wasActive) {
            if (conversations.length > 0) {
                loadConversation(conversations[conversations.length - 1].id);
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
        document.querySelectorAll('.chat-history-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
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

    // --- Pinned Message Feature (Refactored) ---
    function initializePinnedMessageFeature() {
        // This feature is not fully implemented in the HTML, so we'll avoid errors.
    }

    // --- Run App ---
    initializeApp();
});
