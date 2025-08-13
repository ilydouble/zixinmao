<template>
  <div class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div class="logo-container">
        <el-icon size="32" color="#fff">
          <DataBoard />
        </el-icon>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">
          资信猫管理
        </span>
      </div>
    </div>

    <!-- 菜单区域 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.sidebarCollapsed"
      :unique-opened="true"
      background-color="#001529"
      text-color="#fff"
      active-text-color="#1890ff"
      class="sidebar-menu"
      router
    >
      <template v-for="item in menuList" :key="item.path">
        <!-- 有子菜单的项 -->
        <el-sub-menu 
          v-if="item.children && item.children.length > 0" 
          :index="item.path"
        >
          <template #title>
            <el-icon v-if="item.meta?.icon">
              <component :is="item.meta.icon" />
            </el-icon>
            <span>{{ item.meta?.title }}</span>
          </template>
          
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            <el-icon v-if="child.meta?.icon">
              <component :is="child.meta.icon" />
            </el-icon>
            <span>{{ child.meta?.title }}</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 单级菜单项 -->
        <el-menu-item 
          v-else-if="!item.meta?.hidden"
          :index="item.path"
        >
          <el-icon v-if="item.meta?.icon">
            <component :is="item.meta.icon" />
          </el-icon>
          <span>{{ item.meta?.title }}</span>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 用户信息区域 -->
    <div class="sidebar-user" v-if="!appStore.sidebarCollapsed">
      <div class="user-info">
        <el-avatar size="small" :icon="UserFilled" />
        <div class="user-details">
          <div class="username">{{ authStore.user?.username }}</div>
          <div class="role">{{ getRoleText(authStore.user?.role) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { UserFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// 当前激活的菜单
const activeMenu = computed(() => {
  const { path } = route
  return path
})

// 过滤菜单列表（根据权限）
const menuList = computed(() => {
  const routes = router.getRoutes()
  const layoutRoute = routes.find(r => r.name === 'Layout')
  
  if (!layoutRoute || !layoutRoute.children) {
    return []
  }

  return layoutRoute.children
    .filter(route => {
      // 过滤隐藏的菜单
      if (route.meta?.hidden) {
        return false
      }

      // 检查角色权限
      if (route.meta?.roles && route.meta.roles.length > 0) {
        const userRole = authStore.user?.role
        if (!userRole || !route.meta.roles.includes(userRole)) {
          return false
        }
      }

      // 检查功能权限
      if (route.meta?.permissions && route.meta.permissions.length > 0) {
        const hasPermission = authStore.hasAnyPermission(route.meta.permissions as string[])
        if (!hasPermission) {
          return false
        }
      }

      return true
    })
    .map(route => ({
      path: route.path,
      name: route.name,
      meta: route.meta,
      children: route.children?.filter(child => {
        // 过滤子菜单的权限
        if (child.meta?.hidden) {
          return false
        }

        if (child.meta?.roles && child.meta.roles.length > 0) {
          const userRole = authStore.user?.role
          if (!userRole || !child.meta.roles.includes(userRole)) {
            return false
          }
        }

        if (child.meta?.permissions && child.meta.permissions.length > 0) {
          const hasPermission = authStore.hasAnyPermission(child.meta.permissions as string[])
          if (!hasPermission) {
            return false
          }
        }

        return true
      }).map(child => ({
        path: child.path,
        name: child.name,
        meta: child.meta
      }))
    }))
})

// 获取角色文本
const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    root: '系统管理员',
    company_admin: '企业管理员'
  }
  return roleMap[role || ''] || role
}
</script>

<style scoped>
.sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #001529;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f1f1f;
  background: #002140;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 240px;
}

.sidebar-user {
  padding: 16px;
  border-top: 1px solid #1f1f1f;
  background: #002140;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  color: #8c8c8c;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 菜单项样式调整 */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-sub-menu .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #ffffff !important;
}

:deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff !important;
}

:deep(.el-menu-item.is-active span) {
  color: #ffffff !important;
}

:deep(.el-menu-item:hover) {
  background-color: #1f1f1f !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #1f1f1f !important;
}

/* 子菜单激活状态 */
:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #ffffff !important;
}

:deep(.el-sub-menu .el-menu-item.is-active .el-icon) {
  color: #ffffff !important;
}

:deep(.el-sub-menu .el-menu-item.is-active span) {
  color: #ffffff !important;
}

/* 收起状态下的样式 */
:deep(.el-menu--collapse .el-menu-item) {
  padding: 0 20px !important;
}

:deep(.el-menu--collapse .el-sub-menu .el-sub-menu__title) {
  padding: 0 20px !important;
}

/* 滚动条样式 */
.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: #001529;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: #1f1f1f;
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: #333;
}
</style>
