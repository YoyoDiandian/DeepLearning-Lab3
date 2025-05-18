import Button from '../ui/Button.js';
import InputBox from '../ui/InputBox.js';
import Message from './Message.js';
import ChatSessionManager from '../services/ChatSessionManager.js';

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
        
        // 初始化聊天会话管理器
        this.storageKeyPrefix = this.isCalculatorMode ? 'calculator' : 'chat';
        
        // 检查localStorage中是否有已保存的会话ID
        const savedSessionId = localStorage.getItem(`${this.storageKeyPrefix}_current_session_id`);
        if (savedSessionId) {
            console.log(`页面加载时从localStorage恢复会话ID: ${savedSessionId}`);
        }
        
        // 初始化会话管理器
        this.sessionManager = new ChatSessionManager(this.storageKeyPrefix);
        
        // 初始化UI组件
        this.initComponents();
        
        // 加载历史记录
        this.loadChatHistory();
        
        // 更新会话标题
        this.updateSessionTitle();
    }
    
    /**
     * 初始化UI组件
     */
    initComponents() {
        // 创建聊天输入区容器
        const chatInputContainer = document.createElement('div');
        chatInputContainer.className = 'chat-input';
        
        // 创建输入框
        const textarea = document.createElement('textarea');
        textarea.placeholder = this.isCalculatorMode ? "输入数学表达式或问题..." : "输入您的问题...";
        textarea.id = "message-input";
        
        // 创建发送按钮
        const sendButton = document.createElement('button');
        sendButton.id = "send-button";
        sendButton.innerHTML = "↑";
        sendButton.title = "发送消息";
        
        // 组装输入区域
        chatInputContainer.appendChild(textarea);
        chatInputContainer.appendChild(sendButton);
        this.inputArea.appendChild(chatInputContainer);
        
        // 保存引用
        this.inputBox = { 
            element: textarea,
            getValue: () => textarea.value,
            setValue: (val) => { textarea.value = val; }
        };
        this.sendButton = { element: sendButton };

        // 获取头部左右区域的 DOM 引用
        const headerLeft = this.header.querySelector('.header-left');
        const headerActions = this.header.querySelector('.header-actions');

        // 创建侧边栏切换按钮 (三条杠)
        this.sidebarToggle = document.createElement('button');
        this.sidebarToggle.className = 'sidebar-toggle';
        this.sidebarToggle.innerHTML = '☰';
        this.sidebarToggle.title = '切换会话列表';
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        headerLeft.appendChild(this.sidebarToggle);

        // 创建返回主页按钮
        this.backButton = document.createElement('a');
        this.backButton.href = '../main.html';
        this.backButton.className = 'back-button';
        this.backButton.textContent = '返回主页';
        this.backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '../main.html';
        });
        headerLeft.appendChild(this.backButton);

        // 创建并添加标题到头部左侧
        const titleElement = document.createElement('div');
        titleElement.className = 'chat-title';
        titleElement.textContent = this.isCalculatorMode ? '计算工具' : 'AI 助手';
        this.titleElement = titleElement; // 保存标题元素引用
        headerLeft.appendChild(titleElement);
        titleElement.style.marginLeft = '15px';

        // 创建会话操作按钮容器
        const sessionActionsContainer = document.createElement('div');
        sessionActionsContainer.className = 'session-header-actions';

        // 新建会话按钮
        const newSessionButton = document.createElement('button');
        newSessionButton.className = 'header-btn new-session-btn-top'; // 使用新的类名以便单独设置样式
        newSessionButton.id = 'new-session';
        newSessionButton.textContent = '新建会话';
        newSessionButton.title = '创建新会话';
        newSessionButton.addEventListener('click', () => this.createNewSession());
        sessionActionsContainer.appendChild(newSessionButton);

        // 清除记录按钮
        this.clearButton = document.createElement('button');
        this.clearButton.className = 'header-btn clear-history-btn-top'; // 使用新的类名以便单独设置样式
        this.clearButton.id = 'clear-history';
        this.clearButton.textContent = '清除记录';
        this.clearButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要清除当前会话的所有聊天记录吗？')) {
                this.sessionManager.clearHistory();
                this.loadChatHistory();
            }
        });
        sessionActionsContainer.appendChild(this.clearButton);
        
        headerActions.appendChild(sessionActionsContainer);

        // 创建会话列表
        this.createSessionsListContainer();

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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 输入框调整大小
        this.inputBox.element.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // 返回主页按钮点击事件
        if (this.backButton) {
            this.backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '../main.html';
            });
        }
        
        // 监听窗口大小调整，更新布局
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });
        
        // 初次调整布局
        this.adjustLayout();
    }
    
    /**
     * 自动调整文本输入框高度
     */
    autoResizeTextarea() {
        const textarea = this.inputBox.element;
        textarea.style.height = 'auto';
        
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 150);
        textarea.style.height = newHeight + 'px';
        
        // 同时调整输入区域的高度
        this.adjustInputAreaHeight();
        
        // 重新计算整体布局
        this.adjustLayout();
    }
    
    /**
     * 调整输入区域高度
     */
    adjustInputAreaHeight() {
        const textareaHeight = this.inputBox.element.offsetHeight;
        const inputAreaMinHeight = Math.max(textareaHeight + 20, 50);
        this.inputArea.style.minHeight = inputAreaMinHeight + 'px';
    }
    
    /**
     * 调整整体布局
     */
    adjustLayout() {
        // 计算消息容器的高度
        const headerHeight = this.header.offsetHeight || 60;
        const windowHeight = window.innerHeight;
        const inputAreaHeight = this.inputArea.offsetHeight || 70;
        
        // 计算消息区域高度，确保它不会太小
        const messagesHeight = windowHeight - headerHeight - inputAreaHeight - 20; // 减去额外的padding
        
        // 设置消息容器高度
        if (messagesHeight > 100) { // 确保有合理的最小高度
            this.messagesContainer.style.height = `${messagesHeight}px`;
            this.messagesContainer.style.maxHeight = `${messagesHeight}px`;
        }
        
        // 确保输入区域在底部
        this.inputArea.style.position = 'sticky';
        this.inputArea.style.bottom = '0';
        this.inputArea.style.width = '100%';
        
        // 调整聊天容器的高度，设置为确切的视口高度
        // this.container.style.height = '100vh';
        this.container.style.maxHeight = '100vh';
        this.container.style.overflowY = 'hidden';
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    /**
     * 滚动到聊天记录底部
     */
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
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
        
        // 保存到会话（但不保存"正在思考..."的临时消息）
        if (text !== '正在思考...' && !text.includes('thinking-dots')) {
            this.sessionManager.saveMessage(message.getData());
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
        
        // 创建"正在思考"提示 (使用动画效果)
        const thinkingElement = document.createElement('div');
        thinkingElement.className = 'message bot-message thinking';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'thinking-dots';
        
        // 添加三个点
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dotsContainer.appendChild(dot);
        }
        
        thinkingElement.appendChild(dotsContainer);
        this.messagesContainer.appendChild(thinkingElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
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
            if (thinkingElement && thinkingElement.parentNode) {
                thinkingElement.parentNode.removeChild(thinkingElement);
            }
            
            // 显示AI响应
            this.addMessage(data.response, false);
        })
        .catch(error => {
            // 移除"正在思考"提示
            if (thinkingElement && thinkingElement.parentNode) {
                thinkingElement.parentNode.removeChild(thinkingElement);
            }
            
            // 显示错误消息
            this.addMessage('抱歉，发生了错误: ' + error.message, false);
            console.error('Error:', error);
        });
    }
    
    /**
     * 加载聊天历史
     */
    loadChatHistory() {
        console.log('加载聊天历史记录...');
        
        // 确保从localStorage重新获取当前会话ID
        const currentSessionId = localStorage.getItem(`${this.storageKeyPrefix}_current_session_id`);
        if (currentSessionId) {
            console.log(`从localStorage获取到会话ID: ${currentSessionId}`);
        }
        
        // 获取聊天历史
        const chatHistory = this.sessionManager.getHistory();
        console.log(`获取到 ${chatHistory.length} 条历史消息`);
        
        // 清除已有消息
        while (this.messagesContainer.firstChild) {
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }
        
        // 如果没有历史消息，创建欢迎消息
        if (chatHistory.length === 0) {
            let welcomeText;
            if (this.isCalculatorMode) {
                welcomeText = '你好！我是<strong>智能计算工具</strong>，既可以回答普通问题，也能解决复杂数学计算。<br>例如：<code>129032910921*188231</code> 或 <code>计算圆周率乘以2.5的平方是多少</code>';
            } else {
                welcomeText = '你好！我是AI助手，有什么可以帮助你的吗？';
            }
            
            // 使用Message类创建欢迎消息并传入当前时间戳
            const initTimestamp = new Date().toLocaleTimeString();
            const welcomeMessage = new Message(welcomeText, false, this.messagesContainer, initTimestamp);
            
            // 保存欢迎消息
            this.sessionManager.saveMessage(welcomeMessage.getData());
            
            // 更新当前会话的标题
            this.updateSessionsList();
            return;
        }

        // 添加加载指示器
        this.messagesContainer.classList.add('loading');
        
        // 使用延迟加载，防止UI阻塞
        setTimeout(() => {
            // 重新添加所有历史消息
            chatHistory.forEach(msg => {
                try {
                    new Message(msg.text, msg.isUser, this.messagesContainer, msg.timestamp);
                } catch(e) {
                    console.error(`添加消息失败: ${e.message}`, msg);
                }
            });
            
            // 移除加载状态
            this.messagesContainer.classList.remove('loading');
            
            // 滚动到底部
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            console.log(`成功加载了 ${chatHistory.length} 条消息`);
        }, 10);
        
        // 更新会话列表和标题
        this.updateSessionsList();
        this.updateSessionTitle();
    }
    
    /**
     * 更新会话列表
     */
    updateSessionsList() {
        // 检查会话列表容器是否存在，不存在则创建
        if (!this.sessionsListContainer) {
            this.createSessionsListContainer();
            return; // 创建后会重新调用此函数
        }

        // 如果有sessionsListWrapper则使用它，否则直接用sessionsListContainer
        const sessionListElement = this.sessionsListWrapper || this.sessionsListContainer;

        // 清空现有会话列表内容
        while (sessionListElement.firstChild) {
            sessionListElement.removeChild(sessionListElement.firstChild);
        }

        // 获取所有会话
        const sessions = this.sessionManager.getSessions();
        const currentSession = this.sessionManager.getCurrentSession();

        if (sessions.length === 0) {
            return;
        }

        // 为每个会话创建一个项目
        sessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';
            if (currentSession && session.id === currentSession.id) {
                sessionItem.classList.add('active');
            }

            // 会话标题
            const sessionTitle = document.createElement('div');
            sessionTitle.className = 'session-title';
            sessionTitle.textContent = session.title || '无标题会话';
            sessionTitle.title = '双击重命名会话';
            sessionItem.appendChild(sessionTitle);

            // 双击标题重命名会话
            sessionTitle.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const newTitle = prompt('请输入新的会话名称', session.title);
                if (newTitle && newTitle.trim() !== '') {
                    this.sessionManager.updateSessionTitle(session.id, newTitle);
                    this.updateSessionsList();
                    this.updateSessionTitle();
                }
            });
            
            // 会话操作按钮容器
            const actionBtns = document.createElement('div');
            actionBtns.className = 'session-actions';

            // 重命名按钮
            const renameBtn = document.createElement('button');
            renameBtn.className = 'session-rename-btn';
            renameBtn.innerHTML = '✎';
            renameBtn.title = '重命名会话';
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newTitle = prompt('请输入新的会话名称', session.title);
                if (newTitle && newTitle.trim() !== '') {
                    this.sessionManager.updateSessionTitle(session.id, newTitle);
                    this.updateSessionsList();
                    this.updateSessionTitle();
                }
            });

            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'session-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = '删除会话';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`确定要删除会话 "${session.title}" 吗？`)) {
                    this.sessionManager.deleteSession(session.id);
                    this.updateSessionsList();
                    this.loadChatHistory();
                }
            });

            actionBtns.appendChild(renameBtn);
            actionBtns.appendChild(deleteBtn);
            sessionItem.appendChild(actionBtns);

            // 点击会话项目切换到该会话
            sessionItem.addEventListener('click', () => {
                if (!currentSession || session.id !== currentSession.id) {
                    console.log(`点击切换到会话: ${session.id}`);
                    
                    // 先将会话ID保存到localStorage
                    localStorage.setItem(`${this.storageKeyPrefix}_current_session_id`, session.id);
                    
                    // 然后切换会话
                    const success = this.sessionManager.switchSession(session.id);
                    
                    if (success) {
                        console.log(`成功切换到会话: ${session.id}, 现在加载聊天历史`);
                        this.loadChatHistory();
                        this.updateSessionTitle();
                    } else {
                        console.error(`切换会话失败: ${session.id}`);
                    }
                    
                    // 在移动设备上自动关闭侧边栏
                    if (window.innerWidth <= 768) {
                        this.toggleSidebar();
                    }
                }
            });

            // 添加到会话列表容器中
            sessionListElement.appendChild(sessionItem);
        });

        // 添加"新建会话"按钮
        const newSessionBtn = document.createElement('button');
        newSessionBtn.className = 'new-session-btn';
        newSessionBtn.textContent = '+ 新建会话';
        newSessionBtn.addEventListener('click', () => {
            this.createNewSession();
            // 在移动设备上自动关闭侧边栏
            if (window.innerWidth <= 768) {
                this.toggleSidebar();
            }
        });
        
        // 添加到会话列表容器中
        sessionListElement.appendChild(newSessionBtn);
    }
    /**
     * 创建会话列表容器
     */
    createSessionsListContainer() {
        // 创建会话列表侧边栏
        this.sessionsListContainer = document.createElement('div');
        this.sessionsListContainer.className = 'sessions-sidebar';
        this.sessionsListContainer.id = 'sessions-sidebar';
        
        // 标题和关闭按钮
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        
        const sidebarTitle = document.createElement('div');
        sidebarTitle.textContent = '会话列表';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.title = '关闭侧边栏';
        closeBtn.addEventListener('click', () => this.toggleSidebar());
        
        sidebarHeader.appendChild(sidebarTitle);
        sidebarHeader.appendChild(closeBtn);
        this.sessionsListContainer.appendChild(sidebarHeader);
        
        // 创建会话列表容器
        const sessionsListWrapper = document.createElement('div');
        sessionsListWrapper.style.cssText = 'padding:15px 0;flex:1;overflow-y:auto;';
        this.sessionsListWrapper = sessionsListWrapper;
        this.sessionsListContainer.appendChild(sessionsListWrapper);
        
        // 添加到文档中
        document.body.appendChild(this.sessionsListContainer);
        
        // 侧边栏切换按钮的事件监听器已在 initComponents 中添加
    }
    
    /**
     * 切换侧边栏显示/隐藏
     */
    toggleSidebar() {
        if (this.sessionsListContainer.classList.contains('active')) {
            // 隐藏侧边栏
            this.sessionsListContainer.classList.remove('active');
            this.container.classList.remove('with-sidebar');
            this.sidebarToggle.innerHTML = '☰'; // 更改按钮图标
            this.sidebarToggle.title = '显示会话列表';
            
            // 移除可能存在的背景遮罩
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // 在侧边栏动画完成后调整布局
            setTimeout(() => {
                this.adjustLayout();
            }, 300); // 300ms是侧边栏动画的时间
        } else {
            // 显示侧边栏
            this.sessionsListContainer.classList.add('active');
            this.container.classList.add('with-sidebar');
            this.sidebarToggle.innerHTML = '×'; // 更改按钮图标为关闭标志
            this.sidebarToggle.title = '隐藏会话列表';
            
            // 添加遮罩层，点击可关闭侧边栏
            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', () => this.toggleSidebar());
            document.body.appendChild(overlay);
            
            // 使遮罩生效(添加后需要一点延迟才能应用过渡效果)
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);
            
            // 在侧边栏动画完成后调整布局
            setTimeout(() => {
                this.adjustLayout();
            }, 300); // 300ms是侧边栏动画的时间
        }
    }
    
    /**
     * 创建新会话
     */
    createNewSession() {
        this.sessionManager.createNewSession();
        this.loadChatHistory();
        this.updateSessionTitle();
    }
    
    /**
     * 更新会话标题
     */
    updateSessionTitle() {
        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession && this.titleElement) {
            // 更新标题内容
            let title = this.isCalculatorMode ? '计算工具' : 'AI 助手';
            if (currentSession.title && currentSession.title !== '默认会话') {
                title += ` - ${currentSession.title}`;
            }
            this.titleElement.textContent = title;
        }
    }
}

export default ChatContainer;