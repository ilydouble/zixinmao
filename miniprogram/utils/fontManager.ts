/**
 * 字体管理器
 * 专门处理 TDesign 图标字体的加载问题
 */

interface FontLoadResult {
  success: boolean
  message: string
  fontFamily: string
}

class FontManager {
  private static instance: FontManager
  private fontLoaded: boolean = false
  private loadingPromise: Promise<FontLoadResult> | null = null

  private constructor() {}

  static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager()
    }
    return FontManager.instance
  }

  /**
   * 加载 TDesign 图标字体
   */
  async loadTDesignFont(): Promise<FontLoadResult> {
    // 如果已经在加载中，返回现有的 Promise
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // 如果已经加载成功，直接返回
    if (this.fontLoaded) {
      return {
        success: true,
        message: '字体已加载',
        fontFamily: 't'
      }
    }

    // 开始加载字体
    this.loadingPromise = this.performFontLoad()
    const result = await this.loadingPromise
    
    if (result.success) {
      this.fontLoaded = true
    }
    
    return result
  }

  /**
   * 执行字体加载
   */
  private async performFontLoad(): Promise<FontLoadResult> {
    const fontSources = [
      {
        url: 'https://tdesign.gtimg.com/icon/0.3.2/fonts/t.woff',
        format: 'WOFF'
      },
      {
        url: 'https://tdesign.gtimg.com/icon/0.3.2/fonts/t.ttf',
        format: 'TTF'
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/tdesign-icons@0.3.2/fonts/t.woff',
        format: 'WOFF (备用源)'
      }
    ]

    for (const source of fontSources) {
      try {
        console.log(`🔄 尝试加载字体: ${source.format} - ${source.url}`)
        
        const result = await this.loadSingleFont(source.url)
        if (result.success) {
          console.log(`✅ 字体加载成功: ${source.format}`)
          return {
            success: true,
            message: `${source.format} 格式字体加载成功`,
            fontFamily: 't'
          }
        }
      } catch (error) {
        console.warn(`⚠️ ${source.format} 格式字体加载失败:`, error)
      }
    }

    console.error('❌ 所有字体源都加载失败')
    return {
      success: false,
      message: '所有字体源都加载失败',
      fontFamily: 't'
    }
  }

  /**
   * 加载单个字体文件
   */
  private loadSingleFont(url: string): Promise<FontLoadResult> {
    return new Promise((resolve) => {
      wx.loadFontFace({
        family: 't',
        source: `url("${url}")`,
        success: () => {
          resolve({
            success: true,
            message: '字体加载成功',
            fontFamily: 't'
          })
        },
        fail: (error) => {
          resolve({
            success: false,
            message: `字体加载失败: ${error.errMsg || '未知错误'}`,
            fontFamily: 't'
          })
        }
      })
    })
  }

  /**
   * 检查字体是否已加载
   */
  isFontLoaded(): boolean {
    return this.fontLoaded
  }

  /**
   * 重置字体加载状态（用于重试）
   */
  reset(): void {
    this.fontLoaded = false
    this.loadingPromise = null
  }
}

export default FontManager
