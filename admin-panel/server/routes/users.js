const express = require('express')
const { query, param, validationResult } = require('express-validator')
const { db, logAdminAction } = require('../config/database')
const { authenticate, requirePermission, requireOrgAccess } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取用户列表
 */
router.get('/', [
  requirePermission('user_management'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('organizationId').optional().isString(),
  query('search').optional().isString(),
  query('status').optional().isIn(['active', 'disabled']),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const user = req.user
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const search = req.query.search || ''
    const status = req.query.status || 'active'
    
    // 确定查询的企业ID
    let organizationId = req.query.organizationId
    if (user.role === 'company_admin') {
      organizationId = user.organizationId // 企业管理员只能查看自己企业的用户
    }

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const whereCondition = { status }
    
    if (organizationId) {
      whereCondition.organizationId = organizationId
    }

    // 如果有搜索条件，需要分别查询
    let userQuery
    if (search) {
      // 搜索用户名或手机号
      const searchResults = await Promise.all([
        db.collection('users').where({
          ...whereCondition,
          nickName: db.RegExp({
            regexp: search,
            options: 'i'
          })
        }).get(),
        db.collection('users').where({
          ...whereCondition,
          phone: db.RegExp({
            regexp: search,
            options: 'i'
          })
        }).get(),
        db.collection('users').where({
          ...whereCondition,
          realName: db.RegExp({
            regexp: search,
            options: 'i'
          })
        }).get()
      ])

      // 合并去重
      const allUsers = []
      const userIds = new Set()
      
      searchResults.forEach(result => {
        result.data.forEach(user => {
          if (!userIds.has(user._id)) {
            userIds.add(user._id)
            allUsers.push(user)
          }
        })
      })

      userQuery = { data: allUsers }
    } else {
      userQuery = await db.collection('users')
        .where(whereCondition)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()
    }

    // 获取总数
    const countResult = await db.collection('users')
      .where(whereCondition)
      .count()

    // 格式化用户数据
    const users = userQuery.data.map(user => ({
      id: user._id,
      openid: user.openid,
      nickName: user.nickName || '',
      avatarUrl: user.avatarUrl || '',
      realNameVerified: user.realNameVerified || false,
      realName: user.realName || '',
      phone: user.phone || '',
      balance: user.balance || 0,
      totalRecharge: user.totalRecharge || 0,
      totalConsumption: user.totalConsumption || 0,
      memberLevel: user.memberLevel || 'basic',
      organizationId: user.organizationId || '',
      organizationName: user.organizationName || '',
      cityName: user.cityName || '',
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }))

    // 如果是搜索结果，需要手动分页
    if (search) {
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedUsers = users.slice(startIndex, endIndex)
      
      res.json({
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            page,
            pageSize,
            total: users.length,
            totalPages: Math.ceil(users.length / pageSize)
          }
        }
      })
    } else {
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            pageSize,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / pageSize)
          }
        }
      })
    }

  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

/**
 * 获取用户详情
 */
router.get('/:id', [
  requirePermission('user_management'),
  param('id').isString().withMessage('用户ID无效'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const userId = req.params.id
    const user = req.user

    // 获取用户信息
    const userQuery = await db.collection('users').doc(userId).get()
    
    if (!userQuery.data) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const userData = userQuery.data

    // 企业管理员权限检查
    if (user.role === 'company_admin' && userData.organizationId !== user.organizationId) {
      return res.status(403).json({ error: '无权访问该用户信息' })
    }

    // 获取用户的充值记录
    const rechargeQuery = await db.collection('recharge_records')
      .where({ userId: userData.openid })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    // 获取用户的消费记录
    const ordersQuery = await db.collection('orders')
      .where({ userId: userData.openid })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    res.json({
      success: true,
      data: {
        user: {
          id: userData._id,
          openid: userData.openid,
          nickName: userData.nickName || '',
          avatarUrl: userData.avatarUrl || '',
          realNameVerified: userData.realNameVerified || false,
          realName: userData.realName || '',
          phone: userData.phone || '',
          balance: userData.balance || 0,
          totalRecharge: userData.totalRecharge || 0,
          totalConsumption: userData.totalConsumption || 0,
          memberLevel: userData.memberLevel || 'basic',
          organizationId: userData.organizationId || '',
          organizationName: userData.organizationName || '',
          cityName: userData.cityName || '',
          status: userData.status,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt
        },
        rechargeRecords: rechargeQuery.data.map(record => ({
          id: record._id,
          amount: record.amount,
          status: record.status,
          createdAt: record.createdAt
        })),
        orders: ordersQuery.data.map(order => ({
          id: order._id,
          productName: order.productName,
          amount: order.amount,
          status: order.status,
          createdAt: order.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('获取用户详情失败:', error)
    res.status(500).json({ error: '获取用户详情失败' })
  }
})

/**
 * 获取用户统计数据
 */
router.get('/stats/overview', [
  requirePermission('data_statistics'),
], async (req, res) => {
  try {
    const user = req.user
    
    // 构建查询条件
    const whereCondition = { status: 'active' }
    if (user.role === 'company_admin') {
      whereCondition.organizationId = user.organizationId
    }

    // 获取用户总数
    const totalUsersResult = await db.collection('users')
      .where(whereCondition)
      .count()

    // 获取实名认证用户数
    const verifiedUsersResult = await db.collection('users')
      .where({
        ...whereCondition,
        realNameVerified: true
      })
      .count()

    // 获取今日新增用户数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayUsersResult = await db.collection('users')
      .where({
        ...whereCondition,
        createdAt: db.command.gte(today)
      })
      .count()

    // 获取用户余额统计
    const usersWithBalance = await db.collection('users')
      .where(whereCondition)
      .get()

    const totalBalance = usersWithBalance.data.reduce((sum, user) => sum + (user.balance || 0), 0)
    const totalRecharge = usersWithBalance.data.reduce((sum, user) => sum + (user.totalRecharge || 0), 0)
    const totalConsumption = usersWithBalance.data.reduce((sum, user) => sum + (user.totalConsumption || 0), 0)

    res.json({
      success: true,
      data: {
        totalUsers: totalUsersResult.total,
        verifiedUsers: verifiedUsersResult.total,
        todayNewUsers: todayUsersResult.total,
        totalBalance: totalBalance,
        totalRecharge: totalRecharge,
        totalConsumption: totalConsumption,
        verificationRate: totalUsersResult.total > 0 
          ? (verifiedUsersResult.total / totalUsersResult.total * 100).toFixed(2)
          : 0
      }
    })

  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({ error: '获取用户统计失败' })
  }
})

module.exports = router
