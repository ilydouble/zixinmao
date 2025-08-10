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
    reportData: null,
    loading: true,
    
    // 分享状态
    sharing: false
  },

  onLoad(options: any) {
    const { type, title, date, id } = options
    
    this.setData({
      reportType: type || '',
      reportTitle: decodeURIComponent(title || ''),
      reportDate: date || '',
      reportId: id || ''
    })
    
    this.loadReportData()
  },

  /**
   * 加载报告数据
   */
  async loadReportData() {
    const { reportType, reportId } = this.data
    
    this.setData({ loading: true })
    
    try {
      // 根据报告类型生成模拟数据
      const reportData = this.generateMockReportData(reportType)
      
      this.setData({
        reportData,
        loading: false
      })
    } catch (error) {
      console.error('加载报告数据失败:', error)
      showError('加载报告失败')
      this.setData({ loading: false })
    }
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
   * 下载报告
   */
  onDownloadReport() {
    showSuccess('报告下载功能开发中')
    // TODO: 实现PDF下载功能
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
