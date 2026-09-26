<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'

// 類型圖示的糖果色底，依序輪替
const badgeBg = ['bg-pop-sun', 'bg-pop-mint', 'bg-pop-sky', 'bg-pop-pink']

const faqs = [
  { q: 'QR Code 產生器要錢嗎？需要註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG，商用與印刷皆可。' },
  { q: 'QR Code 會過期嗎？', a: '不會。本工具產生的是靜態 QR Code，內容直接編碼在圖中，永久有效、不需聯網、不會失效。' },
  { q: '我輸入的內容會被上傳嗎？', a: '你輸入的內容只在你的瀏覽器內編碼成 QR Code 圖片，不會上傳至雲端儲存空間。' },
  { q: '可以加入 LOGO 和自訂顏色嗎？', a: '可以。支援自訂前景／背景顏色、漸層，以及上傳 LOGO；上傳 LOGO 時會自動提高容錯等級以確保可掃描。' },
  { q: '可以下載 SVG 向量檔印刷用嗎？', a: '可以。免費提供 SVG 向量檔，放大不失真，適合名片、海報與大圖輸出。' },
]

useSeoHead({
  title: '免費 QR Code 產生器｜可加 LOGO、下載 SVG，不傳雲端',
  description: site.description, path: '/',
  appName: site.name,
})
</script>
<template>
  <div>
    <ToolZone lead="免費、無浮水印，可加 LOGO，下載 PNG 與 SVG 向量檔">
      <template #title>免費 <span class="px-1 rounded" style="background:linear-gradient(transparent 58%, #FFD12E 58%)">QR Code</span> 產生器</template>
      <GeneratorTool default-type="url" />
    </ToolZone>
    <div class="max-w-screen-lg mx-auto px-4"><AdSlot slot-id="home-below-tool" /></div>

    <!-- 說明文章：文件樣式，跟上面的工具區分開 -->
    <article class="max-w-[720px] mx-auto px-4 mt-10 text-ink/85 font-600 leading-relaxed" data-test="doc">
      <p class="zone-label"><span class="icon-badge-sm bg-pop-sky"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
      <!-- 原本在標題下的整句說明，移到文章開頭，一個字都不刪 -->
      <p class="text-lg text-ink" data-test="doc-lead">線上免費製作 QR Code（QRCode）：瀏覽器內即時生成、不傳雲端，可自訂顏色與加入 LOGO，免費下載 PNG 與 SVG 向量檔，永久有效不過期。</p>

      <h2 class="text-2xl font-800 text-ink mt-8">免費線上 QR Code 產生器，3 步驟製作完成</h2>
      <p class="mt-3">這是一款<strong>免費、不傳雲端、無浮水印</strong>的線上 QR Code（行動條碼）產生器。輸入內容、自訂外觀、按下下載，整個過程都在你的瀏覽器內完成，你輸入的內容不會上傳至雲端儲存空間。支援<RouterLink to="/url/" class="text-link underline underline-offset-2 font-700">網址</RouterLink>、<RouterLink to="/wifi/" class="text-link underline underline-offset-2 font-700">WiFi</RouterLink>、<RouterLink to="/vcard/" class="text-link underline underline-offset-2 font-700">電子名片</RouterLink>、文字、Email、電話、簡訊等多種類型。</p>
      <p class="mt-3">可自訂前景與背景顏色、漸層、加入品牌 LOGO，並免費下載高解析 PNG 或<RouterLink to="/guide/qr-code-svg/" class="text-link underline underline-offset-2 font-700">SVG 向量檔</RouterLink>（印刷不失真）。產生的是<strong>靜態 QR Code</strong>，永久有效、不會過期，可放心印在名片、海報、產品包裝或店家招牌上。</p>
      <p class="mt-3">已經有一張 QR Code 的<strong>圖片或截圖</strong>，想知道裡面是什麼？用<RouterLink to="/scan/" class="text-link underline underline-offset-2 font-700">QR Code 掃描器</RouterLink>：拖放或貼上截圖就能在瀏覽器內解碼，圖片不會上傳，結果也會先讓你確認再決定要不要開啟。</p>
      <p class="mt-3">要做的是商品包裝上那種直條的<strong>一維條碼</strong>（EAN-13、Code 128）嗎？請改用<RouterLink to="/barcode/" class="text-link underline underline-offset-2 font-700">一維條碼產生器</RouterLink>。兩者用途不同：QR Code 是二維條碼，可直接存網址與長文字；一維條碼主要對應商品編號，用於零售結帳與庫存管理。</p>

      <!-- 7 種類型的專屬頁：原本是工具下方的大卡片，看起來像工具的一部分，改成說明區裡的連結列 -->
      <h2 class="text-2xl font-800 text-ink mt-10">挑一種，馬上做</h2>
      <p class="mt-3">每一種類型都有自己的專屬頁，附上使用情境、步驟與常見問題：</p>
      <nav aria-label="QR Code 類型">
        <ul class="doc-chips" data-test="type-links">
          <li v-for="(t, i) in qrTypes" :key="t.type">
            <span class="icon-badge-sm" :class="badgeBg[i % badgeBg.length]"><span :class="t.icon" aria-hidden="true" /></span>
            <RouterLink :to="`${t.path}/`">{{ t.label }} QR Code</RouterLink>
          </li>
        </ul>
      </nav>

      <h2 class="text-2xl font-800 text-ink mt-10">QR Code 教學</h2>
      <p class="mt-3">不會用？這些文章帶你快速上手</p>
      <ul class="doc-links">
        <li v-for="g in guides" :key="g.slug">
          <RouterLink :to="`/guide/${g.slug}/`">{{ g.title }}</RouterLink>
          <span class="block text-sm text-muted mt-0.5">{{ g.description.slice(0, 40) }}…</span>
        </li>
      </ul>
      <p class="mt-4"><RouterLink to="/guide/" class="text-link underline underline-offset-2 font-700">看全部 QR Code 教學<span class="i-lucide-arrow-right ml-0.5" aria-hidden="true" /></RouterLink></p>

      <h2 class="text-2xl font-800 text-ink mt-10">常見問題</h2>
      <div class="doc-faq">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron" aria-hidden="true" /></summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
      <p class="mt-4"><RouterLink to="/faq/" class="text-link underline underline-offset-2 font-700">更多常見問題<span class="i-lucide-arrow-right ml-0.5" aria-hidden="true" /></RouterLink></p>
    </article>
  </div>
</template>
