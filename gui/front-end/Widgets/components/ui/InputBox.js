/**
 * 输入框组件
 */
class InputBox {
    constructor(x, y, width = 200, height = 30, placeholder = "", className = "inputBox") {
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.placeholder = placeholder;
        this.element.className = className;
    
        
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

export default InputBox;