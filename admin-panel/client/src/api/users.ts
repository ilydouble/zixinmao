import request from '@/utils/request'
import type { ApiResponse, User, ListResponse, SystemStats } from '@/types'

export const usersApi = {
  // 获取用户列表
  getUsers: (params: {
    page?: number
    pageSize?: number
    organizationId?: string
    search?: string
    status?: string
  }): Promise<ApiResponse<ListResponse<User>>> => {
    return request.get('/users', { params })
  },

  // 获取用户详情
  getUserDetail: (id: string): Promise<ApiResponse<{
    user: User
    rechargeRecords: any[]
    orders: any[]
  }>> => {
    return request.get(`/users/${id}`)
  },

  // 获取用户统计数据
  getUserStats: (): Promise<ApiResponse<SystemStats>> => {
    return request.get('/users/stats/overview')
  }
}
