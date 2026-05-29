import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import TypeLandingPage from '@/pages/TypeLandingPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import { qrTypes } from '@/config/qr-types'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  ...qrTypes.map<RouteRecordRaw>(t => ({ path: t.path, name: t.routeName, component: TypeLandingPage })),
  { path: '/guide/:slug', name: 'guide', component: () => import('@/pages/GuidePage.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/pages/PrivacyPage.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/pages/FaqPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundPage },
]
