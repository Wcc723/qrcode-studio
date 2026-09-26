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
    <div class="relative aspect-square w-full bg-[#FFF7EA] rounded-2xl border-2 border-ink flex items-center justify-center overflow-hidden">
      <div v-if="data && error" class="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span class="icon-badge-lg bg-pop-pink"><span class="i-lucide-circle-alert" aria-hidden="true" /></span>
        <p data-test="qr-capacity-error" class="text-rose-600 text-sm font-700">{{ error }}</p>
      </div>
      <template v-else>
        <div v-show="data" ref="container" class="[&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:rounded-lg" data-test="qr-container" />
        <!-- 還沒輸入內容時放一張示範圖，讓人知道這裡會出現什麼。它是純裝飾、掃不出任何內容，
             下載按鈕照樣停用；不要改成預填一個真的網址，那會讓人下載到不是自己要的 QR Code。 -->
        <div v-if="!data" class="flex flex-col items-center gap-3 p-4" data-test="qr-demo">
          <div class="relative">
            <svg viewBox="0 0 25 25" class="w-36 h-36 opacity-30" shape-rendering="crispEdges" aria-hidden="true">
              <g fill="#16130f">
                <path d="M0 0h7v7H0zM18 0h7v7h-7zM0 18h7v7H0z" />
                <path fill="#FFF7EA" d="M1 1h5v5H1zM19 1h5v5h-5zM1 19h5v5H1z" />
                <path d="M2 2h3v3H2zM20 2h3v3h-3zM2 20h3v3H2z" />
                <path d="M9 1h1v1H9zM11 0h2v1h-2zM9 3h3v1H9zM14 2h1v2h-1zM10 5h1v2h-1zM13 5h2v1h-2zM8 8h2v1H8zM12 8h1v2h-1zM15 8h3v1h-3zM20 8h1v1h-1zM23 8h2v1h-2zM1 9h2v1H1zM5 9h1v2H5zM9 10h2v1H9zM14 10h1v1h-1zM17 10h2v2h-2zM22 10h1v1h-1zM2 12h2v1H2zM7 12h1v1H7zM10 12h3v1h-3zM15 12h1v2h-1zM20 12h3v1h-3zM0 14h1v1H0zM4 14h2v1H4zM9 14h1v2H9zM12 14h2v1h-2zM18 14h1v1h-1zM23 14h2v2h-2zM11 16h1v1h-1zM14 16h3v1h-3zM20 16h1v2h-1zM9 18h2v1H9zM13 18h1v2h-1zM16 18h2v1h-2zM22 18h1v1h-1zM10 20h1v1h-1zM15 20h1v1h-1zM18 20h3v1h-3zM24 20h1v2h-1zM9 22h3v1H9zM14 22h2v1h-2zM19 22h1v2h-1zM21 23h2v1h-2zM11 24h1v1h-1zM16 24h2v1h-2z" />
              </g>
            </svg>
            <span class="chip bg-pop-sun absolute -top-2 -right-4 rotate-6">示範</span>
          </div>
          <p class="text-muted text-sm font-600"><span class="i-lucide-pencil mr-1" aria-hidden="true" />輸入內容後即時預覽</p>
        </div>
      </template>
    </div>
  </div>
</template>
