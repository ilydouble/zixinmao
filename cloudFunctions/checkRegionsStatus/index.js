const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  try {
    const coll = db.collection('regions')

    const provincesCountRes = await coll.where({ parent_code: '0' }).count()
    const citiesCountRes = await coll.where({ parent_code: db.command.neq('0') }).count()

    const provincesSample = await coll.where({ parent_code: '0' }).orderBy('code', 'asc').limit(10).get()
    const citiesSample = await coll.where({ parent_code: db.command.neq('0') }).orderBy('code', 'asc').limit(10).get()

    return {
      success: true,
      message: 'regions 集合状态',
      stats: {
        provinces: provincesCountRes.total,
        cities: citiesCountRes.total,
        total: provincesCountRes.total + citiesCountRes.total,
      },
      samples: {
        provinces: provincesSample.data,
        cities: citiesSample.data,
      }
    }
  } catch (e) {
    console.error('[checkRegionsStatus] error:', e)
    return { success: false, error: e.message }
  }
}

