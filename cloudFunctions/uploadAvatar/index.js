// 云函数：上传用户头像
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 上传用户头像到云存储
 * @param {Object} event - 云函数参数
 * @param {string} event.tempFilePath - 临时文件路径
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    console.log('云函数开始执行:', { OPENID, event })

    if (!OPENID) {
      return {
        success: false,
        message: '用户未登录'
      }
    }

    const { tempFilePath } = event

    if (!tempFilePath) {
      return {
        success: false,
        message: '临时文件路径不能为空'
      }
    }

    console.log('开始上传头像:', { userId: OPENID, tempFilePath })

    // 生成云存储文件名
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const fileExtension = getFileExtension(tempFilePath)
    const cloudPath = `temp/avatars/${OPENID}_${timestamp}_${random}${fileExtension}`

    console.log('云存储路径:', cloudPath)

    // 对于微信临时文件，我们需要使用 HTTP 请求获取文件内容
    const https = require('https')
    const http = require('http')

    // 获取临时文件内容
    const fileContent = await downloadTempFile(tempFilePath)

    if (!fileContent) {
      return {
        success: false,
        message: '获取临时文件内容失败'
      }
    }

    console.log('文件内容大小:', fileContent.length)

    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileContent
    })

    console.log('上传结果:', uploadResult)

    if (!uploadResult.fileID) {
      return {
        success: false,
        message: '上传到云存储失败'
      }
    }

    console.log('头像上传成功:', uploadResult.fileID)

    // 获取云存储文件的访问URL
    const getTempFileURLResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    let avatarUrl = uploadResult.fileID
    if (getTempFileURLResult.fileList && getTempFileURLResult.fileList.length > 0) {
      const fileInfo = getTempFileURLResult.fileList[0]
      if (fileInfo.status === 0) {
        avatarUrl = fileInfo.tempFileURL
      }
    }

    // 更新用户头像URL
    const userQuery = await db.collection('users').where({
      openid: OPENID
    }).get()

    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userQuery.data[0]

    // 删除旧头像文件（如果存在且是云存储文件）
    if (user.avatarUrl && user.avatarUrl.startsWith('cloud://')) {
      try {
        await cloud.deleteFile({
          fileList: [user.avatarUrl]
        })
        console.log('删除旧头像文件成功:', user.avatarUrl)
      } catch (error) {
        console.warn('删除旧头像文件失败:', error)
        // 不影响主流程，继续执行
      }
    }

    // 更新用户头像URL
    await db.collection('users').doc(user._id).update({
      data: {
        avatarUrl: uploadResult.fileID, // 保存云存储文件ID
        updatedAt: new Date()
      }
    })

    console.log('用户头像更新成功:', { userId: OPENID, avatarUrl: uploadResult.fileID })

    return {
      success: true,
      message: '头像上传成功',
      data: {
        avatarUrl: avatarUrl, // 返回可访问的URL
        fileID: uploadResult.fileID, // 返回云存储文件ID
        cloudPath: cloudPath
      }
    }

  } catch (error) {
    console.error('上传头像失败:', error)
    return {
      success: false,
      message: '上传头像失败',
      error: error.message
    }
  }
}

/**
 * 下载临时文件内容
 */
async function downloadTempFile(tempFilePath) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const http = require('http')

    // 判断使用 http 还是 https
    const client = tempFilePath.startsWith('https://') ? https : http

    client.get(tempFilePath, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }

      const chunks = []

      response.on('data', (chunk) => {
        chunks.push(chunk)
      })

      response.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })

      response.on('error', (error) => {
        reject(error)
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filePath) {
  const lastDotIndex = filePath.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return '.jpg' // 默认扩展名
  }

  const extension = filePath.substring(lastDotIndex).toLowerCase()

  // 只允许常见的图片格式
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  if (allowedExtensions.includes(extension)) {
    return extension
  }

  return '.jpg' // 默认扩展名
}
