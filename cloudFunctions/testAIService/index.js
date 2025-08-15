const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// AI分析服务配置
const AI_ANALYSIS_SERVICE = {
  url: process.env.AI_ANALYSIS_SERVICE_URL || 'http://38.60.251.79:8002',
  timeout: 30000 // 30秒超时
}

/**
 * 测试AI分析服务连接
 */
exports.main = async (event, context) => {
  const { testType = 'health' } = event
  
  try {
    console.log(`测试AI分析服务: ${AI_ANALYSIS_SERVICE.url}`)
    
    const results = {
      serviceUrl: AI_ANALYSIS_SERVICE.url,
      timestamp: new Date().toISOString(),
      tests: {}
    }
    
    // 1. 健康检查测试
    if (testType === 'health' || testType === 'all') {
      console.log('测试健康检查接口...')
      try {
        const healthResponse = await axios.get(
          `${AI_ANALYSIS_SERVICE.url}/health`,
          { timeout: 10000 }
        )
        
        results.tests.health = {
          success: true,
          status: healthResponse.status,
          data: healthResponse.data,
          responseTime: Date.now()
        }
        
        console.log('健康检查成功:', healthResponse.data)
      } catch (error) {
        results.tests.health = {
          success: false,
          error: error.message,
          code: error.code,
          status: error.response?.status
        }
        console.error('健康检查失败:', error.message)
      }
    }
    
    // 2. 队列状态测试
    if (testType === 'queue' || testType === 'all') {
      console.log('测试队列状态接口...')
      try {
        const queueResponse = await axios.get(
          `${AI_ANALYSIS_SERVICE.url}/queue/stats`,
          { timeout: 10000 }
        )
        
        results.tests.queue = {
          success: true,
          status: queueResponse.status,
          data: queueResponse.data
        }
        
        console.log('队列状态获取成功:', queueResponse.data)
      } catch (error) {
        results.tests.queue = {
          success: false,
          error: error.message,
          code: error.code,
          status: error.response?.status
        }
        console.error('队列状态获取失败:', error.message)
      }
    }
    
    // 3. 提示词测试
    if (testType === 'prompts' || testType === 'all') {
      console.log('测试提示词接口...')
      try {
        const promptResponse = await axios.get(
          `${AI_ANALYSIS_SERVICE.url}/prompts/flow`,
          { timeout: 10000 }
        )
        
        results.tests.prompts = {
          success: true,
          status: promptResponse.status,
          promptLength: promptResponse.data.prompt_template?.length || 0
        }
        
        console.log('提示词获取成功，长度:', promptResponse.data.prompt_template?.length)
      } catch (error) {
        results.tests.prompts = {
          success: false,
          error: error.message,
          code: error.code,
          status: error.response?.status
        }
        console.error('提示词获取失败:', error.message)
      }
    }
    
    // 4. 简单分析测试（使用测试数据）
    if (testType === 'analyze' || testType === 'all') {
      console.log('测试分析接口...')
      try {
        // 创建一个简单的测试PDF base64
        const testPdfBase64 = Buffer.from('test pdf content').toString('base64')
        
        const analyzeResponse = await axios.post(
          `${AI_ANALYSIS_SERVICE.url}/analyze`,
          {
            file_base64: testPdfBase64,
            mime_type: 'application/pdf',
            report_type: 'flow'
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        )
        
        results.tests.analyze = {
          success: true,
          status: analyzeResponse.status,
          taskSubmitted: analyzeResponse.data.success,
          taskId: analyzeResponse.data.task_id
        }
        
        console.log('分析任务提交成功:', analyzeResponse.data)
      } catch (error) {
        results.tests.analyze = {
          success: false,
          error: error.message,
          code: error.code,
          status: error.response?.status,
          responseData: error.response?.data
        }
        console.error('分析任务提交失败:', error.message)
      }
    }
    
    // 5. 网络连接测试
    if (testType === 'network' || testType === 'all') {
      console.log('测试网络连接...')
      try {
        const startTime = Date.now()
        const response = await axios.get(
          `${AI_ANALYSIS_SERVICE.url}/health`,
          { timeout: 5000 }
        )
        const endTime = Date.now()
        
        results.tests.network = {
          success: true,
          responseTime: endTime - startTime,
          status: response.status
        }
        
        console.log(`网络连接正常，响应时间: ${endTime - startTime}ms`)
      } catch (error) {
        results.tests.network = {
          success: false,
          error: error.message,
          code: error.code,
          timeout: error.code === 'ECONNABORTED'
        }
        console.error('网络连接失败:', error.message)
      }
    }
    
    // 统计结果
    const totalTests = Object.keys(results.tests).length
    const successfulTests = Object.values(results.tests).filter(test => test.success).length
    
    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      overallSuccess: successfulTests === totalTests
    }
    
    console.log(`测试完成: ${successfulTests}/${totalTests} 成功`)
    
    return {
      success: true,
      message: `AI服务测试完成: ${successfulTests}/${totalTests} 成功`,
      results
    }
    
  } catch (error) {
    console.error('测试AI服务时发生错误:', error)
    
    return {
      success: false,
      error: error.message,
      serviceUrl: AI_ANALYSIS_SERVICE.url,
      timestamp: new Date().toISOString()
    }
  }
}
