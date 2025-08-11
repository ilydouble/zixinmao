const cloud = require('wx-server-sdk')

cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 查询用户信息
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

    // 获取用户订单数据
    const ordersQuery = await db.collection('orders').where({
      userId: OPENID
    }).orderBy('createdAt', 'desc').get()

    const orders = ordersQuery.data || []

    // 计算订单统计数据
    const orderStats = calculateOrderStats(orders)

    // 计算实际账户余额
    const actualBalance = calculateActualBalance(user, orderStats)

    // 处理头像URL（如果是云存储文件，获取临时访问URL）
    let avatarUrl = user.avatarUrl || ''
    if (avatarUrl && avatarUrl.startsWith('cloud://')) {
      try {
        const getTempFileURLResult = await cloud.getTempFileURL({
          fileList: [avatarUrl]
        })

        if (getTempFileURLResult.fileList && getTempFileURLResult.fileList.length > 0) {
          const fileInfo = getTempFileURLResult.fileList[0]
          if (fileInfo.status === 0) {
            avatarUrl = fileInfo.tempFileURL
          }
        }
      } catch (error) {
        console.warn('获取头像临时URL失败:', error)
        // 保持原URL，不影响其他功能
      }
    }

    // 获取最近的订单（最多5个）
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order._id,
      type: order.type,
      productName: order.productName,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt
    }))

    // 返回安全的用户信息
    const safeUserInfo = {
      _id: user._id,
      openid: user.openid,
      nickName: user.nickName || '',
      avatarUrl: avatarUrl,
      gender: user.gender || 0,
      country: user.country || '',
      province: user.province || '',
      city: user.city || '',
      language: user.language || '',
      realNameVerified: user.realNameVerified || false,
      realName: user.realName || '',
      phone: user.phone || '',
      balance: actualBalance,
      totalRecharge: user.totalRecharge || 0,
      totalConsumption: user.totalConsumption || 0,
      memberLevel: user.memberLevel || 'basic',
      memberExpireTime: user.memberExpireTime || null,
      organizationId: user.organizationId || '',
      organizationName: user.organizationName || '',
      cityCode: user.cityCode || '',
      cityName: user.cityName || '',
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      // 新增订单相关数据
      orderStats: {
        totalOrders: orderStats.totalOrders,
        completedOrders: orderStats.completedOrders,
        pendingOrders: orderStats.pendingOrders,
        totalRecharge: user.totalRecharge || 0,
        totalConsumption: orderStats.totalConsumption
      },
      recentOrders: recentOrders
    }

    return {
      success: true,
      userInfo: safeUserInfo
    }

  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      message: '获取用户信息失败',
      error: error.message
    }
  }
}

/**
 * 计算订单统计数据
 */
function calculateOrderStats(orders) {
  const stats = {
    totalOrders: orders.length,
    completedOrders: 0,
    pendingOrders: 0,
    totalConsumption: 0 // 所有订单金额总和
  }

  orders.forEach(order => {
    // 统计订单状态
    if (order.status === 'completed') {
      stats.completedOrders++
    } else if (order.status === 'pending' || order.status === 'processing') {
      stats.pendingOrders++
    }

    // 总消费 = 所有订单的金额总和
    if (order.status === 'completed') {
      stats.totalConsumption += order.amount || 0
    }
  })

  return stats
}

/**
 * 计算实际账户余额
 * 余额 = 总充值 - 总消费
 */
function calculateActualBalance(user, orderStats) {
  const totalRecharge = user.totalRecharge || 0
  const totalConsumption = orderStats.totalConsumption || 0

  // 确保余额不为负数
  return Math.max(0, totalRecharge - totalConsumption)
}
