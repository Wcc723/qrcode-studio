// @vitest-environment node
/**
 * 產品名與站徽的護欄。
 *
 * 產品名只有一個開關（src/config/site.ts 的 name），其餘都要從它取：頁首、頁尾、title 後綴、og:site_name、
 * JSON-LD、manifest、favicon.svg 的替代文字。舊名 QR Code Studio 只留在 site.ts 的 formerNames
 * （JSON-LD alternateName 與關於頁更新紀錄的「原名」從那裡取），原始碼其他地方寫死舊名就擋下來。
 *
 * 站徽的圖檔由 scripts/brand/render.mjs 產生、commit 進 public/；這裡驗它們跟 site.ts 對得起來，
 * 產物層級（尺寸、不透明、帶子路徑前綴）由 scripts/seo/audit.mjs 驗。
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { site } from '@/config/site'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

function walk(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel]
  })
}

describe('產品名只有一個開關', () => {
  const sources = [
    'index.html',
    ...walk('src').filter((f) => /\.(vue|ts)$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith('.d.ts')),
  ]

  it('有掃到東西（清單不能是空的）', () => {
    expect(sources.length).toBeGreaterThan(40)
  })

  it('舊名 QR Code Studio 只寫在 site.ts 的 formerNames', () => {
    const offenders = sources.filter((f) => f !== 'src/config/site.ts' && read(f).includes('QR Code Studio'))
    expect(offenders).toEqual([])
  })

  it('新名不寫死在頁面與元件裡（一律用 site.name）', () => {
    const offenders = sources.filter((f) => f !== 'src/config/site.ts' && read(f).includes(site.name))
    expect(offenders).toEqual([])
  })

  it('頁尾與關於頁用同一句商標聲明', () => {
    expect(read('src/layouts/DefaultLayout.vue')).toContain('{{ site.trademark }}')
    expect(read('src/pages/AboutPage.vue')).toContain('{{ site.trademark }}')
  })
})

describe('站徽與圖示', () => {
  it('manifest 的名稱跟 site.ts 一致，路徑都是相對的（不寫死子路徑前綴）', () => {
    const manifest = JSON.parse(read('public/manifest.webmanifest'))
    expect(manifest.name).toBe(site.name)
    expect(manifest.short_name).toBe(site.name)
    expect(manifest.lang).toBe('zh-Hant-TW')
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    for (const icon of manifest.icons) {
      expect(icon.src).not.toMatch(/^\//)
      expect(existsSync(join(root, 'public', icon.src))).toBe(true)
    }
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512'])
  })

  it('favicon.svg 的替代文字是產品名，內嵌的是點陣站徽', () => {
    const svg = read('public/favicon.svg')
    expect(svg).toContain(`aria-label="${site.name}"`)
    expect(svg).toMatch(/href="data:image\/png;base64,/)
  })

  it('index.html 連到 favicon（svg 與 ico）、apple-touch-icon 與 manifest', () => {
    const html = read('index.html')
    for (const href of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/manifest.webmanifest']) {
      expect(html).toContain(`href="${href}"`)
      expect(existsSync(join(root, 'public', href))).toBe(true)
    }
  })

  it('頁首的站徽圖檔都在 public/', () => {
    const layout = read('src/layouts/DefaultLayout.vue')
    for (const f of ['logo-64.png', 'logo-96.png']) {
      expect(layout).toContain(f)
      expect(existsSync(join(root, 'public', f))).toBe(true)
    }
  })
})
