// orders.ts - 个人订单页面
Page({
  data: {
    orders: [
      {
        id: 'order_001',
        title: '征信简版 · 单次报告',
        date: '2023-07-15',
        status: '已完成',
        amount: '¥9.90',
        type: 'simple'
      },
      {
        id: 'order_002',
        title: '银行流水分析 · 会员月卡',
        date: '2023-07-10',
        status: '已完成',
        amount: '¥29.00',
        type: 'flow'
      },
      {
        id: 'order_003',
        title: '征信详版 · 专业分析',
        date: '2023-07-08',
        status: '已完成',
        amount: '¥99.00',
        type: 'detail'
      }
    ]
  },

  /**
   * 查看订单详情
   */
  onViewOrder(e: any) {
    const { order } = e.currentTarget.dataset
    wx.showToast({
      title: '订单详情功能开发中',
      icon: 'none'
    })
  }
})
