<script setup lang="ts">
/**
 * 底部預覽列的 QR 縮圖。跟預覽框吃同一份內容與外觀（mapToQrOptions），只把畫法換成 SVG，
 * 縮到 50 幾 px 也清楚。下載與複製一律走預覽框那一份，這裡只負責給人看。
 * 用 v-show 不用 v-if 切換錯誤狀態：qr-code-styling 會一直往同一個容器畫，容器換掉就畫不回來。
 */
import { toRef } from 'vue'
import { useQrCode } from '@/composables/useQrCode'
import type { QrStyleOptions } from '@/types'

const props = defineProps<{ data: string; qrStyle: QrStyleOptions }>()
const { container, error } = useQrCode(toRef(props, 'data'), toRef(props, 'qrStyle'), 'svg')
</script>

<template>
  <span v-if="error" class="i-lucide-circle-alert text-rose-600 text-2xl" aria-hidden="true" data-test="dock-qr-error" />
  <span v-show="!error" ref="container" class="dock-qr" data-test="dock-qr" />
</template>
