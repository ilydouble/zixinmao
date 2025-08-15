/**
 * 测试终止报告功能的脚本
 * 在小程序开发者工具控制台中运行
 */

async function testCancelReport() {
  console.log('🚀 开始测试终止报告功能...')
  
  try {
    // 1. 创建一个测试报告
    const testContent = `
简版征信测试文档
姓名: 测试用户
身份证: 123456789012345678
信用记录: 测试数据
    `.trim()
    
    console.log('📁 创建测试报告...')
    const fileBuffer = new TextEncoder().encode(testContent)
    
    const uploadResult = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'cancel_test.txt',
        reportType: 'simple'
      }
    })
    
    console.log('📊 上传结果:', uploadResult)
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`✅ 测试报告创建成功: ${reportId}`)
    
    // 2. 等待一下让报告进入处理状态
    console.log('⏳ 等待3秒让报告进入处理状态...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 3. 检查报告状态
    console.log('🔍 检查报告状态...')
    const statusResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportStatus',
        reportId: reportId
      }
    })
    
    console.log('📊 状态检查结果:', statusResult)
    
    if (statusResult.result.success) {
      const statusData = statusResult.result.data
      console.log(`📋 当前状态: ${statusData.status}`)
      console.log(`📊 当前进度: ${statusData.progress}%`)
      
      // 4. 尝试终止报告
      console.log('🛑 尝试终止报告...')
      const cancelResult = await wx.cloud.callFunction({
        name: 'cancelReport',
        data: {
          reportId: reportId
        }
      })
      
      console.log('📊 终止结果:', cancelResult)
      
      if (cancelResult.result.success) {
        console.log('✅ 报告终止成功!')
        
        // 5. 验证报告是否已被删除
        console.log('🔍 验证报告是否已被删除...')
        const verifyResult = await wx.cloud.callFunction({
          name: 'getReports',
          data: {
            action: 'getReportStatus',
            reportId: reportId
          }
        })
        
        console.log('📊 验证结果:', verifyResult)
        
        if (verifyResult.result.error === 'REPORT_NOT_FOUND') {
          console.log('✅ 报告已成功删除!')
        } else {
          console.log('⚠️ 报告可能未完全删除')
        }
        
      } else {
        console.error('❌ 报告终止失败:', cancelResult.result.error)
      }
      
    } else {
      console.error('❌ 状态检查失败:', statusResult.result.error)
    }
    
    console.log('🎉 终止功能测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 测试终止不同状态的报告
async function testCancelDifferentStates() {
  console.log('🚀 测试终止不同状态的报告...')
  
  try {
    // 1. 创建一个报告
    const testContent = 'Test content for different states'
    const fileBuffer = new TextEncoder().encode(testContent)
    
    const uploadResult = await wx.cloud.callFunction({
      name: 'uploadFile',
      data: {
        fileBuffer: Array.from(fileBuffer),
        fileName: 'state_test.txt',
        reportType: 'simple'
      }
    })
    
    if (!uploadResult.result.success) {
      throw new Error('创建测试报告失败')
    }
    
    const reportId = uploadResult.result.reportId
    console.log(`📋 测试报告ID: ${reportId}`)
    
    // 2. 立即尝试终止（可能是pending状态）
    console.log('🛑 立即尝试终止报告...')
    const cancelResult1 = await wx.cloud.callFunction({
      name: 'cancelReport',
      data: {
        reportId: reportId
      }
    })
    
    console.log('📊 立即终止结果:', cancelResult1)
    
    if (cancelResult1.result.success) {
      console.log('✅ pending状态报告终止成功!')
    } else {
      console.log('❌ pending状态报告终止失败:', cancelResult1.result.error)
      
      // 3. 等待进入processing状态后再试
      console.log('⏳ 等待5秒后再次尝试...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const cancelResult2 = await wx.cloud.callFunction({
        name: 'cancelReport',
        data: {
          reportId: reportId
        }
      })
      
      console.log('📊 延迟终止结果:', cancelResult2)
      
      if (cancelResult2.result.success) {
        console.log('✅ processing状态报告终止成功!')
      } else {
        console.log('❌ processing状态报告终止失败:', cancelResult2.result.error)
      }
    }
    
  } catch (error) {
    console.error('❌ 不同状态测试失败:', error)
  }
}

// 测试终止已完成的报告（应该失败）
async function testCancelCompletedReport() {
  console.log('🚀 测试终止已完成的报告（应该失败）...')
  
  try {
    // 获取一个已完成的报告ID（如果有的话）
    const listResult = await wx.cloud.callFunction({
      name: 'getReports',
      data: {
        action: 'getReportsList',
        reportType: 'simple',
        page: 1,
        pageSize: 10
      }
    })
    
    if (listResult.result.success && listResult.result.data.reports.length > 0) {
      const completedReport = listResult.result.data.reports.find(r => r.status === 'completed')
      
      if (completedReport) {
        console.log(`📋 找到已完成的报告: ${completedReport.reportId}`)
        
        const cancelResult = await wx.cloud.callFunction({
          name: 'cancelReport',
          data: {
            reportId: completedReport.reportId
          }
        })
        
        console.log('📊 终止已完成报告结果:', cancelResult)
        
        if (!cancelResult.result.success) {
          console.log('✅ 正确拒绝了终止已完成的报告')
        } else {
          console.log('❌ 错误地允许了终止已完成的报告')
        }
      } else {
        console.log('⚠️ 没有找到已完成的报告进行测试')
      }
    } else {
      console.log('⚠️ 无法获取报告列表')
    }
    
  } catch (error) {
    console.error('❌ 已完成报告测试失败:', error)
  }
}

// 在控制台中使用
console.log(`
🧪 终止报告功能测试脚本已加载

可用的测试函数：
1. testCancelReport() - 基本终止功能测试
2. testCancelDifferentStates() - 不同状态终止测试
3. testCancelCompletedReport() - 已完成报告终止测试

使用方法：
在控制台中输入函数名并执行，例如：
testCancelReport()
`)

window.testCancelReport = testCancelReport
window.testCancelDifferentStates = testCancelDifferentStates
window.testCancelCompletedReport = testCancelCompletedReport
