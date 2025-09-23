// app.ts
import FontManager from './utils/fontManager'

// 用户信息接口
interface UserInfo {
  openid: string
  nickName?: string
  avatarUrl?: string
  realNameVerified?: boolean
  [key: string]: any
}

// 全局数据接口
interface GlobalData {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  currentOrg: any
  systemInfo: WechatMiniprogram.SystemInfo | null
  fontLoaded: boolean
}

// App 选项接口
interface IAppOption {
  globalData: GlobalData
  checkLoginStatus(): void
  checkForUpdate(): void
  getSystemInfo(): WechatMiniprogram.SystemInfo
  showLoading(title?: string): void
  hideLoading(): void
  showSuccess(title?: string): void
  showError(title?: string): void
}

App<IAppOption>({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'zixinmao-6gze9a8pef07503b', // 云开发环境ID
        traceUser: true,
      })
    }

    // 动态加载 TDesign 图标字体
    this.loadTDesignFont()

    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    // 小程序显示时检查更新
    this.checkForUpdate()
  },

  // 动态加载 TDesign 图标字体
  async loadTDesignFont() {
    try {
      const fontManager = FontManager.getInstance()
      const result = await fontManager.loadTDesignFont()

      this.globalData.fontLoaded = result.success

      if (result.success) {
        console.log('🎉 字体管理器加载成功:', result.message)
      } else {
        console.error('💥 字体管理器加载失败:', result.message)
      }
    } catch (error) {
      console.error('💥 字体加载过程中发生错误:', error)
      this.globalData.fontLoaded = false
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    // 从本地存储检查登录状态
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.openid) {
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
      } else {
        this.globalData.userInfo = null
        this.globalData.isLoggedIn = false
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
    }
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })
        }
      })
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentOrg: null,
    systemInfo: null,
    fontLoaded: false
  },

  // 获取系统信息
  getSystemInfo(): WechatMiniprogram.SystemInfo {
    if (!this.globalData.systemInfo) {
      this.globalData.systemInfo = wx.getSystemInfoSync()
    }
    return this.globalData.systemInfo
  },

  // 显示加载提示
  showLoading(title: string = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  },

  // 显示成功提示
  showSuccess(title: string = '操作成功') {
    wx.showToast({
      title,
      icon: 'success',
      duration: 2000
    })
  },

  // 显示错误提示
  showError(title: string = '操作失败') {
    wx.showToast({
      title,
      icon: 'error',
      duration: 2000
    })
  }
})
