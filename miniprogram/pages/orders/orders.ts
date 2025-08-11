// orders.ts - 个人订单页面
Page({
  data: {
    orders: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  /**
   * 页面加载
   */
  onLoad() {
    this.loadOrders(true)
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadOrders(true)
    wx.stopPullDownRefresh()
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders(false)
    }
  },



  /**
   * 加载订单列表
   */
  async loadOrders(refresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = refresh ? 1 : this.data.page

      const result = await wx.cloud.callFunction({
        name: 'getUserOrders',
        data: {
          page: page,
          pageSize: this.data.pageSize
        }
      })

      const response = result.result as any

      if (response.success) {
        const newOrders = response.data.orders.map((order: any) => ({
          ...order,
          statusText: this.getStatusText(order.status),
          typeText: this.getTypeText(order.type),
          formattedDate: this.formatDate(order.createdAt),
          formattedAmount: `¥${order.amount.toFixed(2)}`
        }))

        this.setData({
          orders: refresh ? newOrders : [...this.data.orders, ...newOrders],
          page: page + 1,
          hasMore: response.data.pagination.hasMore,
          loading: false
        })
      } else {
        throw new Error(response.message)
      }

    } catch (error: any) {
      console.error('加载订单失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  /**
   * 获取状态文本
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '待支付',
      'processing': '处理中',
      'completed': '已完成',
      'failed': '已失败',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  },

  /**
   * 获取类型文本
   */
  getTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'recharge': '充值',
      'consumption': '消费'
    }
    return typeMap[type] || type
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  /**
   * 查看订单详情
   */
  onViewOrder(e: any) {
    const { order } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${order.id}`
    })
  },

  /**
   * 支付订单
   */
  onPayOrder(e: any) {
    const { order } = e.currentTarget.dataset
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    })
  },

  /**
   * 取消订单
   */
  onCancelOrder(e: any) {
    const { order } = e.currentTarget.dataset
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '取消功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }
})
