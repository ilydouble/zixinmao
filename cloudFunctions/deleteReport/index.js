const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 删除报告云函数
 * 可以删除任何状态的报告（包括已完成、失败、处理中）
 */
exports.main = async (event, context) => {
  const { reportId } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    console.log(`用户 ${OPENID} 请求删除报告: ${reportId}`)
    
    // 1. 验证报告存在且属于当前用户
    const reportDoc = await db.collection('reports').doc(reportId).get()

    if (!reportDoc.data) {
      console.log(`报告不存在: ${reportId}`)
      return {
        success: false,
        error: '报告不存在'
      }
    }

    const report = reportDoc.data
    console.log(`报告数据:`, {
      reportId: reportId,
      userId: report.userId,
      status: report.status,
      reportType: report.reportType
    })

    if (report.userId !== OPENID) {
      console.log(`用户权限检查失败: 报告用户=${report.userId}, 当前用户=${OPENID}`)
      return {
        success: false,
        error: '无权操作此报告'
      }
    }
    
    // 2. 删除相关的云存储文件
    await deleteReportFiles(report)
    
    // 3. 删除报告记录
    await db.collection('reports').doc(reportId).remove()
    
    console.log(`报告 ${reportId} 已成功删除`)
    
    return {
      success: true,
      message: '报告已删除',
      reportId: reportId
    }
    
  } catch (error) {
    console.error('删除报告失败:', error)
    return {
      success: false,
      error: error.message || '删除报告失败'
    }
  }
}

/**
 * 删除报告相关的云存储文件
 */
async function deleteReportFiles(report) {
  try {
    const filesToDelete = []

    // 收集需要删除的文件

    // 1. 原始上传文件
    if (report.input?.fileId) {
      filesToDelete.push(report.input.fileId)
    }
    if (report.input?.cloudPath) {
      filesToDelete.push(report.input.cloudPath)
    }

    // 2. 报告文件 - 新结构
    if (report.output?.reportFiles) {
      const reportFiles = report.output.reportFiles
      
      if (reportFiles.json?.fileId) {
        filesToDelete.push(reportFiles.json.fileId)
      }
      if (reportFiles.json?.cloudPath) {
        filesToDelete.push(reportFiles.json.cloudPath)
      }
      
      if (reportFiles.pdf?.fileId) {
        filesToDelete.push(reportFiles.pdf.fileId)
      }
      if (reportFiles.pdf?.cloudPath) {
        filesToDelete.push(reportFiles.pdf.cloudPath)
      }
      
      if (reportFiles.html?.fileId) {
        filesToDelete.push(reportFiles.html.fileId)
      }
      if (reportFiles.html?.cloudPath) {
        filesToDelete.push(reportFiles.html.cloudPath)
      }
      
      if (reportFiles.word?.fileId) {
        filesToDelete.push(reportFiles.word.fileId)
      }
      if (reportFiles.word?.cloudPath) {
        filesToDelete.push(reportFiles.word.cloudPath)
      }

      // 兼容旧字段名
      if (reportFiles.jsonUrl) {
        filesToDelete.push(reportFiles.jsonUrl)
      }
      if (reportFiles.pdfUrl) {
        filesToDelete.push(reportFiles.pdfUrl)
      }
      if (reportFiles.htmlUrl) {
        filesToDelete.push(reportFiles.htmlUrl)
      }
    }

    // 3. 旧结构的报告文件
    if (report.reportFiles) {
      if (report.reportFiles.json?.fileId) {
        filesToDelete.push(report.reportFiles.json.fileId)
      }
      if (report.reportFiles.pdf?.fileId) {
        filesToDelete.push(report.reportFiles.pdf.fileId)
      }
      if (report.reportFiles.html?.fileId) {
        filesToDelete.push(report.reportFiles.html.fileId)
      }
      if (report.reportFiles.word?.fileId) {
        filesToDelete.push(report.reportFiles.word.fileId)
      }
    }

    // 去重
    const uniqueFiles = [...new Set(filesToDelete)].filter(f => f)

    console.log(`准备删除 ${uniqueFiles.length} 个文件:`, uniqueFiles)

    // 批量删除文件
    if (uniqueFiles.length > 0) {
      try {
        await cloud.deleteFile({
          fileList: uniqueFiles
        })
        console.log(`已批量删除 ${uniqueFiles.length} 个文件`)
      } catch (error) {
        console.error('批量删除文件失败，尝试逐个删除:', error)

        // 如果批量删除失败，逐个删除
        for (const fileId of uniqueFiles) {
          if (fileId) {
            try {
              await cloud.deleteFile({
                fileList: [fileId]
              })
              console.log(`已删除文件: ${fileId}`)
            } catch (error) {
              console.error(`删除文件失败: ${fileId}`, error)
              // 继续删除其他文件，不中断流程
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('删除报告文件失败:', error)
    // 不抛出错误，继续删除报告记录
  }
}

