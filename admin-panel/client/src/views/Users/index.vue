<template>
  <div class="users-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="loadUsers">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="search-section">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="用户名/手机号/姓名"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px">
              <el-option label="正常" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>

          <el-form-item label="企业" v-if="authStore.isRoot">
            <el-select v-model="searchForm.organizationId" placeholder="选择企业" clearable style="width: 200px">
              <el-option
                v-for="org in organizations"
                :key="org.id"
                :label="org.name"
                :value="org.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="nickName" label="用户名" min-width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar size="small" :src="row.avatarUrl" :icon="UserFilled" />
              <span class="username">{{ row.nickName || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="realName" label="真实姓名" min-width="100">
          <template #default="{ row }">
            <span v-if="row.realNameVerified" class="verified-name">
              {{ row.realName }}
              <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
            </span>
            <span v-else class="unverified">未实名</span>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="手机号" min-width="120" />

        <el-table-column prop="balance" label="余额" min-width="100">
          <template #default="{ row }">
            <span class="balance">{{ formatMoney(row.balance) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="organizationName" label="所属企业" min-width="150" v-if="authStore.isRoot" />

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewUser(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Search,
  RefreshLeft,
  UserFilled,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { formatMoney, formatDateTime, getStatusType, getStatusText } from '@/utils'
import type { User } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// 数据状态
const loading = ref(false)
const userList = ref<User[]>([])
const organizations = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  search: '',
  status: 'active',
  organizationId: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const response = await usersApi.getUsers(params)
    if (response.success && response.data) {
      userList.value = response.data.users || []
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    search: '',
    status: 'active',
    organizationId: ''
  })
  pagination.page = 1
  loadUsers()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

// 查看用户详情
const viewUser = (user: User) => {
  router.push(`/users/${user.id}`)
}

// 页面初始化
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.verified-name {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #52c41a;
}

.unverified {
  color: #999;
}

.balance {
  font-weight: 600;
  color: #1890ff;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section .el-form {
    display: block;
  }
  
  .search-section .el-form-item {
    display: block;
    margin-bottom: 12px;
  }
  
  .pagination-container {
    text-align: center;
  }
}
</style>
