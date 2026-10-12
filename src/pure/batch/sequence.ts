/**
 * 連號（流水號）：前綴＋數字（可補零）＋後綴，例如 TP-0001 到 TP-0500、店內碼 200000000001 起。
 * 純函式；輸入的是欄位上的原始文字，錯誤訊息直接給畫面用。
 */

export interface SequenceSpec {
  prefix: string
  /** 起始值 */
  start: string
  /** 用「數量」還是「結束值」決定有幾筆 */
  until: 'count' | 'end'
  count: string
  end: string
  /** 增量（每一筆加多少） */
  step: string
  /** 補零到幾位；空白或 0 表示不補 */
  pad: string
  suffix: string
}

export type SequenceField = 'start' | 'count' | 'end' | 'step' | 'pad'

export type SequenceResult =
  | { ok: true; values: string[] }
  | { ok: false; field: SequenceField; error: string }

/** 補零最多幾位：EAN-13 的 12 位、ITF-14 的 13 位都放得下 */
export const MAX_PAD = 20

/** 2000 → 2,000 */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 全形數字轉半形、去掉前後空白；不是非負整數就回 null */
function parseWhole(raw: string): number | null {
  const text = raw.trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  if (!/^\d+$/.test(text)) return null
  const n = Number(text)
  return Number.isSafeInteger(n) ? n : null
}

/** 照設定做出整串連號；超過 `maxCount` 筆不產生，回傳錯誤請使用者分批。 */
export function buildSequence(spec: SequenceSpec, maxCount: number): SequenceResult {
  const start = parseWhole(spec.start)
  if (start === null) return { ok: false, field: 'start', error: '起始值請填 0 或正整數。' }

  const step = spec.step.trim() === '' ? 1 : parseWhole(spec.step)
  if (step === null || step < 1) return { ok: false, field: 'step', error: '增量請填 1 以上的整數。' }

  const pad = spec.pad.trim() === '' ? 0 : parseWhole(spec.pad)
  if (pad === null || pad > MAX_PAD) return { ok: false, field: 'pad', error: `補零位數請填 0 到 ${MAX_PAD}。` }

  let count: number
  if (spec.until === 'count') {
    const n = parseWhole(spec.count)
    if (n === null || n < 1) return { ok: false, field: 'count', error: '數量請填 1 以上的整數。' }
    count = n
  } else {
    const end = parseWhole(spec.end)
    if (end === null) return { ok: false, field: 'end', error: '結束值請填 0 或正整數。' }
    if (end < start) return { ok: false, field: 'end', error: '結束值要大於或等於起始值。' }
    count = Math.floor((end - start) / step) + 1
  }
  if (count > maxCount) {
    return {
      ok: false,
      field: spec.until === 'count' ? 'count' : 'end',
      error: `一次最多 ${formatCount(maxCount)} 筆，這樣設定會有 ${formatCount(count)} 筆，請分批產生。`,
    }
  }
  if (!Number.isSafeInteger(start + (count - 1) * step)) {
    return { ok: false, field: spec.until === 'count' ? 'count' : 'end', error: '數字太大了，請把起始值或數量改小。' }
  }

  const values: string[] = []
  for (let k = 0; k < count; k++) {
    values.push(`${spec.prefix}${String(start + k * step).padStart(pad, '0')}${spec.suffix}`)
  }
  return { ok: true, values }
}

/** 畫面上即時顯示的前三筆與最後一筆（只有三筆以內時沒有最後一筆） */
export function sequencePreview(values: readonly string[]): { head: string[]; last: string | null } {
  return { head: values.slice(0, 3), last: values.length > 3 ? values[values.length - 1]! : null }
}
