/**
 * 聊天历史管理器
 */
class ChatHistoryManager {
    constructor(storageKey = 'chatHistory') {
        this.storageKey = storageKey;
    }
    
    /**
     * 保存消息到localStorage
     * @param {Object} message - 消息对象
     */
    saveMessage(message) {
        // 获取现有聊天记录
        let chatHistory = this.getHistory() || [];
        
        // 添加新消息
        chatHistory.push(message);
        
        // 限制历史记录数量，防止localStorage溢出
        if (chatHistory.length > 100) {
            chatHistory = chatHistory.slice(-100);
        }
        
        // 保存回localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(chatHistory));
    }
    
    /**
     * 获取所有历史记录
     * @return {Array} 历史记录数组
     */
    getHistory() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }
    
    /**
     * 清空历史记录
     */
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }
}

export default ChatHistoryManager;