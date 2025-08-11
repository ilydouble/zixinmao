// debug.ts
Page({
  data: {
    debugInfo: '点击按钮进行调试操作'
  },

  /**
   * 初始化数据库
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
        this.setData({
          debugInfo: `初始化成功：${response.results?.join('\n') || '完成'}`
        })
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        })
      } else {
        this.setData({
          debugInfo: `初始化失败：${response.message || '未知错误'}`
        })
        wx.showToast({
          title: '初始化失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('初始化数据库失败:', error)
      this.setData({
        debugInfo: `初始化失败：${error}`
      })
      wx.showToast({
        title: '初始化失败',
        icon: 'error'
      })
    }
  },

  /**
   * 刷新用户信息
   */
  async onRefreshUserInfo() {
    try {
      wx.showLoading({
        title: '刷新中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })
      
      wx.hideLoading()
      
      const response = result.result as any
      if (response?.success) {
        this.setData({
          debugInfo: `用户信息：${JSON.stringify(response.userInfo, null, 2)}`
        })
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        })
      } else {
        this.setData({
          debugInfo: `刷新失败：${response.message || '未知错误'}`
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('刷新用户信息失败:', error)
      this.setData({
        debugInfo: `刷新失败：${error}`
      })
    }
  },

  /**
   * 查看订单列表
   */
  onViewOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders'
    })
  }
})
