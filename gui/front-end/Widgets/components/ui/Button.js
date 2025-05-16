/**
 * 按钮组件
 */
class Button {
    constructor(text, targetPage, x, y, width = 200, height = 80, className = "button", parent = null) {
        this.text = text;
        this.targetPage = targetPage;
        
        // 创建实际的DOM元素
        this.element = document.createElement('a');
        this.element.href = targetPage;
        this.element.textContent = text;
        this.element.className = `button ${className}`.trim();
        
        // 设置位置和大小
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        
        // 将元素添加到DOM - 使用提供的父元素或默认使用document.body
        const parentElement = parent || document.body;
        parentElement.appendChild(this.element);
        
        // 添加调试信息
        console.log(`Button "${text}" 已创建并添加到`, parentElement);
    }

    // 添加一个销毁方法用于移除DOM元素
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default Button;