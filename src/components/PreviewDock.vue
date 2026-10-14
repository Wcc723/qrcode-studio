<script setup lang="ts">
/**
 * 手機版的底部預覽列：輸入內容後，完整的預覽框與下載鈕還在外觀設定下面時，
 * 先在視窗底部給一張縮圖、「下載 PNG」與「複製」，不用往下捲就看得到做出來的 QR Code。
 * 點縮圖捲到完整的預覽框（其他格式在那裡）。
 *
 * - 桌機（md 以上）不出現：版面跟以前一模一樣，main.css 的 .preview-dock 在 md 以上一律 display: none。
 * - 什麼時候出現由 GeneratorTool 決定（usePreviewDock）：有內容、手機寬度、完整預覽還在視窗下方、虛擬鍵盤沒開。
 *   預渲染與 hydrate 時一律不出現。
 * - 下載與複製呼叫的是 GeneratorTool 同一組函式，下載的就是預覽框那一份；縮圖只負責給人看。
 * - 預覽列擺在工具卡裡，不用 Teleport：預渲染與 hydrate 照一般元件走。它的祖先不能有 transform
 *   （會把 position: fixed 的定位基準從視窗換成那個祖先），所以 main.css 的 .reveal 進場動畫結束後不留 transform。
 */
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { QrStyleOptions } from '@/types'
import type { CopyStatus } from '@/composables/useQrCode'
import { useUiCopy } from '@/locales/ui'
import QrThumb from './QrThumb.vue'

const props = defineProps<{
  visible: boolean
  /** 手機寬度才畫縮圖；桌機不多建一份 QR Code */
  live: boolean
  data: string
  qrStyle: QrStyleOptions
  disabled: boolean
  download: (ext: 'png' | 'svg' | 'jpeg') => void
  copy?: () => void
  /** 複製的結果。按鈕暫時改成「已複製」；失敗時在預覽列上方說明改用下載（報讀由 DownloadBar 的狀態列負責，這裡不重複） */
  copyStatus?: CopyStatus
}>()
const emit = defineEmits<{ expand: [] }>()
const t = useUiCopy().preview

const root = ref<HTMLElement | null>(null)

// 預覽列蓋住視窗最下面一條：出現時讓 html 帶 has-preview-dock，main.css 依此加 scroll-padding-bottom，
// 用鍵盤移到被蓋住的欄位時，瀏覽器會多捲一段，焦點不會躲在預覽列後面。
// 出現的當下，如果正在打字的欄位剛好在最下面那一條，把頁面往上推一點，欄位不會被它蓋住。
// 只管打字的欄位：預覽列也會因為捲動而出現，那時焦點若停在選單或勾選框上，不要跟使用者搶捲動。
const DOCKED = 'has-preview-dock'
const TYPING = 'textarea, input:not([type="checkbox"], [type="radio"], [type="color"], [type="range"], [type="file"])'
watch(() => props.visible, async (v) => {
  document.documentElement.classList.toggle(DOCKED, v)
  if (!v) return
  await nextTick()
  const field = document.activeElement
  if (!root.value || !(field instanceof HTMLElement) || !field.matches(TYPING) || root.value.contains(field)) return
  const limit = window.innerHeight - root.value.offsetHeight
  const overlap = field.getBoundingClientRect().bottom - limit
  if (overlap > 0) window.scrollBy({ top: overlap + 12 })
})

// scroll-padding-bottom 要留多少，照預覽列實際的高度（html 上的 --preview-dock-h）：複製失敗時多一行說明、
// 字放大或換行都會變高，寫死的高度會讓焦點停在被它蓋住的那一截。收起來（display: none）時量到 0，留著上一次的值。
const HEIGHT_VAR = '--preview-dock-h'
let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  if (!root.value || typeof ResizeObserver !== 'function') return
  resizeObserver = new ResizeObserver(() => {
    const h = root.value?.offsetHeight ?? 0
    if (h > 0) document.documentElement.style.setProperty(HEIGHT_VAR, `${h}px`)
  })
  resizeObserver.observe(root.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.documentElement.classList.remove(DOCKED)
  document.documentElement.style.removeProperty(HEIGHT_VAR)
})
</script>

<template>
  <Transition name="dock">
    <div v-show="visible" ref="root" class="preview-dock" data-test="preview-dock">
      <p v-if="copyStatus === 'failed'" data-test="dock-copy-failed" class="max-w-screen-lg mx-auto px-4 pb-1.5 text-xs font-700 text-rose-600">{{ t.copyFailed }}</p>
      <div class="max-w-screen-lg mx-auto px-4 flex items-center gap-2">
        <button type="button" class="mr-auto min-w-0 min-h-11 flex items-center gap-2.5 p-0 bg-transparent text-left rounded-xl" data-test="dock-expand" @click="emit('expand')">
          <span class="dock-thumb" aria-hidden="true">
            <!-- 收著的時候不重畫（打字時鍵盤開著就是收著），出現時才補畫 -->
            <QrThumb v-if="live" :data="data" :qr-style="qrStyle" :active="visible" />
            <span class="dock-thumb-zoom icon-badge-sm bg-pop-sun"><span class="i-lucide-maximize-2" aria-hidden="true" /></span>
          </span>
          <!-- 360px 以下只留縮圖，字仍然是按鈕的名稱 -->
          <span class="leading-tight max-[359px]:sr-only">
            <span class="block font-display font-700 text-sm text-ink">{{ t.dockExpand }}</span><span class="sr-only">，</span>
            <span class="block text-xs font-700 text-muted">{{ t.dockFormats }}</span>
          </span>
        </button>
        <button type="button" data-test="dock-png" class="btn-primary !bg-pop-sun min-h-11 !px-3" :disabled="disabled" @click="download('png')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>PNG</button>
        <button type="button" data-test="dock-copy" class="btn-primary !bg-pop-pink min-h-11 !px-3" :disabled="disabled" @click="copy?.()"><span :class="copyStatus === 'copied' ? 'i-lucide-check' : 'i-lucide-copy'" aria-hidden="true" />{{ copyStatus === 'copied' ? t.copied : t.copy }}</button>
      </div>
    </div>
  </Transition>
</template>
