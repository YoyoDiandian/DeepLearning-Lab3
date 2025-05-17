import Button from '../ui/Button.js';
import InputBox from '../ui/InputBox.js';
import Message from './Message.js';
import ChatHistoryManager from '../utils/ChatHistoryManager.js';

/**
 * 聊天容器组件
 */
class ChatContainer {
    constructor(containerId, headerId, messagesId, inputAreaId, mode = 'chat') {
        // 获取DOM元素
        this.container = document.getElementById(containerId);
        this.header = document.getElementById(headerId);
        this.messagesContainer = document.getElementById(messagesId);
        this.inputArea = document.getElementById(inputAreaId);
        
        // 模式设置
        this.mode = mode;
        this.isChatMode = mode === 'chat';
        this.isCalculatorMode = mode === 'calculator';
        
        // 根据模式设置页面标题和头部文本
        if (this.isCalculatorMode) {
            document.title = '计算工具 - 大模型实验平台';
        } else {
            document.title = 'AI 助手 - 大模型实验平台';
        }
        
        // 初始化聊天历史管理器
        this.storageKey = this.isCalculatorMode ? 'calculatorHistory' : 'chatHistory';
        this.historyManager = new ChatHistoryManager(this.storageKey);
        
        // 初始化UI组件
        this.initComponents();
        
        // 加载历史记录
        this.loadChatHistory();
    }
    
    /**
     * 初始化UI组件
     */
    initComponents() {
        // 获取输入区域尺寸
        const inputRect = this.inputArea.getBoundingClientRect();
        
        // 计算输入框和按钮位置
        const inputBoxWidth = inputRect.width - 120;
        const inputBoxX = inputRect.left + 10;
        const inputBoxY = inputRect.top + 15;
        const buttonX = inputBoxX + inputBoxWidth + 10;
        const buttonY = inputBoxY;
        
        // 创建输入框
        this.inputBox = new InputBox(
            inputBoxX, 
            inputBoxY, 
            inputBoxWidth, 
            30, 
            this.isCalculatorMode ? "输入数学表达式或问题..." : "输入您的问题...", 
            "chat-input"
        );
        
        // 创建发送按钮
        this.sendButton = new Button(
            "↑", 
            "#", 
            "send-button"
        );
        
        // Add inputBox to input-area
        this.inputArea.appendChild(this.inputBox.element);
        this.inputArea.appendChild(this.sendButton.element);
        
        // 添加样式
        // this.inputBox.element.style.position = 'absolute';
        // this.sendButton.element.style.position = 'absolute';
        // this.sendButton.element.style.backgroundColor = this.isCalculatorMode ? 'rgba(1, 182, 46, 0.382)' : 'rgba(1, 225, 255, 0.382)';
        this.sendButton.element.style.textAlign = 'center';
        // this.sendButton.element.style.lineHeight = '30px';
        // this.sendButton.element.style.borderRadius = '5px';
        
        // this.inputBox.appendChild(this.sendButton.element);

        this.chatHeader = document.createElement('div');
        this.chatHeader.className = 'chat-title';
        this.chatHeader.textContent = this.isCalculatorMode ? '计算工具' : 'AI 助手';
        this.header.appendChild(this.chatHeader);

        // 创建清除记录按钮
        this.clearButton = new Button(
            "清除记录", 
            "#", 
            "clear-button"
        );

        this.backButton = new Button(
            "返回主页", 
            "./initial.html", 
            "back-button"
        );

        this.header.appendChild(this.clearButton.element);
        this.header.appendChild(this.backButton.element);

        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 发送按钮点击事件
        this.sendButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // 回车键发送消息
        this.inputBox.element.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 清除记录按钮点击事件
        this.clearButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要清除所有聊天记录吗？')) {
                this.historyManager.clearHistory();
                window.location.reload();
            }
        });
        // 返回主页按钮点击事件
        this.backButton.element.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './initial.html';
        });
    }

    /**
     * 添加消息
     * @param {string} text - 消息文本
     * @param {boolean} isUser - 是否为用户消息
     * @return {Message} 消息组件实例
     */
    addMessage(text, isUser) {
        const message = new Message(text, isUser, this.messagesContainer);
        
        // 滚动到底部
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // 保存到localStorage（但不保存"正在思考..."的临时消息）
        if (text !== '正在思考...') {
            this.historyManager.saveMessage(message.getData());
        }
        
        return message;
    }
    
    /**
     * 发送消息到后端
     */
    sendMessage() {
        const message = this.inputBox.getValue().trim();
        if (!message) return;
        
        // 显示用户消息
        this.addMessage(message, true);
        
        // 清空输入框
        this.inputBox.setValue('');
        
        // 显示"正在思考"提示
        const typingIndicator = this.addMessage('正在思考...', false);
        
        // 根据模式选择不同的API端点
        const apiEndpoint = this.isCalculatorMode 
            ? 'http://localhost:8000/api/calculate' 
            : 'http://localhost:8000/api/chat';
        
        // 发送到后端
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
            // 移除"正在思考"提示
            typingIndicator.destroy();
            
            // 显示AI响应
            this.addMessage(data.response, false);
        })
        .catch(error => {
            // 移除"正在思考"提示
            typingIndicator.destroy();
            
            // 显示错误消息
            this.addMessage('抱歉，发生了错误: ' + error.message, false);
            console.error('Error:', error);
        });
    }
    
    /**
     * 加载聊天历史
     */
    loadChatHistory() {
        // 获取聊天历史
        const chatHistory = this.historyManager.getHistory();
        
        // 清除已有消息
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        
        // 使用Message类创建欢迎消息，并添加时间戳
        
        if (chatHistory.length === 0) {
            let welcomeText;
            if (this.isCalculatorMode) {
                welcomeText = '你好！我是<strong>智能计算工具</strong>，既可以回答普通问题，也能解决复杂数学计算。<br>例如：<code>129032910921*188231</code> 或 <code>计算圆周率乘以2.5的平方是多少</code>';
            } else {
                welcomeText = '你好！我是AI助手，有什么可以帮助你的吗？';
            }
            
            // 使用Message类创建欢迎消息并传入当前时间戳
            const initTimestamp = new Date().toLocaleTimeString()
            const welcomeMessage = new Message(welcomeText, false, this.messagesContainer, initTimestamp);
            chatHistory.push({
                text: welcomeText,
                isUser: false,
                timestamp: initTimestamp
            });
            this.historyManager.saveMessage(welcomeMessage.getData());
            return;
        }

        // 重新添加所有历史消息
        chatHistory.forEach(msg => {
            new Message(msg.text, msg.isUser, this.messagesContainer, msg.timestamp);
        });
        
        // 滚动到底部
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

export default ChatContainer;