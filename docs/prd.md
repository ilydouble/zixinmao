
# 资信猫小程序产品需求文档

## 1. 产品概述

### 1.1 产品名称
资信猫

### 1.2 产品定位
基于微信小程序的金融科技服务平台，为个人用户和金融机构提供征信分析、银行流水分析等专业金融数据分析服务。

### 1.3 目标用户
- **C端用户**：需要了解个人征信状况的用户、贷款申请人员
- **B端用户**：金融机构客户经理、风控人员、信贷审批人员
- **机构用户**：银行、小贷公司、担保公司等金融机构

## 2. 功能架构

### 2.1 用户认证流程
1. **微信授权登录**
   - 获取用户微信基本信息（头像、昵称）
   - 生成用户唯一标识
   - 支持静默授权和主动授权两种模式
   
2. **组织机构选择**
   - 用户选择所属组织机构
   - 支持机构码快速加入
   - 个人用户可选择"个人用户"选项
   - 机构管理员可邀请用户加入

### 2.2 主页功能模块

#### 2.2.1 流水宝
**功能描述：** 银行流水智能分析工具

**适用场景：**
- 个人贷款申请前的流水自查
- 金融机构客户流水预审
- 收入证明补充材料

**核心功能：**
- 支持上传银行流水文件（PDF/图片格式）
- OCR智能识别流水数据
- 多银行格式自适应解析
- 生成专业流水分析报告

**分析报告结构：**
```
银行流水分析报告
├── 账户基础信息
│   ├── 银行名称与账户类型
│   ├── 分析时间段（起止日期）
│   ├── 交易笔数统计
│   └── 账户状态评估
├── 收支流水分析
│   ├── 总收入金额与构成
│   ├── 总支出金额与分类
│   ├── 月均收入趋势
│   ├── 月均支出趋势
│   ├── 收支比例分析
│   └── 现金流量表
├── 交易行为特征
│   ├── 交易频次分布
│   ├── 交易时间规律
│   ├── 大额交易统计（>5万）
│   ├── 异常交易识别
│   ├── 转账对手方分析
│   └── 消费习惯画像
├── 资金稳定性评估
│   ├── 账户余额波动
│   ├── 最低余额统计
│   ├── 资金停留时间
│   ├── 流水连续性
│   ├── 收入稳定性评分
│   └── 还款能力评估
├── 风险识别预警
│   ├── 异常交易提醒
│   ├── 资金链风险
│   ├── 刷流水嫌疑
│   ├── 网贷平台交易
│   └── 其他风险提示
└── 专业建议
    ├── 流水优化建议
    ├── 贷款申请建议
    └── 注意事项说明
```

#### 2.2.2 简信宝
**功能描述：** 简版征信报告分析工具

**适用场景：**
- 快速征信状况了解
- 贷款前征信自查
- 信用卡申请参考

**核心功能：**
- 上传个人简版征信报告（PDF格式）
- 智能解读征信关键信息
- 生成易懂的分析报告

**分析报告结构：**
```
简版征信分析报告
├── 个人基本信息
│   ├── 身份信息确认
│   ├── 联系方式变更记录
│   └── 征信查询记录统计
├── 信贷账户概况
│   ├── 信贷账户总数
│   ├── 信用卡账户情况
│   │   ├── 信用卡张数
│   │   ├── 总授信额度
│   │   ├── 已用额度
│   │   └── 使用率分析
│   ├── 贷款账户情况
│   │   ├── 贷款笔数
│   │   ├── 贷款总额
│   │   ├── 剩余本金
│   │   └── 贷款类型分布
│   └── 担保信息
├── 信用状况评估
│   ├── 逾期记录分析
│   │   ├── 逾期次数统计
│   │   ├── 逾期金额统计
│   │   ├── 最长逾期天数
│   │   └── 近期逾期情况
│   ├── 还款表现评价
│   ├── 信用利用率分析
│   └── 信用健康度评分
├── 查询记录分析
│   ├── 查询总次数
│   ├── 近期查询频次
│   ├── 查询机构类型分布
│   ├── 查询原因分析
│   └── 查询密度风险提示
└── 信用优化建议
    ├── 信用提升策略
    ├── 风险点改善建议
    ├── 申贷时机建议
    └── 注意事项
```

#### 2.2.3 专信宝
**功能描述：** 详版征信报告专业分析工具

**适用场景：**
- 金融机构风控审核
- 大额贷款申请
- 专业信用评估

**核心功能：**
- 上传个人详版征信报告
- 深度解读征信数据
- 生成专业级分析报告

**分析报告结构：**
```
专业版征信分析报告
├── 征信报告概览
│   ├── 报告基本信息
│   ├── 数据更新时间
│   ├── 报告完整性检查
│   └── 数据质量评估
├── 个人信息核验分析
│   ├── 身份信息详情
│   ├── 居住信息变更轨迹
│   ├── 职业信息变化
│   ├── 联系方式更新频率
│   └── 信息一致性验证
├── 信贷账户深度分析
│   ├── 信用卡账户分析
│   │   ├── 开户时间分布
│   │   ├── 发卡机构分析
│   │   ├── 授信额度变化
│   │   ├── 使用率趋势
│   │   ├── 还款记录详情
│   │   ├── 分期使用情况
│   │   └── 风险账户识别
│   ├── 贷款账户分析
│   │   ├── 贷款类型分布
│   │   ├── 放贷机构分析
│   │   ├── 贷款金额统计
│   │   ├── 还款状态分析
│   │   ├── 逾期情况详情
│   │   ├── 提前还款记录
│   │   └── 贷款集中度分析
│   └── 担保信息分析
│       ├── 担保类型
│       ├── 担保金额
│       └── 担保风险评估
├── 信用行为深度分析
│   ├── 信用历史时间轴
│   ├── 信用表现趋势
│   ├── 风险事件识别
│   ├── 信用稳定性评估
│   ├── 多头借贷分析
│   └── 信用成长轨迹
├── 查询记录深度解析
│   ├── 查询时间分析
│   ├── 查询机构分类统计
│   ├── 查询密度评估
│   ├── 查询影响分析
│   ├── 异常查询识别
│   └── 查询与申贷关联分析
├── 公共信息记录
│   ├── 欠税记录
│   ├── 民事判决记录
│   ├── 强制执行记录
│   ├── 行政处罚记录
│   └── 其他公共信息
├── 综合信用评估
│   ├── 多维度信用评分
│   ├── 风险等级评定
│   ├── 信用能力评估
│   ├── 还款意愿分析
│   ├── 发展趋势预测
│   └── 同业对比分析
└── 专业建议与规划
    ├── 信用优化策略
    ├── 风险防控建议
    ├── 信贷申请建议
    ├── 长期信用规划
    └── 机构风控建议
```

#### 2.2.4 个人中心
**功能描述：** 用户个人信息管理中心

**核心功能：**
- 个人资料管理
- 历史报告查看与下载
- 机构切换
- 系统设置
- 帮助与反馈

## 3. 技术实现要求

### 3.1 技术架构选型
**微信云开发架构：**
- **前端**：微信小程序 + TDesign组件库
- **后端**：微信云开发（云函数 + 云数据库 + 云存储）
- **实时通信**：云开发实时数据库推送
- **文件处理**：云存储 + 云函数异步处理

**云开发优势：**
- 无需自建服务器，降低运维成本
- 天然与微信小程序集成，开发效率高
- 自动扩缩容，支持高并发访问
- 内置安全机制，数据传输加密

### 3.2 云开发架构设计

#### 3.2.1 云函数设计
```
云函数架构
├── 用户认证模块
│   ├── login (用户登录)
│   ├── getUserInfo (获取用户信息)
│   └── updateUserInfo (更新用户信息)
├── 机构管理模块
│   ├── getOrgList (获取机构列表)
│   ├── joinOrg (加入机构)
│   └── switchOrg (切换机构)
├── 文件处理模块
│   ├── uploadFile (文件上传)
│   ├── parseFile (文件解析)
│   └── deleteFile (文件删除)
├── 报告生成模块
│   ├── generateFlowReport (流水宝报告生成)
│   ├── generateSimpleReport (简信宝报告生成)
│   ├── generateDetailReport (专信宝报告生成)
│   └── getReportProgress (获取生成进度)
└── 数据分析模块
    ├── analyzeFlow (银行流水分析)
    ├── analyzeCreditSimple (简版征信分析)
    └── analyzeCreditDetail (详版征信分析)
```

#### 3.2.2 云数据库设计
```
数据库集合设计
├── users (用户信息)
│   ├── _id: 用户唯一标识
│   ├── openid: 微信openid
│   ├── nickName: 用户昵称
│   ├── avatarUrl: 头像地址
│   ├── orgId: 所属机构ID
│   ├── createTime: 创建时间
│   └── updateTime: 更新时间
├── organizations (机构信息)
│   ├── _id: 机构唯一标识
│   ├── orgName: 机构名称
│   ├── orgCode: 机构代码
│   ├── orgType: 机构类型
│   ├── adminUsers: 管理员用户列表
│   └── createTime: 创建时间
├── reports (报告记录)
│   ├── _id: 报告唯一标识
│   ├── userId: 用户ID
│   ├── orgId: 机构ID
│   ├── reportType: 报告类型(flow/simple/detail)
│   ├── fileName: 原始文件名
│   ├── fileId: 云存储文件ID
│   ├── status: 生成状态
│   ├── progress: 生成进度
│   ├── reportData: 报告数据
│   ├── createTime: 创建时间
│   └── completeTime: 完成时间
├── tasks (任务队列)
│   ├── _id: 任务唯一标识
│   ├── reportId: 关联报告ID
│   ├── taskType: 任务类型
│   ├── status: 任务状态
│   ├── progress: 执行进度
│   ├── errorMsg: 错误信息
│   └── createTime: 创建时间
└── files (文件记录)
    ├── _id: 文件唯一标识
    ├── userId: 用户ID
    ├── fileName: 文件名
    ├── fileSize: 文件大小
    ├── fileType: 文件类型
    ├── cloudPath: 云存储路径
    ├── uploadTime: 上传时间
    └── status: 文件状态
```

#### 3.2.3 云存储设计
```
云存储目录结构
├── uploads/ (用户上传文件)
│   ├── {userId}/
│   │   ├── flow/ (银行流水文件)
│   │   ├── credit-simple/ (简版征信文件)
│   │   └── credit-detail/ (详版征信文件)
├── reports/ (生成的报告文件)
│   ├── {userId}/
│   │   ├── {reportId}.pdf
│   │   └── {reportId}.json
└── temp/ (临时文件)
    └── {taskId}/
```

### 3.3 异步报告生成机制

#### 3.3.1 技术实现方案
**基于云开发的异步处理：**
- 使用云函数处理文件解析和数据分析
- 云数据库实时推送进度更新
- 云存储保存中间结果和最终报告

**进度状态设计：**
```
报告生成进度状态
├── 初始化 (0%) - 创建任务记录
├── 文件上传中 (0-15%) - 上传到云存储
├── 文件解析中 (15-35%) - 云函数OCR识别
├── 数据提取中 (35-55%) - 云函数数据提取
├── 智能分析中 (55-80%) - 云函数AI分析
├── 报告生成中 (80-95%) - 云函数报告生成
├── 质量检查中 (95-98%) - 云函数质量检查
└── 生成完成 (100%) - 保存到云存储
```

#### 3.3.2 实现细节
**前端实现：**
```typescript
// 监听报告生成进度
const watchProgress = (reportId: string) => {
  const db = wx.cloud.database()
  db.collection('reports').doc(reportId).watch({
    onChange: (snapshot) => {
      const { progress, status } = snapshot.docs[0]
      this.setData({ progress, status })
    },
    onError: (err) => {
      console.error('监听失败', err)
    }
  })
}

// 上传文件并开始分析
const uploadAndAnalyze = async (filePath: string, reportType: string) => {
  // 1. 上传文件到云存储
  const uploadResult = await wx.cloud.uploadFile({
    cloudPath: `uploads/${userId}/${reportType}/${Date.now()}.pdf`,
    filePath: filePath
  })
  
  // 2. 调用云函数开始分析
  const result = await wx.cloud.callFunction({
    name: 'generateReport',
    data: {
      fileId: uploadResult.fileID,
      reportType: reportType
    }
  })
  
  // 3. 开始监听进度
  watchProgress(result.result.reportId)
}
```

**云函数实现：**
```javascript
// 云函数：generateReport
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { fileId, reportType } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 1. 创建报告记录
    const reportResult = await db.collection('reports').add({
      data: {
        userId: OPENID,
        reportType: reportType,
        fileId: fileId,
        status: 'processing',
        progress: 0,
        createTime: new Date()
      }
    })
    
    const reportId = reportResult._id
    
    // 2. 创建异步任务
    await db.collection('tasks').add({
      data: {
        reportId: reportId,
        taskType: 'generate_report',
        status: 'pending',
        progress: 0,
        createTime: new Date()
      }
    })
    
    // 3. 异步处理（使用云函数调用云函数）
    cloud.callFunction({
      name: 'processReport',
      data: { reportId: reportId }
    })
    
    return { reportId: reportId }
  } catch (error) {
    console.error('生成报告失败', error)
    throw error
  }
}
```

### 3.4 文件上传与处理

#### 3.4.1 云存储配置
**安全规则设置：**
```json
{
  "read": "auth.openid == resource.openid",
  "write": "auth.openid == resource.openid && resource.size <= 10485760"
}
```

**支持格式与限制：**
- PDF文件（主要格式）
- JPG/JPEG图片
- PNG图片
- 单文件大小限制：10MB
- 支持批量上传（最多5个文件）

#### 3.4.2 文件处理流程
```javascript
// 云函数：processFile
const cloud = require('wx-server-sdk')
const { OCR } = require('tencentcloud-sdk-nodejs')

exports.main = async (event, context) => {
  const { fileId, reportId } = event
  
  try {
    // 1. 更新进度：文件解析中
    await updateProgress(reportId, 15, 'parsing')
    
    // 2. 下载文件
    const fileResult = await cloud.downloadFile({ fileID: fileId })
    
    // 3. OCR识别
    const ocrResult = await performOCR(fileResult.buffer)
    
    // 4. 更新进度：数据提取中
    await updateProgress(reportId, 35, 'extracting')
    
    // 5. 数据提取和分析
    const analysisResult = await analyzeData(ocrResult)
    
    // 6. 生成报告
    await generateFinalReport(reportId, analysisResult)
    
    return { success: true }
  } catch (error) {
    await updateProgress(reportId, -1, 'error', error.message)
    throw error
  }
}
```

### 3.5 数据安全与隐私保护

#### 3.5.1 云开发安全机制
**内置安全特性：**
- 数据库安全规则自动验证用户权限
- 云存储访问控制基于用户身份
- 云函数运行在隔离环境中
- 数据传输自动HTTPS加密


#### 3.5.2 数据库安全规则
```json
{
  "read": "auth.openid == resource.userId || auth.openid in resource.sharedUsers",
  "write": "auth.openid == resource.userId",
  "create": "auth.openid != null",
  "delete": "auth.openid == resource.userId"
}
```

### 3.6 性能优化策略

#### 3.6.1 云开发性能优化
- **云函数预热**：定时调用避免冷启动
- **数据库索引**：为常用查询字段建立索引
- **CDN加速**：静态资源使用云开发CDN
- **缓存策略**：报告结果缓存到本地存储

#### 3.6.2 小程序性能优化
- **分包加载**：按功能模块分包
- **图片懒加载**：大图片延迟加载
- **数据预加载**：提前加载用户常用数据
- **组件复用**：使用TDesign组件库提高性能

### 3.7 监控与运维

#### 3.7.1 云开发监控
- **云函数监控**：调用次数、执行时间、错误率
- **数据库监控**：读写次数、存储容量、慢查询
- **云存储监控**：上传下载量、存储使用量
- **实时告警**：异常情况自动通知

#### 3.7.2 业务监控指标
- 用户活跃度统计
- 报告生成成功率
- 文件上传成功率
- 平均处理时间
- 用户满意度反馈

## 4. 用户体验设计

### 4.1 界面设计原则
- 遵循微信小程序设计规范
- 简洁直观的操作流程
- 清晰的进度提示和状态反馈
- 友好的错误提示和引导
- 响应式设计适配不同屏幕尺寸

### 4.2 交互设计细节
**文件上传：**
- 拖拽上传或点击选择
- 实时上传进度显示
- 支持文件预览和删除

**报告生成：**
- 动态进度条和状态描述
- 预估剩余时间显示
- 支持后台生成提醒

**报告查看：**
- 在线预览和分页浏览
- 支持报告分享和下载
- 关键信息高亮显示

## 5. 业务流程

### 5.1 用户使用流程
```
微信授权登录 → 选择组织机构 → 进入主页 → 选择功能模块 → 上传文件 → 等待分析 → 查看报告 → 下载/分享
```

### 5.2 报告生成流程
```
文件上传 → 格式验证 → OCR识别 → 数据提取 → 智能分析 → 报告生成 → 质量检查 → 用户通知
```

### 5.3 异常处理流程
```
错误检测 → 错误分类 → 用户提示 → 重试机制 → 人工客服 → 问题解决
```

## 6. 性能要求

### 6.1 响应时间要求
- 页面加载时间：< 2秒
- 文件上传响应：< 3秒
- 报告生成时间：
  - 流水宝：< 3分钟
  - 简信宝：< 2分钟
  - 专信宝：< 5分钟

### 6.2 并发性能
- 支持并发用户数：1000+
- 文件上传并发：100+
- 报告生成队列：50+

## 7. 版本规划

### V1.0 基础版本（MVP）
- 微信登录和机构选择
- 流水宝基础功能
- 简信宝基础功能
- 基础报告生成和查看

### V1.1 增强版本
- 专信宝功能
- 报告分享功能
- 历史记录管理
- 用户反馈系统

### V1.2 优化版本
- 性能优化和体验改进
- UI/UX界面升级
- 新增分析维度
- 批量处理功能

### V2.0 企业版本
- B端机构管理功能
- 批量用户管理
- 自定义报告模板
- API接口开放

