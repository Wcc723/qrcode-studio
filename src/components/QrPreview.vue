<script setup lang="ts">
import { toRef } from 'vue'
import { useQrCode } from '@/composables/useQrCode'
import type { QrStyleOptions } from '@/types'
import { defaultStyle } from '@/types'

const props = defineProps<{ data: string; style?: QrStyleOptions }>()
const dataRef = toRef(props, 'data')
const styleRef = toRef(() => props.style ?? defaultStyle)
const { container, download, copyImage, error } = useQrCode(dataRef, styleRef)
defineExpose({ download, copyImage })
</script>

<template>
  <div class="card p-5 sticky top-4">
    <div class="mb-3">
      <span class="chip bg-pop-mint">🔒 不上傳・瀏覽器內生成</span>
    </div>
    <div class="relative aspect-square w-full bg-[#FFF7EA] rounded-2xl border-2 border-ink flex items-center justify-center overflow-hidden">
      <div v-if="data && error" class="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span class="text-3xl">😵</span>
        <p data-test="qr-capacity-error" class="text-rose-600 text-sm font-700">{{ error }}</p>
      </div>
      <template v-else>
        <div v-show="data" ref="container" class="[&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:rounded-lg" data-test="qr-container" />
        <p v-if="!data" class="text-muted text-sm font-600">✏️ 輸入內容後即時預覽</p>
      </template>
    </div>
  </div>
</template>
