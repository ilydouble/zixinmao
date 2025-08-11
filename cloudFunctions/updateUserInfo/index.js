// 云函数：更新用户信息
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 更新用户信息云函数
 * @param {Object} event - 云函数参数
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { userInfo } = event

  try {
    // 验证参数
    if (!userInfo || typeof userInfo !== 'object') {
      return {
        success: false,
        message: '参数错误'
      }
    }

    // 查找用户
    const userQuery = await db.collection('users').where({
      openid: OPENID
    }).get()

    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userQuery.data[0]

    // 允许更新的字段白名单
    const allowedFields = [
      'nickName',
      'avatarUrl',
      'gender',
      'country',
      'province',
      'city',
      'language',
      'organizationId',
      'organizationName',
      'cityCode',
      'cityName'
    ]

    // 过滤并构建更新数据
    const updateData = {
      updatedAt: new Date()
    }

    for (const field of allowedFields) {
      if (userInfo.hasOwnProperty(field)) {
        updateData[field] = userInfo[field]
      }
    }

    // 更新用户信息
    await db.collection('users').doc(user._id).update({
      data: updateData
    })

    // 获取更新后的用户信息
    const updatedUserQuery = await db.collection('users').doc(user._id).get()
    const updatedUser = updatedUserQuery.data

    // 返回安全的用户信息
    const safeUserInfo = {
      openid: updatedUser.openid,
      nickName: updatedUser.nickName,
      avatarUrl: updatedUser.avatarUrl,
      gender: updatedUser.gender,
      realNameVerified: updatedUser.realNameVerified,
      balance: updatedUser.balance,
      memberLevel: updatedUser.memberLevel,
      memberExpireTime: updatedUser.memberExpireTime,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt,
      updatedAt: updatedUser.updatedAt
    }

    return {
      success: true,
      message: '更新成功',
      userInfo: safeUserInfo
    }

  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      message: '更新失败，请重试',
      error: error.message
    }
  }
}
