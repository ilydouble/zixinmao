// balance.ts - 我的余额页面
Page({
  data: {
    balance: '256.00',
    transactions: [
      {
        id: 'tx_001',
        type: 'recharge',
        title: '充值',
        amount: '+¥200.00',
        date: '2023-07-12 14:30',
        status: 'success'
      },
      {
        id: 'tx_002',
        type: 'consume',
        title: '购买征信简版',
        amount: '-¥9.90',
        date: '2023-07-10 09:15',
        status: 'success'
      },
      {
        id: 'tx_003',
        type: 'consume',
        title: '购买流水分析',
        amount: '-¥29.00',
        date: '2023-07-08 16:45',
        status: 'success'
      }
    ]
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
    wx.showToast({
      title: '交易详情功能开发中',
      icon: 'none'
    })
  }
})
