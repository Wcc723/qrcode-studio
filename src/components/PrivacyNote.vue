<script setup lang="ts">
/**
 * 工具卡頂部的隱私說明：畫面上只留一行，完整說明收在旁邊的「?」。
 * 以前同一句「不傳雲端」在標題貼紙、預覽框與頁尾各出現一次，現在工具裡只剩這一處（頁尾那行保留）。
 * 說明內容要跟隱私權政策一致：只描述程式真的做到的事。
 */
import HelpTip from './HelpTip.vue'

defineProps<{ mode: 'generate' | 'barcode' | 'scan' }>()
</script>

<template>
  <div data-test="privacy-note" class="text-sm font-700 text-ink">
    <HelpTip :name="mode === 'scan' ? '圖片不上傳' : '內容不上傳'">
      <template #head>
        <p class="inline-flex items-center gap-1.5">
          <span class="icon-badge-sm bg-pop-mint"><span class="i-lucide-lock" aria-hidden="true" /></span>
          {{ mode === 'scan' ? '在你的瀏覽器內解碼，圖片不上傳' : '只在你的瀏覽器產生，內容不上傳' }}
        </p>
      </template>
      <p v-if="mode === 'generate'">你輸入的網址、WiFi 密碼、聯絡資訊與 LOGO 圖片，都只在這個瀏覽器分頁裡編碼成圖片，不會上傳到任何伺服器，本站也不會保存。</p>
      <p v-else-if="mode === 'barcode'">你輸入的條碼內容只在這個瀏覽器分頁裡編碼成圖片，不會上傳到任何伺服器，本站也不會保存。</p>
      <p v-else>解碼用的是在你瀏覽器內執行的 WebAssembly 模組，圖片與解讀出來的內容都留在這個分頁的記憶體裡，不會上傳，也不會寫進 Cookie 或瀏覽器的儲存空間，關掉分頁就什麼都不剩。</p>
      <p>網站用 Google Analytics 與 Cloudflare Web Analytics 統計瀏覽量，統計資料不包含你輸入或丟進來的內容，詳見<RouterLink to="/privacy/">隱私權政策</RouterLink>。</p>
    </HelpTip>
  </div>
</template>
