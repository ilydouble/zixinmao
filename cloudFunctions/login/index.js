const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { code } = event
    const wxContext = cloud.getWXContext()
    const { OPENID, APPID, UNIONID } = wxContext

    // 如果需要获取更多信息，可以使用 code 调用微信 API
    if (code) {
      // 可以调用微信 API 获取 session_key 等
      // const authResult = await cloud.openapi.sns.jscode2session({
      //   jsCode: code,
      //   grantType: 'authorization_code'
      // })
    }

    // 检查用户是否已存在
    const userQuery = await db.collection('users').where({
      openid: OPENID
    }).get()

    let userInfo
    const currentTime = new Date()

    if (userQuery.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        openid: OPENID,
        unionid: UNIONID || null,
        appid: APPID,
        nickName: '微信用户',
        avatarUrl: '',
        gender: 0,
        country: '',
        province: '',
        city: '',
        language: '',
        realNameVerified: false,
        realName: '',
        idCard: '',
        phone: '',
        balance: 0,
        totalRecharge: 0,
        totalConsumption: 0,
        memberLevel: 'basic',
        memberExpireTime: null,
        organizationId: '',
        organizationName: '',
        cityCode: '',
        cityName: '',
        status: 'active',
        createdAt: currentTime,
        updatedAt: currentTime,
        lastLoginAt: currentTime,
        loginCount: 1
      }

      const createResult = await db.collection('users').add({
        data: newUser
      })

      userInfo = {
        _id: createResult._id,
        ...newUser
      }

      console.log('新用户注册成功:', OPENID)
    } else {
      // 老用户，更新登录信息
      userInfo = userQuery.data[0]
      
      await db.collection('users').doc(userInfo._id).update({
        data: {
          lastLoginAt: currentTime,
          loginCount: db.command.inc(1),
          updatedAt: currentTime
        }
      })

      console.log('用户登录成功:', OPENID)
    }

    // 返回安全的用户信息
    const safeUserInfo = {
      openid: userInfo.openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      gender: userInfo.gender,
      realNameVerified: userInfo.realNameVerified,
      balance: userInfo.balance,
      memberLevel: userInfo.memberLevel,
      memberExpireTime: userInfo.memberExpireTime,
      organizationId: userInfo.organizationId,
      organizationName: userInfo.organizationName,
      cityCode: userInfo.cityCode,
      cityName: userInfo.cityName,
      createdAt: userInfo.createdAt,
      lastLoginAt: userInfo.lastLoginAt
    }

    return {
      success: true,
      message: '登录成功',
      userInfo: safeUserInfo,
      isNewUser: userQuery.data.length === 0
    }

  } catch (error) {
    console.error('登录云函数错误:', error)
    return {
      success: false,
      message: error.message || '登录失败，请重试'
    }
  }
}
