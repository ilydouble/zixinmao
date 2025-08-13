const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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

// 模拟数据存储
const mockData = {
  // Root 管理员密码（已加密）
  rootPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123456
  
  // 模拟用户数据
  users: [
    {
      id: '1',
      openid: 'mock_openid_1',
      nickName: '张三',
      avatarUrl: '',
      realNameVerified: true,
      realName: '张三',
      phone: '13800138001',
      balance: 150.50,
      totalRecharge: 500.00,
      totalConsumption: 349.50,
      memberLevel: 'basic',
      organizationId: 'org_1',
      organizationName: '测试科技有限公司',
      cityName: '北京市',
      status: 'active',
      createdAt: '2024-01-01T10:00:00Z',
      lastLoginAt: '2024-01-15T09:30:00Z'
    },
    {
      id: '2',
      openid: 'mock_openid_2',
      nickName: '李四',
      avatarUrl: '',
      realNameVerified: false,
      realName: '',
      phone: '13800138002',
      balance: 89.20,
      totalRecharge: 200.00,
      totalConsumption: 110.80,
      memberLevel: 'basic',
      organizationId: 'org_1',
      organizationName: '测试科技有限公司',
      cityName: '上海市',
      status: 'active',
      createdAt: '2024-01-02T14:20:00Z',
      lastLoginAt: '2024-01-14T16:45:00Z'
    }
  ],
  
  // 模拟企业数据
  organizations: [
    {
      id: 'org_1',
      name: '测试科技有限公司',
      code: 'TEST001',
      type: 'company',
      description: '这是一个测试企业',
      legalPerson: '王总',
      businessLicense: '91110000000000000X',
      contactPhone: '010-12345678',
      contactEmail: 'contact@test.com',
      address: '北京市朝阳区测试大厦',
      coinPrice: 1.0,
      status: 'active',
      sort: 1,
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],
  
  // 模拟管理员数据
  admins: [
    {
      id: 'admin_1',
      username: 'testadmin',
      organizationId: 'org_1',
      organizationName: '测试科技有限公司',
      permissions: ['user_management', 'data_statistics'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T08:00:00Z'
    }
  ],
  
  // 模拟操作日志
  logs: [
    {
      id: 'log_1',
      adminId: 'root',
      adminUsername: 'root',
      adminRole: 'root',
      action: 'login',
      module: 'auth',
      details: 'Root管理员登录系统',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0...',
      result: 'success',
      createdAt: new Date().toISOString()
    }
  ]
}

// 认证中间件
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret')
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, error: '认证令牌无效' })
  }
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '简化服务器运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    console.log('登录请求:', { username })
    
    let user = null
    
    if (username === 'root') {
      // Root 管理员登录
      const isValid = await bcrypt.compare(password, mockData.rootPassword)
      
      if (isValid) {
        user = {
          id: 'root',
          username: 'root',
          role: 'root',
          permissions: ['*']
        }
      }
    } else {
      // 企业管理员登录（简化验证）
      const admin = mockData.admins.find(a => a.username === username)
      if (admin && password === 'admin123456') {
        user = {
          id: admin.id,
          username: admin.username,
          role: 'company_admin',
          organizationId: admin.organizationId,
          organizationName: admin.organizationName,
          permissions: admin.permissions
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
    }
    
    // 生成 JWT Token
    const token = jwt.sign(user, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '24h'
    })
    
    res.json({
      success: true,
      data: {
        token,
        user
      }
    })
    
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      error: '登录服务异常'
    })
  }
})

// 获取用户信息
app.get('/api/auth/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    data: req.user
  })
})

// 退出登录
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: '退出登录成功'
  })
})

// 修改密码
app.put('/api/auth/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    // 简化验证
    if (currentPassword === 'admin123456') {
      res.json({
        success: true,
        message: '密码修改成功'
      })
    } else {
      res.status(400).json({
        success: false,
        error: '当前密码错误'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '修改密码失败'
    })
  }
})

// 获取用户列表
app.get('/api/users', authenticate, (req, res) => {
  const { page = 1, pageSize = 20, search = '', organizationId } = req.query
  
  let filteredUsers = mockData.users
  
  // 企业管理员只能看自己企业的用户
  if (req.user.role === 'company_admin') {
    filteredUsers = filteredUsers.filter(u => u.organizationId === req.user.organizationId)
  } else if (organizationId) {
    filteredUsers = filteredUsers.filter(u => u.organizationId === organizationId)
  }
  
  // 搜索过滤
  if (search) {
    filteredUsers = filteredUsers.filter(u => 
      u.nickName.includes(search) || 
      u.phone.includes(search) || 
      u.realName.includes(search)
    )
  }
  
  const total = filteredUsers.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + parseInt(pageSize)
  const users = filteredUsers.slice(startIndex, endIndex)
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
})

// 获取用户详情
app.get('/api/users/:id', authenticate, (req, res) => {
  const user = mockData.users.find(u => u.id === req.params.id)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    })
  }
  
  // 权限检查
  if (req.user.role === 'company_admin' && user.organizationId !== req.user.organizationId) {
    return res.status(403).json({
      success: false,
      error: '无权访问该用户信息'
    })
  }
  
  res.json({
    success: true,
    data: {
      user,
      rechargeRecords: [
        {
          id: '1',
          amount: 100.00,
          status: 'completed',
          createdAt: '2024-01-10T10:00:00Z'
        }
      ],
      orders: [
        {
          id: '1',
          productName: '简信宝查询',
          amount: 15.00,
          status: 'completed',
          createdAt: '2024-01-12T14:30:00Z'
        }
      ]
    }
  })
})

// 获取系统统计
app.get('/api/system/stats', authenticate, (req, res) => {
  if (req.user.role === 'root') {
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
  } else {
    res.json({
      success: true,
      data: {
        totalUsers: 150,
        verifiedUsers: 120,
        todayNewUsers: 5,
        totalBalance: 15000.50,
        totalRecharge: 25000.00,
        totalConsumption: 9999.50,
        verificationRate: '80.00'
      }
    })
  }
})

// 其他接口...
app.get('/api/organizations', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      organizations: mockData.organizations,
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
    }
  })
})

app.get('/api/system/logs', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      logs: mockData.logs,
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
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
  console.log('🚀 简化管理端服务器启动成功')
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`)
  console.log('')
  console.log('📝 测试账户:')
  console.log('   Root管理员: root / admin123456')
  console.log('   企业管理员: testadmin / admin123456')
  console.log('')
  console.log('✨ 这是一个简化版本，包含完整的模拟数据')
})

module.exports = app
