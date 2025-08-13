<template>
  <div class="user-detail-page">
    <div class="page-header">
      <el-button @click="goBack" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回用户列表
      </el-button>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20" v-if="userInfo">
        <!-- 用户基本信息 -->
        <el-col :xs="24" :lg="8">
          <el-card class="user-info-card card-shadow">
            <template #header>
              <span>用户信息</span>
            </template>
            
            <div class="user-profile">
              <el-avatar size="80" :src="userInfo.avatarUrl" :icon="UserFilled" />
              <div class="user-details">
                <h3>{{ userInfo.nickName || '未设置昵称' }}</h3>
                <p v-if="userInfo.realNameVerified" class="real-name">
                  <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
                  {{ userInfo.realName }}
                </p>
                <p v-else class="unverified">未实名认证</p>
                <el-tag :type="getStatusType(userInfo.status)" size="small">
                  {{ getStatusText(userInfo.status) }}
                </el-tag>
              </div>
            </div>

            <el-divider />

            <div class="user-stats">
              <div class="stat-item">
                <span class="label">用户ID</span>
                <span class="value">{{ userInfo.id }}</span>
              </div>
              <div class="stat-item">
                <span class="label">手机号</span>
                <span class="value">{{ userInfo.phone || '未绑定' }}</span>
              </div>
              <div class="stat-item">
                <span class="label">所属企业</span>
                <span class="value">{{ userInfo.organizationName || '未分配' }}</span>
              </div>
              <div class="stat-item">
                <span class="label">注册时间</span>
                <span class="value">{{ formatDateTime(userInfo.createdAt) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">最后登录</span>
                <span class="value">{{ userInfo.lastLoginAt ? formatDateTime(userInfo.lastLoginAt) : '从未登录' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 账户统计 -->
        <el-col :xs="24" :lg="16">
          <el-card class="stats-card card-shadow">
            <template #header>
              <span>账户统计</span>
            </template>
            
            <el-row :gutter="20">
              <el-col :xs="12" :sm="8">
                <div class="stat-box">
                  <div class="stat-icon balance">
                    <el-icon><Wallet /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">当前余额</div>
                    <div class="stat-value">{{ formatMoney(userInfo.balance) }}</div>
                  </div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8">
                <div class="stat-box">
                  <div class="stat-icon recharge">
                    <el-icon><Plus /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">累计充值</div>
                    <div class="stat-value">{{ formatMoney(userInfo.totalRecharge) }}</div>
                  </div>
                </div>
              </el-col>
              
              <el-col :xs="12" :sm="8">
                <div class="stat-box">
                  <div class="stat-icon consumption">
                    <el-icon><Minus /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">累计消费</div>
                    <div class="stat-value">{{ formatMoney(userInfo.totalConsumption) }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <!-- 最近记录 -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <!-- 充值记录 -->
            <el-col :xs="24" :lg="12">
              <el-card class="records-card card-shadow">
                <template #header>
                  <span>最近充值</span>
                </template>
                
                <div v-if="rechargeRecords.length > 0">
                  <div v-for="record in rechargeRecords" :key="record.id" class="record-item">
                    <div class="record-info">
                      <div class="record-amount">+{{ formatMoney(record.amount) }}</div>
                      <div class="record-time">{{ formatDateTime(record.createdAt) }}</div>
                    </div>
                    <el-tag :type="getStatusType(record.status)" size="small">
                      {{ getStatusText(record.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-empty v-else description="暂无充值记录" :image-size="60" />
              </el-card>
            </el-col>

            <!-- 消费记录 -->
            <el-col :xs="24" :lg="12">
              <el-card class="records-card card-shadow">
                <template #header>
                  <span>最近消费</span>
                </template>
                
                <div v-if="orders.length > 0">
                  <div v-for="order in orders" :key="order.id" class="record-item">
                    <div class="record-info">
                      <div class="record-title">{{ order.productName }}</div>
                      <div class="record-amount">-{{ formatMoney(order.amount) }}</div>
                      <div class="record-time">{{ formatDateTime(order.createdAt) }}</div>
                    </div>
                    <el-tag :type="getStatusType(order.status)" size="small">
                      {{ getStatusText(order.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-empty v-else description="暂无消费记录" :image-size="60" />
              </el-card>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  UserFilled,
  CircleCheckFilled,
  Wallet,
  Plus,
  Minus
} from '@element-plus/icons-vue'
import { usersApi } from '@/api/users'
import { formatMoney, formatDateTime, getStatusType, getStatusText } from '@/utils'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()

// 数据状态
const loading = ref(false)
const userInfo = ref<User | null>(null)
const rechargeRecords = ref<any[]>([])
const orders = ref<any[]>([])

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 加载用户详情
const loadUserDetail = async () => {
  const userId = route.params.id as string
  if (!userId) {
    ElMessage.error('用户ID无效')
    goBack()
    return
  }

  loading.value = true
  try {
    const response = await usersApi.getUserDetail(userId)
    if (response.success && response.data) {
      userInfo.value = response.data.user
      rechargeRecords.value = response.data.rechargeRecords || []
      orders.value = response.data.orders || []
    }
  } catch (error) {
    console.error('加载用户详情失败:', error)
    ElMessage.error('加载用户详情失败')
    goBack()
  } finally {
    loading.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadUserDetail()
})
</script>

<style scoped>
.user-detail-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.user-info-card {
  margin-bottom: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.user-details h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.user-details p {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.real-name {
  color: #52c41a;
  font-weight: 500;
}

.unverified {
  color: #999;
}

.user-stats {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .label {
  color: #666;
  font-size: 14px;
}

.stat-item .value {
  color: #333;
  font-weight: 500;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-icon.balance {
  background: #1890ff;
}

.stat-icon.recharge {
  background: #52c41a;
}

.stat-icon.consumption {
  background: #f5222d;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.records-card {
  height: 300px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  flex: 1;
}

.record-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-box {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .stat-value {
    font-size: 16px;
  }
}
</style>
