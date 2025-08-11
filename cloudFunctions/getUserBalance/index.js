// 云函数：获取用户余额和账务变化记录
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 获取用户余额和账务变化记录
 * @param {Object} event - 云函数参数
 * @param {number} event.limit - 获取记录数量，默认10
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    if (!OPENID) {
      return {
        success: false,
        message: '用户未登录'
      }
    }

    const limit = Math.min(50, Math.max(1, event.limit || 10))

    // 获取用户信息（包含余额）
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

    // 获取已完成的充值记录（只显示成功的充值）
    const rechargeQuery = await db.collection('recharge_records').where({
      userId: OPENID,
      status: 'completed'  // 只获取已完成的充值记录
    }).orderBy('createdAt', 'desc').limit(limit).get()

    // 获取已完成的消费订单记录（只显示成功的消费）
    const ordersQuery = await db.collection('orders').where({
      userId: OPENID,
      status: 'completed'  // 只获取已完成的订单
    }).orderBy('createdAt', 'desc').limit(limit).get()

    // 合并并排序所有已完成的交易记录
    const allTransactions = []

    // 处理已完成的充值记录
    rechargeQuery.data.forEach(record => {
      allTransactions.push({
        id: record._id,
        type: 'recharge',
        title: '充值',
        description: record.description || '账户充值',
        amount: record.amount,
        status: record.status, // 这里都是 'completed'
        paymentMethod: record.paymentMethod,
        createdAt: record.createdAt,
        rechargeNo: record.rechargeNo
      })
    })

    // 处理已完成的消费订单记录
    ordersQuery.data.forEach(order => {
      allTransactions.push({
        id: order._id,
        type: 'consumption',
        title: order.productName,
        description: order.description || order.productName,
        amount: order.amount,
        status: order.status, // 这里都是 'completed'
        createdAt: order.createdAt,
        orderNo: order.orderNo
      })
    })

    // 按时间倒序排序
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // 只取前 limit 条记录
    const recentTransactions = allTransactions.slice(0, limit)

    // 格式化交易记录
    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      title: transaction.title,
      description: transaction.description,
      amount: transaction.type === 'recharge' ? `+¥${transaction.amount.toFixed(2)}` : `-¥${transaction.amount.toFixed(2)}`,
      rawAmount: transaction.amount,
      status: transaction.status,
      statusText: getStatusText(transaction.status),
      date: formatDate(transaction.createdAt),
      createdAt: transaction.createdAt,
      orderNo: transaction.orderNo || transaction.rechargeNo,
      // 添加支付方式信息（仅充值记录）
      paymentMethod: transaction.paymentMethod
    }))

    // 获取用户表中的余额（主数据源）
    const userBalance = user.balance || 0

    // 计算实际余额（用于数据校验）
    const calculatedBalance = calculateActualBalance(rechargeQuery.data, ordersQuery.data)

    // 数据一致性检查
    const balanceDiff = Math.abs(userBalance - calculatedBalance)
    const isBalanceConsistent = balanceDiff < 0.01 // 允许1分钱的误差

    console.log('余额数据检查:', {
      userBalance,
      calculatedBalance,
      balanceDiff,
      isBalanceConsistent
    })

    // 如果数据不一致，记录日志但仍使用用户表余额
    if (!isBalanceConsistent) {
      console.warn('余额数据不一致:', {
        userId: OPENID,
        userBalance,
        calculatedBalance,
        difference: balanceDiff
      })
    }

    return {
      success: true,
      message: '获取余额信息成功',
      data: {
        balance: userBalance, // 使用用户表中的余额
        calculatedBalance: calculatedBalance, // 返回计算余额用于调试
        formattedBalance: `¥${userBalance.toFixed(2)}`,
        transactions: formattedTransactions,
        userInfo: {
          totalRecharge: user.totalRecharge || 0,
          totalConsumption: user.totalConsumption || 0
        },
        // 数据一致性信息
        balanceCheck: {
          isConsistent: isBalanceConsistent,
          difference: balanceDiff
        }
      }
    }

  } catch (error) {
    console.error('获取用户余额失败:', error)
    return {
      success: false,
      message: '获取余额信息失败',
      error: error.message
    }
  }
}

/**
 * 计算实际账户余额
 * 余额 = 已完成的充值总额 - 已完成的消费总额
 * 注意：传入的记录已经是已完成状态的，无需再次过滤
 */
function calculateActualBalance(rechargeRecords, orders) {
  // 计算充值总额（传入的记录都是已完成状态）
  const totalRecharge = rechargeRecords
    .reduce((sum, record) => sum + (record.amount || 0), 0)

  // 计算消费总额（传入的记录都是已完成状态）
  const totalConsumption = orders
    .reduce((sum, order) => sum + (order.amount || 0), 0)

  // 确保余额不为负数
  return Math.max(0, totalRecharge - totalConsumption)
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}
