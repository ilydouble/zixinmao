// login.ts - 登录页面
import { login, getUserProfile, isAuthenticated } from '../../utils/auth'

Page({
  data: {
    loading: false,
    agreedToPolicy: false  // 是否同意隐私政策
  },

  onLoad() {
    // 如果已登录，跳转到首页
    if (isAuthenticated()) {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  /**
   * 隐私协议勾选变化
   */
  onAgreementChange(e: any) {
    const agreed = e.detail.value.length > 0
    this.setData({
      agreedToPolicy: agreed
    })
  },

  /**
   * 查看用户协议
   */
  onViewUserAgreement(e: any) {
    e.stopPropagation()
    wx.navigateTo({
      url: '/packageUser/pages/agreement/agreement?type=user'
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacyPolicy(e: any) {
    e.stopPropagation()
    wx.navigateTo({
      url: '/packageUser/pages/agreement/agreement?type=privacy'
    })
  },

  /**
   * 微信登录
   */
  async onWechatLogin() {
    if (this.data.loading) return

    // 检查是否同意隐私政策
    if (!this.data.agreedToPolicy) {
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      await login()
      wx.hideLoading()

      // 登录成功，跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    } catch (error: any) {
      console.error('登录失败:', error)
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  },

  /**
   * 获取用户信息授权
   */
  async onGetUserProfile() {
    if (this.data.loading) return

    try {
      await getUserProfile()
      // 获取用户信息成功后自动登录
      await this.onWechatLogin()
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: error.message || '获取用户信息失败',
        icon: 'error',
        duration: 2000
      })
    }
  }
})
