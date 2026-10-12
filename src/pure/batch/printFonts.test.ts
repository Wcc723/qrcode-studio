import { describe, it, expect } from 'vitest'
import { PRINT_FONTS, detectFont, estimateMeasure, printFont, type MeasureText } from './printFonts'

/**
 * 假的量字：只認得 installed 裡的家族名（照 CSS 的寫法，引號裡的名字要完全一樣才算），
 * 認得的字型寬度跟後備字型不同；其他一律落到後備字型。
 */
function machine(installed: string[]): MeasureText {
  return (font, text) => {
    const families = [...font.matchAll(/"([^"]+)"/g)].map(m => m[1]!)
    const hit = families.find(f => installed.includes(f))
    const fallback = /monospace/.test(font) ? 0.6 : /sans-serif/.test(font) ? 0.55 : 0.5
    const em = hit ? 0.9 + installed.indexOf(hit) * 0.01 : fallback
    return estimateMeasure(font, text) * em
  }
}

const kai = printFont('kai')
const mingliu = printFont('mingliu')
const jhenghei = printFont('jhenghei')

describe('偵測這台電腦有沒有選的字型', () => {
  it('Windows：三套都在', () => {
    const win = machine(['Microsoft JhengHei', 'DFKai-SB', 'PMingLiU'])
    for (const f of PRINT_FONTS) expect(detectFont(f, win), f.id).toBe(true)
  })

  it('新版 macOS 下載了內附的標楷體（家族名 BiauKaiTC）：認得出標楷體，新細明體與微軟正黑體照樣提醒', () => {
    const mac = machine(['BiauKaiTC', '標楷體-繁', 'PingFang TC', 'LiSong Pro'])
    expect(detectFont(kai, mac)).toBe(true)
    expect(detectFont(mingliu, mac)).toBe(false)
    expect(detectFont(jhenghei, mac)).toBe(false)
  })

  it('舊版 macOS 的 BiauKai 也認得；沒下載標楷體的 Mac 要提醒', () => {
    expect(detectFont(kai, machine(['BiauKai']))).toBe(true)
    expect(detectFont(kai, machine(['PingFang TC', 'Kaiti TC']))).toBe(false)
  })

  it('偵測得到的名字都在 CSS 堆疊裡：認得出來就真的用它列印', () => {
    for (const f of PRINT_FONTS) {
      for (const probe of f.probes) expect(f.stack, `${f.id} ${probe}`).toContain(`"${probe}"`)
    }
  })
})
