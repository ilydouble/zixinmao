// API服务层
import { showError } from '../utils/util'

// 通用 API 响应接口
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  userInfo?: T
  reportId?: string
  progress?: number
  status?: string
}

// 云函数响应接口
interface CloudFunctionResult {
  result: ApiResponse
}

// 报告类型
type ReportType = 'flow' | 'simple' | 'detail'

// 报告状态
type ReportStatus = 'processing' | 'completed' | 'failed'

// 报告信息接口
interface ReportInfo {
  id: string
  title: string
  type: ReportType
  date: string
  status: ReportStatus
}

// 文件信息接口
interface FileInfo {
  name: string
  size: number
  type: string
  [key: string]: any
}

/**
 * 云函数调用封装
 */
const callCloudFunction = async <T = any>(name: string, data: Record<string, any> = {}): Promise<ApiResponse<T>> => {
  try {
    const result: CloudFunctionResult = await wx.cloud.callFunction({
      name,
      data
    })
    
    if (result.result.success === false) {
      throw new Error(result.result.message || '操作失败')
    }
    
    return result.result
  } catch (error: any) {
    console.error(`云函数 ${name} 调用失败:`, error)
    showError(error.message || '网络错误，请重试')
    throw error
  }
}

/**
 * 用户相关API
 */
export const userApi = {
  // 用户登录
  login: async (): Promise<ApiResponse> => {
    return await callCloudFunction('login')
  },
  
  // 获取用户信息
  getUserInfo: async (): Promise<ApiResponse> => {
    return await callCloudFunction('getUserInfo')
  },
  
  // 更新用户信息
  updateUserInfo: async (userInfo: any): Promise<ApiResponse> => {
    return await callCloudFunction('updateUserInfo', { userInfo })
  }
}

/**
 * 机构相关API
 */
export const orgApi = {
  // 获取机构列表
  getOrgList: async (): Promise<ApiResponse> => {
    return await callCloudFunction('getOrgList')
  },
  
  // 加入机构
  joinOrg: async (orgCode: string): Promise<ApiResponse> => {
    return await callCloudFunction('joinOrg', { orgCode })
  },
  
  // 切换机构
  switchOrg: async (orgId: string): Promise<ApiResponse> => {
    return await callCloudFunction('switchOrg', { orgId })
  }
}

/**
 * 文件相关API
 */
export const fileApi = {
  // 上传文件
  uploadFile: async (filePath: string, cloudPath: string): Promise<WechatMiniprogram.Cloud.UploadFileResult> => {
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      return result
    } catch (error: any) {
      console.error('文件上传失败:', error)
      showError('文件上传失败')
      throw error
    }
  },
  
  // 删除文件
  deleteFile: async (fileId: string): Promise<ApiResponse> => {
    return await callCloudFunction('deleteFile', { fileId })
  }
}

/**
 * 报告相关API
 */
export const reportApi = {
  // 生成流水宝报告
  generateFlowReport: async (fileId: string, fileName: string): Promise<ApiResponse> => {
    return await callCloudFunction('generateFlowReport', { fileId, fileName })
  },
  
  // 生成简信宝报告
  generateSimpleReport: async (fileId: string, fileName: string): Promise<ApiResponse> => {
    return await callCloudFunction('generateSimpleReport', { fileId, fileName })
  },
  
  // 生成专信宝报告
  generateDetailReport: async (fileId: string, fileName: string): Promise<ApiResponse> => {
    return await callCloudFunction('generateDetailReport', { fileId, fileName })
  },
  
  // 获取报告进度
  getReportProgress: async (reportId: string): Promise<ApiResponse> => {
    return await callCloudFunction('getReportProgress', { reportId })
  },
  
  // 获取报告列表
  getReportList: async (type?: ReportType, page: number = 1, limit: number = 10): Promise<ApiResponse<ReportInfo[]>> => {
    return await callCloudFunction('getReportList', { type, page, limit })
  },
  
  // 获取报告详情
  getReportDetail: async (reportId: string): Promise<ApiResponse> => {
    return await callCloudFunction('getReportDetail', { reportId })
  },
  
  // 删除报告
  deleteReport: async (reportId: string): Promise<ApiResponse> => {
    return await callCloudFunction('deleteReport', { reportId })
  }
}

/**
 * 模拟API（用于开发阶段）
 */
export const mockApi = {
  // 模拟生成报告
  generateReport: async (type: ReportType, fileInfo: FileInfo): Promise<ApiResponse> => {
    // 模拟异步处理
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          reportId: `mock_${Date.now()}`,
          message: '报告生成任务已创建'
        })
      }, 1000)
    })
  },
  
  // 模拟获取报告进度
  getProgress: async (reportId: string): Promise<ApiResponse> => {
    // 模拟进度更新
    const progress = Math.min(100, Math.floor(Math.random() * 100) + 1)
    const status: ReportStatus = progress === 100 ? 'completed' : 'processing'
    
    return {
      success: true,
      progress,
      status,
      message: progress === 100 ? '报告生成完成' : '正在分析中...'
    }
  },
  
  // 模拟获取报告列表
  getReportList: async (type?: ReportType): Promise<ApiResponse<ReportInfo[]>> => {
    const mockReports: ReportInfo[] = [
      {
        id: 'report_1',
        title: '银行流水报告',
        type: 'flow',
        date: '2023-07-15',
        status: 'completed'
      },
      {
        id: 'report_2',
        title: '征信简版报告',
        type: 'simple',
        date: '2023-07-10',
        status: 'completed'
      },
      {
        id: 'report_3',
        title: '征信详版报告',
        type: 'detail',
        date: '2023-07-08',
        status: 'completed'
      }
    ]
    
    return {
      success: true,
      data: type ? mockReports.filter(r => r.type === type) : mockReports
    }
  }
}

export { callCloudFunction }
