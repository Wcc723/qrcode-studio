<script setup lang="ts">
import GeneratorTool from '@/components/GeneratorTool.vue'
import ToolZone from '@/components/ToolZone.vue'
import AdSlot from '@/components/AdSlot.vue'
import { useSeoHead } from '@/composables/useSeoHead'
import { site } from '@/config/site'
import { qrTypes } from '@/config/qr-types'
import { guides } from '@/content/guides'

const base = import.meta.env.BASE_URL
const img = (name: string) => `${base}img/${name}`

// 橫幅的小標籤與三個打勾（2026-11 改版新加的字；隱私只在工具卡頂部說一次，這裡不提）
const hero = {
  pill: '名片、海報、店家桌卡上的 QR Code，在這裡做',
  trust: ['免費、不用註冊', '沒有浮水印，商用也可以', '靜態 QR Code，永久有效'],
}
/*
 * 首頁教學卡（2026-11 站長裁示：說明文章太長）：所有寬度只露前三篇，其他收進「展開其他幾篇教學」；
 * 收著的連結仍在預渲染的 HTML 裡。
 */
const GUIDES_SHOWN = 3
const guidesShown = guides.slice(0, GUIDES_SHOWN)
const guidesMore = guides.slice(GUIDES_SHOWN)

// 三步驟圖（說明文章第一個 h2 下面）
const steps = [
  { art: 'step-input-160.webp', title: '輸入內容', text: '貼上網址，或填好 WiFi、名片' },
  { art: 'step-style-160.webp', title: '自訂外觀', text: '換顏色、加 LOGO' },
  { art: 'step-download-160.webp', title: '按下下載', text: 'PNG、SVG 或 JPG' },
]

const faqs = [
  { q: 'QR Code 產生器要錢嗎？需要註冊嗎？', a: '完全免費、免註冊、無浮水印，可直接下載 PNG 與 SVG，商用與印刷皆可。' },
  { q: 'QR Code 會過期嗎？', a: '不會。本工具產生的是靜態 QR Code，內容直接存在圖裡，不經過任何網站轉址，永久有效、不會失效。' },
  { q: '我輸入的內容會被上傳嗎？', a: '你輸入的內容只在你的瀏覽器裡轉成 QR Code 圖片，不會上傳至雲端儲存空間。' },
  { q: '可以加入 LOGO 和自訂顏色嗎？', a: '可以。支援自訂方塊與背景顏色、漸層，以及上傳 LOGO；上傳 LOGO 時會自動調成最耐髒的等級（H），確保掃得出來。' },
  { q: '可以下載 SVG 向量檔印刷用嗎？', a: '可以。免費提供 SVG 向量檔，放多大都不會糊，適合名片、海報與大圖輸出。' },
]

useSeoHead({
  title: '免費 QR Code 產生器｜線上製作可加 LOGO、下載 SVG 向量檔',
  description: site.description, path: '/',
  appName: site.name,
})
</script>
<template>
  <div>
    <ToolZone lead="免費、無浮水印，可加 LOGO，下載 PNG 與 SVG 向量檔" :hero="hero">
      <template #title>免費 <span class="px-1 rounded" style="background:linear-gradient(transparent 58%, #FFD12E 58%)">QR Code</span> 產生器</template>
      <GeneratorTool default-type="url" />
    </ToolZone>
    <div class="max-w-screen-lg mx-auto px-4"><AdSlot slot-id="home-below-tool" /></div>

    <!-- 說明文章：紙白的文件樣式，跟上面的工具區分開。段落閱讀寬度 720px，卡片可以排到整個內容寬 -->
    <article class="max-w-screen-lg mx-auto px-4 mt-10 md:mt-12 text-[#3b3027] font-500 leading-[1.85] text-[17px]" data-test="doc">
      <p class="zone-label !text-muted !text-base !font-700"><span class="icon-badge-sm bg-pop-sun text-[#8a5a00]"><span class="i-lucide-book-open" aria-hidden="true" /></span>使用說明</p>
      <!--
        原本開頭有一句引言（線上免費製作 QR Code…永久有效不過期），跟下面兩段講同一批賣點，2026-11 站長裁示刪掉（規則見 docs/ui.md）；
        引言裡只有它有的「QRCode」寫法併進下面第一段。
      -->
      <div class="doc-h2 mt-4"><h2 class="text-2xl md:text-[28px] font-800 text-ink leading-snug">免費線上 QR Code 產生器，3 步驟製作完成</h2><img :src="img('deco-stand-240.webp')" alt="" width="240" height="235" loading="lazy" decoding="async"></div>
      <!-- 手機也排三欄小卡（2026-11 站長裁示：一張一行太長），插圖縮小 -->
      <ol class="list-none m-0 mt-5 mb-2 p-0 grid grid-cols-3 gap-2 sm:gap-3.5" data-test="home-steps">
        <li v-for="(s, i) in steps" :key="s.title" class="flex flex-col items-center text-center gap-1.5 sm:gap-2 px-1.5 pt-3 pb-3 sm:px-4 sm:pt-5 sm:pb-4.5 bg-white border border-line rounded-2xl">
          <span class="art-bubble w-13 h-13 sm:w-24 sm:h-24"><img :src="img(s.art)" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-11 h-11 sm:w-21 sm:h-21"></span>
          <span class="flex flex-col gap-0.5 leading-snug">
            <span class="text-base sm:text-lg font-800 text-ink whitespace-nowrap"><span class="text-link mr-1 sm:mr-3">{{ i + 1 }}</span>{{ s.title }}</span>
            <span class="text-sm sm:text-base font-500 text-muted">{{ s.text }}</span>
          </span>
        </li>
      </ol>
      <p class="doc-p mt-3">這是一款<strong>免費、不傳雲端、無浮水印</strong>的線上 QR Code（QRCode、行動條碼）產生器。輸入內容、自訂外觀、按下下載，整個過程都在你的瀏覽器內完成，你輸入的內容不會上傳至雲端儲存空間。支援<RouterLink to="/url/" class="text-link underline underline-offset-2 font-700">網址</RouterLink>、<RouterLink to="/wifi/" class="text-link underline underline-offset-2 font-700">WiFi</RouterLink>、<RouterLink to="/vcard/" class="text-link underline underline-offset-2 font-700">電子名片</RouterLink>、文字、Email、電話、簡訊等多種類型。</p>
      <p class="doc-p mt-3">可自訂方塊與背景顏色、漸層、加入品牌 LOGO，並免費下載高解析 PNG 或<RouterLink to="/guide/qr-code-svg/" class="text-link underline underline-offset-2 font-700">SVG 向量檔</RouterLink>（放多大都不會糊，印刷用）。產生的是<strong>靜態 QR Code</strong>（內容直接存在圖裡，不經過任何網站轉址），永久有效、不會過期，可放心印在名片、海報、產品包裝或店家招牌上。</p>
      <div class="flex gap-4 items-start max-w-[760px] mt-4">
        <span class="art-bubble w-13 h-13 md:w-16 md:h-16"><img :src="img('tool-scan-160.webp')" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-11 h-11 md:w-14 md:h-14"></span>
        <p class="pt-1">已經有一張 QR Code 的<strong>圖片或截圖</strong>，想知道裡面是什麼？用<RouterLink to="/scan/" class="text-link underline underline-offset-2 font-700">QR Code 掃描器</RouterLink>：拖放或貼上截圖就能在瀏覽器裡讀出內容，圖片不會上傳，結果也會先讓你確認再決定要不要開啟。</p>
      </div>
      <div class="flex gap-4 items-start max-w-[760px] mt-4">
        <span class="art-bubble w-13 h-13 md:w-16 md:h-16"><img :src="img('tool-barcode-160.webp')" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-11 h-11 md:w-14 md:h-14"></span>
        <p class="pt-1">要做的是商品包裝上那種直條條碼（<strong>一維條碼</strong>，例如 EAN-13、Code 128）嗎？請改用<RouterLink to="/barcode/" class="text-link underline underline-offset-2 font-700">條碼產生器</RouterLink>。兩者用途不同：QR Code 是二維條碼，可直接存網址與長文字；一維條碼主要對應商品編號，用於零售結帳與庫存管理。</p>
      </div>
      <div class="flex gap-4 items-start max-w-[760px] mt-4">
        <span class="art-bubble w-13 h-13 md:w-16 md:h-16"><img :src="img('tool-batch-160.webp')" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-11 h-11 md:w-14 md:h-14"></span>
        <p class="pt-1">要一次做幾十、幾百張，例如財產標籤、商品條碼或活動序號？用<RouterLink to="/batch/" class="text-link underline underline-offset-2 font-700">批次產生 QR Code 與條碼</RouterLink>：從 Excel 貼上清單或設定連號，一次下載整包 ZIP，清單一樣不會上傳。</p>
      </div>

      <!-- 7 種類型的專屬頁：說明區裡有插圖的連結卡片（文章裡的卡片是細框白卡，沒有工具卡的陰影） -->
      <div class="doc-h2 mt-12"><h2 class="text-2xl md:text-[28px] font-800 text-ink leading-snug">挑一種，馬上做</h2><img :src="img('deco-plant-240.webp')" alt="" width="240" height="313" loading="lazy" decoding="async"></div>
      <p class="doc-p mt-4">每一種類型都有自己的專屬頁，附上使用情境、步驟與常見問題：</p>
      <nav aria-label="QR Code 類型">
        <!-- 手機排兩欄（2026-11 站長裁示）：小插圖放標題左邊、說明句在下面整列，版面在 main.css 的 .type-card -->
        <ul class="list-none m-0 mt-4 p-0 grid grid-cols-2 gap-2 lg:grid-cols-3 sm:gap-3.5" data-test="type-links">
          <li v-for="t in qrTypes" :key="t.type">
            <RouterLink :to="`${t.path}/`" class="doc-card type-card h-full sm:min-h-20 md:min-h-24">
              <span class="art-bubble w-13 h-13 md:w-15 md:h-15"><img :src="img(`type-${t.type}-160.webp`)" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-11.5 h-11.5 md:w-13.5 md:h-13.5"></span>
              <span class="doc-card-title">{{ t.label }} <span class="whitespace-nowrap">QR Code</span></span>
              <span class="doc-card-sub">{{ t.lead }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="doc-h2 mt-12"><h2 class="text-2xl md:text-[28px] font-800 text-ink leading-snug">QR Code 教學</h2><img :src="img('deco-books-240.webp')" alt="" width="240" height="238" loading="lazy" decoding="async"></div>
      <p class="doc-p mt-4">不會用？這些文章帶你快速上手</p>
      <ul class="list-none m-0 mt-4 p-0 grid gap-2.5 md:grid-cols-2 md:gap-3.5" data-test="guide-links">
        <li v-for="g in guidesShown" :key="g.slug">
          <RouterLink :to="`/guide/${g.slug}/`" class="doc-card h-full !items-center !p-3">
            <span class="art-square w-12 h-12 md:w-21 md:h-21"><img :src="img(`guide-${g.slug}-160.webp`)" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-10 h-10 md:w-18 md:h-18"></span>
            <span class="min-w-0"><span class="doc-card-title">{{ g.title }}</span><span class="doc-card-sub mt-1">{{ g.description.slice(0, 40) }}…</span></span>
          </RouterLink>
        </li>
      </ul>
      <details v-if="guidesMore.length" class="more-fold" data-test="guide-more">
        <summary>展開其他 {{ guidesMore.length }} 篇教學<span class="i-lucide-chevron-down more-fold-chevron" aria-hidden="true" /></summary>
        <ul class="list-none m-0 mt-2.5 p-0 grid gap-2.5 md:grid-cols-2 md:gap-3.5">
          <li v-for="g in guidesMore" :key="g.slug">
            <RouterLink :to="`/guide/${g.slug}/`" class="doc-card h-full !items-center !p-3">
              <span class="art-square w-12 h-12 md:w-21 md:h-21"><img :src="img(`guide-${g.slug}-160.webp`)" alt="" width="160" height="160" loading="lazy" decoding="async" class="w-10 h-10 md:w-18 md:h-18"></span>
              <span class="min-w-0"><span class="doc-card-title">{{ g.title }}</span><span class="doc-card-sub mt-1">{{ g.description.slice(0, 40) }}…</span></span>
            </RouterLink>
          </li>
        </ul>
      </details>
      <p class="mt-4"><RouterLink to="/guide/" class="inline-flex items-center gap-1 min-h-11 text-link underline underline-offset-3 font-700">看全部 QR Code 教學<span class="i-lucide-arrow-right" aria-hidden="true" /></RouterLink></p>

      <div class="doc-h2 mt-10"><h2 class="text-2xl md:text-[28px] font-800 text-ink leading-snug">常見問題</h2><img :src="img('deco-bulb-240.webp')" alt="" width="240" height="252" loading="lazy" decoding="async"></div>
      <div class="doc-faq">
        <details v-for="(f, i) in faqs" :key="i">
          <summary>{{ f.q }}<span class="i-lucide-chevron-down faq-chevron text-muted" aria-hidden="true" /></summary>
          <p>{{ f.a }}</p>
        </details>
      </div>
      <p class="mt-4"><RouterLink to="/faq/" class="inline-flex items-center gap-1 min-h-11 text-link underline underline-offset-3 font-700">更多常見問題<span class="i-lucide-arrow-right" aria-hidden="true" /></RouterLink></p>
    </article>
  </div>
</template>
