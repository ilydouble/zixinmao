# AI分析服务 API 接口文档

## 基本信息
- 服务地址：`http://127.0.0.1:8000`
- 内容类型：`application/json`
- 字符编码：`UTF-8`

---

## 1. 征信报告分析接口

### POST `/analysis/report`

**功能描述**：生成个人征信报告分析

**请求参数**：
```json
{
  "file_base64": "string",       // 必填，文件的base64编码
  "mime_type": "string",         // 必填，文件MIME类型
  "report_type": "string",       // 必填，报告类型：flow(银行流水)/simple(简版征信)/detail(详版征信)
  "custom_prompt": "string",     // 可选，自定义提示词
  "name": "string",              // 必填，姓名
  "id_card": "string",           // 必填，身份证号
  "mobile_no": "string",         // 必填，手机号码
  "customer_info": {             // 可选，客户群体信息
    "customerType": "string",    // 客户群体类型：授薪类客群/自雇类客群
    "includeProductMatch": "boolean", // 是否包含产品匹配
    "companyNature": "string",   // 单位性质（授薪类）
    "hasProvidentFund": "string", // 是否缴纳公积金（授薪类）
    "providentFundBase": "string", // 公积金基数（授薪类）
    "selfEmploymentType": "string", // 自雇经营类型（自雇类）
    "companyName": "string",     // 公司名称（自雇类）
    "cashFlow": "string"         // 流水（自雇类，包含产品匹配时）
  }
}
```

**支持的文件类型**：
- `application/pdf` - PDF文档
- `image/jpeg` - JPEG图片
- `image/png` - PNG图片

**报告类型说明**：
- `flow` - 银行流水分析
- `simple` - 简版征信报告分析  
- `detail` - 详版征信报告分析

**请求示例**：
```bash
curl -X POST "http://127.0.0.1:8000/analysis/report" \
  -H "Content-Type: application/json" \
  -d '{
    "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
    "mime_type": "application/pdf",
    "report_type": "simple",
    "custom_prompt": "请分析这份征信报告",
    "name": "张三",
    "id_card": "110101199001011234",
    "mobile_no": "13812345678",
    "customer_info": {
      "customerType": "授薪类客群",
      "includeProductMatch": false,
      "companyNature": "大型上市公司及大型民企",
      "hasProvidentFund": "是",
      "providentFundBase": "5000"
    }
  }'
```

**响应格式**：
```json
{
    "code": 200,
    "message": "个人征信报告生成成功",
    "data": "# 个人征信综合分析报告\n---\n\n## 第一部分：个人征信报告\n\n### 一、基本信息\n\n| 项目     | 内容               |\n| -------- | -----------------",
    "timestamp": "2025-09-06T10:10:36.694866"
}
```

**错误响应**：
```json
{
    "code": 400,
    "message": "个人征信报告生成失败",
    "data": None,
    "timestamp": "2025-09-06T10:10:36.694866"
}
```

---

## 2. 收入信息提取接口

### POST `/income`

**功能描述**：从社保、公积金、个税文档中提取关键收入信息

**请求参数**：
```json
{
  "file_base64": "string",    // 必填，文件的base64编码
  "mime_type": "string",      // 必填，文件MIME类型
  "file_type": "string"       // 必填，文件类型：social(社保)/fund(公积金)/income(个税)
}
```

**文件类型说明**：
- `social` - 社保缴费记录，提取缴费基数、单位名称、参保状态等
- `fund` - 公积金缴费记录，提取缴存基数、中心名称、单位名称等
- `income` - 个人所得税记录，提取收入合计、扣缴义务人、时间等

**请求示例**：
```bash
curl -X POST "http://127.0.0.1:8000/income" \
  -H "Content-Type: application/json" \
  -d '{
    "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
    "mime_type": "application/pdf",
    "file_type": "fund"
  }'
```

**响应格式**：

### 社保信息 (`file_type: "social"`)
```json
{
  "success": true,
  "request_id": "req_1234567890",
  "analysis_result": {
    "缴费基数": "5000",
    "单位名称": "西安市某公司",
    "参保状态": "正常",
    "经办机构名称": "西安市社会保险经办中心",
    "认定月收入": "5000",
    "省份": "陕西"
  },
  "processing_time": 3.2
}
```

### 公积金信息 (`file_type: "fund"`)
```json
{
  "success": true,
  "request_id": "req_1234567891", 
  "analysis_result": {
    "中心名称": "西安市住房公积金管理中心",
    "单位名称": "西安市某公司",
    "个人缴存基数": "4800",
    "认定月收入": "4800",
    "省份": "陕西"
  },
  "processing_time": 2.8
}
```

### 个税信息 (`file_type: "income"`)
```json
{
  "success": true,
  "request_id": "req_1234567892",
  "analysis_result": {
    "收入合计": "120000",
    "扣缴义务人": "西安市某公司",
    "时间": "2024-01 至 2024-12",
    "认定月收入": "10000",
    "省份": "陕西"
  },
  "processing_time": 3.5
}
```

**错误响应**：
```json
{
  "success": false,
  "request_id": "req_1234567893",
  "error_message": "文件解析失败：无法识别文档内容",
  "processing_time": 1.2
}
```


## 使用说明

### 1. 文件准备
- 支持PDF、JPG、PNG格式
- 文件大小不超过50MB
- 需要将文件转换为base64编码

### 2. Base64编码示例 (Python)
```python
import base64

# 读取文件并编码
with open("document.pdf", "rb") as f:
    file_content = f.read()
    file_base64 = base64.b64encode(file_content).decode('utf-8')
```

### 3. 响应时间
- 征信报告分析：通常10-30秒
- 收入信息提取：通常2-10秒
- 实际时间取决于文档复杂度和服务负载

### 4. 最佳实践
- 建议使用清晰的PDF文档以获得最佳识别效果
- 对于图片文件，建议分辨率不低于300DPI
- 合理设置HTTP超时时间（建议60秒以上）
- 生产环境建议启用HTTPS



