/**
 * 测试轮询超时机制的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testPollingTimeout() {
  console.log('🚀 开始测试轮询超时机制...')
  
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
        fileName: 'timeout_test.txt',
        reportType: 'flow'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 检查轮询开始时间是否正确设置
    console.log('🔍 检查轮询开始时间设置...')
    
    // 获取当前页面
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    
    if (currentPage.data && currentPage.data.pollStartTime) {
      const startTime = currentPage.data.pollStartTime
      const currentTime = Date.now()
      const elapsed = Math.round((currentTime - startTime) / 1000)
      
      console.log(`✅ 轮询开始时间已设置: ${new Date(startTime).toLocaleTimeString()}`)
      console.log(`⏱️ 已经过时间: ${elapsed}秒`)
      console.log(`⏰ 超时时间: 15分钟 (900秒)`)
      console.log(`📊 剩余时间: ${900 - elapsed}秒`)
    } else {
      console.log('⚠️ 轮询开始时间未设置')
    }
    
    console.log('💡 轮询超时机制说明:')
    console.log('- 最大轮询时间: 15分钟')
    console.log('- 超时后会自动停止轮询')
    console.log('- 显示"处理超时，请重试"消息')
    console.log('- 清除当前报告状态')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 模拟超时场景（仅用于测试）
function simulateTimeout() {
  console.log('🧪 模拟超时场景...')
  
  // 获取当前页面
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  if (currentPage.data && currentPage.data.generating) {
    console.log('📱 当前有正在进行的报告，模拟超时...')
    
    // 将轮询开始时间设置为16分钟前（超过15分钟限制）
    const sixteenMinutesAgo = Date.now() - (16 * 60 * 1000)
    
    currentPage.setData({
      pollStartTime: sixteenMinutesAgo
    })
    
    console.log('⏰ 已将轮询开始时间设置为16分钟前')
    console.log('💡 下次轮询时应该会触发超时机制')
    console.log('💡 请等待下次轮询周期（约5-10秒）观察效果')
    
  } else {
    console.log('⚠️ 当前没有正在进行的报告，无法模拟超时')
    console.log('💡 请先上传文件开始分析，然后再运行此函数')
  }
}

// 检查当前轮询状态
function checkPollingStatus() {
  console.log('🔍 检查当前轮询状态...')
  
  // 获取当前页面
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  if (currentPage.data) {
    const { 
      generating, 
      currentReportId, 
      pollStartTime, 
      reportProgress, 
      reportStatus 
    } = currentPage.data
    
    console.log('📊 当前状态:', {
      generating: generating,
      currentReportId: currentReportId,
      reportProgress: reportProgress,
      reportStatus: reportStatus
    })
    
    if (generating && pollStartTime) {
      const currentTime = Date.now()
      const elapsed = Math.round((currentTime - pollStartTime) / 1000)
      const remaining = 900 - elapsed // 15分钟 = 900秒
      
      console.log(`⏱️ 轮询时间信息:`)
      console.log(`- 开始时间: ${new Date(pollStartTime).toLocaleTimeString()}`)
      console.log(`- 已经过: ${elapsed}秒`)
      console.log(`- 剩余: ${remaining}秒`)
      
      if (remaining <= 0) {
        console.log('⚠️ 已超过15分钟限制，下次轮询应该会超时')
      } else if (remaining <= 60) {
        console.log('⚠️ 即将超时（剩余不到1分钟）')
      } else {
        console.log('✅ 轮询时间正常')
      }
    } else if (generating) {
      console.log('⚠️ 正在生成但没有轮询开始时间')
    } else {
      console.log('ℹ️ 当前没有正在进行的报告')
    }
  }
}

// 测试不同页面的超时机制
function testAllPagesTimeout() {
  console.log('🧪 测试所有页面的超时机制...')
  
  const pageRoutes = [
    '/pages/liushui/liushui',
    '/pages/jianxin/jianxin', 
    '/pages/zhuanxin/zhuanxin'
  ]
  
  // 获取当前页面
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage.route
  
  console.log(`📱 当前页面: ${currentRoute}`)
  
  if (pageRoutes.includes(`/${currentRoute}`)) {
    console.log('✅ 当前页面支持轮询超时机制')
    
    // 检查是否有超时相关的数据字段
    if (currentPage.data && 'pollStartTime' in currentPage.data) {
      console.log('✅ 页面包含 pollStartTime 字段')
    } else {
      console.log('❌ 页面缺少 pollStartTime 字段')
    }
    
    // 检查是否有轮询函数
    if (typeof currentPage.pollProgress === 'function') {
      console.log('✅ 页面包含 pollProgress 函数')
    } else {
      console.log('❌ 页面缺少 pollProgress 函数')
    }
    
  } else {
    console.log('ℹ️ 当前页面不支持轮询功能')
  }
  
  console.log('💡 支持超时机制的页面:')
  pageRoutes.forEach(route => {
    console.log(`- ${route}`)
  })
}

// 在控制台中使用
console.log(`
🧪 轮询超时机制测试脚本已加载

可用的测试函数：
1. testPollingTimeout() - 创建测试报告并检查超时设置
2. simulateTimeout() - 模拟超时场景（将开始时间设为16分钟前）
3. checkPollingStatus() - 检查当前轮询状态和剩余时间
4. testAllPagesTimeout() - 测试所有页面的超时机制

使用方法：
testPollingTimeout()
checkPollingStatus()
simulateTimeout()

超时机制说明：
- 最大轮询时间: 15分钟
- 超时后自动停止轮询并显示错误提示
- 适用于流水宝、简信宝、专信宝三个页面
`)

window.testPollingTimeout = testPollingTimeout
window.simulateTimeout = simulateTimeout
window.checkPollingStatus = checkPollingStatus
window.testAllPagesTimeout = testAllPagesTimeout
