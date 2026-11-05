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
  <!--
    2026-11 改版（站長裁示 A）：大多數人要的是 PNG，所以它是一整排的實心主按鈕；SVG、JPG、複製退到下面一排的外框按鈕。
    按鈕上的字不變（PNG、SVG、JPG、複製）；任何寬度都至少 48px 高（PNG 52px）。
  -->
  <div class="mt-4 flex flex-col gap-2.5">
    <button data-test="dl-png" :aria-describedby="describedby" class="btn-primary w-full min-h-13 text-lg font-800" :disabled="disabled" @click="download('png')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>PNG</button>
    <div class="grid grid-cols-3 gap-2">
      <button data-test="dl-svg" :aria-describedby="describedby" class="btn-secondary min-h-12 !px-2" :disabled="disabled" @click="download('svg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>SVG</button>
      <button data-test="dl-jpg" :aria-describedby="describedby" class="btn-secondary min-h-12 !px-2" :disabled="disabled" @click="download('jpeg')"><span class="i-lucide-download" aria-hidden="true" /><span class="sr-only">{{ t.download }}</span>JPG</button>
      <button data-test="dl-copy" :aria-describedby="describedby" class="btn-secondary min-h-12 !px-2 whitespace-nowrap" :disabled="disabled" @click="copy?.()"><span :class="copyStatus === 'copied' ? 'i-lucide-check' : 'i-lucide-copy'" aria-hidden="true" />{{ copyStatus === 'copied' ? t.copied : t.copy }}</button>
    </div>
  </div>
  <!-- 狀態列一直在 DOM 裡（空的不佔高度），內容一出現螢幕報讀器就唸。預覽列收著或在桌機時也一樣報讀。 -->
  <p role="status" data-test="copy-status" class="text-sm">
    <span v-if="copyStatus === 'copied'" class="block mt-2 font-600 text-muted">{{ t.copiedMessage }}</span>
    <span v-else-if="copyStatus === 'failed'" class="block mt-2 font-700 text-rose-600">{{ t.copyFailed }}</span>
  </p>
</template>
