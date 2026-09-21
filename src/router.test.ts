import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes, routerOptions, guideGuard } from './router'

describe('routes', () => {
  it('包含首頁與 7 個類型 landing', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/')
    for (const p of ['/url', '/wifi', '/vcard', '/text', '/email', '/phone', '/sms']) {
      expect(paths).toContain(p)
    }
  })
})

describe('barcode 路由', () => {
  it('包含 /barcode 靜態路由（可被 vite-ssg 預渲染）', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/barcode')
  })
  it('/barcode 不含動態參數，includedRoutes 才會收它', () => {
    const r = routes.find(r => r.path === '/barcode')
    expect(r).toBeDefined()
    expect(r!.path).not.toContain(':')
  })
  it('/barcode 不加子路徑前綴（前綴由 router base 提供）', () => {
    expect(routes.some(r => r.path === '/qrcode-studio/barcode')).toBe(false)
  })
})

describe('scan 路由', () => {
  it('包含 /scan 靜態路由（可被 vite-ssg 預渲染）', () => {
    const paths = routes.map(r => r.path)
    expect(paths).toContain('/scan')
  })

  it('/scan 走 route-level lazy loading：component 必須是函式', () => {
    const r = routes.find(r => r.path === '/scan')
    expect(typeof r!.component).toBe('function')
  })

  it('/scan 不含動態參數，includedRoutes 才會收它', () => {
    expect(routes.find(r => r.path === '/scan')!.path).not.toContain(':')
  })

  it('/scan 不加子路徑前綴（前綴由 router base 提供）', () => {
    expect(routes.some(r => r.path === '/qrcode-studio/scan')).toBe(false)
  })

  it('路徑集合與預期一致（新增路由要同步改這裡與 scripts/seo/audit.mjs 的 EXPECTED_PATHS）', () => {
    expect(routes.map(r => r.path).sort()).toEqual([
      '/', '/:pathMatch(.*)*', '/about', '/barcode', '/email', '/faq', '/guide', '/guide/:slug',
      '/phone', '/privacy', '/scan', '/sms', '/text', '/url', '/vcard', '/wifi',
    ])
  })
})

describe('教學總覽 /guide', () => {
  it('排在 /guide/:slug 前面、lazy loading、不含動態參數', () => {
    const paths = routes.map(r => r.path)
    expect(paths.indexOf('/guide')).toBeLessThan(paths.indexOf('/guide/:slug'))
    const r = routes.find(r => r.path === '/guide')!
    expect(typeof r.component).toBe('function')
    expect(r.path).not.toContain(':')
  })
})

describe('router 行為', () => {
  const makeRouter = () => createRouter({ history: createMemoryHistory(), ...routerOptions })

  it('不存在的教學 slug 交給 404 頁，網址維持原樣', async () => {
    const router = makeRouter()
    await router.push('/guide/not-a-guide/')
    expect(router.currentRoute.value.name).toBe('notfound')
    expect(router.currentRoute.value.fullPath).toBe('/guide/not-a-guide/')
  })

  it('Object 原型上的屬性名（constructor）不會被當成教學', async () => {
    const router = makeRouter()
    await router.push('/guide/constructor')
    expect(router.currentRoute.value.name).toBe('notfound')
  })

  it('存在的教學照常進文章頁', async () => {
    const router = makeRouter()
    await router.push('/guide/what-is-qr-code/')
    expect(router.currentRoute.value.name).toBe('guide')
  })

  it('大小寫不同就是 404（sensitive），不會在 404 回應上畫出產生器', async () => {
    const router = makeRouter()
    await router.push('/WIFI/')
    expect(router.currentRoute.value.name).toBe('notfound')
    await router.push('/wifi/')
    expect(router.currentRoute.value.name).toBe('wifi')
  })

  it('guideGuard 對存在的 slug 放行', () => {
    const to = makeRouter().resolve('/guide/qr-code-svg/')
    expect(guideGuard(to)).toBe(true)
  })
})
