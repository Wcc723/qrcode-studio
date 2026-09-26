// @vitest-environment node
/**
 * main.css 的全站樣式契約。這兩件事壞掉都不會有錯誤訊息，只會安靜地讓畫面走樣：
 * - 少了框線 reset，UnoCSS 的 border-2／border-3 只有寬度沒有樣式，卡片與膠囊的粗黑框整個消失
 * - html／body 用 overflow-x: hidden，body 變成捲動容器，預覽框的 sticky 黏不住
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('./main.css', import.meta.url), 'utf8')

describe('main.css 全站契約', () => {
  it('有最小框線 reset：所有元素與偽元素預設 border-style: solid、寬度 0', () => {
    const rule = /\*,\s*::before,\s*::after[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toMatch(/border-style:\s*solid/)
    expect(rule).toMatch(/border-width:\s*0/)
  })

  it('html、body 的水平裁切用 clip（hidden 會讓預覽的 sticky 失效）', () => {
    const rule = /html,\s*body\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    const decls = [...rule.matchAll(/overflow-x:\s*([a-z]+)/g)].map((m) => m[1])
    // 最後一個宣告生效；前面的 hidden 只給不認得 clip 的舊瀏覽器
    expect(decls.at(-1)).toBe('clip')
  })
})
