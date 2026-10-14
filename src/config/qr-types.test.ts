// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { qrTypes, qrTypeByPath } from './qr-types'
import { findGuide } from '@/content/guides'

interface Card {
  out: string; page?: string; icon?: string; art: string
  lines: { text: string }[]; banner: string; chips: string[]; tag?: { text: string }
}
const root = fileURLToPath(new URL('../..', import.meta.url))
// cards.mjs 是產圖腳本用的純資料（沒有型別宣告），用動態 import 讀進來
const { CARDS } = (await import(pathToFileURL(join(root, 'scripts/brand/cards.mjs')).href)) as { CARDS: Card[] }
const squash = (s: string) => s.replace(/\s+/g, '')

describe('qrTypeByPath 斜線容錯', () => {
  it('每個類型路徑「無斜線」與「帶斜線」都能解析到同一筆 meta', () => {
    for (const t of qrTypes) {
      // 無斜線（SSG 預渲染時 route.path）
      expect(qrTypeByPath[t.path], `lookup ${t.path}`).toBe(t)
      // 帶斜線（dirStyle:nested 實際服務網址，client 端 route.path）
      expect(qrTypeByPath[`${t.path}/`], `lookup ${t.path}/`).toBe(t)
    }
  })

  it('未知路徑回傳 undefined（交給 404）', () => {
    expect(qrTypeByPath['/nope']).toBeUndefined()
    expect(qrTypeByPath['/nope/']).toBeUndefined()
  })
})

describe('類型頁的 FAQ 與延伸閱讀', () => {
  it('不再每頁重複「要錢嗎」這類通用問題（放在 /faq/）', () => {
    for (const t of qrTypes) {
      for (const f of t.faqs) expect(f.q, `${t.type}: ${f.q}`).not.toMatch(/要錢|要付費|免費嗎|付費或註冊/)
    }
  })
  it('FAQ 問題在各類型之間不重複', () => {
    const qs = qrTypes.flatMap(t => t.faqs.map(f => f.q))
    const dup = qs.filter((q, i) => qs.indexOf(q) !== i)
    expect(dup).toEqual([])
  })
  it('延伸閱讀的教學都存在', () => {
    for (const t of qrTypes) {
      expect(t.guides.length, t.type).toBeGreaterThan(0)
      for (const slug of t.guides) expect(findGuide(slug), `${t.type} → ${slug}`).toBeDefined()
    }
  })
  it('文案不用破折號「——」', () => {
    expect(JSON.stringify(qrTypes)).not.toContain('——')
  })
  it('工具區的副標只有一行（30 字以內），跟 description 不同：完整的那句放在說明文章開頭', () => {
    for (const t of qrTypes) {
      expect(t.lead.length, t.type).toBeGreaterThan(0)
      expect(t.lead.length, t.type).toBeLessThanOrEqual(30)
      expect(t.lead, t.type).not.toBe(t.description)
    }
  })
  it('每種類型都有建置時打包的 Lucide 圖示', () => {
    for (const t of qrTypes) expect(t.icon, t.type).toMatch(/^i-lucide-[a-z0-9-]+$/)
    expect(new Set(qrTypes.map(t => t.icon)).size).toBe(qrTypes.length)
  })
})

/**
 * 類型頁各自的分享圖（#22）：cards.mjs 的 page 對到類型的網址，檔名 og-<type>.png，替代文字（ogAlt）跟圖上的字一致。
 * 產物層級（頁面的 og:image、twitter:image 真的換成這張）由 scripts/seo/audit.mjs 驗。
 */
describe('類型頁的分享圖', () => {
  const cardOf = (t: (typeof qrTypes)[number]) => CARDS.find((c) => c.page === `${t.path}/`)

  it('每個類型都有自己的一張卡片，檔名是 og-<type>.png', () => {
    for (const t of qrTypes) expect(cardOf(t)?.out, t.type).toBe(`og-${t.type}.png`)
  })

  it('右邊是這一頁網址的 QR Code，中間的圖示跟產生器分頁上的一樣', () => {
    for (const t of qrTypes) {
      const card = cardOf(t)!
      expect(card.art, t.type).toBe('qr')
      expect(`i-lucide-${card.icon}`, t.type).toBe(t.icon)
    }
  })

  it('替代文字以圖上的大標開頭，寫著橫幅那句、每個小標籤與圖角標籤的字；大標是 title 的一段', () => {
    for (const t of qrTypes) {
      const card = cardOf(t)!
      const alt = squash(t.ogAlt)
      const headline = squash(card.lines.map((l) => l.text).join(''))
      expect(alt.startsWith(headline), `${t.type}：${alt}`).toBe(true)
      expect(alt, t.type).toContain(squash(card.banner))
      for (const chip of card.chips) expect(alt, t.type).toContain(squash(chip))
      expect(card.tag, t.type).toBeDefined()
      expect(alt, t.type).toContain(squash(`「${card.tag!.text}」`))
      expect(squash(t.title), t.type).toContain(headline)
    }
  })

  it('替代文字與圖上的字不用破折號「——」', () => {
    for (const t of qrTypes) {
      const card = cardOf(t)!
      for (const text of [t.ogAlt, ...card.lines.map((l) => l.text), card.banner, ...card.chips, card.tag?.text ?? '']) {
        expect(text, t.type).not.toContain('——')
      }
    }
  })

  // 類型頁以外，批次頁與教學總覽的卡片也用 page 對到頁面，一起驗（教學每篇的在 guide-og.test.ts）
  it('有 page 的卡片（類型頁、批次頁與教學總覽）圖檔都已經產生在 public/：1200×630 的 PNG，200 KB 以內', () => {
    const cards = CARDS.filter((c) => c.page)
    for (const t of qrTypes) expect(cards.map((c) => c.out), t.type).toContain(`og-${t.type}.png`)
    expect(cards.map((c) => c.page)).toEqual(expect.arrayContaining(['/batch/', '/guide/']))
    for (const card of cards) {
      const file = join(root, 'public', card.out)
      expect(existsSync(file), file).toBe(true)
      const buf = readFileSync(file)
      expect(buf.toString('latin1', 1, 4), file).toBe('PNG')
      expect([buf.readUInt32BE(16), buf.readUInt32BE(20)], file).toEqual([1200, 630])
      expect(statSync(file).size, file).toBeLessThan(200 * 1024)
    }
  })
})
