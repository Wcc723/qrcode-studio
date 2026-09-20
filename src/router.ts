import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import TypeLandingPage from '@/pages/TypeLandingPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { qrTypes } from '@/config/qr-types'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  ...qrTypes.map<RouteRecordRaw>(t => ({ path: t.path, name: t.routeName, component: TypeLandingPage })),
  // 動態 import：條碼編碼器與這一頁不能進 entry chunk。HomePage 與 TypeLandingPage
  // 是靜態 import，所以它們一定在 app-*.js 內；這一頁刻意不是。
  { path: '/barcode', name: 'barcode', component: () => import('@/pages/BarcodePage.vue') },
  // 同上：解碼器（zxing-wasm reader ＋ WASM）不能進 entry chunk，這一頁也必須是動態 import。
  { path: '/scan', name: 'scan', component: () => import('@/pages/ScanPage.vue') },
  { path: '/guide/:slug', name: 'guide', component: () => import('@/pages/GuidePage.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyPage.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/pages/FaqPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage },
]
