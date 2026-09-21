import { describe, it, expect } from 'vitest'
import { withBase } from './with-base'

// 測試環境的 BASE_URL 是 '/'，看不出有沒有補前綴，所以明確帶入正式的子路徑。
const BASE = '/qrcode-studio/'
const wb = (html: string) => withBase(html, BASE)

describe('withBase', () => {
  it('站內連結補前綴', () => {
    expect(wb('<a href="/wifi/">WiFi</a>')).toBe(`<a href="${BASE}wifi/">WiFi</a>`)
  })
  it('站內圖片補前綴', () => {
    expect(wb('<img src="/guides/ec-l.svg" alt="">')).toBe(`<img src="${BASE}guides/ec-l.svg" alt="">`)
  })
  it('外部網址與協定相對網址不動', () => {
    const html = '<a href="https://www.pocketool.app/">口袋工具</a><img src="//cdn.example/x.png">'
    expect(wb(html)).toBe(html)
  })
  it('data-href 之類的屬性名不會被誤改', () => {
    expect(wb('<span data-href="/x">x</span>')).toBe('<span data-href="/x">x</span>')
  })
})

describe('withBase 預設吃 Vite 的 BASE_URL', () => {
  it('不帶第二個參數時用 import.meta.env.BASE_URL', () => {
    expect(withBase('<a href="/x/">x</a>')).toBe(`<a href="${import.meta.env.BASE_URL}x/">x</a>`)
  })
})
