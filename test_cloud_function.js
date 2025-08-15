/**
 * 测试云函数和AI服务连接的脚本
 * 在小程序开发者工具的控制台中运行
 */

// 测试AI服务连接
async function testAIServiceConnection() {
  console.log('🚀 开始测试AI服务连接...')
  
  try {
    const result = await wx.cloud.callFunction({
      name: 'testAIService',
      data: {
        testType: 'all'
      }
    })
    
    console.log('✅ 云函数调用成功:', result)
    
    if (result.result.success) {
      const { results } = result.result
      console.log('📊 测试结果摘要:', results.summary)
      
      // 检查各项测试结果
      Object.entries(results.tests).forEach(([testName, testResult]) => {
        if (testResult.success) {
          console.log(`✅ ${testName} 测试通过`)
        } else {
          console.error(`❌ ${testName} 测试失败:`, testResult.error)
        }
      })
    } else {
      console.error('❌ AI服务测试失败:', result.result.error)
    }
    
  } catch (error) {
    console.error('❌ 调用测试云函数失败:', error)
  }
}

// 测试完整的报告处理流程
async function testReportProcessing() {
  console.log('🚀 开始测试报告处理流程...')
  
  try {
    // 1. 模拟上传文件
    console.log('1️⃣ 模拟文件上传...')
    
    // 创建一个测试文件
    const testFileContent = 'test pdf content for flow analysis'
    const testFile = new Blob([testFileContent], { type: 'application/pdf' })
    
    // 上传到云存储
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `test/test_${Date.now()}.pdf`,
      filePath: testFile
    })
    
    console.log('✅ 文件上传成功:', uploadResult.fileID)
    
    // 2. 调用处理云函数
    console.log('2️⃣ 调用报告处理云函数...')
    
    const processResult = await wx.cloud.callFunction({
      name: 'processReportAsync',
      data: {
        reportId: `test_report_${Date.now()}`,
        fileId: uploadResult.fileID,
        reportType: 'flow'
      }
    })
    
    console.log('📊 处理结果:', processResult)
    
    if (processResult.result.success) {
      console.log('✅ 报告处理成功')
    } else {
      console.error('❌ 报告处理失败:', processResult.result.error)
    }
    
  } catch (error) {
    console.error('❌ 测试报告处理流程失败:', error)
  }
}

// 测试网络连接
async function testNetworkConnection() {
  console.log('🌐 测试网络连接...')
  
  try {
    const result = await wx.cloud.callFunction({
      name: 'testAIService',
      data: {
        testType: 'network'
      }
    })
    
    if (result.result.success) {
      const networkTest = result.result.results.tests.network
      if (networkTest.success) {
        console.log(`✅ 网络连接正常，响应时间: ${networkTest.responseTime}ms`)
      } else {
        console.error('❌ 网络连接失败:', networkTest.error)
      }
    }
    
  } catch (error) {
    console.error('❌ 网络测试失败:', error)
  }
}

// 在控制台中运行这些函数
console.log(`
🧪 AI服务测试脚本已加载

可用的测试函数：
1. testAIServiceConnection() - 测试AI服务连接
2. testNetworkConnection() - 测试网络连接  
3. testReportProcessing() - 测试完整处理流程

使用方法：
在控制台中输入函数名并执行，例如：
testAIServiceConnection()
`)

// 导出函数供控制台使用
window.testAIServiceConnection = testAIServiceConnection
window.testNetworkConnection = testNetworkConnection
window.testReportProcessing = testReportProcessing
