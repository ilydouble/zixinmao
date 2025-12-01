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
 [object Object]本：移除setTimeout，改为同步执行
 * 
 * 问题原因：setTimeout在云函数中不可靠，主线程返回后异步任务可能被终止
 * 解决方案：直接await所有异步操作，确保任务完成后再返回
 */
exports.main = async (event, context) => {
  const { reportId, fileId, reportType } = event

  try {
    console.log(`🚀 开始处理报告: ${reportId}, 类型: ${reportType}`)
    console.log(`📋 AI服务配置: ${AI_ANALYSIS_SERVICE.url}`)

    // 1. 更新状态为处理中
    console.log(`📊 更新状态为处理中...`)
    await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 30)

    // 2. 下载文件
    console.log(`📁 下载文件: ${fileId}`)
    const fileBuffer = await downloadFile(fileId)
    console.log(`📁 文件下载完成，大小: ${fileBuffer.length} 字节`)

    // 3. 准备AI分析
    console.log(`🤖 准备AI分析任务...`)
    await updateReportStatus(reportId, 'processing', 'AI_ANALYSIS', 50)

    // 🔧 修复：直接执行AI分析，不使用setTimeout
    console.log(`🚀 开始AI分析: ${reportId}`)

    // 更新状态为AI分析中
    await updateReportStatus(reportId, 'processing', 'AI_ANALYZING', 60)
    console.log(`📊 状态已更新为AI分析中: ${reportId}`)

    const analysisStartTime = Date.now()
    const aiResult = await analyzeWithAI(fileBuffer, reportType, reportId)
    const analysisEndTime = Date.now()

    console.log(`🤖 AI分析完成: ${reportId}, 耗时: ${(analysisEndTime - analysisStartTime) / 1000}秒`)

    // 提取分析结果、HTML报告和PDF报告
    const analysisResult = aiResult.analysisResult || aiResult
    const htmlReport = aiResult.htmlReport || null
    const pdfReport = aiResult.pdfReport || null

    console.log(`📊 分析结果提取完成`)
    console.log(`  - JSON数据: ${analysisResult ? '✅' : '❌'}`)
    console.log(`  - HTML报告: ${htmlReport ? `✅ (${htmlReport.length}字符)` : '❌'}`)
    console.log(`  - PDF报告: ${pdfReport ? `✅ (${pdfReport.length}字符)` : '❌'}`)

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
    throw new Error(`文件下载失败: ${error.message}`)
  }
}

// 注意：其他辅助函数（analyzeWithAI, generateReportFiles, updateReportStatus等）
// 保持不变，从原文件复制过来

