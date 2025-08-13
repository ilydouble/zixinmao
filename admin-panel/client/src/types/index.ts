// 用户相关类型
export interface User {
  id: string
  openid: string
  nickName: string
  avatarUrl: string
  realNameVerified: boolean
  realName: string
  phone: string
  balance: number
  totalRecharge: number
  totalConsumption: number
  memberLevel: string
  organizationId: string
  organizationName: string
  cityName: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

// 企业相关类型
export interface Organization {
  id: string
  name: string
  code: string
  type: string
  description: string
  legalPerson: string
  businessLicense: string
  contactPhone: string
  contactEmail: string
  address: string
  coinPrice: number
  status: string
  sort: number
  isDefault: boolean
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

// 管理员相关类型
export interface Admin {
  id: string
  username: string
  role: 'root' | 'company_admin'
  organizationId?: string
  organizationName?: string
  permissions: string[]
  status?: string
  createdAt?: string
  lastLoginAt?: string
}

// 登录相关类型
export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Admin
}

// 操作日志类型
export interface AdminLog {
  id: string
  adminId: string
  adminUsername: string
  adminRole: string
  organizationId?: string
  action: string
  module: string
  target?: string
  details: string
  ipAddress: string
  userAgent: string
  result: string
  createdAt: string
}

// 系统统计类型
export interface SystemStats {
  totalUsers?: number
  totalOrganizations?: number
  totalAdmins?: number
  todayOperations?: number
  verifiedUsers?: number
  todayNewUsers?: number
  totalBalance: number
  totalRecharge: number
  totalConsumption: number
  verificationRate?: string
}

// 分页类型
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// 列表响应类型
export interface ListResponse<T> {
  list?: T[]
  users?: T[]
  organizations?: T[]
  admins?: T[]
  logs?: T[]
  pagination: Pagination
}

// 表单验证规则类型
export interface FormRule {
  required?: boolean
  message: string
  trigger?: string | string[]
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (rule: any, value: any, callback: any) => void
}

// 菜单项类型
export interface MenuItem {
  path: string
  name: string
  title: string
  icon?: string
  children?: MenuItem[]
  meta?: {
    requiresAuth?: boolean
    roles?: string[]
    permissions?: string[]
  }
}

// 面包屑类型
export interface BreadcrumbItem {
  title: string
  path?: string
}
