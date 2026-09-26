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
  <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
    <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
    <!-- 原本在標題下的整句說明（也是 meta description），移到文章開頭，一個字都不刪 -->
    <p class="text-lg text-ink" data-test="doc-lead">{{ meta.description }}</p>

    <h2 class="text-2xl font-800 text-ink mt-8">關於{{ meta.label }} QR Code</h2>
    <p class="mt-3">{{ meta.intro }}</p>

    <div v-if="meta.body" class="mt-5 [&_p]:my-3 [&_h3]:(text-lg font-700 text-ink mt-6 mb-2) [&_ul]:(list-disc pl-5 my-3 space-y-1) [&_strong]:text-ink [&_code]:(bg-pop-sun/30 px-1 rounded font-mono text-sm)" v-html="bodyHtml" />

    <h3 class="text-xl font-700 text-ink mt-8">使用步驟</h3>
    <ol class="doc-steps">
      <li v-for="(s, i) in meta.steps" :key="i">
        <span class="step-no">{{ i + 1 }}</span>
        <span>{{ s }}</span>
      </li>
    </ol>

    <h3 class="text-xl font-700 text-ink mt-8">常見問題</h3>
    <div class="doc-faq">
      <details v-for="(f, i) in meta.faqs" :key="i">
        <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
        <p>{{ f.a }}</p>
      </details>
    </div>
    <p class="mt-4 text-sm text-muted">費用、隱私、下載格式等通用問題，整理在<RouterLink to="/faq/" class="text-link underline underline-offset-2 font-700">常見問題</RouterLink>。</p>

    <h3 class="text-xl font-700 text-ink mt-10">延伸閱讀</h3>
    <ul class="doc-links" data-test="read-more">
      <li v-for="g in readMore" :key="g.slug">
        <RouterLink :to="`/guide/${g.slug}/`">{{ g.shortTitle }}</RouterLink><span class="text-muted">：{{ g.title }}</span>
      </li>
    </ul>

    <h3 class="text-xl font-700 text-ink mt-10">其他類型與工具</h3>
    <nav aria-label="其他 QR Code 類型">
      <ul class="doc-chips" data-test="other-types">
        <li v-for="t in otherTypes" :key="t.type"><span :class="t.icon" class="text-muted" aria-hidden="true" /><RouterLink :to="`${t.path}/`">{{ t.label }} QR Code</RouterLink></li>
        <li><span class="i-lucide-scan-line text-muted" aria-hidden="true" /><RouterLink to="/scan/">QR Code 掃描器</RouterLink></li>
        <li><span class="i-lucide-barcode text-muted" aria-hidden="true" /><RouterLink to="/barcode/">一維條碼產生器</RouterLink></li>
      </ul>
    </nav>
  </article>
</template>
