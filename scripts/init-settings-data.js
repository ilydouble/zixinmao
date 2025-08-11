#!/usr/bin/env node

/**
 * 初始化设置功能相关数据
 * 运行此脚本来创建组织和城市数据
 */

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

async function initSettingsData() {
  console.log('开始初始化设置功能数据...')
  
  try {
    // 初始化组织数据
    await initOrganizations()
    
    // 初始化城市数据
    await initCities()
    
    console.log('✅ 设置功能数据初始化完成！')
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
  }
}

async function initOrganizations() {
  console.log('正在初始化组织数据...')
  
  const organizations = [
    {
      name: '思源数据',
      code: 'SIYUAN_DATA',
      type: 'data_service',
      description: '专业数据服务提供商',
      status: 'active',
      sort: 1,
      createdAt: new Date()
    },
    {
      name: '中国银行',
      code: 'BOC',
      type: 'bank',
      description: '中国银行股份有限公司',
      status: 'active',
      sort: 2,
      createdAt: new Date()
    },
    {
      name: '工商银行',
      code: 'ICBC',
      type: 'bank',
      description: '中国工商银行股份有限公司',
      status: 'active',
      sort: 3,
      createdAt: new Date()
    },
    {
      name: '建设银行',
      code: 'CCB',
      type: 'bank',
      description: '中国建设银行股份有限公司',
      status: 'active',
      sort: 4,
      createdAt: new Date()
    },
    {
      name: '农业银行',
      code: 'ABC',
      type: 'bank',
      description: '中国农业银行股份有限公司',
      status: 'active',
      sort: 5,
      createdAt: new Date()
    },
    {
      name: '招商银行',
      code: 'CMB',
      type: 'bank',
      description: '招商银行股份有限公司',
      status: 'active',
      sort: 6,
      createdAt: new Date()
    },
    {
      name: '平安银行',
      code: 'PAB',
      type: 'bank',
      description: '平安银行股份有限公司',
      status: 'active',
      sort: 7,
      createdAt: new Date()
    },
    {
      name: '中信银行',
      code: 'CITIC',
      type: 'bank',
      description: '中信银行股份有限公司',
      status: 'active',
      sort: 8,
      createdAt: new Date()
    },
    {
      name: '华夏银行',
      code: 'HXB',
      type: 'bank',
      description: '华夏银行股份有限公司',
      status: 'active',
      sort: 9,
      createdAt: new Date()
    },
    {
      name: '民生银行',
      code: 'CMBC',
      type: 'bank',
      description: '中国民生银行股份有限公司',
      status: 'active',
      sort: 10,
      createdAt: new Date()
    },
    {
      name: '光大银行',
      code: 'CEB',
      type: 'bank',
      description: '中国光大银行股份有限公司',
      status: 'active',
      sort: 11,
      createdAt: new Date()
    },
    {
      name: '浦发银行',
      code: 'SPDB',
      type: 'bank',
      description: '上海浦东发展银行股份有限公司',
      status: 'active',
      sort: 12,
      createdAt: new Date()
    },
    {
      name: '兴业银行',
      code: 'CIB',
      type: 'bank',
      description: '兴业银行股份有限公司',
      status: 'active',
      sort: 13,
      createdAt: new Date()
    },
    {
      name: '广发银行',
      code: 'GDB',
      type: 'bank',
      description: '广发银行股份有限公司',
      status: 'active',
      sort: 14,
      createdAt: new Date()
    },
    {
      name: '中国人保',
      code: 'PICC',
      type: 'insurance',
      description: '中国人民保险集团股份有限公司',
      status: 'active',
      sort: 15,
      createdAt: new Date()
    },
    {
      name: '中国平安',
      code: 'PING_AN',
      type: 'insurance',
      description: '中国平安保险(集团)股份有限公司',
      status: 'active',
      sort: 16,
      createdAt: new Date()
    },
    {
      name: '中国太保',
      code: 'CPIC',
      type: 'insurance',
      description: '中国太平洋保险(集团)股份有限公司',
      status: 'active',
      sort: 17,
      createdAt: new Date()
    },
    {
      name: '中国人寿',
      code: 'CHINALIFE',
      type: 'insurance',
      description: '中国人寿保险股份有限公司',
      status: 'active',
      sort: 18,
      createdAt: new Date()
    },
    {
      name: '蚂蚁集团',
      code: 'ANT_GROUP',
      type: 'fintech',
      description: '蚂蚁科技集团股份有限公司',
      status: 'active',
      sort: 19,
      createdAt: new Date()
    },
    {
      name: '腾讯金融',
      code: 'TENCENT_FIN',
      type: 'fintech',
      description: '腾讯金融科技有限公司',
      status: 'active',
      sort: 20,
      createdAt: new Date()
    }
  ]

  // 检查是否已有数据
  const existingOrgs = await db.collection('organizations').count()
  if (existingOrgs.total > 0) {
    console.log('组织数据已存在，跳过初始化')
    return
  }

  // 批量插入组织数据
  for (const org of organizations) {
    await db.collection('organizations').add({ data: org })
  }
  
  console.log(`✅ 成功创建 ${organizations.length} 个组织`)
}

async function initCities() {
  console.log('正在初始化城市数据...')
  
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

  // 检查是否已有数据
  const existingCities = await db.collection('cities').count()
  if (existingCities.total > 0) {
    console.log('城市数据已存在，跳过初始化')
    return
  }

  // 批量插入城市数据
  for (const city of cities) {
    await db.collection('cities').add({ data: city })
  }
  
  console.log(`✅ 成功创建 ${cities.length} 个城市`)
}

// 运行初始化
if (require.main === module) {
  initSettingsData()
}

module.exports = { initSettingsData }
