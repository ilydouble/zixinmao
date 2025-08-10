// home.ts - 首页
import authService from '../../services/auth'

Page({
  data: {
    userInfo: null,
    banners: [
      {
        id: 1,
        title: '银行流水智能分析',
        desc: '专业的流水分析报告，助力贷款申请',
        image: '/images/banner1.jpg',
        link: '/pages/liushui/liushui'
      },
      {
        id: 2,
        title: '征信报告解读',
        desc: '深度解析征信数据，优化信用状况',
        image: '/images/banner2.jpg',
        link: '/pages/jianxin/jianxin'
      }
    ],
    currentBanner: 0,
    // 状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0
  },

  onLoad() {
    // 读取系统状态栏高度，避免内容顶到状态栏
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })

    this.checkAuth()
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  /**
   * 检查登录状态
   */
  checkAuth() {
    if (!authService.isAuthenticated()) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = authService.getCurrentUser()
    this.setData({ userInfo })
  },

  /**
   * Banner 切换
   */
  onBannerChange(e: any) {
    this.setData({
      currentBanner: e.detail.current
    })
  },

  /**
   * 点击 Banner
   */
  onBannerTap(e: any) {
    const { link } = e.currentTarget.dataset
    if (link) {
      wx.navigateTo({ url: link })
    }
  },

  /**
   * 导航到功能页面
   */
  navigateToPage(e: any) {
    const { url } = e.currentTarget.dataset

    // 检查是否需要实名认证
    if ((url.includes('jianxin') || url.includes('zhuanxin')) && authService.needRealNameAuth()) {
      wx.navigateTo({
        url: `/pages/auth/auth?return=${encodeURIComponent(url)}`
      })
      return
    }

    wx.navigateTo({ url })
  },

  /**
   * 导航到产品详情
   */
  navigateToProduct(e: any) {
    const { product } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?product=${product}`
    })
  }
})
