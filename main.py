# 0x0. 用脚本请求商用大模型 参考示例（以智谱为例，最基础版本，可以在此版本上加入输入输出处理，以及函数封装）

from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
load_dotenv()

APIKEY = os.getenv("ZHIPUAPI")

client = ZhipuAI(api_key=APIKEY) # 填写您自己的APIKey
response = client.chat.completions.create(
    model="glm-4-plus",  # 填写需要调用的模型编码
    messages=[  
        {"role": "system", "content": "你是一个乐于解答各种问题的助手，你的任务是为用户提供专业、准确、有见地的建议。"},   #给AI的指令
        {"role": "user", "content": "农夫需要把狼、羊和白菜都带过河，但每次只能带一样物品，而且狼和羊不能单独相处，羊和白菜也不能单独相处，问农夫该如何过河。"} #用户的问题
    ],
)
print(response.choices[0].message)


#0x0 To be Done
def chat(prompt, system_prompt="你是一个乐于解答各种问题的助手，你的任务是为用户提供专业、准确、有见地的建议。"):
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    response = client.chat.completions.create(
        model="glm-4-plus",
        messages=messages
    )
    return response.choices[0].message.content

# 示例调用 chat 函数
question = "地球的表面积是多少？"
result = chat(question)
print(result)


# 0x1. 0-shot示例（直接对话），请自行补全空缺内容
import os
import pandas as pd
from zhipuai import ZhipuAI

# Step 1: 加载本地C-Eval验证集数据
def load_local_ceval_dataset():
    File_Dir = "ceval-exam"
    test_df = pd.read_csv(os.path.join(File_Dir, "val", "physician_val.csv"))  
    return test_df

# Step 2: GLM-4模型调用
client_glm4 = ZhipuAI(api_key=APIKEY)  # 填写GLM-4的API密钥

def call_glm4_api(question, choices):

    prompt = f"问题：{question} 选项：{'，'.join(choices)}"

    messages = [
        {"role": "user", "content": f"问题：{question} 选项：{'，'.join(choices)}"}
    ]
    
    # response = client_glm4.chat.completions.create(
    #     model="glm-4-plus",  # 填写GLM-4的模型名称
    #     messages=messages
    # )
    
    return chat(prompt)

# Step 3: 评测逻辑
def evaluate_model_on_ceval(model_call_fn, dataset):
    correct = 0
    total = len(dataset)
    
    for index, row in dataset.iterrows():
        question = row['question']
        choices = [row['A'], row['B'], row['C'], row['D']]
        correct_answer = row['answer']
        
        # 调用模型函数
        model_reply = model_call_fn(question, choices)
        
        # 简单匹配模型回复是否包含正确答案
        if model_reply and correct_answer in model_reply: #匹配逻辑可以修改，这里是非常基础的判断
            correct += 1
        
        print(f"问题：{question}")
        print(f"模型回复：{model_reply}")
        print(f"正确答案：{correct_answer}\n")
    
    accuracy = correct / total * 100
    print(f"GLM-4 模型在C-Eval val集上的准确率为：{accuracy}%")
    return accuracy

# Step 4: 主函数 - 运行评测
if __name__ == "__main__":
    # 加载C-Eval本地验证集数据
    dataset =  load_local_ceval_dataset() # 填写加载数据集的函数名

    # print("评测 GLM-4 模型:")
    # zeroshot_accuracy = evaluate_model_on_ceval(call_glm4_api, dataset)  # 填写调用GLM-4模型的函数名



#0x1 To be Done
import random

# Step 1: 从数据集中选择5个示例作为few-shot示例
def get_few_shot_examples(dataset, num_examples=5):
    """从数据集中随机选择几个示例用于few-shot学习"""
    # 随机选择样例，避免每次选择相同的样例
    sample_indices = random.sample(range(len(dataset)), num_examples)
    examples = []
    
    for idx in sample_indices:
        row = dataset.iloc[idx]
        question = row['question']
        choices = [f"{row['A']}", f"{row['B']}", f"{row['C']}", f"{row['D']}"]
        answer = row['answer']
        
        # 构建示例格式
        example = f"问题：{question}\n选项：{choices[0]}，{choices[1]}，{choices[2]}，{choices[3]}\n答案：{answer}"
        examples.append(example)
    print(f"选取的5个示例：{examples}")
    return examples

# Step 2: 构建5-shot GLM-4模型调用函数
def call_glm4_api_5shot(question, choices, examples):
    # 构建包含示例的提示信息
    few_shot_prompt = "\n\n".join(examples)
    
    # 添加当前问题
    full_prompt = f"{few_shot_prompt}\n\n问题：{question}\n选项：{'，'.join(choices)}\n答案："
    
    # messages = [
    #     {"role": "user", "content": full_prompt}
    # ]
    
    # response = client_glm4.chat.completions.create(
    #     model="glm-4-plus",
    #     messages=messages
    # )
    
    return chat(full_prompt)

# Step 3: 评测5-shot学习效果
def evaluate_model_5shot_on_ceval(dataset):
    correct = 0
    total = len(dataset)
    
    # 获取5个few-shot示例
    examples = get_few_shot_examples(dataset, num_examples=5)
    
    for index, row in dataset.iterrows():
        question = row['question']
        choices = [row['A'], row['B'], row['C'], row['D']]
        correct_answer = row['answer']
        
        # 调用5-shot模型函数
        model_reply = call_glm4_api_5shot(question, choices, examples)
        
        # 简单匹配模型回复是否包含正确答案
        if model_reply and correct_answer in model_reply:
            correct += 1
        
        print(f"问题：{question}")
        print(f"模型回复：{model_reply}")
        print(f"正确答案：{correct_answer}\n")
    
    accuracy = correct / total * 100
    print(f"GLM-4 模型在5-shot学习下C-Eval val集上的准确率为：{accuracy}%")
    return accuracy

# Step 4: 主函数 - 运行评测并对比0-shot和5-shot结果
if __name__ == "__main__":
    # 加载C-Eval本地验证集数据
    dataset = load_local_ceval_dataset()
    
    # 限制评测数据量以加快评测速度（可选）
    limited_dataset = dataset.head(50)  # 取前50条数据进行评测
    
    print("评测 GLM-4 模型 (0-shot):")
    zeroshot_accuracy = evaluate_model_on_ceval(call_glm4_api, limited_dataset)
    
    print("\n评测 GLM-4 模型 (5-shot):")
    fiveshot_accuracy = evaluate_model_5shot_on_ceval(limited_dataset)
    
    # 结果对比
    print("\n=== 评测结果对比 ===")
    print(f"0-shot准确率: {zeroshot_accuracy:.2f}%")
    print(f"5-shot准确率: {fiveshot_accuracy:.2f}%")
    print(f"提升幅度: {fiveshot_accuracy - zeroshot_accuracy:.2f}%")


def calculate(expression: str) -> float:
    allowed_chars = "0123456789+-*/.() "
    for char in expression:
        if char not in allowed_chars:
            raise ValueError(f"不允许的字符: {char}")
    try:
        result = eval(expression)
        return result
    except Exception as e:
        raise ValueError(f"无效的表达式: {e}")
    
# 示例调用
if __name__ == "__main__":
    expression = "3 + 5 * (2 - 8)"
    try:
        result = calculate(expression)
        print(f"表达式 '{expression}' 的计算结果是: {result}")
    except ValueError as e:
        print(e)


from flask import Flask, request, jsonify
import logging
import threading

# 初始化 Flask 应用
app = Flask(__name__)

# 配置日志级别
logging.basicConfig(level=logging.INFO)

# 计算器函数
def calculate(expression):
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        raise ValueError(f"计算错误: {e}")

@app.route('/calculate', methods=['POST'])
def calculate_route():
    data = request.get_json()
    if not data or 'expression' not in data:
        logging.warning("缺少表达式")
        return jsonify({'error': '缺少表达式'}), 400

    expression = data['expression']
    logging.info(f"Received expression: {expression}")
    try:
        result = calculate(expression)
        logging.info(f"Calculated result: {result}")
        return jsonify({'result': result})
    except ValueError as ve:
        logging.error(f"Calculation error: {ve}")
        return jsonify({'error': str(ve)}), 400

# 启动 Flask 应用的函数
def run_flask_app():
    app.run(host='0.0.0.0', port=8641)

# 在后台线程中启动 Flask 应用
flask_thread = threading.Thread(target=run_flask_app, daemon=True)
flask_thread.start()

print("Flask 应用已在后台线程中启动，监听端口 8641。")


import requests

# 定义要发送的数学表达式
expression = "1999*2048"

# 发送 POST 请求到 Flask 应用
response = requests.post(
    "http://localhost:8641/calculate",
    json={"expression": expression}
)

# 打印响应结果
print(response.json())


{   
     "name": "calculator",   
     "description": "一个简单的计算器，支持加、减、乘、除运算。",   
     "parameters": {   
         "type": "object",   
         "properties": {   
             "expression": {   
                 "type": "string",   
                 "description": "要计算的数学表达式，例如 '2 + 3 * 4'"   
             }   
         },   
         "required": ["expression"]   
     },   
     "api": {   
         "endpoint": "http://localhost:8641/calculate",   
         "method": "POST",   
         "headers": {   
            "Content-Type": "application/json"   
         },   
        "body": {   
            "expression": "{expression}"   
         },   
         "response": {   
             "result": "计算结果",   
             "error": "错误信息"   
         }   
    }   
 } 


import requests

class ToolCaller:
    def __init__(self):
        self.tools = {
            "calculator": {
                "description": "一个简单的计算器，支持加、减、乘、除运算。",
                "api": {
                    "endpoint": "http://localhost:8641/calculate",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }
            }
        }

    def call_calculator(self, expression: str):
        tool = self.tools["calculator"]
        payload = {
            "expression": expression
        }
        try:
            response = requests.post(
                tool["api"]["endpoint"],
                json=payload,
                headers=tool["api"]["headers"]
            )
            if response.status_code == 200:
                return {"result": response.json().get("result")}
            else:
                return {"error": response.json().get("error", "未知错误")}
        except Exception as e:
            return {"error": str(e)}


if __name__ == "__main__":
    caller = ToolCaller()
    expression = "129032910921 * 188231"
    result = caller.call_calculator(expression)
    print(result)




####0x2 To be Done
# 引入必要的库
from zhipuai import ZhipuAI
import requests
import json
import re
import os
from dotenv import load_dotenv
import threading
from flask import Flask, request, jsonify
import logging

# 加载环境变量
load_dotenv()
APIKEY = os.getenv("ZHIPUAPI")

# 定义计算器工具
calculator_tool = [
    {
        "type": "function",  # 添加工具类型字段
        "function": {  # 使用function对象包装工具信息
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
# 初始化 Flask 应用
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# 计算器函数
def calculate(expression):
    allowed_chars = "0123456789+-*/.() "
    for char in expression:
        if char not in allowed_chars:
            raise ValueError(f"不允许的字符: {char}")
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        raise ValueError(f"计算错误: {e}")

@app.route('/calculate', methods=['POST'])
def calculate_route():
    data = request.get_json()
    if not data or 'expression' not in data:
        logging.warning("缺少表达式")
        return jsonify({'error': '缺少表达式'}), 400

    expression = data['expression']
    logging.info(f"收到表达式: {expression}")
    try:
        result = calculate(expression)
        logging.info(f"计算结果: {result}")
        return jsonify({'result': result})
    except ValueError as ve:
        logging.error(f"计算错误: {ve}")
        return jsonify({'error': str(ve)}), 400

# 在后台线程中启动 Flask 应用
def run_flask_app():
    app.run(host='0.0.0.0', port=8641)

# 创建智谱AI客户端
client = ZhipuAI(api_key=APIKEY)

# 提取数学表达式的函数
def extract_math_expression(text):
    """从文本中提取数学表达式"""
    # 使用正则表达式查找可能的数学表达式
    expressions = re.findall(r'[\d\s\+\-\*\/\(\)\.\,]+', text)
    if expressions:
        # 清理提取的表达式
        cleaned_expr = expressions[0].strip().replace(',', '')
        return cleaned_expr
    return None

# 调用本地计算器API的函数
def call_calculator_api(expression):
    """调用本地计算器API"""
    try:
        response = requests.post(
            "http://localhost:8641/calculate",
            json={"expression": expression},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            return response.json().get("result")
        else:
            return f"计算出错: {response.json().get('error', '未知错误')}"
    except Exception as e:
        return f"API调用失败: {str(e)}"

# 处理工具调用的函数
def handle_tool_calls(tool_calls):
    """处理模型返回的工具调用请求"""
    responses = []
    
    for tool_call in tool_calls:
        if tool_call.function.name == "calculator":  # 已经正确
            # 解析参数
            args = json.loads(tool_call.function.arguments)
            expression = args.get("expression", "")
            
            # 调用计算器API
            result = call_calculator_api(expression)
            
            # 构造响应
            responses.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": "calculator",
                "content": str(result)
            })
    
    return responses

# 集成的聊天功能 - 包含工具调用
def chat_with_tools(prompt, history=None):
    """使用工具增强的GLM-4聊天功能"""
    if history is None:
        history = []
    
    # 构建消息历史
    messages = [
        {"role": "system", "content": "你是一个有用的AI助手，当涉及到复杂数学计算时，你会使用计算器工具而不是自己计算。"}
    ]
    
    # 添加历史消息
    for msg in history:
        messages.append(msg)
    
    # 添加当前用户问题
    messages.append({"role": "user", "content": prompt})
    
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
    
    # 更新历史
    history.append({"role": "user", "content": prompt})
    history.append({"role": "assistant", "content": assistant_message.content})
    
    return assistant_message.content, history

# 基础聊天功能 - 不使用工具
def chat_without_tools(prompt, history=None):
    """基础的GLM-4聊天功能，没有工具增强"""
    if history is None:
        history = []
    
    # 构建消息历史
    messages = [
        {"role": "system", "content": "你是一个有用的AI助手。"}
    ]
    
    # 添加历史消息
    for msg in history:
        messages.append(msg)
    
    # 添加当前用户问题
    messages.append({"role": "user", "content": prompt})
    
    # 调用GLM-4 API，不启用工具
    response = client.chat.completions.create(
        model="glm-4-plus",
        messages=messages
    )
    
    assistant_message = response.choices[0].message
    
    # 更新历史
    history.append({"role": "user", "content": prompt})
    history.append({"role": "assistant", "content": assistant_message.content})
    
    return assistant_message.content, history

# 启动Flask应用
def start_calculator_service():
    """启动计算器服务"""
    # 在后台线程中启动 Flask 应用
    flask_thread = threading.Thread(target=run_flask_app, daemon=True)
    flask_thread.start()
    print("计算器服务已在后台启动，监听端口 8641")

# 比较工具增强前后的性能
def compare_with_without_tools():
    """比较有无工具增强的性能差异"""
    test_cases = [
        "1+2等于多少?",
        "计算17*19",
        "129032910921*188231等于多少?",
        "计算(3.14159 * 2.71828) / (1.41421 - 0.57721)",
        "我想知道15782489*98765和34567*789的和是多少"
    ]
    
    print("=== 测试工具增强前后的性能差异 ===")
    
    for i, test in enumerate(test_cases):
        print(f"\n测试 {i+1}: {test}")
        
        # 不使用工具的回答
        print("\n不使用工具的回答:")
        no_tool_response, _ = chat_without_tools(test)
        print(no_tool_response)
        
        # 使用工具的回答
        print("\n使用工具的回答:")
        with_tool_response, _ = chat_with_tools(test)
        print(with_tool_response)
        
        print("-" * 80)

# 主函数
def main():
    # 启动计算器服务
    start_calculator_service()
    
    # 等待服务启动
    import time
    import keyboard
    time.sleep(2)
    
    # 进行性能比较
    compare_with_without_tools()
    
    # # 交互式聊天
    # print("\n=== 进入交互式聊天模式 (输入 'exit' 退出) ===")
    # history = []
    
    # while True:
    #     user_input = input("\n你: ")
    #     if user_input.lower() == 'exit':
    #         break
        
    #     response, history = chat_with_tools(user_input, history)
    #     print("\nAI: " + response)
    #     # 添加ESC键监听功能
    # try:
    #     print("按ESC键随时退出对话")
        
    #     # 创建一个事件标志
    #     exit_event = threading.Event()
        
    #     # 定义监听函数
    #     def check_esc_key():
    #         while not exit_event.is_set():
    #             if keyboard.is_pressed('esc'):
    #                 print("\n检测到ESC键，退出对话...")
    #                 exit_event.set()
    #             time.sleep(0.1)  # 减少CPU使用率
        
    #     # 启动监听线程
    #     esc_thread = threading.Thread(target=check_esc_key, daemon=True)
    #     esc_thread.start()
    # except ImportError:
    #     print("提示: 安装keyboard库(pip install keyboard)可启用按ESC退出功能")
    #     exit_event = threading.Event()
        
    # print("\n=== 进入交互式聊天模式 (输入 'exit' 退出或按ESC键退出) ===")
    # history = []
    
    # while not exit_event.is_set():
    #     try:
    #         user_input = input("\n你: ")
    #         if user_input.lower() == 'exit' or exit_event.is_set():
    #             break
            
    #         response, history = chat_with_tools(user_input, history)
    #         print("\nAI: " + response)
    #     except KeyboardInterrupt:
    #         print("\n检测到中断，退出对话...")
    #         break

if __name__ == "__main__":
    main()



