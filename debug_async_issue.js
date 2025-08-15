/**
 * 调试异步任务问题的脚本
 * 在小程序开发者工具控制台中运行
 */

async function debugAsyncIssue() {
  console.log('🔍 开始调试异步任务问题...')
  
  try {
    // 1. 创建一个测试报告
    const testContent = `
银行流水测试文档
日期: 2024-01-01
账户: 1234567890123456
余额: 100000.00
收入明细:
- 工资: 15000.00
- 奖金: 5000.00
支出明细:
- 房租: 3000.00
- 生活费: 2000.00
    `.trim()
    
    console.log('📁 创建测试报告...')
    const fileBuffer = new TextEncoder().encode(testContent)
    
    const uploadResult = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'async_debug_test.txt',
        reportType: 'flow'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 立即检查状态
    console.log('🔍 立即检查初始状态...')
    await checkReportStatus(reportId)
    
    // 3. 等待一段时间后检查状态变化
    const checkIntervals = [5, 10, 30, 60, 120, 300] // 秒
    
    for (const seconds of checkIntervals) {
      console.log(`⏳ 等待 ${seconds} 秒后检查状态...`)
      
      await new Promise(resolve => setTimeout(resolve, seconds * 1000))
      
      console.log(`🔍 ${seconds}秒后的状态检查:`)
      await checkReportStatus(reportId)
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error)
  }
}

// 检查特定报告的状态
async function checkReportStatus(reportId) {
  try {
    const statusResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: reportId
      }
    })
    
    if (statusResult.result.success) {
      const statusData = statusResult.result.data
      
      console.log(`📊 报告状态 (${reportId}):`, {
        status: statusData.status,
        progress: statusData.progress,
        currentStage: statusData.currentStage,
        stageText: statusData.stageText,
        hasFiles: statusData.hasFiles,
        updatedAt: statusData.updatedAt
      })
      
      // 检查是否卡在某个状态
      if (statusData.status === 'processing') {
        console.log(`⚠️ 报告仍在处理中，当前阶段: ${statusData.currentStage}`)
        
        if (statusData.currentStage === 'AI_ANALYSIS') {
          console.log('💡 可能卡在AI分析阶段，异步任务可能未执行')
        }
      } else if (statusData.status === 'completed') {
        console.log('✅ 报告已完成')
      } else if (statusData.status === 'failed') {
        console.log('❌ 报告处理失败')
      }
      
    } else {
      console.log('❌ 状态查询失败:', statusResult.result.error)
    }
    
  } catch (error) {
    console.error('❌ 检查状态失败:', error)
  }
}

// 检查云函数日志
function checkCloudFunctionLogs() {
  console.log('📋 检查云函数日志指南:')
  console.log('')
  console.log('1. 打开微信开发者工具')
  console.log('2. 点击"云开发"标签')
  console.log('3. 选择"云函数"')
  console.log('4. 找到 processReportAsync 云函数')
  console.log('5. 点击"日志"查看执行日志')
  console.log('')
  console.log('🔍 需要查找的关键日志:')
  console.log('- "🚀 异步启动AI分析任务"')
  console.log('- "🤖 [异步任务] 开始AI分析"')
  console.log('- "📊 [异步任务] 状态已更新为AI分析中"')
  console.log('- "🤖 [异步任务] AI分析完成"')
  console.log('- "✅ [异步任务] 更新完成状态"')
  console.log('- "🎉 [异步任务] 报告处理完成"')
  console.log('')
  console.log('❌ 如果只看到前几条日志，说明异步任务被中断了')
}

// 测试云函数生命周期
async function testCloudFunctionLifecycle() {
  console.log('🧪 测试云函数生命周期...')
  
  try {
    // 调用一个简单的测试云函数
    const result = await wx.cloud.callFunction({
      name: 'processReportAsync',
      data: {
        // 传入一个特殊的测试标记
        testMode: true,
        reportId: 'test_lifecycle_' + Date.now()
      }
    })
    
    console.log('📊 云函数调用结果:', result)
    
    console.log('💡 请检查 processReportAsync 云函数日志')
    console.log('💡 观察异步任务是否能完整执行')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 检查现有报告的状态
async function checkExistingReports() {
  console.log('🔍 检查现有报告状态...')
  
  try {
    const listResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportsList',
        reportType: 'flow',
        page: 1,
        pageSize: 10
      }
    })
    
    if (listResult.result.success) {
      const reports = listResult.result.data.reports
      
      console.log(`📋 找到 ${reports.length} 个流水宝报告`)
      
      // 检查是否有卡在处理中的报告
      const processingReports = reports.filter(r => 
        r.status === 'processing' || r.status === 'pending'
      )
      
      if (processingReports.length > 0) {
        console.log(`⚠️ 发现 ${processingReports.length} 个卡在处理中的报告:`)
        
        for (const report of processingReports) {
          console.log(`- ${report.reportId}: ${report.status} (${report.fileName})`)
          
          // 检查详细状态
          await checkReportStatus(report.reportId)
        }
      } else {
        console.log('✅ 没有发现卡在处理中的报告')
      }
      
    } else {
      console.log('❌ 获取报告列表失败:', listResult.result.error)
    }
    
  } catch (error) {
    console.error('❌ 检查现有报告失败:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 异步任务问题调试脚本已加载

可用的测试函数：
1. debugAsyncIssue() - 创建测试报告并监控状态变化
2. checkReportStatus(reportId) - 检查特定报告状态
3. checkCloudFunctionLogs() - 显示云函数日志检查指南
4. testCloudFunctionLifecycle() - 测试云函数生命周期
5. checkExistingReports() - 检查现有报告状态

使用方法：
debugAsyncIssue()
checkExistingReports()
checkCloudFunctionLogs()

问题分析：
如果报告状态一直卡在 'processing' 且 currentStage 为 'AI_ANALYSIS'，
说明异步任务可能在云函数返回后被中断了。

解决方案：
需要修改为同步处理或使用其他异步机制。
`)

window.debugAsyncIssue = debugAsyncIssue
window.checkReportStatus = checkReportStatus
window.checkCloudFunctionLogs = checkCloudFunctionLogs
window.testCloudFunctionLifecycle = testCloudFunctionLifecycle
window.checkExistingReports = checkExistingReports
