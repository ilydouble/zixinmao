// 云函数：检查登录状态
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 检查登录状态云函数
 * @param {Object} event - 云函数参数
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 检查用户是否存在且状态正常
    const userQuery = await db.collection('users').where({
      openid: OPENID,
      status: 'active'  // 只查询状态为活跃的用户
    }).get()

    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在或已被禁用',
        needRelogin: true
      }
    }

    const user = userQuery.data[0]

    // 更新最后活跃时间
    await db.collection('users').doc(user._id).update({
      data: {
        lastActiveAt: new Date(),
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: '登录状态有效',
      userInfo: {
        openid: user.openid,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        realNameVerified: user.realNameVerified,
        memberLevel: user.memberLevel,
        balance: user.balance
      }
    }

  } catch (error) {
    console.error('检查登录状态失败:', error)
    return {
      success: false,
      message: '检查登录状态失败',
      error: error.message
    }
  }
}
