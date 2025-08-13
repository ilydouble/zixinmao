import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'

// 创建应用实例
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化应用
const initApp = async () => {
  const authStore = useAuthStore()
  const appStore = useAppStore()
  
  // 初始化应用设置
  appStore.initApp()
  
  // 初始化认证状态
  try {
    await authStore.initAuth()
  } catch (error) {
    console.error('初始化认证状态失败:', error)
  }
}

// 启动应用
initApp().then(() => {
  app.mount('#app')
})

export default app
