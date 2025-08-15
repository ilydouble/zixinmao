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
      throw new Error('报告不存在')
    }
    
    const report = reportDoc.data
    
    if (report.userId !== OPENID) {
      throw new Error('无权操作此报告')
    }
    
    // 2. 检查报告状态，只有处理中的报告才能终止
    if (report.processing.status !== 'processing' && report.processing.status !== 'pending') {
      throw new Error('只有处理中的报告才能终止')
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
    
    // 收集需要删除的文件
    if (report.input && report.input.cloudPath) {
      filesToDelete.push(report.input.cloudPath)
    }
    
    if (report.output && report.output.reportFiles) {
      const { jsonUrl, pdfUrl, htmlUrl } = report.output.reportFiles
      if (jsonUrl) filesToDelete.push(extractCloudPath(jsonUrl))
      if (pdfUrl) filesToDelete.push(extractCloudPath(pdfUrl))
      if (htmlUrl) filesToDelete.push(extractCloudPath(htmlUrl))
    }
    
    // 批量删除文件
    for (const filePath of filesToDelete) {
      if (filePath) {
        try {
          await cloud.deleteFile({
            fileList: [filePath]
          })
          console.log(`已删除文件: ${filePath}`)
        } catch (error) {
          console.error(`删除文件失败: ${filePath}`, error)
          // 继续删除其他文件，不中断流程
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
