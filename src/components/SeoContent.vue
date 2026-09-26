<script setup lang="ts">
import { computed } from 'vue'
import { qrTypes, type QrTypeMeta } from '@/config/qr-types'
import { findGuide } from '@/content/guides'
import { withBase } from '@/utils/with-base'
const props = defineProps<{ meta: QrTypeMeta }>()
const readMore = computed(() => props.meta.guides.map(slug => findGuide(slug)!))
const otherTypes = computed(() => qrTypes.filter(t => t.type !== props.meta.type))
// 與 GuidePage 同型的 v-html sink：目前 body 內沒有連結，但日後補內鏈時
// 若少了這層前綴會靜默指到 hub 的 404（build 不報錯、測試也抓不到）。
const bodyHtml = computed(() => withBase(props.meta.body ?? ''))
</script>
<template>
  <article class="max-w-screen-lg mx-auto px-4 mt-12">
    <h2 class="text-2xl font-800 text-ink">關於{{ meta.label }} QR Code</h2>
    <p class="text-ink/80 font-600 mt-3 leading-relaxed">{{ meta.intro }}</p>

    <div v-if="meta.body" class="mt-5 text-ink/80 font-600 leading-relaxed [&_p]:my-3 [&_h3]:(text-lg font-700 text-ink mt-6 mb-2) [&_ul]:(list-disc pl-5 my-3 space-y-1) [&_strong]:text-ink [&_code]:(bg-pop-sun/30 px-1 rounded font-mono text-sm)" v-html="bodyHtml" />

    <h3 class="text-xl font-700 text-ink mt-8 flex items-center gap-2">使用步驟</h3>
    <ol class="list-none pl-0 mt-4 grid gap-3 sm:grid-cols-3">
      <li v-for="(s, i) in meta.steps" :key="i" class="card p-4 flex gap-3 items-start">
        <span class="shrink-0 w-7 h-7 rounded-full bg-pop-sun border-2 border-ink font-display font-700 flex items-center justify-center text-sm">{{ i + 1 }}</span>
        <span class="font-600 text-ink/85 leading-snug">{{ s }}</span>
      </li>
    </ol>

    <h3 class="text-xl font-700 text-ink mt-8 flex items-center gap-2">常見問題</h3>
    <div class="mt-4 space-y-3">
      <details v-for="(f, i) in meta.faqs" :key="i" class="card p-4">
        <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
        <p class="text-ink/75 font-600 mt-2 leading-relaxed">{{ f.a }}</p>
      </details>
    </div>
    <p class="mt-4 text-sm font-600 text-muted">費用、隱私、下載格式等通用問題，整理在<RouterLink to="/faq/" class="text-brand underline underline-offset-2 font-700">常見問題</RouterLink>。</p>

    <h3 class="text-xl font-700 text-ink mt-10 flex items-center gap-2">延伸閱讀</h3>
    <ul class="mt-4 grid gap-3 sm:grid-cols-3 list-none p-0" data-test="read-more">
      <li v-for="g in readMore" :key="g.slug">
        <RouterLink :to="`/guide/${g.slug}/`" class="sticker p-4 block h-full">
          <div class="font-display font-700 text-ink">{{ g.shortTitle }}</div>
          <div class="text-xs text-muted font-600 mt-1.5 leading-snug">{{ g.title }}</div>
        </RouterLink>
      </li>
    </ul>

    <h3 class="text-xl font-700 text-ink mt-10 flex items-center gap-2">其他類型與工具</h3>
    <nav aria-label="其他 QR Code 類型" class="mt-4 flex flex-wrap gap-2" data-test="other-types">
      <RouterLink v-for="t in otherTypes" :key="t.type" :to="`${t.path}/`" class="chip !text-sm !px-3 !py-1 bg-white hover:bg-pop-sun transition">{{ t.label }} QR Code</RouterLink>
      <RouterLink to="/scan/" class="chip !text-sm !px-3 !py-1 bg-pop-mint/40 hover:bg-pop-mint transition">QR Code 掃描器</RouterLink>
      <RouterLink to="/barcode/" class="chip !text-sm !px-3 !py-1 bg-pop-sky/30 hover:bg-pop-sky transition">一維條碼產生器</RouterLink>
    </nav>
  </article>
</template>
