<script setup lang="ts">
import { qrTypes } from '@/config/qr-types'
import { site } from '@/config/site'
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-line">
      <div class="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 font-700 text-ink">
          <span class="w-5 h-5 rounded-md bg-brand inline-block" />{{ site.name }}
        </RouterLink>
        <nav class="hidden md:flex gap-4 text-sm text-muted">
          <RouterLink v-for="t in qrTypes.slice(0, 4)" :key="t.type" :to="t.path" class="hover:text-brand">{{ t.label }}</RouterLink>
          <RouterLink to="/faq" class="hover:text-brand">FAQ</RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1"><slot /></main>
    <footer class="border-t border-line mt-12">
      <div class="max-w-screen-lg mx-auto px-4 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>© {{ site.name }} · 瀏覽器內生成，不上傳你的資料</span>
        <span class="flex gap-4">
          <RouterLink to="/about" class="hover:text-brand">關於</RouterLink>
          <RouterLink to="/privacy" class="hover:text-brand">隱私權</RouterLink>
          <RouterLink to="/faq" class="hover:text-brand">常見問題</RouterLink>
        </span>
      </div>
    </footer>
  </div>
</template>
