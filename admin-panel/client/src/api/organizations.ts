import request from '@/utils/request'
import type { ApiResponse, Organization, ListResponse } from '@/types'

export const organizationsApi = {
  // 获取企业列表
  getOrganizations: (params: {
    page?: number
    pageSize?: number
    status?: string
  }): Promise<ApiResponse<ListResponse<Organization>>> => {
    return request.get('/organizations', { params })
  },

  // 获取企业详情
  getOrganizationDetail: (id: string): Promise<ApiResponse<{
    organization: Organization
    stats: {
      totalUsers: number
      verifiedUsers: number
      totalBalance: number
      totalRecharge: number
      totalConsumption: number
      verificationRate: string
    }
    admins: any[]
  }>> => {
    return request.get(`/organizations/${id}`)
  },

  // 创建企业
  createOrganization: (data: {
    name: string
    code: string
    description?: string
    legalPerson?: string
    businessLicense?: string
    contactPhone?: string
    contactEmail?: string
    address?: string
  }): Promise<ApiResponse> => {
    return request.post('/organizations', data)
  },

  // 更新企业资信币价格
  updateOrganizationPrice: (id: string, data: {
    coinPrice: number
  }): Promise<ApiResponse> => {
    return request.put(`/organizations/${id}/price`, data)
  }
}
