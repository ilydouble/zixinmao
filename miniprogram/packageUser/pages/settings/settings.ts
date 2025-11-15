// settings.ts - 设置页面
import { getCurrentUser, updateUserInfo } from '../../../utils/auth'

// 组织接口
interface Organization {
  id: string
  name: string
  code: string
  type: string
  description?: string
}

// 城市接口
interface City {
  id: string
  name: string
  code: string
  provinceCode: string
  provinceName: string
  level: string
}

Page({
  data: {
    userSettings: {
      organizationId: '',
      organizationName: '',
      cityCode: '',
      cityName: ''
    },
    organizations: [] as Organization[],
    cities: [] as City[],
    showOrgPicker: false,
    showCityPicker: false,
    orgPickerValue: [0],
    cityPickerValue: [0],
    selectedOrgIndex: 0,
    selectedCityIndex: 0
  },

  onLoad() {
    this.loadUserSettings()
    this.loadOrganizations()
    this.loadCities()
  },

  /**
   * 加载用户设置
   */
  loadUserSettings() {
    const userInfo = getCurrentUser()
    if (userInfo) {
      this.setData({
        userSettings: {
          organizationId: userInfo.organizationId || '',
          organizationName: userInfo.organizationName || '',
          cityCode: userInfo.cityCode || '',
          cityName: userInfo.cityName || ''
        }
      })
    }
  },

  /**
   * 加载组织列表
   */
  async loadOrganizations() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getOrganizations',
        data: {}
      })
      const response = result.result as any
      if (response.success) {
        this.setData({
          organizations: response.data
        })
      }
    } catch (error) {
      console.error('加载组织列表失败:', error)
    }
  },

  /**
   * 加载城市列表
   */
  async loadCities() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getCities',
        data: {}
      })
      const response = result.result as any
      if (response.success) {
        this.setData({
          cities: response.data
        })
      }
    } catch (error) {
      console.error('加载城市列表失败:', error)
    }
  },

  /**
   * 选择组织
   */
  onSelectOrganization() {
    this.setData({
      showOrgPicker: true
    })
  },

  /**
   * 选择城市
   */
  onSelectCity() {
    this.setData({
      showCityPicker: true
    })
  },

  /**
   * 组织选择器变化
   */
  onOrgPickerChange(e: any) {
    const { value } = e.detail
    this.setData({
      orgPickerValue: value,
      selectedOrgIndex: value[0]
    })
  },

  /**
   * 城市选择器变化
   */
  onCityPickerChange(e: any) {
    const { value } = e.detail
    this.setData({
      cityPickerValue: value,
      selectedCityIndex: value[0]
    })
  },

  /**
   * 确认选择组织
   */
  async onOrgConfirm() {
    const { organizations, selectedOrgIndex } = this.data
    const selectedOrg = organizations[selectedOrgIndex]

    if (!selectedOrg) return

    try {
      wx.showLoading({ title: '保存中...' })

      // 使用 updateUserInfo 统一更新用户信息
     await updateUserInfo({
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name
      })

      // 更新本地状态
      this.setData({
        'userSettings.organizationId': selectedOrg.id,
        'userSettings.organizationName': selectedOrg.name,
        showOrgPicker: false
      })

      wx.showToast({
        title: '设置已保存',
        icon: 'success'
      })

    } catch (error: any) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 确认选择城市
   */
  async onCityConfirm() {
    const { cities, selectedCityIndex } = this.data
    const selectedCity = cities[selectedCityIndex]

    if (!selectedCity) return

    try {
      wx.showLoading({ title: '保存中...' })

      // 使用 updateUserInfo 统一更新用户信息
      await updateUserInfo({
        cityCode: selectedCity.code,
        cityName: selectedCity.name
      })

      // 更新本地状态
      this.setData({
        'userSettings.cityCode': selectedCity.code,
        'userSettings.cityName': selectedCity.name,
        showCityPicker: false
      })

      wx.showToast({
        title: '设置已保存',
        icon: 'success'
      })

    } catch (error: any) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 关闭组织选择器
   */
  onOrgPickerClose() {
    this.setData({
      showOrgPicker: false
    })
  },

  /**
   * 关闭城市选择器
   */
  onCityPickerClose() {
    this.setData({
      showCityPicker: false
    })
  },

  /**
   * 清除缓存
   */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...'
          })

          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          }, 1000)
        }
      }
    })
  },

  /**
   * 关于我们
   */
  onAbout() {
    wx.showModal({
      title: '关于资信猫',
      content: '资信猫 v1.0.0\n专业的金融数据分析平台\n\n© 2023 资信猫团队',
      showCancel: false
    })
  },

  /**
   * 用户协议
   */
  onUserAgreement() {
    wx.navigateTo({
      url: '/packageUser/pages/userAgreement/userAgreement'
    })
  },

  /**
   * 隐私政策
   */
  onPrivacyPolicy() {
    wx.navigateTo({
      url: '/packageUser/pages/privacyPolicy/privacyPolicy'
    })
  }
})
