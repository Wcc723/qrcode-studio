import { describe, it, expect } from 'vitest'
import { qrTypes, qrTypeByPath } from './qr-types'
import { findGuide } from '@/content/guides'

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
})
