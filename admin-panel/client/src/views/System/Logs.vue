<template>
  <div class="logs-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <el-button @click="loadLogs">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline>
          <el-form-item label="管理员角色">
            <el-select v-model="filterForm.adminRole" placeholder="选择角色" clearable style="width: 150px">
              <el-option label="系统管理员" value="root" />
              <el-option label="企业管理员" value="company_admin" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.action" placeholder="选择操作" clearable style="width: 150px">
              <el-option label="登录" value="login" />
              <el-option label="退出" value="logout" />
              <el-option label="创建" value="create" />
              <el-option label="更新" value="update" />
              <el-option label="删除" value="delete" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="模块">
            <el-select v-model="filterForm.module" placeholder="选择模块" clearable style="width: 150px">
              <el-option label="认证" value="auth" />
              <el-option label="用户" value="user" />
              <el-option label="企业" value="organization" />
              <el-option label="管理员" value="admin" />
              <el-option label="系统" value="system" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleFilter">
              <el-icon><Search /></el-icon>
              筛选
            </el-button>
            <el-button @click="resetFilter">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志列表 -->
      <el-table
        v-loading="loading"
        :data="logList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="adminUsername" label="管理员" width="120" />
        
        <el-table-column prop="adminRole" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.adminRole === 'root' ? 'danger' : 'primary'" size="small">
              {{ row.adminRole === 'root' ? '系统管理员' : '企业管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getActionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ getModuleText(row.module) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="details" label="详情" min-width="200" />
        
        <el-table-column prop="result" label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="ipAddress" label="IP地址" width="120" />
        
        <el-table-column prop="createdAt" label="操作时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
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
import { ElMessage } from 'element-plus'
import { Refresh, Search, RefreshLeft } from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import { formatDateTime } from '@/utils'

// 数据状态
const loading = ref(false)
const logList = ref<any[]>([])

// 筛选表单
const filterForm = reactive({
  adminRole: '',
  action: '',
  module: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取操作文本
const getActionText = (action: string) => {
  const map: Record<string, string> = {
    login: '登录',
    logout: '退出',
    create: '创建',
    update: '更新',
    delete: '删除',
    create_admin: '创建管理员',
    update_admin: '更新管理员',
    delete_admin: '删除管理员',
    reset_password: '重置密码',
    change_password: '修改密码',
    create_organization: '创建企业',
    update_price: '更新价格'
  }
  return map[action] || action
}

// 获取模块文本
const getModuleText = (module: string) => {
  const map: Record<string, string> = {
    auth: '认证',
    user: '用户',
    organization: '企业',
    admin: '管理员',
    system: '系统'
  }
  return map[module] || module
}

// 加载日志列表
const loadLogs = async () => {
  loading.value = true
  try {
    // 过滤掉空值参数
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    // 只添加非空的筛选参数
    if (filterForm.adminRole) {
      params.adminRole = filterForm.adminRole
    }
    if (filterForm.action) {
      params.action = filterForm.action
    }
    if (filterForm.module) {
      params.module = filterForm.module
    }

    const response = await systemApi.getLogs(params)
    if (response.success && response.data) {
      logList.value = response.data.logs || []
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('加载日志列表失败:', error)
    ElMessage.error('加载日志列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选
const handleFilter = () => {
  pagination.page = 1
  loadLogs()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    adminRole: '',
    action: '',
    module: ''
  })
  pagination.page = 1
  loadLogs()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadLogs()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadLogs()
}

// 页面初始化
onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.logs-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
