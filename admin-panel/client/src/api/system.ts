import request from '@/utils/request'
import type { ApiResponse, AdminLog, ListResponse, SystemStats } from '@/types'

export const systemApi = {
  // 获取操作日志
  getLogs: (params: {
    page?: number
    pageSize?: number
    adminRole?: string
    action?: string
    module?: string
  }): Promise<ApiResponse<ListResponse<AdminLog>>> => {
    return request.get('/system/logs', { params })
  },

  // 获取系统统计数据
  getStats: (): Promise<ApiResponse<SystemStats>> => {
    return request.get('/system/stats')
  },

  // 获取系统配置
  getConfig: (): Promise<ApiResponse<any[]>> => {
    return request.get('/system/config')
  },

  // 获取数据库状态
  getDatabaseStatus: (): Promise<ApiResponse<{
    collections: Record<string, number>
    status: string
    timestamp: string
  }>> => {
    return request.get('/system/database/status')
  }
}
