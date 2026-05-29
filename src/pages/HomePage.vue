<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'
import type { QrType } from '@/types'

const emoji: Record<QrType, string> = {
  url: '🔗', wifi: '📶', vcard: '👤', text: '📝', email: '✉️', phone: '📞', sms: '💬',
}

useSeoHead({
  title: '免費 QR Code 產生器｜可加 LOGO、不上傳、免費下載 PNG/SVG',
  description: site.description, path: '/',
  faqs: [
    { q: 'QR Code 會過期嗎？', a: '不會。本工具產生的是靜態 QR Code，內容直接編碼在圖中，永久有效。' },
    { q: '需要付費或註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG。' },
    { q: '我的資料會被上傳嗎？', a: '不會。所有產生過程都在你的瀏覽器內完成，不會送到任何伺服器。' },
  ],
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-7 text-center">
      <span class="chip bg-pop-mint reveal reveal-1">✨ 免費・無浮水印・不上傳</span>
      <h1 class="text-4xl md:text-5xl font-800 text-ink mt-4 reveal reveal-2">
        免費
        <span class="px-1 rounded" style="background:linear-gradient(transparent 58%, #FFD12E 58%)">QR Code</span>
        產生器
      </h1>
      <p class="text-muted font-600 mt-4 max-w-xl mx-auto reveal reveal-3">瀏覽器內即時生成、不上傳、可自訂顏色與 LOGO，免費下載 PNG / SVG。</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <div class="reveal reveal-4">
        <GeneratorTool default-type="url" />
      </div>
      <AdSlot slot-id="home-below-tool" />
      <h2 class="text-center font-display font-700 text-xl text-ink mt-6 mb-4">挑一種，馬上做 👇</h2>
      <nav class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RouterLink v-for="(t, i) in qrTypes" :key="t.type" :to="t.path"
          class="sticker p-4 block" :class="i % 2 ? 'rotate-1' : '-rotate-1'">
          <div class="text-3xl">{{ emoji[t.type] }}</div>
          <div class="font-display font-700 text-ink mt-1.5">{{ t.label }} QR</div>
          <div class="text-xs text-muted mt-1 font-600 leading-snug">{{ t.intro.slice(0, 20) }}…</div>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
