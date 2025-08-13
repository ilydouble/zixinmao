import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表板',
          icon: 'DataBoard'
        }
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/Users/index.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          permissions: ['user_management']
        }
      },
      {
        path: '/users/:id',
        name: 'UserDetail',
        component: () => import('@/views/Users/Detail.vue'),
        meta: {
          title: '用户详情',
          hidden: true,
          permissions: ['user_management']
        }
      },
      {
        path: '/organizations',
        name: 'Organizations',
        component: () => import('@/views/Organizations/index.vue'),
        meta: {
          title: '企业管理',
          icon: 'OfficeBuilding',
          roles: ['root']
        }
      },
      {
        path: '/organizations/:id',
        name: 'OrganizationDetail',
        component: () => import('@/views/Organizations/Detail.vue'),
        meta: {
          title: '企业详情',
          hidden: true,
          roles: ['root']
        }
      },
      {
        path: '/admins',
        name: 'Admins',
        component: () => import('@/views/Admins/index.vue'),
        meta: {
          title: '管理员管理',
          icon: 'UserFilled',
          roles: ['root']
        }
      },
      {
        path: '/system',
        name: 'System',
        redirect: '/system/logs',
        meta: {
          title: '系统管理',
          icon: 'Setting'
        },
        children: [
          {
            path: '/system/logs',
            name: 'SystemLogs',
            component: () => import('@/views/System/Logs.vue'),
            meta: {
              title: '操作日志',
              roles: ['root']
            }
          },
          {
            path: '/system/config',
            name: 'SystemConfig',
            component: () => import('@/views/System/Config.vue'),
            meta: {
              title: '系统配置',
              roles: ['root']
            }
          }
        ]
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: {
          title: '个人设置',
          hidden: true
        }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Error/403.vue'),
    meta: {
      title: '权限不足'
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: {
      title: '页面不存在'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const appStore = useAppStore()
  
  // 设置页面加载状态
  appStore.setPageLoading(true)
  
  // 设置页面标题
  document.title = to.meta.title 
    ? `${to.meta.title} - 资信猫管理系统` 
    : '资信猫管理系统'

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      next('/login')
      return
    }

    // 检查角色权限
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userRole = authStore.user?.role
      if (!userRole || !to.meta.roles.includes(userRole)) {
        next('/403')
        return
      }
    }

    // 检查功能权限
    if (to.meta.permissions && to.meta.permissions.length > 0) {
      const hasPermission = authStore.hasAnyPermission(to.meta.permissions as string[])
      if (!hasPermission) {
        next('/403')
        return
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
    return
  }

  next()
})

router.afterEach((to) => {
  const appStore = useAppStore()
  
  // 关闭页面加载状态
  appStore.setPageLoading(false)
  
  // 生成面包屑导航
  const breadcrumbs = []
  const matched = to.matched.filter(item => item.meta && item.meta.title)
  
  for (const route of matched) {
    if (route.meta?.title) {
      breadcrumbs.push({
        title: route.meta.title as string,
        path: route.path === to.path ? undefined : route.path
      })
    }
  }
  
  appStore.setBreadcrumbs(breadcrumbs)
})

export default router
