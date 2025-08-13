// 云函数：初始化数据库
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 数据库初始化云函数
 * 创建必要的集合和索引
 */
exports.main = async (event, context) => {
  try {
    const results = []

    // 1. 创建 users 集合（用户信息）
    try {
      await db.createCollection('users')
      results.push('users 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('users 集合已存在')
      } else {
        results.push(`users 集合创建失败: ${error.message}`)
      }
    }

    // 2. 创建 reports 集合（报告记录）
    try {
      await db.createCollection('reports')
      results.push('reports 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('reports 集合已存在')
      } else {
        results.push(`reports 集合创建失败: ${error.message}`)
      }
    }

    // 3. 创建 orders 集合（订单记录）
    try {
      await db.createCollection('orders')
      results.push('orders 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('orders 集合已存在')
      } else {
        results.push(`orders 集合创建失败: ${error.message}`)
      }
    }

    // 4. 创建 recharge_records 集合（充值记录）
    try {
      await db.createCollection('recharge_records')
      results.push('recharge_records 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('recharge_records 集合已存在')
      } else {
        results.push(`recharge_records 集合创建失败: ${error.message}`)
      }
    }

    // 5. 创建 auth_logs 集合（认证日志）
    try {
      await db.createCollection('auth_logs')
      results.push('auth_logs 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('auth_logs 集合已存在')
      } else {
        results.push(`auth_logs 集合创建失败: ${error.message}`)
      }
    }

    // 6. 创建 tasks 集合（任务队列）
    try {
      await db.createCollection('tasks')
      results.push('tasks 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('tasks 集合已存在')
      } else {
        results.push(`tasks 集合创建失败: ${error.message}`)
      }
    }

    // 7. 创建 organizations 集合（企业信息）
    try {
      await db.createCollection('organizations')
      results.push('organizations 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('organizations 集合已存在')
      } else {
        results.push(`organizations 集合创建失败: ${error.message}`)
      }
    }

    // 8. 创建 company_admins 集合（企业管理员）
    try {
      await db.createCollection('company_admins')
      results.push('company_admins 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('company_admins 集合已存在')
      } else {
        results.push(`company_admins 集合创建失败: ${error.message}`)
      }
    }

    // 9. 创建 admin_logs 集合（管理员操作日志）
    try {
      await db.createCollection('admin_logs')
      results.push('admin_logs 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('admin_logs 集合已存在')
      } else {
        results.push(`admin_logs 集合创建失败: ${error.message}`)
      }
    }

    // 10. 创建 system_config 集合（系统配置）
    try {
      await db.createCollection('system_config')
      results.push('system_config 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('system_config 集合已存在')
      } else {
        results.push(`system_config 集合创建失败: ${error.message}`)
      }
    }

    // 11. 创建 cities 集合（城市信息）
    try {
      await db.createCollection('cities')
      results.push('cities 集合创建成功')
    } catch (error) {
      if (error.errCode === -1) {
        results.push('cities 集合已存在')
      } else {
        results.push(`cities 集合创建失败: ${error.message}`)
      }
    }

    // 初始化基础数据
    await initBaseData(results)

    return {
      success: true,
      message: '数据库初始化完成',
      results: results
    }

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    }
  }
}

/**
 * 初始化基础数据
 */
async function initBaseData(results) {
  // 初始化组织数据
  try {
    const orgCount = await db.collection('organizations').count()
    if (orgCount.total === 0) {
      const organizations = [
        {
          name: '西安海之源科技服务有限公司',
          code: 'HAIYUAN_TECH',
          type: 'company',
          description: '默认根企业，为未选择企业的用户提供服务',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 0,
          isDefault: true,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        },
        {
          name: '阿里巴巴集团',
          code: 'ALIBABA',
          type: 'company',
          description: '阿里巴巴集团控股有限公司',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 1,
          isDefault: false,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        },
        {
          name: '腾讯科技',
          code: 'TENCENT',
          type: 'company',
          description: '深圳市腾讯计算机系统有限公司',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 2,
          isDefault: false,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        },
        {
          name: '百度公司',
          code: 'BAIDU',
          type: 'company',
          description: '北京百度网讯科技有限公司',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 3,
          isDefault: false,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        },
        {
          name: '京东集团',
          code: 'JD',
          type: 'company',
          description: '北京京东世纪贸易有限公司',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 4,
          isDefault: false,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        },
        {
          name: '美团公司',
          code: 'MEITUAN',
          type: 'company',
          description: '北京三快在线科技有限公司',
          legalPerson: '',
          businessLicense: '',
          contactPhone: '',
          contactEmail: '',
          address: '',
          adminUsers: [],
          coinPrice: 0,
          status: 'active',
          sort: 5,
          isDefault: false,
          createdAt: new Date(),
          approvedAt: new Date(),
          approvedBy: 'system'
        }
      ]

      for (const org of organizations) {
        await db.collection('organizations').add({ data: org })
      }
      results.push('企业基础数据初始化完成')
    } else {
      results.push('企业数据已存在，跳过初始化')
    }
  } catch (error) {
    results.push(`企业数据初始化失败: ${error.message}`)
  }

  // 初始化企业管理员数据
  try {
    const adminCount = await db.collection('company_admins').count()
    if (adminCount.total === 0) {
      const companyAdmins = [
        {
          username: 'haiyuan_admin',
          password: 'admin123456', // 实际应用中需要加密
          organizationId: '', // 需要在创建企业后关联
          organizationName: '西安海之源科技服务有限公司',
          permissions: ['user_management', 'price_setting', 'data_statistics'],
          status: 'active',
          createdAt: new Date(),
          lastLoginAt: null
        }
      ]

      for (const admin of companyAdmins) {
        await db.collection('company_admins').add({ data: admin })
      }
      results.push('企业管理员数据初始化完成')
    } else {
      results.push('企业管理员数据已存在，跳过初始化')
    }
  } catch (error) {
    results.push(`企业管理员数据初始化失败: ${error.message}`)
  }

  // 初始化城市数据
  try {
    const cityCount = await db.collection('cities').count()
    if (cityCount.total === 0) {
      const cities = [
        {
          name: '北京市',
          code: '110000',
          provinceCode: '110000',
          provinceName: '北京市',
          level: 'municipality',
          status: 'active',
          sort: 1,
          createdAt: new Date()
        },
        {
          name: '上海市',
          code: '310000',
          provinceCode: '310000',
          provinceName: '上海市',
          level: 'municipality',
          status: 'active',
          sort: 2,
          createdAt: new Date()
        },
        {
          name: '广州市',
          code: '440100',
          provinceCode: '440000',
          provinceName: '广东省',
          level: 'city',
          status: 'active',
          sort: 3,
          createdAt: new Date()
        },
        {
          name: '深圳市',
          code: '440300',
          provinceCode: '440000',
          provinceName: '广东省',
          level: 'city',
          status: 'active',
          sort: 4,
          createdAt: new Date()
        },
        {
          name: '杭州市',
          code: '330100',
          provinceCode: '330000',
          provinceName: '浙江省',
          level: 'city',
          status: 'active',
          sort: 5,
          createdAt: new Date()
        },
        {
          name: '南京市',
          code: '320100',
          provinceCode: '320000',
          provinceName: '江苏省',
          level: 'city',
          status: 'active',
          sort: 6,
          createdAt: new Date()
        },
        {
          name: '成都市',
          code: '510100',
          provinceCode: '510000',
          provinceName: '四川省',
          level: 'city',
          status: 'active',
          sort: 7,
          createdAt: new Date()
        },
        {
          name: '武汉市',
          code: '420100',
          provinceCode: '420000',
          provinceName: '湖北省',
          level: 'city',
          status: 'active',
          sort: 8,
          createdAt: new Date()
        }
      ]

      for (const city of cities) {
        await db.collection('cities').add({ data: city })
      }
      results.push('城市基础数据初始化完成')
    } else {
      results.push('城市数据已存在，跳过初始化')
    }
  } catch (error) {
    results.push(`城市数据初始化失败: ${error.message}`)
  }

  // 初始化示例订单数据（仅在有用户上下文时）
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    if (OPENID) {
      // 有用户上下文，为当前用户创建示例订单
      const userOrderCount = await db.collection('orders').where({
        userId: OPENID
      }).count()

      if (userOrderCount.total === 0) {
        await initSampleOrders(results)
      } else {
        results.push('当前用户已有订单数据，跳过初始化')
      }
    } else {
      // 无用户上下文，创建系统级示例数据
      const orderCount = await db.collection('orders').count()
      if (orderCount.total === 0) {
        await initSampleOrders(results)
      } else {
        results.push('系统订单数据已存在，跳过初始化')
      }
    }
  } catch (error) {
    results.push(`订单数据初始化失败: ${error.message}`)
  }

  // 初始化示例充值记录数据（仅在有用户上下文时）
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    if (OPENID) {
      // 有用户上下文，为当前用户创建示例充值记录
      const userRechargeCount = await db.collection('recharge_records').where({
        userId: OPENID
      }).count()

      if (userRechargeCount.total === 0) {
        await initSampleRechargeRecords(results)
      } else {
        results.push('当前用户已有充值记录数据，跳过初始化')
      }
    } else {
      // 无用户上下文，创建系统级示例数据
      const rechargeCount = await db.collection('recharge_records').count()
      if (rechargeCount.total === 0) {
        await initSampleRechargeRecords(results)
      } else {
        results.push('系统充值记录数据已存在，跳过初始化')
      }
    }
  } catch (error) {
    results.push(`充值记录数据初始化失败: ${error.message}`)
  }

  // 初始化系统配置
  try {
    const configCount = await db.collection('system_config').count()
    if (configCount.total === 0) {
      const bcrypt = require('bcryptjs')
      const defaultPassword = 'admin123456'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)

      const systemConfigs = [
        {
          key: 'root_password',
          value: hashedPassword,
          type: 'string',
          description: 'Root管理员密码',
          category: 'auth',
          updatedBy: 'system',
          updatedAt: new Date()
        },
        {
          key: 'base_price_jianxin',
          value: 15.0,
          type: 'number',
          description: '简信宝基础价格',
          category: 'price',
          updatedBy: 'system',
          updatedAt: new Date()
        },
        {
          key: 'base_price_zhuanxin',
          value: 25.0,
          type: 'number',
          description: '专信宝基础价格',
          category: 'price',
          updatedBy: 'system',
          updatedAt: new Date()
        },
        {
          key: 'system_name',
          value: '资信猫管理系统',
          type: 'string',
          description: '系统名称',
          category: 'system',
          updatedBy: 'system',
          updatedAt: new Date()
        }
      ]

      for (const config of systemConfigs) {
        await db.collection('system_config').add({ data: config })
      }

      results.push('系统配置初始化完成')
      results.push(`Root默认密码: ${defaultPassword}`)
    } else {
      results.push('系统配置已存在，跳过初始化')
    }
  } catch (error) {
    results.push(`系统配置初始化失败: ${error.message}`)
  }

  return {
    success: true,
    message: '数据库初始化完成',
    results: results
  }
}

/**
 * 初始化示例订单数据
 */
async function initSampleOrders(results) {
  // 获取当前用户的openid，如果没有则使用示例用户ID
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const sampleUserId = OPENID || 'sample_user_001'

  console.log('初始化订单数据，用户ID:', sampleUserId)

  // 创建示例订单数据（仅保留消费订单）
  const sampleOrders = [
    // 消费订单 - 简信宝查询
    {
      userId: sampleUserId,
      orderNo: generateOrderNo('C'),
      type: 'consumption',
      productName: '简信宝查询',
      productCode: 'JIANXIN_QUERY',
      amount: 15.00,
      originalAmount: 15.00,
      discountAmount: 0,
      status: 'completed',
      queryParams: {
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000'
      },
      resultData: {
        hasRecord: true,
        riskLevel: 'low',
        reportId: 'JX20241201001'
      },
      description: '简信宝个人信用查询',
      remark: '查询成功',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      userId: sampleUserId,
      orderNo: generateOrderNo('C'),
      type: 'consumption',
      productName: '简信宝查询',
      productCode: 'JIANXIN_QUERY',
      amount: 15.00,
      originalAmount: 15.00,
      discountAmount: 0,
      status: 'completed',
      queryParams: {
        name: '李四',
        idCard: '110101199002021234',
        phone: '13900139000'
      },
      resultData: {
        hasRecord: false,
        riskLevel: 'unknown',
        reportId: 'JX20241202001'
      },
      description: '简信宝个人信用查询',
      remark: '无记录',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },

    // 消费订单 - 转信宝查询
    {
      userId: sampleUserId,
      orderNo: generateOrderNo('C'),
      type: 'consumption',
      productName: '专信宝查询',
      productCode: 'ZHUANXIN_QUERY',
      amount: 25.00,
      originalAmount: 25.00,
      discountAmount: 0,
      status: 'completed',
      queryParams: {
        name: '王五',
        idCard: '110101199003031234',
        phone: '13700137000'
      },
      resultData: {
        hasRecord: true,
        riskLevel: 'medium',
        reportId: 'ZX20241203001'
      },
      description: '专信宝风险评估查询',
      remark: '中等风险',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4天前
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },

    // 消费订单 - 流水宝查询
    {
      userId: sampleUserId,
      orderNo: generateOrderNo('C'),
      type: 'consumption',
      productName: '流水宝查询',
      productCode: 'LIUSHUI_QUERY',
      amount: 35.00,
      originalAmount: 35.00,
      discountAmount: 0,
      status: 'completed',
      queryParams: {
        name: '陈七',
        idCard: '110101199005051234',
        phone: '13500135000'
      },
      resultData: {
        hasRecord: true,
        riskLevel: 'high',
        reportId: 'LS20241204001'
      },
      description: '流水宝银行流水分析',
      remark: '高风险',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },

    // 进行中的订单
    {
      userId: sampleUserId,
      orderNo: generateOrderNo('C'),
      type: 'consumption',
      productName: '简信宝查询',
      productCode: 'JIANXIN_QUERY',
      amount: 15.00,
      originalAmount: 15.00,
      discountAmount: 0,
      status: 'processing',
      queryParams: {
        name: '赵六',
        idCard: '110101199004041234',
        phone: '13600136000'
      },
      description: '简信宝个人信用查询',
      remark: '查询处理中',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
      updatedAt: new Date(Date.now() - 30 * 60 * 1000)
    }
  ]

  // 批量插入订单数据
  for (const order of sampleOrders) {
    await db.collection('orders').add({ data: order })
  }

  results.push(`示例订单数据初始化完成，共创建 ${sampleOrders.length} 条订单`)
}

/**
 * 初始化示例充值记录数据
 */
async function initSampleRechargeRecords(results) {
  // 获取当前用户的openid，如果没有则使用示例用户ID
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  const sampleUserId = OPENID || 'sample_user_001'

  console.log('初始化充值记录数据，用户ID:', sampleUserId)

  // 创建示例充值记录数据
  const sampleRechargeRecords = [
    // 微信支付充值记录
    {
      userId: sampleUserId,
      rechargeNo: generateRechargeNo(),
      amount: 100.00,
      paymentMethod: 'wechat_pay',
      paymentChannel: 'miniprogram',
      status: 'completed',
      transactionId: 'wx_' + Date.now() + '_001',
      description: '微信支付充值',
      remark: '首次充值',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      userId: sampleUserId,
      rechargeNo: generateRechargeNo(),
      amount: 200.00,
      paymentMethod: 'wechat_pay',
      paymentChannel: 'miniprogram',
      status: 'completed',
      transactionId: 'wx_' + Date.now() + '_002',
      description: '微信支付充值',
      remark: '二次充值',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },

    // 支付宝充值记录
    {
      userId: sampleUserId,
      rechargeNo: generateRechargeNo(),
      amount: 50.00,
      paymentMethod: 'alipay',
      paymentChannel: 'h5',
      status: 'completed',
      transactionId: 'ali_' + Date.now() + '_001',
      description: '支付宝充值',
      remark: '小额充值',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },

    // 待处理的充值记录
    {
      userId: sampleUserId,
      rechargeNo: generateRechargeNo(),
      amount: 300.00,
      paymentMethod: 'wechat_pay',
      paymentChannel: 'miniprogram',
      status: 'pending',
      transactionId: 'wx_' + Date.now() + '_003',
      description: '微信支付充值',
      remark: '大额充值',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },

    // 失败的充值记录
    {
      userId: sampleUserId,
      rechargeNo: generateRechargeNo(),
      amount: 150.00,
      paymentMethod: 'wechat_pay',
      paymentChannel: 'miniprogram',
      status: 'failed',
      transactionId: 'wx_' + Date.now() + '_004',
      description: '微信支付充值',
      remark: '支付失败',
      failureReason: '余额不足',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      failedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]

  // 批量插入充值记录数据
  for (const record of sampleRechargeRecords) {
    await db.collection('recharge_records').add({ data: record })
  }

  results.push(`示例充值记录数据初始化完成，共创建 ${sampleRechargeRecords.length} 条记录`)
}

/**
 * 生成充值记录号
 */
function generateRechargeNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `R${year}${month}${day}${hour}${minute}${second}${random}`
}

/**
 * 生成订单号
 * @param {string} prefix - 前缀 (R=充值, C=消费)
 */
function generateOrderNo(prefix = 'O') {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `${prefix}${year}${month}${day}${hour}${minute}${second}${random}`
}
