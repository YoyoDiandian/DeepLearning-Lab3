import Message from '../chat/Message.js';

/**
 * 消息处理服务
 */
class MessageService {
    /**
     * 创建消息服务
     * @param {HTMLElement} messagesContainer - 消息容器
     * @param {object} sessionManager - 会话管理器
     * @param {string} mode - 聊天模式
     */
    constructor(messagesContainer, sessionManager, mode = 'chat') {
        this.messagesContainer = messagesContainer;
        this.sessionManager = sessionManager;
        this.mode = mode;
        this.isCalculatorMode = mode === 'calculator';
        this.typingIndicator = null;
        
        console.log('MessageService初始化:', 
                    'messagesContainer:', this.messagesContainer,
                    'mode:', this.mode);
    }
    
    /**
     * 添加消息
     * @param {string} text - 消息文本
     * @param {boolean} isUser - 是否为用户消息
     * @returns {Message} 创建的消息对象
     */
    addMessage(text, isUser) {
        // 检查messagesContainer是否存在
        if (!this.messagesContainer) {
            console.error('无法添加消息: messagesContainer不存在');
            return null;
        }
        
        console.log(`添加${isUser ? '用户' : 'AI'}消息:`, text.substring(0, 30) + '...');
        
        // 创建消息
        const message = new Message(text, isUser, this.messagesContainer);
        
        // 滚动到底部
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // 保存消息到会话管理器
        if (text !== '正在思考...') {
            this.sessionManager.saveMessage(message.getData());
        }
        
        return message;
    }
    
    /**
     * 显示思考中指示器
     */
    showTypingIndicator() {
        this.typingIndicator = this.addMessage('正在思考...', false);
    }
    
    /**
     * 隐藏思考中指示器
     */
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.destroy();
            this.typingIndicator = null;
        }
    }
    
    /**
     * 处理用户输入的消息
     * @param {string} message - 用户消息
     */
    async handleUserMessage(message) {
        // 添加用户消息
        this.addMessage(message, true);
        
        // 显示"正在思考"提示
        this.typingIndicator = this.addMessage('正在思考...', false);
        
        try {
            // 模拟API调用
            setTimeout(() => {
                // 移除"正在思考"提示
                if (this.typingIndicator) {
                    this.typingIndicator.destroy();
                    this.typingIndicator = null;
                }
                
                // 添加AI回复
                const response = this.isCalculatorMode
                    ? `计算结果: ${eval(message)}`
                    : `这是对"${message}"的回复。我是AI助手，可以帮助回答问题、提供信息或进行对话。`;
                    
                this.addMessage(response, false);
            }, 1000);
        } catch (error) {
            // 出错处理
            if (this.typingIndicator) {
                this.typingIndicator.destroy();
                this.typingIndicator = null;
            }
            
            this.addMessage(`抱歉，处理您的请求时出错: ${error.message}`, false);
        }
    }
    
    /**
     * 加载聊天历史
     */
    loadChatHistory() {
        // 获取聊天历史
        const chatHistory = this.sessionManager.getHistory();
        
        // 清除已有消息
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        
        // 显示欢迎消息
        this.loadWelcomeMessage();
        
        if (chatHistory.length === 0) {
            return;
        }
        
        // 重新添加所有历史消息
        chatHistory.forEach(msg => {
            new Message(msg.text, msg.isUser, this.messagesContainer, msg.timestamp);
        });
        
        // 滚动到底部
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    /**
     * 加载欢迎消息
     */
    loadWelcomeMessage() {
        // 清空容器
        this.messagesContainer.innerHTML = '';
        
        // 创建欢迎消息
        const welcomeText = this.isCalculatorMode
            ? '你好！我是<strong>智能计算助手</strong>，既可以回答普通问题，也能解决复杂数学计算。<br>例如：<code>129032910921*188231</code> 或 <code>计算圆周率乘以2.5的平方是多少</code>'
            : '你好！我是AI助手，有什么可以帮助你的吗？';
            
        this.addMessage(welcomeText, false);
    }
    
    /**
     * 清除所有消息
     */
    clearMessages() {
        this.messagesContainer.innerHTML = '';
        this.loadWelcomeMessage();
    }
}

export default MessageService;