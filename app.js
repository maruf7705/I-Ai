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
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatTitle = document.getElementById('chat-title');
    const promptChips = document.querySelectorAll('.chip');
    const langToggleButton = document.getElementById('lang-toggle-button');

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
    const webhookUrl = 'https://sadikco97.app.n8n.cloud/webhook/73d01429-6cc0-4415-bf05-ea4ed1b6a987/chat';

    // App State
    let conversations = [];
    let activeConversationId = null;
    let isProcessing = false;

    // --- Modal Utility ---
    const Modal = {
        show(title, text, options = {}) {
            return new Promise((resolve) => {
                modal.title.textContent = title;
                modal.text.textContent = text;

                modal.inputContainer.classList.toggle('hidden', !options.prompt);
                modal.input.value = options.prompt ? (options.placeholder || '') : '';

                modal.confirmButton.textContent = options.confirmText || I18n.t('modalConfirm');
                modal.cancelButton.textContent = options.cancelText || I18n.t('modalCancel');

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
                    setTimeout(() => modal.input.focus(), 100);
                }
            });
        },
        hide() {
            modal.backdrop.classList.add('hidden');
        }
    };

    // --- Initialization ---
    function initializeApp() {
        // Initialize i18n FIRST
        I18n.init();

        attachEventListeners();
        loadConversations();
        loadTheme();
        autoResizeTextarea();
        updateWelcomeScreen();

        // Listen for language changes to refresh dynamic UI
        I18n.onChange(() => {
            updateChatHistoryUI();
            updateChatTitle();
        });
    }

    function attachEventListeners() {
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        clearChatButton.addEventListener('click', clearCurrentChat);
        newChatButton.addEventListener('click', createNewChat);
        themeToggleButton.addEventListener('click', toggleTheme);
        searchHistoryInput.addEventListener('input', filterChatHistory);
        deleteAllHistoryButton.addEventListener('click', deleteAllChatHistory);
        menuButton.addEventListener('click', toggleSidebar);

        // Language toggle
        if (langToggleButton) {
            langToggleButton.addEventListener('click', () => {
                I18n.toggle();
            });
        }

        // Sidebar backdrop click to close (mobile)
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                appContainer.classList.add('sidebar-collapsed');
            });
        }

        // Prompt chips
        promptChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt) {
                    userInput.value = prompt;
                    autoResizeTextarea();
                    sendMessage();
                }
            });
        });

        // Keyboard shortcut: Ctrl+K to focus search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (appContainer.classList.contains('sidebar-collapsed')) {
                    toggleSidebar();
                }
                searchHistoryInput.focus();
            }
        });
    }

    function autoResizeTextarea() {
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
        });
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon();
        }
    }

    function updateThemeIcon() {
        const icon = themeToggleButton.querySelector('.material-icons');
        if (document.body.classList.contains('dark-mode')) {
            icon.textContent = 'light_mode';
        } else {
            icon.textContent = 'brightness_4';
        }
    }

    // --- Welcome Screen ---
    function updateWelcomeScreen() {
        const conversation = conversations.find(c => c.id === activeConversationId);
        const hasMessages = conversation && conversation.messages.length > 0;

        if (hasMessages) {
            welcomeScreen.classList.add('hidden');
            chatBox.style.display = '';
        } else if (!activeConversationId || !hasMessages) {
            welcomeScreen.classList.remove('hidden');
            chatBox.style.display = 'none';
        }
    }

    // --- Dynamic Title ---
    function updateChatTitle() {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            const title = conversation.title ||
                (conversation.messages.length > 0
                    ? conversation.messages[0].message.substring(0, 40) + (conversation.messages[0].message.length > 40 ? '…' : '')
                    : I18n.t('newChat'));
            chatTitle.textContent = title;
        } else {
            chatTitle.textContent = I18n.t('chatTitleDefault');
        }
    }

    // --- Core Chat Functions ---
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '' || isProcessing) return;

        if (!activeConversationId) {
            createNewChat();
        }

        // Show chat box, hide welcome
        welcomeScreen.classList.add('hidden');
        chatBox.style.display = '';

        appendMessage(message, 'user', new Date());
        saveMessageToHistory(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        setProcessing(true);
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
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                hideLoadingIndicator();
                setProcessing(false);
                // n8n returns { reply: "..." } — support both reply and output
                const botReply = data?.reply || data?.output || data?.text || data?.message;
                if (botReply) {
                    appendMessage(botReply, 'bot', new Date());
                    saveMessageToHistory(botReply, 'bot');
                } else {
                    console.warn('Unexpected response format:', data);
                    appendMessage(I18n.t('unparsedResponse'), 'bot', new Date(), true);
                }
            })
            .catch(error => {
                hideLoadingIndicator();
                setProcessing(false);
                console.error('Error:', error);
                appendMessage(I18n.t('errorResponse'), 'bot', new Date(), true);
                saveMessageToHistory(I18n.t('errorResponse'), 'bot');
            });
    }

    function setProcessing(state) {
        isProcessing = state;
        sendButton.disabled = state;
        if (state) {
            sendButton.classList.add('loading');
        } else {
            sendButton.classList.remove('loading');
        }
    }

    function appendMessage(message, sender, timestamp, isError = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender + '-message');
        if (isError) {
            messageElement.classList.add('error-message');
        }

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('message-avatar');
        const icon = document.createElement('i');
        icon.classList.add('material-icons');
        icon.textContent = (sender === 'user') ? 'person' : (isError ? 'error_outline' : 'smart_toy');
        icon.setAttribute('aria-hidden', 'true');
        avatarElement.appendChild(icon);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        const messageTextElement = document.createElement('div');
        messageTextElement.innerHTML = (sender === 'bot') ? marked.parse(message) : escapeHtml(message);

        if (sender === 'user') {
            messageTextElement.addEventListener('dblclick', async () => {
                const newText = await Modal.show(
                    I18n.t('editMessageTitle'),
                    '',
                    { prompt: true, placeholder: message, confirmText: I18n.t('editMessageSave') }
                );
                if (newText !== null) {
                    updateMessage(timestamp, newText);
                }
            });
        }

        messageContent.appendChild(messageTextElement);

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(messageContent);

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        updateChatTitle();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            updateWelcomeScreen();
            updateChatTitle();

            // Close sidebar on mobile after selecting a chat
            if (window.innerWidth <= 768) {
                appContainer.classList.add('sidebar-collapsed');
            }
        }
    }

    function createNewChat() {
        const newConversationId = 'chat-' + Date.now();
        conversations.push({ id: newConversationId, messages: [] });
        activeConversationId = newConversationId;
        chatBox.innerHTML = '';
        localStorage.setItem('conversations', JSON.stringify(conversations));
        updateChatHistoryUI();
        updateWelcomeScreen();
        updateChatTitle();

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            appContainer.classList.add('sidebar-collapsed');
        }
    }

    function clearCurrentChat() {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            conversation.messages = [];
            localStorage.setItem('conversations', JSON.stringify(conversations));
            chatBox.innerHTML = '';
            updateChatHistoryUI();
            updateWelcomeScreen();
            updateChatTitle();
        }
    }

    function updateChatHistoryUI() {
        chatHistoryContainer.innerHTML = '';

        if (conversations.length === 0) {
            // Empty state
            const emptyState = document.createElement('div');
            emptyState.classList.add('history-empty-state');
            emptyState.innerHTML = `
                <i class="material-icons" aria-hidden="true">chat_bubble_outline</i>
                <p>${I18n.t('noChatsYet')}<br>${I18n.t('startConversation')}</p>
            `;
            chatHistoryContainer.appendChild(emptyState);
            return;
        }

        conversations.forEach(conversation => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('chat-history-item');
            historyItem.setAttribute('role', 'listitem');
            if (conversation.id === activeConversationId) {
                historyItem.classList.add('active-chat');
            }

            const textSpan = document.createElement('span');
            const conversationTitle = conversation.title || (conversation.messages.length > 0 ? conversation.messages[0].message : I18n.t('newChat'));
            textSpan.textContent = conversationTitle.substring(0, 25) + (conversationTitle.length > 25 ? '…' : '');
            textSpan.style.flexGrow = '1';
            textSpan.style.cursor = 'pointer';
            textSpan.style.overflow = 'hidden';
            textSpan.style.textOverflow = 'ellipsis';
            textSpan.style.whiteSpace = 'nowrap';
            textSpan.addEventListener('click', () => loadConversation(conversation.id));

            textSpan.addEventListener('dblclick', async () => {
                const newTitle = await Modal.show(
                    I18n.t('renameChatTitle'),
                    '',
                    { prompt: true, placeholder: conversationTitle, confirmText: I18n.t('renameChatConfirm') }
                );
                if (newTitle !== null && newTitle.trim() !== '') {
                    renameConversation(conversation.id, newTitle);
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('pro-button', 'ghost', 'icon-only', 'small');
            deleteButton.setAttribute('aria-label', 'Delete this chat');

            const deleteIcon = document.createElement('i');
            deleteIcon.classList.add('material-icons');
            deleteIcon.textContent = 'delete';
            deleteIcon.setAttribute('aria-hidden', 'true');
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
        const confirmed = await Modal.show(
            I18n.t('deleteAllTitle'),
            I18n.t('deleteAllText')
        );
        if (confirmed) {
            conversations = [];
            activeConversationId = null;
            localStorage.removeItem('conversations');
            chatBox.innerHTML = '';
            updateChatHistoryUI();
            updateWelcomeScreen();
            updateChatTitle();
        }
    }

    async function deleteConversation(conversationId) {
        const confirmed = await Modal.show(
            I18n.t('deleteChatTitle'),
            I18n.t('deleteChatText')
        );
        if (!confirmed) return;

        const wasActive = conversationId === activeConversationId;

        conversations = conversations.filter(c => c.id !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(conversations));

        if (wasActive) {
            if (conversations.length > 0) {
                loadConversation(conversations[conversations.length - 1].id);
            } else {
                activeConversationId = null;
                chatBox.innerHTML = '';
                updateWelcomeScreen();
                updateChatTitle();
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
            updateChatTitle();
        }
    }

    // --- UI Helpers ---
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        updateThemeIcon();
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
        icon.setAttribute('aria-hidden', 'true');
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
