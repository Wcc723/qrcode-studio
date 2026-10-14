<script setup lang="ts">
import type { CopyStatus } from '@/composables/useQrCode'
import { useUiCopy } from '@/locales/ui'

defineProps<{
  download: (ext: 'png' | 'svg' | 'jpeg') => void
  disabled: boolean
  copy?: () => void
  /** 「下載格式」說明框的 id：四顆按鈕都用 aria-describedby 指到它（說明也講了「複製」） */
  describedby?: string
  /** 複製的結果：按鈕暫時改成「已複製」，下面的狀態列寫出結果（手機預覽列按的也在這裡報讀） */
  copyStatus?: CopyStatus
}>()
const t = useUiCopy().preview
</script>
<template>
  <div class="grid grid-cols-2 gap-2 mt-4">
    <!-- 手機上按鈕至少 44px 高（觸控目標）；桌機維持原本的高度 -->
    <button data-test="dl-png" :aria-describedby="describedby" class="btn-primary !bg-pop-sun max-md:min-h-11" :disabled="disabled" @click="download('png')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>PNG</button>
    <button data-test="dl-svg" :aria-describedby="describedby" class="btn-primary !bg-pop-mint max-md:min-h-11" :disabled="disabled" @click="download('svg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>SVG</button>
    <button data-test="dl-jpg" :aria-describedby="describedby" class="btn-primary !bg-pop-sky max-md:min-h-11" :disabled="disabled" @click="download('jpeg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>JPG</button>
    <button data-test="dl-copy" :aria-describedby="describedby" class="btn-primary !bg-pop-pink max-md:min-h-11" :disabled="disabled" @click="copy?.()"><span :class="copyStatus === 'copied' ? 'i-lucide-check' : 'i-lucide-copy'" aria-hidden="true" />{{ copyStatus === 'copied' ? t.copied : t.copy }}</button>
  </div>
  <!-- 狀態列一直在 DOM 裡（空的不佔高度），內容一出現螢幕報讀器就唸。預覽列收著或在桌機時也一樣報讀。 -->
  <p role="status" data-test="copy-status" class="text-sm">
    <span v-if="copyStatus === 'copied'" class="block mt-2 font-600 text-muted">{{ t.copiedMessage }}</span>
    <span v-else-if="copyStatus === 'failed'" class="block mt-2 font-700 text-rose-600">{{ t.copyFailed }}</span>
  </p>
</template>
