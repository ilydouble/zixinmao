#!/bin/bash

echo "🚀 启动资信猫管理系统"
echo "========================"

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 16+，当前版本：$(node -v)"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 安装依赖
echo "📦 安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    cd client && npm install && cd ..
fi

echo "✅ 依赖安装完成"

# 启动服务
echo "🚀 启动开发服务器..."
echo ""
echo "前端地址：http://localhost:3000"
echo "后端地址：http://localhost:3001"
echo "健康检查：http://localhost:3001/api/health"
echo ""
echo "默认账户："
echo "用户名：root"
echo "密码：admin123456"
echo ""
echo "如果遇到问题，可以使用测试模式："
echo "npm run dev:test"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================"

# 尝试启动完整服务，如果失败则启动测试服务
npm run dev || {
    echo ""
    echo "⚠️  完整服务启动失败，启动测试模式..."
    echo ""
    npm run dev:test
}
