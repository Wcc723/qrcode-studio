import { describe, expect, it } from 'vitest'
import { SSG_ROUTE_ATTR, shouldHydrate } from './hydration'

const BASE = '/qrcode-studio/'

describe('shouldHydrate：網址跟預渲染的是同一頁才 hydrate', () => {
  it('同一頁：首頁、類型頁、教學、掃描器', () => {
    expect(shouldHydrate('/', '/qrcode-studio/', BASE)).toBe(true)
    expect(shouldHydrate('/wifi', '/qrcode-studio/wifi/', BASE)).toBe(true)
    expect(shouldHydrate('/guide/qr-with-logo', '/qrcode-studio/guide/qr-with-logo/', BASE)).toBe(true)
    expect(shouldHydrate('/scan', '/qrcode-studio/scan/', BASE)).toBe(true)
  })

  it('尾斜線：routePath 沒有、網址有（線上一律有），或兩邊都沒有，都算同一頁', () => {
    expect(shouldHydrate('/faq', '/qrcode-studio/faq/', BASE)).toBe(true)
    expect(shouldHydrate('/faq', '/qrcode-studio/faq', BASE)).toBe(true)
    expect(shouldHydrate('/', '/qrcode-studio', BASE)).toBe(true)
    // 以後 routePath 改成帶尾斜線也照樣成立
    expect(shouldHydrate('/faq/', '/qrcode-studio/faq/', BASE)).toBe(true)
  })

  it('尾斜線只容許一個：/wifi// 在 router 是 404 頁', () => {
    expect(shouldHydrate('/wifi', '/qrcode-studio/wifi//', BASE)).toBe(false)
  })

  it('base 沒有尾斜線、base 是根目錄也一樣', () => {
    expect(shouldHydrate('/about', '/qrcode-studio/about/', '/qrcode-studio')).toBe(true)
    expect(shouldHydrate('/about', '/about/', '/')).toBe(true)
    expect(shouldHydrate('/', '/', '/')).toBe(true)
  })

  it('百分比編碼：網址是編碼過的，routePath 是原字', () => {
    const pathname = '/qrcode-studio/guide/' + encodeURIComponent('加LOGO') + '/'
    expect(shouldHydrate('/guide/加LOGO', pathname, BASE)).toBe(true)
    expect(shouldHydrate('/guide/qr-with-logo', '/qrcode-studio/guide/qr%2Dwith%2Dlogo/', BASE)).toBe(true)
  })

  it('404.html：預渲染的是 /404，找不到的網址不 hydrate', () => {
    expect(shouldHydrate('/404', '/qrcode-studio/no-such-page/', BASE)).toBe(false)
    expect(shouldHydrate('/404', '/qrcode-studio/guide/no-such-guide/', BASE)).toBe(false)
    // route 是尾萬用，/qrcode-studio-foo 拿到的是資產根目錄的 404.html
    expect(shouldHydrate('/404', '/qrcode-studio-foo', BASE)).toBe(false)
  })

  it('預覽伺服器拿首頁 HTML 回別的網址：不 hydrate', () => {
    expect(shouldHydrate('/', '/qrcode-studio/no-such-page/', BASE)).toBe(false)
    expect(shouldHydrate('/', '/qrcode-studio/wifi/', BASE)).toBe(false)
  })

  it('大小寫不同就不是同一頁（router 設了 sensitive，/WIFI/ 在 client 是 404 頁）', () => {
    expect(shouldHydrate('/wifi', '/qrcode-studio/WIFI/', BASE)).toBe(false)
  })

  it('不在 base 底下、沒有記路由、編碼壞掉：比不出來就不 hydrate', () => {
    expect(shouldHydrate('/wifi', '/wifi/', BASE)).toBe(false)
    expect(shouldHydrate(null, '/qrcode-studio/about/', BASE)).toBe(false)
    expect(shouldHydrate(undefined, '/qrcode-studio/about/', BASE)).toBe(false)
    expect(shouldHydrate('', '/qrcode-studio/', BASE)).toBe(false)
    expect(shouldHydrate('/about', '/qrcode-studio/about%/', BASE)).toBe(false)
  })

  it('屬性名稱：seo:audit 與正式站量測都認這個名字，改名要一起改', () => {
    expect(SSG_ROUTE_ATTR).toBe('data-ssg-route')
  })
})
