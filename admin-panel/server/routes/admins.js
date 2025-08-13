const express = require('express')
const bcrypt = require('bcryptjs')
const { body, query, param, validationResult } = require('express-validator')
const { db, logAdminAction } = require('../config/database')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取企业管理员列表 (仅Root管理员)
 */
router.get('/', [
  requireRole(['root']),
  query('organizationId').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const organizationId = req.query.organizationId
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const whereCondition = {}
    if (organizationId) {
      whereCondition.organizationId = organizationId
    }

    // 获取管理员列表
    const adminsQuery = await db.collection('company_admins')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('company_admins')
      .where(whereCondition)
      .count()

    // 格式化管理员数据
    const admins = adminsQuery.data.map(admin => ({
      id: admin._id,
      username: admin.username,
      organizationId: admin.organizationId,
      organizationName: admin.organizationName,
      permissions: admin.permissions || [],
      status: admin.status,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt
    }))

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          page,
          pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    })

  } catch (error) {
    console.error('获取管理员列表失败:', error)
    res.status(500).json({ error: '获取管理员列表失败' })
  }
})

/**
 * 创建企业管理员 (仅Root管理员)
 */
router.post('/', [
  requireRole(['root']),
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 8 }).withMessage('密码至少8位'),
  body('organizationId').notEmpty().withMessage('企业ID不能为空'),
  body('permissions').isArray().withMessage('权限必须是数组'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const { username, password, organizationId, permissions } = req.body
    const user = req.user

    // 检查用户名是否已存在
    const existingAdmin = await db.collection('company_admins')
      .where({ username })
      .get()

    if (existingAdmin.data.length > 0) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    // 检查企业是否存在
    const orgQuery = await db.collection('organizations').doc(organizationId).get()
    if (!orgQuery.data) {
      return res.status(400).json({ error: '企业不存在' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建管理员
    const newAdmin = {
      username,
      password: hashedPassword,
      organizationId,
      organizationName: orgQuery.data.name,
      permissions: permissions || ['user_management', 'data_statistics'],
      status: 'active',
      createdAt: new Date(),
      lastLoginAt: null
    }

    const createResult = await db.collection('company_admins').add({
      data: newAdmin
    })

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      action: 'create_admin',
      module: 'admin',
      target: createResult._id,
      details: `创建企业管理员: ${username}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '管理员创建成功',
      data: {
        id: createResult._id,
        username: newAdmin.username,
        organizationId: newAdmin.organizationId,
        organizationName: newAdmin.organizationName,
        permissions: newAdmin.permissions,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt
      }
    })

  } catch (error) {
    console.error('创建管理员失败:', error)
    res.status(500).json({ error: '创建管理员失败' })
  }
})

/**
 * 更新企业管理员 (仅Root管理员)
 */
router.put('/:id', [
  requireRole(['root']),
  param('id').isString(),
  body('permissions').optional().isArray(),
  body('status').optional().isIn(['active', 'disabled']),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const adminId = req.params.id
    const { permissions, status } = req.body
    const user = req.user

    // 检查管理员是否存在
    const adminQuery = await db.collection('company_admins').doc(adminId).get()
    if (!adminQuery.data) {
      return res.status(404).json({ error: '管理员不存在' })
    }

    // 构建更新数据
    const updateData = { updatedAt: new Date() }
    if (permissions !== undefined) {
      updateData.permissions = permissions
    }
    if (status !== undefined) {
      updateData.status = status
    }

    // 更新管理员
    await db.collection('company_admins').doc(adminId).update({
      data: updateData
    })

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      action: 'update_admin',
      module: 'admin',
      target: adminId,
      details: `更新企业管理员: ${adminQuery.data.username}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '管理员更新成功'
    })

  } catch (error) {
    console.error('更新管理员失败:', error)
    res.status(500).json({ error: '更新管理员失败' })
  }
})

/**
 * 重置管理员密码 (仅Root管理员)
 */
router.post('/:id/reset-password', [
  requireRole(['root']),
  param('id').isString(),
  body('newPassword').isLength({ min: 8 }).withMessage('新密码至少8位'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const adminId = req.params.id
    const { newPassword } = req.body
    const user = req.user

    // 检查管理员是否存在
    const adminQuery = await db.collection('company_admins').doc(adminId).get()
    if (!adminQuery.data) {
      return res.status(404).json({ error: '管理员不存在' })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await db.collection('company_admins').doc(adminId).update({
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      action: 'reset_password',
      module: 'admin',
      target: adminId,
      details: `重置管理员密码: ${adminQuery.data.username}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '密码重置成功'
    })

  } catch (error) {
    console.error('重置密码失败:', error)
    res.status(500).json({ error: '重置密码失败' })
  }
})

/**
 * 删除企业管理员 (仅Root管理员)
 */
router.delete('/:id', [
  requireRole(['root']),
  param('id').isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const adminId = req.params.id
    const user = req.user

    // 检查管理员是否存在
    const adminQuery = await db.collection('company_admins').doc(adminId).get()
    if (!adminQuery.data) {
      return res.status(404).json({ error: '管理员不存在' })
    }

    // 删除管理员
    await db.collection('company_admins').doc(adminId).remove()

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      action: 'delete_admin',
      module: 'admin',
      target: adminId,
      details: `删除企业管理员: ${adminQuery.data.username}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '管理员删除成功'
    })

  } catch (error) {
    console.error('删除管理员失败:', error)
    res.status(500).json({ error: '删除管理员失败' })
  }
})

module.exports = router
