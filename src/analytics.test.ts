// @vitest-environment node
/**
 * GA4 只在正式主機 www.pocketool.app 量測。
 *
 * localhost、vite dev／preview、wrangler dev、workers.dev 跑的都是同一份 index.html（404 頁也是由它預渲染），
 * 原本直接寫 <script src="…gtag/js">，開發與驗收時的每一次造訪都會送進正式報表。改成一段 inline script
 * 先看 location.hostname，只有正式主機才建立 gtag、排 config、插入 gtag.js。量測 ID 與 content_group 不變。
 *
 * 這裡把那段 script 拿出來，換上假的 location、window、document 執行：不碰真的 DOM，也就不會真的去載入
 * gtag.js（測試環境不連網）。產物那一側由 seo:audit 逐頁驗。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MEASUREMENT_ID = 'G-4FJ6KE3R2V'
const CONTENT_GROUP = 'qrcode-studio'
const GA_HOST = 'www.pocketool.app'
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`

const indexHtml = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')

/** 帶量測 ID 的那段 inline script（沒有 src、不是 module） */
const gaScript = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]!)
  .find((s) => s.includes(MEASUREMENT_ID))

type FakeScript = { async?: boolean; src?: string }
type FakeWindow = { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] }

/** 在指定主機名上執行那段 script，回傳它插入的 <script> 與留在 window 上的東西 */
function runOn(hostname: string) {
  const appended: FakeScript[] = []
  const created: string[] = []
  const win: FakeWindow = {}
  const doc = {
    createElement: (tag: string) => {
      created.push(tag)
      return {} as FakeScript
    },
    head: { appendChild: (el: FakeScript) => { appended.push(el) } },
  }
  new Function('location', 'window', 'document', gaScript!)({ hostname }, win, doc)
  return { appended, created, win }
}

describe('index.html 的 GA 只在正式主機載入', () => {
  it('找得到帶量測 ID 的 inline script', () => {
    expect(gaScript, '找不到帶量測 ID 的 inline script').toBeTruthy()
  })

  it('沒有寫死的 <script src="…googletagmanager…">：一律由主機判斷後才插入', () => {
    expect(indexHtml).not.toMatch(/<script[^>]*\ssrc=["'][^"']*googletagmanager/i)
    // 量測 ID 只出現在那一段 inline script 裡（config 一次、gtag.js 網址一次）
    expect(indexHtml.split(MEASUREMENT_ID).length - 1).toBe(2)
    expect(gaScript!.split(MEASUREMENT_ID).length - 1).toBe(2)
  })

  it(`在 ${GA_HOST} 插入 async 的 gtag.js，config 帶同一個量測 ID 與 content_group`, () => {
    const { appended, created, win } = runOn(GA_HOST)
    expect(created).toEqual(['script'])
    expect(appended).toHaveLength(1)
    expect(appended[0]).toEqual({ async: true, src: GTAG_SRC })
    expect(typeof win.gtag).toBe('function')
    // gtag.js 只把真的 Arguments 物件當指令，dataLayer 裡不能是一般陣列
    expect(win.dataLayer).toHaveLength(2)
    expect(Object.prototype.toString.call(win.dataLayer![0])).toBe('[object Arguments]')
    const commands = win.dataLayer!.map((a) => Array.from(a as ArrayLike<unknown>))
    expect(commands[0]![0]).toBe('js')
    expect(commands[0]![1]).toBeInstanceOf(Date)
    expect(commands[1]).toEqual(['config', MEASUREMENT_ID, { content_group: CONTENT_GROUP }])
  })

  it('頁面之後呼叫 window.gtag 也會排進同一個 dataLayer', () => {
    const { win } = runOn(GA_HOST)
    win.gtag!('event', 'test_event', { a: 1 })
    expect(Array.from(win.dataLayer![2] as ArrayLike<unknown>)).toEqual(['event', 'test_event', { a: 1 }])
  })

  it.each([
    'localhost',
    '127.0.0.1',
    'qrcode-studio.example.workers.dev',
    'pocketool.app',
    'qrcode-studio.pocketool.app',
    'www.pocketool.app.example.com',
    '',
  ])('在「%s」不載入、不排任何指令、不定義 gtag', (host) => {
    const { appended, created, win } = runOn(host)
    expect(created).toHaveLength(0)
    expect(appended).toHaveLength(0)
    expect(win.dataLayer).toBeUndefined()
    expect(win.gtag).toBeUndefined()
  })
})
