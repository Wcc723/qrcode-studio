import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createRouter, createMemoryHistory } from 'vue-router'
import { guides, guideBySlug, findGuide, guideCategories } from './guides'
import { guideBodies } from './guide-bodies'
import { routerOptions } from '@/router'

const cjk = (html: string) => (html.replace(/<[^>]+>/g, '').match(/[一-鿿]/g) ?? []).length
const router = createRouter({ history: createMemoryHistory(), ...routerOptions })

describe('教學中繼資料', () => {
  it('slug 不重複，每篇都有本文', () => {
    expect(new Set(guides.map(g => g.slug)).size).toBe(guides.length)
    for (const g of guides) expect(guideBodies[g.slug], g.slug).toBeTruthy()
    expect(Object.keys(guideBodies).sort()).toEqual(guides.map(g => g.slug).sort())
  })

  it('首次發布日期與 git 歷史一致（不得改成「看起來比較新」的日期）', () => {
    // e9a4038（2026-05-29）新增前三篇；e00ad53（2026-05-30）新增後三篇。
    expect(Object.fromEntries(guides.map(g => [g.slug, g.published]))).toEqual({
      'what-is-qr-code': '2026-05-29',
      'error-correction': '2026-05-29',
      'qr-with-logo': '2026-05-29',
      'scan-qr-code': '2026-05-30',
      'line-qr-code': '2026-05-30',
      'qr-code-svg': '2026-05-30',
    })
  })

  it('日期格式正確，更新日不早於發布日', () => {
    for (const g of guides) {
      expect(g.published).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(g.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(g.updated >= g.published, g.slug).toBe(true)
    }
  })

  it('相關教學都存在、不指向自己、不重複', () => {
    for (const g of guides) {
      expect(g.related.length, g.slug).toBeGreaterThan(0)
      expect(new Set(g.related).size).toBe(g.related.length)
      for (const r of g.related) {
        expect(r).not.toBe(g.slug)
        expect(findGuide(r), `${g.slug} → ${r}`).toBeDefined()
      }
    }
  })

  it('每篇都屬於一個存在的分組', () => {
    const ids = guideCategories.map(c => c.id)
    for (const g of guides) expect(ids).toContain(g.category)
  })

  it('findGuide 不認原型上的屬性名', () => {
    expect(findGuide('constructor')).toBeUndefined()
    expect(findGuide('__proto__')).toBeUndefined()
    expect(findGuide('what-is-qr-code')).toBe(guideBySlug['what-is-qr-code'])
  })
})

describe('教學本文', () => {
  it('每篇至少 1,200 個中文字的原創內容', () => {
    for (const g of guides) expect(cjk(guideBodies[g.slug]), g.slug).toBeGreaterThanOrEqual(1200)
  })

  it('標題、描述與本文都不用破折號「——」', () => {
    for (const g of guides) {
      for (const text of [g.title, g.shortTitle, g.description, guideBodies[g.slug]]) {
        expect(text, g.slug).not.toContain('——')
      }
    }
  })

  it('站內連結都指到存在的頁面（不是 404）', () => {
    for (const g of guides) {
      const hrefs = [...guideBodies[g.slug].matchAll(/\shref="(\/[^"]*)"/g)].map(m => m[1])
      expect(hrefs.length, g.slug).toBeGreaterThan(0)
      for (const href of hrefs) {
        expect(href, `${g.slug}: ${href} 要帶尾斜線`).toMatch(/\/$/)
        expect(router.resolve(href).name, `${g.slug}: ${href}`).not.toBe('notfound')
      }
    }
  })

  it('站內圖片都存在於 public/，而且有 alt 與寬高', () => {
    for (const g of guides) {
      for (const [tag] of guideBodies[g.slug].matchAll(/<img\b[^>]*>/g)) {
        const src = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? ''
        expect(src, tag).toMatch(/^\/guides\//)
        expect(existsSync(join(process.cwd(), 'public', src)), src).toBe(true)
        expect(tag, src).toMatch(/\salt="[^"]{4,}"/)
        expect(tag, src).toMatch(/\swidth="\d+"/)
        expect(tag, src).toMatch(/\sheight="\d+"/)
      }
    }
  })

  it('外部連結開新分頁並帶 rel="noopener"', () => {
    for (const g of guides) {
      for (const [tag] of guideBodies[g.slug].matchAll(/<a\s[^>]*href="https?:[^"]*"[^>]*>/g)) {
        expect(tag).toContain('target="_blank"')
        expect(tag).toContain('rel="noopener"')
      }
    }
  })

  it('「如何掃描」教學維持手機操作為主，並連到圖片掃描器', () => {
    const body = guideBodies['scan-qr-code']
    expect(body).toContain('iPhone 怎麼掃 QR Code')
    expect(body).toContain('Android 怎麼掃 QR Code')
    expect(body).toContain('href="/scan/"')
  })
})
