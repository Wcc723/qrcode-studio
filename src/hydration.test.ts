/**
 * 整頁載入時 client 沿用預渲染的 DOM（hydrate），見 src/utils/hydration.ts 與 src/main.ts。
 *
 * 這裡照 vite-ssg 的流程逐頁跑一次：先 renderToString 畫出 routePath（`/wifi`），再用線上網址的形狀
 * （`/wifi/`）在同一份 HTML 上 hydrate，驗三件事：
 *   1. 沒有 hydration mismatch（開發版 Vue 會在 console 報 Hydration ... mismatch）
 *   2. #app 底下的根節點還是預渲染的那一個，沒有被換掉
 *   3. 表單元件的選取狀態跟元件狀態一致。hydrate 不會改 <select> 的 value 與 radio、checkbox 的 checked，
 *      Firefox 重新整理時還會把上一次的選擇還原到預渲染的欄位上，所以這些欄位一律用 v-model
 *      （mounted 時把畫面對回狀態）。下面用「先改掉 DOM 再 hydrate」模擬瀏覽器的還原。
 *
 * 限制：vitest 用的是瀏覽器版的編譯結果，renderToString 走的不是 build 時的 SSR 模板。兩者輸出的 DOM
 * 幾乎一樣，但 <select v-model> 只有 SSR 模板會在選中的 <option> 加 selected，這一項由 seo:audit 驗產物。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, type App as VueApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createHead as createServerHead } from '@unhead/vue/server'
import { createHead as createClientHead } from '@unhead/vue/client'
import { createI18n } from 'vue-i18n'
import { flushPromises } from '@vue/test-utils'
import App from './App.vue'
import { routes, routerOptions } from './router'
import zhTW from './locales/zh-TW'
import { guides } from './content/guides'
import { defaultStyle } from './types'

vi.mock('qr-code-styling', () => ({
  default: class { append() {} update() {} download() {} },
}))

const BASE = '/qrcode-studio/'

/** 跟 src/main.ts 一樣的 app：vue-i18n、unhead、router（base 由 history 帶）。 */
async function createTestApp(path: string, server: boolean): Promise<VueApp> {
  const app = createSSRApp(App)
  app.use(createI18n({ legacy: false, locale: 'zh-TW', fallbackLocale: 'zh-TW', messages: { 'zh-TW': zhTW } }))
  app.use(server ? createServerHead() : createClientHead())
  const router = createRouter({ ...routerOptions, history: createMemoryHistory(BASE) })
  app.use(router)
  await router.push(path)
  await router.isReady()
  return app
}

const mounted: { app: VueApp; container: HTMLElement }[] = []
afterEach(() => {
  for (const { app, container } of mounted.splice(0)) {
    app.unmount()
    container.remove()
  }
})

/**
 * @param routePath 預渲染的路由（vite-ssg 的 includedRoutes，沒有尾斜線）
 * @param clientPath client 的網址，預設是線上的形狀（加尾斜線）
 * @param tamper hydrate 之前改 DOM，模擬瀏覽器還原表單狀態
 */
async function hydrate(routePath: string, clientPath = routePath === '/' ? '/' : `${routePath}/`, tamper?: (root: HTMLElement) => void) {
  const html = await renderToString(await createTestApp(routePath, true))
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  tamper?.(container)
  const root = container.firstElementChild

  const logs: string[] = []
  const collect = (...args: unknown[]) => { logs.push(args.map(String).join(' ')) }
  const warn = vi.spyOn(console, 'warn').mockImplementation(collect)
  const error = vi.spyOn(console, 'error').mockImplementation(collect)
  try {
    const app = await createTestApp(clientPath, false)
    app.mount(container)
    mounted.push({ app, container })
    await flushPromises()
  } finally {
    warn.mockRestore()
    error.mockRestore()
  }
  return { container, logs, keptRoot: !!root && container.firstElementChild === root }
}

// 跟 vite.config.ts 的 includedRoutes 同一套：沒有參數的路由、每篇教學、/404。新增路由會自動進來。
const pages = [
  ...routes.map(r => r.path).filter(p => !p.includes(':')),
  ...guides.map(g => `/guide/${g.slug}`),
  '/404',
]

describe('整頁載入 hydrate：每一種頁面都沿用預渲染的 DOM', () => {
  it.each(pages)('%s：沒有 mismatch、根節點沒被換掉', async (routePath) => {
    const { logs, keptRoot } = await hydrate(routePath)
    expect(logs).toEqual([])
    expect(keptRoot).toBe(true)
  })

  it('沒有尾斜線的網址也一樣（vite preview 會這樣開）', async () => {
    const { logs, keptRoot } = await hydrate('/wifi', '/wifi')
    expect(logs).toEqual([])
    expect(keptRoot).toBe(true)
  })

  it('build 不改寫預渲染 HTML 的空白（vite-ssg 的 formatting 是 none）', () => {
    // 這裡的 HTML 是 renderToString 直接給的，build 時 vite-ssg 還會照 formatting 再改寫一次。
    // 'minify' 會削掉文字節點頭尾的空白、'prettify' 會重新排版，client 的 vnode 都還是原本的文字，
    // 正式站每一頁都會報 text mismatch（2026-10-08 開 __VUE_PROD_HYDRATION_MISMATCH_DETAILS__ 量到）。
    // vite.config.ts 在 happy-dom 環境 import 不進來，所以讀原始碼。這裡的全域 URL 是 happy-dom 的，
    // new URL('..', import.meta.url) 會解析成 http://localhost，路徑改用 import.meta.dirname。
    const config = readFileSync(join(import.meta.dirname, '..', 'vite.config.ts'), 'utf8')
    const formatting = config.match(/^\s*formatting:\s*['"](\w+)['"]/m)?.[1] ?? 'none'
    expect(formatting).toBe('none')
  })

  it('反例：拿首頁的 HTML 在別的網址 hydrate 一定 mismatch，所以 main.ts 要先比對路由', async () => {
    const { logs } = await hydrate('/', '/no-such-page/')
    expect(logs.some(l => /hydration/i.test(l))).toBe(true)
  })
})

describe('整頁載入 hydrate：表單的選取狀態對得上元件狀態', () => {
  it('產生器的耐髒程度顯示預設的 M，不是第一個選項 L', async () => {
    const { container } = await hydrate('/', '/', root => {
      // 模擬瀏覽器還原成別的選項（預渲染 HTML 沒標 selected 時，瀏覽器本來就會停在第一個）
      root.querySelector<HTMLSelectElement>('[data-test="ecLevel"]')!.value = 'L'
    })
    expect(container.querySelector<HTMLSelectElement>('[data-test="ecLevel"]')!.value).toBe(defaultStyle.errorCorrectionLevel)
  })

  it('產生器的「使用漸層」被還原成勾選時，hydrate 後對回沒勾', async () => {
    const { container } = await hydrate('/url', undefined, root => {
      root.querySelector<HTMLInputElement>('[data-test="useGradient"]')!.checked = true
    })
    expect(defaultStyle.useGradient).toBe(false)
    expect(container.querySelector<HTMLInputElement>('[data-test="useGradient"]')!.checked).toBe(false)
  })

  it('產生器的「透明背景」被還原成勾選時，hydrate 後對回沒勾', async () => {
    const { container } = await hydrate('/', '/', root => {
      root.querySelector<HTMLInputElement>('[data-test="transparent"]')!.checked = true
    })
    expect(container.querySelector<HTMLInputElement>('[data-test="transparent"]')!.checked).toBe(false)
  })

  it('條碼類型被還原成 EAN-13 時，hydrate 後對回預設的 Code 128', async () => {
    const { container } = await hydrate('/barcode', undefined, root => {
      root.querySelector<HTMLInputElement>('[data-test="bc-radio-ean13"]')!.checked = true
    })
    expect(container.querySelector<HTMLInputElement>('[data-test="bc-radio-code128"]')!.checked).toBe(true)
    expect(container.querySelector<HTMLInputElement>('[data-test="bc-radio-ean13"]')!.checked).toBe(false)
  })

  it('WiFi 的加密方式與輸入框被還原成別的值時，hydrate 後對回狀態', async () => {
    const { container } = await hydrate('/wifi', undefined, root => {
      root.querySelector<HTMLSelectElement>('select[id$="-enc"]')!.value = 'nopass'
      root.querySelector<HTMLInputElement>('[data-test="ssid"]')!.value = '上一次的網路'
    })
    expect(container.querySelector<HTMLSelectElement>('select[id$="-enc"]')!.value).toBe('WPA')
    expect(container.querySelector<HTMLInputElement>('[data-test="ssid"]')!.value).toBe('')
  })
})
