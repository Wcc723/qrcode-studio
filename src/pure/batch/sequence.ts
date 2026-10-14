/**
 * 連號（流水號）：前綴＋數字（可補零）＋後綴，例如 TP-0001 到 TP-0500、店內碼 200000000001 起。
 * 純函式；輸入的是欄位上的原始文字，錯誤訊息直接給畫面用（預設繁中，英文版傳 locale）。
 */
import type { Locale } from '../../i18n/locale'

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

const MESSAGES: Record<Locale, {
  start: string; step: string; pad: string; count: string; end: string; endBeforeStart: string
  tooMany: (max: number, count: number) => string; tooBig: string
}> = {
  'zh-TW': {
    start: '起始值請填 0 或正整數。',
    step: '增量請填 1 以上的整數。',
    pad: `補零位數請填 0 到 ${MAX_PAD}。`,
    count: '數量請填 1 以上的整數。',
    end: '結束值請填 0 或正整數。',
    endBeforeStart: '結束值要大於或等於起始值。',
    tooMany: (max, count) => `一次最多 ${formatCount(max)} 筆，這樣設定會有 ${formatCount(count)} 筆，請分批產生。`,
    tooBig: '數字太大了，請把起始值或數量改小。',
  },
  en: {
    start: 'Start must be 0 or a positive whole number.',
    step: 'Step must be a whole number, 1 or more.',
    pad: `Zero padding must be 0 to ${MAX_PAD} digits.`,
    count: 'Count must be a whole number, 1 or more.',
    end: 'End must be 0 or a positive whole number.',
    endBeforeStart: 'End must be the same as or larger than start.',
    tooMany: (max, count) => `You can make up to ${formatCount(max)} at a time, and these settings make ${formatCount(count)}. Please split them into batches.`,
    tooBig: 'These numbers are too large. Use a smaller start or count.',
  },
}

/** 照設定做出整串連號；超過 `maxCount` 筆不產生，回傳錯誤請使用者分批。 */
export function buildSequence(spec: SequenceSpec, maxCount: number, locale: Locale = 'zh-TW'): SequenceResult {
  const m = MESSAGES[locale]
  const start = parseWhole(spec.start)
  if (start === null) return { ok: false, field: 'start', error: m.start }

  const step = spec.step.trim() === '' ? 1 : parseWhole(spec.step)
  if (step === null || step < 1) return { ok: false, field: 'step', error: m.step }

  const pad = spec.pad.trim() === '' ? 0 : parseWhole(spec.pad)
  if (pad === null || pad > MAX_PAD) return { ok: false, field: 'pad', error: m.pad }

  let count: number
  if (spec.until === 'count') {
    const n = parseWhole(spec.count)
    if (n === null || n < 1) return { ok: false, field: 'count', error: m.count }
    count = n
  } else {
    const end = parseWhole(spec.end)
    if (end === null) return { ok: false, field: 'end', error: m.end }
    if (end < start) return { ok: false, field: 'end', error: m.endBeforeStart }
    count = Math.floor((end - start) / step) + 1
  }
  if (count > maxCount) {
    return { ok: false, field: spec.until === 'count' ? 'count' : 'end', error: m.tooMany(maxCount, count) }
  }
  if (!Number.isSafeInteger(start + (count - 1) * step)) {
    return { ok: false, field: spec.until === 'count' ? 'count' : 'end', error: m.tooBig }
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
