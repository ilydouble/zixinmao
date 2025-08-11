// jianxin.ts - 简信宝页面
import { needRealNameAuth } from '../../utils/auth'
import { fileApi, reportApi, mockApi } from '../../services/api'
import { showLoading, hideLoading, showSuccess, showError, isSupportedFileType } from '../../utils/util'

Page({
  data: {
    // 认证状态
    needAuth: false,
    
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
    loading: false
  },

  onLoad() {
    this.checkAuth()
    this.loadReportList()
  },

  onShow() {
    this.checkAuth()
    this.loadReportList()
  },

  /**
   * 检查认证状态
   */
  checkAuth() {
    const needAuth = needRealNameAuth()
    this.setData({ needAuth })
  },

  /**
   * 去认证
   */
  goToAuth() {
    wx.navigateTo({
      url: `/pages/auth/auth?return=${encodeURIComponent('/pages/jianxin/jianxin')}`
    })
  },

  /**
   * 选择文件
   */
  onChooseFile() {
    if (this.data.needAuth) {
      this.goToAuth()
      return
    }

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        
        // 检查文件类型 - 简信宝主要支持PDF
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          showError('简信宝仅支持 PDF 格式文件')
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
    if (this.data.needAuth) {
      this.goToAuth()
      return
    }

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
    const cloudPath = `uploads/simple/${Date.now()}_${selectedFile.name}`
    
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
      const result = await mockApi.generateReport('simple', selectedFile)
      
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
      const result = await mockApi.getReportList('simple')
      
      if (result.success) {
        // 过滤掉详版征信报告
        const filteredReports = (result.data || []).filter(report => report.type === 'simple')
        this.setData({
          reportList: filteredReports
        })
      }
    } catch (error) {
      console.error('加载报告列表失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 查看报告
   */
  onViewReport(e: any) {
    const { report } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/report/report?type=jianxin&title=${encodeURIComponent(report.title)}&date=${report.date}&id=${report.id}`
    })
  },

  /**
   * 删除文件
   */
  onRemoveFile() {
    this.setData({ selectedFile: null })
  },

  /**
   * 导航到流水宝
   */
  navigateToLiushui() {
    wx.navigateTo({
      url: '/pages/liushui/liushui'
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
