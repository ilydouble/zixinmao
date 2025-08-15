// 统一文件验证工具
export interface FileValidationResult {
  valid: boolean
  message?: string
}

// 统一文件大小限制：10MB
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024

// 支持的文件格式
export const SUPPORTED_FORMATS = {
  flow: ['.pdf', '.jpg', '.jpeg', '.png'],
  simple: ['.pdf', '.jpg', '.jpeg', '.png'],
  detail: ['.pdf', '.jpg', '.jpeg', '.png']
} as const

export type ReportType = keyof typeof SUPPORTED_FORMATS

/**
 * 验证文件
 */
export function validateFile(
  fileName: string, 
  fileSize: number, 
  reportType: ReportType
): FileValidationResult {
  
  // 1. 检查文件大小
  if (fileSize > FILE_SIZE_LIMIT) {
    return {
      valid: false,
      message: `文件大小不能超过 10MB，当前文件：${formatFileSize(fileSize)}`
    }
  }
  
  // 2. 检查文件格式
  const extension = getFileExtension(fileName)
  const supportedFormats = SUPPORTED_FORMATS[reportType]
  
  if (!supportedFormats.includes(`.${extension}`)) {
    const reportNames = {
      flow: '流水宝',
      simple: '简信宝', 
      detail: '专信宝'
    }
    
    return {
      valid: false,
      message: `${reportNames[reportType]}仅支持 ${supportedFormats.join(', ')} 格式文件`
    }
  }
  
  return { valid: true }
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}