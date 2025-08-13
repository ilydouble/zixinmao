<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :xs="24" :lg="8">
        <el-card class="profile-card card-shadow">
          <div class="profile-header">
            <el-avatar size="80" :icon="UserFilled" />
            <div class="profile-info">
              <h3>{{ authStore.user?.username }}</h3>
              <p>{{ getRoleText(authStore.user?.role) }}</p>
              <el-tag 
                :type="authStore.user?.role === 'root' ? 'danger' : 'primary'"
                size="small"
              >
                {{ authStore.user?.role === 'root' ? '系统管理员' : '企业管理员' }}
              </el-tag>
            </div>
          </div>
          
          <el-divider />
          
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-label">登录时间</div>
              <div class="stat-value">{{ formatDateTime(new Date()) }}</div>
            </div>
            <div class="stat-item" v-if="authStore.user?.organizationName">
              <div class="stat-label">所属企业</div>
              <div class="stat-value">{{ authStore.user.organizationName }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">权限数量</div>
              <div class="stat-value">{{ authStore.user?.permissions?.length || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 设置表单 -->
      <el-col :xs="24" :lg="16">
        <el-card class="settings-card card-shadow">
          <template #header>
            <div class="card-header">
              <span>个人设置</span>
            </div>
          </template>

          <el-tabs v-model="activeTab" class="profile-tabs">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicRules"
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input 
                    v-model="basicForm.username" 
                    disabled
                    placeholder="用户名不可修改"
                  />
                </el-form-item>

                <el-form-item label="角色">
                  <el-input 
                    :value="getRoleText(authStore.user?.role)" 
                    disabled
                  />
                </el-form-item>

                <el-form-item label="所属企业" v-if="authStore.user?.organizationName">
                  <el-input 
                    :value="authStore.user.organizationName" 
                    disabled
                  />
                </el-form-item>

                <el-form-item label="权限列表">
                  <div class="permissions-list">
                    <el-tag 
                      v-for="permission in authStore.user?.permissions" 
                      :key="permission"
                      size="small"
                      class="permission-tag"
                    >
                      {{ getPermissionText(permission) }}
                    </el-tag>
                    <el-tag v-if="authStore.isRoot" type="danger" size="small">
                      所有权限
                    </el-tag>
                  </div>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 修改密码 -->
            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    show-password
                    placeholder="请输入当前密码"
                  />
                </el-form-item>

                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    show-password
                    placeholder="请输入新密码"
                  />
                </el-form-item>

                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    show-password
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button 
                    type="primary" 
                    :loading="passwordLoading"
                    @click="handleChangePassword"
                  >
                    修改密码
                  </el-button>
                  <el-button @click="resetPasswordForm">
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 系统设置 -->
            <el-tab-pane label="系统设置" name="system">
              <el-form label-width="100px" class="profile-form">
                <el-form-item label="主题模式">
                  <el-radio-group v-model="themeMode" @change="handleThemeChange">
                    <el-radio label="light">亮色主题</el-radio>
                    <el-radio label="dark">暗色主题</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="侧边栏">
                  <el-switch
                    v-model="sidebarCollapsed"
                    active-text="收起"
                    inactive-text="展开"
                    @change="handleSidebarChange"
                  />
                </el-form-item>

                <el-form-item label="语言设置">
                  <el-select v-model="language" placeholder="选择语言" disabled>
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { formatDateTime } from '@/utils'

const authStore = useAuthStore()
const appStore = useAppStore()

// 当前激活的标签页
const activeTab = ref('basic')

// 基本信息表单
const basicFormRef = ref<FormInstance>()
const basicForm = reactive({
  username: authStore.user?.username || ''
})

const basicRules: FormRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' }
  ]
}

// 修改密码表单
const passwordFormRef = ref<FormInstance>()
const passwordLoading = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '新密码至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 系统设置
const themeMode = ref(appStore.theme)
const sidebarCollapsed = ref(appStore.sidebarCollapsed)
const language = ref(appStore.locale)

// 获取角色文本
const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    root: '系统管理员',
    company_admin: '企业管理员'
  }
  return roleMap[role || ''] || role
}

// 获取权限文本
const getPermissionText = (permission: string) => {
  const permissionMap: Record<string, string> = {
    user_management: '用户管理',
    price_setting: '价格设置',
    data_statistics: '数据统计'
  }
  return permissionMap[permission] || permission
}

// 处理修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true

    await authStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )

    ElMessage.success('密码修改成功')
    resetPasswordForm()

  } catch (error: any) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.message || '修改密码失败')
  } finally {
    passwordLoading.value = false
  }
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.resetFields()
}

// 处理主题切换
const handleThemeChange = (theme: string) => {
  appStore.setTheme(theme as 'light' | 'dark')
}

// 处理侧边栏切换
const handleSidebarChange = (collapsed: boolean) => {
  appStore.setSidebarCollapsed(collapsed)
}
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.profile-info p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.profile-stats {
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

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.settings-card {
  min-height: 500px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.profile-tabs {
  margin-top: 20px;
}

.profile-form {
  max-width: 500px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .profile-form {
    max-width: none;
  }
}

/* 暗色主题适配 */
.dark .profile-info h3 {
  color: #ccc;
}

.dark .profile-info p {
  color: #999;
}

.dark .card-header {
  color: #ccc;
}

.dark .stat-label {
  color: #999;
}

.dark .stat-value {
  color: #ccc;
}

.dark .stat-item {
  border-bottom-color: #333;
}
</style>
