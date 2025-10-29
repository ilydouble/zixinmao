// cloudFunctions/getBanners/index.js
// 获取 Banner 配置云函数

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('开始获取 Banner 配置')

    // 从数据库获取 Banner 配置
    const result = await db.collection('banners')
      .where({ enabled: true })
      .orderBy('sort', 'asc')
      .get()

    console.log('获取到的 Banner 数据:', result.data)

    if (result.data && result.data.length > 0) {
      // 为每个 banner 生成临时访问链接（如果有云存储图片）
      const banners = await Promise.all(result.data.map(async (banner) => {
        if (banner.cloudPath) {
          try {
            // 获取云存储文件的临时链接
            const fileResult = await cloud.getTempFileURL({
              fileList: [banner.cloudPath]
            })
            
            if (fileResult.fileList && fileResult.fileList.length > 0) {
              banner.imageUrl = fileResult.fileList[0].tempFileURL
              console.log('生成临时链接:', banner.cloudPath, '->', banner.imageUrl)
            }
          } catch (error) {
            console.error('获取文件链接失败:', banner.cloudPath, error)
          }
        }
        return banner
      }))

      return {
        success: true,
        data: banners
      }
    }

    // 如果数据库没有配置，返回默认配置
    console.log('数据库无 Banner 配置，返回默认配置')
    return {
      success: true,
      data: [
        {
          id: 1,
          title: '流水宝',
          bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          link: '/packageBusiness/pages/liushui/liushui',
          disabled: true,
          sort: 1
        },
        {
          id: 2,
          title: '简信宝',
          bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          link: '/packageBusiness/pages/jianxin/jianxin',
          disabled: false,
          sort: 2
        },
        {
          id: 3,
          title: '专信宝',
          bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          link: '/packageBusiness/pages/zhuanxin/zhuanxin',
          disabled: true,
          sort: 3
        }
      ]
    }

  } catch (error) {
    console.error('获取 Banner 配置失败:', error)
    return {
      success: false,
      message: '获取 Banner 配置失败：' + error.message
    }
  }
}

