import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Admin, LoginForm, LoginResponse } from '@/types'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const user = ref<Admin | null>(null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isRoot = computed(() => user.value?.role === 'root')
  const isCompanyAdmin = computed(() => user.value?.role === 'company_admin')

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    if (user.value.role === 'root') return true
    return user.value.permissions.includes(permission)
  }

  // 检查多个权限（任一满足）
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // 检查多个权限（全部满足）
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // 登录
  const login = async (loginForm: LoginForm): Promise<void> => {
    loading.value = true
    try {
      const response = await authApi.login(loginForm)
      const { token: newToken, user: userInfo } = response.data as LoginResponse
      
      // 保存 token 和用户信息
      token.value = newToken
      user.value = userInfo
      
      // 持久化存储
      localStorage.setItem('admin_token', newToken)
      localStorage.setItem('admin_user', JSON.stringify(userInfo))
      
    } catch (error) {
      // 清除可能的残留数据
      token.value = ''
      user.value = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async (): Promise<void> => {
    try {
      // 调用后端退出接口
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清除本地数据
      token.value = ''
      user.value = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }

  // 获取用户信息
  const getUserInfo = async (): Promise<void> => {
    if (!token.value) return
    
    try {
      const response = await authApi.getProfile()
      user.value = response.data as Admin
      
      // 更新本地存储
      localStorage.setItem('admin_user', JSON.stringify(user.value))
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果获取用户信息失败，可能是 token 过期，清除登录状态
      await logout()
      throw error
    }
  }

  // 修改密码
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await authApi.changePassword({
      currentPassword,
      newPassword
    })
  }

  // 初始化认证状态
  const initAuth = async (): Promise<void> => {
    const savedToken = localStorage.getItem('admin_token')
    const savedUser = localStorage.getItem('admin_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        
        // 验证 token 是否有效
        await getUserInfo()
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        // 清除无效的认证信息
        await logout()
      }
    }
  }

  // 清除认证状态
  const clearAuth = (): void => {
    token.value = ''
    user.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  return {
    // 状态
    token: readonly(token),
    user: readonly(user),
    loading: readonly(loading),
    
    // 计算属性
    isLoggedIn,
    isRoot,
    isCompanyAdmin,
    
    // 方法
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    getUserInfo,
    changePassword,
    initAuth,
    clearAuth
  }
})
