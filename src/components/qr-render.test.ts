/**
 * 預覽框與縮圖照真的 qr-code-styling 跑（不 mock）。這幾件事只有真的套件才測得出來：
 *
 * - 套件只會往「最後 append 的那個元素」畫；update() 先清空它、畫好再放回同一個元素。
 *   容器被 v-if 換掉，新容器就一直是空的（v1.7.0 以前，超過容量再改短，預覽框空白、縮圖卻有圖）。
 * - 建構子會馬上畫一次，內容塞不下就丟 'code length overflow'。縮圖在超過容量時才掛上，
 *   以前會在 onMounted 丟例外、之後永遠是空的。
 * - 縮圖在預覽列收著（打字、鍵盤開著）時不重畫，出現時才補畫一次。
 *
 * happy-dom 裡 canvas 不會真的畫出像素，但 canvas／svg 元素會照套件的邏輯放進容器，這裡驗的就是放到哪裡。
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import QRCodeStyling from 'qr-code-styling'
import QrPreview from './QrPreview.vue'
import QrThumb from './QrThumb.vue'
import { useQrCode } from '@/composables/useQrCode'
import { defaultStyle } from '@/types'

const TOO_LONG = 'a'.repeat(3000) // 超過所有耐髒程度的容量
const qrStyle = { ...defaultStyle, width: 120 }

afterEach(() => { vi.restoreAllMocks() })

describe('預覽框（QrPreview）', () => {
  it('超過容量再改短：預覽框畫回來，而且還是同一個容器', async () => {
    const w = mount(QrPreview, { props: { data: 'https://example.com', style: qrStyle } })
    await flushPromises()
    const box = () => w.find('[data-test="qr-container"]').element as HTMLElement
    const first = box()
    expect(first.querySelector('canvas')).not.toBeNull()

    await w.setProps({ data: TOO_LONG })
    await flushPromises()
    expect(w.find('[data-test="qr-capacity-error"]').exists()).toBe(true)
    expect(box().style.display).toBe('none')

    await w.setProps({ data: 'hello again' })
    await flushPromises()
    expect(w.find('[data-test="qr-capacity-error"]').exists()).toBe(false)
    expect(box()).toBe(first)
    expect(box().style.display).not.toBe('none')
    expect(box().querySelector('canvas')).not.toBeNull()
  })

  it('一開始就超過容量：不丟例外、顯示錯誤；改短之後畫得出來', async () => {
    const w = mount(QrPreview, { props: { data: TOO_LONG, style: qrStyle } })
    await flushPromises()
    expect(w.find('[data-test="qr-capacity-error"]').exists()).toBe(true)
    await w.setProps({ data: 'short' })
    await flushPromises()
    expect(w.find('[data-test="qr-container"] canvas').exists()).toBe(true)
  })
})

describe('useQrCode 的容器換掉時', () => {
  it('畫好的圖搬到新的容器（不管元件用 v-if 還是 v-show 切）', async () => {
    const which = ref<'a' | 'b'>('a')
    const Host = defineComponent({
      setup() {
        const { container } = useQrCode(ref('https://example.com'), ref(qrStyle))
        return () => which.value === 'a'
          ? h('div', { key: 'a', ref: container, 'data-test': 'a' })
          : h('div', { key: 'b', ref: container, 'data-test': 'b' })
      },
    })
    const w = mount(Host)
    await flushPromises()
    expect(w.find('[data-test="a"] canvas').exists()).toBe(true)
    which.value = 'b'
    await flushPromises()
    expect(w.find('[data-test="b"] canvas').exists()).toBe(true)
  })
})

describe('手機預覽列的縮圖（QrThumb）', () => {
  it('超過容量時才掛上：不丟例外、顯示錯誤圖示；改短之後縮圖畫得出來', async () => {
    const w = mount(QrThumb, { props: { data: TOO_LONG, qrStyle, active: true } })
    await flushPromises()
    expect(w.find('[data-test="dock-qr-error"]').exists()).toBe(true)
    await w.setProps({ data: 'https://example.com' })
    await flushPromises()
    expect(w.find('[data-test="dock-qr-error"]').exists()).toBe(false)
    expect(w.find('[data-test="dock-qr"] svg').exists()).toBe(true)
  })

  it('預覽列收著時不畫也不重畫；出現時用最新的內容補畫一次', async () => {
    const update = vi.spyOn(QRCodeStyling.prototype, 'update')
    const w = mount(QrThumb, { props: { data: 'a', qrStyle, active: false } })
    await flushPromises()
    for (const d of ['ab', 'abc', 'abcd']) {
      await w.setProps({ data: d })
      await nextTick()
    }
    expect(update).not.toHaveBeenCalled()
    expect(w.find('[data-test="dock-qr"] svg').exists()).toBe(false)

    await w.setProps({ active: true })
    await flushPromises()
    expect(update).toHaveBeenCalledOnce() // 建構子裡那一次
    expect((update.mock.contexts[0] as QRCodeStyling)._options.data).toBe('abcd')
    expect(w.find('[data-test="dock-qr"] svg').exists()).toBe(true)

    // 出現之後照常跟著內容重畫；再收起來就停
    await w.setProps({ data: 'abcde' })
    expect(update).toHaveBeenCalledTimes(2)
    await w.setProps({ active: false })
    await w.setProps({ data: 'abcdef' })
    expect(update).toHaveBeenCalledTimes(2)
    // 收著時沒有變動就不必補畫
    await w.setProps({ active: true })
    expect(update).toHaveBeenCalledTimes(3)
    await w.setProps({ active: false })
    await w.setProps({ active: true })
    expect(update).toHaveBeenCalledTimes(3)
  })
})
