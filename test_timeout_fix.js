/**
 * 测试超时修复的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testTimeoutFix() {
  console.log('🚀 开始测试超时修复...')
  
  try {
    // 1. 创建测试文件
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
    
    console.log('📁 上传测试文件...')
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `test/timeout_test_${Date.now()}.txt`,
      filePath: testContent
    })
    
    console.log('✅ 文件上传成功:', uploadResult.fileID)
    
    // 2. 调用处理云函数
    console.log('🔄 调用处理云函数...')
    const startTime = Date.now()
    
    const processResult = await wx.cloud.callFunction({
      name: 'processReportAsync',
      data: {
        reportId: `timeout_test_${Date.now()}`,
        fileId: uploadResult.fileID,
        reportType: 'flow'
      }
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ 云函数执行时间: ${duration}ms`)
    console.log('📊 处理结果:', processResult)
    
    const response = processResult.result
    if (response.success) {
      console.log('✅ 云函数执行成功!')
      console.log(`📋 任务ID: ${response.taskId}`)
      console.log(`📋 报告ID: ${response.reportId}`)
      
      if (response.taskId) {
        // 3. 测试任务状态检查
        console.log('🔍 测试任务状态检查...')
        
        const statusResult = await wx.cloud.callFunction({
          name: 'checkTaskStatus',
          data: {
            taskId: response.taskId,
            reportId: response.reportId
          }
        })
        
        console.log('📊 状态检查结果:', statusResult)
        
        if (statusResult.result.success) {
          console.log(`✅ 任务状态: ${statusResult.result.status}`)
          console.log(`📝 状态信息: ${statusResult.result.message}`)
        } else {
          console.error('❌ 状态检查失败:', statusResult.result.error)
        }
      }
      
      // 4. 测试前端轮询
      if (response.reportId) {
        console.log('🔄 测试前端状态轮询...')
        
        const pollResult = await wx.cloud.callFunction({
          name: 'getReports',
          data: {
            action: 'getReportStatus',
            reportId: response.reportId
          }
        })
        
        console.log('📊 轮询结果:', pollResult)
        
        if (pollResult.result.success) {
          const statusData = pollResult.result.data
          console.log(`✅ 报告状态: ${statusData.status}`)
          console.log(`📊 进度: ${statusData.progress}%`)
          console.log(`📝 阶段: ${statusData.stageText}`)
        }
      }
      
    } else {
      console.error('❌ 云函数执行失败:', response.error)
    }
    
    console.log('🎉 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 测试超时配置
async function testTimeoutConfig() {
  console.log('⏱️ 测试超时配置...')
  
  const startTime = Date.now()
  
  try {
    const result = await wx.cloud.callFunction({
      name: 'processReportAsync',
      data: {
        reportId: `timeout_config_test_${Date.now()}`,
        fileId: 'test_file_id',
        reportType: 'flow'
      }
    })
    
    const endTime = Date.now()
    console.log(`⏱️ 执行时间: ${endTime - startTime}ms`)
    console.log('📊 结果:', result)
    
  } catch (error) {
    const endTime = Date.now()
    console.log(`⏱️ 失败时间: ${endTime - startTime}ms`)
    console.error('❌ 错误:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 超时修复测试脚本已加载

可用的测试函数：
1. testTimeoutFix() - 完整流程测试
2. testTimeoutConfig() - 超时配置测试

使用方法：
在控制台中输入函数名并执行，例如：
testTimeoutFix()
`)

window.testTimeoutFix = testTimeoutFix
window.testTimeoutConfig = testTimeoutConfig
