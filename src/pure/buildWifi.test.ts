import { describe, it, expect } from 'vitest'
import { buildWifi } from './buildWifi'

describe('buildWifi', () => {
  it('產生 WPA 標準字串', () => {
    expect(buildWifi({ ssid: 'MyNet', password: 'pass123', encryption: 'WPA', hidden: false }))
      .toBe('WIFI:T:WPA;S:MyNet;P:pass123;H:false;;')
  })
  it('開放網路 (nopass) 不含密碼且 T 為 nopass', () => {
    expect(buildWifi({ ssid: 'Free', password: '', encryption: 'nopass', hidden: false }))
      .toBe('WIFI:T:nopass;S:Free;P:;H:false;;')
  })
  it('跳脫特殊字元 \\ ; , : "', () => {
    expect(buildWifi({ ssid: 'a;b,c', password: 'p:q"r\\s', encryption: 'WPA', hidden: true }))
      .toBe('WIFI:T:WPA;S:a\\;b\\,c;P:p\\:q\\"r\\\\s;H:true;;')
  })
  it('SSID 為空回傳空字串', () => {
    expect(buildWifi({ ssid: '', password: 'x', encryption: 'WPA', hidden: false })).toBe('')
  })
})
