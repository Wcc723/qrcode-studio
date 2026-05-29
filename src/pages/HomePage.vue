<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'

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
    <header class="max-w-screen-lg mx-auto px-4 mb-5 text-center">
      <h1 class="text-3xl md:text-4xl font-800 text-ink">免費 QR Code 產生器</h1>
      <p class="text-muted mt-3">瀏覽器內即時生成、不上傳、可自訂顏色與 LOGO，免費下載 PNG / SVG。</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <GeneratorTool default-type="url" />
      <AdSlot slot-id="home-below-tool" />
      <nav class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <RouterLink v-for="t in qrTypes" :key="t.type" :to="t.path" class="card p-4 hover:border-brand transition">
          <div class="font-600 text-ink">{{ t.label }} QR Code</div>
          <div class="text-xs text-muted mt-1">{{ t.intro.slice(0, 24) }}…</div>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
