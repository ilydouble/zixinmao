const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const organizationRoutes = require('./routes/organizations')
const adminRoutes = require('./routes/admins')
const systemRoutes = require('./routes/system')
const { testConnection } = require('./config/database')

const app = express()
const PORT = process.env.PORT || 3001

// 安全中间件
app.use(helmet())

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))

// 请求限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 100次请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
})
app.use('/api/', limiter)

// 解析 JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
}

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/system', systemRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 生产环境下，所有其他路由返回前端应用
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  })
})

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error)
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  })
})

// 启动服务器前测试数据库连接
async function startServer() {
  console.log('🔍 检查数据库连接...')
  
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.error('❌ 数据库连接失败，服务器启动中止')
    process.exit(1)
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 管理端服务器启动成功`)
    console.log(`📍 服务地址: http://localhost:${PORT}`)
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`)
  })
}

startServer()
