// test.ts - 云函数测试页面
import { login, refreshUserInfo, getCurrentUser, updateUserInfo, realNameAuth } from '../../utils/auth'

Page({
  data: {
    testResult: ''
  },

  /**
   * 跳转到初始化页面
   */
  goToInit() {
    wx.navigateTo({
      url: '/pages/init/init'
    })
  },

  /**
   * 测试登录
   */
  async testLogin() {
    this.setData({ testResult: '正在测试登录...' })

    try {
      const userInfo = await login()
      this.setData({
        testResult: `登录成功！\n用户信息：${JSON.stringify(userInfo, null, 2)}`
      })
    } catch (error: any) {
      this.setData({
        testResult: `登录失败：${error.message}`
      })
    }
  },

  /**
   * 测试获取用户信息
   */
  async testGetUserInfo() {
    this.setData({ testResult: '正在获取用户信息...' })

    try {
      await refreshUserInfo()
      const userInfo = getCurrentUser()
      this.setData({
        testResult: `获取用户信息成功！\n${JSON.stringify(userInfo, null, 2)}`
      })
    } catch (error: any) {
      this.setData({
        testResult: `获取用户信息失败：${error.message}`
      })
    }
  },

  /**
   * 测试更新用户信息
   */
  async testUpdateUserInfo() {
    this.setData({ testResult: '正在更新用户信息...' })

    try {
      const updateData = {
        nickName: '测试用户' + Date.now(),
        gender: 1
      }

      const userInfo = await updateUserInfo(updateData)
      this.setData({
        testResult: `更新用户信息成功！\n${JSON.stringify(userInfo, null, 2)}`
      })
    } catch (error: any) {
      this.setData({
        testResult: `更新用户信息失败：${error.message}`
      })
    }
  },

  /**
   * 测试实名认证
   */
  async testRealNameAuth() {
    this.setData({ testResult: '正在测试实名认证...' })

    try {
      const result = await realNameAuth('张三', '110101199001011234', '13800138000')
      this.setData({
        testResult: `实名认证成功！结果：${result}`
      })
    } catch (error: any) {
      this.setData({
        testResult: `实名认证失败：${error.message}`
      })
    }
  },

  /**
   * 测试初始化数据库
   */
  async testInitDatabase() {
    this.setData({ testResult: '正在初始化数据库...' })

    try {
      const response = await wx.cloud.callFunction({
        name: 'initDatabase'
      })
      this.setData({
        testResult: `数据库初始化完成！\n${JSON.stringify(response.result, null, 2)}`
      })
    } catch (error: any) {
      this.setData({
        testResult: `数据库初始化失败：${error.message}`
      })
    }
  },

  /**
   * 测试设置用户组织和城市
   */
  async testSetUserLocation() {
    this.setData({ testResult: '正在设置用户组织和城市...' })

    try {
      // 先获取组织列表
      const orgResult = await wx.cloud.callFunction({
        name: 'getOrganizations',
        data: {}
      })
      const cityResult = await wx.cloud.callFunction({
        name: 'getCities',
        data: {}
      })

      const orgResponse = orgResult.result as any
      const cityResponse = cityResult.result as any

      if (orgResponse.success && cityResponse.success) {
        const org = orgResponse.data[0] // 选择第一个组织
        const city = cityResponse.data[0] // 选择第一个城市

        // 使用 updateUserInfo 更新用户设置
        await updateUserInfo({
          organizationId: org.id,
          organizationName: org.name,
          cityCode: city.code,
          cityName: city.name
        })

        this.setData({
          testResult: `设置成功！\n组织：${org.name}\n城市：${city.name}\n\n请前往个人中心查看效果`
        })
      } else {
        throw new Error('获取组织或城市列表失败')
      }
    } catch (error: any) {
      this.setData({
        testResult: `设置失败：${error.message}`
      })
    }
  },

  /**
   * 测试验证个人中心显示
   */
  async testVerifyDisplay() {
    this.setData({ testResult: '正在验证个人中心显示...' })

    try {
      // 获取当前用户信息
      const userInfo = getCurrentUser()

      if (!userInfo) {
        throw new Error('用户未登录')
      }

      let result = '当前用户信息：\n'
      result += `昵称：${userInfo.nickName || '未设置'}\n`
      result += `组织ID：${userInfo.organizationId || '未设置'}\n`
      result += `组织名：${userInfo.organizationName || '未设置'}\n`
      result += `城市代码：${userInfo.cityCode || '未设置'}\n`
      result += `城市名：${userInfo.cityName || '未设置'}\n\n`

      const hasOrg = userInfo.organizationId && userInfo.organizationId !== ''
      const hasCity = userInfo.cityCode && userInfo.cityCode !== ''

      if (hasOrg && hasCity) {
        result += '✅ 组织和城市信息完整\n'
        result += '个人中心应显示两个标签'
      } else if (hasOrg && !hasCity) {
        result += '⚠️ 只设置了组织\n'
        result += '个人中心应显示组织标签 + 城市设置提示'
      } else if (!hasOrg && hasCity) {
        result += '⚠️ 只设置了城市\n'
        result += '个人中心应显示城市标签 + 组织设置提示'
      } else {
        result += '❌ 未设置组织和城市\n'
        result += '个人中心应显示完整设置提示'
      }

      this.setData({ testResult: result })

    } catch (error: any) {
      this.setData({
        testResult: `验证失败：${error.message}`
      })
    }
  },

  /**
   * 测试不同显示状态
   */
  async testDisplayStates() {
    this.setData({ testResult: '正在测试不同显示状态...' })

    try {
      const states = [
        {
          name: '完整设置',
          data: {
            organizationId: 'org001',
            organizationName: '银行机构',
            cityCode: '110000',
            cityName: '北京市'
          }
        },
        {
          name: '只设置组织',
          data: {
            organizationId: 'org002',
            organizationName: '证券公司',
            cityCode: '',
            cityName: ''
          }
        },
        {
          name: '只设置城市',
          data: {
            organizationId: '',
            organizationName: '',
            cityCode: '310000',
            cityName: '上海市'
          }
        },
        {
          name: '都未设置',
          data: {
            organizationId: '',
            organizationName: '',
            cityCode: '',
            cityName: ''
          }
        }
      ]

      let result = '测试不同显示状态：\n\n'

      for (let i = 0; i < states.length; i++) {
        const state = states[i]
        result += `${i + 1}. ${state.name}:\n`

        try {
          // 更新用户信息
          await updateUserInfo(state.data)
          result += `   ✅ 设置成功\n`
          result += `   组织ID：${state.data.organizationId || '未设置'}\n`
          result += `   组织名：${state.data.organizationName || '未设置'}\n`
          result += `   城市代码：${state.data.cityCode || '未设置'}\n`
          result += `   城市名：${state.data.cityName || '未设置'}\n\n`
        } catch (error: any) {
          result += `   ❌ 设置失败：${error.message}\n\n`
        }

        // 添加延迟，让用户能看到变化
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      result += '测试完成！请前往个人中心查看最终状态。'
      this.setData({ testResult: result })

    } catch (error: any) {
      this.setData({
        testResult: `测试失败：${error.message}`
      })
    }
  },

  /**
   * 创建测试订单数据
   */
  async testCreateOrders() {
    this.setData({ testResult: '正在创建测试订单数据...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'createTestOrders',
        data: {}
      })

      const response = result.result as any

      if (response.success) {
        let result = '测试订单创建成功！\n\n'
        result += `创建订单数：${response.data.ordersCreated}\n`
        result += `总订单：${response.data.stats.totalOrders}\n`
        result += `已完成：${response.data.stats.completedOrders}\n`
        result += `待处理：${response.data.stats.pendingOrders}\n`
        result += `总充值：¥${response.data.stats.totalRecharge}\n`
        result += `总消费：¥${response.data.stats.totalConsumption}\n`
        result += `账户余额：¥${response.data.balance}\n\n`
        result += '请前往个人中心查看效果！'

        this.setData({ testResult: result })
      } else {
        throw new Error(response.message)
      }

    } catch (error: any) {
      this.setData({
        testResult: `创建测试订单失败：${error.message}`
      })
    }
  },

  /**
   * 创建测试订单数据
   */
  async testCreateOrders() {
    this.setData({ testResult: '正在创建测试订单数据...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'createTestOrders',
        data: {}
      })

      const response = result.result as any

      if (response.success) {
        let result = '测试订单创建成功！\n\n'
        result += `创建订单数：${response.data.ordersCreated}\n`
        result += `总订单：${response.data.stats.totalOrders}\n`
        result += `已完成：${response.data.stats.completedOrders}\n`
        result += `待处理：${response.data.stats.pendingOrders}\n`
        result += `总充值：¥${response.data.stats.totalRecharge}\n`
        result += `总消费：¥${response.data.stats.totalConsumption}\n`
        result += `账户余额：¥${response.data.balance}\n\n`
        result += '请前往个人中心查看效果！'

        this.setData({ testResult: result })
      } else {
        throw new Error(response.message)
      }

    } catch (error: any) {
      this.setData({
        testResult: `创建测试订单失败：${error.message}`
      })
    }
  },

  /**
   * 初始化存储目录（简化版）
   */
  async testInitStorage() {
    this.setData({
      testResult: this.data.testResult + '\n\n正在创建存储目录...'
    })

    try {
      // 创建一个临时文件用于上传
      const fs = wx.getFileSystemManager()
      const tempFilePath = wx.env.USER_DATA_PATH + '/temp_keep_file.txt'
      
      // 写入临时文件
      fs.writeFileSync(tempFilePath, '')

      const directories = [
        'uploads/.keep',
        'reports/.keep', 
        'temp/.keep',
        'system/templates/.keep',
        'system/assets/.keep'
      ]

      const results = []
      
      for (const dir of directories) {
        try {
          await wx.cloud.uploadFile({
            cloudPath: dir,
            filePath: tempFilePath
          })
          results.push(`✅ 创建目录: ${dir}`)
        } catch (error: any) {
          if (error.errCode === -402003) {
            results.push(`ℹ️ 目录已存在: ${dir}`)
          } else {
            results.push(`❌ 创建失败: ${dir} - ${error.message}`)
          }
        }
      }

      // 清理临时文件
      try {
        fs.unlinkSync(tempFilePath)
      } catch (e) {
        // 忽略清理错误
      }

      this.setData({
        testResult: this.data.testResult + '\n\n' + results.join('\n') + '\n\n🎉 存储初始化完成！'
      })

    } catch (error: any) {
      this.setData({
        testResult: this.data.testResult + `\n\n❌ 存储初始化失败：${error.message}`
      })
    }
  }
})
