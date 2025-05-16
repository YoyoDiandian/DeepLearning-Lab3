class Button {
    constructor(text, targetPage, x, y, width = 200, height = 80, className = "button") {
        this.text = text;
        this.targetPage = targetPage;
        
        // 创建实际的DOM元素
        this.element = document.createElement('a');
        this.element.href = targetPage;
        this.element.textContent = text;
        this.element.className = className;
        
        // 设置位置和大小
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        
        // 将元素添加到DOM
        document.body.appendChild(this.element);
    }

    // 添加一个销毁方法用于移除DOM元素
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class InputBox {
    constructor(x, y, width = 200, height = 30, placeholder = "", className = "inputBox") {
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.placeholder = placeholder;
        this.element.className = className;
        
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        
        document.body.appendChild(this.element);
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class Message {
    constructor(text, isUser = false, parent = document.body, timestamp = null) {
        // 创建消息容器
        this.element = document.createElement('div');
        this.element.className = isUser ? 'message user-message' : 'message bot-message';
        
        // 创建消息文本元素
        this.textElement = document.createElement('div');
        
        // 处理markdown格式（仅对AI回答）
        if (!isUser && text !== '正在思考...') {
            // 保存原始文本（用于getData方法）
            this.originalText = text;
            
            // 处理Markdown标题 (h1-h6)
            let formattedText = text
                .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
                .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>');
            
            // 处理行内数学公式 $...$
            formattedText = formattedText.replace(/\$([^$]+)\$/g, (match, formula) => {
                return `<span class="math-inline">${formula}</span>`;
            });
            
            // 处理块级数学公式 $$...$$
            formattedText = formattedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
                return `<div class="math-block">${formula}</div>`;
            });
            
            // 处理其他Markdown语法
            formattedText = formattedText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // 代码块
                .replace(/`(.*?)`/g, '<code>$1</code>') // 行内代码
                .replace(/\n/g, '<br>'); // 换行符
            
            this.textElement.innerHTML = formattedText;
            
            // 使用MathJax或KaTeX渲染公式（如果存在）
            if (window.MathJax && (text.includes('$') || text.includes('\\('))) {
                // 如果页面已经加载了MathJax，则使用它渲染公式
                this.element.appendChild(this.textElement);
                window.MathJax.typeset([this.textElement]);
            } else if (window.katex && (text.includes('$') || text.includes('\\('))) {
                // 如果页面已经加载了KaTeX，则使用它渲染公式
                document.querySelectorAll('.math-inline, .math-block').forEach(el => {
                    try {
                        window.katex.render(el.textContent, el, {
                            throwOnError: false,
                            displayMode: el.className === 'math-block'
                        });
                    } catch (e) {
                        console.error('KaTeX渲染错误:', e);
                    }
                });
            } else {
                // 如果都没有加载，需要添加提示或加载相应库
                const hasFormula = text.includes('$') || text.includes('\\(');
                if (hasFormula && !document.getElementById('mathjax-script')) {
                    this.loadMathJax();
                }
            }
        } else {
            this.originalText = text;
            this.textElement.textContent = text;
        }
        
        this.element.appendChild(this.textElement);
        
        // 添加时间戳
        this.timestamp = timestamp || new Date().toLocaleTimeString();
        this.timeElement = document.createElement('div');
        this.timeElement.className = 'message-time';
        this.timeElement.textContent = this.timestamp;
        this.element.appendChild(this.timeElement);
        
        // 添加到父元素
        if (parent) {
            parent.appendChild(this.element);
        }
    }
    
    // 加载MathJax库（如果需要）
    loadMathJax() {
        const script = document.createElement('script');
        script.id = 'mathjax-script';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']]
                },
                svg: {
                    fontCache: 'global'
                }
            };
            
            // 重新渲染当前元素
            window.MathJax.typeset([this.textElement]);
        };
    }
    
    // 更新消息文本
    updateText(text) {
        this.originalText = text;
        // 这里需要重新应用格式化逻辑
        if (text !== '正在思考...') {
            // 处理Markdown标题 (h1-h6)
            let formattedText = text
                .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
                .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>');
            
            // 处理行内数学公式 $...$
            formattedText = formattedText.replace(/\$([^$]+)\$/g, (match, formula) => {
                return `<span class="math-inline">${formula}</span>`;
            });
            
            // 其他Markdown格式化保持不变
            formattedText = formattedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
                return `<div class="math-block">${formula}</div>`;
            });
            
            formattedText = formattedText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>'); // 添加换行符处理
                
            this.textElement.innerHTML = formattedText;
            
            // 如果存在MathJax，重新渲染
            if (window.MathJax) {
                window.MathJax.typeset([this.textElement]);
            }
        } else {
            this.textElement.textContent = text;
        }
    }
    
    // 销毁消息元素
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    // 获取消息数据用于存储
    getData() {
        return {
            text: this.originalText || this.textElement.textContent,
            isUser: this.element.classList.contains('user-message'),
            timestamp: this.timestamp
        };
    }
}

// 新增：聊天历史管理器
class ChatHistoryManager {
    constructor(storageKey = 'chatHistory') {
        this.storageKey = storageKey;
    }
    
    // 保存消息到localStorage
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
    
    // 获取所有历史记录
    getHistory() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }
    
    // 清空历史记录
    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }
}

// 新增：聊天容器组件
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
            this.header.textContent = '计算工具';
            document.title = '计算工具 - 大模型实验平台';
        } else {
            this.header.textContent = 'AI 助手';
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
    
    // 初始化UI组件
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
            "发送", 
            "#", 
            buttonX, 
            buttonY, 
            100, 
            30, 
            "send-button"
        );
        
        // 添加样式
        this.inputBox.element.style.position = 'absolute';
        this.sendButton.element.style.position = 'absolute';
        this.sendButton.element.style.backgroundColor = this.isCalculatorMode ? 'rgba(1, 182, 46, 0.382)' : 'rgba(1, 225, 255, 0.382)';
        this.sendButton.element.style.textAlign = 'center';
        this.sendButton.element.style.lineHeight = '30px';
        this.sendButton.element.style.borderRadius = '5px';
        
        // 创建清除记录按钮
        this.clearButton = new Button(
            "清除记录", 
            "#", 
            buttonX - 120, 
            buttonY, 
            100, 
            30, 
            "clear-button"
        );
        
        this.clearButton.element.style.position = 'absolute';
        this.clearButton.element.style.backgroundColor = 'rgba(255, 99, 71, 0.5)';
        this.clearButton.element.style.textAlign = 'center';
        this.clearButton.element.style.lineHeight = '30px';
        this.clearButton.element.style.borderRadius = '5px';
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 绑定事件处理
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
    }
    
    // 添加消息
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
    
    // 发送消息到后端
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
    
    // 加载聊天历史
    loadChatHistory() {
        // 获取聊天历史
        const chatHistory = this.historyManager.getHistory();
        
        // 清除已有消息
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        
        // 显示欢迎消息
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
        
        // 重新添加所有历史消息
        chatHistory.forEach(msg => {
            new Message(msg.text, msg.isUser, this.messagesContainer, msg.timestamp);
        });
        
        // 滚动到底部
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

export { Button, InputBox, Message, ChatHistoryManager, ChatContainer };
export default Button;