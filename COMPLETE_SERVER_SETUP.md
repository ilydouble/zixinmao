# 完整的后端服务器部署指南

## 📋 部署步骤总览

```
第 1 步: 安装系统依赖
    ↓
第 2 步: 安装 Python 依赖
    ↓
第 3 步: 安装 Playwright 浏览器引擎
    ↓
第 4 步: 运行测试
    ↓
第 5 步: 重启服务
```

## 🚀 详细部署步骤

### 第 1 步：安装系统依赖

在后端服务器上运行以下命令：

```bash
# 方法 1: 使用 Playwright 自动安装（推荐）
python -m playwright install-deps

# 方法 2: 手动安装（如果方法 1 失败）
sudo apt-get update
sudo apt-get install -y \
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
    libasound2t64 \
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
```

**预期输出**：
```
Reading package lists... Done
Setting up libatk1.0-0t64 (2.x.x) ...
...
Processing triggers for libc-bin (2.x.x) ...
```

### 第 2 步：安装 Python 依赖

```bash
# 进入后端目录
cd ai-analysis-service

# 激活 Conda 环境
conda activate zixinmao

# 安装 Python 依赖
pip install -r requirements.txt
```

**预期输出**：
```
Collecting fastapi==0.104.1
...
Successfully installed fastapi-0.104.1 playwright-1.55.0 ...
```

### 第 3 步：安装 Playwright 浏览器引擎

```bash
# 确保在后端目录中
cd ai-analysis-service

# 确保激活了 Conda 环境
conda activate zixinmao

# 安装 Chromium 浏览器引擎
python -m playwright install chromium
```

**预期输出**：
```
Downloading Chromium 1187 (linux)...
...
Chromium 1187 downloaded to /root/.cache/ms-playwright/chromium_headless_shell-1187
```

### 第 4 步：运行测试

```bash
# 运行 PDF 转换测试
python test_pdf_fix.py
```

**预期输出**：
```
==================================================
PDF 转换功能测试（异步版本）
==================================================

🚀 开始测试 PDF 转换...
--------------------------------------------------

✅ 测试成功！
--------------------------------------------------
PDF 大小: 123,456 字节
PDF 文件头: b'%PDF'
✅ PDF 文件头正确
✅ PDF 已保存到: ai-analysis-service/test_output.pdf

==================================================
✅ 所有测试通过！
==================================================
```

### 第 5 步：重启后端服务

```bash
# 方法 1: 使用 systemctl（如果已配置）
sudo systemctl restart ai-analysis-service

# 方法 2: 使用 supervisorctl（如果使用 supervisor）
supervisorctl restart ai-analysis-service

# 方法 3: 手动启动
python run.py
```

## 📝 完整的部署命令序列

复制以下命令，在服务器上一次性运行：

```bash
#!/bin/bash

# 1. 安装系统依赖
echo "安装系统依赖..."
python -m playwright install-deps

# 2. 进入后端目录
cd ai-analysis-service

# 3. 激活 Conda 环境
conda activate zixinmao

# 4. 安装 Python 依赖
echo "安装 Python 依赖..."
pip install -r requirements.txt

# 5. 安装 Playwright 浏览器引擎
echo "安装 Playwright 浏览器引擎..."
python -m playwright install chromium

# 6. 运行测试
echo "运行测试..."
python test_pdf_fix.py

# 7. 显示完成信息
echo "✅ 部署完成！"
```

## 🔍 故障排查

### 问题 1：系统依赖安装失败

**症状**：
```
E: Unable to locate package libatk1.0-0t64
```

**解决方案**：
```bash
# 更新包列表
sudo apt-get update

# 尝试安装不带版本号的包
sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 ...
```

### 问题 2：Playwright 安装失败

**症状**：
```
Error: Chromium download failed
```

**解决方案**：
```bash
# 清除缓存
rm -rf ~/.cache/ms-playwright/

# 重新安装
python -m playwright install chromium
```

### 问题 3：权限不足

**症状**：
```
Permission denied
```

**解决方案**：
```bash
# 使用 sudo
sudo python -m playwright install chromium

# 或者修改权限
chmod -R 755 ~/.cache/ms-playwright/
```

### 问题 4：磁盘空间不足

**症状**：
```
No space left on device
```

**解决方案**：
```bash
# 检查磁盘空间
df -h

# 清理旧文件
rm -rf ~/.cache/ms-playwright/

# 扩展磁盘（根据云服务商文档）
```

## ✅ 验证部署

### 验证系统依赖

```bash
# 检查是否安装了必要的库
ldd /root/miniconda3/envs/zixinmao/lib/python3.12/site-packages/playwright/driver/package/lib/server/chromium/chrome-linux/headless_shell | grep "not found"
```

如果没有输出，说明所有依赖都已安装。

### 验证 Playwright

```bash
python -c "import playwright; print(f'Playwright 版本: {playwright.__version__}')"
```

**预期输出**：
```
Playwright 版本: 1.55.0
```

### 验证 Chromium

```bash
ls -la ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell
```

**预期输出**：
```
-rwxr-xr-x 1 root root 123456789 Nov 10 15:00 /root/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell
```

### 运行完整测试

```bash
python test_pdf_fix.py
```

## 📊 部署检查清单

- [ ] 已连接到后端服务器
- [ ] 已运行 `python -m playwright install-deps`
- [ ] 已进入后端目录
- [ ] 已激活 Conda 环境
- [ ] 已运行 `pip install -r requirements.txt`
- [ ] 已运行 `python -m playwright install chromium`
- [ ] 已运行 `python test_pdf_fix.py` 并通过
- [ ] 已重启后端服务
- [ ] 已测试 API 接口

## 🔗 相关文件

- `ai-analysis-service/install_playwright_deps.sh` - 自动化安装脚本
- `ai-analysis-service/test_pdf_fix.py` - 测试脚本
- `ai-analysis-service/requirements.txt` - Python 依赖列表

## 💡 提示

### 快速部署

如果你想快速部署，可以使用以下命令：

```bash
cd ai-analysis-service && \
conda activate zixinmao && \
python -m playwright install-deps && \
pip install -r requirements.txt && \
python -m playwright install chromium && \
python test_pdf_fix.py
```

### 后台运行

如果想在后台运行服务，使用 `nohup`：

```bash
nohup python run.py > app.log 2>&1 &
```

### 监控日志

```bash
# 实时查看日志
tail -f app.log

# 查看最后 100 行
tail -100 app.log
```

## 🆘 获取帮助

如遇到问题，请：

1. 查看日志文件
2. 运行诊断命令
3. 检查系统依赖
4. 查看相关文档
5. 联系技术支持

---

**重要**: 所有步骤都需要在后端服务器上运行！

