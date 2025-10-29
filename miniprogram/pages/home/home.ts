// home.ts - 首页
import { getCurrentUser, isAuthenticated, needRealNameAuth } from '../../utils/auth'
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
    userInfo: null,
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

    this.checkAuth()
    this.loadUserInfo()
    this.checkDevMode()

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
          disabled: true
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
          disabled: true
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
