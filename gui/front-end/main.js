// main.js - 大模型实验平台主页入口文件

// 等待DOM内容加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面功能
    initializeModules();
});

/**
 * 初始化模块卡片
 */
function initializeModules() {
    // 定义可用模块
    const modules = [
        {
            id: 'chat',
            title: 'AI 助手',
            description: '基于大型语言模型的智能助手，可以回答问题、提供建议和进行自然对话。支持多轮对话和会话保存功能。',
            image: './asserts/ai-assistant.jpg',
            link: './pages/chat.html?mode=chat',
            bgColor: '#e6f3ff'
        },
        {
            id: 'calculator',
            title: '计算工具',
            description: '智能计算工具，可以处理复杂数学计算、解答数学问题，并提供计算步骤说明。',
            image: './asserts/calculator.jpg',
            link: './pages/chat.html?mode=calculator',
            bgColor: '#e7f7e7'
        }
    ];

    // 获取卡片容器
    const cardContainer = document.getElementById('cardContainer');

    // 清空容器
    cardContainer.innerHTML = '';

    // 创建并添加每个模块卡片
    modules.forEach(module => {
        const card = createModuleCard(module);
        cardContainer.appendChild(card);
    });
}

/**
 * 创建模块卡片元素
 * @param {Object} module - 模块信息
 * @returns {HTMLElement} - 卡片元素
 */
function createModuleCard(module) {
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'card';
    if (module.disabled) {
        card.style.opacity = '0.7';
    }

    // 创建卡片图像区域
    const imageDiv = document.createElement('div');
    imageDiv.className = 'card-image';
    
    // 如果有图片则设置背景图，否则使用背景色
    if (module.image) {
        try {
            // 尝试加载图片
            const img = new Image();
            img.onload = () => {
                imageDiv.style.backgroundImage = `url('${module.image}')`;
            };
            img.onerror = () => {
                // 图片加载失败时使用背景色和更合理的图标
                imageDiv.style.backgroundColor = module.bgColor || '#f0f0f0';
                
                // 根据模块ID选择合适的图标
                let iconContent = '';
                if (module.id === 'chat') {
                    iconContent = '<span style="font-size:3rem;">💬</span>'; // 聊天气泡图标
                } else if (module.id === 'calculator') {
                    iconContent = '<span style="font-size:3rem;">🧮</span>'; // 计算器图标
                } else {
                    // 默认情况下使用首字母
                    iconContent = `<span style="font-size:3rem;">${module.title.charAt(0)}</span>`;
                }
                
                imageDiv.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#666;">${iconContent}</div>`;
            };
            img.src = module.image;
        } catch (e) {
            // 出错时使用背景色和图标
            imageDiv.style.backgroundColor = module.bgColor || '#f0f0f0';
            
            // 根据模块ID选择合适的图标
            let iconContent = '';
            if (module.id === 'chat') {
                iconContent = '<i style="font-size:3rem;">💬</i>'; // 聊天气泡图标
            } else if (module.id === 'calculator') {
                iconContent = '<i style="font-size:3rem;">🧮</i>'; // 计算器图标
            } else {
                // 默认情况下使用首字母
                iconContent = `<span style="font-size:3rem;">${module.title.charAt(0)}</span>`;
            }
            
            imageDiv.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#666;">${iconContent}</div>`;
        }
    } else {
        // 没有图片时使用背景色和图标
        imageDiv.style.backgroundColor = module.bgColor || '#f0f0f0';
        
        // 根据模块ID选择合适的图标
        let iconContent = '';
        if (module.id === 'chat') {
            iconContent = '<i style="font-size:3rem;">💬</i>'; // 聊天气泡图标
        } else if (module.id === 'calculator') {
            iconContent = '<i style="font-size:3rem;">🧮</i>'; // 计算器图标
        } else {
            // 默认情况下使用首字母
            iconContent = `<span style="font-size:3rem;">${module.title.charAt(0)}</span>`;
        }
        
        imageDiv.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#666;">${iconContent}</div>`;
    }

    // 创建卡片内容区域
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-content';

    // 创建标题
    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = module.title;
    contentDiv.appendChild(title);

    // 创建描述
    const description = document.createElement('p');
    description.className = 'card-text';
    description.textContent = module.description;
    contentDiv.appendChild(description);

    // 创建操作按钮区域
    const actionDiv = document.createElement('div');
    actionDiv.className = 'card-action';

    // 创建按钮
    const button = document.createElement('a');
    button.className = module.disabled ? 'btn btn-secondary' : 'btn btn-primary';
    button.textContent = module.disabled ? '即将推出' : '立即使用';
    button.href = module.disabled ? 'javascript:void(0)' : module.link;
    
    if (module.disabled) {
        button.style.cursor = 'not-allowed';
        button.addEventListener('click', (e) => {
            e.preventDefault();
            alert('该功能正在开发中，敬请期待！');
        });
    }
    
    actionDiv.appendChild(button);
    contentDiv.appendChild(actionDiv);

    // 组装卡片
    card.appendChild(imageDiv);
    card.appendChild(contentDiv);

    return card;
}
