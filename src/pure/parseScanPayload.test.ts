import { describe, it, expect } from 'vitest'
import { parseScanPayload, classifyUri } from './parseScanPayload'
import { buildPayload } from './index'

describe('URL scheme 判定', () => {
  it('http / https 可以直接開啟，並拆出 scheme 與 host', () => {
    expect(classifyUri('https://www.pocketool.app/qrcode-studio/')).toEqual({
      scheme: 'https', host: 'www.pocketool.app', openable: true,
      href: 'https://www.pocketool.app/qrcode-studio/',
    })
    expect(classifyUri('http://example.com/a?b=1').openable).toBe(true)
    expect(classifyUri('http://example.com/a?b=1').host).toBe('example.com')
  })

  it('scheme 大小寫不影響判定', () => {
    expect(classifyUri('HtTpS://example.com/').openable).toBe(true)
    expect(classifyUri('HtTpS://example.com/').scheme).toBe('https')
  })

  it('危險或未知 scheme 一律不可開啟，但仍看得到 scheme', () => {
    for (const [text, scheme] of [
      ['javascript:alert(1)', 'javascript'],
      ['JaVaScRiPt:alert(1)', 'javascript'],
      ['data:text/html;base64,PHNjcmlwdD4=', 'data'],
      ['file:///etc/passwd', 'file'],
      ['blob:https://example.com/abc', 'blob'],
      ['vbscript:msgbox(1)', 'vbscript'],
      ['ftp://example.com/x', 'ftp'],
      ['intent://scan/#Intent;scheme=zxing;end', 'intent'],
    ] as const) {
      const info = classifyUri(text)
      expect(info.scheme).toBe(scheme)
      expect(info.openable).toBe(false)
      expect(info.href).toBeNull()
    }
  })

  it('前後空白與大小寫不會讓 javascript: 偷偷變成可開啟', () => {
    expect(classifyUri('   javascript:alert(1)  ').openable).toBe(false)
    expect(classifyUri('\u0000javascript:alert(1)').openable).toBe(false)
  })

  it('完全沒有 host 的 http 不可開啟', () => {
    expect(classifyUri('http://').openable).toBe(false)
    expect(classifyUri('http://?a=1').openable).toBe(false)
  })

  it('host 與 href 都是正規化後的值，UI 顯示的不會和實際會開的不同', () => {
    // https:///path 依 WHATWG 規則其實是 host=path，不是「沒有 host」。
    // 讓 UI 讀 host/href 而不是原文，才不會出現「看起來像路徑、按下去卻連到別的主機」。
    const info = classifyUri('https:///path')
    expect(info.host).toBe('path')
    expect(info.href).toBe('https://path/')
    expect(classifyUri('https://EXAMPLE.com/A').host).toBe('example.com')
  })

  it('國際化網域以 punycode 顯示 host，避免同形字混淆', () => {
    const info = classifyUri('https://паypal.com/')
    expect(info.openable).toBe(true)
    expect(info.host).toMatch(/^xn--/)
  })

  it('不是 URI 的純文字沒有 scheme 也不可開啟', () => {
    expect(classifyUri('hello world')).toEqual({ scheme: null, host: null, openable: false, href: null })
    expect(classifyUri('www.example.com').openable).toBe(false)
  })
})

describe('QR payload 解析成站內產生器型別', () => {
  it('網址', () => {
    const r = parseScanPayload('https://example.com/a')
    expect(r.kind).toBe('url')
    expect(r.kind === 'url' && r.data).toEqual({ url: 'https://example.com/a' })
    expect(r.kind === 'url' && r.uri.openable).toBe(true)
  })

  it('WiFi，含跳脫字元還原', () => {
    const r = parseScanPayload('WIFI:T:WPA;S:Cafe\\;Bar;P:p\\:a\\\\ss\\,1;H:true;;')
    expect(r.kind).toBe('wifi')
    expect(r.kind === 'wifi' && r.data).toEqual({
      ssid: 'Cafe;Bar', password: 'p:a\\ss,1', encryption: 'WPA', hidden: true,
    })
  })

  it('WiFi 無密碼網路', () => {
    const r = parseScanPayload('WIFI:T:nopass;S:Guest;P:;H:false;;')
    expect(r.kind === 'wifi' && r.data).toEqual({
      ssid: 'Guest', password: '', encryption: 'nopass', hidden: false,
    })
  })

  it('WiFi 缺 SSID 時當純文字處理，不產出半殘的表單資料', () => {
    expect(parseScanPayload('WIFI:T:WPA;P:secret;;').kind).toBe('text')
  })

  it('vCard', () => {
    const vcard = [
      'BEGIN:VCARD', 'VERSION:3.0', 'N:陳;小明;;;', 'FN:小明 陳',
      'ORG:口袋工具', 'TITLE:工程師', 'TEL:0912345678', 'EMAIL:a@b.co',
      'ADR:;;台北市中正區;;;;', 'URL:https://example.com', 'END:VCARD',
    ].join('\r\n')
    const r = parseScanPayload(vcard)
    expect(r.kind).toBe('vcard')
    expect(r.kind === 'vcard' && r.data).toEqual({
      firstName: '小明', lastName: '陳', phone: '0912345678', email: 'a@b.co',
      org: '口袋工具', title: '工程師', address: '台北市中正區', website: 'https://example.com',
    })
  })

  it('Email（mailto，含編碼過的主旨與內文）', () => {
    const r = parseScanPayload('mailto:a@b.co?subject=%E4%B8%BB%E6%97%A8&body=hi%20there')
    expect(r.kind).toBe('email')
    expect(r.kind === 'email' && r.data).toEqual({ to: 'a@b.co', subject: '主旨', body: 'hi there' })
  })

  it('Email 的 plus address：+ 是收件者的一部分，不是空白', () => {
    // `+` 只有在 query value 裡才代表空白；mailto 的位址部分不適用那條規則，
    // 把 casper+news@example.com 讀成 casper news@example.com 會直接寄不出去。
    const r = parseScanPayload('mailto:casper+news@example.com')
    expect(r.kind === 'email' && r.data.to).toBe('casper+news@example.com')
  })

  it('plus address 帶主旨時，位址與 query 兩邊的 + 規則各自成立', () => {
    const r = parseScanPayload('mailto:casper+news@example.com?subject=a+b')
    expect(r.kind === 'email' && r.data).toEqual({
      to: 'casper+news@example.com', subject: 'a b', body: '',
    })
  })

  it('Email（MATMSG 格式）', () => {
    const r = parseScanPayload('MATMSG:TO:a@b.co;SUB:hello;BODY:world;;')
    expect(r.kind === 'email' && r.data).toEqual({ to: 'a@b.co', subject: 'hello', body: 'world' })
  })

  it('電話', () => {
    const r = parseScanPayload('tel:+886912345678')
    expect(r.kind).toBe('phone')
    expect(r.kind === 'phone' && r.data).toEqual({ number: '+886912345678' })
  })

  it('簡訊（SMSTO 與 sms: 兩種寫法）', () => {
    const a = parseScanPayload('SMSTO:0912345678:晚點見:記得帶傘')
    expect(a.kind === 'sms' && a.data).toEqual({ number: '0912345678', message: '晚點見:記得帶傘' })
    const b = parseScanPayload('sms:0912345678?body=hi')
    expect(b.kind === 'sms' && b.data).toEqual({ number: '0912345678', message: 'hi' })
  })

  it('其他一律當純文字，不臆測型別', () => {
    for (const text of ['hello world', '', 'javascript:alert(1)', 'ftp://example.com/x', 'BEGIN:VCALENDAR']) {
      const r = parseScanPayload(text)
      expect(r.kind).toBe('text')
      expect(r.kind === 'text' && r.data).toEqual({ text })
    }
  })

  it('危險 scheme 落到純文字時仍帶得出 scheme 供 UI 說明', () => {
    const r = parseScanPayload('javascript:alert(1)')
    expect(r.uri.scheme).toBe('javascript')
    expect(r.uri.openable).toBe(false)
  })
})

describe('解析與既有 builder 必須可往返', () => {
  const cases = [
    ['url', { url: 'https://example.com/a?b=1#c' }],
    ['text', { text: '純文字 with : and ; and \\' }],
    ['wifi', { ssid: 'Cafe;Bar,"x"', password: 'p:a\\ss', encryption: 'WPA', hidden: true }],
    ['wifi', { ssid: 'Guest', password: '', encryption: 'nopass', hidden: false }],
    ['vcard', {
      firstName: '小明', lastName: '陳', phone: '0912345678', email: 'a@b.co',
      org: '口袋工具', title: '工程師', address: '台北市', website: 'https://example.com',
    }],
    ['email', { to: 'a@b.co', subject: '主旨 & 符號', body: '多行\n內容' }],
    ['email', { to: 'casper+news@example.com', subject: '電子報', body: '內容' }],
    ['phone', { number: '+886912345678' }],
    ['sms', { number: '0912345678', message: '訊息:內含冒號' }],
  ] as const

  for (const [kind, data] of cases) {
    it(`${kind}：build → parse → build 得到同一個 payload`, () => {
      const payload = buildPayload(kind, data as never)
      const parsed = parseScanPayload(payload)
      expect(parsed.kind).toBe(kind)
      expect(buildPayload(parsed.kind, parsed.data as never)).toBe(payload)
    })
  }
})
