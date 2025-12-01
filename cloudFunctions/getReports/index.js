const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// AI分析服务配置
const AI_ANALYSIS_SERVICE = {
  url: 'http://115.190.121.59:8005'
}

exports.main = async (event, context) => {
  const { action, reportId, page = 1, pageSize = 10, reportType } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'getReportDetail':
        return await getReportDetail(reportId, OPENID)

      case 'getReportsList':
        return await getReportsList(OPENID, page, pageSize, reportType)

      case 'getReportStatus':
        return await getReportStatus(reportId, OPENID)

      case 'downloadReport':
        return await downloadReport(reportId, OPENID, event.fileType)

      case 'getHTMLContent':
        return await getHTMLContent(reportId, OPENID)

      default:
        throw new Error('未知的操作类型')
    }
  } catch (error) {
    console.error('报告查询失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取报告详情
 */
async function getReportDetail(reportId, userId) {
  try {
    const reportDoc = await db.collection('reports')
      .doc(reportId)
      .get()
    
    if (!reportDoc.data) {
      throw new Error('报告不存在')
    }
    
    const report = reportDoc.data
    
    // 验证用户权限
    if (report.userId !== userId) {
      throw new Error('无权访问此报告')
    }
    
    // 检查报告是否过期
    if (report.metadata.expiresAt && new Date() > new Date(report.metadata.expiresAt)) {
      throw new Error('报告已过期')
    }
    
    return {
      success: true,
      data: {
        reportId: report._id,
        reportType: report.reportType,
        fileName: report.input.originalFileName,
        fileSize: report.input.fileSize,
        uploadTime: report.input.uploadTime,

        status: report.processing.status,
        progress: report.processing.progress,
        currentStage: report.processing.currentStage,
        processingTime: calculateProcessingTime(report.processing.startTime, report.processing.endTime),
        errorMessage: report.processing.errorMessage,

        reportFiles: report.output.reportFiles,
        summary: report.output.summary,
        analysisResult: report.output.analysisResult,  // 🆕 添加AI分析结果

        tags: report.metadata.tags,
        createdAt: report.metadata.createdAt,
        expiresAt: report.metadata.expiresAt
      }
    }
  } catch (error) {
    // 检查是否是文档不存在的错误
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('document.get:fail') ||
        errorMessage.includes('document with _id') && errorMessage.includes('does not exist')) {
      throw new Error('报告不存在')
    }

    throw new Error(`获取报告详情失败: ${error.message}`)
  }
}

/**
 * 获取报告列表
 */
async function getReportsList(userId, page, pageSize, reportType) {
  try {
    // 构建查询条件
    const whereCondition = {
      userId: userId
    }

    // 如果指定了报告类型，添加筛选条件
    if (reportType) {
      whereCondition.reportType = reportType
    }

    const query = db.collection('reports')
      .where(whereCondition)
      .orderBy('metadata.createdAt', 'desc')

    // 分页查询
    const skip = (page - 1) * pageSize
    const result = await query
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await query.count()
    
    const reports = result.data.map(report => ({
      reportId: report._id,
      reportType: report.reportType,
      fileName: report.input.originalFileName,
      status: report.processing.status,
      progress: report.processing.progress,
      currentStage: report.processing.currentStage,
      summary: report.output.summary,
      tags: report.metadata.tags,
      createdAt: report.metadata.createdAt,
      expiresAt: report.metadata.expiresAt,
      hasFiles: !!(report.output.reportFiles && report.output.reportFiles.jsonUrl)
    }))
    
    return {
      success: true,
      data: {
        reports: reports,
        pagination: {
          page: page,
          pageSize: pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    }
  } catch (error) {
    throw new Error(`获取报告列表失败: ${error.message}`)
  }
}

/**
 * 获取报告状态
 */
async function getReportStatus(reportId, userId) {
  try {
    const reportDoc = await db.collection('reports')
      .doc(reportId)
      .get()

    if (!reportDoc.data) {
      console.log(`报告记录不存在: ${reportId}`)
      return {
        success: false,
        error: 'REPORT_NOT_FOUND',
        message: '报告记录不存在，可能已被自动清理'
      }
    }

    const report = reportDoc.data

    // 验证用户权限
    if (report.userId !== userId) {
      console.warn(`用户 ${userId} 无权访问报告 ${reportId}`)
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: '无权访问此报告'
      }
    }

    // 现在使用异步处理模式，直接返回当前状态
    console.log(`获取报告状态: ${reportId}, 当前状态: ${report.status || report.processing?.status}`)

    return buildStatusResponse(report)

  } catch (error) {
    // 检查是否是文档不存在的错误
    const errorMessage = error.message || error.toString()
    const isDocNotExist = errorMessage.includes('document.get:fail') || (errorMessage.includes('document with _id') && errorMessage.includes('does not exist'))

    if (isDocNotExist) {
      console.log(`报告记录不存在(异常捕获): ${reportId}`)
      return {
        success: false,
        error: 'REPORT_NOT_FOUND',
        message: '报告记录不存在，可能已被自动清理'
      }
    }

    // 其他错误也返回错误响应，而不是抛出异常
    console.error(`获取报告状态失败: ${reportId}`, error)
    return {
      success: false,
      error: 'QUERY_FAILED',
      message: `获取报告状态失败: ${error.message}`
    }
  }
}

/**
 * 构建状态响应
 */
function buildStatusResponse(report) {
  // 兼容新旧数据结构
  const status = report.status || report.processing?.status || 'unknown'
  const progress = report.progress || report.processing?.progress || 0
  const currentStage = report.currentStep || report.processing?.currentStage || 'UNKNOWN'
  const errorMessage = report.errorMessage || report.processing?.errorMessage
  const reportFiles = report.reportFiles || report.output?.reportFiles

  return {
    success: true,
    data: {
      status: status,
      progress: progress,
      currentStage: currentStage,
      errorMessage: errorMessage,
      estimatedTimeRemaining: report.algorithm?.estimatedTimeRemaining,
      hasFiles: !!(reportFiles && (reportFiles.json || reportFiles.jsonUrl)),
      stageText: getStageText(currentStage),
      taskId: report.algorithm?.taskId,
      taskStatus: report.algorithm?.taskStatus
    }
  }
}

/**
 * 下载报告
 */
async function downloadReport(reportId, userId, fileType = 'json') {
  try {
    console.log(`📥 下载报告请求: reportId=${reportId}, fileType=${fileType}`)

    const reportDoc = await db.collection('reports')
      .doc(reportId)
      .get()

    if (!reportDoc.data) {
      console.error(`❌ 报告不存在: ${reportId}`)
      throw new Error('报告不存在')
    }

    const report = reportDoc.data

    // 验证用户权限
    if (report.userId !== userId) {
      console.error(`❌ 用户无权访问报告`)
      throw new Error('无权访问此报告')
    }

    // 检查报告是否完成
    if (report.processing.status !== 'completed') {
      console.warn(`⚠️ 报告未完成: status=${report.processing.status}`)
      throw new Error('报告尚未完成')
    }

    // 检查报告是否过期
    if (report.metadata.expiresAt && new Date() > new Date(report.metadata.expiresAt)) {
      console.warn(`⚠️ 报告已过期`)
      throw new Error('报告已过期')
    }

    // 获取对应的文件URL
    const reportFiles = report.output.reportFiles
    console.log(`📄 报告文件信息:`, {
      hasJsonUrl: !!reportFiles.jsonUrl,
      hasPdfUrl: !!reportFiles.pdfUrl,
      hasHtmlUrl: !!reportFiles.htmlUrl
    })

    let fileUrl = null

    switch (fileType) {
      case 'json':
        fileUrl = reportFiles.jsonUrl
        break
      case 'pdf':
        fileUrl = reportFiles.pdfUrl
        break
      case 'html':
        fileUrl = reportFiles.htmlUrl
        break
      default:
        throw new Error('不支持的文件类型')
    }

    console.log(`📎 文件URL (${fileType}):`, fileUrl ? '✅ 存在' : '❌ 不存在')

    if (!fileUrl) {
      console.error(`❌ ${fileType}文件URL不存在`)
      throw new Error(`${fileType.toUpperCase()}报告文件不存在，可能生成失败`)
    }
    
    // 更新下载统计
    await db.collection('reports').doc(reportId).update({
      data: {
        'output.fileInfo.downloadCount': db.command.inc(1),
        'output.fileInfo.lastDownloadTime': new Date(),
        'metadata.updatedAt': new Date()
      }
    })
    
    // 生成临时下载链接
    console.log(`🔗 生成临时下载链接...`)
    const downloadUrl = await cloud.getTempFileURL({
      fileList: [fileUrl]
    })

    if (!downloadUrl.fileList || downloadUrl.fileList.length === 0) {
      console.error(`❌ 临时链接生成失败`)
      throw new Error('生成下载链接失败')
    }

    const tempFileURL = downloadUrl.fileList[0].tempFileURL
    console.log(`✅ 临时链接生成成功`)

    // 生成更友好的文件名
    let baseFileName = report.input.originalFileName || '报告'
    // 移除原文件的扩展名（如 .pdf）
    baseFileName = baseFileName.replace(/\.(pdf|PDF)$/, '')

    // 根据文件类型生成文件名
    let finalFileName
    if (fileType === 'html') {
      finalFileName = `${baseFileName}_分析报告.html`
    } else if (fileType === 'pdf') {
      finalFileName = `${baseFileName}_分析报告.pdf`
    } else {
      finalFileName = `${baseFileName}_分析数据.${fileType}`
    }

    console.log(`✅ 下载报告成功: ${finalFileName}`)

    return {
      success: true,
      data: {
        downloadUrl: tempFileURL,
        fileName: finalFileName,
        fileSize: report.output.fileInfo[`${fileType}FileSize`] || 0
      }
    }
  } catch (error) {
    console.error(`❌ 下载报告失败:`, {
      reportId,
      fileType,
      error: error.message
    })

    // 检查是否是文档不存在的错误
    const errorMessage = error.message || error.toString()
    if (errorMessage.includes('document.get:fail') ||
        errorMessage.includes('document with _id') && errorMessage.includes('does not exist')) {
      throw new Error('报告不存在')
    }

    throw new Error(`下载报告失败: ${error.message}`)
  }
}

/**
 * 计算处理时间
 */
function calculateProcessingTime(startTime, endTime) {
  if (!startTime) return null
  if (!endTime) return null
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  
  return `${minutes}分${seconds}秒`
}

/**
 * 获取HTML内容
 */
async function getHTMLContent(reportId, userId) {
  try {
    console.log(`获取HTML内容: reportId=${reportId}, userId=${userId}`)

    const reportDoc = await db.collection('reports')
      .doc(reportId)
      .get()

    if (!reportDoc.data) {
      console.error('报告不存在')
      throw new Error('报告不存在')
    }

    const report = reportDoc.data

    // 验证用户权限
    if (report.userId !== userId) {
      console.error('无权访问此报告')
      throw new Error('无权访问此报告')
    }

    // 检查报告是否完成
    if (report.processing.status !== 'completed') {
      console.error('报告尚未完成，状态:', report.processing.status)
      throw new Error('报告尚未完成')
    }

    // 获取HTML内容
    const htmlContent = report.output.htmlReport

    if (!htmlContent) {
      console.error('HTML报告不存在')
      throw new Error('HTML报告不存在')
    }

    console.log(`HTML内容长度: ${htmlContent.length}`)

    return {
      success: true,
      data: {
        htmlContent: htmlContent
      }
    }
  } catch (error) {
    console.error('获取HTML内容失败:', error)
    throw new Error(`获取HTML内容失败: ${error.message}`)
  }
}

/**
 * 获取阶段文本
 */
function getStageText(stage) {
  const stageTexts = {
    'FILE_UPLOAD': '文件上传中',
    'FILE_UPLOADED': '文件上传完成',
    'AI_ANALYSIS': 'AI分析中',
    'GENERATING_REPORTS': '生成报告中',
    'COMPLETED': '处理完成',
    'FAILED': '处理失败'
  }

  return stageTexts[stage] || stage
}
