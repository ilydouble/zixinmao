// 云函数：获取企业用户列表
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 获取企业用户列表云函数
 * @param {Object} event - 云函数参数
 * @param {string} event.organizationId - 企业ID
 * @param {number} event.page - 页码，默认1
 * @param {number} event.pageSize - 每页数量，默认20
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const { organizationId, page = 1, pageSize = 20 } = event

    if (!organizationId) {
      return {
        success: false,
        message: '企业ID不能为空'
      }
    }

    const skip = (page - 1) * pageSize
    const limit = Math.min(100, Math.max(1, pageSize))

    // 获取企业用户总数
    const countResult = await db.collection('users').where({
      organizationId: organizationId,
      status: 'active'
    }).count()

    // 获取企业用户列表
    const usersResult = await db.collection('users').where({
      organizationId: organizationId,
      status: 'active'
    }).orderBy('createdAt', 'desc').skip(skip).limit(limit).get()

    // 格式化用户数据
    const users = usersResult.data.map(user => ({
      id: user._id,
      openid: user.openid,
      nickName: user.nickName || '',
      avatarUrl: user.avatarUrl || '',
      realNameVerified: user.realNameVerified || false,
      realName: user.realName || '',
      phone: user.phone || '',
      balance: user.balance || 0,
      totalRecharge: user.totalRecharge || 0,
      totalConsumption: user.totalConsumption || 0,
      memberLevel: user.memberLevel || 'basic',
      organizationName: user.organizationName || '',
      cityName: user.cityName || '',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }))

    // 计算统计数据
    const stats = {
      totalUsers: countResult.total,
      verifiedUsers: users.filter(u => u.realNameVerified).length,
      totalRecharge: users.reduce((sum, u) => sum + u.totalRecharge, 0),
      totalConsumption: users.reduce((sum, u) => sum + u.totalConsumption, 0),
      totalBalance: users.reduce((sum, u) => sum + u.balance, 0)
    }

    return {
      success: true,
      message: '获取企业用户列表成功',
      data: {
        users: users,
        stats: stats,
        pagination: {
          page: page,
          pageSize: limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    }

  } catch (error) {
    console.error('获取企业用户列表失败:', error)
    return {
      success: false,
      message: '获取企业用户列表失败',
      error: error.message
    }
  }
}
