// debug.ts
Page({
  data: {
    debugInfo: '点击按钮进行调试操作',
    aiTesting: false,
    reportTesting: false
  },

  /**
   * 初始化数据库
   */
  async onInitDatabase() {
    try {
      wx.showLoading({
        title: '初始化中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'initDatabase'
      })
      
      wx.hideLoading()
      
      const response = result.result as any
      if (response?.success) {
        this.setData({
          debugInfo: `初始化成功：${response.results?.join('\n') || '完成'}`
        })
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        })
      } else {
        this.setData({
          debugInfo: `初始化失败：${response.message || '未知错误'}`
        })
        wx.showToast({
          title: '初始化失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('初始化数据库失败:', error)
      this.setData({
        debugInfo: `初始化失败：${error}`
      })
      wx.showToast({
        title: '初始化失败',
        icon: 'error'
      })
    }
  },

  /**
   * 刷新用户信息
   */
  async onRefreshUserInfo() {
    try {
      wx.showLoading({
        title: '刷新中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })
      
      wx.hideLoading()
      
      const response = result.result as any
      if (response?.success) {
        this.setData({
          debugInfo: `用户信息：${JSON.stringify(response.userInfo, null, 2)}`
        })
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      } else {
        this.setData({
          debugInfo: `刷新失败：${response.message || '未知错误'}`
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('刷新用户信息失败:', error)
      this.setData({
        debugInfo: `刷新失败：${error}`
      })
    }
  },

  /**
   * 查看订单列表
   */
  onViewOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders'
    })
  },

  /**
   * 测试AI服务连接
   */
  async onTestAIService() {
    this.setData({ aiTesting: true })

    try {
      console.log('🚀 开始测试AI服务连接...')

      const result = await wx.cloud.callFunction({
        name: 'testAIService',
        data: {
          testType: 'all'
        }
      })

      console.log('✅ 云函数调用成功:', result)

      const response = result.result as any
      if (response.success) {
        const { results } = response
        let debugInfo = `AI服务测试结果:\n`
        debugInfo += `总测试: ${results.summary.totalTests}\n`
        debugInfo += `成功: ${results.summary.successfulTests}\n`
        debugInfo += `失败: ${results.summary.failedTests}\n\n`

        // 显示各项测试详情
        Object.entries(results.tests).forEach(([testName, testResult]: [string, any]) => {
          if (testResult.success) {
            debugInfo += `✅ ${testName}: 通过\n`
          } else {
            debugInfo += `❌ ${testName}: ${testResult.error}\n`
          }
        })

        this.setData({ debugInfo })

        if (results.summary.overallSuccess) {
          wx.showToast({
            title: 'AI服务连接正常',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '部分测试失败',
            icon: 'error'
          })
        }
      } else {
        this.setData({
          debugInfo: `AI服务测试失败: ${response.error}`
        })
        wx.showToast({
          title: '测试失败',
          icon: 'error'
        })
      }

    } catch (error) {
      console.error('❌ 测试AI服务失败:', error)
      this.setData({
        debugInfo: `测试AI服务失败: ${error}`
      })
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      })
    } finally {
      this.setData({ aiTesting: false })
    }
  },

  /**
   * 测试报告处理流程
   */
  async onTestReportProcessing() {
    this.setData({ reportTesting: true })

    try {
      console.log('🚀 开始测试报告处理流程...')

      // 创建测试文件内容
      const testContent = `
银行流水测试文档
账户: 1234567890
余额: 50000.00
收入: 10000.00
支出: 5000.00
      `.trim()

      // 上传测试文件
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `test/test_flow_${Date.now()}.txt`,
        filePath: testContent
      })

      console.log('✅ 测试文件上传成功:', uploadResult.fileID)

      // 调用处理云函数
      const processResult = await wx.cloud.callFunction({
        name: 'processReportAsync',
        data: {
          reportId: `test_report_${Date.now()}`,
          fileId: uploadResult.fileID,
          reportType: 'flow'
        }
      })

      console.log('📊 处理结果:', processResult)

      const response = processResult.result as any
      if (response.success) {
        this.setData({
          debugInfo: `报告处理测试成功:\n报告ID: ${response.reportId}\n处理完成`
        })
        wx.showToast({
          title: '处理测试成功',
          icon: 'success'
        })
      } else {
        this.setData({
          debugInfo: `报告处理测试失败: ${response.error}`
        })
        wx.showToast({
          title: '处理测试失败',
          icon: 'error'
        })
      }

    } catch (error) {
      console.error('❌ 测试报告处理失败:', error)
      this.setData({
        debugInfo: `测试报告处理失败: ${error}`
      })
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      })
    } finally {
      this.setData({ reportTesting: false })
    }
  },

  /**
   * 测试字体加载
   */
  onTestFont() {
    wx.navigateTo({
      url: '/pages/font-test/font-test'
    })
  }
})
