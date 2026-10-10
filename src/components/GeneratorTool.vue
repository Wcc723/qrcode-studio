<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from 'vue'
import type { QrType, QrStyleOptions } from '@/types'
import type { PayloadInputMap } from '@/pure'
import { defaultStyle } from '@/types'
import { takeScanHandoff } from '@/utils/scan-handoff'
import QrTypeTabs from './QrTypeTabs.vue'
import QrPreview from './QrPreview.vue'
import StylePanel from './StylePanel.vue'
import DownloadBar from './DownloadBar.vue'
import PreviewDock from './PreviewDock.vue'
import PrivacyNote from './PrivacyNote.vue'
import HelpTip from './HelpTip.vue'
import { inputComponents } from './inputs'
import { exceedsQrCapacity } from '@/pure/qrCapacity'
import { usePreviewDock } from '@/composables/usePreviewDock'
import type { CopyStatus } from '@/composables/useQrCode'

const props = withDefaults(defineProps<{ defaultType?: QrType }>(), { defaultType: 'url' })
const current = ref<QrType>(props.defaultType)
const payload = ref('')
const style = ref<QrStyleOptions>({ ...defaultStyle })
const previewRef = ref<InstanceType<typeof QrPreview> | null>(null)
const uid = useId()

// /scan/ 交棒過來的內容。只在瀏覽器端取（SSR 預渲染時不該有任何使用者資料），
// 而且取用一次就清掉：重新整理這一頁就不會再帶內容進來。
const initial = ref<PayloadInputMap[QrType] | undefined>()
// key 要跟著交棒次數變，否則交棒型別剛好等於目前型別時，輸入元件不會重建、
// 也就吃不到 initial。
const handoffSeq = ref(0)
onMounted(() => {
  const handoff = takeScanHandoff()
  // 一維碼不歸這裡管；直接丟掉，不要硬塞進 QR 表單。
  if (handoff?.kind !== 'qr') return
  current.value = handoff.type
  initial.value = handoff.data
  handoffSeq.value++
})

const activeInput = computed(() => inputComponents[current.value])
const overCapacity = computed(() => !!payload.value && exceedsQrCapacity(payload.value, style.value.errorCorrectionLevel))
function onType(t: QrType) { current.value = t; payload.value = ''; initial.value = undefined }
function download(ext: 'png' | 'svg' | 'jpeg') { previewRef.value?.download(ext) }

// 複製的結果一定要讓人看到：成功時按鈕暫時改成「已複製」，失敗時說明改用下載 PNG。
// 內容或外觀一改就清掉，「已複製」才不會掛在新內容旁邊；比較晚回來的舊結果也丟掉。
const copyStatus = ref<CopyStatus>('idle')
let copySeq = 0
let copyTimer: ReturnType<typeof setTimeout> | undefined
function resetCopy() { copySeq++; clearTimeout(copyTimer); copyStatus.value = 'idle' }
/**
 * 不能先 await 任何東西：iOS 只在這一下點擊的同步流程裡允許寫入剪貼簿（見 useQrCode 的 copyImage），
 * 按鈕的 click 一路到 clipboard.write 都要是同步呼叫。
 */
function copy() {
  resetCopy()
  const seq = copySeq
  const pending = previewRef.value?.copyImage() ?? Promise.resolve(false)
  return pending.then((ok) => {
    if (seq !== copySeq) return
    copyStatus.value = ok ? 'copied' : 'failed'
    if (ok) copyTimer = setTimeout(() => { if (seq === copySeq) copyStatus.value = 'idle' }, 2500)
  })
}
watch([payload, style], resetCopy, { deep: true })
onBeforeUnmount(() => { copySeq++; clearTimeout(copyTimer) })

// 手機版：完整的預覽與下載在外觀設定下面，輸入後要往下捲才看得到。還沒捲到時，底部預覽列先給縮圖與下載（#11）。
const previewZone = ref<HTMLElement | null>(null)
const previewEnd = ref<HTMLElement | null>(null)
const { narrow, endBelow, keyboardOpen } = usePreviewDock(previewEnd)
const dockVisible = computed(() => !!payload.value && narrow.value && endBelow.value && !keyboardOpen.value)
/** 點預覽列的縮圖：捲到完整的預覽框，焦點跟著移過去（預覽列接著會收起來，焦點不能留在它身上） */
function showFullPreview() {
  const zone = previewZone.value
  if (!zone) return
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  zone.focus({ preventScroll: true })
  zone.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
}
</script>

<template>
  <div class="card p-5 md:p-6">
    <PrivacyNote mode="generate" class="mb-5" />
    <!-- 區塊標示是段落不是標題：頁面的 h1／h2／h3 大綱不因為分區而改變 -->
    <p class="zone-label"><span class="icon-badge-sm bg-pop-sun"><span class="i-lucide-pencil" aria-hidden="true" /></span>輸入內容</p>
    <QrTypeTabs :model-value="current" @update:model-value="onType" />
    <div class="grid md:grid-cols-[1fr_auto] gap-6 mt-5">
      <div class="space-y-5 min-w-0">
        <component :is="activeInput" :key="`${current}:${handoffSeq}`" :initial="initial"
          @update:payload="payload = $event" />
        <hr class="border-t-2 border-dashed border-ink/15" />
        <div>
          <p class="zone-label"><span class="icon-badge-sm bg-pop-pink"><span class="i-lucide-palette" aria-hidden="true" /></span>外觀</p>
          <StylePanel v-model="style" />
        </div>
      </div>
      <div ref="previewZone" tabindex="-1" class="md:w-72 min-w-0 scroll-mt-4" data-test="preview-zone">
        <!-- 三種格式各在什麼時候用，收在「預覽與下載」旁的「?」；下載鈕的文字不變 -->
        <div class="mb-3">
          <HelpTip name="下載格式" :id="`${uid}-dl-help`">
            <template #head><p class="zone-label !mb-0"><span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-qr-code" aria-hidden="true" /></span>預覽與下載</p></template>
            <ul>
              <li><strong>PNG</strong>：一般用途都用它，可以透明背景。</li>
              <li><strong>SVG</strong>：放多大都清楚，印刷或交給設計師排版用。</li>
              <li><strong>JPG</strong>：只有對方只收 JPG 時才用，不能透明背景。</li>
            </ul>
            <p>「複製」會把 PNG 圖片複製起來，可以直接貼進聊天或文件。</p>
          </HelpTip>
        </div>
        <!-- 預覽框連同下載鈕一起黏著（main.css 的 .preview-sticky，只在桌機兩欄）：只黏預覽框的話，往下捲它會滑過去蓋住下載鈕 -->
        <div class="preview-sticky" data-test="preview-sticky">
          <QrPreview ref="previewRef" :data="payload" :style="style" />
          <DownloadBar :download="download" :copy="copy" :copy-status="copyStatus" :disabled="!payload || overCapacity" :describedby="`${uid}-dl-help`" />
        </div>
        <!-- 預覽區的底（零高度）：它還在視窗下方時，手機才出底部預覽列 -->
        <div ref="previewEnd" aria-hidden="true" data-test="preview-end" />
      </div>
    </div>
    <PreviewDock :visible="dockVisible" :live="narrow" :data="payload" :qr-style="style" :disabled="!payload || overCapacity"
      :download="download" :copy="copy" :copy-status="copyStatus" @expand="showFullPreview" />
  </div>
</template>
