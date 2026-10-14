// @vitest-environment node
/**
 * 教學各篇的分享圖：每篇都有自己那張，替代文字跟圖上的字（scripts/brand/cards.mjs）一致，圖檔在 public/ 而且夠小。
 * 產物層級（頁面的 og:image、twitter:image、og:image:alt 真的換成這篇的圖）由 scripts/seo/audit.mjs 驗。
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { guides } from './guides'
import { guideOgAlt, guideOgImage } from './guide-og'

interface Card { out: string; guide?: string; lines: { text: string }[]; banner: string; chips: string[] }

const root = fileURLToPath(new URL('../..', import.meta.url))
// cards.mjs 是產圖腳本用的純資料（沒有型別宣告），用動態 import 讀進來
const { CARDS } = (await import(pathToFileURL(join(root, 'scripts/brand/cards.mjs')).href)) as { CARDS: Card[] }
const squash = (s: string) => s.replace(/\s+/g, '')
const cardOf = (slug: string) => CARDS.find((c) => c.guide === slug)

describe('教學的分享圖', () => {
  it('每篇都有自己的一張，檔名是 og-guide-<slug>.png，跟 cards.mjs 的 out 一致', () => {
    for (const g of guides) {
      const img = guideOgImage(g.slug)
      expect(img.path, g.slug).toBe(`/og-guide-${g.slug}.png`)
      expect([img.width, img.height]).toEqual([1200, 630])
      expect(cardOf(g.slug)?.out, g.slug).toBe(img.path.slice(1))
    }
  })

  it('cards.mjs 的教學卡與替代文字都對得到存在的教學，沒有多出來的', () => {
    const slugs = guides.map((g) => g.slug).sort()
    expect(CARDS.filter((c) => c.guide).map((c) => c.guide).sort()).toEqual(slugs)
    expect(Object.keys(guideOgAlt).sort()).toEqual(slugs)
    expect(() => guideOgImage('constructor')).toThrow()
  })

  it('替代文字以圖上的大標開頭，寫著橫幅那句與每個小標籤；大標是文章 title 的一段', () => {
    for (const g of guides) {
      const card = cardOf(g.slug)!
      const alt = squash(guideOgImage(g.slug).alt)
      const headline = squash(card.lines.map((l) => l.text).join(''))
      expect(alt.startsWith(headline), `${g.slug}：${alt}`).toBe(true)
      expect(alt, g.slug).toContain(squash(card.banner))
      for (const chip of card.chips) expect(alt, g.slug).toContain(squash(chip))
      expect(squash(g.title), g.slug).toContain(headline)
    }
  })

  it('替代文字與圖上的字不用破折號「——」', () => {
    for (const g of guides) {
      const card = cardOf(g.slug)!
      for (const text of [guideOgImage(g.slug).alt, ...card.lines.map((l) => l.text), card.banner, ...card.chips]) {
        expect(text, g.slug).not.toContain('——')
      }
    }
  })

  it('圖檔已經產生在 public/：1200×630 的 PNG，200 KB 以內', () => {
    for (const g of guides) {
      const file = join(root, 'public', guideOgImage(g.slug).path)
      expect(existsSync(file), file).toBe(true)
      const buf = readFileSync(file)
      expect(buf.toString('latin1', 1, 4), file).toBe('PNG')
      expect([buf.readUInt32BE(16), buf.readUInt32BE(20)], file).toEqual([1200, 630])
      expect(statSync(file).size, file).toBeLessThan(200 * 1024)
    }
  })
})
