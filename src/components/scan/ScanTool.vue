<script setup lang="ts">
/**
 * /scan/ 的互動殼：檔案選擇、拖放、貼上三種輸入，加上狀態與結果呈現。
 *
 * 貼上事件掛在 document 上（不是某個元素）：使用者按 Cmd/Ctrl+V 時焦點通常不在
 * 任何輸入框裡，掛在元素上會收不到。卸載時一定要移除，否則離開 /scan/ 之後
 * 在別的頁面貼東西還會觸發解碼。
 *
 * `deps` 是為了測試而開的注入口：預設值會動態載入解碼器（reader JS ＋ 自架 WASM
 * 都只在使用者真的丟圖進來時才下載），測試則注入替身來驗流程與先後順序。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useImageScanner, type ScanDeps } from '@/composables/useImageScanner'
import { putScanHandoff, buildScanHandoff, scanHandoffRoute } from '@/utils/scan-handoff'
import ScanResultView from './ScanResultView.vue'
import HelpTip from '../HelpTip.vue'
import PrivacyNote from '../PrivacyNote.vue'

const props = defineProps<{ deps?: ScanDeps }>()
const router = useRouter()

const fileInputId = 'scan-file-input'
const dragging = ref(false)

const defaultDeps: ScanDeps = {
  async loadImage(blob) {
    const { blobToImageData } = await import('@/utils/image-to-imagedata')
    return blobToImageData(blob)
  },
  async decode(imageData) {
    const { decodeImageData } = await import('@/utils/zxing-reader')
    return decodeImageData(imageData)
  },
  createObjectUrl: blob => URL.createObjectURL(blob),
  revokeObjectUrl: url => URL.revokeObjectURL(url),
}

const scanner = useImageScanner(props.deps ?? defaultDeps)
const { status, outcome, error, previewUrl, liveMessage } = scanner

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) void scanner.scanBlobs(files)
  // 清掉 value，同一個檔案連選兩次才會再觸發 change
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) void scanner.scanBlobs(files)
}

function onPaste(event: ClipboardEvent) {
  const items = Array.from(event.clipboardData?.items ?? [])
  const images = items
    .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter((f): f is File => f !== null)
  if (images.length) void scanner.scanBlobs(images)
}

function onRegenerate() {
  if (outcome.value?.status !== 'single') return
  const handoff = buildScanHandoff(outcome.value.result)
  if (!handoff) return
  putScanHandoff(handoff)
  void router.push(scanHandoffRoute(handoff))
}

onMounted(() => document.addEventListener('paste', onPaste))
onBeforeUnmount(() => document.removeEventListener('paste', onPaste))
</script>

<template>
  <div class="card p-5 md:p-6">
    <PrivacyNote mode="scan" class="mb-5" />
    <div
      data-test="scan-dropzone"
      class="rounded-2xl border-3 border-dashed p-6 text-center transition"
      :class="dragging ? 'border-brand bg-pop-sky/30' : 'border-ink/25 bg-white/60'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="icon-badge-lg bg-pop-sky"><span class="i-lucide-image-plus" aria-hidden="true" /></span>
      <p class="font-display font-700 text-ink mt-2">把圖片拖進來，或直接 <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>V</kbd> 貼上截圖</p>
      <div class="mt-1 [&_.field-head]:justify-center [&_.help-tip-panel]:(text-left max-w-md mx-auto)">
        <HelpTip name="支援的圖片" id="scan-formats-help">
          <template #head><p class="text-sm text-muted font-600">支援 PNG、JPEG、WebP，一次一張</p></template>
          <p>檔案上限 12 MB，像素總數上限約 4000 萬，超過會請你先裁切或縮小。</p>
          <p>不支援 SVG：SVG 可以夾帶腳本與外部參照，不適合拿別人給的檔案直接算圖。</p>
          <p>一張圖裡有兩個以上的條碼時，只會告訴你數量、不顯示結果，請裁切成只剩一個再試。</p>
        </HelpTip>
      </div>

      <input :id="fileInputId" data-test="scan-file-input" type="file" class="sr-only" aria-describedby="scan-formats-help"
        accept="image/png,image/jpeg,image/webp" @change="onFileChange" />
      <label :for="fileInputId" class="btn-primary !bg-pop-sun inline-block mt-4 cursor-pointer">
        選擇圖片
      </label>
    </div>

    <!-- 解碼狀態：一律用文字播報，不依賴顏色 -->
    <p data-test="scan-live" class="text-sm font-600 text-muted mt-3 min-h-5" aria-live="polite" role="status">
      {{ liveMessage }}
    </p>

    <p v-if="status === 'error' && error" data-test="scan-error"
      class="mt-2 p-3 rounded-xl border-2 border-ink/15 bg-pop-sun/40 text-ink font-600 leading-relaxed">
      {{ error }}
    </p>

    <div v-if="previewUrl" class="mt-4">
      <p class="text-sm text-muted font-600">你選的圖</p>
      <img data-test="scan-preview" :src="previewUrl" alt="你選擇的圖片預覽"
        class="mt-1 max-h-48 rounded-xl border-2 border-ink/15 bg-white" />
    </div>

    <ScanResultView v-if="status === 'done' && outcome" :outcome="outcome" @regenerate="onRegenerate" />

    <button v-if="status !== 'idle'" type="button" data-test="scan-reset"
      class="bg-transparent p-0 text-sm font-700 text-muted underline mt-4" @click="scanner.reset()">
      清除並換一張
    </button>
  </div>
</template>
