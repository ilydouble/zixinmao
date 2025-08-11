// 云函数：获取用户订单列表
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 获取用户订单列表云函数
 * @param {Object} event - 云函数参数
 * @param {number} event.page - 页码，从1开始
 * @param {number} event.pageSize - 每页数量，默认10
 * @param {string} event.status - 订单状态筛选，可选
 * @param {string} event.type - 订单类型筛选，可选
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { OPENID } = wxContext

    console.log('获取用户订单，用户ID:', OPENID)

    // 参数处理
    const page = Math.max(1, event.page || 1)
    const pageSize = Math.min(50, Math.max(1, event.pageSize || 10))
    const skip = (page - 1) * pageSize
    const status = event.status
    const type = event.type

    console.log('查询参数:', { page, pageSize, skip, status, type })

    // 构建查询条件
    let query = db.collection('orders').where({
      userId: OPENID
    })

    // 添加状态筛选
    if (status && status !== 'all') {
      query = query.where({
        status: status
      })
    }

    // 添加类型筛选
    if (type && type !== 'all') {
      query = query.where({
        type: type
      })
    }

    // 获取总数
    const countResult = await query.count()
    const total = countResult.total

    console.log('订单总数:', total)

    // 获取订单列表（按创建时间倒序）
    const ordersResult = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    console.log('查询到的订单数量:', ordersResult.data.length)

    // 处理订单数据
    const orders = ordersResult.data.map(order => ({
      id: order._id,
      orderNo: order.orderNo,
      type: order.type,
      productName: order.productName,
      productCode: order.productCode,
      amount: order.amount,
      originalAmount: order.originalAmount,
      discountAmount: order.discountAmount || 0,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentTime: order.paymentTime,
      description: order.description,
      remark: order.remark,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
      // 查询相关数据（仅消费订单）
      queryParams: order.queryParams,
      resultData: order.resultData
    }))

    // 计算分页信息
    const totalPages = Math.ceil(total / pageSize)
    const hasMore = page < totalPages

    return {
      success: true,
      message: '获取订单列表成功',
      data: {
        orders: orders,
        pagination: {
          page: page,
          pageSize: pageSize,
          total: total,
          totalPages: totalPages,
          hasMore: hasMore
        }
      }
    }

  } catch (error) {
    console.error('获取用户订单列表失败:', error)
    return {
      success: false,
      message: '获取订单列表失败',
      error: error.message
    }
  }
}
