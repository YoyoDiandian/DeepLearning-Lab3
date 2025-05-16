import Button from '../Widgets/basicElement.js';

// 等待DOM内容加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取窗口尺寸，用于计算按钮位置
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 获取按钮容器，如果不存在则使用body
    const buttonContainer = document.querySelector('.container') || document.body;
    
    // 重新计算按钮位置 - 水平排列
    const buttonY = windowHeight / 2 - 40; // 两个按钮Y坐标相同，垂直居中
    const spacing = 50; // 按钮之间的间隔
    const buttonWidth = 200; // 单个按钮宽度
    const totalWidth = 2 * buttonWidth + spacing; // 两个按钮总宽度加间隔
    
    // 计算左侧按钮起始位置，使两个按钮整体居中
    const startX = (windowWidth - totalWidth) / 2;
    
    // 分别计算左右按钮的X坐标
    const leftButtonX = startX;
    const rightButtonX = startX + buttonWidth + spacing;
    
    // 创建两个按钮，使用新的水平布局坐标
    const aiButton = new Button('AI 助手', './chat.html?mode=chat', leftButtonX, buttonY);
    const calculatorButton = new Button('计算工具', './chat.html?mode=calculator', rightButtonX, buttonY);
});