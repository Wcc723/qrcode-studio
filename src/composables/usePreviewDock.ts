import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** 手機版面：UnoCSS 的 md 斷點（768px）以下。桌機不出現底部預覽列。 */
export const NARROW_QUERY = '(max-width: 767.98px)'

/**
 * 可見高度比這個寬度下看過的最高值少超過這麼多，就當作虛擬鍵盤開著。
 * 網址列收合、展開只差幾十 px，手機鍵盤至少兩百多 px。
 */
export const KEYBOARD_MIN_PX = 150

/**
 * 會叫出虛擬鍵盤的欄位（iOS 的下拉選單滾輪也佔鍵盤的位置）。焦點不在這些欄位上時，可見高度變矮不是鍵盤，
 * 是分割畫面、iPad 的視窗或桌機視窗被拉矮。
 */
export const KEYBOARD_FIELD = 'textarea, select, [contenteditable]:not([contenteditable="false"]), '
  + 'input:not([type="checkbox"], [type="radio"], [type="color"], [type="range"], [type="file"], [type="button"], [type="submit"], [type="reset"], [type="image"])'

/** 觀察範圍往視窗上方延伸的距離，比任何一頁都長就好 */
const ABOVE_PX = 100000

/**
 * 底部預覽列（PreviewDock）要不要出現的三個條件，都只在瀏覽器端（onMounted 之後）才有值，
 * 預渲染與 hydrate 時一律是 false，預覽列不會出現在預渲染的 HTML 上。
 *
 * - narrow：螢幕寬度在 md 斷點以下
 * - endBelow：預覽區的底（`end`，一個零高度的元素）還在視窗下方，也就是還沒捲到完整的預覽與下載鈕。
 *   捲到了就收起來；捲過頭（在看說明文章或頁尾）也不出現，所以它不會蓋住頁面最下面的內容。
 * - keyboardOpen：虛擬鍵盤開著。iOS Safari 與 Android Chrome 開鍵盤時不縮版面，固定在底部的東西會躲到鍵盤後面
 *   或在捲動時飄到畫面中間；會縮版面的瀏覽器則會讓它壓在鍵盤正上方、蓋住正在輸入的欄位。開鍵盤時一律收起來。
 *   兩個條件都要成立才算：焦點在會叫出鍵盤的欄位上，而且可見高度比這個寬度下的基準矮了一截。
 *   只看焦點不夠：Android 按返回鍵收鍵盤時，欄位還留著焦點。只看高度也不夠：分割畫面、拉矮視窗也會變矮，
 *   沒有欄位在輸入時，現在的高度就是新的基準。
 */
export function usePreviewDock(end: Ref<HTMLElement | null>) {
  const narrow = ref(false)
  const endBelow = ref(false)
  const keyboardOpen = ref(false)
  const cleanups: (() => void)[] = []

  onMounted(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia(NARROW_QUERY) : null
    if (mq) {
      const sync = () => { narrow.value = mq.matches }
      sync()
      mq.addEventListener?.('change', sync)
      cleanups.push(() => mq.removeEventListener?.('change', sync))
    }

    if (end.value && typeof IntersectionObserver === 'function') {
      // 把視窗的上緣往上延伸到很遠：「相交」就等於「不在視窗下方」。只用視窗本身的話，
      // 從頁尾一下跳回頂端（上方 → 下方）中間沒有相交過，IntersectionObserver 不會通知。
      const io = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1]
        if (e) endBelow.value = !e.isIntersecting
      }, { rootMargin: `${ABOVE_PX}px 0px 0px 0px` })
      io.observe(end.value)
      cleanups.push(() => io.disconnect())
    }

    const vv = window.visualViewport
    if (vv) {
      let width = 0
      let tallest = 0
      const editing = () => document.activeElement instanceof HTMLElement && document.activeElement.matches(KEYBOARD_FIELD)
      // 乘上 scale：雙指放大時 visualViewport 的寬高會跟著變小，換回沒放大時的 CSS px 才比得了
      const check = () => {
        const w = Math.round(vv.width * vv.scale)
        const h = vv.height * vv.scale
        if (w !== width) { width = w; tallest = 0 } // 轉向：重新找這個寬度下的最高值
        if (editing()) {
          tallest = Math.max(tallest, h)
          keyboardOpen.value = tallest - h > KEYBOARD_MIN_PX
        } else {
          tallest = h // 沒有欄位在輸入：變矮不是鍵盤，現在的高度就是新的基準
          keyboardOpen.value = false
        }
      }
      check()
      vv.addEventListener('resize', check)
      // 焦點離開欄位（點旁邊、按完成）時重新判斷，不必等下一次高度變化。focusout 的當下焦點還沒換好，晚一拍再看。
      let timer: ReturnType<typeof setTimeout> | undefined
      const later = () => { clearTimeout(timer); timer = setTimeout(check, 0) }
      document.addEventListener('focusout', later)
      cleanups.push(() => {
        vv.removeEventListener('resize', check)
        document.removeEventListener('focusout', later)
        clearTimeout(timer)
      })
    }
  })

  onBeforeUnmount(() => { for (const off of cleanups.splice(0)) off() })

  return { narrow, endBelow, keyboardOpen }
}
