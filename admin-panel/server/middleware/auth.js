const jwt = require('jsonwebtoken')
const { db } = require('../config/database')

/**
 * 认证中间件
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: '认证令牌无效' })
    }
    
    // 验证 JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.role === 'root') {
      // Root 管理员
      req.user = {
        id: 'root',
        username: 'root',
        role: 'root',
        permissions: ['*']
      }
    } else {
      // 企业管理员，从数据库获取最新信息
      const admin = await db.collection('company_admins')
        .doc(decoded.id)
        .get()
      
      if (!admin.data || admin.data.status !== 'active') {
        return res.status(401).json({ error: '账户已禁用或不存在' })
      }
      
      req.user = {
        id: admin.data._id,
        username: admin.data.username,
        role: 'company_admin',
        organizationId: admin.data.organizationId,
        organizationName: admin.data.organizationName,
        permissions: admin.data.permissions || []
      }
    }
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '认证令牌无效' })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '认证令牌已过期' })
    } else {
      console.error('认证中间件错误:', error)
      return res.status(500).json({ error: '认证服务异常' })
    }
  }
}

/**
 * 角色验证中间件
 * @param {Array} roles - 允许的角色列表
 */
function requireRole(roles) {
  return (req, res, next) => {
    const userRole = req.user?.role
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: '权限不足' })
    }
    
    next()
  }
}

/**
 * 权限验证中间件
 * @param {string} permission - 需要的权限
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({ error: '未认证' })
    }
    
    // Root 管理员拥有所有权限
    if (user.role === 'root') {
      return next()
    }
    
    // 检查企业管理员权限
    if (!user.permissions || !user.permissions.includes(permission)) {
      return res.status(403).json({ error: '权限不足' })
    }
    
    next()
  }
}

/**
 * 企业数据访问验证中间件
 */
function requireOrgAccess(req, res, next) {
  const user = req.user
  const targetOrgId = req.params.organizationId || req.query.organizationId || req.body.organizationId
  
  if (!user) {
    return res.status(401).json({ error: '未认证' })
  }
  
  // Root 管理员可访问所有数据
  if (user.role === 'root') {
    return next()
  }
  
  // 企业管理员只能访问本企业数据
  if (user.role === 'company_admin') {
    if (!targetOrgId) {
      // 如果没有指定企业ID，使用管理员所属企业
      req.organizationId = user.organizationId
      return next()
    }
    
    if (user.organizationId === targetOrgId) {
      return next()
    }
  }
  
  return res.status(403).json({ error: '无权访问该企业数据' })
}

/**
 * 检查用户是否有指定权限
 * @param {Object} user - 用户对象
 * @param {string} permission - 权限名称
 * @returns {boolean}
 */
function hasPermission(user, permission) {
  if (!user) return false
  
  // Root 管理员拥有所有权限
  if (user.role === 'root') return true
  
  // 检查企业管理员权限
  return user.permissions && user.permissions.includes(permission)
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  requireOrgAccess,
  hasPermission
}
