/**
 * 標籤上的字用的系統字型：標楷體、微軟正黑體、新細明體三選一，不向第三方載入網頁字型。
 * 行政人員多半用 Windows 的 Edge 或 Chrome 列印，這三套一定在；Mac 與手機沒有微軟正黑體與新細明體，
 * 標楷體只有 Mac 下載了內附的「標楷體-繁」才有，瀏覽器會改用堆疊後面的字型，所以要偵測、要在畫面上講清楚「會被替換」。
 *
 * 偵測用量字寬（`detectFont`）：同一串字分別用「候選字型, 後備字型」與「後備字型」量，寬度不同就代表候選字型真的在。
 * `document.fonts.check()` 對沒有 @font-face 的系統字型一律回 true，不能用。量測函式由呼叫端注入
 * （瀏覽器裡是 canvas 的 measureText），預渲染與測試用 `estimateMeasure` 粗估。
 */

import type { Locale } from '../../i18n/locale'

export type PrintFontId = 'jhenghei' | 'kai' | 'mingliu' | 'arial' | 'verdana' | 'times'

export interface PrintFont {
  id: PrintFontId
  /** 選單上的名字 */
  label: string
  /** CSS font-family 堆疊：Windows 的名字在最前面，後面是 Mac 與其他系統的近似字型 */
  stack: string
  /** 偵測時要找的名字（任一個在就算有）：Windows 的英文名、中文名，以及 Mac 上同一套字的名字 */
  probes: string[]
  /** 偵測不到時會被換成什麼（給使用者看的說明） */
  fallbackNote: string
}

export const PRINT_FONTS: readonly PrintFont[] = [
  {
    id: 'jhenghei',
    label: '微軟正黑體',
    stack: '"Microsoft JhengHei", "微軟正黑體", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',
    probes: ['Microsoft JhengHei', '微軟正黑體'],
    fallbackNote: '會改用這台電腦的黑體（例如蘋方），字寬會略有不同',
  },
  {
    id: 'kai',
    label: '標楷體',
    // macOS 內附的標楷體（字體簿裡叫「標楷體-繁」，可能要先下載）家族名是 BiauKaiTC；
    // 只寫 BiauKai 在新版 macOS 的 Chrome 對不到，會被當成沒有、也印不出楷書。BiauKai 留給舊版 macOS。
    stack: '"DFKai-SB", "標楷體", "BiauKaiTC", "BiauKai", "Kaiti TC", "STKaiti", serif',
    probes: ['DFKai-SB', '標楷體', 'BiauKaiTC', 'BiauKai'],
    fallbackNote: '會改用其他楷書或明體字型，字寬與筆畫會不同',
  },
  {
    id: 'mingliu',
    label: '新細明體',
    stack: '"PMingLiU", "新細明體", "MingLiU", "LiSong Pro", "Apple LiSung", "Noto Serif TC", serif',
    probes: ['PMingLiU', '新細明體', 'MingLiU'],
    fallbackNote: '會改用其他明體字型，字寬與筆畫會不同',
  },
]

/**
 * 英文版的三套：Windows 與 Mac、iPhone 都內建，英文標籤最常用的無襯線、小字級最好讀的寬字、與一套襯線字。
 * Android 與部分 Linux 沒有這幾套，會改用堆疊後面的開源近似字型（Liberation、DejaVu）。
 */
export const PRINT_FONTS_EN: readonly PrintFont[] = [
  {
    id: 'arial',
    label: 'Arial',
    stack: '"Arial", "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif',
    probes: ['Arial'],
    fallbackNote: 'will use a similar sans-serif font, so text widths may differ slightly',
  },
  {
    id: 'verdana',
    label: 'Verdana',
    stack: '"Verdana", "DejaVu Sans", sans-serif',
    probes: ['Verdana'],
    fallbackNote: 'will use a similar sans-serif font, so text widths may differ slightly',
  },
  {
    id: 'times',
    label: 'Times New Roman',
    stack: '"Times New Roman", "Times", "Liberation Serif", serif',
    probes: ['Times New Roman', 'Times'],
    fallbackNote: 'will use another serif font, so text widths may differ slightly',
  },
]

/** 標籤的字小，黑體在小字級最好讀 */
export const DEFAULT_PRINT_FONT: PrintFontId = 'jhenghei'
export const DEFAULT_PRINT_FONT_EN: PrintFontId = 'arial'

/** 這個語言的字型選單與預設字型 */
export function printFontsFor(locale: Locale): { fonts: readonly PrintFont[]; defaultId: PrintFontId } {
  return locale === 'en'
    ? { fonts: PRINT_FONTS_EN, defaultId: DEFAULT_PRINT_FONT_EN }
    : { fonts: PRINT_FONTS, defaultId: DEFAULT_PRINT_FONT }
}

export function printFont(id: PrintFontId): PrintFont {
  return PRINT_FONTS.find(f => f.id === id) ?? PRINT_FONTS_EN.find(f => f.id === id) ?? PRINT_FONTS[0]!
}

/** 量字寬的函式：給 CSS font 簡寫與文字，回傳寬度（px）。瀏覽器裡由 canvas 提供，測試可以注入 */
export type MeasureText = (font: string, text: string) => number

/** 中英混合，中文字選筆畫與字寬在各字型差異大的字 */
const SAMPLE = '永東國酬愛鬱靈鷹袋桌牌 mmmmmmmmmmlli 0123456789'
const FALLBACKS = ['monospace', 'serif', 'sans-serif'] as const

function quote(family: string): string {
  return `"${family.replace(/"/g, '\\"')}"`
}

/** 候選字型只要讓其中一種後備字型的量測結果改變，就代表它在這台電腦上 */
export function hasFont(family: string, measure: MeasureText): boolean {
  return FALLBACKS.some((fallback) => {
    const base = measure(`72px ${fallback}`, SAMPLE)
    const probe = measure(`72px ${quote(family)}, ${fallback}`, SAMPLE)
    return Math.abs(probe - base) > 0.5
  })
}

export function detectFont(font: PrintFont, measure: MeasureText): boolean {
  return font.probes.some(family => hasFont(family, measure))
}

/** 量測時用的字級（px）：夠大，量出來的寬度才不會因為次像素取整而失真 */
export const REFERENCE_PX = 100

/**
 * 沒有 canvas 時的粗估：中文、全形 1em，英文大寫 0.68、小寫 0.52、數字 0.56、空白 0.3，其他 0.6。
 * 只用在預渲染與測試，瀏覽器裡一律換成 canvas 的實際量測。
 */
export const estimateMeasure: MeasureText = (font, text) => {
  const px = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? REFERENCE_PX)
  let em = 0
  for (const char of text) {
    if (/[⺀-鿿가-힯豈-﫿＀-￯　-〿…]/u.test(char)) em += 1
    else if (/[A-Z]/.test(char)) em += 0.68
    else if (/[a-z]/.test(char)) em += 0.52
    else if (/[0-9]/.test(char)) em += 0.56
    else if (char === ' ') em += 0.3
    else em += 0.6
  }
  return em * px
}

/** 量過的字存起來：同一份清單改選項時不必重量（換字型或粗細是不同的 key） */
export function cachedMeasure(measure: MeasureText): MeasureText {
  const cache = new Map<string, number>()
  return (font, text) => {
    const key = `${font}\u0000${text}`
    let width = cache.get(key)
    if (width === undefined) {
      if (cache.size > 20_000) cache.clear()
      width = measure(font, text)
      cache.set(key, width)
    }
    return width
  }
}

/** 這串字在 1em 字級下有多寬（em），空字串是 0 */
export function emWidth(measure: MeasureText, family: string, weight: number, text: string): number {
  if (!text) return 0
  return measure(`${weight} ${REFERENCE_PX}px ${family}`, text) / REFERENCE_PX
}
