// index.ts - 入口页面
Page({
  data: {
    loading: true
  },

  onLoad() {
    this.redirectToHome()
  },

  /**
   * ✅ 修复审核问题：直接跳转到首页，允许用户未登录时浏览
   */
  async redirectToHome() {
    try {
      // 直接跳转到首页，不检查登录状态
      // 用户可以在首页浏览功能介绍，点击功能时再提示登录
      wx.switchTab({
        url: '/pages/home/home'
      })
    } catch (error) {
      console.error('跳转首页失败:', error)
      // 出错时也跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  }
})
