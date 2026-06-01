<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
useSeoHead({ title: '隱私權政策｜不上傳你的資料', description: '本工具完全在瀏覽器內生成 QR Code，不會收集或上傳你輸入的任何內容。', path: '/privacy' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">隱私權政策</h1>
    <p class="text-muted mt-4 leading-7">你輸入的所有內容（網址、密碼、聯絡資訊等）都只在你的瀏覽器內處理並生成 QR Code，<strong>不會傳送到任何伺服器，我們也不會儲存</strong>。</p>
    <h2 class="text-lg font-700 text-ink mt-7">使用數據分析（Google Analytics）</h2>
    <p class="text-muted mt-3 leading-7">為了解網站使用情況並持續改善，本站使用 Google Analytics（GA4）收集匿名的使用統計，例如瀏覽的頁面、停留時間、裝置與瀏覽器類型、概略地區（依 IP 推估）等。這些資料透過 Cookie 蒐集，<strong>不包含你輸入到產生器中的任何內容</strong>，也無法用來辨識你的身分。相關資料由 Google 依其<a href="https://policies.google.com/privacy" target="_blank" rel="noopener" class="text-brand underline font-700">隱私權政策</a>處理；你可安裝 <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" class="text-brand underline font-700">Google Analytics 停用外掛</a>或於瀏覽器封鎖 Cookie 來拒絕追蹤。</p>
    <h2 class="text-lg font-700 text-ink mt-7">第三方廣告</h2>
    <p class="text-muted mt-3 leading-7">網站未來可能顯示第三方廣告（Google AdSense），其 Cookie 政策請參閱該服務說明。</p>
  </article>
</template>
