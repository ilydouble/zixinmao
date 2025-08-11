// 云函数：实名认证
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 实名认证云函数
 * @param {Object} event - 云函数参数
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const { realName, idCard, phone } = event

  try {
    // 验证参数
    if (!realName || !idCard || !phone) {
      return {
        success: false,
        message: '请填写完整的认证信息'
      }
    }

    // 简单的身份证号格式验证
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    if (!idCardRegex.test(idCard)) {
      return {
        success: false,
        message: '身份证号格式不正确'
      }
    }

    // 简单的手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        message: '手机号格式不正确'
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

    // 检查是否已经实名认证
    if (user.realNameVerified) {
      return {
        success: false,
        message: '您已完成实名认证'
      }
    }

    // 检查身份证号是否已被其他用户使用
    const idCardQuery = await db.collection('users').where({
      idCard: idCard,
      realNameVerified: true
    }).get()

    if (idCardQuery.data.length > 0) {
      return {
        success: false,
        message: '该身份证号已被认证'
      }
    }

    // 检查手机号是否已被其他用户使用
    const phoneQuery = await db.collection('users').where({
      phone: phone,
      realNameVerified: true
    }).get()

    if (phoneQuery.data.length > 0) {
      return {
        success: false,
        message: '该手机号已被认证'
      }
    }

    // 这里应该调用第三方实名认证接口进行验证
    // 为了演示，我们直接通过认证
    const authResult = await mockRealNameAuth(realName, idCard)

    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || '实名认证失败'
      }
    }

    // 更新用户实名信息
    await db.collection('users').doc(user._id).update({
      data: {
        realName: realName,
        idCard: idCard,
        phone: phone,
        realNameVerified: true,
        realNameAuthTime: new Date(),
        updatedAt: new Date()
      }
    })

    // 记录认证日志
    await db.collection('auth_logs').add({
      data: {
        openid: OPENID,
        userId: user._id,
        authType: 'realName',
        authData: {
          realName: realName,
          idCard: idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'), // 脱敏处理
          phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        },
        authResult: 'success',
        authTime: new Date()
      }
    })

    return {
      success: true,
      message: '实名认证成功'
    }

  } catch (error) {
    console.error('实名认证失败:', error)
    return {
      success: false,
      message: '认证失败，请重试',
      error: error.message
    }
  }
}

/**
 * 模拟实名认证接口
 * 实际项目中应该调用真实的第三方认证服务
 */
async function mockRealNameAuth(realName, idCard) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 简单的模拟逻辑：如果姓名包含"测试"则认证失败
  if (realName.includes('测试')) {
    return {
      success: false,
      message: '认证信息有误，请检查后重试'
    }
  }
  
  return {
    success: true,
    message: '认证成功'
  }
}
