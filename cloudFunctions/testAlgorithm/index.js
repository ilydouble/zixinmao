const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { reportType = 'flow', testMode = 'mock' } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    console.log(`开始测试算法接口 - 类型: ${reportType}, 模式: ${testMode}`)
    
    let result
    
    if (testMode === 'mock') {
      // 模拟测试模式
      result = await testMockAlgorithm(reportType)
    } else {
      // 真实接口测试模式
      result = await testRealAlgorithm(reportType)
    }
    
    return {
      success: true,
      testMode,
      reportType,
      result,
      timestamp: new Date().toISOString(),
      userId: OPENID
    }
    
  } catch (error) {
    console.error('算法接口测试失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      testMode,
      reportType,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 测试模拟算法接口
 */
async function testMockAlgorithm(reportType) {
  console.log(`测试模拟算法接口: ${reportType}`)
  
  // 模拟不同类型的分析结果
  const mockResults = {
    flow: {
      analysisType: '银行流水分析',
      summary: {
        totalIncome: 50000.00,
        totalExpense: 35000.00,
        netFlow: 15000.00,
        avgMonthlyIncome: 16666.67,
        avgMonthlyExpense: 11666.67,
        analysisScore: 85,
        riskLevel: '低风险'
      },
      details: {
        incomeAnalysis: {
          salaryIncome: 45000.00,
          otherIncome: 5000.00,
          incomeStability: '稳定'
        },
        expenseAnalysis: {
          livingExpense: 20000.00,
          loanRepayment: 8000.00,
          otherExpense: 7000.00,
          expensePattern: '正常'
        },
        cashFlowAnalysis: {
          positiveMonths: 3,
          negativeMonths: 0,
          flowStability: '良好'
        }
      },
      recommendations: [
        '收入来源稳定，建议继续保持',
        '支出结构合理，可适当增加投资',
        '现金流良好，具备较强还款能力'
      ]
    },
    
    simple: {
      analysisType: '简版征信分析',
      summary: {
        creditScore: 750,
        creditLevel: '优秀',
        totalCreditLimit: 180000.00,
        usedCreditLimit: 45000.00,
        utilizationRate: 25.0,
        analysisScore: 88,
        riskLevel: '低风险'
      },
      details: {
        creditHistory: {
          accountCount: 8,
          oldestAccount: '2018-03-15',
          avgAccountAge: '3.5年'
        },
        paymentHistory: {
          onTimePayments: 95,
          latePayments: 2,
          paymentReliability: '优秀'
        },
        creditUtilization: {
          currentUtilization: 25.0,
          maxUtilization: 45.0,
          utilizationTrend: '稳定'
        }
      },
      recommendations: [
        '信用记录优秀，建议继续保持',
        '信用利用率合理，可适当提升额度',
        '还款记录良好，信用风险较低'
      ]
    },
    
    detail: {
      analysisType: '详版征信分析',
      summary: {
        creditScore: 780,
        creditLevel: '优秀',
        totalCreditLimit: 350000.00,
        usedCreditLimit: 78750.00,
        utilizationRate: 22.5,
        analysisScore: 92,
        riskLevel: '极低风险'
      },
      details: {
        personalInfo: {
          identityVerification: '已验证',
          contactStability: '稳定',
          addressHistory: '3个地址，均已验证'
        },
        creditAccounts: {
          creditCards: 6,
          loans: 2,
          totalAccounts: 8,
          closedAccounts: 1
        },
        paymentBehavior: {
          perfectPayments: 98,
          minorDelays: 1,
          seriousDelays: 0,
          behaviorScore: 95
        },
        creditInquiries: {
          recentInquiries: 2,
          inquiryFrequency: '低',
          inquiryImpact: '轻微'
        },
        publicRecords: {
          bankruptcies: 0,
          liens: 0,
          judgments: 0,
          recordsScore: 100
        }
      },
      recommendations: [
        '征信记录优异，建议继续保持良好习惯',
        '信用结构合理，可考虑申请更高额度',
        '还款能力强，适合申请优质金融产品',
        '建议定期监控征信变化，保持记录完整性'
      ]
    }
  }
  
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const result = mockResults[reportType] || mockResults.flow
  
  return {
    status: 'success',
    processingTime: '1.2秒',
    data: result,
    apiEndpoint: `/mock/analyze/${reportType}`,
    requestId: `mock_${reportType}_${Date.now()}`
  }
}

/**
 * 测试真实算法接口
 */
async function testRealAlgorithm(reportType) {
  console.log(`测试真实算法接口: ${reportType}`)
  
  // 这里应该调用真实的算法接口
  // 目前返回模拟结果，实际使用时需要替换为真实的API调用
  
  const apiEndpoints = {
    flow: 'https://api.example.com/analyze/bankflow',
    simple: 'https://api.example.com/analyze/credit-simple', 
    detail: 'https://api.example.com/analyze/credit-detail'
  }
  
  const endpoint = apiEndpoints[reportType]
  
  try {
    // 模拟HTTP请求
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer YOUR_API_KEY'
    //   },
    //   body: JSON.stringify({
    //     fileUrl: 'test_file_url',
    //     analysisType: reportType
    //   })
    // })
    
    // 目前返回模拟成功结果
    return {
      status: 'success',
      message: '真实接口测试 - 当前为模拟模式',
      endpoint: endpoint,
      note: '请配置真实的API接口地址和认证信息',
      processingTime: '模拟3.5秒',
      requestId: `real_${reportType}_${Date.now()}`
    }
    
  } catch (error) {
    throw new Error(`真实接口调用失败: ${error.message}`)
  }
}
