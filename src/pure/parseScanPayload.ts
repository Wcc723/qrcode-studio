/**
 * QR payload → 站內產生器型別的解析。零依賴、零 DOM 的純函式。
 *
 * 設計約束：
 * - 每個 kind 的 `data` 形狀就是 src/pure/build*.ts 的輸入型別，所以
 *   `buildPayload(parse(p).kind, parse(p).data) === p` 必須成立（往返測試釘住）。
 *   「用此內容重新產生」靠的就是這個往返，不必另寫一套表單模型。
 * - 判不出來就是 `text`，絕不臆測。半殘的結構（例如缺 SSID 的 WIFI:）也回 text，
 *   寧可讓使用者看到原文，也不要把錯的欄位倒進產生器。
 * - 解析結果只是資料；是否可以點開由 `classifyUri` 單獨決定，且只認 http/https。
 */
import type { QrType } from '@/types'
import type { UrlInputData } from './buildUrl'
import type { TextInputData } from './buildText'
import type { WifiInputData, WifiEncryption } from './buildWifi'
import type { VCardInputData } from './buildVCard'
import type { EmailInputData } from './buildEmail'
import type { PhoneInputData } from './buildPhone'
import type { SmsInputData } from './buildSms'

export interface UriInfo {
  /** 小寫、不含冒號；不是 URI 時為 null。 */
  scheme: string | null
  /** 只有 http/https 才有意義；國際化網域會是 punycode，避免同形字混淆。 */
  host: string | null
  /** 只有 http/https 且 host 非空才為 true。 */
  openable: boolean
  /** openable 為 true 時的正規化絕對網址，否則為 null。UI 只能拿這個當 href。 */
  href: string | null
}

const NO_URI: UriInfo = { scheme: null, host: null, openable: false, href: null }

/** 只有這兩個 scheme 允許提供直接開啟。其餘（含未知 scheme）一律只顯示文字。 */
const OPENABLE_SCHEMES = new Set(['http', 'https'])

/**
 * 去掉前後空白與 C0／C1 控制字元再判定。
 * `\u0000javascript:` 這種前綴在部分解析器裡會被忽略掉，不先剝掉就會判成「非 URI」
 * 而漏掉警示；剝掉之後才會正確地被認成 javascript scheme 並標成不可開啟。
 */
function normalizeUriText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/^[\s\u0000-\u001f\u007f-\u009f]+/, '').replace(/[\s\u0000-\u001f]+$/, '')
}

export function classifyUri(text: string): UriInfo {
  const t = normalizeUriText(text)
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(t)
  if (!m) return NO_URI
  const scheme = m[1].toLowerCase()
  if (!OPENABLE_SCHEMES.has(scheme)) return { scheme, host: null, openable: false, href: null }
  let url: URL
  try {
    url = new URL(t)
  } catch {
    return { scheme, host: null, openable: false, href: null }
  }
  if (!url.hostname) return { scheme, host: null, openable: false, href: null }
  return { scheme, host: url.hostname, openable: true, href: url.href }
}

export type ParsedScanPayload =
  | { kind: 'url'; data: UrlInputData; uri: UriInfo }
  | { kind: 'text'; data: TextInputData; uri: UriInfo }
  | { kind: 'wifi'; data: WifiInputData; uri: UriInfo }
  | { kind: 'vcard'; data: VCardInputData; uri: UriInfo }
  | { kind: 'email'; data: EmailInputData; uri: UriInfo }
  | { kind: 'phone'; data: PhoneInputData; uri: UriInfo }
  | { kind: 'sms'; data: SmsInputData; uri: UriInfo }

/** 解析結果的 kind 一定是既有的 QrType，才能直接交棒給對應產生器。 */
export type ParsedKind = ParsedScanPayload['kind'] & QrType

/* ---------------- WIFI:T:…;S:…;P:…;H:…;; ---------------- */

/**
 * WIFI 與 MATMSG 的欄位值用反斜線跳脫 `\ ; , : "`。要一個字元一個字元走，
 * 用 split(';') 會把跳脫過的分號也切開。
 */
function splitEscapedFields(body: string): string[] {
  const fields: string[] = []
  let cur = ''
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '\\' && i + 1 < body.length) { cur += body[i + 1]; i++; continue }
    if (ch === ';') { fields.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) fields.push(cur)
  return fields
}

function parseWifi(text: string): WifiInputData | null {
  const body = text.slice('WIFI:'.length)
  const fields = splitEscapedFields(body)
  const map = new Map<string, string>()
  for (const f of fields) {
    const i = f.indexOf(':')
    if (i <= 0) continue
    const key = f.slice(0, i).toUpperCase()
    if (!map.has(key)) map.set(key, f.slice(i + 1))
  }
  const ssid = map.get('S') ?? ''
  if (!ssid) return null
  const rawType = (map.get('T') ?? '').toUpperCase()
  const encryption: WifiEncryption = rawType === 'WEP' ? 'WEP' : rawType === 'NOPASS' || rawType === '' ? 'nopass' : 'WPA'
  return {
    ssid,
    password: encryption === 'nopass' ? '' : (map.get('P') ?? ''),
    encryption,
    hidden: (map.get('H') ?? '').toLowerCase() === 'true',
  }
}

/* ---------------- vCard ---------------- */

const EMPTY_VCARD: VCardInputData = {
  firstName: '', lastName: '', phone: '', email: '',
  org: '', title: '', address: '', website: '',
}

function parseVCard(text: string): VCardInputData | null {
  const lines = text.split(/\r\n|\r|\n/)
  const d: VCardInputData = { ...EMPTY_VCARD }
  let sawField = false
  for (const line of lines) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    // 屬性可能帶參數（TEL;TYPE=CELL:…），取分號前那段當名稱
    const name = line.slice(0, i).split(';')[0].trim().toUpperCase()
    const value = line.slice(i + 1)
    switch (name) {
      case 'N': {
        const parts = value.split(';')
        d.lastName = parts[0] ?? ''
        d.firstName = parts[1] ?? ''
        sawField = true
        break
      }
      case 'ORG': d.org = value; sawField = true; break
      case 'TITLE': d.title = value; sawField = true; break
      case 'TEL': if (!d.phone) { d.phone = value; sawField = true } break
      case 'EMAIL': if (!d.email) { d.email = value; sawField = true } break
      case 'ADR': d.address = value.split(';')[2] ?? ''; sawField = true; break
      case 'URL': d.website = value; sawField = true; break
      case 'FN': if (!d.firstName && !d.lastName) { d.firstName = value; sawField = true } break
    }
  }
  return sawField ? d : null
}

/* ---------------- mailto: / MATMSG: ---------------- */

/** query value 的解碼：`+` 在 application/x-www-form-urlencoded 裡代表空白。 */
function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

/**
 * 位址的解碼：**不能**把 `+` 換成空白。`+` 代表空白只是 query string 的慣例，
 * mailto 的收件者部分不適用；plus address（casper+news@example.com）很常見，
 * 換成空白會把一個能用的信箱變成寄不出去的字串，而且畫面上看起來還很合理。
 */
function decodeAddress(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseMailto(text: string): EmailInputData | null {
  const rest = text.slice('mailto:'.length)
  const qIndex = rest.indexOf('?')
  const to = decodeAddress(qIndex === -1 ? rest : rest.slice(0, qIndex)).trim()
  if (!to) return null
  const data: EmailInputData = { to, subject: '', body: '' }
  if (qIndex !== -1) {
    for (const pair of rest.slice(qIndex + 1).split('&')) {
      const eq = pair.indexOf('=')
      if (eq <= 0) continue
      const key = pair.slice(0, eq).toLowerCase()
      const value = decodeParam(pair.slice(eq + 1))
      if (key === 'subject') data.subject = value
      else if (key === 'body') data.body = value
    }
  }
  return data
}

function parseMatmsg(text: string): EmailInputData | null {
  const fields = splitEscapedFields(text.slice('MATMSG:'.length))
  const map = new Map<string, string>()
  for (const f of fields) {
    const i = f.indexOf(':')
    if (i <= 0) continue
    const key = f.slice(0, i).toUpperCase()
    if (!map.has(key)) map.set(key, f.slice(i + 1))
  }
  const to = (map.get('TO') ?? '').trim()
  if (!to) return null
  return { to, subject: map.get('SUB') ?? '', body: map.get('BODY') ?? '' }
}

/* ---------------- tel: / SMSTO: / sms: ---------------- */

function parseSmsto(text: string): SmsInputData | null {
  const rest = text.slice(text.indexOf(':') + 1)
  const sep = rest.indexOf(':')
  const number = (sep === -1 ? rest : rest.slice(0, sep)).trim()
  if (!number) return null
  return { number, message: sep === -1 ? '' : rest.slice(sep + 1) }
}

function parseSmsUri(text: string): SmsInputData | null {
  const rest = text.slice(text.indexOf(':') + 1)
  const qIndex = rest.indexOf('?')
  const number = (qIndex === -1 ? rest : rest.slice(0, qIndex)).trim()
  if (!number) return null
  let message = ''
  if (qIndex !== -1) {
    for (const pair of rest.slice(qIndex + 1).split('&')) {
      const eq = pair.indexOf('=')
      if (eq > 0 && pair.slice(0, eq).toLowerCase() === 'body') message = decodeParam(pair.slice(eq + 1))
    }
  }
  return { number, message }
}

/* ---------------- 入口 ---------------- */

export function parseScanPayload(text: string): ParsedScanPayload {
  const uri = classifyUri(text)
  const asText = (): ParsedScanPayload => ({ kind: 'text', data: { text }, uri })
  const upper = text.slice(0, 8).toUpperCase()

  if (upper.startsWith('WIFI:')) {
    const data = parseWifi(text)
    return data ? { kind: 'wifi', data, uri } : asText()
  }
  if (upper.startsWith('MATMSG:')) {
    const data = parseMatmsg(text)
    return data ? { kind: 'email', data, uri } : asText()
  }
  if (upper.startsWith('SMSTO:')) {
    const data = parseSmsto(text)
    return data ? { kind: 'sms', data, uri } : asText()
  }
  if (upper.startsWith('SMS:')) {
    const data = text.includes('?') ? parseSmsUri(text) : parseSmsto(text)
    return data ? { kind: 'sms', data, uri } : asText()
  }
  if (/^BEGIN:VCARD/i.test(text)) {
    const data = parseVCard(text)
    return data ? { kind: 'vcard', data, uri } : asText()
  }
  if (uri.scheme === 'mailto') {
    const data = parseMailto(text)
    return data ? { kind: 'email', data, uri } : asText()
  }
  if (uri.scheme === 'tel') {
    const number = text.slice('tel:'.length).trim()
    return number ? { kind: 'phone', data: { number }, uri } : asText()
  }
  if (uri.openable) {
    return { kind: 'url', data: { url: text.trim() }, uri }
  }
  return asText()
}
