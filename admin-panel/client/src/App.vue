<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

onMounted(() => {
  // 监听窗口大小变化
  const handleResize = () => {
    const width = window.innerWidth
    if (width < 768) {
      appStore.setDevice('mobile')
      appStore.setSidebarCollapsed(true)
    } else if (width < 1024) {
      appStore.setDevice('tablet')
    } else {
      appStore.setDevice('desktop')
    }
  }

  window.addEventListener('resize', handleResize)
  handleResize()

  // 清理事件监听器
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style>
#app {
  height: 100vh;
  overflow: hidden;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 暗色主题滚动条 */
.dark ::-webkit-scrollbar-track {
  background: #2c2c2c;
}

.dark ::-webkit-scrollbar-thumb {
  background: #6c6c6c;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #8c8c8c;
}

/* Element Plus 组件样式调整 */
.el-menu {
  border-right: none !important;
}

.el-menu--collapse {
  width: 64px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .el-aside {
    position: fixed !important;
    top: 0;
    left: 0;
    z-index: 1001;
    height: 100vh;
    transition: transform 0.3s;
  }
  
  .el-aside.collapsed {
    transform: translateX(-100%);
  }
  
  .el-main {
    margin-left: 0 !important;
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

/* 卡片阴影 */
.card-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 工具类 */
.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.p-20 {
  padding: 20px;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
