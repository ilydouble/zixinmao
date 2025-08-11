// balance.ts - 我的余额页面
Page({
  data: {
    balance: '0.00',
    formattedBalance: '¥0.00',
    transactions: [],
    loading: false,
    userInfo: {
      totalRecharge: 0,
      totalConsumption: 0
    }
  },

  /**
   * 页面加载
   */
  onLoad() {
    this.loadBalanceData()
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    this.loadBalanceData()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadBalanceData()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载余额数据
   */
  async loadBalanceData() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserBalance',
        data: {
          limit: 20 // 获取最近20条记录
        }
      })

      const response = result.result as any

      if (response.success) {
        this.setData({
          balance: response.data.balance.toFixed(2),
          formattedBalance: response.data.formattedBalance,
          transactions: response.data.transactions,
          userInfo: response.data.userInfo,
          loading: false
        })
      } else {
        throw new Error(response.message)
      }

    } catch (error: any) {
      console.error('加载余额数据失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
      this.setData({ loading: false })
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
   * 查看交易详情
   */
  onViewTransaction(e: any) {
    const { transaction } = e.currentTarget.dataset

    // 根据交易类型显示不同信息
    let title = '交易详情'
    let content = ''

    if (transaction.type === 'recharge') {
      title = '充值详情'
      content = `充值金额：${transaction.amount}\n状态：${transaction.statusText}\n时间：${transaction.date}`
      if (transaction.orderNo) {
        content += `\n订单号：${transaction.orderNo}`
      }
    } else {
      title = '消费详情'
      content = `服务名称：${transaction.title}\n消费金额：${transaction.amount}\n状态：${transaction.statusText}\n时间：${transaction.date}`
      if (transaction.orderNo) {
        content += `\n订单号：${transaction.orderNo}`
      }
    }

    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      confirmText: '确定'
    })
  }
})
