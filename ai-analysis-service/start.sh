#!/bin/bash

# AI文档分析服务启动脚本

echo "🚀 启动AI文档分析服务..."

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，复制示例文件..."
    cp .env.example .env
    echo "📝 请编辑.env文件配置API密钥后重新运行"
    exit 1
fi

# 安装依赖
echo "📥 安装依赖..."
pip install -r requirements.txt

# 启动服务
echo "🎯 启动服务..."
python run.py
