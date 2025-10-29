// home.ts - 首页
import { getCurrentUser, isAuthenticated, needRealNameAuth } from '../../utils/auth'

Page({
  data: {
    userInfo: null,
    banners: [
      {
        id: 1,
        title: '流水宝',
        image: '/images/banner1.png',
        link: '/pages/liushui/liushui',
        disabled: true
      },
      {
        id: 2,
        title: '简信宝',
        image: '/images/banner2.png',
        link: '/pages/jianxin/jianxin',
        disabled: false
      },
      {
        id: 3,
        title: '专信宝',
        image: '/images/banner3.png',
        link: '/pages/zhuanxin/zhuanxin',
        disabled: true
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
    this.checkDevMode()
  },

  onShow() {
    this.loadUserInfo()
  },

  /**
   * 检查登录状态
   */
  checkAuth() {
    // 如果未登录，跳转到登录页
    if (!isAuthenticated()) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = getCurrentUser()
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
    const { link, disabled } = e.currentTarget.dataset

    // 如果功能被禁用，显示提示
    if (disabled) {
      wx.showToast({
        title: '功能开发中，敬请期待',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (link) {
      // 检查是否需要实名认证（征信相关功能）
      if ((link.includes('jianxin') || link.includes('zhuanxin')) && needRealNameAuth()) {
        wx.navigateTo({
          url: `/pages/auth/auth?return=${encodeURIComponent(link)}`
        })
        return
      }

      wx.navigateTo({ url: link })
    } else {
      // 整体介绍Banner，显示产品介绍
      wx.showModal({
        title: '资信猫',
        content: '智能金融服务平台\n\n• 银行流水智能分析\n• 征信报告专业解读\n• 一站式金融数据服务\n\n让信用更有价值！',
        showCancel: false,
        confirmText: '了解更多'
      })
    }
  },

  /**
   * 导航到功能页面
   */
  navigateToPage(e: any) {
    const { url } = e.currentTarget.dataset

    // 检查是否需要实名认证
    if ((url.includes('jianxin') || url.includes('zhuanxin')) && needRealNameAuth()) {
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
