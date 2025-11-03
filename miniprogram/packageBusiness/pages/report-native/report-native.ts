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

    // 贷款合计
    bankLoanTotal: {
      creditLimit: 0,
      balance: 0,
      usageRate: '0.0'
    },
    nonBankLoanTotal: {
      creditLimit: 0,
      balance: 0,
      usageRate: '0.0'
    },
    grandLoanTotal: {
      creditLimit: 0,
      balance: 0,
      usageRate: '0.0'
    },

    // 信用卡
    creditUsage: null as any,
    creditCards: [] as any[],

    // 信用卡合计
    creditCardTotal: {
      creditLimit: 0,
      usedAmount: 0,
      installmentBalance: 0,
      usageRate: '0.00'
    },
    
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

        // 计算贷款合计
        const bankLoans = analysisResult.bank_loans || []
        const nonBankLoans = analysisResult.non_bank_loans || []
        const creditCards = analysisResult.credit_cards || []

        const bankLoanTotal = this.calculateLoanTotal(bankLoans)
        const nonBankLoanTotal = this.calculateLoanTotal(nonBankLoans)
        const grandLoanTotal = {
          creditLimit: bankLoanTotal.creditLimit + nonBankLoanTotal.creditLimit,
          balance: bankLoanTotal.balance + nonBankLoanTotal.balance,
          usageRate: (bankLoanTotal.creditLimit + nonBankLoanTotal.creditLimit) > 0
            ? (((bankLoanTotal.balance + nonBankLoanTotal.balance) / (bankLoanTotal.creditLimit + nonBankLoanTotal.creditLimit)) * 100).toFixed(1)
            : '0.0'
        }

        const creditCardTotal = this.calculateCreditCardTotal(creditCards)

        this.setData({
          loading: false,
          reportData: analysisResult,
          personalInfo: analysisResult.personal_info,
          stats: analysisResult.stats,
          debtComposition: analysisResult.debt_composition || [],
          loanCharts: analysisResult.loan_charts || [],
          loanSummary: analysisResult.loan_summary,
          bankLoans: bankLoans,
          nonBankLoans: nonBankLoans,
          bankLoanTotal: bankLoanTotal,
          nonBankLoanTotal: nonBankLoanTotal,
          grandLoanTotal: grandLoanTotal,
          creditUsage: analysisResult.credit_usage,
          creditCards: creditCards,
          creditCardTotal: creditCardTotal,
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

  /**
   * 计算贷款合计
   */
  calculateLoanTotal(loans: any[]) {
    const creditLimit = loans.reduce((sum, loan) => sum + (loan.credit_limit || 0), 0)
    const balance = loans.reduce((sum, loan) => sum + (loan.balance || 0), 0)
    const usageRate = creditLimit > 0 ? ((balance / creditLimit) * 100).toFixed(1) : '0.0'

    return {
      creditLimit,
      balance,
      usageRate
    }
  },

  /**
   * 计算信用卡合计
   */
  calculateCreditCardTotal(cards: any[]) {
    const creditLimit = cards.reduce((sum, card) => sum + (card.credit_limit || 0), 0)
    const usedAmount = cards.reduce((sum, card) => sum + (card.used_amount || 0), 0)
    const installmentBalance = cards.reduce((sum, card) => sum + (card.installment_balance || 0), 0)
    const usageRate = creditLimit > 0 ? ((usedAmount / creditLimit) * 100).toFixed(2) : '0.00'

    return {
      creditLimit,
      usedAmount,
      installmentBalance,
      usageRate
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

      if (result.result && (result.result as any).success) {
        const downloadData = (result.result as any).data
        const downloadUrl = downloadData.downloadUrl
        const fileName = downloadData.fileName || `报告_${this.data.reportId}.html`

        console.log('HTML报告下载链接:', downloadUrl)
        console.log('文件名:', fileName)

        // 下载HTML文件
        wx.downloadFile({
          url: downloadUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              console.log('HTML文件下载成功:', res.tempFilePath)
              wx.hideLoading()

              // 获取系统信息，判断平台
              const systemInfo = wx.getSystemInfoSync()
              const isIOS = systemInfo.platform === 'ios'

              if (isIOS) {
                // iOS平台：直接分享文件（推荐方式）
                wx.showModal({
                  title: 'HTML报告已准备好',
                  content: 'iOS系统建议使用"分享文件"功能：\n\n1. 发送到"文件传输助手"\n2. 在聊天中长按文件\n3. 选择"用Safari打开"查看报告\n4. 或选择"存储到文件"保存',
                  confirmText: '分享文件',
                  cancelText: '取消',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 分享文件（可以保存到文件App）
                      wx.shareFileMessage({
                        filePath: res.tempFilePath,
                        fileName: fileName,
                        success: () => {
                          wx.showToast({
                            title: '已发送，可在聊天中打开',
                            icon: 'success',
                            duration: 3000
                          })
                        },
                        fail: (err) => {
                          console.error('分享失败:', err)
                          wx.showToast({
                            title: '分享失败，请重试',
                            icon: 'none',
                            duration: 2000
                          })
                        }
                      })
                    }
                  }
                })
              } else {
                // Android平台：也使用分享方式
                wx.showModal({
                  title: 'HTML报告已准备好',
                  content: '建议使用"分享文件"功能：\n\n1. 选择浏览器或其他应用\n2. 即可查看完整的HTML报告\n\n文件名：' + fileName,
                  confirmText: '分享文件',
                  cancelText: '取消',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 分享文件
                      wx.shareFileMessage({
                        filePath: res.tempFilePath,
                        fileName: fileName,
                        success: () => {
                          wx.showToast({
                            title: '分享成功，可用浏览器打开',
                            icon: 'success',
                            duration: 3000
                          })
                        },
                        fail: (err) => {
                          console.error('分享失败:', err)
                          wx.showToast({
                            title: '分享失败，请重试',
                            icon: 'none'
                          })
                        }
                      })
                    }
                  }
                })
              }
            } else {
              wx.hideLoading()
              throw new Error('下载失败')
            }
          },
          fail: (err) => {
            console.error('下载失败:', err)
            wx.hideLoading()
            wx.showToast({
              title: '下载失败',
              icon: 'none'
            })
          }
        })
      } else {
        wx.hideLoading()
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

  // 打开文档预览
  openDocument(filePath: string, fileName: string) {
    console.log('尝试打开文档:', filePath, fileName)

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    const isIOS = systemInfo.platform === 'ios'

    // 由于 wx.openDocument 对 HTML 文件支持有限，特别是在 iOS 上
    // 我们直接提示用户使用分享功能
    if (isIOS) {
      wx.showModal({
        title: 'HTML报告预览提示',
        content: 'iOS系统暂不支持直接预览HTML报告。\n\n建议操作：\n1. 使用"分享文件"功能\n2. 发送到"文件传输助手"\n3. 在聊天中长按文件\n4. 选择"用Safari打开"或"存储到文件"',
        confirmText: '去分享',
        cancelText: '我知道了',
        success: (res) => {
          if (res.confirm) {
            // 用户选择去分享，调用分享功能
            wx.shareFileMessage({
              filePath: filePath,
              fileName: fileName,
              success: () => {
                wx.showToast({
                  title: '已发送，可在聊天中打开',
                  icon: 'success',
                  duration: 3000
                })
              },
              fail: (err) => {
                console.error('分享失败:', err)
                wx.showToast({
                  title: '分享失败，请重试',
                  icon: 'none'
                })
              }
            })
          }
        }
      })
    } else {
      // Android 平台也提示分享（因为 wx.openDocument 不支持 HTML）
      wx.showModal({
        title: 'HTML报告预览提示',
        content: '小程序暂不支持直接预览HTML报告。\n\n建议操作：\n1. 使用"分享文件"功能\n2. 选择浏览器或其他应用打开\n\n文件名: ' + fileName,
        confirmText: '去分享',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.shareFileMessage({
              filePath: filePath,
              fileName: fileName,
              success: () => {
                wx.showToast({
                  title: '分享成功，可用浏览器打开',
                  icon: 'success',
                  duration: 3000
                })
              },
              fail: (err) => {
                console.error('分享失败:', err)
                wx.showToast({
                  title: '分享失败，请重试',
                  icon: 'none'
                })
              }
            })
          }
        }
      })
    }
  },

  // 分享报告
  onShareAppMessage() {
    return {
      title: '个人征信分析报告',
      path: `/pages/report-native/report-native?reportId=${this.data.reportId}`
    }
  }
})

