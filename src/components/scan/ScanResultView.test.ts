/**
 * 結果卡什麼時候講「網址」、什麼時候出警告。
 *
 * - 認得出類型的（WiFi、電子名片、Email、電話、簡訊）不是網址：不寫「網址開頭」、不出警告，
 *   改成一句中性說明，告訴使用者這是什麼、本站不會替他做什麼。掃一張正常的 WiFi QR
 *   不該看起來像被警告。
 * - 認不出類型、開頭又不是 http／https 的（javascript:、data:、file:，半殘的 WIFI:，一維碼）
 *   照舊警告，這條不放寬。
 * - http／https 照舊顯示網址開頭與會開到的網站。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScanResultView from './ScanResultView.vue'
import { toScanOutcome, type RawBarcode } from '@/pure/scanResult'

function view(raw: RawBarcode) {
  return mount(ScanResultView, { props: { outcome: toScanOutcome([raw]) } })
}

const qr = (text: string): RawBarcode => ({ format: 'QRCode', text })

/** 這一筆不是網址：沒有網址開頭、沒有警告、沒有開啟按鈕，有一句中性說明。 */
function expectNeutral(raw: RawBarcode, note: string) {
  const w = view(raw)
  expect(w.find('[data-test="scan-unsafe-scheme"]').exists(), '不該出現警告').toBe(false)
  expect(w.find('[data-test="scan-uri-scheme"]').exists(), '不該出現網址開頭').toBe(false)
  expect(w.text()).not.toContain('網址開頭')
  expect(w.text()).not.toContain('不是一般網址')
  expect(w.find('[data-test="scan-open"]').exists()).toBe(false)
  const el = w.find('[data-test="scan-kind-note"]')
  expect(el.exists(), '少了中性說明').toBe(true)
  expect(el.text()).toContain(note)
  expect(el.text()).toContain('不是網址')
  return w
}

/** 這一筆照舊警告：有網址開頭、有警告、沒有開啟按鈕，也沒有中性說明。 */
function expectWarning(raw: RawBarcode, scheme: string) {
  const w = view(raw)
  expect(w.find('[data-test="scan-uri-scheme"]').text()).toBe(scheme)
  expect(w.find('[data-test="scan-unsafe-scheme"]').text()).toContain(`開頭是 ${scheme}:`)
  expect(w.find('[data-test="scan-open"]').exists()).toBe(false)
  expect(w.find('[data-test="scan-kind-note"]').exists()).toBe(false)
  return w
}

describe('認得出類型的內容不是網址，不出警告', () => {
  it('WiFi（跟 test/fixtures/scan/qrcode-wifi.png 同一串）', () => {
    const w = expectNeutral(qr('WIFI:T:WPA;S:Cafe\\;Bar;P:p\\:a\\\\ss;H:false;;'), 'WiFi 設定')
    expect(w.find('[data-test="scan-kind"]').text()).toBe('WiFi')
    expect(w.find('[data-test="scan-kind-note"]').text()).toContain('不會自動連線')
  })

  it('電子名片（BEGIN:VCARD 不會被當成網址開頭 begin）', () => {
    const w = expectNeutral(
      qr('BEGIN:VCARD\nVERSION:3.0\nN:王;小明\nTEL:0912345678\nEMAIL:ming@example.com\nEND:VCARD'),
      '電子名片',
    )
    expect(w.find('[data-test="scan-kind"]').text()).toBe('電子名片')
    expect(w.text()).not.toContain('begin')
  })

  it.each([
    ['mailto:', 'mailto:casper+news@example.com?subject=Hi', 'Email'],
    ['MATMSG:', 'MATMSG:TO:casper@example.com;SUB:Hi;BODY:Hello;;', 'Email'],
    ['tel:', 'tel:+886912345678', '電話號碼'],
    ['SMSTO:', 'SMSTO:0912345678:你好', '簡訊'],
    ['sms:', 'sms:0912345678?body=hi', '簡訊'],
  ])('%s', (_label, text, note) => {
    expectNeutral(qr(text), note)
  })

  it('中性說明一律看得到，不收進「?」', () => {
    const w = view(qr('WIFI:T:WPA;S:Cafe;P:pw;H:false;;'))
    expect(w.find('[data-test="scan-kind-note"]').element.closest('.help-tip-panel')).toBeNull()
  })
})

describe('認不出類型、又不是 http／https 的照舊警告', () => {
  it('javascript:', () => {
    expectWarning(qr('javascript:alert(1)'), 'javascript')
  })

  it('data: 與 file:', () => {
    expectWarning(qr('data:text/html;base64,PHN2Zz4='), 'data')
    expectWarning(qr('file:///etc/passwd'), 'file')
  })

  it('半殘的 WIFI:（缺網路名稱）認不出類型，照舊警告', () => {
    const w = expectWarning(qr('WIFI:T:WPA;P:pw;;'), 'wifi')
    expect(w.find('[data-test="scan-kind"]').text()).toBe('純文字')
  })

  it('一維碼不解析類型，內容有開頭就照舊警告', () => {
    expectWarning({ format: 'Code128', text: 'tel:0912345678' }, 'tel')
  })
})

describe('http／https 照舊顯示要去哪', () => {
  it('有網址開頭與會開到的網站，沒有警告也沒有中性說明', () => {
    const w = view(qr('https://example.com/a'))
    expect(w.find('[data-test="scan-uri-scheme"]').text()).toBe('https')
    expect(w.find('[data-test="scan-uri-host"]').text()).toBe('example.com')
    expect(w.find('[data-test="scan-unsafe-scheme"]').exists()).toBe(false)
    expect(w.find('[data-test="scan-kind-note"]').exists()).toBe(false)
    expect(w.find('[data-test="scan-open"]').attributes('href')).toBe('https://example.com/a')
  })

  it('純文字沒有開頭就什麼都不顯示', () => {
    const w = view(qr('hello world'))
    expect(w.find('[data-test="scan-uri-scheme"]').exists()).toBe(false)
    expect(w.find('[data-test="scan-unsafe-scheme"]').exists()).toBe(false)
    expect(w.find('[data-test="scan-kind-note"]').exists()).toBe(false)
  })
})
