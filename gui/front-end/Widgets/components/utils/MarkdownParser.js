/**
 * Markdown 解析工具
 */
class MarkdownParser {
    /**
     * 将Markdown格式文本转换为HTML
     * @param {string} text - Markdown格式文本
     * @return {string} HTML格式文本
     */
    static parse(text) {
        if (!text || text === '正在思考...') {
            return text;
        }
        
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
            
        return formattedText;
    }
    
    /**
     * 加载MathJax库（如果需要）
     * @param {HTMLElement} element - 需要渲染公式的元素
     */
    static loadMathJax(element) {
        if (document.getElementById('mathjax-script')) {
            return;
        }
        
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
            
            // 重新渲染指定元素
            if (element) {
                window.MathJax.typeset([element]);
            }
        };
    }
    
    /**
     * 检测文本中是否含有数学公式
     * @param {string} text - 要检测的文本
     * @return {boolean} 是否含有数学公式
     */
    static hasFormula(text) {
        return text.includes('$') || text.includes('\\(');
    }
}

export default MarkdownParser;