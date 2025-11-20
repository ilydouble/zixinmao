const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 支持：
 * - 不传 parent_code -> 返回所有省份（parent_code='0'）
 * - 传 parent_code -> 返回该省份下的全部地级市
 * - 可选 keyword -> 名称模糊搜索
 * - 自动分页，返回完整结果集
 */
exports.main = async (event, context) => {
  try {
    const { parent_code, keyword } = event || {}

    // 组装查询条件
    const where = parent_code ? { parent_code } : { parent_code: '0' }
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      where.name = db.RegExp({
        regexp: keyword.trim(),
        options: 'i'
      })
    }

    const coll = db.collection('regions')

    // 统计总数并分页拉取（每次最多100条）
    const MAX_LIMIT = 100
    const countRes = await coll.where(where).count()
    const total = countRes.total || 0

    if (total === 0) {
      return { success: true, total: 0, data: [] }
    }

    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      tasks.push(
        coll
          .where(where)
          .orderBy('code', 'asc')
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get()
      )
    }

    const results = await Promise.all(tasks)
    const raw = results.reduce((arr, cur) => arr.concat(cur.data || []), [])

    // 规范化字段，兼容不同导入格式
    const data = raw.map(doc => {
      const code = String(doc.code ?? doc.adcode ?? doc.id ?? doc.value ?? '')
      const name = doc.name ?? doc.cityName ?? doc.provinceName ?? doc.label ?? ''
      let parent = doc.parent_code ?? doc.parentCode ?? doc.provinceCode ?? doc.parent ?? ''
      if (parent !== '' && parent !== undefined && parent !== null) parent = String(parent)
      // 顶层（省/直辖市/自治区）统一为 '0'
      if (!parent || parent === 'null' || parent === 'undefined') parent = '0'
      return { code, name, parent_code: parent }
    })

    return {
      success: true,
      total,
      data
    }
  } catch (error) {
    console.error('获取地区数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

