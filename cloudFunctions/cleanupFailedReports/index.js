const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 清理历史失败报告记录
 * 可以手动调用或定时执行
 */
exports.main = async (event, context) => {
  const { daysOld = 7, dryRun = false } = event
  
  try {
    console.log(`开始清理失败报告记录，清理${daysOld}天前的失败记录，试运行模式: ${dryRun}`)
    
    // 计算时间阈值
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    // 查询失败的报告记录
    const failedReports = await db.collection('reports')
      .where({
        status: 'failed'
      })
      .where({
        'metadata.createdAt': db.command.lt(cutoffDate)
      })
      .limit(100) // 每次最多处理100条
      .get()
    
    console.log(`找到 ${failedReports.data.length} 条失败记录需要清理`)
    
    if (failedReports.data.length === 0) {
      return {
        success: true,
        message: '没有需要清理的失败记录',
        cleanedCount: 0
      }
    }
    
    let cleanedCount = 0
    let errors = []
    
    for (const report of failedReports.data) {
      try {
        const reportId = report._id
        
        if (dryRun) {
          console.log(`[试运行] 将清理报告: ${reportId}`)
          cleanedCount++
          continue
        }
        
        // 实际清理
        await cleanupFailedReport(reportId, report.input?.fileId, '定时清理历史失败记录')
        cleanedCount++
        
        console.log(`已清理报告: ${reportId}`)
        
      } catch (error) {
        console.error(`清理报告失败: ${report._id}`, error)
        errors.push({
          reportId: report._id,
          error: error.message
        })
      }
    }
    
    const result = {
      success: true,
      message: `清理完成，处理了 ${cleanedCount} 条记录`,
      cleanedCount: cleanedCount,
      totalFound: failedReports.data.length,
      errors: errors,
      dryRun: dryRun
    }
    
    console.log('清理结果:', result)
    return result
    
  } catch (error) {
    console.error('清理失败报告时发生错误:', error)
    
    return {
      success: false,
      message: `清理失败: ${error.message}`,
      error: error.message
    }
  }
}

/**
 * 清理失败的报告记录和相关文件
 */
async function cleanupFailedReport(reportId, fileId, reason) {
  try {
    console.log(`清理失败报告: ${reportId}, 原因: ${reason}`)

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
        cleanupTime: new Date(),
        cleanupReason: reason
      }
    })

  } catch (error) {
    console.error(`清理失败报告时发生错误: ${reportId}`, error)
    throw error
  }
}
