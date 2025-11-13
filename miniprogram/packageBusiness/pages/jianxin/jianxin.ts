// jianxin.ts - 简信宝页面
import { needRealNameAuth, getCurrentUser, type UserInfo } from '../../../utils/auth'
import { showSuccess, showError, showToast, showProcessingFailedDialog } from '../../../utils/util'
import { validateFile } from '../../../utils/fileValidator'
import { MembershipType, hasFeatureAccess, isMembershipValid } from '../../../config/membership'

Page({
  data: {
    // 顶部状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0,

    // 认证状态
    needAuth: false,

    // 会员状态
    needMembership: false,
    membershipExpired: false,

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
    lastStatusUpdateTime: 0, // 最后状态更新时间

    // 历史报告
    reportList: [] as any[],
    loading: false,

    // 滑动删除相关
    touchStartX: 0,
    touchStartY: 0,
    swipeIndex: -1, // 当前滑动的报告索引

    // 客户群体信息收集
    showCustomerForm: false, // 是否显示客户群体表单
    customerInfo: {
      customerType: '', // 授薪类/自雇类
      includeProductMatch: false, // 是否包含产品匹配
      // 授薪类字段
      companyNature: '', // 单位性质
      hasProvidentFund: false, // 是否缴纳公积金（bool类型）
      providentFundBase: null, // 公积金基数（整型，默认为null）
      // 自雇类字段
      selfEmploymentType: '', // 自雇经营类型
      companyName: '', // 公司名称
      cashFlow: '' // 流水
    } as any,
    isCustomerInfoCompleted: false, // 客户群体信息是否完整

    // 下拉框选项
    customerTypeOptions: ['授薪类客群', '自雇类客群'],
    companyNatureOptions: ['机关及事业单位', '国有企业', '大型上市公司及大型民企', '私企'],
    providentFundOptions: [true, false], // 是否缴纳公积金（bool类型）
    selfEmploymentTypeOptions: ['个体工商户', '小微企业主']
  },

  onLoad() {
    // 读取系统状态栏高度，避免自定义导航栏与系统时间/信号重叠
    try {
      const systemInfo = wx.getSystemInfoSync()
      const statusBarHeight = (systemInfo && (systemInfo as any).statusBarHeight) ? (systemInfo as any).statusBarHeight : 0
      this.setData({ statusBarHeight })
    } catch (e) {}

    // 隐藏左上角返回按钮，避免异步任务被中断
    wx.hideHomeButton()
    this.checkAuth()
    this.checkMembership()
    this.loadReportList()
  },

  onShow() {
    console.log('📱 简信宝页面显示，检查是否需要恢复轮询')
    this.checkAuth()
    this.checkMembership()
    this.loadReportList()

    // 检查是否有正在生成的报告需要恢复轮询
    this.checkAndResumePolling()
  },

  onHide() {
    console.log('📱 简信宝页面隐藏')
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
   * 检查会员状态
   */
  checkMembership() {
    const userInfo = getCurrentUser()

    if (!userInfo) {
      this.setData({
        needMembership: true,
        membershipExpired: false
      })
      return
    }

    const memberType = (userInfo.memberLevel || 'free') as MembershipType
    const hasAccess = hasFeatureAccess(memberType, 'jianxin')
    const isValid = isMembershipValid(userInfo.memberExpireTime || null)

    this.setData({
      needMembership: !hasAccess || !isValid,
      membershipExpired: hasAccess && !isValid
    })
  },

  /**
   * 去开通会员
   */
  goToMembership() {
    wx.navigateTo({
      url: '/packageUser/pages/recharge/recharge'
    })
  },

  /**
   * 去认证
   */
  goToAuth() {
    wx.navigateTo({
      url: `/pages/auth/auth?return=${encodeURIComponent('/packageBusiness/pages/jianxin/jianxin')}`
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

    // 检查会员状态
    if (this.data.needMembership) {
      if (this.data.membershipExpired) {
        wx.showModal({
          title: '会员已过期',
          content: '您的会员已过期，请续费后继续使用简信宝功能',
          confirmText: '去续费',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.goToMembership()
            }
          }
        })
      } else {
        wx.showModal({
          title: '需要开通会员',
          content: '简信宝功能需要开通普通会员或高级会员后使用',
          confirmText: '去开通',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.goToMembership()
            }
          }
        })
      }
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
        const validation = validateFile(`征信报告截图.${file.tempFilePath.split('.').pop()}`, file.size, 'simple')
        if (!validation.valid) {
          showError(validation.message!)
          return
        }

        this.setData({
          selectedFile: {
            name: `征信报告截图.${file.tempFilePath.split('.').pop()}`,
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
        const validation = validateFile(file.name, file.size, 'simple')
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
   * 显示客户群体表单
   */
  showCustomerForm() {
    this.setData({ showCustomerForm: true })
  },

  /**
   * 隐藏客户群体表单
   */
  hideCustomerForm() {
    this.setData({ showCustomerForm: false })
  },

  /**
   * 处理客户类型选择
   */
  onCustomerTypeChange(e: any) {
    // 支持两种调用方式：picker 和 card 点击
    let customerType: string

    if (e.detail && e.detail.value !== undefined) {
      // picker 方式
      const index = e.detail.value
      customerType = this.data.customerTypeOptions[index]
    } else if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.type !== undefined) {
      // card 点击方式
      const typeIndex = e.currentTarget.dataset.type
      customerType = this.data.customerTypeOptions[typeIndex]
    } else {
      return
    }

    this.setData({
      'customerInfo.customerType': customerType,
      'customerInfo.companyNature': '',
      'customerInfo.hasProvidentFund': '',
      'customerInfo.providentFundBase': '',
      'customerInfo.selfEmploymentType': '',
      'customerInfo.companyName': '',
      'customerInfo.cashFlow': ''
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理产品匹配选择
   */
  onProductMatchChange(e: any) {
    this.setData({
      'customerInfo.includeProductMatch': e.detail.value
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理单位性质选择
   */
  onCompanyNatureChange(e: any) {
    const index = e.detail.value
    const companyNature = this.data.companyNatureOptions[index]
    this.setData({
      'customerInfo.companyNature': companyNature
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理公积金选择
   */
  onProvidentFundChange(e: any) {
    // 支持两种调用方式：picker 和 radio 点击
    let hasProvidentFund: boolean

    if (e.detail && e.detail.value !== undefined) {
      // picker 方式
      const index = e.detail.value
      hasProvidentFund = this.data.providentFundOptions[index]
    } else if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.value !== undefined) {
      // radio 点击方式
      const valueIndex = e.currentTarget.dataset.value
      hasProvidentFund = this.data.providentFundOptions[valueIndex]
    } else {
      return
    }

    this.setData({
      'customerInfo.hasProvidentFund': hasProvidentFund,
      'customerInfo.providentFundBase': null // 重置公积金基数为null
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理公积金基数输入
   */
  onProvidentFundBaseInput(e: any) {
    const value = e.detail.value
    // 将输入值转换为整型，如果为空则默认为null
    const providentFundBase = value ? parseInt(value, 10) : null
    this.setData({
      'customerInfo.providentFundBase': providentFundBase
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理自雇经营类型选择
   */
  onSelfEmploymentTypeChange(e: any) {
    const index = e.detail.value
    const selfEmploymentType = this.data.selfEmploymentTypeOptions[index]
    this.setData({
      'customerInfo.selfEmploymentType': selfEmploymentType
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理公司名称输入
   */
  onCompanyNameInput(e: any) {
    this.setData({
      'customerInfo.companyName': e.detail.value
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 处理流水输入
   */
  onCashFlowInput(e: any) {
    this.setData({
      'customerInfo.cashFlow': e.detail.value
    }, () => {
      this.updateCustomerInfoStatus()
    })
  },

  /**
   * 检查客户群体信息是否完整
   *
   * 验证逻辑：
   * 1. 必须选择客群类型（授薪类或自雇类）
   * 2. 授薪类客群：
   *    - 必须填写：单位性质、是否缴纳公积金（bool类型）
   *    - 如果选择缴纳公积金（true），还需填写公积金基数（整型，不为null）
   *    - 如果不缴纳公积金（false），公积金基数为null
   *    - 产品匹配选择不影响必填字段
   * 3. 自雇类客群：
   *    - 必须填写：自雇经营类型、公司名称
   *    - 如果包含产品匹配，还需填写流水
   *    - 如果不包含产品匹配，不需填写流水
   */
  isCustomerInfoComplete(): boolean {
    const { customerInfo } = this.data

    // 1. 必须选择客群类型
    if (!customerInfo.customerType) {
      return false
    }

    // 2. 授薪类客群的验证
    if (customerInfo.customerType === '授薪类客群') {
      // 必须填写：单位性质
      if (!customerInfo.companyNature) {
        return false
      }
      // 必须选择是否缴纳公积金（hasProvidentFund是bool类型，已选择则不为undefined）
      if (customerInfo.hasProvidentFund === undefined || customerInfo.hasProvidentFund === null) {
        return false
      }
      // 如果选择缴纳公积金（true），必须填写公积金基数（不为null）
      if (customerInfo.hasProvidentFund && customerInfo.providentFundBase === null) {
        return false
      }
      // 产品匹配选择不影响必填字段，所以授薪类只要上述字段填写完整就可以
      return true
    }

    // 3. 自雇类客群的验证
    if (customerInfo.customerType === '自雇类客群') {
      // 必须填写：自雇经营类型
      if (!customerInfo.selfEmploymentType) {
        return false
      }
      // 必须填写：公司名称
      if (!customerInfo.companyName) {
        return false
      }
      // 如果包含产品匹配，必须填写流水
      if (customerInfo.includeProductMatch && !customerInfo.cashFlow) {
        return false
      }
      // 如果不包含产品匹配，不需要填写流水
      return true
    }

    return false
  },

  /**
   * 更新客户群体信息完整状态
   */
  updateCustomerInfoStatus() {
    const isCompleted = this.isCustomerInfoComplete()
    this.setData({
      isCustomerInfoCompleted: isCompleted
    })
  },

  /**
   * 验证客户群体信息
   */
  validateCustomerInfo(): { valid: boolean; message?: string } {
    const { customerInfo } = this.data

    if (!customerInfo.customerType) {
      return { valid: false, message: '请选择客户群体类型' }
    }

    if (customerInfo.customerType === '授薪类客群') {
      if (!customerInfo.companyNature) {
        return { valid: false, message: '请选择单位性质' }
      }
      if (customerInfo.hasProvidentFund === undefined || customerInfo.hasProvidentFund === null) {
        return { valid: false, message: '请选择是否缴纳公积金' }
      }
      if (customerInfo.hasProvidentFund && customerInfo.providentFundBase === null) {
        return { valid: false, message: '请填写公积金基数' }
      }
    } else if (customerInfo.customerType === '自雇类客群') {
      if (!customerInfo.selfEmploymentType) {
        return { valid: false, message: '请选择自雇经营类型' }
      }
      if (!customerInfo.companyName) {
        return { valid: false, message: '请填写公司名称' }
      }
      if (customerInfo.includeProductMatch && !customerInfo.cashFlow) {
        return { valid: false, message: '包含产品匹配时需要填写流水' }
      }
    }

    return { valid: true }
  },

  /**
   * 开始上传和分析
   */
  async onStartAnalysis() {
    if (this.data.needAuth) {
      this.goToAuth()
      return
    }

    const { selectedFile, customerInfo } = this.data

    // 验证客户群体信息
    if (!customerInfo.customerType) {
      wx.showModal({
        title: '提示',
        content: '请先填写客户群体信息',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
      })
      return
    }

    const validation = this.validateCustomerInfo()
    if (!validation.valid) {
      wx.showModal({
        title: '提示',
        content: validation.message || '客户群体信息不完整',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
      })
      return
    }

    // 验证文件是否已选择
    if (!selectedFile) {
      wx.showModal({
        title: '提示',
        content: '请先选择信用报告文件',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
      })
      return
    }

    if (this.data.uploading || this.data.generating) {
      return
    }

    try {
      this.setData({
        uploading: true,
        uploadProgress: 0,
        reportStatus: '正在上传文件到云存储...'
      })

      // 1. 先上传文件到云存储
      const cloudPath = `uploads/simple/${Date.now()}_${selectedFile.name}`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: selectedFile.path
      })

      console.log('云存储上传成功:', uploadResult.fileID)

      this.setData({
        uploadProgress: 50,
        reportStatus: '文件上传成功，正在创建分析任务...'
      })

      // 2. 调用云函数创建报告并开始分析
      const result = await wx.cloud.callFunction({
        name: 'uploadFile',
        data: {
          fileId: uploadResult.fileID,
          cloudPath: cloudPath,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          reportType: 'simple',
          // 传递客户群体信息
          customerInfo: this.data.customerInfo
        }
      })

      const response = result.result as any
      if (response?.success) {
        this.setData({
          uploading: false,
          generating: true,
          currentReportId: response.reportId,
          reportProgress: 10,
          reportStatus: '文件上传成功，开始AI分析...',
          pollStartTime: Date.now() // 记录轮询开始时间
        })

        // 🔧 修复：缩短延迟时间从10秒到3秒，更快检测失败状态
        setTimeout(() => {
          this.pollProgress()
        }, 3000)

        // 清除选中文件
        this.setData({ selectedFile: null })

      } else {
        throw new Error(response?.error || '创建分析任务失败')
      }

    } catch (error) {
      console.error('处理失败:', error)
      showError((error as any)?.message || '处理失败')
      this.setData({
        uploading: false,
        generating: false,
        uploadProgress: 0,
        reportStatus: ''
      })
    }
  },





  /**
   * 上传文件（已废弃，保留兼容性）
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
   * 检查报告是否卡住
   */
  async checkIfStuck(statusData: any): Promise<boolean> {
    const { lastStatusUpdateTime, pollStartTime } = this.data
    const currentTime = Date.now()

    // 如果是AI分析阶段且状态超过5分钟没变化，认为卡住了
    if (statusData.currentStage === 'AI_ANALYZING' || statusData.currentStage === 'AI_ANALYSIS') {
      const stuckTime = 5 * 60 * 1000 // 5分钟

      if (lastStatusUpdateTime && (currentTime - lastStatusUpdateTime) > stuckTime) {
        console.log(`⚠️ 简信宝：AI分析阶段卡住超过5分钟`)
        return true
      }

      // 或者总轮询时间超过10分钟且还在AI分析阶段
      if (pollStartTime && (currentTime - pollStartTime) > 10 * 60 * 1000) {
        console.log(`⚠️ 简信宝：AI分析阶段总时间超过10分钟`)
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
      console.log(`🔄 简信宝：尝试恢复卡住的报告: ${reportId}`)

      showToast('检测到处理异常，正在尝试恢复...', 'loading')

      const result = await wx.cloud.callFunction({
        name: 'recoverReport',
        data: {
          reportId: reportId
        }
      })

      const response = result.result as any

      if (response && response.success) {
        console.log('✅ 简信宝：报告恢复成功:', response.message)

        if (response.status === 'completed') {
          // 报告已完成
          this.setData({
            generating: false,
            reportProgress: 100,
            reportStatus: '已完成',
            currentReportId: '',
            pollStartTime: 0
          })
          showSuccess('简版征信报告生成完成！')
          this.loadReportList()

        } else if (response.needResubmit) {
          // 需要重新提交
          showToast('正在重新处理，请稍候...', 'loading')

        } else {
          // 继续等待
          showToast('恢复成功，继续处理中...', 'success')
        }

      } else {
        console.error('❌ 简信宝：报告恢复失败:', response?.error)
        showError('恢复失败: ' + (response?.error || '未知错误'))
      }

    } catch (error) {
      console.error('❌ 简信宝：恢复报告异常:', error)
      showError('恢复异常，请稍后重试')
    }
  },

  /**
   * 检查并恢复轮询
   */
  async checkAndResumePolling() {
    const { currentReportId, generating } = this.data

    if (!currentReportId) {
      console.log('📱 简信宝：没有当前报告ID，无需恢复轮询')
      return
    }

    console.log(`📱 简信宝：检查报告状态以决定是否恢复轮询: ${currentReportId}`)

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

        console.log(`📱 简信宝：当前报告状态:`, {
          status: statusData.status,
          progress: statusData.progress,
          generating: generating
        })

        if (statusData.status === 'processing' || statusData.status === 'pending') {
          // 报告仍在处理中，恢复轮询
          console.log('📱 简信宝：报告仍在处理中，恢复轮询')

          this.setData({
            generating: true,
            reportProgress: statusData.progress || 0,
            reportStatus: statusData.stageText || statusData.currentStage || '处理中...'
          })

          // 立即开始轮询
          this.pollProgress()

        } else if (statusData.status === 'completed') {
          // 报告已完成，更新状态并刷新列表
          console.log('📱 简信宝：报告已完成，更新状态')

          this.setData({
            generating: false,
            reportProgress: 100,
            reportStatus: '已完成',
            currentReportId: ''
          })

          // 刷新报告列表
          this.loadReportList()

          // 显示完成提示
          showSuccess('简版征信报告生成完成！')

        } else if (statusData.status === 'failed') {
          // 报告失败，清除状态
          console.log('📱 简信宝：报告处理失败，清除状态')

          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '',
            currentReportId: ''
          })

        }

      } else if (response && response.error === 'REPORT_NOT_FOUND') {
        // 报告不存在，可能已被清理
        console.log('📱 简信宝：报告记录不存在，清除状态')

        this.setData({
          generating: false,
          reportProgress: 0,
          reportStatus: '',
          currentReportId: ''
        })

      }

    } catch (error) {
      console.error('📱 简信宝：检查报告状态失败:', error)
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
      console.log('⏰ 简信宝轮询超时，停止轮询')
      this.setData({
        generating: false,
        reportProgress: 0,
        reportStatus: '处理超时，请重试',
        currentReportId: '',
        pollStartTime: 0
      })
      showError('简版征信报告生成超时，请重试')
      return
    }

    const elapsedSeconds = pollStartTime ? Math.round((currentTime - pollStartTime) / 1000) : 0
    console.log(`🔄 简信宝轮询报告状态: ${currentReportId} (已轮询 ${elapsedSeconds}秒)`)

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
          console.log('🔄 简信宝：检测到报告卡住，尝试恢复...')
          await this.recoverStuckReport(currentReportId)
          return // 恢复后直接返回，等待下次轮询
        }

        if (statusData.status === 'completed') {
          // 生成完成
          console.log('✅ 报告生成完成')
          this.setData({ generating: false })
          showSuccess('报告生成完成！')

          // 清除选中文件
          this.setData({ selectedFile: null })

          // 刷新报告列表
          this.loadReportList()

        } else if (statusData.status === 'failed') {
          // 生成失败
          console.log('❌ 报告生成失败:', statusData.errorMessage)
          this.setData({
            generating: false,
            reportProgress: 0,
            reportStatus: '处理失败',
            currentReportId: '',
            pollStartTime: 0
          })

          // 显示友好的错误对话框
          showProcessingFailedDialog()

          // 刷新报告列表（失败的报告会显示在列表中）
          this.loadReportList()

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
      const isDocumentNotExist = errorMessage && (
        errorMessage.includes('document with _id') && errorMessage.includes('does not exist') ||
        errorMessage.includes('document.get:fail') ||
        errorMessage.includes('REPORT_NOT_FOUND')
      )

      if (isDocumentNotExist) {
        console.log('报告记录已被删除，停止轮询')
        this.setData({
          generating: false,
          reportProgress: 0,
          reportStatus: '处理失败，已自动清理',
          currentReportId: '',
          pollStartTime: 0
        })
        showProcessingFailedDialog()
        return // 停止轮询
      } else {
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
          reportType: 'simple',
          page: 1,
          pageSize: 20
        }
      })

      const response = result.result as any

      if (response && response.success) {
        // 转换数据格式以适配现有UI
        const reports = response.data.reports.map((report: any) => ({
          id: report.reportId,
          title: `简版征信分析报告 - ${report.fileName}`,
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
   * 查看报告
   */
  onViewReport(e: any) {
    const { report } = e.currentTarget.dataset

    // 检查会员状态
    if (this.data.needMembership) {
      if (this.data.membershipExpired) {
        wx.showModal({
          title: '会员已过期',
          content: '您的会员已过期，请续费后继续查看报告',
          confirmText: '去续费',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.goToMembership()
            }
          }
        })
      } else {
        wx.showModal({
          title: '需要开通会员',
          content: '查看报告需要开通普通会员或高级会员',
          confirmText: '去开通',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.goToMembership()
            }
          }
        })
      }
      return
    }

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

    // 跳转到报告查看页 - 使用小程序原生页面展示
    wx.navigateTo({
      url: `/packageBusiness/pages/report-native/report-native?reportId=${report.reportId || report.id}`
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
          reportType: 'simple'
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
   * 点击报告项（非删除按钮区域）
   */
  onReportItemTap(e: any) {
    const { index } = e.currentTarget.dataset

    // 如果当前有打开的删除按钮，先关闭它
    if (this.data.swipeIndex !== -1) {
      this.setData({
        swipeIndex: -1
      })
      return
    }
  },

  /**
   * 触摸开始
   */
  onTouchStart(e: any) {
    const { index } = e.currentTarget.dataset
    const touch = e.touches[0]

    // 如果点击的不是当前打开的项，先关闭其他项
    if (this.data.swipeIndex !== -1 && this.data.swipeIndex !== index) {
      this.setData({
        swipeIndex: -1
      })
    }

    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    })
  },

  /**
   * 触摸移动
   */
  onTouchMove(e: any) {
    const { index } = e.currentTarget.dataset
    const touch = e.touches[0]
    const deltaX = touch.clientX - (this.data.touchStartX || 0)
    const deltaY = touch.clientY - (this.data.touchStartY || 0)

    // 判断是否为横向滑动（横向移动距离大于纵向移动距离）
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      // 向左滑动超过20px，显示删除按钮
      if (deltaX < -20) {
        if (this.data.swipeIndex !== index) {
          this.setData({
            swipeIndex: index
          })
        }
      }
      // 向右滑动超过20px，隐藏删除按钮
      else if (deltaX > 20 && this.data.swipeIndex === index) {
        this.setData({
          swipeIndex: -1
        })
      }
    }
  },

  /**
   * 触摸结束
   */
  onTouchEnd(e: any) {
    const { index } = e.currentTarget.dataset
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - (this.data.touchStartX || 0)
    const deltaY = touch.clientY - (this.data.touchStartY || 0)

    // 判断是否为横向滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 向左滑动超过40px，锁定删除按钮显示
      if (deltaX < -40) {
        this.setData({
          swipeIndex: index
        })
      }
      // 向右滑动超过40px，关闭删除按钮
      else if (deltaX > 40) {
        this.setData({
          swipeIndex: -1
        })
      }
      // 滑动距离不够，保持当前状态
      // 如果当前已经打开删除按钮，保持打开状态
      // 如果当前未打开，保持关闭状态
    }

    // 重置触摸起始位置
    this.setData({
      touchStartX: 0,
      touchStartY: 0
    })
  },

  /**
   * 删除报告
   */
  async onDeleteReport(e: any) {
    const { report } = e.currentTarget.dataset

    try {
      // 确认删除
      const confirmResult = await new Promise<boolean>((resolve) => {
        wx.showModal({
          title: '确认删除',
          content: `确定要删除报告"${report.title}"吗？删除后无法恢复。`,
          confirmText: '确认删除',
          cancelText: '取消',
          confirmColor: '#ff4d4f',
          success: (res) => {
            resolve(res.confirm)
          }
        })
      })

      if (!confirmResult) {
        return
      }

      showToast('正在删除报告...', 'loading')

      // 调用云函数删除报告
      const result = await wx.cloud.callFunction({
        name: 'deleteReport',
        data: {
          reportId: report.id
        }
      })

      if (result.result && (result.result as any).success) {
        showSuccess('报告已删除')

        // 重置滑动状态
        this.setData({
          swipeIndex: -1
        })

        // 刷新报告列表
        this.loadReportList()
      } else {
        throw new Error((result.result as any)?.error || '删除失败')
      }
    } catch (error) {
      console.error('删除报告失败:', error)
      showError('删除失败，请稍后重试')
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
        content: '简版征信报告正在生成中，离开页面不会中断处理，您可以稍后回来查看结果',
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
