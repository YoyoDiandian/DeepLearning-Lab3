expression = "2 + 3 * (4 - 5) / 6 ^ 2 + e"
allowed_chars = "0123456789+-*/.()^e "
for char in expression:
    if char not in allowed_chars:
        raise ValueError(f"不允许的字符: {char}")
    elif char == "e":
        expression = expression.replace("e", "2.718281828459045")
    elif char == "^":
        expression = expression.replace("^", "**")
    

result = eval(expression)
print(result)