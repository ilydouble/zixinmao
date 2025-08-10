// index.ts - 入口页面
import authService from '../../services/auth'

Page({
  data: {
    loading: true
  },

  onLoad() {
    this.checkAuthAndRedirect()
  },

  /**
   * 检查认证状态并跳转
   */
  async checkAuthAndRedirect() {
    try {
      // 检查本地登录状态
      const isLoggedIn = authService.checkLoginStatus()

      if (isLoggedIn) {
        // 已登录，跳转到首页（使用 switchTab）
        wx.switchTab({
          url: '/pages/home/home'
        })
      } else {
        // 未登录，跳转到登录页
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      // 出错时跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  }
})
