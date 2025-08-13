<template>
  <div class="dashboard">
    <!-- 欢迎信息 -->
    <div class="welcome-card">
      <el-card class="card-shadow">
        <div class="welcome-content">
          <div class="welcome-text">
            <h2>欢迎回来，{{ authStore.user?.username }}！</h2>
            <p>{{ welcomeMessage }}</p>
          </div>
          <div class="welcome-time">
            <el-icon size="20"><Clock /></el-icon>
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card 
        v-for="stat in statsCards" 
        :key="stat.key"
        class="stat-card card-shadow"
        :body-style="{ padding: '24px' }"
      >
        <div class="stat-content">
          <div class="stat-info">
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-desc" v-if="stat.desc">{{ stat.desc }}</div>
          </div>
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <el-icon size="24" color="#fff">
              <component :is="stat.icon" />
            </el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 用户趋势图 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card card-shadow" header="用户增长趋势">
            <div class="chart-container">
              <v-chart 
                class="chart" 
                :option="userTrendOption" 
                autoresize
              />
            </div>
          </el-card>
        </el-col>

        <!-- 收入统计图 -->
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card card-shadow" header="收入统计">
            <div class="chart-container">
              <v-chart 
                class="chart" 
                :option="revenueOption" 
                autoresize
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card class="card-shadow" header="快捷操作">
        <div class="actions-grid">
          <div 
            v-for="action in quickActions" 
            :key="action.key"
            class="action-item"
            @click="handleQuickAction(action)"
          >
            <div class="action-icon">
              <el-icon size="24" :color="action.color">
                <component :is="action.icon" />
              </el-icon>
            </div>
            <div class="action-text">{{ action.title }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities" v-if="authStore.isRoot">
      <el-card class="card-shadow" header="最近活动">
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="activity.time"
            :color="activity.color"
          >
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-desc">{{ activity.desc }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <div class="view-more" v-if="recentActivities.length > 0">
          <el-button type="text" @click="$router.push('/system/logs')">
            查看更多 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Clock,
  User,
  OfficeBuilding,
  Wallet,
  TrendCharts,
  UserFilled,
  Setting,
  Document,
  ArrowRight
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { systemApi } from '@/api/system'
import { formatMoney, formatDateTime } from '@/utils'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const authStore = useAuthStore()

// 当前时间
const currentTime = ref('')
const updateTime = () => {
  currentTime.value = formatDateTime(new Date(), 'YYYY年MM月DD日 HH:mm:ss')
}

// 欢迎信息
const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 12) return '早上好，新的一天开始了'
  if (hour < 18) return '下午好，工作顺利'
  return '晚上好，辛苦了'
})

// 统计数据
const statsData = ref({
  totalUsers: 0,
  totalOrganizations: 0,
  totalAdmins: 0,
  totalBalance: 0,
  totalRecharge: 0,
  totalConsumption: 0,
  todayOperations: 0,
  verifiedUsers: 0
})

// 统计卡片
const statsCards = computed(() => {
  const cards = []
  
  if (authStore.isRoot) {
    cards.push(
      {
        key: 'users',
        title: '总用户数',
        value: statsData.value.totalUsers.toLocaleString(),
        desc: `实名用户 ${statsData.value.verifiedUsers}`,
        icon: 'User',
        color: '#1890ff'
      },
      {
        key: 'organizations',
        title: '企业数量',
        value: statsData.value.totalOrganizations.toLocaleString(),
        icon: 'OfficeBuilding',
        color: '#52c41a'
      },
      {
        key: 'balance',
        title: '总余额',
        value: formatMoney(statsData.value.totalBalance),
        desc: `充值 ${formatMoney(statsData.value.totalRecharge)}`,
        icon: 'Wallet',
        color: '#faad14'
      },
      {
        key: 'operations',
        title: '今日操作',
        value: statsData.value.todayOperations.toLocaleString(),
        icon: 'TrendCharts',
        color: '#f5222d'
      }
    )
  } else {
    cards.push(
      {
        key: 'users',
        title: '企业用户',
        value: statsData.value.totalUsers.toLocaleString(),
        desc: `实名用户 ${statsData.value.verifiedUsers}`,
        icon: 'User',
        color: '#1890ff'
      },
      {
        key: 'balance',
        title: '用户余额',
        value: formatMoney(statsData.value.totalBalance),
        desc: `充值 ${formatMoney(statsData.value.totalRecharge)}`,
        icon: 'Wallet',
        color: '#faad14'
      }
    )
  }
  
  return cards
})

// 用户趋势图配置
const userTrendOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [120, 200, 150, 80, 70, 110],
    type: 'line',
    smooth: true,
    itemStyle: {
      color: '#1890ff'
    }
  }]
})

// 收入统计图配置
const revenueOption = ref({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: '0%'
  },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 1048, name: '简信宝' },
      { value: 735, name: '专信宝' },
      { value: 580, name: '其他服务' }
    ],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
})

// 快捷操作
const quickActions = computed(() => {
  const actions = []
  
  if (authStore.isRoot) {
    actions.push(
      {
        key: 'users',
        title: '用户管理',
        icon: 'UserFilled',
        color: '#1890ff',
        path: '/users'
      },
      {
        key: 'organizations',
        title: '企业管理',
        icon: 'OfficeBuilding',
        color: '#52c41a',
        path: '/organizations'
      },
      {
        key: 'admins',
        title: '管理员',
        icon: 'Setting',
        color: '#faad14',
        path: '/admins'
      },
      {
        key: 'logs',
        title: '操作日志',
        icon: 'Document',
        color: '#f5222d',
        path: '/system/logs'
      }
    )
  } else {
    actions.push(
      {
        key: 'users',
        title: '用户管理',
        icon: 'UserFilled',
        color: '#1890ff',
        path: '/users'
      },
      {
        key: 'profile',
        title: '个人设置',
        icon: 'Setting',
        color: '#52c41a',
        path: '/profile'
      }
    )
  }
  
  return actions
})

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    title: '系统登录',
    desc: 'root 管理员登录系统',
    time: '2024-01-15 09:30',
    color: '#52c41a'
  },
  {
    id: 2,
    title: '创建企业',
    desc: '新增企业：测试科技有限公司',
    time: '2024-01-15 09:15',
    color: '#1890ff'
  },
  {
    id: 3,
    title: '用户注册',
    desc: '新用户注册：张三',
    time: '2024-01-15 09:00',
    color: '#faad14'
  }
])

// 处理快捷操作
const handleQuickAction = (action: any) => {
  if (action.path) {
    router.push(action.path)
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await systemApi.getStats()
    if (response.success && response.data) {
      Object.assign(statsData.value, response.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 定时器
let timeTimer: NodeJS.Timeout

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  loadStats()
})

onUnmounted(() => {
  if (timeTimer) {
    clearInterval(timeTimer)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.welcome-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 12px;
  color: #999;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.chart {
  height: 100%;
  width: 100%;
}

.quick-actions {
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.action-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  margin-bottom: 12px;
}

.action-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.recent-activities {
  margin-bottom: 20px;
}

.activity-content {
  padding-left: 8px;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #666;
}

.view-more {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 15px;
  }
  
  .action-item {
    padding: 15px;
  }
}

/* 暗色主题适配 */
.dark .welcome-text h2 {
  color: #ccc;
}

.dark .welcome-text p {
  color: #999;
}

.dark .stat-title {
  color: #999;
}

.dark .stat-value {
  color: #ccc;
}

.dark .action-item {
  border-color: #333;
}

.dark .action-item:hover {
  background: #2a2a2a;
}

.dark .action-text {
  color: #ccc;
}

.dark .activity-title {
  color: #ccc;
}

.dark .activity-desc {
  color: #999;
}
</style>
