// 认证服务
import { userApi } from './api'
import { showError, showSuccess } from '../utils/util'

// 用户信息接口
interface UserInfo {
  openid: string
  nickName?: string
  avatarUrl?: string
  realNameVerified?: boolean
  [key: string]: any
}

// API 响应接口
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  userInfo?: T
  data?: T
}

// 全局数据接口
interface GlobalData {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  currentOrg: any
}

// App 实例接口
interface AppInstance {
  globalData: GlobalData
}

/**
 * 认证服务类
 */
class AuthService {
  private userInfo: UserInfo | null = null
  private isLoggedIn: boolean = false

  /**
   * 微信登录
   */
  async login(): Promise<UserInfo> {
    try {
      // 检查是否已登录
      const localUserInfo = wx.getStorageSync('userInfo') as UserInfo
      if (localUserInfo && localUserInfo.openid) {
        this.userInfo = localUserInfo
        this.isLoggedIn = true
        ;(getApp() as AppInstance).globalData.userInfo = localUserInfo
        ;(getApp() as AppInstance).globalData.isLoggedIn = true
        return localUserInfo
      }

      // 获取微信登录凭证
      const loginResult = await wx.login()
      if (!loginResult.code) {
        throw new Error('微信登录失败')
      }

      // 调用云函数登录
      const result: ApiResponse<UserInfo> = await userApi.login()
      
      if (result.success && result.userInfo) {
        this.userInfo = result.userInfo
        this.isLoggedIn = true
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', result.userInfo)
        
        // 更新全局数据
        ;(getApp() as AppInstance).globalData.userInfo = result.userInfo
        ;(getApp() as AppInstance).globalData.isLoggedIn = true
        
        return result.userInfo
      } else {
        throw new Error(result.message || '登录失败')
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      showError(error.message || '登录失败，请重试')
      throw error
    }
  }

  /**
   * 获取用户授权信息
   */
  async getUserProfile(): Promise<WechatMiniprogram.UserInfo> {
    try {
      const result = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      if (result.userInfo) {
        // 更新用户信息
        await this.updateUserInfo(result.userInfo)
        return result.userInfo
      }
      
      throw new Error('获取用户信息失败')
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        showError('需要授权才能使用完整功能')
      } else {
        showError('获取用户信息失败')
      }
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userInfo: Partial<UserInfo>): Promise<UserInfo> {
    try {
      const result: ApiResponse<UserInfo> = await userApi.updateUserInfo(userInfo)
      
      if (result.success && this.userInfo) {
        // 合并用户信息
        this.userInfo = { ...this.userInfo, ...userInfo }
        
        // 更新本地存储
        wx.setStorageSync('userInfo', this.userInfo)
        
        // 更新全局数据
        ;(getApp() as AppInstance).globalData.userInfo = this.userInfo
        
        return this.userInfo
      } else {
        throw new Error(result.message || '更新用户信息失败')
      }
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      showError(error.message || '更新用户信息失败')
      throw error
    }
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus(): boolean {
    // 临时注释掉实际登录检查，直接返回已登录状态
    /*
    const localUserInfo = wx.getStorageSync('userInfo') as UserInfo
    if (localUserInfo && localUserInfo.openid) {
      this.userInfo = localUserInfo
      this.isLoggedIn = true
      ;(getApp() as AppInstance).globalData.userInfo = localUserInfo
      ;(getApp() as AppInstance).globalData.isLoggedIn = true
      return true
    }
    return false
    */
    
    // 临时设置调试用户信息
    this.userInfo = {
      openid: 'debug_user_001',
      nickName: '调试用户',
      avatarUrl: '',
      realNameVerified: true
    }
    this.isLoggedIn = true
    ;(getApp() as AppInstance).globalData.userInfo = this.userInfo
    ;(getApp() as AppInstance).globalData.isLoggedIn = true
    return true
  }

  /**
   * 退出登录
   */
  logout(): void {
    this.userInfo = null
    this.isLoggedIn = false
    
    // 清除本地存储
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('currentOrg')
    
    // 清除全局数据
    ;(getApp() as AppInstance).globalData.userInfo = null
    ;(getApp() as AppInstance).globalData.isLoggedIn = false
    ;(getApp() as AppInstance).globalData.currentOrg = null
    
    showSuccess('已退出登录')
  }

  /**
   * 检查是否需要实名认证
   */
  needRealNameAuth(): boolean {
    return !this.userInfo || !this.userInfo.realNameVerified
  }

  /**
   * 实名认证
   */
  async realNameAuth(authData: any): Promise<boolean> {
    try {
      // 这里应该调用实名认证的云函数
      // 暂时模拟认证成功
      const result = {
        success: true,
        message: '实名认证成功'
      }
      
      if (result.success && this.userInfo) {
        // 更新用户认证状态
        this.userInfo.realNameVerified = true
        wx.setStorageSync('userInfo', this.userInfo)
        ;(getApp() as AppInstance).globalData.userInfo = this.userInfo
        
        showSuccess('实名认证成功')
        return true
      } else {
        throw new Error(result.message || '实名认证失败')
      }
    } catch (error: any) {
      console.error('实名认证失败:', error)
      showError(error.message || '实名认证失败')
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): UserInfo | null {
    return this.userInfo
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    // 临时直接返回 true，方便调试
    return true
    // return this.isLoggedIn && this.userInfo !== null && !!this.userInfo.openid
  }
}

// 创建单例实例
const authService = new AuthService()

export default authService
