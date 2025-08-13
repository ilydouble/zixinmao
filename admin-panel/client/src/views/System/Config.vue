<template>
  <div class="config-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
          <el-button @click="loadConfig">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="configList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="key" label="配置键" width="200" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="配置值" min-width="200">
          <template #default="{ row }">
            <span v-if="row.key === 'root_password'">******</span>
            <span v-else>{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/utils'

// 数据状态
const loading = ref(false)
const configList = ref<any[]>([])

// 获取分类文本
const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    auth: '认证',
    price: '价格',
    system: '系统'
  }
  return map[category] || category
}

// 加载配置列表
const loadConfig = async () => {
  loading.value = true
  try {
    const response = await systemApi.getConfig()
    if (response.success && response.data) {
      configList.value = response.data
    }
  } catch (error) {
    console.error('加载系统配置失败:', error)
    ElMessage.error('加载系统配置失败')
  } finally {
    loading.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.config-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
