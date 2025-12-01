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

/**
 *[object Object]修复版本：去掉setTimeout，直接同步等待AI分析完成
 * 
 * 问题：setTimeout在云函数中不可靠，主函数返回后异步任务可能被终止
 * 解决：直接在主函数中await AI分析，保证任务完成后才返回
 */
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

    // 3. AI分析 - 🔧 修复：直接等待完成，不使用setTimeout
    console.log(`🤖 开始AI分析: ${reportId}`)
    await updateReportStatus(reportId, 'processing', 'AI_ANALYZING', 60)

    const analysisStartTime = Date.now()
    const aiResult = await analyzeWithAI(fileBuffer, reportType, reportId)
    const analysisEndTime = Date.now()

    console.log(`🤖 AI分析完成: ${reportId}, 耗时: ${(analysisEndTime - analysisStartTime) / 1000}秒`)

    // 提取分析结果、HTML报告和PDF报告
    const analysisResult = aiResult.analysisResult || aiResult  // 兼容旧格式
    const htmlReport = aiResult.htmlReport || null
    const pdfReport = aiResult.pdfReport || null

    console.log(`📊 分析结果提取完成`)
    console.log(`  - JSON数据: ${analysisResult ? '✅' : '❌'}`)
    console.log(`  - HTML报告: ${htmlReport ? `✅ (${htmlReport.length}字符)` : '❌'}`)
    console.log(`  - PDF报告: ${pdfReport ? `✅ (${pdfReport.length}字节)` : '❌'}`)

    // 4. 生成报告文件（JSON + HTML + PDF）
    console.log(`📄 开始生成报告文件: ${reportId}`)
    await updateReportStatus(reportId, 'processing', 'GENERATING_REPORTS', 80)
    const reportFiles = await generateReportFiles(analysisResult, reportId, reportType, htmlReport, pdfReport)
    console.log(`📄 报告文件生成完成: ${reportId}`)

    // 5. 更新完成状态
    console.log(`✅ 更新完成状态: ${reportId}`)
    await updateReportStatus(reportId, 'completed', 'COMPLETED', 100, reportFiles, analysisResult, htmlReport)

    console.log(`🎉 报告处理完成: ${reportId}`)

    return {
      success: true,
      reportId: reportId,
      message: '报告生成完成'
    }

  } catch (error) {
    console.error(`❌ 报告处理失败: ${reportId}`, {
      message: error.message,
      stack: error.stack
    })

    // 标记为失败状态
    try {
      await updateReportStatus(reportId, 'failed', 'FAILED', 0, null, null, null, error.message)

      // 删除上传的原始文件以节省存储空间
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
    console.error('下载文件失败:', error)
    throw new Error(`下载文件失败: ${error.message}`)
  }
}

/**
 * AI分析
 */
async function analyzeWithAI(fileBuffer, reportType, reportId) {
  try {
    console.log(`🤖 调用AI分析服务: ${AI_ANALYSIS_SERVICE.url}`)
    console.log(`  - 报告类型: ${reportType}`)
    console.log(`  - 文件大小: ${fileBuffer.length} 字节`)

    const response = await axios.post(
      `${AI_ANALYSIS_SERVICE.url}/analyze`,
      {
        file: fileBuffer.toString('base64'),
        reportType: reportType,
        reportId: reportId
      },
      {
        timeout: AI_ANALYSIS_SERVICE.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`✅ AI分析服务响应成功`)
    return response.data
  } catch (error) {
    console.error('AI分析失败:', error.message)
    throw new Error(`AI分析失败: ${error.message}`)
  }
}

