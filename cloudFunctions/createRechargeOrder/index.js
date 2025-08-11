// 云函数：创建充值订单
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 创建充值订单并处理支付
 * @param {Object} event - 云函数参数
 * @param {number} event.amount - 充值金额
 * @param {string} event.paymentMethod - 支付方式，默认 'wechat_pay'
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

    const { amount, paymentMethod = 'wechat_pay' } = event

    // 参数验证
    if (!amount || amount <= 0) {
      return {
        success: false,
        message: '充值金额无效'
      }
    }

    if (amount < 1) {
      return {
        success: false,
        message: '充值金额不能少于1元'
      }
    }

    if (amount > 10000) {
      return {
        success: false,
        message: '单次充值不能超过10000元'
      }
    }

    console.log('创建充值订单:', { userId: OPENID, amount, paymentMethod })

    // 获取用户信息
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

    // 生成充值记录号
    const rechargeNo = generateRechargeNo()

    // 创建充值记录
    const rechargeRecord = {
      userId: OPENID,
      rechargeNo: rechargeNo,
      amount: amount,
      paymentMethod: paymentMethod,
      paymentChannel: 'miniprogram',
      status: 'completed', // 模拟支付成功，实际应该先创建为 'pending'
      transactionId: generateTransactionId(),
      description: '账户充值',
      remark: `充值${amount}元`,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date()
    }

    // 插入充值记录
    const rechargeResult = await db.collection('recharge_records').add({
      data: rechargeRecord
    })

    console.log('充值记录创建成功:', rechargeResult._id)

    // 更新用户余额和统计数据
    const updateResult = await db.collection('users').doc(user._id).update({
      data: {
        balance: db.command.inc(amount),
        totalRecharge: db.command.inc(amount),
        updatedAt: new Date(),
        lastRechargeAt: new Date()
      }
    })

    console.log('用户余额更新成功:', {
      userId: OPENID,
      addAmount: amount,
      newBalance: (user.balance || 0) + amount
    })

    return {
      success: true,
      message: '充值成功',
      data: {
        rechargeNo: rechargeNo,
        amount: amount,
        newBalance: (user.balance || 0) + amount,
        rechargeRecordId: rechargeResult._id
      }
    }

  } catch (error) {
    console.error('创建充值订单失败:', error)
    return {
      success: false,
      message: '充值失败',
      error: error.message
    }
  }
}

/**
 * 生成充值记录号
 */
function generateRechargeNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `R${year}${month}${day}${hour}${minute}${second}${random}`
}

/**
 * 生成交易ID（模拟）
 */
function generateTransactionId() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `wx_${timestamp}_${random}`
}
