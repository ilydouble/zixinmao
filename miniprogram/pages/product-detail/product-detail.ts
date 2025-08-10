// product-detail.ts - 产品详情页面
Page({
  data: {
    product: '',
    productInfo: null,
    qrCodeUrl: '/images/qr-wecom.png'
  },

  onLoad(options: any) {
    const { product } = options
    this.setData({ product })
    this.loadProductInfo(product)
  },

  /**
   * 加载产品信息
   */
  loadProductInfo(product: string) {
    const productData = {
      dianziqian: {
        title: '电子签 · 金融级线上签署系统',
        subtitle: '本地化部署 | 多主体签署 | 印章管控 | 合规存证',
        color: 'orange',
        features: [
          '私有化/本地化部署，适配银行/持牌机构合规要求',
          '合同模板化管理，流程编排支持多人多步骤会签',
          '本地电子印章与权限控制，防篡改、全链路审计',
          '与业务系统对接，支持批量签署与自动归档'
        ]
      },
      sheloubao: {
        title: '赊楼宝 · 全流程ERP管控',
        subtitle: '经销商/门店管理 | 价格/库存 | 赊销授信 | 对账结算',
        color: 'blue',
        features: [
          '经销商/门店组织架构与库存、价格统一管理',
          '赊销授信风控，额度/期限/利率灵活配置',
          '订单、物流、财务全流程可追溯，自动对账对单',
          '支持与银行放款系统/第三方平台对接'
        ]
      },
      diyabao: {
        title: '抵押宝 · 抵押贷产品解决方案',
        subtitle: '进件审核 | 抵押登记 | 放款管理 | 贷后监控',
        color: 'purple',
        features: [
          '线上化进件与审核流程，材料清单化与影像归档',
          '不动产抵押登记流程协同，状态追踪',
          '放款审批与对账管理，贷后预警监控',
          '灵活权限与操作日志，适配多机构协作'
        ]
      }
    }

    const productInfo = productData[product as keyof typeof productData]
    this.setData({ productInfo })
  },

  /**
   * 复制微信号
   */
  onCopyWechat() {
    wx.setClipboardData({
      data: 'zixinmao-service',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 预览二维码
   */
  onPreviewQRCode() {
    wx.previewImage({
      urls: [this.data.qrCodeUrl],
      current: this.data.qrCodeUrl
    })
  },

  /**
   * 立即咨询
   */
  onConsult() {
    wx.navigateTo({
      url: '/pages/support/support'
    })
  }
})
