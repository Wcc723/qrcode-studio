import { describe, it, expect } from 'vitest'
import { qrTypes, qrTypeByPath } from './qr-types'

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
