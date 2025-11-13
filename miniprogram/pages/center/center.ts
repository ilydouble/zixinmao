// center.ts - 个人中心页面
import { getCurrentUser, isAuthenticated, updateUserInfo, getUserProfile, logout, refreshUserInfo, type UserInfo } from '../../utils/auth'
import { showConfirm } from '../../utils/util'
import {
  MembershipType,
  getMembershipConfig,
  isMembershipValid,
  formatExpiryDate,
  type MembershipLevel
} from '../../config/membership'

Page({
  data: {
    userInfo: null as UserInfo | null,
    isLoggedIn: false,
    // 状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0,
    refreshing: false,
    // 会员相关
    membershipConfig: {} as MembershipLevel,
    isMembershipValid: false,
    expiryStatus: '未开通',
    expiryText: '',
    // 常用功能菜单
    commonMenuItems: [
      {
        id: 'support',
        icon: '🎧',
        title: '联系客服',
        url: '/packageUser/pages/support/support'
      },
      {
        id: 'help',
        icon: '🧠',
        title: '帮助中心',
        url: '/packageUser/pages/help/help'
      },
      {
        id: 'settings',
        icon: '⚙️',
        title: '设置',
        url: '/packageUser/pages/settings/settings'
      }
    ]
  },

  onLoad() {
    // 读取系统状态栏高度，避免内容顶到状态栏
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })

    // 首次加载时先显示缓存数据
    this.loadUserInfo()

    // 只有在已登录的情况下才刷新用户信息
    if (isAuthenticated()) {
      this.refreshAndLoadUserInfo()
    }
  },

  async onShow() {
    // 页面显示时检查登录状态
    const isLoggedIn = isAuthenticated()

    if (isLoggedIn) {
      // 已登录：刷新用户信息
      await this.refreshAndLoadUserInfo()
    } else if (this.data.isLoggedIn) {
      // 从已登录状态变为未登录：清除用户信息
      this.setData({
        isLoggedIn: false,
        userInfo: null
      })
    }
  },

  async onPullDownRefresh() {
    // 下拉刷新时，只有在已登录的情况下才刷新用户信息
    if (isAuthenticated()) {
      await this.refreshAndLoadUserInfo()
    }
    wx.stopPullDownRefresh()
  },

  /**
   * 刷新并加载用户信息
   */
  async refreshAndLoadUserInfo() {
    // 防止重复刷新
    if (this.data.refreshing) {
      console.log('refreshAndLoadUserInfo: 正在刷新中，跳过')
      return
    }

    console.log('refreshAndLoadUserInfo: 开始刷新用户信息')
    this.setData({ refreshing: true })

    try {
      // 从云端刷新用户信息
      const userInfo = await refreshUserInfo()
      if (userInfo) {
        console.log('refreshAndLoadUserInfo: 刷新成功', { avatarUrl: userInfo.avatarUrl })

        // 更新会员信息显示
        await this.updateMembershipInfo(userInfo)

        // 设置用户信息
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo as any,
          refreshing: false
        })
      } else {
        console.log('refreshAndLoadUserInfo: 刷新失败，清除用户信息')
        // 刷新失败时清除用户信息（表示已退出登录）
        this.setData({
          refreshing: false,
          isLoggedIn: false,
          userInfo: null
        })
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      // 刷新失败时清除用户信息
      this.setData({
        refreshing: false,
        isLoggedIn: false,
        userInfo: null
      })
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    const isLoggedIn = isAuthenticated()
    const userInfo = isLoggedIn ? getCurrentUser() : null

    console.log('loadUserInfo 调用:', { isLoggedIn, avatarUrl: userInfo?.avatarUrl })

    // 更新会员信息
    await this.updateMembershipInfo(userInfo)

    this.setData({
      isLoggedIn,
      userInfo: userInfo as any
    })
  },

  /**
   * 更新会员信息显示
   */
  async updateMembershipInfo(userInfo: UserInfo | null) {
    try {
      const memberType = userInfo?.memberLevel || 'free'

      console.log('个人中心 - 开始获取会员配置, memberType:', memberType)

      // 从云端获取会员配置
      const result = await wx.cloud.callFunction({
        name: 'getMembershipConfig',
        data: {
          type: memberType
        }
      })

      console.log('个人中心 - 云函数调用结果:', result)

      const response = result.result as any

      if (response && response.success && response.data) {
        console.log('个人中心 - 成功获取会员配置:', response.data)

        const memberConfig = response.data
        const isValid = isMembershipValid(userInfo?.memberExpireTime || null)
        const expiryText = formatExpiryDate(userInfo?.memberExpireTime || null)

        let expiryStatus = '未开通'
        if (isValid) {
          expiryStatus = '到期时间'
        } else if (userInfo?.memberExpireTime) {
          expiryStatus = '已过期'
        }

        this.setData({
          membershipConfig: memberConfig,
          isMembershipValid: isValid,
          expiryStatus,
          expiryText
        })
      } else {
        console.warn('个人中心 - 云端获取失败，使用本地配置作为后备')

        // 如果获取失败，使用本地配置作为后备
        const memberConfig = getMembershipConfig(memberType as MembershipType)
        const isValid = isMembershipValid(userInfo?.memberExpireTime || null)
        const expiryText = formatExpiryDate(userInfo?.memberExpireTime || null)

        let expiryStatus = '未开通'
        if (isValid) {
          expiryStatus = '到期时间'
        } else if (userInfo?.memberExpireTime) {
          expiryStatus = '已过期'
        }

        this.setData({
          membershipConfig: memberConfig,
          isMembershipValid: isValid,
          expiryStatus,
          expiryText
        })
      }
    } catch (error: any) {
      console.error('个人中心 - 更新会员信息失败:', error)
      console.error('个人中心 - 错误详情:', error.errMsg || error.message || JSON.stringify(error))
      // 使用本地配置作为后备
      const memberType = (userInfo?.memberLevel || 'free') as MembershipType
      const memberConfig = getMembershipConfig(memberType)
      const isValid = isMembershipValid(userInfo?.memberExpireTime || null)
      const expiryText = formatExpiryDate(userInfo?.memberExpireTime || null)

      let expiryStatus = '未开通'
      if (isValid) {
        expiryStatus = '到期时间'
      } else if (userInfo?.memberExpireTime) {
        expiryStatus = '已过期'
      }

      this.setData({
        membershipConfig: memberConfig,
        isMembershipValid: isValid,
        expiryStatus,
        expiryText
      })
    }
  },



  /**
   * 获取用户头像
   */
  async onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail

    console.log('选择头像:', avatarUrl)

    try {
      wx.showLoading({
        title: '上传头像中...'
      })

      // 生成云存储文件路径
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const cloudPath = `temp/avatars/avatar_${timestamp}_${random}.jpg`

      // 直接上传到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl
      })

      console.log('上传到云存储结果:', uploadResult)

      if (!uploadResult.fileID) {
        throw new Error('上传到云存储失败')
      }

      // 调用云函数更新用户头像URL
      const updateResult = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: {
            avatarUrl: uploadResult.fileID
          }
        }
      })

      console.log('更新用户信息结果:', updateResult)

      wx.hideLoading()

      const response = updateResult.result as any
      if (response.success) {
        // 更新成功，直接更新本地用户信息，避免重复刷新
        if (response.userInfo) {
          this.setData({
            userInfo: response.userInfo as any
          })
        }

        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
      } else {
        console.error('更新用户信息失败:', response)
        wx.showModal({
          title: '更新失败',
          content: response.message || '头像更新失败，请重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    } catch (error: any) {
      wx.hideLoading()
      console.error('更新头像失败:', error)
      wx.showModal({
        title: '上传失败',
        content: `错误信息：${error.message || '未知错误'}`,
        showCancel: false,
        confirmText: '确定'
      })
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
      await updateUserInfo({ nickName })
      this.loadUserInfo()
    } catch (error) {
      console.error('更新昵称失败:', error)
    }
  },

  /**
   * 跳转到登录页面
   */
  onNavigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  /**
   * 导航到菜单项
   */
  onNavigateToMenu(e: any) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({ url })
    }
  },



  /**
   * 退出登录
   */
  async onLogout() {
    const confirmed = await showConfirm('确定要退出登录吗？')

    if (confirmed) {
      logout()

      // 跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  /**
   * 开通会员
   */
  onUpgradeMembership() {
    wx.navigateTo({
      url: '/packageUser/pages/recharge/recharge'
    })
  },

  /**
   * 续费会员
   */
  onRenewMembership() {
    wx.navigateTo({
      url: '/packageUser/pages/recharge/recharge'
    })
  }
})
