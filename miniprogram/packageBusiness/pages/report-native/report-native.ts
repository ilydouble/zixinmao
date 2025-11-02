// miniprogram/pages/report-native/report-native.ts
Page({
  data: {
    reportId: '',
    loading: true,
    error: '',
    
    // 报告数据
    reportData: null as any,
    
    // 个人信息
    personalInfo: null as any,
    
    // 统计卡片
    stats: null as any,
    
    // 负债构成
    debtComposition: [] as any[],
    
    // 贷款详情
    loanCharts: [] as any[],
    loanSummary: null as any,
    bankLoans: [] as any[],
    nonBankLoans: [] as any[],
    
    // 信用卡
    creditUsage: null as any,
    creditCards: [] as any[],
    
    // 逾期分析
    overdueAnalysis: null as any,
    
    // 查询记录
    queryRecords: [] as any[],
    
    // 产品推荐
    productRecommendations: [] as any[],

    // AI专家分析
    aiExpertAnalysis: null as any
  },

  onLoad(options: any) {
    const reportId = options.reportId
    if (!reportId) {
      this.setData({
        loading: false,
        error: '缺少报告ID'
      })
      return
    }

    this.setData({ reportId })
    this.loadReportData()
  },

  async loadReportData() {
    try {
      console.log('📄 [报告页面] 开始加载报告数据, reportId:', this.data.reportId)

      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportDetail',
          reportId: this.data.reportId
        }
      })

      console.log('📊 [报告页面] 云函数返回结果:', result)

      if (result.result && (result.result as any).success) {
        const reportDetail = (result.result as any).data
        
        // 检查是否有analysisResult
        if (!reportDetail.analysisResult) {
          throw new Error('报告数据不存在，请重新生成报告')
        }

        const analysisResult = reportDetail.analysisResult

        console.log('✅ [报告页面] 报告数据加载成功')

        this.setData({
          loading: false,
          reportData: analysisResult,
          personalInfo: analysisResult.personal_info,
          stats: analysisResult.stats,
          debtComposition: analysisResult.debt_composition || [],
          loanCharts: analysisResult.loan_charts || [],
          loanSummary: analysisResult.loan_summary,
          bankLoans: analysisResult.bank_loans || [],
          nonBankLoans: analysisResult.non_bank_loans || [],
          creditUsage: analysisResult.credit_usage,
          creditCards: analysisResult.credit_cards || [],
          overdueAnalysis: analysisResult.overdue_analysis,
          queryRecords: analysisResult.query_records || [],
          productRecommendations: analysisResult.product_recommendations || [],
          aiExpertAnalysis: analysisResult.ai_expert_analysis || null
        })
      } else {
        throw new Error((result.result as any)?.error || '加载报告失败')
      }
    } catch (error: any) {
      console.error('❌ [报告页面] 加载报告失败:', error)
      this.setData({
        loading: false,
        error: error.message || '加载报告失败'
      })

      wx.showModal({
        title: '加载失败',
        content: error.message || '加载报告失败，请重试',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  // 格式化金额
  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0'
    return amount.toLocaleString('zh-CN')
  },

  // 获取风险等级颜色
  getRiskColor(level: string): string {
    const colorMap: Record<string, string> = {
      '低': '#4CAF50',
      '中': '#FF9800',
      '高': '#F44336',
      '极低': '#8BC34A',
      '极高': '#D32F2F'
    }
    return colorMap[level] || '#666'
  },

  // 获取使用率颜色
  getUsageColor(rate: number): string {
    if (rate < 30) return '#4CAF50'
    if (rate < 70) return '#FF9800'
    return '#F44336'
  },

  // 下载HTML报告
  async downloadHTMLReport() {
    try {
      wx.showLoading({ title: '准备下载...' })

      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'downloadReport',
          reportId: this.data.reportId,
          fileType: 'html'
        }
      })

      wx.hideLoading()

      if (result.result && (result.result as any).success) {
        const downloadUrl = (result.result as any).data.downloadUrl

        wx.showModal({
          title: '下载报告',
          content: '是否下载HTML格式报告？',
          success: (res) => {
            if (res.confirm) {
              wx.downloadFile({
                url: downloadUrl,
                success: (res) => {
                  if (res.statusCode === 200) {
                    wx.showToast({
                      title: '下载成功',
                      icon: 'success'
                    })
                  }
                },
                fail: () => {
                  wx.showToast({
                    title: '下载失败',
                    icon: 'none'
                  })
                }
              })
            }
          }
        })
      } else {
        throw new Error('获取下载链接失败')
      }
    } catch (error: any) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '下载失败',
        icon: 'none'
      })
    }
  },

  // 分享报告
  onShareAppMessage() {
    return {
      title: '个人征信分析报告',
      path: `/pages/report-native/report-native?reportId=${this.data.reportId}`
    }
  },

  /**
   * 获取风险等级颜色
   */
  getRiskColor(riskLevel: string): string {
    const colorMap: Record<string, string> = {
      '低': '#4CAF50',
      '中': '#FF9800',
      '高': '#F44336'
    }
    return colorMap[riskLevel] || '#2c3e50'
  }
})

