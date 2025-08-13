// 云函数：更新企业资信币价格
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: 'zixinmao-6gze9a8pef07503b'
})

const db = cloud.database()

/**
 * 更新企业资信币价格
 * @param {Object} event - 云函数参数
 * @param {string} event.organizationId - 企业ID
 * @param {number} event.coinPrice - 新的资信币价格
 * @param {Object} context - 云函数上下文
 */
exports.main = async (event, context) => {
  try {
    const { organizationId, coinPrice } = event

    if (!organizationId) {
      return {
        success: false,
        message: '企业ID不能为空'
      }
    }

    if (!coinPrice || coinPrice <= 0) {
      return {
        success: false,
        message: '价格必须大于0'
      }
    }

    // 获取系统基础价格（这里可以从配置表获取，暂时硬编码）
    const BASE_PRICE = 1.0 // 基础价格1元

    if (coinPrice < BASE_PRICE) {
      return {
        success: false,
        message: `价格不能低于基础价格 ¥${BASE_PRICE}`
      }
    }

    // 更新企业价格
    const updateResult = await db.collection('organizations').doc(organizationId).update({
      data: {
        coinPrice: coinPrice,
        updatedAt: new Date()
      }
    })

    if (updateResult.stats.updated === 0) {
      return {
        success: false,
        message: '企业不存在或更新失败'
      }
    }

    return {
      success: true,
      message: '价格更新成功',
      data: {
        organizationId: organizationId,
        newPrice: coinPrice
      }
    }

  } catch (error) {
    console.error('更新企业价格失败:', error)
    return {
      success: false,
      message: '更新价格失败',
      error: error.message
    }
  }
}
