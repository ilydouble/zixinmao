// recharge.ts - 会员充值页面
Page({
  data: {
    // 充值金额选项
    rechargeAmounts: [
      {
        id: 'amount_50',
        amount: 50,
        title: '¥50',
        desc: '适合轻度使用',
        popular: false
      },
      {
        id: 'amount_100',
        amount: 100,
        title: '¥100',
        desc: '推荐金额',
        popular: true
      },
      {
        id: 'amount_200',
        amount: 200,
        title: '¥200',
        desc: '更多优惠',
        popular: false
      },
      {
        id: 'amount_500',
        amount: 500,
        title: '¥500',
        desc: '大额充值',
        popular: false
      }
    ],
    selectedAmount: 'amount_100',
    customAmount: '', // 自定义金额
    useCustomAmount: false // 是否使用自定义金额
  },

  /**
   * 选择充值金额
   */
  onSelectAmount(e: any) {
    const { amountId } = e.currentTarget.dataset
    this.setData({
      selectedAmount: amountId,
      useCustomAmount: false,
      customAmount: ''
    })
  },

  /**
   * 输入自定义金额
   */
  onCustomAmountInput(e: any) {
    const value = e.detail.value
    this.setData({
      customAmount: value,
      useCustomAmount: value.length > 0,
      selectedAmount: ''
    })
  },

  /**
   * 获取当前选择的金额
   */
  getCurrentAmount() {
    if (this.data.useCustomAmount && this.data.customAmount) {
      return parseFloat(this.data.customAmount)
    }

    const selectedItem = this.data.rechargeAmounts.find(item => item.id === this.data.selectedAmount)
    return selectedItem ? selectedItem.amount : 0
  },

  /**
   * 立即支付
   */
  onPay() {
    const amount = this.getCurrentAmount()

    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请选择充值金额',
        icon: 'error'
      })
      return
    }

    if (amount < 1) {
      wx.showToast({
        title: '充值金额不能少于1元',
        icon: 'error'
      })
      return
    }

    if (amount > 10000) {
      wx.showToast({
        title: '单次充值不能超过10000元',
        icon: 'error'
      })
      return
    }

    wx.showModal({
      title: '确认充值',
      content: `确认充值 ¥${amount.toFixed(2)} 到账户余额？`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment(amount)
        }
      }
    })
  },

  /**
   * 处理支付
   */
  async processPayment(amount: number) {
    try {
      wx.showLoading({
        title: '处理中...'
      })

      // 调用云函数创建充值订单
      const result = await wx.cloud.callFunction({
        name: 'createRechargeOrder',
        data: {
          amount: amount,
          paymentMethod: 'wechat_pay'
        }
      })

      wx.hideLoading()

      const response = result.result as any

      if (response.success) {
        // 充值成功
        wx.showModal({
          title: '充值成功',
          content: `充值 ¥${amount} 已到账\n当前余额：¥${response.data.newBalance.toFixed(2)}`,
          showCancel: false,
          confirmText: '确定',
          success: () => {
            // 返回到余额页面
            wx.navigateBack()
          }
        })
      } else {
        // 充值失败
        wx.showModal({
          title: '充值失败',
          content: response.message || '充值过程中出现错误，请重试',
          showCancel: false,
          confirmText: '确定'
        })
      }

    } catch (error: any) {
      wx.hideLoading()
      console.error('充值失败:', error)
      wx.showModal({
        title: '充值失败',
        content: '网络错误，请检查网络连接后重试',
        showCancel: false,
        confirmText: '确定'
      })
    }
  }
})
