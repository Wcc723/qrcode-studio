import { ViteSSG } from 'vite-ssg'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { routes } from './router'
import zhTW from './locales/zh-TW'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import 'uno.css'
import './styles/main.css'

export const createApp = ViteSSG(
  App,
  // vite-ssg 的 createWebHistory(routerOptions.base) 不會自動吃 Vite 的 base，
  // 漏了會讓 client 端 matcher 命不到路由（白畫面），SSG HTML 的 <a href> 也全部少前綴。
  // router.ts 內的 path 一律不加前綴。
  { routes, base: import.meta.env.BASE_URL },
  ({ app }) => {
    const i18n = createI18n({ legacy: false, locale: 'zh-TW', fallbackLocale: 'zh-TW', messages: { 'zh-TW': zhTW } })
    app.use(i18n)
  },
)
