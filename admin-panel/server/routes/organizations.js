const express = require('express')
const { body, query, param, validationResult } = require('express-validator')
const { db, logAdminAction } = require('../config/database')
const { authenticate, requireRole, requirePermission } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(authenticate)

/**
 * 获取企业列表 (仅Root管理员)
 */
router.get('/', [
  requireRole(['root']),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'disabled', 'pending']),
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
    const status = req.query.status || 'active'
    const skip = (page - 1) * pageSize

    // 获取企业列表
    const orgsQuery = await db.collection('organizations')
      .where({ status })
      .orderBy('sort', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('organizations')
      .where({ status })
      .count()

    // 格式化企业数据
    const organizations = orgsQuery.data.map(org => ({
      id: org._id,
      name: org.name,
      code: org.code,
      type: org.type,
      description: org.description,
      legalPerson: org.legalPerson || '',
      businessLicense: org.businessLicense || '',
      contactPhone: org.contactPhone || '',
      contactEmail: org.contactEmail || '',
      address: org.address || '',
      coinPrice: org.coinPrice || 0,
      status: org.status,
      sort: org.sort,
      isDefault: org.isDefault || false,
      createdAt: org.createdAt,
      approvedAt: org.approvedAt,
      approvedBy: org.approvedBy
    }))

    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          page,
          pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize)
        }
      }
    })

  } catch (error) {
    console.error('获取企业列表失败:', error)
    res.status(500).json({ error: '获取企业列表失败' })
  }
})

/**
 * 获取企业详情
 */
router.get('/:id', [
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

    const orgId = req.params.id
    const user = req.user

    // 企业管理员只能查看自己的企业
    if (user.role === 'company_admin' && user.organizationId !== orgId) {
      return res.status(403).json({ error: '无权访问该企业信息' })
    }

    // 获取企业信息
    const orgQuery = await db.collection('organizations').doc(orgId).get()
    
    if (!orgQuery.data) {
      return res.status(404).json({ error: '企业不存在' })
    }

    const orgData = orgQuery.data

    // 获取企业用户统计
    const userStats = await db.collection('users')
      .where({ organizationId: orgId, status: 'active' })
      .get()

    const totalUsers = userStats.data.length
    const verifiedUsers = userStats.data.filter(u => u.realNameVerified).length
    const totalBalance = userStats.data.reduce((sum, u) => sum + (u.balance || 0), 0)
    const totalRecharge = userStats.data.reduce((sum, u) => sum + (u.totalRecharge || 0), 0)
    const totalConsumption = userStats.data.reduce((sum, u) => sum + (u.totalConsumption || 0), 0)

    // 获取企业管理员列表
    const adminsQuery = await db.collection('company_admins')
      .where({ organizationId: orgId, status: 'active' })
      .get()

    const admins = adminsQuery.data.map(admin => ({
      id: admin._id,
      username: admin.username,
      permissions: admin.permissions,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt
    }))

    res.json({
      success: true,
      data: {
        organization: {
          id: orgData._id,
          name: orgData.name,
          code: orgData.code,
          type: orgData.type,
          description: orgData.description,
          legalPerson: orgData.legalPerson || '',
          businessLicense: orgData.businessLicense || '',
          contactPhone: orgData.contactPhone || '',
          contactEmail: orgData.contactEmail || '',
          address: orgData.address || '',
          coinPrice: orgData.coinPrice || 0,
          status: orgData.status,
          sort: orgData.sort,
          isDefault: orgData.isDefault || false,
          createdAt: orgData.createdAt,
          approvedAt: orgData.approvedAt,
          approvedBy: orgData.approvedBy
        },
        stats: {
          totalUsers,
          verifiedUsers,
          totalBalance,
          totalRecharge,
          totalConsumption,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
        },
        admins
      }
    })

  } catch (error) {
    console.error('获取企业详情失败:', error)
    res.status(500).json({ error: '获取企业详情失败' })
  }
})

/**
 * 更新企业资信币价格
 */
router.put('/:id/price', [
  param('id').isString(),
  body('coinPrice').isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const orgId = req.params.id
    const { coinPrice } = req.body
    const user = req.user

    // 权限检查
    if (user.role === 'company_admin') {
      // 企业管理员只能修改自己企业的价格
      if (user.organizationId !== orgId) {
        return res.status(403).json({ error: '无权修改该企业价格' })
      }
      
      // 检查是否有价格设置权限
      if (!user.permissions.includes('price_setting')) {
        return res.status(403).json({ error: '无价格设置权限' })
      }
    }

    // 更新企业价格
    const updateResult = await db.collection('organizations').doc(orgId).update({
      data: {
        coinPrice: coinPrice,
        updatedAt: new Date()
      }
    })

    if (updateResult.stats.updated === 0) {
      return res.status(404).json({ error: '企业不存在' })
    }

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      organizationId: orgId,
      action: 'update_price',
      module: 'organization',
      target: orgId,
      details: `更新企业资信币价格为 ${coinPrice}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '价格更新成功',
      data: {
        organizationId: orgId,
        newPrice: coinPrice
      }
    })

  } catch (error) {
    console.error('更新企业价格失败:', error)
    res.status(500).json({ error: '更新企业价格失败' })
  }
})

/**
 * 创建企业 (仅Root管理员)
 */
router.post('/', [
  requireRole(['root']),
  body('name').notEmpty().withMessage('企业名称不能为空'),
  body('code').notEmpty().withMessage('企业代码不能为空'),
  body('description').optional().isString(),
  body('legalPerson').optional().isString(),
  body('businessLicense').optional().isString(),
  body('contactPhone').optional().isString(),
  body('contactEmail').optional().isEmail().withMessage('邮箱格式不正确'),
  body('address').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '参数验证失败',
        details: errors.array()
      })
    }

    const {
      name,
      code,
      description = '',
      legalPerson = '',
      businessLicense = '',
      contactPhone = '',
      contactEmail = '',
      address = ''
    } = req.body

    const user = req.user

    // 检查企业代码是否已存在
    const existingOrg = await db.collection('organizations')
      .where({ code })
      .get()

    if (existingOrg.data.length > 0) {
      return res.status(400).json({ error: '企业代码已存在' })
    }

    // 获取最大排序号
    const maxSortQuery = await db.collection('organizations')
      .orderBy('sort', 'desc')
      .limit(1)
      .get()

    const maxSort = maxSortQuery.data.length > 0 ? maxSortQuery.data[0].sort : 0

    // 创建企业
    const newOrg = {
      name,
      code,
      type: 'company',
      description,
      legalPerson,
      businessLicense,
      contactPhone,
      contactEmail,
      address,
      adminUsers: [],
      coinPrice: 0,
      status: 'active',
      sort: maxSort + 1,
      isDefault: false,
      createdAt: new Date(),
      approvedAt: new Date(),
      approvedBy: user.username
    }

    const createResult = await db.collection('organizations').add({
      data: newOrg
    })

    // 记录操作日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      action: 'create_organization',
      module: 'organization',
      target: createResult._id,
      details: `创建企业: ${name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '企业创建成功',
      data: {
        id: createResult._id,
        ...newOrg
      }
    })

  } catch (error) {
    console.error('创建企业失败:', error)
    res.status(500).json({ error: '创建企业失败' })
  }
})

module.exports = router
