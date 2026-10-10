/**
 * 手機底部預覽列什麼時候出現（usePreviewDock）。三個條件都只在 onMounted 之後才有值：
 * 預渲染與 hydrate 時一律是 false，預覽列不會出現在預渲染的 HTML 上。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { usePreviewDock, NARROW_QUERY, KEYBOARD_MIN_PX, KEYBOARD_FIELD, KEYBOARD_ARM_MS } from './usePreviewDock'

type Api = ReturnType<typeof usePreviewDock>

function host() {
  let api!: Api
  const Host = defineComponent({
    setup() {
      const end = ref<HTMLElement | null>(null)
      api = usePreviewDock(end)
      return () => h('div', [h('div', { ref: end, 'data-test': 'end' })])
    },
  })
  const wrapper = mount(Host)
  return { wrapper, api: () => api }
}

/** 假的 IntersectionObserver：記下 callback 與選項，測試自己決定什麼時候通知 */
function fakeIO() {
  const state = { cb: null as IntersectionObserverCallback | null, options: undefined as IntersectionObserverInit | undefined, disconnected: false, observed: [] as Element[] }
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) { state.cb = cb; state.options = options }
    observe(el: Element) { state.observed.push(el) }
    disconnect() { state.disconnected = true }
  })
  const fire = (isIntersecting: boolean) => state.cb?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
  return { state, fire }
}

/**
 * 假的 visualViewport（可見高度、寬度、放大倍率）與版面高度（documentElement.clientHeight），改完發 resize。
 * - set：只有可見範圍變（iOS Safari、Android Chrome 的鍵盤，網址列收合，雙指放大）
 * - resize：版面跟著一起變（視窗本身變矮：分割畫面、拉矮視窗；或是會縮版面的鍵盤：Android App 內建的瀏覽器）
 */
function fakeViewport(init = { width: 390, height: 664, scale: 1 }) {
  const listeners = new Set<() => void>()
  const vv = {
    ...init,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
  }
  let layout = init.height
  vi.stubGlobal('visualViewport', vv)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockImplementation(() => layout)
  const fire = () => { for (const f of listeners) f() }
  const set = (next: Partial<typeof init>) => { Object.assign(vv, next); fire() }
  const resize = (height: number) => { layout = height; vv.height = height; fire() }
  return { vv, set, resize, listeners }
}

function fakeMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mq = { matches, media: NARROW_QUERY, addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return { mq, flip(v: boolean) { mq.matches = v; for (const f of listeners) f() }, listeners }
}

/** 焦點放到一個欄位上（模擬點了欄位）；回傳那個欄位 */
function focusField(tag: 'input' | 'textarea' | 'select' = 'input', type = 'url') {
  const el = document.createElement(tag)
  if (el instanceof HTMLInputElement) el.type = type
  document.body.append(el)
  el.focus()
  return el
}
/** 在欄位裡打字 */
const type = (el: Element) => el.dispatchEvent(new Event('input', { bubbles: true }))
/** 點一下（手指或滑鼠按下去） */
const press = (el: Element) => el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
/** focusout 之後晚一拍才重新判斷 */
const tick = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  document.body.innerHTML = ''
})

describe('usePreviewDock', () => {
  it('預渲染（SSR）時三個條件都是 false', async () => {
    let api!: Api
    const app = createSSRApp(defineComponent({
      setup() { api = usePreviewDock(ref(null)); return () => h('div') },
    }))
    await renderToString(app)
    expect([api.narrow.value, api.endBelow.value, api.keyboardOpen.value]).toEqual([false, false, false])
  })

  it('螢幕寬度：照 md 斷點以下的 media query，轉向或拉寬會跟著變', () => {
    const m = fakeMatchMedia(true)
    const { api } = host()
    expect(window.matchMedia).toHaveBeenCalledWith(NARROW_QUERY)
    expect(api().narrow.value).toBe(true)
    m.flip(false)
    expect(api().narrow.value).toBe(false)
  })

  it('預覽區的底：還在視窗下方才算 endBelow；觀察範圍往上延伸，從頁尾跳回頂端也收得到通知', () => {
    const io = fakeIO()
    const { wrapper, api } = host()
    expect(io.state.observed[0]).toBe(wrapper.find('[data-test="end"]').element)
    // 上緣往上延伸到很遠：相交 = 不在下方。只看視窗本身的話「上方 → 下方」不會觸發通知
    const top = parseInt(String(io.state.options?.rootMargin).split(' ')[0], 10)
    expect(top).toBeGreaterThanOrEqual(10000)
    expect(String(io.state.options?.rootMargin).split(' ').slice(1)).toEqual(['0px', '0px', '0px'])
    io.fire(false)
    expect(api().endBelow.value).toBe(true)
    io.fire(true)
    expect(api().endBelow.value).toBe(false)
  })

  it('虛擬鍵盤：在欄位裡輸入、可見高度又比最高值少超過門檻才算開著；網址列收合那種小變化不算', () => {
    const v = fakeViewport()
    const { api } = host()
    expect(api().keyboardOpen.value).toBe(false)
    focusField()
    v.set({ height: 664 - (KEYBOARD_MIN_PX - 60) }) // 網址列展開
    expect(api().keyboardOpen.value).toBe(false)
    v.set({ height: 364 }) // 鍵盤開
    expect(api().keyboardOpen.value).toBe(true)
    v.set({ height: 664 }) // 鍵盤收（Android 按返回鍵時欄位還留著焦點，一樣算收起來）
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('沒有欄位在輸入時變矮不算鍵盤：分割畫面、拉矮視窗，預覽列照樣出現', () => {
    const v = fakeViewport()
    const { api } = host()
    v.resize(364) // 上下分割畫面，寬度不變、高度剩一半
    expect(api().keyboardOpen.value).toBe(false)
    // 分割之後點欄位：基準換成分割後的高度，鍵盤一開照樣收起來
    focusField()
    v.set({ height: 364 })
    expect(api().keyboardOpen.value).toBe(false)
    v.set({ height: 164 })
    expect(api().keyboardOpen.value).toBe(true)
    v.set({ height: 364 }) // 收鍵盤（焦點還在欄位上）
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('焦點還留在剛打完字的欄位上，視窗本身變矮（拉矮視窗）不算鍵盤；之後再點欄位、鍵盤升起照樣收起來', () => {
    const v = fakeViewport()
    const { api } = host()
    const field = focusField('textarea')
    type(field)
    v.resize(564) // 拖矮視窗：一路變矮，還沒超過門檻
    expect(api().keyboardOpen.value).toBe(false)
    v.resize(364) // 超過門檻：版面跟著變矮，又不是剛點了欄位
    expect(api().keyboardOpen.value).toBe(false)
    // 點到按鈕不算點欄位
    const btn = document.createElement('button')
    document.body.append(btn)
    press(btn)
    v.resize(164)
    expect(api().keyboardOpen.value).toBe(false)
    // 再點一下欄位（焦點本來就在上面，沒有 focusin），鍵盤升起：以拉矮後的高度為基準
    press(field)
    v.set({ height: 0 })
    expect(api().keyboardOpen.value).toBe(true)
  })

  it('Android 按返回鍵收鍵盤（焦點留著）之後進上下分割畫面：不算鍵盤', () => {
    const v = fakeViewport()
    const { api } = host()
    const field = focusField()
    v.set({ height: 364 }) // 鍵盤升起：只縮可見範圍
    expect(api().keyboardOpen.value).toBe(true)
    type(field)
    v.set({ height: 664 }) // 返回鍵收鍵盤
    expect(api().keyboardOpen.value).toBe(false)
    v.resize(364) // 上下分割畫面
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('只縮可見範圍、版面沒變就是鍵盤，不管多久以前點的欄位（iOS Safari、Android Chrome）', () => {
    vi.useFakeTimers()
    const v = fakeViewport()
    const { api } = host()
    const field = focusField()
    type(field)
    vi.advanceTimersByTime(KEYBOARD_ARM_MS * 3)
    v.set({ height: 364 })
    expect(api().keyboardOpen.value).toBe(true)
  })

  it('會縮版面的鍵盤（Android App 內建的瀏覽器）：剛點了欄位、還沒打字時變矮才算鍵盤', () => {
    vi.useFakeTimers()
    const v = fakeViewport()
    const { api } = host()
    const field = focusField()
    v.resize(364) // 點了欄位，鍵盤升起、整個版面跟著縮
    expect(api().keyboardOpen.value).toBe(true)
    type(field)
    v.resize(664) // 返回鍵收鍵盤
    expect(api().keyboardOpen.value).toBe(false)
    press(field) // 再點同一個欄位，鍵盤再出來
    v.resize(364)
    expect(api().keyboardOpen.value).toBe(true)
    v.resize(664)
    expect(api().keyboardOpen.value).toBe(false)
    // 點了欄位之後過了一陣子才變矮：是視窗本身
    press(field)
    vi.advanceTimersByTime(KEYBOARD_ARM_MS + 1)
    v.resize(364)
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('勾選框、顏色、按鈕有焦點時變矮也不算鍵盤；下拉選單算（iOS 的選單滾輪佔鍵盤的位置）', () => {
    for (const [tag, type, expected] of [['input', 'checkbox', false], ['input', 'color', false], ['input', 'button', false], ['input', 'text', true], ['textarea', '', true], ['select', '', true]] as const) {
      const v = fakeViewport()
      const { api, wrapper } = host()
      const el = focusField(tag, type)
      expect(el.matches(KEYBOARD_FIELD), `${tag} ${type}`).toBe(expected)
      v.set({ height: 364 })
      expect(api().keyboardOpen.value, `${tag} ${type}`).toBe(expected)
      wrapper.unmount()
      el.remove()
    }
  })

  it('鍵盤開著時焦點離開欄位（點旁邊、按完成）：馬上算收起來，不必等高度再變', async () => {
    const v = fakeViewport()
    const { api } = host()
    const field = focusField('textarea')
    v.set({ height: 364 })
    expect(api().keyboardOpen.value).toBe(true)
    // 離開欄位後高度沒有再變（變矮的其實是分割畫面或拉矮的視窗）：以前要等寬度改變才會重新判斷，預覽列一直不出現
    field.blur()
    await tick()
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('雙指放大不算鍵盤：可見高度乘回放大倍率再比', () => {
    const v = fakeViewport()
    const { api } = host()
    v.set({ width: 195, height: 332, scale: 2 })
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('轉向（寬度變了）重新找最高值：橫向本來就比較矮，不能當成鍵盤', () => {
    const v = fakeViewport()
    const { api } = host()
    focusField()
    v.set({ width: 664, height: 340 })
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('卸載時把監聽與觀察都拆掉', () => {
    const io = fakeIO()
    const v = fakeViewport()
    const m = fakeMatchMedia(true)
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const { wrapper } = host()
    expect(v.listeners.size).toBe(1)
    expect(m.listeners.size).toBe(1)
    const added = ['focusin', 'pointerdown', 'input', 'focusout'].map((t) => add.mock.calls.find(([type]) => type === t))
    for (const call of added) expect(call?.[1]).toBeTypeOf('function')
    wrapper.unmount()
    expect(io.state.disconnected).toBe(true)
    expect(v.listeners.size).toBe(0)
    expect(m.listeners.size).toBe(0)
    for (const call of added) expect(remove).toHaveBeenCalledWith(...call!)
  })
})
