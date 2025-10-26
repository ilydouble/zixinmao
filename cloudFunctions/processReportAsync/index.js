const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// AI分析服务配置
const AI_ANALYSIS_SERVICE = {
  url: process.env.AI_ANALYSIS_SERVICE_URL || 'http://115.190.121.59:8005',
  timeout: 300000 // 5分钟超时
}

exports.main = async (event, context) => {
  const { reportId, fileId, reportType } = event
  
  try {
    console.log(`🚀 开始异步处理报告: ${reportId}, 类型: ${reportType}`)
    console.log(`📋 AI服务配置: ${AI_ANALYSIS_SERVICE.url}`)

    // 1. 更新状态为处理中
    console.log(`📊 更新状态为处理中...`)
    await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 30)

    // 2. 下载文件
    console.log(`📁 下载文件: ${fileId}`)
    const fileBuffer = await downloadFile(fileId)
    console.log(`📁 文件下载完成，大小: ${fileBuffer.length} 字节`)

    // 3. 准备AI分析，但不在主线程中等待
    console.log(`🤖 准备提交AI分析任务...`)
    await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 50)

    // 异步启动AI分析，不等待结果
    console.log(`🚀 异步启动AI分析任务: ${reportId}`)

    // 使用 setTimeout 而不是 setImmediate，确保异步任务能正确执行
    setTimeout(async () => {
      try {
        console.log(`🤖 [异步任务] 开始AI分析: ${reportId}`)

        // 更新状态为AI分析中
        await updateReportStatus(reportId, 'processing', 'AI_ANALYZING', 60)
        console.log(`📊 [异步任务] 状态已更新为AI分析中: ${reportId}`)

        const analysisStartTime = Date.now()
        const aiResult = await analyzeWithAI(fileBuffer, reportType, reportId)
        const analysisEndTime = Date.now()

        console.log(`🤖 [异步任务] AI分析完成: ${reportId}, 耗时: ${analysisEndTime - analysisStartTime}ms`)

        // 🔧 提取分析结果和HTML报告
        const analysisResult = aiResult.analysisResult || aiResult  // 兼容旧格式
        const htmlReport = aiResult.htmlReport || null

        console.log(`📊 [异步任务] 分析结果提取完成`)
        console.log(`  - JSON数据: ${analysisResult ? '✅' : '❌'}`)
        console.log(`  - HTML报告: ${htmlReport ? `✅ (${htmlReport.length}字符)` : '❌'}`)

        // 4. 生成报告文件（JSON + HTML）
        console.log(`📄 [异步任务] 开始生成报告文件: ${reportId}`)
        await updateReportStatus(reportId, 'processing', 'GENERATING_REPORTS', 80)
        const reportFiles = await generateReportFiles(analysisResult, reportId, reportType, htmlReport)
        console.log(`📄 [异步任务] 报告文件生成完成: ${reportId}`)

        // 5. 更新完成状态
        console.log(`✅ [异步任务] 更新完成状态: ${reportId}`)
        await updateReportStatus(reportId, 'completed', 'COMPLETED', 100, reportFiles)

        console.log(`🎉 [异步任务] 报告处理完成: ${reportId}`)

      } catch (error) {
        console.error(`❌ [异步任务] AI分析失败: ${reportId}`, {
          message: error.message,
          stack: error.stack
        })

        // 🔧 修复：不再删除报告记录，而是标记为失败状态
        // 这样小程序端可以检测到失败状态并显示友好的错误信息
        await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, error.message)

        // 可选：删除上传的原始文件以节省存储空间
        if (fileId) {
          try {
            await cloud.deleteFile({
              fileList: [fileId]
            })
            console.log(`已删除失败报告的原始文件: ${fileId}`)
          } catch (deleteError) {
            console.warn(`删除原始文件失败: ${fileId}`, deleteError)
          }
        }
      }
    }, 100) // 100ms 延迟启动

    // 立即返回，不等待AI分析完成
    console.log(`✅ 任务已提交，异步处理中: ${reportId}`)

    return {
      success: true,
      reportId: reportId,
      message: '文件处理完成，AI分析已启动，请稍后查看结果'
    }
    
  } catch (error) {
    console.error(`报告处理失败: ${reportId}`, error)

    // 🔧 修复：不再删除报告记录，而是标记为失败状态
    try {
      await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, error.message)

      // 可选：删除上传的原始文件以节省存储空间
      if (fileId) {
        try {
          await cloud.deleteFile({
            fileList: [fileId]
          })
          console.log(`已删除失败报告的原始文件: ${fileId}`)
        } catch (deleteError) {
          console.warn(`删除原始文件失败: ${fileId}`, deleteError)
        }
      }
    } catch (updateError) {
      console.error(`更新失败状态时出错: ${reportId}`, updateError)
    }

    return {
      success: false,
      reportId: reportId,
      error: error.message
    }
  }
}

/**
 * 下载文件
 */
async function downloadFile(fileId) {
  try {
    const result = await cloud.downloadFile({
      fileID: fileId
    })
    return result.fileContent
  } catch (error) {
    throw new Error(`文件下载失败: ${error.message}`)
  }
}

/**
 * 检测文件MIME类型
 */
function detectMimeType(fileId) {
  try {
    // 从文件ID或路径中提取扩展名
    const extension = fileId.toLowerCase().split('.').pop()

    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    }

    return mimeTypes[extension] || 'application/pdf' // 默认为PDF
  } catch (error) {
    console.warn(`无法检测文件类型: ${fileId}`, error)
    return 'application/pdf'
  }
}

/**
 * 使用AI分析文件
 */
async function analyzeWithAI(fileBuffer, reportType, reportId) {
  try {
    // 获取报告记录以获取自定义提示词（如果有）
    const reportDoc = await db.collection('reports').doc(reportId).get()
    const customPrompt = reportDoc.data.algorithm?.prompt || null
    const fileName = reportDoc.data.input?.fileName || 'document.pdf'

    // 将文件转换为base64
    const fileBase64 = fileBuffer.toString('base64')

    // 检测文件MIME类型
    const mimeType = detectMimeType(fileName) || 'application/pdf'
    console.log(`检测到文件类型: ${mimeType}`)

    // 构建请求数据 - 传递base64给后端，后端会自动调用PDF转Markdown
    const requestData = {
      file_base64: fileBase64,
      mime_type: mimeType,
      report_type: reportType,
      custom_prompt: customPrompt,
      file_name: fileName
    }

    // 更新算法调用信息
    await db.collection('reports').doc(reportId).update({
      data: {
        'algorithm.requestTime': new Date(),
        'algorithm.requestId': `req_${Date.now()}`,
        'metadata.updatedAt': new Date()
      }
    })

    console.log(`开始调用AI分析服务: ${reportId}, 类型: ${reportType}`)
    console.log(`文件: ${fileName}, MIME: ${mimeType}`)

    // 调用AI分析服务同步接口（后端会自动处理PDF转Markdown）
    const response = await axios.post(
      `${AI_ANALYSIS_SERVICE.url}/analyze/sync`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5分钟超时，足够AI处理
      }
    )

    // 更新响应时间
    await db.collection('reports').doc(reportId).update({
      data: {
        'algorithm.responseTime': new Date(),
        'metadata.updatedAt': new Date()
      }
    })

    if (response.status === 200 && response.data.success) {
      const analysisResult = response.data.analysis_result
      const htmlReport = response.data.html_report  // 🔧 提取HTML报告

      console.log(`AI分析完成: ${reportId}, 处理时间: ${response.data.processing_time}s`)
      console.log(`HTML报告: ${htmlReport ? '已生成' : '未生成'}, 长度: ${htmlReport ? htmlReport.length : 0}`)

      // 保存处理时间信息
      await db.collection('reports').doc(reportId).update({
        data: {
          'algorithm.processingTime': response.data.processing_time,
          'algorithm.serviceRequestId': response.data.request_id,
          'metadata.updatedAt': new Date()
        }
      })

      // 返回分析结果和HTML报告
      return {
        analysisResult: analysisResult,
        htmlReport: htmlReport  // 🔧 返回HTML报告
      }
    } else {
      const errorMsg = response.data.error_message || 'AI分析服务返回失败'
      throw new Error(errorMsg)
    }



  } catch (error) {
    console.error(`AI分析失败: ${reportId}`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    })

    // 检查重试次数，如果超过最大重试次数则删除记录
    try {
      const reportDoc = await db.collection('reports').doc(reportId).get()

      if (!reportDoc.exists) {
        console.log(`报告记录不存在，可能已被删除: ${reportId}`)
        throw new Error(`报告记录不存在: ${error.message}`)
      }

      const currentRetryCount = reportDoc.data?.algorithm?.retryCount || 0
      const maxRetries = 2 // 最大重试2次

      if (currentRetryCount >= maxRetries) {
        console.log(`AI分析重试次数已达上限，删除报告记录: ${reportId}`)
        // 不再重试，直接抛出错误让上层处理删除
        throw new Error(`AI分析失败且重试次数已达上限: ${error.message}`)
      } else {
        // 更新重试次数
        await db.collection('reports').doc(reportId).update({
          data: {
            'algorithm.retryCount': db.command.inc(1),
            'algorithm.lastError': error.message,
            'algorithm.errorDetails': {
              code: error.code,
              status: error.response?.status,
              url: error.config?.url,
              timestamp: new Date()
            },
            'metadata.updatedAt': new Date()
          }
        })

        throw new Error(`AI分析失败: ${error.message}`)
      }
    } catch (dbError) {
      console.error(`访问数据库时发生错误: ${reportId}`, dbError)
      // 如果数据库访问失败，直接抛出原始错误
      throw new Error(`AI分析失败: ${error.message}`)
    }
  }
}



/**
 * 生成报告文件
 */
async function generateReportFiles(analysisResult, reportId, reportType, htmlReport = null) {
  try {
    const reportFiles = {}

    // 1. 生成JSON文件
    const jsonContent = JSON.stringify(analysisResult, null, 2)
    const jsonPath = `reports/${reportType}/${reportId}/analysis.json`

    const jsonUploadResult = await cloud.uploadFile({
      cloudPath: jsonPath,
      fileContent: Buffer.from(jsonContent, 'utf8')
    })

    reportFiles.jsonUrl = jsonUploadResult.fileID

    // 2. 生成HTML报告
    // ⚠️ 必须使用后端生成的HTML报告，如果后端生成失败则报错
    if (!htmlReport) {
      console.error(`❌ 后端未生成HTML报告，reportId: ${reportId}`)
      throw new Error('后端HTML报告生成失败，请检查后端服务日志')
    }

    const htmlContent = htmlReport
    const htmlPath = `reports/${reportType}/${reportId}/report.html`

    console.log(`📄 使用后端生成的HTML报告, 长度: ${htmlContent.length} 字符`)

    const htmlUploadResult = await cloud.uploadFile({
      cloudPath: htmlPath,
      fileContent: Buffer.from(htmlContent, 'utf8')
    })

    reportFiles.htmlUrl = htmlUploadResult.fileID
    
    // 3. 生成PDF报告（简化版，实际可能需要更复杂的PDF生成）
    const pdfPath = `reports/${reportType}/${reportId}/report.pdf`
    // 这里可以集成PDF生成库，暂时使用HTML内容
    const pdfUploadResult = await cloud.uploadFile({
      cloudPath: pdfPath,
      fileContent: Buffer.from(htmlContent, 'utf8')
    })
    
    reportFiles.pdfUrl = pdfUploadResult.fileID
    
    return reportFiles
    
  } catch (error) {
    throw new Error(`报告文件生成失败: ${error.message}`)
  }
}

/**
 * 更新报告状态
 */
async function updateReportStatus(reportId, status, stage, progress, reportFiles = null, errorMessage = null) {
  console.log(`📊 [状态更新] 开始更新报告状态: ${reportId}`, {
    status,
    stage,
    progress,
    hasReportFiles: !!reportFiles,
    errorMessage
  })

  const updateData = {
    // 新的扁平化结构，兼容前端轮询
    status: status,
    currentStep: stage,
    progress: progress,
    // 保留旧结构以兼容
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
    console.log(`📄 [状态更新] 包含报告文件: ${Object.keys(reportFiles).length} 个`)
  }

  try {
    await db.collection('reports').doc(reportId).update({
      data: updateData
    })
    console.log(`✅ [状态更新] 状态更新成功: ${reportId} -> ${status}`)
  } catch (error) {
    console.error(`❌ [状态更新] 状态更新失败: ${reportId}`, error)
    throw error
  }
}


