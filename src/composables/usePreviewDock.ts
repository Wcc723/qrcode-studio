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

/**
 * 用手指（或觸控筆）點了會叫出鍵盤的欄位之後，這段時間內的變矮才可能是鍵盤升起來（鍵盤從點下去到完全升起，
 * 慢的手機也在一秒上下）。開始打字就不算了：鍵盤一定在打第一個字之前就升好了。滑鼠點的不算：滑鼠點欄位不會叫出虛擬鍵盤。
 */
export const KEYBOARD_ARM_MS = 2000

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
 *   焦點要在會叫出鍵盤的欄位上，而且可見高度比這個寬度下的基準矮了一截。只看焦點不夠：Android 按返回鍵收鍵盤時，
 *   欄位還留著焦點。只看高度也不夠：分割畫面、拉矮視窗也會變矮，而且焦點可能還留在剛打完字的欄位上。
 *   所以第一次矮過門檻時再分一次：
 *   - 只有可見範圍變矮、版面（documentElement.clientHeight）沒變：是鍵盤（iOS Safari、Android Chrome）。
 *     視窗本身變矮時版面一定跟著變矮。
 *   - 版面也一起變矮：可能是視窗本身（分割畫面、拉矮視窗），也可能是會縮版面的鍵盤（Android App 內建的瀏覽器）。
 *     鍵盤一定是點了欄位才升起來，所以只有剛用手指點了欄位（滑鼠點的不算）、還沒開始打字（KEYBOARD_ARM_MS 內）
 *     才算鍵盤；不然就是視窗變矮，現在的高度是新的基準。沒有欄位在輸入時也一樣，現在的高度就是基準。
 *   鍵盤開著時高度又變了：
 *   - 只縮可見範圍的鍵盤（蓋在版面上）：版面高度就是視窗高度，鍵盤開著時進分割畫面、拉矮視窗，基準跟著版面一起移；
 *     可見高度回到移過的基準附近，就是鍵盤收了（Android 按返回鍵，焦點還在欄位上），移過的基準就是新的基準。
 *   - 會縮版面的鍵盤：收鍵盤與視窗變高看起來一樣，維持開著，等高度回到基準或焦點離開欄位。
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
      const root = document.documentElement
      let width = 0
      let tallest = 0 // 這個寬度下沒有鍵盤時的可見高度（基準）
      let layout = 0 // 記下基準時的版面高度
      let overlay = false // 鍵盤開著，而且是只縮可見範圍、版面沒變的那種（蓋在版面上）
      let armed = false // 剛點了會叫出鍵盤的欄位、還沒開始打字：接下來的變矮可能是鍵盤升起來
      let armTimer: ReturnType<typeof setTimeout> | undefined
      let mouse = false // 最後一次按下去的是滑鼠（或觸控板）：滑鼠點欄位不會叫出虛擬鍵盤
      const isField = (el: EventTarget | Element | null) => el instanceof HTMLElement && el.matches(KEYBOARD_FIELD)
      const editing = () => isField(document.activeElement)
      // 乘上 scale：雙指放大時 visualViewport 的寬高會跟著變小，換回沒放大時的 CSS px 才比得了
      const check = () => {
        const w = Math.round(vv.width * vv.scale)
        const h = vv.height * vv.scale
        const lh = root.clientHeight
        const rebase = (base = h) => { tallest = base; layout = lh; keyboardOpen.value = false }
        if (w !== width) { width = w; tallest = 0 } // 轉向：重新找這個寬度下的最高值
        if (!editing()) { rebase(); return }
        if (keyboardOpen.value && overlay) {
          // 蓋在版面上的鍵盤開著：視窗變了（分割畫面、拉矮、拉高）的話，基準跟著版面一起移；
          // 可見高度回到基準附近就是鍵盤收了。視窗變高時可見高度會超過舊的基準，鍵盤卻還開著，所以要先比這條
          const base = tallest - (layout - lh)
          if (base - h <= KEYBOARD_MIN_PX) rebase(Math.max(h, base))
          return
        }
        if (h >= tallest) { rebase(); return }
        if (tallest - h <= KEYBOARD_MIN_PX) { keyboardOpen.value = false; return } // 網址列收合、鍵盤升到一半
        if (keyboardOpen.value) return // 會縮版面的鍵盤開著，高度又變了一點（換輸入法、候選字列）
        if (layout - lh <= KEYBOARD_MIN_PX) { keyboardOpen.value = true; overlay = true }
        else if (armed) { keyboardOpen.value = true; overlay = false }
        else rebase() // 視窗本身變矮：現在的高度就是新的基準
      }
      check()
      vv.addEventListener('resize', check)
      const disarm = () => { armed = false; clearTimeout(armTimer) }
      const arm = () => { disarm(); armed = true; armTimer = setTimeout(disarm, KEYBOARD_ARM_MS) }
      // 用手指點到欄位或焦點移進欄位：鍵盤可能要升起來了。Android 按返回鍵收鍵盤後焦點還在，再點一下同一個欄位
      // 鍵盤會再出來，那時沒有 focusin，所以 pointerdown 也算。滑鼠點的不算（focusin 緊跟在滑鼠的 pointerdown 後面），
      // 不然窄的桌機視窗點了欄位馬上拉矮，會被當成鍵盤，預覽列要等離開欄位才出現。
      const onFocusIn = (e: FocusEvent) => { if (!mouse && isField(e.target)) arm() }
      const onPointerDown = (e: PointerEvent) => {
        mouse = e.pointerType === 'mouse'
        if (!mouse && e.target instanceof Element && isField(e.target.closest(KEYBOARD_FIELD))) arm()
      }
      // 焦點離開欄位（點旁邊、按完成）時重新判斷，不必等下一次高度變化。focusout 的當下焦點還沒換好，晚一拍再看。
      let timer: ReturnType<typeof setTimeout> | undefined
      const later = () => { clearTimeout(timer); timer = setTimeout(check, 0) }
      document.addEventListener('focusin', onFocusIn, true)
      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('input', disarm, true)
      document.addEventListener('focusout', later)
      cleanups.push(() => {
        vv.removeEventListener('resize', check)
        document.removeEventListener('focusin', onFocusIn, true)
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('input', disarm, true)
        document.removeEventListener('focusout', later)
        clearTimeout(timer)
        disarm()
      })
    }
  })

  onBeforeUnmount(() => { for (const off of cleanups.splice(0)) off() })

  return { narrow, endBelow, keyboardOpen }
}
