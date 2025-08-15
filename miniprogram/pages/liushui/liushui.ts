// liushui.ts - 流水宝页面
import { fileApi, reportApi, mockApi } from '../../services/api'
import { showLoading, hideLoading, showSuccess, showError, showToast, isSupportedFileType, formatFileSize, showProcessingFailedDialog } from '../../utils/util'

Page({
  data: {
    // 上传状态
    uploading: false,
    uploadProgress: 0,
    
    // 文件信息
    selectedFile: null as any,
    
    // 报告生成状态
    generating: false,
    reportProgress: 0,
    reportStatus: '',
    currentReportId: '',
    pollStartTime: 0, // 轮询开始时间
    
    // 历史报告
    reportList: [] as any[],
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
    console.log('📱 页面显示，检查是否需要恢复轮询')
    this.loadReportList()

    // 检查是否有正在生成的报告需要恢复轮询
    this.checkAndResumePolling()
  },

  onHide() {
    console.log('📱 页面隐藏，暂停轮询')
    // 页面隐藏时不需要特殊处理，轮询会继续在后台运行
  },

  /**
   * 选择文件
   */
  onChooseFile() {
    // 显示选择文件类型的对话框
    wx.showActionSheet({
      itemList: ['选择图片文件', '选择PDF文件'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseImageFile()
        } else if (res.tapIndex === 1) {
          this.choosePDFFile()
        }
      }
    })
  },

  /**
   * 选择图片文件
   */
  chooseImageFile() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0]

        // 检查文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          showError('文件大小不能超过 10MB')
          return
        }

        this.setData({
          selectedFile: {
            name: `银行流水截图.${file.tempFilePath.split('.').pop()}`,
            size: file.size,
            path: file.tempFilePath,
            type: 'image'
          }
        })

        showSuccess('图片选择成功')
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          showError('选择图片失败')
        }
      }
    })
  },

  /**
   * 选择PDF文件
   */
  choosePDFFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0]

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          showError('请选择PDF格式文件')
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
            type: 'file'
          }
        })

        showSuccess('PDF文件选择成功')
      },
      fail: (error) => {
        console.error('选择PDF失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          showError('选择PDF失败，请尝试从聊天记录或文件管理器中选择')
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
      this.setData({
        uploading: true,
        uploadProgress: 0,
        reportStatus: '正在上传文件...'
      })

      // 读取文件内容
      const fileBuffer = await this.readFileAsBuffer(selectedFile.path)

      // 调用云函数上传和分析
      const result = await wx.cloud.callFunction({
        name: 'uploadFile',
        data: {
          fileBuffer: fileBuffer,
          fileName: selectedFile.name,
          reportType: 'flow'
        }
      })

      const response = result.result as any

      if (response && response.success) {
        this.setData({
          uploading: false,
          generating: true,
          currentReportId: response.reportId,
          reportProgress: 10,
          reportStatus: '文件上传成功，开始AI分析...',
          pollStartTime: Date.now() // 记录轮询开始时间
        })

        // 延迟10秒后开始轮询，给AI服务一些处理时间
        setTimeout(() => {
          this.pollProgress()
        }, 10000)

        // 清除选中文件
        this.setData({ selectedFile: null })

      } else {
        throw new Error(response?.error || '上传失败')
      }

    } catch (error) {
      console.error('处理失败:', error)
      showError((error as any)?.message || '处理失败')
      this.setData({
        uploading: false,
        generating: false
      })
    }
  },

  /**
   * 读取文件为Buffer
   */
  async readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager()
      fs.readFile({
        filePath: filePath,
        success: (res) => {
          resolve(res.data as ArrayBuffer)
        },
        fail: reject
      })
    })
  },

  /**
   * 检查并恢复轮询
   */
  async checkAndResumePolling() {
    const { currentReportId, generating } = this.data

    if (!currentReportId) {
      console.log('📱 没有当前报告ID，无需恢复轮询')
      return
    }

    console.log(`📱 检查报告状态以决定是否恢复轮询: ${currentReportId}`)

    try {
      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: currentReportId
        }
      })

      const response = result.result as any

      if (response && response.success) {
        const statusData = response.data

        console.log(`📱 当前报告状态:`, {
          status: statusData.status,
          progress: statusData.progress,
          generating: generating
        })

        if (statusData.status === 'processing' || statusData.status === 'pending') {
          // 报告仍在处理中，恢复轮询
          console.log('📱 报告仍在处理中，恢复轮询')

          this.setData({
            generating: true,
            reportProgress: statusData.progress || 0,
            reportStatus: statusData.stageText || statusData.currentStage || '处理中...'
          })

          // 立即开始轮询
          this.pollProgress()

        } else if (statusData.status === 'completed') {
          // 报告已完成，更新状态并刷新列表
          console.log('📱 报告已完成，更新状态')

          this.setData({
            generating: false,
            reportProgress: 100,
            reportStatus: '已完成',
            currentReportId: ''
          })

          // 刷新报告列表
          this.loadReportList()

          // 显示完成提示
          showSuccess('报告生成完成！')

        } else if (statusData.status === 'failed') {
          // 报告失败，清除状态
          console.log('📱 报告处理失败，清除状态')

          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '',
            currentReportId: ''
          })

        } else {
          console.log(`📱 未知状态: ${statusData.status}`)
        }

      } else if (response && response.error === 'REPORT_NOT_FOUND') {
        // 报告不存在，可能已被清理
        console.log('📱 报告记录不存在，清除状态')

        this.setData({
          generating: false,
          reportProgress: 0,
          reportStatus: '',
          currentReportId: ''
        })

      } else {
        console.log('📱 状态查询失败:', response?.error)
      }

    } catch (error) {
      console.error('📱 检查报告状态失败:', error)
    }
  },

  /**
   * 轮询进度
   */
  async pollProgress() {
    const { currentReportId, pollStartTime } = this.data

    if (!currentReportId || !this.data.generating) {
      console.log('停止轮询：无报告ID或未在生成中')
      return
    }

    // 检查轮询超时（15分钟）
    const maxPollTime = 15 * 60 * 1000 // 15分钟
    const currentTime = Date.now()

    if (pollStartTime && (currentTime - pollStartTime) > maxPollTime) {
      console.log('⏰ 轮询超时，停止轮询')
      this.setData({
        generating: false,
        reportProgress: 0,
        reportStatus: '处理超时，请重试',
        currentReportId: '',
        pollStartTime: 0
      })
      showError('报告生成超时，请重试')
      return
    }

    const elapsedSeconds = pollStartTime ? Math.round((currentTime - pollStartTime) / 1000) : 0
    console.log(`🔄 轮询报告状态: ${currentReportId} (已轮询 ${elapsedSeconds}秒)`)

    try {
      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportStatus',
          reportId: currentReportId
        }
      })

      const response = result.result as any

      if (response && response.success) {
        const statusData = response.data

        console.log(`📊 状态更新:`, {
          status: statusData.status,
          progress: statusData.progress,
          stage: statusData.currentStage,
          taskStatus: statusData.taskStatus
        })

        this.setData({
          reportProgress: statusData.progress || 0,
          reportStatus: statusData.stageText || statusData.currentStage || '处理中...'
        })

        if (statusData.status === 'completed') {
          // 生成完成
          console.log('✅ 报告生成完成')
          this.setData({
            generating: false,
            currentReportId: '',
            pollStartTime: 0
          })
          showSuccess('报告生成完成！')

          // 刷新报告列表
          this.loadReportList()

        } else if (statusData.status === 'failed') {
          // 生成失败
          console.log('❌ 报告生成失败')
          this.setData({
            generating: false,
            currentReportId: '',
            pollStartTime: 0
          })
          showError(statusData.errorMessage || '报告生成失败')

        } else {
          // 继续轮询，根据任务状态调整轮询间隔
          let pollInterval = 5000 // 默认5秒

          if (statusData.taskStatus === 'pending') {
            pollInterval = 10000 // 排队中，10秒轮询
            this.setData({ reportStatus: '任务排队中，请耐心等待...' })
          } else if (statusData.taskStatus === 'processing') {
            pollInterval = 8000 // 处理中，8秒轮询
            this.setData({ reportStatus: 'AI正在分析中，预计需要3-5分钟...' })
          }

          console.log(`🔄 继续轮询，间隔: ${pollInterval}ms`)
          setTimeout(() => {
            this.pollProgress()
          }, pollInterval)
        }
      } else {
        // 检查是否是报告不存在的错误
        if (response && response.error === 'REPORT_NOT_FOUND') {
          console.log('❌ 报告记录不存在，停止轮询')
          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '处理失败，已自动清理'
          })
          showProcessingFailedDialog()
          return // 停止轮询
        } else {
          throw new Error(response?.error || '获取状态失败')
        }
      }
    } catch (error) {
      console.error('获取进度失败:', error)

      // 检查是否是记录不存在的错误
      const errorMessage = (error as any)?.message || error?.toString()
      if (errorMessage.includes('document with _id') && errorMessage.includes('does not exist')) {
        // 报告记录已被删除（处理失败被自动清理）
        console.log('报告记录已被删除，停止轮询')
        this.setData({
          generating: false,
          reportProgress: 0,
          reportStatus: '处理失败，已自动清理'
        })
        showProcessingFailedDialog()
      } else {
        // 其他错误
        this.setData({ generating: false })
        showError('获取进度失败，请重试')
      }
    }
  },

  /**
   * 加载报告列表
   */
  async loadReportList() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'getReports',
        data: {
          action: 'getReportsList',
          reportType: 'flow',
          page: 1,
          pageSize: 20
        }
      })

      const response = result.result as any

      if (response && response.success) {
        // 转换数据格式以适配现有UI
        const reports = response.data.reports.map((report: any) => ({
          id: report.reportId,
          title: `流水分析报告 - ${report.fileName}`,
          date: new Date(report.createdAt).toLocaleDateString(),
          status: report.status,
          progress: report.progress,
          hasFiles: report.hasFiles,
          fileName: report.fileName,
          tags: report.tags || []
        }))

        this.setData({
          reportList: reports
        })
      } else {
        throw new Error(response?.error || '加载失败')
      }
    } catch (error) {
      console.error('加载报告列表失败:', error)
      showError('加载报告列表失败')
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

    // 如果报告还在处理中，显示进度并提供刷新选项
    if (report.status === 'processing' || report.status === 'pending') {
      wx.showModal({
        title: '报告处理中',
        content: `当前进度：${report.progress}%\n预计还需要一些时间，是否刷新状态？`,
        confirmText: '刷新状态',
        cancelText: '稍后再看',
        success: (res) => {
          if (res.confirm) {
            this.loadReportList() // 刷新报告列表
          }
        }
      })
      return
    }

    // 如果报告处理失败，提供重新生成选项
    if (report.status === 'failed') {
      wx.showModal({
        title: '报告处理失败',
        content: '文件可能损坏或分析出错，是否重新生成报告？',
        confirmText: '重新生成',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.retryReport(report)
          }
        }
      })
      return
    }

    // 跳转到报告详情页
    wx.navigateTo({
      url: `/pages/report/report?type=liushui&reportId=${report.id}&title=${encodeURIComponent(report.title)}`
    })
  },

  /**
   * 重新生成报告
   */
  async retryReport(report: any) {
    try {
      showToast('正在重新生成报告...', 'loading')

      // 调用云函数重新处理报告
      const result = await wx.cloud.callFunction({
        name: 'retryReport',
        data: {
          reportId: report.id,
          reportType: 'flow'
        }
      })

      if (result.result && (result.result as any).success) {
        showSuccess('报告已重新开始生成')
        // 刷新报告列表
        this.loadReportList()
      } else {
        throw new Error((result.result as any)?.error || '重新生成失败')
      }
    } catch (error) {
      console.error('重新生成报告失败:', error)
      showError('重新生成失败，请稍后重试')
    }
  },

  /**
   * 终止分析（当前正在进行的）
   */
  async onCancelAnalysis() {
    await this.cancelReport(this.data.currentReportId, true)
  },

  /**
   * 从列表中终止报告
   */
  async onCancelReportFromList(e: any) {
    const { report } = e.currentTarget.dataset
    await this.cancelReport(report.id, false)
  },

  /**
   * 通用的终止报告方法
   */
  async cancelReport(reportId: string, isCurrentReport: boolean) {
    try {
      // 确认操作
      const confirmResult = await new Promise<boolean>((resolve) => {
        wx.showModal({
          title: '确认终止',
          content: '确定要终止此分析吗？终止后将删除此报告，无法恢复。',
          confirmText: '确认终止',
          cancelText: '继续分析',
          confirmColor: '#ff4d4f',
          success: (res) => {
            resolve(res.confirm)
          }
        })
      })

      if (!confirmResult) {
        return
      }

      showToast('正在终止分析...', 'loading')

      // 调用云函数终止报告
      const result = await wx.cloud.callFunction({
        name: 'cancelReport',
        data: {
          reportId: reportId
        }
      })

      if (result.result && (result.result as any).success) {
        showSuccess('分析已终止')

        // 如果是当前正在进行的报告，重置状态
        if (isCurrentReport) {
          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '',
            currentReportId: ''
          })
        }

        // 刷新报告列表
        this.loadReportList()
      } else {
        throw new Error((result.result as any)?.error || '终止失败')
      }
    } catch (error) {
      console.error('终止分析失败:', error)
      showError('终止失败，请稍后重试')
    }
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
