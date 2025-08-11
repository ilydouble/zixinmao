// 云函数：同步用户余额
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 同步用户余额
 * 根据充值记录和消费订单重新计算并更新用户表中的余额
 * @param {Object} event - 云函数参数
 * @param {string} event.userId - 用户ID，如果不提供则同步当前用户
 * @param {boolean} event.forceUpdate - 是否强制更新，默认false
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    // 确定要同步的用户ID
    const targetUserId = event.userId || OPENID

    if (!targetUserId) {
      return {
        success: false,
        message: '用户ID不能为空'
      }
    }

    console.log('开始同步用户余额:', targetUserId)

    // 获取用户信息
    const userQuery = await db.collection('users').where({
      openid: targetUserId
    }).get()

    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userQuery.data[0]
    const currentBalance = user.balance || 0

    // 获取所有充值记录
    const rechargeQuery = await db.collection('recharge_records').where({
      userId: targetUserId
    }).get()

    // 获取所有消费订单
    const ordersQuery = await db.collection('orders').where({
      userId: targetUserId
    }).get()

    // 计算实际余额
    const calculatedBalance = calculateActualBalance(rechargeQuery.data, ordersQuery.data)

    // 计算统计数据
    const stats = calculateUserStats(rechargeQuery.data, ordersQuery.data)

    // 检查是否需要更新
    const balanceDiff = Math.abs(currentBalance - calculatedBalance)
    const needUpdate = event.forceUpdate || balanceDiff >= 0.01

    if (!needUpdate) {
      return {
        success: true,
        message: '余额已同步，无需更新',
        data: {
          userId: targetUserId,
          currentBalance,
          calculatedBalance,
          difference: balanceDiff,
          updated: false
        }
      }
    }

    // 更新用户余额和统计数据
    await db.collection('users').doc(user._id).update({
      data: {
        balance: calculatedBalance,
        totalRecharge: stats.totalRecharge,
        totalConsumption: stats.totalConsumption,
        updatedAt: new Date(),
        lastBalanceSyncAt: new Date()
      }
    })

    console.log('用户余额同步完成:', {
      userId: targetUserId,
      oldBalance: currentBalance,
      newBalance: calculatedBalance,
      difference: calculatedBalance - currentBalance
    })

    return {
      success: true,
      message: '余额同步成功',
      data: {
        userId: targetUserId,
        oldBalance: currentBalance,
        newBalance: calculatedBalance,
        difference: calculatedBalance - currentBalance,
        stats: stats,
        updated: true
      }
    }

  } catch (error) {
    console.error('同步用户余额失败:', error)
    return {
      success: false,
      message: '同步余额失败',
      error: error.message
    }
  }
}

/**
 * 计算实际账户余额
 * 余额 = 已完成的充值总额 - 已完成的消费总额
 */
function calculateActualBalance(rechargeRecords, orders) {
  // 计算已完成的充值总额
  const totalRecharge = rechargeRecords
    .filter(record => record.status === 'completed')
    .reduce((sum, record) => sum + (record.amount || 0), 0)

  // 计算已完成的消费总额
  const totalConsumption = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.amount || 0), 0)

  // 确保余额不为负数
  return Math.max(0, totalRecharge - totalConsumption)
}

/**
 * 计算用户统计数据
 */
function calculateUserStats(rechargeRecords, orders) {
  // 总充值金额（包括所有状态）
  const totalRecharge = rechargeRecords
    .filter(record => record.status === 'completed')
    .reduce((sum, record) => sum + (record.amount || 0), 0)

  // 总消费金额（包括所有状态）
  const totalConsumption = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.amount || 0), 0)

  // 充值次数
  const rechargeCount = rechargeRecords.filter(record => record.status === 'completed').length

  // 消费次数
  const consumptionCount = orders.filter(order => order.status === 'completed').length

  return {
    totalRecharge,
    totalConsumption,
    rechargeCount,
    consumptionCount,
    balance: Math.max(0, totalRecharge - totalConsumption)
  }
}
