// liushui.ts - 流水宝页面
import { fileApi, reportApi, mockApi } from '../../services/api'
import { showLoading, hideLoading, showSuccess, showError, isSupportedFileType, formatFileSize } from '../../utils/util'

Page({
  data: {
    // 上传状态
    uploading: false,
    uploadProgress: 0,
    
    // 文件信息
    selectedFile: null,
    
    // 报告生成状态
    generating: false,
    reportProgress: 0,
    reportStatus: '',
    currentReportId: '',
    
    // 历史报告
    reportList: [],
    loading: false,
    
    // 日期筛选
    dateRange: 'all', // all, 7, 30, 90
    dateOptions: [
      { label: '全部', value: 'all' },
      { label: '近7天', value: '7' },
      { label: '近30天', value: '30' },
      { label: '近90天', value: '90' }
    ]
  },

  onLoad() {
    this.loadReportList()
  },

  onShow() {
    this.loadReportList()
  },

  /**
   * 选择文件
   */
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        
        // 检查文件类型
        if (!isSupportedFileType(file.name)) {
          showError('仅支持 PDF、JPG、PNG 格式文件')
          return
        }
        
        // 检查文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          showError('文件大小不能超过 10MB')
          return
        }
        
        this.setData({
          selectedFile: {
            name: file.name,
            size: file.size,
            path: file.path,
            type: file.type
          }
        })
        
        showSuccess('文件选择成功')
      },
      fail: (error) => {
        console.error('选择文件失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          showError('选择文件失败')
        }
      }
    })
  },

  /**
   * 开始上传和分析
   */
  async onStartAnalysis() {
    const { selectedFile } = this.data
    
    if (!selectedFile) {
      showError('请先选择文件')
      return
    }
    
    if (this.data.uploading || this.data.generating) {
      return
    }
    
    try {
      // 开始上传
      this.setData({ 
        uploading: true, 
        uploadProgress: 0 
      })
      
      await this.uploadFile()
      
      // 开始分析
      this.setData({ 
        uploading: false,
        generating: true,
        reportProgress: 0,
        reportStatus: '开始分析...'
      })
      
      await this.startAnalysis()
      
    } catch (error) {
      console.error('处理失败:', error)
      this.setData({ 
        uploading: false, 
        generating: false 
      })
    }
  },

  /**
   * 上传文件
   */
  async uploadFile() {
    const { selectedFile } = this.data
    const cloudPath = `uploads/flow/${Date.now()}_${selectedFile.name}`
    
    return new Promise((resolve, reject) => {
      const uploadTask = wx.cloud.uploadFile({
        cloudPath,
        filePath: selectedFile.path,
        success: (result) => {
          this.setData({
            'selectedFile.cloudFileID': result.fileID
          })
          resolve(result)
        },
        fail: reject
      })
      
      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        this.setData({
          uploadProgress: res.progress
        })
      })
    })
  },

  /**
   * 开始分析
   */
  async startAnalysis() {
    const { selectedFile } = this.data
    
    try {
      // 调用模拟API生成报告
      const result = await mockApi.generateReport('flow', selectedFile)
      
      if (result.success) {
        this.setData({
          currentReportId: result.reportId
        })
        
        // 开始轮询进度
        this.pollProgress()
      } else {
        throw new Error(result.message || '生成报告失败')
      }
    } catch (error) {
      console.error('开始分析失败:', error)
      showError(error.message || '开始分析失败')
      this.setData({ generating: false })
    }
  },

  /**
   * 轮询进度
   */
  async pollProgress() {
    const { currentReportId } = this.data
    
    if (!currentReportId || !this.data.generating) {
      return
    }
    
    try {
      const result = await mockApi.getProgress(currentReportId)
      
      if (result.success) {
        this.setData({
          reportProgress: result.progress,
          reportStatus: result.message
        })
        
        if (result.status === 'completed') {
          // 生成完成
          this.setData({ generating: false })
          showSuccess('报告生成完成')
          
          // 清除选中文件
          this.setData({ selectedFile: null })
          
          // 刷新报告列表
          this.loadReportList()
        } else if (result.status === 'error') {
          // 生成失败
          this.setData({ generating: false })
          showError('报告生成失败')
        } else {
          // 继续轮询
          setTimeout(() => {
            this.pollProgress()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('获取进度失败:', error)
      this.setData({ generating: false })
    }
  },

  /**
   * 加载报告列表
   */
  async loadReportList() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const result = await mockApi.getReportList('flow')
      
      if (result.success) {
        this.setData({
          reportList: result.data || []
        })
      }
    } catch (error) {
      console.error('加载报告列表失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 日期筛选变化
   */
  onDateRangeChange(e: any) {
    const { value } = e.detail
    this.setData({ dateRange: value })
    this.loadReportList()
  },

  /**
   * 查看报告
   */
  onViewReport(e: any) {
    const { report } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/report/report?type=liushui&title=${encodeURIComponent(report.title)}&date=${report.date}&id=${report.id}`
    })
  },

  /**
   * 删除文件
   */
  onRemoveFile() {
    this.setData({ selectedFile: null })
  },

  /**
   * 导航到简信宝
   */
  navigateToJianxin() {
    wx.navigateTo({
      url: '/pages/jianxin/jianxin'
    })
  },

  /**
   * 导航到专信宝
   */
  navigateToZhuanxin() {
    wx.navigateTo({
      url: '/pages/zhuanxin/zhuanxin'
    })
  }
})
