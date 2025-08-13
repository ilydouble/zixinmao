const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// 基本中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 测试路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 简单的登录测试路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  console.log('登录请求:', { username, password })
  
  if (username === 'root' && password === 'admin123456') {
    res.json({
      success: true,
      data: {
        token: 'test-token-123456',
        user: {
          id: 'root',
          username: 'root',
          role: 'root',
          permissions: ['*']
        }
      }
    })
  } else {
    res.status(401).json({
      success: false,
      error: '用户名或密码错误'
    })
  }
})

// 获取用户信息测试路由
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    })
  }
  
  res.json({
    success: true,
    data: {
      id: 'root',
      username: 'root',
      role: 'root',
      permissions: ['*']
    }
  })
})

// 系统统计测试路由
app.get('/api/system/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalOrganizations: 25,
      totalAdmins: 8,
      totalBalance: 125000.50,
      totalRecharge: 200000.00,
      totalConsumption: 75000.00,
      todayOperations: 45,
      verifiedUsers: 980
    }
  })
})

// 操作日志测试路由
app.get('/api/system/logs', (req, res) => {
  const { page = 1, pageSize = 20, adminRole, action, module } = req.query

  // 模拟日志数据
  const mockLogs = [
    {
      id: 'log_1',
      adminId: 'root',
      adminUsername: 'root',
      adminRole: 'root',
      action: 'login',
      module: 'auth',
      details: 'Root管理员登录系统',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      result: 'success',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log_2',
      adminId: 'root',
      adminUsername: 'root',
      adminRole: 'root',
      action: 'create_organization',
      module: 'organization',
      details: '创建企业: 测试科技有限公司',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      result: 'success',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'log_3',
      adminId: 'admin_1',
      adminUsername: 'testadmin',
      adminRole: 'company_admin',
      action: 'update_price',
      module: 'organization',
      details: '更新企业资信币价格为 1.5',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      result: 'success',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]

  // 简单筛选
  let filteredLogs = mockLogs
  if (adminRole) {
    filteredLogs = filteredLogs.filter(log => log.adminRole === adminRole)
  }
  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action === action)
  }
  if (module) {
    filteredLogs = filteredLogs.filter(log => log.module === module)
  }

  const total = filteredLogs.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + parseInt(pageSize)
  const logs = filteredLogs.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  })
})

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 测试服务器启动成功')
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`)
  console.log('')
  console.log('📝 测试账户:')
  console.log('   用户名: root')
  console.log('   密码: admin123456')
})

module.exports = app
