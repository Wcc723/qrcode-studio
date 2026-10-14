import { ViteSSG } from 'vite-ssg'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { routerOptions } from './router'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import { SSG_ROUTE_ATTR, shouldHydrate } from './utils/hydration'
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
  { ...routerOptions, base: import.meta.env.BASE_URL },
  ({ app, head, isClient, routePath }) => {
    // 目前語系由 App.vue 依路由的 meta.locale 設定（見 src/i18n/locale.ts）
    const i18n = createI18n({ legacy: false, locale: 'zh-TW', fallbackLocale: 'zh-TW', messages: { 'zh-TW': zhTW, en } })
    app.use(i18n)

    // 記下這份 HTML 預渲染的是哪一條路由：client 比對網址，同一頁才 hydrate（見下方第 4 個參數與
    // src/utils/hydration.ts）。routePath 是 vite.config.ts 的 includedRoutes 回傳的字串（`/wifi`、`/404`），
    // 不含 base。vite-ssg 第一次呼叫 createApp 只為了拿 routes，那次沒有 routePath，不寫。
    // seo:audit 逐頁驗這個值跟檔案路徑一致，404.html 是 `/404`。
    if (!isClient && routePath && head) head.push({ htmlAttrs: { [SSG_ROUTE_ATTR]: routePath } })
  },
  {
    // vite-ssg 的 client 預設不 hydrate，會把 #app 清掉整個重畫：多一次渲染、進場動畫重播、
    // 帶 #段落 的網址被捲回頁頂。網址跟預渲染的是同一頁時才 hydrate，404.html 這類拿別頁 HTML
    // 回應的情況照舊重畫（mismatch 時 Vue 正式版不修 class）。
    // 這個值在 main.ts 執行當下就決定。ssgOptions 的 script 是 async，模組可能在 HTML 解析完之前就跑，
    // 但 <html> 的屬性在解析到開頭標籤時就有了；#app 的內容 vite-ssg 會等 DOMContentLoaded 才掛。
    hydration:
      typeof document !== 'undefined' &&
      shouldHydrate(
        document.documentElement.getAttribute(SSG_ROUTE_ATTR),
        window.location.pathname,
        import.meta.env.BASE_URL,
      ),
  },
)
