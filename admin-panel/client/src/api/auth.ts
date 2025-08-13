import request from '@/utils/request'
import type { LoginForm, ApiResponse, Admin } from '@/types'

export const authApi = {
  // 登录
  login: (data: LoginForm): Promise<ApiResponse> => {
    return request.post('/auth/login', data)
  },

  // 获取当前用户信息
  getProfile: (): Promise<ApiResponse<Admin>> => {
    return request.get('/auth/profile')
  },

  // 退出登录
  logout: (): Promise<ApiResponse> => {
    return request.post('/auth/logout')
  },

  // 修改密码
  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse> => {
    return request.put('/auth/password', data)
  }
}
