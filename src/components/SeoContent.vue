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
const base = import.meta.env.BASE_URL
const img = (name: string) => `${base}img/${name}`
/** 三個使用步驟依序配三張步驟插圖（每個類型都是三步：輸入、自訂外觀、下載） */
const stepArt = ['step-input-160.webp', 'step-style-160.webp', 'step-download-160.webp']
</script>
<template>
  <!-- 說明文章：紙白的文件樣式。段落閱讀寬度 720px，卡片可以排到整個內容寬（2026-11 改版） -->
  <article class="max-w-screen-lg mx-auto px-4 mt-10 md:mt-12 text-[#3b3027] font-500 leading-[1.85] text-[17px]" data-test="doc">
    <p class="zone-label !text-muted !text-base !font-700"><span class="icon-badge-sm bg-pop-sun text-[#8a5a00]"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
    <!-- 原本在標題下的整句說明（也是 meta description），移到文章開頭，一個字都不刪 -->
    <p class="doc-p text-lg md:text-[19px] font-600 text-ink" data-test="doc-lead">{{ meta.description }}</p>

    <div class="doc-h2 mt-8"><h2 class="text-2xl md:text-[28px] font-800 text-ink leading-snug">關於{{ meta.label }} QR Code</h2><img :src="img('deco-plant-240.webp')" alt="" width="240" height="313" loading="lazy" decoding="async"></div>
    <p class="doc-p mt-4">{{ meta.intro }}</p>

    <div v-if="meta.body" class="doc-p mt-5 [&_p]:my-3 [&_h3]:(text-[21px] font-800 text-ink mt-8 mb-2) [&_ul]:(list-disc pl-5.5 my-3 space-y-1) [&_strong]:text-ink [&_code]:(bg-pop-sun px-1 rounded font-mono text-sm)" v-html="bodyHtml" />

    <h3 class="text-[21px] font-800 text-ink mt-9">使用步驟</h3>
    <ol class="doc-steps doc-steps-art max-w-[720px]">
      <li v-for="(s, i) in meta.steps" :key="i">
        <span class="art-bubble w-14 h-14"><img :src="img(stepArt[i] ?? stepArt[0])" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-12 h-12"></span>
        <span class="leading-relaxed"><strong class="text-link text-lg">{{ i + 1 }}</strong>　{{ s }}</span>
      </li>
    </ol>

    <h3 class="text-[21px] font-800 text-ink mt-9">常見問題</h3>
    <div class="doc-faq">
      <details v-for="(f, i) in meta.faqs" :key="i">
        <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron text-muted" aria-hidden="true" /></summary>
        <p>{{ f.a }}</p>
      </details>
    </div>
    <p class="mt-4 text-base text-muted">費用、隱私、下載格式等通用問題，整理在<RouterLink to="/faq/" class="text-link underline underline-offset-2 font-700">常見問題</RouterLink>。</p>

    <h3 class="text-[21px] font-800 text-ink mt-10">延伸閱讀</h3>
    <ul class="list-none m-0 mt-3 p-0 grid gap-2.5 max-w-[760px]" data-test="read-more">
      <li v-for="g in readMore" :key="g.slug">
        <RouterLink :to="`/guide/${g.slug}/`" class="doc-card !py-2.5 !px-3">
          <span class="art-square w-15 h-15"><img :src="img(`guide-${g.slug}-160.webp`)" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-12.5 h-12.5"></span>
          <span class="min-w-0"><span class="doc-card-title">{{ g.shortTitle }}</span><span class="doc-card-sub">{{ g.title }}</span></span>
        </RouterLink>
      </li>
    </ul>

    <h3 class="text-[21px] font-800 text-ink mt-10">其他類型與工具</h3>
    <nav aria-label="其他 QR Code 類型">
      <ul class="doc-chips" data-test="other-types">
        <li v-for="t in otherTypes" :key="t.type"><RouterLink :to="`${t.path}/`"><img :src="img(`type-${t.type}-160.webp`)" alt="" width="160" height="160" loading="lazy" decoding="async">{{ t.label }} QR Code</RouterLink></li>
        <li><RouterLink to="/scan/"><img :src="img('tool-scan-160.webp')" alt="" width="160" height="160" loading="lazy" decoding="async">QR Code 掃描器</RouterLink></li>
        <li><RouterLink to="/barcode/"><img :src="img('tool-barcode-160.webp')" alt="" width="160" height="160" loading="lazy" decoding="async">條碼產生器</RouterLink></li>
      </ul>
    </nav>
  </article>
</template>
