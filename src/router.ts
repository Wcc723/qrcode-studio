import type { RouteRecordRaw, RouteLocationNormalized, RouterOptions } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import TypeLandingPage from '@/pages/TypeLandingPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { qrTypes } from '@/config/qr-types'
import { findGuide } from '@/content/guides'

/**
 * 不存在的教學 slug 交給 404 頁，網址維持原樣（不轉址）。
 * 沒有這層的話 GuidePage 會拿到 undefined，整頁在 client 端崩掉、console 報錯。
 */
export function guideGuard(to: Pick<RouteLocationNormalized, 'params' | 'path' | 'query' | 'hash'>) {
  if (findGuide(String(to.params.slug))) return true
  return {
    name: 'notfound',
    params: { pathMatch: to.path.substring(1).split('/') },
    query: to.query,
    hash: to.hash,
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  ...qrTypes.map<RouteRecordRaw>(t => ({ path: t.path, name: t.routeName, component: TypeLandingPage })),
  // 動態 import：條碼編碼器與這一頁不能進 entry chunk。HomePage 與 TypeLandingPage
  // 是靜態 import，所以它們一定在 app-*.js 內；這一頁刻意不是。
  { path: '/barcode', name: 'barcode', component: () => import('@/pages/BarcodePage.vue') },
  // 同上：解碼器（zxing-wasm reader ＋ WASM）不能進 entry chunk，這一頁也必須是動態 import。
  { path: '/scan', name: 'scan', component: () => import('@/pages/ScanPage.vue') },
  // 教學總覽必須排在 /guide/:slug 前面。
  { path: '/guide', name: 'guide-index', component: () => import('@/pages/GuideIndexPage.vue') },
  { path: '/guide/:slug', name: 'guide', component: () => import('@/pages/GuidePage.vue'), beforeEnter: guideGuard },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyPage.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/pages/FaqPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage },
]

/**
 * 交給 vite-ssg 的 router 選項（base 在 main.ts 另外帶）。
 * sensitive：網址大小寫要完全一致。預設不分大小寫時，/WIFI/ 伺服器回 404 頁，
 * client 端卻又把 WiFi 產生器畫出來，同一個網址兩種內容。
 */
export const routerOptions: Pick<RouterOptions, 'routes' | 'sensitive'> = { routes, sensitive: true }
