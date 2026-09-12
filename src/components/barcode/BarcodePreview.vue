<script setup lang="ts">
import type { BarcodePattern } from '@/pure/encodeBarcode'

defineProps<{
  svg: string
  pattern: BarcodePattern | null
  error: string | null
  label: string
  printInfo: { widthMm: number; heightMm: number; xMm: number } | null
}>()
</script>

<template>
  <div class="min-w-0">
    <div class="mb-3">
      <span class="chip bg-pop-mint">🔒 不傳雲端・瀏覽器內生成</span>
    </div>

    <!--
      一維條碼是寬扁的，所以刻意不用 QrPreview 的 aspect-square；由 SVG 自己的
      viewBox 決定長寬比，min-h 只用來撐住空狀態。min-w-0 不可省，否則這層會被
      內容撐開而把整頁推寬（祖先的 overflow 也救不了）。
    -->
    <div
      class="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border-2 border-ink bg-white p-3 flex items-center justify-center min-h-[132px]">
      <p v-if="!pattern && !error" class="text-muted text-sm font-600">✏️ 輸入內容後即時預覽</p>

      <div v-else-if="error" class="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span class="text-3xl">😵</span>
        <p data-test="bc-preview-error" class="text-rose-600 text-sm font-700 break-all">{{ error }}</p>
      </div>

      <!--
        v-html 是刻意的：這裡塞進去的字串與「下載的 SVG」出自同一個
        barcodeGeometry()，預覽與產物因此不可能不一致。字串內沒有任何 href，
        所以不需要 withBase()；HRI 文字在 barcodeToSvg 內已做 XML 轉義。
      -->
      <div
        v-else class="w-full max-w-full min-w-0" data-test="bc-svg"
        role="img" :aria-label="`${label} 條碼，內容 ${pattern!.text}`"
        v-html="svg" />
    </div>

    <p v-if="printInfo" data-test="bc-print-info"
      class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted font-600">
      <span class="whitespace-nowrap">建議列印寬度 {{ printInfo.widthMm }} mm</span>
      <span class="whitespace-nowrap">最細一條 {{ printInfo.xMm }} mm</span>
    </p>
  </div>
</template>
