// report-detail.ts - 报告详情页面
import { showError, showSuccess, showToast } from '../../utils/util'

Page({
  data: {
    reportId: '',
    reportType: '',
    loading: true,
    
    // 报告基本信息
    reportInfo: {
      fileName: '',
      uploadTime: '',
      status: '',
      progress: 0,
      processingTime: '',
      tags: []
    },
    
    // 报告内容
    reportContent: null,
    
    // 下载状态
    downloading: false
  },

  onLoad(options: any) {
    const { reportId, type } = options
    
    if (!reportId) {
      showError('报告ID不能为空')
      wx.navigateBack()
      return
    }
    
    this.setData({
      reportId: reportId,
      reportType: type || 'flow'
    })
    
    this.loadReportDetail()
  },

  /**
   * 加载报告详情
   */
  async loadReportDetail() {
    const { reportId } = this.data
    
    try {
      this.setData({ loading: true })
      
      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportDetail',
          reportId: reportId
        }
      })
      
      if (result.result && result.result.success) {
        const reportData = result.result.data
        
        this.setData({
          reportInfo: {
            fileName: reportData.fileName,
            uploadTime: new Date(reportData.uploadTime).toLocaleString(),
            status: reportData.status,
            progress: reportData.progress,
            processingTime: reportData.processingTime || '',
            tags: reportData.tags || []
          },
          reportContent: reportData.summary
        })
        
        // 设置页面标题
        const titleMap = {
          'flow': '流水分析报告',
          'simple': '简版征信报告',
          'detail': '详版征信报告'
        }
        
        wx.setNavigationBarTitle({
          title: titleMap[this.data.reportType] || '分析报告'
        })
        
      } else {
        throw new Error(result.result?.error || '加载报告详情失败')
      }
    } catch (error) {
      console.error('加载报告详情失败:', error)
      showError('加载报告详情失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 下载报告
   */
  async onDownloadReport(e: any) {
    const { type } = e.currentTarget.dataset
    const { reportId } = this.data
    
    if (this.data.downloading) {
      return
    }
    
    try {
      this.setData({ downloading: true })
      showToast('正在生成下载链接...')
      
      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'downloadReport',
          reportId: reportId,
          fileType: type
        }
      })
      
      if (result.result && result.result.success) {
        const downloadData = result.result.data
        
        // 下载文件
        wx.downloadFile({
          url: downloadData.downloadUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              // 保存到相册或文件
              if (type === 'pdf') {
                wx.openDocument({
                  filePath: res.tempFilePath,
                  success: () => {
                    showSuccess('报告已打开')
                  },
                  fail: () => {
                    showError('打开报告失败')
                  }
                })
              } else {
                // JSON和HTML文件可以分享
                wx.shareFileMessage({
                  filePath: res.tempFilePath,
                  fileName: downloadData.fileName,
                  success: () => {
                    showSuccess('分享成功')
                  },
                  fail: () => {
                    showError('分享失败')
                  }
                })
              }
            } else {
              showError('下载失败')
            }
          },
          fail: () => {
            showError('下载失败')
          }
        })
        
      } else {
        throw new Error(result.result?.error || '获取下载链接失败')
      }
    } catch (error) {
      console.error('下载报告失败:', error)
      showError('下载报告失败')
    } finally {
      this.setData({ downloading: false })
    }
  },

  /**
   * 分享报告
   */
  onShareAppMessage() {
    const { reportType, reportInfo } = this.data
    
    const titleMap = {
      'flow': '银行流水分析报告',
      'simple': '简版征信分析报告', 
      'detail': '详版征信分析报告'
    }
    
    return {
      title: `${titleMap[reportType]} - ${reportInfo.fileName}`,
      path: `/pages/report-detail/report-detail?reportId=${this.data.reportId}&type=${reportType}`,
      imageUrl: '/images/share-report.png'
    }
  },

  /**
   * 返回上一页
   */
  onGoBack() {
    wx.navigateBack()
  },

  /**
   * 刷新报告
   */
  onRefresh() {
    this.loadReportDetail()
  }
})
