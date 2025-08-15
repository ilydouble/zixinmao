/**
 * 测试页面切换时轮询恢复功能的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testPageSwitchPolling() {
  console.log('🚀 开始测试页面切换时的轮询恢复功能...')
  
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
        fileName: 'page_switch_test.txt',
        reportType: 'flow'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 等待报告进入处理状态
    console.log('⏳ 等待5秒让报告进入处理状态...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 3. 检查报告状态
    const statusResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: reportId
      }
    })
    
    console.log('📊 当前状态:', statusResult)
    
    if (statusResult.result.success) {
      const statusData = statusResult.result.data
      
      if (statusData.status === 'processing' || statusData.status === 'pending') {
        console.log('✅ 报告正在处理中，适合测试页面切换')
        
        // 4. 模拟页面切换场景
        console.log('📱 模拟页面切换场景...')
        console.log('💡 请手动执行以下步骤来测试：')
        console.log('1. 在流水宝页面上传文件开始分析')
        console.log('2. 等待显示"处理中"状态')
        console.log('3. 切换到其他页面（如简信宝）')
        console.log('4. 等待一段时间后切换回流水宝页面')
        console.log('5. 观察是否自动恢复轮询和状态显示')
        
        // 5. 提供检查函数
        console.log('🔍 可以使用以下函数检查状态：')
        console.log(`checkReportStatus('${reportId}')`)
        
        // 定义检查函数
        window.checkReportStatus = async (id) => {
          const result = await wx.cloud.callFunction({
            name: 'getReports',
            data: {
              action: 'getReportStatus',
              reportId: id
            }
          })
          
          console.log('📊 报告状态:', result)
          
          if (result.result.success) {
            const data = result.result.data
            console.log(`状态: ${data.status}, 进度: ${data.progress}%`)
          }
        }
        
      } else {
        console.log(`⚠️ 报告状态为 ${statusData.status}，不适合测试页面切换`)
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 模拟页面生命周期事件
function simulatePageLifecycle() {
  console.log('🔄 模拟页面生命周期事件...')
  
  // 模拟页面隐藏
  console.log('📱 模拟页面隐藏 (onHide)')
  // 在实际应用中，这里会触发 onHide 事件
  
  setTimeout(() => {
    // 模拟页面显示
    console.log('📱 模拟页面显示 (onShow)')
    // 在实际应用中，这里会触发 onShow 事件
    // 应该调用 checkAndResumePolling() 方法
    
    console.log('💡 在实际页面中，onShow 会调用 checkAndResumePolling()')
    console.log('💡 该方法会检查是否有正在进行的报告并恢复轮询')
    
  }, 3000)
}

// 检查页面状态
function checkPageState() {
  console.log('🔍 检查当前页面状态...')
  
  // 获取当前页面
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  console.log('📱 当前页面:', currentPage.route)
  
  if (currentPage.data) {
    const { generating, currentReportId, reportProgress, reportStatus } = currentPage.data
    
    console.log('📊 页面状态:', {
      generating: generating,
      currentReportId: currentReportId,
      reportProgress: reportProgress,
      reportStatus: reportStatus
    })
    
    if (generating && currentReportId) {
      console.log('✅ 页面显示有正在进行的报告')
      console.log('💡 如果切换页面后回来，应该会自动恢复轮询')
    } else {
      console.log('ℹ️ 页面没有正在进行的报告')
    }
  }
}

// 测试轮询恢复逻辑
async function testPollingResume() {
  console.log('🔄 测试轮询恢复逻辑...')
  
  // 获取最近的处理中报告
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
    const processingReport = reports.find(r => r.status === 'processing' || r.status === 'pending')
    
    if (processingReport) {
      console.log(`✅ 找到处理中的报告: ${processingReport.reportId}`)
      
      // 模拟恢复轮询
      console.log('🔄 模拟恢复轮询...')
      
      const statusResult = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: processingReport.reportId
        }
      })
      
      console.log('📊 状态查询结果:', statusResult)
      
      if (statusResult.result.success) {
        const statusData = statusResult.result.data
        
        if (statusData.status === 'processing' || statusData.status === 'pending') {
          console.log('✅ 应该恢复轮询')
          console.log('💡 页面会设置 generating: true 并开始轮询')
        } else {
          console.log('ℹ️ 报告已完成，无需轮询')
        }
      }
      
    } else {
      console.log('ℹ️ 没有找到处理中的报告')
    }
  }
}

// 在控制台中使用
console.log(`
🧪 页面切换轮询恢复测试脚本已加载

可用的测试函数：
1. testPageSwitchPolling() - 创建测试报告并提供测试指导
2. simulatePageLifecycle() - 模拟页面生命周期事件
3. checkPageState() - 检查当前页面状态
4. testPollingResume() - 测试轮询恢复逻辑

使用方法：
testPageSwitchPolling()
checkPageState()
testPollingResume()

手动测试步骤：
1. 在任意页面上传文件开始分析
2. 等待显示"处理中"状态
3. 切换到其他页面
4. 等待一段时间后切换回原页面
5. 观察是否自动恢复轮询和状态显示
`)

window.testPageSwitchPolling = testPageSwitchPolling
window.simulatePageLifecycle = simulatePageLifecycle
window.checkPageState = checkPageState
window.testPollingResume = testPollingResume
