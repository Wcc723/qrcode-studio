<script setup lang="ts">
import { useSeoHead } from '@/composables/useSeoHead'
useSeoHead({ title: '隱私權政策｜不上傳你的資料', description: '本工具完全在瀏覽器內生成 QR Code，不會收集或上傳你輸入的任何內容。', path: '/privacy' })
</script>
<template>
  <article class="max-w-screen-md mx-auto px-4 py-10">
    <h1 class="text-2xl font-700 text-ink">隱私權政策</h1>
    <p class="text-muted mt-4 leading-7">你輸入的所有內容（網址、密碼、聯絡資訊等）都只在你的瀏覽器內處理並生成 QR Code，不會傳送到任何伺服器，我們也不會儲存。網站未來可能顯示第三方廣告（Google AdSense），其 Cookie 政策請參閱該服務說明。</p>
  </article>
</template>
