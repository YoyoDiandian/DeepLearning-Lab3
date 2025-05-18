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
        
        // 添加相对定位以支持绝对定位的子元素
        this.element.style.position = 'relative';
        
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
        
        // 添加底部信息容器（时间戳和操作按钮）
        const messageFooter = document.createElement('div');
        messageFooter.className = 'message-footer';
        
        // 添加时间戳
        this.timestamp = timestamp || new Date().toLocaleTimeString();
        this.timeElement = document.createElement('div');
        this.timeElement.className = 'message-time';
        this.timeElement.textContent = this.timestamp;
        messageFooter.appendChild(this.timeElement);
        
        // 为AI消息添加复制按钮
        if (!isUser && text !== '正在思考...') {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '复制';
            copyButton.title = '复制原始消息';
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡
                this.copyOriginalText();
            });
            
            messageFooter.appendChild(copyButton);
        }
        
        this.element.appendChild(messageFooter);
        
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
    
    /**
     * 复制原始消息文本
     */
    copyOriginalText() {
        // 使用现代的 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this.originalText)
                .then(() => {
                    // 显示复制成功的提示
                    this.showCopySuccessToast();
                })
                .catch(err => {
                    console.error('复制到剪贴板失败:', err);
                    this.fallbackCopy(); // 使用后备复制方法
                });
        } else {
            // 对于不支持 Clipboard API 的浏览器，使用后备方法
            this.fallbackCopy();
        }
    }
    
    /**
     * 后备复制方法
     */
    fallbackCopy() {
        // 创建临时文本区域
        const textarea = document.createElement('textarea');
        textarea.value = this.originalText;
        textarea.style.position = 'fixed';  // 防止滚动页面
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        // 选择文本并复制
        textarea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                // 显示复制成功的提示
                this.showCopySuccessToast();
            } else {
                console.error('复制失败');
            }
        } catch (err) {
            console.error('复制出错:', err);
        }
        
        // 移除临时元素
        document.body.removeChild(textarea);
    }
    
    /**
     * 显示复制成功提示
     */
    showCopySuccessToast() {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = '复制成功';
        
        // 添加到文档
        document.body.appendChild(toast);
        
        // 2秒后移除提示
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2000);
    }
}

export default Message;