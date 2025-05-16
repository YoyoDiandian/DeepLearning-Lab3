/**
 * 聊天会话管理器
 * 扩展现有的ChatHistoryManager，添加会话管理功能
 */
class ChatSessionManager {
    /**
     * 创建会话管理器
     * @param {string} storageKeyPrefix - 存储键前缀
     */
    constructor(storageKeyPrefix = 'chat') {
        this.storageKeyPrefix = storageKeyPrefix;
        this.sessionsKey = `${storageKeyPrefix}_sessions`;
        this.currentSessionId = null;
        
        // 初始化或加载会话列表
        this.initSessions();
    }
    
    /**
     * 初始化会话
     */
    initSessions() {
        // 获取或创建会话列表
        const sessions = this.getSessions();
        
        if (!sessions || sessions.length === 0) {
            // 如果没有会话，创建第一个会话
            this.createNewSession();
        } else {
            // 使用最近的会话
            this.currentSessionId = sessions[0].id;
        }
    }
    
    /**
     * 获取会话列表
     * @returns {Array} 会话列表
     */
    getSessions() {
        const sessionsJson = localStorage.getItem(this.sessionsKey);
        return sessionsJson ? JSON.parse(sessionsJson) : [];
    }
    
    /**
     * 保存会话列表
     * @param {Array} sessions - 会话列表
     */
    saveSessions(sessions) {
        localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    }
    
    /**
     * 创建新会话
     * @param {string} title - 会话标题
     * @returns {string} 新会话ID
     */
    createNewSession(title = '新会话') {
        const sessionId = 'session_' + Date.now();
        const session = {
            id: sessionId,
            title: title,
            timestamp: Date.now(),
            messagesKey: `${this.storageKeyPrefix}_${sessionId}`
        };
        
        // 获取当前会话列表
        const sessions = this.getSessions();
        
        // 添加新会话到开头（最新的在前面）
        sessions.unshift(session);
        
        // 限制会话数量为10个
        if (sessions.length > 10) {
            // 删除最旧的会话及其消息
            const oldestSession = sessions.pop();
            localStorage.removeItem(oldestSession.messagesKey);
        }
        
        // 保存会话列表
        this.saveSessions(sessions);
        
        // 设置为当前会话
        this.currentSessionId = sessionId;
        
        // 清空新会话的消息
        localStorage.setItem(session.messagesKey, JSON.stringify([]));
        
        return sessionId;
    }
    
    /**
     * 切换到指定会话
     * @param {string} sessionId - 会话ID
     * @returns {boolean} 是否成功切换
     */
    switchSession(sessionId) {
        const sessions = this.getSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (session) {
            this.currentSessionId = sessionId;
            
            // 可以选择将选中的会话移动到列表顶部
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex > 0) {
                // 从当前位置移除
                const [selectedSession] = sessions.splice(sessionIndex, 1);
                // 添加到顶部
                sessions.unshift(selectedSession);
                // 保存更新后的顺序
                this.saveSessions(sessions);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取当前会话的消息历史
     * @returns {Array} 消息历史
     */
    getHistory() {
        if (!this.currentSessionId) {
            return [];
        }
        
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        
        if (!currentSession) {
            return [];
        }
        
        const messagesJson = localStorage.getItem(currentSession.messagesKey);
        return messagesJson ? JSON.parse(messagesJson) : [];
    }
    
    /**
     * 保存消息到当前会话
     * @param {Object} message - 消息对象
     */
    saveMessage(message) {
        if (!this.currentSessionId) {
            // 如果没有当前会话，创建一个
            this.createNewSession();
        }
        
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        
        if (!currentSession) {
            console.error('无法找到当前会话');
            return;
        }
        
        // 获取现有消息
        let messages = [];
        const messagesJson = localStorage.getItem(currentSession.messagesKey);
        if (messagesJson) {
            messages = JSON.parse(messagesJson);
        }
        
        // 添加新消息
        messages.push(message);
        
        // 限制每个会话的消息数量
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        // 保存消息
        localStorage.setItem(currentSession.messagesKey, JSON.stringify(messages));
        
        // 更新会话时间戳
        currentSession.timestamp = Date.now();
        
        // 如果是第一条用户消息，设置会话标题
        if (messages.length === 1 && message.isUser) {
            // 使用用户消息的前10个字符作为标题
            const title = message.text.slice(0, 10) + (message.text.length > 10 ? '...' : '');
            currentSession.title = title;
        }
        
        // 保存会话列表
        this.saveSessions(sessions);
    }
    
    /**
     * 清除当前会话的历史记录
     */
    clearHistory() {
        if (!this.currentSessionId) {
            return;
        }
        
        const sessions = this.getSessions();
        const currentSession = sessions.find(s => s.id === this.currentSessionId);
        
        if (currentSession) {
            localStorage.setItem(currentSession.messagesKey, JSON.stringify([]));
        }
    }
    
    /**
     * 删除指定会话
     * @param {string} sessionId - 会话ID
     * @returns {boolean} 是否成功删除
     */
    deleteSession(sessionId) {
        const sessions = this.getSessions();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex === -1) {
            return false;
        }
        
        // 获取会话
        const session = sessions[sessionIndex];
        
        // 删除会话消息
        localStorage.removeItem(session.messagesKey);
        
        // 从列表中移除
        sessions.splice(sessionIndex, 1);
        
        // 保存更新后的会话列表
        this.saveSessions(sessions);
        
        // 如果删除的是当前会话，切换到第一个会话
        if (sessionId === this.currentSessionId) {
            if (sessions.length > 0) {
                this.currentSessionId = sessions[0].id;
            } else {
                // 如果没有会话了，创建一个新会话
                this.createNewSession();
            }
        }
        
        return true;
    }
}

export default ChatSessionManager;