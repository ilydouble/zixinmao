// 认证相关工具函数
// 直接调用云函数，不包含状态管理

// 常量定义
const USER_INFO_KEY = 'userInfo'

// 订单统计接口
interface OrderStats {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalRecharge: number
  totalConsumption: number
}

// 最近订单接口
interface RecentOrder {
  id: string
  type: string
  productName: string
  amount: number
  status: string
  createdAt: string
}

// 用户信息接口
interface UserInfo {
  openid: string
  nickName?: string
  avatarUrl?: string
  gender?: number
  country?: string
  province?: string
  city?: string
  language?: string
  realNameVerified?: boolean
  realName?: string
  phone?: string
  balance?: number
  totalRecharge?: number
  totalConsumption?: number
  memberLevel?: string
  memberExpireTime?: string | null
  organizationId?: string
  organizationName?: string
  cityCode?: string
  cityName?: string
  createdAt?: string
  lastLoginAt?: string
  updatedAt?: string
  orderStats?: OrderStats
  recentOrders?: RecentOrder[]
  [key: string]: any
}

// 云函数响应接口
interface CloudResponse<T = any> {
  success: boolean
  message?: string
  userInfo?: T
  data?: T
  isNewUser?: boolean
  error?: string
}

// App 实例接口
interface AppInstance {
  globalData: {
    userInfo: UserInfo | null
    isLoggedIn: boolean
    currentOrg: any
  }
}

/**
 * 调用云函数
 */
export async function callCloudFunction<T = any>(name: string, data: any = {}): Promise<CloudResponse<T>> {
  try {
    const result = await wx.cloud.callFunction({
      name,
      data
    })
    return result.result as CloudResponse<T>
  } catch (error: any) {
    console.error(`云函数 ${name} 调用失败:`, error)
    throw new Error(error.message || `${name} 调用失败`)
  }
}

/**
 * 更新全局用户状态
 */
function updateGlobalUserState(userInfo: UserInfo | null, isLoggedIn: boolean) {
  try {
    const app = getApp() as AppInstance
    app.globalData.userInfo = userInfo
    app.globalData.isLoggedIn = isLoggedIn
    
    // 保存到本地存储
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
    } else {
      wx.removeStorageSync('userInfo')
    }
  } catch (error) {
    console.error('更新全局状态失败:', error)
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): UserInfo | null {
  try {
    const userInfo = wx.getStorageSync(USER_INFO_KEY)
    
    return userInfo || null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  try {
    const app = getApp() as AppInstance
    return app.globalData.isLoggedIn && !!app.globalData.userInfo?.openid
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}

/**
 * 检查是否需要实名认证
 */
export function needRealNameAuth(): boolean {
  const userInfo = getCurrentUser()
  return !userInfo || !userInfo.realNameVerified
}

/**
 * 用户登录
 */
export async function login(): Promise<UserInfo> {
  const response = await callCloudFunction<UserInfo>('login')
  
  if (response.success && response.userInfo) {
    updateGlobalUserState(response.userInfo, true)
    
    if (response.isNewUser) {
      wx.showToast({
        title: '欢迎使用资信猫！',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    }
    
    return response.userInfo
  }
  
  throw new Error(response.message || '登录失败')
}

/**
 * 更新用户信息
 */
export async function updateUserInfo(userInfo: Partial<UserInfo>): Promise<UserInfo> {
  const response = await callCloudFunction<UserInfo>('updateUserInfo', { userInfo })
  
  if (response.success && response.userInfo) {
    updateGlobalUserState(response.userInfo, true)
    wx.showToast({
      title: '更新成功',
      icon: 'success'
    })
    return response.userInfo
  }
  
  throw new Error(response.message || '更新失败')
}

/**
 * 实名认证
 */
export async function realNameAuth(realName: string, idCard: string, phone: string): Promise<boolean> {
  const response = await callCloudFunction('realNameAuth', { realName, idCard, phone })
  
  if (response.success) {
    // 重新获取用户信息
    await refreshUserInfo()
    wx.showToast({
      title: response.message || '认证成功',
      icon: 'success'
    })
    return true
  }
  
  throw new Error(response.message || '认证失败')
}

/**
 * 刷新用户信息（从云端获取最新数据）
 */
export async function refreshUserInfo(): Promise<UserInfo | null> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'getUserInfo'
    })

    console.log('云函数返回结果:', result)
    console.log('用户信息:', (result.result as any)?.userInfo)

    const response = result.result as CloudResponse<UserInfo>
    if (response?.success && response?.userInfo) {
      const userInfo = response.userInfo
      
      
      // 保存到本地存储
      wx.setStorageSync(USER_INFO_KEY, userInfo)
      return userInfo
    } else {
      console.error('获取用户信息失败:', (result.result as any)?.message)
      return null
    }
  } catch (error) {
    console.error('刷新用户信息失败:', error)
    return null
  }
}

/**
 * 退出登录
 */
export function logout(): void {
  updateGlobalUserState(null, false)
  
  // 清除其他本地存储
  try {
    wx.removeStorageSync('currentOrg')
  } catch (error) {
    console.error('清除本地存储失败:', error)
  }
  
  wx.showToast({
    title: '已退出登录',
    icon: 'success'
  })
}

/**
 * 获取用户授权信息
 */
export async function getUserProfile(): Promise<WechatMiniprogram.UserInfo> {
  const result = await wx.getUserProfile({
    desc: '用于完善用户资料'
  })
  
  if (result.userInfo) {
    // 更新用户信息
    await updateUserInfo(result.userInfo)
    return result.userInfo
  }
  
  throw new Error('获取用户信息失败')
}


