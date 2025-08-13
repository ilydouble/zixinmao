const cloud = require('wx-server-sdk')

// 初始化云开发环境
const initConfig = {
  env: process.env.WECHAT_CLOUD_ENV || 'zixinmao-6gze9a8pef07503b'
}

// 如果提供了密钥，则使用密钥认证
if (process.env.WECHAT_SECRET_ID && process.env.WECHAT_SECRET_KEY) {
  initConfig.secretId = process.env.WECHAT_SECRET_ID
  initConfig.secretKey = process.env.WECHAT_SECRET_KEY
  console.log('🔑 使用密钥认证连接云开发')
} else {
  console.log('⚠️  未配置云开发密钥，使用默认认证方式')
}

cloud.init(initConfig)

const db = cloud.database()

/**
 * 数据库连接测试
 */
async function testConnection() {
  try {
    console.log('🔍 测试云开发连接...')
    
    // 测试数据库访问
    const result = await db.collection('users').count()
    console.log('✅ 数据库连接成功，用户数量:', result.total)
    
    // 测试系统配置访问
    const config = await db.collection('system_config').count()
    console.log('✅ 系统配置表连接成功，配置数量:', config.total)
    
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    
    if (error.message.includes('permission')) {
      console.log('💡 权限错误，请检查:')
      console.log('1. API 密钥是否正确配置')
      console.log('2. 域名是否已添加到安全域名列表')
      console.log('3. 云开发环境 ID 是否正确')
    }
    
    return false
  }
}

/**
 * 获取系统配置
 * @param {string} key - 配置键
 * @returns {Promise<any>} 配置值
 */
async function getSystemConfig(key) {
  try {
    const result = await db.collection('system_config')
      .where({ key })
      .get()
    
    if (result.data.length > 0) {
      return result.data[0].value
    }
    return null
  } catch (error) {
    console.error('获取系统配置失败:', error)
    return null
  }
}

/**
 * 设置系统配置
 * @param {string} key - 配置键
 * @param {any} value - 配置值
 * @param {string} type - 数据类型
 * @param {string} description - 描述
 * @param {string} category - 分类
 * @param {string} updatedBy - 更新人
 */
async function setSystemConfig(key, value, type = 'string', description = '', category = 'system', updatedBy = 'system') {
  try {
    const existing = await db.collection('system_config')
      .where({ key })
      .get()
    
    const configData = {
      key,
      value,
      type,
      description,
      category,
      updatedBy,
      updatedAt: new Date()
    }
    
    if (existing.data.length > 0) {
      // 更新现有配置
      await db.collection('system_config')
        .doc(existing.data[0]._id)
        .update({ data: configData })
    } else {
      // 创建新配置
      await db.collection('system_config')
        .add({ data: configData })
    }
    
    return true
  } catch (error) {
    console.error('设置系统配置失败:', error)
    return false
  }
}

/**
 * 记录管理员操作日志
 * @param {Object} logData - 日志数据
 */
async function logAdminAction(logData) {
  try {
    const log = {
      adminId: logData.adminId,
      adminUsername: logData.adminUsername,
      adminRole: logData.adminRole,
      organizationId: logData.organizationId || null,
      action: logData.action,
      module: logData.module,
      target: logData.target || null,
      details: logData.details,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      result: logData.result || 'success',
      createdAt: new Date()
    }
    
    await db.collection('admin_logs').add({ data: log })
    return true
  } catch (error) {
    console.error('记录操作日志失败:', error)
    return false
  }
}

module.exports = {
  db,
  cloud,
  testConnection,
  getSystemConfig,
  setSystemConfig,
  logAdminAction
}
