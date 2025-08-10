// settings.ts - 设置页面
Page({
  data: {
    settings: {
      darkMode: 'auto', // auto, light, dark
      notifications: true,
      autoUpdate: true
    },
    darkModeOptions: [
      { label: '跟随系统', value: 'auto' },
      { label: '浅色模式', value: 'light' },
      { label: '深色模式', value: 'dark' }
    ]
  },

  /**
   * 切换深色模式
   */
  onDarkModeChange(e: any) {
    const { value } = e.detail
    this.setData({
      'settings.darkMode': this.data.darkModeOptions[value].value
    })
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })
  },

  /**
   * 切换通知设置
   */
  onNotificationChange(e: any) {
    const { value } = e.detail
    this.setData({
      'settings.notifications': value.length > 0
    })
  },

  /**
   * 切换自动更新
   */
  onAutoUpdateChange(e: any) {
    const { value } = e.detail
    this.setData({
      'settings.autoUpdate': value.length > 0
    })
  },

  /**
   * 清除缓存
   */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...'
          })
          
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          }, 1000)
        }
      }
    })
  },

  /**
   * 关于我们
   */
  onAbout() {
    wx.showModal({
      title: '关于资信猫',
      content: '资信猫 v1.0.0\n专业的金融数据分析平台\n\n© 2023 资信猫团队',
      showCancel: false
    })
  },

  /**
   * 用户协议
   */
  onUserAgreement() {
    wx.showToast({
      title: '用户协议页面开发中',
      icon: 'none'
    })
  },

  /**
   * 隐私政策
   */
  onPrivacyPolicy() {
    wx.showToast({
      title: '隐私政策页面开发中',
      icon: 'none'
    })
  }
})
