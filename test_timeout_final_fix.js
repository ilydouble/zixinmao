/**
 * 测试最终超时修复的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testFinalTimeoutFix() {
  console.log('🚀 开始测试最终超时修复...')
  
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
    
    console.log('📁 准备测试文件...')
    const fileBuffer = new TextEncoder().encode(testContent)
    
    // 2. 调用uploadFile云函数
    console.log('🔄 调用uploadFile云函数...')
    const startTime = Date.now()
    
    const result = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'timeout_fix_test.txt',
        reportType: 'flow'
      }
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ uploadFile执行时间: ${duration}ms`)
    console.log('📊 uploadFile结果:', result)
    
    const response = result.result
    if (response.success) {
      console.log('✅ uploadFile执行成功!')
      const reportId = response.reportId
      console.log(`📋 报告ID: ${reportId}`)
      
      // 3. 等待一段时间后检查状态
      console.log('⏳ 等待5秒后检查状态...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const statusResult = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: reportId
        }
      })
      
      console.log('📊 状态检查结果:', statusResult)
      
      const statusResponse = statusResult.result
      if (statusResponse.success) {
        const statusData = statusResponse.data
        console.log(`✅ 报告状态: ${statusData.status}`)
        console.log(`📊 进度: ${statusData.progress}%`)
        console.log(`📝 阶段: ${statusData.stageText}`)
        
        if (statusData.status === 'processing') {
          console.log('🔄 报告正在处理中，这是正常的')
          
          // 4. 继续监控一段时间
          console.log('🔍 继续监控30秒...')
          let checkCount = 0
          const maxChecks = 6 // 30秒，每5秒检查一次
          
          const checkInterval = setInterval(async () => {
            checkCount++
            console.log(`🔄 第${checkCount}次状态检查...`)
            
            try {
              const checkResult = await wx.cloud.callFunction({
                name: 'getReports',
                data: {
                  action: 'getReportStatus',
                  reportId: reportId
                }
              })
              
              const checkResponse = checkResult.result
              if (checkResponse.success) {
                const checkData = checkResponse.data
                console.log(`📊 状态: ${checkData.status}, 进度: ${checkData.progress}%`)
                
                if (checkData.status === 'completed') {
                  console.log('🎉 报告处理完成!')
                  clearInterval(checkInterval)
                } else if (checkData.status === 'failed') {
                  console.log('❌ 报告处理失败')
                  clearInterval(checkInterval)
                }
              }
              
              if (checkCount >= maxChecks) {
                console.log('⏰ 监控时间结束')
                clearInterval(checkInterval)
              }
              
            } catch (error) {
              console.error('❌ 状态检查失败:', error)
            }
          }, 5000)
          
        } else if (statusData.status === 'completed') {
          console.log('🎉 报告已完成!')
        } else if (statusData.status === 'failed') {
          console.log('❌ 报告处理失败')
        }
        
      } else {
        console.error('❌ 状态检查失败:', statusResponse.error)
      }
      
    } else {
      console.error('❌ uploadFile失败:', response.error)
    }
    
    console.log('🎉 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 测试简信宝
async function testJianxinTimeoutFix() {
  console.log('🚀 开始测试简信宝超时修复...')
  
  try {
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
    
    const fileBuffer = new TextEncoder().encode(testContent)
    
    const result = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'jianxin_timeout_test.txt',
        reportType: 'simple'
      }
    })
    
    console.log('📊 简信宝结果:', result)
    
    if (result.result.success) {
      console.log('✅ 简信宝uploadFile成功!')
      console.log(`📋 报告ID: ${result.result.reportId}`)
    } else {
      console.error('❌ 简信宝uploadFile失败:', result.result.error)
    }
    
  } catch (error) {
    console.error('❌ 简信宝测试失败:', error)
  }
}

// 测试专信宝
async function testZhuanxinTimeoutFix() {
  console.log('🚀 开始测试专信宝超时修复...')
  
  try {
    const testContent = `
详版征信测试文档
姓名: 李四
身份证: 987654321098765432
详细信用记录:
- 信用卡账户: 5个
- 贷款记录: 房贷1笔，车贷1笔
- 查询记录: 详细查询历史
- 担保信息: 无
信用评分: 800分
    `.trim()
    
    const fileBuffer = new TextEncoder().encode(testContent)
    
    const result = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'zhuanxin_timeout_test.txt',
        reportType: 'detail'
      }
    })
    
    console.log('📊 专信宝结果:', result)
    
    if (result.result.success) {
      console.log('✅ 专信宝uploadFile成功!')
      console.log(`📋 报告ID: ${result.result.reportId}`)
    } else {
      console.error('❌ 专信宝uploadFile失败:', result.result.error)
    }
    
  } catch (error) {
    console.error('❌ 专信宝测试失败:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 最终超时修复测试脚本已加载

可用的测试函数：
1. testFinalTimeoutFix() - 流水宝完整测试
2. testJianxinTimeoutFix() - 简信宝测试
3. testZhuanxinTimeoutFix() - 专信宝测试

使用方法：
在控制台中输入函数名并执行，例如：
testFinalTimeoutFix()
`)

window.testFinalTimeoutFix = testFinalTimeoutFix
window.testJianxinTimeoutFix = testJianxinTimeoutFix
window.testZhuanxinTimeoutFix = testZhuanxinTimeoutFix
