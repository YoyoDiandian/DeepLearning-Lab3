from flask import Flask, request, jsonify
from flask_cors import CORS
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
import json
import re

# 加载环境变量
load_dotenv()
APIKEY = os.getenv("ZHIPUAPI")

# 初始化Flask应用
app = Flask(__name__)
# 允许跨域请求
CORS(app)

# 初始化智谱AI客户端
client = ZhipuAI(api_key=APIKEY)

# 定义计算器工具
calculator_tool = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "一个简单的计算器，支持加减乘除、括号和小数点运算。当用户询问计算问题时使用此工具。",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "要计算的数学表达式，例如 '2 + 3 * 4' 或 '129032910921*188231'"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

# 处理工具调用的函数
def handle_tool_calls(tool_calls):
    """处理模型返回的工具调用请求"""
    responses = []
    
    for tool_call in tool_calls:
        if tool_call.function.name == "calculator":
            # 解析参数
            args = json.loads(tool_call.function.arguments)
            expression = args.get("expression", "")
            print(f"提取的数学表达式: {expression}")
            
            # 计算表达式
            try:
                allowed_chars = "0123456789+-*/.()^ "
                for char in expression:
                    if char not in allowed_chars:
                        raise ValueError(f"不允许的字符: {char}")
                    elif char == "e":
                        expression = expression.replace("e", "2.718281828459045")
                    elif char == "^":
                        expression = expression.replace("^", "**")
                    
                
                result = eval(expression)
                
                # 构造响应
                responses.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": "calculator",
                    "content": str(result)
                })
            except Exception as e:
                responses.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": "calculator",
                    "content": f"计算错误: {str(e)}"
                })
    
    return responses

# 创建普通聊天API端点
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': '缺少消息内容'}), 400
    
    user_message = data['message']
    
    try:
        # 调用智谱AI API
        response = client.chat.completions.create(
            model="glm-4-plus",
            messages=[
                {"role": "system", "content": "你是一个乐于解答各种问题的助手，你的任务是为用户提供专业、准确、有见地的建议。"},
                {"role": "user", "content": user_message}
            ]
        )
        
        # 提取回复内容
        ai_response = response.choices[0].message.content
        return jsonify({'response': ai_response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 创建计算工具API端点
@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': '缺少消息内容'}), 400
    
    user_message = data['message']
    
    try:
        # 构建消息历史
        messages = [
            {"role": "system", "content": "你是一个有用的AI助手，当涉及到复杂数值工试计算时，你会使用计算器工具而不是自己计算。对于代数方程、微积分等推理性问题，你应直接解答并给出计算过程。当输入的问题不是数学问题时，不可以做出解答，并直接输出“请提出数学问题”。"},
        ]
        
        # 添加当前用户问题
        messages.append({"role": "user", "content": user_message})
        
        # 调用GLM-4 API，启用工具
        response = client.chat.completions.create(
            model="glm-4-plus",
            messages=messages,
            tools=calculator_tool,
            tool_choice="auto"
        )
        
        assistant_message = response.choices[0].message
        
        # 检查是否有工具调用
        if hasattr(assistant_message, 'tool_calls') and assistant_message.tool_calls:
            # 处理工具调用
            tool_responses = handle_tool_calls(assistant_message.tool_calls)
            
            # 将工具响应添加到消息历史
            messages.extend([assistant_message.model_dump(), *tool_responses])
            
            # 再次调用API，将工具结果提供给模型
            second_response = client.chat.completions.create(
                model="glm-4-plus",
                messages=messages
            )
            
            # 更新助手消息
            assistant_message = second_response.choices[0].message
        
        return jsonify({'response': assistant_message.content})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 运行应用
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)