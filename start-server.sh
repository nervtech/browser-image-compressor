#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 进入dist目录
cd "$SCRIPT_DIR/dist"

# 检查Python3是否可用
if command -v python3 &> /dev/null; then
    echo "启动HTTP服务器，使用Python3..."
    echo "请在浏览器中打开: http://localhost:8080"
    python3 -m http.server 8080
# 检查Python2是否可用
elif command -v python &> /dev/null; then
    echo "启动HTTP服务器，使用Python..."
    echo "请在浏览器中打开: http://localhost:8080"
    python -m SimpleHTTPServer 8080
# 检查Node.js是否可用
elif command -v npx &> /dev/null; then
    echo "启动HTTP服务器，使用npx serve..."
    echo "请在浏览器中打开: http://localhost:8080"
    npx serve -l 8080
# 检查PHP是否可用
elif command -v php &> /dev/null; then
    echo "启动HTTP服务器，使用PHP..."
    echo "请在浏览器中打开: http://localhost:8080"
    php -S localhost:8080
else
    echo "错误: 没有找到可用的HTTP服务器工具"
    echo "请安装Python3、Node.js或PHP"
    exit 1
fi