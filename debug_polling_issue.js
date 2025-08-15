/**
 * 调试轮询问题的脚本
 * 在小程序开发者工具控制台中运行
 */

async function debugPollingIssue() {
  console.log('🔍 开始调试轮询问题...')
  
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
        fileName: 'polling_debug_test.txt',
        reportType: 'flow'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 模拟前端轮询过程
    console.log('🔄 开始模拟轮询过程...')
    
    let pollCount = 0
    const maxPolls = 20 // 最多轮询20次
    const pollInterval = 5000 // 5秒间隔
    
    const pollFunction = async () => {
      pollCount++
      console.log(`🔄 第 ${pollCount} 次轮询...`)
      
      try {
        const statusResult = await wx.cloud.callFunction({
          name: 'getReports',
          data: {
            action: 'getReportStatus',
            reportId: reportId
          }
        })
        
        console.log(`📊 轮询结果 ${pollCount}:`, statusResult)
        
        if (statusResult.result.success) {
          const statusData = statusResult.result.data
          
          console.log(`📋 状态信息:`, {
            status: statusData.status,
            progress: statusData.progress,
            currentStage: statusData.currentStage,
            stageText: statusData.stageText,
            taskStatus: statusData.taskStatus,
            hasFiles: statusData.hasFiles
          })
          
          if (statusData.status === 'completed') {
            console.log('🎉 报告处理完成!')
            console.log('✅ 轮询成功检测到完成状态')
            return true // 停止轮询
          } else if (statusData.status === 'failed') {
            console.log('❌ 报告处理失败')
            return true // 停止轮询
          } else {
            console.log(`⏳ 报告仍在处理中，状态: ${statusData.status}`)
            return false // 继续轮询
          }
        } else {
          console.log('❌ 状态查询失败:', statusResult.result.error)
          
          if (statusResult.result.error === 'REPORT_NOT_FOUND') {
            console.log('📋 报告记录不存在，可能已被清理')
            return true // 停止轮询
          }
          
          return false // 继续轮询
        }
        
      } catch (error) {
        console.error(`❌ 轮询 ${pollCount} 失败:`, error)
        return false // 继续轮询
      }
    }
    
    // 3. 执行轮询
    const startPolling = async () => {
      while (pollCount < maxPolls) {
        const shouldStop = await pollFunction()
        
        if (shouldStop) {
          console.log(`🛑 轮询结束，总共轮询 ${pollCount} 次`)
          break
        }
        
        if (pollCount < maxPolls) {
          console.log(`⏳ 等待 ${pollInterval}ms 后继续轮询...`)
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      }
      
      if (pollCount >= maxPolls) {
        console.log('⏰ 达到最大轮询次数，停止轮询')
        
        // 最后检查一次状态
        console.log('🔍 最后检查一次状态...')
        await pollFunction()
      }
    }
    
    // 延迟10秒后开始轮询（模拟前端逻辑）
    console.log('⏳ 延迟10秒后开始轮询...')
    setTimeout(startPolling, 10000)
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error)
  }
}

// 检查特定报告的状态
async function checkSpecificReport(reportId) {
  console.log(`🔍 检查特定报告状态: ${reportId}`)
  
  try {
    const statusResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: reportId
      }
    })
    
    console.log('📊 状态结果:', statusResult)
    
    if (statusResult.result.success) {
      const statusData = statusResult.result.data
      console.log('📋 详细状态:', statusData)
      
      // 检查数据库中的原始数据
      console.log('🔍 检查数据库原始数据...')
      
      // 这里我们无法直接查询数据库，但可以通过云函数日志来观察
      console.log('💡 请检查 getReports 云函数的日志以查看原始数据')
      
    } else {
      console.log('❌ 状态查询失败:', statusResult.result.error)
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error)
  }
}

// 测试轮询逻辑
async function testPollingLogic() {
  console.log('🧪 测试轮询逻辑...')
  
  // 模拟不同的状态响应
  const mockResponses = [
    { status: 'processing', progress: 30, currentStage: 'AI_ANALYSIS' },
    { status: 'processing', progress: 50, currentStage: 'AI_ANALYZING' },
    { status: 'processing', progress: 80, currentStage: 'GENERATING_REPORTS' },
    { status: 'completed', progress: 100, currentStage: 'COMPLETED', hasFiles: true }
  ]
  
  mockResponses.forEach((response, index) => {
    console.log(`状态 ${index + 1}:`, response)
    
    if (response.status === 'completed') {
      console.log('✅ 检测到完成状态，应该停止轮询')
    } else {
      console.log('🔄 仍在处理中，应该继续轮询')
    }
  })
}

// 在控制台中使用
console.log(`
🧪 轮询问题调试脚本已加载

可用的测试函数：
1. debugPollingIssue() - 完整轮询调试
2. checkSpecificReport(reportId) - 检查特定报告状态
3. testPollingLogic() - 测试轮询逻辑

使用方法：
debugPollingIssue()
checkSpecificReport('your_report_id')
testPollingLogic()
`)

window.debugPollingIssue = debugPollingIssue
window.checkSpecificReport = checkSpecificReport
window.testPollingLogic = testPollingLogic
