const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

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
        
        tags: report.metadata.tags,
        createdAt: report.metadata.createdAt,
        expiresAt: report.metadata.expiresAt
      }
    }
  } catch (error) {
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
      .field({
        userId: true,
        'processing.status': true,
        'processing.progress': true,
        'processing.currentStage': true,
        'processing.errorMessage': true,
        'processing.estimatedTimeRemaining': true,
        'output.reportFiles': true
      })
      .get()
    
    if (!reportDoc.data) {
      return {
        success: false,
        error: 'REPORT_NOT_FOUND',
        message: '报告记录不存在，可能已被自动清理'
      }
    }
    
    const report = reportDoc.data
    
    // 验证用户权限
    if (report.userId !== userId) {
      throw new Error('无权访问此报告')
    }
    
    return {
      success: true,
      data: {
        status: report.processing.status,
        progress: report.processing.progress,
        currentStage: report.processing.currentStage,
        errorMessage: report.processing.errorMessage,
        estimatedTimeRemaining: report.processing.estimatedTimeRemaining,
        hasFiles: !!(report.output.reportFiles && report.output.reportFiles.jsonUrl),
        stageText: getStageText(report.processing.currentStage)
      }
    }
  } catch (error) {
    throw new Error(`获取报告状态失败: ${error.message}`)
  }
}

/**
 * 下载报告
 */
async function downloadReport(reportId, userId, fileType = 'json') {
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
    
    // 检查报告是否完成
    if (report.processing.status !== 'completed') {
      throw new Error('报告尚未完成')
    }
    
    // 检查报告是否过期
    if (report.metadata.expiresAt && new Date() > new Date(report.metadata.expiresAt)) {
      throw new Error('报告已过期')
    }
    
    // 获取对应的文件URL
    const reportFiles = report.output.reportFiles
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
    
    if (!fileUrl) {
      throw new Error('报告文件不存在')
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
    const downloadUrl = await cloud.getTempFileURL({
      fileList: [fileUrl]
    })
    
    return {
      success: true,
      data: {
        downloadUrl: downloadUrl.fileList[0].tempFileURL,
        fileName: `${report.input.originalFileName}_analysis.${fileType}`,
        fileSize: report.output.fileInfo[`${fileType}FileSize`] || 0
      }
    }
  } catch (error) {
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
