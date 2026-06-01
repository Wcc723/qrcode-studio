<script setup lang="ts">
import { useHead } from '@unhead/vue'
useHead({
  title: '找不到頁面 404｜QR Code 產生器',
  meta: [{ name: 'robots', content: 'noindex, follow' }],
})
</script>
<template>
  <section class="max-w-screen-lg mx-auto px-4 py-20 text-center">
    <div class="text-6xl mb-4">🙈</div>
    <h1 class="text-5xl font-800 text-ink">404</h1>
    <p class="text-muted font-600 mt-3">這個頁面不見了，但 QR Code 還在等你做！</p>
    <RouterLink to="/" class="btn-primary mt-7 inline-flex">⬅ 回首頁做 QR Code</RouterLink>
  </section>
</template>
