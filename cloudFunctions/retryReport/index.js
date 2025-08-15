const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { reportId, reportType } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    console.log(`用户 ${OPENID} 请求重新生成报告: ${reportId}`)
    
    // 1. 验证报告存在且属于当前用户
    const reportDoc = await db.collection('reports').doc(reportId).get()
    
    if (!reportDoc.data) {
      throw new Error('报告不存在')
    }
    
    const report = reportDoc.data
    
    if (report.userId !== OPENID) {
      throw new Error('无权操作此报告')
    }
    
    // 2. 检查报告状态，只有失败的报告才能重新生成
    if (report.processing.status !== 'failed') {
      throw new Error('只有处理失败的报告才能重新生成')
    }
    
    // 3. 重置报告状态为处理中
    await db.collection('reports').doc(reportId).update({
      data: {
        'processing.status': 'processing',
        'processing.progress': 10,
        'processing.currentStage': 'RETRY_PROCESSING',
        'processing.startTime': new Date(),
        'processing.endTime': null,
        'processing.errorMessage': null,
        'processing.estimatedTimeRemaining': 180,
        'algorithm.retryCount': db.command.inc(1),
        'algorithm.requestTime': new Date(),
        'algorithm.responseTime': null,
        'metadata.updatedAt': new Date()
      }
    })
    
    // 4. 触发异步重新处理
    await triggerRetryProcessing(reportId, report.input.fileId, reportType)
    
    return {
      success: true,
      message: '报告已重新开始生成',
      reportId: reportId
    }
    
  } catch (error) {
    console.error('重新生成报告失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 触发异步重新处理
 */
async function triggerRetryProcessing(reportId, fileId, reportType) {
  try {
    // 调用异步处理云函数
    await cloud.callFunction({
      name: 'processReportAsync',
      data: {
        reportId,
        fileId,
        reportType,
        isRetry: true
      }
    })
  } catch (error) {
    console.error('触发重新处理失败:', error)
    
    // 如果触发失败，更新报告状态
    await db.collection('reports').doc(reportId).update({
      data: {
        'processing.status': 'failed',
        'processing.errorMessage': '重新处理触发失败',
        'processing.endTime': new Date(),
        'metadata.updatedAt': new Date()
      }
    })
    
    throw error
  }
}
