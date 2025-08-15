/**
 * 调试终止分析问题的脚本
 * 在小程序开发者工具控制台中运行
 */

async function debugCancelIssue() {
  console.log('🔍 开始调试终止分析问题...')
  
  try {
    // 1. 获取当前用户的报告列表
    console.log('📋 获取报告列表...')
    const listResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportsList',
        reportType: 'simple',
        page: 1,
        pageSize: 10
      }
    })
    
    console.log('📊 报告列表结果:', listResult)
    
    if (listResult.result.success && listResult.result.data.reports.length > 0) {
      const reports = listResult.result.data.reports
      console.log(`找到 ${reports.length} 个简信宝报告`)
      
      // 显示所有报告的状态
      reports.forEach((report, index) => {
        console.log(`报告 ${index + 1}:`, {
          id: report.reportId,
          status: report.status,
          progress: report.progress,
          fileName: report.fileName
        })
      })
      
      // 2. 选择一个报告进行详细检查
      const targetReport = reports[0] // 选择第一个报告
      console.log(`🔍 详细检查报告: ${targetReport.reportId}`)
      
      // 3. 获取报告的详细状态
      const statusResult = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: targetReport.reportId
        }
      })
      
      console.log('📊 详细状态结果:', statusResult)
      
      if (statusResult.result.success) {
        const statusData = statusResult.result.data
        console.log('📋 详细状态信息:', {
          status: statusData.status,
          progress: statusData.progress,
          currentStage: statusData.currentStage,
          stageText: statusData.stageText,
          taskStatus: statusData.taskStatus
        })
        
        // 4. 尝试终止这个报告
        console.log('🛑 尝试终止报告...')
        const cancelResult = await wx.cloud.callFunction({
          name: 'cancelReport',
          data: {
            reportId: targetReport.reportId
          }
        })
        
        console.log('📊 终止结果:', cancelResult)
        
        if (cancelResult.result.success) {
          console.log('✅ 终止成功!')
        } else {
          console.log('❌ 终止失败:', cancelResult.result.error)
          
          // 分析失败原因
          if (cancelResult.result.error.includes('只有处理中的报告才能终止')) {
            console.log('💡 失败原因: 报告状态不是处理中')
            console.log('💡 当前状态:', statusData.status)
            console.log('💡 建议: 只能终止状态为 processing 或 pending 的报告')
          }
        }
        
      } else {
        console.log('❌ 获取详细状态失败:', statusResult.result.error)
      }
      
    } else {
      console.log('⚠️ 没有找到简信宝报告，创建一个测试报告...')
      
      // 创建一个测试报告
      const testContent = 'Debug test content'
      const fileBuffer = new TextEncoder().encode(testContent)
      
      const uploadResult = await wx.cloud.callFunction({
        name: 'uploadFile',
        data: {
          fileBuffer: Array.from(fileBuffer),
          fileName: 'debug_test.txt',
          reportType: 'simple'
        }
      })
      
      if (uploadResult.result.success) {
        const reportId = uploadResult.result.reportId
        console.log(`✅ 测试报告创建成功: ${reportId}`)
        
        // 等待一下然后尝试终止
        console.log('⏳ 等待2秒后尝试终止...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const cancelResult = await wx.cloud.callFunction({
          name: 'cancelReport',
          data: {
            reportId: reportId
          }
        })
        
        console.log('📊 新报告终止结果:', cancelResult)
        
      } else {
        console.log('❌ 创建测试报告失败:', uploadResult.result.error)
      }
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error)
  }
}

// 专门测试状态检查逻辑
async function testStatusCheck() {
  console.log('🔍 测试状态检查逻辑...')
  
  // 模拟不同的报告状态数据
  const testStates = [
    { status: 'processing', processing: { status: 'processing' } },
    { status: 'pending', processing: { status: 'pending' } },
    { status: 'completed', processing: { status: 'completed' } },
    { status: 'failed', processing: { status: 'failed' } },
    { processing: { status: 'processing' } }, // 只有旧结构
    { status: 'processing' }, // 只有新结构
  ]
  
  testStates.forEach((state, index) => {
    const reportStatus = state.status || state.processing?.status
    const processingStatus = state.processing?.status
    
    const canCancel = reportStatus === 'processing' || reportStatus === 'pending' || 
                     processingStatus === 'processing' || processingStatus === 'pending'
    
    console.log(`测试状态 ${index + 1}:`, {
      state: state,
      reportStatus: reportStatus,
      processingStatus: processingStatus,
      canCancel: canCancel
    })
  })
}

// 在控制台中使用
console.log(`
🧪 终止分析问题调试脚本已加载

可用的测试函数：
1. debugCancelIssue() - 完整调试流程
2. testStatusCheck() - 状态检查逻辑测试

使用方法：
在控制台中输入函数名并执行，例如：
debugCancelIssue()
`)

window.debugCancelIssue = debugCancelIssue
window.testStatusCheck = testStatusCheck
