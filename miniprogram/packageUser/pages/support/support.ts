// support.ts - 联系客服页面
Page({
  data: {
    qrCodeUrl: '/images/qr-wecom.png', // 企业微信二维码
    contactMethods: [
      {
        id: 'email',
        icon: '✉️',
        title: '邮件支持',
        desc: 'support@zixinmao.com',
        action: 'copy'
      },
      {
        id: 'phone',
        icon: '📞',
        title: '电话支持',
        desc: '400-000-0000',
        action: 'call'
      },
      {
        id: 'online',
        icon: '💬',
        title: '在线客服',
        desc: '工作日 9:00-18:00',
        action: 'chat'
      }
    ]
  },

  /**
   * 处理联系方式点击
   */
  onContactMethodTap(e: any) {
    const { method } = e.currentTarget.dataset
    
    switch (method.action) {
      case 'copy':
        this.copyToClipboard(method.desc)
        break
      case 'call':
        this.makePhoneCall(method.desc)
        break
      case 'chat':
        wx.showToast({
          title: '在线客服功能开发中',
          icon: 'none'
        })
        break
    }
  },

  /**
   * 复制到剪贴板
   */
  copyToClipboard(text: string) {
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 拨打电话
   */
  makePhoneCall(phoneNumber: string) {
    wx.makePhoneCall({
      phoneNumber,
      fail: () => {
        wx.showToast({
          title: '拨号失败',
          icon: 'error'
        })
      }
    })
  },

  /**
   * 保存二维码
   */
  onSaveQRCode() {
    wx.showToast({
      title: '长按二维码保存',
      icon: 'none'
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
  }
})
