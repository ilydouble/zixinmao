# 资信猫管理系统

基于 Vue 3 + TypeScript + Element Plus + Express + 微信云开发的企业管理后台系统。

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 安装所有依赖（前端 + 后端）
npm run install:all

# 或者分别安装
npm install                    # 后端依赖
cd client && npm install      # 前端依赖
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 微信云开发配置
WECHAT_CLOUD_ENV=zixinmao-6gze9a8pef07503b

# Root 管理员配置
ROOT_USERNAME=root
ROOT_DEFAULT_PASSWORD=admin123456
```

### 数据库初始化

在小程序端运行数据库初始化：
1. 打开小程序
2. 进入个人中心
3. 点击"调试工具"按钮
4. 等待数据库初始化完成

### 启动服务

```bash
# 开发模式（同时启动前端和后端）
npm run dev

# 或者分别启动
npm run server:dev    # 启动后端服务 (端口 3001)
npm run client:dev    # 启动前端服务 (端口 3000)
```

### 访问系统

- 前端地址：http://localhost:3000
- 后端地址：http://localhost:3001
- API 文档：http://localhost:3001/api/health

### 默认账户

**Root 管理员：**
- 用户名：`root`
- 密码：`admin123456`

## 📁 项目结构

```
admin-panel/
├── server/                 # 后端服务
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/           # 路由
│   └── server.js         # 服务器入口
├── client/               # 前端应用
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── components/  # 组件
│   │   ├── layout/      # 布局
│   │   ├── router/      # 路由
│   │   ├── stores/      # 状态管理
│   │   ├── types/       # 类型定义
│   │   ├── utils/       # 工具函数
│   │   └── views/       # 页面
│   └── package.json
├── package.json          # 根配置
└── README.md
```

## 🔧 功能模块

### 认证系统
- [x] Root 管理员登录
- [x] 企业管理员登录
- [x] JWT Token 认证
- [x] 权限控制

### 用户管理
- [x] 用户列表查询
- [x] 用户详情查看
- [x] 用户统计数据
- [x] 搜索和筛选

### 企业管理
- [x] 企业列表管理
- [x] 企业详情查看
- [x] 资信币价格设置
- [x] 企业创建

### 管理员管理
- [x] 企业管理员 CRUD
- [x] 权限分配
- [x] 密码重置

### 系统管理
- [x] 操作日志查询
- [x] 系统统计数据
- [x] 数据库状态监控
- [x] 系统配置管理

## 🎨 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集
- **Element Plus** - Vue 3 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端
- **Vite** - 构建工具

### 后端
- **Express** - Node.js Web 框架
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **微信云开发** - 数据库和云函数

## 🔒 权限系统

### 角色类型
- **Root 管理员**：系统最高权限，可管理所有企业和管理员
- **企业管理员**：只能管理自己企业的用户和数据

### 权限列表
- `user_management` - 用户管理
- `price_setting` - 价格设置
- `data_statistics` - 数据统计

## 📝 开发指南

### 添加新页面
1. 在 `client/src/views/` 创建页面组件
2. 在 `client/src/router/index.ts` 添加路由配置
3. 设置相应的权限和角色要求

### 添加新 API
1. 在 `server/routes/` 创建路由文件
2. 在 `client/src/api/` 创建对应的 API 接口
3. 在 `client/src/types/` 添加类型定义

### 权限控制
```typescript
// 在路由中设置权限
{
  path: '/users',
  meta: {
    permissions: ['user_management'],  // 功能权限
    roles: ['root', 'company_admin']   // 角色权限
  }
}

// 在组件中检查权限
const authStore = useAuthStore()
const hasPermission = authStore.hasPermission('user_management')
```

## 🚀 部署

### 生产环境构建
```bash
npm run build
```

### 环境变量
生产环境需要设置以下环境变量：
- `NODE_ENV=production`
- `JWT_SECRET` - 生产环境密钥
- `WECHAT_CLOUD_ENV` - 云开发环境ID

## 📞 支持

如有问题，请联系开发团队或查看项目文档。
