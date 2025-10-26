// report.ts - 报告查看页面
import { mockApi } from '../../services/api'
import { showLoading, hideLoading, showSuccess, showError } from '../../utils/util'

Page({
  data: {
    // 报告基本信息
    reportType: '',
    reportTitle: '',
    reportDate: '',
    reportId: '',

    // 报告内容
    reportData: null as any,
    loading: true,

    // 分享状态
    sharing: false
  },

  onLoad(options: any) {
    // 🔧 修复：接收参数名应该是 reportId，不是 id
    const { type, title, date, reportId, id } = options

    this.setData({
      reportType: type || '',
      reportTitle: decodeURIComponent(title || ''),
      reportDate: date || '',
      reportId: reportId || id || '' // 兼容两种参数名
    })

    console.log('📄 报告页面加载, reportId:', this.data.reportId, 'type:', type)

    this.loadReportData()
  },

  /**
   * 加载报告数据
   */
  async loadReportData() {
    const { reportType, reportId } = this.data

    this.setData({ loading: true })

    try {
      // 如果有reportId，从云函数加载真实数据
      if (reportId) {
        console.log('从云函数加载报告数据, reportId:', reportId)

        const result = await wx.cloud.callFunction({
          name: 'getReports',
          data: {
            action: 'getReportDetail',
            reportId: reportId
          }
        })

        console.log('云函数返回结果:', result)

        if (result.result && (result.result as any).success) {
          const reportDetail = (result.result as any).data

          // 转换数据格式以适配现有WXML
          const reportData = this.transformReportData(reportDetail, reportType)

          this.setData({
            reportData,
            loading: false
          })
        } else {
          throw new Error((result.result as any)?.error || '加载报告失败')
        }
      } else {
        // 没有reportId，使用模拟数据
        const reportData = this.generateMockReportData(reportType)

        this.setData({
          reportData,
          loading: false
        })
      }
    } catch (error) {
      console.error('加载报告数据失败:', error)
      showError('加载报告失败')
      this.setData({ loading: false })
    }
  },

  /**
   * 转换报告数据格式 - 按照可视化最新样版.html格式
   */
  transformReportData(reportDetail: any, reportType: string) {
    const analysisResult = reportDetail.analysisResult || {}

    console.log('analysisResult:', analysisResult)
    console.log('analysisResult keys:', Object.keys(analysisResult))

    // 个人信息
    const personalInfo = analysisResult['个人信息'] || {}

    // 统计数据
    const statistics = analysisResult['统计数据'] || {}

    // 基础数据
    const baseData = {
      personalInfo: {
        name: personalInfo['姓名'] || '未知',
        age: personalInfo['年龄'] || '-',
        maritalStatus: personalInfo['婚姻状况'] || '-',
        companyType: personalInfo['单位性质'] || '-',
        workYears: personalInfo['工作时长'] || '-',
        fundBase: personalInfo['公积金基数'] || '-',
        whiteList: personalInfo['白名单客群'] || '-',
        idCard: personalInfo['身份证号'] || '-'
      },
      statistics: {
        totalCredit: this.formatAmount(statistics['总授信'] || 0),
        totalDebt: this.formatAmount(statistics['总负债'] || 0),
        bankCount: statistics['银行机构数'] || 0,
        nonBankCount: statistics['非银机构数'] || 0,
        overdueAmount: this.formatAmount(statistics['逾期金额'] || 0),
        queryCount: statistics['查询次数'] || 0
      }
    }

    // 征信报告数据转换
    const aiAnalysisText = analysisResult['AI分析'] || ''
    const aiAnalysisPoints = aiAnalysisText ? aiAnalysisText.split('\n').filter((line: string) => line.trim()) : []

    return {
      ...baseData,
      // 详细数据 - 转换中文属性名为英文
      bankLoans: this.convertBankLoans(analysisResult['银行贷款'] || []),
      nonBankLoans: this.convertNonBankLoans(analysisResult['非银贷款'] || []),
      creditCards: this.convertCreditCards(analysisResult['信用卡使用']?.['信用卡列表'] || []),
      queryRecords: analysisResult['查询记录'] || [],
      aiAnalysis: aiAnalysisText,
      aiAnalysisPoints: aiAnalysisPoints,
      riskFactors: this.extractRiskFactors(analysisResult),
      suggestions: this.extractSuggestions(analysisResult)
    }
  },

  /**
   * 格式化金额
   */
  formatAmount(amount: number | string): string {
    if (typeof amount === 'string') {
      amount = parseFloat(amount.replace(/[^0-9.-]/g, ''))
    }
    if (isNaN(amount)) return '¥0'
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },

  /**
   * 计算使用率
   */
  calculateUtilizationRate(statistics: any): string {
    if (!statistics) return '0%'
    const totalCredit = parseFloat(String(statistics['总授信'] || 0).replace(/[^0-9.-]/g, ''))
    const totalDebt = parseFloat(String(statistics['总负债'] || 0).replace(/[^0-9.-]/g, ''))
    if (totalCredit === 0) return '0%'
    const rate = (totalDebt / totalCredit * 100).toFixed(1)
    return `${rate}%`
  },

  /**
   * 提取风险因素
   */
  extractRiskFactors(analysisResult: any): string[] {
    const factors: string[] = []

    if (analysisResult['逾期分析']?.['逾期笔数'] > 0) {
      factors.push(`存在${analysisResult['逾期分析']['逾期笔数']}笔逾期记录`)
    }

    if (analysisResult['查询记录']?.length > 10) {
      factors.push(`近期查询次数较多（${analysisResult['查询记录'].length}次）`)
    }

    const utilizationRate = this.calculateUtilizationRate(analysisResult['统计数据'])
    const rate = parseFloat(utilizationRate)
    if (rate > 70) {
      factors.push(`信用卡使用率较高（${utilizationRate}）`)
    }

    if (factors.length === 0) {
      factors.push('暂无明显风险因素')
    }

    return factors
  },

  /**
   * 提取建议
   */
  extractSuggestions(analysisResult: any): string[] {
    const suggestions: string[] = []

    if (analysisResult['产品推荐']?.length > 0) {
      analysisResult['产品推荐'].forEach((product: any) => {
        suggestions.push(product['产品名称'] || product['产品描述'])
      })
    }

    if (analysisResult['AI分析']) {
      // 从AI分析中提取建议（简单分割）
      const aiText = analysisResult['AI分析']
      if (aiText.includes('建议')) {
        const parts = aiText.split('建议')
        if (parts.length > 1) {
          suggestions.push('建议' + parts[1].split('。')[0] + '。')
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('保持良好的信用记录')
      suggestions.push('按时还款，避免逾期')
    }

    return suggestions
  },

  /**
   * 转换银行贷款数据（中文属性名 -> 英文属性名）
   */
  convertBankLoans(loans: any[]): any[] {
    return loans.map(loan => ({
      institutionName: loan['机构名称'] || '-',
      status: loan['状态'] || '未知',
      loanAmount: loan['贷款金额'] || '0',
      remainingAmount: loan['剩余金额'] || '0',
      issueDate: loan['发放日期'] || '-'
    }))
  },

  /**
   * 转换非银贷款数据（中文属性名 -> 英文属性名）
   */
  convertNonBankLoans(loans: any[]): any[] {
    return loans.map(loan => ({
      institutionName: loan['机构名称'] || '-',
      status: loan['状态'] || '未知',
      loanAmount: loan['贷款金额'] || '0',
      remainingAmount: loan['剩余金额'] || '0'
    }))
  },

  /**
   * 转换信用卡数据（中文属性名 -> 英文属性名）
   */
  convertCreditCards(cards: any[]): any[] {
    return cards.map(card => ({
      issuer: card['发卡机构'] || '-',
      status: card['状态'] || '未知',
      creditLimit: card['信用额度'] || '0',
      usedAmount: card['已用额度'] || '0',
      issueDate: card['开卡日期'] || '-'
    }))
  },

  /**
   * 生成模拟报告数据
   */
  generateMockReportData(type: string) {
    const baseData = {
      summary: {
        score: Math.floor(Math.random() * 100) + 600, // 600-700分
        level: '良好',
        riskLevel: '中等风险'
      }
    }

    switch (type) {
      case 'liushui':
        return {
          ...baseData,
          flowAnalysis: {
            totalIncome: '¥45,680',
            totalExpense: '¥38,920',
            avgMonthlyIncome: '¥15,227',
            avgMonthlyExpense: '¥12,973',
            incomeStability: '稳定',
            expensePattern: '规律'
          },
          riskPoints: [
            '收入来源单一，建议多元化',
            '大额支出较多，注意控制',
            '整体流水健康，符合贷款要求'
          ],
          suggestions: [
            '保持稳定的收入来源',
            '合理控制日常开支',
            '建议增加储蓄比例'
          ]
        }

      case 'jianxin':
        return {
          ...baseData,
          creditInfo: {
            creditCards: 3,
            totalCreditLimit: '¥80,000',
            usedCredit: '¥12,500',
            utilizationRate: '15.6%',
            overdueRecords: 0
          },
          loanInfo: {
            activeLoan: 1,
            totalLoanAmount: '¥150,000',
            monthlyPayment: '¥3,200',
            paymentHistory: '正常'
          },
          riskPoints: [
            '信用卡使用率较低，表现良好',
            '无逾期记录，信用状况优秀',
            '贷款还款正常，风险可控'
          ]
        }

      case 'zhuanxin':
        return {
          ...baseData,
          detailedAnalysis: {
            creditHistory: '5年',
            accountTypes: ['信用卡', '房贷', '车贷'],
            queryRecords: {
              recent6Months: 3,
              recent2Years: 12,
              riskLevel: '正常'
            },
            guaranteeInfo: {
              asGuarantor: 0,
              guaranteeAmount: '¥0'
            }
          },
          riskAssessment: {
            overallRisk: '低风险',
            creditRisk: '低',
            repaymentRisk: '低',
            stabilityRisk: '中'
          },
          professionalAdvice: [
            '信用记录良好，建议继续保持',
            '可适当增加信用卡额度使用',
            '建议定期查询征信报告',
            '注意保护个人信息安全'
          ]
        }

      default:
        return baseData
    }
  },

  /**
   * 下载报告（方式2：从云存储下载后端生成的HTML）
   */
  async onDownloadReport() {
    showLoading('正在下载HTML报告...')

    try {
      const { reportData, reportId, reportDate } = this.data

      if (!reportId) {
        throw new Error('报告ID不存在')
      }

      // 🔧 方式2：从云函数获取HTML报告的下载链接
      console.log('从云函数获取HTML报告下载链接, reportId:', reportId)

      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'downloadReport',
          reportId: reportId,
          fileType: 'html'
        }
      })

      console.log('云函数返回结果:', result)

      if (result.result && (result.result as any).success) {
        const downloadData = (result.result as any).data
        const htmlUrl = downloadData.downloadUrl

        console.log('HTML报告下载链接:', htmlUrl)

        // 下载HTML文件
        wx.downloadFile({
          url: htmlUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              console.log('HTML文件下载成功:', res.tempFilePath)

              // 分享HTML文件
              wx.shareFileMessage({
                filePath: res.tempFilePath,
                fileName: downloadData.fileName || `${reportData?.personalInfo?.name || '征信'}_报告_${reportDate}.html`,
                success: () => {
                  hideLoading()
                  showSuccess('HTML报告已下载，可以分享或保存')
                },
                fail: (err) => {
                  console.error('分享失败:', err)
                  hideLoading()

                  // 如果分享失败，提示用户文件已下载
                  wx.showModal({
                    title: '报告已下载',
                    content: `HTML报告已下载到临时目录，可以通过其他方式分享。\n文件路径: ${res.tempFilePath}`,
                    showCancel: false
                  })
                }
              })
            } else {
              throw new Error('下载失败')
            }
          },
          fail: (err) => {
            console.error('下载失败:', err)
            throw new Error('下载失败')
          }
        })
      } else {
        throw new Error((result.result as any)?.error || '获取下载链接失败')
      }

    } catch (error) {
      console.error('下载失败:', error)
      hideLoading()
      showError('下载HTML报告失败')
    }
  },

  /**
   * 分享报告
   */
  async onShareReport() {
    if (this.data.sharing) return
    
    this.setData({ sharing: true })
    
    try {
      // 生成分享链接或图片
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟处理时间
      
      showSuccess('分享链接已复制到剪贴板')
    } catch (error) {
      console.error('分享失败:', error)
      showError('分享失败')
    } finally {
      this.setData({ sharing: false })
    }
  },

  /**
   * 微信分享
   */
  onShareAppMessage() {
    const { reportTitle, reportDate } = this.data
    return {
      title: `${reportTitle} - ${reportDate}`,
      path: `/pages/report/report?type=${this.data.reportType}&title=${encodeURIComponent(reportTitle)}&date=${reportDate}&id=${this.data.reportId}`,
      imageUrl: '/images/share-cover.jpg' // 分享封面图
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { reportTitle } = this.data
    return {
      title: `${reportTitle} - 资信猫专业分析报告`,
      imageUrl: '/images/share-cover.jpg'
    }
  }
})
