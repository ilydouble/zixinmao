// login.ts - 登录页面
import authService from '../../services/auth'

Page({
  data: {
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (authService.isAuthenticated()) {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  },

  /**
   * 微信登录
   */
  async onWechatLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      await authService.login()
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
      await authService.getUserProfile()
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
