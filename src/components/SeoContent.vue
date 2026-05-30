<script setup lang="ts">
import type { QrTypeMeta } from '@/config/qr-types'
defineProps<{ meta: QrTypeMeta }>()
</script>
<template>
  <article class="max-w-screen-lg mx-auto px-4 mt-12">
    <h2 class="text-2xl font-800 text-ink">關於{{ meta.label }} QR Code</h2>
    <p class="text-ink/80 font-600 mt-3 leading-relaxed">{{ meta.intro }}</p>

    <div v-if="meta.body" class="mt-5 text-ink/80 font-600 leading-relaxed [&_p]:my-3 [&_h3]:(text-lg font-700 text-ink mt-6 mb-2) [&_ul]:(list-disc pl-5 my-3 space-y-1) [&_strong]:text-ink [&_code]:(bg-pop-sun/30 px-1 rounded font-mono text-sm)" v-html="meta.body" />

    <h3 class="text-xl font-700 text-ink mt-8 flex items-center gap-2">🪄 使用步驟</h3>
    <ol class="list-none pl-0 mt-4 grid gap-3 sm:grid-cols-3">
      <li v-for="(s, i) in meta.steps" :key="i" class="card p-4 flex gap-3 items-start">
        <span class="shrink-0 w-7 h-7 rounded-full bg-pop-sun border-2 border-ink font-display font-700 flex items-center justify-center text-sm">{{ i + 1 }}</span>
        <span class="font-600 text-ink/85 leading-snug">{{ s }}</span>
      </li>
    </ol>

    <h3 class="text-xl font-700 text-ink mt-8 flex items-center gap-2">💬 常見問題</h3>
    <div class="mt-4 space-y-3">
      <details v-for="(f, i) in meta.faqs" :key="i" class="card p-4">
        <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
        <p class="text-ink/75 font-600 mt-2 leading-relaxed">{{ f.a }}</p>
      </details>
    </div>
  </article>
</template>
