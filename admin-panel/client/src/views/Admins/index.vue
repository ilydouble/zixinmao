<template>
  <div class="admins-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>管理员管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              新增管理员
            </el-button>
            <el-button @click="loadAdmins">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 管理员列表 -->
      <el-table
        v-loading="loading"
        :data="adminList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="organizationName" label="所属企业" min-width="200" />
        <el-table-column prop="permissions" label="权限" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="permission in row.permissions"
              :key="permission"
              size="small"
              style="margin-right: 4px;"
            >
              {{ getPermissionText(permission) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="editAdmin(row)">
              编辑
            </el-button>
            <el-button type="text" size="small" @click="resetPassword(row)">
              重置密码
            </el-button>
            <el-button type="text" size="small" @click="deleteAdmin(row)" style="color: #f56c6c;">
              删除
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

    <!-- 创建/编辑管理员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '新增管理员'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        
        <el-form-item label="所属企业" prop="organizationId">
          <el-select v-model="form.organizationId" placeholder="选择企业" style="width: 100%">
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="权限" prop="permissions">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox label="user_management">用户管理</el-checkbox>
            <el-checkbox label="price_setting">价格设置</el-checkbox>
            <el-checkbox label="data_statistics">数据统计</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="状态" v-if="isEdit">
          <el-radio-group v-model="form.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { adminsApi } from '@/api/admins'
import { organizationsApi } from '@/api/organizations'
import { formatDateTime, getStatusType, getStatusText } from '@/utils'

// 数据状态
const loading = ref(false)
const adminList = ref<any[]>([])
const organizations = ref<any[]>([])

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const currentAdmin = ref<any>(null)

// 表单数据
const form = reactive({
  username: '',
  password: '',
  organizationId: '',
  permissions: [] as string[],
  status: 'active'
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' }
  ],
  organizationId: [
    { required: true, message: '请选择企业', trigger: 'change' }
  ],
  permissions: [
    { required: true, message: '请选择权限', trigger: 'change' }
  ]
}

// 获取权限文本
const getPermissionText = (permission: string) => {
  const map: Record<string, string> = {
    user_management: '用户管理',
    price_setting: '价格设置',
    data_statistics: '数据统计'
  }
  return map[permission] || permission
}

// 加载管理员列表
const loadAdmins = async () => {
  loading.value = true
  try {
    const response = await adminsApi.getAdmins({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (response.success && response.data) {
      adminList.value = response.data.admins || []
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('加载管理员列表失败:', error)
    ElMessage.error('加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 加载企业列表
const loadOrganizations = async () => {
  try {
    const response = await organizationsApi.getOrganizations({ status: 'active' })
    if (response.success && response.data) {
      organizations.value = response.data.organizations || []
    }
  } catch (error) {
    console.error('加载企业列表失败:', error)
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑管理员
const editAdmin = (admin: any) => {
  isEdit.value = true
  currentAdmin.value = admin
  Object.assign(form, {
    username: admin.username,
    organizationId: admin.organizationId,
    permissions: admin.permissions || [],
    status: admin.status || 'active'
  })
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    username: '',
    password: '',
    organizationId: '',
    permissions: [],
    status: 'active'
  })
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitLoading.value = true

    if (isEdit.value) {
      // 编辑管理员
      await adminsApi.updateAdmin(currentAdmin.value.id, {
        permissions: form.permissions,
        status: form.status
      })
      ElMessage.success('管理员更新成功')
    } else {
      // 创建管理员
      await adminsApi.createAdmin(form)
      ElMessage.success('管理员创建成功')
    }

    dialogVisible.value = false
    loadAdmins()

  } catch (error: any) {
    console.error('操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 重置密码
const resetPassword = (admin: any) => {
  ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputValidator: (value) => {
      if (!value || value.length < 8) {
        return '密码至少8位'
      }
      return true
    }
  }).then(async ({ value }) => {
    try {
      await adminsApi.resetAdminPassword(admin.id, { newPassword: value })
      ElMessage.success('密码重置成功')
    } catch (error: any) {
      ElMessage.error(error.message || '密码重置失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 删除管理员
const deleteAdmin = (admin: any) => {
  ElMessageBox.confirm(
    `确定要删除管理员 "${admin.username}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await adminsApi.deleteAdmin(admin.id)
      ElMessage.success('管理员删除成功')
      loadAdmins()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadAdmins()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadAdmins()
}

// 页面初始化
onMounted(() => {
  loadAdmins()
  loadOrganizations()
})
</script>

<style scoped>
.admins-page {
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

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
