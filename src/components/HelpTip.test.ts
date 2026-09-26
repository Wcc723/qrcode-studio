import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import HelpTip from './HelpTip.vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// vitest 不處理 CSS（?raw 會拿到空字串），直接讀檔
const mainCss = readFileSync(join(process.cwd(), 'src/styles/main.css'), 'utf8')

/**
 * 欄名旁的「?」：工具區的長說明收在這裡，點了才展開。
 * 收起來時文字仍在 DOM 與預渲染的 HTML 裡，輸入欄用 aria-describedby 指到它，報讀器照樣念得到。
 */
const wrappers: VueWrapper[] = []
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  document.body.innerHTML = ''
})

function mountTip(props: Record<string, unknown> = {}) {
  const w = mount(HelpTip, {
    props: { name: '容錯等級', ...props },
    slots: { head: '<label for="x">容錯等級</label>', default: 'L、M、Q、H 約可還原 7%、15%、25%、30% 的損毀。' },
    attachTo: document.body,
  })
  wrappers.push(w)
  return w
}

describe('HelpTip', () => {
  it('欄名與「?」在同一列，說明預設收起來但文字在 DOM 裡', () => {
    const w = mountTip()
    const head = w.find('.field-head')
    expect(head.find('label').text()).toBe('容錯等級')
    const btn = head.find('button.help-tip-btn')
    expect(btn.attributes('type')).toBe('button')
    const panel = w.find('.help-tip-panel')
    expect(panel.attributes('hidden')).toBeDefined()
    expect(panel.text()).toContain('約可還原')
  })

  it('按鈕名稱是「X的說明」，aria-expanded 與 aria-controls 指到說明', async () => {
    const w = mountTip()
    const btn = w.find('button.help-tip-btn')
    expect(btn.attributes('aria-label')).toBe('容錯等級的說明')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-controls')).toBe(w.find('.help-tip-panel').attributes('id'))
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(w.find('.help-tip-panel').attributes('hidden')).toBeUndefined()
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('false')
  })

  it('給 id 就用它（頁面要把它放進輸入欄的 aria-describedby）；沒給就自己產一個不重複的', () => {
    expect(mountTip({ id: 'ec-help' }).find('.help-tip-panel').attributes('id')).toBe('ec-help')
    // 同一個 app 裡（同一頁）兩個 HelpTip 的 id 不能撞
    const w = mount({
      components: { HelpTip },
      template: `<div><HelpTip name="a"><template #head><label>a</label></template>1</HelpTip><HelpTip name="b"><template #head><label>b</label></template>2</HelpTip></div>`,
    })
    wrappers.push(w)
    const [a, b] = w.findAll('.help-tip-panel').map((p) => p.attributes('id'))
    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
  })

  it('Esc 收起並把焦點還給按鈕（焦點在按鈕或說明裡都算）', async () => {
    const w = mountTip()
    const btn = w.find('button.help-tip-btn')
    await btn.trigger('click')
    ;(btn.element as HTMLButtonElement).focus()
    await btn.trigger('keydown', { key: 'Escape' })
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn.element)

    await btn.trigger('click')
    await w.find('.help-tip-panel').trigger('keydown', { key: 'Escape' })
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn.element)
  })

  /**
   * Mac 的 Safari 與 Firefox 用滑鼠點按鈕不會給焦點，按鍵事件落在 body，按鈕與說明框上的 Esc 監聽收不到
   * （Mac Safari 點「?」之後按 Esc 收不起來）。測試環境的 click 也不給焦點，剛好重現這個情況。
   */
  it('滑鼠點開後焦點在按鈕上：Safari 點按鈕不給焦點，Esc 仍收得起來', async () => {
    const w = mountTip()
    const btn = w.find('button.help-tip-btn')
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(document.activeElement).toBe(document.body)
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(btn.element)
    // 按鍵事件送到目前有焦點的元素，跟真瀏覽器一樣
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await w.vm.$nextTick()
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn.element)
  })

  it('收著的時候按 Esc 不攔截：外層自己的 Esc 照常運作', async () => {
    const outer = { called: 0 }
    const w = mount(
      {
        components: { HelpTip },
        template: `<div @keydown.esc="hit"><HelpTip name="尺寸"><template #head><label>尺寸</label></template>說明</HelpTip></div>`,
        methods: { hit: () => outer.called++ },
      },
      { attachTo: document.body },
    )
    wrappers.push(w)
    await w.find('button.help-tip-btn').trigger('keydown', { key: 'Escape' })
    expect(outer.called).toBe(1)
    await w.find('button.help-tip-btn').trigger('click')
    await w.find('button.help-tip-btn').trigger('keydown', { key: 'Escape' })
    expect(outer.called).toBe(1)
  })

  it('Enter／Space 開合靠原生 button（type="button"，不會送出表單）', () => {
    const w = mountTip()
    expect(w.find('button.help-tip-btn').element.tagName).toBe('BUTTON')
    expect(w.find('button.help-tip-btn').attributes('type')).toBe('button')
  })
})

describe('HelpTip 樣式契約（main.css）', () => {
  const rule = (selector: string) =>
    new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(mainCss)?.[2] ?? ''

  it('點擊區至少 24×24（WCAG 2.5.8）', () => {
    const btn = rule('.help-tip-btn')
    expect(parseFloat(/width:\s*(\d+)px/.exec(btn)?.[1] ?? '0')).toBeGreaterThanOrEqual(24)
    expect(parseFloat(/height:\s*(\d+)px/.exec(btn)?.[1] ?? '0')).toBeGreaterThanOrEqual(24)
  })

  it('說明框不自己設 display，hidden 屬性才收得起來', () => {
    expect(rule('.help-tip-panel')).not.toMatch(/display\s*:/)
    expect(mainCss).toMatch(/\.help-tip-panel\[hidden\]\s*\{\s*display:\s*none/)
  })

  it('鍵盤聚焦看得到，強制色彩時「?」有外框', () => {
    expect(rule('.help-tip-btn:focus-visible')).toContain('outline')
    const at = mainCss.lastIndexOf('.help-tip-btn')
    expect(mainCss.slice(0, at).lastIndexOf('@media (forced-colors: active)')).toBeGreaterThan(-1)
  })
})
