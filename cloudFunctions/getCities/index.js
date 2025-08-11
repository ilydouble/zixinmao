// 云函数：获取城市列表
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 获取城市列表云函数
 * @param {Object} event - 云函数参数
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { provinceCode } = event

  try {
    let query = db.collection('cities').where({
      status: 'active'
    })

    // 如果指定了省份代码，只获取该省份的城市
    if (provinceCode) {
      query = query.where({
        provinceCode: provinceCode
      })
    }

    const cityQuery = await query.orderBy('sort', 'asc').get()

    const cities = cityQuery.data.map(city => ({
      id: city._id,
      name: city.name,
      code: city.code,
      provinceCode: city.provinceCode,
      provinceName: city.provinceName,
      level: city.level
    }))

    return {
      success: true,
      message: '获取城市列表成功',
      data: cities
    }

  } catch (error) {
    console.error('获取城市列表失败:', error)
    return {
      success: false,
      message: '获取城市列表失败',
      error: error.message
    }
  }
}
