<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside 
        :width="sidebarWidth" 
        :class="{ 'collapsed': appStore.sidebarCollapsed }"
        class="layout-sidebar"
      >
        <Sidebar />
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="layout-main">
        <!-- 顶部导航栏 -->
        <el-header class="layout-header">
          <Header />
        </el-header>

        <!-- 内容区域 -->
        <el-main class="layout-content">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-container" v-if="breadcrumbs.length > 0">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item 
                v-for="(item, index) in breadcrumbs" 
                :key="index"
                :to="item.path"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>

          <!-- 页面内容 -->
          <div class="page-content">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="appStore.device === 'mobile' && !appStore.sidebarCollapsed"
      class="mobile-overlay"
      @click="appStore.setSidebarCollapsed(true)"
    />

    <!-- 全局加载遮罩 -->
    <div v-if="appStore.pageLoading" class="page-loading">
      <div class="loading-spinner">
        <el-icon class="is-loading" size="24">
          <Loading />
        </el-icon>
      </div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const appStore = useAppStore()

// 侧边栏宽度
const sidebarWidth = computed(() => {
  return appStore.sidebarCollapsed ? '64px' : '240px'
})

// 面包屑导航
const breadcrumbs = computed(() => appStore.breadcrumbs)
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  background: #001529;
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.layout-main {
  flex: 1;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0;
  height: 60px !important;
  line-height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 999;
}

.layout-content {
  background: #f5f5f5;
  padding: 0;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.breadcrumb-container {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 0;
}

.page-content {
  padding: 20px;
  min-height: calc(100vh - 60px - 45px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1001;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .layout-sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  .layout-main {
    margin-left: 0 !important;
  }
  
  .page-content {
    padding: 15px;
  }
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 页面加载遮罩 */
.page-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.page-loading p {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner .el-icon.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 暗色主题适配 */
.dark .layout-header {
  background: #1f1f1f;
  border-bottom-color: #333;
}

.dark .layout-content {
  background: #141414;
}

.dark .breadcrumb-container {
  background: #1f1f1f;
  border-bottom-color: #333;
}

.dark .page-loading {
  background: rgba(0, 0, 0, 0.9);
}

.dark .page-loading p {
  color: #ccc;
}
</style>
