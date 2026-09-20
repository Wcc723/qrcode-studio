import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  putScanHandoff, takeScanHandoff, clearScanHandoff, buildScanHandoff, scanHandoffRoute,
} from './scan-handoff'
import { toScanOutcome } from '@/pure/scanResult'
import { buildPayload } from '@/pure'

function singleResult(format: string, text: string) {
  const outcome = toScanOutcome([{ format, text }])
  if (outcome.status !== 'single') throw new Error('fixture 應該是單一結果')
  return outcome.result
}

beforeEach(() => clearScanHandoff())
afterEach(() => vi.restoreAllMocks())

describe('一次性交棒', () => {
  it('放進去之後可以取出來', () => {
    putScanHandoff({ kind: 'qr', type: 'text', data: { text: 'hello' } })
    expect(takeScanHandoff()).toEqual({ kind: 'qr', type: 'text', data: { text: 'hello' } })
  })

  it('取過就沒了：同一筆不會被第二個頁面再吃一次', () => {
    putScanHandoff({ kind: 'qr', type: 'text', data: { text: 'hello' } })
    takeScanHandoff()
    expect(takeScanHandoff()).toBeNull()
  })

  it('沒放過東西時回 null', () => {
    expect(takeScanHandoff()).toBeNull()
  })

  it('再放一次會覆蓋前一筆，不會堆積成歷史紀錄', () => {
    putScanHandoff({ kind: 'qr', type: 'text', data: { text: 'first' } })
    putScanHandoff({ kind: 'qr', type: 'text', data: { text: 'second' } })
    expect(takeScanHandoff()).toEqual({ kind: 'qr', type: 'text', data: { text: 'second' } })
    expect(takeScanHandoff()).toBeNull()
  })
})

describe('交棒內容不得離開記憶體', () => {
  it('不寫 localStorage / sessionStorage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    putScanHandoff({ kind: 'qr', type: 'wifi', data: { ssid: 'Cafe', password: 'secret', encryption: 'WPA', hidden: false } })
    takeScanHandoff()
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('不動到網址（query 或 hash）', () => {
    const before = window.location.href
    putScanHandoff({ kind: 'barcode', symbology: 'ean13', value: '4710088331236' })
    takeScanHandoff()
    expect(window.location.href).toBe(before)
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
  })

  it('不寫 cookie', () => {
    putScanHandoff({ kind: 'qr', type: 'text', data: { text: 'secret' } })
    expect(document.cookie).toBe('')
  })
})

describe('從解碼結果組出交棒內容', () => {
  it('QR Code 依解析出的型別交棒，且 payload 可以還原成同一個字串', () => {
    const result = singleResult('QRCode', 'WIFI:T:WPA;S:Cafe;P:pw;H:false;;')
    const handoff = buildScanHandoff(result)
    expect(handoff).toEqual({
      kind: 'qr', type: 'wifi',
      data: { ssid: 'Cafe', password: 'pw', encryption: 'WPA', hidden: false },
    })
    expect(handoff && handoff.kind === 'qr' && buildPayload(handoff.type, handoff.data as never)).toBe(result.text)
  })

  it('純文字 QR 交棒到純文字產生器', () => {
    expect(buildScanHandoff(singleResult('QRCode', 'hello'))).toEqual({
      kind: 'qr', type: 'text', data: { text: 'hello' },
    })
  })

  it('一維碼交棒到條碼產生器，帶符號學與原始值', () => {
    expect(buildScanHandoff(singleResult('EAN13', '4710088331236'))).toEqual({
      kind: 'barcode', symbology: 'ean13', value: '4710088331236',
    })
    expect(buildScanHandoff(singleResult('ITF', '15400141288763'))).toEqual({
      kind: 'barcode', symbology: 'itf14', value: '15400141288763',
    })
  })
})

describe('交棒目標路由', () => {
  it('七種 QR 型別各自對到既有 landing page', () => {
    const expected = {
      url: '/url/', wifi: '/wifi/', vcard: '/vcard/', text: '/text/',
      email: '/email/', phone: '/phone/', sms: '/sms/',
    } as const
    for (const [type, path] of Object.entries(expected)) {
      expect(scanHandoffRoute({ kind: 'qr', type: type as keyof typeof expected, data: {} as never })).toBe(path)
    }
  })

  it('一維碼一律對到 /barcode/', () => {
    expect(scanHandoffRoute({ kind: 'barcode', symbology: 'code128', value: 'ABC' })).toBe('/barcode/')
  })

  it('路由不帶子路徑前綴，前綴由 router base 提供', () => {
    expect(scanHandoffRoute({ kind: 'qr', type: 'url', data: {} as never })).not.toContain('qrcode-studio')
  })
})
