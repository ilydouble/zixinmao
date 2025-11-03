// auth.ts - 实名认证页面
import { showLoading, hideLoading, showSuccess, showError } from '../../utils/util'
import { realNameAuth, needRealNameAuth } from '../../utils/auth'

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
    if (!needRealNameAuth()) {
      wx.showToast({
        title: '您已完成实名认证',
        icon: 'success',
        duration: 1500
      })
      setTimeout(() => {
        this.redirectToReturn()
      }, 1500)
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
      const { realName, idCard, phone } = this.data.formData
      await realNameAuth(realName, idCard, phone)
      hideLoading()

      // 延迟跳转
      setTimeout(() => {
        this.redirectToReturn()
      }, 1500)
    } catch (error: any) {
      console.error('实名认证失败:', error)
      hideLoading()
      this.setData({ loading: false })

      // 如果是已完成认证的错误，显示提示并跳转
      if (error.message && error.message.includes('已完成实名认证')) {
        wx.showToast({
          title: '您已完成实名认证',
          icon: 'success',
          duration: 1500
        })
        setTimeout(() => {
          this.redirectToReturn()
        }, 1500)
      } else {
        // 其他错误，显示错误信息
        showError(error.message || '认证失败，请重试')
      }
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
    wx.navigateTo({
      url: `/packageUser/pages/agreement/agreement?type=${type}`
    })
  }
})
