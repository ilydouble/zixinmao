// center.ts - 个人中心页面
import { getCurrentUser, isAuthenticated, updateUserInfo, getUserProfile, logout, refreshUserInfo } from '../../utils/auth'
import { showConfirm } from '../../utils/util'

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    // 状态栏高度（用于自定义导航栏安全区）
    statusBarHeight: 0,
    refreshing: false,
    menuItems: [
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
        id: 'support',
        icon: '🎧',
        title: '联系客服',
        url: '/pages/support/support'
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
      },
      {
        id: 'debug',
        icon: '🔧',
        title: '调试工具',
        url: '',
        action: 'debug'
      },
      {
        id: 'sync',
        icon: '🔄',
        title: '同步余额',
        url: '',
        action: 'sync'
      },
      {
        id: 'check',
        icon: '📊',
        title: '查看记录',
        url: '',
        action: 'check'
      },
      {
        id: 'testAvatar',
        icon: '🖼️',
        title: '测试头像',
        url: '',
        action: 'testAvatar'
      }
    ]
  },

  onLoad() {
    // 读取系统状态栏高度，避免内容顶到状态栏
    const { statusBarHeight } = wx.getSystemInfoSync()
    this.setData({ statusBarHeight })

    // 首次加载时先显示缓存数据，然后异步刷新
    this.loadUserInfo()
    this.refreshAndLoadUserInfo()
  },

  async onShow() {
    // 页面显示时只有在从其他页面返回时才刷新
    // 避免首次进入时重复刷新
    if (this.data.userInfo) {
      await this.refreshAndLoadUserInfo()
    }
  },

  async onPullDownRefresh() {
    // 下拉刷新时重新从云端获取用户信息
    await this.refreshAndLoadUserInfo()
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
        // 直接设置用户信息，避免再次调用 loadUserInfo
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo as any,
          refreshing: false
        })
      } else {
        console.log('refreshAndLoadUserInfo: 刷新失败，加载本地缓存')
        // 刷新失败时加载本地缓存
        this.setData({ refreshing: false })
        this.loadUserInfo()
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      // 即使刷新失败，也尝试加载本地缓存的信息
      this.setData({ refreshing: false })
      this.loadUserInfo()
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const isLoggedIn = isAuthenticated()
    const userInfo = getCurrentUser()

    console.log('loadUserInfo 调用:', { isLoggedIn, avatarUrl: userInfo?.avatarUrl })

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
   * 获取用户授权信息
   */
  async onGetUserProfile() {
    try {
      await getUserProfile()
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
    const item = e.currentTarget.dataset.item || {}

    if (item.action === 'debug') {
      this.onInitDatabase()
    } else if (item.action === 'sync') {
      this.onSyncBalance()
    } else if (item.action === 'check') {
      this.onCheckRecords()
    } else if (item.action === 'testAvatar') {
      this.onTestAvatar()
    } else if (url) {
      wx.navigateTo({ url })
    }
  },

  /**
   * 初始化数据库（调试功能）
   */
  async onInitDatabase() {
    try {
      wx.showLoading({
        title: '初始化中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'initDatabase'
      })

      wx.hideLoading()

      const response = result.result as any
      if (response?.success) {
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        })

        // 刷新用户信息
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: response.message || '初始化失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('初始化数据库失败:', error)
      wx.showToast({
        title: '初始化失败',
        icon: 'error'
      })
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
   * 充值
   */
  onRecharge() {
    wx.navigateTo({
      url: '/pages/recharge/recharge'
    })
  },



  /**
   * 手动刷新用户信息（用于调试）
   */
  async onManualRefresh() {
    console.log('=== 手动刷新用户信息 ===')

    try {
      // 直接调用云函数获取用户信息
      const result = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })

      console.log('云函数原始返回:', result)
      console.log('用户信息:', (result.result as any)?.userInfo)

      const response = result.result as any
      if (response?.success && response?.userInfo) {
        const userInfo = response.userInfo

        // 直接设置到页面数据中
        this.setData({ userInfo })

        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '刷新失败',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('手动刷新失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 同步余额（调试功能）
   */
  async onSyncBalance() {
    try {
      wx.showLoading({
        title: '同步中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'syncUserBalance',
        data: {
          forceUpdate: true
        }
      })

      wx.hideLoading()

      const response = result.result as any
      if (response?.success) {
        const data = response.data
        let message = '同步成功'

        if (data.updated) {
          message = `余额已更新：${data.oldBalance.toFixed(2)} → ${data.newBalance.toFixed(2)}`
        } else {
          message = '余额已同步，无需更新'
        }

        wx.showToast({
          title: message,
          icon: 'success',
          duration: 3000
        })

        // 刷新用户信息
        this.loadUserInfo()
      } else {
        wx.showToast({
          title: response.message || '同步失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('同步余额失败:', error)
      wx.showToast({
        title: '同步失败',
        icon: 'error'
      })
    }
  },

  /**
   * 查看充值和消费记录（调试功能）
   */
  async onCheckRecords() {
    try {
      wx.showLoading({
        title: '查询中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'getUserBalance',
        data: {
          limit: 10
        }
      })

      wx.hideLoading()

      const response = result.result as any
      if (response?.success) {
        const data = response.data
        let content = `当前余额：¥${data.balance.toFixed(2)}\n\n最近交易记录：\n`

        if (data.transactions && data.transactions.length > 0) {
          data.transactions.slice(0, 5).forEach((tx: any, index: number) => {
            content += `${index + 1}. ${tx.title} ${tx.amount}\n   ${tx.date}\n`
          })
        } else {
          content += '暂无交易记录'
        }

        wx.showModal({
          title: '账户记录',
          content: content,
          showCancel: false,
          confirmText: '确定'
        })
      } else {
        wx.showToast({
          title: response.message || '查询失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('查询记录失败:', error)
      wx.showToast({
        title: '查询失败',
        icon: 'error'
      })
    }
  },

  /**
   * 测试头像上传（调试功能）
   */
  async onTestAvatar() {
    try {
      // 选择图片
      const chooseResult = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })

      if (chooseResult.tempFiles && chooseResult.tempFiles.length > 0) {
        const tempFilePath = chooseResult.tempFiles[0].tempFilePath

        console.log('选择的图片:', tempFilePath)

        wx.showLoading({
          title: '上传中...'
        })

        // 生成云存储文件路径
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const cloudPath = `temp/avatars/test_${timestamp}_${random}.jpg`

        // 直接上传到云存储
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath
        })

        console.log('上传到云存储结果:', uploadResult)

        wx.hideLoading()

        if (uploadResult.fileID) {
          wx.showModal({
            title: '上传成功',
            content: `头像已保存到云存储\n文件ID: ${uploadResult.fileID}\n路径: ${cloudPath}`,
            showCancel: false,
            confirmText: '确定'
          })
        } else {
          wx.showModal({
            title: '上传失败',
            content: '上传到云存储失败',
            showCancel: false,
            confirmText: '确定'
          })
        }
      }
    } catch (error: any) {
      wx.hideLoading()
      console.error('测试头像上传失败:', error)
      wx.showModal({
        title: '测试失败',
        content: `错误: ${error.message}`,
        showCancel: false,
        confirmText: '确定'
      })
    }
  }

})
