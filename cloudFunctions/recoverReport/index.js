const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// AI分析服务配置
const AI_ANALYSIS_SERVICE = {
  url: 'http://38.60.251.79:8002'
}

exports.main = async (event, context) => {
  const { reportId } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    console.log(`🔄 开始恢复报告: ${reportId}`)
    
    // 1. 获取报告记录
    const reportDoc = await db.collection('reports').doc(reportId).get()
    
    if (!reportDoc.data) {
      throw new Error('报告不存在')
    }
    
    const report = reportDoc.data
    
    // 验证用户权限
    if (report.userId !== OPENID) {
      throw new Error('无权操作此报告')
    }
    
    console.log(`📊 当前报告状态:`, {
      status: report.status,
      currentStep: report.currentStep,
      progress: report.progress
    })
    
    // 2. 根据当前状态决定恢复策略
    if (report.status !== 'processing') {
      console.log(`报告状态为 ${report.status}，无需恢复`)
      return {
        success: true,
        message: '报告状态正常，无需恢复'
      }
    }
    
    // 3. 检查是否有AI任务ID
    const aiTaskId = report.algorithm?.taskId
    
    if (aiTaskId && (report.currentStep === 'AI_ANALYSIS' || report.currentStep === 'AI_ANALYZING')) {
      console.log(`🤖 检查AI任务状态: ${aiTaskId}`)
      
      try {
        // 查询AI任务状态
        const statusResponse = await axios.get(
          `${AI_ANALYSIS_SERVICE.url}/task/${aiTaskId}`,
          { timeout: 10000 }
        )
        
        if (statusResponse.status === 200 && statusResponse.data) {
          const taskStatus = statusResponse.data
          console.log(`AI任务状态: ${taskStatus.status}`)
          
          if (taskStatus.status === 'completed' && taskStatus.result?.success) {
            // AI已完成，继续生成报告文件
            console.log('✅ AI分析已完成，继续生成报告文件')
            
            const analysisResult = taskStatus.result.analysis_result
            
            // 更新状态为生成报告文件
            await updateReportStatus(reportId, 'processing', 'GENERATING_REPORTS', 80)
            
            // 生成报告文件
            const reportFiles = await generateReportFiles(analysisResult, reportId, report.reportType)
            
            // 更新完成状态
            await updateReportStatus(reportId, 'completed', 'COMPLETED', 100, reportFiles)
            
            console.log(`🎉 报告恢复完成: ${reportId}`)
            
            return {
              success: true,
              message: '报告已恢复并完成',
              status: 'completed'
            }
            
          } else if (taskStatus.status === 'failed') {
            // AI任务失败
            console.log('❌ AI任务失败')
            
            await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, taskStatus.error_message || 'AI分析失败')
            
            return {
              success: false,
              message: 'AI分析失败',
              error: taskStatus.error_message || 'AI分析失败'
            }
            
          } else {
            // AI仍在处理中，更新状态
            console.log('⏳ AI仍在处理中，更新状态')
            
            await updateReportStatus(reportId, 'processing', 'AI_ANALYZING', 60)
            
            return {
              success: true,
              message: 'AI仍在分析中，请继续等待',
              status: 'processing'
            }
          }
          
        } else {
          throw new Error('AI服务响应异常')
        }
        
      } catch (aiError) {
        console.error('查询AI状态失败:', aiError)
        
        // AI服务查询失败，可能需要重新提交
        console.log('⚠️ AI服务查询失败，标记为需要重新处理')
        
        await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 50)
        
        return {
          success: true,
          message: 'AI服务查询失败，已重置状态，请重新提交',
          status: 'processing',
          needResubmit: true
        }
      }
      
    } else {
      // 没有AI任务ID或不在AI分析阶段
      console.log('⚠️ 没有AI任务ID或不在AI分析阶段，重置状态')
      
      await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 50)
      
      return {
        success: true,
        message: '已重置报告状态，请重新提交',
        status: 'processing',
        needResubmit: true
      }
    }
    
  } catch (error) {
    console.error(`恢复报告失败: ${reportId}`, error)
    
    return {
      success: false,
      error: error.message || '恢复失败'
    }
  }
}

/**
 * 更新报告状态
 */
async function updateReportStatus(reportId, status, stage, progress, reportFiles = null, errorMessage = null) {
  const updateData = {
    status: status,
    currentStep: stage,
    progress: progress,
    'processing.status': status,
    'processing.currentStage': stage,
    'processing.progress': progress,
    'processing.updatedAt': new Date(),
    'metadata.updatedAt': new Date()
  }

  if (errorMessage) {
    updateData.errorMessage = errorMessage
    updateData['processing.errorMessage'] = errorMessage
  }

  if (status === 'completed' || status === 'failed') {
    updateData['processing.endTime'] = new Date()
    updateData['metadata.completedAt'] = new Date()
  }

  if (reportFiles) {
    updateData.reportFiles = reportFiles
    updateData['output.reportFiles'] = reportFiles
    updateData['output.summary'] = '报告生成完成'
  }

  await db.collection('reports').doc(reportId).update({
    data: updateData
  })
}

/**
 * 生成报告文件
 */
async function generateReportFiles(analysisResult, reportId, reportType) {
  // 这里复用现有的报告生成逻辑
  // 为了简化，先返回一个基本结构
  // 实际实现时需要从 processReportAsync 中复制相关代码
  
  console.log(`📄 生成报告文件: ${reportId}`)
  
  // TODO: 实现具体的报告文件生成逻辑
  // 可以从 processReportAsync/index.js 中的 generateReportFiles 函数复制过来
  
  return {
    json: {
      fileId: `${reportId}_analysis.json`,
      downloadUrl: `temp_url_${reportId}.json`
    },
    pdf: {
      fileId: `${reportId}_report.pdf`, 
      downloadUrl: `temp_url_${reportId}.pdf`
    },
    word: {
      fileId: `${reportId}_report.docx`,
      downloadUrl: `temp_url_${reportId}.docx`
    }
  }
}
