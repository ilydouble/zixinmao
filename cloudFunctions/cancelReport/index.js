const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { reportId } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    console.log(`用户 ${OPENID} 请求终止报告: ${reportId}`)
    
    // 1. 验证报告存在且属于当前用户
    const reportDoc = await db.collection('reports').doc(reportId).get()

    if (!reportDoc.data) {
      console.log(`报告不存在: ${reportId}`)
      throw new Error('报告不存在')
    }

    const report = reportDoc.data
    console.log(`报告数据:`, {
      reportId: reportId,
      userId: report.userId,
      status: report.status,
      processingStatus: report.processing?.status,
      currentStep: report.currentStep,
      progress: report.progress
    })

    if (report.userId !== OPENID) {
      console.log(`用户权限检查失败: 报告用户=${report.userId}, 当前用户=${OPENID}`)
      throw new Error('无权操作此报告')
    }
    
    // 2. 检查报告状态，只有处理中的报告才能终止
    // 兼容新旧数据结构
    const reportStatus = report.status || report.processing?.status
    const processingStatus = report.processing?.status

    console.log(`报告状态检查: status=${reportStatus}, processing.status=${processingStatus}`)

    if (reportStatus !== 'processing' && reportStatus !== 'pending' &&
        processingStatus !== 'processing' && processingStatus !== 'pending') {
      throw new Error(`只有处理中的报告才能终止，当前状态: ${reportStatus || processingStatus || 'unknown'}`)
    }
    
    // 3. 删除相关的云存储文件（如果有）
    await deleteReportFiles(report)
    
    // 4. 删除报告记录
    await db.collection('reports').doc(reportId).remove()
    
    console.log(`报告 ${reportId} 已成功终止并删除`)
    
    return {
      success: true,
      message: '报告已终止并删除',
      reportId: reportId
    }
    
  } catch (error) {
    console.error('终止报告失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 删除报告相关的云存储文件
 */
async function deleteReportFiles(report) {
  try {
    const filesToDelete = []

    // 收集需要删除的文件 - 兼容新旧数据结构

    // 1. 原始上传文件
    if (report.input?.fileId) {
      filesToDelete.push(report.input.fileId)
    }
    if (report.input?.cloudPath) {
      filesToDelete.push(report.input.cloudPath)
    }

    // 2. 报告文件 - 新结构
    if (report.reportFiles) {
      if (report.reportFiles.json?.fileId) {
        filesToDelete.push(report.reportFiles.json.fileId)
      }
      if (report.reportFiles.pdf?.fileId) {
        filesToDelete.push(report.reportFiles.pdf.fileId)
      }
      if (report.reportFiles.word?.fileId) {
        filesToDelete.push(report.reportFiles.word.fileId)
      }
    }

    // 3. 报告文件 - 旧结构
    if (report.output?.reportFiles) {
      const { jsonUrl, pdfUrl, htmlUrl, json, pdf, word } = report.output.reportFiles

      // URL格式的文件
      if (jsonUrl) filesToDelete.push(extractCloudPath(jsonUrl))
      if (pdfUrl) filesToDelete.push(extractCloudPath(pdfUrl))
      if (htmlUrl) filesToDelete.push(extractCloudPath(htmlUrl))

      // fileId格式的文件
      if (json?.fileId) filesToDelete.push(json.fileId)
      if (pdf?.fileId) filesToDelete.push(pdf.fileId)
      if (word?.fileId) filesToDelete.push(word.fileId)
    }

    console.log(`准备删除 ${filesToDelete.length} 个文件:`, filesToDelete)

    // 批量删除文件
    if (filesToDelete.length > 0) {
      try {
        await cloud.deleteFile({
          fileList: filesToDelete
        })
        console.log(`已批量删除 ${filesToDelete.length} 个文件`)
      } catch (error) {
        console.error('批量删除文件失败，尝试逐个删除:', error)

        // 如果批量删除失败，逐个删除
        for (const fileId of filesToDelete) {
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

/**
 * 从云存储URL中提取文件路径
 */
function extractCloudPath(url) {
  if (!url || typeof url !== 'string') return null
  
  // 如果已经是路径格式，直接返回
  if (!url.startsWith('cloud://')) return url
  
  try {
    // 从 cloud://env.bucket/path 格式中提取 path
    const parts = url.split('/')
    if (parts.length >= 3) {
      return parts.slice(3).join('/')
    }
  } catch (error) {
    console.error('解析云存储路径失败:', error)
  }
  
  return null
}
