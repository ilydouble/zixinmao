// center.ts - 个人中心页面
import authService from '../../services/auth'
import { showConfirm } from '../../utils/util'

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    // 状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0,
    menuItems: [
      {
        id: 'support',
        icon: '🎧',
        title: '联系客服',
        url: '/pages/support/support'
      },
      {
        id: 'orders',
        icon: '🧾',
        title: '个人订单',
        url: '/pages/orders/orders'
      },
      {
        id: 'recharge',
        icon: '💳',
        title: '会员充值',
        url: '/pages/recharge/recharge'
      },
      {
        id: 'balance',
        icon: '💰',
        title: '我的余额',
        url: '/pages/balance/balance'
      },
      {
        id: 'help',
        icon: '🧠',
        title: '帮助中心',
        url: '/pages/help/help'
      },
      {
        id: 'settings',
        icon: '⚙️',
        title: '设置',
        url: '/pages/settings/settings'
      }
    ]
  },

  onLoad() {
    // 读取系统状态栏高度，避免内容顶到状态栏
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })

    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const isLoggedIn = authService.isAuthenticated()
    const userInfo = authService.getCurrentUser()

    this.setData({
      isLoggedIn,
      userInfo: userInfo as any
    })
  },

  /**
   * 获取用户头像
   */
  async onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail

    try {
      // 更新用户头像
      await authService.updateUserInfo({ avatarUrl })
      this.loadUserInfo()
    } catch (error) {
      console.error('更新头像失败:', error)
    }
  },

  /**
   * 获取用户昵称
   */
  async onNicknameChange(e: any) {
    const nickName = e.detail.value

    if (!nickName.trim()) return

    try {
      // 更新用户昵称
      await authService.updateUserInfo({ nickName })
      this.loadUserInfo()
    } catch (error) {
      console.error('更新昵称失败:', error)
    }
  },

  /**
   * 获取用户授权信息
   */
  async onGetUserProfile() {
    try {
      await authService.getUserProfile()
      this.loadUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  /**
   * 导航到菜单项
   */
  onNavigateToMenu(e: any) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  },

  /**
   * 退出登录
   */
  async onLogout() {
    const confirmed = await showConfirm('确定要退出登录吗？')

    if (confirmed) {
      authService.logout()

      // 跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  }
})
