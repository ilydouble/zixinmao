const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const { db, getSystemConfig, setSystemConfig, logAdminAction } = require('../config/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

/**
 * 管理员登录
 */
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      })
    }

    const { username, password } = req.body
    const clientIP = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent') || ''

    let user = null

    if (username === 'root') {
      // Root 管理员登录
      const rootPassword = await getSystemConfig('root_password')
      
      if (!rootPassword) {
        return res.status(500).json({ error: 'Root 密码未初始化' })
      }

      const isValid = await bcrypt.compare(password, rootPassword)

      if (isValid) {
        user = {
          id: 'root',
          username: 'root',
          role: 'root',
          permissions: ['*']
        }
      }
    } else {
      // 企业管理员登录
      const adminQuery = await db.collection('company_admins')
        .where({ 
          username: username,
          status: 'active'
        })
        .get()

      if (adminQuery.data.length > 0) {
        const adminData = adminQuery.data[0]
        const isValid = await bcrypt.compare(password, adminData.password)

        if (isValid) {
          user = {
            id: adminData._id,
            username: adminData.username,
            role: 'company_admin',
            organizationId: adminData.organizationId,
            organizationName: adminData.organizationName,
            permissions: adminData.permissions || []
          }

          // 更新最后登录时间
          await db.collection('company_admins').doc(adminData._id).update({
            data: { lastLoginAt: new Date() }
          })
        }
      }
    }

    if (!user) {
      // 记录登录失败日志
      await logAdminAction({
        adminId: username,
        adminUsername: username,
        adminRole: 'unknown',
        action: 'login',
        module: 'auth',
        details: '登录失败：用户名或密码错误',
        ipAddress: clientIP,
        userAgent: userAgent,
        result: 'failed'
      })

      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        organizationId: user.organizationId 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    // 记录登录成功日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      organizationId: user.organizationId,
      action: 'login',
      module: 'auth',
      details: '管理员登录成功',
      ipAddress: clientIP,
      userAgent: userAgent,
      result: 'success'
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          permissions: user.permissions
        }
      }
    })

  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录服务异常' })
  }
})

/**
 * 获取当前用户信息
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = req.user

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

/**
 * 退出登录
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = req.user
    const clientIP = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent') || ''

    // 记录退出登录日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      organizationId: user.organizationId,
      action: 'logout',
      module: 'auth',
      details: '管理员退出登录',
      ipAddress: clientIP,
      userAgent: userAgent,
      result: 'success'
    })

    res.json({
      success: true,
      message: '退出登录成功'
    })
  } catch (error) {
    console.error('退出登录失败:', error)
    res.status(500).json({ error: '退出登录失败' })
  }
})

/**
 * 修改密码
 */
router.put('/password', [
  authenticate,
  body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
  body('newPassword').isLength({ min: 8 }).withMessage('新密码至少8位'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      })
    }

    const { currentPassword, newPassword } = req.body
    const user = req.user

    if (user.role === 'root') {
      // Root 管理员修改密码
      const rootPassword = await getSystemConfig('root_password')
      const isValid = await bcrypt.compare(currentPassword, rootPassword)

      if (!isValid) {
        return res.status(400).json({ error: '当前密码错误' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await setSystemConfig('root_password', hashedPassword, 'string', 'Root管理员密码', 'auth', 'root')

    } else {
      // 企业管理员修改密码
      const admin = await db.collection('company_admins').doc(user.id).get()
      
      if (!admin.data) {
        return res.status(404).json({ error: '管理员不存在' })
      }

      const isValid = await bcrypt.compare(currentPassword, admin.data.password)
      
      if (!isValid) {
        return res.status(400).json({ error: '当前密码错误' })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await db.collection('company_admins').doc(user.id).update({
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      })
    }

    // 记录密码修改日志
    await logAdminAction({
      adminId: user.id,
      adminUsername: user.username,
      adminRole: user.role,
      organizationId: user.organizationId,
      action: 'change_password',
      module: 'auth',
      details: '管理员修改密码',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      result: 'success'
    })

    res.json({
      success: true,
      message: '密码修改成功'
    })

  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

module.exports = router
