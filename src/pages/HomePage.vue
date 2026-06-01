<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'
import type { QrType } from '@/types'

const emoji: Record<QrType, string> = {
  url: '🔗', wifi: '📶', vcard: '👤', text: '📝', email: '✉️', phone: '📞', sms: '💬',
}

const faqs = [
  { q: 'QR Code 產生器要錢嗎？需要註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG，商用與印刷皆可。' },
  { q: 'QR Code 會過期嗎？', a: '不會。本工具產生的是靜態 QR Code，內容直接編碼在圖中，永久有效、不需聯網、不會失效。' },
  { q: '我輸入的內容會被上傳嗎？', a: '你輸入的內容只在你的瀏覽器內編碼成 QR Code 圖片，不會上傳至雲端儲存空間。' },
  { q: '可以加入 LOGO 和自訂顏色嗎？', a: '可以。支援自訂前景／背景顏色、漸層，以及上傳 LOGO；上傳 LOGO 時會自動提高容錯等級以確保可掃描。' },
  { q: '可以下載 SVG 向量檔印刷用嗎？', a: '可以。免費提供 SVG 向量檔，放大不失真，適合名片、海報與大圖輸出。' },
]

useSeoHead({
  title: '免費 QR Code 產生器｜線上製作、可加 LOGO、下載 PNG/SVG（不傳雲端）',
  description: site.description, path: '/',
})
</script>
<template>
  <div class="py-8">
    <header class="max-w-screen-lg mx-auto px-4 mb-7 text-center">
      <span class="chip bg-pop-mint reveal reveal-1">✨ 免費・無浮水印・不傳雲端</span>
      <h1 class="text-4xl md:text-5xl font-800 text-ink mt-4 reveal reveal-2">
        免費
        <span class="px-1 rounded" style="background:linear-gradient(transparent 58%, #FFD12E 58%)">QR Code</span>
        產生器
      </h1>
      <p class="text-muted font-600 mt-4 max-w-xl mx-auto reveal reveal-3">線上免費製作 QR Code（QRCode）：瀏覽器內即時生成、不傳雲端，可自訂顏色與加入 LOGO，免費下載 PNG 與 SVG 向量檔，永久有效不過期。</p>
    </header>
    <div class="max-w-screen-lg mx-auto px-4">
      <div class="reveal reveal-4">
        <GeneratorTool default-type="url" />
      </div>
      <AdSlot slot-id="home-below-tool" />
      <h2 class="text-center font-display font-700 text-xl text-ink mt-6 mb-4">挑一種，馬上做 👇</h2>
      <nav class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RouterLink v-for="(t, i) in qrTypes" :key="t.type" :to="`${t.path}/`"
          class="sticker p-4 block" :class="i % 2 ? 'rotate-1' : '-rotate-1'">
          <div class="text-3xl">{{ emoji[t.type] }}</div>
          <div class="font-display font-700 text-ink mt-1.5">{{ t.label }} QR Code</div>
          <div class="text-xs text-muted mt-1 font-600 leading-snug">{{ t.intro.slice(0, 20) }}…</div>
        </RouterLink>
      </nav>

      <!-- SEO 內文區 -->
      <section class="mt-12 max-w-3xl mx-auto text-ink/80 font-600 leading-relaxed">
        <h2 class="text-2xl font-800 text-ink">免費線上 QR Code 產生器，3 步驟製作完成</h2>
        <p class="mt-3">這是一款<strong>免費、不傳雲端、無浮水印</strong>的線上 QR Code（行動條碼）產生器。輸入內容、自訂外觀、按下下載，整個過程都在你的瀏覽器內完成，你輸入的內容不會上傳至雲端儲存空間。支援<a href="/url/" class="text-brand underline font-700">網址</a>、<a href="/wifi/" class="text-brand underline font-700">WiFi</a>、<a href="/vcard/" class="text-brand underline font-700">電子名片</a>、文字、Email、電話、簡訊等多種類型。</p>
        <p class="mt-3">可自訂前景與背景顏色、漸層、加入品牌 LOGO，並免費下載高解析 PNG 或<a href="/guide/qr-code-svg/" class="text-brand underline font-700">SVG 向量檔</a>（印刷不失真）。產生的是<strong>靜態 QR Code</strong>，永久有效、不會過期，可放心印在名片、海報、產品包裝或店家招牌上。</p>
      </section>

      <!-- 教學文章 -->
      <section class="mt-12">
        <h2 class="text-center font-display font-800 text-2xl text-ink mb-1">📚 QR Code 教學</h2>
        <p class="text-center text-muted font-600 mb-5">不會用？這些文章帶你快速上手</p>
        <div class="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <RouterLink v-for="g in guides" :key="g.slug" :to="`/guide/${g.slug}/`" class="sticker p-4 block">
            <div class="font-display font-700 text-ink">{{ g.title }}</div>
            <div class="text-xs text-muted mt-1.5 font-600 leading-snug">{{ g.description.slice(0, 40) }}…</div>
          </RouterLink>
        </div>
      </section>

      <!-- 常見問題 -->
      <section class="mt-12 max-w-3xl mx-auto">
        <h2 class="text-center font-display font-800 text-2xl text-ink mb-5">💬 常見問題</h2>
        <div class="space-y-3">
          <details v-for="(f, i) in faqs" :key="i" class="card p-4">
            <summary class="font-display font-700 text-ink cursor-pointer select-none">{{ f.q }}</summary>
            <p class="text-ink/75 font-600 mt-2 leading-relaxed">{{ f.a }}</p>
          </details>
        </div>
      </section>
    </div>
  </div>
</template>
