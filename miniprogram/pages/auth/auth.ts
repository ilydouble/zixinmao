// auth.ts - 实名认证页面
import authService from '../../services/auth'
import { showLoading, hideLoading, showSuccess, showError } from '../../utils/util'

Page({
  data: {
    loading: false,
    returnUrl: '',
    formData: {
      realName: '',
      idCard: '',
      phone: ''
    },
    agreements: {
      userAgreement: false,
      privacyPolicy: false
    }
  },

  onLoad(options: any) {
    // 获取返回地址
    if (options.return) {
      this.setData({
        returnUrl: decodeURIComponent(options.return)
      })
    }

    // 检查是否已认证
    if (!authService.needRealNameAuth()) {
      this.redirectToReturn()
    }
  },

  /**
   * 输入框变化
   */
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 协议勾选
   */
  onAgreementChange(e: any) {
    const { agreement } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`agreements.${agreement}`]: value.length > 0
    })
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { formData, agreements } = this.data
    
    if (!formData.realName.trim()) {
      showError('请输入真实姓名')
      return false
    }
    
    if (!formData.idCard.trim()) {
      showError('请输入身份证号')
      return false
    }
    
    // 简单的身份证号验证
    const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    if (!idCardReg.test(formData.idCard)) {
      showError('请输入正确的身份证号')
      return false
    }
    
    if (!formData.phone.trim()) {
      showError('请输入手机号')
      return false
    }
    
    // 手机号验证
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(formData.phone)) {
      showError('请输入正确的手机号')
      return false
    }
    
    if (!agreements.userAgreement || !agreements.privacyPolicy) {
      showError('请同意用户协议和隐私政策')
      return false
    }
    
    return true
  },

  /**
   * 提交认证
   */
  async onSubmit() {
    if (this.data.loading) return
    
    if (!this.validateForm()) return
    
    this.setData({ loading: true })
    showLoading('认证中...')
    
    try {
      await authService.realNameAuth(this.data.formData)
      hideLoading()
      showSuccess('实名认证成功')
      
      // 延迟跳转
      setTimeout(() => {
        this.redirectToReturn()
      }, 1500)
    } catch (error) {
      console.error('实名认证失败:', error)
      hideLoading()
      this.setData({ loading: false })
    }
  },

  /**
   * 跳转到返回地址
   */
  redirectToReturn() {
    const { returnUrl } = this.data
    if (returnUrl) {
      wx.navigateTo({
        url: returnUrl,
        fail: () => {
          wx.switchTab({
            url: '/pages/home/home'
          })
        }
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  /**
   * 查看协议
   */
  onViewAgreement(e: any) {
    const { type } = e.currentTarget.dataset
    // 这里可以跳转到协议页面
    wx.showModal({
      title: type === 'user' ? '用户协议' : '隐私政策',
      content: '这里是协议内容...',
      showCancel: false
    })
  }
})
