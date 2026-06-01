<script setup lang="ts">
import { qrTypes } from '@/config/qr-types'
import { site } from '@/config/site'
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b-3 border-ink bg-pop-sun/90">
      <div class="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2.5 font-display font-700 text-xl text-ink">
          <span class="w-8 h-8 rounded-lg bg-brand border-2 border-ink shadow-[2px_2px_0_#16130f] inline-flex items-center justify-center text-white text-sm">▦</span>
          {{ site.name }}
        </RouterLink>
        <nav class="hidden md:flex items-center gap-1.5 text-sm font-700">
          <RouterLink v-for="t in qrTypes.slice(0, 4)" :key="t.type" :to="`${t.path}/`"
            class="px-3 py-1 rounded-full border-2 border-transparent hover:border-ink hover:bg-white transition">{{ t.label }}</RouterLink>
          <RouterLink to="/faq/" class="px-3 py-1 rounded-full border-2 border-transparent hover:border-ink hover:bg-white transition">FAQ</RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1"><slot /></main>
    <footer class="border-t-3 border-ink mt-16 bg-white">
      <div class="max-w-screen-lg mx-auto px-4 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between items-center">
        <span class="font-600">© {{ site.name }} · 🔒 瀏覽器內生成，內容不傳雲端</span>
        <span class="flex flex-wrap gap-x-4 gap-y-1 font-700">
          <RouterLink to="/guide/scan-qr-code/" class="hover:text-brand transition">如何掃描 QR Code</RouterLink>
          <RouterLink to="/guide/line-qr-code/" class="hover:text-brand transition">LINE QR Code</RouterLink>
          <RouterLink to="/about/" class="hover:text-brand transition">關於</RouterLink>
          <RouterLink to="/privacy/" class="hover:text-brand transition">隱私權</RouterLink>
          <RouterLink to="/faq/" class="hover:text-brand transition">常見問題</RouterLink>
        </span>
      </div>
    </footer>
  </div>
</template>
