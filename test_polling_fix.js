/**
 * 测试轮询修复的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testPollingFix() {
  console.log('🚀 开始测试轮询修复...')
  
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
        fileName: 'polling_fix_test.txt',
        reportType: 'flow'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 立即检查初始状态
    console.log('🔍 检查初始状态...')
    const initialStatus = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: reportId
      }
    })
    
    console.log('📊 初始状态:', initialStatus)
    
    // 3. 模拟前端轮询逻辑
    console.log('🔄 开始模拟前端轮询...')
    
    let pollCount = 0
    const maxPolls = 30 // 最多轮询30次（2.5分钟）
    let isCompleted = false
    
    const pollFunction = async () => {
      pollCount++
      console.log(`🔄 第 ${pollCount} 次轮询 (${new Date().toLocaleTimeString()})`)
      
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
          
          console.log(`📋 状态信息:`, {
            status: statusData.status,
            progress: statusData.progress,
            currentStage: statusData.currentStage,
            stageText: statusData.stageText,
            hasFiles: statusData.hasFiles
          })
          
          if (statusData.status === 'completed') {
            console.log('🎉 检测到完成状态!')
            console.log(`✅ 轮询成功，总共轮询 ${pollCount} 次`)
            isCompleted = true
            return true
          } else if (statusData.status === 'failed') {
            console.log('❌ 检测到失败状态')
            return true
          } else {
            console.log(`⏳ 仍在处理中: ${statusData.status} (${statusData.progress}%)`)
            return false
          }
        } else {
          console.log('❌ 状态查询失败:', statusResult.result.error)
          
          if (statusResult.result.error === 'REPORT_NOT_FOUND') {
            console.log('📋 报告记录不存在，可能已被清理')
            return true
          }
          
          return false
        }
        
      } catch (error) {
        console.error(`❌ 轮询 ${pollCount} 失败:`, error)
        return false
      }
    }
    
    // 4. 延迟10秒后开始轮询（模拟前端逻辑）
    console.log('⏳ 延迟10秒后开始轮询...')
    
    setTimeout(async () => {
      console.log('🔄 开始轮询循环...')
      
      while (pollCount < maxPolls && !isCompleted) {
        const shouldStop = await pollFunction()
        
        if (shouldStop) {
          break
        }
        
        // 等待5秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      
      if (!isCompleted && pollCount >= maxPolls) {
        console.log('⏰ 达到最大轮询次数，但未完成')
        console.log('🔍 最后检查一次状态...')
        await pollFunction()
      }
      
      console.log('🎯 轮询测试结束')
      
    }, 10000)
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 快速测试当前状态
async function quickStatusTest() {
  console.log('⚡ 快速状态测试...')
  
  try {
    // 获取最近的报告列表
    const listResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportsList',
        reportType: 'flow',
        page: 1,
        pageSize: 5
      }
    })
    
    console.log('📊 报告列表:', listResult)
    
    if (listResult.result.success && listResult.result.data.reports.length > 0) {
      const reports = listResult.result.data.reports
      console.log(`找到 ${reports.length} 个流水宝报告`)
      
      // 检查每个报告的状态
      for (let i = 0; i < Math.min(3, reports.length); i++) {
        const report = reports[i]
        console.log(`🔍 检查报告 ${i + 1}: ${report.reportId}`)
        
        const statusResult = await wx.cloud.callFunction({
          name: 'getReports',
          data: {
            action: 'getReportStatus',
            reportId: report.reportId
          }
        })
        
        if (statusResult.result.success) {
          const statusData = statusResult.result.data
          console.log(`📋 报告状态:`, {
            id: report.reportId,
            status: statusData.status,
            progress: statusData.progress,
            stage: statusData.currentStage
          })
        } else {
          console.log(`❌ 状态查询失败: ${statusResult.result.error}`)
        }
      }
    } else {
      console.log('⚠️ 没有找到流水宝报告')
    }
    
  } catch (error) {
    console.error('❌ 快速测试失败:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 轮询修复测试脚本已加载

可用的测试函数：
1. testPollingFix() - 完整轮询测试（创建新报告并监控）
2. quickStatusTest() - 快速状态测试（检查现有报告）

使用方法：
testPollingFix()
quickStatusTest()

注意：
- testPollingFix() 会创建新报告并监控完整过程
- 请在开发者工具的云函数日志中观察详细执行过程
`)

window.testPollingFix = testPollingFix
window.quickStatusTest = quickStatusTest
