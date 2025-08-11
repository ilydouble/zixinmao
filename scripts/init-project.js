// 项目初始化脚本
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

async function initProject() {
  console.log('开始初始化项目...')
  
  try {
    // 1. 初始化数据库
    const dbResult = await cloud.callFunction({
      name: 'initDatabase'
    })
    console.log('数据库初始化结果:', dbResult.result)
    
    // 2. 创建存储目录（通过上传空文件创建目录结构）
    const storage = cloud.storage()
    const directories = [
      'uploads/.keep',
      'reports/.keep', 
      'temp/.keep',
      'system/templates/.keep',
      'system/assets/.keep'
    ]
    
    for (const dir of directories) {
      try {
        await storage.uploadFile({
          cloudPath: dir,
          fileContent: Buffer.from('')
        })
        console.log(`创建目录: ${dir}`)
      } catch (error) {
        console.log(`目录已存在: ${dir}`)
      }
    }
    
    console.log('项目初始化完成！')
    
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

// 运行初始化
initProject()