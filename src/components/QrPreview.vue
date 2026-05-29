<script setup lang="ts">
import { toRef } from 'vue'
import { useQrCode } from '@/composables/useQrCode'
import type { QrStyleOptions } from '@/types'
import { defaultStyle } from '@/types'

const props = defineProps<{ data: string; style?: QrStyleOptions }>()
const dataRef = toRef(props, 'data')
const styleRef = toRef(() => props.style ?? defaultStyle)
const { container, download } = useQrCode(dataRef, styleRef)
defineExpose({ download })
</script>

<template>
  <div class="card p-5 sticky top-4">
    <div class="text-xs text-muted mb-3 flex items-center gap-1">🔒 不上傳・瀏覽器內生成</div>
    <div class="relative aspect-square w-full bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
      <div v-show="data" ref="container" data-test="qr-container" class="[&>canvas]:max-w-full [&>canvas]:h-auto" />
      <p v-if="!data" class="text-muted text-sm">輸入內容後即時預覽</p>
    </div>
  </div>
</template>
