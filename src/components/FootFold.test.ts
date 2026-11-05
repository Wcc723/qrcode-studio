import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import FootFold from './FootFold.vue'

/**
 * 頁尾本站專屬區的一欄（2026-11 手機收合）：照 WAI-ARIA 的手風琴，標題裡放按鈕。
 * 預渲染與桌機（wide）是純標題加清單，沒有按鈕；手機掛載後才換成按鈕、清單收起，點了展開。
 * 「回報問題」這類一直要看得到的東西放 after slot，不跟著收。
 */
const wrappers: VueWrapper[] = []
afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount()
  document.body.innerHTML = ''
})

function mountFold(wide: boolean) {
  const w = mount(FootFold, {
    props: { title: '關於', listId: 'foot-about', wide, listClass: 'mt-2' },
    slots: { default: '<li><a href="/about/">關於</a></li>', after: '<p data-test="always">回報問題</p>' },
    attachTo: document.body,
  })
  wrappers.push(w)
  return w
}

describe('FootFold', () => {
  it('桌機與預渲染：純 h2 加看得到的清單，沒有按鈕', () => {
    const w = mountFold(true)
    const h2 = w.get('h2')
    expect(h2.text()).toBe('關於')
    expect(h2.find('button').exists()).toBe(false)
    expect(w.get('ul').isVisible()).toBe(true)
    expect(w.get('[data-test="always"]').isVisible()).toBe(true)
  })

  it('手機：h2 裡是一顆按鈕，aria-controls 指到清單，預設收起；點了展開、再點收起', async () => {
    const w = mountFold(false)
    const btn = w.get('h2 > button')
    expect(btn.attributes('type')).toBe('button')
    expect(w.get('h2').text()).toBe('關於')
    const list = w.get('ul')
    expect(list.attributes('id')).toBe('foot-about')
    expect(btn.attributes('aria-controls')).toBe('foot-about')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(list.isVisible()).toBe(false)
    expect(w.get('[data-test="always"]').isVisible()).toBe(true)

    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(list.isVisible()).toBe(true)
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(list.isVisible()).toBe(false)
  })

  it('寬度變大（wide 變 true）就全部展開，按鈕換回純標題', async () => {
    const w = mountFold(false)
    await w.setProps({ wide: true })
    expect(w.get('h2').find('button').exists()).toBe(false)
    expect(w.get('ul').isVisible()).toBe(true)
  })
})
