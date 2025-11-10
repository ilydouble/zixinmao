#!/bin/bash

# Playwright 依赖安装脚本
# 在后端服务器上运行此脚本以安装 Playwright 所需的系统依赖

set -e

echo "=========================================="
echo "Playwright 系统依赖安装脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    print_error "此脚本需要 root 权限"
    echo "请使用 sudo 运行: sudo bash install_playwright_deps.sh"
    exit 1
fi

print_success "已获得 root 权限"
echo ""

# 步骤 1: 更新包管理器
echo "步骤 1: 更新包管理器..."
apt-get update
print_success "包管理器已更新"
echo ""

# 步骤 2: 安装 Playwright 依赖
echo "步骤 2: 安装 Playwright 依赖..."
print_warning "这可能需要几分钟，请耐心等待..."

apt-get install -y \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libcups2t64 \
    libatspi2.0-0t64 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libcairo2 \
    libpango-1.0-0 \
    libasound2t64

print_success "Playwright 依赖已安装"
echo ""

# 步骤 3: 安装其他可能需要的依赖
echo "步骤 3: 安装其他依赖..."
apt-get install -y \
    libglib2.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libxkbcommon0 \
    fonts-liberation \
    xdg-utils \
    wget

print_success "其他依赖已安装"
echo ""

# 步骤 4: 验证安装
echo "步骤 4: 验证安装..."
if command -v apt-get &> /dev/null; then
    print_success "apt-get 可用"
else
    print_error "apt-get 不可用"
    exit 1
fi
echo ""

echo "=========================================="
print_success "系统依赖安装完成！"
echo "=========================================="
echo ""
echo "后续步骤："
echo "1. 激活 Conda 环境: conda activate zixinmao"
echo "2. 进入后端目录: cd ai-analysis-service"
echo "3. 安装 Playwright: python -m playwright install chromium"
echo "4. 运行测试: python test_pdf_fix.py"
echo ""

