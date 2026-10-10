/**
 * 手機底部預覽列什麼時候出現（usePreviewDock）。三個條件都只在 onMounted 之後才有值：
 * 預渲染與 hydrate 時一律是 false，預覽列不會出現在預渲染的 HTML 上。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { usePreviewDock, NARROW_QUERY, KEYBOARD_MIN_PX } from './usePreviewDock'

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

/** 假的 visualViewport：可見高度、寬度、放大倍率，改完發 resize */
function fakeViewport(init = { width: 390, height: 664, scale: 1 }) {
  const listeners = new Set<() => void>()
  const vv = {
    ...init,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
  }
  vi.stubGlobal('visualViewport', vv)
  const set = (next: Partial<typeof init>) => { Object.assign(vv, next); for (const f of listeners) f() }
  return { vv, set, listeners }
}

function fakeMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mq = { matches, media: NARROW_QUERY, addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return { mq, flip(v: boolean) { mq.matches = v; for (const f of listeners) f() }, listeners }
}

afterEach(() => { vi.unstubAllGlobals() })

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

  it('虛擬鍵盤：可見高度比最高值少超過門檻才算開著；網址列收合那種小變化不算', () => {
    const v = fakeViewport()
    const { api } = host()
    expect(api().keyboardOpen.value).toBe(false)
    v.set({ height: 664 - (KEYBOARD_MIN_PX - 60) }) // 網址列展開
    expect(api().keyboardOpen.value).toBe(false)
    v.set({ height: 364 }) // 鍵盤開
    expect(api().keyboardOpen.value).toBe(true)
    v.set({ height: 664 }) // 鍵盤收（Android 按返回鍵時欄位還留著焦點，一樣算收起來）
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
    v.set({ width: 664, height: 340 })
    expect(api().keyboardOpen.value).toBe(false)
  })

  it('卸載時把監聽與觀察都拆掉', () => {
    const io = fakeIO()
    const v = fakeViewport()
    const m = fakeMatchMedia(true)
    const { wrapper } = host()
    expect(v.listeners.size).toBe(1)
    expect(m.listeners.size).toBe(1)
    wrapper.unmount()
    expect(io.state.disconnected).toBe(true)
    expect(v.listeners.size).toBe(0)
    expect(m.listeners.size).toBe(0)
  })
})
