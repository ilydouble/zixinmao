<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-image">
        <el-icon size="120" color="#faad14">
          <Lock />
        </el-icon>
      </div>
      
      <div class="error-info">
        <h1 class="error-code">403</h1>
        <h2 class="error-title">权限不足</h2>
        <p class="error-desc">
          抱歉，您没有权限访问此页面。<br>
          请联系管理员获取相应权限。
        </p>
        
        <div class="error-actions">
          <el-button type="primary" @click="goBack">
            返回上页
          </el-button>
          <el-button @click="goHome">
            回到首页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-image {
  margin-bottom: 40px;
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  color: #faad14;
  margin: 0 0 16px 0;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.error-desc {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 40px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 480px) {
  .error-code {
    font-size: 56px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
}
</style>
