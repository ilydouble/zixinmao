const cloud = require('wx-server-sdk')
const axios = require('axios')
const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')

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

    // 🔧 修复：使用 setImmediate 替代 setTimeout，并增强错误处理
    setImmediate(async () => {
      let analysisStartTime = Date.now()
      let timeoutId = null
      
      try {
        console.log(`🤖 [异步任务] 开始AI分析: ${reportId}`)

        // 更新状态为AI分析中
        await updateReportStatus(reportId, 'processing', 'AI_ANALYZING', 60)
        console.log(`📊 [异步任务] 状态已更新为AI分析中: ${reportId}`)

        // 🔧 增加超时保护机制 - 8分钟超时
        const AI_ANALYSIS_TIMEOUT = 8 * 60 * 1000
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`AI分析超时 (${AI_ANALYSIS_TIMEOUT / 1000}秒)`))
          }, AI_ANALYSIS_TIMEOUT)
        })

        // 🔧 使用 Promise.race 实现超时控制
        analysisStartTime = Date.now()
        const aiResult = await Promise.race([
          analyzeWithAI(fileBuffer, reportType, reportId),
          timeoutPromise
        ])
        
        // 清除超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        const analysisEndTime = Date.now()
        console.log(`🤖 [异步任务] AI分析完成: ${reportId}, 耗时: ${analysisEndTime - analysisStartTime}ms`)

        // 🔧 增强结果验证
        if (!aiResult) {
          throw new Error('AI分析返回空结果')
        }

        // 🔧 提取分析结果、HTML报告和PDF报告
        const analysisResult = aiResult.analysisResult || aiResult  // 兼容旧格式
        const htmlReport = aiResult.htmlReport || null
        const pdfReport = aiResult.pdfReport || null

        console.log(`📊 [异步任务] 分析结果提取完成`)
        console.log(`  - JSON数据: ${analysisResult ? '✅' : '❌'}`)
        console.log(`  - HTML报告: ${htmlReport ? `✅ (${htmlReport.length}字符)` : '❌'}`)
        console.log(`  - PDF报告: ${pdfReport ? `✅ (${pdfReport.length}字符)` : '❌'}`)

        // 🔧 验证关键数据
        if (!analysisResult) {
          throw new Error('AI分析结果为空，无法生成报告')
        }

        // 4. 生成报告文件（JSON + HTML + PDF）
        console.log(`📄 [异步任务] 开始生成报告文件: ${reportId}`)
        await updateReportStatus(reportId, 'processing', 'GENERATING_REPORTS', 80)
        const reportFiles = await generateReportFiles(analysisResult, reportId, reportType, htmlReport, pdfReport)
        console.log(`📄 [异步任务] 报告文件生成完成: ${reportId}`)

        // 5. 更新完成状态
        console.log(`✅ [异步任务] 更新完成状态: ${reportId}`)
        await updateReportStatus(reportId, 'completed', 'COMPLETED', 100, reportFiles, analysisResult, htmlReport)

        console.log(`🎉 [异步任务] 报告处理完成: ${reportId}`)

      } catch (error) {
        // 清除超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        const processingTime = Date.now() - analysisStartTime
        console.error(`❌ [异步任务] AI分析失败: ${reportId}`, {
          message: error.message,
          stack: error.stack,
          processingTime: `${processingTime}ms`
        })

        // 🔧 增强错误处理：重试机制
        try {
          // 检查是否是超时错误或网络错误，可以重试
          const isRetryableError = error.message.includes('超时') ||
                                 error.message.includes('timeout') ||
                                 error.message.includes('ECONNRESET') ||
                                 error.message.includes('ENOTFOUND') ||
                                 error.code === 'ECONNRESET'

          if (isRetryableError) {
            // 获取当前重试次数
            const reportDoc = await db.collection('reports').doc(reportId).get()
            const currentRetryCount = reportDoc.data?.algorithm?.retryCount || 0
            const maxRetries = 2

            if (currentRetryCount < maxRetries) {
              console.log(`🔄 [异步任务] 检测到可重试错误，准备重试: ${reportId} (${currentRetryCount + 1}/${maxRetries})`)
              
              // 更新重试次数和状态
              await db.collection('reports').doc(reportId).update({
                data: {
                  'algorithm.retryCount': db.command.inc(1),
                  'algorithm.lastError': error.message,
                  'processing.currentStage': 'RETRYING',
                  'processing.progress': 30,
                  'metadata.updatedAt': new Date()
                }
              })

              // 延迟后重试
              setTimeout(async () => {
                console.log(`🔄 [异步任务] 开始重试: ${reportId}`)
                // 递归调用自身进行重试
                setImmediate(arguments.callee)
              }, 10000) // 10秒后重试
              
              return // 不标记为失败，等待重试
            }
          }

          // 🔧 修复：标记为失败状态，保留错误信息
          await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, null, null, error.message)
          console.log(`❌ [异步任务] 报告已标记为失败: ${reportId}`)

        } catch (updateError) {
          console.error(`❌ [异步任务] 更新失败状态时出错: ${reportId}`, updateError)
        }

        // 可选：删除上传的原始文件以节省存储空间
        if (fileId) {
          try {
            await cloud.deleteFile({
              fileList: [fileId]
            })
            console.log(`🗑️ 已删除失败报告的原始文件: ${fileId}`)
          } catch (deleteError) {
            console.warn(`⚠️ 删除原始文件失败: ${fileId}`, deleteError)
          }
        }
      }
    })

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
      await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, null, null, error.message)

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


// 清洗文件名中的非法字符
function sanitizeName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 40) // 避免过长
}

function tsString(d = new Date()) {
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const HH = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`
}


function toAscii(s) {
  return String(s || '').replace(/[^0-9a-zA-Z_.-]/g, '')
}


/**
 * 生成授权PDF并上传到云存储，返回下载链接
 */
async function generateAuthPDFAndUpload(name, userId) {
  try {
    console.log(`📄 [授权PDF] 开始生成 - 姓名: ${name}, userId: ${userId}`)

    // 构建PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50, pdfVersion: '1.4' })

    // 加载本地中文字体文件
    const localFontPath = path.join(__dirname, 'fonts', 'SourceHanSansCN-Regular.ttf')
    console.log(`📄 [授权PDF] 检查本地字体: ${localFontPath}`)

    if (!fs.existsSync(localFontPath)) {
      const errorMsg = `❌ 字体文件不存在: ${localFontPath}\n请下载中文TTF字体并放置到该路径`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // 获取字体文件大小
    const fontStats = fs.statSync(localFontPath)
    console.log(`� [授权PDF] 字体文件大小: ${fontStats.size} 字节 (${(fontStats.size / 1024 / 1024).toFixed(2)} MB)`)

    // 验证字体文件大小（至少应该大于1MB）
    if (fontStats.size < 1000000) {
      const errorMsg = `❌ 字体文件太小 (${fontStats.size} 字节)，可能不是有效的中文字体文件\n正常的中文字体应该至少 4MB 以上`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // 注册并使用中文字体
    try {
      doc.registerFont('ChineseFont', localFontPath)
      doc.font('ChineseFont')
      console.log('✅ [授权PDF] 中文字体加载成功')
    } catch (e) {
      const errorMsg = `❌ 字体加载失败: ${e.message}\n请确保字体文件是有效的 TTF 格式`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // 先绑定流监听，收集PDF二进制
    const buffers = []
    const pdfBufferPromise = new Promise((resolve, reject) => {
      doc.on('data', (d) => buffers.push(d))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)
    })

    // 生成PDF内容
    doc.fontSize(20).text('授权书', { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(14).text(`授权人：${name || ''}`)
    doc.moveDown(1)
    doc.fontSize(14).text('授权信息：授权在天远数据查询。')

    // 结束并等待缓冲完成
    doc.end()
    const pdfBuffer = await pdfBufferPromise

    // 校验PDF头
    if (pdfBuffer.slice(0, 5).toString() !== '%PDF-') {
      console.warn('⚠️ [授权PDF] PDF 头部异常:', pdfBuffer.slice(0, 10).toString('hex'))
    } else {
      console.log(`✅ [授权PDF] PDF生成成功，大小: ${pdfBuffer.length} 字节`)
    }

    // 上传到云存储
    const openId = userId || (cloud.getWXContext && cloud.getWXContext().OPENID) || 'unknown'
    const safeName = sanitizeName(name) || 'user'
    const filename = `${tsString()}_${safeName}_授权书.pdf`
    const filePath = `auth_file/${openId}/${filename}`

    console.log(`📤 [授权PDF] 上传到云存储: ${filePath}`)
    const uploadRes = await cloud.uploadFile({
      cloudPath: filePath,
      fileContent: pdfBuffer
    })

    const fileID = uploadRes.fileID
    console.log(`✅ [授权PDF] 上传成功, fileID: ${fileID}`)

    // 生成临时访问链接
    const urlRes = await cloud.getTempFileURL({ fileList: [fileID] })
    let tempUrl = (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) || ''

    // 删除URL中的签名参数（?sign=...&t=...），只保留?前面的部分
    if (tempUrl && tempUrl.includes('?')) {
      tempUrl = tempUrl.split('?')[0]
      console.log(`📄 [授权PDF] 已清理URL签名参数`)
    }

    console.log(`✅ [授权PDF] 生成完成, URL: ${tempUrl}`)
    return { fileID, url: tempUrl, cloudPath: filePath }

  } catch (e) {
    console.error('❌ [授权PDF] 生成失败:', e.message)
    console.error('错误堆栈:', e.stack)
    return { fileID: null, url: null, error: e.message }
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
    // 获取客户群体信息，如果为空对象则转换为null
    let customerInfo = reportDoc.data.input?.customerInfo || null
    if (customerInfo && typeof customerInfo === 'object' && Object.keys(customerInfo).length === 0) {
      customerInfo = null
    }

    // 将文件转换为base64
    const fileBase64 = fileBuffer.toString('base64')

    // 检测文件MIME类型
    const mimeType = detectMimeType(fileName) || 'application/pdf'
    console.log(`检测到文件类型: ${mimeType}`)

    // 先生成授权PDF并上传，获取访问链接
    const userId = (reportDoc && reportDoc.data && reportDoc.data.userId) || (cloud.getWXContext && cloud.getWXContext().OPENID) || ''
    const authName = (customerInfo && customerInfo.name) || ''
    console.log(`📄 开始生成授权PDF: 姓名=${authName}, userId=${userId}`)

    const authRes = await generateAuthPDFAndUpload(authName, userId)

    console.log(`📄 授权PDF生成结果:`, {
      success: !!(authRes && authRes.fileID),
      fileID: authRes?.fileID,
      url: authRes?.url,
      cloudPath: authRes?.cloudPath
    })

    if (!authRes || !authRes.url) {
      console.warn('⚠️ 授权PDF生成失败或无访问链接，将继续后续流程')
    } else {
      // 记录到报告文档，便于追踪
      try {
        console.log(`💾 保存授权文件信息到数据库: ${authRes.cloudPath}`)
        await db.collection('reports').doc(reportId).update({
          data: {
            'input.authFile': {
              fileID: authRes.fileID,
              url: authRes.url,
              cloudPath: authRes.cloudPath,
              generatedAt: new Date()
            },
            'metadata.updatedAt': new Date()
          }
        })
        console.log(`✅ 授权文件信息已保存到数据库`)
      } catch (e) {
        console.warn('❌ 记录授权文件信息失败：', e)
      }
    }

    // 构建请求数据 - 传递base64给后端，后端会自动调用PDF转Markdown
    const requestData = {
      file_base64: fileBase64,
      mime_type: mimeType,
      report_type: reportType,
      custom_prompt: customPrompt,
      file_name: fileName,
      auth_file: (authRes && authRes.url) || null,
      // 提取个人信息到顶层字段
      name: customerInfo?.name || null,
      id_card: customerInfo?.idCard || null,
      mobile_no: customerInfo?.mobileNo || null,
      // 添加客户群体信息
      customer_info: customerInfo
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

    // 🔧 修复：增强AI分析服务调用的稳定性
    const response = await axios.post(
      `${AI_ANALYSIS_SERVICE.url}/analyze/sync`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WeChat-CloudFunction/1.0'
        },
        timeout: 480000, // 🔧 增加到8分钟超时，给AI更多处理时间
        maxContentLength: 50 * 1024 * 1024, // 50MB 响应大小限制
        maxBodyLength: 50 * 1024 * 1024,    // 50MB 请求大小限制
        // 🔧 增加重试配置
        validateStatus: function (status) {
          return status >= 200 && status < 300; // 只接受2xx状态码
        }
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
      const pdfReport = response.data.pdf_report    // 🔧 提取PDF报告（base64编码）

      console.log(`AI分析完成: ${reportId}, 处理时间: ${response.data.processing_time}s`)
      console.log(`HTML报告: ${htmlReport ? '已生成' : '未生成'}, 长度: ${htmlReport ? htmlReport.length : 0}`)
      console.log(`PDF报告: ${pdfReport ? '已生成' : '未生成'}, 长度: ${pdfReport ? pdfReport.length : 0}`)

      // 保存处理时间信息
      await db.collection('reports').doc(reportId).update({
        data: {
          'algorithm.processingTime': response.data.processing_time,
          'algorithm.serviceRequestId': response.data.request_id,
          'metadata.updatedAt': new Date()
        }
      })

      // 返回分析结果、HTML报告和PDF报告
      return {
        analysisResult: analysisResult,
        htmlReport: htmlReport,  // 🔧 返回HTML报告
        pdfReport: pdfReport     // 🔧 返回PDF报告
      }
    } else {
      const errorMsg = response.data.error_message || 'AI分析服务返回失败'
      throw new Error(errorMsg)
    }



  } catch (error) {
    // 🔧 增强错误日志记录
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data ?
        (typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : error.response.data) : null,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      },
      isTimeout: error.code === 'ECONNABORTED' || error.message.includes('timeout'),
      isNetworkError: error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
    }

    console.error(`❌ AI分析失败: ${reportId}`, errorDetails)

    // 🔧 根据错误类型提供更具体的错误信息
    let errorMessage = error.message
    if (errorDetails.isTimeout) {
      errorMessage = `AI分析服务响应超时，请稍后重试`
    } else if (errorDetails.isNetworkError) {
      errorMessage = `网络连接失败，请检查AI分析服务状态`
    } else if (error.response?.status === 500) {
      errorMessage = `AI分析服务内部错误，请稍后重试`
    } else if (error.response?.status === 413) {
      errorMessage = `文件过大，AI分析服务无法处理`
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      errorMessage = `请求参数错误: ${error.response?.data?.detail || error.message}`
    }

    // 🔧 更新错误信息到数据库，但不在这里处理重试逻辑
    try {
      await db.collection('reports').doc(reportId).update({
        data: {
          'algorithm.lastError': errorMessage,
          'algorithm.errorDetails': errorDetails,
          'algorithm.lastErrorTime': new Date(),
          'metadata.updatedAt': new Date()
        }
      })
    } catch (dbError) {
      console.error(`❌ 更新错误信息到数据库失败: ${reportId}`, dbError)
    }

    // 抛出包含详细信息的错误
    throw new Error(errorMessage)
  }
}



/**
 * 生成报告文件
 */
async function generateReportFiles(analysisResult, reportId, reportType, htmlReport = null, pdfReport = null) {
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

    // 3. 生成PDF报告
    // 🔧 使用后端生成的PDF报告（base64编码）
    if (!pdfReport) {
      console.warn(`⚠️ 后端未生成PDF报告，reportId: ${reportId}，将跳过PDF存储`)
      reportFiles.pdfUrl = null
    } else {
      const pdfPath = `reports/${reportType}/${reportId}/report.pdf`

      // 将base64编码的PDF转换为Buffer
      const pdfBuffer = Buffer.from(pdfReport, 'base64')
      console.log(`📄 使用后端生成的PDF报告, 大小: ${pdfBuffer.length} 字节`)

      const pdfUploadResult = await cloud.uploadFile({
        cloudPath: pdfPath,
        fileContent: pdfBuffer
      })

      reportFiles.pdfUrl = pdfUploadResult.fileID
    }

    return reportFiles

  } catch (error) {
    throw new Error(`报告文件生成失败: ${error.message}`)
  }
}

/**
 * 更新报告状态
 */
async function updateReportStatus(reportId, status, stage, progress, reportFiles = null, analysisResult = null, htmlReport = null, errorMessage = null) {
  console.log(`📊 [状态更新] 开始更新报告状态: ${reportId}`, {
    status,
    stage,
    progress,
    hasReportFiles: !!reportFiles,
    hasAnalysisResult: !!analysisResult,
    hasHtmlReport: !!htmlReport,
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

  // 🆕 保存AI分析结果
  if (analysisResult) {
    updateData['output.analysisResult'] = analysisResult
    console.log(`🤖 [状态更新] 包含AI分析结果`)
  }

  // 🆕 保存HTML报告内容
  if (htmlReport) {
    updateData['output.htmlReport'] = htmlReport
    console.log(`📝 [状态更新] 包含HTML报告内容: ${htmlReport.length} 字符`)
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


