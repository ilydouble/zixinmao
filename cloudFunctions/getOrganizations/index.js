// 云函数：获取组织列表
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 获取组织列表云函数
 * @param {Object} event - 云函数参数
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 获取组织列表
    const orgQuery = await db.collection('organizations').where({
      status: 'active'
    }).orderBy('sort', 'asc').get()

    const organizations = orgQuery.data.map(org => ({
      id: org._id,
      name: org.name,
      code: org.code,
      type: org.type,
      description: org.description
    }))

    return {
      success: true,
      message: '获取组织列表成功',
      data: organizations
    }

  } catch (error) {
    console.error('获取组织列表失败:', error)
    return {
      success: false,
      message: '获取组织列表失败',
      error: error.message
    }
  }
}
