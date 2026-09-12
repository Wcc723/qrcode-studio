/**
 * 一維條碼的輸入驗證與檢查碼計算。零依賴純函式，與 src/pure/build*.ts 同一層。
 *
 * 刻意不進 src/pure/index.ts 的 builders registry：那份是「QrType → QR payload 字串」
 * 的映射，一維條碼不是 QR payload，只做 export *。
 */
export type BarcodeSymbology = 'code128' | 'ean13' | 'ean8' | 'code39' | 'itf14'
export type BarcodeErrorCode = 'empty' | 'length' | 'charset' | 'checkDigit' | 'code39Star'

export interface BarcodeValidation {
  ok: boolean
  error?: string               // zh-TW 訊息，ok === true 時不存在
  code?: BarcodeErrorCode      // 機器可讀的失敗原因，ok === true 時不存在
  normalized?: string          // ok === true 時必定存在：真正送去編碼的字串
  appendedCheckDigit?: boolean // ok === true 時必定存在：檢查碼是否由工具補上
}

// 43 個字元，順序即 mod-43 權值。* 是起始／結束符號，不是資料字元，故不在其中。
export const CODE39_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%'
// 實務上限，非標準限制：0.25mm X 尺寸下 48 字元已達約 200mm 寬。
export const CODE39_MAX_LENGTH = 48
// 同上，80 字元約 229mm。
export const CODE128_MAX_LENGTH = 80

const EMPTY_MESSAGE = '請輸入條碼內容。'

/**
 * GS1 mod-10。權重自「最右資料位」起為 3，往左交替 3,1,3,1…
 *
 * 從右往左寫是刻意的：這樣就與資料位數的奇偶無關，不會踩到
 * 「EAN-13 最左位權重是 1，而 EAN-8／ITF-14 是 3」那個 off-by-one。
 * 該差異只是位數奇偶的結果（EAN-13 有 12 位，EAN-8 有 7 位，ITF-14 有 13 位）。
 */
export function gtinCheckDigit(dataDigits: string): string {
  let sum = 0
  for (let i = dataDigits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += Number(dataDigits[i]) * w
  }
  // 外層 % 10 不能省：sum 為 10 的倍數時內層得 10，會多出一個字元。
  return String((10 - (sum % 10)) % 10)
}

export function ean13CheckDigit(first12: string): string { return gtinCheckDigit(first12) }
export function ean8CheckDigit(first7: string): string { return gtinCheckDigit(first7) }
export function itf14CheckDigit(first13: string): string { return gtinCheckDigit(first13) }

/** Code 39 的 mod-43 檢查字元。標準定為選用，本工具預設不啟用。 */
export function code39CheckChar(data: string): string {
  let sum = 0
  for (const ch of data) sum += CODE39_CHARSET.indexOf(ch)
  return CODE39_CHARSET[sum % 43]
}

/** 控制字元在錯誤訊息裡顯示成 U+00XX，否則會是看不見的空白。 */
function charLabel(ch: string): string {
  const cp = ch.codePointAt(0)!
  if (cp < 0x20 || cp === 0x7f) return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
  return ch
}

/** 去重、保留首次出現順序、最多列 3 個，超過時附總數。 */
function listBad(chars: string[]): string {
  const uniq = [...new Set(chars)]
  const shown = uniq.slice(0, 3).map(c => `「${charLabel(c)}」`).join('、')
  return uniq.length > 3 ? `${shown}（共 ${uniq.length} 個）` : shown
}

function badChars(value: string, allowed: (ch: string) => boolean): string[] {
  return [...value].filter(ch => !allowed(ch))
}

const fail = (code: BarcodeErrorCode, error: string): BarcodeValidation => ({ ok: false, code, error })
const pass = (normalized: string, appendedCheckDigit: boolean): BarcodeValidation =>
  ({ ok: true, normalized, appendedCheckDigit })

interface GtinConfig { name: string; dataLen: number }
const GTIN: Record<'ean13' | 'ean8' | 'itf14', GtinConfig> = {
  ean13: { name: 'EAN-13', dataLen: 12 },
  ean8: { name: 'EAN-8', dataLen: 7 },
  itf14: { name: 'ITF-14', dataLen: 13 },
}

function validateGtin(cfg: GtinConfig, raw: string): BarcodeValidation {
  // 去掉所有空白與半角連字號，支援貼上 978-0-201-37962-4 或 5449 0000 0099 6。
  // JS 的 \s 含不斷行空白與全形空白，所以從網頁複製的號碼也吃得下。
  const digits = raw.replace(/[\s-]/g, '')
  if (!digits) return fail('empty', EMPTY_MESSAGE)

  const bad = badChars(digits, ch => ch >= '0' && ch <= '9')
  if (bad.length) {
    return fail('charset', `${cfg.name} 只能輸入數字 0 到 9。不支援的字元：${listBad(bad)}。`)
  }

  const { name, dataLen } = cfg
  if (digits.length !== dataLen && digits.length !== dataLen + 1) {
    return fail('length',
      `${name} 需要 ${dataLen} 位數字（工具會自動補上檢查碼）或 ${dataLen + 1} 位完整條碼。目前有 ${digits.length} 位。`)
  }

  if (digits.length === dataLen) return pass(digits + gtinCheckDigit(digits), true)

  const expected = gtinCheckDigit(digits.slice(0, dataLen))
  const actual = digits[dataLen]
  if (expected !== actual) {
    return fail('checkDigit',
      `檢查碼不符。${name} 前 ${dataLen} 位算出的檢查碼應該是 ${expected}，你輸入的是 ${actual}。請確認號碼，或只輸入前 ${dataLen} 位讓工具自動補。`)
  }
  return pass(digits, false)
}

function validateCode39(raw: string): BarcodeValidation {
  // Code 39 無小寫可言，自動轉大寫與所有條碼庫的既有行為一致。
  let value = raw.trim().toUpperCase()
  // 成對的前後 * 是傳統的起始／結束寫法，剝掉；算圖器會自己加回去，
  // 留著會變成 **ABC** 而掃不出來。
  if (value.length >= 2 && value.startsWith('*') && value.endsWith('*')) {
    value = value.slice(1, -1)
  }
  if (!value) return fail('empty', EMPTY_MESSAGE)

  if (value.includes('*')) {
    return fail('code39Star',
      'Code 39 的 * 是起始/結束符號，由工具自動加上，不能出現在內容裡。請移除 *，或改成成對的 *內容* 形式。')
  }

  const bad = badChars(value, ch => CODE39_CHARSET.includes(ch))
  if (bad.length) {
    return fail('charset',
      `Code 39 只支援數字、大寫英文與 - . $ / + % 和半角空白。不支援的字元：${listBad(bad)}。`)
  }

  if (value.length > CODE39_MAX_LENGTH) {
    return fail('length',
      `Code 39 最多 ${CODE39_MAX_LENGTH} 個字元，目前有 ${value.length} 個。請縮短內容，或改用 Code 128。`)
  }
  return pass(value, false)
}

function validateCode128(raw: string): BarcodeValidation {
  // 不轉大小寫：大小寫是資料。前後空白在條碼圖上看不出來，屬純貼上雜訊，去掉。
  const value = raw.trim()
  if (!value) return fail('empty', EMPTY_MESSAGE)

  // 只收可列印 ASCII 0x20–0x7E。控制字元與 FNC1–FNC4 在文字框裡無法有意義地輸入，
  // 且掃描器對它們的輸出行為差異極大，會產生無法 debug 的案例。GS1-128 不在範圍內。
  const bad = badChars(value, ch => {
    const cp = ch.codePointAt(0)!
    return cp >= 0x20 && cp <= 0x7e
  })
  if (bad.length) {
    return fail('charset',
      `Code 128 只支援可列印的 ASCII 字元。不支援的字元：${listBad(bad)}。中文或全形符號請改用 QR Code。`)
  }

  if (value.length > CODE128_MAX_LENGTH) {
    return fail('length',
      `Code 128 最多 ${CODE128_MAX_LENGTH} 個字元，目前有 ${value.length} 個。請縮短內容，太寬的條碼不容易掃描。`)
  }
  return pass(value, false)
}

/**
 * 驗證順序固定：empty → code39Star → charset → length → checkDigit。
 * 不可調換：ABCDEFGHIJKL 應報「只能輸入數字」而不是長度；54490000O996
 * 應指出把 0 打成字母 O，那是最高頻的真實輸入錯誤。
 */
export function validateBarcode(sym: BarcodeSymbology, raw: string): BarcodeValidation {
  switch (sym) {
    case 'code39': return validateCode39(raw)
    case 'code128': return validateCode128(raw)
    default: return validateGtin(GTIN[sym], raw)
  }
}
