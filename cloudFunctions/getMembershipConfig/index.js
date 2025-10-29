// cloudFunctions/getMembershipConfig/index.js
// 获取会员配置云函数

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { type } = event

    // 如果指定了会员类型，返回单个配置
    if (type) {
      const result = await db.collection('membership_config')
        .where({
          type: type,
          enabled: true
        })
        .get()

      if (result.data.length === 0) {
        return {
          success: false,
          message: '会员配置不存在'
        }
      }

      return {
        success: true,
        data: result.data[0]
      }
    }

    // 否则返回所有启用的会员配置
    const result = await db.collection('membership_config')
      .where({
        enabled: true
      })
      .orderBy('sort', 'asc')
      .get()

    return {
      success: true,
      data: result.data
    }

  } catch (error) {
    console.error('获取会员配置失败:', error)
    return {
      success: false,
      message: '获取会员配置失败：' + error.message
    }
  }
}

