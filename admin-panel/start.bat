@echo off
chcp 65001 >nul

echo 🚀 启动资信猫管理系统
echo ========================

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装 Node.js 16+
    pause
    exit /b 1
)

echo ✅ Node.js 版本：
node -v

REM 检查环境变量文件
if not exist ".env" (
    echo 📝 创建环境变量文件...
    copy .env.example .env >nul
    echo ✅ 已创建 .env 文件，请根据需要修改配置
)

REM 安装依赖
echo 📦 安装依赖...
if not exist "node_modules" (
    npm install
)

if not exist "client\node_modules" (
    cd client
    npm install
    cd ..
)

echo ✅ 依赖安装完成

REM 启动服务
echo 🚀 启动开发服务器...
echo.
echo 前端地址：http://localhost:3000
echo 后端地址：http://localhost:3001
echo 健康检查：http://localhost:3001/api/health
echo.
echo 默认账户：
echo 用户名：root
echo 密码：admin123456
echo.
echo 如果遇到问题，可以使用测试模式：
echo npm run dev:test
echo.
echo 按 Ctrl+C 停止服务
echo ========================

REM 尝试启动完整服务，如果失败则启动测试服务
npm run dev
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  完整服务启动失败，启动测试模式...
    echo.
    npm run dev:test
)
