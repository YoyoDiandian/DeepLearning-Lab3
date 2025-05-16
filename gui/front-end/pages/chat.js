import { ChatContainer } from '../Widgets/components/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 解析URL查询参数，确定当前模式
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'chat'; // 默认为普通聊天模式
    
    // 创建聊天容器组件
    const chatApp = new ChatContainer(
        'chat-container',  // 容器ID
        'chat-header',     // 头部ID
        'chat-messages',   // 消息容器ID
        'input-area',      // 输入区域ID
        mode               // 模式
    );
});