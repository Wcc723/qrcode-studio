<script setup lang="ts">
// 廣告版位。未啟用時什麼都不渲染：畫面上不能出現「廣告版位（待審核）」這類佔位框，
// 那會讓整頁看起來像還沒做完的網站，AdSense 審核也會把它當成空白內容。
//
// 日後要啟用時：
// - client id 從 import.meta.env.VITE_ADSENSE_CLIENT 讀（Workers Builds 的建置變數），
//   不要把任何帳號 id 寫進這個公開 repo。
// - 預留 min-height，避免廣告載入時版面跳動。
// - 不要加「廣告版位」之類的標籤文字。
defineProps<{ slotId: string }>()
const enabled = false
</script>
<template>
  <div v-if="enabled" class="my-6" data-test="ad-slot">
    <!-- 啟用時在此插入 <ins class="adsbygoogle" ...> 與初始化腳本 -->
  </div>
</template>
