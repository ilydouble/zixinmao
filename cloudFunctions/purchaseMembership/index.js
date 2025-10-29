// cloudFunctions/purchaseMembership/index.js
// 购买/续费会员云函数

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 计算新的到期时间
 */
function calculateNewExpiryDate(currentExpiry, months) {
  const now = new Date()

  console.log('计算到期时间 - 当前时间:', now)
  console.log('计算到期时间 - 当前会员到期时间:', currentExpiry)
  console.log('计算到期时间 - 增加月数:', months)

  // 如果当前会员还未过期，从当前到期时间延长；否则从现在开始
  const current = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now

  console.log('计算到期时间 - 基准时间:', current)

  const newExpiry = new Date(current)
  newExpiry.setMonth(newExpiry.getMonth() + months)

  console.log('计算到期时间 - 新的到期时间:', newExpiry)
  console.log('计算到期时间 - 新的到期时间 ISO:', newExpiry.toISOString())

  return newExpiry
}

/**
 * 获取时长对应的月数
 */
function getMonthsFromDuration(duration) {
  const durationMap = {
    'monthly': 1,
    'quarterly': 3,
    'yearly': 12
  }
  return durationMap[duration] || 1
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { membershipType, duration, price } = event

    // 验证参数
    if (!membershipType || !duration || !price) {
      return {
        success: false,
        message: '参数不完整'
      }
    }

    // 验证会员类型
    const validTypes = ['basic', 'premium']
    if (!validTypes.includes(membershipType)) {
      return {
        success: false,
        message: '无效的会员类型'
      }
    }

    // 验证时长
    const validDurations = ['monthly', 'quarterly', 'yearly']
    if (!validDurations.includes(duration)) {
      return {
        success: false,
        message: '无效的时长选项'
      }
    }

    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ openid })
      .get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userResult.data[0]
    const months = getMonthsFromDuration(duration)
    const newExpiryDate = calculateNewExpiryDate(user.memberExpireTime, months)

    console.log('用户信息:', {
      openid,
      currentMemberLevel: user.memberLevel,
      currentExpireTime: user.memberExpireTime
    })

    const expiryDateISO = newExpiryDate.toISOString()

    console.log('准备更新用户会员信息:', {
      memberLevel: membershipType,
      memberExpireTime: expiryDateISO
    })

    // 更新用户会员信息
    await db.collection('users')
      .where({ openid })
      .update({
        data: {
          memberLevel: membershipType,
          memberExpireTime: expiryDateISO,
          updatedAt: new Date()
        }
      })

    console.log('用户会员信息已更新')

    // 创建充值记录（可选，用于记录会员购买历史）
    await db.collection('recharge_records').add({
      data: {
        openid,
        userId: user._id,
        type: 'membership',
        membershipType,
        duration,
        amount: price,
        months,
        expiryDate: expiryDateISO,
        status: 'completed',
        paymentMethod: 'wechat_pay',
        createdAt: new Date()
      }
    })

    // 格式化到期时间（用于显示）
    const year = newExpiryDate.getFullYear()
    const month = String(newExpiryDate.getMonth() + 1).padStart(2, '0')
    const day = String(newExpiryDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    console.log('返回结果:', {
      membershipType,
      duration,
      expiryDate: formattedDate,
      expiryDateISO,
      months
    })

    return {
      success: true,
      message: '会员开通成功',
      data: {
        membershipType,
        duration,
        expiryDate: formattedDate,
        expiryDateISO,  // 同时返回 ISO 格式，方便调试
        months
      }
    }

  } catch (error) {
    console.error('购买会员失败:', error)
    return {
      success: false,
      message: '购买会员失败：' + error.message
    }
  }
}

