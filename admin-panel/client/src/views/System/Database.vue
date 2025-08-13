<template>
  <div class="database-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>数据库状态</span>
          <el-button @click="loadDatabaseStatus">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="dbStatus" class="status-section">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="6">
              <div class="status-card">
                <div class="status-icon" :class="dbStatus.status">
                  <el-icon size="24">
                    <CircleCheckFilled v-if="dbStatus.status === 'healthy'" />
                    <CircleCloseFilled v-else />
                  </el-icon>
                </div>
                <div class="status-content">
                  <div class="status-title">数据库状态</div>
                  <div class="status-value">{{ dbStatus.status === 'healthy' ? '正常' : '异常' }}</div>
                </div>
              </div>
            </el-col>
            
            <el-col :xs="24" :sm="12" :lg="6">
              <div class="status-card">
                <div class="status-icon info">
                  <el-icon size="24"><Clock /></el-icon>
                </div>
                <div class="status-content">
                  <div class="status-title">检查时间</div>
                  <div class="status-value">{{ formatDateTime(dbStatus.timestamp) }}</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <h3>数据集合统计</h3>
          <el-table :data="collectionData" stripe style="width: 100%; margin-top: 20px;">
            <el-table-column prop="name" label="集合名称" width="200">
              <template #default="{ row }">
                <el-icon style="margin-right: 8px;"><Database /></el-icon>
                {{ getCollectionName(row.name) }}
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数据量" width="150">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.count.toLocaleString() }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, CircleCheckFilled, CircleCloseFilled, Clock, Database } from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/utils'

// 数据状态
const loading = ref(false)
const dbStatus = ref<any>(null)

// 集合数据
const collectionData = computed(() => {
  if (!dbStatus.value?.collections) return []
  
  return Object.entries(dbStatus.value.collections).map(([name, count]) => ({
    name,
    count: count as number,
    description: getCollectionDescription(name)
  }))
})

// 获取集合名称
const getCollectionName = (name: string) => {
  const map: Record<string, string> = {
    users: '用户',
    organizations: '企业',
    company_admins: '企业管理员',
    admin_logs: '操作日志',
    recharge_records: '充值记录',
    orders: '订单记录',
    system_config: '系统配置',
    cities: '城市信息'
  }
  return map[name] || name
}

// 获取集合描述
const getCollectionDescription = (name: string) => {
  const map: Record<string, string> = {
    users: '小程序用户数据',
    organizations: '企业组织信息',
    company_admins: '企业管理员账户',
    admin_logs: '管理员操作日志记录',
    recharge_records: '用户充值记录',
    orders: '用户消费订单',
    system_config: '系统配置参数',
    cities: '城市基础数据'
  }
  return map[name] || '数据集合'
}

// 加载数据库状态
const loadDatabaseStatus = async () => {
  loading.value = true
  try {
    const response = await systemApi.getDatabaseStatus()
    if (response.success && response.data) {
      dbStatus.value = response.data
    }
  } catch (error) {
    console.error('加载数据库状态失败:', error)
    ElMessage.error('加载数据库状态失败')
  } finally {
    loading.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadDatabaseStatus()
})
</script>

<style scoped>
.database-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-section {
  padding: 20px 0;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.status-icon.healthy {
  background: #52c41a;
}

.status-icon.error {
  background: #f5222d;
}

.status-icon.info {
  background: #1890ff;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.status-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

h3 {
  margin: 20px 0 0 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}
</style>
