const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// AI分析服务配置
const AI_ANALYSIS_SERVICE = {
  url: process.env.AI_ANALYSIS_SERVICE_URL || 'http://38.60.251.79:8002',
  timeout: 10000
}

/**
 * 检查AI分析任务状态
 */
exports.main = async (event, context) => {
  const { taskId, reportId } = event
  
  if (!taskId || !reportId) {
    return {
      success: false,
      error: '缺少必要参数: taskId 或 reportId'
    }
  }
  
  try {
    console.log(`🔍 检查任务状态: ${taskId}, reportId: ${reportId}`)
    
    // 1. 从AI服务获取任务状态
    const statusResponse = await axios.get(
      `${AI_ANALYSIS_SERVICE.url}/task/${taskId}`,
      { timeout: AI_ANALYSIS_SERVICE.timeout }
    )
    
    if (statusResponse.status !== 200 || !statusResponse.data) {
      throw new Error(`AI服务返回异常: ${statusResponse.status}`)
    }
    
    const taskStatus = statusResponse.data
    const status = taskStatus.status
    
    console.log(`📊 任务状态: ${status}`)
    
    // 2. 更新数据库中的任务状态
    await db.collection('reports').doc(reportId).update({
      data: {
        // 更新主状态
        currentStep: status === 'processing' ? 'AI_ANALYZING' : 'AI_PROCESSING',
        progress: status === 'processing' ? 70 : 60,
        // 算法状态
        'algorithm.taskStatus': status,
        'algorithm.lastCheckTime': new Date(),
        // 兼容旧结构
        'processing.currentStage': status === 'processing' ? 'AI_ANALYZING' : 'AI_PROCESSING',
        'processing.progress': status === 'processing' ? 70 : 60,
        'processing.updatedAt': new Date(),
        'metadata.updatedAt': new Date()
      }
    })
    
    // 3. 根据状态处理不同情况
    if (status === 'completed') {
      // 任务完成，处理结果
      const result = taskStatus.result
      if (result && result.success) {
        console.log(`✅ 任务完成，开始生成报告文件`)
        
        // 生成报告文件
        const reportFiles = await generateReportFiles(result.analysis_result, reportId)
        
        // 更新完成状态
        await db.collection('reports').doc(reportId).update({
          data: {
            status: 'completed',
            currentStep: 'COMPLETED',
            progress: 100,
            'algorithm.responseTime': new Date(),
            'algorithm.processingTime': taskStatus.processing_time,
            'algorithm.waitTime': taskStatus.wait_time,
            'algorithm.taskCompleted': true,
            'output.reportFiles': reportFiles,
            'output.summary': '报告生成完成',
            'metadata.updatedAt': new Date(),
            'metadata.completedAt': new Date()
          }
        })
        
        return {
          success: true,
          status: 'completed',
          message: '任务已完成',
          reportFiles: reportFiles,
          processingTime: taskStatus.processing_time
        }
      } else {
        throw new Error(result?.error_message || '任务完成但分析失败')
      }
      
    } else if (status === 'failed') {
      // 任务失败，清理记录
      const errorMsg = taskStatus.error_message || '任务处理失败'
      console.error(`❌ 任务失败: ${errorMsg}`)
      
      await cleanupFailedReport(reportId, null, errorMsg)
      
      return {
        success: false,
        status: 'failed',
        error: errorMsg
      }
      
    } else if (status === 'cancelled') {
      // 任务被取消，清理记录
      console.log(`⚠️ 任务被取消: ${taskId}`)
      
      await cleanupFailedReport(reportId, null, '任务被取消')
      
      return {
        success: false,
        status: 'cancelled',
        error: '任务被取消'
      }
      
    } else {
      // 任务仍在处理中
      return {
        success: true,
        status: status,
        message: getStatusMessage(status),
        queuePosition: taskStatus.queue_position,
        estimatedTimeRemaining: taskStatus.estimated_time_remaining
      }
    }
    
  } catch (error) {
    console.error(`❌ 检查任务状态失败: ${taskId}`, {
      message: error.message,
      code: error.code,
      status: error.response?.status
    })
    
    // 更新错误信息到数据库
    try {
      await db.collection('reports').doc(reportId).update({
        data: {
          'algorithm.lastError': error.message,
          'algorithm.lastCheckTime': new Date(),
          'metadata.updatedAt': new Date()
        }
      })
    } catch (dbError) {
      console.warn(`更新错误信息失败: ${reportId}`, dbError)
    }
    
    return {
      success: false,
      error: `检查任务状态失败: ${error.message}`,
      taskId: taskId
    }
  }
}

/**
 * 生成报告文件
 */
async function generateReportFiles(analysisResult, reportId) {
  try {
    const reportFiles = {}
    
    // 生成JSON文件
    const jsonContent = JSON.stringify(analysisResult, null, 2)
    const jsonPath = `reports/analysis/${reportId}/analysis.json`
    
    const jsonUploadResult = await cloud.uploadFile({
      cloudPath: jsonPath,
      fileContent: Buffer.from(jsonContent, 'utf8')
    })
    
    reportFiles.json = {
      fileId: jsonUploadResult.fileID,
      fileName: 'analysis.json',
      description: 'AI分析结果(JSON格式)'
    }
    
    console.log(`📄 报告文件生成完成: ${reportId}`)
    
    return reportFiles
    
  } catch (error) {
    console.error(`生成报告文件失败: ${reportId}`, error)
    throw error
  }
}

/**
 * 清理失败的报告记录
 */
async function cleanupFailedReport(reportId, fileId, errorMessage) {
  try {
    console.log(`🧹 清理失败报告: ${reportId}`)
    
    // 删除数据库记录
    await db.collection('reports').doc(reportId).remove()
    
    // 记录清理日志
    await db.collection('cleanup_logs').add({
      data: {
        reportId: reportId,
        fileId: fileId,
        errorMessage: errorMessage,
        cleanupTime: new Date(),
        cleanupReason: '任务失败自动清理'
      }
    })
    
    console.log(`✅ 清理完成: ${reportId}`)
    
  } catch (error) {
    console.error(`清理失败报告时发生错误: ${reportId}`, error)
  }
}

/**
 * 获取状态描述信息
 */
function getStatusMessage(status) {
  const statusMessages = {
    'pending': '任务排队中...',
    'processing': 'AI正在分析中...',
    'completed': '分析完成',
    'failed': '分析失败',
    'cancelled': '任务已取消'
  }
  
  return statusMessages[status] || `任务状态: ${status}`
}
