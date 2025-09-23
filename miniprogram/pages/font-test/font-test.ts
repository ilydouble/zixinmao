// font-test.ts
import FontManager from '../../utils/fontManager'

Page({
  data: {
    fontLoaded: false,
    fontMessage: '检查中...',
    loading: false
  },

  onLoad() {
    this.checkFontStatus()
  },

  onShow() {
    this.checkFontStatus()
  },

  /**
   * 检查字体状态
   */
  checkFontStatus() {
    const app = getApp()
    const fontManager = FontManager.getInstance()
    
    this.setData({
      fontLoaded: app.globalData.fontLoaded && fontManager.isFontLoaded(),
      fontMessage: app.globalData.fontLoaded ? '字体已成功加载' : '字体未加载或加载失败'
    })
  },

  /**
   * 重新加载字体
   */
  async onReloadFont() {
    if (this.data.loading) return

    this.setData({ 
      loading: true,
      fontMessage: '正在重新加载字体...'
    })

    try {
      const fontManager = FontManager.getInstance()
      
      // 重置字体状态
      fontManager.reset()
      
      // 重新加载字体
      const result = await fontManager.loadTDesignFont()
      
      // 更新全局状态
      const app = getApp()
      app.globalData.fontLoaded = result.success
      
      this.setData({
        fontLoaded: result.success,
        fontMessage: result.message,
        loading: false
      })

      if (result.success) {
        wx.showToast({
          title: '字体加载成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '字体加载失败',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('重新加载字体失败:', error)
      this.setData({
        fontLoaded: false,
        fontMessage: `加载失败: ${error}`,
        loading: false
      })
      
      wx.showToast({
        title: '字体加载失败',
        icon: 'error'
      })
    }
  }
})
