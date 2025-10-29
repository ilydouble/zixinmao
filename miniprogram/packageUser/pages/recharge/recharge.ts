// recharge.ts - 会员充值页面
import {
  MembershipType,
  DURATION_OPTIONS,
  type DurationOption
} from '../../../config/membership'
import { refreshUserInfo } from '../../../utils/auth'

// 会员配置接口
interface MembershipConfig {
  _id: string
  type: string
  name: string
  icon: string
  color: string
  gradient: string
  description: string
  features: string[]
  prices: {
    monthly: number
    quarterly: number
    yearly: number
  }
  enabled: boolean
  sort: number
}

// 带价格的时长选项接口
interface DurationOptionWithPrice extends DurationOption {
  price: number
}

Page({
  data: {
    // 会员类型选项
    membershipTypes: [] as MembershipConfig[],
    selectedMembershipType: MembershipType.BASIC,

    // 时长选项（带价格）
    durationOptions: [] as DurationOptionWithPrice[],
    selectedDuration: 'monthly' as 'monthly' | 'quarterly' | 'yearly',

    // 当前价格
    currentPrice: 0,

    // 加载状态
    loading: true
  },

  onLoad() {
    this.loadMembershipConfig()
  },

  /**
   * 加载会员配置
   */
  loadMembershipConfig() {
    const that = this

    wx.showLoading({ title: '加载中...' })

    console.log('开始调用 getMembershipConfig 云函数')

    // 从云端获取会员配置
    wx.cloud.callFunction({
      name: 'getMembershipConfig'
    }).then((result: any) => {
      console.log('云函数调用结果:', result)

      const response = result.result as any

      console.log('云函数返回数据:', response)

      if (response && response.success && response.data) {
        console.log('会员配置数据:', response.data)

        // 过滤掉免费用户配置
        const membershipTypes = response.data.filter((item: MembershipConfig) =>
          item.type !== 'free'
        )

        console.log('过滤后的会员类型:', membershipTypes)

        that.setData({
          membershipTypes,
          loading: false
        })

        // 更新时长选项和价格
        that.updateDurationOptions()

        wx.hideLoading()
      } else {
        const errorMsg = response?.message || '加载会员配置失败'
        console.error('云函数返回错误:', errorMsg)
        throw new Error(errorMsg)
      }
    }).catch((error: any) => {
      wx.hideLoading()
      console.error('加载会员配置失败 - 详细错误:', error)
      console.error('错误类型:', typeof error)
      console.error('错误信息:', error.message || error.errMsg || JSON.stringify(error))

      const errorDetail = error.errMsg || error.message || JSON.stringify(error)

      wx.showModal({
        title: '加载失败',
        content: `无法加载会员配置\n错误：${errorDetail}\n\n请确保：\n1. 云函数已部署\n2. 数据库已初始化\n3. 网络连接正常`,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            that.loadMembershipConfig()
          }
        }
      })
    })
  },

  /**
   * 选择会员类型
   */
  onSelectMembershipType(e: any) {
    const { type } = e.currentTarget.dataset
    this.setData({
      selectedMembershipType: type
    })
    this.updateDurationOptions()
  },

  /**
   * 选择时长
   */
  onSelectDuration(e: any) {
    const { duration } = e.currentTarget.dataset
    this.setData({
      selectedDuration: duration
    })
    this.updatePrice()
  },

  /**
   * 更新时长选项（带价格）
   */
  updateDurationOptions() {
    const selectedType = this.data.membershipTypes.find(
      (item: MembershipConfig) => item.type === this.data.selectedMembershipType
    )

    if (selectedType) {
      // 为每个时长选项添加对应的价格
      const durationOptions: DurationOptionWithPrice[] = DURATION_OPTIONS.map(option => ({
        ...option,
        price: selectedType.prices[option.key]
      }))

      this.setData({
        durationOptions
      })

      // 更新当前价格
      this.updatePrice()
    }
  },

  /**
   * 更新当前选中的价格
   */
  updatePrice() {
    const selectedOption = this.data.durationOptions.find(
      (item: DurationOptionWithPrice) => item.key === this.data.selectedDuration
    )

    if (selectedOption) {
      this.setData({
        currentPrice: selectedOption.price
      })
    }
  },

  /**
   * 立即支付
   */
  onPay() {
    const membershipType = this.data.selectedMembershipType
    const duration = this.data.selectedDuration
    const price = this.data.currentPrice

    const membershipConfig = this.data.membershipTypes.find(
      (item: MembershipConfig) => item.type === membershipType
    )
    const durationOption = DURATION_OPTIONS.find(d => d.key === duration)

    if (!membershipConfig) {
      wx.showToast({
        title: '请选择会员类型',
        icon: 'error'
      })
      return
    }

    wx.showModal({
      title: '确认开通',
      content: `确认开通 ${membershipConfig.name} ${durationOption?.label}？\n支付金额：¥${price}`,
      success: (res) => {
        if (res.confirm) {
          this.processPayment(membershipType, duration, price)
        }
      }
    })
  },

  /**
   * 处理支付
   */
  processPayment(membershipType: MembershipType, duration: string, price: number) {
    const that = this

    wx.showLoading({
      title: '处理中...'
    })

    // 调用云函数购买会员
    wx.cloud.callFunction({
      name: 'purchaseMembership',
      data: {
        membershipType,
        duration,
        price
      }
    }).then((result: any) => {
      wx.hideLoading()

      const response = result.result as any

      if (response.success) {
        const membershipConfig = that.data.membershipTypes.find(
          (item: MembershipConfig) => item.type === membershipType
        )
        const durationOption = DURATION_OPTIONS.find(d => d.key === duration)

        // 刷新用户信息
        refreshUserInfo().then(() => {
          console.log('用户信息已刷新')

          // 开通成功
          wx.showModal({
            title: '开通成功',
            content: `${membershipConfig?.name} ${durationOption?.label} 已开通成功！\n到期时间：${response.data.expiryDate}`,
            showCancel: false,
            confirmText: '确定',
            success: () => {
              // 返回到个人中心
              wx.navigateBack()
            }
          })
        }).catch((error) => {
          console.error('刷新用户信息失败:', error)

          // 即使刷新失败也显示成功提示
          wx.showModal({
            title: '开通成功',
            content: `${membershipConfig?.name} ${durationOption?.label} 已开通成功！\n到期时间：${response.data.expiryDate}`,
            showCancel: false,
            confirmText: '确定',
            success: () => {
              // 返回到个人中心
              wx.navigateBack()
            }
          })
        })
      } else {
        // 开通失败
        wx.showModal({
          title: '开通失败',
          content: response.message || '开通过程中出现错误，请重试',
          showCancel: false,
          confirmText: '确定'
        })
      }
    }).catch((error: any) => {
      wx.hideLoading()
      console.error('开通失败:', error)
      wx.showModal({
        title: '开通失败',
        content: '网络错误，请检查网络连接后重试',
        showCancel: false,
        confirmText: '确定'
      })
    })
  }
})
