// membership.ts - 会员系统配置
// 注意：会员价格配置已迁移到云数据库 membership_config 集合
// 前端代码应通过 getMembershipConfig 云函数动态获取配置
// 以下配置仅作为后备方案使用

/**
 * 会员类型枚举
 */
export enum MembershipType {
  FREE = 'free',           // 免费用户
  BASIC = 'basic',         // 普通会员
  PREMIUM = 'premium'      // 高级会员
}

/**
 * 会员等级配置
 */
export interface MembershipLevel {
  type: MembershipType
  name: string
  icon: string
  color: string
  gradient: string
  description: string
  features: string[]
  prices: {
    monthly: number
    quarterly: number
    yearly: number
  }
}

/**
 * 会员配置（本地后备配置）
 * 实际价格请在云数据库 membership_config 集合中配置
 */
export const MEMBERSHIP_CONFIG: Record<MembershipType, MembershipLevel> = {
  [MembershipType.FREE]: {
    type: MembershipType.FREE,
    name: '免费用户',
    icon: '👤',
    color: '#999999',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: '体验基础功能',
    features: [
      '查看产品介绍',
      '联系客服咨询'
    ],
    prices: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    }
  },
  [MembershipType.BASIC]: {
    type: MembershipType.BASIC,
    name: '普通会员',
    icon: '⭐',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: '解锁简信宝功能',
    features: [
      '✅ 简信宝 - 简版征信分析',
      '✅ 无限次查询报告',
      '✅ 报告下载保存',
      '✅ 历史报告查看',
      '✅ 专属客服支持'
    ],
    prices: {
      monthly: 29.9,      // 月费
      quarterly: 79.9,    // 季费
      yearly: 299.9       // 年费
    }
  },
  [MembershipType.PREMIUM]: {
    type: MembershipType.PREMIUM,
    name: '高级会员',
    icon: '👑',
    color: '#faad14',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: '尊享全部功能',
    features: [
      '✅ 简信宝 - 简版征信分析',
      '✅ 流水宝 - 银行流水分析（开发中）',
      '✅ 专信宝 - 专业征信分析（开发中）',
      '✅ 无限次查询报告',
      '✅ 报告下载保存',
      '✅ 历史报告查看',
      '✅ AI 智能分析',
      '✅ 优先客服支持',
      '✅ 专属会员标识'
    ],
    prices: {
      monthly: 99.9,      // 月费
      quarterly: 269.9,   // 季费
      yearly: 999.9       // 年费
    }
  }
}

/**
 * 会员时长选项
 */
export interface DurationOption {
  key: 'monthly' | 'quarterly' | 'yearly'
  label: string
  months: number
  badge?: string
}

export const DURATION_OPTIONS: DurationOption[] = [
  {
    key: 'monthly',
    label: '1个月',
    months: 1
  },
  {
    key: 'quarterly',
    label: '3个月',
    months: 3,
    badge: '省10%'
  },
  {
    key: 'yearly',
    label: '12个月',
    months: 12,
    badge: '省20%'
  }
]

/**
 * 获取会员配置
 */
export function getMembershipConfig(type: MembershipType): MembershipLevel {
  return MEMBERSHIP_CONFIG[type]
}

/**
 * 获取会员价格
 */
export function getMembershipPrice(type: MembershipType, duration: 'monthly' | 'quarterly' | 'yearly'): number {
  return MEMBERSHIP_CONFIG[type].prices[duration]
}

/**
 * 检查会员是否有效
 */
export function isMembershipValid(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) > new Date()
}

/**
 * 检查是否有权限使用功能
 */
export function hasFeatureAccess(membershipType: MembershipType, feature: 'jianxin' | 'liushui' | 'zhuanxin'): boolean {
  if (membershipType === MembershipType.PREMIUM) {
    return true // 高级会员可以使用所有功能
  }
  if (membershipType === MembershipType.BASIC) {
    return feature === 'jianxin' // 普通会员只能使用简信宝
  }
  return false // 免费用户不能使用任何功能
}

/**
 * 格式化到期时间
 */
export function formatExpiryDate(expiryDate: string | null): string {
  if (!expiryDate) return '未开通'

  const expiry = new Date(expiryDate)
  const now = new Date()

  console.log('formatExpiryDate - 到期时间:', expiryDate)
  console.log('formatExpiryDate - 解析后的到期时间:', expiry)
  console.log('formatExpiryDate - 当前时间:', now)
  console.log('formatExpiryDate - 到期时间戳:', expiry.getTime())
  console.log('formatExpiryDate - 当前时间戳:', now.getTime())

  if (expiry <= now) {
    return '已过期'
  }

  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  console.log('formatExpiryDate - 剩余天数:', diffDays)

  if (diffDays <= 7) {
    return `剩余 ${diffDays} 天`
  }

  const year = expiry.getFullYear()
  const month = String(expiry.getMonth() + 1).padStart(2, '0')
  const day = String(expiry.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 计算新的到期时间
 */
export function calculateNewExpiryDate(currentExpiry: string | null, months: number): string {
  const now = new Date()
  const current = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now
  
  const newExpiry = new Date(current)
  newExpiry.setMonth(newExpiry.getMonth() + months)
  
  return newExpiry.toISOString()
}

