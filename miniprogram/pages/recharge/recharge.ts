// recharge.ts - 会员充值页面
Page({
  data: {
    packages: [
      {
        id: 'single',
        title: '单次报告',
        price: '9.90',
        desc: '征信简版分析',
        popular: false
      },
      {
        id: 'monthly',
        title: '月卡会员',
        price: '29',
        desc: '流水分析 + 简版征信',
        popular: true
      },
      {
        id: 'quarterly',
        title: '季卡会员',
        price: '99',
        desc: '全功能无限制使用',
        popular: false
      }
    ],
    selectedPackage: 'monthly'
  },

  /**
   * 选择套餐
   */
  onSelectPackage(e: any) {
    const { packageId } = e.currentTarget.dataset
    this.setData({
      selectedPackage: packageId
    })
  },

  /**
   * 立即支付
   */
  onPay() {
    const { selectedPackage, packages } = this.data
    const selectedPkg = packages.find(pkg => pkg.id === selectedPackage)
    
    wx.showModal({
      title: '确认支付',
      content: `确认购买 ${selectedPkg?.title} (¥${selectedPkg?.price})？`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment()
        }
      }
    })
  },

  /**
   * 处理支付
   */
  processPayment() {
    wx.showLoading({
      title: '支付中...'
    })
    
    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      })
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 2000)
  }
})
