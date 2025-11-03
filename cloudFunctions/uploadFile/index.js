const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 统一文件大小限制：10MB
const FILE_SIZE_LIMIT = 10 * 1024 * 1024

// 支持的文件格式
const SUPPORTED_FORMATS = {
  flow: ['.pdf', '.jpg', '.jpeg', '.png'],
  simple: ['.pdf'],
  detail: ['.pdf']
}

/**
 * 验证文件
 */
function validateFile(fileName, fileSize, reportType) {
  // 1. 检查文件大小
  if (fileSize > FILE_SIZE_LIMIT) {
    return {
      valid: false,
      message: `文件大小不能超过 10MB，当前文件大小：${formatFileSize(fileSize)}`
    }
  }
  
  // 2. 检查文件格式
  const extension = '.' + fileName.toLowerCase().split('.').pop()
  const supportedFormats = SUPPORTED_FORMATS[reportType]
  
  if (!supportedFormats.includes(extension)) {
    const reportNames = {
      flow: '流水宝',
      simple: '简信宝',
      detail: '专信宝'
    }
    
    return {
      valid: false,
      message: `${reportNames[reportType]}仅支持 ${supportedFormats.join(', ')} 格式文件`
    }
  }
  
  return { valid: true }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 创建报告记录
 */
async function createReportRecord(userId, fileInfo) {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const reportData = {
    _id: reportId,
    userId: userId,
    reportType: fileInfo.reportType,

    // 输入信息
    input: {
      originalFileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      uploadTime: new Date(),
      cloudPath: null,
      fileId: null
    },

    // 处理信息
    processing: {
      status: 'pending',
      progress: 0,
      currentStage: 'FILE_UPLOAD',
      startTime: new Date(),
      endTime: null,
      processingTime: null,
      errorMessage: null,
      estimatedTimeRemaining: 180
    },

    // 算法调用信息
    algorithm: {
      requestId: null,
      apiEndpoint: getApiEndpoint(fileInfo.reportType),
      prompt: getPromptByType(fileInfo.reportType),
      requestTime: null,
      responseTime: null,
      retryCount: 0
    },

    // 输出结果（初始为空）
    output: {
      reportFiles: {
        jsonUrl: null,
        pdfUrl: null,
        htmlUrl: null
      },
      summary: null,
      fileInfo: {
        jsonFileSize: 0,
        pdfFileSize: 0,
        downloadCount: 0,
        lastDownloadTime: null
      }
    },

    // 元数据
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      tags: getTagsByType(fileInfo.reportType),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
    }
  }

  await db.collection('reports').add({
    data: reportData
  })

  return reportId
}

/**
 * 触发异步分析
 */
async function triggerAsyncAnalysis(reportId, fileId, reportType) {
  try {
    // 异步调用处理云函数，不等待结果
    cloud.callFunction({
      name: 'processReportAsync',
      data: {
        reportId,
        fileId,
        reportType
      }
    }).then(() => {
      console.log(`异步分析已启动: ${reportId}`)
    }).catch((error) => {
      console.error('异步分析启动失败:', error)
      updateReportStatus(reportId, 'failed', error.message)
    })

    console.log(`异步分析请求已发送: ${reportId}`)
  } catch (error) {
    console.error('触发异步分析失败:', error)
    await updateReportStatus(reportId, 'failed', error.message)
  }
}

/**
 * 更新报告状态
 */
async function updateReportStatus(reportId, status, errorMessage = null) {
  const updateData = {
    'processing.status': status,
    'processing.updatedAt': new Date(),
    'metadata.updatedAt': new Date()
  }

  if (errorMessage) {
    updateData['processing.errorMessage'] = errorMessage
  }

  if (status === 'completed' || status === 'failed') {
    updateData['processing.endTime'] = new Date()
  }

  await db.collection('reports').doc(reportId).update({
    data: updateData
  })
}

/**
 * 获取API端点
 */
function getApiEndpoint(reportType) {
  const endpoints = {
    'flow': '/analyze/bankflow',
    'simple': '/analyze/credit-simple',
    'detail': '/analyze/credit-detail'
  }
  return endpoints[reportType] || '/analyze/default'
}

/**
 * 获取分析提示词
 */
function getPromptByType(reportType) {
  const prompts = {
    'flow': `请分析这份银行流水文件，生成详细的流水分析报告。报告应包括：
1. 收支概览和趋势分析
2. 收入来源分析和稳定性评估
3. 支出分类分析和消费习惯
4. 账户余额变化和流动性分析
5. 交易行为模式分析
6. 风险评估和信用评价
7. 专业建议和优化方案
请以JSON格式返回结构化的分析结果。`,

    'simple': `请分析这份个人信用报告（简版），生成专业的信用分析报告。报告应包括：
1. 个人基本信息概览
2. 信用账户概况和使用情况
3. 还款历史和逾期记录分析
4. 查询记录分析
5. 信用风险评估
6. 信用优化建议
请以JSON格式返回结构化的分析结果。`,

    'detail': `请分析这份个人信用报告（详版），生成深度的信用专业分析报告。报告应包括：
1. 执行摘要和整体评价
2. 信用历史深度分析
3. 当前负债结构分析
4. 还款能力和意愿评估
5. 综合风险模型评分
6. 行业对比和基准分析
7. 专业投资和信贷建议
请以JSON格式返回结构化的分析结果。`
  }
  return prompts[reportType] || '请分析这份文件并生成专业报告。'
}

/**
 * 获取标签
 */
function getTagsByType(reportType) {
  const tags = {
    'flow': ['银行流水', '收支分析', '资金流向'],
    'simple': ['征信报告', '信用分析', '简版'],
    'detail': ['征信报告', '信用分析', '详版', '专业分析']
  }
  return tags[reportType] || ['分析报告']
}

exports.main = async (event, context) => {
  const { fileBuffer, fileId, cloudPath, fileName, fileSize, reportType } = event
  const { OPENID } = cloud.getWXContext()

  try {
    console.log(`用户 ${OPENID} 上传文件: ${fileName}, 类型: ${reportType}`)

    // 兼容旧版本：如果传入了 fileBuffer，使用旧逻辑
    if (fileBuffer) {
      console.log('使用旧版本上传逻辑（fileBuffer）')

      // 1. 文件验证
      const validation = validateFile(fileName, fileBuffer.length, reportType)
      if (!validation.valid) {
        throw new Error(validation.message)
      }

      // 2. 创建报告记录
      const reportId = await createReportRecord(OPENID, {
        reportType,
        fileName,
        fileSize: fileBuffer.length,
        status: 'pending'
      })

      // 3. 上传文件到云存储
      const uploadCloudPath = `uploads/${reportType}/${OPENID}/${Date.now()}_${fileName}`
      const uploadResult = await cloud.uploadFile({
        cloudPath: uploadCloudPath,
        fileContent: Buffer.from(fileBuffer)
      })

      // 4. 更新报告记录的文件信息
      await db.collection('reports').doc(reportId).update({
        data: {
          'input.cloudPath': uploadCloudPath,
          'input.fileId': uploadResult.fileID,
          'processing.status': 'uploaded',
          'processing.currentStage': 'FILE_UPLOADED',
          'processing.progress': 20,
          'metadata.updatedAt': new Date()
        }
      })

      // 5. 触发异步分析
      await triggerAsyncAnalysis(reportId, uploadResult.fileID, reportType)

      // 6. 立即返回报告ID
      return {
        success: true,
        reportId: reportId,
        message: '文件上传成功，正在分析中...'
      }
    }

    // 新版本：文件已上传到云存储，只需创建报告记录
    console.log('使用新版本上传逻辑（fileId）')
    console.log('fileId:', fileId)
    console.log('cloudPath:', cloudPath)
    console.log('fileSize:', fileSize)

    // 1. 文件验证
    const validation = validateFile(fileName, fileSize || 0, reportType)
    if (!validation.valid) {
      throw new Error(validation.message)
    }

    // 2. 创建报告记录
    const reportId = await createReportRecord(OPENID, {
      reportType,
      fileName,
      fileSize: fileSize || 0,
      status: 'pending'
    })

    // 3. 更新报告记录的文件信息
    await db.collection('reports').doc(reportId).update({
      data: {
        'input.cloudPath': cloudPath,
        'input.fileId': fileId,
        'processing.status': 'uploaded',
        'processing.currentStage': 'FILE_UPLOADED',
        'processing.progress': 20,
        'metadata.updatedAt': new Date()
      }
    })

    // 4. 触发异步分析
    await triggerAsyncAnalysis(reportId, fileId, reportType)

    // 5. 立即返回报告ID
    return {
      success: true,
      reportId: reportId,
      message: '文件上传成功，正在分析中...'
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
