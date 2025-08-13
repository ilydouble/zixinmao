const express = require('express')
const { query, validationResult } = require('express-validator')
const { db, logAdminAction } = require('../config/database')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取操作日志 (仅Root管理员)
 */
router.get('/logs', [
  requireRole(['root']),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('adminRole').optional().custom((value) => {
    if (value === '' || value === undefined || value === null) return true
    return ['root', 'company_admin'].includes(value)
  }),
  query('action').optional().isString(),
  query('module').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const adminRole = req.query.adminRole
    const action = req.query.action
    const module = req.query.module
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const whereCondition = {}
    if (adminRole) {
      whereCondition.adminRole = adminRole
    }
    if (action) {
      whereCondition.action = action
    }
    if (module) {
      whereCondition.module = module
    }

    // 获取日志列表
    const logsQuery = await db.collection('admin_logs')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('admin_logs')
      .where(whereCondition)
      .count()

    // 格式化日志数据
    const logs = logsQuery.data.map(log => ({
      id: log._id,
      adminId: log.adminId,
      adminUsername: log.adminUsername,
      adminRole: log.adminRole,
      organizationId: log.organizationId,
      action: log.action,
      module: log.module,
      target: log.target,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      result: log.result,
      createdAt: log.createdAt
    }))

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    })

  } catch (error) {
    console.error('获取操作日志失败:', error)
    res.status(500).json({ error: '获取操作日志失败' })
  }
})

/**
 * 获取系统统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const user = req.user

    // 根据角色获取不同的统计数据
    if (user.role === 'root') {
      // Root 管理员 - 全系统统计
      const [
        totalUsersResult,
        totalOrgsResult,
        totalAdminsResult,
        todayLogsResult
      ] = await Promise.all([
        db.collection('users').where({ status: 'active' }).count(),
        db.collection('organizations').where({ status: 'active' }).count(),
        db.collection('company_admins').where({ status: 'active' }).count(),
        db.collection('admin_logs').where({
          createdAt: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0)))
        }).count()
      ])

      // 获取用户余额统计
      const allUsers = await db.collection('users')
        .where({ status: 'active' })
        .get()

      const totalBalance = allUsers.data.reduce((sum, user) => sum + (user.balance || 0), 0)
      const totalRecharge = allUsers.data.reduce((sum, user) => sum + (user.totalRecharge || 0), 0)
      const totalConsumption = allUsers.data.reduce((sum, user) => sum + (user.totalConsumption || 0), 0)

      res.json({
        success: true,
        data: {
          totalUsers: totalUsersResult.total,
          totalOrganizations: totalOrgsResult.total,
          totalAdmins: totalAdminsResult.total,
          todayOperations: todayLogsResult.total,
          totalBalance,
          totalRecharge,
          totalConsumption
        }
      })

    } else {
      // 企业管理员 - 本企业统计
      const orgUsers = await db.collection('users')
        .where({ 
          organizationId: user.organizationId,
          status: 'active'
        })
        .get()

      const totalUsers = orgUsers.data.length
      const verifiedUsers = orgUsers.data.filter(u => u.realNameVerified).length
      const totalBalance = orgUsers.data.reduce((sum, u) => sum + (u.balance || 0), 0)
      const totalRecharge = orgUsers.data.reduce((sum, u) => sum + (u.totalRecharge || 0), 0)
      const totalConsumption = orgUsers.data.reduce((sum, u) => sum + (u.totalConsumption || 0), 0)

      // 今日新增用户
      const todayUsers = await db.collection('users')
        .where({
          organizationId: user.organizationId,
          status: 'active',
          createdAt: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0)))
        })
        .count()

      res.json({
        success: true,
        data: {
          totalUsers,
          verifiedUsers,
          todayNewUsers: todayUsers.total,
          totalBalance,
          totalRecharge,
          totalConsumption,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
        }
      })
    }

  } catch (error) {
    console.error('获取系统统计失败:', error)
    res.status(500).json({ error: '获取系统统计失败' })
  }
})

/**
 * 获取系统配置 (仅Root管理员)
 */
router.get('/config', [
  requireRole(['root']),
], async (req, res) => {
  try {
    // 获取所有系统配置
    const configQuery = await db.collection('system_config').get()

    const configs = configQuery.data.map(config => ({
      id: config._id,
      key: config.key,
      value: config.key === 'root_password' ? '******' : config.value, // 隐藏密码
      type: config.type,
      description: config.description,
      category: config.category,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt
    }))

    res.json({
      success: true,
      data: configs
    })

  } catch (error) {
    console.error('获取系统配置失败:', error)
    res.status(500).json({ error: '获取系统配置失败' })
  }
})

/**
 * 获取数据库状态
 */
router.get('/database/status', async (req, res) => {
  try {
    // 获取各个集合的数据量
    const [
      usersCount,
      orgsCount,
      adminsCount,
      logsCount,
      rechargeCount,
      ordersCount
    ] = await Promise.all([
      db.collection('users').count(),
      db.collection('organizations').count(),
      db.collection('company_admins').count(),
      db.collection('admin_logs').count(),
      db.collection('recharge_records').count(),
      db.collection('orders').count()
    ])

    res.json({
      success: true,
      data: {
        collections: {
          users: usersCount.total,
          organizations: orgsCount.total,
          company_admins: adminsCount.total,
          admin_logs: logsCount.total,
          recharge_records: rechargeCount.total,
          orders: ordersCount.total
        },
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取数据库状态失败:', error)
    res.status(500).json({ 
      error: '获取数据库状态失败',
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    })
  }
})

module.exports = router
