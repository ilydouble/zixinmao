// home.ts - 首页
import { getCurrentUser, needRealNameAuth, isAuthenticated } from '../../utils/auth'
// 引用 fileValidator 以消除"未使用"警告（实际在分包中使用）
import '../../utils/fileValidator'

// Banner 接口定义
interface Banner {
  id: number
  title: string
  description?: string
  imageUrl?: string
  bgColor: string
  link: string
  disabled: boolean
}

Page({
  data: {
    userInfo: null as any,
    banners: [] as Banner[],
    currentBanner: 0,
    loading: true,
    // 状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0
  },

  onLoad() {
    console.log('📱 页面 onLoad 开始')

    // 读取系统状态栏高度，避免内容顶到状态栏
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })

    // 先加载 Banner 配置（不依赖登录状态）
    this.loadBanners()

    // ✅ 修复审核问题：允许用户未登录时浏览首页
    // 不再强制跳转到登录页，只加载用户信息（如果已登录）
    this.loadUserInfo()

    console.log('📱 页面 onLoad 结束')
  },

  onShow() {
    console.log('📱 页面 onShow')
    this.loadUserInfo()

    // 如果 banners 为空，重新加载
    if (this.data.banners.length === 0) {
      console.log('⚠️ banners 为空，重新加载')
      this.loadBanners()
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
   * 加载 Banner 配置
   */
  loadBanners() {
    const that = this

    console.log('🔵 开始加载 Banner 配置')

    wx.cloud.callFunction({
      name: 'getBanners'
    }).then((result: any) => {
      console.log('🟢 Banner 云函数调用结果:', result)

      const response = result.result as any

      if (response && response.success && response.data) {
        console.log('✅ 成功获取 Banner 配置，数量:', response.data.length)
        console.log('📋 Banner 数据:', response.data)

        that.setData({
          banners: response.data,
          loading: false
        }, () => {
          console.log('✅ setData 完成，当前 banners 数量:', that.data.banners.length)
        })
      } else {
        console.error('❌ 云函数返回格式错误:', response)
        throw new Error(response?.message || '获取 Banner 配置失败')
      }
    }).catch((error: any) => {
      console.error('❌ 加载 Banner 配置失败:', error)

      // 使用默认配置作为后备方案
      const defaultBanners: Banner[] = [
        {
          id: 1,
          title: '流水宝',
          bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          link: '/packageBusiness/pages/liushui/liushui',
          disabled: false
        },
        {
          id: 2,
          title: '简信宝',
          bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          link: '/packageBusiness/pages/jianxin/jianxin',
          disabled: false
        },
        {
          id: 3,
          title: '专信宝',
          bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          link: '/packageBusiness/pages/zhuanxin/zhuanxin',
          disabled: false
        }
      ]

      console.log('⚠️ 使用默认 Banner 配置')

      that.setData({
        banners: defaultBanners,
        loading: false
      }, () => {
        console.log('✅ 默认 Banner 设置完成，数量:', that.data.banners.length)
      })
    })
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
      // 检查是否是待开发功能（流水宝、专信宝）
      if (link.includes('liushui') || link.includes('zhuanxin')) {
        wx.showModal({
          title: '功能开发中',
          content: '该功能正在开发中，敬请期待！\n\n我们正在努力为您打造更好的体验。',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#007AFF'
        })
        return
      }

      // ✅ 修复审核问题：先检查登录状态
      if (!isAuthenticated()) {
        wx.showModal({
          title: '需要登录',
          content: '使用此功能需要先登录，是否前往登录？',
          confirmText: '去登录',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: `/pages/login/login`
              })
            }
          }
        })
        return
      }

      // 检查是否需要实名认证（仅简信宝需要）
      if (link.includes('jianxin') && needRealNameAuth()) {
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
    // 获取 url
    const url = e.currentTarget?.dataset?.url

    // 如果无法获取 url，记录错误并返回
    if (!url) {
      console.error('无法获取 url 属性', e)
      return
    }

    // 检查是否是待开发功能（流水宝、专信宝）
    if (url.includes('liushui') || url.includes('zhuanxin')) {
      wx.showModal({
        title: '功能开发中',
        content: '该功能正在开发中，敬请期待！\n\n我们正在努力为您打造更好的体验。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
      })
      return
    }

    // ✅ 修复审核问题：先检查登录状态
    if (!isAuthenticated()) {
      wx.showModal({
        title: '需要登录',
        content: '使用此功能需要先登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/login/login`
            })
          }
        }
      })
      return
    }

    // 检查是否需要实名认证（仅简信宝需要）
    if (url.includes('jianxin') && needRealNameAuth()) {
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
  },

  /**
   * 去登录
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})
