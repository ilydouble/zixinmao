import request from '@/utils/request'
import type { ApiResponse, Admin, ListResponse } from '@/types'

export const adminsApi = {
  // 获取管理员列表
  getAdmins: (params: {
    organizationId?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<ListResponse<Admin>>> => {
    return request.get('/admins', { params })
  },

  // 创建企业管理员
  createAdmin: (data: {
    username: string
    password: string
    organizationId: string
    permissions: string[]
  }): Promise<ApiResponse> => {
    return request.post('/admins', data)
  },

  // 更新企业管理员
  updateAdmin: (id: string, data: {
    permissions?: string[]
    status?: string
  }): Promise<ApiResponse> => {
    return request.put(`/admins/${id}`, data)
  },

  // 重置管理员密码
  resetAdminPassword: (id: string, data: {
    newPassword: string
  }): Promise<ApiResponse> => {
    return request.post(`/admins/${id}/reset-password`, data)
  },

  // 删除企业管理员
  deleteAdmin: (id: string): Promise<ApiResponse> => {
    return request.delete(`/admins/${id}`)
  }
}
