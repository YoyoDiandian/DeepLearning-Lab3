import MarkdownParser from '../utils/MarkdownParser.js';

/**
 * 消息组件
 */
class Message {
    constructor(text, isUser = false, parent = null, timestamp = null) {
        // 创建消息容器
        this.element = document.createElement('div');
        
        // 确保应用正确的类名
        this.element.className = isUser ? 'message user-message' : 'message bot-message';
        
        // 创建消息文本元素
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'message-content'; // 添加内容类
        
        // 保存原始文本
        this.originalText = text;
        
        // 处理markdown格式（仅对AI回答）
        if (!isUser && text !== '正在思考...') {
            // 解析Markdown
            const formattedText = MarkdownParser.parse(text);
            this.contentElement.innerHTML = formattedText;
            
            // 检查是否有数学公式需要渲染
            if (MarkdownParser.hasFormula(text)) {
                if (window.MathJax) {
                    window.MathJax.typeset([this.contentElement]);
                } else {
                    MarkdownParser.loadMathJax(this.contentElement);
                }
            }
        } else {
            this.contentElement.textContent = text;
        }
        
        this.element.appendChild(this.contentElement);
        
        // 添加时间戳
        this.timestamp = timestamp || new Date().toLocaleTimeString();
        this.timeElement = document.createElement('div');
        this.timeElement.className = 'message-time';
        this.timeElement.textContent = this.timestamp;
        this.element.appendChild(this.timeElement);
        
        // 在添加到父元素前确保元素可见
        this.element.style.display = 'block'; // 确保元素是可见的
        
        // 添加到父元素
        const parentElement = parent || document.body;
        parentElement.appendChild(this.element);
        
        // 调试信息
        console.log(`Message已创建并添加到`, parentElement);
    }
    
    /**
     * 更新消息文本
     * @param {string} text - 新的消息文本
     */
    updateText(text) {
        this.originalText = text;
        
        if (text !== '正在思考...') {
            // 解析Markdown
            const formattedText = MarkdownParser.parse(text);
            this.contentElement.innerHTML = formattedText;
            
            // 如果存在MathJax，重新渲染
            if (window.MathJax && MarkdownParser.hasFormula(text)) {
                window.MathJax.typeset([this.contentElement]);
            }
        } else {
            this.contentElement.textContent = text;
        }
    }
    
    /**
     * 销毁消息元素
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    /**
     * 获取消息数据用于存储
     * @return {Object} 消息数据对象
     */
    getData() {
        return {
            text: this.originalText,
            isUser: this.element.classList.contains('user-message'),
            timestamp: this.timestamp
        };
    }
}

export default Message;