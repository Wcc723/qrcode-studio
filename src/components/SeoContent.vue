<script setup lang="ts">
import type { QrTypeMeta } from '@/config/qr-types'
defineProps<{ meta: QrTypeMeta }>()
</script>
<template>
  <article class="max-w-screen-lg mx-auto px-4 mt-10 prose-sm">
    <h2 class="text-xl font-700 text-ink">關於{{ meta.label }} QR Code</h2>
    <p class="text-muted mt-2">{{ meta.intro }}</p>
    <h3 class="text-lg font-600 text-ink mt-6">使用步驟</h3>
    <ol class="list-decimal pl-5 text-muted mt-2 space-y-1">
      <li v-for="(s, i) in meta.steps" :key="i">{{ s }}</li>
    </ol>
    <h3 class="text-lg font-600 text-ink mt-6">常見問題</h3>
    <div class="mt-2 space-y-3">
      <details v-for="(f, i) in meta.faqs" :key="i" class="card p-4">
        <summary class="font-600 cursor-pointer">{{ f.q }}</summary>
        <p class="text-muted mt-2">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
