// app.ts

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
        env: 'zixinmao-6gze9a8pef07503b', // 云开发环境ID，需要替换为实际环境
        traceUser: true,
      })
    }

    // 检查登录状态（临时注释掉实际登录逻辑，用于调试）
    // this.checkLoginStatus()
    
    // 临时设置为已登录状态，方便调试后续功能
    this.globalData.userInfo = {
      openid: 'debug_user_001',
      nickName: '调试用户',
      avatarUrl: '',
      realNameVerified: true
    }
    this.globalData.isLoggedIn = true
  },

  onShow() {
    // 小程序显示时检查更新
    this.checkForUpdate()
  },

  // 检查登录状态
  checkLoginStatus() {
    // 临时注释掉实际登录检查逻辑
    /*
    const userInfo = wx.getStorageSync('userInfo') as UserInfo
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    }
    */
    
    // 临时设置为已登录状态
    this.globalData.userInfo = {
      openid: 'debug_user_001',
      nickName: '调试用户',
      avatarUrl: '',
      realNameVerified: true
    }
    this.globalData.isLoggedIn = true
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
    systemInfo: null
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
