/**
 * 测试简信宝修复的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testJianxinFix() {
  console.log('🚀 开始测试简信宝修复...')
  
  try {
    // 1. 创建测试文件
    const testContent = `
简版征信测试文档
姓名: 张三
身份证: 123456789012345678
信用记录:
- 信用卡: 正常
- 贷款记录: 无逾期
- 查询记录: 近期查询3次
信用评分: 750分
    `.trim()
    
    console.log('📁 上传测试文件...')
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: `test/jianxin_test_${Date.now()}.txt`,
      filePath: testContent
    })
    
    console.log('✅ 文件上传成功:', uploadResult.fileID)
    
    // 2. 读取文件内容为Buffer（模拟前端读取）
    const fileBuffer = new TextEncoder().encode(testContent)

    console.log('📋 调用uploadFile云函数...')
    const uploadFileResult = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer), // 转换为数组格式
        fileName: 'jianxin_test.txt',
        reportType: 'simple'
      }
    })

    console.log('📊 uploadFile结果:', uploadFileResult)

    const uploadResponse = uploadFileResult.result
    if (uploadResponse.success) {
      console.log('✅ 简信宝文件上传和处理启动成功!')
      const reportId = uploadResponse.reportId
      console.log(`📋 报告ID: ${reportId}`)

      // 3. 测试状态轮询
      console.log('🔍 测试状态轮询...')

      const pollResult = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: reportId
        }
      })

      console.log('📊 轮询结果:', pollResult)

      const pollResponse = pollResult.result
      if (pollResponse.success) {
        const statusData = pollResponse.data
        console.log(`✅ 报告状态: ${statusData.status}`)
        console.log(`📊 进度: ${statusData.progress}%`)
        console.log(`📝 阶段: ${statusData.stageText}`)
        console.log(`🤖 任务状态: ${statusData.taskStatus}`)
      }

      // 4. 测试报告列表
      console.log('📋 测试报告列表...')

      const listResult = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportsList',
          reportType: 'simple',
          page: 1,
          pageSize: 10
        }
      })

      console.log('📊 列表结果:', listResult)

      const listResponse = listResult.result
      if (listResponse.success) {
        console.log(`✅ 找到 ${listResponse.data.reports.length} 个简信宝报告`)

        // 查找我们刚创建的报告
        const ourReport = listResponse.data.reports.find(r => r.reportId === reportId)
        if (ourReport) {
          console.log('✅ 找到我们创建的报告:', ourReport)
        } else {
          console.log('⚠️ 未找到我们创建的报告')
        }
      }

    } else {
      console.error('❌ 简信宝uploadFile失败:', uploadResponse.error)
    }
    
    console.log('🎉 简信宝测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 测试简信宝页面的轮询逻辑
async function testJianxinPolling() {
  console.log('🔄 测试简信宝轮询逻辑...')
  
  try {
    // 模拟一个存在的报告ID进行轮询测试
    const testReportId = 'test_report_for_polling'
    
    const result = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: testReportId
      }
    })
    
    console.log('📊 轮询测试结果:', result)
    
    const response = result.result
    if (response.success) {
      console.log('✅ 轮询逻辑正常')
    } else if (response.error === 'REPORT_NOT_FOUND') {
      console.log('✅ 错误处理正常 - 报告不存在')
    } else {
      console.log('⚠️ 其他错误:', response.error)
    }
    
  } catch (error) {
    console.error('❌ 轮询测试失败:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 简信宝修复测试脚本已加载

可用的测试函数：
1. testJianxinFix() - 完整流程测试
2. testJianxinPolling() - 轮询逻辑测试

使用方法：
在控制台中输入函数名并执行，例如：
testJianxinFix()
`)

window.testJianxinFix = testJianxinFix
window.testJianxinPolling = testJianxinPolling
