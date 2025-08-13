<template>
  <div class="organizations-page">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <span>企业管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              新增企业
            </el-button>
            <el-button @click="loadOrganizations">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 企业列表 -->
      <el-table
        v-loading="loading"
        :data="organizationList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="企业名称" min-width="200">
          <template #default="{ row }">
            <div class="org-info">
              <el-icon size="20" color="#1890ff"><OfficeBuilding /></el-icon>
              <span class="org-name">{{ row.name }}</span>
              <el-tag v-if="row.isDefault" type="warning" size="small">默认</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="企业代码" width="120" />

        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type === 'company' ? '企业' : '其他' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="coinPrice" label="资信币价格" width="120">
          <template #default="{ row }">
            <span class="price">{{ formatMoney(row.coinPrice) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" width="80" />

        <el-table-column prop="createdAt" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewOrganization(row)">
              查看
            </el-button>
            <el-button type="text" size="small" @click="editPrice(row)">
              设置价格
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

    <!-- 创建企业对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新增企业"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="企业名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入企业名称" />
        </el-form-item>
        
        <el-form-item label="企业代码" prop="code">
          <el-input v-model="createForm.code" placeholder="请输入企业代码" />
        </el-form-item>
        
        <el-form-item label="企业描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入企业描述"
          />
        </el-form-item>
        
        <el-form-item label="法人代表">
          <el-input v-model="createForm.legalPerson" placeholder="请输入法人代表" />
        </el-form-item>
        
        <el-form-item label="联系电话">
          <el-input v-model="createForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="联系邮箱">
          <el-input v-model="createForm.contactEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 设置价格对话框 -->
    <el-dialog
      v-model="priceDialogVisible"
      title="设置资信币价格"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="priceFormRef"
        :model="priceForm"
        :rules="priceRules"
        label-width="100px"
      >
        <el-form-item label="企业名称">
          <el-input :value="currentOrg?.name" disabled />
        </el-form-item>
        
        <el-form-item label="当前价格">
          <el-input :value="formatMoney(currentOrg?.coinPrice || 0)" disabled />
        </el-form-item>
        
        <el-form-item label="新价格" prop="coinPrice">
          <el-input-number
            v-model="priceForm.coinPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="priceLoading" @click="handleUpdatePrice">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Refresh,
  OfficeBuilding
} from '@element-plus/icons-vue'
import { organizationsApi } from '@/api/organizations'
import { formatMoney, formatDateTime, getStatusType, getStatusText } from '@/utils'
import type { Organization } from '@/types'

const router = useRouter()

// 数据状态
const loading = ref(false)
const organizationList = ref<Organization[]>([])

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 创建企业对话框
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  name: '',
  code: '',
  description: '',
  legalPerson: '',
  contactPhone: '',
  contactEmail: ''
})

const createRules: FormRules = {
  name: [
    { required: true, message: '请输入企业名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入企业代码', trigger: 'blur' }
  ]
}

// 设置价格对话框
const priceDialogVisible = ref(false)
const priceLoading = ref(false)
const priceFormRef = ref<FormInstance>()
const currentOrg = ref<Organization | null>(null)
const priceForm = reactive({
  coinPrice: 0
})

const priceRules: FormRules = {
  coinPrice: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ]
}

// 加载企业列表
const loadOrganizations = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: 'active'
    }
    
    const response = await organizationsApi.getOrganizations(params)
    if (response.success && response.data) {
      organizationList.value = response.data.organizations || []
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('加载企业列表失败:', error)
    ElMessage.error('加载企业列表失败')
  } finally {
    loading.value = false
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  createDialogVisible.value = true
}

// 处理创建企业
const handleCreate = async () => {
  if (!createFormRef.value) return

  try {
    await createFormRef.value.validate()
    
    createLoading.value = true
    await organizationsApi.createOrganization(createForm)
    
    ElMessage.success('企业创建成功')
    createDialogVisible.value = false
    
    // 重置表单
    Object.assign(createForm, {
      name: '',
      code: '',
      description: '',
      legalPerson: '',
      contactPhone: '',
      contactEmail: ''
    })
    
    // 重新加载列表
    loadOrganizations()
    
  } catch (error: any) {
    console.error('创建企业失败:', error)
    ElMessage.error(error.message || '创建企业失败')
  } finally {
    createLoading.value = false
  }
}

// 编辑价格
const editPrice = (org: Organization) => {
  currentOrg.value = org
  priceForm.coinPrice = org.coinPrice
  priceDialogVisible.value = true
}

// 处理更新价格
const handleUpdatePrice = async () => {
  if (!priceFormRef.value || !currentOrg.value) return

  try {
    await priceFormRef.value.validate()
    
    priceLoading.value = true
    await organizationsApi.updateOrganizationPrice(currentOrg.value.id, {
      coinPrice: priceForm.coinPrice
    })
    
    ElMessage.success('价格更新成功')
    priceDialogVisible.value = false
    
    // 重新加载列表
    loadOrganizations()
    
  } catch (error: any) {
    console.error('更新价格失败:', error)
    ElMessage.error(error.message || '更新价格失败')
  } finally {
    priceLoading.value = false
  }
}

// 查看企业详情
const viewOrganization = (org: Organization) => {
  router.push(`/organizations/${org.id}`)
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadOrganizations()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOrganizations()
}

// 页面初始化
onMounted(() => {
  loadOrganizations()
})
</script>

<style scoped>
.organizations-page {
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

.org-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-name {
  font-weight: 500;
}

.price {
  font-weight: 600;
  color: #1890ff;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
