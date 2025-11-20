const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 将 pcas-code.json（省市区层级）转换为平铺的省/市两级结构
 * 仅保留省份和地级市两级：
 *  - 省份：{ code, name, parent_code: '0' }
 *  - 地级市：{ code, name, parent_code: 省份code }
 */
function flattenPCAS(pcas) {
  const flat = []
  if (!Array.isArray(pcas)) return flat

  for (const prov of pcas) {
    if (!prov || !prov.code || !prov.name) continue
    // 省份
    flat.push({ code: String(prov.code), name: prov.name, parent_code: '0' })

    const cities = Array.isArray(prov.children) ? prov.children : []
    for (const city of cities) {
      if (!city || !city.code || !city.name) continue
      flat.push({ code: String(city.code), name: city.name, parent_code: String(prov.code) })
    }
  }
  return flat
}

/**
 * 读取来源数据：
 *  - 若传入 event.fileId：从云存储下载 pcas-code.json 并转换
 *  - 否则：从本地 regions.json（已平铺）读取
 */
async function loadRegionData(event) {
  // 1) 优先从云存储文件加载（推荐：上传 pcas-code.json 到云存储后，传入 fileId）
  if (event && event.fileId) {
    const fileId = event.fileId
    console.log('使用云存储文件初始化，fileId:', fileId)
    const res = await cloud.downloadFile({ fileID: fileId })
    const content = res.fileContent.toString('utf8')
    let json
    try {
      json = JSON.parse(content)
    } catch (e) {
      throw new Error('云存储文件 JSON 解析失败，请确认文件内容为有效 JSON')
    }

    // 支持两种结构：已平铺的数组 或 pcas-code 树形结构
    if (Array.isArray(json)) {
      // 判断是否为已平铺结构（含 parent_code）
      const first = json[0] || {}
      const isFlat = Object.prototype.hasOwnProperty.call(first, 'parent_code')
      return isFlat ? json : flattenPCAS(json)
    }

    // 兼容对象包裹数组的情况
    if (json && Array.isArray(json.children)) {
      return flattenPCAS(json.children)
    }

    throw new Error('不支持的地区数据结构，请提供平铺数组或 pcas-code.json')
  }

  // 2) 回落到本地示例数据（仅少量示例，便于快速验证）
  try {
    const local = require('./regions.json')
    return local
  } catch (e) {
    throw new Error('未提供 fileId 且本地 regions.json 不存在，请上传完整数据并传入 fileId')
  }
}

exports.main = async (event, context) => {
  try {
    const regionsCollection = db.collection('regions')

    // 检查集合是否已存在数据，避免重复初始化
    const countResult = await regionsCollection.count()
    if (countResult.total > 0) {
      return { success: true, message: '地区数据已存在，无需重复初始化。', skipped: true }
    }

    // 加载数据源
    const regionData = await loadRegionData(event)
    if (!Array.isArray(regionData) || regionData.length === 0) {
      throw new Error('地区数据为空，请检查数据源')
    }

    // 逐条插入（避免 add 批量插入不兼容问题），控制并发
    const concurrency = 20
    let index = 0

    async function worker() {
      while (index < regionData.length) {
        const i = index++
        const doc = regionData[i]
        try {
          await regionsCollection.add({ data: doc })
          if ((i + 1) % 100 === 0 || i === regionData.length - 1) {
            console.log(`已插入 ${i + 1} / ${regionData.length}`)
          }
        } catch (e) {
          console.error('插入失败:', e, 'doc:', doc)
          // 不中断，继续插入
        }
      }
    }

    const workers = Array.from({ length: concurrency }, () => worker())
    await Promise.all(workers)

    return { success: true, message: `成功插入 ${regionData.length} 条地区数据。` }
  } catch (error) {
    console.error('初始化地区数据失败:', error)
    return { success: false, error: error.message }
  }
}

