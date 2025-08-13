<template>
  <div class="organization-detail-page">
    <div class="page-header">
      <el-button @click="goBack" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回企业列表
      </el-button>
    </div>

    <div v-loading="loading">
      <el-card v-if="orgInfo" class="card-shadow">
        <template #header>
          <span>{{ orgInfo.name }} - 企业详情</span>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称">{{ orgInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="企业代码">{{ orgInfo.code }}</el-descriptions-item>
          <el-descriptions-item label="企业类型">{{ orgInfo.type }}</el-descriptions-item>
          <el-descriptions-item label="资信币价格">{{ formatMoney(orgInfo.coinPrice) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(orgInfo.status)">{{ getStatusText(orgInfo.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(orgInfo.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="企业描述" :span="2">{{ orgInfo.description || '暂无描述' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { organizationsApi } from '@/api/organizations'
import { formatMoney, formatDateTime, getStatusType, getStatusText } from '@/utils'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orgInfo = ref<any>(null)

const goBack = () => {
  router.go(-1)
}

const loadOrganizationDetail = async () => {
  const orgId = route.params.id as string
  if (!orgId) {
    ElMessage.error('企业ID无效')
    goBack()
    return
  }

  loading.value = true
  try {
    const response = await organizationsApi.getOrganizationDetail(orgId)
    if (response.success && response.data) {
      orgInfo.value = response.data.organization
    }
  } catch (error) {
    console.error('加载企业详情失败:', error)
    ElMessage.error('加载企业详情失败')
    goBack()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrganizationDetail()
})
</script>

<style scoped>
.organization-detail-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}
</style>
