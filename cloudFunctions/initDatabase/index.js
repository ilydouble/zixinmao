const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('开始初始化数据库...')

    const results = []

    // 创建数据库集合
    await createCollections(results)

    // 创建索引
    await createIndexes(results)

    // 注意：报告测试数据已移至 initDataSetReport 云函数
    results.push('ℹ️  报告测试数据请使用 initDataSetReport 云函数创建')

    return {
      success: true,
      message: '数据库初始化完成',
      details: results
    }

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 创建数据库集合
 */
async function createCollections(results) {
  const collections = [
    {
      name: 'users',
      description: '用户信息表'
    },
    {
      name: 'reports',
      description: '报告记录表'
    },
    {
      name: 'files',
      description: '文件记录表'
    },
    {
      name: 'orders',
      description: '订单记录表'
    },
    {
      name: 'transactions',
      description: '交易记录表'
    },
    {
      name: 'system_config',
      description: '系统配置表'
    }
  ]

  for (const collection of collections) {
    try {
      await db.createCollection(collection.name)
      results.push(`✅ 集合创建成功: ${collection.name} (${collection.description})`)
      console.log(`集合创建成功: ${collection.name}`)
    } catch (error) {
      if (error.errCode === -502002) {
        results.push(`ℹ️  集合已存在: ${collection.name}`)
      } else {
        results.push(`❌ 集合创建失败: ${collection.name} - ${error.message}`)
        console.error(`集合创建失败: ${collection.name}`, error)
      }
    }
  }
}

/**
 * 创建索引
 */
async function createIndexes(results) {
  const indexes = [
    // users 集合索引
    {
      collection: 'users',
      name: 'openid_index',
      keys: { openid: 1 },
      options: { unique: true }
    },
    {
      collection: 'users',
      name: 'created_at_index',
      keys: { createdAt: -1 }
    },

    // reports 集合索引
    {
      collection: 'reports',
      name: 'user_id_index',
      keys: { userId: 1 }
    },
    {
      collection: 'reports',
      name: 'report_type_index',
      keys: { reportType: 1 }
    },
    {
      collection: 'reports',
      name: 'status_index',
      keys: { 'processing.status': 1 }
    },
    {
      collection: 'reports',
      name: 'created_at_index',
      keys: { 'metadata.createdAt': -1 }
    },
    {
      collection: 'reports',
      name: 'user_type_created_index',
      keys: { userId: 1, reportType: 1, 'metadata.createdAt': -1 }
    },

    // files 集合索引
    {
      collection: 'files',
      name: 'user_id_index',
      keys: { userId: 1 }
    },
    {
      collection: 'files',
      name: 'file_id_index',
      keys: { fileId: 1 },
      options: { unique: true }
    },

    // orders 集合索引
    {
      collection: 'orders',
      name: 'user_id_index',
      keys: { userId: 1 }
    },
    {
      collection: 'orders',
      name: 'order_no_index',
      keys: { orderNo: 1 },
      options: { unique: true }
    },
    {
      collection: 'orders',
      name: 'status_index',
      keys: { status: 1 }
    },
    {
      collection: 'orders',
      name: 'created_at_index',
      keys: { createdAt: -1 }
    },

    // transactions 集合索引
    {
      collection: 'transactions',
      name: 'user_id_index',
      keys: { userId: 1 }
    },
    {
      collection: 'transactions',
      name: 'transaction_id_index',
      keys: { transactionId: 1 },
      options: { unique: true }
    },
    {
      collection: 'transactions',
      name: 'type_index',
      keys: { type: 1 }
    },
    {
      collection: 'transactions',
      name: 'created_at_index',
      keys: { createdAt: -1 }
    }
  ]

  for (const index of indexes) {
    try {
      await db.collection(index.collection).createIndex({
        keys: index.keys,
        options: index.options || {}
      })
      results.push(`✅ 索引创建成功: ${index.collection}.${index.name}`)
      console.log(`索引创建成功: ${index.collection}.${index.name}`)
    } catch (error) {
      if (error.errCode === -502005) {
        results.push(`ℹ️  索引已存在: ${index.collection}.${index.name}`)
      } else {
        results.push(`❌ 索引创建失败: ${index.collection}.${index.name} - ${error.message}`)
        console.error(`索引创建失败: ${index.collection}.${index.name}`, error)
      }
    }
  }
}

// 测试数据创建功能已移至 initDataSetReport 云函数
// 请使用 initDataSetReport 云函数来创建报告相关的测试数据