const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 处理AI分析完成的回调通知
 * 这是一个可选的优化方案，可以让AI服务主动通知分析完成
 */
exports.main = async (event, context) => {
  const { taskId, reportId, success, analysisResult, errorMessage, processingTime } = event
  
  try {
    console.log(`收到AI分析回调: reportId=${reportId}, taskId=${taskId}, success=${success}`)
    
    if (success && analysisResult) {
      // 分析成功
      console.log(`AI分析成功: ${reportId}`)
      
      // 更新报告状态
      await db.collection('reports').doc(reportId).update({
        data: {
          'algorithm.responseTime': new Date(),
          'algorithm.processingTime': processingTime,
          'algorithm.taskCompleted': true,
          'algorithm.callbackReceived': true,
          'metadata.updatedAt': new Date()
        }
      })
      
      // 继续处理报告生成
      try {
        // 生成报告文件
        const reportFiles = await generateReportFiles(analysisResult, reportId)
        
        // 更新完成状态
        await db.collection('reports').doc(reportId).update({
          data: {
            status: 'completed',
            currentStep: 'COMPLETED',
            progress: 100,
            reportFiles: reportFiles,
            'metadata.updatedAt': new Date(),
            'metadata.completedAt': new Date()
          }
        })
        
        console.log(`报告处理完成: ${reportId}`)
        
        return {
          success: true,
          message: '回调处理成功，报告已完成'
        }
        
      } catch (error) {
        console.error(`生成报告文件失败: ${reportId}`, error)

        // 生成报告失败时删除记录
        await cleanupFailedReport(reportId, null, `生成报告失败: ${error.message}`)

        throw error
      }
      
    } else {
      // 分析失败时删除记录
      console.error(`AI分析失败: ${reportId}, 错误: ${errorMessage}`)

      await cleanupFailedReport(reportId, null, errorMessage || 'AI分析失败')

      return {
        success: false,
        message: '分析失败，已删除记录'
      }
    }
    
  } catch (error) {
    console.error(`处理AI分析回调失败: ${reportId}`, error)
    
    // 回调处理失败时删除记录
    try {
      await cleanupFailedReport(reportId, null, `回调处理失败: ${error.message}`)
    } catch (cleanupError) {
      console.error(`清理失败记录时发生错误: ${reportId}`, cleanupError)
    }
    
    throw error
  }
}

/**
 * 生成报告文件
 */
async function generateReportFiles(analysisResult, reportId) {
  // 这里实现报告文件生成逻辑
  // 可以生成PDF、Word等格式的报告
  
  const reportFiles = []
  
  try {
    // 生成JSON格式的分析结果文件
    const jsonFileName = `analysis_${reportId}_${Date.now()}.json`
    const jsonFileId = await uploadAnalysisResult(analysisResult, jsonFileName)
    
    reportFiles.push({
      type: 'json',
      fileName: jsonFileName,
      fileId: jsonFileId,
      description: 'AI分析结果(JSON格式)'
    })
    
    // 可以在这里添加更多格式的报告生成
    // 例如：PDF报告、Excel报告等
    
    console.log(`报告文件生成完成: ${reportId}, 文件数量: ${reportFiles.length}`)
    
    return reportFiles
    
  } catch (error) {
    console.error(`生成报告文件失败: ${reportId}`, error)
    throw error
  }
}

/**
 * 上传分析结果文件
 */
async function uploadAnalysisResult(analysisResult, fileName) {
  try {
    const fileContent = JSON.stringify(analysisResult, null, 2)
    const buffer = Buffer.from(fileContent, 'utf8')
    
    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `reports/analysis/${fileName}`,
      fileContent: buffer
    })
    
    console.log(`分析结果文件上传成功: ${fileName}, fileID: ${uploadResult.fileID}`)
    
    return uploadResult.fileID
    
  } catch (error) {
    console.error(`上传分析结果文件失败: ${fileName}`, error)
    throw error
  }
}

/**
 * 清理失败的报告记录和相关文件
 */
async function cleanupFailedReport(reportId, fileId, errorMessage) {
  try {
    console.log(`开始清理失败的报告: ${reportId}, 错误: ${errorMessage}`)

    // 1. 删除上传的原始文件
    if (fileId) {
      try {
        await cloud.deleteFile({
          fileList: [fileId]
        })
        console.log(`已删除原始文件: ${fileId}`)
      } catch (deleteError) {
        console.warn(`删除原始文件失败: ${fileId}`, deleteError)
      }
    }

    // 2. 删除可能已生成的报告文件
    try {
      const reportDoc = await db.collection('reports').doc(reportId).get()
      if (reportDoc.exists && reportDoc.data && reportDoc.data.output && reportDoc.data.output.reportFiles) {
        const reportFiles = reportDoc.data.output.reportFiles
        const filesToDelete = []

        if (reportFiles.json && reportFiles.json.fileId) {
          filesToDelete.push(reportFiles.json.fileId)
        }
        if (reportFiles.pdf && reportFiles.pdf.fileId) {
          filesToDelete.push(reportFiles.pdf.fileId)
        }
        if (reportFiles.word && reportFiles.word.fileId) {
          filesToDelete.push(reportFiles.word.fileId)
        }

        if (filesToDelete.length > 0) {
          await cloud.deleteFile({
            fileList: filesToDelete
          })
          console.log(`已删除报告文件: ${filesToDelete.length} 个`)
        }
      }
    } catch (cleanupError) {
      console.warn(`清理报告文件失败: ${reportId}`, cleanupError)
    }

    // 3. 删除数据库记录
    await db.collection('reports').doc(reportId).remove()
    console.log(`已删除报告记录: ${reportId}`)

    // 4. 记录清理日志
    await db.collection('cleanup_logs').add({
      data: {
        reportId: reportId,
        fileId: fileId,
        errorMessage: errorMessage,
        cleanupTime: new Date(),
        cleanupReason: '处理失败自动清理'
      }
    })

  } catch (error) {
    console.error(`清理失败报告时发生错误: ${reportId}`, error)
  }
}
