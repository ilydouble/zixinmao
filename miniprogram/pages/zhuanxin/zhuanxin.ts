// zhuanxin.ts - 专信宝页面
import { needRealNameAuth } from '../../utils/auth'
import { showSuccess, showError, showToast, showProcessingFailedDialog } from '../../utils/util'
import { validateFile } from '../../utils/fileValidator'

Page({
  data: {
    // 认证状态
    needAuth: false,
    
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
    isPolling: false, // 添加轮询状态标记
    pollStartTime: 0, // 轮询开始时间
    lastStatusUpdateTime: 0, // 最后状态更新时间

    // 历史报告
    reportList: [] as any[],
    loading: false
  },

  onLoad() {
    this.checkAuth()
    this.loadReportList()
  },

  onShow() {
    console.log('📱 专信宝页面显示，检查是否需要恢复轮询')
    this.checkAuth()
    this.loadReportList()

    // 检查是否有正在生成的报告需要恢复轮询
    this.checkAndResumePolling()
  },

  onHide() {
    console.log('📱 专信宝页面隐藏')
    // 页面隐藏时不需要特殊处理，轮询会继续在后台运行
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
      url: `/pages/auth/auth?return=${encodeURIComponent('/pages/zhuanxin/zhuanxin')}`
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

        // 使用统一的文件验证
        const validation = validateFile(`详版征信报告截图.${file.tempFilePath.split('.').pop()}`, file.size, 'detail')
        if (!validation.valid) {
          showError(validation.message!)
          return
        }

        this.setData({
          selectedFile: {
            name: `详版征信报告截图.${file.tempFilePath.split('.').pop()}`,
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

        // 使用统一的文件验证
        const validation = validateFile(file.name, file.size, 'detail')
        if (!validation.valid) {
          showError(validation.message!)
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
          reportType: 'detail'
        }
      })

      if (result.result && (result.result as any).success) {
        this.setData({
          uploading: false,
          generating: true,
          currentReportId: (result.result as any).reportId,
          reportProgress: 10,
          reportStatus: '文件上传成功，开始深度AI分析...'
        })

        // 延迟10秒后开始轮询，给AI服务一些处理时间
        setTimeout(() => {
          this.pollProgress()
        }, 10000)

        // 清除选中文件
        this.setData({ selectedFile: null })

      } else {
        throw new Error((result.result as any)?.error || '上传失败')
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
   * 检查报告是否卡住
   */
  async checkIfStuck(statusData: any): Promise<boolean> {
    const { lastStatusUpdateTime, pollStartTime } = this.data
    const currentTime = Date.now()

    // 如果是AI分析阶段且状态超过5分钟没变化，认为卡住了
    if (statusData.currentStage === 'AI_ANALYZING' || statusData.currentStage === 'AI_ANALYSIS') {
      const stuckTime = 5 * 60 * 1000 // 5分钟

      if (lastStatusUpdateTime && (currentTime - lastStatusUpdateTime) > stuckTime) {
        console.log(`⚠️ 专信宝：AI分析阶段卡住超过5分钟`)
        return true
      }

      // 或者总轮询时间超过10分钟且还在AI分析阶段
      if (pollStartTime && (currentTime - pollStartTime) > 10 * 60 * 1000) {
        console.log(`⚠️ 专信宝：AI分析阶段总时间超过10分钟`)
        return true
      }
    }

    return false
  },

  /**
   * 恢复卡住的报告
   */
  async recoverStuckReport(reportId: string) {
    try {
      console.log(`🔄 专信宝：尝试恢复卡住的报告: ${reportId}`)

      showToast('检测到处理异常，正在尝试恢复...', 'loading')

      const result = await wx.cloud.callFunction({
        name: 'recoverReport',
        data: {
          reportId: reportId
        }
      })

      const response = result.result as any

      if (response && response.success) {
        console.log('✅ 专信宝：报告恢复成功:', response.message)

        if (response.status === 'completed') {
          // 报告已完成
          this.setData({
            generating: false,
            isPolling: false,
            reportProgress: 100,
            reportStatus: '已完成',
            currentReportId: '',
            pollStartTime: 0
          })
          showSuccess('专业征信报告生成完成！')
          this.loadReportList()

        } else if (response.needResubmit) {
          // 需要重新提交
          showToast('正在重新处理，请稍候...', 'loading')

        } else {
          // 继续等待
          showToast('恢复成功，继续处理中...', 'success')
        }

      } else {
        console.error('❌ 专信宝：报告恢复失败:', response?.error)
        showError('恢复失败: ' + (response?.error || '未知错误'))
      }

    } catch (error) {
      console.error('❌ 专信宝：恢复报告异常:', error)
      showError('恢复异常，请稍后重试')
    }
  },

  /**
   * 检查并恢复轮询
   */
  async checkAndResumePolling() {
    const { currentReportId, generating } = this.data

    if (!currentReportId) {
      console.log('📱 专信宝：没有当前报告ID，无需恢复轮询')
      return
    }

    console.log(`📱 专信宝：检查报告状态以决定是否恢复轮询: ${currentReportId}`)

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

        console.log(`📱 专信宝：当前报告状态:`, {
          status: statusData.status,
          progress: statusData.progress,
          generating: generating
        })

        if (statusData.status === 'processing' || statusData.status === 'pending') {
          // 报告仍在处理中，恢复轮询
          console.log('📱 专信宝：报告仍在处理中，恢复轮询')

          this.setData({
            generating: true,
            reportProgress: statusData.progress || 0,
            reportStatus: statusData.stageText || statusData.currentStage || '处理中...'
          })

          // 延迟启动轮询，避免与现有轮询冲突
          setTimeout(() => {
            this.pollProgress()
          }, 2000)

        } else if (statusData.status === 'completed') {
          // 报告已完成，更新状态并刷新列表
          console.log('📱 专信宝：报告已完成，更新状态')

          this.setData({
            generating: false,
            reportProgress: 100,
            reportStatus: '已完成',
            currentReportId: ''
          })

          // 刷新报告列表
          this.loadReportList()

          // 显示完成提示
          showSuccess('专业征信报告生成完成！')

        } else if (statusData.status === 'failed') {
          // 报告失败，清除状态
          console.log('📱 专信宝：报告处理失败，清除状态')

          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '',
            currentReportId: ''
          })

        }

      } else if (response && response.error === 'REPORT_NOT_FOUND') {
        // 报告不存在，可能已被清理
        console.log('📱 专信宝：报告记录不存在，清除状态')

        this.setData({
          generating: false,
          reportProgress: 0,
          reportStatus: '',
          currentReportId: ''
        })

      }

    } catch (error) {
      console.error('📱 专信宝：检查报告状态失败:', error)
    }
  },

  /**
   * 轮询进度
   */
  async pollProgress() {
    const { currentReportId, generating, isPolling, pollStartTime } = this.data

    if (!currentReportId || !generating) {
      console.log('停止轮询：无报告ID或未在生成中')
      this.setData({ isPolling: false })
      return
    }

    if (isPolling) {
      console.log('轮询已在进行中，跳过此次调用')
      return
    }

    // 检查轮询超时（15分钟）
    const maxPollTime = 15 * 60 * 1000 // 15分钟
    const currentTime = Date.now()

    if (pollStartTime && (currentTime - pollStartTime) > maxPollTime) {
      console.log('⏰ 专信宝轮询超时，停止轮询')
      this.setData({
        generating: false,
        isPolling: false,
        reportProgress: 0,
        reportStatus: '处理超时，请重试',
        currentReportId: '',
        pollStartTime: 0
      })
      showError('专业征信报告生成超时，请重试')
      return
    }

    this.setData({ isPolling: true })
    const elapsedSeconds = pollStartTime ? Math.round((currentTime - pollStartTime) / 1000) : 0
    console.log(`🔄 专信宝轮询报告状态: ${currentReportId} (已轮询 ${elapsedSeconds}秒)`)

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
          reportStatus: statusData.stageText || statusData.currentStage || '处理中...',
          lastStatusUpdateTime: Date.now()
        })

        // 检查是否卡住了
        if (await this.checkIfStuck(statusData)) {
          console.log('🔄 专信宝：检测到报告卡住，尝试恢复...')
          await this.recoverStuckReport(currentReportId)
          this.setData({ isPolling: false }) // 重置轮询状态
          return // 恢复后直接返回，等待下次轮询
        }

        if (statusData.status === 'completed') {
          // 生成完成
          console.log('✅ 报告生成完成')
          this.setData({
            generating: false,
            isPolling: false,
            currentReportId: ''
          })
          showSuccess('专业报告生成完成！')

          // 刷新报告列表
          this.loadReportList()

        } else if (statusData.status === 'failed') {
          // 生成失败
          console.log('❌ 报告生成失败')
          this.setData({
            generating: false,
            isPolling: false,
            currentReportId: ''
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
          this.setData({ isPolling: false }) // 重置轮询状态
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
            isPolling: false,
            reportProgress: 0,
            reportStatus: '处理失败，已自动清理',
            currentReportId: ''
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
      const isDocumentNotExist = errorMessage && (
        errorMessage.includes('document with _id') && errorMessage.includes('does not exist') ||
        errorMessage.includes('document.get:fail') ||
        errorMessage.includes('REPORT_NOT_FOUND')
      )

      if (isDocumentNotExist) {
        console.log('报告记录已被删除，停止轮询')
        this.setData({
          generating: false,
          isPolling: false,
          reportProgress: 0,
          reportStatus: '处理失败，已自动清理',
          currentReportId: '',
          pollStartTime: 0
        })
        showProcessingFailedDialog()
        return // 停止轮询
      } else {
        this.setData({
          generating: false,
          isPolling: false
        })
        showError('获取进度失败，请重试')
      }
    }
  },

  /**
   * 上传文件（已废弃，保留兼容性）
   */
  async uploadFile() {
    const { selectedFile } = this.data
    const cloudPath = `uploads/detail/${Date.now()}_${selectedFile.name}`
    
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
          reportType: 'detail',
          page: 1,
          pageSize: 20
        }
      })

      if (result.result && (result.result as any).success) {
        // 转换数据格式以适配现有UI
        const reports = (result.result as any).data.reports.map((report: any) => ({
          id: report.reportId,
          title: `详版征信分析报告 - ${report.fileName}`,
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
        throw new Error((result.result as any)?.error || '加载失败')
      }
    } catch (error) {
      console.error('加载报告列表失败:', error)
      showError('加载报告列表失败')
    } finally {
      this.setData({ loading: false })
    }
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
      url: `/pages/report/report?type=zhuanxin&reportId=${report.id}&title=${encodeURIComponent(report.title)}`
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
          reportType: 'detail'
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
   * 回到首页
   */
  goHome() {
    // 如果正在生成报告，给用户提示
    if (this.data.generating) {
      wx.showModal({
        title: '提示',
        content: '专业版征信报告正在生成中，离开页面不会中断处理，您可以稍后回来查看结果',
        confirmText: '继续离开',
        cancelText: '留在此页',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/home/home'
            })
          }
        }
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  }
})
