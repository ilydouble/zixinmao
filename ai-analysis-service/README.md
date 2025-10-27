# AI文档分析服务

专业的AI文档分析服务，支持银行流水和征信报告的智能分析，返回结构化的JSON结果。

## 功能特性

- 🤖 **智能分析**: 基于大语言模型的专业文档分析
- 📊 **结构化输出**: 返回标准化的JSON格式分析结果
- 🏦 **多类型支持**: 支持银行流水、简版征信、详版征信报告
- 🚀 **高性能**: 异步处理，支持并发请求
- 📋 **请求队列**: 内置请求队列，避免服务过载，支持高并发访问
- 📈 **任务监控**: 实时任务状态查询，支持任务取消
- 📝 **算法日志**: 完整的算法调用日志和统计分析
- 🔒 **安全可靠**: 完善的错误处理和重试机制
- 📝 **自定义提示词**: 支持自定义分析提示词

## 项目结构

```
ai-analysis-service/
├── app/                    # 核心应用代码
│   ├── main.py            # FastAPI主应用
│   ├── service/           # 业务服务层
│   ├── models/            # 数据模型
│   ├── utils/             # 工具函数
│   ├── config/            # 配置管理
│   └── templates/         # HTML模板
├── logs/                  # 算法调用日志目录
├── test/                  # 测试文件目录
├── docs/                  # 文档目录
├── run.py                # 服务启动脚本
├── requirements.txt      # 依赖列表
├── .env.example         # 环境变量模板
└── README.md            # 使用文档
```

## 快速开始

### 1. 安装依赖
```bash
cd ai-analysis-service
pip install -r requirements.txt
```

### 2. 配置API密钥
```bash
cp .env.example .env
# 编辑 .env 文件，设置你的 AI_API_KEY
```

### 3. 启动服务
```bash
python run.py
```

服务启动后可访问：
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

## API接口

### 1. 健康检查

```http
GET /health
```

响应示例：
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T12:00:00",
  "services": {
    "ai_api": {
      "ai_api_status": "healthy"
    },
    "request_queue": {
      "status": "running",
      "current_queue_size": 2,
      "current_processing": 1,
      "total_processed": 156
    }
  }
}
```

### 2. 提交分析任务（推荐）

```http
POST /analyze
```

请求参数：
```json
{
  "file_base64": "JVBERi0xLjQK...",
  "mime_type": "application/pdf",
  "report_type": "simple",
  "custom_prompt": "可选的自定义提示词"
}
```

响应示例：
```json
{
  "success": true,
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "任务已成功提交到处理队列",
  "estimated_wait_time": 60.0,
  "queue_position": 2
}
```

### 3. 查询任务状态

```http
GET /task/{task_id}
```

响应示例：
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "created_at": 1703123456.789,
  "started_at": 1703123466.789,
  "completed_at": 1703123486.789,
  "processing_time": 20.0,
  "wait_time": 10.0,
  "result": {
    "success": true,
    "analysis_result": { ... },
    "processing_time": 18.5
  },
  "retry_count": 0
}
```

任务状态说明：
- `pending`: 等待处理
- `processing`: 正在处理
- `completed`: 处理完成
- `failed`: 处理失败
- `cancelled`: 已取消

### 4. 取消任务

```http
DELETE /task/{task_id}
```

### 5. 同步分析（直接处理）

```http
POST /analyze/sync
```

用于紧急或小文件的即时处理，不使用队列。

### 6. 队列统计

```http
GET /queue/stats
```

响应示例：
```json
{
  "total_requests": 1250,
  "completed_requests": 1180,
  "failed_requests": 45,
  "current_queue_size": 3,
  "current_processing": 2,
  "queue_capacity": 100,
  "max_concurrent": 3,
  "is_running": true
}
```

### 7. 算法调用统计

```http
GET /logs/stats?hours=24
```

响应示例：
```json
{
  "time_range_hours": 24,
  "total_requests": 156,
  "completed_requests": 142,
  "failed_requests": 14,
  "success_rate": 0.91,
  "average_processing_time_seconds": 18.5,
  "report_types_distribution": {
    "simple": 89,
    "detail": 53,
    "flow": 14
  }
}
```

### 8. 获取提示词模板

```http
GET /prompts/{report_type}
```

支持的报告类型：
- `flow`: 银行流水分析
- `simple`: 简版征信分析
- `detail`: 详版征信分析

## 测试

### API测试

使用 FastAPI 自动生成的交互式文档进行测试：

```bash
# 1. 启动服务
python run.py

# 2. 访问 API 文档
# 浏览器打开: http://localhost:8000/docs
```

在 Swagger UI 中可以直接测试所有接口

### 队列功能使用

#### 提交任务
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "file_base64": "JVBERi0xLjQK...",
    "mime_type": "application/pdf",
    "report_type": "simple"
  }'
```

#### 查询任务状态
```bash
curl "http://localhost:8000/task/{task_id}"
```

#### 查看队列统计
```bash
curl "http://localhost:8000/queue/stats"
```

#### 查看算法调用统计
```bash
curl "http://localhost:8000/logs/stats?hours=24"
```

## 部署

### Docker部署

创建 `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "run.py"]
```

构建和运行：
```bash
docker build -t ai-analysis-service .
docker run -p 8000:8000 --env-file .env ai-analysis-service
```

### 生产环境配置

1. 设置环境变量 `DEBUG=False`
2. 配置反向代理 (Nginx)
3. 使用进程管理器 (PM2, Supervisor)
4. 配置日志轮转
5. 设置监控和告警

## 集成到云函数

修改云函数中的 `analyzeWithAI` 函数：

```javascript
// 配置AI分析服务地址
const AI_ANALYSIS_SERVICE = {
  url: process.env.AI_ANALYSIS_SERVICE_URL || 'http://localhost:8000',
  timeout: 300000
}

// 调用AI分析服务
async function analyzeWithAI(fileBuffer, reportType, reportId) {
  const requestData = {
    file_base64: fileBuffer.toString('base64'),
    mime_type: "application/pdf",
    report_type: reportType,
    custom_prompt: null
  }
  
  const response = await axios.post(
    `${AI_ANALYSIS_SERVICE.url}/analyze`,
    requestData,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: AI_ANALYSIS_SERVICE.timeout
    }
  )
  
  if (response.status === 200 && response.data.success) {
    return response.data.analysis_result
  } else {
    throw new Error(response.data.error_message || 'AI分析失败')
  }
}
```

## 故障排除

### 常见问题

1. **服务启动失败**
   - 检查端口是否被占用
   - 确认Python版本和依赖是否正确安装

2. **AI API调用失败**
   - 检查API密钥是否正确
   - 确认网络连接正常
   - 查看日志中的详细错误信息

3. **文件分析失败**
   - 确认文件格式是否支持
   - 检查文件大小是否超过限制
   - 验证base64编码是否正确

### 日志查看

服务日志会输出到控制台，包含：
- 请求处理信息
- AI API调用详情
- 错误和异常信息

## 许可证

MIT License
