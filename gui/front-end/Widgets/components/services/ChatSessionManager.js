// front-end/Widgets/components/services/ChatSessionManager.js
class ChatSessionManager {
    constructor(storageKeyPrefix = 'chat') {
        this.storageKeyPrefix = storageKeyPrefix;
        this.sessionsKey = `${storageKeyPrefix}_sessions`;
        this.currentSessionId = null;
        this.initSessions();
    }

    initSessions() {
        const sessions = this.getSessions();
        if (!sessions || sessions.length === 0) {
            this.createNewSession('默认会话');
        } else {
            this.currentSessionId = sessions[0].id;
        }
    }

    getSessions() {
        const sessionsJson = localStorage.getItem(this.sessionsKey);
        return sessionsJson ? JSON.parse(sessionsJson) : [];
    }

    saveSessions(sessions) {
        localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    }

    createNewSession(title = '新会话') {
        const sessionId = 'session_' + Date.now();
        const session = {
            id: sessionId,
            title: title,
            timestamp: Date.now(),
            messagesKey: `${this.storageKeyPrefix}_${sessionId}`
        };
        const sessions = this.getSessions();
        sessions.unshift(session);
        if (sessions.length > 10) {
            const oldestSession = sessions.pop();
            localStorage.removeItem(oldestSession.messagesKey);
        }
        this.saveSessions(sessions);
        this.currentSessionId = sessionId;
        localStorage.setItem(session.messagesKey, JSON.stringify([]));
        return sessionId;
    }

    switchSession(sessionId) {
        const sessions = this.getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(`会话ID ${sessionId} 不存在`);
            return false;
        }
        this.currentSessionId = sessionId;
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex > 0) {
            const [selectedSession] = sessions.splice(sessionIndex, 1);
            sessions.unshift(selectedSession);
            selectedSession.timestamp = Date.now();
            this.saveSessions(sessions);
        }
        return true;
    }

    getHistory() {
        if (!this.currentSessionId) {
            console.warn('当前没有活跃会话');
            return [];
        }
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        if (!currentSession) {
            console.error(`无法找到当前会话: ${this.currentSessionId}`);
            if (sessions.length > 0) {
                this.currentSessionId = sessions[0].id;
                return this.getHistory();
            }
            return [];
        }
        const messagesJson = localStorage.getItem(currentSession.messagesKey);
        return messagesJson ? JSON.parse(messagesJson) : [];
    }

    saveMessage(message) {
        if (!this.currentSessionId) {
            this.createNewSession();
        }
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        if (!currentSession) {
            console.error('无法找到当前会话，消息保存失败');
            return false;
        }
        if (!message.hasOwnProperty('text') || !message.hasOwnProperty('isUser')) {
            console.error('消息格式不正确，必须包含text和isUser字段');
            return false;
        }
        if (!message.timestamp) {
            message.timestamp = Date.now();
        }
        let messages = [];
        const messagesJson = localStorage.getItem(currentSession.messagesKey);
        if (messagesJson) {
            try {
                messages = JSON.parse(messagesJson);
            } catch (e) {
                console.error('解析会话消息失败:', e);
                messages = [];
            }
        }
        messages.push(message);
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        localStorage.setItem(currentSession.messagesKey, JSON.stringify(messages));
        currentSession.timestamp = Date.now();
        if (messages.length === 1 && message.isUser) {
            const title = message.text.slice(0, 10) + (message.text.length > 10 ? '...' : '');
            currentSession.title = title;
        }
        this.saveSessions(sessions);
        return true;
    }

    updateSessionTitle(sessionId, newTitle) {
        if (!newTitle || newTitle.trim() === '') {
            console.error('会话标题不能为空');
            return false;
        }
        const sessions = this.getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(`会话 ${sessionId} 不存在`);
            return false;
        }
        session.title = newTitle.trim();
        this.saveSessions(sessions);
        return true;
    }

    clearHistory() {
        if (!this.currentSessionId) {
            console.warn('当前没有活跃会话，无法清除历史记录');
            return false;
        }
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        if (!currentSession) {
            console.error(`无法找到当前会话: ${this.currentSessionId}`);
            return false;
        }
        localStorage.setItem(currentSession.messagesKey, JSON.stringify([]));
        return true;
    }

    deleteSession(sessionId) {
        const sessions = this.getSessions();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            console.error(`会话 ${sessionId} 不存在`);
            return false;
        }
        const session = sessions[sessionIndex];
        localStorage.removeItem(session.messagesKey);
        sessions.splice(sessionIndex, 1);
        this.saveSessions(sessions);
        if (sessionId === this.currentSessionId) {
            if (sessions.length > 0) {
                this.currentSessionId = sessions[0].id;
            } else {
                this.createNewSession();
            }
        }
        return true;
    }

    getCurrentSession() {
        if (!this.currentSessionId) {
            return null;
        }
        const sessions = this.getSessions();
        return sessions.find(s => s.id === this.currentSessionId) || null;
    }
}

export default ChatSessionManager;

// front-end/Widgets/components/chat/ChatContainer.js
class ChatContainer {
    constructor(containerId, headerId, messagesId, inputAreaId, mode = 'chat') {
        this.container = document.getElementById(containerId);
        this.header = document.getElementById(headerId);
        this.messagesContainer = document.getElementById(messagesId);
        this.inputArea = document.getElementById(inputAreaId);
        this.mode = mode;
        this.isChatMode = mode === 'chat';
        this.isCalculatorMode = mode === 'calculator';
        if (this.isCalculatorMode) {
            this.header.textContent = '计算工具';
            document.title = '计算工具 - 大模型实验平台';
        } else {
            this.header.textContent = 'AI 助手';
            document.title = 'AI 助手 - 大模型实验平台';
        }
        this.storageKey = this.isCalculatorMode ? 'calculatorHistory' : 'chatHistory';
        this.historyManager = new ChatHistoryManager(this.storageKey);
        this.sessionManager = new ChatSessionManager(this.storageKey);
        this.initComponents();
        this.loadChatHistory();
        this.updateHeaderTitle();
    }

    initComponents() {
        const inputRect = this.inputArea.getBoundingClientRect();
        const inputBoxWidth = inputRect.width - 120;
        const inputBoxX = inputRect.left + 10;
        const inputBoxY = inputRect.top + 15;
        const buttonX = inputBoxX + inputBoxWidth + 10;
        const buttonY = inputBoxY;
        this.inputBox = new InputBox(
            inputBoxX, 
            inputBoxY, 
            inputBoxWidth, 
            30, 
            this.isCalculatorMode ? "输入数学表达式或问题..." : "输入您的问题...", 
            "chat-input"
        );
        this.sendButton = new Button(
            "↑", 
            "#", 
            "send-button"
        );
        this.inputArea.appendChild(this.inputBox.element);
        this.inputArea.appendChild(this.sendButton.element);
        this.sendButton.element.style.textAlign = 'center';
        this.clearButton = new Button(
            "清除记录", 
            "#", 
            "clear-button"
        );
        this.newSessionButton = new Button(
            "新增会话", 
            "#", 
            "new-session-button"
        );
        this.header.appendChild(this.newSessionButton.element);
        this.bindEvents();
    }

    bindEvents() {
        this.sendButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        this.inputBox.element.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.clearButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要清除所有聊天记录吗？')) {
                this.historyManager.clearHistory();
                window.location.reload();
            }
        });
        this.newSessionButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            this.createNewSession();
        });
    }

    createNewSession() {
        const newSessionId = this.sessionManager.createNewSession();
        this.loadChatHistory();
        this.updateHeaderTitle();
        console.log('新会话已创建，ID:', newSessionId);
    }

    addMessage(text, isUser) {
        const message = new Message(text, isUser, this.messagesContainer);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        if (text !== '正在思考...') {
            this.historyManager.saveMessage(message.getData());
        }
        return message;
    }

    sendMessage() {
        const message = this.inputBox.getValue().trim();
        if (!message) return;
        this.addMessage(message, true);
        this.inputBox.setValue('');
        const typingIndicator = this.addMessage('正在思考...', false);
        const apiEndpoint = this.isCalculatorMode 
            ? 'http://localhost:8000/api/calculate' 
            : 'http://localhost:8000/api/chat';
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络错误：' + response.status);
            }
            return response.json();
        })
        .then(data => {
            typingIndicator.destroy();
            this.addMessage(data.response, false);
        })
        .catch(error => {
            typingIndicator.destroy();
            this.addMessage('抱歉，发生了错误: ' + error.message, false);
            console.error('Error:', error);
        });
    }

    loadChatHistory() {
        const chatHistory = this.historyManager.getHistory();
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        const welcomeMessageElement = document.createElement('div');
        welcomeMessageElement.className = 'message bot-message';
        if (this.isCalculatorMode) {
            welcomeMessageElement.innerHTML = '你好！我是<strong>智能计算助手</strong>，既可以回答普通问题，也能解决复杂数学计算。<br>例如：<code>129032910921*188231</code> 或 <code>计算圆周率乘以2.5的平方是多少</code>';
        } else {
            welcomeMessageElement.textContent = '你好！我是AI助手，有什么可以帮助你的吗？';
        }
        this.messagesContainer.appendChild(welcomeMessageElement);
        if (chatHistory.length === 0) {
            return;
        }
        chatHistory.forEach(msg => {
            new Message(msg.text, msg.isUser, this.messagesContainer, msg.timestamp);
        });
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateHeaderTitle() {
        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession) {
            this.header.textContent = currentSession.title;
        }
    }
}