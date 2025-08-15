const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 指定的用户ID
const TARGET_USER_ID = 'ogbda1wnM7p73VGSgfQD4lUMsQKo'

exports.main = async (event, context) => {
  try {
    console.log(`开始初始化报告数据集，目标用户ID: ${TARGET_USER_ID}`)
    
    // 清理旧的测试数据
    await cleanupOldReportData()
    
    // 创建测试用户记录
    await createTestUser()
    
    // 创建测试报告记录
    await createTestReports()
    
    // 创建关键测试文件
    await createTestFiles()
    
    return {
      success: true,
      message: '报告数据集初始化完成',
      userId: TARGET_USER_ID,
      reportCount: 5,
      details: [
        '✅ 清理旧数据完成',
        '✅ 创建测试用户完成',
        '✅ 创建5个测试报告完成',
        '✅ 创建关键测试文件完成',
        `📊 数据归属用户: ${TARGET_USER_ID}`,
        '🎯 包含: 流水宝(2个) + 简信宝(2个) + 专信宝(1个)'
      ]
    }
    
  } catch (error) {
    console.error('报告数据集初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 清理旧的报告测试数据
 */
async function cleanupOldReportData() {
  try {
    console.log('清理旧的报告测试数据...')
    
    // 删除指定用户的旧测试报告
    const oldReports = await db.collection('reports')
      .where({
        userId: TARGET_USER_ID
      })
      .get()
    
    for (const report of oldReports.data) {
      if (report._id.startsWith('test_report_')) {
        await db.collection('reports').doc(report._id).remove()
        console.log(`删除旧测试报告: ${report._id}`)
      }
    }
    
    // 删除用户记录（如果存在）
    try {
      await db.collection('users').doc(TARGET_USER_ID).remove()
      console.log(`删除旧用户记录: ${TARGET_USER_ID}`)
    } catch (error) {
      // 忽略不存在的记录
    }
    
    console.log('旧数据清理完成')
    
  } catch (error) {
    console.error('清理数据失败:', error)
    // 不抛出错误，继续创建新数据
  }
}

/**
 * 创建测试用户
 */
async function createTestUser() {
  const testUser = {
    _id: TARGET_USER_ID,
    openid: TARGET_USER_ID,
    unionid: `union_${TARGET_USER_ID}`,
    nickName: '测试用户',
    avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/test.png',
    gender: 1,
    country: '中国',
    province: '北京',
    city: '北京',
    language: 'zh_CN',
    
    // 实名认证信息
    realNameAuth: {
      isVerified: true,
      realName: '测试用户',
      idCard: '110101199001011234',
      verifyTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      verifyMethod: 'manual'
    },
    
    // 账户信息
    balance: 185.50,
    totalRecharge: 300.00,
    totalConsumption: 114.50,
    
    // 统计信息
    reportCount: {
      flow: 2,
      simple: 2,
      detail: 1,
      total: 5
    },
    
    lastLoginTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active'
  }
  
  await db.collection('users').add({ data: testUser })
  console.log(`测试用户创建成功: ${testUser.nickName} (${testUser._id})`)
}

/**
 * 创建测试报告记录
 */
async function createTestReports() {
  const testReports = [
    // 流水宝测试报告 - 已完成
    {
      _id: 'test_report_1',
      userId: TARGET_USER_ID,
      reportType: 'flow',
      
      input: {
        originalFileName: '工商银行流水_2024年11月.pdf',
        fileSize: 2048576,
        uploadTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        cloudPath: `uploads/flow/${TARGET_USER_ID}/test_flow.pdf`,
        fileId: `cloud://test-env.test-bucket/uploads/flow/${TARGET_USER_ID}/test_flow.pdf`
      },
      
      processing: {
        status: 'completed',
        progress: 100,
        currentStage: 'COMPLETED',
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
        processingTime: '5分钟',
        errorMessage: null,
        estimatedTimeRemaining: 0
      },
      
      algorithm: {
        requestId: 'req_test_flow_001',
        apiEndpoint: '/analyze/bankflow',
        prompt: '请分析这份银行流水文件...',
        requestTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        responseTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000),
        retryCount: 0
      },
      
      output: {
        reportFiles: {
          jsonUrl: 'cloud://test-env.test-bucket/reports/flow/test_report_1/analysis.json',
          pdfUrl: 'cloud://test-env.test-bucket/reports/flow/test_report_1/report.pdf',
          htmlUrl: 'cloud://test-env.test-bucket/reports/flow/test_report_1/report.html'
        },
        summary: {
          totalIncome: 50000.00,
          totalExpense: 35000.00,
          netFlow: 15000.00,
          analysisScore: 85,
          riskLevel: '低风险',
          reportTitle: '银行流水分析报告',
          generateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        fileInfo: {
          jsonFileSize: 8192,
          pdfFileSize: 102400,
          downloadCount: 2,
          lastDownloadTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      },
      
      metadata: {
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        version: '1.0',
        tags: ['银行流水', '收支分析', '资金流向'],
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      }
    },
    
    // 简信宝测试报告 - 已完成
    {
      _id: 'test_report_2',
      userId: TARGET_USER_ID,
      reportType: 'simple',
      
      input: {
        originalFileName: '个人征信报告_简版_张三.pdf',
        fileSize: 1536000,
        uploadTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        cloudPath: `uploads/simple/${TARGET_USER_ID}/test_simple.pdf`,
        fileId: `cloud://test-env.test-bucket/uploads/simple/${TARGET_USER_ID}/test_simple.pdf`
      },
      
      processing: {
        status: 'completed',
        progress: 100,
        currentStage: 'COMPLETED',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
        processingTime: '3分钟',
        errorMessage: null,
        estimatedTimeRemaining: 0
      },
      
      algorithm: {
        requestId: 'req_test_simple_001',
        apiEndpoint: '/analyze/credit-simple',
        prompt: '请分析这份简版征信报告...',
        requestTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        responseTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
        retryCount: 0
      },
      
      output: {
        reportFiles: {
          jsonUrl: 'cloud://test-env.test-bucket/reports/simple/test_report_2/analysis.json',
          pdfUrl: 'cloud://test-env.test-bucket/reports/simple/test_report_2/report.pdf',
          htmlUrl: 'cloud://test-env.test-bucket/reports/simple/test_report_2/report.html'
        },
        summary: {
          creditScore: 750,
          creditLevel: '优秀',
          totalCreditLimit: 180000.00,
          usedCreditLimit: 45000.00,
          utilizationRate: 25.0,
          analysisScore: 88,
          riskLevel: '低风险',
          reportTitle: '简版征信分析报告',
          generateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        fileInfo: {
          jsonFileSize: 6144,
          pdfFileSize: 81920,
          downloadCount: 1,
          lastDownloadTime: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      },
      
      metadata: {
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        version: '1.0',
        tags: ['征信报告', '信用分析', '简版'],
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    }
    ,

    // 专信宝测试报告 - 已完成
    {
      _id: 'test_report_3',
      userId: TARGET_USER_ID,
      reportType: 'detail',

      input: {
        originalFileName: '个人征信报告_详版_李四.pdf',
        fileSize: 3072000,
        uploadTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        cloudPath: `uploads/detail/${TARGET_USER_ID}/test_detail.pdf`,
        fileId: `cloud://test-env.test-bucket/uploads/detail/${TARGET_USER_ID}/test_detail.pdf`
      },

      processing: {
        status: 'completed',
        progress: 100,
        currentStage: 'COMPLETED',
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
        processingTime: '8分钟',
        errorMessage: null,
        estimatedTimeRemaining: 0
      },

      algorithm: {
        requestId: 'req_test_detail_001',
        apiEndpoint: '/analyze/credit-detail',
        prompt: '请分析这份详版征信报告...',
        requestTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        responseTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000),
        retryCount: 0
      },

      output: {
        reportFiles: {
          jsonUrl: 'cloud://test-env.test-bucket/reports/detail/test_report_3/analysis.json',
          pdfUrl: 'cloud://test-env.test-bucket/reports/detail/test_report_3/report.pdf',
          htmlUrl: 'cloud://test-env.test-bucket/reports/detail/test_report_3/report.html'
        },
        summary: {
          creditScore: 780,
          creditLevel: '优秀',
          totalCreditLimit: 350000.00,
          usedCreditLimit: 78750.00,
          utilizationRate: 22.5,
          analysisScore: 92,
          riskLevel: '极低风险',
          reportTitle: '详版征信分析报告',
          generateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        fileInfo: {
          jsonFileSize: 12288,
          pdfFileSize: 153600,
          downloadCount: 0,
          lastDownloadTime: null
        }
      },

      metadata: {
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        version: '1.0',
        tags: ['征信报告', '信用分析', '详版', '专业分析'],
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      }
    },

    // 流水宝测试报告 - 处理中
    {
      _id: 'test_report_4',
      userId: TARGET_USER_ID,
      reportType: 'flow',

      input: {
        originalFileName: '招商银行流水_2024年12月.pdf',
        fileSize: 1843200,
        uploadTime: new Date(Date.now() - 30 * 60 * 1000),
        cloudPath: `uploads/flow/${TARGET_USER_ID}/test_flow_processing.pdf`,
        fileId: `cloud://test-env.test-bucket/uploads/flow/${TARGET_USER_ID}/test_flow_processing.pdf`
      },

      processing: {
        status: 'processing',
        progress: 65,
        currentStage: 'AI_ANALYSIS',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: null,
        processingTime: null,
        errorMessage: null,
        estimatedTimeRemaining: 120
      },

      algorithm: {
        requestId: 'req_test_flow_002',
        apiEndpoint: '/analyze/bankflow',
        prompt: '请分析这份银行流水文件...',
        requestTime: new Date(Date.now() - 25 * 60 * 1000),
        responseTime: null,
        retryCount: 0
      },

      output: {
        reportFiles: {
          jsonUrl: null,
          pdfUrl: null,
          htmlUrl: null
        },
        summary: null,
        fileInfo: {
          jsonFileSize: 0,
          pdfFileSize: 0,
          downloadCount: 0,
          lastDownloadTime: null
        }
      },

      metadata: {
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        version: '1.0',
        tags: ['银行流水', '收支分析', '资金流向'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },

    // 简信宝测试报告 - 失败
    {
      _id: 'test_report_5',
      userId: TARGET_USER_ID,
      reportType: 'simple',

      input: {
        originalFileName: '征信报告_损坏文件.pdf',
        fileSize: 512000,
        uploadTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        cloudPath: `uploads/simple/${TARGET_USER_ID}/test_simple_failed.pdf`,
        fileId: `cloud://test-env.test-bucket/uploads/simple/${TARGET_USER_ID}/test_simple_failed.pdf`
      },

      processing: {
        status: 'failed',
        progress: 35,
        currentStage: 'FAILED',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        processingTime: null,
        errorMessage: 'PDF文件损坏，无法解析内容',
        estimatedTimeRemaining: 0
      },

      algorithm: {
        requestId: 'req_test_simple_002',
        apiEndpoint: '/analyze/credit-simple',
        prompt: '请分析这份简版征信报告...',
        requestTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        responseTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        retryCount: 2
      },

      output: {
        reportFiles: {
          jsonUrl: null,
          pdfUrl: null,
          htmlUrl: null
        },
        summary: null,
        fileInfo: {
          jsonFileSize: 0,
          pdfFileSize: 0,
          downloadCount: 0,
          lastDownloadTime: null
        }
      },

      metadata: {
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        version: '1.0',
        tags: ['征信报告', '信用分析', '简版'],
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    }
  ]

  // 批量插入报告
  for (const report of testReports) {
    await db.collection('reports').add({ data: report })
    console.log(`测试报告创建成功: ${report._id}`)
  }
}

/**
 * 创建关键测试文件
 */
async function createTestFiles() {
  console.log('开始创建关键测试文件...')

  // 只创建最关键的几个文件，减少上传时间
  const essentialFiles = [
    // 一个JSON分析结果文件
    {
      path: 'reports/flow/test_report_1/analysis.json',
      content: JSON.stringify({
        summary: '银行流水分析报告 - 测试数据',
        totalIncome: 50000,
        totalExpense: 35000,
        netFlow: 15000,
        riskLevel: '低风险',
        generateTime: new Date().toISOString(),
        userId: TARGET_USER_ID
      }, null, 2)
    },

    // 一个简单的HTML报告
    {
      path: 'reports/flow/test_report_1/report.html',
      content: generateSimpleHTMLReport('银行流水分析报告', TARGET_USER_ID)
    }
  ]

  // 快速上传关键文件
  for (const file of essentialFiles) {
    try {
      await cloud.uploadFile({
        cloudPath: file.path,
        fileContent: Buffer.from(file.content, 'utf8')
      })
      console.log(`关键文件上传成功: ${file.path}`)
    } catch (error) {
      console.error(`文件上传失败: ${file.path}`, error)
      // 继续执行，不中断流程
    }
  }

  console.log('关键测试文件创建完成')
}

/**
 * 生成简化的HTML报告
 */
function generateSimpleHTMLReport(title, userId) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; padding: 20px; }
        .content { padding: 20px; }
        .user-info { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p><strong>这是测试数据，仅供演示使用</strong></p>
    </div>
    <div class="content">
        <div class="user-info">
            <strong>用户ID:</strong> ${userId}
        </div>
        <h2>分析摘要</h2>
        <p>这是一份专门为用户 ${userId} 生成的测试报告。</p>
        <h2>主要数据</h2>
        <ul>
            <li>总收入: ¥50,000</li>
            <li>总支出: ¥35,000</li>
            <li>净流入: ¥15,000</li>
            <li>风险等级: 低风险</li>
        </ul>
    </div>
</body>
</html>
  `
}
